import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  HardDrive,
  Info,
  Layers,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PredictiveOOMAlert } from '../types';

interface PredictiveLeakRadarProps {
  alerts: PredictiveOOMAlert[];
  onAutoHeal: (issueId: string, actionType: string) => void;
  onSimulateLeak: () => void;
  isHealing: boolean;
}

export const PredictiveLeakRadar: React.FC<PredictiveLeakRadarProps> = ({
  alerts,
  onAutoHeal,
  onSimulateLeak,
  isHealing,
}) => {
  const [selectedAlertId, setSelectedAlertId] = useState<string>(
    alerts[0]?.id || 'pred-oom-01'
  );

  const alert = alerts.find((a) => a.id === selectedAlertId) || alerts[0];
  const isResolved = alert?.status === 'resolved';

  // Format chart data
  const chartData = alert
    ? alert.historicalTrend.map((pt) => ({
        time: pt.time,
        actual: pt.actualMB,
        projected: pt.projectedMB || null,
        limit: alert.memoryLimitMB,
      }))
    : [];

  return (
    <div className="space-y-6">
      {/* Hero Warning & Mechanism Summary */}
      <div className={`p-5 rounded-xl border shadow-lg transition-all ${
        isResolved
          ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-100'
          : 'bg-amber-950/30 border-amber-500/50 text-amber-100 shadow-amber-500/5'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-xl border ${
              isResolved
                ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse'
            }`}>
              {isResolved ? <CheckCircle2 className="w-6 h-6" /> : <TrendingUp className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {isResolved
                    ? 'Memory Leak Mitigated: Stable Heap Trajectory'
                    : 'Predictive OOMWatch: Memory Leak Trajectory Detected'}
                </h2>
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                  isResolved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {isResolved ? 'RESOLVED' : 'ACTIVE THREAT'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed max-w-3xl">
                The SRE linear regression engine calculates <code className="text-cyan-300 font-bold font-mono">dM/dt = +{alert ? alert.leakSlopeMBPerMin : '18.4'} MB/min</code>.
                Without remediation, target pod <code className="text-amber-300 font-mono">{alert?.podName}</code> will breach its cgroups memory ceiling (<span className="text-rose-400 font-bold">{alert?.memoryLimitMB}Mi</span>) and be terminated with <span className="text-rose-300 font-semibold">SIGKILL (exit code 137: OOMKilled)</span>.
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-3">
            {!isResolved ? (
              <button
                onClick={() => onAutoHeal('issue-01', 'bump_memory')}
                disabled={isHealing}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-400 hover:to-rose-400 text-slate-950 font-bold text-xs shadow-lg shadow-orange-500/25 transition-all disabled:opacity-50"
              >
                {isHealing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4 fill-current" />
                )}
                <span>Proactively Patch Limit &rarr; 1024Mi</span>
              </button>
            ) : (
              <button
                onClick={onSimulateLeak}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Re-inject Leak Simulation
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Real-time KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Current Memory vs Limit */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Current Heap / Limit</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-white font-mono">
            {alert ? alert.currentMemoryMB : 456} <span className="text-xs text-slate-400">MB</span>
            <span className="text-xs text-slate-400 font-normal"> / {alert ? alert.memoryLimitMB : 512} MB</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-400">cgroups Allocation</span>
            <span className={`font-bold ${isResolved ? 'text-emerald-400' : 'text-amber-400'}`}>
              {alert ? alert.utilizationPercent : 89.1}%
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                isResolved ? 'bg-emerald-500' : 'bg-amber-500'
              }`}
              style={{ width: `${alert ? alert.utilizationPercent : 89.1}%` }}
            />
          </div>
        </div>

        {/* Metric 2: Growth Velocity dM/dt */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Leak Slope (dM/dt)</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-300 font-mono flex items-center gap-1">
            {isResolved ? '0.0' : `+${alert ? alert.leakSlopeMBPerMin : 18.4}`}
            <span className="text-xs text-slate-400 font-normal">MB/min</span>
          </div>
          <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
            <span className="font-semibold text-slate-300">Method:</span> Ordinary Least Squares (OLS)
          </div>
        </div>

        {/* Metric 3: Time-To-Crash Countdown */}
        <div className={`rounded-xl p-4 border shadow-md ${
          isResolved
            ? 'bg-slate-900 border-slate-800'
            : 'bg-rose-950/20 border-rose-500/40'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Predicted OOMKill Time</span>
            <Clock className={`w-4 h-4 ${isResolved ? 'text-slate-400' : 'text-rose-400 animate-pulse'}`} />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono">
            {isResolved ? (
              <span className="text-emerald-400 text-lg">Safe (&infin;)</span>
            ) : (
              <span className="text-rose-400">
                {alert?.predictedOOMMinutes || '11.4'} <span className="text-xs text-slate-400 font-normal">Minutes</span>
              </span>
            )}
          </div>
          <div className="mt-2 text-xs text-slate-400">
            {isResolved ? 'Pod running within safe limits' : 'Est. kernel SIGKILL at T+11.4m'}
          </div>
        </div>

        {/* Metric 4: Predictive Confidence */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Detection Confidence</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-300 font-mono">
            {alert?.confidenceScore || 96.8}%
          </div>
          <div className="mt-2 text-xs text-slate-400">
            R² Correlation: <span className="text-slate-200 font-mono">0.984</span> (High fit)
          </div>
        </div>
      </div>

      {/* Main Chart Section: Telemetry Curve & Projected Linear Slope */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-800 gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-cyan-400" />
              Memory Growth Curve vs. Projected OOM Crash Ceiling
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison of actual telemetry samples against linear extrapolation and the 512Mi cgroups ceiling.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full bg-cyan-400" />
              <span className="text-slate-300">Actual Memory</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-amber-400 border-t border-dashed border-amber-400" />
              <span className="text-slate-300">Projected (+18.4MB/m)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-1.5 bg-rose-500" />
              <span className="text-rose-400 font-bold">512MB Limit</span>
            </div>
          </div>
        </div>

        {/* Recharts Canvas */}
        <div className="h-72 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#06b6d4" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorProjected" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 11 }} />
              <YAxis stroke="#64748b" tick={{ fontSize: 11 }} domain={[0, 600]} unit="MB" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  color: '#f8fafc',
                }}
              />
              <ReferenceLine
                y={alert ? alert.memoryLimitMB : 512}
                label={{ value: 'Hard cgroups Limit (512MB)', fill: '#f43f5e', fontSize: 11, position: 'top' }}
                stroke="#f43f5e"
                strokeWidth={2}
                strokeDasharray="4 4"
              />
              <Area
                type="monotone"
                dataKey="actual"
                stroke="#06b6d4"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorActual)"
                name="Actual Memory (MB)"
              />
              <Area
                type="monotone"
                dataKey="projected"
                stroke="#f59e0b"
                strokeWidth={2.5}
                strokeDasharray="5 5"
                fillOpacity={1}
                fill="url(#colorProjected)"
                name="Projected Leak (MB)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Technical Diagnostics & Remediation Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Technical Root Cause Context */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-cyan-400" /> Root Cause Breakdown
          </h3>
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 space-y-2">
            <div className="text-amber-400 font-bold">
              [HEAP_LEAK_INSPECTOR] Detected uncollected slice pointers:
            </div>
            <div className="text-slate-400 leading-relaxed">
              Target microservice <span className="text-cyan-300">payment-gateway</span> retains incoming Stripe webhook JSON payloads in an in-memory hash table for idempotency verification. The cache expiration timer fails to dereference keys, resulting in <span className="text-amber-300 font-bold">+18.4MB</span> of uncollected heap every 60 seconds.
            </div>
          </div>
        </div>

        {/* Remediation Action Rationale */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-3.5">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" /> Automated Healing Strategy
          </h3>
          <ul className="space-y-2.5 text-xs text-slate-300">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                1
              </span>
              <span>
                <strong className="text-white">Proactive Memory Expansion:</strong> Patch Deployment <code className="text-cyan-300">resources.limits.memory</code> from 512Mi to 1024Mi to provide 8+ hours of headroom.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                2
              </span>
              <span>
                <strong className="text-white">Zero-Downtime Rolling Replacement:</strong> Spin up healthy replica container before draining leaky pod, maintaining 100% request throughput.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                3
              </span>
              <span>
                <strong className="text-white">Permanent Code Hotfix:</strong> Deploy patched release <code className="text-cyan-300">v2.4.2</code> with LRU cache eviction and explicit TTL dereferencing.
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
