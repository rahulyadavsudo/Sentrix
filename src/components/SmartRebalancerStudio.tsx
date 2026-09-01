import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bot,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Layers,
  MoveRight,
  Play,
  RefreshCw,
  Server,
  ShieldAlert,
  Sparkles,
  Zap,
} from 'lucide-react';

export interface ThrottledPod {
  id: string;
  name: string;
  namespace: string;
  serviceName: string;
  cfsThrottledPercentage: number;
  cpuUsageCores: number;
  cpuLimitCores: number;
  p99LatencyMs: number;
  currentNode: string;
  targetNode: string;
  status: 'throttled' | 'evicting' | 'migrating' | 'balanced' | 'nominal';
  recommendedLimit: number;
}

export interface ClusterNodeInfo {
  name: string;
  zone: string;
  provider: 'EKS' | 'GKE' | 'AKS';
  cpuAllocatedPct: number;
  memAllocatedPct: number;
  totalPods: number;
  isHotSpot: boolean;
}

interface SmartRebalancerProps {
  theme?: 'dark' | 'light';
}

export const SmartRebalancerStudio: React.FC<SmartRebalancerProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  const [nodes, setNodes] = useState<ClusterNodeInfo[]>([
    { name: 'gke-node-pool-1-hot', zone: 'us-west1-a', provider: 'GKE', cpuAllocatedPct: 91, memAllocatedPct: 84, totalPods: 28, isHotSpot: true },
    { name: 'gke-node-pool-1-warm', zone: 'us-west1-b', provider: 'GKE', cpuAllocatedPct: 62, memAllocatedPct: 58, totalPods: 16, isHotSpot: false },
    { name: 'gke-node-pool-2-cool', zone: 'us-west1-c', provider: 'GKE', cpuAllocatedPct: 24, memAllocatedPct: 32, totalPods: 7, isHotSpot: false },
    { name: 'eks-node-worker-03', zone: 'us-east-1a', provider: 'EKS', cpuAllocatedPct: 88, memAllocatedPct: 79, totalPods: 22, isHotSpot: true },
    { name: 'aks-pool-green-01', zone: 'westeurope-1', provider: 'AKS', cpuAllocatedPct: 35, memAllocatedPct: 41, totalPods: 11, isHotSpot: false },
  ]);

  const [throttledPods, setThrottledPods] = useState<ThrottledPod[]>([
    {
      id: 'pod-pay-9x',
      name: 'payment-gateway-6b7df-k29z',
      namespace: 'production',
      serviceName: 'payment-gateway',
      cfsThrottledPercentage: 68.4,
      cpuUsageCores: 0.49,
      cpuLimitCores: 0.5,
      p99LatencyMs: 420,
      currentNode: 'gke-node-pool-1-hot',
      targetNode: 'gke-node-pool-2-cool',
      status: 'throttled',
      recommendedLimit: 1.0,
    },
    {
      id: 'pod-ord-3w',
      name: 'order-processor-78cf4-m9pl',
      namespace: 'production',
      serviceName: 'order-processor',
      cfsThrottledPercentage: 54.1,
      cpuUsageCores: 0.98,
      cpuLimitCores: 1.0,
      p99LatencyMs: 310,
      currentNode: 'eks-node-worker-03',
      targetNode: 'aks-pool-green-01',
      status: 'throttled',
      recommendedLimit: 1.5,
    },
    {
      id: 'pod-auth-1a',
      name: 'auth-service-5f8d2-qx88',
      namespace: 'production',
      serviceName: 'auth-service',
      cfsThrottledPercentage: 42.8,
      cpuUsageCores: 0.44,
      cpuLimitCores: 0.5,
      p99LatencyMs: 195,
      currentNode: 'gke-node-pool-1-hot',
      targetNode: 'gke-node-pool-2-cool',
      status: 'throttled',
      recommendedLimit: 0.75,
    },
  ]);

  const [isRebalancing, setIsRebalancing] = useState(false);
  const [rebalanceStage, setRebalanceStage] = useState<string>('idle');
  const [aiRationale, setAiRationale] = useState<string>('');

  const runRebalanceWorkflow = () => {
    setIsRebalancing(true);
    setRebalanceStage('evaluating_pdb');
    setAiRationale('Analyzing PodDisruptionBudgets (PDB), node affinity & eBPF CFS kernel throttle patterns...');

    setTimeout(() => {
      setRebalanceStage('evicting');
      setThrottledPods((prev) =>
        prev.map((p) => ({ ...p, status: 'evicting' }))
      );
      setAiRationale('Executing graceful evictions via Kubernetes Eviction API. Drain signal dispatched without dropping active sockets.');
    }, 1400);

    setTimeout(() => {
      setRebalanceStage('migrating');
      setThrottledPods((prev) =>
        prev.map((p) => ({ ...p, status: 'migrating' }))
      );
      setAiRationale('Binding replacement replicas on cool nodes (gke-node-pool-2-cool & aks-pool-green-01) with auto-patched CFS limits.');
    }, 3000);

    setTimeout(() => {
      setRebalanceStage('complete');
      setThrottledPods((prev) =>
        prev.map((p) => ({
          ...p,
          status: 'balanced',
          cfsThrottledPercentage: 0.2,
          p99LatencyMs: 18,
          cpuLimitCores: p.recommendedLimit,
          currentNode: p.targetNode,
        }))
      );
      setNodes((prev) =>
        prev.map((n) => {
          if (n.name === 'gke-node-pool-1-hot') return { ...n, cpuAllocatedPct: 54, isHotSpot: false, totalPods: 20 };
          if (n.name === 'eks-node-worker-03') return { ...n, cpuAllocatedPct: 58, isHotSpot: false, totalPods: 18 };
          if (n.name === 'gke-node-pool-2-cool') return { ...n, cpuAllocatedPct: 48, totalPods: 13 };
          if (n.name === 'aks-pool-green-01') return { ...n, cpuAllocatedPct: 49, totalPods: 14 };
          return n;
        })
      );
      setAiRationale('Fleet Rebalanced Successfully: Throttling reduced from 68% -> 0.2%, p99 latency stabilized at 18ms across all microservices.');
      setIsRebalancing(false);
    }, 4800);
  };

  const resetSimulation = () => {
    setThrottledPods([
      {
        id: 'pod-pay-9x',
        name: 'payment-gateway-6b7df-k29z',
        namespace: 'production',
        serviceName: 'payment-gateway',
        cfsThrottledPercentage: 68.4,
        cpuUsageCores: 0.49,
        cpuLimitCores: 0.5,
        p99LatencyMs: 420,
        currentNode: 'gke-node-pool-1-hot',
        targetNode: 'gke-node-pool-2-cool',
        status: 'throttled',
        recommendedLimit: 1.0,
      },
      {
        id: 'pod-ord-3w',
        name: 'order-processor-78cf4-m9pl',
        namespace: 'production',
        serviceName: 'order-processor',
        cfsThrottledPercentage: 54.1,
        cpuUsageCores: 0.98,
        cpuLimitCores: 1.0,
        p99LatencyMs: 310,
        currentNode: 'eks-node-worker-03',
        targetNode: 'aks-pool-green-01',
        status: 'throttled',
        recommendedLimit: 1.5,
      },
      {
        id: 'pod-auth-1a',
        name: 'auth-service-5f8d2-qx88',
        namespace: 'production',
        serviceName: 'auth-service',
        cfsThrottledPercentage: 42.8,
        cpuUsageCores: 0.44,
        cpuLimitCores: 0.5,
        p99LatencyMs: 195,
        currentNode: 'gke-node-pool-1-hot',
        targetNode: 'gke-node-pool-2-cool',
        status: 'throttled',
        recommendedLimit: 0.75,
      },
    ]);
    setNodes([
      { name: 'gke-node-pool-1-hot', zone: 'us-west1-a', provider: 'GKE', cpuAllocatedPct: 91, memAllocatedPct: 84, totalPods: 28, isHotSpot: true },
      { name: 'gke-node-pool-1-warm', zone: 'us-west1-b', provider: 'GKE', cpuAllocatedPct: 62, memAllocatedPct: 58, totalPods: 16, isHotSpot: false },
      { name: 'gke-node-pool-2-cool', zone: 'us-west1-c', provider: 'GKE', cpuAllocatedPct: 24, memAllocatedPct: 32, totalPods: 7, isHotSpot: false },
      { name: 'eks-node-worker-03', zone: 'us-east-1a', provider: 'EKS', cpuAllocatedPct: 88, memAllocatedPct: 79, totalPods: 22, isHotSpot: true },
      { name: 'aks-pool-green-01', zone: 'westeurope-1', provider: 'AKS', cpuAllocatedPct: 35, memAllocatedPct: 41, totalPods: 11, isHotSpot: false },
    ]);
    setRebalanceStage('idle');
    setAiRationale('');
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-2xl border backdrop-blur-md relative overflow-hidden ${
          isLight
            ? 'bg-gradient-to-r from-emerald-50 via-white to-slate-50 border-emerald-200 shadow-xs'
            : 'bg-gradient-to-r from-[#0c161a] via-[#0d131f] to-[#0a0d14] border-[#1d273a] shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Gauge className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold tracking-tight">
                Resource Throttling & Smart Cluster Rebalancer
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                CFS & eBPF Live
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-3xl">
              Detects container CPU throttling (CFS quota penalties) and noisy neighbor hot spots across GKE, EKS, and AKS. Autonomous rebalancer coordinates zero-downtime pod migrations to underutilized worker nodes.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={resetSimulation}
              className={`px-3.5 py-2 rounded-xl border text-xs font-bold transition-colors cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-[#141926] hover:bg-[#1b2234] border-[#222b40] text-slate-300'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5 inline mr-1.5" />
              Reset State
            </button>

            <button
              type="button"
              disabled={isRebalancing}
              onClick={runRebalanceWorkflow}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-900/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isRebalancing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>{isRebalancing ? 'Rebalancing Fleet...' : 'Execute Smart Rebalance'}</span>
            </button>
          </div>
        </div>

        {/* Live Rebalance Stage Indicator */}
        <AnimatePresence>
          {aiRationale && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`mt-4 p-3 rounded-xl border text-xs font-mono flex items-start gap-2.5 ${
                rebalanceStage === 'complete'
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
              }`}
            >
              <Bot className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
              <div className="flex-1">
                <span className="font-bold uppercase tracking-wider text-[10px] mr-2 px-1.5 py-0.5 rounded bg-white/10">
                  {rebalanceStage}
                </span>
                {aiRationale}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cluster Nodes Capacity Grid */}
      <div>
        <h3 className="text-sm font-bold text-slate-300 mb-3 flex items-center gap-2 font-mono">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Worker Node Hot Spots & Bin-Packing (Cross-Cloud)</span>
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
          {nodes.map((node) => (
            <div
              key={node.name}
              className={`p-4 rounded-xl border transition-all duration-300 ${
                node.isHotSpot
                  ? 'border-rose-500/40 bg-rose-500/5 shadow-md shadow-rose-950/20'
                  : isLight
                  ? 'bg-white border-slate-200 text-slate-800'
                  : 'bg-[#10141e] border-[#1e2638] text-white'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                  {node.provider}
                </span>
                {node.isHotSpot ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-rose-400">
                    <Flame className="w-3 h-3 animate-pulse" />
                    Hot Spot
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-400">
                    <CheckCircle2 className="w-3 h-3" />
                    Nominal
                  </span>
                )}
              </div>

              <div className="font-mono text-xs font-bold truncate" title={node.name}>
                {node.name}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mb-3">{node.zone}</div>

              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-[11px] font-mono">
                  <span className="text-slate-400">CPU Allocated:</span>
                  <span className={node.cpuAllocatedPct > 80 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                    {node.cpuAllocatedPct}%
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                  <motion.div
                    className={`h-full rounded-full ${
                      node.cpuAllocatedPct > 80
                        ? 'bg-rose-500'
                        : node.cpuAllocatedPct > 60
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    initial={{ width: 0 }}
                    animate={{ width: `${node.cpuAllocatedPct}%` }}
                    transition={{ duration: 0.8 }}
                  />
                </div>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800/60 flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Pods: {node.totalPods}</span>
                <span>RAM: {node.memAllocatedPct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Throttled Pods & Animated Migration Workflow */}
      <div
        className={`p-5 rounded-2xl border ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#0e121a] border-[#1c2336]'
        }`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Flame className="w-4 h-4 text-amber-400" />
            <h3 className="font-bold text-sm">Detected CPU CFS Throttling & Live Relocations</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">
            {throttledPods.filter((p) => p.status !== 'balanced').length} Pods Contending
          </span>
        </div>

        <div className="space-y-3">
          {throttledPods.map((pod) => (
            <motion.div
              key={pod.id}
              layout
              className={`p-4 rounded-xl border transition-all ${
                pod.status === 'balanced'
                  ? 'bg-emerald-500/5 border-emerald-500/30'
                  : pod.status === 'migrating'
                  ? 'bg-cyan-500/10 border-cyan-500/40'
                  : pod.status === 'evicting'
                  ? 'bg-amber-500/10 border-amber-500/40'
                  : 'bg-[#121723] border-[#20293d]'
              }`}
            >
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
                {/* Pod Ident */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-white">{pod.name}</span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      ns/{pod.namespace}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400 font-mono">
                    <span>
                      CPU Limit: <strong className="text-slate-200">{pod.cpuLimitCores} Core</strong>
                    </span>
                    <span>
                      CFS Throttle:{' '}
                      <strong className={pod.cfsThrottledPercentage > 10 ? 'text-rose-400' : 'text-emerald-400'}>
                        {pod.cfsThrottledPercentage}%
                      </strong>
                    </span>
                    <span>
                      p99 Latency:{' '}
                      <strong className={pod.p99LatencyMs > 100 ? 'text-rose-400' : 'text-emerald-400'}>
                        {pod.p99LatencyMs}ms
                      </strong>
                    </span>
                  </div>
                </div>

                {/* Relocation Route & Animated Status Transition */}
                <div className="flex items-center gap-3 w-full lg:w-auto justify-between lg:justify-end">
                  <div className="flex items-center gap-2 text-xs font-mono">
                    <span className="px-2 py-1 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                      {pod.currentNode}
                    </span>
                    <MoveRight className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                      {pod.targetNode}
                    </span>
                  </div>

                  {/* Animated Status Pill */}
                  <div className="shrink-0 min-w-[110px] text-right">
                    {pod.status === 'throttled' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5 justify-center">
                        <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
                        Throttled
                      </span>
                    )}
                    {pod.status === 'evicting' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5 justify-center">
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        Evicting...
                      </span>
                    )}
                    {pod.status === 'migrating' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1.5 justify-center">
                        <ArrowRight className="w-3 h-3 animate-bounce" />
                        Migrating...
                      </span>
                    )}
                    {pod.status === 'balanced' && (
                      <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 justify-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Optimized
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
