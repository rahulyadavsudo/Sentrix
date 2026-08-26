export type Severity = 'critical' | 'warning' | 'info' | 'healthy';

export type IssueType =
  | 'OOMKilled'
  | 'MemoryLeakWarning'
  | 'CrashLoopBackOff'
  | 'ImagePullBackOff'
  | 'CPUThrottled'
  | 'FailedScheduling'
  | 'LivenessProbeTimeout'
  | 'ConfigMapMissingKey'
  | 'NetworkLatencySpike';

export type HealActionType =
  | 'bump_memory'
  | 'restart_pod'
  | 'rollback_image'
  | 'sync_configmap'
  | 'reschedule_pod'
  | 'tune_cpu_limit'
  | 'drain_node'
  | 'optimize_hpa';

export interface GitHubRepo {
  id: string;
  name: string;
  owner: string;
  branch: string;
  lastCommitSha: string;
  lastCommitMessage: string;
  lastCommitAuthor: string;
  lastCommitTime: string;
  avatarUrl: string;
  openPRs: number;
  activeWorkflows: number;
}

export interface CommitActivity {
  sha: string;
  shortSha: string;
  message: string;
  author: string;
  authorEmail: string;
  timestamp: string;
  branch: string;
  verified: boolean;
  linkedDeployment?: string;
}

export interface PipelineStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  durationSec: number;
  baselineDurationSec: number;
  isAnomaly: boolean;
  anomalyDeltaPercent?: number;
  logs: string[];
}

export interface PipelineStage {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  steps: PipelineStep[];
}

export interface WorkflowRun {
  id: string;
  workflowName: string;
  repo: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  branch: string;
  event: 'push' | 'pull_request' | 'workflow_dispatch' | 'schedule';
  status: 'in_progress' | 'completed' | 'failed' | 'queued';
  conclusion?: 'success' | 'failure' | 'cancelled';
  failureReason?: string;
  failedStepName?: string;
  errorLogs?: string[];
  durationSec: number;
  baselineDurationSec: number;
  hasDurationAnomaly: boolean;
  startedAt: string;
  stages: PipelineStage[];
  targetNamespace: string;
  targetService: string;
  deployedVersion: string;
}

export interface K8sContainer {
  name: string;
  image: string;
  ready: boolean;
  restartCount: number;
  cpuUsageMillicores: number;
  cpuLimitMillicores: number;
  memoryUsageBytes: number;
  memoryLimitBytes: number;
  state: 'running' | 'waiting' | 'terminated';
  reason?: string;
}

export interface K8sPod {
  id: string;
  name: string;
  namespace: string;
  node: string;
  status: 'Running' | 'Pending' | 'CrashLoopBackOff' | 'OOMKilled' | 'Failed' | 'Terminating';
  ready: string;
  restarts: number;
  age: string;
  ip: string;
  cpuUsage: number; // in percentage
  cpuMillicores: number;
  cpuLimit: number;
  memoryUsage: number; // in percentage
  memoryMB: number;
  memoryLimitMB: number;
  containers: K8sContainer[];
  labels: Record<string, string>;
  serviceName: string;
  commitSha?: string;
  createdAt: string;
  memoryHistory: { time: string; memoryMB: number; projected?: boolean }[];
  isLeakingMemory?: boolean;
  predictedOOMMinutes?: number;
}

export interface K8sNode {
  id: string;
  name: string;
  role: 'control-plane' | 'worker';
  status: 'Ready' | 'NotReady' | 'SchedulingDisabled';
  kubeletVersion: string;
  osImage: string;
  cpuCores: number;
  cpuUsagePercent: number;
  memoryTotalGB: number;
  memoryUsagePercent: number;
  podsRunning: number;
  podsCapacity: number;
  region: string;
  zone: string;
}

export interface K8sNamespace {
  name: string;
  status: 'Active' | 'Terminating';
  podCount: number;
  monthlyCostUSD: number;
  cpuAllocatedCores: number;
  memoryAllocatedGB: number;
}

export interface PredictiveOOMAlert {
  id: string;
  podName: string;
  namespace: string;
  serviceName: string;
  currentMemoryMB: number;
  memoryLimitMB: number;
  utilizationPercent: number;
  leakSlopeMBPerMin: number; // e.g. +16.8 MB/min
  predictedOOMMinutes: number; // e.g. 11.4 mins
  confidenceScore: number; // e.g. 94%
  detectedAt: string;
  historicalTrend: { time: string; actualMB: number; projectedMB?: number }[];
  status: 'active' | 'mitigating' | 'resolved';
  recommendedLimitMB: number;
}

