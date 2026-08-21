import React, { useState } from 'react';
import {
  AlertTriangle,
  Copy,
  Download,
  Filter,
  Layers,
  RefreshCw,
  Search,
  Terminal,
} from 'lucide-react';
import { LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
  onRefreshLogs?: () => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, onRefreshLogs }) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);

  const filteredLogs = logs.filter((l) => {
    const matchesLevel = levelFilter === 'ALL' || l.level === levelFilter;
    const matchesService = serviceFilter === 'ALL' || l.service === serviceFilter;
    const matchesSearch =
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.pod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.traceId && l.traceId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesService && matchesSearch;
  });

  const handleCopyTrace = (traceId: string) => {
    navigator.clipboard.writeText(traceId);
    setCopiedTraceId(traceId);
    setTimeout(() => setCopiedTraceId(null), 2000);
  };

  const handleExportLogs = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `k8s-telemetry-logs-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-4">
      {/* Filters and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Level:</span>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL Levels</option>
              <option value="INFO">INFO</option>
              <option value="WARN">WARN</option>
              <option value="ERROR">ERROR</option>
              <option value="FATAL">FATAL</option>
            </select>
          </div>

          {/* Service Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL Services</option>
              <option value="payment-gateway">payment-gateway</option>
              <option value="auth-service">auth-service</option>
              <option value="order-processing">order-processing</option>
              <option value="telemetry-collector">telemetry-collector</option>
              <option value="anomaly-detector">anomaly-detector</option>
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search regex, message, trace..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* Terminal View Container */}
      <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl font-mono text-xs overflow-hidden space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-slate-400 text-[11px]">
          <span className="flex items-center gap-2 text-cyan-400 font-bold">
            <Terminal className="w-4 h-4" /> eBPF Socket Stream & Structured Container Logs ({filteredLogs.length} Events)
          </span>
          <span className="text-slate-500">Live Buffer &bull; RingBuffer size: 64MB</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto space-y-1.5 pr-2 scrollbar-thin">
          {filteredLogs.map((log) => {
            const isError = log.level === 'ERROR' || log.level === 'FATAL';
            const isWarn = log.level === 'WARN';

            return (
              <div
                key={log.id}
                className={`p-2 rounded flex flex-col sm:flex-row sm:items-start justify-between gap-2 transition-colors ${
                  log.isAnomaly
                    ? 'bg-rose-950/30 border border-rose-500/30'
                    : isError
                    ? 'bg-rose-950/20 text-rose-200'
                    : isWarn
                    ? 'bg-amber-950/20 text-amber-200'
                    : 'bg-slate-900/50 text-slate-300 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <span className="text-slate-500 text-[10px] select-none shrink-0 pt-0.5">
                    {log.timestamp.substring(11, 19)}
                  </span>

                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${
                      isError
                        ? 'bg-rose-500 text-slate-950'
                        : isWarn
                        ? 'bg-amber-500 text-slate-950'
                        : 'bg-cyan-500/20 text-cyan-300'
                    }`}
                  >
                    {log.level}
                  </span>

                  <span className="text-cyan-400 font-semibold shrink-0">
                    [{log.service}]
                  </span>

                  <span className="break-all">{log.message}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500">
                  {log.traceId && (
                    <button
                      onClick={() => handleCopyTrace(log.traceId!)}
                      className="flex items-center gap-1 hover:text-cyan-400 font-mono transition-colors"
                      title="Click to copy Trace ID"
                    >
                      <Copy className="w-2.5 h-2.5" />
                      <span>{copiedTraceId === log.traceId ? 'COPIED' : log.traceId}</span>
                    </button>
                  )}
                  {log.isAnomaly && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold">
                      ANOMALY
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
