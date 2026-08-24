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
import { HelmCrdManager } from './components/HelmCrdManager';
import { IncidentHub } from './components/IncidentHub';
import { KedaAutoscalingPanel } from './components/KedaAutoscalingPanel';
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
import { ServiceMeshTopology } from './components/ServiceMeshTopology';
import { SloBudgetDashboard } from './components/SloBudgetDashboard';
import { SreCopilotChat } from './components/SreCopilotChat';
import { TechStackDiscovery } from './components/TechStackDiscovery';
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

export default function App() {
  const [activeTab, setActiveTab] = useState<TabType>('incidents');
  const [loading, setLoading] = useState<boolean>(true);
  const [isHealing, setIsHealing] = useState<boolean>(false);
  const [isUpdatingCanary, setIsUpdatingCanary] = useState<boolean>(false);
  const [isSyncingGitOps, setIsSyncingGitOps] = useState<boolean>(false);
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
  const [activeAiModel, setActiveAiModel] = useState<string>('gemini-3.7-flash');

  // Fetch all cluster & pipeline data
  const fetchData = async () => {
    try {
      const [
        overviewRes,
        githubRes,
        topologyRes,
        predictiveRes,
        issuesRes,
        canaryRes,
        finopsRes,
        logsRes,
        meshRes,
        profilesRes,
        gitopsRes,
        chaosRes,
        policiesRes,
        sloRes,
        fleetRes,
        securityRes,
        alertsRes,
        ebpfRes,
        runbooksRes,
        drRes,
        tracesRes,
        flamegraphRes,
        helmRes,
        crdsRes,
        scaledRes,
        vaultRes,
        aiModelsRes,
      ] = await Promise.all([
        fetch('/api/cluster/overview'),
        fetch('/api/github/activity'),
        fetch('/api/k8s/topology'),
        fetch('/api/k8s/predictive-alerts'),
        fetch('/api/k8s/issues'),
        fetch('/api/canary/status'),
        fetch('/api/finops/breakdown'),
        fetch('/api/logs'),
        fetch('/api/mesh/topology'),
        fetch('/api/runtime/profiles'),
        fetch('/api/gitops/apps'),
        fetch('/api/chaos/experiments'),
        fetch('/api/policies/list'),
        fetch('/api/slo/targets'),
        fetch('/api/fleet/clusters'),
        fetch('/api/security/audit'),
        fetch('/api/alerts/channels'),
        fetch('/api/ebpf/kernel-events'),
        fetch('/api/runbooks'),
        fetch('/api/disaster-recovery/regions'),
        fetch('/api/tracing/traces'),
        fetch('/api/tracing/flamegraph'),
        fetch('/api/helm/releases'),
        fetch('/api/k8s/crds'),
        fetch('/api/autoscaling/scaled-objects'),
        fetch('/api/secrets/vault-items'),
        fetch('/api/ai/models'),
      ]);

      if (overviewRes.ok) setClusterOverview(await overviewRes.json());
      if (githubRes.ok) {
        const ghData = await githubRes.json();
        setRepo(ghData.repo);
        setCommits(ghData.commits || ghData.recentCommits || []);
        setWorkflowRuns(ghData.workflowRuns || []);
      }
      if (topologyRes.ok) {
        const topData = await topologyRes.json();
        setNodes(topData.nodes || []);
        setPods(topData.pods || []);
        setNamespaces(topData.namespaces || []);
      }
      if (predictiveRes.ok) {
        const predData = await predictiveRes.json();
        setPredictiveAlerts(predData.alerts || []);
      }
      if (issuesRes.ok) {
        const issData = await issuesRes.json();
        setIssues(issData.issues || []);
        setHealingHistory(issData.autoHealingHistory || issData.healingHistory || []);
      }
      if (canaryRes.ok) {
        const canaryData = await canaryRes.json();
        setCanary(canaryData.canary || canaryData);
      }
      if (finopsRes.ok) setFinops(await finopsRes.json());
      if (logsRes.ok) {
        const logData = await logsRes.json();
        setLogs(logData.logs || []);
      }
      if (meshRes.ok) {
        const meshData = await meshRes.json();
        setMeshGraph(meshData.graph || null);
      }
      if (profilesRes.ok) {
        const profData = await profilesRes.json();
        setLanguageProfiles(profData.profiles || []);
      }
      if (gitopsRes.ok) {
        const gitData = await gitopsRes.json();
        setGitOpsApps(gitData.apps || []);
      }
      if (chaosRes.ok) {
        const chData = await chaosRes.json();
        setChaosExperiments(chData.experiments || []);
      }
      if (policiesRes.ok) {
        const polData = await policiesRes.json();
        setPolicies(polData.policies || []);
      }
      if (sloRes.ok) {
        const sloData = await sloRes.json();
        setSloTargets(sloData.slos || []);
      }
      if (fleetRes.ok) {
        const flData = await fleetRes.json();
        setClusterFleet(flData.fleet || []);
      }
      if (securityRes.ok) {
        const secData = await securityRes.json();
        setSecurityReport(secData.report || null);
      }
      if (alertsRes.ok) {
        const alData = await alertsRes.json();
        setAlertChannels(alData.channels || []);
      }
      if (ebpfRes.ok) {
        const ebpfData = await ebpfRes.json();
        setEbpfEvents(ebpfData.events || []);
        setEbpfStats(ebpfData.stats || []);
      }
      if (runbooksRes.ok) {
        const rbData = await runbooksRes.json();
        setRunbooks(rbData.runbooks || []);
      }
      if (drRes.ok) {
        const drData = await drRes.json();
        setDrRegions(drData.regions || []);
      }
      if (tracesRes.ok) {
        const trData = await tracesRes.json();
        setTraces(trData.traces || []);
      }
      if (flamegraphRes.ok) {
        const flData = await flamegraphRes.json();
        setFlamegraph(flData.flamegraph || null);
      }
      if (helmRes.ok) {
        const helmData = await helmRes.json();
        setHelmReleases(helmData.releases || []);
      }
      if (crdsRes.ok) {
        const crdsData = await crdsRes.json();
        setCrds(crdsData.crds || []);
      }
      if (scaledRes.ok) {
        const scData = await scaledRes.json();
        setScaledObjects(scData.scaledObjects || []);
      }
      if (vaultRes.ok) {
        const vData = await vaultRes.json();
        setVaultSecrets(vData.secrets || []);
      }
      if (aiModelsRes && aiModelsRes.ok) {
        const aiData = await aiModelsRes.json();
        if (aiData.activeModel) {
          setActiveAiModel(aiData.activeModel);
        }
      }

    } catch (err) {
      console.error('Error fetching cluster telemetry:', err);
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
          `Connected to ${data.repo?.owner}/${data.repo?.name} via GitHub REST API.`
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
    }
  };

  // Live Sync with GitHub (Refresh Telemetry & Runs)
  const handleSyncRepo = async (): Promise<boolean> => {
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
    <div className={`min-h-screen ${theme === 'light' ? 'light bg-[#f8fafc] text-[#0f172a]' : 'dark bg-[#000000] text-[#f3f4f6]'} font-sans selection:bg-white selection:text-black pb-12 relative flex transition-colors duration-300`}>
      {/* Slim Vertical Icon Rail / Dock (Matching Left Dock in Reference Screenshot) */}
      <aside className={`hidden lg:flex flex-col items-center justify-between w-16 py-5 ${theme === 'light' ? 'bg-white border-slate-200 text-slate-700' : 'bg-[#000000] border-white/10 text-white'} border-r shrink-0 sticky top-0 h-screen z-50 transition-colors`}>
        {/* Top Brand Rainbow Ring Logo */}
        <div className="flex flex-col items-center gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className="group relative flex items-center justify-center w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-amber-400 via-rose-500 to-cyan-400 hover:scale-105 transition-all shadow-md"
            title="Sentrix Overview"
          >
            <div className={`w-full h-full ${theme === 'light' ? 'bg-white' : 'bg-[#000000]'} rounded-full flex items-center justify-center`}>
              <span className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-slate-900' : 'bg-white'} group-hover:bg-cyan-400 transition-colors`} />
            </div>
          </button>

          {/* Core Navigation Icons (Clean monochrome outline icons) */}
          <div className="flex flex-col items-center gap-2.5">
            {[
              { id: 'incidents' as TabType, icon: Flame, title: 'Incident Hub' },
              { id: 'pipeline' as TabType, icon: GitBranch, title: 'CI/CD Pipelines' },
              { id: 'topology' as TabType, icon: Boxes, title: 'Cluster Topology' },
              { id: 'traces' as TabType, icon: Activity, title: 'OTel Distributed Traces' },
              { id: 'finops' as TabType, icon: DollarSign, title: 'FinOps Cloud Spend' },
              { id: 'fleet' as TabType, icon: Globe, title: 'Multi-Cluster Fleet' },
              { id: 'vault' as TabType, icon: Lock, title: 'Vault KMS Secrets' },
              { id: 'copilot' as TabType, icon: Sparkles, title: 'AI SRE Copilot' },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`p-2.5 rounded-2xl transition-all duration-200 relative group ${
                    isActive
                      ? theme === 'light'
                        ? 'bg-slate-900 text-white shadow-md'
                        : 'bg-white text-black shadow-lg shadow-white/10'
                      : theme === 'light'
                        ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                        : 'text-slate-500 hover:text-white hover:bg-[#18181b]'
                  }`}
                  title={item.title}
                >
                  <Icon className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Bottom User Avatar */}
        <div className="flex flex-col items-center gap-3">
          <div
            onClick={() => setIsRegisterClusterOpen(true)}
            className="w-8 h-8 rounded-full ring-1 ring-white/20 overflow-hidden cursor-pointer hover:ring-white/50 transition-all"
            title="Cluster Settings"
          >
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
              alt="Avatar"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className={`flex-1 flex flex-col min-w-0 ${theme === 'light' ? 'bg-[#f8fafc]' : 'bg-[#000000]'} transition-colors`}>
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
          />
        </div>

        {/* Responsive Navigation Tab Bar */}
        <div className="relative z-30">
          <NavigationTabs
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            issueCount={activeIssueCount}
            predictiveAlertCount={activePredictiveAlertCount}
            activeWorkflowsCount={activeWorkflowsCount}
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
            onConnectRepo={handleConnectRepo}
            onSyncRepo={handleSyncRepo}
            onDisconnectRepo={handleDisconnectRepo}
            onNavigateToFailures={() => setActiveTab('failure-history')}
            onNavigateToTechStack={() => setActiveTab('tech-stack')}
          />
        )}

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
          <LogViewer logs={logs} onRefreshLogs={fetchData} />
        )}

        {activeTab === 'postmortem' && <PostMortemViewer />}

        {activeTab === 'specs' && <MicroserviceSpecsDrawer />}

        {activeTab === 'production-readiness' && <ProductionReadinessHub />}
      </main>

      {/* Register Cluster Modal */}
      <RegisterClusterModal
        isOpen={isRegisterClusterOpen}
        onClose={() => setIsRegisterClusterOpen(false)}
        onClusterRegistered={(newCluster) => {
          showToast('success', 'Cluster Registered', `Cluster ${newCluster.clusterName} successfully joined the federated control plane.`);
          fetchData();
        }}
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