export interface DiagnosticIssue {
  id: string;
  title: string;
  type: IssueType;
  severity: Severity;
  namespace: string;
  podName: string;
  serviceName: string;
  nodeName: string;
  detectedAt: string;
  status: 'active' | 'healing' | 'resolved';
  rootCause: string;
  technicalDetails: {
    exitCode?: number;
    lastStateReason?: string;
    failingResource?: string;
    errorMessage?: string;
    stackTraceSnippet?: string;
  };
  impact: string;
  remediationPlan: string[];
  autoHealAvailable: boolean;
  healActionType: HealActionType;
  healActionPayload: {
    targetField?: string;
    currentValue?: string | number;
    recommendedValue?: string | number;
    description: string;
  };
}

export interface AutoHealingRecord {
  id: string;
  issueId: string;
  timestamp: string;
  actionName: string;
  targetResource: string;
  namespace: string;
  durationMs: number;
  status: 'success' | 'in_progress' | 'failed';
  diffApplied: string;
  logs: string[];
}

export interface CanaryDeployment {
  id: string;
  name: string;
  namespace: string;
  stableVersion: string;
  canaryVersion: string;
  trafficWeight: number; // 0 - 100
  stepWeights: number[];
  currentStepIndex: number;
  errorBudgetRemainingPercent: number;
  p99LatencyMs: { stable: number; canary: number };
  errorRatePercent: { stable: number; canary: number };
  autoRollbackThreshold: { maxErrorRate: number; maxP99LatencyMs: number };
  status: 'running' | 'paused' | 'promoted' | 'rolled_back';
  startedAt: string;
  trafficHistory: { time: string; canaryTraffic: number; canaryErrorRate: number }[];
}

