use std::collections::{HashMap, HashSet};

use futures::{StreamExt, stream};
use tokio::sync::Mutex;

use crate::infrastructure::mihomo::{
    MihomoClient, MihomoConnectionConfig, MihomoConnectionInfo, MihomoGroupOverview,
    MihomoNodeOverview, MihomoOverview, MihomoProviderOverview, MihomoProxyDelayResult,
    MihomoStatus, RawProxiesResponse, RawProxy,
};

const DEFAULT_DELAY_TEST_URL: &str = "https://www.apple.com/library/test/success.html";
const DEFAULT_DELAY_TIMEOUT_MS: u64 = 5000;

struct MihomoSession {
    config: MihomoConnectionConfig,
}

pub struct MihomoManager {
    session: Mutex<Option<MihomoSession>>,
}

impl MihomoManager {
    pub fn new() -> Self {
        Self {
            session: Mutex::new(None),
        }
    }

    pub async fn attach(&self, config: MihomoConnectionConfig) -> Result<MihomoStatus, String> {
        let client = MihomoClient::new(&config).map_err(|error| error.to_string())?;
        let _ = build_overview(&config, &client).await.map_err(|error| error.to_string())?;

        let controller = config.controller.trim().to_string();
        let mut guard = self.session.lock().await;
        *guard = Some(MihomoSession { config });

        Ok(MihomoStatus {
            attached: true,
            controller: Some(controller),
        })
    }

    pub async fn status(&self) -> MihomoStatus {
        let guard = self.session.lock().await;
        MihomoStatus {
            attached: guard.is_some(),
            controller: guard.as_ref().map(|session| session.config.controller.clone()),
        }
    }

    pub async fn connection_info(&self) -> MihomoConnectionInfo {
        let guard = self.session.lock().await;
        MihomoConnectionInfo {
            attached: guard.is_some(),
            controller: guard.as_ref().map(|session| session.config.controller.clone()),
            secret: guard.as_ref().map(|session| session.config.secret.clone()),
        }
    }

    pub async fn overview(&self) -> Result<MihomoOverview, String> {
        let config = self.session_config().await?;

        let client = MihomoClient::new(&config).map_err(|error| error.to_string())?;
        build_overview(&config, &client).await.map_err(|error| error.to_string())
    }

    pub async fn test_proxy_delay(
        &self,
        proxy_name: String,
    ) -> Result<MihomoProxyDelayResult, String> {
        let config = self.session_config().await?;
        let client = MihomoClient::new(&config).map_err(|error| error.to_string())?;

        let delay_ms = client
            .test_proxy_delay(
                &proxy_name,
                DEFAULT_DELAY_TEST_URL,
                DEFAULT_DELAY_TIMEOUT_MS,
            )
            .await
            .ok()
            .flatten();

        Ok(MihomoProxyDelayResult {
            name: proxy_name,
            available: delay_ms.is_some(),
            delay_ms,
        })
    }

    pub async fn test_group_delays(
        &self,
        group_name: String,
    ) -> Result<Vec<MihomoProxyDelayResult>, String> {
        let config = self.session_config().await?;
        let client = MihomoClient::new(&config).map_err(|error| error.to_string())?;
        let proxies = client.fetch_proxies().await.map_err(|error| error.to_string())?;

        let group = proxies
            .proxies
            .get(&group_name)
            .ok_or_else(|| format!("未找到策略组: {group_name}"))?;

        let leaf_nodes = group
            .all
            .iter()
            .filter(|candidate| {
                proxies
                    .proxies
                    .get(*candidate)
                    .is_some_and(|proxy| proxy.all.is_empty() && proxy.now.is_none())
            })
            .cloned()
            .collect::<Vec<_>>();

        let results = stream::iter(leaf_nodes.into_iter().map(|node_name| {
            let client = client.clone();
            async move {
                let delay_ms = client
                    .test_proxy_delay(&node_name, DEFAULT_DELAY_TEST_URL, DEFAULT_DELAY_TIMEOUT_MS)
                    .await
                    .ok()
                    .flatten();

                MihomoProxyDelayResult {
                    name: node_name,
                    available: delay_ms.is_some(),
                    delay_ms,
                }
            }
        }))
        .buffered(6)
        .collect::<Vec<_>>()
        .await;

        Ok(results)
    }

    async fn session_config(&self) -> Result<MihomoConnectionConfig, String> {
        let guard = self.session.lock().await;
        guard
            .as_ref()
            .map(|session| session.config.clone())
            .ok_or_else(|| "当前未连接 Mihomo，请先完成连接配置".to_string())
    }
}

async fn build_overview(
    config: &MihomoConnectionConfig,
    client: &MihomoClient,
) -> anyhow::Result<MihomoOverview> {
    let version = client.fetch_version().await?;
    let providers = client.fetch_providers().await?;
    let proxies = client.fetch_proxies().await?;

    let mut provider_nodes = HashMap::new();
    let mut provider_items = Vec::new();
    for (provider_key, provider) in providers.providers {
        let name = provider.name.unwrap_or_else(|| provider_key.clone());
        provider_items.push(MihomoProviderOverview {
            name: name.clone(),
            provider_type: provider.r#type,
            vehicle_type: provider.vehicle_type,
            updated_at: provider.updated_at,
            node_count: provider.proxies.len(),
        });

        for proxy in provider.proxies {
            provider_nodes.insert(proxy.name, name.clone());
        }
    }
    let groups = normalize_groups(&proxies);
    let mut nodes = Vec::new();
    for (name, proxy) in proxies.proxies {
        nodes.push(MihomoNodeOverview {
            source_provider: provider_nodes.get(&name).cloned(),
            name,
            node_type: proxy.r#type,
            alive: proxy.alive,
            udp: proxy.udp,
        });
    }

    Ok(MihomoOverview {
        controller: config.controller.clone(),
        version: version.version,
        providers: provider_items,
        groups,
        nodes,
    })
}

fn normalize_groups(proxies: &RawProxiesResponse) -> Vec<MihomoGroupOverview> {
    let mut groups: Vec<MihomoGroupOverview> = Vec::new();
    let mut group_names: HashSet<String> = HashSet::new();

    for (name, proxy) in &proxies.proxies {
        if !is_group_proxy(proxy) || name == "GLOBAL" {
            continue;
        }

        group_names.insert(name.clone());
        groups.push(MihomoGroupOverview {
            name: name.clone(),
            group_type: proxy.r#type.clone(),
            selected: proxy.now.clone(),
            candidates: proxy.all.clone(),
        });
    }

    let mut ordered_groups = Vec::with_capacity(groups.len());
    let mut inserted: HashSet<String> = HashSet::new();

    if let Some(global) = proxies.proxies.get("GLOBAL") {
        for candidate in &global.all {
            if !group_names.contains(candidate.as_str()) || !inserted.insert(candidate.clone()) {
                continue;
            }

            if let Some(group) = groups.iter().find(|group| group.name == *candidate) {
                ordered_groups.push(group.clone());
            }
        }
    }

    for group in groups {
        if inserted.insert(group.name.clone()) {
            ordered_groups.push(group);
        }
    }

    ordered_groups
}

fn is_group_proxy(proxy: &RawProxy) -> bool {
    !proxy.all.is_empty() || proxy.now.is_some()
}

impl Default for MihomoManager {
    fn default() -> Self {
        Self::new()
    }
}
