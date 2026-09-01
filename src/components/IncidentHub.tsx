import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  Filter,
  Flame,
  GitBranch,
  GitCommit,
  Layers,
  Play,
  RefreshCw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Terminal,
  Zap,
  ArrowRight,
  Eye,
  Check,
  Copy,
  ChevronDown,
  ChevronRight,
  Cpu,
  Server,
  FileCode,
  Tag,
  Hash,
  Activity
} from 'lucide-react';
import {
  UnifiedIncident,
  IncidentSeverity,
  IncidentStatus,
  IncidentTimelineEvent,
  IncidentEvidenceItem,
  IncidentAiAnalysis
} from '../types';
import { AnimatedStatusBadge, AnimatedMetricCard } from './AnimatedStatusComponents';

interface IncidentHubProps {
  onShowToast: (type: 'success' | 'error' | 'info', title: string, description: string) => void;
  onNavigateTab?: (tab: string) => void;
}

export const IncidentHub: React.FC<IncidentHubProps> = ({ onShowToast, onNavigateTab }) => {
  const [incidents, setIncidents] = useState<UnifiedIncident[]>([]);
  const [selectedIncident, setSelectedIncident] = useState<UnifiedIncident | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isDiagnosing, setIsDiagnosing] = useState<boolean>(false);
  const [isRemediating, setIsRemediating] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'timeline' | 'ai_rca' | 'evidence' | 'logs' | 'diff'>('timeline');
  const [copiedCli, setCopiedCli] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    open: 0,
    investigating: 0,
    resolved: 0,
    critical: 0,
    high: 0,
    dedupedSignals: 0,
  });

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'ALL') queryParams.append('status', statusFilter);
      if (severityFilter !== 'ALL') queryParams.append('severity', severityFilter);

      const res = await fetch(`/api/incidents?${queryParams.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setIncidents(data.incidents || []);
        if (data.stats) setStats(data.stats);
        if (!selectedIncident && data.incidents && data.incidents.length > 0) {
          setSelectedIncident(data.incidents[0]);
        } else if (selectedIncident) {
          const updated = data.incidents.find((i: UnifiedIncident) => i.id === selectedIncident.id);
          if (updated) setSelectedIncident(updated);
        }
      }
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      onShowToast('error', 'Sync Failed', 'Could not load unified incident stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [statusFilter, severityFilter]);

  const handleUpdateStatus = async (incidentId: string, nextStatus: IncidentStatus) => {
    try {
      const res = await fetch(`/api/incidents/${incidentId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      });
      if (res.ok) {
        const data = await res.json();
        onShowToast('success', 'Incident Status Updated', `Incident ${incidentId} transitioned to ${nextStatus}.`);
        fetchIncidents();
      }
    } catch (err) {
      onShowToast('error', 'Status Update Failed', 'Could not transition incident lifecycle state.');
    }
  };

  const handleAiDiagnose = async (incidentId: string) => {
    setIsDiagnosing(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/ai-diagnose`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        onShowToast('success', 'AI RCA Generated', `Gemini completed root cause analysis (Confidence ${data.aiAnalysis?.confidence}%).`);
        setSelectedIncident(data.incident);
        setActiveDetailTab('ai_rca');
        fetchIncidents();
      }
    } catch (err) {
      onShowToast('error', 'AI Diagnosis Failed', 'Could not analyze incident logs and diffs.');
    } finally {
      setIsDiagnosing(false);
    }
  };

  const handleRemediate = async (incidentId: string) => {
    setIsRemediating(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/remediate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actionType: 'auto_patch_restart' }),
      });
      if (res.ok) {
        const data = await res.json();
        onShowToast('success', 'Autonomous Remediation Executed', data.message);
        setSelectedIncident(data.incident);
        fetchIncidents();
      }
    } catch (err) {
      onShowToast('error', 'Remediation Failed', 'Autonomous execution encountered an error.');
    } finally {
      setIsRemediating(false);
    }
  };

  const handleSimulateNew = async () => {
    try {
      const res = await fetch('/api/incidents/simulate-new', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          failureType: 'CrashLoopBackOff',
          service: 'payment-gateway',
          severity: 'CRITICAL',
        }),
      });
      if (res.ok) {
        const data = await res.json();
        onShowToast('info', 'Simulated Incident Triggered', `Injected synthetic fault. Fingerprint created: ${data.incident.fingerprint}`);
        setSelectedIncident(data.incident);
        fetchIncidents();
      }
    } catch (err) {
      onShowToast('error', 'Simulation Failed', 'Could not trigger test incident.');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCli(id);
    onShowToast('info', 'Copied to Clipboard', text);
    setTimeout(() => setCopiedCli(null), 2000);
  };

  const filteredIncidents = incidents.filter((inc) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      inc.id.toLowerCase().includes(q) ||
      inc.title.toLowerCase().includes(q) ||
      inc.service.toLowerCase().includes(q) ||
      inc.fingerprint.toLowerCase().includes(q) ||
      inc.failureType.toLowerCase().includes(q)
    );
  });

  const getSeverityBadge = (severity: IncidentSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return <AnimatedStatusBadge status="critical" label="CRITICAL" size="sm" />;
      case 'HIGH':
        return <AnimatedStatusBadge status="warning" label="HIGH" size="sm" />;
      case 'WARNING':
        return <AnimatedStatusBadge status="warning" label="WARNING" size="sm" />;
      default:
        return <AnimatedStatusBadge status="info" label="INFO" size="sm" />;
    }
  };

  const getStatusBadge = (status: IncidentStatus) => {
    switch (status) {
      case 'OPEN':
        return <AnimatedStatusBadge status="critical" label="OPEN" size="sm" />;
      case 'INVESTIGATING':
        return <AnimatedStatusBadge status="investigating" label="INVESTIGATING" size="sm" />;
      case 'RESOLVED':
        return <AnimatedStatusBadge status="resolved" label="RESOLVED" size="sm" />;
      default:
        return null;
    }
  };

  const getTimelineIcon = (type: IncidentTimelineEvent['type']) => {
    switch (type) {
      case 'commit':
        return <GitCommit className="w-4 h-4 text-purple-400" />;
      case 'ci_start':
      case 'ci_pass':
        return <Play className="w-4 h-4 text-cyan-400" />;
      case 'ci_fail':
        return <AlertTriangle className="w-4 h-4 text-rose-400" />;
      case 'deploy_start':
        return <Layers className="w-4 h-4 text-blue-400" />;
      case 'pod_crash':
      case 'deploy_fail':
        return <AlertOctagon className="w-4 h-4 text-rose-400" />;
      case 'k8s_event':
        return <Activity className="w-4 h-4 text-amber-400" />;
      case 'incident_detected':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'ai_analyzed':
        return <Sparkles className="w-4 h-4 text-emerald-400" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div id="incident-hub-container" className="space-y-6">
      {/* Top Banner: Metric Highlights & Fingerprinting Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <AnimatedMetricCard
          title="Active Incidents"
          value={stats.open + stats.investigating}
          subValue="Active in fleet"
          trend="critical"
          trendValue={`${stats.critical} Crit • ${stats.high} High`}
          icon={<Flame className="w-5 h-5 text-rose-400" />}
        />

        <AnimatedMetricCard
          title="Fingerprint Deduped"
          value={stats.dedupedSignals}
          subValue={`Into ${stats.total} incidents`}
          icon={<Hash className="w-5 h-5 text-cyan-400" />}
        />

        <AnimatedMetricCard
          title="Investigating"
          value={stats.investigating}
          subValue="Under active SRE triage"
          trend="down"
          trendValue="In triage"
          icon={<Activity className="w-5 h-5 text-amber-400" />}
        />

        <AnimatedMetricCard
          title="Resolved"
          value={stats.resolved}
          subValue="Remediated closures"
          trend="up"
          trendValue="Closed"
          icon={<CheckCircle2 className="w-5 h-5 text-emerald-400" />}
        />

        <AnimatedMetricCard
          title="AI Diagnostic Engine"
          value="Gemini 3.7"
          subValue="Correlating traces"
          icon={<Sparkles className="w-5 h-5 text-purple-400" />}
        />
      </div>

      {/* Control Bar: Filters, Search & Simulation Trigger */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/70 dark:bg-slate-900/70 border border-slate-800 dark:border-slate-800 rounded-xl p-3.5 shadow-md">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, fingerprint, service..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950/70 border border-slate-800 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN Only</option>
              <option value="INVESTIGATING">INVESTIGATING Only</option>
              <option value="RESOLVED">RESOLVED Only</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-950/70 border border-slate-800 text-xs text-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500/50"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">CRITICAL</option>
              <option value="HIGH">HIGH</option>
              <option value="WARNING">WARNING</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchIncidents}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSimulateNew}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-900/30 transition"
          >
            <Flame className="w-3.5 h-3.5" />
            Simulate Synthetic Incident
          </button>
        </div>
      </div>

      {/* Main Two-Column Incident Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Incidents List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-semibold uppercase tracking-wider">Correlated Incidents ({filteredIncidents.length})</span>
            <span>Deterministic Fingerprints</span>
          </div>

          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {filteredIncidents.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center"
                >
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-200">No matching incidents found</p>
                  <p className="text-xs text-slate-500 mt-1">All telemetry is within nominal SLO limits or filtered out.</p>
                </motion.div>
              ) : (
                filteredIncidents.map((inc) => {
                  const isSelected = selectedIncident?.id === inc.id;
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: -10, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, height: 0 }}
                      transition={{ duration: 0.25 }}
                      whileHover={{ scale: 1.01, transition: { duration: 0.15 } }}
                      key={inc.id}
                      id={`incident-card-${inc.id}`}
                      onClick={() => setSelectedIncident(inc)}
                      className={`p-4 rounded-xl border transition cursor-pointer relative overflow-hidden ${
                        isSelected
                          ? 'bg-slate-900 border-cyan-500/60 shadow-lg shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                          : 'bg-slate-900/60 hover:bg-slate-900/90 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-cyan-400">{inc.id}</span>
                          {getSeverityBadge(inc.severity)}
                          {getStatusBadge(inc.status)}
                        </div>
                        <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                          {new Date(inc.firstSeenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-100 line-clamp-1 group-hover:text-cyan-300">
                        {inc.title}
                      </h4>

                      <div className="mt-2.5 flex items-center justify-between text-xs text-slate-400 font-mono">
                        <div className="flex items-center gap-2">
                          <Server className="w-3.5 h-3.5 text-slate-500" />
                          <span>{inc.service}</span>
                          <span className="text-slate-600">•</span>
                          <span className="text-slate-400">{inc.namespace}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-slate-950/80 px-2 py-0.5 rounded border border-slate-800/80">
                          <Hash className="w-3 h-3 text-cyan-400" />
                          <span className="text-cyan-300 font-semibold">{inc.duplicateSignalCount || 1} deduplicated</span>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] font-mono text-slate-500 truncate bg-slate-950/50 px-2 py-1 rounded border border-slate-800/50">
                        Fingerprint: <span className="text-slate-400">{inc.fingerprint}</span>
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Right Column: Selected Incident Deep Dive & Timeline */}
        <div className="lg:col-span-7">
          {selectedIncident ? (
            <div id={`incident-detail-${selectedIncident.id}`} className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-xl space-y-6">
              {/* Header: Title, Controls & Status Transitions */}
              <div className="border-b border-slate-800/80 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-mono font-bold text-cyan-400">{selectedIncident.id}</span>
                    {getSeverityBadge(selectedIncident.severity)}
                    {getStatusBadge(selectedIncident.status)}
                    <span className="text-xs font-mono text-slate-400">
                      Env: <strong className="text-slate-200">{selectedIncident.environment}</strong>
                    </span>
                  </div>

                  {/* Lifecycle Actions */}
                  <div className="flex items-center gap-2">
                    {selectedIncident.status === 'OPEN' && (
                      <button
                        onClick={() => handleUpdateStatus(selectedIncident.id, 'INVESTIGATING')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 transition"
                      >
                        Start Investigating
                      </button>
                    )}
                    {selectedIncident.status !== 'RESOLVED' ? (
                      <button
                        onClick={() => handleUpdateStatus(selectedIncident.id, 'RESOLVED')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 transition"
                      >
                        Mark Resolved
                      </button>
                    ) : (
                      <button
                        onClick={() => handleUpdateStatus(selectedIncident.id, 'OPEN')}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        Re-open Incident
                      </button>
                    )}
                  </div>
                </div>

                <h2 className="text-lg font-bold text-white mt-1">
                  {selectedIncident.title}
                </h2>

                {/* Metadata Pill Bar */}
                <div className="mt-3 flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800/80">
                  <div className="flex items-center gap-1.5">
                    <Server className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Service: <strong className="text-slate-200">{selectedIncident.service}</strong></span>
                  </div>
                  {selectedIncident.commitSha && (
                    <div className="flex items-center gap-1.5">
                      <GitCommit className="w-3.5 h-3.5 text-purple-400" />
                      <span>Commit: <strong className="text-purple-300">{selectedIncident.commitSha}</strong> ({selectedIncident.commitAuthor})</span>
                    </div>
                  )}
                  {selectedIncident.restartCount !== undefined && (
                    <div className="flex items-center gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5 text-rose-400" />
                      <span>Restarts: <strong className="text-rose-300">{selectedIncident.restartCount}</strong></span>
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Hash className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deduped Signals: <strong className="text-amber-300">{selectedIncident.duplicateSignalCount || 1}</strong></span>
                  </div>
                </div>
              </div>

              {/* Tabs: Interactive Multi-Point Timeline, AI Root Cause Analysis, Evidence, Logs, Diff */}
              <div>
                <div className="flex border-b border-slate-800 overflow-x-auto gap-2">
                  <button
                    onClick={() => setActiveDetailTab('timeline')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeDetailTab === 'timeline'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    Interactive Multi-Point Timeline ({selectedIncident.timeline.length})
                  </button>

                  <button
                    onClick={() => setActiveDetailTab('ai_rca')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeDetailTab === 'ai_rca'
                        ? 'border-purple-400 text-purple-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    AI Root Cause Analysis & Fix
                    {selectedIncident.aiAnalysis?.confidence && (
                      <span className="ml-1 px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                        {selectedIncident.aiAnalysis.confidence}%
                      </span>
                    )}
                  </button>

                  <button
                    onClick={() => setActiveDetailTab('evidence')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeDetailTab === 'evidence'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    Correlated Evidence ({selectedIncident.evidence?.length || 0})
                  </button>

                  <button
                    onClick={() => setActiveDetailTab('logs')}
                    className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                      activeDetailTab === 'logs'
                        ? 'border-cyan-400 text-cyan-400'
                        : 'border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    Pod & Event Logs
                  </button>

                  {selectedIncident.gitDiffSnippet && (
                    <button
                      onClick={() => setActiveDetailTab('diff')}
                      className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition whitespace-nowrap flex items-center gap-1.5 ${
                        activeDetailTab === 'diff'
                          ? 'border-cyan-400 text-cyan-400'
                          : 'border-transparent text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      Git Diff
                    </button>
                  )}
                </div>

                {/* Tab Content 1: Multi-Point Timeline View (Blueprint Phase 17/22 core requirement) */}
                {activeDetailTab === 'timeline' && (
                  <div className="pt-4 space-y-4">
                    <div className="bg-slate-950/60 rounded-xl p-4 border border-slate-800">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                          Full Incident Lifecycle (Commit pushed ➔ CI passed ➔ Pod crashed ➔ AI diagnosed)
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {selectedIncident.timeline.length} correlated events
                        </span>
                      </div>

                      <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                        {selectedIncident.timeline.map((event, idx) => (
                          <div key={event.id || idx} className="relative group">
                            <div className="absolute -left-6 mt-1 w-5 h-5 rounded-full bg-slate-900 border-2 border-slate-700 flex items-center justify-center group-hover:border-cyan-400 transition">
                              {getTimelineIcon(event.type)}
                            </div>

                            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 hover:border-slate-700 transition">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-semibold text-slate-200">
                                  {event.title}
                                </span>
                                <div className="flex items-center gap-2">
                                  {event.source && (
                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                      {event.source}
                                    </span>
                                  )}
                                  <span className="text-xs font-mono text-slate-400">
                                    {event.timeFormatted || new Date(event.timestamp).toLocaleTimeString()}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-slate-400 mt-1">
                                {event.description}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Tab Content 2: AI Root Cause Analysis (Gemini 3.7 Flash) */}
                {activeDetailTab === 'ai_rca' && (
                  <div className="pt-4 space-y-5">
                    <div className="flex items-center justify-between bg-purple-950/30 border border-purple-800/40 rounded-xl p-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-purple-400" />
                          <h3 className="text-sm font-bold text-purple-200">
                            Gemini 3.7 Flash Root Cause Diagnostics
                          </h3>
                          {selectedIncident.aiAnalysis?.confidence && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                              {selectedIncident.aiAnalysis.confidence}% Confidence
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-purple-300/80 mt-1">
                          Correlated git commits, container exit logs, and Kubernetes Secret configurations.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleAiDiagnose(selectedIncident.id)}
                          disabled={isDiagnosing}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow transition"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isDiagnosing ? 'animate-spin' : ''}`} />
                          {isDiagnosing ? 'Re-analyzing...' : 'Re-Run AI RCA'}
                        </button>
                      </div>
                    </div>

                    {selectedIncident.aiAnalysis ? (
                      <div className="space-y-4">
                        {/* Summary & Direct Cause */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">Executive Summary</h4>
                            <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                              {selectedIncident.aiAnalysis.summary}
                            </p>
                          </div>
                          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider">Root Cause</h4>
                            <p className="text-xs text-slate-200 mt-2 leading-relaxed">
                              {selectedIncident.aiAnalysis.rootCause}
                            </p>
                          </div>
                        </div>

                        {/* Why it happened & What changed */}
                        {(selectedIncident.aiAnalysis.whyItHappened || selectedIncident.aiAnalysis.whatChanged) && (
                          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-3">
                            {selectedIncident.aiAnalysis.whyItHappened && (
                              <div>
                                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Why It Happened</h4>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                  {selectedIncident.aiAnalysis.whyItHappened}
                                </p>
                              </div>
                            )}
                            {selectedIncident.aiAnalysis.whatChanged && (
                              <div>
                                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider">Triggering Change</h4>
                                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                  {selectedIncident.aiAnalysis.whatChanged}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Evidence Points */}
                        {selectedIncident.aiAnalysis.evidenceSummary && selectedIncident.aiAnalysis.evidenceSummary.length > 0 && (
                          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4">
                            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">Verified Evidence</h4>
                            <ul className="space-y-1.5">
                              {selectedIncident.aiAnalysis.evidenceSummary.map((ev, i) => (
                                <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{ev}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {/* Recommended Remediation Steps */}
                        {selectedIncident.aiAnalysis.recommendedSolution && (
                          <div className="bg-emerald-950/20 border border-emerald-800/40 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                                Actionable Remediation Plan
                              </h4>
                              <button
                                onClick={() => handleRemediate(selectedIncident.id)}
                                disabled={isRemediating || selectedIncident.status === 'RESOLVED'}
                                className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white transition shadow-md shadow-emerald-950/50"
                              >
                                <Zap className="w-3.5 h-3.5" />
                                {isRemediating ? 'Applying...' : 'Execute 1-Click Autonomous Patch'}
                              </button>
                            </div>

                            <div className="space-y-2">
                              {selectedIncident.aiAnalysis.recommendedSolution.map((step, idx) => (
                                <div key={idx} className="text-xs text-slate-200 flex items-start gap-2">
                                  <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-mono text-[10px] shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="mt-0.5">{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Ready-to-Run Kubectl CLI Commands */}
                        {selectedIncident.aiAnalysis.cliCommands && selectedIncident.aiAnalysis.cliCommands.length > 0 && (
                          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
                            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                              Verified Kubectl Commands
                            </span>
                            {selectedIncident.aiAnalysis.cliCommands.map((cmd, i) => (
                              <div key={i} className="flex items-center justify-between bg-black/70 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-cyan-300">
                                <span className="truncate mr-2">$ {cmd}</span>
                                <button
                                  onClick={() => copyToClipboard(cmd, `cmd-${i}`)}
                                  className="text-slate-400 hover:text-white p-1 rounded transition shrink-0"
                                >
                                  {copiedCli === `cmd-${i}` ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="bg-slate-950/50 border border-slate-800 rounded-xl p-6 text-center">
                        <Sparkles className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-slate-300">No AI RCA generated yet</p>
                        <button
                          onClick={() => handleAiDiagnose(selectedIncident.id)}
                          className="mt-3 px-4 py-1.5 rounded-lg text-xs font-bold bg-purple-600 text-white"
                        >
                          Run Gemini Root Cause Diagnostic
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content 3: Correlated Evidence Items */}
                {activeDetailTab === 'evidence' && (
                  <div className="pt-4 space-y-3">
                    {selectedIncident.evidence && selectedIncident.evidence.length > 0 ? (
                      selectedIncident.evidence.map((ev) => (
                        <div key={ev.id} className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                {ev.source}
                              </span>
                              <h4 className="text-xs font-bold text-slate-200">{ev.title}</h4>
                            </div>
                            {ev.verified && (
                              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Verified Correlation
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-400">{ev.details}</p>
                          {ev.rawSnippet && (
                            <pre className="bg-black/60 border border-slate-800/80 rounded-lg p-2.5 text-[11px] font-mono text-rose-300 overflow-x-auto">
                              {ev.rawSnippet}
                            </pre>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-500">No structured evidence items attached.</p>
                    )}
                  </div>
                )}

                {/* Tab Content 4: Pod & Kubernetes Event Logs */}
                {activeDetailTab === 'logs' && (
                  <div className="pt-4 space-y-4">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Pod Stdout / Stderr Stream
                      </span>
                      <pre className="bg-black/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-72 leading-relaxed">
                        {selectedIncident.rawLogs.join('\n')}
                      </pre>
                    </div>

                    {selectedIncident.k8sEvents && selectedIncident.k8sEvents.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                          Kubernetes Event Stream
                        </span>
                        <div className="space-y-1.5">
                          {selectedIncident.k8sEvents.map((evt, idx) => (
                            <div key={idx} className="bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 text-xs font-mono text-amber-300">
                              {evt}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Tab Content 5: Git Diff */}
                {activeDetailTab === 'diff' && selectedIncident.gitDiffSnippet && (
                  <div className="pt-4">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                      Correlated Git Diff Patch
                    </span>
                    <pre className="bg-black/80 border border-slate-800 rounded-xl p-4 text-xs font-mono text-emerald-300 overflow-x-auto">
                      {selectedIncident.gitDiffSnippet}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-12 text-center">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-300">Select an Incident to Inspect</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Click any incident from the list on the left to view the interactive multi-point timeline, AI root cause diagnosis, and 1-click remediation.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