export interface FinOpsBreakdown {
  totalMonthlySpendUSD: number;
  idleWasteSpendUSD: number;
  potentialMonthlySavingsUSD: number;
  namespaceBreakdown: {
    namespace: string;
    monthlyCostUSD: number;
    cpuEfficiencyPercent: number;
    memEfficiencyPercent: number;
    wasteCostUSD: number;
  }[];
  rightSizingRecommendations: {
    id: string;
    serviceName: string;
    namespace: string;
    currentRequests: { cpu: string; memory: string };
    recommendedRequests: { cpu: string; memory: string };
    monthlySavingsUSD: number;
    reason: string;
  }[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'FATAL' | 'DEBUG';
  service: string;
  namespace: string;
  pod: string;
  message: string;
  isAnomaly?: boolean;
  traceId?: string;
}

export interface ClusterStats {
  healthScore: number;
  totalNodes: number;
  readyNodes: number;
  totalPods: number;
  runningPods: number;
  unhealthyPods: number;
  cpuUtilizationPercent: number;
  memoryUtilizationPercent: number;
  networkThroughputMBps: number;
  activeIncidentsCount: number;
  autoHealedCount24h: number;
  predictiveAlertsCount: number;
}

export interface ClusterOverview {
  stats: ClusterStats;
  nodes: K8sNode[];
  namespaces: K8sNamespace[];
  activeRepo: GitHubRepo;
}

// -------------------------------------------------------------
// Phase 2 Types: Service Mesh, Runtime Profiling, GitOps & Chaos
// -------------------------------------------------------------

export type MicroserviceLanguage = 'Go' | 'Python' | 'Rust' | 'NodeJS' | 'Database';

export interface ServiceMeshService {
  id: string;
  name: string;
  namespace: string;
  language: MicroserviceLanguage;
  version: string;
  rps: number;
  p99LatencyMs: number;
  p50LatencyMs: number;
  errorRatePercent: number;
  tcpRetransmitsPerSec: number;
  cpuPercent: number;
  memoryMB: number;
  status: 'healthy' | 'degraded' | 'critical';
  x: number; // For interactive SVG topology positioning
  y: number;
}

export interface ServiceMeshConnection {
  id: string;
  sourceId: string;
  targetId: string;
  protocol: 'gRPC' | 'HTTP/2' | 'Postgres Wire' | 'Redis RESP' | 'Kafka';
  rps: number;
  latencyMs: number;
  errorRatePercent: number;
  status: 'healthy' | 'warning' | 'failing';
  encrypted: boolean; // mTLS (Mutual TLS via Istio/Linkerd)
}

export interface ServiceMeshGraph {
  services: ServiceMeshService[];
  connections: ServiceMeshConnection[];
  ebpfSocketEventsTotal: number;
  mtlsCoveragePercent: number;
}

export interface LanguageRuntimeTelemetry {
  serviceId: string;
  serviceName: string;
  language: MicroserviceLanguage;
  runtimeVersion: string;
  // Go specific
  goroutinesCount?: number;
  gcPauseMicroseconds?: number;
  heapAllocMB?: number;
  channelSaturationPercent?: number;
  // Python specific
  gilContentionPercent?: number;
  memoryFragmentationIndex?: number;
  asyncioLagMs?: number;
  celeryPendingTasks?: number;
  // Rust specific
  tokioActiveTasks?: number;
  threadPoolSaturationPercent?: number;
  zeroCopyEfficiencyPercent?: number;
  unsafeBlocksAudited?: number;
  // General
  activeThreads: number;
  openFileDescriptors: number;
  networkSockets: number;
  cpuThrottledPeriods: number;
  recommendations: string[];
}

export interface GitOpsApp {
  id: string;
  name: string;
  repoUrl: string;
  targetRevision: string;
  syncStatus: 'Synced' | 'OutOfSync' | 'Syncing';
  healthStatus: 'Healthy' | 'Progressing' | 'Degraded' | 'Missing';
  lastSyncTime: string;
  autoSyncEnabled: boolean;
  liveManifestYaml: string;
  gitManifestYaml: string;
  diffLines: { type: 'same' | 'added' | 'removed' | 'modified'; line: string }[];
}

export interface ChaosExperiment {
  id: string;
  name: string;
  targetService: string;
  faultType: 'memory_leak' | 'network_latency' | 'pod_kill' | 'cpu_spike' | 'db_pool_exhaust';
  status: 'idle' | 'running' | 'completed' | 'mitigated';
  durationSeconds: number;
  elapsedSeconds: number;
  description: string;
  mttdSeconds?: number;
  mttrSeconds?: number;
  autoHealed: boolean;
}

export interface SreChatMessage {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  timestamp: string;
  text: string;
  suggestedActions?: { label: string; actionType: string; payload?: any }[];
  codeSnippet?: { language: string; code: string; title?: string };
}

// -------------------------------------------------------------
// Phase 3 Types: Policy Engine, SLO Budgets, Fleet, Security & Alerts
// -------------------------------------------------------------

export interface AutoHealPolicy {
  id: string;
  name: string;
  description: string;
  category: 'memory_leak' | 'crash_loop' | 'traffic_5xx' | 'ebpf_packet_drop' | 'hpa_scaling' | 'security_cve';
  triggerCondition: string;
  action: string;
  cooldownMinutes: number;
  enabled: boolean;
  enforcementMode: 'auto_execute' | 'dry_run_audit';
  executionCount24h: number;
  lastTriggeredAt: string | null;
}

export interface SloTarget {
  id: string;
  serviceName: string;
  tier: 'Tier-0 Critical' | 'Tier-1 Core' | 'Tier-2 Supporting';
  sloTargetPercent: number; // e.g. 99.9%
  currentSliPercent: number; // e.g. 99.94%
  errorBudgetRemainingPercent: number; // e.g. 82.5%
  burnRate1h: number; // e.g. 1.2x (> 14x is fast burn)
  burnRate6h: number;
  burnRate24h: number;
  timeToExhaustionHours: number | null;
  pipelineFreezeTriggered: boolean;
  windowDays: number;
  sliMetricName: string;
}

export interface RbacAuditResult {
  status: 'PASS_READ_ONLY' | 'WARN_CLUSTER_ADMIN' | 'FAIL_INSUFFICIENT_PERMISSIONS';
  hasCoreRead: boolean;
  hasAppsRead: boolean;
  hasMetricsRead: boolean;
  hasCustomResourcesRead: boolean;
  hasDangerousWrite: boolean;
  dangerousPermissionsFound: string[];
  allowedResourcesCount: number;
  testedVerbs: string[];
  recommendedRoleYaml?: string;
}

export interface KubeconfigClusterValidation {
  isValid: boolean;
  clusterName: string;
  serverEndpoint: string;
  kubernetesVersion: string;
  cloudProvider: 'GCP (GKE)' | 'AWS (EKS)' | 'Azure (AKS)' | 'Edge BareMetal' | 'RedHat OpenShift';
  region: string;
  nodesCount: number;
  podsCount: number;
  discoveredNamespaces: string[];
  pingLatencyMs: number;
  tlsStatus: string;
  rbacAudit: RbacAuditResult;
  contexts: { name: string; cluster: string; user: string; namespace?: string }[];
  currentContext: string;
  rawSummary: string;
}

export interface ClusterRegistrationRequest {
  clusterName: string;
  cloudProvider: 'GCP (GKE)' | 'AWS (EKS)' | 'Azure (AKS)' | 'Edge BareMetal';
  region: string;
  environment: 'production' | 'staging' | 'dr-standby' | 'development';
  kubernetesVersion?: string;
  activeTrafficWeight: number;
  isPrimary: boolean;
  authMethod: 'kubeconfig' | 'service_account' | 'oidc';
  apiEndpoint: string;
  kubeconfigContent?: string;
  serviceAccountToken?: string;
  caData?: string;
  enforceReadOnlyRbac: boolean;
}

export interface ClusterFleetNode {
  id: string;
  clusterName: string;
  cloudProvider: 'GCP (GKE)' | 'AWS (EKS)' | 'Azure (AKS)' | 'Edge BareMetal';
  region: string;
  status: 'healthy' | 'warning' | 'degraded';
  nodesCount: number;
  podsCount: number;
  cpuUsagePercent: number;
  memUsagePercent: number;
  kubernetesVersion: string;
  activeTrafficWeight: number; // 0 - 100
  isPrimary: boolean;
  environment?: 'production' | 'staging' | 'dr-standby' | 'development';
  apiEndpoint?: string;
  rbacStatus?: 'READ_ONLY_CERTIFIED' | 'CLUSTER_ADMIN' | 'LIMITED';
  pingLatencyMs?: number;
  tlsStatus?: string;
  registeredAt?: string;
  lastHeartbeat?: string;
}

export interface SecurityVulnerability {
  id: string;
  cveId: string;
  pkgName: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  installedVersion: string;
  fixedVersion: string;
  service: string;
  title: string;
  remediationCommand: string;
  autoFixAvailable: boolean;
}

export interface RuntimeThreatEvent {
  id: string;
  timestamp: string;
  rule: string;
  priority: 'CRITICAL' | 'WARNING' | 'NOTICE';
  pod: string;
  container: string;
  command: string;
  actionTaken: 'Killed Process' | 'Blocked Socket' | 'Logged Audit' | 'Isolated Container';
}

export interface SecurityAuditReport {
  totalCves: number;
  criticalCves: number;
  highCves: number;
  mediumCves: number;
  cisBenchmarkScore: number;
  vulnerabilities: SecurityVulnerability[];
  runtimeThreatEvents: RuntimeThreatEvent[];
  lastScanTimestamp: string;
}

export interface AlertIntegrationChannel {
  id: string;
  channelType: 'Slack' | 'PagerDuty' | 'Opsgenie' | 'Prometheus Alertmanager' | 'Discord';
  name: string;
  endpoint: string;
  status: 'connected' | 'error' | 'disabled';
  eventsSubscribed: string[];
  lastFiredAt: string | null;
}

// -------------------------------------------------------------
// Phase 4 Types: eBPF Kernel Tracer, Runbook Studio, Load Harness, DR Failover
// -------------------------------------------------------------

export interface EbpfKernelEvent {
  id: string;
  timestamp: string;
  probeType: 'kprobe' | 'tracepoint' | 'uprobe' | 'sock_ops' | 'tc_egress';
  syscall: string; // e.g. sys_enter_connect, tcp_retransmit_skb
  process: string; // e.g. rust-auth-guard, payment-gateway
  pid: number;
  cpuCore: number;
  latencyMicros: number;
  sourceIpPort: string;
  destIpPort: string;
  protocol: 'TCP' | 'UDP' | 'gRPC' | 'HTTP/2' | 'TLS 1.3';
  verdict: 'PASSED' | 'DROPPED' | 'REDIRECTED' | 'THROTTLED';
  details: string;
}

export interface EbpfSyscallStats {
  name: string;
  count1m: number;
  avgLatencyUs: number;
  p99LatencyUs: number;
  errorRatePercent: number;
}

export interface RunbookStep {
  id: string;
  title: string;
  type: 'diagnostic_query' | 'canary_traffic_shift' | 'k8s_patch' | 'drain_node' | 'scale_hpa' | 'slack_notification' | 'verify_slo';
  commandOrQuery: string;
  timeoutSeconds: number;
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped';
  outputLogs?: string[];
  durationMs?: number;
}

export interface AutomatedRunbook {
  id: string;
  title: string;
  category: 'OOM Recovery' | 'Canary Rollback' | 'Database Failover' | 'Ingress DDoS Mitigation' | 'Disk Pressure Cleanup';
  description: string;
  author: string;
  estimatedDuration: string;
  totalExecutions: number;
  successRatePercent: number;
  steps: RunbookStep[];
  autoTriggerConditions: string[];
  lastRunStatus?: 'success' | 'failed' | 'in_progress';
  lastRunAt?: string;
}

export interface LoadTestConfig {
  targetService: string;
  targetEndpoint: string;
  rpsTarget: number;
  concurrencyWorkers: number;
  durationSeconds: number;
  distributionType: 'constant' | 'ramp_up' | 'spike' | 'sinusoidal';
}

export interface LoadTestMetricPoint {
  timeSec: number;
  actualRps: number;
  p50Ms: number;
  p90Ms: number;
  p99Ms: number;
  errorRatePercent: number;
  status2xx: number;
  status4xx: number;
  status5xx: number;
}

export interface DisasterRecoveryRegion {
  id: string;
  name: string;
  provider: 'GCP' | 'AWS' | 'Azure' | 'BareMetal';
  regionCode: string;
  role: 'PRIMARY_ACTIVE' | 'SECONDARY_HOT_STANDBY' | 'DR_COLD_ARCHIVE' | 'EDGE_POP';
  gslbWeight: number; // 0 - 100
  dnsHealthStatus: 'HEALTHY' | 'WARNING' | 'FAILED';
  dbReplicationLagMs: number;
  rtoTargetSeconds: number;
  rtoAchievedSeconds: number;
  rpoDataLossSeconds: number;
  lastFailoverDrill: string;
}

// -------------------------------------------------------------
// Phase 5 Types: OpenTelemetry Tracing, Helm & CRDs, KEDA Autoscaling, Zero-Trust Vault
// -------------------------------------------------------------

export interface TraceSpan {
  spanId: string;
  parentSpanId?: string;
  traceId: string;
  serviceName: string;
  operationName: string;
  startTimeOffsetMs: number;
  durationMs: number;
  status: 'OK' | 'ERROR';
  statusCode?: number;
  kind: 'SERVER' | 'CLIENT' | 'PRODUCER' | 'CONSUMER' | 'INTERNAL';
  attributes: Record<string, string | number | boolean>;
  depth: number;
}

export interface DistributedTrace {
  traceId: string;
  rootService: string;
  rootEndpoint: string;
  timestamp: string;
  totalDurationMs: number;
  spanCount: number;
  servicesInvolved: string[];
  hasError: boolean;
  httpStatus: number;
  spans: TraceSpan[];
}

export interface FlamegraphNode {
  name: string;
  value: number; // milliseconds or CPU samples
  category?: 'kernel' | 'application' | 'database' | 'gc' | 'crypto' | 'network';
  children?: FlamegraphNode[];
}

export interface HelmReleaseHistoryItem {
  revision: number;
  updated: string;
  status: 'deployed' | 'superseded' | 'failed' | 'pending-rollback';
  chart: string;
  description: string;
}

export interface HelmRelease {
  name: string;
  namespace: string;
  revision: number;
  updated: string;
  status: 'deployed' | 'superseded' | 'failed';
  chart: string;
  appVersion: string;
  valuesYaml: string;
  history: HelmReleaseHistoryItem[];
}

export interface KubernetesCRD {
  name: string;
  group: string;
  version: string;
  kind: string;
  scope: 'Namespaced' | 'Cluster';
  customResourceCount: number;
  established: boolean;
  specYaml: string;
  sampleManifestYaml: string;
}

export interface KedaTrigger {
  type: 'kafka' | 'prometheus' | 'redis' | 'rabbitmq' | 'cron' | 'cpu_memory';
  metadata: Record<string, string>;
  metricValue: string;
  targetValue: string;
  isActive: boolean;
}

export interface KedaScaledObject {
  id: string;
  name: string;
  namespace: string;
  targetDeployment: string;
  minReplicaCount: number;
  maxReplicaCount: number;
  currentReplicas: number;
  desiredReplicas: number;
  triggers: KedaTrigger[];
  scaleToZeroEnabled: boolean;
  cooldownPeriodSec: number;
  scalingHistory: {
    time: string;
    replicas: number;
    metricValue: number;
  }[];
}

export interface VaultSecretItem {
  id: string;
  path: string;
  key: string;
  serviceConsumer: string;
  namespace: string;
  encryptedPreview: string;
  version: number;
  autoRotateEnabled: boolean;
  rotationFrequencyDays: number;
  lastRotated: string;
  expiresInDays: number;
  status: 'HEALTHY' | 'EXPIRING_SOON' | 'EXPIRED' | 'ROTATING';
  tlsCertInfo?: {
    cn: string;
    san: string[];
    issuer: string;
    validUntil: string;
    daysRemaining: number;
    keySize: string;
  };
}export interface BuildFailureAiDiagnosis {
  errorTitle: string;
  exactError: string;
  rootCause: string;
  explanation: string;
  solutionSteps: string[];
  codeDiff?: string;
  fixCommands?: string[];
  preventiveAdvice: string;
  confidenceScore: number;
}

export type IncidentSeverity = 'CRITICAL' | 'HIGH' | 'WARNING' | 'INFO';
export type IncidentStatus = 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'IGNORED';
export type IncidentSource = 'KUBERNETES' | 'GITHUB_ACTIONS' | 'LOGS' | 'DEPLOYMENT' | 'PREDICTIVE_WATCHDOG';

export interface IncidentTimelineEvent {
  id: string;
  timestamp: string;
  timeFormatted: string;
  title: string;
  description: string;
  type: 'commit' | 'ci_start' | 'ci_pass' | 'ci_fail' | 'deploy_start' | 'deploy_fail' | 'pod_crash' | 'k8s_event' | 'incident_detected' | 'ai_analyzed' | 'resolved' | 'human_action';
  source: 'Git' | 'GitHub Actions' | 'Kubernetes' | 'Engine' | 'AI' | 'Operator';
  iconType?: string;
  metadata?: Record<string, string | number | boolean>;
}

export interface IncidentEvidenceItem {
  id: string;
  title: string;
  source: 'Commit Diff' | 'Pod Logs' | 'Kubernetes Event' | 'CI Runner' | 'Deployment Manifest' | 'Watchdog Telemetry';
  details: string;
  verified: boolean;
  rawSnippet?: string;
}

export interface IncidentAiAnalysis {
  summary: string;
  rootCause: string;
  whyItHappened: string;
  whatChanged: string;
  evidenceSummary: string[];
  impact: string;
  recommendedSolution: string[];
  cliCommands?: string[];
  codeDiff?: string;
  confidence: number; // e.g. 94 (percentage)
  confidenceRationale?: string;
  uncertainty?: string[];
  analyzedAt: string;
}

export interface UnifiedIncident {
  id: string;
  fingerprint: string; // e.g. "prod:payments-api:CrashLoopBackOff:REDIS_URL" for deduplication
  title: string;
  service: string;
  namespace: string;
  environment: 'production' | 'staging' | 'canary' | 'preview';
  repo: string;
  branch: string;
  commitSha: string;
  commitAuthor: string;
  commitMessage: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  source: IncidentSource;
  failureType: IssueType | 'WorkflowFailure' | 'DeploymentFailure' | 'MissingSecret' | 'CanaryRollback';
  affectedResource: string; // e.g. "payments-api-7f8b9d-x82"
  restartCount: number;
  duplicateSignalCount: number; // count of aggregated crashes / logs
  firstSeenAt: string;
  lastSeenAt: string;
  resolvedAt?: string;
  resolutionReason?: string;
  timeline: IncidentTimelineEvent[];
  evidence: IncidentEvidenceItem[];
  aiAnalysis?: IncidentAiAnalysis;
  rawLogs: string[];
  k8sEvents: string[];
  gitDiffSnippet?: string;
  assignedEngineer?: string;
  acknowledgedAt?: string;
}

export interface FailedBuildRecord {
  id: string;
  runId: string;
  repo: string;
  branch: string;
  commitSha: string;
  commitMessage: string;
  author: string;
  failedStepName: string;
  exitCode: number;
  errorCategory: 'TestAssertion' | 'SyntaxError' | 'Dependency' | 'DockerBuild' | 'SecurityVulnerability' | 'Timeout' | 'SecretMissing' | 'Unknown';
  failedAt: string;
  durationSec: number;
  rawLogs: string[];
  aiDiagnosis?: BuildFailureAiDiagnosis;
  status: 'failed' | 'analyzed' | 'remediated';
}

export interface FailedDeploymentRecord {
  id: string;
  serviceName: string;
  namespace: string;
  podName: string;
  imageTag: string;
  failureType: IssueType | 'CanaryGateFailure' | 'ArgoCDSyncFailure' | 'Unknown';
  failedAt: string;
  affectedReplicas: number;
  eventLogs: string[];
  rootCause: string;
  remediationApplied?: string;
  autoHealed: boolean;
  aiDiagnosis?: {
    summary: string;
    rootCause: string;
    solutionSteps: string[];
    kubectlCommands: string[];
    helmValuesPatch?: string;
  };
}

export interface RepoFileNode {
  path: string;
  name: string;
  type: 'file' | 'directory';
  size?: number;
  category?: 'ci' | 'docker' | 'k8s' | 'helm' | 'source' | 'config' | 'doc' | 'security';
  extension?: string;
  contentSnippet?: string;
  rawContent?: string;
  children?: RepoFileNode[];
}

export interface DetectedDockerfile {
  path: string;
  baseImage: string;
  multiStage: boolean;
  stages: string[];
  exposedPorts: number[];
  workDir: string;
  hasNonRootUser: boolean;
  hasHealthCheck: boolean;
  entrypointOrCmd: string;
  rawContent: string;
  securityFindings: {
    level: 'warning' | 'info' | 'critical' | 'pass';
    message: string;
  }[];
}

export interface DetectedWorkflow {
  path: string;
  name: string;
  triggers: string[];
  jobsCount: number;
  jobs: {
    id: string;
    name: string;
    runsOn: string;
    stepsCount: number;
    hasDockerBuild: boolean;
    hasK8sDeploy: boolean;
    hasSecurityScan: boolean;
  }[];
  rawContent: string;
}

export interface DetectedHelmChart {
  path: string;
  chartYamlPath: string;
  name: string;
  version: string;
  appVersion: string;
  description: string;
  valuesFiles: string[];
  templatesCount: number;
  templates: string[];
  hasIngress: boolean;
  hasAutoscaling: boolean;
  rawValuesYaml?: string;
  rawChartYaml?: string;
}

export interface DetectedK8sManifest {
  path: string;
  kind: string;
  apiVersion: string;
  name: string;
  namespace?: string;
  replicas?: number;
  containerImage?: string;
  servicePort?: number;
  rawContent: string;
}

export interface TechStackDetection {
  repoFullName: string;
  branch: string;
  scannedAt: string;
  totalFilesScanned: number;
  readinessScore: number; // 0-100
  languages: {
    name: string;
    version?: string;
    percentage: number;
    color: string;
    filesCount: number;
  }[];
  frameworks: string[];
  docker: {
    detected: boolean;
    dockerfiles: DetectedDockerfile[];
  };
  githubActions: {
    detected: boolean;
    workflowsCount: number;
    workflows: DetectedWorkflow[];
  };
  helm: {
    detected: boolean;
    chartsCount: number;
    charts: DetectedHelmChart[];
  };
  kubernetes: {
    detected: boolean;
    manifestsCount: number;
    manifests: DetectedK8sManifest[];
    resourceBreakdown: Record<string, number>;
  };
  gitOps: {
    tool: 'ArgoCD' | 'Flux' | 'None';
    detected: boolean;
    applicationFiles: string[];
  };
  securityAndBestPractices: {
    id: string;
    category: 'Container' | 'CI/CD' | 'Kubernetes' | 'Helm' | 'Secrets';
    title: string;
    status: 'pass' | 'warning' | 'fail';
    detail: string;
    recommendation: string;
  }[];
  fileTree: RepoFileNode[];
  aiArchitectureSummary?: {
    overview: string;
    readinessAnalysis: string;
    cloudNativeMaturityLevel: 'Foundational' | 'Intermediate' | 'Production-Ready' | 'Enterprise-Grade';
    keyStrengths: string[];
    modernizationRecommendations: string[];
    suggestedHelmValuesPatch?: string;
  };
}

// -------------------------------------------------------------
// Production & Enterprise SaaS Types (RBAC, Multi-Tenancy, Persistence)
// -------------------------------------------------------------

export type UserRole = 'admin' | 'sre_lead' | 'developer' | 'security_auditor' | 'viewer';

export interface EnterpriseUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenantId: string;
  avatarUrl?: string;
  twoFactorEnabled: boolean;
  lastLoginAt: string;
  permissions: {
    canTriggerAutoHeal: boolean;
    canExecuteChaos: boolean;
    canShiftCanaryTraffic: boolean;
    canModifyPolicies: boolean;
    canDrainNodes: boolean;
    canViewAuditLogs: boolean;
    canManageSecrets: boolean;
  };
}

