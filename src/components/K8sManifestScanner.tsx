import React, { useState, useEffect } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Cpu,
  FileCode2,
  FileText,
  Flame,
  Layers,
  Loader2,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Wrench,
  Zap,
} from 'lucide-react';
import { K8sManifestScanReport, RepoK8sManifest } from '../types';

interface K8sManifestScannerProps {
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const K8sManifestScanner: React.FC<K8sManifestScannerProps> = ({ onShowToast }) => {
  const [report, setReport] = useState<K8sManifestScanReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [selectedManifest, setSelectedManifest] = useState<RepoK8sManifest | null>(null);
  const [fixingManifestId, setFixingManifestId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'error' | 'warning' | 'valid'>('all');

  const fetchManifests = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/k8s/manifests');
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        if (data.report?.manifests?.length > 0 && !selectedManifest) {
          setSelectedManifest(data.report.manifests[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching K8s manifests:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManifests();
  }, []);

  const handleDeepScan = async () => {
    try {
      setIsScanning(true);
      const res = await fetch('/api/k8s/manifests/scan', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setReport(data.report);
        if (selectedManifest) {
          const updated = data.report.manifests.find((m: RepoK8sManifest) => m.id === selectedManifest.id);
          if (updated) setSelectedManifest(updated);
        }
        onShowToast?.('success', 'Deep Scan Complete', 'Scanned all Kubernetes & Helm files in repository');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Scan Failed', err.message);
    } finally {
      setIsScanning(false);
    }
  };

  const handleAutoFix = async (manifestId: string) => {
    try {
      setFixingManifestId(manifestId);
      const res = await fetch('/api/k8s/manifests/autofix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ manifestId }),
      });
      if (res.ok) {
        const data = await res.json();
        onShowToast?.('success', '1-Click Auto-Fix Applied', data.message);
        // Refresh report
        await fetchManifests();
        if (selectedManifest && selectedManifest.id === manifestId) {
          setSelectedManifest(data.manifest);
        }
      } else {
        const errData = await res.json();
        onShowToast?.('error', 'Auto-Fix Failed', errData.error || 'Failed to auto-fix');
      }
    } catch (err: any) {
      onShowToast?.('error', 'Auto-Fix Error', err.message);
    } finally {
      setFixingManifestId(null);
    }
  };

  const filteredManifests = report?.manifests.filter((m) => {
    if (activeFilter === 'all') return true;
    return m.validationStatus === activeFilter;
  }) || [];

  return (
    <div className="bg-[#0e1118] border border-[#202738] rounded-2xl p-5 shadow-xl space-y-4 text-white">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b border-[#202738]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <FileCode2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Repository Kubernetes Manifests & Error Scanner
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold">
                  {report?.repoFullName || 'Connected Repo'}
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Scans all YAML manifests & Helm charts in repository for misconfigurations, security risks, and missing limits.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDeepScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Scanning Repo...' : 'Re-Scan Manifests'}</span>
          </button>
        </div>
      </div>

      {/* Metrics & Filter Row */}
      {report && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => setActiveFilter('all')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'all'
                ? 'bg-slate-800/80 border-slate-500'
                : 'bg-[#121622] border-[#202738] hover:border-slate-600'
            }`}
          >
            <div className="text-[10px] uppercase font-mono font-semibold text-slate-400">Total Scanned</div>
            <div className="text-lg font-bold text-white mt-0.5">{report.totalManifests} Manifests</div>
          </button>

          <button
            onClick={() => setActiveFilter('error')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'error'
                ? 'bg-rose-500/20 border-rose-500'
                : 'bg-[#121622] border-[#202738] hover:border-rose-500/40'
            }`}
          >
            <div className="text-[10px] uppercase font-mono font-semibold text-rose-400 flex items-center justify-between">
              <span>Errors</span>
              {report.errorCount > 0 && <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />}
            </div>
            <div className="text-lg font-bold text-rose-400 mt-0.5">{report.errorCount} Issues</div>
          </button>

          <button
            onClick={() => setActiveFilter('warning')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'warning'
                ? 'bg-amber-500/20 border-amber-500'
                : 'bg-[#121622] border-[#202738] hover:border-amber-500/40'
            }`}
          >
            <div className="text-[10px] uppercase font-mono font-semibold text-amber-400">Warnings</div>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{report.warningCount} Alerts</div>
          </button>

          <button
            onClick={() => setActiveFilter('valid')}
            className={`p-3 rounded-xl border text-left transition-all ${
              activeFilter === 'valid'
                ? 'bg-emerald-500/20 border-emerald-500'
                : 'bg-[#121622] border-[#202738] hover:border-emerald-500/40'
            }`}
          >
            <div className="text-[10px] uppercase font-mono font-semibold text-emerald-400">Security Score</div>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{report.readinessScore}/100</div>
          </button>
        </div>
      )}

      {/* Main Split View: Left Manifest List & Right YAML / Finding Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Manifest Cards */}
        <div className="lg:col-span-5 space-y-2 max-h-[500px] overflow-y-auto pr-1">
          {filteredManifests.map((manifest) => {
            const isSelected = selectedManifest?.id === manifest.id;
            return (
              <div
                key={manifest.id}
                onClick={() => setSelectedManifest(manifest)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-cyan-950/30 border-cyan-500/60 shadow-lg shadow-cyan-950/40'
                    : 'bg-[#121622] border-[#202738] hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    {manifest.validationStatus === 'error' && (
                      <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    {manifest.validationStatus === 'warning' && (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                    {manifest.validationStatus === 'valid' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-white truncate">
                      {manifest.path}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {manifest.kind}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                  <span>Score: {manifest.healthScore}%</span>
                  <span>{manifest.securityFindings.length} Audit Rules</span>
                </div>

                {manifest.autoFixAvailable && (
                  <div className="mt-2 pt-2 border-t border-[#202738] flex items-center justify-between">
                    <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Auto-Fix Available
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAutoFix(manifest.id);
                      }}
                      disabled={fixingManifestId === manifest.id}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold transition-all flex items-center gap-1 shadow-sm"
                    >
                      {fixingManifestId === manifest.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Wrench className="w-3 h-3" />
                      )}
                      <span>1-Click Fix</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right Column: Code Viewer & Detailed Security Findings */}
        <div className="lg:col-span-7 bg-[#090b10] border border-[#202738] rounded-xl p-4 space-y-4 max-h-[500px] overflow-y-auto">
          {selectedManifest ? (
            <>
              <div className="flex items-center justify-between pb-3 border-b border-[#202738]">
                <div>
                  <div className="text-xs font-mono font-bold text-cyan-300">{selectedManifest.path}</div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    Kind: {selectedManifest.kind} &bull; API: {selectedManifest.apiVersion} &bull; Namespace: {selectedManifest.namespace}
                  </div>
                </div>
                {selectedManifest.autoFixAvailable && (
                  <button
                    onClick={() => handleAutoFix(selectedManifest.id)}
                    disabled={fixingManifestId === selectedManifest.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md shadow-emerald-500/20"
                  >
                    {fixingManifestId === selectedManifest.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Wrench className="w-3.5 h-3.5" />
                    )}
                    <span>Apply 1-Click Remediation</span>
                  </button>
                )}
              </div>

              {/* Security Findings Annotations */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Audit Findings & Security Checks
                </div>
                {selectedManifest.securityFindings.map((f) => (
                  <div
                    key={f.id}
                    className={`p-3 rounded-lg border text-xs space-y-1 ${
                      f.level === 'error'
                        ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                        : f.level === 'warning'
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span className="font-mono text-[11px]">{f.rule}</span>
                      <span className="uppercase text-[9px] px-1.5 py-0.5 rounded font-mono font-bold bg-black/40">
                        {f.level}
                      </span>
                    </div>
                    <div>{f.message}</div>
                    {f.remediation && (
                      <div className="text-[11px] text-slate-300 font-mono pt-1">
                        💡 Fix: {f.remediation}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* YAML Source Code Viewer */}
              <div className="space-y-1.5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Manifest Source (YAML)</span>
                  <span className="font-mono text-[10px] text-slate-500">Read-Only View</span>
                </div>
                <pre className="p-3.5 rounded-lg bg-[#05070a] border border-[#161a26] text-[11px] font-mono text-emerald-400/90 overflow-x-auto leading-relaxed max-h-60">
                  {selectedManifest.rawContent}
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs">
              Select a manifest to inspect audit findings and YAML definition.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
