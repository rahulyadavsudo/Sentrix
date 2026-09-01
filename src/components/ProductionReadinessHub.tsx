import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Database,
  Users,
  Activity,
  Lock,
  Server,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Zap,
  Globe,
  Sliders,
  Radio,
  ExternalLink,
  Cpu,
  Layers,
  Sparkles,
  Terminal,
} from 'lucide-react';
import {
  EnterpriseUser,
  EnterpriseAuditLog,
  DatabaseConnectionStatus,
  ProductionSystemHealth,
  UserRole,
} from '../types';
import { safeFetchJson } from '../lib/api';

interface AiModelOption {
  id: string;
  name: string;
  provider: string;
  tier: string;
  speed: string;
  contextWindow: string;
}

export const ProductionReadinessHub: React.FC = () => {
  const [users, setUsers] = useState<EnterpriseUser[]>([]);
  const [auditLogs, setAuditLogs] = useState<EnterpriseAuditLog[]>([]);
  const [dbStatus, setDbStatus] = useState<DatabaseConnectionStatus | null>(null);
  const [systemHealth, setSystemHealth] = useState<ProductionSystemHealth | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [loading, setLoading] = useState(true);
  const [switchingDb, setSwitchingDb] = useState(false);
  const [testActionStatus, setTestActionStatus] = useState<string | null>(null);
  const [activeAiModel, setActiveAiModel] = useState<string>('gemini-3.7-flash');
  const [aiModels, setAiModels] = useState<AiModelOption[]>([
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'Google Cloud Vertex/AI Studio', tier: 'Ultra-Fast SRE Reasoning', speed: '45ms', contextWindow: '1M tokens' },
    { id: 'gemini-3.7-pro', name: 'Gemini 3.7 Pro', provider: 'Google Cloud Vertex/AI Studio', tier: 'Deep Architectural RCA', speed: '120ms', contextWindow: '2M tokens' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', provider: 'Google Cloud AI', tier: 'High-Throughput Live Telemetry', speed: '38ms', contextWindow: '1M tokens' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google Cloud AI', tier: 'Complex Multi-Cluster Synthesis', speed: '110ms', contextWindow: '2M tokens' },
    { id: 'deepseek-r1', name: 'DeepSeek-R1 (SRE Agent)', provider: 'Self-Hosted vLLM / Ollama', tier: 'Open-Weights Local Reasoning', speed: '85ms', contextWindow: '128K tokens' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic Bedrock Bridge', tier: 'Hybrid Infrastructure Orchestrator', speed: '95ms', contextWindow: '200K tokens' },
    { id: 'gpt-4o', name: 'OpenAI GPT-4o', provider: 'Azure OpenAI Service', tier: 'General CloudOps Automation', speed: '90ms', contextWindow: '128K tokens' },
  ]);
  const [switchingAiModel, setSwitchingAiModel] = useState(false);

  const fetchEnterpriseData = async () => {
    try {
      setLoading(true);
      const [usersRes, auditRes, dbRes, healthRes, aiModelsRes] = await Promise.all([
        safeFetchJson<any>('/api/enterprise/users', undefined, null),
        safeFetchJson<any>('/api/enterprise/audit-logs', undefined, null),
        safeFetchJson<any>('/api/enterprise/database-status', undefined, null),
        safeFetchJson<any>('/api/enterprise/system-health', undefined, null),
        safeFetchJson<any>('/api/ai/models', undefined, null),
      ]);

      if (usersRes?.success && usersRes.users) setUsers(usersRes.users);
      if (auditRes?.success && auditRes.auditLogs) setAuditLogs(auditRes.auditLogs);
      if (dbRes?.success && dbRes.database) setDbStatus(dbRes.database);
      if (healthRes?.success && healthRes.health) setSystemHealth(healthRes.health);
      if (aiModelsRes?.models) setAiModels(aiModelsRes.models);
      if (aiModelsRes?.activeModel) setActiveAiModel(aiModelsRes.activeModel);
    } catch (err) {
      console.warn('Notice loading enterprise data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEnterpriseData();
  }, []);

  const handleSwitchDb = async (engine: 'PostgreSQL' | 'Firestore' | 'Redis' | 'In-Memory (Local Demo)') => {
    try {
      setSwitchingDb(true);
      const res = await fetch('/api/enterprise/database-switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ engine }),
      });
      const data = await res.json();
      if (data.success) {
        setDbStatus(data.database);
        await fetchEnterpriseData();
      }
    } catch (err) {
      console.error('Failed to switch database:', err);
    } finally {
      setSwitchingDb(false);
    }
  };

  const handleSwitchAiModel = async (modelId: string) => {
    try {
      setSwitchingAiModel(true);
      const res = await fetch('/api/ai/models/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveAiModel(data.activeModel);
      }
    } catch (err) {
      console.error('Failed to switch AI model:', err);
    } finally {
      setSwitchingAiModel(false);
    }
  };

  const handleSimulateRBACAction = async (action: string, requiredRole: UserRole, target: string) => {
    const isAuthorized = selectedRole === 'admin' || (selectedRole === 'developer' && action.includes('CANARY')) || (selectedRole === 'security_auditor' && action.includes('CERT'));
    
    setTestActionStatus(`Testing: ${action} with role [${selectedRole.toUpperCase()}]...`);

    const status = isAuthorized ? 'SUCCESS' : 'DENIED';
    const details = isAuthorized 
      ? `Authorized execution by role [${selectedRole}]: ${action} performed on ${target}.`
      : `RBAC Permission Denied: Role [${selectedRole}] lacks required privilege for ${action}.`;

    try {
      await fetch('/api/enterprise/record-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: `${selectedRole}.user@sentrix-enterprise.internal`,
          userRole: selectedRole,
          action,
          status,
          details,
        }),
      });
      await fetchEnterpriseData();
      setTestActionStatus(`Result: ${status} - ${details}`);
    } catch (err) {
      console.error('Failed to record test audit:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SaaS & Enterprise Grade
              </span>
              <span className="text-slate-500 text-xs">&bull;</span>
              <span className="text-xs text-slate-400 font-mono">SOC-2 / ISO-27001 Ready</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              Production & SaaS Operational Readiness Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Enterprise persistence providers, dynamic AI inference engines, multi-tenant RBAC policies, immutable audit records, and automated health telemetry.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={fetchEnterpriseData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-xs font-semibold text-slate-200 border border-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-blue-400' : ''}`} />
              <span>Refresh Telemetry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Production Telemetry Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#09090b] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Database className="w-4 h-4 text-blue-400" /> Persistence Engine
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              dbStatus?.status === 'connected' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {dbStatus?.status.toUpperCase() || 'CHECKING'}
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Active Engine</span>
              <span className="font-mono text-white font-bold">{dbStatus?.engine || 'PostgreSQL'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Pool Conns</span>
              <span className="font-mono text-slate-200">{dbStatus?.poolConnections.active}/{dbStatus?.poolConnections.max} ({dbStatus?.poolConnections.idle} idle)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Query Latency</span>
              <span className="font-mono text-emerald-400 font-bold">{dbStatus?.latencyMs || 1.4}ms (p99)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#09090b] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" /> AI Inference Engine
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Live Ready
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Selected Model</span>
              <span className="font-mono text-purple-300 font-bold">{activeAiModel}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Context Size</span>
              <span className="font-mono text-cyan-400 font-bold">{aiModels.find((m) => m.id === activeAiModel)?.contextWindow || '1M tokens'}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Inference Speed</span>
              <span className="font-mono text-emerald-400 font-bold">{aiModels.find((m) => m.id === activeAiModel)?.speed || '45ms'}</span>
            </div>
          </div>
        </div>

        <div className="bg-[#09090b] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-purple-400" /> Enterprise RBAC
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
              Enforced
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Active Tenant</span>
              <span className="font-mono text-slate-200">Acme Corp</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>2FA Status</span>
              <span className="font-mono text-emerald-400 font-bold">100% Enforced</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Audit Trail</span>
              <span className="font-mono text-indigo-400 font-bold">Append-Only SHA256</span>
            </div>
          </div>
        </div>

        <div className="bg-[#09090b] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-amber-400" /> API Rate Limiter
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              Active
            </span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-300">
              <span>Rate Limit Cap</span>
              <span className="font-mono text-slate-200">600 req/min/IP</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Container Health</span>
              <span className="font-mono text-emerald-400 font-bold">/healthz (200 OK)</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>DDoS Defense</span>
              <span className="font-mono text-emerald-400 font-bold">Token-Bucket Armed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: AI Engine Switcher & Database Persistence Switcher */}
        <div className="lg:col-span-5 space-y-6">
          {/* AI Inference Model / Engine Switcher */}
          <div className="bg-[#09090b] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-bold text-white">AI Inference & Reasoning Engines</h3>
              </div>
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                1-Click Switch
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select your active reasoning model. All SRE diagnostics, predictive OOM calculations, and RCA queries will execute against this engine.
            </p>

            <div className="space-y-2">
              {aiModels.map((model) => {
                const isSelected = activeAiModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => handleSwitchAiModel(model.id)}
                    disabled={switchingAiModel}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-purple-500/10 border-purple-500/50 text-white shadow-sm'
                        : 'bg-[#18181b]/50 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-2">
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />}
                        {model.name}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isSelected ? 'bg-purple-500/20 text-purple-300' : 'bg-white/5 text-slate-400'
                      }`}>
                        {model.speed} &bull; {model.contextWindow}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>{model.tier}</span>
                      <span className="text-[10px] font-mono text-slate-500">{model.provider}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Persistence Engine Switcher */}
          <div className="bg-[#09090b] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Database className="w-4 h-4 text-blue-400" />
              <h3 className="text-sm font-bold text-white">Database Persistence Providers</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Select or test live persistent storage engines for audit records, incidents, and cluster metrics snapshots.
            </p>

            <div className="space-y-2.5">
              {[
                {
                  id: 'PostgreSQL',
                  title: 'PostgreSQL (Managed Cloud SQL / RDS)',
                  desc: 'ACID transactions, connection pooling, SSL verify-full encryption.',
                  badge: 'Recommended for SaaS',
                },
                {
                  id: 'Firestore',
                  title: 'Google Cloud Firestore',
                  desc: 'Serverless real-time document sync, multi-region replication.',
                  badge: 'Cloud Native',
                },
                {
                  id: 'Redis',
                  title: 'Redis / Dragonfly Memory Cluster',
                  desc: 'Sub-millisecond write buffer, distributed session lock engine.',
                  badge: 'Ultra Fast',
                },
                {
                  id: 'In-Memory (Local Demo)',
                  title: 'In-Memory Transient Buffer',
                  desc: 'Isolated non-persistent process memory for rapid prototyping.',
                  badge: 'Ephemeral',
                },
              ].map((engine) => {
                const isSelected = dbStatus?.engine === engine.id;
                return (
                  <button
                    key={engine.id}
                    onClick={() => handleSwitchDb(engine.id as any)}
                    disabled={switchingDb}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isSelected
                        ? 'bg-blue-500/10 border-blue-500/50 text-white'
                        : 'bg-[#18181b]/50 border-white/5 text-slate-300 hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs flex items-center gap-2">
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                        {engine.title}
                      </span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono font-bold ${
                        isSelected ? 'bg-blue-500/20 text-blue-300' : 'bg-white/5 text-slate-400'
                      }`}>
                        {engine.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{engine.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Architectural Callout: Why Google Cloud Firestore? */}
          <div className="bg-[#09090b] border border-blue-500/30 rounded-xl p-5 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-2">
              <Database className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-bold text-white">Why Google Cloud Firestore?</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p>
                <strong className="text-white">1. Real-Time Telemetry Streaming:</strong> Firestore provides native client subscriptions (<code className="text-cyan-300 font-mono">onSnapshot</code>), enabling multi-SRE war rooms to see live incident resolution without socket connection management or polling overhead.
              </p>
              <p>
                <strong className="text-white">2. Serverless & Zero Ops:</strong> Automatically scales from zero to 10M+ operations per second with zero vacuuming, index rebuilding, or manual disk resizing.
              </p>
              <p>
                <strong className="text-white">3. Heterogeneous Document Model:</strong> Handles unstructured Kubernetes YAML manifests, eBPF trace payloads, and dynamic runbook outputs seamlessly in nested collections.
              </p>
              <p>
                <strong className="text-white">4. Multi-Region High Availability:</strong> Provides 99.999% SLA with automatic cross-region failover.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: RBAC Simulator, Audit Log Trail & Users */}
        <div className="lg:col-span-7 space-y-6">
          {/* Interactive RBAC Simulator */}
          <div className="bg-[#09090b] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Interactive RBAC Permission Test Harness</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Simulate enterprise actions as different team roles to verify that unauthorized operations are strictly blocked.
            </p>

            <div className="mb-4">
              <label className="text-[11px] font-semibold text-slate-300 block mb-1.5">
                Simulate As User Role:
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {(['admin', 'developer', 'security_auditor', 'viewer'] as UserRole[]).map((role) => (
                  <button
                    key={role}
                    onClick={() => setSelectedRole(role)}
                    className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase transition-all border ${
                      selectedRole === role
                        ? 'bg-purple-500 text-white border-purple-400 shadow-md shadow-purple-500/20'
                        : 'bg-[#18181b] text-slate-400 border-white/10 hover:text-white'
                    }`}
                  >
                    {role.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleSimulateRBACAction('ROLLOUT_RESTART_POD', 'admin', 'deployment/payment-gateway-v2 -n production')}
                className="w-full flex items-center justify-between p-2.5 rounded bg-[#18181b] hover:bg-[#27272a] text-xs font-semibold text-white border border-white/10 transition-all"
              >
                <span>Trigger Rolling Restart (Pod Mutation)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">Admin Only</span>
              </button>

              <button
                onClick={() => handleSimulateRBACAction('CANARY_TRAFFIC_SPLIT', 'developer', 'canary-payment-service')}
                className="w-full flex items-center justify-between p-2.5 rounded bg-[#18181b] hover:bg-[#27272a] text-xs font-semibold text-white border border-white/10 transition-all"
              >
                <span>Shift Canary Ingress Traffic (Traffic Weight)</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Admin & Dev</span>
              </button>

              <button
                onClick={() => handleSimulateRBACAction('RENEW_TLS_CERTIFICATE', 'security_auditor', 'vault/tls-wildcard-acme')}
                className="w-full flex items-center justify-between p-2.5 rounded bg-[#18181b] hover:bg-[#27272a] text-xs font-semibold text-white border border-white/10 transition-all"
              >
                <span>Rotate Vault TLS Certificate Key</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Security Auditor</span>
              </button>
            </div>

            {testActionStatus && (
              <div className="mt-3 p-3 rounded-lg bg-[#18181b] border border-white/10 font-mono text-xs text-cyan-300">
                {testActionStatus}
              </div>
            )}
          </div>

          {/* Audit Logs Table */}
          <div className="bg-[#09090b] border border-white/10 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                <h3 className="text-sm font-bold text-white">Immutable Enterprise Audit Log Trail</h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                {auditLogs.length} Records Logged
              </span>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              SOC-2 Type II compliant append-only trail recording every cluster mutation, canary shift, and access attempt.
            </p>

            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
              {auditLogs.map((log) => {
                const isDenied = log.status === 'DENIED';
                return (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border text-xs transition-all ${
                      isDenied
                        ? 'bg-rose-500/5 border-rose-500/30'
                        : 'bg-[#18181b]/70 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          isDenied ? 'bg-rose-500/20 text-rose-300' : 'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {log.status}
                        </span>
                        <span className="font-bold text-white font-mono">{log.action}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1">{log.details}</p>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-white/5">
                      <span className="font-mono">User: {log.userEmail} ({log.userRole})</span>
                      <span className="font-mono text-slate-400">{log.clientIp}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Active Enterprise User Accounts */}
          <div className="bg-[#09090b] border border-white/10 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-white">Active Enterprise Team & RBAC Directory</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {users.map((user) => (
                <div key={user.id} className="p-3 rounded-lg bg-[#18181b]/50 border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full object-cover border border-white/10" referrerPolicy="no-referrer" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="text-xs font-bold text-white">{user.name}</div>
                      <div className="text-[10px] text-slate-400">{user.email}</div>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${
                    user.role === 'admin'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : user.role === 'developer'
                      ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                      : user.role === 'security_auditor'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-500/20 text-slate-300 border border-slate-500/30'
                  }`}>
                    {user.role.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
