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
  Cpu,
  Database,
  DollarSign,
  FileCode2,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  Layers,
  Lock,
  Network,
  Package,
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

interface SentrixSidebarProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  issueCount: number;
  predictiveAlertCount: number;
  activeWorkflowsCount: number;
  onOpenCopilot: () => void;
  onOpenSettings?: () => void;
}

interface SidebarCategory {
  id: ParentGroupId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultTab: TabType;
  badge?: string | null;
  badgeColor?: string;
  items: {
    id: TabType;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string | null;
    badgeColor?: string;
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
}) => {
  const [searchFilter, setSearchFilter] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    'incidents-heal': true,
    'cicd-delivery': false,
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
        icon: Flame,
        defaultTab: 'incidents',
        badge: issueCount > 0 ? `${issueCount}` : null,
        badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse',
        items: [
          { id: 'incidents', label: 'Incident Hub', icon: Flame, badge: issueCount > 0 ? `${issueCount}` : null, badgeColor: 'bg-rose-500/20 text-rose-300' },
          { id: 'rca', label: '1-Click Heal', icon: AlertOctagon, badge: 'Auto', badgeColor: 'bg-rose-500/20 text-rose-300' },
          { id: 'failure-history', label: 'Failure History', icon: ShieldAlert },
          { id: 'postmortem', label: 'Post-Mortems', icon: FileText },
          { id: 'policies', label: 'Auto-Heal Policies', icon: ShieldCheck, badge: '5', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
        ],
      },
      {
        id: 'cicd-delivery',
        label: 'CI/CD & Delivery',
        icon: GitBranch,
        defaultTab: 'pipeline',
        badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount}` : null,
        badgeColor: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30',
        items: [
          { id: 'pipeline', label: 'CI/CD Pipelines', icon: GitBranch, badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount}` : null, badgeColor: 'bg-cyan-500/20 text-cyan-300' },
          { id: 'log-collector', label: 'Go Log Ingestion', icon: Terminal, badge: 'Stream', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
          { id: 'tech-stack', label: 'Repo Tech Stack', icon: FileCode2 },
          { id: 'gitops', label: 'GitOps ArgoCD', icon: GitBranch, badge: 'Sync', badgeColor: 'bg-amber-500/20 text-amber-300' },
          { id: 'canary', label: 'Canary Deploy', icon: Sliders, badge: '25%', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
        ],
      },
      {
        id: 'k8s-infra',
        label: 'Kubernetes & Fleet',
        icon: Boxes,
        defaultTab: 'topology',
        items: [
          { id: 'topology', label: 'Cluster Map', icon: Boxes },
          { id: 'fleet', label: 'Multi-Cluster Fleet', icon: Globe, badge: 'GCP/AWS', badgeColor: 'bg-blue-500/20 text-blue-300' },
          { id: 'helm', label: 'Helm & CRDs', icon: Package },
          { id: 'autoscaling', label: 'KEDA Autoscaler', icon: TrendingUp, badge: 'KEDA', badgeColor: 'bg-purple-500/20 text-purple-300' },
          { id: 'specs', label: 'Service Specs', icon: FileCode2 },
        ],
      },
      {
        id: 'observability',
        label: 'Observability & APM',
        icon: Activity,
        defaultTab: 'traces',
        badge: predictiveAlertCount > 0 ? `${predictiveAlertCount}` : null,
        badgeColor: 'bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-pulse',
        items: [
          { id: 'traces', label: 'OTel Traces & APM', icon: Activity, badge: 'Live', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
          { id: 'profiler', label: 'Language Profiler', icon: Activity },
          { id: 'predictive', label: 'Predictive OOM Radar', icon: TrendingUp, badge: predictiveAlertCount > 0 ? `${predictiveAlertCount}` : null, badgeColor: 'bg-amber-500/20 text-amber-300' },
          { id: 'ebpf', label: 'eBPF Kernel Tracer', icon: Flame },
          { id: 'logs', label: 'Live Stream Logs', icon: Terminal },
        ],
      },
      {
        id: 'security-zero-trust',
        label: 'Security & Trust',
        icon: Shield,
        defaultTab: 'security',
        items: [
          { id: 'security', label: 'Vulnerabilities & CVE', icon: ShieldCheck, badge: 'Falco', badgeColor: 'bg-rose-500/20 text-rose-300' },
          { id: 'vault', label: 'Zero-Trust Vault', icon: Lock, badge: 'mTLS', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
          { id: 'mesh', label: 'Service Mesh Network', icon: Network },
        ],
      },
      {
        id: 'reliability-finops',
        label: 'Reliability & FinOps',
        icon: Gauge,
        defaultTab: 'slo',
        items: [
          { id: 'slo', label: 'SLO & Burn Rates', icon: Gauge, badge: '99.9%', badgeColor: 'bg-purple-500/20 text-purple-300' },
          { id: 'alerts', label: 'Alert Integrations', icon: Bell, badge: 'PD/Slack', badgeColor: 'bg-amber-500/20 text-amber-300' },
          { id: 'finops', label: 'FinOps & Cost Save', icon: DollarSign, badge: '$860/mo', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
          { id: 'production-readiness', label: 'Production SaaS Hub', icon: Server },
        ],
      },
      {
        id: 'resilience-testing',
        label: 'Resilience & Testing',
        icon: Zap,
        defaultTab: 'runbooks',
        items: [
          { id: 'runbooks', label: 'Runbook Studio', icon: BookOpen },
          { id: 'chaos', label: 'Chaos Sandbox', icon: Flame, badge: 'Test', badgeColor: 'bg-rose-500/20 text-rose-300' },
          { id: 'loadtest', label: 'Load RPS Harness', icon: Zap },
          { id: 'dr', label: 'Multi-Region DR Hub', icon: Shuffle },
        ],
      },
      {
        id: 'ai-engine',
        label: 'AI Copilot & Models',
        icon: Sparkles,
        defaultTab: 'copilot',
        items: [
          { id: 'copilot', label: 'AI SRE Copilot', icon: Sparkles, badge: 'Copilot', badgeColor: 'bg-purple-500/20 text-purple-300' },
          { id: 'model-switch', label: 'AI Key & Model Detector', icon: Cpu, badge: 'Key Inspect', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
        ],
      },
    ],
    [issueCount, predictiveAlertCount, activeWorkflowsCount]
  );

  // Automatically expand the category that holds the activeTab
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

  const filteredCategories = useMemo(() => {
    if (!searchFilter.trim()) return categories;
    const q = searchFilter.toLowerCase();
    return categories
      .map((cat) => {
        const matchesCategory = cat.label.toLowerCase().includes(q);
        const matchingItems = cat.items.filter((item) =>
          item.label.toLowerCase().includes(q) || item.id.toLowerCase().includes(q)
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

  return (
    <aside className="w-64 bg-[#090b10] border-r border-[#161a26] text-white flex flex-col justify-between shrink-0 h-screen sticky top-0 z-40 select-none transition-all">
      {/* Top Brand Header */}
      <div className="p-4 border-b border-[#161a26]">
        <div
          className="flex items-center gap-3 cursor-pointer group"
          onClick={() => onChangeTab('incidents')}
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.3)] group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-base font-extrabold tracking-tight text-white font-display flex items-center gap-1.5">
              <span>SentriX</span>
              <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-mono border border-emerald-500/30">
                v2.5
              </span>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-400 font-mono -mt-0.5">
              COMMAND CENTER
            </div>
          </div>
        </div>

        {/* Quick Filter Input */}
        <div className="mt-3 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter 34 modules..."
            className="w-full pl-8 pr-7 py-1.5 bg-[#121622] border border-[#242b3d] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
          />
          {searchFilter && (
            <button
              onClick={() => setSearchFilter('')}
              className="absolute right-2 top-2 text-slate-500 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Navigation Grouped Accordion List */}
      <div className="p-3 space-y-1.5 overflow-y-auto flex-1 custom-scrollbar">
        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
          <span>MODULE CATEGORIES</span>
          <span className="font-mono text-[9px] text-slate-600">8 PARENTS • 34 TABS</span>
        </div>

        {filteredCategories.map((cat) => {
          const CategoryIcon = cat.icon;
          const isCategoryActive = cat.items.some((item) => item.id === activeTab);
          const isExpanded = searchFilter ? true : expandedCategories[cat.id];

          return (
            <div key={cat.id} className="rounded-xl border border-transparent overflow-hidden">
              {/* Category Header */}
              <div
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all duration-150 cursor-pointer ${
                  isCategoryActive
                    ? 'bg-[#121a29] text-white border border-[#3b82f6]/30'
                    : 'text-slate-300 hover:bg-[#121622] hover:text-white'
                }`}
                onClick={() => {
                  if (!searchFilter) {
                    toggleCategory(cat.id);
                  }
                  // If not currently in this category, navigate to its default tab
                  if (!cat.items.some((item) => item.id === activeTab)) {
                    onChangeTab(cat.defaultTab);
                  }
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CategoryIcon
                    className={`w-4 h-4 shrink-0 transition-colors ${
                      isCategoryActive ? 'text-blue-400' : 'text-slate-400'
                    }`}
                  />
                  <span className="truncate">{cat.label}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {cat.badge && (
                    <span className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${cat.badgeColor}`}>
                      {cat.badge}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(cat.id);
                    }}
                    className="p-0.5 rounded text-slate-500 hover:text-slate-300"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Sub-Items List */}
              {isExpanded && (
                <div className="mt-1 ml-3 pl-2.5 border-l border-slate-800/80 space-y-0.5 py-0.5">
                  {cat.items.map((item) => {
                    const ItemIcon = item.icon;
                    const isItemActive = activeTab === item.id;

                    return (
                      <button
                        key={item.id}
                        onClick={() => onChangeTab(item.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 text-left ${
                          isItemActive
                            ? 'bg-[#0e241c] text-[#10b981] font-bold border border-[#10b981]/40 shadow-xs shadow-emerald-500/10'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-[#121622]'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate min-w-0">
                          <ItemIcon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isItemActive ? 'text-[#10b981]' : 'text-slate-500'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </div>

                        {item.badge && (
                          <span
                            className={`ml-1.5 px-1.5 py-0.2 text-[9px] font-bold rounded-full shrink-0 ${
                              isItemActive
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : item.badgeColor || 'bg-slate-800 text-slate-400'
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

      {/* Bottom Promo Card: AI Command Center */}
      <div className="p-3 border-t border-[#161a26]">
        <div className="p-3 rounded-2xl bg-[#0c1417] border border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.12)] space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold font-display">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>AI SRE Copilot</span>
            </div>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Active
            </span>
          </div>
          <p className="text-[10px] text-slate-300 leading-snug">
            Autonomous threat response, instant OOM root causes & kubectl synthesis.
          </p>
          <button
            onClick={onOpenCopilot}
            className="w-full py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all font-display flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Open SRE Copilot</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
