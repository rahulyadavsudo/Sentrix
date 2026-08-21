import React, { useState } from 'react';
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Cpu,
  Layers,
  Power,
  RefreshCw,
  Sliders,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { KedaScaledObject } from '../types';

interface KedaAutoscalingPanelProps {
  scaledObjects: KedaScaledObject[];
  onToggleScaleZero: (id: string, enabled: boolean) => Promise<void>;
  onRefresh?: () => void;
}

export function KedaAutoscalingPanel({
  scaledObjects,
  onToggleScaleZero,
  onRefresh,
}: KedaAutoscalingPanelProps) {
  const [selectedId, setSelectedId] = useState<string>(
    scaledObjects[0]?.id || ''
  );
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const currentObject =
    scaledObjects.find((s) => s.id === selectedId) || scaledObjects[0];

  const handleToggle = async (id: string, currentEnabled: boolean) => {
    setIsUpdating(true);
    try {
      await onToggleScaleZero(id, !currentEnabled);
    } finally {
      setIsUpdating(false);
    }
  };

  const getTriggerBadge = (type: string) => {
    switch (type) {
      case 'kafka':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-300';
      case 'prometheus':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-300';
      case 'redis':
        return 'bg-red-500/10 border-red-500/30 text-red-300';
      case 'cpu_memory':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-300';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                KEDA Event-Driven Autoscaler & Smart HPA Engine
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 border border-purple-500/30 text-purple-400 uppercase">
                KEDA Operator v2.14 Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Event-driven elasticity driven by Kafka partition consumer lag, Redis queue backlog, and custom Prometheus SLO metrics with scale-to-zero capabilities.
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1 text-xs font-medium self-start md:self-auto"
            title="Refresh Scalers"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: ScaledObjects List */}
        <div className="lg:col-span-4 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Active ScaledObjects ({scaledObjects.length})
          </span>

          <div className="space-y-3">
            {scaledObjects.map((obj) => {
              const isSelected = obj.id === selectedId;
              return (
                <div
                  key={obj.id}
                  onClick={() => setSelectedId(obj.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-purple-950/50 border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-white font-mono truncate max-w-[190px]">
                      {obj.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {obj.currentReplicas} / {obj.maxReplicaCount} Pods
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                    <span>Target: {obj.targetDeployment}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      ns: {obj.namespace}
                    </span>
                  </div>

                  {/* Triggers Chips */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {obj.triggers.map((trig, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${getTriggerBadge(
                          trig.type
                        )}`}
                      >
                        {trig.type}: {trig.metricValue}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400">Scale-to-Zero:</span>
                    <span
                      className={`font-bold ${
                        obj.scaleToZeroEnabled
                          ? 'text-emerald-400'
                          : 'text-slate-400'
                      }`}
                    >
                      {obj.scaleToZeroEnabled ? 'Enabled (Min: 0)' : 'Disabled (Min: 1+)'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Scaler Details & Controls */}
        <div className="lg:col-span-8 space-y-4">
          {currentObject ? (
            <div className="space-y-4">
              {/* Scaler Details Header */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono">
                        {currentObject.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        Autoscaling Active
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Target Deployment: {currentObject.targetDeployment} | Cooldown: {currentObject.cooldownPeriodSec}s
                    </p>
                  </div>

                  {/* Scale to Zero Toggle */}
                  <button
                    onClick={() =>
                      handleToggle(currentObject.id, currentObject.scaleToZeroEnabled)
                    }
                    disabled={isUpdating}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 transition-all ${
                      currentObject.scaleToZeroEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Power className="w-3.5 h-3.5" />
                    <span>
                      {currentObject.scaleToZeroEnabled
                        ? 'Scale-to-Zero ON (0 Pods idle)'
                        : 'Scale-to-Zero OFF'}
                    </span>
                  </button>
                </div>

                {/* Metrics Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Current Replicas</div>
                    <div className="text-lg font-bold text-purple-400 mt-1">
                      {currentObject.currentReplicas} Pods
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Desired Replicas</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {currentObject.desiredReplicas} Pods
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Min / Max Range</div>
                    <div className="text-lg font-bold text-slate-300 mt-1">
                      {currentObject.minReplicaCount} - {currentObject.maxReplicaCount}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Cooldown Window</div>
                    <div className="text-lg font-bold text-cyan-400 mt-1">
                      {currentObject.cooldownPeriodSec}s
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Scaling Triggers */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Event Triggers & Metric Thresholds ({currentObject.triggers.length})
                    </h4>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400">
                    Polling Interval: 15s
                  </span>
                </div>

                <div className="space-y-3">
                  {currentObject.triggers.map((trig, idx) => (
                    <div
                      key={idx}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getTriggerBadge(
                              trig.type
                            )}`}
                          >
                            Trigger #{idx + 1}: {trig.type}
                          </span>
                          <span className="text-xs font-bold text-white">
                            Current: {trig.metricValue}
                          </span>
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          Target Threshold: <strong className="text-purple-300">{trig.targetValue}</strong>
                        </span>
                      </div>

                      {/* Trigger Metadata */}
                      <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-300 space-y-1">
                        {Object.entries(trig.metadata).map(([k, v]) => (
                          <div key={k} className="flex items-center justify-between">
                            <span className="text-slate-500">{k}:</span>
                            <span className="text-slate-200 truncate max-w-[380px]">{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Scaling History Timeline */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Autoscaling Trajectory (Past 30 min)
                </span>

                <div className="grid grid-cols-4 gap-2 pt-2">
                  {currentObject.scalingHistory.map((hist, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center space-y-1"
                    >
                      <div className="text-[10px] text-slate-500 font-mono">{hist.time}</div>
                      <div className="text-sm font-bold font-mono text-purple-400">
                        {hist.replicas} Pods
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Metric: {hist.metricValue}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Select a KEDA ScaledObject to inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
