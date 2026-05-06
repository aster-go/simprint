import { NotificationMenu } from './notification-menu';
import { DownloadMenu } from './download-menu';
import { UserMenu } from './user-menu';

/**
 * 默认状态信息区域组件
 */
export function DefaultStatusSlot() {
  return (
    <>
      <div className="flex items-center gap-2 mx-2">
        <NotificationMenu />
        <DownloadMenu />
      </div>
      <UserMenu />
    </>
  );
}
