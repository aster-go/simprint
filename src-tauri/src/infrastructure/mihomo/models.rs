use indexmap::IndexMap;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MihomoConnectionConfig {
    pub controller: String,
    #[serde(default)]
    pub secret: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct MihomoConnectionInfo {
    pub attached: bool,
    pub controller: Option<String>,
    pub secret: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MihomoStatus {
    pub attached: bool,
    pub controller: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MihomoProxyDelayResult {
    pub name: String,
    pub delay_ms: Option<u64>,
    pub available: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct MihomoOverview {
    pub controller: String,
    pub version: Option<String>,
    pub providers: Vec<MihomoProviderOverview>,
    pub groups: Vec<MihomoGroupOverview>,
    pub nodes: Vec<MihomoNodeOverview>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MihomoProviderOverview {
    pub name: String,
    pub provider_type: Option<String>,
    pub vehicle_type: Option<String>,
    pub updated_at: Option<String>,
    pub node_count: usize,
}

#[derive(Debug, Clone, Serialize)]
pub struct MihomoGroupOverview {
    pub name: String,
    pub group_type: String,
    pub selected: Option<String>,
    pub candidates: Vec<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct MihomoNodeOverview {
    pub name: String,
    pub node_type: String,
    pub alive: Option<bool>,
    pub udp: Option<bool>,
    pub source_provider: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RawVersionResponse {
    #[serde(default)]
    pub version: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RawProvidersResponse {
    #[serde(default)]
    pub providers: IndexMap<String, RawProvider>,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum RawGroupsResponse {
    GroupsArray(Vec<RawGroup>),
    GroupsMap(IndexMap<String, Value>),
    WrappedGroupsArray { groups: Vec<RawGroup> },
    WrappedGroupsMap { groups: IndexMap<String, Value> },
    WrappedProxiesArray { proxies: Vec<RawGroup> },
    WrappedProxiesMap { proxies: IndexMap<String, Value> },
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RawGroup {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub r#type: String,
    #[serde(default)]
    pub now: Option<String>,
    #[serde(default)]
    pub all: Vec<String>,
    #[serde(default)]
    pub hidden: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct RawProvider {
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub proxies: Vec<RawProviderProxy>,
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default, rename = "vehicleType")]
    pub vehicle_type: Option<String>,
    #[serde(default, rename = "updatedAt")]
    pub updated_at: Option<String>,
}

#[derive(Debug, Deserialize)]
pub struct RawProviderProxy {
    pub name: String,
    #[serde(default)]
    pub r#type: Option<String>,
    #[serde(default)]
    pub alive: Option<bool>,
    #[serde(default)]
    pub udp: Option<bool>,
}

#[derive(Debug, Deserialize)]
pub struct RawProxiesResponse {
    #[serde(default)]
    pub proxies: IndexMap<String, RawProxy>,
}

#[derive(Debug, Deserialize)]
pub struct RawProxy {
    #[serde(default)]
    pub r#type: String,
    #[serde(default)]
    pub now: Option<String>,
    #[serde(default)]
    pub all: Vec<String>,
    #[serde(default)]
    pub alive: Option<bool>,
    #[serde(default)]
    pub udp: Option<bool>,
}
