import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  Cpu,
  Eye,
  Filter,
  HardDrive,
  Layers,
  MoreVertical,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { K8sNamespace, K8sNode, K8sPod } from '../types';

interface ClusterTopologyViewProps {
  nodes: K8sNode[];
  pods: K8sPod[];
  namespaces: K8sNamespace[];
  onSelectPodForDiagnostics?: (podName: string) => void;
  onAutoHealPod?: (podName: string) => void;
}

export const ClusterTopologyView: React.FC<ClusterTopologyViewProps> = ({
  nodes,
  pods,
  namespaces,
  onSelectPodForDiagnostics,
  onAutoHealPod,
}) => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPod, setSelectedPod] = useState<K8sPod | null>(null);

  const filteredPods = pods.filter((pod) => {
    const matchesNamespace =
      selectedNamespace === 'all' || pod.namespace === selectedNamespace;
    const matchesSearch =
      pod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pod.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pod.node.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNamespace && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Kubernetes Nodes Infrastructure Layer */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            Cluster Node Infrastructure Pool ({nodes.length} Nodes)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            K8s Version: v1.31.2 &bull; Linux 6.8.0-48-generic
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node) => {
            const isControlPlane = node.role === 'control-plane';
            const isReady = node.status === 'Ready';

            return (
              <div
                key={node.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isControlPlane
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {node.role}
                  </span>
                  <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {node.status}
                  </span>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-white truncate" title={node.name}>
                    {node.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {node.region} / {node.zone} &bull; {node.cpuCores} Cores &bull; {node.memoryTotalGB}GB RAM
                  </div>
                </div>

                {/* Node CPU Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">CPU Usage</span>
                    <span className="text-slate-200 font-mono font-semibold">
                      {node.cpuUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        node.cpuUsagePercent > 80
                          ? 'bg-rose-500'
                          : node.cpuUsagePercent > 60
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${node.cpuUsagePercent}%` }}
                    />
                  </div>
                </div>

                {/* Node RAM Meter */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400">RAM Usage</span>
                    <span className="text-slate-200 font-mono font-semibold">
                      {node.memoryUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        node.memoryUsagePercent > 80
                          ? 'bg-rose-500'
                          : node.memoryUsagePercent > 60
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${node.memoryUsagePercent}%` }}
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Pods Running:</span>
                  <span className="font-mono text-white font-bold">
                    {node.podsRunning} / {node.podsCapacity}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pods Matrix & Namespace Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
        {/* Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
          {/* Namespace Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs text-slate-400 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Namespace:
            </span>
            <button
              onClick={() => setSelectedNamespace('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                selectedNamespace === 'all'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
              }`}
            >
              All ({pods.length})
            </button>
            {namespaces.map((ns) => (
              <button
                key={ns.name}
                onClick={() => setSelectedNamespace(ns.name)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors ${
                  selectedNamespace === ns.name
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                {ns.name}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search pods or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-full sm:w-64"
            />
          </div>
        </div>

        {/* Pods Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPods.map((pod) => {
            const isRunning = pod.status === 'Running';
            const isCrashLoop = pod.status === 'CrashLoopBackOff';
            const isPending = pod.status === 'Pending';
            const isOOM = pod.status === 'OOMKilled';
            const isLeaking = pod.isLeakingMemory;

            return (
              <div
                key={pod.id}
                onClick={() => setSelectedPod(pod)}
                className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                  isLeaking
                    ? 'bg-amber-950/20 border-amber-500/50 shadow-sm shadow-amber-500/10'
                    : isCrashLoop
                    ? 'bg-rose-950/20 border-rose-500/50 shadow-sm shadow-rose-500/10'
                    : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isCrashLoop || isOOM
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                        : isLeaking
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse'
                        : isPending
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    }`}
                  >
                    {isLeaking ? 'Leak Alert' : pod.status}
                  </span>

                  <span className="text-[10px] text-slate-400 font-mono">
                    {pod.namespace}
                  </span>
                </div>

                <h4 className="text-xs font-bold text-white mt-2 truncate" title={pod.name}>
                  {pod.name}
                </h4>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                  <span>Ready: {pod.ready}</span>
                  <span>Restarts: {pod.restarts}</span>
                  <span>Age: {pod.age}</span>
                </div>

                {/* Resource Meters */}
                <div className="mt-3 pt-2.5 border-t border-slate-800/80 space-y-2">
                  {/* Memory Usage */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">RAM: {pod.memoryMB}MB / {pod.memoryLimitMB}MB</span>
                      <span className={`font-mono font-bold ${pod.memoryUsage > 80 ? 'text-amber-400' : 'text-slate-300'}`}>
                        {pod.memoryUsage}%
                      </span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          pod.memoryUsage > 85
                            ? 'bg-amber-500'
                            : 'bg-cyan-500'
                        }`}
                        style={{ width: `${pod.memoryUsage}%` }}
                      />
                    </div>
                  </div>

                  {/* CPU Usage */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400">CPU: {pod.cpuMillicores}m / {pod.cpuLimit}m</span>
                      <span className="font-mono text-slate-300">{pod.cpuUsage}%</span>
                    </div>
                    <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{ width: `${pod.cpuUsage}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Predictive Leak Warning Tag */}
                {isLeaking && pod.predictedOOMMinutes && (
                  <div className="mt-2.5 px-2 py-1 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] text-amber-300 font-bold flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-400" />
                      Est. OOMKill: ~{pod.predictedOOMMinutes}m
                    </span>
                    <span className="text-cyan-300 underline cursor-pointer">Patch &rarr;</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pod Detail Modal */}
      {selectedPod && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-start justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {selectedPod.namespace}
                </span>
                <h3 className="text-base font-bold text-white mt-1">
                  {selectedPod.name}
                </h3>
                <div className="text-xs text-slate-400 font-mono mt-0.5">
                  IP: {selectedPod.ip} &bull; Node: {selectedPod.node}
                </div>
              </div>
              <button
                onClick={() => setSelectedPod(null)}
                className="text-slate-400 hover:text-white text-xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Container Details */}
            <div className="space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Container Specifications & Runtime State
              </div>
              {selectedPod.containers.map((c, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5"
                >
                  <div className="flex justify-between text-white font-bold">
                    <span>Container: {c.name}</span>
                    <span className={c.ready ? 'text-emerald-400' : 'text-rose-400'}>
                      {c.state.toUpperCase()} {c.reason && `(${c.reason})`}
                    </span>
                  </div>
                  <div className="text-slate-400">Image: {c.image}</div>
                  <div className="text-slate-400">Restarts: {c.restartCount}</div>
                  <div className="text-slate-400">
                    CPU: {c.cpuUsageMillicores}m limit {c.cpuLimitMillicores}m &bull; Memory:{' '}
                    {Math.round(c.memoryUsageBytes / 1024 / 1024)}MB limit{' '}
                    {Math.round(c.memoryLimitBytes / 1024 / 1024)}MB
                  </div>
                </div>
              ))}
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setSelectedPod(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
