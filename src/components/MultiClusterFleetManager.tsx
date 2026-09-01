import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Boxes,
  CheckCircle2,
  Cloud,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Key,
  Layers,
  Lock,
  Plus,
  Radio,
  RefreshCw,
  Server,
  Share2,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  Wifi,
  Zap,
} from 'lucide-react';
import { ClusterFleetNode } from '../types';
import { RegisterClusterModal } from './RegisterClusterModal';
import { AnimatedStatusBadge } from './AnimatedStatusComponents';

interface MultiClusterFleetManagerProps {
  fleet: ClusterFleetNode[];
  onSwitchPrimary: (clusterId: string) => Promise<void>;
  onRefresh?: () => void;
}

export const MultiClusterFleetManager: React.FC<MultiClusterFleetManagerProps> = ({
  fleet,
  onSwitchPrimary,
  onRefresh,
}) => {
  const [isSwitching, setIsSwitching] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pingingClusterId, setPingingClusterId] = useState<string | null>(null);
  const [pingResults, setPingResults] = useState<Record<string, { latency: number; timestamp: string }>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSwitch = async (id: string) => {
    setIsSwitching(id);
    await onSwitchPrimary(id);
    setIsSwitching(null);
  };

  const handlePingCluster = async (id: string) => {
    setPingingClusterId(id);
    try {
      const res = await fetch(`/api/fleet/clusters/${id}/ping`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setPingResults((prev) => ({
          ...prev,
          [id]: { latency: data.pingLatencyMs, timestamp: new Date().toLocaleTimeString() },
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setPingingClusterId(null);
    }
  };

  const handleDeleteCluster = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove cluster '${name}' from the federated fleet? Workloads will be unlinked from the telemetry control plane.`)) {
      return;
    }
    setDeletingId(id);
    try {
      const res = await fetch(`/api/fleet/clusters/${id}`, { method: 'DELETE' });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const getProviderBadge = (provider: string) => {
    if (provider.includes('GCP')) {
      return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    } else if (provider.includes('AWS')) {
      return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    } else if (provider.includes('Azure')) {
      return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    } else if (provider.includes('OpenShift')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Federation Actions */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <Globe className="w-5 h-5 text-cyan-400" />
              Multi-Cloud &amp; Multi-Cluster Fleet Federation
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Zero-Trust Observability
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Unified multi-region Kubernetes control plane synchronizing workloads across Google Cloud (GKE), AWS (EKS), Azure (AKS), and Bare-Metal edge nodes with read-only RBAC validation.
          </p>
        </div>

        {/* Global Summary & Register Cluster Button */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
            <Share2 className="w-4 h-4 text-cyan-400" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-semibold">Federated Fleet</div>
              <div className="text-xs font-bold text-slate-200 font-mono">
                {fleet.length} Clusters / {fleet.reduce((acc, c) => acc + c.podsCount, 0)} Pods
              </div>
            </div>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/25 border border-cyan-400/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Register Cluster / Kubeconfig</span>
          </button>
        </div>
      </div>

      {/* Fleet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {fleet.map((cluster) => {
            const pingInfo = pingResults[cluster.id];
            const latency = pingInfo?.latency ?? cluster.pingLatencyMs ?? 18;

            return (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -3, transition: { duration: 0.2 } }}
                key={cluster.id}
                className={`rounded-2xl border p-5 transition-all shadow-lg flex flex-col justify-between ${
                  cluster.isPrimary
                    ? 'bg-slate-900 border-cyan-500/80 ring-2 ring-cyan-500/20 shadow-cyan-500/5'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div>
                  {/* Header Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getProviderBadge(cluster.cloudProvider)}`}>
                        {cluster.cloudProvider}
                      </span>
                      {cluster.environment && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700 uppercase">
                          {cluster.environment}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {cluster.isPrimary && (
                        <AnimatedStatusBadge status="info" label="Primary Ingress" size="sm" />
                      )}
                      <AnimatedStatusBadge
                        status={cluster.status === 'healthy' ? 'healthy' : 'warning'}
                        label={cluster.status.toUpperCase()}
                        size="sm"
                      />
                    </div>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-bold text-white truncate max-w-[200px]" title={cluster.clusterName}>
                        {cluster.clusterName}
                      </h3>
                      <div className="text-xs text-slate-400 mt-0.5">{cluster.region}</div>
                    </div>

                    {/* Ping latency indicator & trigger */}
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handlePingCluster(cluster.id)}
                      disabled={pingingClusterId === cluster.id}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-[10px] font-mono text-emerald-400 transition-all"
                      title="Ping Kubernetes API Server"
                    >
                      <Wifi className={`w-3 h-3 ${pingingClusterId === cluster.id ? 'animate-spin text-cyan-400' : 'text-emerald-400'}`} />
                      <span>{latency}ms</span>
                    </motion.button>
                  </div>

                  <div className="text-[11px] text-slate-500 font-mono mt-1 flex items-center gap-2">
                    <span>{cluster.kubernetesVersion}</span>
                    {cluster.rbacStatus && (
                      <>
                        <span>&bull;</span>
                        <span className={`flex items-center gap-0.5 ${
                          cluster.rbacStatus === 'READ_ONLY_CERTIFIED' ? 'text-emerald-400' : 'text-amber-400'
                        }`}>
                          <ShieldCheck className="w-3 h-3" />
                          {cluster.rbacStatus === 'READ_ONLY_CERTIFIED' ? 'Read-Only RBAC' : 'Admin RBAC'}
                        </span>
                      </>
                    )}
                  </div>

                  {cluster.apiEndpoint && (
                    <div className="mt-2.5 px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800/80 text-[10px] font-mono text-slate-400 truncate flex items-center gap-1.5" title={cluster.apiEndpoint}>
                      <Server className="w-3 h-3 text-cyan-400 shrink-0" />
                      <span className="truncate">{cluster.apiEndpoint}</span>
                    </div>
                  )}

                  {/* Traffic Allocation Bar */}
                  <div className="mt-3.5 bg-slate-950 border border-slate-800 rounded-xl p-3 space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-400">Global Ingress Weight</span>
                      <span className="font-mono font-bold text-cyan-300">{cluster.activeTrafficWeight}%</span>
                    </div>
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cluster.activeTrafficWeight}%` }}
                        transition={{ duration: 0.8, ease: 'easeOut' }}
                        className="bg-cyan-500 h-full rounded-full"
                      />
                    </div>
                  </div>

                  {/* Resource Stats */}
                  <div className="mt-3.5 grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">Nodes / Pods</span>
                      <span className="font-mono font-bold text-white text-xs mt-0.5 block">
                        {cluster.nodesCount} Nodes / {cluster.podsCount} Pods
                      </span>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-xl p-2.5">
                      <span className="text-[10px] text-slate-500 uppercase font-semibold block">CPU / Memory</span>
                      <span className="font-mono font-bold text-purple-300 text-xs mt-0.5 block">
                        {cluster.cpuUsagePercent}% / {cluster.memUsagePercent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSwitch(cluster.id)}
                    disabled={cluster.isPrimary || isSwitching === cluster.id}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-white transition-all flex items-center justify-center gap-2 border border-slate-700"
                  >
                    {isSwitching === cluster.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Radio className="w-3.5 h-3.5" />
                    )}
                    <span>{cluster.isPrimary ? 'Active Primary Cluster' : 'Shift Primary Ingress'}</span>
                  </motion.button>

                  {fleet.length > 1 && (
                    <motion.button
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => handleDeleteCluster(cluster.id, cluster.clusterName)}
                      disabled={deletingId === cluster.id}
                      className="p-2 rounded-xl bg-slate-950 hover:bg-rose-500/20 text-slate-500 hover:text-rose-400 border border-slate-800 hover:border-rose-500/30 transition-all"
                      title="Remove Cluster from Fleet"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Cluster Registration Modal */}
      <RegisterClusterModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onClusterRegistered={(newCluster) => {
          if (onRefresh) onRefresh();
        }}
      />
    </div>
  );
};
