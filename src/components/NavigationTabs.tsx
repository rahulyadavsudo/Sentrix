import React from 'react';
import {
  Activity,
  AlertOctagon,
  Bell,
  BookOpen,
  Bot,
  Boxes,
  Bug,
  Compass,
  CreditCard,
  DollarSign,
  FileCode2,
  FileText,
  Flame,
  Gauge,
  GitBranch,
  Globe,
  LayoutDashboard,
  Lock,
  Network,
  Package,
  Radio,
  ShieldAlert,
  ShieldCheck,
  Shuffle,
  Sliders,
  Sparkles,
  Terminal,
  TrendingUp,
  Zap,
  Server,
  Database,
  Cpu,
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
  | 'production-readiness';

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
  const tabs = [
    {
      id: 'incidents' as TabType,
      label: 'Incident Hub & Timeline',
      icon: Flame,
      badge: 'Unified',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse',
    },
    {
      id: 'pipeline' as TabType,
      label: 'CI/CD & GitHub',
      icon: GitBranch,
      badge: activeWorkflowsCount > 0 ? `${activeWorkflowsCount} Run` : null,
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'tech-stack' as TabType,
      label: 'Repo Tech Stack',
      icon: FileCode2,
      badge: 'Auto-Discovery',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'failure-history' as TabType,
      label: 'Failure History & RCA',
      icon: ShieldAlert,
      badge: 'RCA & Diff',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'topology' as TabType,
      label: 'K8s Cluster Map',
      icon: Boxes,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'traces' as TabType,
      label: 'OTel Traces & APM',
      icon: Activity,
      badge: 'APM Live',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'helm' as TabType,
      label: 'Helm & CRDs',
      icon: Package,
      badge: 'v3.14',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'autoscaling' as TabType,
      label: 'KEDA Autoscaler',
      icon: TrendingUp,
      badge: 'Event HPA',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'vault' as TabType,
      label: 'Zero-Trust Vault',
      icon: Lock,
      badge: 'mTLS CSI',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'mesh' as TabType,
      label: 'Service Mesh & eBPF',
      icon: Network,
      badge: 'mTLS',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'profiler' as TabType,
      label: 'Language Profiler',
      icon: Activity,
      badge: 'Go/Py/Rust',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      id: 'predictive' as TabType,
      label: 'Predictive OOM Radar',
      icon: TrendingUp,
      badge: predictiveAlertCount > 0 ? `${predictiveAlertCount} Alert` : null,
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse',
    },
    {
      id: 'rca' as TabType,
      label: 'RCA & 1-Click Heal',
      icon: AlertOctagon,
      badge: issueCount > 0 ? `${issueCount} Issues` : null,
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    },
    {
      id: 'policies' as TabType,
      label: 'Auto-Heal Policies',
      icon: ShieldCheck,
      badge: '5 Rules',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'slo' as TabType,
      label: 'SLO & Burn Rates',
      icon: Gauge,
      badge: '99.9%',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'ebpf' as TabType,
      label: 'eBPF Kernel Tracer',
      icon: Flame,
      badge: 'Ring-Buffer',
      badgeColor: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    },
    {
      id: 'runbooks' as TabType,
      label: 'Runbook Studio',
      icon: BookOpen,
      badge: 'Automated',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'loadtest' as TabType,
      label: 'Load & Stress Harness',
      icon: Zap,
      badge: 'Stress RPS',
      badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    },
    {
      id: 'dr' as TabType,
      label: 'Multi-Region DR Hub',
      icon: Shuffle,
      badge: 'Active-Active',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'fleet' as TabType,
      label: 'Multi-Cluster Fleet',
      icon: Globe,
      badge: 'GCP + AWS',
      badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
    },
    {
      id: 'security' as TabType,
      label: 'Security & CVEs',
      icon: ShieldCheck,
      badge: 'Trivy/Falco',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'alerts' as TabType,
      label: 'Alert Integrations',
      icon: Bell,
      badge: 'Slack/PD',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'gitops' as TabType,
      label: 'GitOps & ArgoCD',
      icon: GitBranch,
      badge: 'OutOfSync',
      badgeColor: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    },
    {
      id: 'canary' as TabType,
      label: 'Canary & Traffic Shift',
      icon: Sliders,
      badge: 'Step 2: 25%',
      badgeColor: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    },
    {
      id: 'chaos' as TabType,
      label: 'Chaos Sandbox',
      icon: Flame,
      badge: 'Fault Test',
      badgeColor: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
    {
      id: 'model-switch' as TabType,
      label: 'AI Model Switcher',
      icon: Cpu,
      badge: 'NVIDIA/Cursor',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30 animate-pulse',
    },
    {
      id: 'copilot' as TabType,
      label: 'AI SRE Copilot',
      icon: Sparkles,
      badge: 'Multi-LLM',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'finops' as TabType,
      label: 'FinOps & Cost Save',
      icon: DollarSign,
      badge: '$860/mo Save',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    {
      id: 'logs' as TabType,
      label: 'eBPF Live Logs',
      icon: Terminal,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'postmortem' as TabType,
      label: 'Incident Post-Mortem',
      icon: FileText,
      badge: 'AI SRE',
      badgeColor: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    },
    {
      id: 'specs' as TabType,
      label: 'Microservice Specs',
      icon: FileCode2,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'production-readiness' as TabType,
      label: 'Production & SaaS Hub',
      icon: Server,
      badge: 'RBAC & DB',
      badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold',
    },
  ];

  return (
    <div className="bg-[#000000] border-b border-white/10 sticky top-[73px] z-30 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1.5 overflow-x-auto py-2.5 scrollbar-none" aria-label="Tabs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border relative ${
                  isActive
                    ? 'bg-white text-black border-white shadow-lg shadow-white/10'
                    : 'text-slate-400 hover:text-white hover:bg-[#18181b] border-transparent'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? 'text-black' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] font-extrabold ${
                      isActive ? 'bg-black/10 text-black' : tab.badgeColor
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
