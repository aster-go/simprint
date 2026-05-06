//! 配置管理模块
//!
//! 提供配置的加载、验证和全局访问

mod encryption;
mod loader;
mod types;
mod validator;

pub use types::{AppConfig, ServerConfig, UpdaterConfig};

use crate::core::error::{Error, Result};
use std::sync::OnceLock;

/// 全局配置实例
static CONFIG: OnceLock<AppConfig> = OnceLock::new();

/// 初始化配置（从嵌入的加密配置）
///
/// 这是最常用的初始化方式，配置在编译时被加密并嵌入到二进制中
pub fn init() -> Result<()> {
    let config = loader::load_embedded()?;
    validator::validate(&config)?;

    CONFIG.set(config).map_err(|_| Error::ConfigAlreadyInitialized)?;
    Ok(())
}

/// 初始化配置（从字符串）
///
/// 用于测试或从其他来源加载配置
pub fn init_from_str(config_str: &str) -> Result<()> {
    let config = loader::load_from_str(config_str)?;
    validator::validate(&config)?;

    CONFIG.set(config).map_err(|_| Error::ConfigAlreadyInitialized)?;
    Ok(())
}

/// 初始化配置（从文件路径）
///
/// 用于开发环境或特殊场景
pub fn init_from_path(config_path: &str) -> Result<()> {
    let config = loader::load_from_path(config_path)?;
    validator::validate(&config)?;

    CONFIG.set(config).map_err(|_| Error::ConfigAlreadyInitialized)?;
    Ok(())
}

/// 获取配置（返回 Option）
///
/// 如果配置未初始化，返回 None
pub fn get() -> Option<&'static AppConfig> {
    CONFIG.get()
}

/// 获取配置（必须已初始化）
///
/// 如果配置未初始化，返回错误
pub fn get_or_err() -> Result<&'static AppConfig> {
    CONFIG.get().ok_or(Error::ConfigNotInitialized)
}

/// 获取配置（必须已初始化，否则 panic）
///
/// 仅在确定配置已初始化的场景使用
pub fn get_or_panic() -> &'static AppConfig {
    CONFIG.get().expect("Config not initialized. Call config::init() first.")
}
