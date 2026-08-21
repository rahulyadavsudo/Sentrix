import React, { useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileCode2,
  FileDiff,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Layers,
  RefreshCw,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { GitOpsApp } from '../types';

interface GitOpsSyncStudioProps {
  apps: GitOpsApp[];
  onSyncApp: (appId: string) => Promise<void>;
  isSyncing: boolean;
}

export const GitOpsSyncStudio: React.FC<GitOpsSyncStudioProps> = ({
  apps,
  onSyncApp,
  isSyncing,
}) => {
  const [selectedAppId, setSelectedAppId] = useState<string>(apps[0]?.id || 'gitops-payment');
  const [viewMode, setViewMode] = useState<'diff' | 'live' | 'git'>('diff');
  const [prCreatedToast, setPrCreatedToast] = useState<string | null>(null);

  const activeApp = apps.find((a) => a.id === selectedAppId) || apps[0];

  const handleCreateAutoHealingPR = () => {
    setPrCreatedToast(
      `PR #142 opened on GitHub: "fix(k8s): auto-heal memory limits and replica sync for ${activeApp?.name}"`
    );
    setTimeout(() => setPrCreatedToast(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {prCreatedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-emerald-500/40 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <div>
            <div className="text-xs font-bold text-emerald-400">GitOps PR Created</div>
            <div className="text-xs text-slate-300">{prCreatedToast}</div>
          </div>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <GitBranch className="w-5 h-5 text-cyan-400" />
            ArgoCD GitOps Manifest Sync & Drift Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Declarative Kubernetes GitOps engine comparing desired Git repository state with live cluster manifests, with automated drift resolution and 1-click Git PR creation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCreateAutoHealingPR}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition-all shadow-md"
          >
            <GitPullRequest className="w-4 h-4" />
            <span>Create Auto-Healing PR</span>
          </button>
        </div>
      </div>

      {/* Apps Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {apps.map((app) => {
          const isSelected = activeApp?.id === app.id;
          return (
            <div
              key={app.id}
              onClick={() => setSelectedAppId(app.id)}
              className={`rounded-xl border p-4 cursor-pointer transition-all duration-150 shadow-md ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/20'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  {app.name}
                </span>

                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      app.syncStatus === 'Synced'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    }`}
                  >
                    {app.syncStatus}
                  </span>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                      app.healthStatus === 'Healthy'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    {app.healthStatus}
                  </span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono mt-2 truncate">
                Target: {app.targetRevision}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Synced: {new Date(app.lastSyncTime).toLocaleTimeString()}
                </span>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSyncApp(app.id);
                  }}
                  disabled={isSyncing || app.syncStatus === 'Synced'}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white font-bold text-[11px] transition-all shadow-md"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{app.syncStatus === 'Synced' ? 'Synchronized' : 'Sync Now'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manifest Diff Viewer */}
      {activeApp && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FileDiff className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  Manifest Comparison: {activeApp.name}
                </h3>
                <span className="text-[11px] text-slate-400">
                  Comparing live cluster state vs. Git repository manifest
                </span>
              </div>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setViewMode('diff')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  viewMode === 'diff' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Unified Diff
              </button>
              <button
                onClick={() => setViewMode('live')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  viewMode === 'live' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Live K8s State
              </button>
              <button
                onClick={() => setViewMode('git')}
                className={`px-3 py-1 rounded text-xs font-bold transition-all ${
                  viewMode === 'git' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Git Manifest
              </button>
            </div>
          </div>

          {/* Diff Code Container */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs overflow-x-auto max-h-96">
            {viewMode === 'diff' && (
              <div className="space-y-1">
                {activeApp.diffLines.map((line, i) => (
                  <div
                    key={i}
                    className={`px-2 py-0.5 rounded flex items-center gap-3 ${
                      line.type === 'added'
                        ? 'bg-emerald-950/60 text-emerald-300 border-l-2 border-emerald-500 font-semibold'
                        : line.type === 'removed'
                        ? 'bg-rose-950/60 text-rose-300 border-l-2 border-rose-500 font-semibold'
                        : 'text-slate-400'
                    }`}
                  >
                    <span className="text-[10px] text-slate-600 select-none w-6 text-right">
                      {i + 1}
                    </span>
                    <pre className="font-mono text-xs">{line.line}</pre>
                  </div>
                ))}
              </div>
            )}

            {viewMode === 'live' && (
              <pre className="text-slate-300 leading-relaxed">{activeApp.liveManifestYaml}</pre>
            )}

            {viewMode === 'git' && (
              <pre className="text-slate-300 leading-relaxed">{activeApp.gitManifestYaml}</pre>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
