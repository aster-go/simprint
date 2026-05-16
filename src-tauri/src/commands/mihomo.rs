use crate::{
    app::context::AppContext,
    infrastructure::mihomo::{
        MihomoConnectionConfig, MihomoConnectionInfo, MihomoOverview, MihomoProxyDelayResult,
        MihomoStatus,
    },
};

#[tauri::command]
pub async fn test_and_attach_mihomo(
    config: MihomoConnectionConfig,
) -> Result<MihomoStatus, String> {
    AppContext::get().mihomo_manager.attach(config).await
}

#[tauri::command]
pub async fn get_mihomo_status() -> Result<MihomoStatus, String> {
    Ok(AppContext::get().mihomo_manager.status().await)
}

#[tauri::command]
pub async fn get_mihomo_connection_info() -> Result<MihomoConnectionInfo, String> {
    Ok(AppContext::get().mihomo_manager.connection_info().await)
}

#[tauri::command]
pub async fn get_mihomo_overview() -> Result<MihomoOverview, String> {
    AppContext::get().mihomo_manager.overview().await
}

#[tauri::command]
pub async fn test_mihomo_proxy_delay(proxy_name: String) -> Result<MihomoProxyDelayResult, String> {
    AppContext::get().mihomo_manager.test_proxy_delay(proxy_name).await
}

#[tauri::command]
pub async fn test_mihomo_group_delays(
    group_name: String,
) -> Result<Vec<MihomoProxyDelayResult>, String> {
    AppContext::get().mihomo_manager.test_group_delays(group_name).await
}
