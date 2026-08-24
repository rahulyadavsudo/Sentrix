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
  Terminal,
  ChevronRight,
  Flame,
  ThermometerSnowflake,
  ThermometerSun,
  Gauge,
  Sliders,
} from 'lucide-react';
import { K8sNamespace, K8sNode, K8sPod } from '../types';
import { NodeDetailsDrawer } from './NodeDetailsDrawer';

interface ClusterTopologyViewProps {
  nodes: K8sNode[];
  pods: K8sPod[];
  namespaces: K8sNamespace[];
  onSelectPodForDiagnostics?: (podName: string) => void;
  onAutoHealPod?: (podName: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export type HeatmapMetricMode = 'cpu' | 'memory' | 'blended' | 'saturation' | 'off';
export type HeatTier = 'cool' | 'moderate' | 'elevated' | 'critical';

export const ClusterTopologyView: React.FC<ClusterTopologyViewProps> = ({
  nodes,
  pods,
  namespaces,
  onSelectPodForDiagnostics,
  onAutoHealPod,
  onShowToast,
}) => {
  const [selectedNamespace, setSelectedNamespace] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedPod, setSelectedPod] = useState<K8sPod | null>(null);
  const [selectedNodeForDrawer, setSelectedNodeForDrawer] = useState<K8sNode | null>(null);
  const [isNodeDrawerOpen, setIsNodeDrawerOpen] = useState<boolean>(false);

  // Heatmap Overlay State
  const [heatmapMode, setHeatmapMode] = useState<HeatmapMetricMode>('blended');
  const [selectedHeatTierFilter, setSelectedHeatTierFilter] = useState<HeatTier | 'all'>('all');

  const handleOpenNodeDrawer = (node: K8sNode) => {
    setSelectedNodeForDrawer(node);
    setIsNodeDrawerOpen(true);
  };

  // Helper to calculate heatmap value & tier for a node
  const getNodeHeatData = (node: K8sNode) => {
    let value = 0;
    let label = '';

    if (heatmapMode === 'cpu') {
      value = node.cpuUsagePercent;
      label = `${value}% CPU`;
    } else if (heatmapMode === 'memory') {
      value = node.memoryUsagePercent;
      label = `${value}% RAM`;
    } else if (heatmapMode === 'saturation') {
      value = Math.round((node.podsRunning / node.podsCapacity) * 100);
      label = `${value}% Slots`;
    } else if (heatmapMode === 'blended') {
      // Balanced blended stress index
      value = Math.round(node.cpuUsagePercent * 0.5 + node.memoryUsagePercent * 0.5);
      label = `${value}% Stress`;
    } else {
      value = 0;
      label = 'Standard';
    }

    let tier: HeatTier = 'cool';
    if (value >= 85) {
      tier = 'critical';
    } else if (value >= 70) {
      tier = 'elevated';
    } else if (value >= 45) {
      tier = 'moderate';
    } else {
      tier = 'cool';
    }

    return { value, label, tier };
  };

  // Calculate cluster-wide thermal averages
  const avgCpu = nodes.length
    ? Math.round(nodes.reduce((acc, n) => acc + n.cpuUsagePercent, 0) / nodes.length)
    : 0;
  const avgMem = nodes.length
    ? Math.round(nodes.reduce((acc, n) => acc + n.memoryUsagePercent, 0) / nodes.length)
    : 0;
  const hotNodesCount = nodes.filter((n) => {
    const { tier } = getNodeHeatData(n);
    return tier === 'elevated' || tier === 'critical';
  }).length;

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
      {/* Kubernetes Nodes Infrastructure Layer with Real-Time Heatmap Overlay */}
      <div className="bg-[#0e0e11] border border-white/10 rounded-2xl p-5 shadow-xl space-y-4">
        {/* Heatmap Control & Infrastructure Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white flex items-center gap-2 font-display">
                <Server className="w-4 h-4 text-cyan-400" />
                Cluster Node Infrastructure Pool ({nodes.length} Nodes)
              </h3>
              <span className="text-[11px] font-mono text-cyan-300 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-500/30">
                Heatmap Overlay: <strong className="uppercase">{heatmapMode}</strong>
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live thermal resource heatmap mapping real-time CPU, RAM, and Pod pressure across nodes
            </p>
          </div>

          {/* Metric Selector Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap bg-[#141418] p-1.5 rounded-xl border border-white/10">
            <span className="text-[11px] font-bold text-slate-400 px-2 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400" /> Metric:
            </span>

            <button
              onClick={() => {
                setHeatmapMode('blended');
                onShowToast?.('info', 'Heatmap Updated', 'Displaying combined CPU + RAM Stress Heatmap');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                heatmapMode === 'blended'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Zap className="w-3 h-3" />
              <span>Combined Stress</span>
            </button>

            <button
              onClick={() => {
                setHeatmapMode('cpu');
                onShowToast?.('info', 'Heatmap Updated', 'Displaying Real-Time CPU Utilization Heatmap');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                heatmapMode === 'cpu'
                  ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Cpu className="w-3 h-3" />
              <span>CPU Heat</span>
            </button>

            <button
              onClick={() => {
                setHeatmapMode('memory');
                onShowToast?.('info', 'Heatmap Updated', 'Displaying Real-Time Memory Utilization Heatmap');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                heatmapMode === 'memory'
                  ? 'bg-indigo-500 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Gauge className="w-3 h-3" />
              <span>Memory Heat</span>
            </button>

            <button
              onClick={() => {
                setHeatmapMode('saturation');
                onShowToast?.('info', 'Heatmap Updated', 'Displaying Pod Slot Saturation Heatmap');
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                heatmapMode === 'saturation'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Layers className="w-3 h-3" />
              <span>Pod Saturation</span>
            </button>

            <button
              onClick={() => setHeatmapMode('off')}
              className={`px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                heatmapMode === 'off'
                  ? 'bg-slate-700 text-white'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Disable heatmap overlay"
            >
              Off
            </button>
          </div>
        </div>

        {/* Heatmap Legend & Thermal Metric Banner */}
        {heatmapMode !== 'off' && (
          <div className="px-4 py-2.5 rounded-xl bg-[#121216] border border-white/5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
            {/* Legend Spectrum with Click-to-Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1 mr-1">
                <ThermometerSun className="w-3.5 h-3.5 text-amber-400" /> Thermal Legend:
              </span>

              <button
                onClick={() =>
                  setSelectedHeatTierFilter(selectedHeatTierFilter === 'cool' ? 'all' : 'cool')
                }
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                  selectedHeatTierFilter === 'cool'
                    ? 'bg-emerald-500/30 text-emerald-200 border-emerald-400 ring-1 ring-emerald-400'
                    : 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30 hover:bg-emerald-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Cool (&lt;45%)</span>
              </button>

              <button
                onClick={() =>
                  setSelectedHeatTierFilter(
                    selectedHeatTierFilter === 'moderate' ? 'all' : 'moderate'
                  )
                }
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                  selectedHeatTierFilter === 'moderate'
                    ? 'bg-blue-500/30 text-blue-200 border-blue-400 ring-1 ring-blue-400'
                    : 'bg-blue-950/30 text-blue-300 border-blue-500/30 hover:bg-blue-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-blue-400" />
                <span>Moderate (45-70%)</span>
              </button>

              <button
                onClick={() =>
                  setSelectedHeatTierFilter(
                    selectedHeatTierFilter === 'elevated' ? 'all' : 'elevated'
                  )
                }
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                  selectedHeatTierFilter === 'elevated'
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400 ring-1 ring-amber-400'
                    : 'bg-amber-950/30 text-amber-300 border-amber-500/30 hover:bg-amber-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span>Elevated (70-85%)</span>
              </button>

              <button
                onClick={() =>
                  setSelectedHeatTierFilter(
                    selectedHeatTierFilter === 'critical' ? 'all' : 'critical'
                  )
                }
                className={`px-2 py-0.5 rounded-md text-[11px] font-bold border transition-all flex items-center gap-1.5 ${
                  selectedHeatTierFilter === 'critical'
                    ? 'bg-rose-500/30 text-rose-200 border-rose-400 ring-1 ring-rose-400'
                    : 'bg-rose-950/30 text-rose-300 border-rose-500/30 hover:bg-rose-900/40'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>Critical (&gt;85%)</span>
              </button>

              {selectedHeatTierFilter !== 'all' && (
                <button
                  onClick={() => setSelectedHeatTierFilter('all')}
                  className="text-[10px] text-slate-400 hover:text-white underline ml-1"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* Quick Cluster Thermal Summary */}
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 shrink-0">
              <span>Cluster Avg CPU: <strong className="text-cyan-300">{avgCpu}%</strong></span>
              <span>&bull;</span>
              <span>Avg RAM: <strong className="text-indigo-300">{avgMem}%</strong></span>
              <span>&bull;</span>
              <span>Hot Nodes: <strong className={hotNodesCount > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>{hotNodesCount}</strong></span>
            </div>
          </div>
        )}

        {/* Nodes Grid with Dynamic Thermal Heatmap Rendering */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {nodes.map((node) => {
            const isControlPlane = node.role === 'control-plane';
            const isSelected = selectedNodeForDrawer?.id === node.id && isNodeDrawerOpen;
            const heat = getNodeHeatData(node);

            const isFilteredOut =
              selectedHeatTierFilter !== 'all' && heat.tier !== selectedHeatTierFilter;

            // Define Heatmap visual styles based on Tier
            let heatCardStyle = 'bg-slate-900/90 border-slate-800';
            let heatBadgeColor = 'bg-slate-800 text-slate-300 border-slate-700';
            let topGlowGradient = 'from-transparent to-transparent';
            let heatIcon = <ThermometerSnowflake className="w-3 h-3 text-emerald-400" />;

            if (heatmapMode !== 'off') {
              if (heat.tier === 'critical') {
                heatCardStyle =
                  'bg-gradient-to-b from-rose-950/50 via-slate-900 to-slate-900 border-rose-500/60 shadow-lg shadow-rose-500/10 ring-1 ring-rose-500/40';
                heatBadgeColor =
                  'bg-rose-500/20 text-rose-300 border-rose-500/50 animate-pulse';
                topGlowGradient = 'from-rose-500 via-rose-400 to-orange-500';
                heatIcon = <Flame className="w-3 h-3 text-rose-400" />;
              } else if (heat.tier === 'elevated') {
                heatCardStyle =
                  'bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900 border-amber-500/60 shadow-md shadow-amber-500/10';
                heatBadgeColor =
                  'bg-amber-500/20 text-amber-300 border-amber-500/40';
                topGlowGradient = 'from-amber-500 via-orange-400 to-yellow-500';
                heatIcon = <Flame className="w-3 h-3 text-amber-400" />;
              } else if (heat.tier === 'moderate') {
                heatCardStyle =
                  'bg-gradient-to-b from-blue-950/30 via-slate-900 to-slate-900 border-blue-500/40';
                heatBadgeColor =
                  'bg-blue-500/20 text-blue-300 border-blue-500/30';
                topGlowGradient = 'from-blue-500 via-cyan-400 to-indigo-500';
                heatIcon = <Zap className="w-3 h-3 text-blue-400" />;
              } else {
                heatCardStyle =
                  'bg-gradient-to-b from-emerald-950/20 via-slate-900 to-slate-900 border-emerald-500/30';
                heatBadgeColor =
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
                topGlowGradient = 'from-emerald-500 via-teal-400 to-cyan-500';
                heatIcon = <ThermometerSnowflake className="w-3 h-3 text-emerald-400" />;
              }
            }

            return (
              <div
                key={node.id}
                onClick={() => handleOpenNodeDrawer(node)}
                className={`rounded-xl p-4 shadow-md space-y-3 cursor-pointer transition-all duration-200 group relative overflow-hidden ${heatCardStyle} ${
                  isSelected
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 shadow-cyan-500/20 shadow-xl'
                    : 'hover:border-cyan-400/70 hover:shadow-xl hover:-translate-y-0.5'
                } ${isFilteredOut ? 'opacity-30 scale-95 pointer-events-none' : 'opacity-100'}`}
              >
                {/* Top Ambient Thermal Glow Bar */}
                {heatmapMode !== 'off' && (
                  <div
                    className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${topGlowGradient}`}
                  />
                )}

                {/* Header Row: Role & Heatmap Status */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      isControlPlane
                        ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                        : 'bg-blue-500/10 text-blue-300 border-blue-500/30'
                    }`}
                  >
                    {node.role}
                  </span>

                  {/* Thermal Heat Badge */}
                  {heatmapMode !== 'off' ? (
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 font-mono ${heatBadgeColor}`}
                    >
                      {heatIcon}
                      <span>{heat.label}</span>
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {node.status}
                    </span>
                  )}
                </div>

                <div>
                  <h4
                    className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate"
                    title={node.name}
                  >
                    {node.name}
                  </h4>
                  <div className="text-[11px] text-slate-400 font-mono">
                    {node.region} / {node.zone} &bull; {node.cpuCores} Cores &bull; {node.memoryTotalGB}GB RAM
                  </div>
                </div>

                {/* Node CPU Meter with Heat Indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" /> CPU Usage
                    </span>
                    <span className="text-slate-200 font-mono font-semibold">
                      {node.cpuUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
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

                {/* Node RAM Meter with Heat Indicator */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Gauge className="w-3 h-3 text-indigo-400" /> RAM Usage
                    </span>
                    <span className="text-slate-200 font-mono font-semibold">
                      {node.memoryUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${
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

                {/* Card Footer */}
                <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-400">
                  <span>
                    Pods:{' '}
                    <strong className="font-mono text-white font-bold">
                      {node.podsRunning} / {node.podsCapacity}
                    </strong>
                  </span>
                  <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 text-[10px] font-bold">
                    <span>Inspect Node</span>
                    <ChevronRight className="w-3 h-3" />
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

      {/* Node Side Drawer (Detailed Pod Scheduling & Kernel Event Logs) */}
      <NodeDetailsDrawer
        node={selectedNodeForDrawer}
        allPods={pods}
        isOpen={isNodeDrawerOpen}
        onClose={() => {
          setIsNodeDrawerOpen(false);
          setSelectedNodeForDrawer(null);
        }}
        onSelectPodForDiagnostics={onSelectPodForDiagnostics}
        onShowToast={onShowToast}
      />
    </div>
  );
};
