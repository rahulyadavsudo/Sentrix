import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  Boxes,
  CheckCircle2,
  DollarSign,
  Flame,
  GitBranch,
  Globe,
  Lock,
  RefreshCw,
  Sparkles,
  Zap,
} from 'lucide-react';
import { AlertIntegrationsHub } from './components/AlertIntegrationsHub';
import { AnimatedBackground } from './components/AnimatedBackground';
import { AutoHealPolicyEngine } from './components/AutoHealPolicyEngine';
import { CanaryControlPanel } from './components/CanaryControlPanel';
import { ChaosSandbox } from './components/ChaosSandbox';
import { ClusterTopologyView } from './components/ClusterTopologyView';
import { ContinuousLoadHarness } from './components/ContinuousLoadHarness';
import { DiagnosticRCAPanel } from './components/DiagnosticRCAPanel';
import { DisasterRecoveryHub } from './components/DisasterRecoveryHub';
import { DistributedTracingExplorer } from './components/DistributedTracingExplorer';
import { EbpfKernelTracer } from './components/EbpfKernelTracer';
import { FailureHistoryStudio } from './components/FailureHistoryStudio';
import { FinOpsPanel } from './components/FinOpsPanel';
import { GitOpsSyncStudio } from './components/GitOpsSyncStudio';
import { Header } from './components/Header';
import { AuthLoginModal, UserSession } from './components/AuthLoginModal';
import { NotificationCenter, AppNotification } from './components/NotificationCenter';
import { CommandPalette } from './components/CommandPalette';
import { GitHubRepoSyncModal } from './components/GitHubRepoSyncModal';
import { HelmCrdManager } from './components/HelmCrdManager';
import { IncidentHub } from './components/IncidentHub';
import { KedaAutoscalingPanel } from './components/KedaAutoscalingPanel';
import { LogCollectorServiceHub } from './components/LogCollectorServiceHub';
import { LogViewer } from './components/LogViewer';
import { MicroserviceProfiler } from './components/MicroserviceProfiler';
import { MicroserviceSpecsDrawer } from './components/MicroserviceSpecsDrawer';
import { ModelSwitchHub } from './components/ModelSwitchHub';
import { MultiClusterFleetManager } from './components/MultiClusterFleetManager';
import { NavigationTabs, TabType } from './components/NavigationTabs';
import { PipelineMonitor } from './components/PipelineMonitor';
import { PostMortemViewer } from './components/PostMortemViewer';
import { PredictiveLeakRadar } from './components/PredictiveLeakRadar';
import { ProductionReadinessHub } from './components/ProductionReadinessHub';
import { RegisterClusterModal } from './components/RegisterClusterModal';
import { RunbookAutomationStudio } from './components/RunbookAutomationStudio';
import { SecurityComplianceAudit } from './components/SecurityComplianceAudit';
import { SentrixSidebar } from './components/SentrixSidebar';
import { ServiceMeshTopology } from './components/ServiceMeshTopology';
import { SloBudgetDashboard } from './components/SloBudgetDashboard';
import { SmartRebalancerStudio } from './components/SmartRebalancerStudio';
import { SreCopilotChat } from './components/SreCopilotChat';
import { TechStackDiscovery } from './components/TechStackDiscovery';
import { UITemplateShowcaseModal } from './components/UITemplateShowcaseModal';
import { ZeroTrustSecretsVault } from './components/ZeroTrustSecretsVault';
import {
  AlertIntegrationChannel,
  AutomatedRunbook,
  AutoHealingRecord,
  AutoHealPolicy,
  CanaryDeployment,
  ChaosExperiment,
  ClusterFleetNode,
  ClusterOverview,
  CommitActivity,
  DiagnosticIssue,
  DisasterRecoveryRegion,
  DistributedTrace,
  EbpfKernelEvent,
  EbpfSyscallStats,
  FinOpsBreakdown,
  FlamegraphNode,
  GitHubRepo,
  GitOpsApp,
  HelmRelease,
  K8sNamespace,
  K8sNode,
  K8sPod,
  KedaScaledObject,
  KubernetesCRD,
  LanguageRuntimeTelemetry,
  LogEntry,
  PredictiveOOMAlert,
  SecurityAuditReport,
  ServiceMeshGraph,
  SloTarget,
  VaultSecretItem,
  WorkflowRun,
} from './types';
import { safeFetchJson } from './lib/api';

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('incidents');
  const [loading, setLoading] = useState<boolean>(true);
  const [isHealing, setIsHealing] = useState<boolean>(false);
  const [isUpdatingCanary, setIsUpdatingCanary] = useState<boolean>(false);
  const [isSyncingGitOps, setIsSyncingGitOps] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('cloudops_theme');
    return saved === 'light' ? 'light' : 'dark';
  });
  const [toastMessage, setToastMessage] = useState<{
    type: 'success' | 'error' | 'info';
    title: string;
    description: string;
  } | null>(null);

  // Sync theme with HTML root class
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
    localStorage.setItem('cloudops_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    showToast('info', 'Theme Switched', `Active theme is now ${theme === 'dark' ? 'Light' : 'Dark'} Mode.`);
  };

  // Core telemetry state
  const [clusterOverview, setClusterOverview] = useState<ClusterOverview | null>(null);
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [commits, setCommits] = useState<CommitActivity[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [nodes, setNodes] = useState<K8sNode[]>([]);
  const [pods, setPods] = useState<K8sPod[]>([]);
  const [namespaces, setNamespaces] = useState<K8sNamespace[]>([]);
  const [predictiveAlerts, setPredictiveAlerts] = useState<PredictiveOOMAlert[]>([]);
  const [issues, setIssues] = useState<DiagnosticIssue[]>([]);
  const [healingHistory, setHealingHistory] = useState<AutoHealingRecord[]>([]);
  const [canary, setCanary] = useState<CanaryDeployment | null>(null);
  const [finops, setFinops] = useState<FinOpsBreakdown | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);

  // Phase 2 State
  const [meshGraph, setMeshGraph] = useState<ServiceMeshGraph | null>(null);
  const [languageProfiles, setLanguageProfiles] = useState<LanguageRuntimeTelemetry[]>([]);
  const [gitOpsApps, setGitOpsApps] = useState<GitOpsApp[]>([]);
  const [chaosExperiments, setChaosExperiments] = useState<ChaosExperiment[]>([]);

  // Phase 3 State
  const [policies, setPolicies] = useState<AutoHealPolicy[]>([]);
  const [sloTargets, setSloTargets] = useState<SloTarget[]>([]);
  const [clusterFleet, setClusterFleet] = useState<ClusterFleetNode[]>([]);
  const [securityReport, setSecurityReport] = useState<SecurityAuditReport | null>(null);
  const [alertChannels, setAlertChannels] = useState<AlertIntegrationChannel[]>([]);

  // Phase 4 State
  const [ebpfEvents, setEbpfEvents] = useState<EbpfKernelEvent[]>([]);
  const [ebpfStats, setEbpfStats] = useState<EbpfSyscallStats[]>([]);
  const [runbooks, setRunbooks] = useState<AutomatedRunbook[]>([]);
  const [drRegions, setDrRegions] = useState<DisasterRecoveryRegion[]>([]);

  // Phase 5 State
  const [traces, setTraces] = useState<DistributedTrace[]>([]);
  const [flamegraph, setFlamegraph] = useState<FlamegraphNode | null>(null);
  const [helmReleases, setHelmReleases] = useState<HelmRelease[]>([]);
  const [crds, setCrds] = useState<KubernetesCRD[]>([]);
  const [scaledObjects, setScaledObjects] = useState<KedaScaledObject[]>([]);
  const [vaultSecrets, setVaultSecrets] = useState<VaultSecretItem[]>([]);
  const [isRegisterClusterOpen, setIsRegisterClusterOpen] = useState(false);
  const [isRepoSyncModalOpen, setIsRepoSyncModalOpen] = useState(false);
  const [isSyncingRepo, setIsSyncingRepo] = useState(false);
  const [isUITemplatesOpen, setIsUITemplatesOpen] = useState(false);
  const [activeUiTemplate, setActiveUiTemplate] = useState<'linear-dark' | 'swiss-light' | 'executive-bento'>('linear-dark');
  const [activeAiModel, setActiveAiModel] = useState<string>('gemini-3.7-flash');
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    try {
      const saved = localStorage.getItem('sentrix_current_user');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      email: 'rahulyadav.RY16@gmail.com',
      name: 'Rahul Yadav',
      role: 'Cluster Admin',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=rahulyadav',
      organization: 'Enterprise Production Fleet',
      lastLogin: new Date().toISOString(),
      token: `sre_sec_rahul_${Date.now()}`,
    };
  });

  // Verify and sync user session with Express backend on boot
  useEffect(() => {
    const syncSessionWithServer = async () => {
      try {
        const token = currentUser?.token;
        const res = await fetch('/api/auth/session', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          localStorage.setItem('sentrix_current_user', JSON.stringify(data.user));
        }
      } catch (err) {
        console.warn('Express session sync error:', err);
      }
    };
    syncSessionWithServer();
  }, []);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('sentrix_read_notifs');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<Set<string>>(new Set());

  // Global Keyboard listener for Command Palette (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Compute live notifications from operational telemetry
  const notifications: AppNotification[] = React.useMemo(() => {
    const list: AppNotification[] = [];

    // 1. Diagnostic Issues
    issues.forEach((issue) => {
      const id = `issue-${issue.id}`;
      list.push({
        id,
        category: 'incident',
        severity: issue.severity === 'critical' ? 'critical' : 'warning',
        title: `${issue.type} on ${issue.serviceName}`,
        description: issue.message || `Diagnostic anomaly detected on pod ${issue.podName}. Automated root cause analysis ready.`,
        timestamp: 'Active Alert',
        service: issue.serviceName,
        actionLabel: 'Remediate in Hub',
        targetTab: 'incidents',
        read: readNotificationIds.has(id),
      });
    });

    // 2. Predictive OOM Alerts
    predictiveAlerts.forEach((alert) => {
      const id = `oom-${alert.id}`;
      list.push({
        id,
        category: 'predictive',
        severity: alert.predictedMinutesToOOM < 15 ? 'critical' : 'warning',
        title: `Predictive OOM: ${alert.serviceName} (${alert.podName})`,
        description: `Memory saturation projected in ~${alert.predictedMinutesToOOM} min (slope: +${alert.growthRateMbPerMin} MB/min).`,
        timestamp: 'Radar Warning',
        service: alert.serviceName,
        actionLabel: 'Inspect Leak Radar',
        targetTab: 'predictive',
        read: readNotificationIds.has(id),
      });
    });

    // 3. Workflow Runs
    workflowRuns.slice(0, 3).forEach((run) => {
      if (run.status === 'failed') {
        const id = `workflow-${run.id}`;
        list.push({
          id,
          category: 'cicd',
          severity: 'critical',
          title: `Build #${run.id.replace('run-', '')} Failed (${run.targetService || 'service'})`,
          description: run.commitMessage || `Pipeline failed during execution on branch ${run.branch}.`,
          timestamp: new Date(run.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          service: run.targetService,
          actionLabel: 'Inspect Logs',
          targetTab: 'pipeline',
          read: readNotificationIds.has(id),
        });
      }
    });

    // 4. Security Vulnerabilities
    if (securityReport?.vulnerabilities && securityReport.vulnerabilities.length > 0) {
      const critVulns = securityReport.vulnerabilities.filter((v) => v.severity === 'CRITICAL');
      if (critVulns.length > 0) {
        const id = 'sec-crit-report';
        list.push({
          id,
          category: 'security',
          severity: 'critical',
          title: `${critVulns.length} Critical CVEs in Container Images`,
          description: `Vulnerabilities identified in ${securityReport.targetNamespace} cluster namespace. Patching recommendations generated.`,
          timestamp: 'Audit Scan',
          actionLabel: 'Security Audit',
          targetTab: 'security',
          read: readNotificationIds.has(id),
        });
      }
    }

    // 5. Recent Autonomous Healing Receipts
    healingHistory.slice(0, 3).forEach((h) => {
      const id = `heal-${h.id}`;
      list.push({
        id,
        category: 'heal',
        severity: 'success',
        title: `Auto-Remediated: ${h.serviceName}`,
        description: `Executed ${h.actionType} in ${h.timeToMitigateMs}ms. Pod health verified nominal.`,
        timestamp: new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        service: h.serviceName,
        actionLabel: 'View RCA Log',
        targetTab: 'rca',
        read: readNotificationIds.has(id),
      });
    });

    return list.filter((n) => !dismissedNotificationIds.has(n.id));
  }, [issues, predictiveAlerts, workflowRuns, securityReport, healingHistory, readNotificationIds, dismissedNotificationIds]);

  const unreadNotificationCount = React.useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const handleMarkNotifRead = (id: string) => {
    setReadNotificationIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem('sentrix_read_notifs', JSON.stringify(Array.from(next)));
      } catch {}
      return next;
    });
  };

  const handleMarkAllNotifsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setReadNotificationIds(new Set(allIds));
    try {
      localStorage.setItem('sentrix_read_notifs', JSON.stringify(allIds));
    } catch {}
    showToast('info', 'Notifications Marked Read', 'All notifications and alerts marked as read.');
  };

  const handleClearAllNotifs = () => {
    const allIds = notifications.map((n) => n.id);
    setDismissedNotificationIds((prev) => new Set([...prev, ...allIds]));
    showToast('info', 'Notifications Cleared', 'Notification drawer queue cleared.');
  };

  const handleLoginUser = (session: UserSession) => {
    setCurrentUser(session);
    try {
      localStorage.setItem('sentrix_current_user', JSON.stringify(session));
    } catch {}
    showToast('success', 'Authenticated Successfully', `Welcome, ${session.name}! SRE Role: ${session.role}.`);
  };

  const handleLogoutUser = () => {
    setCurrentUser(null);
    try {
      localStorage.removeItem('sentrix_current_user');
    } catch {}
    showToast('info', 'Operator Signed Out', 'You have been disconnected from the SRE console.');
  };

  const handleClearDemoData = async () => {
    try {
      const res = await fetch('/api/data/clear-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setIsDemoMode(false);
        setRepo(null);
        setCommits([]);
        setWorkflowRuns([]);
        setNodes([]);
        setPods([]);
        setNamespaces([]);
        setPredictiveAlerts([]);
        setIssues([]);
        setHealingHistory([]);
        setCanary(null);
        setFinops(null);
        setLogs([]);
        setMeshGraph(null);
        setLanguageProfiles([]);
        setGitOpsApps([]);
        setChaosExperiments([]);
        setClusterFleet([]);
        setSecurityReport(null);
        setAlertChannels([]);
        setEbpfEvents([]);
        setEbpfStats([]);
        setRunbooks([]);
        setDrRegions([]);
        setTraces([]);
        setFlamegraph(null);
        setHelmReleases([]);
        setCrds([]);
        setScaledObjects([]);
        setVaultSecrets([]);
        setClusterOverview({
          stats: data.stats || {
            healthScore: 100,
            totalNodes: 0,
            readyNodes: 0,
            totalPods: 0,
            runningPods: 0,
            unhealthyPods: 0,
            cpuUtilizationPercent: 0,
            memoryUtilizationPercent: 0,
            networkThroughputMBps: 0,
            activeIncidentsCount: 0,
            autoHealedCount24h: 0,
            predictiveAlertsCount: 0,
          },
          nodes: [],
          namespaces: [],
          activeRepo: null as any,
        });
        showToast(
          'success',
          'Demo Data Removed',
          'All mock and demo data has been purged. The platform is now running in clean live mode.'
        );
      }
    } catch (err: any) {
      console.error('Failed to clear demo data:', err);
      showToast('error', 'Error', err.message || 'Failed to clear demo data.');
    }
  };

  const handleApplyUiTemplate = (templateId: 'linear-dark' | 'swiss-light' | 'executive-bento') => {
    setActiveUiTemplate(templateId);
    if (templateId === 'swiss-light') {
      setTheme('light');
      showToast('success', 'Applied Swiss Clean Light UI', 'Switched to high-contrast minimal light editorial template.');
    } else if (templateId === 'linear-dark') {
      setTheme('dark');
      showToast('success', 'Applied Linear Obsidian Titanium UI', 'Switched to razor-thin minimal dark developer tool template.');
    } else if (templateId === 'executive-bento') {
      setTheme('dark');
      showToast('success', 'Applied Executive Bento Charcoal UI', 'Switched to clean structured bento dashboard template.');
    }
  };

  // Fetch all cluster & pipeline data safely
  const fetchData = async () => {
    try {
      const [
        overviewData,
        ghData,
        topData,
        predData,
        issData,
        canaryData,
        finopsData,
        logData,
        meshData,
        profData,
        gitData,
        chData,
        polData,
        sloData,
        flData,
        secData,
        alData,
        ebpfData,
        rbData,
        drData,
        trData,
        flameData,
        helmData,
        crdsData,
        scData,
        vData,
        aiData,
      ] = await Promise.all([
        safeFetchJson('/api/cluster/overview'),
        safeFetchJson('/api/github/activity'),
        safeFetchJson('/api/k8s/topology'),
        safeFetchJson('/api/k8s/predictive-alerts'),
        safeFetchJson('/api/k8s/issues'),
        safeFetchJson('/api/canary/status'),
        safeFetchJson('/api/finops/breakdown'),
        safeFetchJson('/api/logs'),
        safeFetchJson('/api/mesh/topology'),
        safeFetchJson('/api/runtime/profiles'),
        safeFetchJson('/api/gitops/apps'),
        safeFetchJson('/api/chaos/experiments'),
        safeFetchJson('/api/policies/list'),
        safeFetchJson('/api/slo/targets'),
        safeFetchJson('/api/fleet/clusters'),
        safeFetchJson('/api/security/audit'),
        safeFetchJson('/api/alerts/channels'),
        safeFetchJson('/api/ebpf/kernel-events'),
        safeFetchJson('/api/runbooks'),
        safeFetchJson('/api/disaster-recovery/regions'),
        safeFetchJson('/api/tracing/traces'),
        safeFetchJson('/api/tracing/flamegraph'),
        safeFetchJson('/api/helm/releases'),
        safeFetchJson('/api/k8s/crds'),
        safeFetchJson('/api/autoscaling/scaled-objects'),
        safeFetchJson('/api/secrets/vault-items'),
        safeFetchJson('/api/ai/models'),
      ]);

      if (overviewData) setClusterOverview(overviewData);
      if (ghData) {
        if (ghData.repo) setRepo(ghData.repo);
        if (ghData.commits || ghData.recentCommits) setCommits(ghData.commits || ghData.recentCommits || []);
        if (ghData.workflowRuns) setWorkflowRuns(ghData.workflowRuns || []);
      }
      if (topData) {
        if (topData.nodes) setNodes(topData.nodes);
        if (topData.pods) setPods(topData.pods);
        if (topData.namespaces) setNamespaces(topData.namespaces);
      }
      if (predData && predData.alerts) setPredictiveAlerts(predData.alerts);
      if (issData) {
        if (issData.issues) setIssues(issData.issues);
        if (issData.autoHealingHistory || issData.healingHistory) {
          setHealingHistory(issData.autoHealingHistory || issData.healingHistory || []);
        }
      }
      if (canaryData) setCanary(canaryData.canary || canaryData);
      if (finopsData) setFinops(finopsData);
      if (logData && logData.logs) setLogs(logData.logs);
      if (meshData && meshData.graph) setMeshGraph(meshData.graph);
      if (profData && profData.profiles) setLanguageProfiles(profData.profiles);
      if (gitData && gitData.apps) setGitOpsApps(gitData.apps);
      if (chData && chData.experiments) setChaosExperiments(chData.experiments);
      if (polData && polData.policies) setPolicies(polData.policies);
      if (sloData && sloData.slos) setSloTargets(sloData.slos);
      if (flData && flData.fleet) setClusterFleet(flData.fleet);
      if (secData && secData.report) setSecurityReport(secData.report);
      if (alData && alData.channels) setAlertChannels(alData.channels);
      if (ebpfData) {
        if (ebpfData.events) setEbpfEvents(ebpfData.events);
        if (ebpfData.stats) setEbpfStats(ebpfData.stats);
      }
      if (rbData && rbData.runbooks) setRunbooks(rbData.runbooks);
      if (drData && drData.regions) setDrRegions(drData.regions);
      if (trData && trData.traces) setTraces(trData.traces);
      if (flameData && flameData.flamegraph) setFlamegraph(flameData.flamegraph);
      if (helmData && helmData.releases) setHelmReleases(helmData.releases);
      if (crdsData && crdsData.crds) setCrds(crdsData.crds);
      if (scData && scData.scaledObjects) setScaledObjects(scData.scaledObjects);
      if (vData && vData.secrets) setVaultSecrets(vData.secrets);
      if (aiData && aiData.activeModel) setActiveAiModel(aiData.activeModel);
    } catch (err) {
      console.warn('Telemetry polling notice:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Live polling interval
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: 'success' | 'error' | 'info', title: string, description: string) => {
    setToastMessage({ type, title, description });
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // 1-Click Auto-Healing Action Handler
  const handleAutoHeal = async (issueId: string, actionType: string) => {
    setIsHealing(true);
    try {
      const res = await fetch('/api/k8s/auto-heal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueId, actionType }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          'success',
          'Autonomous Healing Complete',
          data.record?.diffApplied || 'Successfully executed declarative remediation patch.'
        );
        await fetchData();
      } else {
        showToast('error', 'Auto-Healing Failed', data.error || 'Check cluster logs.');
      }
    } catch (err) {
      console.error('Failed auto-heal execution:', err);
      showToast('error', 'Auto-Healing Network Error', 'Failed to reach Kubernetes API.');
    } finally {
      setIsHealing(false);
    }
  };

  // Trigger CI/CD Pipeline
  const handleTriggerRun = async (branch: string, service: string, simulateFailure: boolean = false) => {
    try {
      const res = await fetch('/api/github/dispatch-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, service, simulateFailure }),
      });
      const data = await res.json();
      if (data.run) {
        setWorkflowRuns((prev) => [data.run, ...prev]);
        showToast(
          simulateFailure ? 'error' : 'info',
          simulateFailure ? 'Test Failure Pipeline Dispatched' : 'Pipeline Dispatched',
          `Dispatched ${data.run.workflowName} on ${branch} for ${service} (${simulateFailure ? 'Simulated Failure Mode' : 'Standard Build'})`
        );
      }
    } catch (err) {
      console.error('Failed to trigger workflow:', err);
    }
  };

  // Connect Custom GitHub Repository
  const handleConnectRepo = async (repoUrl: string, token?: string): Promise<boolean> => {
    setIsSyncingRepo(true);
    try {
      const res = await fetch('/api/github/connect-repo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl, token }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.repo) setRepo(data.repo);
        if (data.commits) setCommits(data.commits);
        if (data.workflowRuns) setWorkflowRuns(data.workflowRuns);
        showToast(
          'success',
          'GitHub Repo Synced',
          `Connected to ${data.repo?.owner || 'repository'}/${data.repo?.name || 'main'} via GitHub REST API.`
        );
        return true;
      } else {
        showToast('error', 'Connection Error', data.error || 'Failed to connect repository.');
        return false;
      }
    } catch (err: any) {
      console.error('Error connecting custom repo:', err);
      showToast('error', 'Network Error', err.message || 'Could not reach server.');
      return false;
    } finally {
      setIsSyncingRepo(false);
    }
  };

  // Live Sync with GitHub (Refresh Telemetry & Runs)
  const handleSyncRepo = async (): Promise<boolean> => {
    setIsSyncingRepo(true);
    try {
      const res = await fetch('/api/github/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.repo) setRepo(data.repo);
        if (data.commits) setCommits(data.commits);
        if (data.workflowRuns) setWorkflowRuns(data.workflowRuns);
        showToast(
          'success',
          'GitHub Telemetry Synced',
          `Updated ${data.workflowRuns?.length || 0} workflow runs and ${data.commits?.length || 0} commits.`
        );
        return true;
      } else {
        showToast('error', 'Sync Error', data.error || 'Failed to sync with GitHub.');
        return false;
      }
    } catch (err: any) {
      console.error('Error syncing GitHub repo:', err);
      showToast('error', 'Sync Failed', err.message || 'Could not reach server.');
      return false;
    } finally {
      setIsSyncingRepo(false);
    }
  };

  // Disconnect / Clear GitHub Repository
  const handleDisconnectRepo = async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/github/disconnect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.repo) setRepo(data.repo);
        setCommits([]);
        setWorkflowRuns([]);
        showToast('info', 'Repository Disconnected', 'Cleared active GitHub repository state.');
        return true;
      }
      return false;
    } catch (err: any) {
      console.error('Error disconnecting repo:', err);
      return false;
    }
  };

  // Canary Traffic Shifting
  const handleShiftTraffic = async (weight: number) => {
    setIsUpdatingCanary(true);
    try {
      const res = await fetch('/api/canary/traffic-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trafficWeight: weight }),
      });
      const data = await res.json();
      if (data.canary) {
        setCanary(data.canary);
        showToast(
          'info',
          'Traffic Shift Ingress Updated',
          `Canary traffic routed to ${weight}% (Stable: ${100 - weight}%)`
        );
      }
    } catch (err) {
      console.error('Failed to shift canary traffic:', err);
    } finally {
      setIsUpdatingCanary(false);
    }
  };

  const handlePromoteCanary = async () => {
    setIsUpdatingCanary(true);
    try {
      const res = await fetch('/api/canary/traffic-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'promote' }),
      });
      const data = await res.json();
      if (data.canary) {
        setCanary(data.canary);
        showToast('success', 'Canary Promoted', data.message || 'Canary promoted to 100% stable.');
      }
    } finally {
      setIsUpdatingCanary(false);
    }
  };

  const handleRollbackCanary = async () => {
    setIsUpdatingCanary(true);
    try {
      const res = await fetch('/api/canary/traffic-split', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rollback' }),
      });
      const data = await res.json();
      if (data.canary) {
        setCanary(data.canary);
        showToast('error', 'Canary Rolled Back', data.message || 'Canary rolled back to 0%.');
      }
    } finally {
      setIsUpdatingCanary(false);
    }
  };

  // GitOps Sync Handler
  const handleSyncGitOps = async (appId: string) => {
    setIsSyncingGitOps(true);
    try {
      const res = await fetch('/api/gitops/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'ArgoCD Sync Complete', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('GitOps sync failed:', err);
    } finally {
      setIsSyncingGitOps(false);
    }
  };

  // Chaos Trigger Handler
  const handleTriggerChaos = async (experimentId: string) => {
    try {
      const res = await fetch('/api/chaos/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ experimentId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'Chaos Experiment Launched', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Chaos trigger failed:', err);
    }
  };

  // Phase 3 Handlers
  const handleTogglePolicy = async (
    policyId: string,
    enabled?: boolean,
    enforcementMode?: 'auto_execute' | 'dry_run_audit'
  ) => {
    try {
      const res = await fetch('/api/policies/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ policyId, enabled, enforcementMode }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Policy Configured', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle policy:', err);
    }
  };

  const handleToggleSloFreeze = async (sloId: string, freeze: boolean) => {
    try {
      const res = await fetch('/api/slo/freeze-pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sloId, freeze }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(freeze ? 'error' : 'success', 'SLO Guard Action', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle SLO freeze:', err);
    }
  };

  const handleSwitchFleetPrimary = async (clusterId: string) => {
    try {
      const res = await fetch('/api/fleet/switch-primary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clusterId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'Global Ingress Shifted', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to switch cluster primary:', err);
    }
  };

  const handleRemediateCve = async (cveId: string) => {
    try {
      const res = await fetch('/api/security/remediate-cve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cveId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'CVE Remediated & Image Rebuilt', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to remediate CVE:', err);
    }
  };

  const handleTestAlertWebhook = async (channelId: string) => {
    try {
      const res = await fetch('/api/alerts/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channelId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Webhook Dispatched', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to test webhook:', err);
    }
  };

  const handleExecuteRunbook = async (runbookId: string) => {
    try {
      const res = await fetch(`/api/runbooks/${runbookId}/execute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Runbook Execution Succeeded', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to execute runbook:', err);
    }
  };

  const handleTriggerDRFailover = async (targetRegionId: string) => {
    try {
      const res = await fetch('/api/disaster-recovery/failover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRegionId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'Global DR Failover Completed', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to execute DR failover:', err);
    }
  };

  const handleRollbackHelmRelease = async (releaseName: string, targetRevision: number) => {
    try {
      const res = await fetch('/api/helm/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ releaseName, targetRevision }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Helm Release Rolled Back', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to rollback Helm release:', err);
    }
  };

  const handleToggleKedaScaleZero = async (id: string, enabled: boolean) => {
    try {
      const res = await fetch('/api/autoscaling/toggle-scale-zero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, enabled }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('info', 'KEDA Scaler Updated', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to toggle KEDA scale-to-zero:', err);
    }
  };

  const handleRotateVaultSecret = async (secretId: string) => {
    try {
      const res = await fetch('/api/secrets/rotate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretId }),
      });
      const data = await res.json();
      if (data.success) {
        showToast('success', 'Vault Secret Rotated', data.message);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to rotate Vault secret:', err);
    }
  };

  // Copilot Action Dispatcher
  const handleCopilotAction = (actionType: string, payload?: any) => {
    switch (actionType) {
      case 'diagnose_payment_leak':
        setActiveTab('rca');
        break;
      case 'auto_heal_memory':
        handleAutoHeal('issue-01', 'bump_memory');
        break;
      case 'navigate_predictive':
        setActiveTab('predictive');
        break;
      case 'navigate_gitops':
      case 'generate_gitops_yaml':
        setActiveTab('gitops');
        break;
      case 'sync_gitops_order':
        handleSyncGitOps('gitops-order');
        break;
      case 'navigate_mesh':
        setActiveTab('mesh');
        break;
      case 'view_profiler':
        setActiveTab('profiler');
        break;
      case 'run_chaos_memory':
        handleTriggerChaos('chaos-1');
        setActiveTab('chaos');
        break;
      case 'run_chaos_ebpf':
        handleTriggerChaos('chaos-2');
        setActiveTab('chaos');
        break;
      case 'navigate_policies':
        setActiveTab('policies');
        break;
      case 'navigate_slo':
        setActiveTab('slo');
        break;
      case 'navigate_fleet':
        setActiveTab('fleet');
        break;
      case 'navigate_security':
        setActiveTab('security');
        break;
      case 'navigate_alerts':
        setActiveTab('alerts');
        break;
      default:
        break;
    }
  };

  const handleSimulateIncident = async (incidentType: string) => {
    try {
      await fetch('/api/k8s/simulate-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incidentType }),
      });
      showToast('info', 'Incident Injected', `Simulated ${incidentType} in cluster.`);
      await fetchData();
    } catch (err) {
      console.error('Failed to simulate incident:', err);
    }
  };

  const activeIssueCount = issues.filter((i) => i.status === 'active').length;
  const activePredictiveAlertCount = predictiveAlerts.filter(
    (a) => a.status === 'active'
  ).length;
  const activeWorkflowsCount = workflowRuns.filter(
    (r) => r.status === 'in_progress'
  ).length;

  return (
    <div className={`min-h-screen ${theme === 'light' ? 'light bg-[#f8fafc] text-[#0f172a]' : 'dark bg-[#090b10] text-[#f3f4f6]'} font-sans selection:bg-emerald-500 selection:text-black pb-12 relative flex transition-colors duration-300 overflow-x-hidden`}>
      {/* Dynamic Animated Ambient Background */}
      <AnimatedBackground theme={theme} />

      {/* SentriX Desktop Navigation Sidebar */}
      <div className="hidden lg:block shrink-0">
        <SentrixSidebar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          issueCount={activeIssueCount}
          predictiveAlertCount={activePredictiveAlertCount}
          activeWorkflowsCount={activeWorkflowsCount}
          onOpenCopilot={() => setActiveTab('copilot')}
          onOpenSettings={() => setIsRegisterClusterOpen(true)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          theme={theme}
        />
      </div>

      {/* SentriX Mobile Navigation Drawer */}
      {isMobileSidebarOpen && (
        <SentrixSidebar
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          issueCount={activeIssueCount}
          predictiveAlertCount={activePredictiveAlertCount}
          activeWorkflowsCount={activeWorkflowsCount}
          onOpenCopilot={() => setActiveTab('copilot')}
          onOpenSettings={() => setIsRegisterClusterOpen(true)}
          isMobileOpen={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          theme={theme}
        />
      )}

      {/* Main Layout Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#090b10]'} transition-colors`}>
        {/* Global Header */}
        <div className="relative z-40">
          <Header
            stats={clusterOverview?.stats || null}
            repo={repo}
            autonomousHealing={true}
            onToggleAutonomousHealing={() => showToast('info', 'Autonomous Self-Healing', 'Continuous auto-remediation is permanently armed.')}
            onSimulateIncident={handleSimulateIncident}
            onTriggerPipeline={() => handleTriggerRun('main', 'payment-gateway')}
            onRefresh={fetchData}
            isLoading={loading}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenRegisterCluster={() => setIsRegisterClusterOpen(true)}
            onOpenRepoSyncModal={() => setIsRepoSyncModalOpen(true)}
            onConnectRepo={handleConnectRepo}
            primaryClusterName={clusterFleet.find((c) => c.isPrimary)?.clusterName || 'gke-prod-us-west1'}
            activeAiModelName={
              activeAiModel.includes('nvidia')
                ? 'NVIDIA NIM'
                : activeAiModel.includes('cursor')
                ? 'Cursor Bridge'
                : activeAiModel.includes('pro')
                ? 'Gemini 3.7 Pro'
                : 'Gemini 3.7 Flash'
            }
            onOpenModelSwitchTab={() => setActiveTab('model-switch')}
            onOpenUITemplates={() => setIsUITemplatesOpen(true)}
            onOpenAiAssistant={() => setActiveTab('copilot')}
            isDemoMode={isDemoMode}
            onClearDemoData={handleClearDemoData}
            onToggleSidebar={() => {
              if (window.innerWidth < 1024) {
                setIsMobileSidebarOpen((prev) => !prev);
              } else {
                setIsSidebarCollapsed((prev) => !prev);
              }
            }}
            isSidebarCollapsed={isSidebarCollapsed}
            unreadNotificationCount={unreadNotificationCount}
            onToggleNotifications={() => setIsNotificationOpen((prev) => !prev)}
            onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
            activeIssueCount={activeIssueCount}
            currentUser={currentUser}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
          />
        </div>

        {/* Clean Breadcrumb Context & Sibling Switcher Bar */}
        <div className="relative z-30">
          <NavigationTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            issueCount={activeIssueCount}
            predictiveAlertCount={activePredictiveAlertCount}
            activeWorkflowsCount={activeWorkflowsCount}
            theme={theme}
          />
        </div>

        {/* Main Tab Content Canvas */}
        <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-6 relative z-10">
          {activeTab === 'incidents' && (
            <IncidentHub
              onShowToast={showToast}
              onNavigateTab={(tab) => setActiveTab(tab as TabType)}
            />
          )}

        {activeTab === 'pipeline' && (
          <PipelineMonitor
            repo={repo}
            commits={commits}
            workflowRuns={workflowRuns}
            onTriggerRun={handleTriggerRun}
            onWorkflowRunCreated={(newRun) => setWorkflowRuns((prev) => [newRun, ...prev])}
            onConnectRepo={handleConnectRepo}
            onSyncRepo={handleSyncRepo}
            onDisconnectRepo={handleDisconnectRepo}
            onNavigateToFailures={() => setActiveTab('failure-history')}
            onNavigateToTechStack={() => setActiveTab('tech-stack')}
            onNavigateToGoIngestion={() => setActiveTab('log-collector')}
          />
        )}

        {activeTab === 'log-collector' && <LogCollectorServiceHub />}

        {activeTab === 'tech-stack' && (
          <TechStackDiscovery
            repo={repo}
            onNavigateToPipeline={() => setActiveTab('pipeline')}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'failure-history' && (
          <FailureHistoryStudio
            repo={repo}
            workflowRuns={workflowRuns}
            onTriggerPipeline={() => {
              handleTriggerRun(repo?.branch || 'main', repo?.name || 'app', false);
              setActiveTab('pipeline');
            }}
            onWorkflowRunCreated={(newRun) => {
              setWorkflowRuns((prev) => [newRun, ...prev]);
            }}
            onNavigateToPipeline={(runId) => {
              setActiveTab('pipeline');
            }}
          />
        )}

        {activeTab === 'topology' && (
          <ClusterTopologyView
            nodes={nodes}
            pods={pods}
            namespaces={namespaces}
            onAutoHealPod={(podName) => {
              const matchingIssue = issues.find((i) => i.podName === podName);
              if (matchingIssue) {
                handleAutoHeal(matchingIssue.id, matchingIssue.healActionType);
              }
            }}
            onSelectPodForDiagnostics={(podName) => {
              showToast('info', 'Workload Selected', `Opening RCA diagnostics for pod ${podName}`);
              setActiveTab('rca');
            }}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'rebalancer' && (
          <SmartRebalancerStudio theme={theme} />
        )}

        {activeTab === 'traces' && (
          <DistributedTracingExplorer
            traces={traces}
            flamegraph={flamegraph}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'helm' && (
          <HelmCrdManager
            releases={helmReleases}
            crds={crds}
            onRollbackRelease={handleRollbackHelmRelease}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'autoscaling' && (
          <KedaAutoscalingPanel
            scaledObjects={scaledObjects}
            onToggleScaleZero={handleToggleKedaScaleZero}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'vault' && (
          <ZeroTrustSecretsVault
            secrets={vaultSecrets}
            onRotateSecret={handleRotateVaultSecret}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'mesh' && (
          <ServiceMeshTopology
            graph={meshGraph}
            onRefresh={fetchData}
            onSelectService={(svc) => showToast('info', 'Service Inspected', `Loaded eBPF traces for ${svc}`)}
          />
        )}

        {activeTab === 'profiler' && (
          <MicroserviceProfiler profiles={languageProfiles} />
        )}

        {activeTab === 'predictive' && (
          <PredictiveLeakRadar
            alerts={predictiveAlerts}
            onAutoHeal={handleAutoHeal}
            onSimulateLeak={() => handleSimulateIncident('memory_leak')}
            isHealing={isHealing}
          />
        )}

        {activeTab === 'rca' && (
          <DiagnosticRCAPanel
            issues={issues}
            healingHistory={healingHistory}
            onAutoHeal={handleAutoHeal}
            isHealing={isHealing}
          />
        )}

        {activeTab === 'policies' && (
          <AutoHealPolicyEngine
            policies={policies}
            onTogglePolicy={handleTogglePolicy}
          />
        )}

        {activeTab === 'slo' && (
          <SloBudgetDashboard
            slos={sloTargets}
            onToggleFreeze={handleToggleSloFreeze}
          />
        )}

        {activeTab === 'ebpf' && (
          <EbpfKernelTracer
            events={ebpfEvents}
            stats={ebpfStats}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'runbooks' && (
          <RunbookAutomationStudio
            runbooks={runbooks}
            onExecuteRunbook={handleExecuteRunbook}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'loadtest' && (
          <ContinuousLoadHarness />
        )}

        {activeTab === 'dr' && (
          <DisasterRecoveryHub
            regions={drRegions}
            onFailover={handleTriggerDRFailover}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'fleet' && (
          <MultiClusterFleetManager
            fleet={clusterFleet}
            onSwitchPrimary={handleSwitchFleetPrimary}
            onRefresh={fetchData}
          />
        )}

        {activeTab === 'security' && (
          <SecurityComplianceAudit
            report={securityReport}
            onRemediateCve={handleRemediateCve}
          />
        )}

        {activeTab === 'alerts' && (
          <AlertIntegrationsHub
            channels={alertChannels}
            onTestWebhook={handleTestAlertWebhook}
          />
        )}

        {activeTab === 'gitops' && (
          <GitOpsSyncStudio
            apps={gitOpsApps}
            onSyncApp={handleSyncGitOps}
            isSyncing={isSyncingGitOps}
          />
        )}

        {activeTab === 'canary' && (
          <CanaryControlPanel
            canary={canary}
            onShiftTraffic={handleShiftTraffic}
            onPromoteCanary={handlePromoteCanary}
            onRollbackCanary={handleRollbackCanary}
            isUpdating={isUpdatingCanary}
          />
        )}

        {activeTab === 'chaos' && (
          <ChaosSandbox
            experiments={chaosExperiments}
            onTriggerExperiment={handleTriggerChaos}
          />
        )}

        {activeTab === 'model-switch' && (
          <ModelSwitchHub
            onNavigateToCopilot={() => setActiveTab('copilot')}
            onShowToast={showToast}
          />
        )}

        {activeTab === 'copilot' && (
          <SreCopilotChat onExecuteAction={handleCopilotAction} />
        )}

        {activeTab === 'finops' && (
          <FinOpsPanel
            finops={finops}
            onApplyRightSizing={(recId) => {
              showToast('success', 'Right-Sizing Applied', 'Resource requests and limits updated in Helm values.');
            }}
          />
        )}

        {activeTab === 'logs' && (
          <LogViewer logs={logs} onRefreshLogs={fetchData} onShowToast={showToast} />
        )}

        {activeTab === 'postmortem' && <PostMortemViewer />}

        {activeTab === 'specs' && <MicroserviceSpecsDrawer />}

        {activeTab === 'production-readiness' && <ProductionReadinessHub />}
      </main>

      {/* Interactive Notification Center Drawer */}
      <NotificationCenter
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        issues={issues}
        predictiveAlerts={predictiveAlerts}
        workflowRuns={workflowRuns}
        healingHistory={healingHistory}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        theme={theme}
        notifications={notifications}
        onMarkAsRead={handleMarkNotifRead}
        onMarkAllAsRead={handleMarkAllNotifsRead}
        onClearAll={handleClearAllNotifs}
        onSimulateIncident={handleSimulateIncident}
      />

      {/* Global Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNavigateToTab={(tab) => setActiveTab(tab)}
        onSimulateIncident={handleSimulateIncident}
        onTriggerPipeline={() => handleTriggerRun('main', 'payment-gateway')}
        onToggleTheme={toggleTheme}
        onOpenRepoSync={() => setIsRepoSyncModalOpen(true)}
        onOpenClusterModal={() => setIsRegisterClusterOpen(true)}
        onRefresh={fetchData}
        onClearDemoData={handleClearDemoData}
        theme={theme}
      />

      {/* SRE Operator Authentication & Profile Modal */}
      <AuthLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        onLogin={handleLoginUser}
        onLogout={handleLogoutUser}
        theme={theme}
      />

      {/* Global GitHub Repository One-Click Sync Modal */}
      <GitHubRepoSyncModal
        isOpen={isRepoSyncModalOpen}
        onClose={() => setIsRepoSyncModalOpen(false)}
        currentRepo={repo}
        onConnectRepo={async (repoUrl: string, token?: string) => {
          const ok = await handleConnectRepo(repoUrl, token);
          if (ok) await fetchData();
        }}
        onSyncAllServices={async () => {
          const ok = await handleSyncRepo();
          if (ok) await fetchData();
        }}
        isLoading={isSyncingRepo}
      />

      {/* Register Cluster Modal */}
      <RegisterClusterModal
        isOpen={isRegisterClusterOpen}
        onClose={() => setIsRegisterClusterOpen(false)}
        onClusterRegistered={(newCluster) => {
          showToast('success', 'Cluster Registered', `Cluster ${newCluster.clusterName} successfully joined the federated control plane.`);
          fetchData();
        }}
      />

      {/* Minimal & Classy UI Templates Showcase Modal */}
      <UITemplateShowcaseModal
        isOpen={isUITemplatesOpen}
        onClose={() => setIsUITemplatesOpen(false)}
        currentTemplate={activeUiTemplate}
        onSelectTemplate={handleApplyUiTemplate}
      />

      {/* Toast Notification Container */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50">
          <div
            className={`p-4 rounded-xl border shadow-2xl backdrop-blur-md max-w-md flex items-start gap-3 ${
              toastMessage.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-100 shadow-emerald-500/20'
                : toastMessage.type === 'error'
                ? 'bg-rose-950/90 border-rose-500/50 text-rose-100 shadow-rose-500/20'
                : 'bg-cyan-950/90 border-cyan-500/50 text-cyan-100 shadow-cyan-500/20'
            }`}
          >
            {toastMessage.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {toastMessage.type === 'error' && (
              <AlertOctagon className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            )}
            {toastMessage.type === 'info' && (
              <Zap className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1">
              <div className="text-xs font-bold text-white tracking-wide">
                {toastMessage.title}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {toastMessage.description}
              </p>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}

