import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Flame,
  Network,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  Timer,
  Zap,
} from 'lucide-react';
import { ChaosExperiment } from '../types';

interface ChaosSandboxProps {
  experiments: ChaosExperiment[];
  onTriggerExperiment: (experimentId: string) => Promise<void>;
}

export const ChaosSandbox: React.FC<ChaosSandboxProps> = ({
  experiments,
  onTriggerExperiment,
}) => {
  const [runningId, setRunningId] = useState<string | null>(null);
  const [activeExperiment, setActiveExperiment] = useState<ChaosExperiment | null>(
    experiments[0] || null
  );

  const handleLaunch = async (exp: ChaosExperiment) => {
    setRunningId(exp.id);
    setActiveExperiment({ ...exp, status: 'running', elapsedSeconds: 1 });

    await onTriggerExperiment(exp.id);

    // Simulate real-time auto-healing progression
    setTimeout(() => {
      setActiveExperiment((prev) =>
        prev?.id === exp.id ? { ...prev, status: 'mitigated', elapsedSeconds: exp.durationSeconds } : prev
      );
      setRunningId(null);
    }, 2800);
  };

  const getFaultIcon = (faultType: string) => {
    switch (faultType) {
      case 'memory_leak':
        return <Flame className="w-5 h-5 text-amber-400" />;
      case 'network_latency':
        return <Network className="w-5 h-5 text-cyan-400" />;
      case 'pod_kill':
        return <AlertOctagon className="w-5 h-5 text-rose-400" />;
      case 'db_pool_exhaust':
        return <Database className="w-5 h-5 text-purple-400" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Flame className="w-5 h-5 text-rose-400" />
            Chaos Engineering & Autonomous SRE Resilience Sandbox
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Inject synthetic memory ballooning leaks, eBPF socket packet drops, and sudden SIGKILL termination to benchmark platform Mean Time to Detect (MTTD) and Mean Time to Recover (MTTR).
          </p>
        </div>

        {/* Global SRE Auto-Healing Reliability Score */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Resilience Score</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">99.98% MTTD / MTTR</div>
          </div>
        </div>
      </div>

      {/* Experiments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {experiments.map((exp) => {
          const isCurrentlyRunning = runningId === exp.id || (activeExperiment?.id === exp.id && activeExperiment.status === 'running');
          const isMitigated = activeExperiment?.id === exp.id && activeExperiment.status === 'mitigated';

          return (
            <div
              key={exp.id}
              onClick={() => setActiveExperiment(exp)}
              className={`rounded-xl border p-5 transition-all cursor-pointer shadow-lg ${
                activeExperiment?.id === exp.id
                  ? 'bg-slate-900 border-rose-500/80 ring-2 ring-rose-500/20'
                  : 'bg-slate-900/70 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                    {getFaultIcon(exp.faultType)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{exp.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Target: <strong className="text-slate-200">{exp.targetService}</strong>
                    </span>
                  </div>
                </div>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    isCurrentlyRunning
                      ? 'bg-rose-500/10 text-rose-400 border-rose-500/30 animate-pulse'
                      : isMitigated
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {isCurrentlyRunning ? 'Injected / Active' : isMitigated ? 'Self-Healed' : 'Ready'}
                </span>
              </div>

              <p className="text-xs text-slate-300 mt-3 leading-relaxed">{exp.description}</p>

              {/* Telemetry benchmarks */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Mean Time to Detect (MTTD)
                  </span>
                  <span className="font-mono font-bold text-amber-400 text-sm mt-0.5 block">
                    {exp.mttdSeconds} seconds
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">
                    Mean Time to Recover (MTTR)
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-sm mt-0.5 block">
                    {exp.mttrSeconds} seconds
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 pt-2 flex items-center justify-end">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLaunch(exp);
                  }}
                  disabled={isCurrentlyRunning}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-amber-600 hover:from-rose-500 hover:to-amber-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-rose-500/20 transition-all"
                >
                  {isCurrentlyRunning ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  <span>{isCurrentlyRunning ? 'Observing Auto-Healing...' : 'Inject Chaos Fault'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Real-time Telemetry & Healing Timeline */}
      {activeExperiment && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">
                Live Chaos Observability Stream: {activeExperiment.name}
              </h3>
            </div>
            <span className="text-xs font-mono text-slate-400">Target: {activeExperiment.targetService}</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-2">
            <div className="text-slate-500">--- INJECTED EXPERIMENT TIMELINE & AUTONOMOUS RECOVERY ---</div>
            <div className="text-rose-400">
              [T-0s] Fault injected: {activeExperiment.faultType} triggered on {activeExperiment.targetService}.
            </div>
            <div className="text-amber-300">
              [T+{activeExperiment.mttdSeconds}s] Observability probe triggered alert. Anomaly correlation engine identified failure pattern.
            </div>
            <div className="text-cyan-300">
              [T+{((activeExperiment.mttdSeconds || 10) + 1.2).toFixed(1)}s] Autonomous Auto-Healing Agent initiated rolling zero-downtime mitigation.
            </div>
            <div className="text-emerald-400 font-bold">
              [T+{((activeExperiment.mttdSeconds || 10) + (activeExperiment.mttrSeconds || 2)).toFixed(1)}s] Incident fully resolved. Service healthy. Zero dropped user requests.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