export interface EnterpriseAuditLog {
  id: string;
  timestamp: string;
  userEmail: string;
  userRole: UserRole;
  action: string;
  category: 'CLUSTER_MUTATION' | 'AUTH_EVENT' | 'CHAOS_INJECTION' | 'CANARY_SHIFT' | 'POLICY_UPDATE' | 'SECRET_ACCESS';
  targetResource: string;
  status: 'SUCCESS' | 'DENIED' | 'FAILED';
  clientIp: string;
  details: string;
  diffSummary?: string;
}

export interface DatabaseConnectionStatus {
  engine: 'PostgreSQL' | 'Firestore' | 'Redis' | 'In-Memory (Local Demo)';
  connected: boolean;
  latencyMs: number;
  poolActiveConnections: number;
  poolIdleConnections: number;
  databaseName: string;
  sslMode: 'require' | 'verify-full' | 'disabled';
  tableCounts: {
    incidents: number;
    auditLogs: number;
    metricsSnapshots: number;
    users: number;
  };
  lastHealthCheck: string;
}

export interface ProductionSystemHealth {
  version: string;
  uptimeSeconds: number;
  environment: 'production' | 'staging' | 'development';
  probes: {
    liveness: boolean;
    readiness: boolean;
    database: boolean;
    k8sApi: boolean;
  };
  rateLimiter: {
    enabled: boolean;
    maxRequestsPerMin: number;
    activeClientsTracked: number;
  };
  activeTenant: {
    id: string;
    name: string;
    tier: 'Enterprise Platinum' | 'Pro' | 'Standard';
    maxMonitoredNodes: number;
    currentNodes: number;
  };
}

