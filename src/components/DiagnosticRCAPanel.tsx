import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertCircle,
  AlertOctagon,
  ArrowRight,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Code2,
  Copy,
  ExternalLink,
  History,
  Layers,
  Play,
  RefreshCw,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { AutoHealingRecord, DiagnosticIssue } from '../types';
import { AnimatedStatusBadge } from './AnimatedStatusComponents';

interface DiagnosticRCAPanelProps {
  issues: DiagnosticIssue[];
  healingHistory: AutoHealingRecord[];
  onAutoHeal: (issueId: string, actionType: string) => void;
  isHealing: boolean;
}

export const DiagnosticRCAPanel: React.FC<DiagnosticRCAPanelProps> = ({
  issues,
  healingHistory,
  onAutoHeal,
  isHealing,
}) => {
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(
    issues.find((i) => i.status === 'active')?.id || issues[0]?.id || null
  );
  const [aiAnalysis, setAiAnalysis] = useState<{ [issueId: string]: string }>({});
  const [loadingAi, setLoadingAi] = useState<{ [issueId: string]: boolean }>({});
  const [copiedDiffId, setCopiedDiffId] = useState<string | null>(null);

  const activeIssues = issues.filter((i) => i.status === 'active');
  const resolvedIssues = issues.filter((i) => i.status === 'resolved');

  const selectedIssue = issues.find((i) => i.id === selectedIssueId);

  const handleFetchAiDiagnosis = async (issue: DiagnosticIssue) => {
    setLoadingAi((prev) => ({ ...prev, [issue.id]: true }));
    try {
      const res = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issueTitle: issue.title,
          podName: issue.podName,
          namespace: issue.namespace,
          rootCause: issue.rootCause,
          technicalDetails: issue.technicalDetails,
        }),
      });
      const data = await res.json();
      setAiAnalysis((prev) => ({
        ...prev,
        [issue.id]: data.analysis || 'Analysis received.',
      }));
    } catch (err) {
      console.error('Failed to query AI diagnosis:', err);
    } finally {
      setLoadingAi((prev) => ({ ...prev, [issue.id]: false }));
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedDiffId(id);
    setTimeout(() => setCopiedDiffId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <AlertOctagon className="w-5 h-5 text-rose-400" />
              Kubernetes Root Cause Diagnostics & 1-Click Auto-Healing
            </h2>
            <span className="px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-300 border border-rose-500/30 text-xs font-bold">
              {activeIssues.length} Active Incident{activeIssues.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Autonomous error correlation: identifies root causes for <code className="text-cyan-300">CrashLoopBackOff</code>, <code className="text-amber-300">OOMKilled</code>, <code className="text-purple-300">ImagePullBackOff</code>, and executes safe 1-click declarative remediation patches.
          </p>
        </div>

        {/* Global Auto-Heal All Button */}
        {activeIssues.length > 0 && (
          <button
            onClick={() => {
              activeIssues.forEach((iss) => onAutoHeal(iss.id, iss.healActionType));
            }}
            disabled={isHealing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            {isHealing ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Zap className="w-4 h-4 fill-current text-yellow-300" />
            )}
            <span>Auto-Resolve All ({activeIssues.length} Issues)</span>
          </button>
        )}
      </div>

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Col: Issues List */}
        <div className="space-y-4">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Active & Detected Incidents</span>
            <span className="text-[11px] text-slate-500">{issues.length} total</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {issues.map((issue) => {
                const isSelected = issue.id === selectedIssueId;
                const isResolved = issue.status === 'resolved';

                return (
                  <motion.div
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                    key={issue.id}
                    onClick={() => setSelectedIssueId(issue.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-slate-850 border-cyan-500 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <AnimatedStatusBadge
                        status={isResolved ? 'resolved' : issue.severity === 'critical' ? 'critical' : 'warning'}
                        label={isResolved ? 'Resolved' : issue.type}
                        size="sm"
                      />

                      <span className="text-[10px] font-mono text-slate-400">
                        {issue.namespace}/{issue.serviceName}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-white mt-2 leading-snug">
                      {issue.title}
                    </h4>

                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                      {issue.rootCause}
                    </p>

                    <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between text-[11px]">
                      <span className="font-mono text-slate-500">
                        {issue.podName.substring(0, 18)}...
                      </span>
                      {issue.autoHealAvailable && !isResolved && (
                        <span className="text-cyan-400 font-semibold flex items-center gap-1">
                          <Zap className="w-3 h-3 fill-current text-cyan-400" /> 1-Click Heal
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </div>

        {/* Right 2 Cols: Comprehensive Root Cause & 1-Click Remediation Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedIssue ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-5">
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-4 border-b border-slate-800 gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold px-2.5 py-0.5 rounded border uppercase ${
                        selectedIssue.status === 'resolved'
                          ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                          : selectedIssue.severity === 'critical'
                          ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/10 text-amber-300 border-amber-500/40'
                      }`}
                    >
                      {selectedIssue.status === 'resolved'
                        ? 'RESOLVED & VERIFIED'
                        : selectedIssue.type}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Namespace: <strong className="text-slate-200">{selectedIssue.namespace}</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1.5">
                    {selectedIssue.title}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-1">
                    Target Pod: <span className="text-cyan-300">{selectedIssue.podName}</span> &bull; Node: <span className="text-slate-300">{selectedIssue.nodeName}</span>
                  </div>
                </div>

                {/* Main 1-Click Auto Heal Action Button */}
                {selectedIssue.status === 'active' ? (
                  <button
                    onClick={() =>
                      onAutoHeal(selectedIssue.id, selectedIssue.healActionType)
                    }
                    disabled={isHealing}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/25 transition-all disabled:opacity-50"
                  >
                    {isHealing ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Zap className="w-4 h-4 fill-current text-yellow-300" />
                    )}
                    <span>Execute 1-Click Auto-Heal</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Auto-Remediation Completed</span>
                  </div>
                )}
              </div>

              {/* 1. Plain-Language Root Cause Explanation */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-cyan-400" />
                  What Happened & Root Cause
                </div>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2">
                  <p>{selectedIssue.rootCause}</p>
                  <div className="pt-2 border-t border-slate-800/80 text-slate-400">
                    <strong className="text-rose-400">Business / SLA Impact:</strong> {selectedIssue.impact}
                  </div>
                </div>
              </div>

              {/* 2. Technical Diagnostic Context (Exit code, Stack Trace, cgroups) */}
              {selectedIssue.technicalDetails && (
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-indigo-400" />
                    Technical Telemetry & Error Evidence
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-2">
                    {selectedIssue.technicalDetails.errorMessage && (
                      <div className="text-rose-400">
                        <span className="text-slate-500">[ERROR]</span> {selectedIssue.technicalDetails.errorMessage}
                      </div>
                    )}
                    {selectedIssue.technicalDetails.exitCode !== undefined && (
                      <div className="text-amber-400">
                        <span className="text-slate-500">[PROCESS]</span> Container exited with code {selectedIssue.technicalDetails.exitCode} ({selectedIssue.technicalDetails.lastStateReason || 'Terminated'})
                      </div>
                    )}
                    {selectedIssue.technicalDetails.stackTraceSnippet && (
                      <div className="p-2.5 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[11px] overflow-x-auto whitespace-pre">
                        {selectedIssue.technicalDetails.stackTraceSnippet}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Recommended Remediation & Action Diff */}
              <div className="space-y-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Code2 className="w-4 h-4 text-emerald-400" />
                  Auto-Healing Action Diff & Remediation Steps
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-3">
                  <div className="text-slate-300 font-medium">
                    {selectedIssue.healActionPayload.description}
                  </div>

                  {selectedIssue.healActionPayload.targetField && (
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] space-y-1">
                      <div className="text-slate-400">Target Manifest: <span className="text-cyan-300">{selectedIssue.healActionPayload.targetField}</span></div>
                      <div className="text-rose-400">- Current: {selectedIssue.healActionPayload.currentValue}</div>
                      <div className="text-emerald-400">+ Patched: {selectedIssue.healActionPayload.recommendedValue}</div>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <div className="text-xs font-semibold text-slate-400">SRE Playbook Steps:</div>
                    {selectedIssue.remediationPlan.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-slate-300 text-xs">
                        <span className="text-cyan-400 font-mono font-bold">&bull;</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 4. AI Deep Diagnosis (Gemini Integration) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-purple-950/20 via-slate-900 to-indigo-950/20 border border-purple-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                    <Bot className="w-4 h-4 text-purple-400" />
                    Gemini AI SRE Diagnostic Assistant
                  </div>
                  <button
                    onClick={() => handleFetchAiDiagnosis(selectedIssue)}
                    disabled={loadingAi[selectedIssue.id]}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {loadingAi[selectedIssue.id] ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Sparkles className="w-3.5 h-3.5" />
                    )}
                    <span>Generate Deep Kernel Diagnosis</span>
                  </button>
                </div>

                {aiAnalysis[selectedIssue.id] ? (
                  <div className="p-3.5 rounded-lg bg-slate-950/80 border border-purple-500/20 text-xs text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                    {aiAnalysis[selectedIssue.id]}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400">
                    Click above to have Gemini inspect the kernel cgroups, memory allocator traces, and generate an architectural prevention plan.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              Select an incident from the list to view root-cause analysis and execute 1-click healing.
            </div>
          )}

          {/* Auto-Healing Audit History */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Auto-Healing Audit Trail & Execution History
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono">
                {healingHistory.length} Healed
              </span>
            </div>

            <div className="space-y-3">
              {healingHistory.map((record) => (
                <div
                  key={record.id}
                  className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">{record.actionName}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {record.durationMs}ms duration &bull; {record.timestamp.substring(11, 19)} UTC
                    </span>
                  </div>

                  <div className="text-slate-300 text-[11px]">
                    {record.diffApplied}
                  </div>

                  {record.logs.length > 0 && (
                    <div className="p-2 rounded bg-slate-900 text-slate-400 font-mono text-[10px] space-y-0.5">
                      {record.logs.map((log, i) => (
                        <div key={i}>{log}</div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
