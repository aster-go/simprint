import { useState } from 'react';
import type { ExtensionItem } from '../types';

interface UseUninstallDialogReturn {
  uninstallDialogOpen: boolean;
  uninstallingExt: ExtensionItem | null;
  openUninstallDialog: (extension: ExtensionItem) => void;
  closeUninstallDialog: () => void;
}

/**
 * 卸载对话框状态管理 Hook
 */
export function useUninstallDialog(): UseUninstallDialogReturn {
  const [uninstallDialogOpen, setUninstallDialogOpen] = useState(false);
  const [uninstallingExt, setUninstallingExt] = useState<ExtensionItem | null>(null);

  const openUninstallDialog = (extension: ExtensionItem) => {
    setUninstallingExt(extension);
    setUninstallDialogOpen(true);
  };

  const closeUninstallDialog = () => {
    setUninstallDialogOpen(false);
    setUninstallingExt(null);
  };

  return {
    uninstallDialogOpen,
    uninstallingExt,
    openUninstallDialog,
    closeUninstallDialog,
  };
}