export type AiProviderCategory = 'google' | 'nvidia' | 'cursor' | 'anthropic' | 'openai' | 'groq' | 'openrouter' | 'deepseek' | 'mistral' | 'custom';

export interface DetectedAiModel {
  id: string;
  name: string;
  displayName?: string;
  description: string;
  category: AiProviderCategory;
  provider: string;
  contextWindow: string;
  inputTokenLimit?: number;
  outputTokenLimit?: number;
  supportedGenerationMethods?: string[];
  isRecommended?: boolean;
  supportsVision?: boolean;
  supportsThinking?: boolean;
  tier?: string;
  speed?: string;
}

export interface ApiKeyErrorDetails {
  message: string;
  code?: string | number;
  status?: number;
  details?: string;
  suggestion?: string;
  raw?: any;
}

export interface ApiKeyDetectionResult {
  success: boolean;
  provider: AiProviderCategory;
  providerName: string;
  models: DetectedAiModel[];
  keyMasked: string;
  error?: ApiKeyErrorDetails;
  detectedAt: string;
}

export interface ModelVerificationResult {
  success: boolean;
  modelId: string;
  provider: AiProviderCategory;
  latencyMs: number;
  status: 'OPERATIONAL' | 'ERROR' | 'DEGRADED';
  responsePreview?: string;
  tokensGenerated?: number;
  error?: ApiKeyErrorDetails;
  verifiedAt: string;
}

