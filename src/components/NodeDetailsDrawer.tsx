import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Server,
  Cpu,
  HardDrive,
  Activity,
  Layers,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Terminal,
  RefreshCw,
  Search,
  Filter,
  ArrowUpDown,
  Zap,
  Tag,
  Radio,
  Eye,
  Sliders,
  Play,
  Pause,
  Copy,
  Check,
  Download,
  AlertOctagon,
  ShieldAlert,
  Info,
  Clock,
  Gauge,
  Network,
  Maximize2,
  ExternalLink,
} from 'lucide-react';
import {
  K8sNode,
  K8sPod,
  NodeDetailedInfo,
  NodeCondition,
  NodeKernelLogEntry,
  ScheduledPodDetail,
} from '../types';

interface NodeDetailsDrawerProps {
  node: K8sNode | null;
  allPods?: K8sPod[];
  isOpen: boolean;
  onClose: () => void;
  onSelectPodForDiagnostics?: (podName: string) => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

type DrawerTab = 'scheduling' | 'kernel_logs' | 'hardware_labels';

export const NodeDetailsDrawer: React.FC<NodeDetailsDrawerProps> = ({
  node,
  allPods = [],
  isOpen,
  onClose,
  onSelectPodForDiagnostics,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<DrawerTab>('scheduling');
  const [detailedInfo, setDetailedInfo] = useState<NodeDetailedInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Pods filtering in Drawer
  const [podSearch, setPodSearch] = useState<string>('');
  const [podNamespaceFilter, setPodNamespaceFilter] = useState<string>('all');
  const [podQosFilter, setPodQosFilter] = useState<string>('all');

  // Kernel log controls
  const [logSearch, setLogSearch] = useState<string>('');
  const [logSubsystemFilter, setLogSubsystemFilter] = useState<string>('all');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('all');
  const [isLogStreaming, setIsLogStreaming] = useState<boolean>(true);
  const [copiedLogs, setCopiedLogs] = useState<boolean>(false);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Fetch node details from backend
  const fetchNodeDetails = async () => {
    if (!node) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/k8s/node/${node.id}/details`);
      if (res.ok) {
        const data = await res.json();
        setDetailedInfo(data.node);
      } else {
        // Build fallback from current props if offline
        generateFallbackNodeDetails(node, allPods);
      }
    } catch (err) {
      console.error('Failed to fetch node details:', err);
      generateFallbackNodeDetails(node, allPods);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackNodeDetails = (n: K8sNode, pods: K8sPod[]) => {
    const podsOnNode = pods.filter((p) => p.node === n.name);
    const isControlPlane = n.role === 'control-plane';
    const isHighMem = n.name.includes('highmem') || n.memoryTotalGB >= 128;
    const now = Date.now();

    const scheduledPods: ScheduledPodDetail[] = podsOnNode.map((p) => ({
      id: p.id,
      name: p.name,
      namespace: p.namespace,
      status: p.status,
      qosClass: p.memoryLimitMB === p.memoryMB ? 'Guaranteed' : p.memoryLimitMB > 0 ? 'Burstable' : 'BestEffort',
      cpuRequestMillicores: p.cpuMillicores || 250,
      cpuLimitMillicores: p.cpuLimit || 1000,
      cpuUsagePercent: p.cpuUsage || 15,
      memoryRequestMB: Math.round(p.memoryLimitMB * 0.6) || 256,
      memoryLimitMB: p.memoryLimitMB || 512,
      memoryUsagePercent: p.memoryUsage || 45,
      restartCount: p.restarts || 0,
      age: p.age || '3d 8h',
      ip: p.ip || '10.244.2.14',
      affinityMatch: p.namespace === 'production' ? 'nodeAffinity: requiredDuringScheduling (zone=us-east-1a)' : 'podAntiAffinity: preferred',
      tolerations: isControlPlane ? ['node-role.kubernetes.io/control-plane:NoSchedule'] : [],
    }));

    const totalMem = n.memoryTotalGB * 1024 * 1024 * 1024;
    const totalCpuMilli = n.cpuCores * 1000;

    setDetailedInfo({
      id: n.id,
      name: n.name,
      role: n.role,
      status: n.status,
      instanceType: isControlPlane ? 'c6i.2xlarge (AWS EC2)' : isHighMem ? 'r6i.8xlarge (AWS EC2)' : 'm6i.4xlarge (AWS EC2)',
      providerId: `aws:///${n.zone}/i-079dfbc8142${n.id.slice(-4)}`,
      architecture: 'linux/amd64',
      osImage: n.osImage,
      kernelVersion: 'Linux 6.8.0-48-generic #48-Ubuntu SMP',
      containerRuntime: 'containerd://1.7.23',
      kubeletVersion: n.kubeletVersion,
      kubeProxyVersion: n.kubeletVersion,
      internalIP: '10.244.2.1',
      externalIP: '34.221.140.88',
      region: n.region,
      zone: n.zone,
      bootTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
      uptime: '14 days, 6 hours',
      labels: {
        'kubernetes.io/hostname': n.name,
        'kubernetes.io/os': 'linux',
        'kubernetes.io/arch': 'amd64',
        'topology.kubernetes.io/region': n.region,
        'topology.kubernetes.io/zone': n.zone,
        'node.kubernetes.io/instance-type': isControlPlane ? 'c6i.2xlarge' : isHighMem ? 'r6i.8xlarge' : 'm6i.4xlarge',
      },
      annotations: {
        'node.alpha.kubernetes.io/ttl': '0',
        'volumes.kubernetes.io/controller-managed-attach-detach': 'true',
      },
      taints: isControlPlane ? [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }] : [],
      conditions: [
        {
          type: 'Ready',
          status: n.status === 'Ready' ? 'True' : 'False',
          lastHeartbeatTime: new Date().toISOString(),
          lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
          reason: 'KubeletReady',
          message: 'kubelet is posting ready status. Container runtime is healthy.',
        },
        {
          type: 'MemoryPressure',
          status: 'False',
          lastHeartbeatTime: new Date().toISOString(),
          lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
          reason: 'KubeletHasSufficientMemory',
          message: 'kubelet has sufficient memory available.',
        },
        {
          type: 'DiskPressure',
          status: 'False',
          lastHeartbeatTime: new Date().toISOString(),
          lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
          reason: 'KubeletHasNoDiskPressure',
          message: 'kubelet has sufficient disk space available.',
        },
        {
          type: 'PIDPressure',
          status: 'False',
          lastHeartbeatTime: new Date().toISOString(),
          lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
          reason: 'KubeletHasSufficientPID',
          message: 'kubelet has sufficient PIDs available.',
        },
        {
          type: 'NetworkUnavailable',
          status: 'False',
          lastHeartbeatTime: new Date().toISOString(),
          lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
          reason: 'RouteCreated',
          message: 'Cilium eBPF CNI installed routes correctly.',
        },
      ],
      capacity: {
        cpuMillicores: totalCpuMilli,
        memoryBytes: totalMem,
        ephemeralStorageBytes: 500 * 1024 * 1024 * 1024,
        pods: n.podsCapacity,
      },
      allocatable: {
        cpuMillicores: totalCpuMilli - 200,
        memoryBytes: Math.round(totalMem * 0.96),
        ephemeralStorageBytes: 460 * 1024 * 1024 * 1024,
        pods: n.podsCapacity,
      },
      allocated: {
        cpuRequestMillicores: Math.round((totalCpuMilli - 200) * (n.cpuUsagePercent / 100)),
        cpuRequestPercent: n.cpuUsagePercent,
        cpuLimitMillicores: Math.round((totalCpuMilli - 200) * ((n.cpuUsagePercent + 15) / 100)),
        cpuLimitPercent: Math.min(100, n.cpuUsagePercent + 15),
        memoryRequestBytes: Math.round(totalMem * 0.96 * (n.memoryUsagePercent / 100)),
        memoryRequestPercent: n.memoryUsagePercent,
        memoryLimitBytes: Math.round(totalMem * 0.96 * ((n.memoryUsagePercent + 12) / 100)),
        memoryLimitPercent: Math.min(100, n.memoryUsagePercent + 12),
        podsRunning: n.podsRunning,
        podsCapacity: n.podsCapacity,
        ephemeralStorageUsedBytes: 140 * 1024 * 1024 * 1024,
        ephemeralStoragePercent: 30,
      },
      cgroupPsi: {
        cpuSome10s: 0.04,
        memSome10s: isHighMem ? 0.08 : 0.01,
        memFull10s: 0.0,
        ioSome10s: 0.02,
      },
      networkStats: {
        rxBytesPerSec: 142000000,
        txBytesPerSec: 188000000,
        tcpRetransmitsPerSec: isHighMem ? 2 : 0,
        socketDropsTotal: 0,
      },
      scheduledPods,
      kernelLogs: [
        {
          id: `klog-1`,
          timestamp: new Date().toISOString(),
          relativeTime: '1s ago',
          level: 'INFO',
          subsystem: 'ebpf',
          message: `[ebpf_sockops] attach_kprobe: sys_enter_connect socket event on eth0. Active sockets: 320. Zero retransmits.`,
          cpuCore: 2,
        },
        {
          id: `klog-2`,
          timestamp: new Date(now - 1000 * 12).toISOString(),
          relativeTime: '12s ago',
          level: 'INFO',
          subsystem: 'cgroup2',
          message: `[cgroup v2 PSI] memory pressure stall: some avg10=0.04% full avg10=0.00% across pods`,
          cpuCore: 5,
        },
        {
          id: `klog-3`,
          timestamp: new Date(now - 1000 * 30).toISOString(),
          relativeTime: '30s ago',
          level: 'INFO',
          subsystem: 'kubelet',
          message: `[kubelet_pleg] PodLifecycleEventGenerator: relist duration 7.2ms (healthy baseline).`,
        },
      ],
    });
  };

  useEffect(() => {
    if (isOpen && node) {
      fetchNodeDetails();
    }
  }, [isOpen, node?.id]);

  // Live simulation tick for kernel logs
  useEffect(() => {
    if (!isOpen || !isLogStreaming) return;
    const interval = setInterval(() => {
      setDetailedInfo((prev) => {
        if (!prev) return prev;
        const now = new Date();
        const rand = Math.random();
        let newEntry: NodeKernelLogEntry;

        if (rand > 0.7) {
          newEntry = {
            id: `klog-dyn-${Date.now()}`,
            timestamp: now.toISOString(),
            relativeTime: 'Just now',
            level: 'INFO',
            subsystem: 'ebpf',
            message: `[ebpf_sockops] sys_enter_connect: socket event traced. Flow: 10.244.2.${Math.floor(10 + Math.random() * 20)}:443 -> 10.244.1.8:8080 (0ms RTT)`,
            cpuCore: Math.floor(Math.random() * (node?.cpuCores || 16)),
            comm: 'cilium-agent',
            pid: 1402,
          };
        } else if (rand > 0.4) {
          newEntry = {
            id: `klog-dyn-${Date.now()}`,
            timestamp: now.toISOString(),
            relativeTime: 'Just now',
            level: 'INFO',
            subsystem: 'cgroup2',
            message: `[cgroup v2 PSI] memory stall info: some avg10=${(0.02 + Math.random() * 0.05).toFixed(2)}% full avg10=0.00% (cgroup hierarchy stable)`,
            cpuCore: Math.floor(Math.random() * (node?.cpuCores || 16)),
            comm: 'systemd',
            pid: 1,
          };
        } else {
          newEntry = {
            id: `klog-dyn-${Date.now()}`,
            timestamp: now.toISOString(),
            relativeTime: 'Just now',
            level: 'INFO',
            subsystem: 'kubelet',
            message: `[kubelet_pleg] PLEG relist completed in ${(5 + Math.random() * 4).toFixed(1)}ms. Local container heartbeats synchronized.`,
            comm: 'kubelet',
            pid: 2489,
          };
        }

        return {
          ...prev,
          kernelLogs: [newEntry, ...prev.kernelLogs.slice(0, 49)],
        };
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isOpen, isLogStreaming, node?.cpuCores]);

  // Actions
  const handleToggleCordon = async () => {
    if (!node) return;
    try {
      setActionLoading('cordon');
      const res = await fetch(`/api/k8s/node/${node.id}/cordon`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDetailedInfo((prev) => (prev ? { ...prev, status: data.newStatus } : null));
        onShowToast?.('success', 'Node Scheduling Updated', data.message);
      }
    } catch (err) {
      console.error('Cordon toggle error:', err);
      onShowToast?.('error', 'Action Failed', 'Could not toggle node cordon state.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrainSimulator = async () => {
    if (!node) return;
    try {
      setActionLoading('drain');
      const res = await fetch(`/api/k8s/node/${node.id}/drain`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setDetailedInfo((prev) =>
          prev
            ? {
                ...prev,
                status: 'SchedulingDisabled',
                allocated: {
                  ...prev.allocated,
                  podsRunning: data.remainingPods,
                  cpuRequestPercent: 14,
                  memoryRequestPercent: 20,
                },
              }
            : null
        );
        onShowToast?.('success', 'Node Drained Simulator', data.message);
      }
    } catch (err) {
      console.error('Drain error:', err);
      onShowToast?.('error', 'Drain Failed', 'Could not execute node drain simulator.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRunKernelProbe = async () => {
    if (!node) return;
    try {
      setActionLoading('probe');
      const res = await fetch(`/api/k8s/node/${node.id}/kernel-probe`, { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        onShowToast?.('success', 'eBPF Kernel Probe Completed', data.message);
      }
    } catch (err) {
      console.error('Kernel probe error:', err);
      onShowToast?.('error', 'Probe Failed', 'Failed to execute eBPF kernel probe.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyLogs = () => {
    if (!detailedInfo?.kernelLogs) return;
    const text = detailedInfo.kernelLogs
      .map((l) => `[${l.timestamp}] [${l.level}] [${l.subsystem}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
    onShowToast?.('info', 'Logs Copied', 'Kernel dmesg and eBPF logs copied to clipboard.');
  };

  if (!isOpen || !node) return null;

  const data = detailedInfo;
  const isControlPlane = node.role === 'control-plane';

  // Filter scheduled pods
  const filteredPods = (data?.scheduledPods || []).filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(podSearch.toLowerCase()) ||
      p.namespace.toLowerCase().includes(podSearch.toLowerCase());
    const matchesNs = podNamespaceFilter === 'all' || p.namespace === podNamespaceFilter;
    const matchesQos = podQosFilter === 'all' || p.qosClass.toLowerCase() === podQosFilter.toLowerCase();
    return matchesSearch && matchesNs && matchesQos;
  });

  // Filter kernel logs
  const filteredKernelLogs = (data?.kernelLogs || []).filter((l) => {
    const matchesSearch =
      l.message.toLowerCase().includes(logSearch.toLowerCase()) ||
      (l.comm && l.comm.toLowerCase().includes(logSearch.toLowerCase()));
    const matchesSub = logSubsystemFilter === 'all' || l.subsystem === logSubsystemFilter;
    const matchesLvl = logLevelFilter === 'all' || l.level === logLevelFilter;
    return matchesSearch && matchesSub && matchesLvl;
  });

  const uniqueNamespaces = Array.from(new Set((data?.scheduledPods || []).map((p) => p.namespace)));

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-end transition-opacity duration-300">
      {/* Click outside backdrop */}
      <div className="flex-1" onClick={onClose} />

      {/* Side Drawer Body */}
      <div className="w-full max-w-4xl bg-[#09090b] border-l border-white/10 text-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 relative z-10">
        {/* Top Sticky Header */}
        <div className="p-6 border-b border-white/10 bg-[#0f0f12] flex items-center justify-between shrink-0">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                  isControlPlane
                    ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                    : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                }`}
              >
                {data?.role || node.role}
              </span>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border flex items-center gap-1 ${
                  data?.status === 'Ready'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    data?.status === 'Ready' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                  }`}
                />
                {data?.status || node.status}
              </span>

              <span className="text-xs font-mono text-purple-300 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-500/30">
                {data?.instanceType || 'AWS EC2'}
              </span>

              <span className="text-xs font-mono text-slate-400">
                {node.region} / {node.zone}
              </span>
            </div>

            <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2 font-display">
              <Server className="w-5 h-5 text-cyan-400" />
              {node.name}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchNodeDetails}
              disabled={loading}
              className="p-2 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-slate-300 border border-white/10 transition-all disabled:opacity-50"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-slate-400 hover:text-white border border-white/10 transition-colors"
              title="Close drawer (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick SRE Action Buttons Bar */}
        <div className="px-6 py-2.5 bg-[#121215] border-b border-white/5 flex items-center justify-between gap-3 overflow-x-auto shrink-0 text-xs">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleCordon}
              disabled={actionLoading === 'cordon'}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all border ${
                data?.status === 'SchedulingDisabled'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              }`}
            >
              <AlertOctagon className="w-3.5 h-3.5" />
              {actionLoading === 'cordon'
                ? 'Processing...'
                : data?.status === 'SchedulingDisabled'
                ? 'Uncordon Node'
                : 'Cordon Node'}
            </button>

            <button
              onClick={handleDrainSimulator}
              disabled={actionLoading === 'drain' || isControlPlane}
              className="px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 font-bold flex items-center gap-1.5 transition-all disabled:opacity-40"
              title={isControlPlane ? 'Cannot drain control plane node' : 'Evict all pods safely'}
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              {actionLoading === 'drain' ? 'Draining...' : 'Drain Node Simulator'}
            </button>

            <button
              onClick={handleRunKernelProbe}
              disabled={actionLoading === 'probe'}
              className="px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-300 border border-purple-500/40 hover:bg-purple-500/30 font-bold flex items-center gap-1.5 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
              {actionLoading === 'probe' ? 'Probing...' : 'Run eBPF Kernel Probe'}
            </button>
          </div>

          <div className="text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-2">
            <span>Kernel: <strong className="text-slate-200">6.8.0-48-generic</strong></span>
            <span>&bull;</span>
            <span>IP: <strong className="text-cyan-300">{data?.internalIP || '10.244.2.1'}</strong></span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-white/10 bg-[#09090b] shrink-0">
          <button
            onClick={() => setActiveTab('scheduling')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'scheduling'
                ? 'text-cyan-400 border-cyan-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>Pod Scheduling & Capacity</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
              {data?.scheduledPods?.length || node.podsRunning} Pods
            </span>
          </button>

          <button
            onClick={() => setActiveTab('kernel_logs')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'kernel_logs'
                ? 'text-purple-400 border-purple-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>Kernel Event Logs & eBPF</span>
            <span className="px-1.5 py-0.2 text-[10px] rounded-full bg-purple-500/20 text-purple-300 font-mono animate-pulse">
              Live Ring
            </span>
          </button>

          <button
            onClick={() => setActiveTab('hardware_labels')}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'hardware_labels'
                ? 'text-emerald-400 border-emerald-400'
                : 'text-slate-400 border-transparent hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Hardware, Taints & Labels</span>
          </button>
        </div>

        {/* Tab Content Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* ======================================================== */}
          {/* TAB 1: POD SCHEDULING & CAPACITY MATRIX                  */}
          {/* ======================================================== */}
          {activeTab === 'scheduling' && (
            <div className="space-y-6">
              {/* Allocation Meters Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* CPU Allocation Meter */}
                <div className="bg-[#141416] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU Allocatable
                    </span>
                    <span className="font-mono text-cyan-300 font-bold">
                      {data?.allocated.cpuRequestPercent || node.cpuUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (data?.allocated.cpuRequestPercent || node.cpuUsagePercent) > 80
                          ? 'bg-rose-500'
                          : (data?.allocated.cpuRequestPercent || node.cpuUsagePercent) > 60
                          ? 'bg-amber-500'
                          : 'bg-cyan-500'
                      }`}
                      style={{ width: `${data?.allocated.cpuRequestPercent || node.cpuUsagePercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Req: {data ? `${(data.allocated.cpuRequestMillicores / 1000).toFixed(1)} cores` : `${node.cpuCores} cores`}</span>
                    <span>Cap: {node.cpuCores} cores</span>
                  </div>
                </div>

                {/* Memory Allocation Meter */}
                <div className="bg-[#141416] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Gauge className="w-3.5 h-3.5 text-indigo-400" /> RAM Allocatable
                    </span>
                    <span className="font-mono text-indigo-300 font-bold">
                      {data?.allocated.memoryRequestPercent || node.memoryUsagePercent}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${
                        (data?.allocated.memoryRequestPercent || node.memoryUsagePercent) > 80
                          ? 'bg-rose-500'
                          : (data?.allocated.memoryRequestPercent || node.memoryUsagePercent) > 60
                          ? 'bg-amber-500'
                          : 'bg-indigo-500'
                      }`}
                      style={{ width: `${data?.allocated.memoryRequestPercent || node.memoryUsagePercent}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Used: {Math.round(node.memoryTotalGB * (node.memoryUsagePercent / 100))}GB</span>
                    <span>Cap: {node.memoryTotalGB}GB</span>
                  </div>
                </div>

                {/* Pod Slot Saturation Meter */}
                <div className="bg-[#141416] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" /> Pod Capacity
                    </span>
                    <span className="font-mono text-emerald-300 font-bold">
                      {Math.round((node.podsRunning / node.podsCapacity) * 100)}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500"
                      style={{ width: `${(node.podsRunning / node.podsCapacity) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Scheduled: {node.podsRunning}</span>
                    <span>Max: {node.podsCapacity} pods</span>
                  </div>
                </div>

                {/* Ephemeral Storage / NVMe Meter */}
                <div className="bg-[#141416] border border-white/10 rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" /> Disk / NVMe
                    </span>
                    <span className="font-mono text-amber-300 font-bold">
                      {data?.allocated.ephemeralStoragePercent || 31}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-500"
                      style={{ width: `${data?.allocated.ephemeralStoragePercent || 31}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex justify-between">
                    <span>Used: 142 GB</span>
                    <span>Cap: 500 GB</span>
                  </div>
                </div>
              </div>

              {/* Node Conditions Breakdown Bar */}
              <div className="bg-[#141416] border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Kubernetes Kubelet Node Conditions & Probes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                  {(data?.conditions || []).map((cond) => {
                    const isHealthy =
                      cond.type === 'Ready'
                        ? cond.status === 'True'
                        : cond.status === 'False';

                    return (
                      <div
                        key={cond.type}
                        className={`p-3 rounded-lg border text-xs space-y-1 ${
                          isHealthy
                            ? 'bg-emerald-950/20 border-emerald-500/30'
                            : 'bg-rose-950/20 border-rose-500/40'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-[11px]">{cond.type}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                              isHealthy
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-rose-500/20 text-rose-300'
                            }`}
                          >
                            {cond.status}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 truncate" title={cond.reason}>
                          {cond.reason}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Scheduled Pods Matrix on this Node */}
              <div className="bg-[#141416] border border-white/10 rounded-xl p-5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-white/10">
                  <div>
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Layers className="w-4 h-4 text-cyan-400" />
                      Scheduled Pods Matrix ({filteredPods.length} / {data?.scheduledPods?.length || 0})
                    </h3>
                    <p className="text-xs text-slate-400">
                      Workloads actively scheduled and running on node {node.name}
                    </p>
                  </div>

                  {/* Filter & Search */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Namespace dropdown */}
                    <select
                      value={podNamespaceFilter}
                      onChange={(e) => setPodNamespaceFilter(e.target.value)}
                      className="bg-[#09090b] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">All Namespaces</option>
                      {uniqueNamespaces.map((ns) => (
                        <option key={ns} value={ns}>
                          {ns}
                        </option>
                      ))}
                    </select>

                    {/* QoS Class dropdown */}
                    <select
                      value={podQosFilter}
                      onChange={(e) => setPodQosFilter(e.target.value)}
                      className="bg-[#09090b] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-slate-300 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="all">All QoS Classes</option>
                      <option value="guaranteed">Guaranteed</option>
                      <option value="burstable">Burstable</option>
                      <option value="besteffort">BestEffort</option>
                    </select>

                    {/* Search Pods */}
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Search pods..."
                        value={podSearch}
                        onChange={(e) => setPodSearch(e.target.value)}
                        className="bg-[#09090b] border border-white/10 rounded-lg pl-7 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36 sm:w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Pods Table / List */}
                <div className="space-y-2">
                  {filteredPods.length === 0 ? (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No scheduled pods match current filter.
                    </div>
                  ) : (
                    filteredPods.map((pod) => {
                      const isRunning = pod.status === 'Running';
                      const qosColor =
                        pod.qosClass === 'Guaranteed'
                          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
                          : pod.qosClass === 'Burstable'
                          ? 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/30';

                      return (
                        <div
                          key={pod.id}
                          className="p-3.5 rounded-xl bg-[#0e0e11] border border-white/5 hover:border-white/20 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-white font-mono truncate max-w-[280px]">
                                {pod.name}
                              </span>
                              <span className="px-2 py-0.2 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/5">
                                {pod.namespace}
                              </span>
                              <span className={`px-2 py-0.2 rounded text-[10px] font-bold border ${qosColor}`}>
                                {pod.qosClass}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono flex items-center gap-3">
                              <span>CPU: {pod.cpuRequestMillicores}m / {pod.cpuLimitMillicores}m</span>
                              <span>&bull;</span>
                              <span>RAM: {pod.memoryRequestMB}MB / {pod.memoryLimitMB}MB</span>
                              <span>&bull;</span>
                              <span>Restarts: {pod.restartCount}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                isRunning
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              }`}
                            >
                              {pod.status}
                            </span>

                            {onSelectPodForDiagnostics && (
                              <button
                                onClick={() => onSelectPodForDiagnostics(pod.name)}
                                className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 text-[11px] font-bold transition-all flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3 text-purple-400" />
                                <span>Diagnose</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 2: KERNEL EVENT LOGS & eBPF TELEMETRY                */}
          {/* ======================================================== */}
          {activeTab === 'kernel_logs' && (
            <div className="space-y-6">
              {/* Pressure Stall Information (PSI) Widgets */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-[#141416] border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Cpu className="w-3.5 h-3.5 text-cyan-400" /> CPU PSI (Pressure Stall)
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">NORMAL</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {data?.cgroupPsi.cpuSome10s || 0.04}% <span className="text-xs text-slate-500 font-normal">some avg10</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Zero CFS cpu throttling detected</div>
                </div>

                <div className="p-4 rounded-xl bg-[#141416] border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5 text-indigo-400" /> Memory PSI Stall
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">STABLE</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {data?.cgroupPsi.memSome10s || 0.02}% <span className="text-xs text-slate-500 font-normal">some avg10</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Full stall: 0.00% &bull; OOM killer quiescent</div>
                </div>

                <div className="p-4 rounded-xl bg-[#141416] border border-white/10 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 flex items-center gap-1.5">
                      <HardDrive className="w-3.5 h-3.5 text-amber-400" /> NVMe I/O PSI Stall
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">OPTIMAL</span>
                  </div>
                  <div className="text-xl font-bold font-mono text-white">
                    {data?.cgroupPsi.ioSome10s || 0.01}% <span className="text-xs text-slate-500 font-normal">some avg10</span>
                  </div>
                  <div className="text-[10px] text-slate-400">p99 NVMe disk completion latency: 0.42ms</div>
                </div>
              </div>

              {/* Kernel Log Stream Controls Bar */}
              <div className="bg-[#141416] border border-white/10 rounded-xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-purple-400" />
                    <h3 className="text-sm font-bold text-white">
                      Node Kernel Ring Buffer & eBPF Event Stream
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsLogStreaming(!isLogStreaming)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all border ${
                        isLogStreaming
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/30'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {isLogStreaming ? (
                        <>
                          <Pause className="w-3 h-3 text-emerald-400" />
                          <span>Streaming (Active)</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3 h-3 text-slate-400" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>

                    <button
                      onClick={handleCopyLogs}
                      className="px-3 py-1 rounded-lg bg-[#27272a] hover:bg-[#3f3f46] text-slate-200 border border-white/10 text-xs font-bold flex items-center gap-1 transition-all"
                    >
                      {copiedLogs ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedLogs ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                {/* Subsystem & Severity Filters */}
                <div className="flex items-center gap-2 flex-wrap text-xs">
                  {/* Subsystem filter */}
                  <select
                    value={logSubsystemFilter}
                    onChange={(e) => setLogSubsystemFilter(e.target.value)}
                    className="bg-[#09090b] border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Subsystems</option>
                    <option value="ebpf">eBPF Socket / Syscall</option>
                    <option value="cgroup2">cgroup2 / Memory</option>
                    <option value="kubelet">Kubelet / PLEG</option>
                    <option value="dmesg">dmesg / Linux Kernel</option>
                    <option value="tcp">TCP / Network Sched</option>
                    <option value="nvme_io">NVMe / Storage I/O</option>
                  </select>

                  {/* Severity filter */}
                  <select
                    value={logLevelFilter}
                    onChange={(e) => setLogLevelFilter(e.target.value)}
                    className="bg-[#09090b] border border-white/10 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none focus:border-purple-500"
                  >
                    <option value="all">All Levels</option>
                    <option value="INFO">INFO</option>
                    <option value="WARN">WARN</option>
                    <option value="ERR">ERROR</option>
                  </select>

                  {/* Search query input */}
                  <div className="relative flex-1 min-w-[160px]">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Search dmesg & eBPF logs..."
                      value={logSearch}
                      onChange={(e) => setLogSearch(e.target.value)}
                      className="bg-[#09090b] border border-white/10 rounded-lg pl-7 pr-3 py-1 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Terminal Log Console Viewer */}
              <div
                ref={logContainerRef}
                className="rounded-2xl border border-white/10 bg-[#070709] p-4 font-mono text-xs space-y-2 max-h-[420px] overflow-y-auto"
              >
                {filteredKernelLogs.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    No kernel log entries match the selected filter.
                  </div>
                ) : (
                  filteredKernelLogs.map((log) => {
                    const isWarn = log.level === 'WARN';
                    const isErr = log.level === 'ERR';
                    const isEbpf = log.subsystem === 'ebpf';

                    return (
                      <div
                        key={log.id}
                        className={`p-2.5 rounded-lg border transition-colors leading-relaxed flex items-start gap-2.5 ${
                          isWarn
                            ? 'bg-amber-950/20 border-amber-500/30 text-amber-200'
                            : isErr
                            ? 'bg-rose-950/20 border-rose-500/30 text-rose-200'
                            : isEbpf
                            ? 'bg-purple-950/15 border-purple-500/20 text-purple-200'
                            : 'bg-white/[0.02] border-white/5 text-slate-300'
                        }`}
                      >
                        <span className="text-[10px] text-slate-500 whitespace-nowrap shrink-0">
                          {log.relativeTime}
                        </span>

                        <span
                          className={`px-1.5 py-0.2 rounded text-[9px] font-bold uppercase shrink-0 ${
                            isWarn
                              ? 'bg-amber-500/20 text-amber-300'
                              : isErr
                              ? 'bg-rose-500/20 text-rose-300'
                              : 'bg-cyan-500/20 text-cyan-300'
                          }`}
                        >
                          {log.level}
                        </span>

                        <span className="text-[10px] font-bold text-slate-400 uppercase shrink-0">
                          [{log.subsystem}]
                        </span>

                        <span className="text-white break-all flex-1">{log.message}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* ======================================================== */}
          {/* TAB 3: HARDWARE, TAINTS & LABELS                         */}
          {/* ======================================================== */}
          {activeTab === 'hardware_labels' && (
            <div className="space-y-6">
              {/* System Specs & Hardware Matrix */}
              <div className="bg-[#141416] border border-white/10 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-emerald-400" />
                  Host Hardware & Linux System Profile
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 rounded-lg bg-[#0e0e11] border border-white/5 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Instance Type</span>
                    <div className="font-bold text-white font-mono">{data?.instanceType}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e0e11] border border-white/5 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Kernel Version</span>
                    <div className="font-bold text-cyan-300 font-mono">{data?.kernelVersion}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e0e11] border border-white/5 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Container Runtime</span>
                    <div className="font-bold text-purple-300 font-mono">{data?.containerRuntime}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e0e11] border border-white/5 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Kubelet Version</span>
                    <div className="font-bold text-emerald-300 font-mono">{data?.kubeletVersion}</div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e0e11] border border-white/5 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Provider ID</span>
                    <div className="font-bold text-white font-mono text-[11px] truncate" title={data?.providerId}>
                      {data?.providerId}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-[#0e0e11] border border-white/5 space-y-1">
                    <span className="text-slate-500 text-[10px] uppercase font-bold">Uptime & Boot</span>
                    <div className="font-bold text-slate-200">{data?.uptime}</div>
                  </div>
                </div>
              </div>

              {/* Taints & Tolerations */}
              <div className="bg-[#141416] border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <AlertOctagon className="w-4 h-4 text-amber-400" />
                  Kubernetes Node Taints
                </h3>

                {(data?.taints || []).length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>No scheduling taints applied. Node is freely allocatable by scheduler.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data?.taints.map((taint, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-lg bg-amber-950/20 border border-amber-500/30 text-xs font-mono flex items-center justify-between"
                      >
                        <span className="text-amber-200 font-bold">
                          {taint.key} {taint.value && `= ${taint.value}`}
                        </span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold border border-amber-500/40 text-[10px]">
                          {taint.effect}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Node Labels Table */}
              <div className="bg-[#141416] border border-white/10 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Tag className="w-4 h-4 text-cyan-400" />
                  Kubernetes Node Labels
                </h3>

                <div className="rounded-xl border border-white/5 bg-[#09090b] divide-y divide-white/5 max-h-64 overflow-y-auto">
                  {Object.entries(data?.labels || {}).map(([key, val]) => (
                    <div key={key} className="p-2.5 text-xs font-mono flex items-center justify-between gap-3">
                      <span className="text-cyan-300 font-semibold truncate">{key}</span>
                      <span className="text-slate-300 truncate">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
