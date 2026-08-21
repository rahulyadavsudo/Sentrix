import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock,
  Cpu,
  Flame,
  Layers,
  Network,
  Plus,
  Power,
  RotateCcw,
  Scale,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AutoHealPolicy } from '../types';

interface AutoHealPolicyEngineProps {
  policies: AutoHealPolicy[];
  onTogglePolicy: (
    policyId: string,
    enabled?: boolean,
    enforcementMode?: 'auto_execute' | 'dry_run_audit'
  ) => Promise<void>;
}

export const AutoHealPolicyEngine: React.FC<AutoHealPolicyEngineProps> = ({
  policies,
  onTogglePolicy,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingPolicyId, setEditingPolicyId] = useState<string | null>(null);

  const filteredPolicies =
    selectedCategory === 'all'
      ? policies
      : policies.filter((p) => p.category === selectedCategory);

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'memory_leak':
        return { label: 'Memory Slope', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' };
      case 'traffic_5xx':
        return { label: '5xx & Latency', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' };
      case 'crash_loop':
        return { label: 'CrashLoop Revert', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' };
      case 'ebpf_packet_drop':
        return { label: 'eBPF Socket Drop', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' };
      case 'hpa_scaling':
        return { label: 'HPA Queue Surge', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' };
      default:
        return { label: cat, color: 'bg-slate-800 text-slate-300 border-slate-700' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
            Autonomous Self-Healing Policy Engine & Guardrails
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Declarative Kubernetes remediation runbooks triggered by predictive metrics, eBPF socket events, and canary error budgets with configurable dry-run audits and rollback cooldowns.
          </p>
        </div>

        {/* Global Policy Stats */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Auto-Rules</div>
            <div className="text-sm font-bold text-cyan-400 font-mono">
              {policies.filter((p) => p.enabled).length} of {policies.length} Enforced
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedCategory === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          All Policies ({policies.length})
        </button>
        <button
          onClick={() => setSelectedCategory('memory_leak')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedCategory === 'memory_leak'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Memory Slope Watch
        </button>
        <button
          onClick={() => setSelectedCategory('traffic_5xx')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedCategory === 'traffic_5xx'
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          Canary 5xx Rollbacks
        </button>
        <button
          onClick={() => setSelectedCategory('crash_loop')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedCategory === 'crash_loop'
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          CrashLoop Reverts
        </button>
        <button
          onClick={() => setSelectedCategory('ebpf_packet_drop')}
          className={`px-3.5 py-1.5 rounded-lg font-bold transition-all ${
            selectedCategory === 'ebpf_packet_drop'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
          }`}
        >
          eBPF Node Cordon
        </button>
      </div>

      {/* Policies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPolicies.map((policy) => {
          const badge = getCategoryBadge(policy.category);
          return (
            <div
              key={policy.id}
              className={`rounded-xl border p-5 transition-all shadow-lg ${
                policy.enabled
                  ? 'bg-slate-900 border-slate-700/80 shadow-slate-950/40'
                  : 'bg-slate-900/40 border-slate-800/60 opacity-60'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.color}`}>
                      {badge.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        policy.enforcementMode === 'auto_execute'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30'
                      }`}
                    >
                      {policy.enforcementMode === 'auto_execute' ? '⚡ Auto-Execute' : '📋 Dry-Run Audit'}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mt-1">{policy.name}</h3>
                </div>

                {/* Toggle Enable/Disable */}
                <button
                  onClick={() => onTogglePolicy(policy.id, !policy.enabled)}
                  className={`p-2 rounded-xl border transition-all ${
                    policy.enabled
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                      : 'bg-slate-800 text-slate-500 border-slate-700'
                  }`}
                  title={policy.enabled ? 'Disable Policy' : 'Enable Policy'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-slate-300 mt-2.5 leading-relaxed">{policy.description}</p>

              {/* Trigger Condition & Action Box */}
              <div className="mt-4 space-y-2 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Trigger Condition</span>
                  <code className="text-cyan-300 font-mono text-[11px] mt-0.5 block">{policy.triggerCondition}</code>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Remediation Action</span>
                  <div className="text-emerald-400 font-mono text-[11px] mt-0.5 flex items-center gap-1.5">
                    <Zap className="w-3 h-3 shrink-0" />
                    <span>{policy.action}</span>
                  </div>
                </div>
              </div>

              {/* Footer Metrics & Enforcement Switcher */}
              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3 text-[11px] text-slate-400">
                  <span>Triggers: <strong className="text-white font-mono">{policy.executionCount24h}</strong> in 24h</span>
                  <span>•</span>
                  <span>Cooldown: <strong className="text-white font-mono">{policy.cooldownMinutes}m</strong></span>
                </div>

                <button
                  onClick={() =>
                    onTogglePolicy(
                      policy.id,
                      policy.enabled,
                      policy.enforcementMode === 'auto_execute' ? 'dry_run_audit' : 'auto_execute'
                    )
                  }
                  className="text-[11px] text-slate-400 hover:text-cyan-300 underline transition-colors"
                >
                  Switch to {policy.enforcementMode === 'auto_execute' ? 'Dry-Run' : 'Auto-Execute'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
