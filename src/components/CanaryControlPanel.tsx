import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flame,
  GitBranch,
  Layers,
  Percent,
  Play,
  RefreshCw,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { CanaryDeployment } from '../types';

interface CanaryControlPanelProps {
  canary: CanaryDeployment | null;
  onShiftTraffic: (weight: number) => void;
  onPromoteCanary: () => void;
  onRollbackCanary: () => void;
  isUpdating: boolean;
}

export const CanaryControlPanel: React.FC<CanaryControlPanelProps> = ({
  canary,
  onShiftTraffic,
  onPromoteCanary,
  onRollbackCanary,
  isUpdating,
}) => {
  const [sliderValue, setSliderValue] = useState<number>(
    canary?.trafficWeight || 25
  );

  if (!canary) return null;

  const isRolledBack = canary.status === 'rolled_back';
  const isPromoted = canary.status === 'promoted';

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSliderValue(val);
  };

  const handleApplyWeight = () => {
    onShiftTraffic(sliderValue);
  };

  return (
    <div className="space-y-6">
      {/* Top Hero Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-lg font-bold text-white tracking-tight">
                ArgoCD Progressive Canary Deployment & Traffic Shifter
              </h2>
              <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${
                isRolledBack
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : isPromoted
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
              }`}>
                {isRolledBack ? 'ROLLED BACK' : isPromoted ? '100% PROMOTED' : `TRAFFIC: ${canary.trafficWeight}%`}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              Target Service: <code className="text-cyan-300 font-mono font-bold">{canary.name}</code> &bull; Metric-gated automated rollback triggers if error rate &gt; {canary.autoRollbackThreshold.maxErrorRate}% or p99 latency &gt; {canary.autoRollbackThreshold.maxP99LatencyMs}ms.
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRollbackCanary}
            disabled={isUpdating || isRolledBack}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-all disabled:opacity-40"
            title="Immediately cut all canary traffic to 0% and revert ingress routing"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Emergency Rollback</span>
          </button>
          <button
            onClick={onPromoteCanary}
            disabled={isUpdating || isPromoted}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-40"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Promote to 100% Stable</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Traffic Shift Controller & Telemetry Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Col: Step-weight & Slider Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Percent className="w-4 h-4 text-cyan-400" />
              Progressive Weight Controller
            </h3>
            <span className="text-xs font-mono text-cyan-400 font-bold">
              Current: {canary.trafficWeight}% Canary / {100 - canary.trafficWeight}% Stable
            </span>
          </div>

          {/* Quick Preset Step Buttons */}
          <div className="space-y-2">
            <div className="text-xs text-slate-400">Step Rollout Presets:</div>
            <div className="grid grid-cols-5 gap-2">
              {canary.stepWeights.map((step) => {
                const isCurrent = canary.trafficWeight === step;
                return (
                  <button
                    key={step}
                    onClick={() => {
                      setSliderValue(step);
                      onShiftTraffic(step);
                    }}
                    disabled={isUpdating}
                    className={`py-2 px-1 rounded-lg text-xs font-bold border transition-all ${
                      isCurrent
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    {step}%
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Weight Slider */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Fine-grained Traffic Shift</span>
              <span className="font-mono text-white font-bold">{sliderValue}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={sliderValue}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Stable only)</span>
              <span>50% Split</span>
              <span>100% (Full Canary)</span>
            </div>

            {sliderValue !== canary.trafficWeight && (
              <button
                onClick={handleApplyWeight}
                disabled={isUpdating}
                className="w-full py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition-all shadow-md shadow-cyan-500/20 flex items-center justify-center gap-2"
              >
                {isUpdating && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Apply Traffic Weight ({sliderValue}%)</span>
              </button>
            )}
          </div>

          {/* Version Breakdown */}
          <div className="pt-3 border-t border-slate-800 grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Stable Target</div>
              <div className="font-bold text-slate-200 font-mono">{canary.stableVersion}</div>
              <div className="text-slate-400 text-[11px]">{100 - canary.trafficWeight}% Ingress Routing</div>
            </div>

            <div className="p-3 rounded-lg bg-slate-950 border border-cyan-500/30 space-y-1">
              <div className="text-[10px] text-cyan-400 uppercase font-semibold">Canary Target</div>
              <div className="font-bold text-cyan-300 font-mono">{canary.canaryVersion}</div>
              <div className="text-cyan-400 text-[11px]">{canary.trafficWeight}% Ingress Routing</div>
            </div>
          </div>
        </div>

        {/* Right Col: Real-time Telemetry & Metric Gates */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              Automated Metric-Gate Telemetry
            </h3>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> SLA Passed
            </span>
          </div>

          {/* Error Budget Remaining */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Monthly Error Budget</span>
              <span className="text-emerald-400 font-mono font-bold">{canary.errorBudgetRemainingPercent}%</span>
            </div>
            <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${canary.errorBudgetRemainingPercent}%` }}
              />
            </div>
          </div>

          {/* Latency Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Stable p99 Latency</div>
              <div className="text-xl font-bold text-white font-mono">{canary.p99LatencyMs.stable}ms</div>
              <div className="text-[10px] text-slate-400">Baseline threshold: &lt; 250ms</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
              <div className="text-[10px] text-cyan-400 uppercase font-semibold">Canary p99 Latency</div>
              <div className="text-xl font-bold text-cyan-300 font-mono">{canary.p99LatencyMs.canary}ms</div>
              <div className="text-[10px] text-emerald-400">+6ms within SLA boundary</div>
            </div>
          </div>

          {/* Error Rate Comparison */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="text-[10px] text-slate-400 uppercase font-semibold">Stable Error Rate</div>
              <div className="text-xl font-bold text-white font-mono">{canary.errorRatePercent.stable}%</div>
              <div className="text-[10px] text-slate-400">HTTP 5xx &lt; 0.05%</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1">
              <div className="text-[10px] text-cyan-400 uppercase font-semibold">Canary Error Rate</div>
              <div className="text-xl font-bold text-cyan-300 font-mono">{canary.errorRatePercent.canary}%</div>
              <div className="text-[10px] text-emerald-400">Rollback threshold: 1.0%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
