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
}) => {
  return (
    <header className="bg-slate-950/70 dark:bg-slate-950/70 border-b border-white/10 text-white sticky top-0 z-40 backdrop-blur-xl shadow-2xl shadow-black/40 transition-colors duration-300">
      {/* Top Bar: Cluster Info & Global Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Logo & Platform Name */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/40 relative group">
              <div className="absolute inset-0 rounded-xl bg-cyan-400/20 blur-sm group-hover:blur-md transition-all" />
              <Activity className="w-5 h-5 text-white animate-pulse relative z-10" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-indigo-300 bg-clip-text text-transparent drop-shadow-sm">
                    Sentrix
                  </span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-400 tracking-wider">
                    v2.4
                  </span>
                </h1>

                {/* Modern Interactive Live Cluster Badge */}
                <button
                  type="button"
                  onClick={onOpenRegisterCluster}
                  className="group inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-900/90 hover:bg-emerald-950/40 border border-emerald-500/40 hover:border-emerald-400 text-emerald-300 text-xs font-semibold shadow-sm backdrop-blur-md transition-all duration-200"
                  title="Active Kubernetes Cluster - Click to view multi-cluster fleet or register cluster"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                  </span>
                  <span className="text-[11px] font-bold tracking-wide text-emerald-300">Live Cluster</span>
                  <span className="text-slate-600 text-[10px]">&bull;</span>
                  <span className="font-mono text-[10px] text-slate-300 group-hover:text-white transition-colors">
                    {primaryClusterName}
                  </span>
                  <span className="px-1.5 py-0.5 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                    Primary
                  </span>
                </button>
              </div>
              <p className="text-xs text-slate-400">
                Autonomous SRE Control Plane &bull; eBPF Telemetry &bull; Predictive OOM &bull; 1-Click Auto-Healing
              </p>
            </div>
          </div>

          {/* Connected GitHub Repository Badge & Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {repo && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-white/10 backdrop-blur-md text-xs text-slate-300 shadow-sm">
                <Github className="w-3.5 h-3.5 text-slate-300" />
                <span className="font-semibold text-slate-100">{repo.owner}/{repo.name}</span>
                <span className="text-slate-600">&bull;</span>
                <span className="text-cyan-400 font-mono font-medium">{repo.branch}</span>
                <span className="px-1.5 py-0.5 rounded bg-slate-800/80 border border-white/5 text-[10px] text-slate-300 flex items-center gap-1">
                  <GitPullRequest className="w-2.5 h-2.5" /> {repo.openPRs} PRs
                </span>
              </div>
            )}

            {/* Autonomous Self-Healing Toggle */}
            <button
              onClick={onToggleAutonomousHealing}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border backdrop-blur-md transition-all duration-200 ${
                autonomousHealing
                  ? 'glass-badge-emerald shadow-lg shadow-emerald-500/10 hover:bg-emerald-500/25'
                  : 'bg-slate-900/60 text-slate-400 border-white/10 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title="Autonomous remediation policies auto-fix known issues without manual intervention"
            >
              <Shield className={`w-3.5 h-3.5 ${autonomousHealing ? 'text-emerald-400' : 'text-slate-500'}`} />
              Auto-Healing: <span className="font-extrabold">{autonomousHealing ? 'ACTIVE' : 'MANUAL'}</span>
            </button>

            {/* Register Cluster Modal Button */}
            {onOpenRegisterCluster && (
              <button
                onClick={onOpenRegisterCluster}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900/60 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 backdrop-blur-md transition-all shadow-sm"
                title="Register a new Kubernetes cluster via Kubeconfig or endpoint"
              >
                <Server className="w-3.5 h-3.5 text-cyan-400" />
                <span>+ Cluster</span>
              </button>
            )}

            {/* Simulate Incident Button */}
            <button
              onClick={() => onSimulateIncident('memory_leak')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold glass-badge-amber hover:bg-amber-500/25 transition-all shadow-sm"
              title="Inject a memory leak trajectory (+18.4MB/min) into payment-gateway to test predictive OOM watchdog"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              Inject Leak Alert
            </button>

            {/* Dispatch Pipeline Button */}
            <button
              onClick={onTriggerPipeline}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-lg shadow-cyan-500/30 border border-cyan-400/40 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              Dispatch CI/CD Run
            </button>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 rounded-lg bg-slate-900/60 border border-white/10 backdrop-blur-md text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 hover:border-white/20 transition-all disabled:opacity-50 shadow-sm"
              title="Refresh cluster telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            {/* Dark / Light Theme Mode Toggle Button */}
            {onToggleTheme && (
              <button
                id="theme-toggle-button"
                onClick={onToggleTheme}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/60 border border-white/15 backdrop-blur-md text-xs font-medium text-slate-200 hover:text-white hover:border-cyan-400/40 hover:bg-slate-800/80 transition-all shadow-sm"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
              >
                {theme === 'dark' ? (
                  <>
                    <Sun className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-slate-300">Light</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    <span className="text-[11px] font-semibold text-slate-300">Dark</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Global Cluster Status Indicators Banner */}
        {stats && (
          <div className="mt-3.5 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
            {/* Health Score */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Cluster Health</div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-1">
                  <span>{stats.healthScore}%</span>
                  <span className="text-[10px] font-medium text-emerald-400">
                    {stats.healthScore >= 80 ? 'Optimal' : 'Degraded'}
                  </span>
                </div>
              </div>
            </div>

            {/* Pods Status */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-lg bg-blue-500/15 border border-blue-500/30 text-blue-400">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Pods State</div>
                <div className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
                  <span className="text-emerald-400">{stats.runningPods} OK</span>
                  {stats.unhealthyPods > 0 && (
                    <span className="text-rose-400 font-semibold">/ {stats.unhealthyPods} Alert</span>
                  )}
                </div>
              </div>
            </div>

            {/* CPU Utilization */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-cyan-400">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">CPU Load</div>
                <div className="text-sm font-bold text-slate-100">{stats.cpuUtilizationPercent}% Avg</div>
              </div>
            </div>

            {/* Memory Utilization */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">RAM Load</div>
                <div className="text-sm font-bold text-slate-100">{stats.memoryUtilizationPercent}% Avg</div>
              </div>
            </div>

            {/* Predictive Alerts */}
            <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border backdrop-blur-md transition-all ${
              stats.predictiveAlertsCount > 0
                ? 'bg-amber-500/10 border-amber-500/40 shadow-lg shadow-amber-500/5'
                : 'bg-slate-900/40 border-white/5 hover:border-white/15'
            }`}>
              <div className={`p-1.5 rounded-lg ${stats.predictiveAlertsCount > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' : 'bg-slate-800/40 text-slate-400'}`}>
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Predictive OOM</div>
                <div className={`text-sm font-bold ${stats.predictiveAlertsCount > 0 ? 'text-amber-300' : 'text-slate-300'}`}>
                  {stats.predictiveAlertsCount} Active Watch
                </div>
              </div>
            </div>

            {/* 24h Auto-Healed */}
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-slate-900/40 border border-white/5 backdrop-blur-md hover:border-white/15 transition-all">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Auto-Healed (24h)</div>
                <div className="text-sm font-bold text-emerald-400">{stats.autoHealedCount24h} Resolved</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
