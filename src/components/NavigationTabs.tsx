import React, { useState, useMemo } from 'react';
import {
  Activity,
  AlertOctagon,
  Bell,
  BookOpen,
  Boxes,
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
  Network,
  Package,
  Search,
  Server,
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
  ChevronRight,
  ChevronDown,
  Filter,
} from 'lucide-react';

export type TabType =
  | 'incidents'
  | 'pipeline'
  | 'tech-stack'
  | 'failure-history'
  | 'topology'
  | 'traces'
  | 'helm'
  | 'autoscaling'
  | 'vault'
  | 'mesh'
  | 'profiler'
  | 'predictive'
  | 'rca'
  | 'policies'
  | 'slo'
  | 'ebpf'
  | 'runbooks'
  | 'loadtest'
  | 'dr'
  | 'fleet'
  | 'security'
  | 'alerts'
  | 'gitops'
  | 'canary'
  | 'chaos'
  | 'model-switch'
  | 'copilot'
  | 'finops'
  | 'logs'
  | 'postmortem'
  | 'specs'
  | 'production-readiness'
  | 'log-collector';

export type ParentGroupId =
  | 'incidents-heal'
  | 'cicd-delivery'
  | 'k8s-infra'
  | 'observability'
  | 'security-zero-trust'
  | 'reliability-finops'
  | 'resilience-testing'
  | 'ai-engine';

export interface SubTabDef {
  id: TabType;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string | null;
  badgeColor?: string;
  description?: string;
}

export interface ParentGroupDef {
  id: ParentGroupId;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  activeBg: string;
  activeBorder: string;
  activeText: string;
  tabs: SubTabDef[];
  getBadge?: (counts: {
    issueCount: number;
    predictiveAlertCount: number;
    activeWorkflowsCount: number;
    failedBuildCount?: number;
  }) => { text: string; color: string } | null;
}

