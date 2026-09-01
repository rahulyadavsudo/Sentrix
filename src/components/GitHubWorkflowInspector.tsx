import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  ChevronRight,
  Code2,
  Copy,
  ExternalLink,
  FileCode2,
  GitBranch,
  Github,
  Loader2,
  Play,
  RefreshCw,
  Shield,
  Sparkles,
  Terminal,
  Zap,
} from 'lucide-react';
import { GitHubWorkflowFile } from '../types';

interface GitHubWorkflowInspectorProps {
  onTriggerRun?: (branch: string, service: string) => void;
}

export const GitHubWorkflowInspector: React.FC<GitHubWorkflowInspectorProps> = ({ onTriggerRun }) => {
  const [workflows, setWorkflows] = useState<GitHubWorkflowFile[]>([]);
  const [selectedWorkflow, setSelectedWorkflow] = useState<GitHubWorkflowFile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  const fetchWorkflows = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/github/workflows');
      if (res.ok) {
        const data = await res.json();
        setWorkflows(data.workflows || []);
        if (data.workflows?.length > 0 && !selectedWorkflow) {
          setSelectedWorkflow(data.workflows[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflows();
  }, []);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0e1118] border border-[#202738] rounded-2xl p-5 shadow-xl space-y-4 text-white">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#202738]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <FileCode2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Repository GitHub Actions Workflows
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-bold">
                .github/workflows/
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Discovered CI/CD pipelines, security scanners, and GitOps automated release specs.
            </p>
          </div>
        </div>

        <button
          onClick={fetchWorkflows}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121622] hover:bg-[#181d2c] text-slate-300 border border-[#202738] text-xs font-semibold transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh Workflows</span>
        </button>
      </div>

      {/* Grid: Workflow List & YAML Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Workflow Cards */}
        <div className="lg:col-span-5 space-y-2 max-h-[440px] overflow-y-auto pr-1">
          {workflows.map((wf) => {
            const isSelected = selectedWorkflow?.id === wf.id;
            return (
              <div
                key={wf.id}
                onClick={() => setSelectedWorkflow(wf)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-purple-950/30 border-purple-500/60 shadow-lg shadow-purple-950/40'
                    : 'bg-[#121622] border-[#202738] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 truncate">
                    <Zap className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {wf.name}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 font-bold">
                    {wf.healthScore}%
                  </span>
                </div>

                <div className="text-[11px] font-mono text-slate-400 mt-1 truncate">
                  {wf.path}
                </div>

                {/* Triggers */}
                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                  {wf.triggers.map((t, idx) => (
                    <span
                      key={idx}
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#090b10] text-slate-300 border border-[#202738]"
                    >
                      on: {t}
                    </span>
                  ))}
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#090b10] text-purple-300 border border-purple-500/30">
                    {wf.jobsCount} Jobs
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Workflow Details & Raw YAML */}
        <div className="lg:col-span-7 bg-[#090b10] border border-[#202738] rounded-xl p-4 space-y-4 max-h-[440px] overflow-y-auto">
          {selectedWorkflow ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#202738]">
                <div>
                  <div className="text-xs font-mono font-bold text-purple-300">{selectedWorkflow.name}</div>
                  <div className="text-[10px] text-slate-500 font-mono">{selectedWorkflow.path}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(selectedWorkflow.rawContent)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#121622] hover:bg-[#181d2c] text-slate-300 border border-[#202738] text-[11px] font-semibold transition-all"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copied ? 'Copied' : 'Copy'}</span>
                  </button>
                  {onTriggerRun && (
                    <button
                      onClick={() => onTriggerRun('main', selectedWorkflow.name)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[11px] font-bold transition-all shadow-sm"
                    >
                      <Play className="w-3 h-3" />
                      <span>Dispatch Run</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Jobs Breakdown */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Workflow Execution Jobs Matrix ({selectedWorkflow.jobs.length})
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedWorkflow.jobs.map((job) => (
                    <div
                      key={job.id}
                      className="p-2.5 rounded-lg bg-[#121622] border border-[#202738] text-xs space-y-1"
                    >
                      <div className="font-bold text-slate-200 font-mono text-[11px] truncate">
                        {job.name}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Runs on: <span className="text-cyan-400">{job.runsOn}</span> &bull; {job.stepsCount} Steps
                      </div>
                      <div className="flex items-center gap-1 pt-1">
                        {job.hasSecurityScan && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-400">
                            SAST Scan
                          </span>
                        )}
                        {job.hasDockerBuild && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-cyan-500/20 text-cyan-400">
                            Docker Build
                          </span>
                        )}
                        {job.hasK8sDeploy && (
                          <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-amber-500/20 text-amber-400">
                            K8s GitOps
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw YAML */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Workflow YAML Definition</span>
                  <span className="text-[10px] font-mono text-purple-400">Valid Syntax</span>
                </div>
                <pre className="p-3.5 rounded-lg bg-[#05070a] border border-[#161a26] text-[11px] font-mono text-purple-300/90 overflow-x-auto leading-relaxed max-h-48">
                  {selectedWorkflow.rawContent}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a workflow file to inspect execution stages and YAML source.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
