import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cpu,
  FileCode2,
  GitBranch,
  Github,
  Key,
  Layers,
  Link2,
  Loader2,
  RefreshCw,
  Server,
  Shield,
  Sparkles,
  Terminal,
  X,
  Zap,
} from 'lucide-react';
import { GitHubRepo } from '../types';

interface GitHubRepoSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentRepo: GitHubRepo | null;
  onConnectRepo: (repoUrl: string, token?: string) => Promise<void>;
  onSyncAllServices: () => Promise<void>;
  isLoading?: boolean;
}

export const GitHubRepoSyncModal: React.FC<GitHubRepoSyncModalProps> = ({
  isOpen,
  onClose,
  currentRepo,
  onConnectRepo,
  onSyncAllServices,
  isLoading = false,
}) => {
  const [repoInput, setRepoInput] = useState(
    currentRepo?.owner && currentRepo?.name ? `${currentRepo.owner}/${currentRepo.name}` : 'acme-enterprise/payment-gateway'
  );
  const [patToken, setPatToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [syncStep, setSyncStep] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePresets = [
    { label: 'CloudOps Microservices (Default)', url: 'acme-enterprise/payment-gateway', desc: 'Go microservice with Helm, HPA & CI/CD' },
    { label: 'Google Microservices Demo', url: 'GoogleCloudPlatform/microservices-demo', desc: '10-tier polyglot e-commerce on Kubernetes' },
    { label: 'Kubernetes Examples Suite', url: 'kubernetes/examples', desc: 'Official production manifests & deployment specs' },
    { label: 'HashiCorp Vault K8s Helm', url: 'hashicorp/vault-helm', desc: 'Zero-trust security vault & secrets operator' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!repoInput.trim()) return;

    setErrorMessage(null);
    setIsSubmitting(true);
    setSyncStep(1);

    try {
      // Step 1: CI/CD & GitHub Actions
      await new Promise((r) => setTimeout(r, 400));
      setSyncStep(2);

      // Step 2: Kubernetes Manifests & Security Audit
      await new Promise((r) => setTimeout(r, 400));
      setSyncStep(3);

      // Step 3: Container & Runner Logs + AI Diagnosis
      await new Promise((r) => setTimeout(r, 400));
      setSyncStep(4);

      await onConnectRepo(repoInput.trim(), patToken.trim() || undefined);
      setSyncStep(5);
      setTimeout(() => {
        setIsSubmitting(false);
        setSyncStep(0);
        onClose();
      }, 600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to connect repository. Please verify the owner/repo path.');
      setIsSubmitting(false);
      setSyncStep(0);
    }
  };

  const handleQuickSync = async () => {
    setIsSubmitting(true);
    try {
      await onSyncAllServices();
      setIsSubmitting(false);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Sync failed.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#0e1118] border border-[#202738] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 text-white">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#202738] bg-[#121622]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Connect GitHub Repository
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Global Multi-Service Sync
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Connect once to automatically populate CI/CD, Kubernetes files, Logs, and Architecture.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1c2233] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Active Synced Repository Status */}
          {currentRepo?.owner && currentRepo?.name && (
            <div className="bg-[#121622] border border-[#202738] rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-slate-800 flex items-center justify-center text-slate-300 font-mono text-xs font-bold">
                  {currentRepo.owner?.slice(0, 2).toUpperCase() || 'GH'}
                </div>
                <div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>Active Connected Repository:</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-300">
                    {currentRepo.owner}/{currentRepo.name}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleQuickSync}
                disabled={isSubmitting || isLoading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/40 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSubmitting ? 'animate-spin' : ''}`} />
                <span>Re-Sync All Services</span>
              </button>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                GitHub Repository URL or Path
              </label>
              <div className="relative">
                <Github className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={repoInput}
                  onChange={(e) => setRepoInput(e.target.value)}
                  placeholder="e.g. acme-enterprise/payment-gateway or https://github.com/..."
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#090b10] border border-[#202738] focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 text-xs text-slate-200 placeholder:text-slate-500 outline-none font-mono"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3 h-3 text-slate-400" />
                  Personal Access Token (Optional for Private Repos)
                </label>
                <span className="text-[10px] text-slate-500">Only needed for private repos / high rate limits</span>
              </div>
              <input
                type="password"
                value={patToken}
                onChange={(e) => setPatToken(e.target.value)}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                className="w-full px-3.5 py-2 rounded-xl bg-[#090b10] border border-[#202738] focus:border-emerald-500 text-xs text-slate-200 placeholder:text-slate-600 outline-none font-mono"
              />
            </div>

            {/* Presets */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Or Select a High-Fidelity Enterprise Preset:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {samplePresets.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => setRepoInput(preset.url)}
                    className={`text-left p-2.5 rounded-xl border text-xs transition-all ${
                      repoInput === preset.url
                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                        : 'bg-[#121622] border-[#202738] hover:border-slate-600 text-slate-300'
                    }`}
                  >
                    <div className="font-bold font-mono text-[11px] truncate">{preset.url}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-1">{preset.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Multi-Service Automated Sync Preview */}
            <div className="bg-[#121622]/80 border border-[#202738] rounded-xl p-3.5 space-y-2.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Services Automatically Synchronized upon Connection:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-[#090b10] border border-[#202738] space-y-1">
                  <div className="text-emerald-400 font-bold flex items-center gap-1">
                    <Zap className="w-3 h-3" /> CI/CD Tab
                  </div>
                  <div className="text-[10px] text-slate-400">.github/workflows, live runs & error matrix</div>
                </div>
                <div className="p-2 rounded-lg bg-[#090b10] border border-[#202738] space-y-1">
                  <div className="text-cyan-400 font-bold flex items-center gap-1">
                    <Server className="w-3 h-3" /> K8s Tab
                  </div>
                  <div className="text-[10px] text-slate-400">k8s/*.yaml & Helm charts file scan</div>
                </div>
                <div className="p-2 rounded-lg bg-[#090b10] border border-[#202738] space-y-1">
                  <div className="text-amber-400 font-bold flex items-center gap-1">
                    <Terminal className="w-3 h-3" /> Logs Tab
                  </div>
                  <div className="text-[10px] text-slate-400">eBPF + pod logs + AI auto-solutions</div>
                </div>
                <div className="p-2 rounded-lg bg-[#090b10] border border-[#202738] space-y-1">
                  <div className="text-purple-400 font-bold flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Tech Stack
                  </div>
                  <div className="text-[10px] text-slate-400">Architecture, Dockerfile & security audit</div>
                </div>
              </div>
            </div>

            {/* Error banner */}
            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Active Sync Progress */}
            {isSubmitting && (
              <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs text-emerald-300 font-bold">
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {syncStep === 1 && 'Scanning GitHub Actions Workflows...'}
                    {syncStep === 2 && 'Inspecting Kubernetes & Helm Manifests...'}
                    {syncStep === 3 && 'Analyzing Runner & Pod Logs with AI...'}
                    {syncStep === 4 && 'Mapping Topology & Tech Stack...'}
                    {syncStep >= 5 && 'All Services Successfully Synchronized!'}
                  </span>
                  <span>{syncStep * 20}%</span>
                </div>
                <div className="w-full h-1.5 bg-emerald-950 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all duration-300"
                    style={{ width: `${syncStep * 20}%` }}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-[#121622] hover:bg-[#181d2c] text-slate-300 text-xs font-semibold border border-[#202738] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !repoInput.trim()}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Synchronizing Services...</span>
                  </>
                ) : (
                  <>
                    <Link2 className="w-3.5 h-3.5" />
                    <span>Connect & Sync All Services</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
