import { useState } from 'react';

interface UseDetailDialogReturn {
  detailDialogOpen: boolean;
  viewingExtensionId: string | null;
  openDetailDialog: (extensionId: string) => void;
  closeDetailDialog: () => void;
}

/**
 * 详情对话框状态管理 Hook
 */
export function useDetailDialog(): UseDetailDialogReturn {
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [viewingExtensionId, setViewingExtensionId] = useState<string | null>(null);

  const openDetailDialog = (extensionId: string) => {
    setViewingExtensionId(extensionId);
    setDetailDialogOpen(true);
  };

  const closeDetailDialog = () => {
    setDetailDialogOpen(false);
    setViewingExtensionId(null);
  };

  return {
    detailDialogOpen,
    viewingExtensionId,
    openDetailDialog,
    closeDetailDialog,
  };
}
