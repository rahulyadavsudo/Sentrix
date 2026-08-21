import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertOctagon,
  AlertTriangle,
  ArrowRight,
  Bot,
  Bug,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  Flame,
  GitBranch,
  GitCommit,
  Github,
  Layers,
  Lightbulb,
  Play,
  Plus,
  RefreshCw,
  Search,
  Server,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  BuildFailureAiDiagnosis,
  FailedBuildRecord,
  FailedDeploymentRecord,
  GitHubRepo,
  WorkflowRun,
} from '../types';

interface FailureHistoryStudioProps {
  repo: GitHubRepo | null;
  workflowRuns: WorkflowRun[];
  onTriggerPipeline?: () => void;
  onWorkflowRunCreated?: (run: WorkflowRun) => void;
  onNavigateToPipeline?: (runId?: string) => void;
}

export const FailureHistoryStudio: React.FC<FailureHistoryStudioProps> = ({
  repo,
  workflowRuns,
  onTriggerPipeline,
  onWorkflowRunCreated,
  onNavigateToPipeline,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'builds' | 'deployments' | 'analyzer'>('builds');
  
  // Data state
  const [failedBuilds, setFailedBuilds] = useState<FailedBuildRecord[]>([]);
  const [failedDeployments, setFailedDeployments] = useState<FailedDeploymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null);
  const [selectedDeploymentId, setSelectedDeploymentId] = useState<string | null>(null);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // AI Diagnostic Loading State
  const [analyzingBuildId, setAnalyzingBuildId] = useState<string | null>(null);
  const [reRunningBuildId, setReRunningBuildId] = useState<string | null>(null);
  const [remediationMsg, setRemediationMsg] = useState<{ id: string; text: string; newRunId?: string } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Interactive Custom Log Analyzer State
  const [customRepo, setCustomRepo] = useState(repo ? `${repo.owner}/${repo.name}` : 'acme-enterprise/payment-service');
  const [customBranch, setCustomBranch] = useState(repo?.branch || 'main');
  const [customStep, setCustomStep] = useState('Integration & Unit Test Suite');
  const [customLogs, setCustomLogs] = useState(
    `FAIL tests/reconciliation_spec.rs:142:9\nAssertion failed: \`expected_balance >= 0\`\nLeft: -42.50\nRight: 0.00\nStack trace: test_transfer_reconciliation() at src/services/ledger.rs:88\nError: Command failed with exit code 1 (SIGABRT).`
  );
  const [customDiagnosis, setCustomDiagnosis] = useState<BuildFailureAiDiagnosis | null>(null);
  const [isAnalyzingCustom, setIsAnalyzingCustom] = useState(false);

  // Fetch failure history from backend
  const fetchFailureHistory = async () => {
    setIsLoading(true);
    try {
      const [buildsRes, depRes] = await Promise.all([
        fetch('/api/history/failed-builds'),
        fetch('/api/history/failed-deployments'),
      ]);

      if (buildsRes.ok) {
        const data = await buildsRes.json();
        setFailedBuilds(data.failedBuilds || []);
        if (data.failedBuilds?.length > 0 && !selectedBuildId) {
          setSelectedBuildId(data.failedBuilds[0].id);
        }
      }

      if (depRes.ok) {
        const data = await depRes.json();
        setFailedDeployments(data.failedDeployments || []);
        if (data.failedDeployments?.length > 0 && !selectedDeploymentId) {
          setSelectedDeploymentId(data.failedDeployments[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching failure history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFailureHistory();
  }, []);

  // AI Re-analysis trigger
  const handleAnalyzeBuild = async (buildId: string) => {
    setAnalyzingBuildId(buildId);
    try {
      const res = await fetch(`/api/history/failed-builds/${buildId}/analyze`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setFailedBuilds((prev) =>
          prev.map((b) => (b.id === buildId ? data.record : b))
        );
      }
    } catch (err) {
      console.error('Failed to trigger AI diagnosis:', err);
    } finally {
      setAnalyzingBuildId(null);
    }
  };

  // 1-Click Auto-Fix & Re-run
  const handleAutoFixAndReRun = async (buildId: string) => {
    setReRunningBuildId(buildId);
    try {
      const res = await fetch(`/api/history/failed-builds/${buildId}/re-run`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setFailedBuilds((prev) =>
          prev.map((b) => (b.id === buildId ? { ...b, status: 'remediated' } : b))
        );
        if (data.newRun && onWorkflowRunCreated) {
          onWorkflowRunCreated(data.newRun);
        }
        setRemediationMsg({
          id: buildId,
          text: data.message || 'Remediation patch applied. Green workflow dispatched!',
          newRunId: data.newRun?.id,
        });
        setTimeout(() => setRemediationMsg(null), 8000);
      }
    } catch (err) {
      console.error('Auto-fix and re-run error:', err);
    } finally {
      setReRunningBuildId(null);
    }
  };

  // Delete a specific failed build
  const handleDeleteBuild = async (buildId: string) => {
    try {
      await fetch(`/api/history/failed-builds/${buildId}`, { method: 'DELETE' });
      setFailedBuilds((prev) => prev.filter((b) => b.id !== buildId));
      if (selectedBuildId === buildId) {
        const remaining = failedBuilds.filter((b) => b.id !== buildId);
        setSelectedBuildId(remaining[0]?.id || null);
      }
    } catch (err) {
      console.error('Delete failed build error:', err);
    }
  };

  // Clear all build failures
  const handleClearAllBuilds = async () => {
    if (!window.confirm('Are you sure you want to clear all build failure records?')) return;
    try {
      await fetch('/api/history/failed-builds', { method: 'DELETE' });
      setFailedBuilds([]);
      setSelectedBuildId(null);
    } catch (err) {
      console.error('Clear build history error:', err);
    }
  };

  // Remediate Deployment
  const handleRemediateDeployment = async (depId: string) => {
    try {
      const res = await fetch(`/api/history/failed-deployments/${depId}/remediate`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setFailedDeployments((prev) =>
          prev.map((d) => (d.id === depId ? data.record : d))
        );
      }
    } catch (err) {
      console.error('Failed to remediate deployment:', err);
    }
  };

  // Custom on-the-fly diagnosis submit
  const handleAnalyzeCustomLogs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customLogs.trim()) return;
    setIsAnalyzingCustom(true);
    setCustomDiagnosis(null);

    try {
      const res = await fetch('/api/ai/diagnose-build-failure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repo: customRepo,
          branch: customBranch,
          commitSha: 'HEAD',
          failedStepName: customStep,
          errorLogs: customLogs.split('\n'),
          commitMessage: 'User provided stack trace',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setCustomDiagnosis(data.diagnosis);
      }
    } catch (err) {
      console.error('Custom log analysis error:', err);
    } finally {
      setIsAnalyzingCustom(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  // Filtered Builds
  const filteredBuilds = failedBuilds.filter((b) => {
    const matchesSearch =
      b.repo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.branch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.failedStepName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.commitSha.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.aiDiagnosis?.errorTitle || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === 'all' || b.errorCategory.toLowerCase() === categoryFilter.toLowerCase();

    const matchesStatus =
      statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedBuild =
    failedBuilds.find((b) => b.id === selectedBuildId) || failedBuilds[0] || null;

  const selectedDeployment =
    failedDeployments.find((d) => d.id === selectedDeploymentId) || failedDeployments[0] || null;

  return (
    <div className="space-y-6">
      {/* Top Banner & Stats */}
      <div className="glass-panel rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-rose-500/30 text-rose-400 shadow-lg shadow-rose-500/10 backdrop-blur-md">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-lg font-extrabold text-white tracking-tight flex items-center gap-2">
                  Failure History & AI Root Cause Diagnostics Studio
                </h2>
                <span className="px-2.5 py-0.5 rounded-full glass-badge-rose text-xs font-bold flex items-center gap-1">
                  <Flame className="w-3 h-3 text-rose-400" />
                  {failedBuilds.length} Failed Build{failedBuilds.length === 1 ? '' : 's'} Stored
                </span>
                <span className="px-2.5 py-0.5 rounded-full glass-badge-purple text-xs font-bold flex items-center gap-1">
                  <Server className="w-3 h-3 text-purple-400" />
                  {failedDeployments.length} K8s Deployment Incident{failedDeployments.length === 1 ? '' : 's'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                Persistent historical registry of CI/CD pipeline build failures and Kubernetes deployment incidents.
                Powered by Gemini AI Root Cause Analysis with exact error extraction, step-by-step remediation plans, unified code diffs, and 1-click auto-patch rollouts.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={fetchFailureHistory}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900/60 hover:bg-slate-800/80 text-slate-200 text-xs font-semibold border border-white/10 backdrop-blur-md transition-all shadow-sm disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh History</span>
            </button>

            {failedBuilds.length > 0 && activeSubTab === 'builds' && (
              <button
                onClick={handleClearAllBuilds}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl glass-badge-rose hover:bg-rose-500/25 text-xs font-semibold transition-all shadow-sm"
                title="Clear all stored failed build records"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear History</span>
              </button>
            )}
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-white/10 flex-wrap">
          <button
            onClick={() => setActiveSubTab('builds')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'builds'
                ? 'glass-badge-cyan shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <GitBranch className="w-4 h-4 text-cyan-400" />
            <span>Repo Failed Builds History ({failedBuilds.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('deployments')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'deployments'
                ? 'glass-badge-purple shadow-md shadow-purple-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Server className="w-4 h-4 text-purple-400" />
            <span>K8s Failed Deployments ({failedDeployments.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('analyzer')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'analyzer'
                ? 'glass-badge-amber shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Interactive Custom Log AI Analyzer</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: REPO FAILED BUILDS */}
      {activeSubTab === 'builds' && (
        <div className="space-y-6">
          {/* Search & Filter Bar */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative w-full">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by repo, branch, commit SHA, or error title..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Categories</option>
                  <option value="TestAssertion">Test Assertions</option>
                  <option value="SyntaxError">Syntax / Typings</option>
                  <option value="DockerBuild">Docker / Packaging</option>
                  <option value="Timeout">Timeouts</option>
                  <option value="Unknown">Other</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                >
                  <option value="all">All Status</option>
                  <option value="analyzed">AI Analyzed</option>
                  <option value="remediated">Remediated</option>
                  <option value="recorded">Recorded</option>
                </select>
              </div>
            </div>
          </div>

          {/* Master-Detail Split Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Col (5 cols): List of Failed Builds */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400 px-1 font-semibold uppercase tracking-wider">
                <span>Stored Failure Records ({filteredBuilds.length})</span>
                <span>Exit Codes & Details</span>
              </div>

              {filteredBuilds.length === 0 ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center space-y-3">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <h4 className="text-sm font-bold text-white">No Matching Build Failures</h4>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    All CI/CD runs are healthy or no failures match your filter criteria.
                  </p>
                </div>
              ) : (
                filteredBuilds.map((build) => {
                  const isSelected = selectedBuild?.id === build.id;
                  return (
                    <div
                      key={build.id}
                      onClick={() => setSelectedBuildId(build.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 relative ${
                        isSelected
                          ? 'bg-slate-800/90 border-cyan-500 shadow-md shadow-cyan-500/10'
                          : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-rose-500 flex-shrink-0" />
                          <span className="text-xs font-mono font-bold text-rose-300">
                            {build.id}
                          </span>
                          <span className="text-xs text-slate-500">&bull;</span>
                          <span className="text-xs font-mono text-cyan-400">
                            {build.commitSha.substring(0, 7)}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              build.status === 'remediated'
                                ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {build.status === 'remediated' ? 'Remediated' : `Exit ${build.exitCode}`}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteBuild(build.id);
                            }}
                            className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                            title="Delete this record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-slate-100 mt-2 line-clamp-1">
                        {build.aiDiagnosis?.errorTitle || build.failedStepName}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                        {build.aiDiagnosis?.rootCause || build.commitMessage}
                      </p>

                      <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800 text-[10px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-300 font-mono flex items-center gap-1">
                            <GitBranch className="w-3 h-3 text-cyan-400" />
                            {build.branch}
                          </span>
                          <span>&bull;</span>
                          <span>{build.author}</span>
                        </div>
                        <span className="text-slate-500">
                          {new Date(build.failedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Right Col (7 cols): Deep AI Diagnostic & Root Cause Breakdown */}
            <div className="lg:col-span-7">
              {selectedBuild ? (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg space-y-6">
                  {/* Header info */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-mono font-bold">
                          {selectedBuild.id}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-xs font-mono">
                          {selectedBuild.errorCategory}
                        </span>
                        <span className="text-xs text-slate-400">
                          Failed {new Date(selectedBuild.failedAt).toLocaleString()}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-white mt-1.5">
                        {selectedBuild.aiDiagnosis?.errorTitle || `Failed Step: ${selectedBuild.failedStepName}`}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Repo: <span className="text-slate-200 font-mono">{selectedBuild.repo}</span> &bull; Branch: <span className="text-cyan-400 font-mono">{selectedBuild.branch}</span> &bull; Commit: <span className="text-cyan-300 font-mono">{selectedBuild.commitSha}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAnalyzeBuild(selectedBuild.id)}
                        disabled={analyzingBuildId === selectedBuild.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/40 text-xs font-semibold transition-all disabled:opacity-50"
                      >
                        <Sparkles className={`w-3.5 h-3.5 ${analyzingBuildId === selectedBuild.id ? 'animate-spin' : ''}`} />
                        <span>{analyzingBuildId === selectedBuild.id ? 'Analyzing...' : 'Re-Diagnose with AI'}</span>
                      </button>

                      <button
                        onClick={() => handleAutoFixAndReRun(selectedBuild.id)}
                        disabled={reRunningBuildId === selectedBuild.id}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all disabled:opacity-50"
                      >
                        {reRunningBuildId === selectedBuild.id ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Wrench className="w-3.5 h-3.5" />
                        )}
                        <span>1-Click Auto-Fix & Re-run</span>
                      </button>
                    </div>
                  </div>

                  {remediationMsg && remediationMsg.id === selectedBuild.id && (
                    <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between gap-3 animate-fadeIn">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <span>{remediationMsg.text}</span>
                      </div>
                      {onNavigateToPipeline && (
                        <button
                          onClick={() => onNavigateToPipeline(remediationMsg.newRunId)}
                          className="px-2.5 py-1 rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-200 border border-emerald-500/40 text-[11px] font-bold flex items-center gap-1.5 transition-colors flex-shrink-0"
                        >
                          <span>View in CI/CD Monitor</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}

                  {/* 1. EXACT ERROR EXTRACTED */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-rose-400 uppercase tracking-wider">
                      <Bug className="w-4 h-4 text-rose-400" />
                      <span>1. Exact Failing Error & Assertion</span>
                    </div>
                    <div className="p-3.5 rounded-lg bg-slate-950 border border-rose-500/30 text-xs font-mono text-rose-200 overflow-x-auto">
                      {selectedBuild.aiDiagnosis?.exactError || selectedBuild.rawLogs[0] || 'Unknown build error'}
                    </div>
                  </div>

                  {/* 2. ROOT CAUSE (WHY IT FAILED) */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-cyan-400 uppercase tracking-wider">
                      <Bot className="w-4 h-4 text-cyan-400" />
                      <span>2. Why It Failed (Underlying Root Cause)</span>
                    </div>
                    <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2 text-xs leading-relaxed text-slate-300">
                      <p className="font-semibold text-slate-100">
                        {selectedBuild.aiDiagnosis?.rootCause}
                      </p>
                      {selectedBuild.aiDiagnosis?.explanation && (
                        <p className="text-slate-400 text-[11px]">
                          {selectedBuild.aiDiagnosis.explanation}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 3. STEP-BY-STEP SOLUTION */}
                  {selectedBuild.aiDiagnosis?.solutionSteps && selectedBuild.aiDiagnosis.solutionSteps.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>3. Step-by-Step Remediation Action Plan</span>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-2">
                        {selectedBuild.aiDiagnosis.solutionSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                            <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="mt-0.5">{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 4. UNIFIED GIT CODE DIFF */}
                  {selectedBuild.aiDiagnosis?.codeDiff && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-indigo-400 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Code2 className="w-4 h-4 text-indigo-400" />
                          <span>4. Proposed Code / Config Patch Diff</span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(selectedBuild.aiDiagnosis!.codeDiff!, `diff-${selectedBuild.id}`)
                          }
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedCodeId === `diff-${selectedBuild.id}` ? 'Copied!' : 'Copy Diff'}</span>
                        </button>
                      </div>
                      <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] overflow-x-auto text-slate-300 leading-relaxed max-h-56">
                        <pre>{selectedBuild.aiDiagnosis.codeDiff}</pre>
                      </div>
                    </div>
                  )}

                  {/* 5. CLI FIX COMMANDS */}
                  {selectedBuild.aiDiagnosis?.fixCommands && selectedBuild.aiDiagnosis.fixCommands.length > 0 && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-amber-400 uppercase tracking-wider">
                        <div className="flex items-center gap-2">
                          <Terminal className="w-4 h-4 text-amber-400" />
                          <span>5. Copyable Terminal Fix Commands</span>
                        </div>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              selectedBuild.aiDiagnosis!.fixCommands!.join('\n'),
                              `cmd-${selectedBuild.id}`
                            )
                          }
                          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                          <span>{copiedCodeId === `cmd-${selectedBuild.id}` ? 'Copied All!' : 'Copy Commands'}</span>
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 font-mono text-xs text-amber-300">
                        {selectedBuild.aiDiagnosis.fixCommands.map((cmd, cIdx) => (
                          <div key={cIdx} className="flex items-center justify-between group">
                            <span className="text-slate-300">
                              <span className="text-amber-500 select-none mr-2">$</span>
                              {cmd}
                            </span>
                            <button
                              onClick={() => copyToClipboard(cmd, `cmd-${cIdx}`)}
                              className="opacity-0 group-hover:opacity-100 text-[10px] text-slate-400 hover:text-white px-1.5 py-0.5 rounded bg-slate-800 transition-all"
                            >
                              {copiedCodeId === `cmd-${cIdx}` ? 'Copied' : 'Copy'}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 6. PREVENTIVE ADVICE */}
                  {selectedBuild.aiDiagnosis?.preventiveAdvice && (
                    <div className="p-3.5 rounded-lg bg-blue-950/30 border border-blue-500/30 flex items-start gap-2.5 text-xs text-blue-200">
                      <Lightbulb className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-blue-300">Architectural Prevention: </strong>
                        <span>{selectedBuild.aiDiagnosis.preventiveAdvice}</span>
                      </div>
                    </div>
                  )}

                  {/* RAW RUNNER LOGS (Collapsible) */}
                  <details className="group border border-slate-800 rounded-lg bg-slate-950/60 p-3">
                    <summary className="text-xs font-semibold text-slate-400 cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-slate-500" />
                        Raw GitHub Runner Console Log Output ({selectedBuild.rawLogs.length} lines)
                      </span>
                      <span className="text-[10px] text-cyan-400 group-open:rotate-180 transition-transform">
                        ▼
                      </span>
                    </summary>
                    <div className="mt-3 pt-3 border-t border-slate-800 text-[11px] font-mono text-slate-300 space-y-1 max-h-48 overflow-y-auto">
                      {selectedBuild.rawLogs.map((line, lIdx) => (
                        <div
                          key={lIdx}
                          className={
                            line.includes('ERROR') || line.includes('FAIL') || line.includes('Assertion')
                              ? 'text-rose-400 font-bold'
                              : line.includes('INFO')
                              ? 'text-slate-400'
                              : 'text-slate-300'
                          }
                        >
                          {line}
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
                  Select a failed build from the list to view full AI diagnosis.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: K8S FAILED DEPLOYMENTS */}
      {activeSubTab === 'deployments' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {failedDeployments.map((dep) => (
              <div
                key={dep.id}
                className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-mono font-bold">
                      {dep.failureType}
                    </span>
                    <h3 className="text-sm font-bold text-white mt-2 flex items-center gap-1.5">
                      <Server className="w-4 h-4 text-cyan-400" />
                      {dep.serviceName}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono">
                      ns: {dep.namespace} &bull; {dep.podName}
                    </p>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                      dep.autoHealed
                        ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                    }`}
                  >
                    {dep.autoHealed ? '✓ AUTO-HEALED' : '⚠️ UNRESOLVED'}
                  </span>
                </div>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
                  <div className="text-slate-400 font-semibold flex items-center gap-1">
                    <Bot className="w-3.5 h-3.5 text-cyan-400" />
                    Root Cause:
                  </div>
                  <p className="text-slate-300 text-[11px] leading-relaxed">
                    {dep.rootCause}
                  </p>
                </div>

                {/* Event Logs */}
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="text-[10px] uppercase text-slate-500 font-bold">Recent K8s Event Log</div>
                  <div className="text-rose-300 text-[10px] line-clamp-2">
                    {dep.eventLogs[0]}
                  </div>
                </div>

                {/* AI Solution & Commands */}
                {dep.aiDiagnosis?.kubectlCommands && (
                  <div className="space-y-1.5">
                    <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
                      <span>Remediation Command:</span>
                      <button
                        onClick={() =>
                          copyToClipboard(dep.aiDiagnosis!.kubectlCommands!.join('\n'), `k8s-${dep.id}`)
                        }
                        className="text-[10px] text-cyan-400 hover:underline"
                      >
                        {copiedCodeId === `k8s-${dep.id}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-2 rounded bg-slate-950 text-[10px] font-mono text-slate-300 overflow-x-auto">
                      {dep.aiDiagnosis.kubectlCommands[0]}
                    </div>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">
                    {new Date(dep.failedAt).toLocaleString()}
                  </span>

                  {!dep.autoHealed && (
                    <button
                      onClick={() => handleRemediateDeployment(dep.id)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold shadow-sm transition-colors"
                    >
                      1-Click Remediate
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-TAB 3: LIVE LOG & STACK TRACE ANALYZER */}
      {activeSubTab === 'analyzer' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              On-Demand SRE Stack Trace & Build Failure Analyzer
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Paste any GitHub Actions runner log, compiler stack trace, or test assertion output. The Gemini AI engine will parse the raw text, isolate the exact failure, explain the root cause, and generate a unified fix diff.
            </p>
          </div>

          <form onSubmit={handleAnalyzeCustomLogs} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Repository</label>
                <input
                  type="text"
                  value={customRepo}
                  onChange={(e) => setCustomRepo(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="owner/repo"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Branch</label>
                <input
                  type="text"
                  value={customBranch}
                  onChange={(e) => setCustomBranch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  placeholder="main"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Failed Step / Phase</label>
                <input
                  type="text"
                  value={customStep}
                  onChange={(e) => setCustomStep(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  placeholder="Build Step Name"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Paste Error Output / Stack Trace
              </label>
              <textarea
                value={customLogs}
                onChange={(e) => setCustomLogs(e.target.value)}
                rows={6}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500"
                placeholder="Paste failure logs here..."
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="submit"
                disabled={isAnalyzingCustom || !customLogs.trim()}
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                {isAnalyzingCustom ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>{isAnalyzingCustom ? 'Diagnosing with Gemini AI...' : 'Diagnose Build Failure with AI'}</span>
              </button>
            </div>
          </form>

          {/* AI Result Presentation for Custom Logs */}
          {customDiagnosis && (
            <div className="p-5 rounded-xl bg-slate-950 border border-cyan-500/40 space-y-4 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-cyan-400" />
                  <h4 className="text-sm font-bold text-white">
                    {customDiagnosis.errorTitle}
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-xs font-mono">
                  Confidence: {customDiagnosis.confidenceScore}%
                </span>
              </div>

              <div className="p-3 bg-rose-950/30 border border-rose-500/30 rounded-lg text-xs font-mono text-rose-300">
                <strong>Exact Error: </strong> {customDiagnosis.exactError}
              </div>

              <div className="text-xs text-slate-300 space-y-1">
                <strong className="text-cyan-300">Root Cause: </strong>
                <p>{customDiagnosis.rootCause}</p>
                {customDiagnosis.explanation && (
                  <p className="text-slate-400 mt-1">{customDiagnosis.explanation}</p>
                )}
              </div>

              {customDiagnosis.solutionSteps && (
                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-emerald-400 uppercase">Remediation Steps:</div>
                  <div className="space-y-1 text-xs text-slate-300">
                    {customDiagnosis.solutionSteps.map((s, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">{idx + 1}.</span>
                        <span>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customDiagnosis.codeDiff && (
                <div className="space-y-1">
                  <div className="text-xs font-bold text-indigo-400 uppercase">Recommended Code Patch:</div>
                  <pre className="p-3 bg-slate-900 border border-slate-800 rounded text-[11px] font-mono text-slate-300 overflow-x-auto">
                    {customDiagnosis.codeDiff}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
