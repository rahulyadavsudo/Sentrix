import React from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Github,
  GitPullRequest,
  HardDrive,
  Moon,
  Play,
  Plus,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { ClusterStats, GitHubRepo } from '../types';

interface HeaderProps {
  stats: ClusterStats | null;
  repo: GitHubRepo | null;
  autonomousHealing: boolean;
  onToggleAutonomousHealing: () => void;
  onSimulateIncident: (type: string) => void;
  onTriggerPipeline: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenRegisterCluster?: () => void;
  primaryClusterName?: string;
  activeAiModelName?: string;
  onOpenModelSwitchTab?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  repo,
  autonomousHealing,
  onToggleAutonomousHealing,
  onSimulateIncident,
  onTriggerPipeline,
  onRefresh,
  isLoading,
  theme = 'dark',
  onToggleTheme,
  onOpenRegisterCluster,
  primaryClusterName = 'gke-prod-us-west1',
  activeAiModelName = 'Gemini 3.7 Flash',
  onOpenModelSwitchTab,
}) => {
  return (
    <header className={`${theme === 'light' ? 'bg-white border-b border-slate-200 text-slate-900' : 'bg-[#000000] border-b border-white/10 text-white'} sticky top-0 z-40 transition-colors duration-300`}>
      {/* Top Bar: Cluster Info & Global Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            {/* Rainbow / Color Ring circular logo matching screenshot */}
            <div className="w-9 h-9 rounded-full relative flex items-center justify-center p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-cyan-400 shadow-md">
              <div className={`w-full h-full ${theme === 'light' ? 'bg-white' : 'bg-[#000000]'} rounded-full flex items-center justify-center`}>
                <Activity className={`w-4 h-4 ${theme === 'light' ? 'text-slate-900' : 'text-white'}`} />
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className={`text-xl font-black tracking-tight ${theme === 'light' ? 'text-slate-900' : 'text-white'} flex items-center gap-2 font-display`}>
                  <span>Sentrix</span>
                  <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${theme === 'light' ? 'bg-slate-100 border-slate-300 text-slate-700' : 'bg-[#18181b] border-white/10 text-slate-300'} border tracking-wider`}>
                    v2.4
                  </span>
                </h1>

                {/* Modern Interactive Live Cluster Badge */}
                <button
                  type="button"
                  onClick={onOpenRegisterCluster}
                  className={`group inline-flex items-center gap-2 px-3 py-1 rounded-full ${theme === 'light' ? 'bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-900' : 'bg-[#141416] hover:bg-[#1f1f23] border-white/10 hover:border-white/20 text-white'} border text-xs font-semibold shadow-sm transition-all duration-200`}
                  title="Active Kubernetes Cluster - Click to view multi-cluster fleet or register cluster"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="text-[11px] font-bold tracking-wide text-emerald-600 dark:text-emerald-300">Live Cluster</span>
                  <span className="text-slate-400 text-[10px]">&bull;</span>
                  <span className="font-mono text-[10px] text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">
                    {primaryClusterName}
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 uppercase">
                    Primary
                  </span>
                </button>
              </div>
              <p className={`text-xs ${theme === 'light' ? 'text-slate-600' : 'text-slate-400'} font-sans`}>
                Enterprise Kubernetes & Cloud SRE Observability Platform &bull; eBPF Telemetry &bull; Predictive OOM &bull; 1-Click Auto-Healing
              </p>
            </div>
          </div>

          {/* Connected GitHub Repository Badge & Controls */}
          <div className="flex flex-wrap items-center gap-2">
            {repo && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141416] border border-white/10 text-xs text-slate-300 shadow-sm">
                <Github className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-100">{repo.owner}/{repo.name}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-cyan-400 font-mono font-medium">{repo.branch}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-[#1f1f23] text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                  <GitPullRequest className="w-2.5 h-2.5" /> {repo.openPRs} PRs
                </span>
              </div>
            )}

            {/* Autonomous Self-Healing Toggle */}
            <button
              onClick={onToggleAutonomousHealing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 ${
                autonomousHealing
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30 shadow-sm'
                  : 'bg-[#141416] text-slate-400 border-white/10 hover:text-slate-200'
              }`}
              title="Autonomous remediation policies auto-fix known issues without manual intervention"
            >
              <Shield className={`w-3.5 h-3.5 ${autonomousHealing ? 'text-emerald-400' : 'text-slate-500'}`} />
              <span>Auto-Healing: <span className="font-extrabold">{autonomousHealing ? 'ACTIVE' : 'MANUAL'}</span></span>
            </button>

            {/* AI Model Switch Fast Access Pill */}
            {onOpenModelSwitchTab && (
              <button
                onClick={onOpenModelSwitchTab}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#141416] hover:bg-purple-950/30 text-purple-300 border border-purple-500/40 hover:border-purple-400 transition-all shadow-sm group"
                title="Switch AI reasoning model (NVIDIA NIM, Cursor Bridge, Google Gemini)"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400 group-hover:rotate-12 transition-transform" />
                <span className="text-[11px] font-bold text-white max-w-[130px] truncate">{activeAiModelName}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase font-mono">Switch</span>
              </button>
            )}

            {/* Register Cluster Modal Button */}

            {onOpenRegisterCluster && (
              <button
                onClick={onOpenRegisterCluster}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#141416] hover:bg-[#1f1f23] text-slate-200 hover:text-white border border-white/10 transition-all shadow-sm"
                title="Register a new Kubernetes cluster via Kubeconfig or endpoint"
              >
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Cluster</span>
              </button>
            )}

            {/* Simulate Incident Button */}
            <button
              onClick={() => onSimulateIncident('memory_leak')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-[#141416] text-amber-300 border border-amber-500/30 hover:bg-amber-500/15 transition-all shadow-sm"
              title="Inject a memory leak trajectory (+18.4MB/min) into payment-gateway to test predictive OOM watchdog"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Inject Leak Alert</span>
            </button>

            {/* Dispatch Pipeline Button (Solid White Button from screenshot style) */}
            <button
              onClick={onTriggerPipeline}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-extrabold bg-white text-black hover:bg-slate-100 shadow-md transition-all font-display"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Dispatch CI/CD</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-full bg-[#141416] border border-white/10 text-slate-400 hover:text-white hover:bg-[#1f1f23] transition-all disabled:opacity-50 shadow-sm"
              title="Refresh cluster telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Dark / Light Theme Mode Toggle Button */}
            {onToggleTheme && (
              <button
                id="theme-toggle-button"
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#141416] border border-white/10 text-xs font-medium text-slate-200 hover:text-white transition-all shadow-sm"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[11px] font-semibold text-slate-300">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-cyan-400" />
                    <span className="text-[11px] font-semibold text-slate-300">Dark</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Global Cluster Status Indicators Banner */}
        {stats && (
          <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Health Score */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Cluster Health</div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-1 font-display">
                  <span>{stats.healthScore}%</span>
                  <span className="text-[10px] font-medium text-emerald-400">
                    {stats.healthScore >= 80 ? 'Optimal' : 'Degraded'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pods Status */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-xl bg-blue-500/15 text-blue-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Pods State</div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5 font-display">
                  <span className="text-emerald-400">{stats.runningPods} OK</span>
                  {stats.unhealthyPods > 0 && (
                    <span className="text-rose-400 font-semibold">/ {stats.unhealthyPods} Alert</span>
                  )}
                </div>
              </div>
            </div>

            {/* CPU Utilization */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-xl bg-cyan-500/15 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">CPU Load</div>
                <div className="text-sm font-bold text-slate-100 font-display">{stats.cpuUtilizationPercent}% Avg</div>
              </div>
            </div>

            {/* Memory Utilization */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-xl bg-indigo-500/15 text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">RAM Load</div>
                <div className="text-sm font-bold text-slate-100 font-display">{stats.memoryUtilizationPercent}% Avg</div>
              </div>
            </div>

            {/* Predictive Alerts */}
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-2xl border transition-all ${
              stats.predictiveAlertsCount > 0
                ? 'bg-amber-500/10 border-amber-500/30'
                : 'bg-[#141416] border-white/5 hover:border-white/15'
            }`}>
              <div className={`p-1.5 rounded-xl ${stats.predictiveAlertsCount > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-[#18181b] text-slate-400'}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Predictive OOM</div>
                <div className={`text-sm font-bold font-display ${stats.predictiveAlertsCount > 0 ? 'text-amber-300' : 'text-slate-300'}`}>
                  {stats.predictiveAlertsCount} Active Watch
                </div>
              </div>
            </div>

            {/* 24h Auto-Healed */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-xl bg-emerald-500/15 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Auto-Healed (24h)</div>
                <div className="text-sm font-bold text-emerald-400 font-display">{stats.autoHealedCount24h} Resolved</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
