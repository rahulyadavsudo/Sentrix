import React, { useState, useMemo, useEffect } from 'react';
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
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({
  activeTab,
  onChangeTab,
  issueCount,
  predictiveAlertCount,
  activeWorkflowsCount,
  failedBuildCount,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

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
            label: 'Incident Hub & Timeline',
            shortLabel: 'Incident Hub',
            icon: Flame,
            badge: issueCount > 0 ? `${issueCount} Issues` : 'Unified',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            description: 'Live incident triage, correlation engine, and automated runbook triggers',
          },
          {
            id: 'rca',
            label: 'RCA & 1-Click Heal',
            shortLabel: '1-Click Heal',
            icon: AlertOctagon,
            badge: 'Autonomous',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
            description: 'Autonomous root cause analysis and instant one-click remediation actions',
          },
          {
            id: 'failure-history',
            label: 'Failure History & RCA',
            shortLabel: 'Failure History',
            icon: ShieldAlert,
            badge: 'Diff Analysis',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            description: 'Historic incident telemetry, blast radius graphs, and code diff mapping',
          },
          {
            id: 'postmortem',
            label: 'Incident Post-Mortem',
            shortLabel: 'Post-Mortem',
            icon: FileText,
            badge: 'AI Generated',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            description: 'Automated post-incident timeline generation, prevention measures & report export',
          },
          {
            id: 'policies',
            label: 'Auto-Heal Policies',
            shortLabel: 'Policies',
            icon: ShieldCheck,
            badge: '5 Active Rules',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Configurable automated self-healing guardrails, circuit breakers, and thresholds',
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
            label: 'CI/CD & GitHub Actions',
            shortLabel: 'Pipelines',
            icon: GitBranch,
            badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount} Run` : 'Live',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
            description: 'GitHub workflow pipeline stages, duration anomaly detector, and commit matrix',
          },
          {
            id: 'log-collector',
            label: 'Go Log Ingestion Service',
            shortLabel: 'Go Log Ingester',
            icon: Terminal,
            badge: 'gRPC / Stream',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'Ultra-low latency streaming log parser with zero-leak secret redaction',
          },
          {
            id: 'tech-stack',
            label: 'Repo Tech Stack Discovery',
            shortLabel: 'Tech Stack',
            icon: FileCode2,
            badge: 'Auto-Detect',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Deep repository dependency mapping, runtime profiling, and dockerfile analysis',
          },
          {
            id: 'gitops',
            label: 'GitOps & ArgoCD Sync',
            shortLabel: 'GitOps',
            icon: GitBranch,
            badge: 'OutOfSync',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            description: 'Declarative Kubernetes sync status, drift detection, and auto-sync triggers',
          },
          {
            id: 'canary',
            label: 'Canary & Traffic Shift',
            shortLabel: 'Canary Deploy',
            icon: Sliders,
            badge: 'Step 2: 25%',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'Progressive delivery ingress management, canary error metrics, and rollback',
          },
        ],
      },
      {
        id: 'k8s-infra',
        label: 'Kubernetes & Fleet',
        shortLabel: 'K8s & Infra',
        icon: Boxes,
        color: 'blue',
        activeBg: 'bg-blue-500/10',
        activeBorder: 'border-blue-500/40 text-blue-300',
        activeText: 'text-blue-400',
        tabs: [
          {
            id: 'topology',
            label: 'K8s Cluster Topology Map',
            shortLabel: 'Cluster Map',
            icon: Boxes,
            badge: '3 Clusters',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            description: 'Interactive node/pod topology visualizer with real-time health coloring',
          },
          {
            id: 'fleet',
            label: 'Multi-Cluster Fleet Hub',
            shortLabel: 'Multi-Cluster',
            icon: Globe,
            badge: 'GCP + AWS',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            description: 'Cross-cloud cluster management, federation status, and kubeconfig registry',
          },
          {
            id: 'helm',
            label: 'Helm Releases & CRDs',
            shortLabel: 'Helm & CRDs',
            icon: Package,
            badge: 'v3.14',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            description: 'Installed Helm chart versions, CRD custom resource validators, and upgrades',
          },
          {
            id: 'autoscaling',
            label: 'KEDA Event Autoscaler',
            shortLabel: 'KEDA Autoscaler',
            icon: TrendingUp,
            badge: 'Scale to 0',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            description: 'Event-driven autoscaling triggers, Kafka/RabbitMQ metrics, and HPA status',
          },
          {
            id: 'specs',
            label: 'Microservice Specs & Schema',
            shortLabel: 'Service Specs',
            icon: FileCode2,
            badge: 'OpenAPI',
            badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
            description: 'Service contracts, gRPC protobuf schemas, and OpenAPI endpoints index',
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
                text: `${predictiveAlertCount} Radar`,
                color: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
              }
            : null,
        tabs: [
          {
            id: 'traces',
            label: 'OTel Distributed Traces & APM',
            shortLabel: 'OTel Traces',
            icon: Activity,
            badge: 'APM Live',
            badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
            description: 'End-to-end distributed span waterfalls, microservice latency breakdown, and errors',
          },
          {
            id: 'profiler',
            label: 'Microservice Language Profiler',
            shortLabel: 'Profiler',
            icon: Activity,
            badge: 'Flamegraphs',
            badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            description: 'In-flight CPU and heap flamegraphs for Go, Python, Node, and Rust workloads',
          },
          {
            id: 'predictive',
            label: 'Predictive OOM Radar',
            shortLabel: 'OOM Radar',
            icon: TrendingUp,
            badge: predictiveAlertCount > 0 ? `${predictiveAlertCount} Warn` : 'Optimal',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
            description: 'AI predictive slope detection alerting on memory leaks 20 minutes before OOMKill',
          },
          {
            id: 'ebpf',
            label: 'eBPF Kernel Tracer',
            shortLabel: 'eBPF Kernel',
            icon: Flame,
            badge: 'Ring-Buffer',
            badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
            description: 'Kernel-space TCP drop detection, syscall profiling, and socket queue depth',
          },
          {
            id: 'logs',
            label: 'Live Stream Logs & eBPF',
            shortLabel: 'Live Logs',
            icon: Terminal,
            badge: 'Live Tail',
            badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
            description: 'Real-time multi-pod container log tailing with syntax highlighting and regex search',
          },
        ],
      },
      {
        id: 'security-zero-trust',
        label: 'Security & Trust',
        shortLabel: 'Security',
        icon: Shield,
        color: 'emerald',
        activeBg: 'bg-emerald-500/10',
        activeBorder: 'border-emerald-500/40 text-emerald-300',
        activeText: 'text-emerald-400',
        tabs: [
          {
            id: 'security',
            label: 'Security, CVEs & Falco',
            shortLabel: 'Vulnerabilities',
            icon: ShieldCheck,
            badge: 'Trivy/Falco',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            description: 'Runtime threat detection, container image vulnerabilities, and CIS benchmarks',
          },
          {
            id: 'vault',
            label: 'Zero-Trust Vault & Secrets',
            shortLabel: 'Vault Secrets',
            icon: Lock,
            badge: 'mTLS CSI',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Dynamic secret rotation, HashiCorp Vault CSI provider, and KMS encryption status',
          },
          {
            id: 'mesh',
            label: 'Service Mesh & Network Policies',
            shortLabel: 'Service Mesh',
            icon: Network,
            badge: 'mTLS Strict',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Istio/Cilium service mesh encryption, mutual TLS handshake, and ingress routing',
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
            label: 'SLO & Error Budget Burn',
            shortLabel: 'SLO Burn',
            icon: Gauge,
            badge: '99.9% Target',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            description: 'Service level objectives, burn rate alerts, and error budget exhaustion forecast',
          },
          {
            id: 'alerts',
            label: 'Alert Routing Integrations',
            shortLabel: 'Alert Routing',
            icon: Bell,
            badge: 'Slack / PD',
            badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
            description: 'On-call schedule integrations, PagerDuty webhooks, Slack escalations, and silence rules',
          },
          {
            id: 'finops',
            label: 'FinOps & Cost Optimization',
            shortLabel: 'FinOps Costs',
            icon: DollarSign,
            badge: '$860/mo Saved',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
            description: 'Right-sizing recommendations, idle resource termination, and cloud bill breakdown',
          },
          {
            id: 'production-readiness',
            label: 'Production & SaaS Hub',
            shortLabel: 'Production Hub',
            icon: Server,
            badge: 'RBAC & DB',
            badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
            description: 'Enterprise RBAC permissions, audit logging, multi-tenancy, and database backups',
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
            label: 'Automated Runbook Studio',
            shortLabel: 'Runbooks',
            icon: BookOpen,
            badge: 'Executable',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
            description: 'Interactive and automated remediation runbooks with rollback step validation',
          },
          {
            id: 'chaos',
            label: 'Chaos Engineering Sandbox',
            shortLabel: 'Chaos Sandbox',
            icon: Flame,
            badge: 'Fault Inject',
            badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
            description: 'Simulated packet loss, pod kills, CPU spikes, and latency injection experiments',
          },
          {
            id: 'loadtest',
            label: 'Load & Stress RPS Harness',
            shortLabel: 'Load Testing',
            icon: Zap,
            badge: 'Stress RPS',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
            description: 'Synthetic high-volume traffic generator with p95/p99 latency tracking',
          },
          {
            id: 'dr',
            label: 'Multi-Region Disaster Recovery',
            shortLabel: 'Disaster Recovery',
            icon: Shuffle,
            badge: 'Active-Active',
            badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
            description: 'Cross-region failover automation, DNS traffic steering, and RPO/RTO verification',
          },
        ],
      },
      {
        id: 'ai-engine',
        label: 'AI Copilot & Models',
        shortLabel: 'AI Copilot',
        icon: Sparkles,
        color: 'purple',
        activeBg: 'bg-purple-500/10',
        activeBorder: 'border-purple-500/40 text-purple-300',
        activeText: 'text-purple-400',
        tabs: [
          {
            id: 'copilot',
            label: 'AI SRE Copilot & Assistant',
            shortLabel: 'AI Copilot',
            icon: Sparkles,
            badge: 'Multi-LLM',
            badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse',
            description: 'Natural language SRE copilot for incident triage, kubectl generation, and root cause diagnosis',
          },
          {
            id: 'model-switch',
            label: 'AI Key & Model Detector',
            shortLabel: 'API Key & Models',
            icon: Cpu,
            badge: 'Key Inspector',
            badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30 font-bold',
            description: 'Paste API key, auto-detect available models, select engine from dropdown, and validate connection health',
          },
        ],
      },
    ],
    [issueCount, predictiveAlertCount, activeWorkflowsCount]
  );

  // Determine which parent category currently contains the activeTab
  const currentParentGroup = useMemo(() => {
    for (const group of parentGroups) {
      if (group.tabs.some((t) => t.id === activeTab)) {
        return group;
      }
    }
    return parentGroups[0];
  }, [activeTab, parentGroups]);

  // Selected parent group state (defaults to matching active tab's parent)
  const [selectedParentId, setSelectedParentId] = useState<ParentGroupId>(
    currentParentGroup.id
  );

  // Sync selected parent when activeTab changes externally
  useEffect(() => {
    setSelectedParentId(currentParentGroup.id);
  }, [currentParentGroup.id]);

  const activeGroup = useMemo(
    () => parentGroups.find((g) => g.id === selectedParentId) || currentParentGroup,
    [parentGroups, selectedParentId, currentParentGroup]
  );

  // All 34 tabs flattened for the fast search switcher
  const allTabsFlattened = useMemo(() => {
    return parentGroups.flatMap((group) =>
      group.tabs.map((tab) => ({
        ...tab,
        parentLabel: group.label,
        parentColor: group.color,
      }))
    );
  }, [parentGroups]);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allTabsFlattened.filter(
      (t) =>
        t.label.toLowerCase().includes(q) ||
        t.id.toLowerCase().includes(q) ||
        t.parentLabel.toLowerCase().includes(q) ||
        (t.description && t.description.toLowerCase().includes(q))
    );
  }, [searchQuery, allTabsFlattened]);

  const handleSelectParent = (groupId: ParentGroupId) => {
    setSelectedParentId(groupId);
    const targetGroup = parentGroups.find((g) => g.id === groupId);
    if (targetGroup && targetGroup.tabs.length > 0) {
      // If activeTab is not already in this group, switch to the first tab of this group
      if (!targetGroup.tabs.some((t) => t.id === activeTab)) {
        onChangeTab(targetGroup.tabs[0].id);
      }
    }
  };

  return (
    <div className="bg-[#090b10] border-b border-[#161a26] sticky top-[57px] z-30 transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Tier 1: Parent Category Navigation Bar */}
        <div className="flex items-center justify-between gap-2 pt-2.5 pb-2 border-b border-[#161a26]/80">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
            {parentGroups.map((group) => {
              const Icon = group.icon;
              const isParentActive = selectedParentId === group.id;
              const isChildActive = group.tabs.some((t) => t.id === activeTab);
              const badge = group.getBadge
                ? group.getBadge({
                    issueCount,
                    predictiveAlertCount,
                    activeWorkflowsCount,
                    failedBuildCount,
                  })
                : null;

              return (
                <button
                  key={group.id}
                  id={`parent-tab-${group.id}`}
                  onClick={() => handleSelectParent(group.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 border relative cursor-pointer ${
                    isParentActive
                      ? 'bg-[#101726] text-white border-[#3b82f6]/40 shadow-sm shadow-blue-500/10'
                      : isChildActive
                      ? 'bg-[#0e241c] text-emerald-300 border-emerald-500/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121622] border-transparent'
                  }`}
                  title={`${group.label} (${group.tabs.length} modules)`}
                >
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isParentActive
                        ? 'text-blue-400'
                        : isChildActive
                        ? 'text-emerald-400'
                        : 'text-slate-400'
                    }`}
                  />
                  <span>{group.label}</span>

                  {/* Sub-tab count badge */}
                  <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-md bg-slate-800/80 text-slate-300 font-semibold">
                    {group.tabs.length}
                  </span>

                  {/* Dynamic Alert Badge */}
                  {badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${badge.color}`}
                    >
                      {badge.text}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Search & Switcher Button */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isSearchOpen
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-[#121622] text-slate-300 border-[#242b3d] hover:border-slate-600 hover:text-white'
              }`}
              title="Quickly search all 34 tabs (Cmd+K)"
            >
              <Search className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Jump to Module</span>
              <kbd className="hidden md:inline-block ml-1 px-1.5 py-0.5 text-[9px] font-mono rounded bg-black/40 border border-slate-700 text-slate-400">
                34 tabs
              </kbd>
            </button>

            {/* Quick Search Dropdown Modal */}
            {isSearchOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#0c1017] border border-[#242b3d] rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center gap-2 px-3 py-2 bg-[#141a29] rounded-xl border border-slate-800 mb-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search all 34 modules (e.g., eBPF, Vault, KEDA)..."
                    autoFocus
                    className="w-full bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="text-slate-400 hover:text-white"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <div className="max-h-72 overflow-y-auto space-y-1 custom-scrollbar">
                  {(searchQuery ? filteredTabs : allTabsFlattened).map((item) => {
                    const Icon = item.icon;
                    const isSelected = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onChangeTab(item.id);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                            : 'hover:bg-[#141a29] text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`p-1.5 rounded-lg ${
                              isSelected
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-slate-800/80 text-slate-400'
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <div className="truncate">
                            <div className="text-xs font-bold truncate flex items-center gap-1.5">
                              <span>{item.label}</span>
                              {item.badge && (
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-slate-800 text-slate-300 border border-slate-700">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {item.parentLabel}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tier 2: Sub-Tabs for the Selected Parent Category */}
        <div className="flex items-center justify-between gap-3 py-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-1.5 min-w-max">
            {/* Category Indicator Tag */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] font-bold text-slate-400 mr-1 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              <span className="uppercase tracking-wider font-mono">{activeGroup.shortLabel || activeGroup.label}</span>
              <ChevronRight className="w-3 h-3 text-slate-600" />
            </div>

            {/* Sub-tabs list */}
            {activeGroup.tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  id={`sub-tab-${tab.id}`}
                  onClick={() => onChangeTab(tab.id)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-200 border relative cursor-pointer group ${
                    isActive
                      ? 'bg-[#0e241c] text-[#10b981] border-[#10b981]/50 shadow-sm shadow-emerald-500/15'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#121622] border-slate-800/60'
                  }`}
                  title={tab.description || tab.label}
                >
                  <Icon
                    className={`w-3.5 h-3.5 transition-colors ${
                      isActive ? 'text-[#10b981]' : 'text-slate-400 group-hover:text-slate-300'
                    }`}
                  />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                        isActive
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : tab.badgeColor || 'bg-slate-800 text-slate-300'
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