export interface AiModelOption {
  id: string;
  name: string;
  provider: string;
  category: AiProviderCategory;
  tier: string;
  speed: string;
  contextWindow: string;
  isDefault?: boolean;
  requiresKey?: 'NVIDIA_API_KEY' | 'CURSOR_API_KEY' | 'GEMINI_API_KEY' | 'NONE';
  description: string;
  endpoint?: string;
}

export interface AiModelConfigState {
  activeModel: string;
  models: AiModelOption[];
  nvidiaApiKeyConfigured: boolean;
  cursorApiKeyConfigured: boolean;
  geminiApiKeyConfigured: boolean;
  customKeyValidated?: boolean;
  customActiveModel?: string;
}

export interface NodeCondition {
  type: 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure' | 'NetworkUnavailable';
  status: 'True' | 'False' | 'Unknown';
  lastHeartbeatTime: string;
  lastTransitionTime: string;
  reason: string;
  message: string;
}

export interface NodeKernelLogEntry {
  id: string;
  timestamp: string;
  relativeTime: string;
  level: 'INFO' | 'WARN' | 'ERR' | 'CRIT' | 'EBPF' | 'OOM';
  subsystem: 'cgroup2' | 'ebpf' | 'dmesg' | 'kubelet' | 'net_sched' | 'nvme_io' | 'tcp';
  message: string;
  cgroupPath?: string;
  pid?: number;
  comm?: string;
  cpuCore?: number;
  highlight?: boolean;
}

