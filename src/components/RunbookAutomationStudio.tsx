import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Copy,
  Layers,
  Play,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { AutomatedRunbook, RunbookStep } from '../types';

interface RunbookAutomationStudioProps {
  runbooks: AutomatedRunbook[];
  onExecuteRunbook: (id: string) => Promise<void>;
  onRefresh: () => void;
}

export const RunbookAutomationStudio: React.FC<RunbookAutomationStudioProps> = ({
  runbooks,
  onExecuteRunbook,
  onRefresh,
}) => {
  const [selectedRunbookId, setSelectedRunbookId] = useState<string>(runbooks[0]?.id || '');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(-1);
  const [expandedSteps, setExpandedSteps] = useState<{ [stepId: string]: boolean }>({});

  const selectedRunbook = runbooks.find((r) => r.id === selectedRunbookId) || runbooks[0];

  const handleToggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleExecute = async (id: string) => {
    setIsExecuting(true);
    setActiveStepIndex(0);

    // Step through simulation
    for (let i = 0; i < (selectedRunbook?.steps.length || 0); i++) {
      setActiveStepIndex(i);
      await new Promise((res) => setTimeout(res, 600));
    }

    await onExecuteRunbook(id);
    setIsExecuting(false);
    setActiveStepIndex(-1);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <BookOpen className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Autonomous SRE Runbook Automation Studio
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono font-bold">
                  ORCHESTRATOR
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Declarative, self-executing multi-step remediation playbooks for automated OOM clearing, canary circuit breaking, and database failover.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
          <Sparkles className="w-5 h-5 text-purple-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Runbooks</div>
            <div className="text-sm font-bold text-white font-mono">{runbooks.length} Production Workflows</div>
          </div>
        </div>
      </div>

      {/* Main Grid: Runbook List + Execution Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Runbook Selector */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
            Available SRE Playbooks
          </div>

          <div className="space-y-2.5">
            {runbooks.map((rb) => {
              const isSelected = rb.id === selectedRunbookId;
              return (
                <button
                  key={rb.id}
                  onClick={() => {
                    setSelectedRunbookId(rb.id);
                    setExpandedSteps({});
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all ${
                    isSelected
                      ? 'bg-slate-900 border-purple-500/80 ring-2 ring-purple-500/20 shadow-lg shadow-purple-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {rb.category}
                    </span>
                    <span className="text-[11px] font-mono text-slate-500">{rb.estimatedDuration}</span>
                  </div>

                  <h3 className="text-sm font-bold text-white mt-2 leading-snug">{rb.title}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{rb.description}</p>

                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-3 pt-2.5 border-t border-slate-800/80">
                    <span>{rb.steps.length} Steps</span>
                    <span className="text-emerald-400 font-bold">{rb.successRatePercent}% Success</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Runbook Visual Execution Canvas */}
        <div className="md:col-span-2 space-y-4">
          {selectedRunbook && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              {/* Header */}
              <div className="p-5 border-b border-slate-800 bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {selectedRunbook.category}
                    </span>
                    <span className="text-xs font-mono text-slate-400">ID: {selectedRunbook.id}</span>
                  </div>
                  <h2 className="text-base font-bold text-white mt-1.5">{selectedRunbook.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">{selectedRunbook.description}</p>
                </div>

                <button
                  onClick={() => handleExecute(selectedRunbook.id)}
                  disabled={isExecuting}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {isExecuting ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4 fill-white" />
                  )}
                  <span>{isExecuting ? 'Executing Workflow...' : 'Execute Runbook Now'}</span>
                </button>
              </div>

              {/* Trigger Conditions */}
              <div className="p-4 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-slate-500 font-bold uppercase text-[10px]">Auto-Trigger Conditions:</span>
                {selectedRunbook.autoTriggerConditions.map((cond, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]"
                  >
                    ⚡ {cond}
                  </span>
                ))}
              </div>

              {/* Interactive Step Pipeline */}
              <div className="p-5 space-y-3">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Remediation Sequence Pipeline
                </div>

                <div className="space-y-3">
                  {selectedRunbook.steps.map((step, idx) => {
                    const isStepRunning = activeStepIndex === idx;
                    const isStepPast = activeStepIndex > idx || (selectedRunbook.lastRunStatus === 'success' && activeStepIndex === -1);
                    const isExpanded = !!expandedSteps[step.id];

                    let stepIcon = <Clock className="w-4 h-4 text-slate-500" />;
                    let stepBorder = 'border-slate-800 bg-slate-950/50';

                    if (isStepRunning) {
                      stepIcon = <RefreshCw className="w-4 h-4 text-purple-400 animate-spin" />;
                      stepBorder = 'border-purple-500/80 bg-purple-500/10 ring-2 ring-purple-500/20';
                    } else if (isStepPast) {
                      stepIcon = <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
                      stepBorder = 'border-emerald-500/40 bg-slate-950';
                    }

                    return (
                      <div
                        key={step.id}
                        className={`rounded-xl border transition-all ${stepBorder}`}
                      >
                        <div
                          onClick={() => handleToggleStep(step.id)}
                          className="p-3.5 flex items-center justify-between cursor-pointer select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400">
                              {idx + 1}
                            </div>
                            {stepIcon}
                            <div>
                              <div className="text-xs font-bold text-white flex items-center gap-2">
                                <span>{step.title}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                                  {step.type}
                                </span>
                              </div>
                              <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate max-w-md">
                                $ {step.commandOrQuery}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            {step.durationMs && (
                              <span className="text-[11px] font-mono text-slate-500">
                                {step.durationMs}ms
                              </span>
                            )}
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-slate-400" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                        </div>

                        {/* Step Details & Output Logs */}
                        {isExpanded && step.outputLogs && (
                          <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-xs font-mono space-y-1">
                            <div className="text-[10px] text-slate-500 uppercase font-semibold">Execution Output</div>
                            <div className="p-2.5 rounded-lg bg-slate-900 text-emerald-300 text-[11px] space-y-1">
                              {step.outputLogs.map((log, lIdx) => (
                                <div key={lIdx} className="flex items-center gap-1.5">
                                  <span className="text-slate-600">❯</span>
                                  <span>{log}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
