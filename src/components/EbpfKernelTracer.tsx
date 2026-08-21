import React, { useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Eye,
  Filter,
  Flame,
  Layers,
  Network,
  Play,
  Radio,
  RefreshCw,
  Search,
  Shield,
  Sliders,
  Terminal,
  Zap,
} from 'lucide-react';
import { EbpfKernelEvent, EbpfSyscallStats } from '../types';

interface EbpfKernelTracerProps {
  events: EbpfKernelEvent[];
  stats: EbpfSyscallStats[];
  onRefresh: () => void;
}

export const EbpfKernelTracer: React.FC<EbpfKernelTracerProps> = ({
  events,
  stats,
  onRefresh,
}) => {
  const [filterProcess, setFilterProcess] = useState<string>('all');
  const [filterVerdict, setFilterVerdict] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isTracing, setIsTracing] = useState<boolean>(true);
  const [activeProbe, setActiveProbe] = useState<string>('all');

  const filteredEvents = events.filter((ev) => {
    if (filterProcess !== 'all' && ev.process !== filterProcess) return false;
    if (filterVerdict !== 'all' && ev.verdict !== filterVerdict) return false;
    if (activeProbe !== 'all' && ev.probeType !== activeProbe) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        ev.syscall.toLowerCase().includes(q) ||
        ev.process.toLowerCase().includes(q) ||
        ev.sourceIpPort.toLowerCase().includes(q) ||
        ev.destIpPort.toLowerCase().includes(q) ||
        ev.details.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
              <Flame className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Linux Kernel eBPF Deep Packet & Syscall Tracer
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/40 font-mono font-bold animate-pulse">
                  RING-BUFFER LIVE
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero-overhead kernel probe hooks (kprobe, tracepoint, sock_ops, tc_egress, uprobe) capturing sub-millisecond socket latencies & TCP retransmissions.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTracing(!isTracing)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-all ${
              isTracing
                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            <Radio className={`w-3.5 h-3.5 ${isTracing ? 'animate-pulse text-emerald-400' : ''}`} />
            <span>{isTracing ? 'eBPF Probes Active' : 'Tracing Paused'}</span>
          </button>
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
            title="Refresh kernel ring-buffer events"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Syscall Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-sm">
            <div className="text-[10px] font-mono text-cyan-400 font-bold truncate">{stat.name}</div>
            <div className="text-lg font-black text-white font-mono mt-1">
              {stat.count1m.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">/min</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <span>Avg: <strong className="text-slate-200 font-mono">{stat.avgLatencyUs}µs</strong></span>
              <span>p99: <strong className="text-orange-400 font-mono">{stat.p99LatencyUs}µs</strong></span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter and Query Toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search syscall, IP, PID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 md:w-60"
            />
          </div>

          {/* Process Filter */}
          <select
            value={filterProcess}
            onChange={(e) => setFilterProcess(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Processes</option>
            <option value="rust-auth-guard">rust-auth-guard</option>
            <option value="go-payment-gateway">go-payment-gateway</option>
            <option value="ai-fraud-detector">ai-fraud-detector</option>
            <option value="envoy-ingress-edge">envoy-ingress-edge</option>
          </select>

          {/* Probe Type Filter */}
          <select
            value={activeProbe}
            onChange={(e) => setActiveProbe(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All eBPF Probes</option>
            <option value="kprobe">kprobe</option>
            <option value="tracepoint">tracepoint</option>
            <option value="sock_ops">sock_ops</option>
            <option value="tc_egress">tc_egress</option>
            <option value="uprobe">uprobe</option>
          </select>

          {/* Verdict Filter */}
          <select
            value={filterVerdict}
            onChange={(e) => setFilterVerdict(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="all">All Verdicts</option>
            <option value="PASSED">PASSED</option>
            <option value="DROPPED">DROPPED</option>
            <option value="THROTTLED">THROTTLED</option>
          </select>
        </div>

        <div className="text-xs text-slate-400 font-mono">
          Showing <strong>{filteredEvents.length}</strong> kernel events
        </div>
      </div>

      {/* Live eBPF Event Stream Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Kernel Ring-Buffer Telemetry Stream (/sys/kernel/debug/tracing)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400">BPF Map: sock_hash_v2</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[10px] font-mono text-slate-400 uppercase">
                <th className="py-2.5 px-3">Probe</th>
                <th className="py-2.5 px-3">Syscall / Hook</th>
                <th className="py-2.5 px-3">Process (PID)</th>
                <th className="py-2.5 px-3">CPU</th>
                <th className="py-2.5 px-3">Socket Route</th>
                <th className="py-2.5 px-3">Latency</th>
                <th className="py-2.5 px-3">Protocol</th>
                <th className="py-2.5 px-3">Verdict</th>
                <th className="py-2.5 px-3">Kernel Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
              {filteredEvents.map((ev) => {
                let verdictBadge = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
                if (ev.verdict === 'DROPPED') verdictBadge = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
                if (ev.verdict === 'THROTTLED') verdictBadge = 'bg-amber-500/15 text-amber-300 border-amber-500/30';

                return (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3">
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {ev.probeType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-cyan-300 font-bold">{ev.syscall}</td>
                    <td className="py-2.5 px-3 text-slate-200">
                      {ev.process} <span className="text-slate-500">({ev.pid})</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">core#{ev.cpuCore}</td>
                    <td className="py-2.5 px-3 text-slate-300">
                      {ev.sourceIpPort} → {ev.destIpPort}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={ev.latencyMicros > 1000 ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                        {ev.latencyMicros}µs
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-purple-300">{ev.protocol}</td>
                    <td className="py-2.5 px-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${verdictBadge}`}>
                        {ev.verdict}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400 text-[11px] truncate max-w-xs">{ev.details}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
