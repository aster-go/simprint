import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Loader2, X, Cookie, Plus } from 'lucide-react';
import { FormattedDialog, FormattedDialogFooter } from '@/components/formatted-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextareaInput } from '@/components/textarea-input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEnvironmentDialogStore } from '../stores';
import {
  getEnvironmentCookies,
  addEnvironmentCookies,
  clearEnvironmentCookies,
  type CookieItem,
} from '../api';

interface EnvironmentEditCookiesDialogProps {
  onComplete?: () => void;
}

/**
 * 将 Cookie 字符串解析为结构化数据
 * 格式：name=value 或 name=value; name2=value2
 */
function parseCookieString(cookieStr: string): { name: string; value: string }[] {
  const result: { name: string; value: string }[] = [];
  // 按分号分割，处理多个 cookie
  const parts = cookieStr
    .split(';')
    .map((s) => s.trim())
    .filter(Boolean);
  for (const part of parts) {
    const eqIndex = part.indexOf('=');
    if (eqIndex > 0) {
      const name = part.substring(0, eqIndex).trim();
      const value = part.substring(eqIndex + 1).trim();
      if (name) {
        result.push({ name, value });
      }
    }
  }
  return result;
}

/**
 * 将结构化 Cookie 数据格式化为字符串
 */
function formatCookie(cookie: CookieItem): string {
  return `${cookie.name}=${cookie.value}`;
}

/**
 * 编辑环境 Cookies 对话框
 */
export function EnvironmentEditCookiesDialog({ onComplete }: EnvironmentEditCookiesDialogProps) {
  const { t } = useTranslation('environment');
  const dialogStore = useEnvironmentDialogStore();
  const [cookies, setCookies] = useState<string[]>([]);
  const [newCookie, setNewCookie] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // 加载 Cookies
  useEffect(() => {
    if (dialogStore.editCookiesEnvironment && dialogStore.editCookiesDialogOpen) {
      loadCookies();
    }
  }, [dialogStore.editCookiesEnvironment, dialogStore.editCookiesDialogOpen]);

  const loadCookies = async () => {
    if (!dialogStore.editCookiesEnvironment) return;

    setLoading(true);
    try {
      const result = await getEnvironmentCookies(dialogStore.editCookiesEnvironment.uuid);
      // 将结构化数据转换为字符串列表显示
      setCookies(result.map(formatCookie));
    } catch (e) {
      console.error('Failed to load cookies:', e);
      setCookies([]);
    } finally {
      setLoading(false);
    }
  };

  // 添加 Cookie（自动根据分号分割）
  const handleAddCookie = () => {
    if (!newCookie.trim()) return;

    // 解析输入的 Cookie 字符串，按分号分割
    const parsed = parseCookieString(newCookie);
    if (parsed.length > 0) {
      // 将解析后的每条 Cookie 添加到列表（格式：name=value）
      const newCookies = parsed.map((p) => `${p.name}=${p.value}`);
      setCookies((prev) => [...prev, ...newCookies]);
    }
    setNewCookie('');
  };

  // 移除 Cookie
  const handleRemoveCookie = (index: number) => {
    setCookies((prev) => prev.filter((_, i) => i !== index));
  };

  // 保存 Cookies
  const handleSave = async () => {
    if (!dialogStore.editCookiesEnvironment) return;

    setSaving(true);
    try {
      const uuid = dialogStore.editCookiesEnvironment.uuid;

      // 解析所有 Cookies
      const parsedCookies: Omit<CookieItem, 'id'>[] = [];
      if (cookies.length > 0) {
        for (const cookieStr of cookies) {
          const parsed = parseCookieString(cookieStr);
          for (const p of parsed) {
            parsedCookies.push({
              domain: '', // 默认空域名
              name: p.name,
              value: p.value,
              path: '/',
              http_only: false,
              secure: false,
              same_site: 'Lax',
            });
          }
        }
      }

      // 先清空现有 Cookies
      await clearEnvironmentCookies(uuid);

      // 如果有解析后的 Cookies，则添加
      if (parsedCookies.length > 0) {
        await addEnvironmentCookies(uuid, parsedCookies);
      }

      dialogStore.closeEditCookiesDialog();
      toast.success(t('dialog.editCookies.success'));
      onComplete?.();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t('dialog.editCookies.failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setCookies([]);
    setNewCookie('');
    dialogStore.closeEditCookiesDialog();
  };

  if (!dialogStore.editCookiesEnvironment) return null;

  return (
    <FormattedDialog
      open={dialogStore.editCookiesDialogOpen && !!dialogStore.editCookiesEnvironment}
      onOpenChange={(open) => {
        dialogStore.setEditCookiesDialogOpen(open);
        if (!open) {
          handleClose();
        }
      }}
      minWidth="min-w-[600px]"
      header={{
        icon: Cookie,
        title: t('dialog.editCookies.title'),
        description: t('dialog.editCookies.description'),
      }}
    >
      <div className="space-y-4">
        {/* 添加 Cookie 区域 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">
            {t('dialog.editCookies.addCookie')}
          </Label>
          <div className="flex gap-2">
            <TextareaInput
              value={newCookie}
              onChange={(e) => setNewCookie(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleAddCookie();
                }
              }}
              placeholder={t('dialog.editCookies.cookiesPlaceholder')}
              className="flex-1 text-sm min-h-9 font-mono"
              disabled={saving || loading}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddCookie}
              disabled={!newCookie.trim() || saving || loading}
              className="shrink-0"
            >
              <Plus className="h-4 w-4 mr-1.5" />
              {t('dialog.editCookies.add')}
            </Button>
          </div>
        </div>

        {/* Cookie 列表 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">
            {t('dialog.editCookies.cookiesList')} ({cookies.length})
          </Label>
          {loading ? (
            <div className="flex items-center justify-center h-32 text-muted-foreground border border-border/50 rounded-md">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              <span className="text-sm">{t('dialog.editCookies.loading')}</span>
            </div>
          ) : cookies.length > 0 ? (
            <ScrollArea className="h-[240px] border border-border/50 rounded-md">
              <div className="p-2 space-y-1">
                {cookies.map((cookie, index) => (
                  <div key={index} className="flex items-center gap-1">
                    <div className="flex-1 h-8 px-2 flex items-center text-xs font-mono bg-muted rounded overflow-hidden">
                      <span className="truncate">{cookie}</span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0"
                      onClick={() => handleRemoveCookie(index)}
                      disabled={saving || loading}
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="h-32 px-4 flex items-center justify-center text-sm text-muted-foreground bg-muted/30 border border-border/50 rounded-md">
              {t('dialog.editCookies.noCookies')}
            </div>
          )}
        </div>
      </div>

      <FormattedDialogFooter>
        <Button variant="outline" size="sm" onClick={handleClose} disabled={saving || loading}>
          {t('dialog.editCookies.cancel')}
        </Button>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-0"
          onClick={handleSave}
          disabled={saving || loading}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
              {t('dialog.editCookies.saving')}
            </>
          ) : (
            t('dialog.editCookies.save')
          )}
        </Button>
      </FormattedDialogFooter>
    </FormattedDialog>
  );
}
