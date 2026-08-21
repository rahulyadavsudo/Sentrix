import React, { useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Code,
  Copy,
  FolderGit2,
  History,
  Layers,
  Package,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';
import { HelmRelease, KubernetesCRD } from '../types';

interface HelmCrdManagerProps {
  releases: HelmRelease[];
  crds: KubernetesCRD[];
  onRollbackRelease: (releaseName: string, targetRevision: number) => Promise<void>;
  onRefresh?: () => void;
}

export function HelmCrdManager({
  releases,
  crds,
  onRollbackRelease,
  onRefresh,
}: HelmCrdManagerProps) {
  const [activeTab, setActiveTab] = useState<'releases' | 'crds'>('releases');
  const [selectedReleaseName, setSelectedReleaseName] = useState<string>(
    releases[0]?.name || ''
  );
  const [selectedCrdName, setSelectedCrdName] = useState<string>(
    crds[0]?.name || ''
  );
  const [isRollingBack, setIsRollingBack] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentRelease =
    releases.find((r) => r.name === selectedReleaseName) || releases[0];
  const currentCrd = crds.find((c) => c.name === selectedCrdName) || crds[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRollback = async (revision: number) => {
    if (!currentRelease) return;
    setIsRollingBack(true);
    try {
      await onRollbackRelease(currentRelease.name, revision);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Kubernetes CRD & Helm Release Lifecycle Center
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                Helm v3.14 & Custom Resources Live
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspect installed Helm chart revisions, perform zero-downtime rollbacks, review values.yaml configs, and audit active Kubernetes Custom Resource Definitions.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub Tab Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800">
            <button
              onClick={() => setActiveTab('releases')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'releases'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              Helm Releases ({releases.length})
            </button>
            <button
              onClick={() => setActiveTab('crds')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                activeTab === 'crds'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3.5 h-3.5 text-cyan-400" />
              CRD Registry ({crds.length})
            </button>
          </div>

          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1 text-xs font-medium"
              title="Refresh Releases"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {activeTab === 'releases' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Helm Releases List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Installed Releases
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  Namespace: all
                </span>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter releases..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-2">
                {releases
                  .filter((r) =>
                    r.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((release) => {
                    const isSelected = release.name === selectedReleaseName;
                    return (
                      <div
                        key={release.name}
                        onClick={() => setSelectedReleaseName(release.name)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-950/50 border-blue-500/60 shadow-md shadow-blue-500/10'
                            : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-xs font-mono font-bold text-white truncate max-w-[190px]">
                            {release.name}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            Rev #{release.revision}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span className="font-mono text-slate-400">
                            ns: {release.namespace}
                          </span>
                          <span className="font-mono text-slate-300 truncate max-w-[140px]">
                            {release.chart}
                          </span>
                        </div>

                        <div className="mt-2 flex items-center justify-between pt-2 border-t border-slate-800/60 text-[10px]">
                          <span className="text-slate-500">
                            App: {release.appVersion}
                          </span>
                          <span className="text-emerald-400 font-bold uppercase flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            {release.status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* Right Column: Release Details, Revision History & Rollback, Values.yaml */}
          <div className="lg:col-span-8 space-y-4">
            {currentRelease ? (
              <div className="space-y-4">
                {/* Release Header */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white font-mono">
                        {currentRelease.name}
                      </h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        {currentRelease.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Chart: {currentRelease.chart} | App Version: {currentRelease.appVersion} | Namespace: {currentRelease.namespace}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="p-2 px-3 rounded-xl bg-slate-950/60 border border-slate-800 text-center">
                      <div className="text-[10px] text-slate-500 uppercase">Live Revision</div>
                      <div className="text-sm font-bold font-mono text-blue-400">
                        #{currentRelease.revision}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Revision History & Rollback Matrix */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Release Revision History ({currentRelease.history.length} versions)
                      </h4>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      1-Click Rollback Protected
                    </span>
                  </div>

                  <div className="space-y-2">
                    {currentRelease.history.map((hist) => {
                      const isCurrent = hist.revision === currentRelease.revision;
                      return (
                        <div
                          key={hist.revision}
                          className={`p-3 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                            isCurrent
                              ? 'bg-blue-950/30 border-blue-500/50'
                              : 'bg-slate-950/40 border-slate-800/60'
                          }`}
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-200 border border-slate-700">
                                Revision #{hist.revision}
                              </span>
                              {isCurrent && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                                  ACTIVE LIVE
                                </span>
                              )}
                              <span className="text-xs font-mono text-slate-300">
                                {hist.chart}
                              </span>
                            </div>
                            <p className="text-xs text-slate-400">
                              {hist.description}
                            </p>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Updated: {hist.updated}
                            </div>
                          </div>

                          {!isCurrent && (
                            <button
                              onClick={() => handleRollback(hist.revision)}
                              disabled={isRollingBack}
                              className="px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 transition-all self-start md:self-auto disabled:opacity-50"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              Rollback to #{hist.revision}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Values.yaml Manifest Inspector */}
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <Code className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        Applied values.yaml Manifest
                      </h4>
                    </div>
                    <button
                      onClick={() => handleCopy(currentRelease.valuesYaml, 'values-yaml')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'values-yaml' ? 'Copied!' : 'Copy YAML'}</span>
                    </button>
                  </div>

                  <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs font-mono text-cyan-300 overflow-x-auto max-h-72 leading-relaxed">
                    {currentRelease.valuesYaml}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Select a Helm release to inspect.
              </div>
            )}
          </div>
        </div>
      ) : (
        /* CRD Registry View */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: CRD List */}
          <div className="lg:col-span-4 space-y-4">
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Custom Resource Definitions ({crds.length})
              </span>

              <div className="space-y-2">
                {crds.map((crd) => {
                  const isSelected = crd.name === selectedCrdName;
                  return (
                    <div
                      key={crd.name}
                      onClick={() => setSelectedCrdName(crd.name)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-cyan-950/50 border-cyan-500/60 shadow-md'
                          : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-mono font-bold text-white truncate max-w-[180px]">
                          {crd.kind}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                          {crd.customResourceCount} instances
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-slate-400 truncate">
                        {crd.name}
                      </div>
                      <div className="mt-1 flex items-center justify-between text-[9px] text-slate-500">
                        <span>Group: {crd.group}</span>
                        <span>{crd.version}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: CRD Spec & Sample YAML */}
          <div className="lg:col-span-8 space-y-4">
            {currentCrd ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold font-mono text-white">
                        {currentCrd.kind} ({currentCrd.name})
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Group: {currentCrd.group} | Version: {currentCrd.version} | Scope: {currentCrd.scope}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      Established & Validated
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">
                      Sample Custom Resource Manifest YAML
                    </span>
                    <button
                      onClick={() => handleCopy(currentCrd.sampleManifestYaml, 'crd-yaml')}
                      className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-mono flex items-center gap-1 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === 'crd-yaml' ? 'Copied!' : 'Copy YAML'}</span>
                    </button>
                  </div>
                  <pre className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800/80 text-xs font-mono text-emerald-300 overflow-x-auto max-h-72 leading-relaxed">
                    {currentCrd.sampleManifestYaml}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500">
                Select a Custom Resource Definition.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
