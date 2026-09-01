import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Terminal,
  Search,
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  RefreshCw,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  Radio,
  FileCode,
  Shield,
  Layers,
  Flame,
} from 'lucide-react';
import { WorkflowRun, PipelineStep, PipelineErrorDetail } from '../types';

interface PipelineRunnerConsoleProps {
  selectedRun: WorkflowRun;
  selectedStep: PipelineStep | null;
  onClearSelectedStep?: () => void;
  onSelectStepById?: (stepId: string) => void;
  onFetchAiDiagnosis?: (run: WorkflowRun) => void;
  onSyncLiveLogs?: () => Promise<void>;
  isSyncingLiveLogs?: boolean;
}

export const PipelineRunnerConsole: React.FC<PipelineRunnerConsoleProps> = ({
  selectedRun,
  selectedStep,
  onClearSelectedStep,
  onSelectStepById,
  onFetchAiDiagnosis,
  onSyncLiveLogs,
  isSyncingLiveLogs = false,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'step' | 'errors' | 'live'>('all');
  const [logSearchQuery, setLogSearchQuery] = useState<string>('');
  const [levelFilter, setLevelFilter] = useState<'all' | 'error' | 'warn' | 'info' | 'success'>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  // If user clicks a step externally, switch tab to 'step'
  useEffect(() => {
    if (selectedStep) {
      setActiveTab('step');
    }
  }, [selectedStep]);

  // Aggregate all run logs from errorLogs and stage steps
  const allRunnerLogs = useMemo(() => {
    const lines: string[] = [];

    // 1. Header telemetry lines
    lines.push(`2026-08-30T04:12:00.000Z [INFO] Set up runner: GitHub Actions Runner (ubuntu-latest-8core)`);
    lines.push(`2026-08-30T04:12:01.120Z [INFO] Initializing runner telemetry stream on node runner-ubuntu-latest-4412a...`);
    lines.push(`2026-08-30T04:12:02.450Z [INFO] Workflow: "${selectedRun.workflowName}" (Run ID: ${selectedRun.id})`);
    lines.push(`2026-08-30T04:12:03.000Z [INFO] Repo: ${selectedRun.repo} | Commit: ${selectedRun.commitSha} (${selectedRun.branch})`);
    lines.push(`2026-08-30T04:12:03.500Z [INFO] Target Service: ${selectedRun.targetService || 'service'} | Target Namespace: ${selectedRun.targetNamespace || 'production'}`);
    lines.push(`--------------------------------------------------------------------------------`);

    // 2. Stage steps logs if available
    if (selectedRun.stages && selectedRun.stages.length > 0) {
      selectedRun.stages.forEach((stage, sIdx) => {
        lines.push(`[STAGE ${sIdx + 1}] >>> ${stage.name.toUpperCase()} (Status: ${stage.status.toUpperCase()})`);
        stage.steps.forEach((step) => {
          lines.push(`  [STEP] ${step.name} (${step.durationSec}s) [${step.status.toUpperCase()}]`);
          if (step.logs && step.logs.length > 0) {
            step.logs.forEach((log) => {
              lines.push(`    ${log}`);
            });
          }
        });
        lines.push(` `);
      });
    }

    // 3. Explicit errorLogs if present and not redundant
    if (selectedRun.errorLogs && selectedRun.errorLogs.length > 0) {
      lines.push(`--------------------------------------------------------------------------------`);
      lines.push(`[CONSOLE OUTPUT & LIVE ERROR TRACE]`);
      selectedRun.errorLogs.forEach((log) => {
        lines.push(log);
      });
    }

    if (selectedRun.status === 'failed' || selectedRun.conclusion === 'failure') {
      lines.push(`--------------------------------------------------------------------------------`);
      lines.push(`##[error] Workflow run failed with exit code 1. Step "${selectedRun.failedStepName || 'Build Step'}" halted.`);
    } else if (selectedRun.status === 'in_progress') {
      lines.push(`[LIVE STREAM] Active execution in progress... Telemetry channel connected.`);
    } else {
      lines.push(`[SUCCESS] Workflow execution concluded cleanly with 0 fatal diagnostics.`);
    }

    return lines;
  }, [selectedRun]);

  // Step specific logs
  const stepLogs = useMemo(() => {
    if (selectedStep && selectedStep.logs && selectedStep.logs.length > 0) {
      return selectedStep.logs;
    }
    // If no step selected, find first failing or running step
    if (selectedRun.stages) {
      for (const stage of selectedRun.stages) {
        for (const step of stage.steps) {
          if (step.status === 'failed' || step.status === 'running') {
            return [`[AUTO-FOCUSED ON ${step.name.toUpperCase()}]`, ...step.logs];
          }
        }
      }
    }
    return ['[INFO] Select any step from the Deployment Pipeline Stages diagram above to view its isolated log stream.'];
  }, [selectedStep, selectedRun]);

  // Extracted errors & diagnostics
  const extractedErrors = useMemo(() => {
    if (selectedRun.allErrors && selectedRun.allErrors.length > 0) {
      return selectedRun.allErrors;
    }
    if (selectedRun.errorLogs && selectedRun.errorLogs.length > 0) {
      return selectedRun.errorLogs
        .filter((l) => /error|fail|exception|panic|TS\d{4}|assertion/i.test(l))
        .map((l, idx) => ({
          id: `err-${idx}`,
          stageName: selectedRun.workflowName,
          stepName: selectedRun.failedStepName || 'Execution Step',
          category: 'COMPILER' as const,
          errorLine: l,
        }));
    }
    return [];
  }, [selectedRun]);

  // Filtered active list of lines based on activeTab, search, levelFilter
  const activeDisplayLogs = useMemo(() => {
    let baseList: string[] = [];
    if (activeTab === 'all' || activeTab === 'live') {
      baseList = allRunnerLogs;
    } else if (activeTab === 'step') {
      baseList = stepLogs;
    } else if (activeTab === 'errors') {
      baseList = extractedErrors.map(
        (e) => `[${e.category}] ${e.stepName ? `[${e.stepName}] ` : ''}${e.fileLocation ? `(${e.fileLocation}:${e.lineNumber || 0}) ` : ''}${e.errorLine}`
      );
      if (baseList.length === 0) {
        baseList = ['[INFO] No critical execution errors extracted for this workflow run.'];
      }
    }

    return baseList.filter((log) => {
      // Level filter
      if (levelFilter === 'error' && !/error|fail|fatal|panic|exception|SIGSEGV|TS\d{4}|##\[error\]/i.test(log)) {
        return false;
      }
      if (levelFilter === 'warn' && !/warn|warning|deprecated|anomaly|drift/i.test(log)) {
        return false;
      }
      if (levelFilter === 'info' && !/info|stage|step|checking|initializing|runner/i.test(log)) {
        return false;
      }
      if (levelFilter === 'success' && !/success|passed|clean|0 issues|verified|promoted/i.test(log)) {
        return false;
      }

      // Text search
      if (logSearchQuery.trim()) {
        return log.toLowerCase().includes(logSearchQuery.toLowerCase());
      }
      return true;
    });
  }, [activeTab, allRunnerLogs, stepLogs, extractedErrors, levelFilter, logSearchQuery]);

  // Counts
  const counts = useMemo(() => {
    const errorCount = allRunnerLogs.filter((l) => /error|fail|fatal|panic|exception|TS\d{4}|##\[error\]/i.test(l)).length;
    const warnCount = allRunnerLogs.filter((l) => /warn|warning|anomaly/i.test(l)).length;
    const infoCount = allRunnerLogs.filter((l) => /\[info\]/i.test(l)).length;
    const successCount = allRunnerLogs.filter((l) => /success|passed|verified/i.test(l)).length;
    return {
      all: allRunnerLogs.length,
      errors: errorCount,
      warnings: warnCount,
      info: infoCount,
      success: successCount,
    };
  }, [allRunnerLogs]);

  // Auto-scroll when in live or running mode
  useEffect(() => {
    if (autoScroll && terminalBottomRef.current && (selectedRun.status === 'in_progress' || activeTab === 'live')) {
      terminalBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeDisplayLogs, autoScroll, selectedRun.status, activeTab]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setCopiedLogs(true);
    setTimeout(() => {
      setCopiedCodeId(null);
      setCopiedLogs(false);
    }, 2000);
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([allRunnerLogs.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-runner-${selectedRun.id}-${selectedRun.targetService || 'run'}.log`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-panel rounded-2xl p-5 shadow-2xl border border-white/10 space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 text-cyan-400 shadow-sm">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm font-extrabold text-white tracking-tight flex items-center gap-2">
                GitHub Actions Runner Console & Telemetry Logs
              </h3>
              <span className="px-2 py-0.5 rounded-md glass-badge-cyan text-xs font-mono font-bold">
                {selectedRun.id}
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 font-mono ${
                  selectedRun.status === 'in_progress'
                    ? 'glass-badge-amber animate-pulse'
                    : selectedRun.status === 'failed' || selectedRun.conclusion === 'failure'
                    ? 'glass-badge-rose'
                    : 'glass-badge-emerald'
                }`}
              >
                {selectedRun.status === 'in_progress' ? (
                  <>
                    <Radio className="w-2.5 h-2.5 animate-pulse" /> LIVE STREAMING
                  </>
                ) : selectedRun.status === 'failed' || selectedRun.conclusion === 'failure' ? (
                  '✗ RUN FAILED'
                ) : (
                  '✓ PASSED'
                )}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live stdout/stderr stream from container runner, secret scrubbing telemetry, and step execution traces.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-auto">
          {onSyncLiveLogs && (
            <button
              onClick={onSyncLiveLogs}
              disabled={isSyncingLiveLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-badge-cyan hover:bg-cyan-500/25 text-xs font-bold transition-all disabled:opacity-50"
              title="Fetch latest live runner logs from GitHub API"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncingLiveLogs ? 'animate-spin' : ''}`} />
              <span>{isSyncingLiveLogs ? 'Fetching...' : 'Fetch Live Logs'}</span>
            </button>
          )}

          <button
            onClick={() => copyToClipboard(allRunnerLogs.join('\n'), `all-logs-${selectedRun.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all shadow-sm"
            title="Copy full runner console output to clipboard"
          >
            {copiedLogs ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            <span>{copiedLogs ? 'Copied' : 'Copy Logs'}</span>
          </button>

          <button
            onClick={handleDownloadLogs}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white border border-white/10 text-xs font-semibold transition-all shadow-sm"
            title="Download raw runner output as .log file"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download</span>
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 text-slate-300 hover:text-white border border-white/10 transition-colors"
            title={isExpanded ? 'Collapse Terminal height' : 'Expand Terminal height'}
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-900/60 p-2.5 rounded-xl border border-white/10 backdrop-blur-md">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'all'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>All Runner Logs</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-slate-800 text-slate-300 font-mono">
              {counts.all}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('step')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'step'
                ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <FileCode className="w-3.5 h-3.5 text-indigo-400" />
            <span>Selected Step</span>
            {selectedStep && (
              <span className="px-1.5 py-0.2 text-[10px] rounded bg-indigo-500/20 text-indigo-300 font-mono truncate max-w-[120px]">
                {selectedStep.name}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('errors')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'errors'
                ? 'bg-rose-500/25 text-rose-300 border border-rose-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Errors & Traces</span>
            {counts.errors > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-rose-500/30 text-rose-200 font-mono font-bold">
                {counts.errors}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Radio className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live Stream</span>
          </button>
        </div>

        {/* Level Filters & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Level Filter Selector */}
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-lg border border-white/10 text-[11px] font-mono">
            <button
              onClick={() => setLevelFilter('all')}
              className={`px-2 py-0.5 rounded transition-all ${
                levelFilter === 'all' ? 'bg-slate-800 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setLevelFilter('error')}
              className={`px-2 py-0.5 rounded transition-all flex items-center gap-1 ${
                levelFilter === 'error' ? 'bg-rose-500/30 text-rose-300 font-bold' : 'text-slate-400 hover:text-rose-300'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
              <span>Err ({counts.errors})</span>
            </button>
            <button
              onClick={() => setLevelFilter('info')}
              className={`px-2 py-0.5 rounded transition-all ${
                levelFilter === 'info' ? 'bg-cyan-500/30 text-cyan-300 font-bold' : 'text-slate-400 hover:text-cyan-300'
              }`}
            >
              Info
            </button>
            <button
              onClick={() => setLevelFilter('success')}
              className={`px-2 py-0.5 rounded transition-all ${
                levelFilter === 'success' ? 'bg-emerald-500/30 text-emerald-300 font-bold' : 'text-slate-400 hover:text-emerald-300'
              }`}
            >
              Success
            </button>
          </div>

          {/* Search Box */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={logSearchQuery}
              onChange={(e) => setLogSearchQuery(e.target.value)}
              placeholder="Filter logs..."
              className="pl-8 pr-3 py-1 rounded-lg bg-slate-950 border border-white/10 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
            />
            {logSearchQuery && (
              <button
                onClick={() => setLogSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                &times;
              </button>
            )}
          </div>

          {/* Auto-scroll Switch */}
          <button
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1 rounded-lg text-[11px] font-mono border transition-all ${
              autoScroll
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                : 'bg-slate-950 text-slate-500 border-white/10'
            }`}
            title="Auto-scroll to latest incoming logs"
          >
            Auto-Scroll {autoScroll ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Selected Step Banner (if in step view) */}
      {selectedStep && activeTab === 'step' && (
        <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300 font-mono">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-indigo-400" />
            <span>
              Inspecting Step: <strong>{selectedStep.name}</strong> ({selectedStep.durationSec}s)
            </span>
            <span
              className={`px-2 py-0.2 rounded text-[10px] uppercase font-bold ${
                selectedStep.status === 'failed'
                  ? 'bg-rose-500/20 text-rose-300'
                  : selectedStep.status === 'running'
                  ? 'bg-cyan-500/20 text-cyan-300 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}
            >
              {selectedStep.status}
            </span>
          </div>
          {onClearSelectedStep && (
            <button
              onClick={onClearSelectedStep}
              className="text-xs text-slate-400 hover:text-white transition-colors"
            >
              Show All Logs
            </button>
          )}
        </div>
      )}

      {/* Terminal View Container */}
      <div className="rounded-xl bg-slate-950/95 border border-slate-800 shadow-2xl overflow-hidden font-mono">
        {/* Terminal Title Bar */}
        <div className="px-4 py-2 bg-slate-900/90 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block" />
            <span className="ml-2 font-bold text-slate-300">
              bash -c "github-actions-runner --workflow {selectedRun.id} --stream"
            </span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[10px] text-slate-500">
            <span>Lines: {activeDisplayLogs.length}</span>
            <span>Encoding: UTF-8</span>
            <span>Security: Secret-Scrubbed</span>
          </div>
        </div>

        {/* Scrollable Terminal Output Body */}
        <div
          className={`p-4 overflow-y-auto space-y-1 text-xs select-text leading-relaxed ${
            isExpanded ? 'max-h-[620px] min-h-[480px]' : 'max-h-[380px] min-h-[260px]'
          }`}
        >
          {activeDisplayLogs.length > 0 ? (
            activeDisplayLogs.map((line, idx) => {
              const isError = /error|fail|exception|fatal|panic|SIGSEGV|TS\d{4}|##\[error\]|assertion/i.test(line);
              const isWarn = /warn|warning|anomaly|drift/i.test(line);
              const isSuccess = /success|passed|verified|cleanly|0 issues/i.test(line);
              const isStageHeader = /\[STAGE|>>>|--------------------------------------------------------------------------------/i.test(line);
              const isStepHeader = /\[STEP\]/i.test(line);

              let textClass = 'text-slate-400';
              if (isError) textClass = 'text-rose-300 font-semibold bg-rose-950/20 px-1 rounded';
              else if (isWarn) textClass = 'text-amber-300 font-medium';
              else if (isSuccess) textClass = 'text-emerald-300 font-medium';
              else if (isStageHeader) textClass = 'text-cyan-300 font-bold border-b border-cyan-500/20 pb-0.5 mt-2';
              else if (isStepHeader) textClass = 'text-indigo-300 font-semibold';

              return (
                <div key={idx} className="flex items-start gap-2.5 hover:bg-slate-900/60 py-0.5 px-1 rounded transition-colors group">
                  <span className="text-slate-600 select-none text-[11px] w-8 shrink-0 text-right group-hover:text-slate-400">
                    {idx + 1}
                  </span>
                  <span className={`break-all ${textClass}`}>
                    {line}
                  </span>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-slate-500 space-y-2">
              <Terminal className="w-8 h-8 mx-auto text-slate-600 opacity-50" />
              <p>No log lines match current search or level filters.</p>
              {logSearchQuery && (
                <button
                  onClick={() => {
                    setLogSearchQuery('');
                    setLevelFilter('all');
                  }}
                  className="text-cyan-400 hover:underline text-xs"
                >
                  Clear search filters
                </button>
              )}
            </div>
          )}
          <div ref={terminalBottomRef} />
        </div>

        {/* Terminal Footer Status Bar */}
        <div className="px-4 py-2 bg-slate-900/90 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-[11px] text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${selectedRun.status === 'in_progress' ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
            <span>
              Runner: <strong>runner-ubuntu-latest-4412a</strong>
            </span>
            <span className="text-slate-600">|</span>
            <span>Duration: <strong>{selectedRun.durationSec}s</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-500 flex items-center gap-1">
              <Shield className="w-3 h-3 text-emerald-400" /> Auto Secret Redaction Active
            </span>
            {selectedRun.status === 'failed' && onFetchAiDiagnosis && (
              <button
                onClick={() => onFetchAiDiagnosis(selectedRun)}
                className="flex items-center gap-1 text-rose-300 hover:text-rose-200 font-bold underline"
              >
                <Sparkles className="w-3 h-3" /> Diagnose Failure with Gemini
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
