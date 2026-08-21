import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Database,
  Globe,
  Layers,
  Lock,
  Network,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { ServiceMeshConnection, ServiceMeshGraph, ServiceMeshService } from '../types';

interface ServiceMeshTopologyProps {
  graph: ServiceMeshGraph | null;
  onRefresh: () => void;
  onSelectService?: (serviceName: string) => void;
}

export const ServiceMeshTopology: React.FC<ServiceMeshTopologyProps> = ({
  graph,
  onRefresh,
  onSelectService,
}) => {
  const [selectedService, setSelectedService] = useState<ServiceMeshService | null>(null);
  const [selectedConnection, setSelectedConnection] = useState<ServiceMeshConnection | null>(null);

  if (!graph) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        <p>Polling eBPF socket events & Service Mesh topology...</p>
      </div>
    );
  }

  const activeSelected = selectedService || graph.services[0];

  const getLanguageBadgeColor = (lang: string) => {
    switch (lang) {
      case 'Rust':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Go':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
      case 'Python':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'Database':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      default:
        return 'bg-slate-700/50 text-slate-300 border-slate-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'border-emerald-500/40 bg-emerald-500/5 text-emerald-400';
      case 'degraded':
        return 'border-amber-500/40 bg-amber-500/5 text-amber-400';
      case 'critical':
        return 'border-rose-500/40 bg-rose-500/5 text-rose-400';
      default:
        return 'border-slate-700 bg-slate-800 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & eBPF Telemetry Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Network className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                  Service Mesh & eBPF Distributed Network Graph
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                    <Lock className="w-3 h-3" /> 100% mTLS Encrypted
                  </span>
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Live Istio / Cilium eBPF socket-level telemetry capturing zero-drop packet paths across Rust, Go, Python microservices and database tiers.
                </p>
              </div>
            </div>
          </div>

          {/* Quick eBPF Telemetry Stats */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2">
              <div className="text-[10px] uppercase font-semibold text-slate-500">eBPF Socket Events</div>
              <div className="text-sm font-bold text-cyan-400 font-mono">
                {graph.ebpfSocketEventsTotal.toLocaleString()} pkts/sec
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-lg px-3.5 py-2">
              <div className="text-[10px] uppercase font-semibold text-slate-500">Active Services</div>
              <div className="text-sm font-bold text-slate-200 font-mono">
                {graph.services.length} Nodes / {graph.connections.length} Links
              </div>
            </div>
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh eBPF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas & Interactive Graph Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Visual Topology Diagram */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg overflow-hidden flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Live Traffic Mesh Visualizer
              </span>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span> Healthy
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> Degraded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400"></span> Critical
              </span>
            </div>
          </div>

          {/* SVG Canvas Map */}
          <div className="relative w-full h-[460px] bg-slate-950/80 rounded-lg border border-slate-800/80 overflow-hidden">
            {/* Grid Pattern Background */}
            <div
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: `radial-gradient(#38bdf8 1px, transparent 1px)`,
                backgroundSize: '24px 24px',
              }}
            />

            <svg className="w-full h-full absolute inset-0 pointer-events-none">
              <defs>
                <linearGradient id="healthyGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id="warningGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity="0.8" />
                </linearGradient>
              </defs>

              {/* Draw Connections */}
              {graph.connections.map((conn) => {
                const source = graph.services.find((s) => s.id === conn.sourceId);
                const target = graph.services.find((s) => s.id === conn.targetId);
                if (!source || !target) return null;

                const isWarning = conn.status === 'warning' || conn.errorRatePercent > 0.02;
                const strokeColor = isWarning ? '#f59e0b' : '#38bdf8';

                return (
                  <g key={conn.id}>
                    {/* Background Line */}
                    <line
                      x1={source.x + 90}
                      y1={source.y + 40}
                      x2={target.x + 90}
                      y2={target.y + 40}
                      stroke="#334155"
                      strokeWidth="3"
                      strokeDasharray="4,4"
                    />
                    {/* Animated Active Line */}
                    <line
                      x1={source.x + 90}
                      y1={source.y + 40}
                      x2={target.x + 90}
                      y2={target.y + 40}
                      stroke={strokeColor}
                      strokeWidth="2"
                      strokeOpacity="0.8"
                    />
                    {/* Protocol Badge over midpoint */}
                    <circle
                      cx={(source.x + target.x) / 2 + 90}
                      cy={(source.y + target.y) / 2 + 40}
                      r="14"
                      fill="#0f172a"
                      stroke={strokeColor}
                      strokeWidth="1.5"
                    />
                  </g>
                );
              })}
            </svg>

            {/* Render Service Nodes (HTML interactive overlays) */}
            {graph.services.map((service) => {
              const isSelected = activeSelected?.id === service.id;
              return (
                <div
                  key={service.id}
                  id={`mesh-node-${service.id}`}
                  onClick={() => {
                    setSelectedService(service);
                    if (onSelectService) onSelectService(service.name);
                  }}
                  style={{
                    left: `${service.x}px`,
                    top: `${service.y}px`,
                  }}
                  className={`absolute w-44 rounded-xl border p-3 cursor-pointer transition-all duration-200 shadow-xl ${
                    isSelected
                      ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 bg-slate-900 border-cyan-500 scale-105 z-20'
                      : 'bg-slate-900/90 hover:bg-slate-900 border-slate-700/80 hover:border-slate-500 z-10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getLanguageBadgeColor(
                        service.language
                      )}`}
                    >
                      {service.language}
                    </span>
                    <span
                      className={`w-2 h-2 rounded-full ${
                        service.status === 'healthy'
                          ? 'bg-emerald-400 shadow-[0_0_8px_#10b981]'
                          : service.status === 'degraded'
                          ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                          : 'bg-rose-400 shadow-[0_0_8px_#ef4444]'
                      }`}
                    />
                  </div>

                  <div className="text-xs font-bold text-white truncate" title={service.name}>
                    {service.name}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{service.version}</div>

                  <div className="mt-2.5 pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-1 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">RPS</span>
                      <span className="font-mono font-semibold text-cyan-300">{service.rps}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">P99 Lat</span>
                      <span className="font-mono font-semibold text-slate-200">{service.p99LatencyMs}ms</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Service Detailed Telemetry Inspector */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Service Telemetry Details
                </span>
              </div>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getLanguageBadgeColor(
                  activeSelected.language
                )}`}
              >
                {activeSelected.language} Runtime
              </span>
            </div>

            {/* Service Identity */}
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-white">{activeSelected.name}</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                  <span>Namespace: <strong className="text-slate-200">{activeSelected.namespace}</strong></span>
                  <span>•</span>
                  <span>Version: <strong className="text-slate-200 font-mono">{activeSelected.version}</strong></span>
                </div>
              </div>

              {/* Status Banner */}
              <div
                className={`p-3 rounded-lg border text-xs flex items-center justify-between ${getStatusColor(
                  activeSelected.status
                )}`}
              >
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4" />
                  <span className="font-semibold capitalize">Status: {activeSelected.status}</span>
                </div>
                <span className="text-[11px] font-mono">
                  {activeSelected.status === 'healthy' ? '0 Dropped Packets' : 'Elevated Latency'}
                </span>
              </div>

              {/* Telemetry Metrics Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Throughput (RPS)</div>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-0.5">
                    {activeSelected.rps.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">HTTP/2 + gRPC Streams</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">P99 Latency</div>
                  <div className="text-lg font-bold text-purple-400 font-mono mt-0.5">
                    {activeSelected.p99LatencyMs} ms
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">P50: {activeSelected.p50LatencyMs} ms</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">Error Rate</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${activeSelected.errorRatePercent > 0.02 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {activeSelected.errorRatePercent}%
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">HTTP 5xx & gRPC Err</div>
                </div>

                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <div className="text-[10px] text-slate-500 uppercase font-semibold">eBPF TCP Retransmits</div>
                  <div className={`text-lg font-bold font-mono mt-0.5 ${activeSelected.tcpRetransmitsPerSec > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {activeSelected.tcpRetransmitsPerSec} / sec
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">Socket Layer Traces</div>
                </div>
              </div>

              {/* Resource Utilization */}
              <div className="bg-slate-950 border border-slate-800 rounded-lg p-3 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Allocation
                  </span>
                  <span className="font-mono text-slate-200">{activeSelected.cpuPercent}%</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-cyan-500 h-full rounded-full"
                    style={{ width: `${Math.min(100, activeSelected.cpuPercent)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5 text-purple-400" /> Memory RSS
                  </span>
                  <span className="font-mono text-slate-200">{activeSelected.memoryMB} MB</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      activeSelected.memoryMB > 450 ? 'bg-amber-500' : 'bg-purple-500'
                    }`}
                    style={{ width: `${Math.min(100, (activeSelected.memoryMB / 1024) * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Linked Inbound & Outbound Connections */}
          <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
            <span className="text-slate-400 font-semibold block mb-2">Connected Mesh Links:</span>
            <div className="space-y-1.5 max-h-32 overflow-y-auto">
              {graph.connections
                .filter((c) => c.sourceId === activeSelected.id || c.targetId === activeSelected.id)
                .map((c) => {
                  const isSource = c.sourceId === activeSelected.id;
                  const otherService = graph.services.find(
                    (s) => s.id === (isSource ? c.targetId : c.sourceId)
                  );
                  return (
                    <div
                      key={c.id}
                      className="bg-slate-950 border border-slate-800/80 rounded px-2.5 py-1.5 flex items-center justify-between text-[11px]"
                    >
                      <div className="flex items-center gap-1.5 text-slate-300">
                        <span>{isSource ? 'Outbound →' : 'Inbound ←'}</span>
                        <strong className="text-white">{otherService?.name}</strong>
                      </div>
                      <div className="flex items-center gap-2 font-mono text-[10px] text-slate-400">
                        <span className="text-cyan-400">{c.protocol}</span>
                        <span>{c.latencyMs}ms</span>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
