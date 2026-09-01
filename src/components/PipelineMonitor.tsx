import React, { useState, useEffect, useMemo } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  Bug,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  FileCode,
  Filter,
  Flame,
  GitBranch,
  GitCommit,
  Github,
  GitPullRequest,
  HelpCircle,
  History,
  Info,
  Layers,
  Lightbulb,
  Link,
  Play,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
  Wrench,
  XCircle,
  Zap,
} from 'lucide-react';
import { BuildFailureAiDiagnosis, CommitActivity, GitHubRepo, WorkflowRun, PipelineErrorDetail, PipelineStep } from '../types';
import { GitHubWorkflowInspector } from './GitHubWorkflowInspector';
import { PipelineRunnerConsole } from './PipelineRunnerConsole';

interface PipelineMonitorProps {
  repo: GitHubRepo | null;
  commits: CommitActivity[];
  workflowRuns: WorkflowRun[];
  onTriggerRun: (branch: string, service: string, simulateFailure?: boolean) => void;
  onWorkflowRunCreated?: (run: WorkflowRun) => void;
  onConnectRepo?: (repoUrl: string, token?: string) => Promise<boolean>;
  onSyncRepo?: () => Promise<boolean>;
  onDisconnectRepo?: () => Promise<boolean>;
  onNavigateToFailures?: () => void;
  onNavigateToTechStack?: () => void;
  onNavigateToGoIngestion?: () => void;
}

