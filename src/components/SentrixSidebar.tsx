import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Bell,
  BookOpen,
  Boxes,
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ChevronsDown,
  ChevronsUp,
  Cpu,
  Database,
  DollarSign,
  FileCode2,
  FileText,
  Filter,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  Layers,
  Lock,
  Menu,
  Network,
  Package,
  PanelLeft,
  PanelLeftClose,
  Radio,
  Search,
  Server,
  Settings,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Sliders,
  Sparkles,
  Terminal,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { TabType, ParentGroupId } from './NavigationTabs';

export interface SentrixSidebarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  issueCount: number;
  predictiveAlertCount: number;
  activeWorkflowsCount: number;
  onOpenCopilot: () => void;
  onOpenSettings?: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
  theme?: 'dark' | 'light';
}

export interface SidebarCategory {
  id: ParentGroupId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  defaultTab: TabType;
  badge?: string | null;
  badgeColor?: string;
  items: {
    id: TabType;
    label: string;
    shortLabel?: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
    badgeColor?: string;
    description?: string;
  }[];
}

export const SentrixSidebar: React.FC<SentrixSidebarProps> = ({
  activeTab,
  onChangeTab,
  issueCount,
  predictiveAlertCount,
  activeWorkflowsCount,
  onOpenCopilot,
  onOpenSettings,
  isCollapsed = false,
  onToggleCollapse,
  isMobileOpen = false,
  onCloseMobile,
  theme = 'dark',
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredRailCategory, setHoveredRailCategory] = useState<string | null>(null);

  // Expanded categories state with default expanded parent of current activeTab
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'incidents-heal': true,
    'cicd-delivery': true,
    'k8s-infra': false,
    'observability': false,
    'security-zero-trust': false,
    'reliability-finops': false,
    'resilience-testing': false,
    'ai-engine': false,
  });

  const categories: SidebarCategory[] = useMemo(
    () => [
      {
        id: 'incidents-heal',
        label: 'Incidents & Healing',
        shortLabel: 'Incidents',
        icon: Flame,
        color: 'rose',
        defaultTab: 'incidents',
        badge: issueCount > 0 ? `${issueCount} Active` : null,
        badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse',
        items: [
          {
            id: 'incidents',
            label: 'Incident Hub & Timeline',
            shortLabel: 'Incident Hub',
            icon: Flame,
            badge: issueCount > 0 ? `${issueCount}` : null,
            badgeColor: 'bg-rose-500/20 text-rose-300',
            description: 'Live incident triage, active alerts, and correlation engine',
          },
          {
            id: 'rca',
            label: '1-Click Autonomous Heal',
            shortLabel: '1-Click Heal',
            icon: AlertOctagon,
            badge: 'Auto',
            badgeColor: 'bg-rose-500/20 text-rose-300',
            description: 'Automated root cause diagnostics and declarative remediation',
          },
          {
            id: 'failure-history',
            label: 'Failure History & RCA',
            shortLabel: 'Failure History',
            icon: ShieldAlert,
            description: 'Historic incident telemetry and deployment diff mapping',
          },
          {
            id: 'postmortem',
            label: 'Incident Post-Mortems',
            shortLabel: 'Post-Mortems',
            icon: FileText,
            badge: 'AI Draft',
            badgeColor: 'bg-purple-500/20 text-purple-300',
            description: 'Automated post-incident timeline generation and prevention checklist',
          },
          {
            id: 'policies',
            label: 'Auto-Heal Policy Rules',
            shortLabel: 'Policies',
            icon: ShieldCheck,
            badge: '5 Active',
            badgeColor: 'bg-emerald-500/20 text-emerald-300',
            description: 'Guardrails, rate limits, and remediation thresholds',
          },
        ],
      },
      {
        id: 'cicd-delivery',
        label: 'CI/CD & Delivery',
        shortLabel: 'CI/CD',
        icon: GitBranch,
        color: 'cyan',
        defaultTab: 'pipeline',
        badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount} Running` : null,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        items: [
          {
            id: 'pipeline',
            label: 'CI/CD Pipelines & Workflows',
            shortLabel: 'Pipelines',
            icon: GitBranch,
            badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount}` : 'Live',
            badgeColor: 'bg-cyan-500/20 text-cyan-300',
            description: 'GitHub Action stages, live duration anomalies, and runs',
          },
          {
            id: 'log-collector',
            label: 'Go Log Ingestion Service',
            shortLabel: 'Go Ingestion',
            icon: Terminal,
            badge: 'Stream',
            badgeColor: 'bg-indigo-500/20 text-indigo-300',
            description: 'High-throughput gRPC log streaming & secret redaction',
          },
          {
            id: 'tech-stack',
            label: 'Repo Tech Stack Discovery',
            shortLabel: 'Tech Stack',
            icon: FileCode2,
            description: 'Repository architecture scanning and framework detection',
          },
          {
            id: 'gitops',
            label: 'GitOps ArgoCD Sync',
            shortLabel: 'GitOps',
            icon: GitBranch,
            badge: 'Sync',
            badgeColor: 'bg-amber-500/20 text-amber-300',
            description: 'Declarative K8s manifest synchronization and drift checks',
          },
          {
            id: 'canary',
            label: 'Canary Traffic Control',
            shortLabel: 'Canary',
            icon: Sliders,
            badge: '25%',
            badgeColor: 'bg-indigo-500/20 text-indigo-300',
            description: 'Gradual rollouts, error budget gates, and auto-rollback',
          },
        ],
      },
      {
        id: 'k8s-infra',
        label: 'Kubernetes & Fleet',
        shortLabel: 'K8s Infra',
        icon: Boxes,
        color: 'blue',
        defaultTab: 'topology',
        items: [
          {
            id: 'topology',
            label: 'Cluster Topology Map',
            shortLabel: 'Cluster Map',
            icon: Boxes,
            description: 'Interactive node-to-pod hierarchical visualization and pod statuses',
          },
          {
            id: 'fleet',
            label: 'Multi-Cluster Fleet Manager',
            shortLabel: 'Fleet',
            icon: Globe,
            badge: 'GCP/AWS',
            badgeColor: 'bg-blue-500/20 text-blue-300',
            description: 'Federated control plane across multi-cloud clusters',
          },
          {
            id: 'helm',
            label: 'Helm Releases & CRDs',
            shortLabel: 'Helm / CRD',
            icon: Package,
            description: 'Package versioning, release history, and CRD manifests',
          },
          {
            id: 'autoscaling',
            label: 'KEDA Event Autoscaler',
            shortLabel: 'Autoscaler',
            icon: TrendingUp,
            badge: 'KEDA',
            badgeColor: 'bg-purple-500/20 text-purple-300',
            description: 'Event-driven auto-scaling down to zero pods',
          },
          {
            id: 'specs',
            label: 'Microservice Specifications',
            shortLabel: 'Service Specs',
            icon: FileCode2,
            description: 'OpenAPI specs, endpoints, and health probe definitions',
          },
        ],
      },
      {
        id: 'observability',
        label: 'Observability & APM',
        shortLabel: 'Observability',
        icon: Activity,
        color: 'indigo',
        defaultTab: 'traces',
        badge: predictiveAlertCount > 0 ? `${predictiveAlertCount} Alert` : null,
        badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse',
        items: [
          {
            id: 'traces',
            label: 'OTel Traces & Flamegraphs',
            shortLabel: 'Traces',
            icon: Activity,
            badge: 'Live',
            badgeColor: 'bg-indigo-500/20 text-indigo-300',
            description: 'OpenTelemetry spans, flamegraphs, and latency waterfalls',
          },
          {
            id: 'profiler',
            label: 'Language Runtime Profiler',
            shortLabel: 'Profiler',
            icon: Activity,
            description: 'CPU & memory flamegraphs for Go, Node, and Python services',
          },
          {
            id: 'predictive',
            label: 'Predictive OOM Radar',
            shortLabel: 'Predictive OOM',
            icon: TrendingUp,
            badge: predictiveAlertCount > 0 ? `${predictiveAlertCount}` : null,
            badgeColor: 'bg-amber-500/20 text-amber-300',
            description: 'AI-driven memory leak projection before OOM kills trigger',
          },
          {
            id: 'ebpf',
            label: 'eBPF Kernel Syscall Tracer',
            shortLabel: 'eBPF Tracer',
            icon: Flame,
            badge: 'Kernel',
            badgeColor: 'bg-rose-500/20 text-rose-300',
            description: 'Kernel-level socket, filesystem, and process telemetry',
          },
          {
            id: 'logs',
            label: 'Live Stream Log Console',
            shortLabel: 'Live Logs',
            icon: Terminal,
            description: 'Unified real-time cluster and container stdout/stderr feed',
          },
        ],
      },
      {
        id: 'security-zero-trust',
        label: 'Security & Zero-Trust',
        shortLabel: 'Security',
        icon: Shield,
        color: 'emerald',
        defaultTab: 'security',
        items: [
          {
            id: 'security',
            label: 'CVE Vulnerability Audit',
            shortLabel: 'Vulnerabilities',
            icon: ShieldCheck,
            badge: 'Falco',
            badgeColor: 'bg-rose-500/20 text-rose-300',
            description: 'Container image CVE scanning and CIS benchmark compliance',
          },
          {
            id: 'vault',
            label: 'Zero-Trust Secrets Vault',
            shortLabel: 'Secrets Vault',
            icon: Lock,
            badge: 'mTLS',
            badgeColor: 'bg-emerald-500/20 text-emerald-300',
            description: 'Dynamic secret rotation, auto-expiry, and access audit logs',
          },
          {
            id: 'mesh',
            label: 'Service Mesh & mTLS',
            shortLabel: 'Service Mesh',
            icon: Network,
            badge: '98% mTLS',
            badgeColor: 'bg-blue-500/20 text-blue-300',
            description: 'Istio/Cilium topology with mutual TLS encryption coverage',
          },
        ],
      },
      {
        id: 'reliability-finops',
        label: 'Reliability & FinOps',
        shortLabel: 'Reliability',
        icon: Gauge,
        color: 'purple',
        defaultTab: 'slo',
        items: [
          {
            id: 'slo',
            label: 'SLO & Error Budget Tracker',
            shortLabel: 'SLO Budgets',
            icon: Gauge,
            badge: '99.9%',
            badgeColor: 'bg-purple-500/20 text-purple-300',
            description: 'Service level objectives, burn rate alerts, and freeze gates',
          },
          {
            id: 'alerts',
            label: 'Alert Integrations Hub',
            shortLabel: 'Alert Hub',
            icon: Bell,
            badge: 'PD/Slack',
            badgeColor: 'bg-amber-500/20 text-amber-300',
            description: 'PagerDuty, Slack, OpsGenie, and webhook notification routes',
          },
          {
            id: 'finops',
            label: 'FinOps Cost Optimization',
            shortLabel: 'FinOps Save',
            icon: DollarSign,
            badge: 'Save $860',
            badgeColor: 'bg-emerald-500/20 text-emerald-300',
            description: 'Resource right-sizing, idle pod waste, and namespace costs',
          },
          {
            id: 'production-readiness',
            label: 'Production Readiness Hub',
            shortLabel: 'SaaS Ready',
            icon: Server,
            badge: 'Verified',
            badgeColor: 'bg-emerald-500/20 text-emerald-300',
            description: 'Operational checklist, HA failover, and telemetry checks',
          },
        ],
      },
      {
        id: 'resilience-testing',
        label: 'Resilience & Testing',
        shortLabel: 'Resilience',
        icon: Zap,
        color: 'amber',
        defaultTab: 'runbooks',
        items: [
          {
            id: 'runbooks',
            label: 'Runbook Automation Studio',
            shortLabel: 'Runbooks',
            icon: BookOpen,
            badge: '1-Click',
            badgeColor: 'bg-blue-500/20 text-blue-300',
            description: 'Automated remediation workflows and runbook execution',
          },
          {
            id: 'chaos',
            label: 'Chaos Engineering Sandbox',
            shortLabel: 'Chaos Test',
            icon: Flame,
            badge: 'Sandbox',
            badgeColor: 'bg-rose-500/20 text-rose-300',
            description: 'Pod kill, latency injection, and partition experiments',
          },
          {
            id: 'loadtest',
            label: 'Continuous Load RPS Harness',
            shortLabel: 'Load Harness',
            icon: Zap,
            description: 'Simulated high traffic stress testing and performance curves',
          },
          {
            id: 'dr',
            label: 'Multi-Region DR Failover',
            shortLabel: 'DR Failover',
            icon: Shuffle,
            badge: 'RTO 45s',
            badgeColor: 'bg-indigo-500/20 text-indigo-300',
            description: 'Cross-region traffic failover and state replication checks',
          },
        ],
      },
      {
        id: 'ai-engine',
        label: 'AI Copilot & Models',
        shortLabel: 'AI Engine',
        icon: Sparkles,
        color: 'emerald',
        defaultTab: 'copilot',
        items: [
          {
            id: 'copilot',
            label: 'AI SRE Copilot Assistant',
            shortLabel: 'SRE Copilot',
            icon: Sparkles,
            badge: 'GenAI',
            badgeColor: 'bg-emerald-500/20 text-emerald-300',
            description: 'Intelligent triage, kubectl synthesis, and log diagnostics',
          },
          {
            id: 'model-switch',
            label: 'AI Key & Model Switcher',
            shortLabel: 'Model Switch',
            icon: Cpu,
            badge: 'Multi-Model',
            badgeColor: 'bg-cyan-500/20 text-cyan-300',
            description: 'Switch between Gemini 3.7, NVIDIA NIM, and Cursor bridge',
          },
        ],
      },
    ],
    [issueCount, predictiveAlertCount, activeWorkflowsCount]
  );

  // Automatically expand the parent category that holds the activeTab
  useEffect(() => {
    for (const cat of categories) {
      if (cat.items.some((item) => item.id === activeTab)) {
        setExpandedCategories((prev) => ({ ...prev, [cat.id]: true }));
        break;
      }
    }
  }, [activeTab, categories]);

  const toggleCategory = (catId: string) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const handleExpandAll = () => {
    const nextState: Record<string, boolean> = {};
    categories.forEach((c) => {
      nextState[c.id] = true;
    });
    setExpandedCategories(nextState);
  };

  const handleCollapseAll = () => {
    const nextState: Record<string, boolean> = {};
    categories.forEach((c) => {
      nextState[c.id] = false;
    });
    setExpandedCategories(nextState);
  };

  const filteredCategories = useMemo(() => {
    if (!searchFilter.trim()) return categories;
    const q = searchFilter.toLowerCase();
    return categories
      .map((cat) => {
        const matchesCategory =
          cat.label.toLowerCase().includes(q) || cat.shortLabel.toLowerCase().includes(q);
        const matchingItems = cat.items.filter(
          (item) =>
            item.label.toLowerCase().includes(q) ||
            item.id.toLowerCase().includes(q) ||
            (item.description && item.description.toLowerCase().includes(q))
        );
        if (matchesCategory || matchingItems.length > 0) {
          return {
            ...cat,
            items: matchesCategory ? cat.items : matchingItems,
          };
        }
        return null;
      })
      .filter(Boolean) as SidebarCategory[];
  }, [categories, searchFilter]);

  const isLight = theme === 'light';

  const sidebarContent = (
    <div
      className={`h-full flex flex-col justify-between select-none ${
        isLight
          ? 'bg-white border-r border-slate-200 text-slate-900'
          : 'bg-[#090b10] border-r border-[#161a26] text-white'
      } transition-colors duration-200`}
    >
      {/* 1. Header / Brand Bar */}
      <div className={`p-3.5 border-b ${isLight ? 'border-slate-200' : 'border-[#161a26]'}`}>
        <div className="flex items-center justify-between gap-2">
          <div
            className="flex items-center gap-2.5 cursor-pointer group min-w-0"
            onClick={() => {
              onChangeTab('incidents');
              if (onCloseMobile) onCloseMobile();
            }}
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="text-sm font-extrabold tracking-tight font-display flex items-center gap-1.5 truncate">
                  <span className={isLight ? 'text-slate-900' : 'text-white'}>SentriX</span>
                  <span className="px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 text-[9px] font-mono border border-emerald-500/30">
                    v2.5
                  </span>
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 font-mono -mt-0.5">
                  COMMAND CENTER
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center gap-1">
            {onToggleCollapse && !isMobileOpen && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className={`p-1.5 rounded-lg text-slate-400 hover:text-white ${
                  isLight ? 'hover:bg-slate-100 hover:text-slate-900' : 'hover:bg-[#161a26]'
                } transition-colors`}
                title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar to Rail'}
              >
                {isCollapsed ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>
            )}

            {isMobileOpen && onCloseMobile && (
              <button
                type="button"
                onClick={onCloseMobile}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Search Bar & Quick Controls (Expanded View) */}
        {!isCollapsed && (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search 34 pages & tools..."
                className={`w-full pl-8 pr-7 py-1.5 ${
                  isLight
                    ? 'bg-slate-100 border-slate-300 text-slate-900 placeholder-slate-400 focus:bg-white'
                    : 'bg-[#121622] border-[#242b3d] text-white placeholder-slate-500 focus:bg-[#151a29]'
                } border rounded-xl text-xs focus:outline-none focus:border-emerald-500 transition-all`}
              />
              {searchFilter && (
                <button
                  onClick={() => setSearchFilter('')}
                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 font-semibold">
              <span>8 CATEGORIES • 34 PAGES</span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExpandAll}
                  className="hover:text-emerald-400 transition-colors cursor-pointer flex items-center gap-0.5"
                  title="Expand all parent categories"
                >
                  <ChevronsDown className="w-3 h-3" />
                  <span>Expand</span>
                </button>
                <span>•</span>
                <button
                  type="button"
                  onClick={handleCollapseAll}
                  className="hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-0.5"
                  title="Collapse all parent categories"
                >
                  <ChevronsUp className="w-3 h-3" />
                  <span>Collapse</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 2. Parent-Child Navigation Body */}
      <div className="p-2 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
        {filteredCategories.map((cat) => {
          const CategoryIcon = cat.icon;
          const isCategoryActive = cat.items.some((item) => item.id === activeTab);
          const isExpanded = searchFilter ? true : expandedCategories[cat.id];

          // If Collapsed Rail Mode: Show Icon with Flyout
          if (isCollapsed) {
            return (
              <div
                key={cat.id}
                className="relative flex justify-center py-1"
                onMouseEnter={() => setHoveredRailCategory(cat.id)}
                onMouseLeave={() => setHoveredRailCategory(null)}
              >
                <button
                  type="button"
                  onClick={() => {
                    onChangeTab(cat.defaultTab);
                    if (onCloseMobile) onCloseMobile();
                  }}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all relative ${
                    isCategoryActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                      : isLight
                      ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      : 'text-slate-400 hover:bg-[#121622] hover:text-white'
                  }`}
                  title={`${cat.label} (${cat.items.length} pages)`}
                >
                  <CategoryIcon className="w-5 h-5" />
                  {cat.badge && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-rose-500 animate-pulse ring-2 ring-[#090b10]" />
                  )}
                </button>

                {/* Floating Rail Hover Flyout */}
                {hoveredRailCategory === cat.id && (
                  <div
                    className={`absolute left-full top-0 ml-2 w-64 rounded-xl border shadow-2xl p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150 ${
                      isLight
                        ? 'bg-white border-slate-200 text-slate-900'
                        : 'bg-[#10131c] border-[#22293a] text-white'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
                      <div className="flex items-center gap-2 text-xs font-bold font-display text-emerald-400">
                        <CategoryIcon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {cat.items.length} pages
                      </span>
                    </div>

                    <div className="space-y-1">
                      {cat.items.map((item) => {
                        const ItemIcon = item.icon;
                        const isItemActive = activeTab === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => {
                              onChangeTab(item.id);
                              setHoveredRailCategory(null);
                              if (onCloseMobile) onCloseMobile();
                            }}
                            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left ${
                              isItemActive
                                ? 'bg-emerald-500/20 text-emerald-400 font-bold border border-emerald-500/40'
                                : isLight
                                ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                                : 'text-slate-300 hover:bg-[#161d2c] hover:text-white'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <ItemIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                              <span className="truncate">{item.label}</span>
                            </div>
                            {item.badge && (
                              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-slate-800 text-slate-300">
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          // Full Expanded Sidebar View with Parent-Child Hierarchy
          return (
            <div
              key={cat.id}
              className={`rounded-xl border transition-all ${
                isCategoryActive
                  ? isLight
                    ? 'bg-slate-50 border-slate-300 shadow-xs'
                    : 'bg-[#0e131d]/90 border-[#222a3d]'
                  : isLight
                  ? 'border-transparent hover:border-slate-200'
                  : 'border-transparent hover:border-[#181f2f]'
              }`}
            >
              {/* Parent Category Header Row */}
              <div
                className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer select-none ${
                  isCategoryActive
                    ? isLight
                      ? 'text-slate-900 font-extrabold'
                      : 'text-white'
                    : isLight
                    ? 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                    : 'text-slate-300 hover:bg-[#121622] hover:text-white'
                }`}
                onClick={() => {
                  if (!searchFilter) {
                    toggleCategory(cat.id);
                  }
                  // If not already in this category, switch to its default tab
                  if (!cat.items.some((item) => item.id === activeTab)) {
                    onChangeTab(cat.defaultTab);
                  }
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {/* Left Category Icon with glow */}
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors shrink-0 ${
                      isCategoryActive
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : isLight
                        ? 'bg-slate-200 text-slate-600'
                        : 'bg-[#151b28] text-slate-400'
                    }`}
                  >
                    <CategoryIcon className="w-3.5 h-3.5" />
                  </div>

                  <div className="truncate">
                    <span className="truncate">{cat.label}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-1">
                  {cat.badge && (
                    <span
                      className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${cat.badgeColor}`}
                    >
                      {cat.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(cat.id);
                    }}
                    className={`p-1 rounded-md transition-colors ${
                      isLight
                        ? 'text-slate-500 hover:bg-slate-200'
                        : 'text-slate-400 hover:bg-[#1a2130] hover:text-slate-200'
                    }`}
                    title={isExpanded ? 'Collapse sub-pages' : 'Expand sub-pages'}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Child Sub-Pages List (Accordion Tree) */}
              {isExpanded && (
                <div
                  className={`mt-0.5 ml-4 pl-2 border-l ${
                    isLight ? 'border-slate-300' : 'border-slate-800'
                  } space-y-0.5 py-1 pr-1`}
                >
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          onChangeTab(item.id);
                          if (onCloseMobile) onCloseMobile();
                        }}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-medium transition-all duration-150 text-left group cursor-pointer ${
                          isItemActive
                            ? isLight
                              ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-400 shadow-xs'
                              : 'bg-[#0e241c] text-[#10b981] font-bold border border-[#10b981]/50 shadow-xs shadow-emerald-500/20'
                            : isLight
                            ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#121622]'
                        }`}
                        title={item.description || item.label}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <ItemIcon
                            className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                              isItemActive
                                ? 'text-emerald-400'
                                : 'text-slate-400 group-hover:text-slate-300'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`ml-1 px-1.5 py-0.2 text-[9px] font-bold rounded-full shrink-0 ${
                              isItemActive
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.badgeColor || (isLight ? 'bg-slate-200 text-slate-700' : 'bg-slate-800 text-slate-300')
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 3. Bottom Utility & AI Assistant Launcher */}
      {!isCollapsed && (
        <div className={`p-3 border-t ${isLight ? 'border-slate-200' : 'border-[#161a26]'} space-y-2`}>
          <div
            className={`p-2.5 rounded-2xl ${
              isLight
                ? 'bg-slate-50 border border-emerald-300 shadow-xs'
                : 'bg-[#0c1417] border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]'
            } space-y-2`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-display">
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>AI SRE Copilot</span>
              </div>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Online
              </span>
            </div>
            <p className={`text-[10px] leading-snug ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
              Autonomous threat remediation, real-time OOM projection & kubectl agent.
            </p>
            <button
              type="button"
              onClick={() => {
                onOpenCopilot();
                if (onCloseMobile) onCloseMobile();
              }}
              className="w-full py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all font-display flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Launch Copilot</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If mobile drawer open, wrap with backdrop
  if (isMobileOpen) {
    return (
      <div className="fixed inset-0 z-50 flex lg:hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
          onClick={onCloseMobile}
        />
        {/* Drawer content */}
        <div className="relative w-80 max-w-[85vw] h-full shadow-2xl z-10 animate-in slide-in-from-left duration-200">
          {sidebarContent}
        </div>
      </div>
    );
  }

  // Desktop Static Sidebar
  return (
    <aside
      className={`${
        isCollapsed ? 'w-[72px]' : 'w-72'
      } shrink-0 h-screen sticky top-0 z-30 transition-all duration-200`}
    >
      {sidebarContent}
    </aside>
  );
};
