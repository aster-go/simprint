import { useState } from 'react';
import type { ExtensionItem, StoreExtension } from '../types';
import {
  installExtension as apiInstallExtension,
  uninstallExtension as apiUninstallExtension,
  updateExtension as apiUpdateExtension,
  batchUpdateExtensions as apiBatchUpdateExtensions,
  disableExtension as apiDisableExtension,
  enableExtension as apiEnableExtension,
} from '../api';

interface UseExtensionOperationsReturn {
  installing: boolean;
  installExtension: (
    extension: StoreExtension,
    groupIds: string[],
    forTeam: boolean
  ) => Promise<void>;
  updateExtension: (id: string) => Promise<ExtensionItem | null>;
  uninstallExtension: (extension: ExtensionItem) => Promise<void>;
  batchUpdate: (ids: string[]) => Promise<void>;
  batchUninstall: (extensions: ExtensionItem[]) => Promise<void>;
  disableExtension: (id: string) => Promise<void>;
  enableExtension: (id: string) => Promise<void>;
}

/**
 * 扩展操作逻辑 Hook
 */
export function useExtensionOperations(onComplete?: () => void): UseExtensionOperationsReturn {
  const [installing, setInstalling] = useState(false);

  const installExtension = async (
    extension: StoreExtension,
    groupIds: string[],
    forTeam: boolean
  ) => {
    setInstalling(true);
    try {
      // 如果选择了分组
      if (groupIds.length > 0) {
        // 安装到分组，is_team_shared 由 forTeam 决定
        await apiInstallExtension({
          extension_id: extension.id,
          group_ids: groupIds,
          for_team: false,
          is_team_shared: forTeam, // forTeam 决定是否团队共享
        });
      } else {
        // 没有选择分组，根据 forTeam 决定安装到用户还是团队
        await apiInstallExtension({
          extension_id: extension.id,
          group_ids: undefined,
          for_team: forTeam,
          is_team_shared: undefined,
        });
      }
      onComplete?.();
    } finally {
      setInstalling(false);
    }
  };

  const updateExtension = async (id: string): Promise<ExtensionItem | null> => {
    try {
      const result = await apiUpdateExtension(id);
      onComplete?.();
      return {
        id: result.extensionId,
        uuid: result.id,
        name: result.name,
        description: result.description,
        version: result.version,
        icon: result.icon,
        browser: result.browser as ExtensionItem['browser'],
        status: result.status,
        author: result.author,
        downloads: result.downloads,
        updatedAt: result.updatedAt,
      };
    } catch {
      return null;
    }
  };

  const uninstallExtension = async (extension: ExtensionItem) => {
    try {
      // 根据 scope 决定卸载类型和目标
      let targetType: 'user' | 'team' | 'group' = 'user';
      let targetUuid: string | undefined = undefined;

      // 从 extension 中获取 scope 信息
      const scope = (extension as any).scope as string | undefined;

      if (scope === 'team') {
        targetType = 'team';
      } else if (scope === 'group-personal' || scope === 'group-team') {
        targetType = 'group';
        // 如果是分组插件，需要提供 group_uuid
        // 从 groups 数组中获取第一个分组的 uuid
        const groups = (extension as any).groups as Array<{ uuid: string; name: string }> | undefined;
        if (groups && groups.length > 0) {
          targetUuid = groups[0].uuid;
        }
      } else {
        // 默认为用户插件
        targetType = 'user';
      }

      await apiUninstallExtension(extension.id, targetType, targetUuid);
      onComplete?.();
    } catch {
      // 错误已处理
    }
  };

  const batchUpdate = async (ids: string[]) => {
    try {
      await apiBatchUpdateExtensions(ids);
      onComplete?.();
    } catch {
      // 忽略错误
    }
  };

  const batchUninstall = async (extensions: ExtensionItem[]) => {
    // 后端没有批量卸载接口，逐个卸载
    for (const ext of extensions) {
      try {
        await uninstallExtension(ext);
      } catch {
        // 忽略单个错误
      }
    }
    onComplete?.();
  };

  const disableExtension = async (id: string) => {
    try {
      await apiDisableExtension(id);
      onComplete?.();
    } catch {
      // 错误已处理
    }
  };

  const enableExtension = async (id: string) => {
    try {
      await apiEnableExtension(id);
      onComplete?.();
    } catch {
      // 错误已处理
    }
  };

  return {
    installing,
    installExtension,
    updateExtension,
    uninstallExtension,
    batchUpdate,
    batchUninstall,
    disableExtension,
    enableExtension,
  };
}