export const PipelineMonitor: React.FC<PipelineMonitorProps> = ({
  repo,
  commits,
  workflowRuns,
  onTriggerRun,
  onWorkflowRunCreated,
  onConnectRepo,
  onSyncRepo,
  onDisconnectRepo,
  onNavigateToFailures,
  onNavigateToTechStack,
  onNavigateToGoIngestion,
}) => {
  const [selectedRunId, setSelectedRunId] = useState<string>(
    workflowRuns[0]?.id || ''
  );
  const [selectedStep, setSelectedStep] = useState<PipelineStep | null>(null);
  const [isSyncingLiveLogs, setIsSyncingLiveLogs] = useState(false);
  const [selectedStepLogs, setSelectedStepLogs] = useState<{
    stepName: string;
    logs: string[];
  } | null>(null);

  // Sync state
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [timeAgoText, setTimeAgoText] = useState('Just now');

  // Trigger pipeline state
  const [targetBranch, setTargetBranch] = useState(repo?.branch || 'main');
  const [targetService, setTargetService] = useState(repo?.name || '');
  const [simulateFailure, setSimulateFailure] = useState(false);
  const [isDispatching, setIsDispatching] = useState(false);
  const [showTriggerInfo, setShowTriggerInfo] = useState(false);
  const [showTriggerModal, setShowTriggerModal] = useState(false);

  // Connect Custom Repo State
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [customRepoUrl, setCustomRepoUrl] = useState('');
  const [githubToken, setGithubToken] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [connectSuccess, setConnectSuccess] = useState<string | null>(null);

  // Filter state for workflow runs
  const [runFilter, setRunFilter] = useState<'all' | 'failed' | 'in_progress' | 'completed'>('all');

  // AI Copilot RCA Explanation & Live Diagnosis state
  const [showCopilotRCA, setShowCopilotRCA] = useState<Record<string, boolean>>({});
  const [aiDiagnosisMap, setAiDiagnosisMap] = useState<Record<string, BuildFailureAiDiagnosis | null>>({});
  const [loadingAiMap, setLoadingAiMap] = useState<Record<string, boolean>>({});
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [remediatingRunId, setRemediatingRunId] = useState<string | null>(null);
  const [remediationMsg, setRemediationMsg] = useState<string | null>(null);

  // Multi-Error Matrix & Diagnostics state
  const [selectedErrorCategory, setSelectedErrorCategory] = useState<string>('all');
  const [errorSearchTerm, setErrorSearchTerm] = useState<string>('');
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null);
  const [selectedTargetedErrorId, setSelectedTargetedErrorId] = useState<string | null>(null);
  const [rawLogSearchQuery, setRawLogSearchQuery] = useState<string>('');
  const [showAllRawLogs, setShowAllRawLogs] = useState<boolean>(false);

  // Synchronize default targetService and selectedRunId when repo or workflowRuns update
  useEffect(() => {
    if (repo?.name && !targetService) {
      setTargetService(repo.name);
    }
    if (repo?.branch) {
      setTargetBranch(repo.branch);
    }
  }, [repo]);

  useEffect(() => {
    if (workflowRuns.length > 0 && (!selectedRunId || !workflowRuns.some((r) => r.id === selectedRunId))) {
      setSelectedRunId(workflowRuns[0].id);
    }
  }, [workflowRuns, selectedRunId]);

  // Relative time tracker
  useEffect(() => {
    const timer = setInterval(() => {
      const diffSec = Math.round((Date.now() - lastSyncTime.getTime()) / 1000);
      if (diffSec < 5) setTimeAgoText('Just now');
      else if (diffSec < 60) setTimeAgoText(`${diffSec}s ago`);
      else setTimeAgoText(`${Math.floor(diffSec / 60)}m ago`);
    }, 3000);
    return () => clearInterval(timer);
  }, [lastSyncTime]);

  // Auto-sync polling every 15s when enabled
  useEffect(() => {
    if (!autoSyncEnabled || !onSyncRepo) return;
    const interval = setInterval(async () => {
      try {
        await onSyncRepo();
        setLastSyncTime(new Date());
      } catch (err) {
        console.warn('Auto-sync check failed:', err);
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [autoSyncEnabled, onSyncRepo]);

  const handleManualSync = async () => {
    if (!onSyncRepo || isSyncing) return;
    setIsSyncing(true);
    try {
      await onSyncRepo();
      setLastSyncTime(new Date());
      setTimeAgoText('Just now');
    } catch (err) {
      console.error('Manual sync failed:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    if (onDisconnectRepo) {
      await onDisconnectRepo();
      setTargetService('');
    }
  };

  const handleDispatch = (isFailMode: boolean = simulateFailure) => {
    setIsDispatching(true);
    onTriggerRun(targetBranch, targetService.trim() || repo?.name || 'app-service', isFailMode);
    setShowTriggerModal(false);
    setTimeout(() => {
      setIsDispatching(false);
      handleManualSync();
    }, 900);
  };

  const handleConnectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customRepoUrl.trim()) return;
    setIsConnecting(true);
    setConnectError(null);
    setConnectSuccess(null);

    try {
      if (onConnectRepo) {
        const ok = await onConnectRepo(customRepoUrl.trim(), githubToken.trim() || undefined);
        if (ok) {
          setConnectSuccess(`Successfully synced live telemetry from ${customRepoUrl.trim()}`);
          setLastSyncTime(new Date());
          setTimeAgoText('Just now');
          setTimeout(() => {
            setShowConnectModal(false);
            setConnectSuccess(null);
          }, 1500);
        } else {
          setConnectError('Failed to connect to the specified repository.');
        }
      }
    } catch (err: any) {
      setConnectError(err.message || 'Error connecting to repository.');
    } finally {
      setIsConnecting(false);
    }
  };

  // Filter workflow runs
  const filteredRuns = workflowRuns.filter((run) => {
    if (runFilter === 'all') return true;
    if (runFilter === 'failed') return run.status === 'failed' || run.conclusion === 'failure';
    if (runFilter === 'in_progress') return run.status === 'in_progress' || run.status === 'queued';
    if (runFilter === 'completed') return run.status === 'completed' || run.conclusion === 'success';
    return true;
  });

  const selectedRun =
    workflowRuns.find((r) => r.id === selectedRunId) || workflowRuns[0] || null;

  // Comprehensive helper to extract file, line, and column from error lines and stack frames
  const extractFileAndLineInfo = (text: string): { fileLocation?: string; lineNumber?: number; columnNumber?: number } => {
    if (!text) return {};
    // 1. Python: File "app.py", line 42, in test_fn
    const pyMatch = text.match(/File\s+["']([^"']+\.[a-zA-Z0-9]+)["'],\s+line\s+(\d+)/i);
    if (pyMatch) {
      return { fileLocation: pyMatch[1], lineNumber: parseInt(pyMatch[2], 10) };
    }
    // 2. Rust/Cargo: --> src/main.rs:18:5
    const rustMatch = text.match(/-->\s+([a-zA-Z0-9_\-\.\/]+\.[a-zA-Z0-9]+):(\d+)(?::(\d+))?/);
    if (rustMatch) {
      return {
        fileLocation: rustMatch[1],
        lineNumber: parseInt(rustMatch[2], 10),
        columnNumber: rustMatch[3] ? parseInt(rustMatch[3], 10) : undefined,
      };
    }
    // 3. Stack trace: at Object.<anonymous> (/app/src/handlers/auth.ts:89:12)
    const stackMatch = text.match(/at\s+(?:[^\(\n]*\()?(?:[a-zA-Z]:[\\\/]|\/)?([a-zA-Z0-9_\-\.\/]+\.(?:ts|tsx|js|jsx|rs|go|py|java|c|cpp|h|json|yaml|yml|sql|sh)):(\d+)(?::(\d+))?\)?/i);
    if (stackMatch) {
      return {
        fileLocation: stackMatch[1],
        lineNumber: parseInt(stackMatch[2], 10),
        columnNumber: stackMatch[3] ? parseInt(stackMatch[3], 10) : undefined,
      };
    }
    // 4. Standard path:line:col or path(line,col)
    const stdMatch = text.match(/(?:^|[\s"'`\(\[])([a-zA-Z0-9_\-\.\/]+\.(?:ts|tsx|js|jsx|rs|go|py|java|c|cpp|h|json|yaml|yml|sql|sh|rb|php|proto|toml|Dockerfile))(?::(\d+)(?::(\d+))?|\((\d+),(\d+)\))?/i);
    if (stdMatch && stdMatch[1] && !stdMatch[1].startsWith('http://') && !stdMatch[1].startsWith('https://')) {
      const fileLocation = stdMatch[1];
      let lineNumber: number | undefined = undefined;
      let columnNumber: number | undefined = undefined;
      if (stdMatch[2]) {
        lineNumber = parseInt(stdMatch[2], 10);
        if (stdMatch[3]) columnNumber = parseInt(stdMatch[3], 10);
      } else if (stdMatch[4]) {
        lineNumber = parseInt(stdMatch[4], 10);
        if (stdMatch[5]) columnNumber = parseInt(stdMatch[5], 10);
      }
      return { fileLocation, lineNumber, columnNumber };
    }
    return {};
  };

  // Memoized All Errors parsing and normalization from selectedRun
  const runAllErrors: PipelineErrorDetail[] = useMemo(() => {
    if (!selectedRun) return [];
    if (selectedRun.allErrors && selectedRun.allErrors.length > 0) {
      return selectedRun.allErrors.map((err, idx) => {
        if (!err.fileLocation) {
          const extracted = extractFileAndLineInfo(err.errorLine || '');
          return {
            ...err,
            id: err.id || `err-${selectedRun.id}-${idx}`,
            fileLocation: extracted.fileLocation || err.fileLocation,
            lineNumber: extracted.lineNumber || err.lineNumber,
            columnNumber: extracted.columnNumber || err.columnNumber,
          };
        }
        return {
          ...err,
          id: err.id || `err-${selectedRun.id}-${idx}`,
        };
      });
    }
    if (selectedRun.errorLogs && selectedRun.errorLogs.length > 0) {
      return selectedRun.errorLogs.map((l, idx) => {
        let cat: PipelineErrorDetail['category'] = 'EXIT_CODE';
        if (/TS\d{4}|SyntaxError|error TS|TypeError|ReferenceError|cannot find module|compile error/i.test(l)) cat = 'COMPILER';
        else if (/FAIL|AssertionError|Expected|Received|assertion failed|--- FAIL:|Test failed/i.test(l)) cat = 'TEST_ASSERTION';
        else if (/eslint|prettier|golangci-lint|warning/i.test(l)) cat = 'LINTER';
        else if (/E404|npm ERR!|go: missing|pip error|Could not find a version|package .* not found/i.test(l)) cat = 'DEPENDENCY';
        else if (/trivy|HIGH|CRITICAL|vulnerability|CVE-/i.test(l)) cat = 'SECURITY';
        else if (/panic:|fatal error:|SIGSEGV|NullPointerException|unhandled rejection/i.test(l)) cat = 'RUNTIME_PANIC';

        const fileInfo = extractFileAndLineInfo(l);
        return {
          id: `err-auto-${selectedRun.id}-${idx}`,
          stageName: selectedRun.workflowName,
          stepName: selectedRun.failedStepName || 'Build Step',
          category: cat,
          errorLine: l,
          fileLocation: fileInfo.fileLocation,
          lineNumber: fileInfo.lineNumber,
          columnNumber: fileInfo.columnNumber,
        };
      });
    }
    return [
      {
        id: `err-default-${selectedRun.id}`,
        stageName: selectedRun.workflowName,
        stepName: selectedRun.failedStepName || 'Pipeline Execution',
        category: 'EXIT_CODE',
        errorLine: selectedRun.failureReason || 'Process exited with non-zero exit code 1',
      },
    ];
  }, [selectedRun]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: runAllErrors.length };
    runAllErrors.forEach((e) => {
      counts[e.category] = (counts[e.category] || 0) + 1;
    });
    return counts;
  }, [runAllErrors]);

  const filteredErrors = useMemo(() => {
    return runAllErrors.filter((err) => {
      const matchCategory = selectedErrorCategory === 'all' || err.category === selectedErrorCategory;
      const matchSearch =
        !errorSearchTerm.trim() ||
        err.errorLine.toLowerCase().includes(errorSearchTerm.toLowerCase()) ||
        (err.stepName && err.stepName.toLowerCase().includes(errorSearchTerm.toLowerCase())) ||
        (err.fileLocation && err.fileLocation.toLowerCase().includes(errorSearchTerm.toLowerCase())) ||
        (err.fullMessage && err.fullMessage.toLowerCase().includes(errorSearchTerm.toLowerCase()));
      return matchCategory && matchSearch;
    });
  }, [runAllErrors, selectedErrorCategory, errorSearchTerm]);

  const filteredRawLogs = useMemo(() => {
    if (!selectedRun || !selectedRun.errorLogs) return [];
    if (!rawLogSearchQuery.trim()) return selectedRun.errorLogs;
    return selectedRun.errorLogs.filter((log) =>
      log.toLowerCase().includes(rawLogSearchQuery.toLowerCase())
    );
  }, [selectedRun, rawLogSearchQuery]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleFetchAiBuildDiagnosis = async (run: WorkflowRun, targetedErr?: PipelineErrorDetail) => {
    const targetKey = targetedErr ? `${run.id}-${targetedErr.id}` : run.id;
    setLoadingAiMap((prev) => ({ ...prev, [run.id]: true, [targetKey]: true }));
    if (targetedErr) {
      setSelectedTargetedErrorId(targetedErr.id);
    }
    try {
      const res = await fetch('/api/ai/diagnose-build-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: run.repo,
          branch: run.branch,
          commitSha: run.commitSha,
          failedStepName: targetedErr?.stepName || run.failedStepName || 'Build Step',
          errorLogs: targetedErr
            ? [targetedErr.errorLine, ...(targetedErr.stackSnippet || [])]
            : (run.errorLogs || [run.failureReason || 'Non-zero exit code']),
          commitMessage: run.commitMessage,
          targetedError: targetedErr,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAiDiagnosisMap((prev) => ({
          ...prev,
          [run.id]: data.diagnosis,
          ...(targetedErr ? { [targetedErr.id]: data.diagnosis } : {}),
        }));
        // Ensure the RCA Copilot section is opened
        setShowCopilotRCA((prev) => ({ ...prev, [run.id]: true }));
      }
    } catch (err) {
      console.error('Error querying AI diagnosis:', err);
    } finally {
      setLoadingAiMap((prev) => ({ ...prev, [run.id]: false, [targetKey]: false }));
    }
  };

  const handleAutoFixRun = async (run: WorkflowRun) => {
    setRemediatingRunId(run.id);
    try {
      const res = await fetch('/api/history/failed-builds/auto-fix-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          runId: run.id,
          repo: run.repo,
          branch: run.branch,
          commitSha: run.commitSha,
          failedStepName: run.failedStepName || 'Integration & Unit Tests',
          errorLogs: run.errorLogs || [run.failureReason || 'Process exited with error code 1'],
          commitMessage: run.commitMessage,
          service: run.targetService || repo?.name || 'app-service',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRemediationMsg(data.message || 'Auto-fix patch applied. Green pipeline dispatched!');
        setTimeout(() => setRemediationMsg(null), 6000);
        
        if (data.newRun) {
          if (onWorkflowRunCreated) {
            onWorkflowRunCreated(data.newRun);
          }
          setSelectedRunId(data.newRun.id);
        }
        if (onSyncRepo) {
          await onSyncRepo();
        }
        return;
      }

      // Fallback: trigger normal run
      onTriggerRun(run.branch, run.targetService || repo?.name || 'service', false);
      setRemediationMsg('Dispatched verified patch build to GitHub Actions.');
      setTimeout(() => setRemediationMsg(null), 5000);
      if (onSyncRepo) {
        await onSyncRepo();
      }
    } catch (err) {
      console.error('Auto fix run error:', err);
      // Fallback
      onTriggerRun(run.branch, run.targetService || repo?.name || 'service', false);
    } finally {
      setRemediatingRunId(null);
    }
  };

  const handleSyncLiveLogs = async () => {
    if (!selectedRun) return;
    setIsSyncingLiveLogs(true);
    try {
      const activeRepoName = (repo?.owner && repo?.name) ? `${repo.owner}/${repo.name}` : (customRepoUrl || 'kubernetes/k8s-ai-copilot-engine');
      const res = await fetch('/api/github/fetch-live-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repoUrl: activeRepoName,
          token: githubToken || undefined,
          runId: selectedRun.id,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.rawLogsPreview && data.rawLogsPreview.length > 0) {
          selectedRun.errorLogs = data.rawLogsPreview;
        }
        if (data.allErrors && data.allErrors.length > 0) {
          selectedRun.allErrors = data.allErrors;
        }
        if (data.aiDiagnosis) {
          setAiDiagnosisMap((prev) => ({ ...prev, [selectedRun.id]: data.aiDiagnosis }));
        }
      }
      if (onSyncRepo) {
        await onSyncRepo();
      }
    } catch (err) {
      console.warn('Could not sync live runner logs:', err);
    } finally {
      setIsSyncingLiveLogs(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* GitHub Repository Header & Activity Card */}
      <div className="glass-panel rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-400/30 shadow-lg shadow-cyan-500/10 backdrop-blur-md">
              <Github className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  <span>{(repo?.owner && repo?.name) ? `${repo.owner}/${repo.name}` : 'GitHub Repository Pipeline'}</span>
                  {repo?.owner && repo?.name && (
                    <a
                      href={`https://github.com/${repo.owner}/${repo.name}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-cyan-300 transition-colors"
                      title="Open on GitHub"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  )}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full glass-badge-cyan text-xs font-mono">
                  {repo?.branch || 'main'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full glass-badge-emerald text-xs flex items-center gap-1.5 font-medium">
                  <CheckCircle className="w-3 h-3" /> Live Synced ({timeAgoText})
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Real-time GitHub Actions CI/CD telemetry, build step diagnostics, and live commit lineage.
              </p>
            </div>
          </div>

          {/* Controls: Live Sync, Connect, Target Service, Trigger */}
          <div className="flex flex-wrap items-center gap-2 bg-slate-900/60 p-2 rounded-2xl border border-white/10 backdrop-blur-md shadow-inner">
            {/* 1. Sync Button */}
            <button
              id="sync-github-button"
              onClick={handleManualSync}
              disabled={isSyncing}
              className="flex items-center gap-1.5 px-3 py-1.5 glass-badge-cyan hover:bg-cyan-500/25 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              title="Re-fetch latest commits and live GitHub Actions pipeline status"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync with GitHub'}</span>
            </button>

            {/* Auto-sync Switch */}
            <button
              onClick={() => setAutoSyncEnabled(!autoSyncEnabled)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-medium border flex items-center gap-1.5 transition-all backdrop-blur-md ${
                autoSyncEnabled
                  ? 'glass-badge-emerald'
                  : 'bg-slate-900/60 text-slate-400 border-white/10 hover:text-slate-200'
              }`}
              title="Automatically poll GitHub Actions status every 15 seconds"
            >
              <span className={`w-2 h-2 rounded-full ${autoSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
              <span>Auto-Sync {autoSyncEnabled ? 'ON (15s)' : 'OFF'}</span>
            </button>

            {/* Connect / Change Repo */}
            <button
              onClick={() => setShowConnectModal(!showConnectModal)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/80 hover:bg-slate-700/80 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-white/10 backdrop-blur-md transition-all shadow-sm"
            >
              <Link className="w-3.5 h-3.5 text-cyan-400" />
              <span>{showConnectModal ? 'Close Form' : 'Connect Repo'}</span>
            </button>

            {/* Tech Stack Auto-Discovery Link */}
            {onNavigateToTechStack && (
              <button
                onClick={onNavigateToTechStack}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-500/30 backdrop-blur-md transition-all shadow-sm"
                title="View detected Dockerfile, GitHub Actions, Helm, and K8s manifests"
              >
                <Code2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tech Stack & Structure</span>
              </button>
            )}

            {/* Target Service Selector */}
            <div className="flex items-center gap-1.5 px-2 border-l border-white/10">
              <span className="text-xs text-slate-400">Target:</span>
              <input
                type="text"
                value={targetService}
                onChange={(e) => setTargetService(e.target.value)}
                placeholder={repo ? repo.name : 'Enter service name...'}
                className="w-36 glass-input text-xs rounded-lg px-2.5 py-1.5 font-mono"
              />
            </div>

            {/* Trigger Pipeline Button */}
            <div className="flex items-center gap-1">
              <button
                id="trigger-pipeline-button"
                onClick={() => setShowTriggerModal(true)}
                disabled={isDispatching}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/25 border border-cyan-400/40 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
              >
                {isDispatching ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                <span>Trigger Pipeline</span>
              </button>

              <button
                onClick={() => setShowTriggerInfo(!showTriggerInfo)}
                className="p-1.5 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-white/5 transition-colors"
                title="What does Trigger Pipeline do?"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
            </div>

            {/* Disconnect Repo Button */}
            {repo && onDisconnectRepo && (
              <button
                onClick={handleDisconnect}
                className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-all"
                title="Disconnect repository and clear state"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Informational Banner: What is "Trigger Pipeline"? */}
        {showTriggerInfo && (
          <div className="mt-4 p-4 rounded-xl glass-badge-cyan text-xs leading-relaxed flex items-start justify-between gap-3 animate-fadeIn">
            <div className="flex items-start gap-2.5">
              <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white">Why use "Trigger Pipeline"?</p>
                <p className="mt-0.5 text-slate-200 leading-relaxed">
                  In production DevOps, <strong>Trigger Pipeline</strong> dispatches a live CI/CD workflow run (equivalent to GitHub Actions <code className="text-cyan-300 font-mono">workflow_dispatch</code> or pushing code). It executes static linting, security scans, unit & integration test matrices, Docker image packaging, and progressive canary rollouts. You can test both <strong>Successful Runs</strong> and <strong>Simulated Failures</strong> to practice root-cause analysis!
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowTriggerInfo(false)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1.5"
            >
              &times;
            </button>
          </div>
        )}

        {/* Trigger Pipeline Configuration Modal */}
        {showTriggerModal && (
          <div className="mt-5 pt-5 border-t border-white/10 glass-card p-4 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Play className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                  Dispatch CI/CD Pipeline Execution
                </h4>
              </div>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Branch</label>
                <input
                  type="text"
                  value={targetBranch}
                  onChange={(e) => setTargetBranch(e.target.value)}
                  placeholder="main"
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Microservice / Component</label>
                <input
                  type="text"
                  value={targetService}
                  onChange={(e) => setTargetService(e.target.value)}
                  placeholder={repo ? repo.name : 'payment-gateway'}
                  className="w-full glass-input rounded-xl px-3 py-1.5 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-slate-400 mb-1">Execution Mode</label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulateFailure(false)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      !simulateFailure
                        ? 'glass-badge-emerald shadow-sm'
                        : 'bg-slate-900/50 text-slate-400 border-white/10'
                    }`}
                  >
                    ✓ Success Run
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulateFailure(true)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                      simulateFailure
                        ? 'glass-badge-rose shadow-sm'
                        : 'bg-slate-900/50 text-slate-400 border-white/10'
                    }`}
                  >
                    ✗ Simulate Failure
                  </button>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-[11px] text-slate-400">
                {simulateFailure
                  ? 'Simulates a pipeline failure with non-zero exit code & test assertion failure to demonstrate RCA diagnostics.'
                  : 'Executes full test suite, builds signed container, and shifts traffic to canary pods.'}
              </span>
              <button
                onClick={() => handleDispatch(simulateFailure)}
                disabled={isDispatching}
                className="px-4 py-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all flex items-center gap-2"
              >
                {isDispatching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
                <span>Launch Pipeline Now</span>
              </button>
            </div>
          </div>
        )}

        {/* Expandable Custom GitHub Repo Connect Drawer */}
        {showConnectModal && (
          <div className="mt-5 pt-5 border-t border-white/10 glass-card p-4 rounded-2xl">
            <form onSubmit={handleConnectSubmit} className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Connect Any Public or Private GitHub Repository
                  </h4>
                </div>
                <span className="text-[11px] text-slate-400">
                  Fetches live commits, real GitHub Actions workflows & PRs
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    Repository URL or Slug (e.g. <span className="text-cyan-300">facebook/react</span> or <span className="text-cyan-300">https://github.com/username/repo</span>)
                  </label>
                  <input
                    type="text"
                    value={customRepoUrl}
                    onChange={(e) => setCustomRepoUrl(e.target.value)}
                    placeholder="https://github.com/username/your-repository"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-slate-400 mb-1">
                    GitHub Token (Optional for Private Repos)
                  </label>
                  <input
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                    className="w-full glass-input rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>

              {/* Popular Repository Presets */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[11px] text-slate-400">Quick Test Presets:</span>
                {[
                  'kubernetes/kubernetes',
                  'facebook/react',
                  'golang/go',
                  'rust-lang/rust',
                  'vercel/next.js',
                ].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomRepoUrl(`https://github.com/${preset}`)}
                    className="px-2.5 py-1 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 text-[11px] font-mono text-cyan-300 border border-white/10 backdrop-blur-md transition-all shadow-sm"
                  >
                    {preset}
                  </button>
                ))}
              </div>

              {connectError && (
                <div className="p-3.5 glass-badge-rose rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{connectError}</span>
                </div>
              )}

              {connectSuccess && (
                <div className="p-3.5 glass-badge-emerald rounded-xl text-xs flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{connectSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConnectModal(false)}
                  className="px-3.5 py-1.5 rounded-xl border border-white/10 text-slate-300 text-xs hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isConnecting}
                  className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all disabled:opacity-50"
                >
                  {isConnecting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  <span>Connect & Sync Live Data</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Discovered GitHub Actions Workflows from Repository */}
      <GitHubWorkflowInspector onTriggerRun={onTriggerRun} />

      {/* Main Grid: Pipeline Inspector & Live Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Pipeline Stage Flow & Diagnostic Logs */}
        <div className="lg:col-span-2 space-y-6">
          {selectedRun ? (
            <div className="glass-panel rounded-2xl p-5 shadow-2xl space-y-5">
              {/* Selected Run Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono font-bold text-cyan-300 glass-badge-cyan px-2.5 py-0.5 rounded-lg">
                      {selectedRun.id}
                    </span>
                    <h3 className="text-sm font-extrabold text-white">
                      {selectedRun.workflowName}
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border backdrop-blur-md ${
                        selectedRun.status === 'in_progress' || selectedRun.status === 'queued'
                          ? 'glass-badge-amber animate-pulse'
                          : selectedRun.status === 'failed' || selectedRun.conclusion === 'failure'
                          ? 'glass-badge-rose'
                          : 'glass-badge-emerald'
                      }`}
                    >
                      {selectedRun.status === 'in_progress' || selectedRun.status === 'queued'
                        ? '⚡ RUNNING'
                        : selectedRun.status === 'failed' || selectedRun.conclusion === 'failure'
                        ? '✗ BUILD FAILED'
                        : '✓ SUCCESS'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1 font-mono text-slate-300">
                      <GitCommit className="w-3 h-3 text-cyan-400" /> {selectedRun.commitSha}
                    </span>
                    <span>&bull;</span>
                    <span className="text-slate-200">{selectedRun.commitMessage}</span>
                    <span>&bull;</span>
                    <span className="text-slate-300 font-mono">{selectedRun.author}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/60 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md self-start shadow-sm">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <div className="text-xs">
                    <span className="text-slate-400">Duration: </span>
                    <span className="font-bold text-white">{selectedRun.durationSec}s</span>
                    <span className="text-slate-500 text-[10px]"> (Baseline {selectedRun.baselineDurationSec}s)</span>
                  </div>
                  {selectedRun.hasDurationAnomaly && (
                    <span className="ml-1 px-1.5 py-0.5 glass-badge-rose rounded text-[10px] font-bold flex items-center gap-1">
                      <Flame className="w-2.5 h-2.5" /> +83% Drift
                    </span>
                  )}
                </div>
              </div>

              {/* PROMINENT FAILURE DIAGNOSTICS & MULTI-ERROR MATRIX (Visible on Failed Runs) */}
              {(selectedRun.status === 'failed' || selectedRun.conclusion === 'failure') && (
                <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 backdrop-blur-md space-y-5 animate-fadeIn shadow-xl shadow-rose-950/40">
                  {/* Top Failure Header */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-rose-500/25">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 mt-0.5 border border-rose-500/40 shadow-inner">
                        <ShieldAlert className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-rose-300 uppercase tracking-wider flex items-center gap-2 flex-wrap">
                          <span>GitHub Actions Pipeline Build Failed</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/30 text-rose-200 text-[10px] font-mono border border-rose-500/40">
                            Exit Code 1
                          </span>
                          <span className="px-2.5 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-500/40 font-mono">
                            {runAllErrors.length} {runAllErrors.length === 1 ? 'Error Extracted' : 'Errors Extracted'}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-white/10 text-slate-300 text-[10px] font-mono">
                            Step: {selectedRun.failedStepName || 'Build & Test'}
                          </span>
                        </h4>
                        <p className="text-xs text-rose-200 mt-1 font-semibold">
                          {selectedRun.failureReason ||
                            `Step "${selectedRun.failedStepName || 'Automated Test Matrix'}" failed during workflow execution.`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap self-start">
                      <button
                        onClick={() => handleFetchAiBuildDiagnosis(selectedRun)}
                        disabled={loadingAiMap[selectedRun.id]}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl glass-badge-rose hover:bg-rose-500/30 text-xs font-bold transition-all disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 text-rose-300 ${loadingAiMap[selectedRun.id] ? 'animate-spin' : ''}`} />
                        <span>
                          {loadingAiMap[selectedRun.id]
                            ? 'Diagnosing with Gemini AI...'
                            : aiDiagnosisMap[selectedRun.id]
                            ? 'Re-Diagnose All Errors'
                            : 'Diagnose with Gemini AI'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleAutoFixRun(selectedRun)}
                        disabled={remediatingRunId === selectedRun.id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-500/25 border border-emerald-400/30 transition-all disabled:opacity-50 hover:scale-[1.02] active:scale-[0.98]"
                      >
                        {remediatingRunId === selectedRun.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5" />
                        )}
                        <span>1-Click Auto-Fix & Re-run</span>
                      </button>

                      {onNavigateToGoIngestion && (
                        <button
                          onClick={onNavigateToGoIngestion}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 hover:bg-indigo-900/90 text-indigo-300 border border-indigo-500/40 backdrop-blur-md text-xs font-bold transition-all"
                          title="Open Go Log Ingestion Stream Engine"
                        >
                          <Radio className="w-3.5 h-3.5 text-indigo-400" />
                          <span>Go Log Ingestor</span>
                        </button>
                      )}

                      {onNavigateToFailures && (
                        <button
                          onClick={onNavigateToFailures}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-300 border border-white/10 backdrop-blur-md text-xs transition-colors"
                          title="Open full Failure History Studio"
                        >
                          <History className="w-3.5 h-3.5 text-cyan-400" />
                          <span>History</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {remediationMsg && (
                    <div className="p-3 bg-emerald-500/15 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                      <span>{remediationMsg}</span>
                    </div>
                  )}

                  {/* 1. ALL EXTRACTED ERRORS MATRIX (Multi-Error Breakdown) */}
                  <div className="p-4 rounded-xl bg-slate-950/90 border border-rose-500/30 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                      <div className="flex items-center gap-2 text-xs font-bold text-rose-300">
                        <Bug className="w-4 h-4 text-rose-400" />
                        <span>All Extracted Pipeline Errors ({runAllErrors.length} Total Detected)</span>
                      </div>

                      {/* Search in Errors */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={errorSearchTerm}
                          onChange={(e) => setErrorSearchTerm(e.target.value)}
                          placeholder="Filter extracted errors..."
                          className="pl-8 pr-3 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-rose-500 w-48 sm:w-56"
                        />
                      </div>
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        onClick={() => setSelectedErrorCategory('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                          selectedErrorCategory === 'all'
                            ? 'bg-rose-600 text-white shadow-sm'
                            : 'bg-slate-900 hover:bg-slate-800 text-slate-400 border border-slate-800'
                        }`}
                      >
                        All ({categoryCounts.all || 0})
                      </button>

                      {categoryCounts.COMPILER && (
                        <button
                          onClick={() => setSelectedErrorCategory('COMPILER')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedErrorCategory === 'COMPILER'
                              ? 'bg-rose-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          Compiler ({categoryCounts.COMPILER})
                        </button>
                      )}

                      {categoryCounts.TEST_ASSERTION && (
                        <button
                          onClick={() => setSelectedErrorCategory('TEST_ASSERTION')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedErrorCategory === 'TEST_ASSERTION'
                              ? 'bg-amber-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          Test Assertions ({categoryCounts.TEST_ASSERTION})
                        </button>
                      )}

                      {categoryCounts.LINTER && (
                        <button
                          onClick={() => setSelectedErrorCategory('LINTER')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedErrorCategory === 'LINTER'
                              ? 'bg-blue-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-blue-300 border border-blue-500/30'
                          }`}
                        >
                          Linter ({categoryCounts.LINTER})
                        </button>
                      )}

                      {categoryCounts.DEPENDENCY && (
                        <button
                          onClick={() => setSelectedErrorCategory('DEPENDENCY')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedErrorCategory === 'DEPENDENCY'
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-500/30'
                          }`}
                        >
                          Dependency ({categoryCounts.DEPENDENCY})
                        </button>
                      )}

                      {categoryCounts.SECURITY && (
                        <button
                          onClick={() => setSelectedErrorCategory('SECURITY')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedErrorCategory === 'SECURITY'
                              ? 'bg-red-700 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-red-300 border border-red-500/30'
                          }`}
                        >
                          Security ({categoryCounts.SECURITY})
                        </button>
                      )}

                      {categoryCounts.RUNTIME_PANIC && (
                        <button
                          onClick={() => setSelectedErrorCategory('RUNTIME_PANIC')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedErrorCategory === 'RUNTIME_PANIC'
                              ? 'bg-orange-600 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-orange-300 border border-orange-500/30'
                          }`}
                        >
                          Runtime Panics ({categoryCounts.RUNTIME_PANIC})
                        </button>
                      )}

                      {categoryCounts.EXIT_CODE && (
                        <button
                          onClick={() => setSelectedErrorCategory('EXIT_CODE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            selectedErrorCategory === 'EXIT_CODE'
                              ? 'bg-slate-700 text-white shadow-sm'
                              : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                          }`}
                        >
                          Exit Code ({categoryCounts.EXIT_CODE})
                        </button>
                      )}
                    </div>

                    {/* Extracted Error Items */}
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {filteredErrors.length > 0 ? (
                        filteredErrors.map((err, idx) => {
                          const isTargeted = selectedTargetedErrorId === err.id;
                          const isLoadingThis = loadingAiMap[`${selectedRun.id}-${err.id}`];

                          return (
                            <div
                              key={err.id ? `${err.id}-${idx}` : `err-idx-${idx}`}
                              className={`p-3 rounded-lg border space-y-2 text-xs transition-all ${
                                isTargeted
                                  ? 'bg-slate-900 border-cyan-500/80 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/40'
                                  : 'bg-slate-900/90 border-slate-800/90 hover:border-slate-700'
                              }`}
                            >
                              <div className="flex items-center justify-between flex-wrap gap-2">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
                                      err.category === 'COMPILER'
                                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                        : err.category === 'TEST_ASSERTION'
                                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                        : err.category === 'LINTER'
                                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                        : err.category === 'SECURITY'
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                                        : err.category === 'RUNTIME_PANIC'
                                        ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                                        : err.category === 'DEPENDENCY'
                                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                                    }`}
                                  >
                                    [{err.category}]
                                  </span>
                                  <span className="text-slate-400 font-mono text-[11px]">
                                    Step: <strong className="text-slate-200">{err.stepName}</strong>
                                  </span>
                                  {isTargeted && (
                                    <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold flex items-center gap-1">
                                      <Sparkles className="w-2.5 h-2.5 text-cyan-400" />
                                      AI Target
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  {err.fileLocation && (
                                    <span className="font-mono text-[11px] text-cyan-300 bg-slate-950 px-2 py-0.5 rounded border border-cyan-500/30 flex items-center gap-1">
                                      <FileCode className="w-3.5 h-3.5 text-cyan-400" />
                                      <span className="font-semibold">{err.fileLocation}</span>
                                      {err.lineNumber ? <span className="text-cyan-400">:{err.lineNumber}{err.columnNumber ? `:${err.columnNumber}` : ''}</span> : ''}
                                    </span>
                                  )}
                                  
                                  {/* AI Targeted Analyze Button */}
                                  <button
                                    onClick={() => handleFetchAiBuildDiagnosis(selectedRun, err)}
                                    disabled={loadingAiMap[selectedRun.id] || isLoadingThis}
                                    className={`px-2.5 py-1 rounded text-[11px] font-medium flex items-center gap-1.5 transition-all shadow-sm ${
                                      isTargeted
                                        ? 'bg-cyan-600 hover:bg-cyan-500 text-white font-bold'
                                        : 'bg-gradient-to-r from-cyan-900/60 to-blue-900/60 hover:from-cyan-700 hover:to-blue-700 text-cyan-200 border border-cyan-500/40'
                                    }`}
                                    title="Analyze this specific error using AI"
                                  >
                                    {isLoadingThis ? (
                                      <>
                                        <RefreshCw className="w-3 h-3 animate-spin text-cyan-200" />
                                        <span>Diagnosing...</span>
                                      </>
                                    ) : (
                                      <>
                                        <Sparkles className="w-3 h-3 text-cyan-300" />
                                        <span>{isTargeted ? 'Re-Analyze with AI' : 'Analyze with AI'}</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => copyToClipboard(err.errorLine, `err-line-${err.id || idx}`)}
                                    className="text-[10px] text-slate-400 hover:text-white px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1"
                                    title="Copy raw error line"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>{copiedCodeId === `err-line-${err.id || idx}` ? 'Copied' : 'Copy'}</span>
                                  </button>
                                </div>
                              </div>

                              {/* Exact Error Signature Line */}
                              <div className="font-mono text-rose-300 font-semibold break-all bg-slate-950 p-2.5 rounded border border-rose-500/20 leading-relaxed">
                                {err.errorLine}
                              </div>

                              {/* Multi-line stack or full message */}
                              {err.fullMessage && err.fullMessage !== err.errorLine && (
                                <div className="text-[11px] font-mono text-slate-400 pl-2.5 border-l-2 border-slate-700 whitespace-pre-wrap mt-1">
                                  {err.fullMessage}
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-4 rounded-lg bg-slate-900/60 text-center text-xs text-slate-400 italic">
                          No errors matched the current filter.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Targeted Error Active Notice */}
                  {selectedTargetedErrorId && (
                    <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 text-xs text-cyan-200 flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                        <span>
                          Targeted Diagnosis active for <strong>{runAllErrors.find((e) => e.id === selectedTargetedErrorId)?.category || 'Error'}</strong>:
                          {runAllErrors.find((e) => e.id === selectedTargetedErrorId)?.fileLocation && (
                            <code className="ml-1.5 px-2 py-0.5 bg-slate-900 rounded text-cyan-300 font-mono border border-slate-800">
                              {runAllErrors.find((e) => e.id === selectedTargetedErrorId)?.fileLocation}
                              {runAllErrors.find((e) => e.id === selectedTargetedErrorId)?.lineNumber ? `:${runAllErrors.find((e) => e.id === selectedTargetedErrorId)?.lineNumber}` : ''}
                            </code>
                          )}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedTargetedErrorId(null);
                          handleFetchAiBuildDiagnosis(selectedRun);
                        }}
                        className="text-[11px] text-cyan-400 hover:text-cyan-200 underline font-medium"
                      >
                        Reset to Full Run Analysis
                      </button>
                    </div>
                  )}

                  {/* 2. ROOT CAUSE (WHY IT FAILED) */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-cyan-400 uppercase tracking-wider">
                      <Bot className="w-3.5 h-3.5" />
                      <span>2. Why It Failed (Root Cause Analysis)</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs space-y-1.5 text-slate-300 leading-relaxed">
                      <p className="font-semibold text-slate-100">
                        {aiDiagnosisMap[selectedRun.id]?.rootCause ||
                          `Step "${selectedRun.failedStepName || 'Test Matrix'}" failed due to test assertion mismatch, missing dependency, or build compilation errors.`}
                      </p>
                      {aiDiagnosisMap[selectedRun.id]?.explanation && (
                        <p className="text-slate-400 text-[11px]">
                          {aiDiagnosisMap[selectedRun.id]?.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. STEP-BY-STEP SOLUTION */}
                  {(aiDiagnosisMap[selectedRun.id]?.solutionSteps || [
                    'Inspect the failing test assertion or compilation error line highlighted above.',
                    'Update business logic or missing package dependencies in repository source.',
                    'Run test suite locally before pushing new commit to remote branch.',
                  ]).length > 0 && (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>3. Step-by-Step Solution & Action Plan</span>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-950/80 border border-slate-800 space-y-1.5">
                        {(aiDiagnosisMap[selectedRun.id]?.solutionSteps || [
                          `Inspect the runner console log trace for step "${selectedRun.failedStepName || 'Build Step'}".`,
                          'Apply the proposed patch or configuration change below.',
                          'Re-trigger workflow via the 1-Click Auto-Fix button above.',
                        ]).map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. CODE DIFF PATCH */}
                  {aiDiagnosisMap[selectedRun.id]?.codeDiff && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-indigo-400 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-3.5 h-3.5" />
                          <span>4. Unified Code Fix Patch</span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              aiDiagnosisMap[selectedRun.id]!.codeDiff!,
                              `diff-${selectedRun.id}`
                            )
                          }
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCodeId === `diff-${selectedRun.id}` ? 'Copied' : 'Copy Diff'}</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto max-h-40">
                        {aiDiagnosisMap[selectedRun.id]!.codeDiff}
                      </pre>
                    </div>
                  )}

                  {/* 5. CLI FIX COMMANDS */}
                  {aiDiagnosisMap[selectedRun.id]?.fixCommands && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-3.5 h-3.5" />
                          <span>5. Terminal Fix Commands</span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              aiDiagnosisMap[selectedRun.id]!.fixCommands!.join('\n'),
                              `cmds-${selectedRun.id}`
                            )
                          }
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white"
                        >
                          <Copy className="w-3 h-3" />
                          <span>{copiedCodeId === `cmds-${selectedRun.id}` ? 'Copied' : 'Copy All'}</span>
                        </button>
                      </div>
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-xs text-amber-300 space-y-1">
                        {aiDiagnosisMap[selectedRun.id]!.fixCommands!.map((cmd, cIdx) => (
                          <div key={cIdx} className="text-slate-300">
                            <span className="text-amber-500 mr-2">$</span>
                            {cmd}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE RUNNING ANIMATION BADGE (Visible when in_progress) */}
              {(selectedRun.status === 'in_progress' || selectedRun.status === 'queued') && (
                <div className="mt-5 p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 space-y-2 animate-pulse">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-cyan-300 text-xs font-bold">
                      <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
                      <span>Pipeline Executing in Real-Time (Live Telemetry Streaming)</span>
                    </div>
                    <span className="text-xs font-mono text-cyan-400">{selectedRun.durationSec}s elapsed</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full w-2/3 animate-pulse rounded-full" />
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Executing CI/CD steps on GitHub runner. Click <strong>Sync with GitHub</strong> or wait for auto-sync to see completion.
                  </p>
                </div>
              )}

              {/* SUCCESSFUL RUN VERIFICATION BADGE */}
              {selectedRun.conclusion === 'success' && selectedRun.status !== 'in_progress' && (
                <div className="mt-5 p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs text-emerald-300">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Build & Security Passed: 100% test matrix green, artifact verified cleanly.</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    Target: {selectedRun.targetService || repo?.name || 'app'}
                  </span>
                </div>
              )}

              {/* Visual Pipeline Stages */}
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Deployment Pipeline Stages & Telemetry
                  </div>
                  <span className="text-[11px] text-slate-500">Click any step to inspect stdout/stderr logs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {selectedRun.stages.length > 0 ? (
                    selectedRun.stages.map((stage, idx) => {
                      const isComplete = stage.status === 'success';
                      const isRunning = stage.status === 'running';
                      const isFailed = stage.status === 'failed';

                      return (
                        <div
                          key={stage.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isFailed
                              ? 'bg-rose-950/20 border-rose-500/50 shadow-sm shadow-rose-500/10'
                              : isRunning
                              ? 'bg-cyan-950/30 border-cyan-500/50 shadow-sm shadow-cyan-500/10'
                              : isComplete
                              ? 'bg-slate-800/50 border-slate-700/80'
                              : 'bg-slate-800/20 border-slate-800/60 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                  isComplete
                                    ? 'bg-emerald-500 text-slate-950'
                                    : isFailed
                                    ? 'bg-rose-500 text-white'
                                    : isRunning
                                    ? 'bg-cyan-500 text-slate-950 animate-pulse'
                                    : 'bg-slate-700 text-slate-400'
                                }`}
                              >
                                {isComplete ? (
                                  <CheckCircle className="w-3.5 h-3.5" />
                                ) : isFailed ? (
                                  <XCircle className="w-3.5 h-3.5" />
                                ) : (
                                  idx + 1
                                )}
                              </div>
                              <span className="text-xs font-bold text-white truncate max-w-[170px]">
                                {stage.name}
                              </span>
                            </div>
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                isComplete
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : isFailed
                                  ? 'bg-rose-500/10 text-rose-300 border border-rose-500/40'
                                  : isRunning
                                  ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/40 animate-pulse'
                                  : 'bg-slate-800 text-slate-500'
                              }`}
                            >
                              {stage.status}
                            </span>
                          </div>

                          {/* Steps */}
                          <div className="space-y-2">
                            {stage.steps.map((step) => (
                              <div
                                key={step.id}
                                onClick={() => {
                                  setSelectedStep(step);
                                  setSelectedStepLogs({
                                    stepName: step.name,
                                    logs: step.logs,
                                  });
                                }}
                                className={`p-2.5 rounded-lg border flex items-center justify-between text-xs cursor-pointer transition-colors ${
                                  selectedStep?.id === step.id
                                    ? 'bg-indigo-900/40 border-indigo-400 ring-1 ring-indigo-400/50 text-white font-semibold'
                                    : step.status === 'failed'
                                    ? 'bg-rose-900/20 border-rose-500/40 text-rose-200 hover:border-rose-400'
                                    : step.status === 'running'
                                    ? 'bg-cyan-900/20 border-cyan-500/30 text-cyan-200'
                                    : 'bg-slate-900/70 border-slate-800 text-slate-300 hover:border-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {step.status === 'success' && (
                                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                                  )}
                                  {step.status === 'failed' && (
                                    <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
                                  )}
                                  {step.status === 'running' && (
                                    <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin flex-shrink-0" />
                                  )}
                                  {step.status === 'pending' && (
                                    <Clock className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                                  )}
                                  {step.status === 'skipped' && (
                                    <span className="w-3.5 h-3.5 text-slate-500 flex-shrink-0 font-mono text-[10px]">[-]</span>
                                  )}
                                  <span className="truncate max-w-[140px]">{step.name}</span>
                                </div>
                                <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 flex-shrink-0">
                                  <span>{step.durationSec}s</span>
                                  {step.logs.length > 0 && (
                                    <Terminal className="w-3 h-3 text-cyan-400 ml-1" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="col-span-2 p-6 rounded-xl bg-slate-800/40 border border-slate-800 text-center text-slate-400 text-xs">
                      No distinct pipeline stages returned. Run finished with status: {selectedRun.status}.
                    </div>
                  )}
                </div>
              </div>

              {/* GitHub Actions Runner Console & Telemetry Terminal (ALWAYS VISIBLE for all runs) */}
              <div className="mt-6">
                <PipelineRunnerConsole
                  selectedRun={selectedRun}
                  selectedStep={selectedStep}
                  onClearSelectedStep={() => {
                    setSelectedStep(null);
                    setSelectedStepLogs(null);
                  }}
                  onFetchAiDiagnosis={handleFetchAiBuildDiagnosis}
                  onSyncLiveLogs={handleSyncLiveLogs}
                  isSyncingLiveLogs={isSyncingLiveLogs}
                />
              </div>
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-10 shadow-md text-center space-y-4">
              <Github className="w-12 h-12 text-slate-600 mx-auto" />
              <div>
                <h3 className="text-base font-bold text-white">No Pipeline Runs Found</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Connect your GitHub repository or click "Trigger Pipeline" to dispatch a live build execution workflow.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setShowConnectModal(true)}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold"
                >
                  Connect GitHub Repo
                </button>
                <button
                  onClick={() => handleDispatch(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold"
                >
                  Trigger Sample Pipeline
                </button>
              </div>
            </div>
          )}

          {/* Duration Anomaly Detection Banner */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-3.5">
            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 mt-0.5">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                CI/CD Build Duration Anomaly Detector (Holt-Winters ML Filter)
              </h4>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Telemetry parses execution timings against a rolling baseline Gaussian window. Runs with high duration variance are flagged automatically to prevent slow test suites from blocking deployment trains.
              </p>
            </div>
          </div>
        </div>

        {/* Right Col: Recent Runs & GitHub Commit Lineage */}
        <div className="space-y-6">
          {/* Recent Workflow Runs with Filter */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" /> Pipeline Runs
              </h3>
              <span className="text-[11px] text-slate-500">{filteredRuns.length} runs</span>
            </div>

            {/* Run Filters */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px]">
              <button
                onClick={() => setRunFilter('all')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  runFilter === 'all' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setRunFilter('failed')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  runFilter === 'failed' ? 'bg-rose-500/20 text-rose-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Failed
              </button>
              <button
                onClick={() => setRunFilter('in_progress')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  runFilter === 'in_progress' ? 'bg-cyan-500/20 text-cyan-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Running
              </button>
              <button
                onClick={() => setRunFilter('completed')}
                className={`flex-1 py-1 rounded font-medium transition-all ${
                  runFilter === 'completed' ? 'bg-emerald-500/20 text-emerald-300 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Success
              </button>
            </div>

            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredRuns.length > 0 ? (
                filteredRuns.map((run) => {
                  const isSelected = run.id === selectedRunId;
                  const isFailed = run.status === 'failed' || run.conclusion === 'failure';
                  const isRunning = run.status === 'in_progress' || run.status === 'queued';
                  return (
                    <div
                      key={run.id}
                      onClick={() => setSelectedRunId(run.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? isFailed
                            ? 'bg-slate-800 border-rose-500/60 shadow-sm shadow-rose-500/10'
                            : 'bg-slate-800 border-cyan-500/60 shadow-sm shadow-cyan-500/10'
                          : 'bg-slate-800/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-1">
                          {run.id}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isRunning
                              ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                              : isFailed
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-emerald-500/20 text-emerald-300'
                          }`}
                        >
                          {isRunning ? '⚡ Running' : isFailed ? '✗ Failed' : '✓ Success'}
                        </span>
                      </div>

                      <div className="text-xs text-white font-medium mt-1 truncate">
                        {run.commitMessage}
                      </div>

                      <div className="flex items-center justify-between mt-2 text-[11px] text-slate-400">
                        <span className="font-mono text-slate-300 truncate max-w-[140px]">{run.targetService}</span>
                        <span className="font-mono">{run.durationSec}s</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No workflow runs match filter.
                </div>
              )}
            </div>
          </div>

          {/* GitHub Commit Stream */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <GitCommit className="w-4 h-4 text-cyan-400" /> Git Commit Lineage
              </h3>
              <span className="text-[11px] text-cyan-400 font-mono">Branch: {repo?.branch || 'main'}</span>
            </div>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {commits.length > 0 ? (
                commits.map((c) => (
                  <div
                    key={c.sha}
                    className="p-3 rounded-lg bg-slate-800/40 border border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-cyan-400 flex items-center gap-1">
                        {c.shortSha}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {c.timestamp.substring(11, 16)} UTC
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 line-clamp-2">{c.message}</p>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span className="text-slate-300 font-mono">{c.author}</span>
                      {c.linkedDeployment && (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                          {c.linkedDeployment}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  No recent commits loaded.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
