export interface MihomoConnectionConfig {
  controller: string;
  secret: string;
}

export interface MihomoStatus {
  attached: boolean;
  controller: string | null;
}

export interface MihomoProxyDelayResult {
  name: string;
  delay_ms: number | null;
  available: boolean;
}

export interface MihomoConnectionInfo {
  attached: boolean;
  controller: string | null;
  secret: string | null;
}

export interface MihomoProviderOverview {
  name: string;
  provider_type: string | null;
  vehicle_type: string | null;
  updated_at: string | null;
  node_count: number;
}

export interface MihomoGroupOverview {
  name: string;
  group_type: string;
  selected: string | null;
  candidates: string[];
}

export interface MihomoNodeOverview {
  name: string;
  node_type: string;
  alive: boolean | null;
  udp: boolean | null;
  source_provider: string | null;
}

export interface MihomoOverview {
  controller: string;
  version: string | null;
  providers: MihomoProviderOverview[];
  groups: MihomoGroupOverview[];
  nodes: MihomoNodeOverview[];
}
