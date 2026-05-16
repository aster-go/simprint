import { invoke } from '@/lib/tauri';
import type {
  MihomoConnectionConfig,
  MihomoConnectionInfo,
  MihomoOverview,
  MihomoProxyDelayResult,
  MihomoStatus,
} from './types';

export function testAndAttachMihomo(config: MihomoConnectionConfig): Promise<MihomoStatus> {
  return invoke<MihomoStatus>('test_and_attach_mihomo', { config });
}

export function getMihomoStatus(): Promise<MihomoStatus> {
  return invoke<MihomoStatus>('get_mihomo_status');
}

export function getMihomoConnectionInfo(): Promise<MihomoConnectionInfo> {
  return invoke<MihomoConnectionInfo>('get_mihomo_connection_info');
}

export function getMihomoOverview(): Promise<MihomoOverview> {
  return invoke<MihomoOverview>('get_mihomo_overview');
}

export function testMihomoProxyDelay(proxyName: string): Promise<MihomoProxyDelayResult> {
  return invoke<MihomoProxyDelayResult>('test_mihomo_proxy_delay', { proxyName });
}

export function testMihomoGroupDelays(groupName: string): Promise<MihomoProxyDelayResult[]> {
  return invoke<MihomoProxyDelayResult[]>('test_mihomo_group_delays', { groupName });
}
