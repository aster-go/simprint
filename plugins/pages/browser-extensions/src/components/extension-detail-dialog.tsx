import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Loader2,
  Info,
  Package,
  ExternalLink,
  Shield,
  Download,
  Star,
  Calendar,
} from 'lucide-react';
import { FormattedDialog, FormattedDialogFooter } from '@/components/formatted-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getExtensionDetail } from '../api';
import type { Extension } from '../api';

interface ExtensionDetailDialogProps {
  open: boolean;
  extensionId: string | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * 扩展详情对话框组件
 */
export function ExtensionDetailDialog({
  open,
  extensionId,
  onOpenChange,
}: ExtensionDetailDialogProps) {
  const { t } = useTranslation('extensions');
  const [loading, setLoading] = useState(false);
  const [extension, setExtension] = useState<Extension | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && extensionId) {
      setLoading(true);
      setError(null);
      getExtensionDetail(extensionId)
        .then((data) => {
          setExtension(data);
        })
        .catch((e) => {
          setError(e instanceof Error ? e.message : '获取扩展详情失败');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setExtension(null);
      setError(null);
    }
  }, [open, extensionId]);

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <FormattedDialog
      open={open}
      onOpenChange={onOpenChange}
      minWidth="min-w-[600px]"
      header={{
        icon: Info,
        iconColor: 'text-blue-500',
        title: t('dialog.detail.title'),
        gradient: 'bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-blue-500/10',
        className: 'border-b border-blue-500/20',
      }}
      contentClassName="flex flex-col overflow-hidden"
      contentPadding="p-0"
    >
      {loading ? (
        <div className="flex items-center justify-center py-10 px-5">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : error ? (
        <div className="text-sm text-destructive py-4 px-5">{error}</div>
      ) : extension ? (
        <ScrollArea className="flex-1 px-5 py-5">
          <div className="space-y-4 pr-4">
            {/* 基本信息 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                {extension.icon ? (
                  typeof extension.icon === 'string' && extension.icon.startsWith('http') ? (
                    <img
                      src={extension.icon}
                      alt=""
                      className="w-16 h-16 rounded-lg"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-border flex items-center justify-center text-2xl">
                      {extension.icon}
                    </div>
                  )
                ) : (
                  <div className="w-16 h-16 rounded-lg border border-border bg-muted flex items-center justify-center">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-foreground">{extension.name}</h3>
                  {extension.author && (
                    <p className="text-xs text-muted-foreground mt-1">{extension.author}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-muted-foreground">v{extension.version}</span>
                    {extension.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                        <span className="text-xs text-muted-foreground">
                          {extension.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {extension.description && (
                <p className="text-sm text-foreground leading-relaxed">{extension.description}</p>
              )}
            </div>

            {/* 详细信息 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/50 rounded-md p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Package className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('dialog.detail.category')}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {extension.category
                    ? t(`store.categories.${extension.category}`)
                    : t('store.categories.all')}
                </p>
              </div>

              <div className="bg-muted/50 rounded-md p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('dialog.detail.browser')}
                  </span>
                </div>
                <p className="text-sm text-foreground">{t(`browser.${extension.browser}`)}</p>
              </div>

              <div className="bg-muted/50 rounded-md p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('dialog.detail.downloads')}
                  </span>
                </div>
                <p className="text-sm text-foreground">
                  {extension.downloads?.toLocaleString() || '-'}
                </p>
              </div>

              <div className="bg-muted/50 rounded-md p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-1">
                  <Download className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('dialog.detail.fileSize')}
                  </span>
                </div>
                <p className="text-sm text-foreground">{formatFileSize(extension.fileSize)}</p>
              </div>
            </div>

            {/* 权限 */}
            {extension.permissions && extension.permissions.length > 0 && (
              <div className="bg-muted/50 rounded-md p-3 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground">
                    {t('dialog.detail.permissions')}
                  </span>
                </div>
                <ScrollArea className="h-[120px]">
                  <div className="flex flex-wrap gap-1.5 pr-4">
                    {extension.permissions.map((permission, index) => (
                      <span
                        key={index}
                        className="text-xs px-2 py-0.5 bg-background border border-border rounded text-foreground"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* 时间信息 */}
            <div className="grid grid-cols-2 gap-3">
              {extension.updatedAt && (
                <div className="bg-muted/50 rounded-md p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('dialog.detail.updatedAt')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{formatDate(extension.updatedAt)}</p>
                </div>
              )}

              {extension.createdAt && (
                <div className="bg-muted/50 rounded-md p-3 border border-border/50">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {t('dialog.detail.createdAt')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground">{formatDate(extension.createdAt)}</p>
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      ) : null}

      <FormattedDialogFooter>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          {t('dialog.detail.close')}
        </Button>
      </FormattedDialogFooter>
    </FormattedDialog>
  );
}
