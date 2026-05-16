import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Gauge, Loader2, RefreshCw, Settings2, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { MihomoConnectDialog } from './mihomo-connect-dialog';
import { ClashIcon } from './clash-icon';
import {
  getMihomoOverview,
  testMihomoGroupDelays,
  testMihomoProxyDelay,
} from './api';
import type { MihomoOverview, MihomoProxyDelayResult } from './types';

interface NodeDelayState {
  delayMs: number | null;
  status: 'idle' | 'testing' | 'success' | 'failed';
}

export function MihomoPage() {
  const { t } = useTranslation('proxy');
  const [overview, setOverview] = useState<MihomoOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [configOpen, setConfigOpen] = useState(false);
  const [selectedGroupName, setSelectedGroupName] = useState<string | null>(null);
  const [nodeDelayStates, setNodeDelayStates] = useState<Record<string, NodeDelayState>>({});
  const [testingGroups, setTestingGroups] = useState<Record<string, boolean>>({});
  const [testedGroups, setTestedGroups] = useState<Record<string, boolean>>({});

  const loadOverview = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const nextOverview = await getMihomoOverview();
      setOverview(nextOverview);
    } catch (invokeError) {
      setOverview(null);
      setError(
        invokeError instanceof Error
          ? invokeError.message
          : t('mihomo.page.loadFailed', { defaultValue: '加载 Mihomo 数据失败' })
      );
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void loadOverview();
  }, [loadOverview]);

  useEffect(() => {
    if (!overview || overview.groups.length === 0) {
      setSelectedGroupName(null);
      return;
    }

    setSelectedGroupName((current) => {
      if (current && overview.groups.some((group) => group.name === current)) {
        return current;
      }

      const preferredGroup = overview.groups.find((group) => group.selected);
      return preferredGroup?.name || overview.groups[0].name;
    });
  }, [overview]);

  const selectedGroup = overview?.groups.find((group) => group.name === selectedGroupName) || null;
  const filteredNodes =
    selectedGroup && selectedGroup.candidates.length > 0
      ? overview?.nodes.filter((node) => selectedGroup.candidates.includes(node.name)) || []
      : overview?.nodes || [];

  const applyDelayResults = useCallback((results: MihomoProxyDelayResult[]) => {
    setNodeDelayStates((current) => {
      const next = { ...current };
      for (const result of results) {
        next[result.name] = {
          delayMs: result.delay_ms,
          status: result.delay_ms == null ? 'failed' : 'success',
        };
      }
      return next;
    });
  }, []);

  const handleTestNode = useCallback(
    async (nodeName: string) => {
      setNodeDelayStates((current) => ({
        ...current,
        [nodeName]: {
          delayMs: current[nodeName]?.delayMs ?? null,
          status: 'testing',
        },
      }));

      try {
        const result = await testMihomoProxyDelay(nodeName);
        applyDelayResults([result]);
      } catch (invokeError) {
        setNodeDelayStates((current) => ({
          ...current,
          [nodeName]: {
            delayMs: null,
            status: 'failed',
          },
        }));
        toast.error(
          invokeError instanceof Error
            ? invokeError.message
            : t('mihomo.page.delayTestFailed', { defaultValue: '测速失败' })
        );
      }
    },
    [applyDelayResults, t]
  );

  const handleTestGroup = useCallback(
    async (groupName: string, candidateNames: string[]) => {
      setSelectedGroupName(groupName);
      setTestingGroups((current) => ({ ...current, [groupName]: true }));
      setTestedGroups((current) => ({ ...current, [groupName]: true }));
      setNodeDelayStates((current) => {
        const next = { ...current };
        for (const candidateName of candidateNames) {
          next[candidateName] = {
            delayMs: current[candidateName]?.delayMs ?? null,
            status: 'testing',
          };
        }
        return next;
      });

      try {
        const results = await testMihomoGroupDelays(groupName);
        applyDelayResults(results);
      } catch (invokeError) {
        toast.error(
          invokeError instanceof Error
            ? invokeError.message
            : t('mihomo.page.groupDelayTestFailed', {
                defaultValue: '策略组批量测速失败',
              })
        );
      } finally {
        setTestingGroups((current) => ({ ...current, [groupName]: false }));
      }
    },
    [applyDelayResults, t]
  );

  return (
    <div className="flex h-[calc(100vh-50px)] flex-col bg-background/10">
      <header className="flex items-center justify-between border-b border-border bg-background/10 px-6 py-2 backdrop-blur-2xl">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <ClashIcon className="h-4 w-4 text-sky-500" aria-hidden="true" />
            {t('mihomo.page.title', { defaultValue: 'Mihomo' })}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {t('mihomo.page.subtitle', {
              defaultValue: '在这里按策略浏览节点，并对节点执行测速。',
            })}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setConfigOpen(true)}>
            <Settings2 className="mr-1.5 h-3.5 w-3.5" />
            {t('mihomo.page.settings', { defaultValue: '连接设置' })}
          </Button>
          <Button size="sm" onClick={() => void loadOverview()} disabled={loading}>
            {loading ? (
              <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
            )}
            {t('mihomo.page.refresh', { defaultValue: '刷新数据' })}
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        {overview && !error && (
          <div className="scrollbar-hidden min-h-0 w-52 shrink-0 overflow-x-hidden overflow-y-auto border-r border-border/60 bg-background/40">
            <div className="space-y-0">
              {overview.groups.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                  {t('mihomo.page.groupsEmpty', {
                    defaultValue: '当前实例没有可见的策略组。',
                  })}
                </div>
              ) : (
                overview.groups.map((group) => (
                  <div
                    key={group.name}
                    className={cn(
                      'group relative flex items-start justify-between gap-2 px-3 py-2 transition-colors',
                      selectedGroupName === group.name
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-accent/60'
                    )}
                  >
                    {selectedGroupName === group.name && (
                      <div className="absolute -right-px top-1/2 h-6 w-px -translate-y-1/2 bg-primary" />
                    )}
                    <button
                      type="button"
                      onClick={() => setSelectedGroupName(group.name)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="truncate text-sm font-semibold">{group.name}</div>
                      <div
                        className={cn(
                          'mt-1 truncate text-xs',
                          selectedGroupName === group.name
                            ? 'text-primary/80'
                            : 'text-muted-foreground'
                        )}
                      >
                        {group.group_type} ·{' '}
                        {group.selected ||
                          t('mihomo.page.groupsUnselected', { defaultValue: '未选中' })}
                      </div>
                    </button>
                    <div
                      className={cn(
                        'flex shrink-0 items-center gap-2 text-[11px]',
                        selectedGroupName === group.name
                          ? 'text-primary/80'
                          : 'text-muted-foreground'
                      )}
                    >
                      <button
                        type="button"
                        title={t('mihomo.page.node.test', { defaultValue: '测速' })}
                        aria-label={t('mihomo.page.node.test', { defaultValue: '测速' })}
                        className={cn(
                          'inline-flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-accent hover:text-foreground',
                          testingGroups[group.name] || testedGroups[group.name]
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                        )}
                        onClick={() => void handleTestGroup(group.name, group.candidates)}
                      >
                        {testingGroups[group.name] ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Gauge className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <span>
                        {group.candidates.length}{' '}
                        {t('mihomo.page.groupsCandidates', { defaultValue: '候选' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        <div className="min-h-0 min-w-0 flex-1 overflow-auto px-6 py-5">
          {loading && !overview ? (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('mihomo.page.loading', { defaultValue: '正在加载 Mihomo 数据...' })}
            </div>
          ) : error ? (
            <Card className="mx-auto mt-12 max-w-2xl border-destructive/40 bg-destructive/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <ShieldAlert className="h-4 w-4" />
                  {t('mihomo.page.errorTitle', { defaultValue: '当前未能读取 Mihomo 数据' })}
                </CardTitle>
                <CardDescription className="text-destructive/80">{error}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Button onClick={() => void loadOverview()}>
                  {t('mihomo.page.retry', { defaultValue: '重试' })}
                </Button>
                <Button variant="outline" onClick={() => setConfigOpen(true)}>
                  {t('mihomo.page.reconfigure', { defaultValue: '重新配置' })}
                </Button>
              </CardContent>
            </Card>
          ) : overview ? (
            filteredNodes.length === 0 ? (
              <div className="flex min-h-[320px] items-center justify-center rounded-xl border border-dashed border-border/70 bg-background/50 px-6 text-sm text-muted-foreground">
                {selectedGroup
                  ? t('mihomo.page.node.filteredEmpty', {
                      defaultValue: '当前策略下没有可见的基础节点。',
                    })
                  : t('mihomo.page.node.empty', {
                      defaultValue: '当前实例没有可见的基础节点。',
                    })}
              </div>
            ) : (
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredNodes.map((node) => {
                  const delayState = nodeDelayStates[node.name];
                  const hasTested = delayState != null && delayState.status !== 'idle';

                  return (
                    <div
                      key={node.name}
                      className="group flex min-h-[88px] flex-col items-start justify-between rounded-xl border border-border/60 bg-background/75 px-4 py-2.5 text-left transition-colors hover:border-primary/30 hover:bg-background"
                    >
                      <div className="w-full">
                        <div className="line-clamp-2 text-[14px] font-semibold leading-5 text-foreground">
                          {node.name}
                        </div>
                      </div>

                      <div className="mt-2 flex w-full items-end justify-between gap-2">
                        <div className="flex flex-wrap gap-1.5">
                          <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                            {node.node_type}
                          </span>
                          {node.udp != null && (
                            <span className="rounded-md border border-border/70 bg-muted/40 px-2 py-0.5 text-[11px] text-muted-foreground">
                              UDP
                            </span>
                          )}
                        </div>

                        <button
                          type="button"
                          className={cn(
                            'inline-flex h-7 shrink-0 items-center justify-center rounded-md border border-border/70 bg-background/80 px-2.5 text-[11px] text-muted-foreground transition-all hover:border-primary/30 hover:text-foreground',
                            hasTested
                              ? 'opacity-100'
                              : 'opacity-0 group-hover:opacity-100'
                          )}
                          onClick={() => void handleTestNode(node.name)}
                        >
                          {delayState?.status === 'testing' ? (
                            <>
                              <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              {t('mihomo.page.node.testing', { defaultValue: '测速中' })}
                            </>
                          ) : delayState?.status === 'success' && delayState.delayMs != null ? (
                            `${delayState.delayMs} ms`
                          ) : delayState?.status === 'failed' ? (
                            t('mihomo.page.node.timeout', { defaultValue: '超时' })
                          ) : (
                            <>
                              <Gauge className="mr-1 h-3 w-3" />
                              {t('mihomo.page.node.test', { defaultValue: '测速' })}
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : null}
        </div>
      </div>

      <MihomoConnectDialog
        open={configOpen}
        onOpenChange={setConfigOpen}
        defaultMode="view"
        overview={overview}
        onConnected={() => {
          void loadOverview();
        }}
      />
    </div>
  );
}
