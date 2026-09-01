import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Check,
  ChevronRight,
  Command,
  Cpu,
  DollarSign,
  FileCode2,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  Layers,
  Lock,
  Moon,
  Network,
  Package,
  Plus,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Sliders,
  Sparkles,
  Sun,
  Terminal,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { TabType } from './NavigationTabs';

interface CommandItem {
  id: string;
  category: 'Navigation' | 'Actions' | 'Clusters' | 'Models' | 'Security';
  label: string;
  sublabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  keywords?: string[];
  shortcut?: string;
  badge?: string;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToTab: (tab: TabType) => void;
  onSimulateIncident: (type: string) => void;
  onTriggerPipeline: () => void;
  onToggleTheme?: () => void;
  onOpenRepoSync?: () => void;
  onOpenClusterModal?: () => void;
  onRefresh?: () => void;
  onClearDemoData?: () => void;
  theme?: 'dark' | 'light';
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigateToTab,
  onSimulateIncident,
  onTriggerPipeline,
  onToggleTheme,
  onOpenRepoSync,
  onOpenClusterModal,
  onRefresh,
  onClearDemoData,
  theme = 'dark',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isLight = theme === 'light';

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  const commandList: CommandItem[] = useMemo(() => {
    return [
      // Navigation Pages
      {
        id: 'nav-incidents',
        category: 'Navigation',
        label: 'Incident Hub & Live Triage',
        sublabel: 'Active alerts, diagnostic issues, and correlation engine',
        icon: Flame,
        action: () => onNavigateToTab('incidents'),
        keywords: ['incidents', 'issues', 'outages', 'alerts', 'down'],
        shortcut: 'G I',
      },
      {
        id: 'nav-rca',
        category: 'Navigation',
        label: '1-Click Autonomous RCA & Heal',
        sublabel: 'Root cause synthesis and instant mitigation playbooks',
        icon: AlertOctagon,
        action: () => onNavigateToTab('rca'),
        keywords: ['heal', 'rca', 'remediate', 'fix', 'ai root cause'],
      },
      {
        id: 'nav-pipeline',
        category: 'Navigation',
        label: 'CI/CD Pipeline Monitor',
        sublabel: 'GitHub Actions workflow runs, stage waterfalls, duration anomaly detector',
        icon: GitBranch,
        action: () => onNavigateToTab('pipeline'),
        keywords: ['pipeline', 'ci/cd', 'github actions', 'builds', 'deployments'],
        shortcut: 'G P',
      },
      {
        id: 'nav-topology',
        category: 'Navigation',
        label: 'Cluster Topology Map',
        sublabel: 'Real-time node-to-pod interactive visual graph and memory heatmap',
        icon: Boxes,
        action: () => onNavigateToTab('topology'),
        keywords: ['topology', 'nodes', 'pods', 'k8s graph', 'cluster visual'],
        shortcut: 'G T',
      },
      {
        id: 'nav-traces',
        category: 'Navigation',
        label: 'Distributed Tracing & APM',
        sublabel: 'OTel trace waterfalls, spans, and eBPF flamegraphs',
        icon: Activity,
        action: () => onNavigateToTab('traces'),
        keywords: ['traces', 'opentelemetry', 'otel', 'latency', 'spans'],
      },
      {
        id: 'nav-predictive',
        category: 'Navigation',
        label: 'Predictive OOM Radar',
        sublabel: 'Time-to-exhaustion AI memory leak prediction radar',
        icon: TrendingUp,
        action: () => onNavigateToTab('predictive'),
        keywords: ['predictive', 'oom', 'memory leak', 'exhaustion', 'radar'],
      },
      {
        id: 'nav-security',
        category: 'Navigation',
        label: 'Security & CVE Compliance Audit',
        sublabel: 'Trivy/Grype CVE vulnerability auditing and CIS benchmarks',
        icon: ShieldCheck,
        action: () => onNavigateToTab('security'),
        keywords: ['security', 'cve', 'vulnerabilities', 'falco', 'trivy', 'grype'],
      },
      {
        id: 'nav-vault',
        category: 'Navigation',
        label: 'Zero-Trust Secrets Vault',
        sublabel: 'Automated secret rotation, access revocation, and zero-trust credentials',
        icon: Lock,
        action: () => onNavigateToTab('vault'),
        keywords: ['vault', 'secrets', 'keys', 'encryption', 'zero trust'],
      },
      {
        id: 'nav-mesh',
        category: 'Navigation',
        label: 'Service Mesh & mTLS',
        sublabel: 'Istio service mesh network topology and strict mTLS status',
        icon: Network,
        action: () => onNavigateToTab('mesh'),
        keywords: ['mesh', 'istio', 'mtls', 'envoy', 'service mesh'],
      },
      {
        id: 'nav-finops',
        category: 'Navigation',
        label: 'FinOps Cost Optimization',
        sublabel: 'Kubecost namespace spend breakdowns, idle waste, right-sizing',
        icon: DollarSign,
        action: () => onNavigateToTab('finops'),
        keywords: ['finops', 'cost', 'spend', 'kubecost', 'savings'],
      },
      {
        id: 'nav-copilot',
        category: 'Navigation',
        label: 'AI SRE Copilot Chat',
        sublabel: 'Natural language telemetry diagnostics and runbook assistant',
        icon: Bot,
        action: () => onNavigateToTab('copilot'),
        keywords: ['copilot', 'ai chat', 'gemini', 'assistant', 'sre copilot'],
        shortcut: 'G C',
      },
      {
        id: 'nav-ebpf',
        category: 'Navigation',
        label: 'eBPF Kernel Tracer',
        sublabel: 'Zero-instrumentation syscall, socket, and packet drop telemetry',
        icon: Flame,
        action: () => onNavigateToTab('ebpf'),
        keywords: ['ebpf', 'kernel', 'syscalls', 'tcp', 'network drop'],
      },
      {
        id: 'nav-runbooks',
        category: 'Navigation',
        label: 'Runbook Automation Studio',
        sublabel: 'Declarative automated remediation playbooks and step executor',
        icon: BookOpen,
        action: () => onNavigateToTab('runbooks'),
        keywords: ['runbooks', 'playbooks', 'automation', 'scripts'],
      },
      {
        id: 'nav-fleet',
        category: 'Navigation',
        label: 'Multi-Cluster Fleet Manager',
        sublabel: 'Cross-cloud unified Kubernetes management (GKE, EKS, AKS, Bare-metal)',
        icon: Globe,
        action: () => onNavigateToTab('fleet'),
        keywords: ['fleet', 'clusters', 'gke', 'eks', 'multi-cloud'],
      },

      // Quick Operational Actions
      {
        id: 'act-dispatch-pipeline',
        category: 'Actions',
        label: 'Dispatch CI/CD Workflow Run',
        sublabel: 'Trigger automated build, lint, and progressive deployment',
        icon: Zap,
        action: () => onTriggerPipeline(),
        keywords: ['trigger pipeline', 'build', 'deploy', 'github dispatch'],
      },
      {
        id: 'act-simulate-oom',
        category: 'Actions',
        label: 'Simulate Pod Memory Spike / OOM Event',
        sublabel: 'Inject synthetic memory load to test predictive OOM radar',
        icon: AlertTriangle,
        action: () => onSimulateIncident('memory'),
        keywords: ['simulate oom', 'memory test', 'chaos oom'],
      },
      {
        id: 'act-simulate-ddos',
        category: 'Actions',
        label: 'Simulate Network Partition & Traffic Spike',
        sublabel: 'Inject synthetic latency and packet drop anomaly',
        icon: Flame,
        action: () => onSimulateIncident('ddos'),
        keywords: ['simulate ddos', 'chaos network', 'traffic test'],
      },
      {
        id: 'act-refresh-telemetry',
        category: 'Actions',
        label: 'Force Refresh Live Telemetry',
        sublabel: 'Poll all cluster nodes, pods, and GitHub workflow endpoints',
        icon: RefreshCw,
        action: () => onRefresh?.(),
        keywords: ['refresh', 'reload', 'sync', 'poll'],
        shortcut: 'R',
      },
      {
        id: 'act-sync-github',
        category: 'Actions',
        label: 'Connect GitHub Repository (PAT / OAuth)',
        sublabel: 'Sync live commits, workflow logs, and Dockerfiles',
        icon: GitBranch,
        action: () => onOpenRepoSync?.(),
        keywords: ['github sync', 'connect repo', 'personal access token'],
      },
      {
        id: 'act-register-cluster',
        category: 'Actions',
        label: 'Register New Kubernetes Cluster (Kubeconfig)',
        sublabel: 'Attach GKE, EKS, AKS or bare-metal cluster via token/config',
        icon: Plus,
        action: () => onOpenClusterModal?.(),
        keywords: ['register cluster', 'kubeconfig', 'add cluster', 'gke'],
      },
      {
        id: 'act-toggle-theme',
        category: 'Actions',
        label: `Switch Theme to ${isLight ? 'Dark Luxury' : 'Clean Light'} Mode`,
        sublabel: 'Toggle application color mode palette',
        icon: isLight ? Moon : Sun,
        action: () => onToggleTheme?.(),
        keywords: ['theme', 'dark mode', 'light mode', 'switch color'],
      },
      {
        id: 'act-clear-demo',
        category: 'Actions',
        label: 'Purge Demo Data / Enter Pure Live Mode',
        sublabel: 'Wipe mock data and run strictly on live cluster REST APIs',
        icon: Trash2,
        action: () => onClearDemoData?.(),
        keywords: ['clear demo', 'pure live mode', 'purge mock'],
      },
    ];
  }, [
    isLight,
    onNavigateToTab,
    onSimulateIncident,
    onTriggerPipeline,
    onRefresh,
    onOpenRepoSync,
    onOpenClusterModal,
    onToggleTheme,
    onClearDemoData,
  ]);

  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commandList;
    const q = query.toLowerCase().trim();
    return commandList.filter((item) => {
      const matchLabel = item.label.toLowerCase().includes(q);
      const matchSublabel = item.sublabel?.toLowerCase().includes(q);
      const matchCategory = item.category.toLowerCase().includes(q);
      const matchKeywords = item.keywords?.some((k) => k.toLowerCase().includes(q));
      return matchLabel || matchSublabel || matchCategory || matchKeywords;
    });
  }, [commandList, query]);

  // Group commands by category
  const groupedCommands = useMemo<Record<string, CommandItem[]>>(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filteredCommands) {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    }
    return groups;
  }, [filteredCommands]);

  const flatGrouped = useMemo<CommandItem[]>(() => {
    const list: CommandItem[] = [];
    Object.values(groupedCommands).forEach((items: CommandItem[]) => list.push(...items));
    return list;
  }, [groupedCommands]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, flatGrouped.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatGrouped.length) % Math.max(1, flatGrouped.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = flatGrouped[selectedIndex];
      if (target) {
        target.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Dim backdrop */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Center Spotlight Card */}
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 sm:pt-28 px-4 pointer-events-none">
        <div
          className={`pointer-events-auto w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden flex flex-col transition-all animate-in fade-in zoom-in-95 duration-150 ${
            isLight
              ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/20 backdrop-blur-2xl'
              : 'bg-[#0e121b]/95 border-[#222a3d] text-white shadow-black/80 backdrop-blur-2xl'
          }`}
        >
          {/* Search Input Bar */}
          <div
            className={`flex items-center gap-3 px-4 py-3.5 border-b ${
              isLight ? 'border-slate-200 bg-slate-50/50' : 'border-[#1b2234] bg-[#0a0d14]'
            }`}
          >
            <Search className="w-5 h-5 text-emerald-400 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setSelectedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder="Type a command, search modules, or inspect services... (e.g. Incidents, Heal, Topology, OOM)"
              className={`w-full bg-transparent text-sm focus:outline-hidden font-medium ${
                isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-500'
              }`}
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="p-1 rounded-md text-slate-400 hover:text-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            ) : (
              <kbd className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800 text-slate-400 border border-slate-700">
                ESC
              </kbd>
            )}
          </div>

          {/* Results List */}
          <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2 space-y-3">
            {flatGrouped.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <Search className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-slate-300">No matching commands found</p>
                <p className="text-xs text-slate-500">
                  Try searching for keywords like "incident", "canary", "pipeline", "vault", or "finops".
                </p>
              </div>
            ) : (
              (Object.entries(groupedCommands) as [string, CommandItem[]][]).map(([category, items]) => (
                <div key={category} className="space-y-1">
                  <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 px-3 py-1 font-mono">
                    {category}
                  </div>
                  {items.map((item) => {
                    const currentIndex = flatGrouped.indexOf(item);
                    const isSelected = currentIndex === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          item.action();
                          onClose();
                        }}
                        onMouseEnter={() => setSelectedIndex(currentIndex)}
                        className={`px-3 py-2.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                          isSelected
                            ? isLight
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-950 shadow-xs'
                              : 'bg-emerald-500/15 border-emerald-500/40 text-white shadow-xs'
                            : isLight
                            ? 'bg-transparent border-transparent text-slate-700 hover:bg-slate-100'
                            : 'bg-transparent border-transparent text-slate-300 hover:bg-[#131824]'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-lg border shrink-0 transition-colors ${
                              isSelected
                                ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                                : isLight
                                ? 'bg-slate-100 border-slate-200 text-slate-600'
                                : 'bg-[#141926] border-[#222b3e] text-slate-400'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-xs flex items-center gap-2">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            {item.sublabel && (
                              <p className="text-[11px] text-slate-400 truncate mt-0.5 font-normal">
                                {item.sublabel}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.shortcut && (
                            <kbd className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-slate-800/80 text-slate-400 border border-slate-700">
                              {item.shortcut}
                            </kbd>
                          )}
                          <ChevronRight
                            className={`w-4 h-4 transition-transform ${
                              isSelected ? 'text-emerald-400 translate-x-0.5' : 'text-slate-600'
                            }`}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer Guide */}
          <div
            className={`px-4 py-2.5 border-t flex items-center justify-between text-[11px] text-slate-400 ${
              isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1b2234] bg-[#0a0d14]'
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[9px]">
                  ↑↓
                </kbd>{' '}
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[9px]">
                  ↵
                </kbd>{' '}
                Select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[9px]">
                  esc
                </kbd>{' '}
                Close
              </span>
            </div>
            <span className="font-mono text-[10px] text-emerald-400 font-semibold">SentriX Enterprise SRE</span>
          </div>
        </div>
      </div>
    </>
  );
};
