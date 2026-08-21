import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code,
  Copy,
  Cpu,
  Database,
  Flame,
  Globe,
  Layers,
  Network,
  RefreshCw,
  Search,
  Shield,
  Zap,
} from 'lucide-react';
import { DistributedTrace, FlamegraphNode, TraceSpan } from '../types';

interface DistributedTracingExplorerProps {
  traces: DistributedTrace[];
  flamegraph: FlamegraphNode | null;
  onRefresh?: () => void;
}

export function DistributedTracingExplorer({
  traces,
  flamegraph,
  onRefresh,
}: DistributedTracingExplorerProps) {
  const [selectedTraceId, setSelectedTraceId] = useState<string>(
    traces[0]?.traceId || ''
  );
  const [selectedSpan, setSelectedSpan] = useState<TraceSpan | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'waterfall' | 'flamegraph'>('waterfall');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSpanId, setCopiedSpanId] = useState<string | null>(null);

  const currentTrace =
    traces.find((t) => t.traceId === selectedTraceId) || traces[0];

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSpanId(id);
    setTimeout(() => setCopiedSpanId(null), 2000);
  };

  const getServiceColor = (serviceName: string) => {
    if (serviceName.includes('ingress') || serviceName.includes('gateway'))
      return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    if (serviceName.includes('rust') || serviceName.includes('auth'))
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    if (serviceName.includes('payment') || serviceName.includes('order'))
      return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (serviceName.includes('fraud') || serviceName.includes('ai'))
      return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
    if (serviceName.includes('pg') || serviceName.includes('db'))
      return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    if (serviceName.includes('redis') || serviceName.includes('cache'))
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30';
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'kernel':
        return 'bg-amber-900/60 border-amber-500/40 text-amber-200';
      case 'application':
        return 'bg-blue-900/60 border-blue-500/40 text-blue-200';
      case 'database':
        return 'bg-emerald-900/60 border-emerald-500/40 text-emerald-200';
      case 'network':
        return 'bg-cyan-900/60 border-cyan-500/40 text-cyan-200';
      case 'gc':
        return 'bg-rose-900/60 border-rose-500/40 text-rose-200';
      case 'crypto':
        return 'bg-purple-900/60 border-purple-500/40 text-purple-200';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-200';
    }
  };

  const renderFlameNode = (node: FlamegraphNode, totalRootValue: number, depth: number = 0) => {
    const widthPercent = Math.max((node.value / totalRootValue) * 100, 4);
    return (
      <div key={node.name} className="space-y-1 my-1 w-full">
        <div
          className={`p-2 rounded-lg border text-xs flex items-center justify-between transition-all hover:brightness-125 cursor-pointer shadow-sm ${getCategoryColor(
            node.category
          )}`}
          style={{ width: `${Math.min(widthPercent, 100)}%` }}
        >
          <div className="font-mono font-medium truncate flex items-center gap-1.5">
            <span className="text-[10px] uppercase font-bold opacity-75 px-1 py-0.5 rounded bg-black/30">
              {node.category || 'app'}
            </span>
            <span className="truncate">{node.name}</span>
          </div>
          <div className="font-mono text-[11px] font-bold shrink-0 pl-2">
            {node.value.toFixed(1)} ms ({((node.value / totalRootValue) * 100).toFixed(1)}%)
          </div>
        </div>

        {node.children && node.children.length > 0 && (
          <div className="pl-4 border-l border-slate-700/60 space-y-1">
            {node.children.map((child) =>
              renderFlameNode(child, totalRootValue, depth + 1)
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-indigo-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                OpenTelemetry Distributed Tracing & APM Flamegraph
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                OTel v1.32 Ingest Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              End-to-end span waterfall breakdown, critical path latency attribution, and runtime CPU flamegraph profiling.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveSubTab('waterfall')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'waterfall'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              Trace Waterfall
            </button>
            <button
              onClick={() => setActiveSubTab('flamegraph')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeSubTab === 'flamegraph'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              CPU Flamegraph
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1 text-xs font-medium"
              title="Refresh Traces"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeSubTab === 'waterfall' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Trace Selector List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Recent Ingested Traces ({traces.length})
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Buffer: 100/100
                </span>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter by endpoint or trace ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
                {traces
                  .filter(
                    (t) =>
                      t.rootEndpoint.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      t.traceId.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((trace) => {
                    const isSelected = trace.traceId === selectedTraceId;
                    return (
                      <div
                        key={trace.traceId}
                        onClick={() => {
                          setSelectedTraceId(trace.traceId);
                          setSelectedSpan(trace.spans[0]);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-950/50 border-indigo-500/60 shadow-md shadow-indigo-500/10'
                            : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <div className="flex items-center gap-1.5">
                            {trace.hasError ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                                {trace.httpStatus} ERR
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                {trace.httpStatus} OK
                              </span>
                            )}
                            <span className="text-xs font-mono font-bold text-white truncate max-w-[170px]">
                              {trace.rootEndpoint}
                            </span>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-amber-400">
                            {trace.totalDurationMs.toFixed(1)}ms
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <div className="flex items-center gap-1 font-mono truncate max-w-[180px]">
                            <span className="text-slate-500">ID:</span>
                            <span className="truncate">{trace.traceId.slice(0, 16)}...</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Layers className="w-3 h-3 text-slate-500" />
                            <span>{trace.spanCount} spans</span>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          {trace.servicesInvolved.slice(0, 3).map((svc) => (
                            <span
                              key={svc}
                              className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800/90 text-slate-300 border border-slate-700/50"
                            >
                              {svc}
                            </span>
                          ))}
                          {trace.servicesInvolved.length > 3 && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-medium bg-slate-800/90 text-slate-400">
                              +{trace.servicesInvolved.length - 3}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Span Waterfall & Span Detail */}
          <div className="lg:col-span-8 space-y-4">
            {currentTrace ? (
              <div className="space-y-4">
                {/* Trace Overview Header */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-mono">
                        {currentTrace.rootEndpoint}
                      </span>
                      {currentTrace.hasError ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                          {currentTrace.httpStatus} Error
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {currentTrace.httpStatus} Success
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      <span className="font-mono text-slate-500">
                        Trace ID: {currentTrace.traceId}
                      </span>
                      <button
                        onClick={() => handleCopy(currentTrace.traceId, 'trace-id')}
                        className="text-indigo-400 hover:text-indigo-300 transition-all flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        <span>{copiedSpanId === 'trace-id' ? 'Copied!' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs font-mono shrink-0">
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Duration</div>
                      <div className="text-sm font-bold text-amber-400">
                        {currentTrace.totalDurationMs.toFixed(1)} ms
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Spans</div>
                      <div className="text-sm font-bold text-white">
                        {currentTrace.spanCount}
                      </div>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Services</div>
                      <div className="text-sm font-bold text-indigo-400">
                        {currentTrace.servicesInvolved.length}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Waterfall Gantt Chart */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-xs font-mono text-slate-400">
                    <span>Hierarchy & Span Operation</span>
                    <div className="flex items-center gap-8 pr-4">
                      <span>Timeline (0ms - {currentTrace.totalDurationMs.toFixed(0)}ms)</span>
                      <span>Duration</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {currentTrace.spans.map((span) => {
                      const isSelected = selectedSpan?.spanId === span.spanId;
                      const leftPercent =
                        (span.startTimeOffsetMs / currentTrace.totalDurationMs) * 100;
                      const widthPercent = Math.max(
                        (span.durationMs / currentTrace.totalDurationMs) * 100,
                        3
                      );

                      return (
                        <div
                          key={span.spanId}
                          onClick={() => setSelectedSpan(span)}
                          className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-indigo-950/40 border-indigo-500/60 shadow-md'
                              : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/30'
                          }`}
                        >
                          <div className="grid grid-cols-12 items-center gap-2">
                            {/* Span Title & Indentation */}
                            <div
                              className="col-span-6 flex items-center gap-2 truncate"
                              style={{ paddingLeft: `${span.depth * 14}px` }}
                            >
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold border font-mono shrink-0 ${getServiceColor(
                                  span.serviceName
                                )}`}
                              >
                                {span.serviceName}
                              </span>
                              <span className="text-xs font-mono text-slate-200 truncate">
                                {span.operationName}
                              </span>
                            </div>

                            {/* Gantt Bar */}
                            <div className="col-span-4 relative h-4 bg-slate-950/80 rounded-full overflow-hidden border border-slate-800">
                              <div
                                className={`absolute top-0 bottom-0 rounded-full ${
                                  span.status === 'ERROR'
                                    ? 'bg-rose-500 shadow-sm shadow-rose-500/50'
                                    : span.serviceName.includes('rust')
                                    ? 'bg-amber-400'
                                    : span.serviceName.includes('payment')
                                    ? 'bg-emerald-400'
                                    : span.serviceName.includes('fraud')
                                    ? 'bg-purple-400'
                                    : span.serviceName.includes('pg')
                                    ? 'bg-blue-400'
                                    : 'bg-indigo-400'
                                }`}
                                style={{
                                  left: `${leftPercent}%`,
                                  width: `${widthPercent}%`,
                                }}
                              />
                            </div>

                            {/* Duration & Status */}
                            <div className="col-span-2 text-right font-mono text-xs font-bold text-slate-300">
                              {span.status === 'ERROR' ? (
                                <span className="text-rose-400">
                                  {span.durationMs.toFixed(1)}ms ⚠️
                                </span>
                              ) : (
                                <span>{span.durationMs.toFixed(1)}ms</span>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Selected Span Details Inspector */}
                {selectedSpan && (
                  <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Code className="w-4 h-4 text-indigo-400" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                          Span Attributes & Metadata ({selectedSpan.spanId})
                        </h4>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getServiceColor(
                          selectedSpan.serviceName
                        )}`}
                      >
                        {selectedSpan.serviceName}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Operation</div>
                        <div className="text-slate-200 truncate mt-0.5">
                          {selectedSpan.operationName}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Span Kind</div>
                        <div className="text-indigo-400 font-bold mt-0.5">
                          {selectedSpan.kind}
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Start Offset</div>
                        <div className="text-slate-300 mt-0.5">
                          +{selectedSpan.startTimeOffsetMs.toFixed(1)} ms
                        </div>
                      </div>
                      <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div className="text-[10px] text-slate-500 uppercase">Duration</div>
                        <div className="text-amber-400 font-bold mt-0.5">
                          {selectedSpan.durationMs.toFixed(1)} ms
                        </div>
                      </div>
                    </div>

                    {/* Attributes Key-Value Table */}
                    <div className="space-y-1 pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        OTel Semantic Attributes
                      </span>
                      <div className="rounded-xl border border-slate-800/80 bg-slate-950/70 p-3 max-h-48 overflow-y-auto space-y-1.5 font-mono text-xs">
                        {Object.entries(selectedSpan.attributes).map(([key, val]) => (
                          <div
                            key={key}
                            className="flex items-start justify-between gap-4 py-1 border-b border-slate-800/40 last:border-0"
                          >
                            <span className="text-indigo-300 shrink-0">{key}</span>
                            <span className="text-slate-300 text-right truncate max-w-[320px]">
                              {typeof val === 'object'
                                ? JSON.stringify(val)
                                : String(val)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                No traces available.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Flamegraph View */
        <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Go & Rust Microservice CPU / Allocation Flamegraph</span>
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hierarchical stack execution time breakdown derived from continuous eBPF sampling (`perf_events`).
              </p>
            </div>

            {/* Category Legend */}
            <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase">
              <span className="px-2 py-0.5 rounded bg-amber-900/60 border border-amber-500/40 text-amber-300">
                Kernel (eBPF)
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-900/60 border border-blue-500/40 text-blue-300">
                Application
              </span>
              <span className="px-2 py-0.5 rounded bg-emerald-900/60 border border-emerald-500/40 text-emerald-300">
                Database (Pg/Redis)
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-500/40 text-cyan-300">
                Network/gRPC
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-900/60 border border-rose-500/40 text-rose-300">
                GC Stop-The-World
              </span>
              <span className="px-2 py-0.5 rounded bg-purple-900/60 border border-purple-500/40 text-purple-300">
                Crypto/TLS
              </span>
            </div>
          </div>

          {flamegraph ? (
            <div className="pt-2">
              {renderFlameNode(flamegraph, flamegraph.value)}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500">
              No flamegraph data available.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