export interface ScheduledPodDetail {
  id: string;
  name: string;
  namespace: string;
  status: string;
  qosClass: 'Guaranteed' | 'Burstable' | 'BestEffort';
  cpuRequestMillicores: number;
  cpuLimitMillicores: number;
  cpuUsagePercent: number;
  memoryRequestMB: number;
  memoryLimitMB: number;
  memoryUsagePercent: number;
  restartCount: number;
  age: string;
  ip: string;
  affinityMatch: string;
  tolerations: string[];
}

export interface NodeDetailedInfo {
  id: string;
  name: string;
  role: 'control-plane' | 'worker';
  status: 'Ready' | 'NotReady' | 'SchedulingDisabled';
  instanceType: string;
  providerId: string;
  architecture: string;
  osImage: string;
  kernelVersion: string;
  containerRuntime: string;
  kubeletVersion: string;
  kubeProxyVersion: string;
  internalIP: string;
  externalIP?: string;
  region: string;
  zone: string;
  bootTime: string;
  uptime: string;
  labels: Record<string, string>;
  annotations: Record<string, string>;
  taints: { key: string; value?: string; effect: string }[];
  conditions: NodeCondition[];
  capacity: {
    cpuMillicores: number;
    memoryBytes: number;
    ephemeralStorageBytes: number;
    pods: number;
  };
  allocatable: {
    cpuMillicores: number;
    memoryBytes: number;
    ephemeralStorageBytes: number;
    pods: number;
  };
  allocated: {
    cpuRequestMillicores: number;
    cpuRequestPercent: number;
    cpuLimitMillicores: number;
    cpuLimitPercent: number;
    memoryRequestBytes: number;
    memoryRequestPercent: number;
    memoryLimitBytes: number;
    memoryLimitPercent: number;
    podsRunning: number;
    podsCapacity: number;
    ephemeralStorageUsedBytes: number;
    ephemeralStoragePercent: number;
  };
  cgroupPsi: {
    cpuSome10s: number;
    memSome10s: number;
    memFull10s: number;
    ioSome10s: number;
  };
  networkStats: {
    rxBytesPerSec: number;
    txBytesPerSec: number;
    tcpRetransmitsPerSec: number;
    socketDropsTotal: number;
  };
  scheduledPods: ScheduledPodDetail[];
  kernelLogs: NodeKernelLogEntry[];
}
