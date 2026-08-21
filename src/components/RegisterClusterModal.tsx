import React, { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Cloud,
  Code2,
  Copy,
  Cpu,
  Database,
  FileCode,
  FileText,
  Globe,
  HardDrive,
  Key,
  Layers,
  Lock,
  Radio,
  RefreshCw,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Upload,
  Wifi,
  X,
  Zap,
} from 'lucide-react';
import { ClusterFleetNode, ClusterRegistrationRequest, KubeconfigClusterValidation } from '../types';

interface RegisterClusterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClusterRegistered: (cluster: ClusterFleetNode) => void;
}

const SAMPLE_KUBECONFIGS = {
  gke: `apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://35.233.14.88:6443
  name: gke-prod-us-west1
contexts:
- context:
    cluster: gke-prod-us-west1
    user: sre-readonly-sa
    namespace: default
  name: gke-prod-us-west1-ctx
current-context: gke-prod-us-west1-ctx
users:
- name: sre-readonly-sa
  user:
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6IiJ9.eyJuYW1lc3BhY2UiOiJrdWJlLXN5c3RlbSJ9...`,
  eks: `apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://7B2F19E3.gr7.us-east-2.eks.amazonaws.com
  name: eks-production-us-east2
contexts:
- context:
    cluster: eks-production-us-east2
    user: aws-iam-sre-agent
    namespace: production
  name: eks-production-us-east2-ctx
current-context: eks-production-us-east2-ctx
users:
- name: aws-iam-sre-agent
  user:
    exec:
      apiVersion: client.authentication.k8s.io/v1beta1
      command: aws
      args: ["eks", "get-token", "--cluster-name", "eks-production-us-east2"]`,
  aks: `apiVersion: v1
kind: Config
clusters:
- cluster:
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://aks-prod-westeu-dns-82af01.hcp.westeurope.azmk8s.io:443
  name: aks-enterprise-westeurope
contexts:
- context:
    cluster: aks-enterprise-westeurope
    user: azure-sre-reader
    namespace: default
  name: aks-enterprise-westeurope-ctx
current-context: aks-enterprise-westeurope-ctx
users:
- name: azure-sre-reader
  user:
    token: eyJhbGciOiJSUzI1NiIsImtpZCI6IkF6dXJlQURfMSJ9...`,
  baremetal: `apiVersion: v1
kind: Config
clusters:
- cluster:
    insecure-skip-tls-verify: false
    certificate-authority-data: LS0tLS1CRUdJTiBDRVJUSUZJQ0FURS0tLS0tCg==
    server: https://10.200.1.10:6443
  name: talos-edge-datacenter-01
contexts:
- context:
    cluster: talos-edge-datacenter-01
    user: edge-sre-viewer
    namespace: kube-system
  name: talos-edge-dc01-ctx
current-context: talos-edge-dc01-ctx
users:
- name: edge-sre-viewer
  user:
    token: eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...`,
};

