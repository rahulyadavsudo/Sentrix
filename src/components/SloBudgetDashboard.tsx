import React from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Flame,
  Gauge,
  Layers,
  Lock,
  PieChart,
  ShieldAlert,
  ShieldCheck,
  Snowflake,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { SloTarget } from '../types';

interface SloBudgetDashboardProps {
  slos: SloTarget[];
  onToggleFreeze: (sloId: string, freeze: boolean) => Promise<void>;
}

export const SloBudgetDashboard: React.FC<SloBudgetDashboardProps> = ({
  slos,
  onToggleFreeze,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Gauge className="w-5 h-5 text-purple-400" />
            SLO & Error Budget Multi-Window Burn Rate Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Google SRE Workbook standard multi-burn-rate alerting (1h fast burn, 6h, 24h) protecting Tier-0 critical microservices with automated deployment pipeline freezing.
          </p>
        </div>

        {/* Global Reliability Overview */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <ShieldCheck className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Tier-0 Global SLO</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">99.94% Compliant</div>
          </div>
        </div>
      </div>

      {/* SLO Targets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {slos.map((slo) => {
          const isAtRisk = slo.errorBudgetRemainingPercent < 30 || slo.burnRate1h > 3.0;
          const isHealthy = slo.errorBudgetRemainingPercent >= 70;

          return (
            <div
              key={slo.id}
              className={`rounded-xl border p-5 transition-all shadow-lg ${
                isAtRisk
                  ? 'bg-slate-900 border-amber-500/60 shadow-amber-500/5 ring-1 ring-amber-500/20'
                  : 'bg-slate-900 border-slate-800'
              }`}
            >
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
                      {slo.tier}
                    </span>
                    <span className="text-[10px] text-slate-400">{slo.windowDays}-Day Rolling Window</span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">{slo.serviceName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{slo.sliMetricName}</p>
                </div>

                {/* Error Budget Remaining % Badge */}
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Budget Left</div>
                  <div
                    className={`text-xl font-bold font-mono ${
                      isHealthy ? 'text-emerald-400' : isAtRisk ? 'text-amber-400' : 'text-rose-400'
                    }`}
                  >
                    {slo.errorBudgetRemainingPercent}%
                  </div>
                </div>
              </div>

              {/* Progress Bar of Budget */}
              <div className="mt-4 space-y-1.5">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>SLI Current: <strong className="text-white font-mono">{slo.currentSliPercent}%</strong></span>
                  <span>Target: <strong className="text-slate-300 font-mono">{slo.sloTargetPercent}%</strong></span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${
                      isHealthy
                        ? 'bg-emerald-500'
                        : isAtRisk
                        ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(0, slo.errorBudgetRemainingPercent))}%` }}
                  />
                </div>
              </div>

              {/* Multi-Window Burn Rates */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                  <span className="text-[10px] text-slate-500 block">1-Hour Burn</span>
                  <span
                    className={`font-mono font-bold text-xs mt-0.5 block ${
                      slo.burnRate1h > 3.0 ? 'text-rose-400' : 'text-slate-200'
                    }`}
                  >
                    {slo.burnRate1h}x
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                  <span className="text-[10px] text-slate-500 block">6-Hour Burn</span>
                  <span className="font-mono font-bold text-xs text-slate-200 mt-0.5 block">
                    {slo.burnRate6h}x
                  </span>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2">
                  <span className="text-[10px] text-slate-500 block">24-Hour Burn</span>
                  <span className="font-mono font-bold text-xs text-slate-200 mt-0.5 block">
                    {slo.burnRate24h}x
                  </span>
                </div>
              </div>

              {/* Time to Exhaustion & Pipeline Freeze Guard */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <div className="text-xs text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>
                    Exhaustion: <strong className="text-white font-mono">{slo.timeToExhaustionHours ? `${slo.timeToExhaustionHours}h` : 'Infinite (Healthy)'}</strong>
                  </span>
                </div>

                <button
                  onClick={() => onToggleFreeze(slo.id, !slo.pipelineFreezeTriggered)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    slo.pipelineFreezeTriggered
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                  }`}
                >
                  <Snowflake className={`w-3.5 h-3.5 ${slo.pipelineFreezeTriggered ? 'text-rose-400' : 'text-slate-400'}`} />
                  <span>{slo.pipelineFreezeTriggered ? 'Pipeline Frozen' : 'Freeze Pipeline'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
