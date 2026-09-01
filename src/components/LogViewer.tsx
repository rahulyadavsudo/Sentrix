import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  Bot,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileCode,
  Filter,
  Flame,
  Layers,
  Lightbulb,
  Loader2,
  Play,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from 'lucide-react';
import { AiLogSolution, LogEntry } from '../types';

interface LogViewerProps {
  logs: LogEntry[];
  onRefreshLogs?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const LogViewer: React.FC<LogViewerProps> = ({ logs, onRefreshLogs, onShowToast }) => {
  const [levelFilter, setLevelFilter] = useState<string>('ALL');
  const [serviceFilter, setServiceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedTraceId, setCopiedTraceId] = useState<string | null>(null);
  const [copiedSolutionId, setCopiedSolutionId] = useState<string | null>(null);

  // Selected Log State for AI Diagnosis
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [expandedTraceIds, setExpandedTraceIds] = useState<Record<string, boolean>>({});

  // AI Solutions State
  const [solutions, setSolutions] = useState<AiLogSolution[]>([]);
  const [selectedSolution, setSelectedSolution] = useState<AiLogSolution | null>(null);
  const [isSolvingLogId, setIsSolvingLogId] = useState<string | null>(null);
  const [isLoadingSolutions, setIsLoadingSolutions] = useState<boolean>(true);

  // Auto-select first error log or first log if nothing is selected
  useEffect(() => {
    if (!selectedLogId && logs.length > 0) {
      const firstError = logs.find((l) => l.level === 'ERROR' || l.level === 'FATAL' || l.isAnomaly);
      if (firstError) {
        setSelectedLogId(firstError.id);
      } else {
        setSelectedLogId(logs[0].id);
      }
    }
  }, [logs, selectedLogId]);

  const fetchSolutions = async () => {
    try {
      setIsLoadingSolutions(true);
      const res = await fetch('/api/logs/all-analyzed');
      if (res.ok) {
        const data = await res.json();
        setSolutions(data.solutions || []);
        if (data.solutions?.length > 0 && !selectedSolution) {
          setSelectedSolution(data.solutions[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching AI log solutions:', err);
    } finally {
      setIsLoadingSolutions(false);
    }
  };

  useEffect(() => {
    fetchSolutions();
  }, []);

  const handleAiSolveLog = async (log: LogEntry) => {
    try {
      setSelectedLogId(log.id);
      setIsSolvingLogId(log.id);
      const res = await fetch('/api/logs/ai-solve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logMessage: log.message,
          service: log.service,
          category: log.category || (log.level === 'FATAL' || log.isAnomaly ? 'CRASH_LOOP' : 'GENERAL'),
          fileLocation: log.fileLocation,
          lineNumber: log.lineNumber,
          stackTrace: log.stackTrace,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setSolutions((prev) => [data.solution, ...prev.filter((s) => s.id !== data.solution.id)]);
        setSelectedSolution(data.solution);
        onShowToast?.('success', 'AI Root Cause Diagnosed', `Generated solution for ${log.fileLocation || log.service}`);
      } else {
        onShowToast?.('error', 'AI Analysis Failed', 'Could not diagnose error');
      }
    } catch (err: any) {
      onShowToast?.('error', 'AI Error', err.message);
    } finally {
      setIsSolvingLogId(null);
    }
  };

  const toggleStackTrace = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTraceIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const selectedLog = logs.find((l) => l.id === selectedLogId) || null;

  const filteredLogs = logs.filter((l) => {
    const matchesLevel = levelFilter === 'ALL' || l.level === levelFilter;
    const matchesService = serviceFilter === 'ALL' || l.service === serviceFilter;
    const matchesSearch =
      l.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.pod.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.fileLocation && l.fileLocation.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (l.traceId && l.traceId.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesLevel && matchesService && matchesSearch;
  });

  const handleCopyTrace = (traceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(traceId);
    setCopiedTraceId(traceId);
    setTimeout(() => setCopiedTraceId(null), 2000);
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSolutionId(id);
    setTimeout(() => setCopiedSolutionId(null), 2000);
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

  // Collect unique services from logs
  const uniqueServices = Array.from(new Set(logs.map((l) => l.service)));

  return (
    <div className="space-y-6 text-white">
      {/* 1. AI Log Root Cause Analysis & 1-Click Remediation Solution Studio */}
      <div className="bg-[#0e1118] border border-[#202738] rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#202738]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                AI Log Diagnosis & Automated Root Cause Solutions
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                  Gemini 2.5 Flash
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Automated error correlation, file-level origin detection, root cause synthesis, unified code diff patches, and CLI fix commands.
              </p>
            </div>
          </div>

          <button
            onClick={fetchSolutions}
            disabled={isLoadingSolutions}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121622] hover:bg-[#181d2c] text-slate-300 border border-[#202738] text-xs font-semibold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSolutions ? 'animate-spin' : ''}`} />
            <span>Refresh AI Solutions</span>
          </button>
        </div>

        {/* Selected Log AI Diagnostic Action Bar */}
        <div className="p-3.5 rounded-xl bg-[#121622] border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Target Log Selected for Analysis
              </span>
              {selectedLog ? (
                <>
                  <span className="text-xs font-mono text-cyan-300 font-bold">
                    [{selectedLog.service}]
                  </span>
                  {selectedLog.fileLocation && (
                    <span className="flex items-center gap-1 text-xs font-mono text-emerald-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      <FileCode className="w-3 h-3 text-emerald-400" />
                      {selectedLog.fileLocation}{selectedLog.lineNumber ? `:${selectedLog.lineNumber}` : ''}
                    </span>
                  )}
                  <span className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                    selectedLog.level === 'ERROR' || selectedLog.level === 'FATAL'
                      ? 'bg-rose-500/20 text-rose-300'
                      : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {selectedLog.level}
                  </span>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic">No log selected yet. Click any log row below to select it.</span>
              )}
            </div>

            {selectedLog && (
              <div className="text-xs font-mono text-slate-200 truncate max-w-2xl">
                {selectedLog.message}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => selectedLog && handleAiSolveLog(selectedLog)}
              disabled={!selectedLog || isSolvingLogId === selectedLog.id}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-amber-950/50 disabled:opacity-50 active:scale-95"
            >
              {isSolvingLogId === selectedLog?.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 fill-current" />
              )}
              <span>Analyze Selected Log with AI</span>
            </button>
          </div>
        </div>

        {/* Split Grid: Left Solution Cards & Right Deep RCA Solution Inspector */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Left Column: Solution Cards */}
          <div className="lg:col-span-5 space-y-2 max-h-[460px] overflow-y-auto pr-1">
            {solutions.map((sol) => {
              const isSelected = selectedSolution?.id === sol.id;
              return (
                <div
                  key={sol.id}
                  onClick={() => setSelectedSolution(sol)}
                  className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-amber-950/30 border-amber-500/60 shadow-lg shadow-amber-950/40'
                      : 'bg-[#121622] border-[#202738] hover:border-slate-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      {sol.category}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {sol.confidenceScore}% Confidence
                    </span>
                  </div>

                  <div className="text-xs font-bold text-white mt-2 truncate font-mono">
                    [{sol.service}] {sol.exactError}
                  </div>

                  {sol.fileLocation && (
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-300 mt-1">
                      <FileCode className="w-3 h-3 text-cyan-400" />
                      <span>{sol.fileLocation}{sol.lineNumber ? `:${sol.lineNumber}` : ''}</span>
                    </div>
                  )}

                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sol.rootCause}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-[#202738]">
                    <span>{sol.solutionSteps.length} Step Fix</span>
                    <span className="text-cyan-400 font-bold flex items-center gap-1">
                      View Solution <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Selected Solution Inspector */}
          <div className="lg:col-span-7 bg-[#090b10] border border-[#202738] rounded-xl p-4 space-y-4 max-h-[460px] overflow-y-auto">
            {selectedSolution ? (
              <>
                <div className="flex items-center justify-between pb-3 border-b border-[#202738]">
                  <div>
                    <div className="text-xs font-mono font-bold text-amber-300">
                      [{selectedSolution.service}] {selectedSolution.category}
                    </div>
                    {selectedSolution.fileLocation && (
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 mt-0.5">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Failing Source: <strong>{selectedSolution.fileLocation}</strong>{selectedSolution.lineNumber ? ` (Line ${selectedSolution.lineNumber})` : ''}</span>
                      </div>
                    )}
                    <div className="text-[10px] text-slate-500 font-mono">
                      Target Pod Error Remediation &bull; Verified AI Fix
                    </div>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    {selectedSolution.confidenceScore}% Confidence
                  </span>
                </div>

                {/* Root Cause & Explanation */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                    Identified Root Cause
                  </div>
                  <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs leading-relaxed">
                    {selectedSolution.rootCause}
                  </div>
                  <div className="text-xs text-slate-300 leading-relaxed pt-1">
                    {selectedSolution.explanation}
                  </div>
                </div>

                {/* Step by Step Remediation */}
                <div className="space-y-1.5">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    Actionable Resolution Steps
                  </div>
                  <div className="space-y-1">
                    {selectedSolution.solutionSteps.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-lg bg-[#121622] border border-[#202738] text-xs text-slate-200 flex items-start gap-2"
                      >
                        <span className="font-mono text-emerald-400 font-bold text-[11px]">0{idx + 1}.</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Code Diff Patch */}
                {selectedSolution.codeDiff && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-cyan-400" />
                        Remediation Patch (Git Unified Diff)
                      </span>
                      <button
                        onClick={() => handleCopyText(selectedSolution.codeDiff!, `diff-${selectedSolution.id}`)}
                        className="text-[10px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedSolutionId === `diff-${selectedSolution.id}` ? 'Copied' : 'Copy Patch'}
                      </button>
                    </div>
                    <pre className="p-3 rounded-lg bg-[#05070a] border border-[#161a26] text-[11px] font-mono text-emerald-400 overflow-x-auto leading-relaxed max-h-36">
                      {selectedSolution.codeDiff}
                    </pre>
                  </div>
                )}

                {/* Fix Commands */}
                {selectedSolution.fixCommands && selectedSolution.fixCommands.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <Terminal className="w-3.5 h-3.5 text-purple-400" />
                      Remediation CLI Commands
                    </div>
                    <div className="space-y-1">
                      {selectedSolution.fixCommands.map((cmd, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#05070a] border border-[#161a26] text-[11px] font-mono text-purple-300"
                        >
                          <span className="truncate pr-2">{cmd}</span>
                          <button
                            onClick={() => handleCopyText(cmd, `cmd-${selectedSolution.id}-${i}`)}
                            className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white shrink-0"
                            title="Copy Command"
                          >
                            {copiedSolutionId === `cmd-${selectedSolution.id}-${i}` ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 text-slate-500 text-xs">
                Select an error solution above or select a log in the stream below and click "Analyze Selected Log with AI".
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Filters and Terminal Controls */}
      <div className="bg-[#0e1118] border border-[#202738] rounded-xl p-4 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 bg-[#090b10] px-2.5 py-1.5 rounded-lg border border-[#202738] text-xs">
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
          <div className="flex items-center gap-1.5 bg-[#090b10] px-2.5 py-1.5 rounded-lg border border-[#202738] text-xs">
            <span className="text-slate-400">Service:</span>
            <select
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="ALL">ALL Services</option>
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search regex, message, file name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-[#090b10] border border-[#202738] rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 w-48 sm:w-64"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {onRefreshLogs && (
            <button
              onClick={onRefreshLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181d2c] text-slate-300 text-xs font-semibold border border-[#202738] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Re-poll Logs
            </button>
          )}
          <button
            onClick={handleExportLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#121622] hover:bg-[#181d2c] text-slate-300 text-xs font-semibold border border-[#202738] transition-colors"
          >
            <Download className="w-3.5 h-3.5" /> Export JSON
          </button>
        </div>
      </div>

      {/* 3. Terminal Live Socket View Container */}
      <div className="bg-[#090b10] border border-[#202738] rounded-xl p-4 shadow-xl font-mono text-xs overflow-hidden space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-[#202738] text-slate-400 text-[11px]">
          <span className="flex items-center gap-2 text-cyan-400 font-bold">
            <Terminal className="w-4 h-4" /> eBPF Socket Stream & Structured Container Logs ({filteredLogs.length} Events)
          </span>
          <span className="text-slate-500 text-[10px]">Click any row to select &bull; File locations detected automatically</span>
        </div>

        <div className="max-h-[520px] overflow-y-auto space-y-2 pr-2 scrollbar-thin">
          {filteredLogs.map((log) => {
            const isError = log.level === 'ERROR' || log.level === 'FATAL';
            const isWarn = log.level === 'WARN';
            const isSelected = selectedLogId === log.id;
            const isExpanded = !!expandedTraceIds[log.id];

            return (
              <div
                key={log.id}
                onClick={() => setSelectedLogId(log.id)}
                className={`p-2.5 rounded-lg flex flex-col gap-2 transition-all cursor-pointer border ${
                  isSelected
                    ? 'ring-2 ring-amber-500/80 bg-amber-950/30 border-amber-500/60 shadow-md'
                    : log.isAnomaly
                    ? 'bg-rose-950/30 border-rose-500/30 hover:border-rose-500/60'
                    : isError
                    ? 'bg-rose-950/20 text-rose-200 border-rose-900/30 hover:border-rose-700/50'
                    : isWarn
                    ? 'bg-amber-950/20 text-amber-200 border-amber-900/30 hover:border-amber-700/50'
                    : 'bg-[#121622]/60 text-slate-300 border-[#202738] hover:bg-[#121622] hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="flex items-start gap-2.5 min-w-0 flex-wrap sm:flex-nowrap">
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

                    {/* Prominent File Location Badge */}
                    {log.fileLocation && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 font-mono text-[10px] shrink-0">
                        <FileCode className="w-3 h-3 text-cyan-400" />
                        <span>{log.fileLocation}{log.lineNumber ? `:${log.lineNumber}` : ''}</span>
                      </span>
                    )}

                    <span className="break-all">{log.message}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 text-[10px] text-slate-500 ml-auto sm:ml-0">
                    {/* Selected Badge */}
                    {isSelected && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[9px] font-bold">
                        SELECTED
                      </span>
                    )}

                    {/* AI Solve Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAiSolveLog(log);
                      }}
                      disabled={isSolvingLogId === log.id}
                      className="flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-[10px] font-bold transition-all"
                      title="Diagnose this specific log with AI"
                    >
                      {isSolvingLogId === log.id ? (
                        <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-2.5 h-2.5" />
                      )}
                      <span>AI Solve</span>
                    </button>

                    {log.traceId && (
                      <button
                        onClick={(e) => handleCopyTrace(log.traceId!, e)}
                        className="flex items-center gap-1 hover:text-cyan-400 font-mono transition-colors"
                        title="Click to copy Trace ID"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        <span>{copiedTraceId === log.traceId ? 'COPIED' : log.traceId}</span>
                      </button>
                    )}

                    {log.stackTrace && (
                      <button
                        onClick={(e) => toggleStackTrace(log.id, e)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300"
                        title="Toggle Stack Trace"
                      >
                        <span>{isExpanded ? 'Hide Stack' : 'View Stack'}</span>
                        <ChevronDown className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                      </button>
                    )}

                    {log.isAnomaly && (
                      <span className="px-1.5 py-0.5 rounded bg-rose-500/30 text-rose-300 border border-rose-500/50 font-bold">
                        ANOMALY
                      </span>
                    )}
                  </div>
                </div>

                {/* Expandable Stack Trace */}
                {isExpanded && log.stackTrace && (
                  <div className="mt-2 p-3 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between pb-1 border-b border-slate-800">
                      <span>Stack Trace (Source: {log.fileLocation || 'runtime'})</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyText(log.stackTrace!, `stack-${log.id}`);
                        }}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                      >
                        <Copy className="w-2.5 h-2.5" />
                        {copiedSolutionId === `stack-${log.id}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="overflow-x-auto text-rose-300 leading-relaxed max-h-48 pt-1">
                      {log.stackTrace}
                    </pre>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
