import React, { useState } from 'react';
import {
  ArrowDownRight,
  CheckCircle2,
  DollarSign,
  Layers,
  PieChart,
  RefreshCw,
  Sparkles,
  TrendingDown,
  Zap,
} from 'lucide-react';
import { FinOpsBreakdown } from '../types';

interface FinOpsPanelProps {
  finops: FinOpsBreakdown | null;
  onApplyRightSizing?: (recId: string) => void;
}

export const FinOpsPanel: React.FC<FinOpsPanelProps> = ({
  finops,
  onApplyRightSizing,
}) => {
  const [appliedRecs, setAppliedRecs] = useState<{ [id: string]: boolean }>({});

  if (!finops) return null;

  const handleApply = (id: string) => {
    setAppliedRecs((prev) => ({ ...prev, [id]: true }));
    if (onApplyRightSizing) onApplyRightSizing(id);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Kubernetes FinOps & Automated Cost Optimizer
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Real-time attribution calculates requested vs actual CPU/memory allocation across all namespaces, flagging idle overprovisioning waste and generating right-sizing patches.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-emerald-950/40 border border-emerald-500/30 px-4 py-2.5 rounded-xl">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-[10px] text-emerald-300 uppercase font-bold">Identified Monthly Savings</div>
            <div className="text-xl font-bold text-white font-mono">${finops.potentialMonthlySavingsUSD} / mo</div>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs text-slate-400">Total Monthly Cluster Spend</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">${finops.totalMonthlySpendUSD}</div>
          <div className="text-[11px] text-slate-500 mt-1">4 Node Instances (us-east-1)</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs text-slate-400">Idle & Overprovisioned Waste</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">${finops.idleWasteSpendUSD}</div>
          <div className="text-[11px] text-rose-300 mt-1">27.1% of total capacity unused</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-xs text-slate-400">Optimized Post-Patch Spend</div>
          <div className="text-2xl font-bold text-emerald-400 font-mono mt-1">
            ${finops.totalMonthlySpendUSD - finops.potentialMonthlySavingsUSD}
          </div>
          <div className="text-[11px] text-emerald-300 mt-1">&darr; 20.4% total infrastructure reduction</div>
        </div>
      </div>

      {/* Main Grid: Namespace Spend Breakdown & Right-Sizing Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Namespace Cost Breakdown */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <PieChart className="w-4 h-4 text-cyan-400" />
            Namespace Cost & Efficiency Breakdown
          </h3>

          <div className="space-y-3">
            {finops.namespaceBreakdown.map((ns) => (
              <div
                key={ns.namespace}
                className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-xs">{ns.namespace}</span>
                  <span className="text-xs font-mono font-bold text-cyan-400">${ns.monthlyCostUSD} / mo</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-[11px]">
                  <div>
                    <div className="text-slate-400">CPU Efficiency: {ns.cpuEfficiencyPercent}%</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-cyan-500" style={{ width: `${ns.cpuEfficiencyPercent}%` }} />
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-400">Memory Efficiency: {ns.memEfficiencyPercent}%</div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-indigo-500" style={{ width: `${ns.memEfficiencyPercent}%` }} />
                    </div>
                  </div>
                </div>

                {ns.wasteCostUSD > 100 && (
                  <div className="text-[10px] text-amber-400 flex items-center gap-1 pt-1">
                    <ArrowDownRight className="w-3 h-3" /> Potential waste reduction: ${ns.wasteCostUSD}/mo
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Right: Right-Sizing Recommendations */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            1-Click Resource Right-Sizing Patches
          </h3>

          <div className="space-y-3">
            {finops.rightSizingRecommendations.map((rec) => {
              const isApplied = appliedRecs[rec.id];

              return (
                <div
                  key={rec.id}
                  className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white">{rec.serviceName}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">({rec.namespace})</span>
                    </div>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      Save ${rec.monthlySavingsUSD}/mo
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {rec.reason}
                  </p>

                  <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 flex items-center justify-between">
                    <div>
                      <span className="text-rose-400">Req: CPU {rec.currentRequests.cpu}, RAM {rec.currentRequests.memory}</span>
                      <span className="text-slate-500 mx-2">&rarr;</span>
                      <span className="text-emerald-400">Patch: CPU {rec.recommendedRequests.cpu}, RAM {rec.recommendedRequests.memory}</span>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    {isApplied ? (
                      <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Right-sizing Applied
                      </span>
                    ) : (
                      <button
                        onClick={() => handleApply(rec.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <Zap className="w-3 h-3 fill-current" /> Apply Right-Sizing Patch
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
