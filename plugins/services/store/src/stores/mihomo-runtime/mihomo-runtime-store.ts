import { create } from 'zustand';
import { invoke } from '@/lib/tauri';

const MIHOMO_PROCESS_NAMES = ['clash verge', 'clash-verge', 'clash-verge-rev', 'mihomo'];
const MIHOMO_PROCESS_POLL_INTERVAL_MS = 30_000;

interface ProcessInfo {
  process_name: string;
  pid: number;
  executable_path?: string | null;
}

interface FindProcessResult {
  running: boolean;
  process: ProcessInfo | null;
}

interface MihomoRuntimeState {
  running: boolean;
  processName: string | null;
  pid: number | null;
  executablePath: string | null;
  checkedAt: number | null;
  checking: boolean;
  polling: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  startPolling: () => void;
  stopPolling: () => void;
}

let pollingTimer: number | null = null;

async function queryMihomoProcess(): Promise<FindProcessResult> {
  return invoke<FindProcessResult>('find_process', { names: MIHOMO_PROCESS_NAMES });
}

export const useMihomoRuntimeStore = create<MihomoRuntimeState>((set, get) => ({
  running: false,
  processName: null,
  pid: null,
  executablePath: null,
  checkedAt: null,
  checking: false,
  polling: false,
  error: null,
  refresh: async () => {
    set({ checking: true });
    try {
      const result = await queryMihomoProcess();
      set({
        running: result.running,
        processName: result.process?.process_name ?? null,
        pid: result.process?.pid ?? null,
        executablePath: result.process?.executable_path ?? null,
        checkedAt: Date.now(),
        checking: false,
        error: null,
      });
    } catch (error) {
      set({
        running: false,
        processName: null,
        pid: null,
        executablePath: null,
        checkedAt: Date.now(),
        checking: false,
        error: error instanceof Error ? error.message : '检测 Mihomo 进程失败',
      });
    }
  },
  startPolling: () => {
    if (pollingTimer != null) {
      return;
    }

    void get().refresh();
    pollingTimer = window.setInterval(() => {
      void get().refresh();
    }, MIHOMO_PROCESS_POLL_INTERVAL_MS);
    set({ polling: true });
  },
  stopPolling: () => {
    if (pollingTimer != null) {
      window.clearInterval(pollingTimer);
      pollingTimer = null;
    }
    set({ polling: false });
  },
}));
