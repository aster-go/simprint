export interface ExtensionItem {
  /**
   * 用于业务操作的 ID，对应后端的 extension_id（如 Chrome 扩展 ID）
   */
  id: string;
  /**
   * 后端扩展记录的 UUID（仅用于展示/调试，不用于接口调用）
   */
  uuid?: string;
  name: string;
  description: string;
  version: string;
  status: 'installed' | 'available' | 'update' | 'disabled' | 'active';
  icon: string;
  browser: 'chrome' | 'firefox' | 'edge' | 'all';
  author?: string;
  homepage?: string;
  downloads?: number;
  rating?: number;
  updatedAt?: string;
  scope?: 'user' | 'team' | 'group-personal' | 'group-team'; // 安装范围
  groups?: Array<{
    uuid: string;
    name: string;
  }>; // 关联的分组列表（包含 uuid 和 name）
}

export interface StoreExtension extends ExtensionItem {
  category?: 'automation' | 'security' | 'productivity' | 'tools' | 'media' | 'social';
  rating?: number;
  isInstalled?: boolean;
}

export type ExtensionStatus = 'installed' | 'available' | 'update' | 'disabled' | 'active';
export type ExtensionBrowser = 'chrome' | 'firefox' | 'edge' | 'all';
export type ExtensionCategory =
  | 'automation'
  | 'security'
  | 'productivity'
  | 'tools'
  | 'media'
  | 'social';
export type ViewMode = 'installed' | 'store';
export type SortOption = 'downloads' | 'rating' | 'name' | 'newest';
