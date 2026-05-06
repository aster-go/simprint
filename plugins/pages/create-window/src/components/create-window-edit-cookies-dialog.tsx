import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Cookie } from 'lucide-react';
import { FormattedDialog, FormattedDialogFooter } from '@/components/formatted-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { TextareaInput } from '@/components/textarea-input';

interface CreateWindowEditCookiesDialogProps {
  open: boolean;
  cookies: string[]; // Cookie 字符串列表（格式：name=value）
  onOpenChange: (open: boolean) => void;
  onConfirm: (cookies: string[]) => void;
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
 * 创建窗口编辑 Cookies 对话框
 */
export function CreateWindowEditCookiesDialog({
  open,
  cookies: initialCookies,
  onOpenChange,
  onConfirm,
}: CreateWindowEditCookiesDialogProps) {
  const { t } = useTranslation('create-window');
  const [newCookie, setNewCookie] = useState('');
  const [cookieError, setCookieError] = useState('');

  // 初始化
  useEffect(() => {
    if (open) {
      setNewCookie('');
      setCookieError('');
    }
  }, [open]);

  // 添加 Cookie（支持多行输入和分号分割）
  const handleAddCookie = () => {
    if (!newCookie.trim()) {
      setCookieError(t('dialog.cookies.cookieRequired') || '请输入 Cookie');
      return;
    }

    // 按行分割，处理多行输入
    const lines = newCookie
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);

    const validCookies: string[] = [];

    // 处理每一行
    for (const line of lines) {
      // 解析输入的 Cookie 字符串，按分号分割
      const parsed = parseCookieString(line);
      if (parsed.length > 0) {
        // 将解析后的每条 Cookie 添加到列表（格式：name=value）
        const newCookies = parsed.map((p) => `${p.name}=${p.value}`);
        validCookies.push(...newCookies);
      }
    }

    if (validCookies.length === 0) {
      setCookieError(t('dialog.cookies.invalidCookie') || '无效的 Cookie 格式');
      return;
    }

    // 添加有效的 Cookie 到现有列表
    const updatedCookies = [...(initialCookies || []), ...validCookies];
    onConfirm(updatedCookies);
    // 添加后关闭对话框
    setNewCookie('');
    setCookieError('');
    onOpenChange(false);
  };

  const handleClose = () => {
    setNewCookie('');
    setCookieError('');
    onOpenChange(false);
  };

  return (
    <FormattedDialog
      open={open}
      onOpenChange={onOpenChange}
      minWidth="min-w-[520px]"
      header={{
        icon: Cookie,
        iconColor: 'text-orange-500',
        title: t('dialog.cookies.addCookie') || '添加 Cookie',
        description: t('dialog.cookies.selectDescription') || '输入 Cookie，每行一个或使用分号分隔',
        gradient: 'bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/10',
        className: 'border-b border-border/50',
      }}
    >
      <div className="space-y-4">
        {/* 添加 Cookie 区域 */}
        <div className="space-y-1.5">
          <Label className="text-xs font-medium text-foreground">
            Cookie <span className="text-destructive">*</span>
          </Label>
          <TextareaInput
            value={newCookie}
            onChange={(e) => {
              setNewCookie(e.target.value);
              setCookieError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleAddCookie();
              }
            }}
            className={`text-sm min-h-[80px] font-mono ${cookieError ? 'border-destructive focus-visible:border-destructive focus-visible:ring-destructive/50' : ''}`}
            placeholder={
              t('dialog.cookies.cookiesPlaceholder') || 'HSID=xxx; SSID=yyy 或每行一个 name=value'
            }
          />
          {cookieError && <p className="text-[10px] text-destructive mt-0.5">{cookieError}</p>}
        </div>
      </div>

      <FormattedDialogFooter>
        <Button variant="outline" size="sm" onClick={handleClose}>
          {t('dialog.cookies.cancel') || '取消'}
        </Button>
        <Button
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90 border-0"
          onClick={handleAddCookie}
        >
          {t('dialog.cookies.add') || '添加'}
        </Button>
      </FormattedDialogFooter>
    </FormattedDialog>
  );
}