export const RegisterClusterModal: React.FC<RegisterClusterModalProps> = ({
  isOpen,
  onClose,
  onClusterRegistered,
}) => {
  const [activeTab, setActiveTab] = useState<'kubeconfig' | 'endpoint' | 'rbac-generator'>('kubeconfig');
  const [step, setStep] = useState<1 | 2>(1);

  // Form states
  const [kubeconfigText, setKubeconfigText] = useState(SAMPLE_KUBECONFIGS.gke);
  const [clusterName, setClusterName] = useState('gke-prod-us-west1');
  const [cloudProvider, setCloudProvider] = useState<'GCP (GKE)' | 'AWS (EKS)' | 'Azure (AKS)' | 'Edge BareMetal'>('GCP (GKE)');
  const [region, setRegion] = useState('us-west1 (Oregon)');
  const [environment, setEnvironment] = useState<'production' | 'staging' | 'dr-standby' | 'development'>('production');
  const [apiEndpoint, setApiEndpoint] = useState('https://35.233.14.88:6443');
  const [serviceAccountToken, setServiceAccountToken] = useState('');
  const [trafficWeight, setTrafficWeight] = useState(25);
  const [isPrimary, setIsPrimary] = useState(false);
  const [enforceReadOnlyRbac, setEnforceReadOnlyRbac] = useState(true);

  // Validation state
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<KubeconfigClusterValidation | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  // RBAC Generator states
  const [genSaName, setGenSaName] = useState('cloudops-sre-viewer');
  const [genNamespace, setGenNamespace] = useState('kube-system');
  const [generatedRbacYaml, setGeneratedRbacYaml] = useState<string>('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleLoadSample = (sampleKey: keyof typeof SAMPLE_KUBECONFIGS) => {
    const yaml = SAMPLE_KUBECONFIGS[sampleKey];
    setKubeconfigText(yaml);
    if (sampleKey === 'gke') {
      setClusterName('gke-prod-us-west1');
      setCloudProvider('GCP (GKE)');
      setRegion('us-west1 (Oregon)');
      setApiEndpoint('https://35.233.14.88:6443');
    } else if (sampleKey === 'eks') {
      setClusterName('eks-production-us-east2');
      setCloudProvider('AWS (EKS)');
      setRegion('us-east-2 (Ohio)');
      setApiEndpoint('https://7B2F19E3.gr7.us-east-2.eks.amazonaws.com');
    } else if (sampleKey === 'aks') {
      setClusterName('aks-enterprise-westeurope');
      setCloudProvider('Azure (AKS)');
      setRegion('westeurope (Amsterdam)');
      setApiEndpoint('https://aks-prod-westeu-dns-82af01.hcp.westeurope.azmk8s.io:443');
    } else if (sampleKey === 'baremetal') {
      setClusterName('talos-edge-datacenter-01');
      setCloudProvider('Edge BareMetal');
      setRegion('edge-eu-datacenter');
      setApiEndpoint('https://10.200.1.10:6443');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setKubeconfigText(content);
      }
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    setIsValidating(true);
    setValidationError(null);

    try {
      const payload = {
        authMethod: activeTab === 'kubeconfig' ? 'kubeconfig' : 'service_account',
        kubeconfigContent: activeTab === 'kubeconfig' ? kubeconfigText : undefined,
        endpoint: activeTab === 'endpoint' ? apiEndpoint : undefined,
        clusterNameInput: clusterName,
        cloudProviderInput: cloudProvider,
        regionInput: region,
      };

      const res = await fetch('/api/fleet/clusters/validate-kubeconfig', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to validate cluster configuration');
      }

      setValidationResult(data.validation);
      if (data.validation.clusterName) setClusterName(data.validation.clusterName);
      if (data.validation.cloudProvider) setCloudProvider(data.validation.cloudProvider);
      if (data.validation.region) setRegion(data.validation.region);
      if (data.validation.serverEndpoint) setApiEndpoint(data.validation.serverEndpoint);
      setStep(2);
    } catch (err: any) {
      setValidationError(err.message || 'Kubeconfig validation failed.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleRegister = async () => {
    setIsRegistering(true);
    setValidationError(null);

    try {
      const request: ClusterRegistrationRequest = {
        clusterName,
        cloudProvider,
        region,
        environment,
        kubernetesVersion: validationResult?.kubernetesVersion || 'v1.31.2',
        activeTrafficWeight: Number(trafficWeight),
        isPrimary,
        authMethod: activeTab === 'kubeconfig' ? 'kubeconfig' : 'service_account',
        apiEndpoint,
        kubeconfigContent: activeTab === 'kubeconfig' ? kubeconfigText : undefined,
        serviceAccountToken: activeTab === 'endpoint' ? serviceAccountToken : undefined,
        enforceReadOnlyRbac,
      };

      const res = await fetch('/api/fleet/clusters/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Registration failed.');
      }

      onClusterRegistered(data.registeredCluster);
      onClose();
    } catch (err: any) {
      setValidationError(err.message || 'Failed to register cluster.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGenerateRbac = async () => {
    try {
      const res = await fetch('/api/fleet/generate-rbac-manifest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceAccountName: genSaName, namespace: genNamespace }),
      });
      const data = await res.json();
      if (res.ok && data.manifestYaml) {
        setGeneratedRbacYaml(data.manifestYaml);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Register Kubernetes Cluster
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" /> Read-Only RBAC Validated
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Federate GKE, EKS, AKS, or Bare-Metal clusters into the CloudOps SRE Telemetry plane.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Steps Navigation Bar */}
        <div className="bg-slate-950/60 px-6 py-2.5 border-b border-slate-800/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setStep(1)}
              className={`flex items-center gap-2 font-semibold transition-all ${
                step === 1 ? 'text-cyan-400' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 1 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                1
              </span>
              <span>Credentials &amp; Endpoint</span>
            </button>

            <ChevronRight className="w-4 h-4 text-slate-600" />

            <button
              onClick={() => validationResult && setStep(2)}
              disabled={!validationResult}
              className={`flex items-center gap-2 font-semibold transition-all ${
                step === 2 ? 'text-cyan-400' : validationResult ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 opacity-50'
              }`}
            >
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                step === 2 ? 'bg-cyan-500 text-slate-950' : 'bg-slate-800 text-slate-400'
              }`}>
                2
              </span>
              <span>RBAC Preflight &amp; Federation</span>
            </button>
          </div>

          {/* Mode Tabs */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
            <button
              onClick={() => { setActiveTab('kubeconfig'); setStep(1); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'kubeconfig'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Kubeconfig YAML
            </button>
            <button
              onClick={() => { setActiveTab('endpoint'); setStep(1); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'endpoint'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              API Endpoint &amp; Token
            </button>
            <button
              onClick={() => { setActiveTab('rbac-generator'); if (!generatedRbacYaml) handleGenerateRbac(); }}
              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                activeTab === 'rbac-generator'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              SRE RBAC Generator
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {validationError && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Validation Error:</span> {validationError}
              </div>
            </div>
          )}

          {/* TAB 1: Kubeconfig Input */}
          {activeTab === 'kubeconfig' && step === 1 && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <FileCode className="w-4 h-4 text-cyan-400" />
                    Kubeconfig YAML Configuration
                  </label>
                  <p className="text-[11px] text-slate-400">
                    Paste your kubeconfig or drag-and-drop your cluster config file.
                  </p>
                </div>

                {/* Quick preset selector & file upload */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500">Presets:</span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleLoadSample('gke')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-cyan-300 border border-slate-700"
                    >
                      GKE
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('eks')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-amber-300 border border-slate-700"
                    >
                      EKS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('aks')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-blue-300 border border-slate-700"
                    >
                      AKS
                    </button>
                    <button
                      type="button"
                      onClick={() => handleLoadSample('baremetal')}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[10px] font-mono text-purple-300 border border-slate-700"
                    >
                      BareMetal
                    </button>
                  </div>

                  <label className="ml-2 px-2.5 py-1 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-[11px] font-bold cursor-pointer flex items-center gap-1 transition-all shadow-sm">
                    <Upload className="w-3 h-3" />
                    <span>Upload File</span>
                    <input
                      type="file"
                      accept=".yaml,.yml,.json,.kubeconfig,config"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Textarea Editor */}
              <div className="relative">
                <textarea
                  value={kubeconfigText}
                  onChange={(e) => setKubeconfigText(e.target.value)}
                  rows={11}
                  className="w-full bg-slate-950 font-mono text-xs text-slate-200 p-3.5 rounded-xl border border-slate-800 focus:border-cyan-500/80 focus:ring-1 focus:ring-cyan-500/50 outline-none leading-relaxed selection:bg-cyan-500/30"
                  placeholder="apiVersion: v1&#10;kind: Config&#10;clusters: ..."
                />
              </div>

              {/* Security Hint */}
              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-400">
                <Lock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <span className="text-slate-200 font-semibold">Zero-Write Least-Privilege Protection:</span> Credentials are parsed in-memory and evaluated via simulated <code className="text-cyan-300 font-mono text-[11px]">SelfSubjectAccessReview</code>. CloudOps SRE never writes or alters Kubernetes workloads.
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Direct API Endpoint & Token */}
          {activeTab === 'endpoint' && step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cluster Display Name</label>
                  <input
                    type="text"
                    value={clusterName}
                    onChange={(e) => setClusterName(e.target.value)}
                    placeholder="e.g. gke-production-us-west1"
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Cloud Provider</label>
                  <select
                    value={cloudProvider}
                    onChange={(e) => setCloudProvider(e.target.value as any)}
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none"
                  >
                    <option value="GCP (GKE)">Google Cloud Platform (GKE)</option>
                    <option value="AWS (EKS)">Amazon Web Services (EKS)</option>
                    <option value="Azure (AKS)">Microsoft Azure (AKS)</option>
                    <option value="Edge BareMetal">Bare-Metal / Edge / k3s</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Region / Zone</label>
                  <input
                    type="text"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    placeholder="e.g. us-west1 (Oregon)"
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Environment Tier</label>
                  <select
                    value={environment}
                    onChange={(e) => setEnvironment(e.target.value as any)}
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none"
                  >
                    <option value="production">Production (Mission-Critical)</option>
                    <option value="staging">Staging / Pre-Production</option>
                    <option value="dr-standby">Disaster Recovery (DR Standby)</option>
                    <option value="development">Development / Edge Sandbox</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Kubernetes API Server Endpoint URL
                </label>
                <input
                  type="text"
                  value={apiEndpoint}
                  onChange={(e) => setApiEndpoint(e.target.value)}
                  placeholder="https://api.k8s.cloudops.internal:6443"
                  className="w-full bg-slate-950 text-xs font-mono text-cyan-300 px-3 py-2 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1 flex items-center justify-between">
                  <span>ServiceAccount Bearer Token</span>
                  <span className="text-[10px] text-slate-500 font-normal">JWT token with Read-Only ClusterRole</span>
                </label>
                <textarea
                  value={serviceAccountToken}
                  onChange={(e) => setServiceAccountToken(e.target.value)}
                  rows={3}
                  placeholder="eyJhbGciOiJSUzI1NiIsImtpZCI6Ii..."
                  className="w-full bg-slate-950 text-xs font-mono text-slate-300 px-3 py-2 rounded-lg border border-slate-800 focus:border-cyan-500 outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: RBAC Preflight Inspection Results */}
          {step === 2 && validationResult && (
            <div className="space-y-4">
              {/* Top Inspection Banner */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Wifi className="w-5 h-5 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{validationResult.clusterName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        {validationResult.cloudProvider}
                      </span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                      <span>{validationResult.region}</span>
                      <span>&bull;</span>
                      <span className="text-cyan-300 font-mono">{validationResult.kubernetesVersion}</span>
                      <span>&bull;</span>
                      <span className="text-emerald-400 font-medium">{validationResult.pingLatencyMs}ms ping</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    TLS 1.3 Certified
                  </span>
                </div>
              </div>

              {/* RBAC Security Evaluation Card */}
              <div className={`p-4 rounded-xl border ${
                validationResult.rbacAudit.status === 'WARN_CLUSTER_ADMIN'
                  ? 'bg-amber-500/5 border-amber-500/30'
                  : 'bg-emerald-500/5 border-emerald-500/30'
              }`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    {validationResult.rbacAudit.status === 'WARN_CLUSTER_ADMIN' ? (
                      <ShieldAlert className="w-5 h-5 text-amber-400" />
                    ) : (
                      <ShieldCheck className="w-5 h-5 text-emerald-400" />
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-white">
                        {validationResult.rbacAudit.status === 'WARN_CLUSTER_ADMIN'
                          ? 'Security Notice: Cluster-Admin Permissions Detected'
                          : 'Read-Only Least-Privilege Verification: PASS'}
                      </h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {validationResult.rbacAudit.status === 'WARN_CLUSTER_ADMIN'
                          ? 'This token possesses mutation verbs (write/delete). We recommend generating a restricted SRE Read-Only role.'
                          : 'Credential has restricted read-only permissions across Pods, Nodes, Metrics, and Ingress resources.'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-mono font-bold text-slate-300">
                    {validationResult.rbacAudit.allowedResourcesCount} Resources Audited
                  </span>
                </div>

                {/* Permission Matrix */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Core API</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" /> get, list, watch
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Apps &amp; Deployments</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" /> get, list, watch
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Metrics &amp; HPA</span>
                    <span className="text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                      <Check className="w-3 h-3" /> get, list, watch
                    </span>
                  </div>
                  <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                    <span className="text-[10px] text-slate-500 block uppercase font-semibold">Mutations / Deletions</span>
                    <span className={`font-bold flex items-center gap-1 mt-0.5 ${
                      validationResult.rbacAudit.hasDangerousWrite ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {validationResult.rbacAudit.hasDangerousWrite ? 'Active (Admin Token)' : 'Restricted (Zero Write)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Federation Ingress Configuration */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
                <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  Fleet Federation &amp; Traffic Ingress Configuration
                </h4>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">Initial Traffic Weight</span>
                    <span className="font-mono font-bold text-cyan-300">{trafficWeight}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={trafficWeight}
                    onChange={(e) => setTrafficWeight(Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Standby / Cold)</span>
                    <span>50% (Active-Active)</span>
                    <span>100% (Solo Primary)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                  <div>
                    <span className="text-xs font-bold text-slate-200 block">Designate as Primary Active Ingress</span>
                    <span className="text-[11px] text-slate-400">Direct default global DNS / CDN traffic to this cluster.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPrimary(!isPrimary)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                      isPrimary ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
                    }`}
                  >
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SRE RBAC Generator Tool */}
          {activeTab === 'rbac-generator' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-bold text-white">Least-Privilege Kubernetes RBAC Policy</h4>
                  <p className="text-[11px] text-purple-300 mt-0.5">
                    Generate production-grade YAML to grant CloudOps read-only observability access with zero write permissions.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">ServiceAccount Name</label>
                  <input
                    type="text"
                    value={genSaName}
                    onChange={(e) => setGenSaName(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:border-purple-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 block mb-1">Target Namespace</label>
                  <input
                    type="text"
                    value={genNamespace}
                    onChange={(e) => setGenNamespace(e.target.value)}
                    className="w-full bg-slate-950 text-xs text-white px-3 py-2 rounded-lg border border-slate-800 focus:border-purple-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleGenerateRbac}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-sm"
                >
                  Regenerate Manifest YAML
                </button>

                <button
                  type="button"
                  onClick={() => handleCopy(generatedRbacYaml)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-all"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied to Clipboard!' : 'Copy YAML'}</span>
                </button>
              </div>

              <textarea
                value={generatedRbacYaml}
                readOnly
                rows={10}
                className="w-full bg-slate-950 font-mono text-xs text-purple-200 p-3.5 rounded-xl border border-slate-800 outline-none leading-relaxed"
              />

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-slate-400">
                  <Terminal className="w-4 h-4 text-cyan-400" />
                  <span className="font-mono text-[11px] text-slate-300">
                    kubectl apply -f https://raw.githubusercontent.com/cloudops/sre/main/rbac-readonly.yaml
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy('kubectl apply -f https://raw.githubusercontent.com/cloudops/sre/main/rbac-readonly.yaml')}
                  className="text-cyan-400 hover:text-cyan-300 text-xs font-bold"
                >
                  Copy Command
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 px-6 py-4 border-t border-slate-800 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 transition-all"
              >
                Back to Config
              </button>
            )}

            {step === 1 && activeTab !== 'rbac-generator' && (
              <button
                type="button"
                onClick={handleValidate}
                disabled={isValidating}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-xs font-bold text-white transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50"
              >
                {isValidating ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Auditing RBAC &amp; Latency...</span>
                  </>
                ) : (
                  <>
                    <span>Validate &amp; Inspect RBAC</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleRegister}
                disabled={isRegistering}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {isRegistering ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Federating Cluster...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Federate &amp; Register Cluster</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