interface NavigationTabsProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  issueCount: number;
  predictiveAlertCount: number;
  activeWorkflowsCount: number;
  failedBuildCount?: number;
  theme?: 'dark' | 'light';
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  issueCount,
  predictiveAlertCount,
  activeWorkflowsCount,
  failedBuildCount,
  theme = 'dark',
}) => {
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);

  // Grouping 34 specialized sub-tabs into 8 Parent Categories
  const parentGroups: ParentGroupDef[] = useMemo(
    () => [
      {
        id: 'incidents-heal',
        label: 'Incidents & Healing',
        shortLabel: 'Incidents',
        icon: Flame,
        color: 'rose',
        activeBg: 'bg-rose-500/10',
        activeBorder: 'border-rose-500/40 text-rose-300',
        activeText: 'text-rose-400',
        getBadge: ({ issueCount }) =>
          issueCount > 0
            ? {
                text: `${issueCount} Active`,
                color: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
              }
            : null,
        tabs: [
          {
            id: 'incidents',
            label: 'Incident Hub',
            shortLabel: 'Incident Hub',
            icon: Flame,
            badge: issueCount > 0 ? `${issueCount}` : null,
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            description: 'Live incident triage, active alerts, and correlation engine',
          },
          {
            id: 'rca',
            label: '1-Click Heal',
            shortLabel: '1-Click Heal',
            icon: AlertOctagon,
            badge: 'Auto',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            description: 'Autonomous root cause analysis and instant one-click remediation actions',
          },
          {
            id: 'failure-history',
            label: 'Failure History',
            shortLabel: 'Failure History',
            icon: ShieldAlert,
            description: 'Historic incident telemetry and deployment diff mapping',
          },
          {
            id: 'postmortem',
            label: 'Post-Mortems',
            shortLabel: 'Post-Mortems',
            icon: FileText,
            badge: 'AI Draft',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            description: 'Automated post-incident timeline generation and prevention checklist',
          },
          {
            id: 'policies',
            label: 'Auto-Heal Policies',
            shortLabel: 'Policies',
            icon: ShieldCheck,
            badge: '5 Active',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Configurable automated self-healing guardrails and thresholds',
          },
        ],
      },
      {
        id: 'cicd-delivery',
        label: 'CI/CD & Delivery',
        shortLabel: 'CI/CD',
        icon: GitBranch,
        color: 'cyan',
        activeBg: 'bg-cyan-500/10',
        activeBorder: 'border-cyan-500/40 text-cyan-300',
        activeText: 'text-cyan-400',
        getBadge: ({ activeWorkflowsCount }) =>
          activeWorkflowsCount > 0
            ? {
                text: `${activeWorkflowsCount} Running`,
                color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
              }
            : null,
        tabs: [
          {
            id: 'pipeline',
            label: 'CI/CD Pipelines',
            shortLabel: 'Pipelines',
            icon: GitBranch,
            badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount}` : 'Live',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
            description: 'GitHub workflow pipeline stages, duration anomaly detector, and commit matrix',
          },
          {
            id: 'log-collector',
            label: 'Go Log Ingester',
            shortLabel: 'Log Ingester',
            icon: Terminal,
            badge: 'Stream',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'Ultra-low latency streaming log parser with zero-leak secret redaction',
          },
          {
            id: 'tech-stack',
            label: 'Repo Tech Stack',
            shortLabel: 'Tech Stack',
            icon: FileCode2,
            description: 'Deep repository dependency mapping and dockerfile analysis',
          },
          {
            id: 'gitops',
            label: 'GitOps ArgoCD',
            shortLabel: 'GitOps',
            icon: GitBranch,
            badge: 'Sync',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            description: 'Declarative Kubernetes sync status, drift detection, and auto-sync triggers',
          },
          {
            id: 'canary',
            label: 'Canary Deploy',
            shortLabel: 'Canary',
            icon: Sliders,
            badge: '25%',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'Automated canary progression and latency gate management',
          },
        ],
      },
      {
        id: 'k8s-infra',
        label: 'Kubernetes & Fleet',
        shortLabel: 'K8s Infra',
        icon: Boxes,
        color: 'blue',
        activeBg: 'bg-blue-500/10',
        activeBorder: 'border-blue-500/40 text-blue-300',
        activeText: 'text-blue-400',
        tabs: [
          {
            id: 'topology',
            label: 'Cluster Topology Map',
            shortLabel: 'Topology Map',
            icon: Boxes,
            description: 'Real-time node-to-pod visual graph with memory stress heatmaps',
          },
          {
            id: 'fleet',
            label: 'Multi-Cluster Fleet',
            shortLabel: 'Fleet',
            icon: Globe,
            badge: 'GCP/AWS',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            description: 'Cross-cloud unified Kubernetes management for GKE, EKS, AKS, and bare-metal',
          },
          {
            id: 'helm',
            label: 'Helm & CRDs',
            shortLabel: 'Helm',
            icon: Package,
            description: 'Helm release history, declarative values diffs, and CRD manifests',
          },
          {
            id: 'autoscaling',
            label: 'KEDA Autoscaler',
            shortLabel: 'Autoscaler',
            icon: TrendingUp,
            badge: 'KEDA',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            description: 'Event-driven auto-scaling with scale-to-zero queue listeners',
          },
          {
            id: 'specs',
            label: 'Service Specs',
            shortLabel: 'Specs',
            icon: FileCode2,
            description: 'Microservice API contracts, endpoints, and health probe definitions',
          },
        ],
      },
      {
        id: 'observability',
        label: 'Observability & APM',
        shortLabel: 'Observability',
        icon: Activity,
        color: 'indigo',
        activeBg: 'bg-indigo-500/10',
        activeBorder: 'border-indigo-500/40 text-indigo-300',
        activeText: 'text-indigo-400',
        getBadge: ({ predictiveAlertCount }) =>
          predictiveAlertCount > 0
            ? {
                text: `${predictiveAlertCount} Alert`,
                color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
              }
            : null,
        tabs: [
          {
            id: 'traces',
            label: 'OTel Traces & APM',
            shortLabel: 'Traces',
            icon: Activity,
            badge: 'Live',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'Distributed trace spans, eBPF flamegraphs, and latency waterfalls',
          },
          {
            id: 'profiler',
            label: 'Language Profiler',
            shortLabel: 'Profiler',
            icon: Activity,
            description: 'Continuous runtime CPU & heap memory profiling across microservices',
          },
          {
            id: 'predictive',
            label: 'Predictive OOM Radar',
            shortLabel: 'Predictive OOM',
            icon: TrendingUp,
            badge: predictiveAlertCount > 0 ? `${predictiveAlertCount}` : null,
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            description: 'AI-driven time-to-exhaustion predictive memory leak radar',
          },
          {
            id: 'ebpf',
            label: 'eBPF Kernel Tracer',
            shortLabel: 'eBPF Tracer',
            icon: Flame,
            badge: 'Kernel',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            description: 'Deep socket, syscall, and packet drop telemetry without code instrumentation',
          },
          {
            id: 'logs',
            label: 'Live Stream Logs',
            shortLabel: 'Logs',
            icon: Terminal,
            description: 'Unified streaming logs with real-time severity filters and search',
          },
        ],
      },
      {
        id: 'security-zero-trust',
        label: 'Security & Zero-Trust',
        shortLabel: 'Security',
        icon: Shield,
        color: 'emerald',
        activeBg: 'bg-emerald-500/10',
        activeBorder: 'border-emerald-500/40 text-emerald-300',
        activeText: 'text-emerald-400',
        tabs: [
          {
            id: 'security',
            label: 'Vulnerabilities & CVE',
            shortLabel: 'CVE Audit',
            icon: ShieldCheck,
            badge: 'Falco',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            description: 'Trivy/Grype CVE vulnerability auditing, CIS benchmarks, and remediation diffs',
          },
          {
            id: 'vault',
            label: 'Zero-Trust Vault',
            shortLabel: 'Secrets Vault',
            icon: Lock,
            badge: 'mTLS',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Automated secret rotation, access revocation, and zero-trust credentials',
          },
          {
            id: 'mesh',
            label: 'Service Mesh & mTLS',
            shortLabel: 'Service Mesh',
            icon: Network,
            badge: '98% mTLS',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            description: 'Interactive Istio service mesh network topology and mTLS status',
          },
        ],
      },
      {
        id: 'reliability-finops',
        label: 'Reliability & FinOps',
        shortLabel: 'Reliability',
        icon: Gauge,
        color: 'purple',
        activeBg: 'bg-purple-500/10',
        activeBorder: 'border-purple-500/40 text-purple-300',
        activeText: 'text-purple-400',
        tabs: [
          {
            id: 'slo',
            label: 'SLO & Burn Rates',
            shortLabel: 'SLO Budgets',
            icon: Gauge,
            badge: '99.9%',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            description: 'Service level objective tracking, error budget burn rates, and freeze enforcement',
          },
          {
            id: 'alerts',
            label: 'Alert Integrations',
            shortLabel: 'Alerts Hub',
            icon: Bell,
            badge: 'PD/Slack',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            description: 'PagerDuty, Slack, webhook integrations, and deduplication rules',
          },
          {
            id: 'finops',
            label: 'FinOps Cost Save',
            shortLabel: 'FinOps Save',
            icon: DollarSign,
            badge: 'Save $860',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Kubecost namespace spend breakdowns, idle waste, and right-sizing suggestions',
          },
          {
            id: 'production-readiness',
            label: 'Production SaaS Hub',
            shortLabel: 'SaaS Hub',
            icon: Server,
            badge: 'Ready',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Comprehensive 12-factor production readiness checklist and certification',
          },
        ],
      },
      {
        id: 'resilience-testing',
        label: 'Resilience & Testing',
        shortLabel: 'Resilience',
        icon: Zap,
        color: 'amber',
        activeBg: 'bg-amber-500/10',
        activeBorder: 'border-amber-500/40 text-amber-300',
        activeText: 'text-amber-400',
        tabs: [
          {
            id: 'runbooks',
            label: 'Runbook Studio',
            shortLabel: 'Runbooks',
            icon: BookOpen,
            badge: '1-Click',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            description: 'Declarative automated remediation playbooks and runbook executor',
          },
          {
            id: 'chaos',
            label: 'Chaos Sandbox',
            shortLabel: 'Chaos Test',
            icon: Flame,
            badge: 'Test',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            description: 'Simulated network partition, pod kill, and CPU spike chaos tests',
          },
          {
            id: 'loadtest',
            label: 'Load RPS Harness',
            shortLabel: 'Load Harness',
            icon: Zap,
            description: 'Continuous synthetic stress testing, ramp-up schedules, and response curves',
          },
          {
            id: 'dr',
            label: 'Multi-Region DR',
            shortLabel: 'DR Failover',
            icon: Shuffle,
            badge: 'RTO 45s',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'Multi-region failover automation and data synchronization health',
          },
        ],
      },
      {
        id: 'ai-engine',
        label: 'AI Copilot & Models',
        shortLabel: 'AI Engine',
        icon: Sparkles,
        color: 'emerald',
        activeBg: 'bg-emerald-500/10',
        activeBorder: 'border-emerald-500/40 text-emerald-300',
        activeText: 'text-emerald-400',
        tabs: [
          {
            id: 'copilot',
            label: 'AI SRE Copilot',
            shortLabel: 'SRE Copilot',
            icon: Sparkles,
            badge: 'Copilot',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Chat assistant for telemetry diagnostics, root cause synthesis, and incident triage',
          },
          {
            id: 'model-switch',
            label: 'AI Key & Model Detector',
            shortLabel: 'Model Switcher',
            icon: Cpu,
            badge: 'Key Inspect',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
            description: 'Dynamic AI engine switching between Gemini 3.7 Flash, Pro, and NVIDIA NIM',
          },
        ],
      },
    ],
    [issueCount, predictiveAlertCount, activeWorkflowsCount, failedBuildCount]
  );

  // Find the active parent category and active child page
  const activeGroup = useMemo(() => {
    for (const group of parentGroups) {
      if (group.tabs.some((t) => t.id === activeTab)) {
        return group;
      }
    }
    return parentGroups[0];
  }, [parentGroups, activeTab]);

  const activeTabDef = useMemo(() => {
    for (const group of parentGroups) {
      const match = group.tabs.find((t) => t.id === activeTab);
      if (match) return match;
    }
    return activeGroup.tabs[0];
  }, [parentGroups, activeGroup, activeTab]);

  const isLight = theme === 'light';
  const ParentIcon = activeGroup.icon;
  const ActiveChildIcon = activeTabDef.icon;

  return (
    <div
      className={`border-b transition-colors ${
        isLight
          ? 'bg-slate-50 border-slate-200 text-slate-800'
          : 'bg-[#0b0e17] border-[#161a26] text-white'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Breadcrumb Context & Category Dropdown */}
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition-colors cursor-pointer select-none ${
                isLight
                  ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  : 'bg-[#121622] border-[#222a3d] text-slate-300 hover:bg-[#181e2e] hover:text-white'
              }`}
              title="Click to switch category"
            >
              <ParentIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{activeGroup.label}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {/* Category Dropdown Popover */}
            {isCategoryMenuOpen && (
              <div
                className={`absolute top-full left-0 mt-1.5 w-64 rounded-xl border shadow-2xl p-2 z-50 space-y-1 ${
                  isLight
                    ? 'bg-white border-slate-200 text-slate-900'
                    : 'bg-[#10131c] border-[#22293a] text-white'
                }`}
              >
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                  Switch Module Category
                </div>
                {parentGroups.map((group) => {
                  const GIcon = group.icon;
                  const isCurrent = group.id === activeGroup.id;
                  return (
                    <button
                      key={group.id}
                      type="button"
                      onClick={() => {
                        setIsCategoryMenuOpen(false);
                        onChangeTab(group.tabs[0].id);
                      }}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors text-left cursor-pointer ${
                        isCurrent
                          ? 'bg-emerald-500/20 text-emerald-400 font-bold'
                          : isLight
                          ? 'text-slate-700 hover:bg-slate-100'
                          : 'text-slate-300 hover:bg-[#161d2c] hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <GIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{group.label}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {group.tabs.length}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            <ChevronRight className="w-3.5 h-3.5 text-slate-500" />

            {/* Active Child Page Breadcrumb Label */}
            <div className="flex items-center gap-1.5 text-xs font-extrabold text-emerald-400 font-display">
              <ActiveChildIcon className="w-3.5 h-3.5" />
              <span>{activeTabDef.label}</span>
            </div>
          </div>

          {/* Sibling Child Pages Chips (Horizontal Clean Quick-Switch) */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5 max-w-full">
            {activeGroup.tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  id={`sub-tab-${tab.id}`}
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-150 border cursor-pointer ${
                    isActive
                      ? isLight
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold shadow-xs'
                        : 'bg-[#0e241c] text-[#10b981] font-bold border-[#10b981]/50 shadow-xs shadow-emerald-500/15'
                      : isLight
                      ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border-slate-200'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121622] border-slate-800/80'
                  }`}
                  title={tab.description || tab.label}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? 'text-[#10b981]' : 'text-slate-400'
                    }`}
                  />
                  <span>{tab.shortLabel || tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : tab.badgeColor || (isLight ? 'bg-slate-200 text-slate-600' : 'bg-slate-800 text-slate-400')
                      }`}
                    >
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
