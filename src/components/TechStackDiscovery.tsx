import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  Bot,
  Box,
  Boxes,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Cpu,
  Download,
  ExternalLink,
  FileCode,
  FileCode2,
  FileJson,
  FileSpreadsheet,
  FileText,
  Flame,
  Folder,
  FolderOpen,
  GitBranch,
  Github,
  HardDrive,
  HelpCircle,
  Layers,
  Lightbulb,
  Lock,
  Package,
  Play,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  TrendingUp,
  Workflow,
  Zap,
} from 'lucide-react';
import {
  DetectedDockerfile,
  DetectedHelmChart,
  DetectedK8sManifest,
  DetectedWorkflow,
  GitHubRepo,
  RepoFileNode,
  TechStackDetection,
} from '../types';

interface TechStackDiscoveryProps {
  repo?: GitHubRepo | null;
  onNavigateToPipeline?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info', title: string, desc: string) => void;
}

export const TechStackDiscovery: React.FC<TechStackDiscoveryProps> = ({
  repo,
  onNavigateToPipeline,
  onShowToast,
}) => {
  const [techStack, setTechStack] = useState<TechStackDetection | null>(null);
  const [loading, setLoading] = useState(true);
  const [isScanning, setIsScanning] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'docker' | 'workflows' | 'helm' | 'k8s' | 'filetree' | 'ai-review'
  >('overview');

  // File tree state
  const [selectedFile, setSelectedFile] = useState<RepoFileNode | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({
    '.github': true,
    '.github/workflows': true,
    helm: true,
    'helm/payment-gateway': true,
    k8s: true,
    'k8s/base': true,
    src: true,
  });
  const [fileSearchQuery, setFileSearchQuery] = useState('');
  const [copiedPath, setCopiedPath] = useState<string | null>(null);

  const fetchTechStack = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/repo/tech-stack');
      const data = await res.json();
      if (data.techStack) {
        setTechStack(data.techStack);
        // Default select the Dockerfile or first file
        if (!selectedFile && data.techStack.fileTree?.length > 0) {
          const docker = data.techStack.fileTree.find((f: RepoFileNode) => f.name === 'Dockerfile');
          setSelectedFile(docker || data.techStack.fileTree[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch tech stack:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechStack();
  }, [repo?.name, repo?.owner]);

  const handleRescan = async () => {
    try {
      setIsScanning(true);
      const res = await fetch('/api/repo/tech-stack/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner: repo?.owner || 'acme-enterprise',
          repoName: repo?.name || 'payment-gateway',
          branch: repo?.branch || 'main',
        }),
      });
      const data = await res.json();
      if (data.success && data.techStack) {
        setTechStack(data.techStack);
        onShowToast?.('success', 'Tech Stack Re-Scanned', data.message);
      }
    } catch (err) {
      console.error('Scan failed:', err);
      onShowToast?.('error', 'Scan Failed', 'Could not complete repository structure scan.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    try {
      setIsAiAnalyzing(true);
      const res = await fetch('/api/repo/tech-stack/ai-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success && data.techStack) {
        setTechStack(data.techStack);
        setActiveTab('ai-review');
        onShowToast?.('success', 'AI Architectural Review Complete', 'Gemini 3.7 evaluated cloud-native maturity & security posture.');
      }
    } catch (err) {
      console.error('AI Analysis failed:', err);
      onShowToast?.('error', 'AI Analysis Failed', 'Failed to run AI architecture inspection.');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  const copyToClipboard = (text: string, path: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 2000);
    onShowToast?.('info', 'Copied to Clipboard', `Copied content for ${path}`);
  };

  const getCategoryBadge = (category?: string) => {
    switch (category) {
      case 'docker':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">Docker</span>;
      case 'ci':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">Actions</span>;
      case 'helm':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Helm</span>;
      case 'k8s':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">K8s</span>;
      case 'security':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">Security</span>;
      case 'source':
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Source</span>;
      default:
        return <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-500/20 text-slate-300 border border-slate-500/30">Config</span>;
    }
  };

  const renderFileTreeNode = (node: RepoFileNode, depth: number = 0) => {
    const isExpanded = expandedFolders[node.path];
    const isSelected = selectedFile?.path === node.path;

    if (node.type === 'directory') {
      return (
        <div key={node.path} className="select-none">
          <button
            onClick={() => toggleFolder(node.path)}
            className={`w-full flex items-center gap-1.5 py-1.5 px-2 text-xs text-left rounded-md transition-colors hover:bg-slate-800/60 ${
              isExpanded ? 'text-slate-200' : 'text-slate-400'
            }`}
            style={{ paddingLeft: `${depth * 14 + 8}px` }}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            )}
            {isExpanded ? (
              <FolderOpen className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-cyan-500/80 shrink-0" />
            )}
            <span className="font-mono truncate font-medium">{node.name}</span>
          </button>
          {isExpanded && node.children && (
            <div>
              {node.children.map((child) => renderFileTreeNode(child, depth + 1))}
            </div>
          )}
        </div>
      );
    }

    return (
      <button
        key={node.path}
        onClick={() => setSelectedFile(node)}
        className={`w-full flex items-center justify-between gap-1.5 py-1.5 px-2 text-xs text-left rounded-md transition-all font-mono ${
          isSelected
            ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
            : 'text-slate-300 hover:bg-slate-800/50 hover:text-slate-100'
        }`}
        style={{ paddingLeft: `${depth * 14 + 20}px` }}
      >
        <div className="flex items-center gap-2 truncate">
          <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
          <span className="truncate">{node.name}</span>
        </div>
        {getCategoryBadge(node.category)}
      </button>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] bg-slate-900/60 rounded-xl border border-slate-800 p-8">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mb-3" />
        <p className="text-sm font-medium text-slate-300">Scanning connected repository structure & tech stack...</p>
        <p className="text-xs text-slate-500 mt-1">Analyzing Dockerfile, GitHub Actions, Helm charts, and Kubernetes manifests</p>
      </div>
    );
  }

  if (!techStack) {
    return (
      <div className="bg-slate-900/60 rounded-xl border border-slate-800 p-8 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <h3 className="text-base font-semibold text-slate-200">No Tech Stack Detected</h3>
        <p className="text-xs text-slate-400 mt-1 mb-4">Connect a GitHub repository to trigger automatic tech stack discovery.</p>
        <button
          onClick={handleRescan}
          className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-medium text-xs rounded-lg transition-colors"
        >
          Run Auto-Discovery Scan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Banner: Connected Repository & Auto-Discovery Header */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-900/80 rounded-2xl border border-slate-800 p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 relative z-10">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-xl border border-cyan-500/30 text-cyan-400 shrink-0">
              <Boxes className="w-8 h-8" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight flex items-center gap-2">
                  <span>{techStack.repoFullName}</span>
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
                  <GitBranch className="w-3 h-3" />
                  {techStack.branch}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  Auto-Discovered ({techStack.totalFilesScanned} files)
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Automatic detection of container specs, CI/CD orchestration, Helm packaging, and Kubernetes deployment manifests.
              </p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-400 font-mono">
                <span>Last Scanned: {new Date(techStack.scannedAt).toLocaleTimeString()}</span>
                <span>•</span>
                <span>Maturity: <strong className="text-cyan-300 font-semibold">{techStack.aiArchitectureSummary?.cloudNativeMaturityLevel || 'Production-Ready'}</strong></span>
                <span>•</span>
                <span>GitOps: <strong className="text-indigo-300 font-semibold">{techStack.gitOps.tool}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRescan}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 rounded-lg text-xs font-medium border border-slate-700 transition-all shadow-sm"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin text-cyan-400' : ''}`} />
              {isScanning ? 'Scanning Tree...' : 'Re-scan Repository'}
            </button>
            <button
              onClick={handleRunAiAnalysis}
              disabled={isAiAnalyzing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 text-slate-950 font-semibold text-xs rounded-lg transition-all shadow-md shadow-cyan-500/20"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
              {isAiAnalyzing ? 'Evaluating Architecture...' : 'Gemini 3.7 AI Review'}
            </button>
          </div>
        </div>

        {/* Highlight Score & Detected Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          {/* Readiness Score */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-sm shrink-0">
              {techStack.readinessScore}%
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Readiness</p>
              <p className="text-xs font-bold text-slate-200">Cloud-Native</p>
            </div>
          </div>

          {/* Docker */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Box className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Dockerfile</p>
              <p className="text-xs font-bold text-blue-300">Multi-Stage (Go)</p>
            </div>
          </div>

          {/* CI/CD Actions */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Workflow className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">CI/CD Actions</p>
              <p className="text-xs font-bold text-cyan-300">{techStack.githubActions.workflowsCount} Workflows</p>
            </div>
          </div>

          {/* Helm */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Helm v3</p>
              <p className="text-xs font-bold text-indigo-300">{techStack.helm.charts[0]?.version ? `v${techStack.helm.charts[0].version}` : 'Packaged'}</p>
            </div>
          </div>

          {/* Kubernetes Manifests */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Kubernetes</p>
              <p className="text-xs font-bold text-purple-300">{techStack.kubernetes.manifestsCount} Manifests</p>
            </div>
          </div>

          {/* Security & SAST */}
          <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Security Scan</p>
              <p className="text-xs font-bold text-amber-300">Trivy + SAST</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Stack Overview & Languages', icon: Layers },
          { id: 'docker', label: 'Dockerfile Specs', icon: Box, count: techStack.docker.dockerfiles.length },
          { id: 'workflows', label: 'GitHub Actions Workflows', icon: Workflow, count: techStack.githubActions.workflowsCount },
          { id: 'helm', label: 'Helm Charts & Values', icon: Package, count: techStack.helm.chartsCount },
          { id: 'k8s', label: 'K8s Manifests', icon: Server, count: techStack.kubernetes.manifestsCount },
          { id: 'filetree', label: 'Interactive File Explorer', icon: FolderOpen },
          { id: 'ai-review', label: 'AI Architecture Review', icon: Sparkles, highlight: true },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? tab.highlight
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-md shadow-cyan-500/20'
                    : 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm font-semibold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                  isActive ? 'bg-slate-900/30 text-slate-900 font-bold' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW & LANGUAGES */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Languages & Frameworks & Security Check */}
          <div className="lg:col-span-2 space-y-6">
            {/* Language Breakdown */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <Code2 className="w-4 h-4 text-cyan-400" />
                Detected Language Distribution
              </h3>

              {/* Multi-color distribution bar */}
              <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-800 mb-4 border border-slate-700/50">
                {techStack.languages.map((lang) => (
                  <div
                    key={lang.name}
                    style={{ width: `${lang.percentage}%`, backgroundColor: lang.color }}
                    title={`${lang.name}: ${lang.percentage}%`}
                    className="h-full transition-all hover:opacity-80"
                  />
                ))}
              </div>

              {/* Language badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {techStack.languages.map((lang) => (
                  <div key={lang.name} className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 flex items-center gap-2.5">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: lang.color }} />
                    <div className="truncate">
                      <p className="text-xs font-semibold text-slate-200 truncate">{lang.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {lang.percentage}% {lang.version ? `(${lang.version})` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Frameworks & Libraries */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-3">
                <Package className="w-4 h-4 text-indigo-400" />
                Detected Microservice Frameworks & Ecosystem
              </h3>
              <div className="flex flex-wrap gap-2">
                {techStack.frameworks.map((fw) => (
                  <span
                    key={fw}
                    className="px-3 py-1.5 rounded-lg text-xs font-mono font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3 h-3 text-indigo-400" />
                    {fw}
                  </span>
                ))}
              </div>
            </div>

            {/* Security & Cloud-Native Checklist */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5">
              <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2 mb-4">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Cloud-Native & Production Readiness Checklist
              </h3>
              <div className="space-y-3">
                {techStack.securityAndBestPractices.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      {item.status === 'pass' ? (
                        <div className="p-1 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0 mt-0.5">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      ) : item.status === 'warning' ? (
                        <div className="p-1 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0 mt-0.5">
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="p-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0 mt-0.5">
                          <AlertCircle className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400 border border-slate-700">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">{item.detail}</p>
                        <p className="text-[11px] text-cyan-400/90 mt-1 font-mono">💡 {item.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Col: Quick Architecture Summary */}
          <div className="space-y-6">
            {/* AI Architecture Synopsis */}
            <div className="bg-gradient-to-b from-slate-900/90 to-slate-900/60 rounded-xl border border-cyan-500/30 p-5 relative overflow-hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  AI Architectural Insights
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Gemini 3.7
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {techStack.aiArchitectureSummary?.overview ||
                  'Modern 12-factor cloud-native architecture. Includes multi-stage container isolation, declarative Helm packaging, and automated GitHub Actions.'}
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800">
                <p className="text-[11px] font-semibold text-slate-300 mb-2">Key Strengths:</p>
                <ul className="space-y-1.5 text-xs text-slate-400">
                  {techStack.aiArchitectureSummary?.keyStrengths.map((s, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={() => setActiveTab('ai-review')}
                className="mt-4 w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-medium transition-colors border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <span>View Full AI Modernization Report</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Actions Panel */}
            <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 space-y-3">
              <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">Quick Actions</h4>
              <button
                onClick={() => setActiveTab('docker')}
                className="w-full text-left p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Box className="w-4 h-4 text-blue-400" />
                  <div>
                    <p className="font-semibold text-slate-200">Inspect Dockerfile</p>
                    <p className="text-[10px] text-slate-400">Multi-stage build & non-root user</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('workflows')}
                className="w-full text-left p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Workflow className="w-4 h-4 text-cyan-400" />
                  <div>
                    <p className="font-semibold text-slate-200">Review CI/CD Workflows</p>
                    <p className="text-[10px] text-slate-400">{techStack.githubActions.workflowsCount} GitHub Actions detected</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('helm')}
                className="w-full text-left p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <Package className="w-4 h-4 text-indigo-400" />
                  <div>
                    <p className="font-semibold text-slate-200">Helm Chart & Values</p>
                    <p className="text-[10px] text-slate-400">Replicas, HPA, Ingress TLS</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>

              <button
                onClick={() => setActiveTab('filetree')}
                className="w-full text-left p-3 rounded-lg bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 transition-all flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-semibold text-slate-200">Browse Repository File Tree</p>
                    <p className="text-[10px] text-slate-400">Live file content preview</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DOCKERFILE SPECS */}
      {activeTab === 'docker' && (
        <div className="space-y-6">
          {techStack.docker.dockerfiles.map((doc, idx) => (
            <div key={idx} className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-500/20 rounded-lg border border-blue-500/30 text-blue-400">
                    <Box className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                      <span>{doc.path}</span>
                      {doc.multiStage && (
                        <span className="text-[10px] px-2 py-0.5 rounded font-sans font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                          Multi-Stage Build
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Base Image: <strong className="text-slate-200">{doc.baseImage}</strong>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyToClipboard(doc.rawContent, doc.path)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
                  >
                    {copiedPath === doc.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedPath === doc.path ? 'Copied' : 'Copy Dockerfile'}
                  </button>
                </div>
              </div>

              {/* Docker Properties Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Exposed Ports</p>
                  <p className="text-sm font-mono font-bold text-cyan-400 mt-1">
                    {doc.exposedPorts.length > 0 ? doc.exposedPorts.join(', ') : 'None'}
                  </p>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Non-Root User</p>
                  <p className={`text-sm font-mono font-bold mt-1 ${doc.hasNonRootUser ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {doc.hasNonRootUser ? 'USER 10001 (PASS)' : 'Root User (WARNING)'}
                  </p>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Health Check</p>
                  <p className={`text-sm font-mono font-bold mt-1 ${doc.hasHealthCheck ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {doc.hasHealthCheck ? 'Configured' : 'Missing'}
                  </p>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Build Stages</p>
                  <p className="text-sm font-mono font-bold text-indigo-400 mt-1">
                    {doc.stages.join(' ➔ ')}
                  </p>
                </div>
              </div>

              {/* Security Findings Badges */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Container Security Evaluation</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {doc.securityFindings.map((f, fIdx) => (
                    <div
                      key={fIdx}
                      className={`p-2.5 rounded-lg border text-xs flex items-center gap-2 ${
                        f.level === 'pass'
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                          : f.level === 'warning'
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                          : 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{f.message}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Dockerfile Code Viewer */}
              <div>
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  Raw Containerfile Snippet
                </h4>
                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[420px] scrollbar-thin scrollbar-thumb-slate-800">
                  <code>{doc.rawContent}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: GITHUB ACTIONS WORKFLOWS */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6">
            {techStack.githubActions.workflows.map((wf, idx) => (
              <div key={idx} className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 sm:p-6 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-cyan-500/20 rounded-lg border border-cyan-500/30 text-cyan-400">
                      <Workflow className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                        <span>{wf.name}</span>
                      </h3>
                      <p className="text-xs text-slate-400 font-mono mt-0.5">{wf.path}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyToClipboard(wf.rawContent, wf.path)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
                    >
                      {copiedPath === wf.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy YAML
                    </button>
                    {onNavigateToPipeline && (
                      <button
                        onClick={onNavigateToPipeline}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-semibold rounded-lg text-xs transition-colors"
                      >
                        <Play className="w-3 h-3" />
                        Run in CI/CD Monitor
                      </button>
                    )}
                  </div>
                </div>

                {/* Workflow Triggers */}
                <div>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Triggers & Events</p>
                  <div className="flex flex-wrap gap-2">
                    {wf.triggers.map((t, tIdx) => (
                      <span
                        key={tIdx}
                        className="px-2.5 py-1 rounded-md text-xs font-mono bg-slate-950 border border-slate-800 text-cyan-300"
                      >
                        ⚡ on: {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Workflow Jobs Breakdown */}
                <div>
                  <p className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">Orchestrated Pipeline Jobs ({wf.jobsCount})</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {wf.jobs.map((job) => (
                      <div key={job.id} className="bg-slate-950/80 rounded-xl p-4 border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-200">{job.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded font-mono bg-slate-800 text-slate-400">
                            {job.runsOn}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-mono">{job.stepsCount} steps configured</p>
                        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800/80">
                          {job.hasSecurityScan && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              🛡️ SAST / Trivy
                            </span>
                          )}
                          {job.hasDockerBuild && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              🐳 Docker Buildx
                            </span>
                          )}
                          {job.hasK8sDeploy && (
                            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              ☸️ Helm Deploy
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Workflow Raw YAML */}
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                    Workflow YAML Specification
                  </h4>
                  <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[360px] scrollbar-thin scrollbar-thumb-slate-800">
                    <code>{wf.rawContent}</code>
                  </pre>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: HELM CHARTS & VALUES */}
      {activeTab === 'helm' && (
        <div className="space-y-6">
          {techStack.helm.charts.map((chart, idx) => (
            <div key={idx} className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 sm:p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/20 rounded-lg border border-indigo-500/30 text-indigo-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                      <span>{chart.name}</span>
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                        Chart: v{chart.version}
                      </span>
                      <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                        appVersion: {chart.appVersion}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">{chart.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {chart.rawValuesYaml && (
                    <button
                      onClick={() => copyToClipboard(chart.rawValuesYaml || '', 'values.yaml')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
                    >
                      {copiedPath === 'values.yaml' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy values.yaml
                    </button>
                  )}
                </div>
              </div>

              {/* Chart Feature Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Templates</p>
                  <p className="text-sm font-mono font-bold text-slate-200 mt-1">{chart.templates.join(', ')}</p>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">HPA Autoscaling</p>
                  <p className={`text-sm font-mono font-bold mt-1 ${chart.hasAutoscaling ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {chart.hasAutoscaling ? 'Configured (3-12 pods)' : 'Disabled'}
                  </p>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Ingress TLS</p>
                  <p className={`text-sm font-mono font-bold mt-1 ${chart.hasIngress ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {chart.hasIngress ? 'Nginx + Cert-Manager' : 'Disabled'}
                  </p>
                </div>
                <div className="bg-slate-950/60 rounded-lg p-3 border border-slate-800/80">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Dependencies</p>
                  <p className="text-sm font-mono font-bold text-indigo-300 mt-1">Bitnami Redis</p>
                </div>
              </div>

              {/* values.yaml viewer */}
              {chart.rawValuesYaml && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    helm/{chart.name}/values.yaml
                  </h4>
                  <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[400px] scrollbar-thin scrollbar-thumb-slate-800">
                    <code>{chart.rawValuesYaml}</code>
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: KUBERNETES MANIFESTS */}
      {activeTab === 'k8s' && (
        <div className="space-y-6">
          <div className="bg-slate-900/70 rounded-xl border border-slate-800 p-5">
            <h3 className="text-sm font-semibold text-slate-200 mb-3 flex items-center gap-2">
              <Server className="w-4 h-4 text-purple-400" />
              Detected Kubernetes Resource Manifests Breakdown
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Object.entries(techStack.kubernetes.resourceBreakdown).map(([kind, count]) => (
                <div key={kind} className="bg-slate-950/80 rounded-lg p-3 border border-slate-800 text-center">
                  <p className="text-lg font-mono font-bold text-purple-300">{count}</p>
                  <p className="text-xs text-slate-400 font-medium">{kind}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {techStack.kubernetes.manifests.map((manifest, idx) => (
              <div key={idx} className="bg-slate-900/70 rounded-xl border border-slate-800 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-500/20 rounded-lg border border-purple-500/30 text-purple-400">
                      <Server className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-100 font-mono flex items-center gap-2">
                        <span>{manifest.name}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                          {manifest.kind} ({manifest.apiVersion})
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 font-mono">{manifest.path}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => copyToClipboard(manifest.rawContent, manifest.path)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
                  >
                    {copiedPath === manifest.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    Copy YAML
                  </button>
                </div>

                <pre className="p-4 bg-slate-950 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[320px] scrollbar-thin scrollbar-thumb-slate-800">
                  <code>{manifest.rawContent}</code>
                </pre>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: INTERACTIVE FILE TREE EXPLORER */}
      {activeTab === 'filetree' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-900/70 rounded-2xl border border-slate-800 p-5">
          {/* File Tree Left Navigation */}
          <div className="lg:col-span-5 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                Repository Tree ({techStack.totalFilesScanned} files)
              </h3>
            </div>

            {/* Tree Container */}
            <div className="bg-slate-950 rounded-xl border border-slate-800/80 p-2 max-h-[560px] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
              {techStack.fileTree.map((node) => renderFileTreeNode(node))}
            </div>
          </div>

          {/* File Preview Right Pane */}
          <div className="lg:col-span-7 space-y-3">
            {selectedFile ? (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3 flex flex-col h-full min-h-[480px]">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-xs font-mono font-bold text-slate-200 truncate">{selectedFile.path}</span>
                    {getCategoryBadge(selectedFile.category)}
                  </div>
                  {selectedFile.rawContent && (
                    <button
                      onClick={() => copyToClipboard(selectedFile.rawContent || '', selectedFile.path)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-mono border border-slate-700 transition-colors"
                    >
                      {copiedPath === selectedFile.path ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      Copy Content
                    </button>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <pre className="p-4 bg-slate-900/60 rounded-xl border border-slate-800/80 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed h-[480px] scrollbar-thin scrollbar-thumb-slate-800">
                    <code>{selectedFile.rawContent || '// No preview available for this file type'}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="bg-slate-950 rounded-xl border border-slate-800 p-8 text-center flex flex-col items-center justify-center min-h-[480px]">
                <FileCode className="w-8 h-8 text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">Select any file from the tree to preview its source code.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: AI ARCHITECTURE REVIEW */}
      {activeTab === 'ai-review' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-900/80 rounded-2xl border border-cyan-500/30 p-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 rounded-xl border border-cyan-500/40 text-cyan-300">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                    <span>Cloud-Native Architecture & Readiness Report</span>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      Gemini 3.7 Flash Evaluated
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Deep evaluation of containerization, CI/CD automation, Kubernetes manifests, and security hardening.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunAiAnalysis}
                disabled={isAiAnalyzing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded-lg transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
                Re-Analyze with Gemini 3.7
              </button>
            </div>

            {/* Architecture Overview */}
            <div className="mt-5 p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-2">
              <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Architectural Overview</h4>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                {techStack.aiArchitectureSummary?.overview}
              </p>
            </div>

            {/* Maturity & Strengths */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              {/* Key Strengths */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Key Strengths & Modern Patterns
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {techStack.aiArchitectureSummary?.keyStrengths.map((st, sIdx) => (
                    <li key={sIdx} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Modernization Recommendations */}
              <div className="p-4 bg-slate-950/80 rounded-xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4" />
                  SRE Modernization Recommendations
                </h4>
                <ul className="space-y-2 text-xs text-slate-300">
                  {techStack.aiArchitectureSummary?.modernizationRecommendations.map((rec, rIdx) => (
                    <li key={rIdx} className="flex items-start gap-2">
                      <span className="text-amber-400 font-bold">➔</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
