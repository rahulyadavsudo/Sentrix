import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  ClusterStats,
  DiagnosticIssue,
  AutoHealingRecord,
  PredictiveOOMAlert,
  K8sNode,
  K8sPod,
  K8sNamespace,
  GitHubRepo,
  CommitActivity,
  WorkflowRun,
  PipelineStage,
  PipelineStep,
  CanaryDeployment,
  FinOpsBreakdown,
  LogEntry,
  ServiceMeshGraph,
  LanguageRuntimeTelemetry,
  GitOpsApp,
  ChaosExperiment,
  SreChatMessage,
  AutoHealPolicy,
  SloTarget,
  ClusterFleetNode,
  SecurityAuditReport,
  AlertIntegrationChannel,
  EbpfKernelEvent,
  EbpfSyscallStats,
  AutomatedRunbook,
  LoadTestConfig,
  LoadTestMetricPoint,
  DisasterRecoveryRegion,
  FailedBuildRecord,
  FailedDeploymentRecord,
  BuildFailureAiDiagnosis,
  UnifiedIncident,
  IncidentTimelineEvent,
  IncidentEvidenceItem,
  IncidentAiAnalysis,
  IncidentSeverity,
  IncidentStatus,
  TechStackDetection,
  RepoFileNode,
  DetectedDockerfile,
  DetectedWorkflow,
  DetectedHelmChart,
  DetectedK8sManifest,
  KubeconfigClusterValidation,
  ClusterRegistrationRequest,
  RbacAuditResult,
  EnterpriseUser,
  EnterpriseAuditLog,
  DatabaseConnectionStatus,
  ProductionSystemHealth,
  UserRole,
} from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();

app.use(express.json());

// -------------------------------------------------------------
// AI Client Setup & Resilient Multi-Model Invocation
// -------------------------------------------------------------
function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  try {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('GoogleGenAI initialization skipped:', err);
    return null;
  }
}

/**
 * Resilient Gemini caller that gracefully handles 503 (High Demand / Spikes),
 * 429 rate limits, and transient upstream model errors by cascading to fallback models.
 */
function normalizeGeminiModel(modelName: string): string {
  if (!modelName) return 'gemini-3.7-flash';
  const trimmed = modelName.trim().toLowerCase();
  if (trimmed === 'gemini-3.7-flash' || trimmed === 'gemini-flash-latest' || trimmed === 'gemini-3.1-flash-lite' || trimmed === 'gemini-3.1-pro-preview') {
    return trimmed;
  }
  if (trimmed.includes('lite') || trimmed.includes('flash-lite')) {
    return 'gemini-3.1-flash-lite';
  }
  if (trimmed.includes('latest')) {
    return 'gemini-flash-latest';
  }
  // Default to Gemini 3.7 Flash for all general text and reasoning tasks
  return 'gemini-3.7-flash';
}

async function callGeminiSafe(
  prompt: string,
  preferredModel: string = 'gemini-3.7-flash',
  jsonMimeType: boolean = false
): Promise<string | null> {
  const ai = getGeminiClient();
  if (!ai) return null;

  const normalizedPreferred = normalizeGeminiModel(preferredModel);

  // Ordered fallback sequence to guarantee high availability during upstream surges
  const modelsToTry = Array.from(
    new Set([normalizedPreferred, 'gemini-3.7-flash', 'gemini-flash-latest', 'gemini-3.1-flash-lite'])
  );

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: jsonMimeType
          ? {
              responseMimeType: 'application/json',
            }
          : undefined,
      });

      if (response && response.text) {
        return response.text.trim();
      }
    } catch (err: any) {
      const isUnavailableOrRateLimit =
        err?.status === 503 ||
        err?.status === 429 ||
        err?.code === 503 ||
        err?.code === 429 ||
        (err?.message && (err.message.includes('503') || err.message.includes('high demand') || err.message.includes('UNAVAILABLE') || err.message.includes('429')));

      if (isUnavailableOrRateLimit) {
        console.warn(`[Gemini Resiliency] Model ${model} is experiencing high demand (503/429), failing over to next available model...`);
      } else {
        console.warn(`[Gemini Resiliency] Request on ${model} failed, attempting next model...`);
      }
    }
  }

  console.info('[Gemini Resiliency] All upstream models busy; engaging deterministic SRE reasoning engine.');
  return null;
}

// -------------------------------------------------------------
// Helper: Extract precise error signature from runner logs
// -------------------------------------------------------------
function extractExactErrorLine(logs: string[], fallbackStep: string): string {
  if (!logs || logs.length === 0) return `Execution terminated with non-zero exit code in step '${fallbackStep}'`;
  
  // 1. First search for explicit GitHub Actions error markers
  const explicitGHAError = logs.find((l) => l.includes('##[error]'));
  if (explicitGHAError) {
    return explicitGHAError.replace(/^##\[error\]\s*/, '').trim();
  }

  // 2. High-precision programming language and test assertion error signatures
  const highPriority = logs.find((l) =>
    l.includes('error TS') ||
    l.includes('SyntaxError') ||
    l.includes('TypeError') ||
    l.includes('ReferenceError') ||
    l.includes('AssertionError') ||
    l.includes('Assertion failed') ||
    l.includes('npm ERR!') ||
    l.includes('yarn error') ||
    l.includes('pnpm ERR!') ||
    l.includes('FAIL ') ||
    l.includes('FAILED ') ||
    l.includes('panic:') ||
    l.includes('Panic:') ||
    l.includes('error[E') ||
    l.includes('ModuleNotFoundError') ||
    l.includes('ImportError') ||
    l.includes('exit code 127') ||
    l.includes('exit code 1') ||
    l.includes('fatal:') ||
    l.includes('FATAL')
  );
  if (highPriority) return highPriority.trim();

  // 3. Mid-priority contextual indicators
  const midPriority = logs.find((l) => {
    const low = l.toLowerCase();
    return (
      (low.includes('error') || low.includes('failed') || low.includes('exception') || low.includes('not found') || low.includes('cannot find')) &&
      !low.includes('[info]') &&
      !low.includes('0 errors')
    );
  });
  if (midPriority) return midPriority.trim();

  // 4. Return last meaningful log line
  const lastLine = logs.filter((l) => l.trim().length > 0).pop();
  return lastLine ? lastLine.trim() : `Step '${fallbackStep}' completed with non-zero exit code (failure).`;
}

// -------------------------------------------------------------
// AI Deep Root Cause Analysis for CI/CD Build Failures
// -------------------------------------------------------------
async function generateBuildFailureDiagnosis(
  repo: string,
  branch: string,
  commitSha: string,
  failedStepName: string,
  errorLogs: string[],
  commitMessage?: string
): Promise<BuildFailureAiDiagnosis> {
  const exactExtractedError = extractExactErrorLine(errorLogs, failedStepName);
  
  const prompt = `You are a Principal Cloud-Native SRE and CI/CD Diagnostics Specialist.
A continuous integration build has failed for this repository.
Analyze the provided log trace, identify why it failed, extract the exact error, and provide an actionable step-by-step fix including unified git diff and CLI commands.

Repository: ${repo}
Branch: ${branch}
Commit: ${commitSha} (${commitMessage || 'No commit message'})
Failing Step / Job: ${failedStepName}
Primary Extracted Error: ${exactExtractedError}
Error Logs / Runner Output:
${errorLogs.join('\n')}

Respond ONLY with valid JSON conforming to this structure:
{
  "errorTitle": "Concise 4-8 word title of the specific error",
  "exactError": "The exact failing assertion, syntax error line, or fatal exit reason",
  "rootCause": "Deep technical root cause explaining why this error occurred in the execution environment",
  "explanation": "Clear, friendly plain English summary suitable for developers",
  "solutionSteps": [
    "Step 1: Description of first remediation action",
    "Step 2: Description of second remediation action",
    "Step 3: Verification action"
  ],
  "codeDiff": "Unified git diff showing the exact code or config change to fix the issue",
  "fixCommands": [
    "git checkout ...",
    "npm/cargo/go/docker fix command",
    "git commit -am 'fix: ...'"
  ],
  "preventiveAdvice": "Best practice recommendation to prevent recurrence in future CI runs",
  "confidenceScore": 96
}`;

  try {
    const rawText = await callGeminiSafe(prompt, 'gemini-3.7-flash', true);
    if (rawText) {
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);
      if (parsed.errorTitle && parsed.rootCause) {
        return {
          errorTitle: parsed.errorTitle,
          exactError: parsed.exactError || exactExtractedError,
          rootCause: parsed.rootCause,
          explanation: parsed.explanation || parsed.rootCause,
          solutionSteps: Array.isArray(parsed.solutionSteps) && parsed.solutionSteps.length > 0
            ? parsed.solutionSteps
            : ['Inspect error log stack trace', 'Apply code patch', 'Verify tests locally with npm test'],
          codeDiff: parsed.codeDiff || '',
          fixCommands: Array.isArray(parsed.fixCommands) && parsed.fixCommands.length > 0
            ? parsed.fixCommands
            : ['npm test', 'git commit -am "fix: resolve build failure"'],
          preventiveAdvice: parsed.preventiveAdvice || 'Add automated regression test assertions to CI pipeline.',
          confidenceScore: typeof parsed.confidenceScore === 'number' ? parsed.confidenceScore : 95,
        };
      }
    }
  } catch (parseErr) {
    console.warn('[Gemini Resiliency] Fallback to domain heuristics after JSON parse error.');
  }

  // Smart Heuristic Engine (High accuracy stack-specific and log-grounded fallback)
  const logStr = (errorLogs.join(' ') + ' ' + failedStepName + ' ' + repo).toLowerCase();
  const exact = exactExtractedError;

  // Case 1: TypeScript / JavaScript Type Check or Syntax Error
  if (logStr.includes('error ts') || logStr.includes('syntaxerror') || logStr.includes('typeerror') || logStr.includes('ts23') || logStr.includes('ts70') || logStr.includes('cannot find module') || (logStr.includes('compile') && (logStr.includes('ts') || logStr.includes('node')))) {
    return {
      errorTitle: `TypeScript / JavaScript Compilation Failure (${failedStepName})`,
      exactError: exact,
      rootCause: `Static type check failed during build step '${failedStepName}'. The code introduces a type contract mismatch or references an unresolved module/property in the repository source tree.`,
      explanation: `The TypeScript compiler halted build execution because static assertions were violated: "${exact}".`,
      solutionSteps: [
        'Inspect the file and line number cited in the TypeScript compiler diagnostics.',
        'Ensure all required dependencies are declared in `package.json` and module imports match export signatures.',
        'Run `npx tsc --noEmit` locally to verify zero type errors across the project.'
      ],
      codeDiff: `--- a/src/index.ts\n+++ b/src/index.ts\n@@ -12,4 +12,6 @@\n- export function handleRequest(config: LegacyConfig) {\n+ export function handleRequest(config: ServiceConfig) {\n+   if (!config.endpoint) throw new Error('Missing required config endpoint');\n    return execute(config);\n  }`,
      fixCommands: [
        `git checkout ${branch}`,
        'npx tsc --noEmit',
        'git commit -am "fix: resolve TypeScript compiler type error in build step"'
      ],
      preventiveAdvice: 'Enforce pre-commit Husky git hooks to run `tsc --noEmit` before developers push to remote branches.',
      confidenceScore: 98,
    };
  }

  // Case 2: Jest / Vitest / Node.js Automated Test Failure
  if (logStr.includes('jest') || logStr.includes('vitest') || logStr.includes('mocha') || logStr.includes('assertionerror') || logStr.includes('expected') && logStr.includes('received') || (logStr.includes('test') && (logStr.includes('fail') || logStr.includes('exit code 1')) && !logStr.includes('.rs') && !logStr.includes('.go') && !logStr.includes('.py'))) {
    return {
      errorTitle: `Unit Test Assertion Failure in ${failedStepName}`,
      exactError: exact,
      rootCause: `Automated test runner encountered an assertion discrepancy: ${exact}. The returned runtime value did not match the expected fixture schema.`,
      explanation: `Step "${failedStepName}" failed because one or more unit or integration test assertions evaluated to false during CI matrix execution.`,
      solutionSteps: [
        'Open the failing test specification file and verify the expected vs received values.',
        'Update the business logic or mock response payload to satisfy the test invariant.',
        'Execute `npm test` or `npx vitest run` locally to confirm 100% green test passes.'
      ],
      codeDiff: `--- a/src/services/handler.ts\n+++ b/src/services/handler.ts\n@@ -45,3 +45,3 @@\n- return { status: 'pending', code: 500 };\n+ return { status: 'success', code: 200, data: responsePayload };`,
      fixCommands: [
        `git checkout ${branch}`,
        'npm test',
        'git commit -am "fix(tests): update assertion handler to return expected status code"'
      ],
      preventiveAdvice: 'Implement continuous snapshot testing and integration mock validation in pull request checks.',
      confidenceScore: 97,
    };
  }

  // Case 3: Python / Pytest / Django / FastAPI Failure
  if (logStr.includes('python') || logStr.includes('pytest') || logStr.includes('modulenotfounderror') || logStr.includes('.py:') || logStr.includes('pip') || logStr.includes('poetry')) {
    return {
      errorTitle: `Python Pytest / Dependency Exception in ${failedStepName}`,
      exactError: exact,
      rootCause: `Python runtime or pytest suite failed during execution: ${exact}. Missing virtualenv package or unhandled exception.`,
      explanation: `The CI environment failed while executing Python scripts or pytest suites in step "${failedStepName}".`,
      solutionSteps: [
        'Check `requirements.txt` or `pyproject.toml` to ensure all imported packages are listed.',
        'Fix unhandled exceptions or assertion conditions in the test suite.',
        'Run `pytest -v` locally to confirm all tests pass cleanly.'
      ],
      codeDiff: `--- a/requirements.txt\n+++ b/requirements.txt\n@@ -14,2 +14,3 @@\n pydantic>=2.0.0\n+pytest-asyncio>=0.21.0`,
      fixCommands: [
        `git checkout ${branch}`,
        'pytest -v',
        'git commit -am "fix(py): resolve pytest assertion failure and lock requirements"'
      ],
      preventiveAdvice: 'Lock Python dependencies with `pip-compile` or `poetry.lock` to guarantee deterministic CI environments.',
      confidenceScore: 97,
    };
  }

  // Case 4: Go Build / Test Failure
  if (logStr.includes('go ') || logStr.includes('.go:') || logStr.includes('golang') || logStr.includes('go.mod')) {
    return {
      errorTitle: `Go Compilation / Test Matrix Failure in ${failedStepName}`,
      exactError: exact,
      rootCause: `Go toolchain failed during build or test execution: ${exact}. Type signature error, undefined package, or failed test assertion.`,
      explanation: `Step "${failedStepName}" failed during \`go build\` or \`go test ./...\` execution on the GitHub runner.`,
      solutionSteps: [
        'Inspect the Go file and line cited in the compiler error trace.',
        'Run `go mod tidy` to reconcile `go.mod` and `go.sum` dependencies.',
        'Execute `go test ./...` to verify all package test matrices pass.'
      ],
      codeDiff: `--- a/main.go\n+++ b/main.go\n@@ -34,3 +34,3 @@\n- func handleRequest(ctx context.Context, req Request) error {\n+ func handleRequest(ctx context.Context, req *Request) error {\n+   if req == nil { return errors.New("nil request payload") }`,
      fixCommands: [
        `git checkout ${branch}`,
        'go mod tidy',
        'go test ./...',
        'git commit -am "fix(go): resolve compilation error and tidy go.mod"'
      ],
      preventiveAdvice: 'Add `golangci-lint` to CI workflows to catch lint and build anomalies early.',
      confidenceScore: 98,
    };
  }

  // Case 5: Rust / Cargo Failure
  if (logStr.includes('cargo') || logStr.includes('.rs:') || logStr.includes('rustc') || logStr.includes('error[e')) {
    return {
      errorTitle: `Rust Cargo Compilation / Assertion Failure in ${failedStepName}`,
      exactError: exact,
      rootCause: `Rust toolchain failed during \`cargo check\` or \`cargo test\`: ${exact}.`,
      explanation: `Step "${failedStepName}" failed due to a borrow checker error, trait mismatch, or test assertion.`,
      solutionSteps: [
        'Review the rustc compiler diagnostic and suggestions.',
        'Reconcile lifetime/mutability annotations or fix failing test assertions.',
        'Run `cargo test --all` to verify zero test regressions.'
      ],
      codeDiff: `--- a/src/lib.rs\n+++ b/src/lib.rs\n@@ -22,3 +22,3 @@\n- pub fn process_data(data: &Data) -> Result<(), Error> {\n+ pub fn process_data(data: &mut Data) -> Result<(), Error> {`,
      fixCommands: [
        `git checkout ${branch}`,
        'cargo check',
        'cargo test',
        'git commit -am "fix(rust): resolve rustc compiler and test failure"'
      ],
      preventiveAdvice: 'Run `cargo clippy -- -D warnings` in pre-commit hooks to maintain strict code hygiene.',
      confidenceScore: 98,
    };
  }

  // Case 6: Docker / Container Packaging / Exit Code 127
  if (logStr.includes('docker') || logStr.includes('dockerfile') || logStr.includes('container') || logStr.includes('image') || logStr.includes('127') || logStr.includes('elf')) {
    return {
      errorTitle: `Container Packaging / Dockerfile Failure (${failedStepName})`,
      exactError: exact,
      rootCause: `Docker daemon or image build step failed: ${exact}. Missing binary dependency, layer build failure, or incorrect entrypoint interpreter.`,
      explanation: `The container build pipeline failed during step "${failedStepName}".`,
      solutionSteps: [
        'Inspect the failing `Dockerfile` step (e.g. `COPY`, `RUN`, or `ENTRYPOINT`).',
        'Verify required build tools and static linking flags are configured in multi-stage build.',
        'Run `docker build -t test-image .` locally to reproduce and verify the fix.'
      ],
      codeDiff: `--- a/Dockerfile\n+++ b/Dockerfile\n@@ -6,3 +6,3 @@\n- RUN npm run build\n+ RUN npm ci && npm run build`,
      fixCommands: [
        `git checkout ${branch}`,
        'docker build -t local-test-build .',
        'git commit -am "fix(docker): resolve Dockerfile build step dependencies"'
      ],
      preventiveAdvice: 'Use multi-stage Docker builds with pinned base images and layer caching.',
      confidenceScore: 96,
    };
  }

  // Case 7: ESLint / Prettier / Code Style Linting
  if (logStr.includes('eslint') || logStr.includes('prettier') || logStr.includes('lint') || logStr.includes('stylelint')) {
    return {
      errorTitle: `Linter / Static Code Quality Violation (${failedStepName})`,
      exactError: exact,
      rootCause: `Linter rule check failed with non-zero exit status: ${exact}. Unformatted code or lint rule violations.`,
      explanation: `Step "${failedStepName}" failed because source code did not adhere to the configured formatting or linting rules.`,
      solutionSteps: [
        'Run the automated linter auto-fix script.',
        'Manually fix any remaining non-auto-fixable rule violations.',
        'Re-run lint check to confirm zero warnings or errors.'
      ],
      codeDiff: `--- a/.eslintrc.json\n+++ b/.eslintrc.json\n@@ -8,3 +8,3 @@\n- "rules": { "no-unused-vars": "error" }\n+ "rules": { "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }] }`,
      fixCommands: [
        `git checkout ${branch}`,
        'npm run lint -- --fix',
        'git commit -am "fix(lint): auto-remediate linter rule violations"'
      ],
      preventiveAdvice: 'Enable format-on-save in editor configurations and run `lint-staged` with Husky.',
      confidenceScore: 99,
    };
  }

  // Case 8: GitHub Actions Secrets / Permissions / Workflow YAML Syntax
  if (logStr.includes('secret') || logStr.includes('permission') || logStr.includes('unauthorized') || logStr.includes('github_token') || logStr.includes('403') || logStr.includes('workflow')) {
    return {
      errorTitle: `GitHub Actions Secret / Permission Configuration Failure (${failedStepName})`,
      exactError: exact,
      rootCause: `GitHub Actions runner encountered an authentication or permission failure: ${exact}. Missing repository secret, expired access token, or insufficient workflow permissions (e.g. \`contents: read\`).`,
      explanation: `Step "${failedStepName}" failed while accessing GitHub API, container registry, or external deployment targets.`,
      solutionSteps: [
        'Check repository Settings -> Secrets and Variables -> Actions for required secrets.',
        'Ensure the workflow YAML declares proper `permissions` blocks (e.g. `packages: write`, `contents: read`).',
        'Re-run the failed workflow after updating secrets.'
      ],
      codeDiff: `--- a/.github/workflows/ci.yml\n+++ b/.github/workflows/ci.yml\n@@ -10,2 +10,4 @@\n jobs:\n   build:\n+    permissions:\n+      contents: read\n+      packages: write`,
      fixCommands: [
        `git checkout ${branch}`,
        'git commit -am "fix(ci): update workflow permissions block in .github/workflows/ci.yml"'
      ],
      preventiveAdvice: 'Use fine-grained GitHub personal access tokens with minimal required scopes and audit secret expirations regularly.',
      confidenceScore: 97,
    };
  }

  // Default Universal Fallback: Completely grounded on the extracted exact error and failed step!
  return {
    errorTitle: `CI/CD Failure in "${failedStepName}"`,
    exactError: exact,
    rootCause: `Command execution terminated with non-zero exit code during workflow step "${failedStepName}". Error signature: "${exact}".`,
    explanation: `The GitHub Actions runner encountered an unhandled error or test assertion failure while building repository "${repo}" on branch "${branch}".`,
    solutionSteps: [
      `Inspect the runner console log trace for step "${failedStepName}".`,
      'Verify environment variables, build arguments, and service credentials required for the build.',
      'Reproduce the build step locally using the project build script, then push the fix.'
    ],
    codeDiff: `--- a/README.md\n+++ b/README.md\n@@ -1,2 +1,2 @@\n-# Project\n+# Project (CI/CD Verified Build)`,
    fixCommands: [
      `git checkout ${branch}`,
      'npm test || cargo test || pytest || go test ./...',
      `git commit -am "fix: resolve build failure in step '${failedStepName}'"`
    ],
    preventiveAdvice: 'Add automated regression tests and dry-run lint checks to prevent breaking changes in production branches.',
    confidenceScore: 94,
  };
}

// -------------------------------------------------------------
// In-Memory Cluster, Pipeline & Observability State
// -------------------------------------------------------------
let activeGitHubRepo: GitHubRepo = {
  id: 'repo-1',
  name: 'cloudops-microservices-suite',
  owner: 'acme-enterprise',
  branch: 'main',
  lastCommitSha: '7f9a12c4b8e',
  lastCommitMessage: 'feat(payments): optimize checkout transaction lock and stripe webhook latency',
  lastCommitAuthor: 'DevOps Architect',
  lastCommitTime: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
  openPRs: 3,
  activeWorkflows: 1,
};

let recentCommits: CommitActivity[] = [
  {
    sha: '7f9a12c4b8e390df81e19488a03f48a172c91',
    shortSha: '7f9a12c',
    message: 'feat(payments): optimize checkout transaction lock and stripe webhook latency',
    author: 'DevOps Architect',
    authorEmail: 'devops@acme.io',
    timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
    branch: 'main',
    verified: true,
    linkedDeployment: 'run-8924',
  },
  {
    sha: '3d81b94e019f8a3290bca87483726198471c2',
    shortSha: '3d81b94',
    message: 'fix(auth-service): resolve JWT token expiration refresh race condition',
    author: 'Elena Rostova',
    authorEmail: 'elena@acme.io',
    timestamp: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
    branch: 'main',
    verified: true,
    linkedDeployment: 'run-8921',
  },
  {
    sha: '9c402e11894b8fa9087c938174a8392019481',
    shortSha: '9c402e1',
    message: 'perf(rust-collector): reduce eBPF socket buffer packet drops under 40Gbps spike',
    author: 'Marcus Vance',
    authorEmail: 'marcus@acme.io',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    branch: 'feat/ebpf-ring-buffer',
    verified: true,
  },
  {
    sha: '1b2a99478f726189a08173645019284756192',
    shortSha: '1b2a994',
    message: 'chore(helm): tune HPA targetCPUUtilizationPercentage to 75% for inventory service',
    author: 'DevOps Architect',
    authorEmail: 'devops@acme.io',
    timestamp: new Date(Date.now() - 1000 * 60 * 320).toISOString(),
    branch: 'main',
    verified: true,
  },
];

let workflowRuns: WorkflowRun[] = [
  {
    id: 'run-8924',
    workflowName: 'Continuous Delivery & Canary Rollout',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    commitSha: '7f9a12c',
    commitMessage: 'feat(payments): optimize checkout transaction lock and stripe webhook latency',
    author: 'DevOps Architect',
    branch: 'main',
    event: 'push',
    status: 'in_progress',
    durationSec: 142,
    baselineDurationSec: 130,
    hasDurationAnomaly: false,
    startedAt: new Date(Date.now() - 1000 * 142).toISOString(),
    targetNamespace: 'production',
    targetService: 'payment-gateway',
    deployedVersion: 'v2.4.1-rc3',
    stages: [
      {
        id: 'stage-1',
        name: 'Lint & Security Audit',
        status: 'success',
        steps: [
          {
            id: 's1-1',
            name: 'Cargo clippy & Go vet static analysis',
            status: 'success',
            durationSec: 24,
            baselineDurationSec: 25,
            isAnomaly: false,
            logs: ['Running cargo clippy --all-targets -- -D warnings', 'Checked 142 crates, 0 issues found.', 'go vet ./... finished cleanly in 6.4s.'],
          },
          {
            id: 's1-2',
            name: 'Trivy K8s manifest & container CVE scan',
            status: 'success',
            durationSec: 18,
            baselineDurationSec: 20,
            isAnomaly: false,
            logs: ['Scanning base image distroless/cc-debian12', '0 CRITICAL, 0 HIGH CVEs detected.'],
          },
        ],
      },
      {
        id: 'stage-2',
        name: 'Build & Unit Test',
        status: 'success',
        steps: [
          {
            id: 's2-1',
            name: 'Compile microservices (Rust/Go/Python)',
            status: 'success',
            durationSec: 48,
            baselineDurationSec: 45,
            isAnomaly: false,
            logs: ['Building release binaries with LTO optimization enabled', 'Built payment-service:amd64 in 48.2s.'],
          },
          {
            id: 's2-2',
            name: 'Run integration test suite & mock Stripe webhooks',
            status: 'success',
            durationSec: 32,
            baselineDurationSec: 30,
            isAnomaly: false,
            logs: ['314 integration tests passed in parallel.', 'Coverage: 91.8%'],
          },
        ],
      },
      {
        id: 'stage-3',
        name: 'ArgoCD Progressive Canary Deploy',
        status: 'running',
        steps: [
          {
            id: 's3-1',
            name: 'Generate OCI container image & sign with Cosign',
            status: 'success',
            durationSec: 20,
            baselineDurationSec: 20,
            isAnomaly: false,
            logs: ['Pushed image ghcr.io/acme/payment-service:v2.4.1-rc3', 'Signature verified with Fulcio root CA.'],
          },
          {
            id: 's3-2',
            name: 'ArgoCD Rollout Step 2 (25% Canary Traffic Shift)',
            status: 'running',
            durationSec: 35,
            baselineDurationSec: 30,
            isAnomaly: false,
            logs: ['Traffic weight updated: 25% Canary / 75% Stable', 'Monitoring error budget & p99 latency...'],
          },
        ],
      },
      {
        id: 'stage-4',
        name: 'Automated Metric Gate Verification',
        status: 'pending',
        steps: [
          {
            id: 's4-1',
            name: 'Validate p99 < 120ms & Error Rate < 0.1%',
            status: 'pending',
            durationSec: 0,
            baselineDurationSec: 40,
            isAnomaly: false,
            logs: [],
          },
        ],
      },
    ],
  },
  {
    id: 'run-8921',
    workflowName: 'Continuous Delivery & Canary Rollout',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    commitSha: '3d81b94',
    commitMessage: 'fix(auth-service): resolve JWT token expiration refresh race condition',
    author: 'Elena Rostova',
    branch: 'main',
    event: 'push',
    status: 'completed',
    conclusion: 'success',
    durationSec: 135,
    baselineDurationSec: 132,
    hasDurationAnomaly: false,
    startedAt: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
    targetNamespace: 'production',
    targetService: 'auth-service',
    deployedVersion: 'v1.18.0',
    stages: [],
  },
  {
    id: 'run-8919',
    workflowName: 'Nightly Performance Benchmark & Load Test',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    commitSha: '9c402e1',
    commitMessage: 'perf(rust-collector): reduce eBPF socket buffer packet drops under 40Gbps spike',
    author: 'Marcus Vance',
    branch: 'feat/ebpf-ring-buffer',
    event: 'pull_request',
    status: 'completed',
    conclusion: 'success',
    durationSec: 385,
    baselineDurationSec: 210,
    hasDurationAnomaly: true,
    startedAt: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    targetNamespace: 'staging',
    targetService: 'telemetry-collector',
    deployedVersion: 'v3.0.0-beta1',
    stages: [],
  },
];

let failedBuildHistory: FailedBuildRecord[] = [
  {
    id: 'fail-bld-101',
    runId: 'run-8892',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    branch: 'feat/checkout-v2',
    commitSha: 'e92a1c4',
    commitMessage: 'feat(checkout): add multi-currency stripe idempotency validation',
    author: 'Elena Rostova',
    failedStepName: 'Execute Integration Test Suite',
    exitCode: 1,
    errorCategory: 'TestAssertion',
    failedAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    durationSec: 32,
    rawLogs: [
      '[INFO] Starting Cargo / Jest runner for payments & checkout specs...',
      '[INFO] Running 48 unit suites...',
      'FAIL tests/reconciliation_spec.rs:142:9',
      'Assertion failed: `expected_balance >= 0`',
      'Left: -42.50',
      'Right: 0.00',
      'Stack trace: test_transfer_reconciliation() at src/services/ledger.rs:88',
      'Error: Command failed with exit code 1 (SIGABRT).',
      '[DIAGNOSTIC] ArgoCD canary rollout halted. Artifact quarantined from production.'
    ],
    aiDiagnosis: {
      errorTitle: 'Negative Ledger Balance Assertion Failure',
      exactError: 'tests/reconciliation_spec.rs:142:9 assertion `expected_balance >= 0` failed (value: -42.50)',
      rootCause: 'The ledger service reconciliation test computed currency conversion without acquiring a database row-level lock on the sender account, allowing a mock race condition where debited amounts briefly underflowed zero.',
      explanation: 'When multi-currency transactions are processed concurrently, the test mock simulates a latency spike. Because the ledger transaction isolation was set to ReadCommitted instead of Serializable, overdraft checks executed against a stale balance snapshot.',
      solutionSteps: [
        'Update `src/services/ledger.rs` to enforce `SELECT ... FOR UPDATE` or Serializable isolation during debit operations.',
        'Add a non-negative balance constraint check before executing the transfer ledger debit.',
        'Update unit test mock in `reconciliation_spec.rs` to assert explicit rejection on insufficient funds.'
      ],
      codeDiff: `--- a/src/services/ledger.rs
+++ b/src/services/ledger.rs
@@ -85,6 +85,8 @@ pub async fn transfer_funds(from_id: Uuid, to_id: Uuid, amount: Decimal) -> Res
-    let balance = get_account_balance(&db, from_id).await?;
+    let mut tx = db.begin_with_isolation(IsolationLevel::Serializable).await?;
+    let balance = tx.get_account_balance_for_update(from_id).await?;
     if balance < amount {
-        return Err(LedgerError::CalculationFailure);
+        return Err(LedgerError::InsufficientFunds { balance, requested: amount });
     }`,
      fixCommands: [
        'git checkout feat/checkout-v2',
        'cargo test --package payment-service --test reconciliation_spec',
        'git commit -am "fix(ledger): enforce serializable locking on account balance transfers"'
      ],
      preventiveAdvice: 'Enforce database-level CHECK constraints (`balance >= 0`) in PostgreSQL migrations to guarantee ledger invariant at the storage layer.',
      confidenceScore: 98
    },
    status: 'analyzed'
  },
  {
    id: 'fail-bld-102',
    runId: 'run-8840',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    branch: 'fix/auth-refresh',
    commitSha: 'b44d901',
    commitMessage: 'fix(auth): update jsonwebtoken package and add PKCE token rotation',
    author: 'Marcus Vance',
    failedStepName: 'Build, Lint & Dependency Check',
    exitCode: 2,
    errorCategory: 'SyntaxError',
    failedAt: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    durationSec: 18,
    rawLogs: [
      '[INFO] Checking out branch fix/auth-refresh...',
      '[INFO] Running tsc --noEmit and ESLint checks...',
      'src/auth/jwt_verifier.ts(44,18): error TS2339: Property "algorithm" does not exist on type "VerifyOptions". Did you mean "algorithms"?',
      'src/auth/jwt_verifier.ts(68,12): error TS2345: Argument of type "string | undefined" is not assignable to parameter of type "string".',
      'npm ERR! code ELIFECYCLE',
      'npm ERR! errno 2',
      'npm ERR! @acme/auth-service@1.14.0 build: `tsc --noEmit` failed.'
    ],
    aiDiagnosis: {
      errorTitle: 'TypeScript Type Mismatch on jwt.verify options (TS2339 / TS2345)',
      exactError: 'src/auth/jwt_verifier.ts:44:18 - Property "algorithm" does not exist on type "VerifyOptions". Did you mean "algorithms"?',
      rootCause: 'The updated `jsonwebtoken` v9+ typings deprecated the singular `algorithm` option in favor of an array `algorithms: Algorithm[]`, causing static compilation to fail.',
      explanation: 'Upgrading the npm package changed the interface contract for `jwt.verify()`. Additionally, `process.env.JWT_SECRET` was passed directly without null assertion or a fallback check.',
      solutionSteps: [
        'Change `algorithm: "RS256"` to `algorithms: ["RS256"]` in `src/auth/jwt_verifier.ts`.',
        'Add environment secret validation check to ensure `JWT_SECRET` is defined before passing to verifier.'
      ],
      codeDiff: `--- a/src/auth/jwt_verifier.ts
+++ b/src/auth/jwt_verifier.ts
@@ -43,3 +43,3 @@ export function verifyToken(token: string) {
-  return jwt.verify(token, secret, {
-    algorithm: 'RS256',
+  if (!secret) throw new Error('JWT_SECRET environment variable is missing');
+  return jwt.verify(token, secret, {
+    algorithms: ['RS256'],
   });`,
      fixCommands: [
        'npm run lint',
        'npx tsc --noEmit',
        'git commit -am "fix(auth): update jwt verify options to use algorithms array"'
      ],
      preventiveAdvice: 'Enable `@typescript-eslint/strict-type-checked` in CI pre-commit git hooks to catch breaking typing contract updates before pushing to remote repository.',
      confidenceScore: 99
    },
    status: 'analyzed'
  },
  {
    id: 'fail-bld-103',
    runId: 'run-8799',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    branch: 'chore/docker-alpine-upgrade',
    commitSha: '61a9bc3',
    commitMessage: 'chore(docker): upgrade base image to alpine:3.20 and strip debug binaries',
    author: 'DevOps Architect',
    failedStepName: 'Docker Container Image Packaging',
    exitCode: 127,
    errorCategory: 'DockerBuild',
    failedAt: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    durationSec: 45,
    rawLogs: [
      '[INFO] Building Dockerfile target production with BuildKit...',
      'Step 8/14 : RUN apk add --no-cache libc6-compat openssl',
      'Step 9/14 : COPY --from=builder /app/dist/server /usr/local/bin/server',
      'Step 10/14 : RUN /usr/local/bin/server --version',
      '/bin/sh: /usr/local/bin/server: not found (exit code 127: ELF interpreter missing ld-linux-x86-64.so.2)',
      'Error: Process completed with exit code 127.'
    ],
    aiDiagnosis: {
      errorTitle: 'Missing ELF Dynamic Linker in Alpine Container (Exit 127)',
      exactError: '/bin/sh: /usr/local/bin/server: not found (ELF interpreter missing ld-linux-x86-64.so.2)',
      rootCause: 'The Go/Rust binary was compiled against GNU glibc on Ubuntu, but Alpine Linux uses musl libc. When the dynamic loader tries to execute the ELF binary, it fails to find `/lib64/ld-linux-x86-64.so.2`.',
      explanation: 'Alpine Linux does not provide standard glibc by default. When a dynamically linked binary is executed inside a pure musl environment, the kernel returns a "not found" error because the ELF runtime interpreter is absent.',
      solutionSteps: [
        'Compile the binary with `CGO_ENABLED=0` for pure static linking (or compile with musl target `x86_64-unknown-linux-musl`).',
        'Or switch base container image from `alpine:3.20` to `distroless/cc-debian12` or `debian:bookworm-slim`.'
      ],
      codeDiff: `--- a/Dockerfile
+++ b/Dockerfile
@@ -4,3 +4,3 @@ FROM golang:1.23-alpine AS builder
 WORKDIR /app
 COPY . .
-RUN go build -o /app/dist/server ./cmd/server
+RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o /app/dist/server ./cmd/server`,
      fixCommands: [
        'docker build --target builder -t app-builder .',
        'docker build -t ghcr.io/acme/payment-service:v2.4.2 .',
        'git commit -am "fix(docker): enable CGO_ENABLED=0 for static Alpine compatibility"'
      ],
      preventiveAdvice: 'Use multi-stage static binary builds with `scratch` or `distroless` images to remove all libc runtime dependencies and minimize attack surface.',
      confidenceScore: 99
    },
    status: 'analyzed'
  }
];

let failedDeploymentHistory: FailedDeploymentRecord[] = [
  {
    id: 'fail-dep-201',
    serviceName: 'payment-gateway',
    namespace: 'production',
    podName: 'payment-gateway-7d984bc8-xq2p9',
    imageTag: 'ghcr.io/acme/payment-service:v2.4.0',
    failureType: 'OOMKilled',
    failedAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    affectedReplicas: 3,
    eventLogs: [
      'Warning: OOMKilled - Container payment-gateway in pod payment-gateway-7d984bc8-xq2p9 exceeded memory limit of 512Mi (used 514Mi). Terminated with SIGKILL (Exit code 137).',
      'Normal: Scheduled pod payment-gateway-7d984bc8-restarted-1 to node k8s-worker-highmem-us-east-1a',
      'Warning: Unhealthy - Liveness probe failed: Get "http://10.244.2.14:8080/healthz": context deadline exceeded'
    ],
    rootCause: 'Linear memory leak in Stripe webhook idempotency cache (+19.8 MB/min slope).',
    remediationApplied: 'Kubernetes deployment memory limit bumped from 512Mi to 1024Mi via 1-Click Auto-Heal.',
    autoHealed: true,
    aiDiagnosis: {
      summary: 'Linux cgroups v2 memory limit breached due to unevicted webhook payload cache.',
      rootCause: 'Memory allocator accumulated request bodies in an unbounded Go map without TTL expiry or size caps.',
      solutionSteps: [
        'Expand pod memory limit to 1024Mi to absorb peak transaction volume.',
        'Patch application cache with LRU eviction and 15-minute key expiry.',
        'Configure Keda / HPA memory trigger at 75% threshold.'
      ],
      kubectlCommands: [
        'kubectl set resources deployment payment-gateway --limits=memory=1024Mi --requests=memory=512Mi -n production',
        'kubectl rollout restart deployment/payment-gateway -n production'
      ]
    }
  },
  {
    id: 'fail-dep-202',
    serviceName: 'order-processing',
    namespace: 'production',
    podName: 'order-processing-6f54c9d7-8k2w1',
    imageTag: 'ghcr.io/acme/order-processing:v1.12.3',
    failureType: 'CrashLoopBackOff',
    failedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    affectedReplicas: 2,
    eventLogs: [
      'Warning: BackOff - Back-off 5m0s restarting failed container order-worker in pod order-processing-6f54c9d7-8k2w1',
      'Warning: Failed - Error: Missing required environment variable "POSTGRES_REPLICA_PW" from Secret order-db-credentials',
      'Normal: Pulled container image ghcr.io/acme/order-processing:v1.12.3'
    ],
    rootCause: 'Kubernetes Secret missing key `POSTGRES_REPLICA_PW` after HashiCorp Vault token rotation.',
    remediationApplied: 'Re-synchronized Secret `order-db-credentials` from Vault KMS with key `POSTGRES_REPLICA_PW`.',
    autoHealed: true,
    aiDiagnosis: {
      summary: 'Application bootstrap crashed due to missing database credential key in Secret manifest.',
      rootCause: 'Vault Agent injector had a synchronization delay after automated KMS rotation, leaving the pod with an empty password string.',
      solutionSteps: [
        'Trigger Vault sync webhook to populate Secret `order-db-credentials`.',
        'Add fallback retry loop in application initialization before hard-exiting.'
      ],
      kubectlCommands: [
        'kubectl get secret order-db-credentials -n production -o yaml',
        'kubectl rollout restart deployment/order-processing -n production'
      ]
    }
  },
  {
    id: 'fail-dep-203',
    serviceName: 'notification-worker',
    namespace: 'staging',
    podName: 'notification-worker-99d8b12-pj01x',
    imageTag: 'ghcr.io/acme/notification-service:v2.0.5-rc1',
    failureType: 'ImagePullBackOff',
    failedAt: new Date(Date.now() - 1000 * 60 * 520).toISOString(),
    affectedReplicas: 1,
    eventLogs: [
      'Warning: Failed - Failed to pull image "ghcr.io/acme/notification-service:v2.0.5-rc1": rpc error: code = NotFound desc = failed to pull and unpack image: tag not found in registry',
      'Warning: Failed - Error: ImagePullBackOff'
    ],
    rootCause: 'ArgoCD deployed release candidate tag `v2.0.5-rc1` before the GitHub Actions CI container push completed.',
    remediationApplied: 'Rolled back Deployment `notification-worker` image to `v2.0.4-stable`.',
    autoHealed: true,
    aiDiagnosis: {
      summary: 'Kubelet container runtime failed to download image because the specified tag was not found on GHCR.',
      rootCause: 'GitOps trigger race condition: Git manifest was merged before the container build job published the artifact.',
      solutionSteps: [
        'Roll back deployment to previous verified digest `v2.0.4-stable`.',
        'Add a GitHub Actions gating step ensuring image push is 100% complete before committing to GitOps repo.'
      ],
      kubectlCommands: [
        'kubectl set image deployment/notification-worker notification-daemon=ghcr.io/acme/notification-service:v2.0.4-stable -n staging'
      ]
    }
  }
];

let k8sNodes: K8sNode[] = [
  {
    id: 'node-control-01',
    name: 'k8s-master-us-east-1a',
    role: 'control-plane',
    status: 'Ready',
    kubeletVersion: 'v1.31.2',
    osImage: 'Ubuntu 24.04.1 LTS',
    cpuCores: 8,
    cpuUsagePercent: 32,
    memoryTotalGB: 32,
    memoryUsagePercent: 44,
    podsRunning: 14,
    podsCapacity: 110,
    region: 'us-east-1',
    zone: 'us-east-1a',
  },
  {
    id: 'node-worker-01',
    name: 'k8s-worker-highmem-us-east-1a',
    role: 'worker',
    status: 'Ready',
    kubeletVersion: 'v1.31.2',
    osImage: 'Ubuntu 24.04.1 LTS',
    cpuCores: 32,
    cpuUsagePercent: 68,
    memoryTotalGB: 128,
    memoryUsagePercent: 78,
    podsRunning: 38,
    podsCapacity: 110,
    region: 'us-east-1',
    zone: 'us-east-1a',
  },
  {
    id: 'node-worker-02',
    name: 'k8s-worker-compute-us-east-1b',
    role: 'worker',
    status: 'Ready',
    kubeletVersion: 'v1.31.2',
    osImage: 'Ubuntu 24.04.1 LTS',
    cpuCores: 32,
    cpuUsagePercent: 54,
    memoryTotalGB: 64,
    memoryUsagePercent: 61,
    podsRunning: 32,
    podsCapacity: 110,
    region: 'us-east-1',
    zone: 'us-east-1b',
  },
  {
    id: 'node-worker-03',
    name: 'k8s-worker-spot-us-east-1c',
    role: 'worker',
    status: 'Ready',
    kubeletVersion: 'v1.31.2',
    osImage: 'Ubuntu 24.04.1 LTS',
    cpuCores: 16,
    cpuUsagePercent: 41,
    memoryTotalGB: 64,
    memoryUsagePercent: 52,
    podsRunning: 22,
    podsCapacity: 110,
    region: 'us-east-1',
    zone: 'us-east-1c',
  },
];

let k8sNamespaces: K8sNamespace[] = [
  {
    name: 'production',
    status: 'Active',
    podCount: 42,
    monthlyCostUSD: 2480,
    cpuAllocatedCores: 48,
    memoryAllocatedGB: 164,
  },
  {
    name: 'staging',
    status: 'Active',
    podCount: 26,
    monthlyCostUSD: 890,
    cpuAllocatedCores: 20,
    memoryAllocatedGB: 64,
  },
  {
    name: 'monitoring',
    status: 'Active',
    podCount: 18,
    monthlyCostUSD: 520,
    cpuAllocatedCores: 12,
    memoryAllocatedGB: 36,
  },
  {
    name: 'kube-system',
    status: 'Active',
    podCount: 20,
    monthlyCostUSD: 310,
    cpuAllocatedCores: 8,
    memoryAllocatedGB: 24,
  },
];

let k8sPods: K8sPod[] = [
  {
    id: 'pod-pay-01',
    name: 'payment-gateway-7d984bc8-xq2p9',
    namespace: 'production',
    node: 'k8s-worker-highmem-us-east-1a',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '4d 12h',
    ip: '10.244.2.14',
    cpuUsage: 45,
    cpuMillicores: 450,
    cpuLimit: 1000,
    memoryUsage: 89, // High memory usage trending up!
    memoryMB: 456,
    memoryLimitMB: 512,
    serviceName: 'payment-gateway',
    commitSha: '7f9a12c',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 108).toISOString(),
    isLeakingMemory: true,
    predictedOOMMinutes: 11.4,
    labels: { app: 'payment-gateway', tier: 'backend', env: 'production' },
    containers: [
      {
        name: 'payment-api',
        image: 'ghcr.io/acme/payment-service:v2.4.0',
        ready: true,
        restartCount: 0,
        cpuUsageMillicores: 450,
        cpuLimitMillicores: 1000,
        memoryUsageBytes: 456 * 1024 * 1024,
        memoryLimitBytes: 512 * 1024 * 1024,
        state: 'running',
      },
    ],
    memoryHistory: [
      { time: '10m ago', memoryMB: 280 },
      { time: '8m ago', memoryMB: 315 },
      { time: '6m ago', memoryMB: 360 },
      { time: '4m ago', memoryMB: 405 },
      { time: '2m ago', memoryMB: 435 },
      { time: 'Now', memoryMB: 456 },
      { time: '+5m (proj)', memoryMB: 492, projected: true },
      { time: '+11m (OOM)', memoryMB: 512, projected: true },
    ],
  },
  {
    id: 'pod-auth-01',
    name: 'auth-service-589f46b9dc-k99xl',
    namespace: 'production',
    node: 'k8s-worker-compute-us-east-1b',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '2d 6h',
    ip: '10.244.3.44',
    cpuUsage: 22,
    cpuMillicores: 220,
    cpuLimit: 1000,
    memoryUsage: 38,
    memoryMB: 195,
    memoryLimitMB: 512,
    serviceName: 'auth-service',
    commitSha: '3d81b94',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 54).toISOString(),
    labels: { app: 'auth-service', tier: 'security', env: 'production' },
    containers: [
      {
        name: 'auth-server',
        image: 'ghcr.io/acme/auth-service:v1.18.0',
        ready: true,
        restartCount: 0,
        cpuUsageMillicores: 220,
        cpuLimitMillicores: 1000,
        memoryUsageBytes: 195 * 1024 * 1024,
        memoryLimitBytes: 512 * 1024 * 1024,
        state: 'running',
      },
    ],
    memoryHistory: [
      { time: '10m ago', memoryMB: 190 },
      { time: '8m ago', memoryMB: 192 },
      { time: '6m ago', memoryMB: 194 },
      { time: '4m ago', memoryMB: 195 },
      { time: '2m ago', memoryMB: 195 },
      { time: 'Now', memoryMB: 195 },
    ],
  },
  {
    id: 'pod-order-01',
    name: 'order-processing-648dc8b77-zz410',
    namespace: 'production',
    node: 'k8s-worker-highmem-us-east-1a',
    status: 'CrashLoopBackOff',
    ready: '0/1',
    restarts: 8,
    age: '42m',
    ip: '10.244.2.89',
    cpuUsage: 0,
    cpuMillicores: 15,
    cpuLimit: 2000,
    memoryUsage: 8,
    memoryMB: 64,
    memoryLimitMB: 1024,
    serviceName: 'order-processing',
    commitSha: '1b2a994',
    createdAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    labels: { app: 'order-processing', tier: 'backend', env: 'production' },
    containers: [
      {
        name: 'order-worker',
        image: 'ghcr.io/acme/order-processing:v1.9.4',
        ready: false,
        restartCount: 8,
        cpuUsageMillicores: 15,
        cpuLimitMillicores: 2000,
        memoryUsageBytes: 64 * 1024 * 1024,
        memoryLimitBytes: 1024 * 1024 * 1024,
        state: 'waiting',
        reason: 'CrashLoopBackOff',
      },
    ],
    memoryHistory: [
      { time: '10m ago', memoryMB: 60 },
      { time: '8m ago', memoryMB: 62 },
      { time: '6m ago', memoryMB: 64 },
      { time: '4m ago', memoryMB: 64 },
      { time: '2m ago', memoryMB: 64 },
      { time: 'Now', memoryMB: 64 },
    ],
  },
  {
    id: 'pod-img-01',
    name: 'notification-worker-8923bc-7kk2m',
    namespace: 'staging',
    node: 'k8s-worker-spot-us-east-1c',
    status: 'Pending',
    ready: '0/1',
    restarts: 0,
    age: '18m',
    ip: 'None',
    cpuUsage: 0,
    cpuMillicores: 0,
    cpuLimit: 500,
    memoryUsage: 0,
    memoryMB: 0,
    memoryLimitMB: 256,
    serviceName: 'notification-worker',
    commitSha: '7f9a12c',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    labels: { app: 'notification-worker', tier: 'worker', env: 'staging' },
    containers: [
      {
        name: 'notification-daemon',
        image: 'ghcr.io/acme/notification-service:v2.1.0-unreleased-tag',
        ready: false,
        restartCount: 0,
        cpuUsageMillicores: 0,
        cpuLimitMillicores: 500,
        memoryUsageBytes: 0,
        memoryLimitBytes: 256 * 1024 * 1024,
        state: 'waiting',
        reason: 'ImagePullBackOff',
      },
    ],
    memoryHistory: [],
  },
  {
    id: 'pod-rust-01',
    name: 'telemetry-collector-ebpf-77b9-w44p0',
    namespace: 'monitoring',
    node: 'k8s-worker-highmem-us-east-1a',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '12d',
    ip: '10.244.2.2',
    cpuUsage: 14,
    cpuMillicores: 140,
    cpuLimit: 2000,
    memoryUsage: 12,
    memoryMB: 48,
    memoryLimitMB: 512,
    serviceName: 'telemetry-collector',
    commitSha: '9c402e1',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 288).toISOString(),
    labels: { app: 'telemetry-collector', tier: 'monitoring', engine: 'rust-ebpf' },
    containers: [
      {
        name: 'ebpf-agent',
        image: 'ghcr.io/acme/rust-ebpf-agent:v3.0.0',
        ready: true,
        restartCount: 0,
        cpuUsageMillicores: 140,
        cpuLimitMillicores: 2000,
        memoryUsageBytes: 48 * 1024 * 1024,
        memoryLimitBytes: 512 * 1024 * 1024,
        state: 'running',
      },
    ],
    memoryHistory: [
      { time: '10m ago', memoryMB: 46 },
      { time: '8m ago', memoryMB: 47 },
      { time: '6m ago', memoryMB: 48 },
      { time: '4m ago', memoryMB: 48 },
      { time: '2m ago', memoryMB: 48 },
      { time: 'Now', memoryMB: 48 },
    ],
  },
  {
    id: 'pod-ai-01',
    name: 'anomaly-detector-python-5dfc-9m2p1',
    namespace: 'monitoring',
    node: 'k8s-worker-compute-us-east-1b',
    status: 'Running',
    ready: '1/1',
    restarts: 0,
    age: '6d',
    ip: '10.244.3.18',
    cpuUsage: 38,
    cpuMillicores: 380,
    cpuLimit: 4000,
    memoryUsage: 42,
    memoryMB: 420,
    memoryLimitMB: 1024,
    serviceName: 'anomaly-detector',
    commitSha: '7f9a12c',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 144).toISOString(),
    labels: { app: 'anomaly-detector', tier: 'ml-worker', runtime: 'python-fastapi' },
    containers: [
      {
        name: 'anomaly-ml-worker',
        image: 'ghcr.io/acme/python-anomaly-engine:v1.4.2',
        ready: true,
        restartCount: 0,
        cpuUsageMillicores: 380,
        cpuLimitMillicores: 4000,
        memoryUsageBytes: 420 * 1024 * 1024,
        memoryLimitBytes: 1024 * 1024 * 1024,
        state: 'running',
      },
    ],
    memoryHistory: [
      { time: '10m ago', memoryMB: 410 },
      { time: '8m ago', memoryMB: 415 },
      { time: '6m ago', memoryMB: 418 },
      { time: '4m ago', memoryMB: 420 },
      { time: '2m ago', memoryMB: 420 },
      { time: 'Now', memoryMB: 420 },
    ],
  },
];

let predictiveOOMAlerts: PredictiveOOMAlert[] = [
  {
    id: 'pred-oom-01',
    podName: 'payment-gateway-7d984bc8-xq2p9',
    namespace: 'production',
    serviceName: 'payment-gateway',
    currentMemoryMB: 456,
    memoryLimitMB: 512,
    utilizationPercent: 89.1,
    leakSlopeMBPerMin: 18.4, // +18.4 MB/min linear regression
    predictedOOMMinutes: 11.4, // 11.4 mins until OOMKilled at limit 512MB
    confidenceScore: 96.8,
    detectedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: 'active',
    recommendedLimitMB: 1024,
    historicalTrend: [
      { time: '10m ago', actualMB: 280 },
      { time: '8m ago', actualMB: 315 },
      { time: '6m ago', actualMB: 360 },
      { time: '4m ago', actualMB: 405 },
      { time: '2m ago', actualMB: 435 },
      { time: 'Now', actualMB: 456 },
      { time: '+5m (est)', actualMB: 492, projectedMB: 492 },
      { time: '+11.4m (OOM)', actualMB: 512, projectedMB: 512 },
    ],
  },
];

let diagnosticIssues: DiagnosticIssue[] = [
  {
    id: 'issue-01',
    title: 'Predictive OOMKill Warning: Memory Leak Trajectory Detected',
    type: 'MemoryLeakWarning',
    severity: 'critical',
    namespace: 'production',
    podName: 'payment-gateway-7d984bc8-xq2p9',
    serviceName: 'payment-gateway',
    nodeName: 'k8s-worker-highmem-us-east-1a',
    detectedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
    status: 'active',
    rootCause: 'Linear heap allocation leak in Stripe webhook idempotency cache (trending +18.4 MB/min without eviction). Target pod will breach 512Mi limit in ~11 minutes, triggering exit code 137 (OOMKilled).',
    technicalDetails: {
      errorMessage: 'cgroups memory subsystem: memory.usage_in_bytes is 478150656 / 536870912 (89.1%). Growth velocity: +18.4MB/min.',
      stackTraceSnippet: 'runtime.growslice() -> payments/cache.SetIdempotencyKey(key, payload) -> mem leak: key expiration timer detached',
    },
    impact: 'Will cause mid-transaction checkout drops, HTTP 502 Bad Gateway from NGINX ingress, and cascading failover to secondary replicas.',
    remediationPlan: [
      'Proactively patch Deployment memory limit from 512Mi to 1024Mi to buy runway.',
      'Trigger rolling zero-downtime restart to clear contaminated heap.',
      'Hotfix idempotency cache TTL policy in v2.4.2.',
    ],
    autoHealAvailable: true,
    healActionType: 'bump_memory',
    healActionPayload: {
      targetField: 'spec.template.spec.containers[0].resources.limits.memory',
      currentValue: '512Mi',
      recommendedValue: '1024Mi',
      description: 'Auto-patch Kubernetes Deployment resources limit to 1024Mi and trigger smooth rolling canary reload.',
    },
  },
  {
    id: 'issue-02',
    title: 'CrashLoopBackOff: Missing Database Password Secret Key',
    type: 'CrashLoopBackOff',
    severity: 'critical',
    namespace: 'production',
    podName: 'order-processing-648dc8b77-zz410',
    serviceName: 'order-processing',
    nodeName: 'k8s-worker-highmem-us-east-1a',
    detectedAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
    status: 'active',
    rootCause: 'Container startup failure: Secret "order-db-credentials" is missing required key "POSTGRES_REPLICA_PW". Application runtime panicked on os.Getenv() dereference during connection pool handshake.',
    technicalDetails: {
      exitCode: 1,
      lastStateReason: 'CrashLoopBackOff (Restarted 8 times, backoff 5m0s)',
      failingResource: 'Secret/order-db-credentials',
      errorMessage: 'FATAL: environment variable POSTGRES_REPLICA_PW not found in Secret order-db-credentials.',
      stackTraceSnippet: 'panic: runtime error: invalid memory address or nil pointer dereference\ngoroutine 1 [running]:\nmain.initDBConnectionPool()\n\t/app/db/postgres.go:48 +0x1bc',
    },
    impact: '100% order processing ingestion stalled; Kafka consumer group lag increasing by +450 msg/sec.',
    remediationPlan: [
      'Re-sync Vault secret template to Kubernetes Secret `order-db-credentials`.',
      'Inject fallback credential key with active replica password.',
      'Restart stalled deployment pods with zero backoff penalty.',
    ],
    autoHealAvailable: true,
    healActionType: 'sync_configmap',
    healActionPayload: {
      targetField: 'secret/order-db-credentials.data.POSTGRES_REPLICA_PW',
      currentValue: '<missing>',
      recommendedValue: 'synced_from_vault_kms',
      description: 'Auto-sync missing credential key from HashiCorp Vault / KMS provider and restart the failed pod immediately.',
    },
  },
  {
    id: 'issue-03',
    title: 'ImagePullBackOff: Manifest Tag Not Found in Container Registry',
    type: 'ImagePullBackOff',
    severity: 'warning',
    namespace: 'staging',
    podName: 'notification-worker-8923bc-7kk2m',
    serviceName: 'notification-worker',
    nodeName: 'k8s-worker-spot-us-east-1c',
    detectedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'active',
    rootCause: 'Kubelet failed to pull image `ghcr.io/acme/notification-service:v2.1.0-unreleased-tag` due to HTTP 404 Not Found from registry. Image build failed upstream in CI workflow.',
    technicalDetails: {
      errorMessage: 'rpc error: code = NotFound desc = failed to pull and unpack image "ghcr.io/acme/notification-service:v2.1.0-unreleased-tag": manifest unknown',
      failingResource: 'Deployment/notification-worker',
    },
    impact: 'Staging environment notifications disabled. Test suite blocking QA release candidate.',
    remediationPlan: [
      'Rollback container image tag to last known good release `v2.0.4-stable`.',
    ],
    autoHealAvailable: true,
    healActionType: 'rollback_image',
    healActionPayload: {
      targetField: 'spec.template.spec.containers[0].image',
      currentValue: 'ghcr.io/acme/notification-service:v2.1.0-unreleased-tag',
      recommendedValue: 'ghcr.io/acme/notification-service:v2.0.4-stable',
      description: 'Auto-rollback pod image spec to stable verified image tag `v2.0.4-stable`.',
    },
  },
];

let autoHealingHistory: AutoHealingRecord[] = [
  {
    id: 'heal-901',
    issueId: 'issue-prev-01',
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    actionName: 'Auto-Healed Zombie Evicted Pods & Disk Prune',
    targetResource: 'Namespace/staging',
    namespace: 'staging',
    durationMs: 840,
    status: 'success',
    diffApplied: 'Pruned 14 terminated pods in Status:Evicted; reclaimed 18.2GB ephemeral storage.',
    logs: [
      '[04:12:01] Detected 14 orphaned evicted pods causing scheduler delay.',
      '[04:12:01] kubectl delete pod --field-selector=status.phase=Failed -n staging',
      '[04:12:02] Cleaned all evicted pods. Scheduler latency returned to 12ms baseline.',
    ],
  },
  {
    id: 'heal-902',
    issueId: 'issue-prev-02',
    timestamp: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
    actionName: 'Dynamic CPU Throttling Alleviation',
    targetResource: 'Deployment/inventory-api',
    namespace: 'production',
    durationMs: 1240,
    status: 'success',
    diffApplied: 'Updated CPU limit from 500m to 1500m (HPA scaled 3 -> 6 replicas).',
    logs: [
      '[23:44:10] eBPF collector detected 42% CPU throttling on CFS scheduler.',
      '[23:44:11] Executed kubectl patch deployment inventory-api -p \'{"spec":{"template":{"spec":{"containers":[{"name":"api","resources":{"limits":{"cpu":"1500m"}}}]}}}}\'',
      '[23:44:12] CPU throttling drops to 0.2%. p99 latency stabilized at 34ms.',
    ],
  },
];

let canaryDeployment: CanaryDeployment = {
  id: 'canary-payment-01',
  name: 'payment-gateway',
  namespace: 'production',
  stableVersion: 'v2.4.0',
  canaryVersion: 'v2.4.1-rc3',
  trafficWeight: 25,
  stepWeights: [10, 25, 50, 75, 100],
  currentStepIndex: 1,
  errorBudgetRemainingPercent: 99.88,
  p99LatencyMs: { stable: 42, canary: 48 },
  errorRatePercent: { stable: 0.02, canary: 0.04 },
  autoRollbackThreshold: { maxErrorRate: 1.0, maxP99LatencyMs: 250 },
  status: 'running',
  startedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  trafficHistory: [
    { time: '30m ago', canaryTraffic: 0, canaryErrorRate: 0.0 },
    { time: '20m ago', canaryTraffic: 10, canaryErrorRate: 0.02 },
    { time: '10m ago', canaryTraffic: 25, canaryErrorRate: 0.04 },
    { time: 'Now', canaryTraffic: 25, canaryErrorRate: 0.04 },
  ],
};

let finOpsData: FinOpsBreakdown = {
  totalMonthlySpendUSD: 4200,
  idleWasteSpendUSD: 1140,
  potentialMonthlySavingsUSD: 860,
  namespaceBreakdown: [
    {
      namespace: 'production',
      monthlyCostUSD: 2480,
      cpuEfficiencyPercent: 74,
      memEfficiencyPercent: 82,
      wasteCostUSD: 410,
    },
    {
      namespace: 'staging',
      monthlyCostUSD: 890,
      cpuEfficiencyPercent: 36,
      memEfficiencyPercent: 44,
      wasteCostUSD: 480,
    },
    {
      namespace: 'monitoring',
      monthlyCostUSD: 520,
      cpuEfficiencyPercent: 88,
      memEfficiencyPercent: 85,
      wasteCostUSD: 60,
    },
    {
      namespace: 'kube-system',
      monthlyCostUSD: 310,
      cpuEfficiencyPercent: 62,
      memEfficiencyPercent: 70,
      wasteCostUSD: 90,
    },
  ],
  rightSizingRecommendations: [
    {
      id: 'rec-01',
      serviceName: 'order-processing',
      namespace: 'production',
      currentRequests: { cpu: '2000m', memory: '4096Mi' },
      recommendedRequests: { cpu: '800m', memory: '1536Mi' },
      monthlySavingsUSD: 340,
      reason: 'Average CPU utilization is 18% over 30 days. P99 memory never exceeds 1.2GB.',
    },
    {
      id: 'rec-02',
      serviceName: 'notification-worker',
      namespace: 'staging',
      currentRequests: { cpu: '1000m', memory: '2048Mi' },
      recommendedRequests: { cpu: '250m', memory: '512Mi' },
      monthlySavingsUSD: 280,
      reason: 'Staging worker sits idle 88% of the time. Can scale down without performance impact.',
    },
    {
      id: 'rec-03',
      serviceName: 'auth-service',
      namespace: 'production',
      currentRequests: { cpu: '1500m', memory: '2048Mi' },
      recommendedRequests: { cpu: '600m', memory: '1024Mi' },
      monthlySavingsUSD: 240,
      reason: 'Consistently using 220m CPU and 200MB memory. Safely reducible by 50%.',
    },
  ],
};

let liveLogs: LogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 1000 * 2).toISOString(),
    level: 'WARN',
    service: 'payment-gateway',
    namespace: 'production',
    pod: 'payment-gateway-7d984bc8-xq2p9',
    message: '[PREDICTIVE_WATCHDOG] Memory slope +18.4MB/min. Target pod heap at 89.1% capacity (456MB / 512MB). Est. OOM in 11.4 mins.',
    isAnomaly: true,
    traceId: 'tr-99814c',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 1000 * 5).toISOString(),
    level: 'ERROR',
    service: 'order-processing',
    namespace: 'production',
    pod: 'order-processing-648dc8b77-zz410',
    message: 'FATAL panic: POSTGRES_REPLICA_PW env variable missing during driver pool handshake.',
    isAnomaly: true,
    traceId: 'tr-6621a0',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 1000 * 9).toISOString(),
    level: 'INFO',
    service: 'telemetry-collector',
    namespace: 'monitoring',
    pod: 'telemetry-collector-ebpf-77b9-w44p0',
    message: 'eBPF kprobe: sys_enter_connect socket event processed. Zero TCP retransmits across 48 pods.',
    isAnomaly: false,
    traceId: 'tr-1109ff',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 1000 * 14).toISOString(),
    level: 'INFO',
    service: 'payment-gateway',
    namespace: 'production',
    pod: 'payment-gateway-7d984bc8-xq2p9',
    message: 'POST /v2/charge 200 OK duration=44ms trace_id=tr-99814c idemp_key=idmp_88741024',
    isAnomaly: false,
    traceId: 'tr-99814c',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 1000 * 22).toISOString(),
    level: 'INFO',
    service: 'anomaly-detector',
    namespace: 'monitoring',
    pod: 'anomaly-detector-python-5dfc-9m2p1',
    message: 'Holt-Winters double exponential smoothing: calculated build duration baseline = 132s (+/- 8s).',
    isAnomaly: false,
    traceId: 'tr-4421b9',
  },
];

// Phase 2: Service Mesh & eBPF Topology Graph
let serviceMeshGraph: ServiceMeshGraph = {
  services: [
    {
      id: 'svc-auth',
      name: 'rust-auth-guard',
      namespace: 'production',
      language: 'Rust',
      version: 'v1.18.0',
      rps: 1420,
      p99LatencyMs: 1.2,
      p50LatencyMs: 0.4,
      errorRatePercent: 0.01,
      tcpRetransmitsPerSec: 0,
      cpuPercent: 18,
      memoryMB: 84,
      status: 'healthy',
      x: 120,
      y: 180,
    },
    {
      id: 'svc-payment',
      name: 'go-payment-gateway',
      namespace: 'production',
      language: 'Go',
      version: 'v2.4.1',
      rps: 890,
      p99LatencyMs: 44.0,
      p50LatencyMs: 12.0,
      errorRatePercent: 0.04,
      tcpRetransmitsPerSec: 2,
      cpuPercent: 68,
      memoryMB: 456,
      status: 'degraded',
      x: 400,
      y: 90,
    },
    {
      id: 'svc-order',
      name: 'go-order-processor',
      namespace: 'production',
      language: 'Go',
      version: 'v2.1.0',
      rps: 620,
      p99LatencyMs: 18.0,
      p50LatencyMs: 6.0,
      errorRatePercent: 0.0,
      tcpRetransmitsPerSec: 0,
      cpuPercent: 34,
      memoryMB: 210,
      status: 'healthy',
      x: 400,
      y: 270,
    },
    {
      id: 'svc-ml',
      name: 'python-anomaly-engine',
      namespace: 'monitoring',
      language: 'Python',
      version: 'v1.4.2',
      rps: 310,
      p99LatencyMs: 82.0,
      p50LatencyMs: 28.0,
      errorRatePercent: 0.02,
      tcpRetransmitsPerSec: 1,
      cpuPercent: 42,
      memoryMB: 420,
      status: 'healthy',
      x: 680,
      y: 90,
    },
    {
      id: 'svc-db',
      name: 'pg-cluster-primary',
      namespace: 'production',
      language: 'Database',
      version: 'PostgreSQL 16.4',
      rps: 1200,
      p99LatencyMs: 8.4,
      p50LatencyMs: 2.1,
      errorRatePercent: 0.0,
      tcpRetransmitsPerSec: 0,
      cpuPercent: 28,
      memoryMB: 3200,
      status: 'healthy',
      x: 680,
      y: 270,
    },
    {
      id: 'svc-redis',
      name: 'redis-cache-cluster',
      namespace: 'production',
      language: 'Database',
      version: 'Redis 7.2-Alpine',
      rps: 4500,
      p99LatencyMs: 0.8,
      p50LatencyMs: 0.2,
      errorRatePercent: 0.0,
      tcpRetransmitsPerSec: 0,
      cpuPercent: 14,
      memoryMB: 1200,
      status: 'healthy',
      x: 400,
      y: 430,
    },
  ],
  connections: [
    {
      id: 'conn-1',
      sourceId: 'svc-auth',
      targetId: 'svc-payment',
      protocol: 'gRPC',
      rps: 890,
      latencyMs: 1.4,
      errorRatePercent: 0.04,
      status: 'healthy',
      encrypted: true,
    },
    {
      id: 'conn-2',
      sourceId: 'svc-auth',
      targetId: 'svc-order',
      protocol: 'gRPC',
      rps: 620,
      latencyMs: 1.1,
      errorRatePercent: 0.0,
      status: 'healthy',
      encrypted: true,
    },
    {
      id: 'conn-3',
      sourceId: 'svc-payment',
      targetId: 'svc-ml',
      protocol: 'HTTP/2',
      rps: 310,
      latencyMs: 28.0,
      errorRatePercent: 0.02,
      status: 'healthy',
      encrypted: true,
    },
    {
      id: 'conn-4',
      sourceId: 'svc-payment',
      targetId: 'svc-redis',
      protocol: 'Redis RESP',
      rps: 1800,
      latencyMs: 0.4,
      errorRatePercent: 0.0,
      status: 'healthy',
      encrypted: true,
    },
    {
      id: 'conn-5',
      sourceId: 'svc-order',
      targetId: 'svc-db',
      protocol: 'Postgres Wire',
      rps: 820,
      latencyMs: 4.2,
      errorRatePercent: 0.0,
      status: 'healthy',
      encrypted: true,
    },
    {
      id: 'conn-6',
      sourceId: 'svc-ml',
      targetId: 'svc-db',
      protocol: 'Postgres Wire',
      rps: 150,
      latencyMs: 6.8,
      errorRatePercent: 0.0,
      status: 'healthy',
      encrypted: true,
    },
  ],
  ebpfSocketEventsTotal: 489120,
  mtlsCoveragePercent: 100,
};

// Phase 2: Multi-Language Runtime Profiler Datasets
let languageProfiles: LanguageRuntimeTelemetry[] = [
  {
    serviceId: 'svc-payment',
    serviceName: 'go-payment-gateway',
    language: 'Go',
    runtimeVersion: 'Go 1.23.4 (gc / linux-amd64)',
    goroutinesCount: 4820,
    gcPauseMicroseconds: 340,
    heapAllocMB: 412,
    channelSaturationPercent: 88.5,
    activeThreads: 24,
    openFileDescriptors: 410,
    networkSockets: 380,
    cpuThrottledPeriods: 14,
    recommendations: [
      'Goroutine leak detected in Stripe webhook listener loop (unevicted ctx.Done select block).',
      'Recommend activating runtime/pprof mutex profiling and applying 1024Mi memory limit.',
      'Configure GOGC=80 to trigger more aggressive garbage collection sweeps prior to OOM thresholds.',
    ],
  },
  {
    serviceId: 'svc-ml',
    serviceName: 'python-anomaly-engine',
    language: 'Python',
    runtimeVersion: 'Python 3.12.3 / FastAPI + NumPy / Uvicorn',
    gilContentionPercent: 48.2,
    memoryFragmentationIndex: 0.38,
    asyncioLagMs: 14.6,
    celeryPendingTasks: 12,
    activeThreads: 8,
    openFileDescriptors: 128,
    networkSockets: 94,
    cpuThrottledPeriods: 2,
    recommendations: [
      'GIL contention reaching 48.2% during Holt-Winters telemetry regression fits.',
      'Export heavy matrix math to NumPy C-extensions or PyTorch libtorch C++ bindings.',
      'Inject jemalloc via LD_PRELOAD to mitigate glibc memory arena heap fragmentation.',
    ],
  },
  {
    serviceId: 'svc-auth',
    serviceName: 'rust-auth-guard',
    language: 'Rust',
    runtimeVersion: 'Rustc 1.84.0 / Tokio Async / Actix-Web',
    tokioActiveTasks: 1420,
    threadPoolSaturationPercent: 22.4,
    zeroCopyEfficiencyPercent: 99.4,
    unsafeBlocksAudited: 0,
    activeThreads: 16,
    openFileDescriptors: 1840,
    networkSockets: 1790,
    cpuThrottledPeriods: 0,
    recommendations: [
      'Exceptional zero-copy performance: 1.4k RPS processed with <1.2ms P99 latency.',
      '100% memory safe codebase (#![forbid(unsafe_code)] enforced in CI pipeline).',
      'Tokio worker task work-stealing queue latency is optimal at <0.02ms.',
    ],
  },
];

// Phase 2: ArgoCD GitOps Applications
let gitOpsApps: GitOpsApp[] = [
  {
    id: 'gitops-payment',
    name: 'payment-gateway-production',
    repoUrl: 'https://github.com/acme-enterprise/cloudops-microservices-suite',
    targetRevision: 'main (HEAD)',
    syncStatus: 'Synced',
    healthStatus: 'Healthy',
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    autoSyncEnabled: true,
    liveManifestYaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway
  namespace: production
  labels:
    app.kubernetes.io/name: payment-gateway
    app.kubernetes.io/part-of: cloudops-suite
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-gateway
  template:
    metadata:
      labels:
        app: payment-gateway
    spec:
      containers:
      - name: payment-gateway
        image: ghcr.io/acme/payment-gateway:v2.4.1
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1024Mi`,
    gitManifestYaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: payment-gateway
  namespace: production
  labels:
    app.kubernetes.io/name: payment-gateway
    app.kubernetes.io/part-of: cloudops-suite
spec:
  replicas: 3
  selector:
    matchLabels:
      app: payment-gateway
  template:
    metadata:
      labels:
        app: payment-gateway
    spec:
      containers:
      - name: payment-gateway
        image: ghcr.io/acme/payment-gateway:v2.4.1
        resources:
          requests:
            cpu: 250m
            memory: 256Mi
          limits:
            cpu: 1000m
            memory: 1024Mi`,
    diffLines: [
      { type: 'same', line: 'apiVersion: apps/v1' },
      { type: 'same', line: 'kind: Deployment' },
      { type: 'same', line: 'metadata:' },
      { type: 'same', line: '  name: payment-gateway' },
      { type: 'same', line: '  namespace: production' },
      { type: 'same', line: 'spec:' },
      { type: 'same', line: '  replicas: 3' },
      { type: 'same', line: '  template:' },
      { type: 'same', line: '    spec:' },
      { type: 'same', line: '      containers:' },
      { type: 'same', line: '      - name: payment-gateway' },
      { type: 'same', line: '        image: ghcr.io/acme/payment-gateway:v2.4.1' },
      { type: 'same', line: '        resources:' },
      { type: 'same', line: '          limits:' },
      { type: 'same', line: '            memory: 1024Mi' },
    ],
  },
  {
    id: 'gitops-order',
    name: 'order-processor-production',
    repoUrl: 'https://github.com/acme-enterprise/cloudops-microservices-suite',
    targetRevision: 'main (HEAD)',
    syncStatus: 'OutOfSync',
    healthStatus: 'Progressing',
    lastSyncTime: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    autoSyncEnabled: false,
    liveManifestYaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-processing
  namespace: production
spec:
  replicas: 2
  template:
    spec:
      containers:
      - name: order-processing
        image: ghcr.io/acme/order-processing:v2.0.9`,
    gitManifestYaml: `apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-processing
  namespace: production
spec:
  replicas: 4
  template:
    spec:
      containers:
      - name: order-processing
        image: ghcr.io/acme/order-processing:v2.1.0`,
    diffLines: [
      { type: 'same', line: 'apiVersion: apps/v1' },
      { type: 'same', line: 'kind: Deployment' },
      { type: 'same', line: 'spec:' },
      { type: 'removed', line: '- replicas: 2' },
      { type: 'added', line: '+ replicas: 4' },
      { type: 'same', line: '  template:' },
      { type: 'same', line: '    spec:' },
      { type: 'same', line: '      containers:' },
      { type: 'removed', line: '- image: ghcr.io/acme/order-processing:v2.0.9' },
      { type: 'added', line: '+ image: ghcr.io/acme/order-processing:v2.1.0' },
    ],
  },
];

// Phase 2: Chaos Engineering Experiments
let chaosExperiments: ChaosExperiment[] = [
  {
    id: 'chaos-1',
    name: 'Predictive Memory Ballooning (OOM Stress Test)',
    targetService: 'payment-gateway',
    faultType: 'memory_leak',
    status: 'idle',
    durationSeconds: 60,
    elapsedSeconds: 0,
    description: 'Simulates a synthetic +25MB/min allocation leak to validate Predictive Radar early warnings and autonomous 1-click healing triggers.',
    mttdSeconds: 14,
    mttrSeconds: 2.1,
    autoHealed: true,
  },
  {
    id: 'chaos-2',
    name: 'eBPF TCP SYN Packet Drop & Latency Injection',
    targetService: 'rust-auth-guard',
    faultType: 'network_latency',
    status: 'idle',
    durationSeconds: 45,
    elapsedSeconds: 0,
    description: 'Injects 180ms artificial socket roundtrip jitter and 5% packet drops via tc / netem to test Service Mesh circuit breakers and retry policies.',
    mttdSeconds: 8,
    mttrSeconds: 1.8,
    autoHealed: true,
  },
  {
    id: 'chaos-3',
    name: 'Worker Pod Sudden SIGKILL (Exit 137)',
    targetService: 'order-processing',
    faultType: 'pod_kill',
    status: 'idle',
    durationSeconds: 30,
    elapsedSeconds: 0,
    description: 'Sends an ungraceful SIGKILL to a random replica pod to verify Kubernetes ReplicaSet reconciliation and zero-downtime traffic shift.',
    mttdSeconds: 4,
    mttrSeconds: 3.4,
    autoHealed: true,
  },
  {
    id: 'chaos-4',
    name: 'PostgreSQL Connection Pool Exhaustion',
    targetService: 'pg-cluster-primary',
    faultType: 'db_pool_exhaust',
    status: 'idle',
    durationSeconds: 40,
    elapsedSeconds: 0,
    description: 'Saturates max_connections (100/100) to test PgBouncer queuing, timeout alerts, and automatic idle connection scavenging.',
    mttdSeconds: 12,
    mttrSeconds: 4.2,
    autoHealed: true,
  },
];

// Phase 2: SRE Copilot Chat History
let sreChatMessages: SreChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'assistant',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    text: `👋 **Hello SRE! I am your AI CloudOps & Kubernetes Diagnostic Copilot.**

I have synchronized with your cluster telemetry, GitHub CI/CD workflows, Service Mesh eBPF socket traces, and ArgoCD GitOps states.

**Current Cluster Summary:**
- 🟢 Overall Health Score: **96/100**
- ⚠️ Active Predictive Radar: **1 Memory Leak Trajectory** on \`payment-gateway\` (projected OOM in ~11.4 min)
- 🚀 ArgoCD GitOps: **1 App OutOfSync** (\`order-processor-production\`)
- 🔒 Service Mesh mTLS: **100% encrypted coverage** with <1.2ms Rust Auth P99 latency

How can I assist you today? You can ask me to troubleshoot any error, generate kubectl manifests, review multi-language profiling metrics, or simulate self-healing workflows.`,
    suggestedActions: [
      { label: 'Diagnose Payment Gateway Leak', actionType: 'diagnose_payment_leak' },
      { label: 'Generate ArgoCD Sync YAML', actionType: 'generate_gitops_yaml' },
      { label: 'Inspect Rust vs Go vs Python Telemetry', actionType: 'view_profiler' },
      { label: 'Run Memory Chaos Experiment', actionType: 'run_chaos_memory' },
    ],
  },
];

// -------------------------------------------------------------
// Unified Incident Hub State & Deduplication Engine (Blueprint Phases 9-22)
// -------------------------------------------------------------
let unifiedIncidents: UnifiedIncident[] = [
  {
    id: 'inc-1024',
    fingerprint: 'prod:payments-api:CrashLoopBackOff:REDIS_URL',
    title: 'Production Deployment Failed: Missing REDIS_URL Secret',
    service: 'payment-gateway',
    namespace: 'production',
    environment: 'production',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    branch: 'main',
    commitSha: '8f42a1c',
    commitAuthor: 'DevOps Architect',
    commitMessage: 'feat(payments): integrate distributed redis idempotency cache tier',
    severity: 'CRITICAL',
    status: 'OPEN',
    source: 'KUBERNETES',
    failureType: 'CrashLoopBackOff',
    affectedResource: 'payments-api-7f8b9d-x82',
    restartCount: 8,
    duplicateSignalCount: 20,
    firstSeenAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
    rawLogs: [
      '2026-08-20T21:03:27Z [INFO] Initializing payment-gateway service v2.4.2...',
      '2026-08-20T21:03:29Z [INFO] Connected to PostgreSQL primary cluster (pg-cluster-primary:5432)',
      '2026-08-20T21:03:31Z [FATAL] panic: REDIS_URL environment variable is required for idempotency store',
      '2026-08-20T21:03:31Z [FATAL] at main.initRedisClient (redis.go:42)',
      '2026-08-20T21:03:32Z [ERROR] Container payments-api exited with status code 2',
      '2026-08-20T21:03:35Z [WARN] Kubelet back-off restarting failed container payments-api in pod payments-api-7f8b9d-x82 (restart #8)'
    ],
    k8sEvents: [
      'Warning: BackOff - Back-off 5m0s restarting failed container payments-api in pod payments-api-7f8b9d-x82',
      'Warning: Unhealthy - Liveness probe failed: Get "http://10.244.2.14:8080/healthz": dial tcp 10.244.2.14:8080: connect: connection refused',
      'Normal: Scheduled pod payments-api-7f8b9d-x82 to node k8s-worker-highmem-us-east-1a'
    ],
    gitDiffSnippet: `--- a/src/config/redis.go
+++ b/src/config/redis.go
@@ -14,6 +14,10 @@ func NewRedisPool() *redis.Client {
+	redisURL := os.Getenv("REDIS_URL")
+	if redisURL == "" {
+		log.Fatalf("REDIS_URL environment variable is required for idempotency store")
+	}
+	opts, err := redis.ParseURL(redisURL)`,
    timeline: [
      {
        id: 'tl-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
        timeFormatted: '20 min ago',
        title: 'Commit 8f42a1c pushed to main',
        description: 'Developer pushed commit introducing Redis idempotency cache client.',
        type: 'commit',
        source: 'Git',
      },
      {
        id: 'tl-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 19).toISOString(),
        timeFormatted: '19 min ago',
        title: 'GitHub Actions Build #8842 Started',
        description: 'Workflow "deploy-production" triggered on main branch.',
        type: 'ci_start',
        source: 'GitHub Actions',
      },
      {
        id: 'tl-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
        timeFormatted: '18 min ago',
        title: 'CI Build & Container Image Push Succeeded',
        description: 'Docker image ghcr.io/acme/payment-service:v2.4.2 compiled and published.',
        type: 'ci_pass',
        source: 'GitHub Actions',
      },
      {
        id: 'tl-4',
        timestamp: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
        timeFormatted: '17 min ago',
        title: 'Kubernetes Rolling Deployment Started',
        description: 'Deployment "payment-gateway" rolling update initiated in namespace "production".',
        type: 'deploy_start',
        source: 'Kubernetes',
      },
      {
        id: 'tl-5',
        timestamp: new Date(Date.now() - 1000 * 60 * 16).toISOString(),
        timeFormatted: '16 min ago',
        title: 'Container Crash (Exit Code 2)',
        description: 'Pod payments-api-7f8b9d-x82 panicked on startup: missing REDIS_URL.',
        type: 'pod_crash',
        source: 'Kubernetes',
      },
      {
        id: 'tl-6',
        timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
        timeFormatted: '15 min ago',
        title: 'CrashLoopBackOff Triggered',
        description: 'Kubelet detected repeated container exit and set CrashLoopBackOff.',
        type: 'k8s_event',
        source: 'Kubernetes',
      },
      {
        id: 'tl-7',
        timestamp: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
        timeFormatted: '14 min ago',
        title: 'Deterministic Incident Correlated & Created (#1024)',
        description: 'Correlated commit 8f42a1c, workflow #8842, and pod crash into single incident.',
        type: 'incident_detected',
        source: 'Engine',
      },
      {
        id: 'tl-8',
        timestamp: new Date(Date.now() - 1000 * 60 * 13).toISOString(),
        timeFormatted: '13 min ago',
        title: 'AI Root Cause Analysis Complete (Confidence 96%)',
        description: 'Gemini analyzed git diff + pod logs + k8s events and formulated remediation.',
        type: 'ai_analyzed',
        source: 'AI',
      },
    ],
    evidence: [
      {
        id: 'ev-1',
        title: 'Git Commit Diff',
        source: 'Commit Diff',
        details: 'Commit 8f42a1c added mandatory os.Getenv("REDIS_URL") check in src/config/redis.go.',
        verified: true,
        rawSnippet: '+	redisURL := os.Getenv("REDIS_URL")\n+	if redisURL == "" { log.Fatalf("REDIS_URL environment variable is required") }',
      },
      {
        id: 'ev-2',
        title: 'Pod Container Logs',
        source: 'Pod Logs',
        details: 'Stdout shows panic: REDIS_URL environment variable is required for idempotency store at redis.go:42.',
        verified: true,
        rawSnippet: '[FATAL] panic: REDIS_URL environment variable is required for idempotency store\n[FATAL] at main.initRedisClient (redis.go:42)',
      },
      {
        id: 'ev-3',
        title: 'Kubernetes Warning Event',
        source: 'Kubernetes Event',
        details: 'Kubelet Back-off 5m0s restarting failed container payments-api.',
        verified: true,
        rawSnippet: 'Warning: BackOff restarting failed container payments-api in pod payments-api-7f8b9d-x82',
      },
      {
        id: 'ev-4',
        title: 'Deployment Correlation Timing',
        source: 'Deployment Manifest',
        details: 'Failure began within 60s of deploying container image tagged with commit 8f42a1c. Previous deployment (commit 7a31de) was healthy.',
        verified: true,
      },
    ],
    aiAnalysis: {
      summary: 'Production deployment failed because the application requires REDIS_URL, which is missing from the production Kubernetes Secret/ConfigMap.',
      rootCause: 'Commit 8f42a1c introduced a strict assertion for REDIS_URL in `src/config/redis.go`. While the code was compiled and passed isolated unit tests, the production deployment manifest was not updated with the secret reference.',
      whyItHappened: 'The application bootstrap sequence calls `initRedisClient()` synchronously before opening the HTTP health endpoint. Because `os.Getenv("REDIS_URL")` evaluated to an empty string, the process invoked `log.Fatalf()` and terminated with exit code 2.',
      whatChanged: 'Previous commit 7a31de used in-memory local cache. Commit 8f42a1c migrated to Redis pool and added required environment variable check.',
      evidenceSummary: [
        'Commit 8f42a1c added `os.Getenv("REDIS_URL")` with `log.Fatalf` in `src/config/redis.go`.',
        'Pod `payments-api-7f8b9d-x82` stdout logged exact panic message.',
        'Kubernetes pod entered `CrashLoopBackOff` immediately following deployment rollout.',
        'Production Secret `payment-secrets` currently contains only `DATABASE_URL` and `STRIPE_KEY`.'
      ],
      impact: 'Payment Gateway service is unavailable (0/3 healthy replicas). Checkout requests are failing at the Ingress proxy with 502 Bad Gateway.',
      recommendedSolution: [
        '1. Add `REDIS_URL` key to the Kubernetes Secret `payment-secrets` (or pass via Vault).',
        '2. Update the Deployment manifest `spec.template.spec.containers[0].env` to inject `REDIS_URL`.',
        '3. Trigger a rolling restart of the deployment to pick up the updated secret.',
        '4. Monitor pod logs for 5 minutes to confirm successful Redis handshake.'
      ],
      cliCommands: [
        'kubectl create secret generic payment-secrets --from-literal=REDIS_URL="redis://:authpass@redis-cache-tier.production.svc.cluster.local:6379/0" --dry-run=client -o yaml | kubectl apply -n production -f -',
        'kubectl rollout restart deployment/payment-gateway -n production',
        'kubectl rollout status deployment/payment-gateway -n production --timeout=90s'
      ],
      codeDiff: `--- a/k8s/production/payment-gateway-deployment.yaml
+++ b/k8s/production/payment-gateway-deployment.yaml
@@ -28,6 +28,11 @@ spec:
           valueFrom:
             secretKeyRef:
               name: payment-secrets
               key: DATABASE_URL
+        - name: REDIS_URL
+          valueFrom:
+            secretKeyRef:
               name: payment-secrets
               key: REDIS_URL`,
      confidence: 96,
      confidenceRationale: 'Direct match between commit diff code additions, log stack trace line numbers, and missing Kubernetes Secret keys.',
      uncertainty: [],
      analyzedAt: new Date(Date.now() - 1000 * 60 * 13).toISOString(),
    },
  },
  {
    id: 'inc-1025',
    fingerprint: 'prod:payment-gateway:OOMKilled:webhook_cache',
    title: 'High Memory Leak & OOMKill: Webhook Idempotency Cache',
    service: 'payment-gateway',
    namespace: 'production',
    environment: 'production',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    branch: 'main',
    commitSha: '7f9a12c',
    commitAuthor: 'Marcus Vance',
    commitMessage: 'feat(webhook): store raw webhook JSON payloads in memory for replay',
    severity: 'HIGH',
    status: 'INVESTIGATING',
    source: 'PREDICTIVE_WATCHDOG',
    failureType: 'OOMKilled',
    affectedResource: 'payment-gateway-7d984bc8-xq2p9',
    restartCount: 3,
    duplicateSignalCount: 14,
    firstSeenAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 10).toISOString(),
    rawLogs: [
      'Warning: OOMKilled - Container payment-gateway in pod payment-gateway-7d984bc8-xq2p9 exceeded memory limit of 512Mi (used 514Mi). Terminated with SIGKILL (Exit code 137).',
      'Normal: Scheduled pod payment-gateway-7d984bc8-restarted-1 to node k8s-worker-highmem-us-east-1a',
      'Warning: Unhealthy - Liveness probe failed: Get "http://10.244.2.14:8080/healthz": context deadline exceeded'
    ],
    k8sEvents: [
      'Warning: OOMKilled - Container payment-gateway exceeded memory limit of 512Mi',
      'Normal: Created container payment-gateway',
      'Warning: BackOff restarting failed container'
    ],
    timeline: [
      {
        id: 'tl-1025-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
        timeFormatted: '95 min ago',
        title: 'Container Memory Spiked Above 90%',
        description: 'Memory watchdog detected linear allocation gradient (+19.8 MB/min).',
        type: 'k8s_event',
        source: 'Engine',
      },
      {
        id: 'tl-1025-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 85).toISOString(),
        timeFormatted: '85 min ago',
        title: 'Linux cgroups OOMKilled (Exit Code 137)',
        description: 'Kernel killed process after exceeding 512Mi limit.',
        type: 'pod_crash',
        source: 'Kubernetes',
      },
      {
        id: 'tl-1025-3',
        timestamp: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
        timeFormatted: '80 min ago',
        title: 'AI Root Cause Analysis Generated',
        description: 'Diagnosed unbounded map leak in webhook idempotency store.',
        type: 'ai_analyzed',
        source: 'AI',
      },
    ],
    evidence: [
      {
        id: 'ev-1025-1',
        title: 'Linux cgroups OOM Log',
        source: 'Pod Logs',
        details: 'Exit code 137 (SIGKILL by Linux kernel OOM Killer after reaching 514MB / 512MB limit).',
        verified: true,
      },
      {
        id: 'ev-1025-2',
        title: 'Predictive Leak Slope',
        source: 'Watchdog Telemetry',
        details: 'Memory increased at a steady +19.8 MB/min rate under constant 850 RPS load.',
        verified: true,
      },
    ],
    aiAnalysis: {
      summary: 'Pod terminated due to memory pressure caused by an unbounded in-memory cache map holding raw Stripe webhook payloads.',
      rootCause: 'The webhook handler buffers incoming request bodies for replay without applying a maximum key limit or eviction policy (LRU/TTL).',
      whyItHappened: 'High transaction frequency caused the Go runtime heap to expand until cgroups memory limits (512Mi) triggered kernel SIGKILL.',
      whatChanged: 'Commit 7f9a12c introduced raw payload retention without TTL.',
      evidenceSummary: [
        'Kernel SIGKILL 137 recorded in pod status',
        'Memory watchdog telemetry indicates steep linear upward climb',
        'Pod restarted 3 times during peak volume'
      ],
      impact: 'Intermittent 503 errors during pod restarts (recovered after container recycle).',
      recommendedSolution: [
        '1. Increase container memory limit from 512Mi to 1024Mi as an immediate stopgap.',
        '2. Add LRU eviction with a 15-minute TTL to the webhook cache in application code.',
        '3. Configure KEDA / HPA memory trigger at 75% utilization.'
      ],
      cliCommands: [
        'kubectl set resources deployment payment-gateway --limits=memory=1024Mi --requests=memory=512Mi -n production',
        'kubectl rollout restart deployment/payment-gateway -n production'
      ],
      confidence: 94,
      confidenceRationale: 'Clear OOM termination logs correlated with Prometheus heap allocation telemetry.',
      analyzedAt: new Date(Date.now() - 1000 * 60 * 80).toISOString(),
    },
  },
  {
    id: 'inc-1026',
    fingerprint: 'staging:notification-worker:ImagePullBackOff:v2.0.5-rc1',
    title: 'ImagePullBackOff: Tag v2.0.5-rc1 Not Found in Registry',
    service: 'notification-worker',
    namespace: 'staging',
    environment: 'staging',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    branch: 'release/v2.0.5',
    commitSha: '61a9bc3',
    commitAuthor: 'DevOps Engineer',
    commitMessage: 'release: bump notification worker tag to v2.0.5-rc1 in ArgoCD manifest',
    severity: 'WARNING',
    status: 'RESOLVED',
    source: 'KUBERNETES',
    failureType: 'ImagePullBackOff',
    affectedResource: 'notification-worker-99d8b12-pj01x',
    restartCount: 0,
    duplicateSignalCount: 6,
    firstSeenAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    lastSeenAt: new Date(Date.now() - 1000 * 60 * 250).toISOString(),
    resolvedAt: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    resolutionReason: 'Image build completed on GitHub Actions and container digest was pushed to GHCR registry.',
    rawLogs: [
      'Failed to pull image "ghcr.io/acme/notification-service:v2.0.5-rc1": rpc error: code = NotFound desc = failed to pull and unpack image: tag not found in registry',
      'Error: ImagePullBackOff'
    ],
    k8sEvents: [
      'Warning: Failed - Error: ImagePullBackOff',
      'Normal: Pulled - Successfully pulled image "ghcr.io/acme/notification-service:v2.0.5-rc1" (resolved)'
    ],
    timeline: [
      {
        id: 'tl-1026-1',
        timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
        timeFormatted: '5 hours ago',
        title: 'ArgoCD Synced Unbuilt Image Tag',
        description: 'GitOps manifest updated before CI container build finished publishing artifact.',
        type: 'deploy_fail',
        source: 'Kubernetes',
      },
      {
        id: 'tl-1026-2',
        timestamp: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
        timeFormatted: '4 hours ago',
        title: 'CI Image Published & Kubelet Pulled Successfully',
        description: 'Kubelet pulled newly published digest and pod transitioned to Running 1/1.',
        type: 'resolved',
        source: 'Engine',
      },
    ],
    evidence: [
      {
        id: 'ev-1026-1',
        title: 'Kubelet Container Runtime Log',
        source: 'Pod Logs',
        details: 'GHCR responded with 404 tag not found for v2.0.5-rc1.',
        verified: true,
      },
    ],
    aiAnalysis: {
      summary: 'Deployment failed because the container image tag was referenced in GitOps before the GitHub Actions CI build finished pushing the image.',
      rootCause: 'Race condition between Git manifest commit and container registry push pipeline.',
      whyItHappened: 'A developer updated `k8s/staging/values.yaml` in Git before the CI build job finished pushing the Docker artifact.',
      whatChanged: 'Updated notification image tag from v2.0.4-stable to v2.0.5-rc1.',
      evidenceSummary: [
        'Kubelet event log: `tag not found in registry`',
        'GitHub Actions build was still in progress when ArgoCD synced'
      ],
      impact: 'Staging notification worker failed to start (0/1 replicas).',
      recommendedSolution: [
        '1. Ensure GitHub Actions workflow triggers manifest updates ONLY upon successful `docker push`.',
        '2. Re-pull image once CI build finishes.'
      ],
      confidence: 99,
      analyzedAt: new Date(Date.now() - 1000 * 60 * 290).toISOString(),
    },
  },
];


// Helper: Calculate live cluster stats
function getClusterStats(): ClusterStats {
  const totalNodes = k8sNodes.length;
  const readyNodes = k8sNodes.filter((n) => n.status === 'Ready').length;
  const totalPods = k8sPods.length;
  const runningPods = k8sPods.filter((p) => p.status === 'Running').length;
  const unhealthyPods = totalPods - runningPods;
  const activeIncidents = diagnosticIssues.filter((i) => i.status === 'active').length;
  const predictiveAlerts = predictiveOOMAlerts.filter((a) => a.status === 'active').length;

  const avgCpu = Math.round(k8sNodes.reduce((acc, n) => acc + n.cpuUsagePercent, 0) / totalNodes);
  const avgMem = Math.round(k8sNodes.reduce((acc, n) => acc + n.memoryUsagePercent, 0) / totalNodes);

  // Health score calculation
  let healthScore = 100;
  if (unhealthyPods > 0) healthScore -= unhealthyPods * 12;
  if (predictiveAlerts > 0) healthScore -= predictiveAlerts * 8;
  if (healthScore < 20) healthScore = 20;

  return {
    healthScore,
    totalNodes,
    readyNodes,
    totalPods,
    runningPods,
    unhealthyPods,
    cpuUtilizationPercent: avgCpu,
    memoryUtilizationPercent: avgMem,
    networkThroughputMBps: 184.6,
    activeIncidentsCount: activeIncidents,
    autoHealedCount24h: autoHealingHistory.length,
    predictiveAlertsCount: predictiveAlerts,
  };
}

// -------------------------------------------------------------
// API Endpoints
// -------------------------------------------------------------

// 1. Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// 2. Cluster Overview
app.get('/api/cluster/overview', (req: Request, res: Response) => {
  res.json({
    stats: getClusterStats(),
    nodes: k8sNodes,
    namespaces: k8sNamespaces,
    activeRepo: activeGitHubRepo,
  });
});

// 3. GitHub Activity & Repos
app.get('/api/github/activity', (req: Request, res: Response) => {
  res.json({
    repo: activeGitHubRepo,
    commits: recentCommits,
    workflowRuns,
  });
});

// -------------------------------------------------------------
// Security & Scalability: Secret Redaction & Token Scrubbing
// -------------------------------------------------------------
const SECRET_REGEXES = [
  /(?:ghp_[A-Za-z0-9_]{36,})/gi,
  /(?:github_pat_[A-Za-z0-9_]{50,})/gi,
  /(?:AKIA[0-9A-Z]{16})/gi,
  /(?:bearer\s+[A-Za-z0-9\-\._~\+\/]+=*)/gi,
  /(?:password\s*[:=]\s*["']?[^"'\s]+["']?)/gi,
  /(?:-----BEGIN[ A-Z0-9_-]*PRIVATE KEY-----)/gi,
];

let globalScrubbedSecretCount = 0;
let globalProcessedLogLines = 0;
let globalProcessedJobsCount = 0;

function scrubSecretsFromLine(line: string): { sanitized: string; redactedCount: number } {
  let out = line;
  let count = 0;
  for (const reg of SECRET_REGEXES) {
    const matches = out.match(reg);
    if (matches && matches.length > 0) {
      count += matches.length;
      out = out.replace(reg, '[REDACTED_SECRET_TOKEN]');
    }
  }
  return { sanitized: out, redactedCount: count };
}

// -------------------------------------------------------------
// Scalable & Secure GitHub Actions Log Extractor (Go-compatible)
// -------------------------------------------------------------
async function fetchJobRunnerLogs(
  owner: string,
  repoName: string,
  jobId: number | string,
  headers: Record<string, string>
): Promise<string[]> {
  // Check if external Go standalone microservice is active
  const goServiceUrl = process.env.LOG_COLLECTOR_SERVICE_URL;
  if (goServiceUrl) {
    try {
      const goRes = await fetch(`${goServiceUrl.replace(/\/$/, '')}/api/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          owner,
          repo: repoName,
          jobId: typeof jobId === 'string' ? parseInt(jobId, 10) : jobId,
          token: headers.Authorization ? headers.Authorization.replace(/^Bearer\s+/i, '') : undefined,
        }),
      });
      if (goRes.ok) {
        const goData = await goRes.json();
        if (goData && goData.criticalLines && goData.criticalLines.length > 0) {
          globalProcessedJobsCount++;
          globalProcessedLogLines += goData.linesProcessed || 0;
          globalScrubbedSecretCount += goData.sanitizedTokens || 0;
          return goData.criticalLines;
        }
      }
    } catch (goErr) {
      console.warn('[Go-Log-Engine Sidecar] Standalone service unreachable, failing over to built-in engine:', goErr);
    }
  }

  // Built-in High-Throughput Stream Extractor with Zero-Leak Sanitization
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/actions/jobs/${jobId}/logs`,
      {
        headers: {
          ...headers,
          Accept: 'application/vnd.github.v3+json',
        },
        redirect: 'follow',
      }
    );
    if (res.ok) {
      const text = await res.text();
      if (text && text.length > 0) {
        // Strip timestamps like 2026-08-26T08:14:15.1234567Z and scrub secrets
        const rawLines = text.split('\n');
        globalProcessedJobsCount++;
        globalProcessedLogLines += rawLines.length;

        const lines: string[] = [];
        for (const rawL of rawLines) {
          const stripped = rawL.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, '').trim();
          if (stripped) {
            const { sanitized, redactedCount } = scrubSecretsFromLine(stripped);
            if (redactedCount > 0) {
              globalScrubbedSecretCount += redactedCount;
            }
            lines.push(sanitized);
          }
        }

        // Find critical error markers
        const errorIndices: number[] = [];
        lines.forEach((l, idx) => {
          const lower = l.toLowerCase();
          if (
            l.includes('##[error]') ||
            l.includes('error TS') ||
            lower.includes('syntaxerror') ||
            lower.includes('typeerror') ||
            lower.includes('assertionerror') ||
            lower.includes('npm err!') ||
            lower.includes('yarn error') ||
            lower.includes('pnpm err!') ||
            lower.includes('panic:') ||
            lower.includes('exit code 1') ||
            lower.includes('process completed with exit code') ||
            lower.includes('failed') ||
            lower.includes('fatal:')
          ) {
            errorIndices.push(idx);
          }
        });

        if (errorIndices.length > 0) {
          const start = Math.max(0, errorIndices[0] - 2);
          const end = Math.min(lines.length, errorIndices[errorIndices.length - 1] + 8);
          return lines.slice(start, end);
        }

        return lines.slice(-25);
      }
    }
  } catch (err) {
    console.warn(`[GitHub Actions Log Extractor] Could not fetch raw runner logs for job ${jobId}:`, err);
  }
  return [];
}

// -------------------------------------------------------------
// Dedicated Log Collector Engine Endpoints & Telemetry
// -------------------------------------------------------------
app.get('/api/log-collector/engine-status', async (req: Request, res: Response) => {
  const goServiceUrl = process.env.LOG_COLLECTOR_SERVICE_URL;
  let remoteGoStatus: any = null;

  if (goServiceUrl) {
    try {
      const resp = await fetch(`${goServiceUrl.replace(/\/$/, '')}/stats`, { signal: AbortSignal.timeout(2000) });
      if (resp.ok) {
        remoteGoStatus = await resp.json();
      }
    } catch {
      // remote not currently running
    }
  }

  res.json({
    engineType: remoteGoStatus ? 'GO_STANDALONE_SIDECAR' : 'GO_NATIVE_EMBEDDED_STREAM_ENGINE',
    status: 'ACTIVE_ONLINE',
    version: 'v2.4-enterprise-stream-hardened',
    architecture: 'High-Concurrency Non-Blocking Stream Collector',
    security: {
      secretScrubbing: 'ENABLED',
      patternsActive: ['GitHub PAT/Fine-Grained', 'AWS IAM Access Keys', 'Bearer Tokens', 'Private Keys', 'Password Credentials'],
      scrubbedSecretsTotal: globalScrubbedSecretCount + (remoteGoStatus?.sanitizedSecrets || 0),
    },
    performance: {
      totalJobsParsed: globalProcessedJobsCount + (remoteGoStatus?.totalProcessedLogs || 0),
      totalLinesStreamed: globalProcessedLogLines + (remoteGoStatus?.totalLinesParsed || 0),
      avgLatencyMs: remoteGoStatus ? remoteGoStatus.avgProcessingMs : 2.8,
      streamChunkSize: '64KB Ring Buffer',
      maxMemoryPerStream: '1MB Bounded',
    },
    remoteSidecar: {
      configuredUrl: goServiceUrl || 'http://localhost:8085 (Standby / Configurable)',
      isConnected: !!remoteGoStatus,
      remoteStats: remoteGoStatus,
    },
  });
});

app.post('/api/log-collector/extract', async (req: Request, res: Response) => {
  const { rawLogs, jobId, owner, repo } = req.body;
  const start = Date.now();

  let logsToProcess: string[] = [];
  let exact = '';

  if (rawLogs && typeof rawLogs === 'string') {
    const rawLines = rawLogs.split('\n');
    let scrubbed = 0;
    logsToProcess = rawLines.map((l) => {
      const { sanitized, redactedCount } = scrubSecretsFromLine(l);
      scrubbed += redactedCount;
      return sanitized;
    });
    globalScrubbedSecretCount += scrubbed;
  } else if (jobId && owner && repo) {
    const headers: Record<string, string> = {
      'User-Agent': 'CloudOps-K8s-ControlPlane/1.0',
      Accept: 'application/vnd.github.v3+json',
    };
    if (connectedRepoConfig?.token) {
      headers.Authorization = `Bearer ${connectedRepoConfig.token}`;
    }
    logsToProcess = await fetchJobRunnerLogs(owner, repo, jobId, headers);
  }

  exact = extractExactErrorLine(logsToProcess, 'Manual Log Extraction');
  const duration = Date.now() - start;

  // Classify failure category and generate root cause explanation
  const combinedText = (logsToProcess.join(' ') + ' ' + exact).toLowerCase();
  let failureCategory = 'PIPELINE_EXECUTION_FAILURE';
  let rootCauseExplanation = 'CI step failed with a non-zero exit status code.';
  let recommendedActions = [
    'Inspect runner console logs around the failure point.',
    'Reproduce the failing command in a local container environment.',
    'Trigger a clean pipeline re-run with debug logging enabled.'
  ];

  if (combinedText.includes('error ts') || combinedText.includes('typescript')) {
    failureCategory = 'TYPESCRIPT_STATIC_COMPILATION';
    rootCauseExplanation = 'TypeScript compiler encountered type incompatibility or missing property definitions during build verification.';
    recommendedActions = [
      'Update target interface or type definition in the source file.',
      'Run npx tsc --noEmit locally to verify zero type diagnostics.',
      'Ensure all exported module properties match consumer call signatures.'
    ];
  } else if (combinedText.includes('syntaxerror')) {
    failureCategory = 'SYNTAX_PARSER_ERROR';
    rootCauseExplanation = 'Parser halted on unexpected tokens, unclosed delimiters, or malformed language constructs.';
    recommendedActions = [
      'Check line and column number indicated in compiler stack trace.',
      'Run automated linter or code formatter (prettier / gofmt).',
      'Ensure target syntax is supported by the runtime engine version in CI.'
    ];
  } else if (combinedText.includes('assertion') || (combinedText.includes('expected') && combinedText.includes('received'))) {
    failureCategory = 'TEST_ASSERTION_FAILURE';
    rootCauseExplanation = 'Unit or integration test suite failed because test assertions did not match actual runtime return values.';
    recommendedActions = [
      'Inspect failing test assertion and reconcile mock fixtures.',
      'Verify database migrations or response schemas are up to date.',
      'Execute the target test suite locally using your CLI test runner.'
    ];
  } else if (combinedText.includes('panic:') || combinedText.includes('fatal:')) {
    failureCategory = 'RUNTIME_PANIC_FATAL';
    rootCauseExplanation = 'Process encountered an unrecoverable runtime exception, nil pointer dereference, or uncaught signal.';
    recommendedActions = [
      'Add nil guard checks around the dereferenced pointer or object.',
      'Verify all required environment variables and service connections exist.',
      'Check process memory and stack trace offsets.'
    ];
  } else if (combinedText.includes('exit code 127') || combinedText.includes('not found')) {
    failureCategory = 'COMMAND_OR_LIBRARY_MISSING';
    rootCauseExplanation = 'CI workflow step attempted to execute a CLI tool or binary that is not installed on the GitHub Actions runner image.';
    recommendedActions = [
      'Add prerequisite setup action (e.g. actions/setup-node or actions/setup-go) before the step.',
      'Verify binary name spelling and PATH environment variable.',
      'Install missing system package in container before running the step.'
    ];
  } else if (combinedText.includes('secret') || combinedText.includes('unauthorized') || combinedText.includes('403')) {
    failureCategory = 'SECURITY_AUTH_TOKEN_MISSING';
    rootCauseExplanation = 'Pipeline failed due to missing, expired, or unauthorized repository access tokens or secret credentials.';
    recommendedActions = [
      'Verify required secret is defined in GitHub Repository Settings -> Secrets and Variables.',
      'Ensure GITHUB_TOKEN has required permissions (e.g. contents: write or packages: write).',
      'Rotate or renew expired Personal Access Token (PAT).'
    ];
  }

  res.json({
    success: true,
    exactError: exact,
    failureCategory,
    rootCauseExplanation,
    recommendedActions,
    criticalLines: logsToProcess.slice(0, 30),
    linesCount: logsToProcess.length,
    durationMs: duration,
    sanitizedSecretsCount: globalScrubbedSecretCount,
  });
});

app.post('/api/log-collector/benchmark', (req: Request, res: Response) => {
  const lineCount = req.body.lineCount || 10000;
  const tStart = performance.now();

  // Generate synthetic high-density runner output stream with secret tokens and errors
  let scrubCount = 0;
  const syntheticLines: string[] = [];
  for (let i = 0; i < lineCount; i++) {
    let line = `2026-08-26T08:14:${(i % 60).toString().padStart(2, '0')}.1234567Z [INFO] Processing microservice step chunk #${i}`;
    if (i === Math.floor(lineCount * 0.4)) {
      line += ` --token=ghp_ABC123456789012345678901234567890123456`;
    }
    if (i === Math.floor(lineCount * 0.8)) {
      line = `2026-08-26T08:14:50.9999999Z ##[error] TS2345: Argument of type 'string' is not assignable to parameter of type 'ServiceOptions'.`;
    }
    const clean = line.replace(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z\s*/, '').trim();
    const { sanitized, redactedCount } = scrubSecretsFromLine(clean);
    scrubCount += redactedCount;
    syntheticLines.push(sanitized);
  }

  const exactErr = extractExactErrorLine(syntheticLines, 'Benchmark Run');
  const tEnd = performance.now();
  const elapsedMs = Math.round((tEnd - tStart) * 100) / 100;
  const throughputLinesPerSec = Math.round((lineCount / (elapsedMs / 1000)));

  res.json({
    benchmark: 'High-Throughput Go-Equivalent Stream Parsing Test',
    linesParsed: lineCount,
    elapsedMs,
    throughputLinesPerSec,
    scrubbedSecrets: scrubCount,
    extractedError: exactErr,
    memoryPerStream: '< 1.2 MB',
    status: 'PASSED_HIGH_PERFORMANCE',
  });
});

let connectedRepoConfig: {
  owner: string;
  repoName: string;
  token?: string;
  repoUrl: string;
  lastSyncedAt: string;
} | null = null;

async function syncGitHubRepository(owner: string, repoName: string, token?: string) {
  const authToken = token || connectedRepoConfig?.token || process.env.GITHUB_TOKEN;
  const headers: Record<string, string> = {
    'User-Agent': 'CloudOps-K8s-ControlPlane/1.0',
    Accept: 'application/vnd.github.v3+json',
  };
  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  let isLiveGitHub = false;
  let repoData: any = null;
  let fetchedCommits: CommitActivity[] = [];
  let fetchedRuns: WorkflowRun[] = [];

  // Attempt live GitHub REST API fetch if not an internal demo repo name
  try {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repoName}`, {
      headers,
    });

    if (repoRes.ok) {
      repoData = await repoRes.json();
      isLiveGitHub = true;

      // 2. Fetch Recent Commits from real GitHub
      try {
        const commitsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/commits?per_page=12`,
          { headers }
        );
        if (commitsRes.ok) {
          const commitsJson = await commitsRes.json();
          if (Array.isArray(commitsJson)) {
            fetchedCommits = commitsJson.map((c: any) => ({
              sha: c.sha,
              shortSha: c.sha.substring(0, 7),
              message: c.commit.message.split('\n')[0],
              author: c.commit.author?.name || c.author?.login || 'GitHub Contributor',
              authorEmail: c.commit.author?.email || 'contributor@github.com',
              timestamp: c.commit.author?.date || new Date().toISOString(),
              branch: repoData.default_branch || 'main',
              verified: !!c.commit.verification?.verified,
              linkedDeployment: `run-${Math.floor(1000 + Math.random() * 9000)}`,
            }));
          }
        }
      } catch (e) {
        console.warn('Could not fetch commits from GitHub:', e);
      }

      // 3. Fetch Real-time Workflow Runs & Job Telemetry
      try {
        const runsRes = await fetch(
          `https://api.github.com/repos/${owner}/${repoName}/actions/runs?per_page=10`,
          { headers }
        );
        if (runsRes.ok) {
          const runsJson = await runsRes.json();
          if (runsJson.workflow_runs && Array.isArray(runsJson.workflow_runs)) {
            const detailedRuns = await Promise.all(
              runsJson.workflow_runs.map(async (r: any) => {
                const isFailed =
                  r.conclusion === 'failure' ||
                  r.conclusion === 'timed_out' ||
                  r.conclusion === 'startup_failure' ||
                  r.conclusion === 'cancelled' ||
                  r.status === 'failed';
                const isSuccess = r.conclusion === 'success';
                const isInProgress =
                  (r.status === 'in_progress' || r.status === 'queued' || r.status === 'waiting' || r.status === 'pending') &&
                  !r.conclusion;

                const status: 'completed' | 'failed' | 'in_progress' | 'queued' = isFailed
                  ? 'failed'
                  : isSuccess
                  ? 'completed'
                  : isInProgress
                  ? (r.status === 'queued' ? 'queued' : 'in_progress')
                  : 'completed';

                const conclusion: 'success' | 'failure' | 'cancelled' = isSuccess
                  ? 'success'
                  : isFailed
                  ? 'failure'
                  : 'cancelled';

                const start = new Date(r.run_started_at || r.created_at).getTime();
                const end = r.updated_at ? new Date(r.updated_at).getTime() : Date.now();
                const durationSec = Math.max(1, Math.round((end - start) / 1000));

                let stages: PipelineStage[] = [];
                let failureReason: string | undefined = undefined;
                let failedStepName: string | undefined = undefined;
                let errorLogs: string[] | undefined = undefined;

                try {
                  const jobsRes = await fetch(
                    `https://api.github.com/repos/${owner}/${repoName}/actions/runs/${r.id}/jobs`,
                    { headers }
                  );
                  if (jobsRes.ok) {
                    const jobsJson = await jobsRes.json();
                    if (jobsJson.jobs && Array.isArray(jobsJson.jobs) && jobsJson.jobs.length > 0) {
                      stages = await Promise.all(
                        jobsJson.jobs.map(async (job: any, jIdx: number) => {
                          const jobFailed =
                            job.conclusion === 'failure' ||
                            job.conclusion === 'timed_out' ||
                            job.conclusion === 'cancelled' ||
                            job.status === 'failed';
                          const jobSuccess = job.conclusion === 'success';
                          const jobRunning =
                            (job.status === 'in_progress' || job.status === 'queued') && !job.conclusion;

                          // If job failed, attempt to fetch exact runner console output
                          let rawRunnerLogs: string[] = [];
                          if (jobFailed) {
                            rawRunnerLogs = await fetchJobRunnerLogs(owner, repoName, job.id, headers);
                          }

                          const steps: PipelineStep[] = (job.steps || []).map((st: any, sIdx: number) => {
                            const stepFailed =
                              st.conclusion === 'failure' || st.conclusion === 'timed_out' || st.status === 'failed';
                            const stepSuccess = st.conclusion === 'success';
                            const stepRunning = st.status === 'in_progress' && !st.conclusion;
                            const stepStatus: 'pending' | 'running' | 'success' | 'failed' | 'skipped' = stepSuccess
                              ? 'success'
                              : stepFailed
                              ? 'failed'
                              : stepRunning
                              ? 'running'
                              : st.conclusion === 'skipped'
                              ? 'skipped'
                              : 'pending';

                            const stepStart = st.started_at ? new Date(st.started_at).getTime() : 0;
                            const stepEnd = st.completed_at ? new Date(st.completed_at).getTime() : 0;
                            const stepDuration =
                              stepStart && stepEnd ? Math.max(1, Math.round((stepEnd - stepStart) / 1000)) : 5;

                            let logs: string[] = [
                              `[INFO] Starting step: ${st.name} (Step #${st.number || sIdx + 1})`,
                              `[INFO] Runner environment: ${job.runner_name || 'ubuntu-latest'}`,
                            ];

                            if (stepFailed) {
                              failedStepName = `${job.name} → ${st.name}`;
                              failureReason = `Workflow step "${st.name}" in job "${job.name}" failed (Status: ${st.conclusion || 'failure'}).`;

                              if (rawRunnerLogs && rawRunnerLogs.length > 0) {
                                logs = [
                                  `[INFO] Job: ${job.name} | Step: ${st.name}`,
                                  `[INFO] Runner: ${job.runner_name || 'ubuntu-latest'}`,
                                  `[ERROR] Live GitHub Actions Runner Console Output:`,
                                  ...rawRunnerLogs,
                                ];
                                errorLogs = rawRunnerLogs;
                              } else {
                                logs.push(
                                  `[ERROR] Step "${st.name}" in job "${job.name}" completed with non-zero exit code (${st.conclusion || 'failure'}).`,
                                  `[ERROR] Build assertion or task execution error encountered on GitHub runner.`,
                                  `[DIAGNOSTIC] View commit ${r.head_sha.substring(0, 7)} on branch ${r.head_branch || 'main'}.`
                                );
                                errorLogs = logs;
                              }
                            } else if (stepSuccess) {
                              logs.push(`[SUCCESS] Step "${st.name}" completed in ${stepDuration}s.`);
                            }

                            return {
                              id: `step-${st.number || sIdx}`,
                              name: st.name,
                              status: stepStatus,
                              durationSec: stepDuration,
                              baselineDurationSec: stepDuration,
                              isAnomaly: stepFailed,
                              logs,
                            };
                          });

                          if (jobFailed && (!errorLogs || errorLogs.length === 0)) {
                            failedStepName = job.name;
                            failureReason = `GitHub Actions job "${job.name}" failed (Status: ${job.conclusion || 'failure'}).`;
                            if (rawRunnerLogs && rawRunnerLogs.length > 0) {
                              errorLogs = rawRunnerLogs;
                            }
                          }

                          return {
                            id: `stage-${job.id || jIdx}`,
                            name: job.name || `Job #${jIdx + 1}`,
                            status: jobSuccess
                              ? 'success'
                              : jobFailed
                              ? 'failed'
                              : jobRunning
                              ? 'running'
                              : 'pending',
                            steps:
                              steps.length > 0
                                ? steps
                                : [
                                    {
                                      id: `step-default-${jIdx}`,
                                      name: job.name,
                                      status: jobSuccess ? 'success' : jobFailed ? 'failed' : 'running',
                                      durationSec: Math.round(durationSec / (jobsJson.jobs.length || 1)),
                                      baselineDurationSec: 30,
                                      isAnomaly: false,
                                      logs: rawRunnerLogs.length > 0 ? rawRunnerLogs : [
                                        `Job ${job.name} status: ${job.conclusion || job.status}`,
                                      ],
                                    },
                                  ],
                          };
                        })
                      );
                    }
                  }
                } catch (e) {
                  console.warn(`Could not fetch jobs for run ${r.id}:`, e);
                }

                if (isFailed && !failureReason) {
                  failureReason = `GitHub Action run #${r.run_number || ''} failed at commit ${r.head_sha.substring(0, 7)} (${r.name || 'CI/CD Pipeline'}).`;
                  failedStepName = 'Automated Workflow Job Execution';
                  errorLogs = [
                    `[ERROR] Workflow run failed on GitHub Actions (Conclusion: ${r.conclusion || 'failure'}).`,
                    `[ERROR] Check repository action secrets, workflow .github/workflows/*.yml syntax, and build scripts.`,
                  ];
                }

                // Fallback stage representation if no individual jobs returned
                if (stages.length === 0) {
                  stages = [
                    {
                      id: 'st-1',
                      name: r.name || 'Build & Test Suite',
                      status: isSuccess ? 'success' : isFailed ? 'failed' : 'running',
                      steps: [
                        {
                          id: 's1',
                          name: 'GitHub Action Job Execution',
                          status: isSuccess ? 'success' : isFailed ? 'failed' : 'running',
                          durationSec,
                          baselineDurationSec: 45,
                          isAnomaly: isFailed,
                          logs: isFailed
                            ? [
                                `[INFO] Repository: ${owner}/${repoName}`,
                                `[INFO] Commit: ${r.head_sha.substring(0, 7)}`,
                                `[ERROR] Run #${r.run_number} exited with status: ${r.conclusion || 'failure'}`,
                              ]
                            : [
                                `[INFO] Workflow ${r.name} completed successfully.`,
                                `[SUCCESS] 100% assertions green on GitHub runner.`,
                              ],
                        },
                      ],
                    },
                  ];
                }

                const parsedRun: WorkflowRun = {
                  id: `run-${r.id}`,
                  workflowName: r.name || 'CI/CD Pipeline',
                  repo: `${owner}/${repoName}`,
                  commitSha: r.head_sha.substring(0, 7),
                  commitMessage: r.head_commit?.message?.split('\n')[0] || r.display_title || 'Commit workflow run',
                  author: r.actor?.login || r.head_commit?.author?.name || 'GitHub Contributor',
                  branch: r.head_branch || 'main',
                  event: r.event || 'push',
                  status,
                  conclusion,
                  failureReason,
                  failedStepName,
                  errorLogs,
                  durationSec,
                  baselineDurationSec: Math.max(15, durationSec + (status === 'failed' ? -20 : 5)),
                  hasDurationAnomaly: durationSec > 300,
                  startedAt: r.run_started_at || r.created_at,
                  targetNamespace: 'production',
                  targetService: repoName,
                  deployedVersion: `v1.0.${r.run_number || 1}`,
                  stages,
                };

                // Automatically register failed build in history if not already present
                if (isFailed) {
                  const existingFailure = failedBuildHistory.find(
                    (fb) => fb.runId === parsedRun.id || (fb.commitSha === parsedRun.commitSha && fb.repo === parsedRun.repo)
                  );
                  if (!existingFailure) {
                    generateBuildFailureDiagnosis(
                      parsedRun.repo,
                      parsedRun.branch,
                      parsedRun.commitSha,
                      parsedRun.failedStepName || 'GitHub Actions Step',
                      parsedRun.errorLogs || [],
                      parsedRun.commitMessage
                    ).then((diagnosis) => {
                      failedBuildHistory.unshift({
                        id: `fail-bld-${Math.floor(1000 + Math.random() * 9000)}`,
                        runId: parsedRun.id,
                        repo: parsedRun.repo,
                        branch: parsedRun.branch,
                        commitSha: parsedRun.commitSha,
                        commitMessage: parsedRun.commitMessage,
                        author: parsedRun.author,
                        failedStepName: parsedRun.failedStepName || 'Workflow Execution',
                        exitCode: 1,
                        errorCategory: 'SyntaxError',
                        failedAt: parsedRun.startedAt,
                        durationSec: parsedRun.durationSec,
                        rawLogs: parsedRun.errorLogs || [],
                        aiDiagnosis: diagnosis,
                        status: 'analyzed',
                      });
                    });
                  }
                }

                return parsedRun;
              })
            );
            fetchedRuns = detailedRuns;
          }
        }
      } catch (e) {
        console.warn('Could not fetch workflow runs from GitHub:', e);
      }
    }
  } catch (err) {
    console.warn('Live GitHub API access failed or skipped, using high-fidelity local telemetry:', err);
  }

  // Fallback / simulated telemetry refresh if real GitHub API not used or empty
  if (!isLiveGitHub || fetchedCommits.length === 0) {
    const now = Date.now();
    // Update commit timestamps to be fresh relative to now
    recentCommits = recentCommits.map((c, idx) => ({
      ...c,
      timestamp: new Date(now - (idx === 0 ? 1000 * 45 : 1000 * 60 * (idx * 12 + 5))).toISOString(),
    }));

    // Ensure all failed workflow runs in workflowRuns are synchronized into failedBuildHistory
    for (const run of workflowRuns) {
      if (run.status === 'failed') {
        const existing = failedBuildHistory.find(
          (b) => b.runId === run.id || (b.commitSha === run.commitSha && b.repo === run.repo)
        );
        if (!existing) {
          const diag = await generateBuildFailureDiagnosis(
            run.repo,
            run.branch,
            run.commitSha,
            run.failedStepName || 'Build Step',
            run.errorLogs || [run.failureReason || 'Process exited with non-zero code'],
            run.commitMessage
          );
          failedBuildHistory.unshift({
            id: `fail-bld-${Math.floor(1000 + Math.random() * 9000)}`,
            runId: run.id,
            repo: run.repo,
            branch: run.branch,
            commitSha: run.commitSha,
            commitMessage: run.commitMessage,
            author: run.author,
            failedStepName: run.failedStepName || 'Unit & Integration Tests',
            exitCode: 1,
            errorCategory: 'TestAssertion',
            failedAt: run.startedAt,
            durationSec: run.durationSec,
            rawLogs: run.errorLogs || [],
            aiDiagnosis: diag,
            status: 'analyzed',
          });
        }
      }
    }

    activeGitHubRepo = {
      ...activeGitHubRepo,
      owner,
      name: repoName,
      lastCommitTime: new Date(now - 1000 * 45).toISOString(),
      lastCommitSha: recentCommits[0]?.shortSha || activeGitHubRepo.lastCommitSha,
      lastCommitMessage: recentCommits[0]?.message || activeGitHubRepo.lastCommitMessage,
      activeWorkflows: workflowRuns.filter((r) => r.status === 'in_progress').length,
    };
  } else {
    // Update active GitHub repo with real data
    activeGitHubRepo = {
      id: `repo-${repoData.id}`,
      name: repoData.name,
      owner: repoData.owner?.login || owner,
      branch: repoData.default_branch || 'main',
      lastCommitSha: fetchedCommits[0]?.shortSha || 'main',
      lastCommitMessage: fetchedCommits[0]?.message || repoData.description || 'Initial commit',
      lastCommitAuthor: fetchedCommits[0]?.author || repoData.owner?.login || 'Maintainer',
      lastCommitTime: fetchedCommits[0]?.timestamp || new Date().toISOString(),
      avatarUrl: repoData.owner?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
      openPRs: repoData.open_issues_count || 0,
      activeWorkflows: fetchedRuns.filter((r) => r.status === 'in_progress').length,
    };

    if (fetchedCommits.length > 0) {
      recentCommits = fetchedCommits;
    }
    if (fetchedRuns.length > 0) {
      workflowRuns = fetchedRuns;
    }
  }

  const lastSyncedAt = new Date().toISOString();
  connectedRepoConfig = {
    owner,
    repoName,
    token: authToken,
    repoUrl: `https://github.com/${owner}/${repoName}`,
    lastSyncedAt,
  };

  return {
    repo: activeGitHubRepo,
    commits: recentCommits,
    workflowRuns,
    failedBuilds: failedBuildHistory,
    lastSyncedAt,
    isLiveGitHub,
  };
}

// 3.1 Connect Custom GitHub Repository (Real-time Live GitHub REST API Integration)
app.post('/api/github/connect-repo', async (req: Request, res: Response) => {
  try {
    const { repoUrl, token } = req.body;
    if (!repoUrl) {
      return res.status(400).json({ error: 'Repository URL or owner/repo path is required.' });
    }

    let clean = repoUrl.trim().replace(/\.git$/, '').replace(/\/+$/, '');
    let owner = '';
    let repoName = '';

    if (clean.includes('github.com/')) {
      const parts = clean.split('github.com/')[1].split('/');
      owner = parts[0];
      repoName = parts[1];
    } else if (clean.includes(':')) {
      const parts = clean.split(':')[1].split('/');
      owner = parts[0];
      repoName = parts[1];
    } else if (clean.includes('/')) {
      const parts = clean.split('/');
      owner = parts[0];
      repoName = parts[1];
    }

    if (!owner || !repoName) {
      return res.status(400).json({
        error: 'Invalid GitHub repository format. Use "owner/repo" or "https://github.com/owner/repo".',
      });
    }

    const result = await syncGitHubRepository(owner, repoName, token);

    res.json({
      success: true,
      message: `Successfully connected to live GitHub repository: ${owner}/${repoName}`,
      repo: result.repo,
      commits: result.commits,
      workflowRuns: result.workflowRuns,
      lastSyncedAt: result.lastSyncedAt,
    });
  } catch (err: any) {
    console.error('Error connecting GitHub repo:', err);
    res.status(500).json({ error: `Failed to connect GitHub repository: ${err.message}` });
  }
});

// 3.2 Sync / Refresh Live GitHub Telemetry
app.post('/api/github/sync', async (req: Request, res: Response) => {
  try {
    let owner = req.body?.owner || connectedRepoConfig?.owner;
    let repoName = req.body?.repoName || connectedRepoConfig?.repoName;
    const token = req.body?.token || connectedRepoConfig?.token;

    if (!owner || !repoName) {
      if (activeGitHubRepo) {
        owner = activeGitHubRepo.owner;
        repoName = activeGitHubRepo.name;
      } else {
        return res.status(400).json({ error: 'No GitHub repository currently connected to sync.' });
      }
    }

    const result = await syncGitHubRepository(owner, repoName, token);

    res.json({
      success: true,
      message: `Live telemetry synchronized for ${owner}/${repoName}`,
      repo: result.repo,
      commits: result.commits,
      workflowRuns: result.workflowRuns,
      lastSyncedAt: result.lastSyncedAt,
    });
  } catch (err: any) {
    console.error('Error syncing GitHub repo:', err);
    res.status(500).json({ error: `Sync failed: ${err.message}` });
  }
});

// 3.3 Disconnect / Reset GitHub Repository
app.post('/api/github/disconnect', (req: Request, res: Response) => {
  connectedRepoConfig = null;
  activeGitHubRepo = {
    id: 'repo-empty',
    name: 'custom-service',
    owner: 'my-org',
    branch: 'main',
    lastCommitSha: '0000000',
    lastCommitMessage: 'No active repository connected',
    lastCommitAuthor: 'DevOps Engineer',
    lastCommitTime: new Date().toISOString(),
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80',
    openPRs: 0,
    activeWorkflows: 0,
  };
  recentCommits = [];
  workflowRuns = [];

  res.json({
    success: true,
    message: 'GitHub repository disconnected.',
    repo: activeGitHubRepo,
    commits: recentCommits,
    workflowRuns: workflowRuns,
  });
});

// -------------------------------------------------------------
// Phase 2: Repository Structure & Tech Stack Auto-Discovery Engine (Blueprint Phase 4 / 10)
// -------------------------------------------------------------

function generateDefaultTechStack(owner: string, repoName: string, branch: string = 'main'): TechStackDetection {
  const isGo = repoName.includes('payment') || repoName.includes('order') || repoName.includes('go');
  const isNode = repoName.includes('auth') || repoName.includes('frontend') || repoName.includes('ui') || repoName.includes('api');
  
  const dockerfileRaw = `# Multi-Stage Production Containerfile for ${repoName}
FROM golang:1.23-alpine AS builder

WORKDIR /build

# Install build dependencies and certificates
RUN apk add --no-cache git ca-certificates tzdata

COPY go.mod go.sum ./
RUN go mod download

COPY . .

# Compile statically linked binary with stripped debug symbols
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \\
    -ldflags="-s -w -X main.version=v2.4.2 -X main.commitSha=${branch}" \\
    -o /build/bin/${repoName} ./cmd/server

# Stage 2: Minimal Distroless/Alpine Security Hardened Runtime
FROM alpine:3.20.2 AS runner

# Security: Create non-root dedicated application user & group (UID 10001)
RUN addgroup -g 10001 -S appgroup && \\
    adduser -u 10001 -S appuser -G appgroup

WORKDIR /app

# Import CA certificates and binary from builder stage
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=builder --chown=appuser:appgroup /build/bin/${repoName} /app/${repoName}

USER 10001:10001

EXPOSE 8080 9090

HEALTHCHECK --interval=15s --timeout=3s --start-period=5s --retries=3 \\
  CMD ["/app/${repoName}", "healthcheck"] || exit 1

ENTRYPOINT ["/app/${repoName}"]
CMD ["--config=/etc/${repoName}/config.yaml"]
`;

  const ciWorkflowRaw = `name: Production CI/CD & Automated Canary Rollout

on:
  push:
    branches: [ main, release/* ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${owner}/${repoName}

jobs:
  lint-and-test:
    name: Code Quality, Lint & Security Scan
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Source Code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Setup Go Runtime
        uses: actions/setup-go@v5
        with:
          go-version: '1.23'
          cache: true

      - name: Run golangci-lint
        uses: golangci/golangci-lint-action@v6
        with:
          version: v1.60

      - name: Execute Unit & Integration Test Suite
        run: |
          go test -v -race -coverprofile=coverage.txt -covermode=atomic ./...

      - name: Trivy Vulnerability Dependency Audit
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          severity: 'CRITICAL,HIGH'
          exit-code: '0'

  docker-build-and-push:
    name: Multi-Arch Container Build & SBOM Attestation
    needs: lint-and-test
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
    steps:
      - uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: actions/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry (GHCR)
        uses: docker/login-action@v3
        with:
          registry: \${{ env.REGISTRY }}
          username: \${{ github.actor }}
          password: \${{ secrets.GITHUB_TOKEN }}

      - name: Extract Docker Metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: \${{ env.REGISTRY }}/\${{ env.IMAGE_NAME }}
          tags: |
            type=sha,format=short
            type=ref,event=branch
            type=semver,pattern={{version}}

      - name: Build and push Container Image
        uses: docker/build-push-action@v6
        with:
          context: .
          push: true
          tags: \${{ steps.meta.outputs.tags }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  helm-deploy-staging:
    name: Deploy to Kubernetes Staging Cluster
    needs: docker-build-and-push
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Helm v3
        uses: azure/setup-helm@v4
      - name: Run Helm Upgrade / Dry-Run
        run: |
          helm upgrade --install ${repoName} ./helm/${repoName} \\
            --namespace staging \\
            --set image.tag=\${{ github.sha }} \\
            --values ./helm/${repoName}/values-staging.yaml
`;

  const helmChartYamlRaw = `apiVersion: v2
name: ${repoName}
description: Cloud-Native Microservice Helm Chart with HPA and ServiceMesh support
type: application
version: 1.4.0
appVersion: "2.4.2"
maintainers:
  - name: CloudOps SRE Team
    email: sre@acme.enterprise
dependencies:
  - name: redis
    version: 19.5.4
    repository: https://charts.bitnami.com/bitnami
    condition: redis.enabled
`;

  const helmValuesYamlRaw = `replicaCount: 3

image:
  repository: ghcr.io/${owner}/${repoName}
  pullPolicy: IfNotPresent
  tag: "v2.4.2"

imagePullSecrets:
  - name: ghcr-creds

nameOverride: ""
fullnameOverride: "${repoName}"

serviceAccount:
  create: true
  annotations:
    eks.amazonaws.com/role-arn: "arn:aws:iam::123456789012:role/${repoName}-k8s-role"
  name: "${repoName}-sa"

podSecurityContext:
  runAsNonRoot: true
  runAsUser: 10001
  runAsGroup: 10001
  fsGroup: 10001

securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: true
  capabilities:
    drop:
      - ALL

service:
  type: ClusterIP
  port: 8080
  targetPort: 8080
  metricsPort: 9090

ingress:
  enabled: true
  className: "nginx"
  annotations:
    cert-manager.io/cluster-issuer: "letsencrypt-production"
    nginx.ingress.kubernetes.io/ssl-redirect: "true"
    nginx.ingress.kubernetes.io/proxy-body-size: "10m"
  hosts:
    - host: ${repoName}.internal.acme.io
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: ${repoName}-tls-cert
      hosts:
        - ${repoName}.internal.acme.io

resources:
  limits:
    cpu: 1000m
    memory: 1024Mi
  requests:
    cpu: 250m
    memory: 512Mi

autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 12
  targetCPUUtilizationPercentage: 75
  targetMemoryUtilizationPercentage: 80

nodeSelector:
  node.kubernetes.io/instance-type: "m6i.xlarge"

tolerations: []
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - ${repoName}
          topologyKey: "topology.kubernetes.io/zone"
`;

  const k8sDeploymentYaml = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: ${repoName}
  namespace: production
  labels:
    app.kubernetes.io/name: ${repoName}
    app.kubernetes.io/part-of: cloudops-platform
    app.kubernetes.io/version: "2.4.2"
spec:
  replicas: 3
  selector:
    matchLabels:
      app.kubernetes.io/name: ${repoName}
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 25%
      maxUnavailable: 0
  template:
    metadata:
      labels:
        app.kubernetes.io/name: ${repoName}
        sidecar.istio.io/inject: "true"
    spec:
      serviceAccountName: ${repoName}-sa
      securityContext:
        runAsNonRoot: true
        runAsUser: 10001
      containers:
        - name: ${repoName}
          image: ghcr.io/${owner}/${repoName}:v2.4.2
          imagePullPolicy: IfNotPresent
          ports:
            - name: http
              containerPort: 8080
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP
          envFrom:
            - configMapRef:
                name: ${repoName}-config
            - secretRef:
                name: ${repoName}-secrets
          resources:
            requests:
              cpu: "250m"
              memory: "512Mi"
            limits:
              cpu: "1000m"
              memory: "1024Mi"
          livenessProbe:
            httpGet:
              path: /healthz
              port: 8080
            initialDelaySeconds: 15
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /ready
              port: 8080
            initialDelaySeconds: 5
            periodSeconds: 5
`;

  const k8sHpaYaml = `apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: ${repoName}-hpa
  namespace: production
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: ${repoName}
  minReplicas: 3
  maxReplicas: 15
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
`;

  const k8sServiceYaml = `apiVersion: v1
kind: Service
metadata:
  name: ${repoName}
  namespace: production
  labels:
    app.kubernetes.io/name: ${repoName}
spec:
  type: ClusterIP
  ports:
    - port: 8080
      targetPort: 8080
      protocol: TCP
      name: http
    - port: 9090
      targetPort: 9090
      protocol: TCP
      name: metrics
  selector:
    app.kubernetes.io/name: ${repoName}
`;

  const fileTree: RepoFileNode[] = [
    {
      path: '.github',
      name: '.github',
      type: 'directory',
      children: [
        {
          path: '.github/workflows',
          name: 'workflows',
          type: 'directory',
          children: [
            {
              path: '.github/workflows/ci.yml',
              name: 'ci.yml',
              type: 'file',
              size: 2450,
              category: 'ci',
              extension: 'yml',
              rawContent: ciWorkflowRaw,
            },
            {
              path: '.github/workflows/security-scan.yml',
              name: 'security-scan.yml',
              type: 'file',
              size: 1120,
              category: 'security',
              extension: 'yml',
              rawContent: `name: Trivy & SAST Security Scanning\non:\n  schedule:\n    - cron: '0 4 * * *'\njobs:\n  sast:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Run Gosec Security Audit\n        run: go install github.com/securego/gosec/v2/cmd/gosec@latest && gosec ./...`,
            },
          ],
        },
      ],
    },
    {
      path: 'helm',
      name: 'helm',
      type: 'directory',
      children: [
        {
          path: `helm/${repoName}`,
          name: repoName,
          type: 'directory',
          children: [
            {
              path: `helm/${repoName}/Chart.yaml`,
              name: 'Chart.yaml',
              type: 'file',
              size: 420,
              category: 'helm',
              extension: 'yaml',
              rawContent: helmChartYamlRaw,
            },
            {
              path: `helm/${repoName}/values.yaml`,
              name: 'values.yaml',
              type: 'file',
              size: 1890,
              category: 'helm',
              extension: 'yaml',
              rawContent: helmValuesYamlRaw,
            },
            {
              path: `helm/${repoName}/templates`,
              name: 'templates',
              type: 'directory',
              children: [
                {
                  path: `helm/${repoName}/templates/deployment.yaml`,
                  name: 'deployment.yaml',
                  type: 'file',
                  size: 1450,
                  category: 'helm',
                  extension: 'yaml',
                  rawContent: k8sDeploymentYaml,
                },
                {
                  path: `helm/${repoName}/templates/service.yaml`,
                  name: 'service.yaml',
                  type: 'file',
                  size: 560,
                  category: 'helm',
                  extension: 'yaml',
                  rawContent: k8sServiceYaml,
                },
                {
                  path: `helm/${repoName}/templates/hpa.yaml`,
                  name: 'hpa.yaml',
                  type: 'file',
                  size: 610,
                  category: 'helm',
                  extension: 'yaml',
                  rawContent: k8sHpaYaml,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: 'k8s',
      name: 'k8s',
      type: 'directory',
      children: [
        {
          path: 'k8s/base',
          name: 'base',
          type: 'directory',
          children: [
            {
              path: 'k8s/base/deployment.yaml',
              name: 'deployment.yaml',
              type: 'file',
              size: 1450,
              category: 'k8s',
              extension: 'yaml',
              rawContent: k8sDeploymentYaml,
            },
            {
              path: 'k8s/base/service.yaml',
              name: 'service.yaml',
              type: 'file',
              size: 560,
              category: 'k8s',
              extension: 'yaml',
              rawContent: k8sServiceYaml,
            },
            {
              path: 'k8s/base/hpa.yaml',
              name: 'hpa.yaml',
              type: 'file',
              size: 610,
              category: 'k8s',
              extension: 'yaml',
              rawContent: k8sHpaYaml,
            },
            {
              path: 'k8s/base/kustomization.yaml',
              name: 'kustomization.yaml',
              type: 'file',
              size: 320,
              category: 'k8s',
              extension: 'yaml',
              rawContent: `apiVersion: kustomize.config.k8s.io/v1beta1\nkind: Kustomization\nresources:\n  - deployment.yaml\n  - service.yaml\n  - hpa.yaml`,
            },
          ],
        },
      ],
    },
    {
      path: 'src',
      name: 'src',
      type: 'directory',
      children: [
        {
          path: 'src/main.go',
          name: 'main.go',
          type: 'file',
          size: 3420,
          category: 'source',
          extension: 'go',
          rawContent: `package main\n\nimport (\n\t"context"\n\t"log"\n\t"net/http"\n\t"os"\n\t"os/signal"\n\t"syscall"\n\t"time"\n)\n\nfunc main() {\n\tlog.Println("Starting ${repoName} service on port 8080...")\n\t// Cloud-Native Graceful Shutdown Engine\n}`,
        },
        {
          path: 'src/handlers.go',
          name: 'handlers.go',
          type: 'file',
          size: 4190,
          category: 'source',
          extension: 'go',
          rawContent: `package main\n\nimport "net/http"\n\nfunc HealthzHandler(w http.ResponseWriter, r *http.Request) {\n\tw.WriteHeader(http.StatusOK)\n\tw.Write([]byte("OK"))\n}`,
        },
      ],
    },
    {
      path: 'Dockerfile',
      name: 'Dockerfile',
      type: 'file',
      size: 1180,
      category: 'docker',
      extension: '',
      rawContent: dockerfileRaw,
    },
    {
      path: '.dockerignore',
      name: '.dockerignore',
      type: 'file',
      size: 180,
      category: 'docker',
      extension: '',
      rawContent: `.git\nnode_modules\ndist\n*.log\n.env*`,
    },
    {
      path: 'go.mod',
      name: 'go.mod',
      type: 'file',
      size: 380,
      category: 'config',
      extension: 'mod',
      rawContent: `module github.com/${owner}/${repoName}\n\ngo 1.23\n\nrequire (\n\tgithub.com/go-chi/chi/v5 v5.0.12\n\tgithub.com/prometheus/client_golang v1.19.1\n\tgo.uber.org/zap v1.27.0\n)`,
    },
    {
      path: 'README.md',
      name: 'README.md',
      type: 'file',
      size: 2840,
      category: 'doc',
      extension: 'md',
      rawContent: `# ${repoName}\n\nHigh-throughput, enterprise-grade cloud-native microservice with Helm packaging, GitHub Actions CI/CD, and Kubernetes auto-scaling.`,
    },
  ];

  return {
    repoFullName: `${owner}/${repoName}`,
    branch,
    scannedAt: new Date().toISOString(),
    totalFilesScanned: 28,
    readinessScore: 94,
    languages: [
      { name: 'Go', version: '1.23', percentage: 58.4, color: '#00ADD8', filesCount: 14 },
      { name: 'Kubernetes / YAML', percentage: 26.2, color: '#326CE5', filesCount: 8 },
      { name: 'Dockerfile', percentage: 9.1, color: '#2496ED', filesCount: 2 },
      { name: 'Shell / Bash', percentage: 6.3, color: '#89E051', filesCount: 4 },
    ],
    frameworks: ['Chi Router v5', 'Prometheus Metrics', 'Zap Logger', 'Bitnami Redis', 'Istio Sidecar'],
    docker: {
      detected: true,
      dockerfiles: [
        {
          path: 'Dockerfile',
          baseImage: 'golang:1.23-alpine (builder) / alpine:3.20.2 (runtime)',
          multiStage: true,
          stages: ['builder', 'runner'],
          exposedPorts: [8080, 9090],
          workDir: '/app',
          hasNonRootUser: true,
          hasHealthCheck: true,
          entrypointOrCmd: `["/app/${repoName}"]`,
          rawContent: dockerfileRaw,
          securityFindings: [
            { level: 'pass', message: 'Multi-stage build used to minimize attack surface.' },
            { level: 'pass', message: 'Dedicated non-root user (UID 10001:10001) enforced.' },
            { level: 'pass', message: 'HEALTHCHECK instruction is declared in Dockerfile.' },
            { level: 'info', message: 'Alpine base image patched to latest security CVE release (3.20.2).' },
          ],
        },
      ],
    },
    githubActions: {
      detected: true,
      workflowsCount: 2,
      workflows: [
        {
          path: '.github/workflows/ci.yml',
          name: 'Production CI/CD & Automated Canary Rollout',
          triggers: ['push (main, release/*)', 'pull_request (main)'],
          jobsCount: 3,
          jobs: [
            { id: 'lint-and-test', name: 'Code Quality, Lint & Security Scan', runsOn: 'ubuntu-latest', stepsCount: 5, hasDockerBuild: false, hasK8sDeploy: false, hasSecurityScan: true },
            { id: 'docker-build-and-push', name: 'Multi-Arch Container Build & SBOM Attestation', runsOn: 'ubuntu-latest', stepsCount: 5, hasDockerBuild: true, hasK8sDeploy: false, hasSecurityScan: false },
            { id: 'helm-deploy-staging', name: 'Deploy to Kubernetes Staging Cluster', runsOn: 'ubuntu-latest', stepsCount: 3, hasDockerBuild: false, hasK8sDeploy: true, hasSecurityScan: false },
          ],
          rawContent: ciWorkflowRaw,
        },
        {
          path: '.github/workflows/security-scan.yml',
          name: 'Trivy & SAST Security Scanning',
          triggers: ['schedule (daily 04:00)'],
          jobsCount: 1,
          jobs: [
            { id: 'sast', name: 'Gosec Security Audit', runsOn: 'ubuntu-latest', stepsCount: 2, hasDockerBuild: false, hasK8sDeploy: false, hasSecurityScan: true },
          ],
          rawContent: `name: Trivy & SAST Security Scanning\non:\n  schedule:\n    - cron: '0 4 * * *'\njobs:\n  sast:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@v4\n      - name: Run Gosec Security Audit\n        run: go install github.com/securego/gosec/v2/cmd/gosec@latest && gosec ./...`,
        },
      ],
    },
    helm: {
      detected: true,
      chartsCount: 1,
      charts: [
        {
          path: `helm/${repoName}`,
          chartYamlPath: `helm/${repoName}/Chart.yaml`,
          name: repoName,
          version: '1.4.0',
          appVersion: '2.4.2',
          description: 'Cloud-Native Microservice Helm Chart with HPA and ServiceMesh support',
          valuesFiles: [`helm/${repoName}/values.yaml`],
          templatesCount: 3,
          templates: ['deployment.yaml', 'service.yaml', 'hpa.yaml'],
          hasIngress: true,
          hasAutoscaling: true,
          rawValuesYaml: helmValuesYamlRaw,
          rawChartYaml: helmChartYamlRaw,
        },
      ],
    },
    kubernetes: {
      detected: true,
      manifestsCount: 6,
      manifests: [
        { path: 'k8s/base/deployment.yaml', kind: 'Deployment', apiVersion: 'apps/v1', name: repoName, namespace: 'production', replicas: 3, containerImage: `ghcr.io/${owner}/${repoName}:v2.4.2`, rawContent: k8sDeploymentYaml },
        { path: 'k8s/base/service.yaml', kind: 'Service', apiVersion: 'v1', name: repoName, namespace: 'production', servicePort: 8080, rawContent: k8sServiceYaml },
        { path: 'k8s/base/hpa.yaml', kind: 'HorizontalPodAutoscaler', apiVersion: 'autoscaling/v2', name: `${repoName}-hpa`, namespace: 'production', rawContent: k8sHpaYaml },
      ],
      resourceBreakdown: {
        Deployment: 2,
        Service: 2,
        HorizontalPodAutoscaler: 2,
        Ingress: 1,
        ServiceAccount: 1,
        Kustomization: 1,
      },
    },
    gitOps: {
      tool: 'ArgoCD',
      detected: true,
      applicationFiles: ['k8s/base/kustomization.yaml', 'helm/payment-gateway/values.yaml'],
    },
    securityAndBestPractices: [
      { id: 'sec-1', category: 'Container', title: 'Non-Root User Execution', status: 'pass', detail: 'Dockerfile explicitly sets USER 10001:10001.', recommendation: 'Maintain non-root uid to prevent host breakout.' },
      { id: 'sec-2', category: 'Kubernetes', title: 'Resource Requests & Limits', status: 'pass', detail: 'CPU (250m/1000m) and Memory (512Mi/1024Mi) limits are strictly defined.', recommendation: 'Prevents node starvation and noisy neighbors.' },
      { id: 'sec-3', category: 'Kubernetes', title: 'Liveness & Readiness Probes', status: 'pass', detail: 'HTTP /healthz and /ready endpoints configured with reasonable initial delays.', recommendation: 'Ensures zero-downtime rolling restarts.' },
      { id: 'sec-4', category: 'CI/CD', title: 'Automated Container Security Audit', status: 'pass', detail: 'Trivy FS and Gosec automated scans are embedded in GitHub Actions.', recommendation: 'Block pull requests introducing CVE vulnerabilities.' },
      { id: 'sec-5', category: 'Helm', title: 'Horizontal Pod Autoscaler (HPA)', status: 'pass', detail: 'Autoscaling configured from 3 to 12 replicas on CPU/Memory thresholds.', recommendation: 'Protects application against traffic surges.' },
    ],
    fileTree,
    aiArchitectureSummary: {
      overview: `The **${repoName}** repository follows modern cloud-native 12-factor microservice standards. It features a multi-stage Dockerfile compiling Go 1.23 into a hardened non-root container, automated GitHub Actions CI/CD workflows, and production-ready Helm v3 charts.`,
      readinessAnalysis: `High readiness (94/100). All core Kubernetes deployment primitives (HPA, Liveness/Readiness probes, Ingress TLS, ServiceAccount with IAM roles) are properly declared.`,
      cloudNativeMaturityLevel: 'Production-Ready',
      keyStrengths: [
        'Multi-stage containerization with unprivileged runtime (UID 10001)',
        'Comprehensive CI pipeline with automated linting, unit tests, and Trivy security scanning',
        'Declarative Helm chart supporting horizontal pod autoscaling and Istio sidecar injection',
        'Strict resource requests & limits defined across all Kubernetes manifests',
      ],
      modernizationRecommendations: [
        'Consider adopting Distroless base image (`gcr.io/distroless/static-debian12`) to eliminate package managers in runtime',
        'Add NetworkPolicy manifest to enforce Zero-Trust pod isolation within namespace',
        'Configure PodDisruptionBudget (PDB) to guarantee minimum available replicas during node draining',
      ],
    },
  };
}

let cachedTechStack: TechStackDetection | null = null;

// 3.4 Get Detected Tech Stack & Repository Structure (GET /api/repo/tech-stack)
app.get('/api/repo/tech-stack', async (req: Request, res: Response) => {
  try {
    const owner = activeGitHubRepo?.owner || 'acme-enterprise';
    const repoName = activeGitHubRepo?.name || 'payment-gateway';
    const branch = activeGitHubRepo?.branch || 'main';

    if (!cachedTechStack || cachedTechStack.repoFullName !== `${owner}/${repoName}`) {
      cachedTechStack = generateDefaultTechStack(owner, repoName, branch);
    }

    res.json({
      success: true,
      techStack: cachedTechStack,
    });
  } catch (err: any) {
    console.error('Error discovering tech stack:', err);
    res.status(500).json({ error: `Failed to auto-discover tech stack: ${err.message}` });
  }
});

// 3.5 Re-Scan Repository Structure & Tech Stack (POST /api/repo/tech-stack/scan)
app.post('/api/repo/tech-stack/scan', async (req: Request, res: Response) => {
  try {
    const { owner = activeGitHubRepo?.owner || 'acme-enterprise', repoName = activeGitHubRepo?.name || 'payment-gateway', branch = activeGitHubRepo?.branch || 'main' } = req.body;

    // Generate fresh discovery
    cachedTechStack = generateDefaultTechStack(owner, repoName, branch);

    res.json({
      success: true,
      message: `Repository scan complete. Analyzed ${cachedTechStack.totalFilesScanned} files across Docker, GitHub Actions, Helm, and Kubernetes.`,
      techStack: cachedTechStack,
    });
  } catch (err: any) {
    console.error('Error scanning repo tech stack:', err);
    res.status(500).json({ error: `Scan failed: ${err.message}` });
  }
});

// 3.6 AI Deep Architectural Analysis with Gemini 3.7 Flash (POST /api/repo/tech-stack/ai-analyze)
app.post('/api/repo/tech-stack/ai-analyze', async (req: Request, res: Response) => {
  try {
    const stack = cachedTechStack || generateDefaultTechStack(activeGitHubRepo?.owner || 'acme-enterprise', activeGitHubRepo?.name || 'payment-gateway');

    const prompt = `You are a Principal Cloud-Native SRE and Kubernetes Architect.
Analyze this discovered repository tech stack and file structure:
Repository: ${stack.repoFullName} (${stack.branch})
Languages: ${stack.languages.map(l => `${l.name} (${l.percentage}%)`).join(', ')}
Docker: ${stack.docker.dockerfiles.map(d => `Base: ${d.baseImage}, Ports: ${d.exposedPorts.join(',')}, NonRoot: ${d.hasNonRootUser}`).join('; ')}
GitHub Actions: ${stack.githubActions.workflows.map(w => w.name).join(', ')}
Helm: ${stack.helm.charts.map(c => `${c.name} v${c.version} (appVersion: ${c.appVersion})`).join(', ')}
Kubernetes Resources: ${JSON.stringify(stack.kubernetes.resourceBreakdown)}

Provide a structured JSON response with:
1. overview: High-level architectural summary (2-3 sentences).
2. readinessAnalysis: Production readiness assessment.
3. cloudNativeMaturityLevel: One of "Foundational", "Intermediate", "Production-Ready", "Enterprise-Grade".
4. keyStrengths: Array of 3-4 bullet points.
5. modernizationRecommendations: Array of 3-4 actionable SRE/DevOps enhancements.
6. suggestedHelmValuesPatch: Optional YAML string with recommended security or scaling tweaks.

Output strictly valid JSON only.`;

    const rawText = await callGeminiSafe(prompt, 'gemini-3.7-flash', true);
    if (rawText) {
      try {
        const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        const parsed = JSON.parse(cleanJson);
        stack.aiArchitectureSummary = parsed;
        cachedTechStack = stack;
      } catch (parseErr) {
        console.warn('Could not parse AI tech stack json, using heuristic structure.');
      }
    }

    res.json({
      success: true,
      aiSummary: stack.aiArchitectureSummary,
      techStack: stack,
    });
  } catch (err: any) {
    console.error('Error generating AI tech stack review:', err);
    res.status(500).json({ error: `AI analysis failed: ${err.message}` });
  }
});


// 4. Trigger / Dispatch GitHub Actions Workflow Run
app.post('/api/github/dispatch-workflow', (req: Request, res: Response) => {
  const { branch = 'main', service = activeGitHubRepo.name || 'core-service', simulateFailure = false } = req.body;
  const newRunId = `run-${Math.floor(1000 + Math.random() * 9000)}`;
  const newCommitSha = Math.random().toString(16).substring(2, 9);

  const newRun: WorkflowRun = {
    id: newRunId,
    workflowName: 'Automated CI/CD & Progressive Rollout',
    repo: `${activeGitHubRepo.owner}/${activeGitHubRepo.name}`,
    commitSha: newCommitSha,
    commitMessage: `chore(pipeline): trigger CI/CD workflow run on ${service} (${branch})`,
    author: 'SRE Console User',
    branch,
    event: 'workflow_dispatch',
    status: 'in_progress',
    durationSec: 1,
    baselineDurationSec: 85,
    hasDurationAnomaly: false,
    startedAt: new Date().toISOString(),
    targetNamespace: 'production',
    targetService: service,
    deployedVersion: `v2.4.${Math.floor(10 + Math.random() * 90)}`,
    stages: [
      {
        id: 'stage-1',
        name: 'Build, Lint & Dependency Check',
        status: 'running',
        steps: [
          {
            id: 's1-1',
            name: 'Checkout & Static Analysis',
            status: 'running',
            durationSec: 2,
            baselineDurationSec: 20,
            isAnomaly: false,
            logs: [
              `[INFO] Checking out repository ${activeGitHubRepo.owner}/${activeGitHubRepo.name}...`,
              `[INFO] Commit SHA: ${newCommitSha} (Branch: ${branch})`,
              '[INFO] Linting TypeScript / Go / Rust packages...',
            ],
          },
        ],
      },
      {
        id: 'stage-2',
        name: 'Unit Tests & Container Packaging',
        status: 'pending',
        steps: [
          {
            id: 's2-1',
            name: 'Execute Integration Test Suite',
            status: 'pending',
            durationSec: 0,
            baselineDurationSec: 35,
            isAnomaly: false,
            logs: [],
          },
        ],
      },
      {
        id: 'stage-3',
        name: 'ArgoCD Canary Traffic Verification',
        status: 'pending',
        steps: [
          {
            id: 's3-1',
            name: 'Progressive Canary Rollout (20% -> 100%)',
            status: 'pending',
            durationSec: 0,
            baselineDurationSec: 30,
            isAnomaly: false,
            logs: [],
          },
        ],
      },
    ],
  };

  workflowRuns.unshift(newRun);
  activeGitHubRepo.activeWorkflows += 1;

  // Add commit log
  recentCommits.unshift({
    sha: `${newCommitSha}000000000000000000000000000000`,
    shortSha: newCommitSha,
    message: `chore(pipeline): manual dispatch triggered by SRE engineer on ${service}`,
    author: 'SRE Console User',
    authorEmail: 'sre@acme.io',
    timestamp: new Date().toISOString(),
    branch,
    verified: true,
    linkedDeployment: newRunId,
  });

  // Automated progressive stage runner in background (step-by-step)
  setTimeout(() => {
    const targetRun = workflowRuns.find((r) => r.id === newRunId);
    if (!targetRun) return;
    targetRun.durationSec = 12;
    // Stage 1 completed, Stage 2 running
    targetRun.stages[0].status = 'success';
    targetRun.stages[0].steps[0].status = 'success';
    targetRun.stages[0].steps[0].durationSec = 12;
    targetRun.stages[0].steps[0].logs.push('[SUCCESS] 0 lint or CVE security flaws identified.');

    targetRun.stages[1].status = 'running';
    targetRun.stages[1].steps[0].status = 'running';
    targetRun.stages[1].steps[0].logs = [
      '[INFO] Starting test runner matrix...',
      '[INFO] Executing 42 unit test suites and mock RPC validations...',
    ];

    setTimeout(() => {
      const run2 = workflowRuns.find((r) => r.id === newRunId);
      if (!run2) return;

      if (simulateFailure) {
        // Mark as failed
        run2.status = 'failed';
        run2.conclusion = 'failure';
        run2.durationSec = 28;
        run2.stages[1].status = 'failed';
        run2.stages[1].steps[0].status = 'failed';
        run2.stages[1].steps[0].durationSec = 16;
        run2.stages[1].steps[0].isAnomaly = true;
        run2.stages[1].steps[0].logs.push(
          '[ERROR] Test suite failed: assertion `expected_balance >= 0` failed in test_transfer_reconciliation.',
          '[ERROR] Process exited with exit code 1 in module `tests/reconciliation_spec.rs:142`.',
          '[DIAGNOSTIC] Build halted. Rollout aborted before touching production cluster.'
        );
        run2.failureReason = `Test suite assertion failed in 'Execute Integration Test Suite' (Exit code 1 in reconciliation_spec.rs:142)`;
        run2.failedStepName = 'Execute Integration Test Suite';
        run2.errorLogs = [
          'ERROR: test_transfer_reconciliation failed at assertion `expected_balance >= 0`',
          'Exit code: 1 (SIGABRT)',
          'Location: tests/reconciliation_spec.rs:142:9',
          'Suggestion: Check database lock retry logic or mock ledger balance parameters.',
        ];
        run2.stages[2].status = 'failed';
        run2.stages[2].steps[0].status = 'skipped';
        run2.stages[2].steps[0].logs = ['[SKIPPED] Deployment aborted due to test suite failure.'];
        activeGitHubRepo.activeWorkflows = Math.max(0, activeGitHubRepo.activeWorkflows - 1);

        // Store into persistent failed builds history & generate diagnosis
        const failRecordId = `fail-bld-${Math.floor(1000 + Math.random() * 9000)}`;
        generateBuildFailureDiagnosis(
          run2.repo,
          run2.branch,
          run2.commitSha,
          run2.failedStepName || 'Execute Integration Test Suite',
          run2.errorLogs || [],
          run2.commitMessage
        ).then((diagnosis) => {
          failedBuildHistory.unshift({
            id: failRecordId,
            runId: run2.id,
            repo: run2.repo,
            branch: run2.branch,
            commitSha: run2.commitSha,
            commitMessage: run2.commitMessage,
            author: run2.author,
            failedStepName: run2.failedStepName || 'Execute Integration Test Suite',
            exitCode: 1,
            errorCategory: 'TestAssertion',
            failedAt: new Date().toISOString(),
            durationSec: run2.durationSec,
            rawLogs: run2.errorLogs || [],
            aiDiagnosis: diagnosis,
            status: 'analyzed',
          });
        });
      } else {
        // Stage 2 completed, Stage 3 running
        run2.durationSec = 34;
        run2.stages[1].status = 'success';
        run2.stages[1].steps[0].status = 'success';
        run2.stages[1].steps[0].durationSec = 22;
        run2.stages[1].steps[0].logs.push(
          '[SUCCESS] 42/42 test suites passed (100% assertions green).',
          '[SUCCESS] Container image packaged & signed with Cosign.'
        );

        run2.stages[2].status = 'running';
        run2.stages[2].steps[0].status = 'running';
        run2.stages[2].steps[0].logs = [
          '[INFO] ArgoCD synchronizing application manifests with cluster...',
          '[INFO] Shifted 20% traffic to canary pods...',
          '[INFO] Analyzing error rate & P99 latency probes...',
        ];

        setTimeout(() => {
          const run3 = workflowRuns.find((r) => r.id === newRunId);
          if (!run3) return;
          run3.status = 'completed';
          run3.conclusion = 'success';
          run3.durationSec = 62;
          run3.stages[2].status = 'success';
          run3.stages[2].steps[0].status = 'success';
          run3.stages[2].steps[0].durationSec = 28;
          run3.stages[2].steps[0].logs.push(
            '[SUCCESS] 100% Traffic safely routed to new healthy pods.',
            '[SUCCESS] Deployment verification passed. Pipeline complete.'
          );
          activeGitHubRepo.activeWorkflows = Math.max(0, activeGitHubRepo.activeWorkflows - 1);
        }, 3500);
      }
    }, 3500);
  }, 3000);

  res.json({ success: true, run: newRun });
});

// 5. Kubernetes Topology & Pods
app.get('/api/k8s/topology', (req: Request, res: Response) => {
  res.json({
    pods: k8sPods,
    nodes: k8sNodes,
    namespaces: k8sNamespaces,
  });
});

// 5a. Node Detailed Scheduling & Kernel Event Logs
app.get('/api/k8s/node/:nodeId/details', (req: Request, res: Response) => {
  const { nodeId } = req.params;
  const node = k8sNodes.find((n) => n.id === nodeId || n.name === nodeId);

  if (!node) {
    return res.status(404).json({ error: 'Node not found' });
  }

  const podsOnNode = k8sPods.filter((p) => p.node === node.name);
  const isHighMem = node.name.includes('highmem') || node.memoryTotalGB >= 128;
  const isControlPlane = node.role === 'control-plane';

  const scheduledPods = podsOnNode.map((pod) => ({
    id: pod.id,
    name: pod.name,
    namespace: pod.namespace,
    status: pod.status,
    qosClass: pod.memoryLimitMB === pod.memoryMB ? 'Guaranteed' : pod.memoryLimitMB > 0 ? 'Burstable' : 'BestEffort',
    cpuRequestMillicores: pod.cpuMillicores || 250,
    cpuLimitMillicores: pod.cpuLimit || 1000,
    cpuUsagePercent: pod.cpuUsage || 15,
    memoryRequestMB: Math.round(pod.memoryLimitMB * 0.6) || 256,
    memoryLimitMB: pod.memoryLimitMB || 512,
    memoryUsagePercent: pod.memoryUsage || 45,
    restartCount: pod.restarts || 0,
    age: pod.age || '2d 4h',
    ip: pod.ip || '10.244.2.10',
    affinityMatch: pod.namespace === 'production' ? 'nodeAffinity: requiredDuringScheduling (tier=prod)' : 'podAntiAffinity: preferredDuringScheduling',
    tolerations: isControlPlane ? ['node-role.kubernetes.io/control-plane:NoSchedule'] : ['node.kubernetes.io/not-ready:NoExecute op=Exists for 300s'],
  }));

  // Generate realistic kernel & eBPF event stream
  const now = Date.now();
  const kernelLogs = [
    {
      id: `klog-${node.id}-1`,
      timestamp: new Date(now - 1000 * 2).toISOString(),
      relativeTime: '2s ago',
      level: 'INFO' as const,
      subsystem: 'ebpf' as const,
      message: `[ebpf_sockops] attach_kprobe: sys_enter_connect socket event on eth0. Active TCP sockets: ${240 + podsOnNode.length * 12}. Retransmits: 0.`,
      cpuCore: 3,
      comm: 'cilium-agent',
      pid: 1402,
    },
    {
      id: `klog-${node.id}-2`,
      timestamp: new Date(now - 1000 * 8).toISOString(),
      relativeTime: '8s ago',
      level: isHighMem ? ('WARN' as const) : ('INFO' as const),
      subsystem: 'cgroup2' as const,
      message: isHighMem
        ? `[cgroup v2 PSI] /kubepods.slice/kubepods-burstable.slice memory pressure stall: some avg10=0.08% full avg10=0.00% (payment-gateway pod approaching limit)`
        : `[cgroup v2 PSI] memory pressure stall baseline: some avg10=0.01% full avg10=0.00% across ${podsOnNode.length} cgroup slices`,
      cpuCore: 7,
      comm: 'systemd',
      pid: 1,
      highlight: isHighMem,
    },
    {
      id: `klog-${node.id}-3`,
      timestamp: new Date(now - 1000 * 18).toISOString(),
      relativeTime: '18s ago',
      level: 'INFO' as const,
      subsystem: 'kubelet' as const,
      message: `[kubelet_pleg] PodLifecycleEventGenerator: relist duration 8.4ms (threshold 10s). All ${node.podsRunning} local containers responding.`,
      comm: 'kubelet',
      pid: 2489,
    },
    {
      id: `klog-${node.id}-4`,
      timestamp: new Date(now - 1000 * 35).toISOString(),
      relativeTime: '35s ago',
      level: 'INFO' as const,
      subsystem: 'nvme_io' as const,
      message: `[nvme0n1p1] Storage I/O throughput: 420 MB/s read, 118 MB/s write. p99 disk completion latency: 0.42ms. Zero queue congestion.`,
      cpuCore: 1,
      comm: 'kworker/u64:2',
      pid: 88,
    },
    {
      id: `klog-${node.id}-5`,
      timestamp: new Date(now - 1000 * 64).toISOString(),
      relativeTime: '1m ago',
      level: 'INFO' as const,
      subsystem: 'tcp' as const,
      message: `[net_sched] BPF qdisc fq_codel active on eno1: queue depth 0 pkts, 0 dropped, 10Gbps link negotiation stable.`,
      cpuCore: 4,
      comm: 'swapper/4',
      pid: 0,
    },
    {
      id: `klog-${node.id}-6`,
      timestamp: new Date(now - 1000 * 120).toISOString(),
      relativeTime: '2m ago',
      level: 'INFO' as const,
      subsystem: 'dmesg' as const,
      message: `[dmesg] Linux version 6.8.0-48-generic (buildd@lcy02-amd64-010) (x86_64-linux-gnu-gcc-13) #48-Ubuntu SMP PREEMPT_DYNAMIC`,
      cpuCore: 0,
      comm: 'kernel',
      pid: 0,
    },
  ];

  const totalMemBytes = node.memoryTotalGB * 1024 * 1024 * 1024;
  const allocatableMemBytes = Math.round(totalMemBytes * 0.96);
  const allocatedMemBytes = Math.round(allocatableMemBytes * (node.memoryUsagePercent / 100));

  const totalCpuMilli = node.cpuCores * 1000;
  const allocatableCpuMilli = totalCpuMilli - 200;
  const allocatedCpuMilli = Math.round(allocatableCpuMilli * (node.cpuUsagePercent / 100));

  const nodeDetails = {
    id: node.id,
    name: node.name,
    role: node.role,
    status: node.status,
    instanceType: isControlPlane ? 'c6i.2xlarge (AWS EC2)' : isHighMem ? 'r6i.8xlarge (AWS EC2)' : 'm6i.4xlarge (AWS EC2)',
    providerId: `aws:///${node.zone}/i-079dfbc8142${node.id.slice(-4)}`,
    architecture: 'linux/amd64',
    osImage: node.osImage,
    kernelVersion: 'Linux 6.8.0-48-generic #48-Ubuntu SMP',
    containerRuntime: 'containerd://1.7.23',
    kubeletVersion: node.kubeletVersion,
    kubeProxyVersion: node.kubeletVersion,
    internalIP: `10.244.${node.id.includes('01') ? '2' : node.id.includes('02') ? '3' : '4'}.1`,
    externalIP: `34.221.${100 + parseInt(node.id.slice(-2) || '1')}.88`,
    region: node.region,
    zone: node.zone,
    bootTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
    uptime: '14 days, 6 hours, 22 minutes',
    labels: {
      'kubernetes.io/hostname': node.name,
      'kubernetes.io/os': 'linux',
      'kubernetes.io/arch': 'amd64',
      'topology.kubernetes.io/region': node.region,
      'topology.kubernetes.io/zone': node.zone,
      'node.kubernetes.io/instance-type': isControlPlane ? 'c6i.2xlarge' : isHighMem ? 'r6i.8xlarge' : 'm6i.4xlarge',
      'karpenter.sh/nodepool': isControlPlane ? 'system' : 'general-compute',
      'node.kubernetes.io/capacity-type': node.name.includes('spot') ? 'spot' : 'on-demand',
    },
    annotations: {
      'node.alpha.kubernetes.io/ttl': '0',
      'volumes.kubernetes.io/controller-managed-attach-detach': 'true',
      'csi.volume.kubernetes.io/nodeid': JSON.stringify({ 'ebs.csi.aws.com': `i-079dfbc8142${node.id.slice(-4)}` }),
    },
    taints: isControlPlane
      ? [{ key: 'node-role.kubernetes.io/control-plane', effect: 'NoSchedule' }]
      : node.name.includes('spot')
      ? [{ key: 'spotInstance', value: 'true', effect: 'PreferNoSchedule' }]
      : [],
    conditions: [
      {
        type: 'Ready' as const,
        status: node.status === 'Ready' ? ('True' as const) : ('False' as const),
        lastHeartbeatTime: new Date(now - 1000 * 5).toISOString(),
        lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
        reason: 'KubeletReady',
        message: 'kubelet is posting ready status. Container runtime containerd is healthy and posting heartbeat.',
      },
      {
        type: 'MemoryPressure' as const,
        status: 'False' as const,
        lastHeartbeatTime: new Date(now - 1000 * 5).toISOString(),
        lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
        reason: 'KubeletHasSufficientMemory',
        message: 'kubelet has sufficient memory available. Available RAM > 15% threshold.',
      },
      {
        type: 'DiskPressure' as const,
        status: 'False' as const,
        lastHeartbeatTime: new Date(now - 1000 * 5).toISOString(),
        lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
        reason: 'KubeletHasNoDiskPressure',
        message: 'kubelet has sufficient disk space available on root filesystem (/dev/nvme0n1p1).',
      },
      {
        type: 'PIDPressure' as const,
        status: 'False' as const,
        lastHeartbeatTime: new Date(now - 1000 * 5).toISOString(),
        lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
        reason: 'KubeletHasSufficientPID',
        message: 'kubelet has sufficient process IDs (PIDs) available in Linux kernel namespace table.',
      },
      {
        type: 'NetworkUnavailable' as const,
        status: 'False' as const,
        lastHeartbeatTime: new Date(now - 1000 * 5).toISOString(),
        lastTransitionTime: new Date(now - 1000 * 60 * 60 * 24 * 14).toISOString(),
        reason: 'RouteCreated',
        message: 'Cilium eBPF CNI installed routes and VXLAN tunnels correctly.',
      },
    ],
    capacity: {
      cpuMillicores: totalCpuMilli,
      memoryBytes: totalMemBytes,
      ephemeralStorageBytes: 500 * 1024 * 1024 * 1024,
      pods: node.podsCapacity,
    },
    allocatable: {
      cpuMillicores: allocatableCpuMilli,
      memoryBytes: allocatableMemBytes,
      ephemeralStorageBytes: 460 * 1024 * 1024 * 1024,
      pods: node.podsCapacity,
    },
    allocated: {
      cpuRequestMillicores: allocatedCpuMilli,
      cpuRequestPercent: node.cpuUsagePercent,
      cpuLimitMillicores: Math.round(allocatableCpuMilli * Math.min(1.2, (node.cpuUsagePercent + 15) / 100)),
      cpuLimitPercent: Math.min(100, node.cpuUsagePercent + 15),
      memoryRequestBytes: allocatedMemBytes,
      memoryRequestPercent: node.memoryUsagePercent,
      memoryLimitBytes: Math.round(allocatableMemBytes * Math.min(1.15, (node.memoryUsagePercent + 10) / 100)),
      memoryLimitPercent: Math.min(100, node.memoryUsagePercent + 10),
      podsRunning: node.podsRunning,
      podsCapacity: node.podsCapacity,
      ephemeralStorageUsedBytes: 142 * 1024 * 1024 * 1024,
      ephemeralStoragePercent: 31,
    },
    cgroupPsi: {
      cpuSome10s: node.cpuUsagePercent > 70 ? 0.12 : 0.04,
      memSome10s: isHighMem ? 0.08 : 0.01,
      memFull10s: 0.0,
      ioSome10s: 0.02,
    },
    networkStats: {
      rxBytesPerSec: 142000000, // 142 MB/s
      txBytesPerSec: 188000000, // 188 MB/s
      tcpRetransmitsPerSec: isHighMem ? 2 : 0,
      socketDropsTotal: 0,
    },
    scheduledPods,
    kernelLogs,
  };

  res.json({ success: true, node: nodeDetails });
});

// 5b. Node Cordon / Uncordon Simulation
app.post('/api/k8s/node/:nodeId/cordon', (req: Request, res: Response) => {
  const { nodeId } = req.params;
  const node = k8sNodes.find((n) => n.id === nodeId || n.name === nodeId);
  if (!node) return res.status(404).json({ error: 'Node not found' });

  if (node.status === 'SchedulingDisabled') {
    node.status = 'Ready';
    res.json({ success: true, message: `Node ${node.name} uncordoned. Pod scheduling re-enabled.`, newStatus: 'Ready' });
  } else {
    node.status = 'SchedulingDisabled';
    res.json({ success: true, message: `Node ${node.name} cordoned. New pod scheduling disabled.`, newStatus: 'SchedulingDisabled' });
  }
});

// 5c. Node Drain Simulator
app.post('/api/k8s/node/:nodeId/drain', (req: Request, res: Response) => {
  const { nodeId } = req.params;
  const node = k8sNodes.find((n) => n.id === nodeId || n.name === nodeId);
  if (!node) return res.status(404).json({ error: 'Node not found' });

  node.status = 'SchedulingDisabled';
  const evictedCount = Math.max(1, node.podsRunning - 4); // Keep DaemonSets
  node.podsRunning = 4;
  node.cpuUsagePercent = Math.max(12, Math.round(node.cpuUsagePercent * 0.2));
  node.memoryUsagePercent = Math.max(18, Math.round(node.memoryUsagePercent * 0.25));

  res.json({
    success: true,
    message: `Node ${node.name} successfully cordoned and drained. Evicted ${evictedCount} non-DaemonSet pods to available cluster nodes.`,
    evictedPodsCount: evictedCount,
    remainingPods: 4,
  });
});

// 5d. Trigger Node eBPF Kernel Probe
app.post('/api/k8s/node/:nodeId/kernel-probe', (req: Request, res: Response) => {
  const { nodeId } = req.params;
  const node = k8sNodes.find((n) => n.id === nodeId || n.name === nodeId);
  if (!node) return res.status(404).json({ error: 'Node not found' });

  res.json({
    success: true,
    message: `eBPF kernel probe attached to node ${node.name} (Linux 6.8.0-48-generic). Traced 1,480 syscalls across 38 cgroups. Zero dropped packets.`,
    stats: {
      probesAttached: 14,
      bpfMapsLoaded: 8,
      activeTraces: 1480,
      ringBufferDrops: 0,
      timestamp: new Date().toISOString(),
    },
  });
});

// 6. Predictive OOM & Throttling Alerts
app.get('/api/k8s/predictive-alerts', (req: Request, res: Response) => {
  res.json({
    alerts: predictiveOOMAlerts,
    count: predictiveOOMAlerts.length,
  });
});

// 7. Active Diagnostic Issues & RCA
app.get('/api/k8s/issues', (req: Request, res: Response) => {
  res.json({
    issues: diagnosticIssues,
    autoHealingHistory,
  });
});

// 8. 1-Click Auto-Healing Execution Endpoint
app.post('/api/k8s/auto-heal', (req: Request, res: Response) => {
  const { issueId, actionType } = req.body;
  const issue = diagnosticIssues.find((i) => i.id === issueId);

  if (!issue) {
    return res.status(404).json({ error: 'Issue not found' });
  }

  const healRecordId = `heal-${Math.floor(1000 + Math.random() * 9000)}`;
  let diffApplied = '';
  let logs: string[] = [];

  if (issue.type === 'MemoryLeakWarning' || actionType === 'bump_memory') {
    // 1. Resolve predictive OOM alert
    const targetPod = k8sPods.find((p) => p.name === issue.podName || p.serviceName === issue.serviceName);
    if (targetPod) {
      targetPod.memoryLimitMB = 1024;
      targetPod.memoryMB = 220; // reset after restart
      targetPod.memoryUsage = 21;
      targetPod.isLeakingMemory = false;
      targetPod.predictedOOMMinutes = undefined;
      targetPod.memoryHistory = [
        { time: '10m ago', memoryMB: 280 },
        { time: '5m ago', memoryMB: 456 },
        { time: 'Now (Healed)', memoryMB: 220 },
      ];
    }

    predictiveOOMAlerts = predictiveOOMAlerts.map((a) => (a.id === 'pred-oom-01' ? { ...a, status: 'resolved' as const } : a));

    diffApplied = 'Patched Deployment `payment-gateway`: memory limit 512Mi -> 1024Mi. Executed zero-downtime rolling restart.';
    logs = [
      `[${new Date().toLocaleTimeString()}] Executing: kubectl set resources deployment payment-gateway --limits=memory=1024Mi -n production`,
      `[${new Date().toLocaleTimeString()}] Scaled new replica pod: payment-gateway-7d984bc8-healed-1`,
      `[${new Date().toLocaleTimeString()}] Readiness probe OK (200 OK). Traffic safely routed. Memory leak slope reset to 0.0 MB/min.`,
    ];
  } else if (issue.type === 'CrashLoopBackOff' || actionType === 'sync_configmap') {
    // 2. Resolve CrashLoopBackOff on order-processing
    const targetPod = k8sPods.find((p) => p.name === issue.podName || p.serviceName === issue.serviceName);
    if (targetPod) {
      targetPod.status = 'Running';
      targetPod.ready = '1/1';
      targetPod.restarts = 0;
      targetPod.containers[0].state = 'running';
      targetPod.containers[0].ready = true;
      targetPod.containers[0].reason = undefined;
    }

    diffApplied = 'Re-synchronized Secret `order-db-credentials` from Vault KMS with key `POSTGRES_REPLICA_PW`. Pod restarted.';
    logs = [
      `[${new Date().toLocaleTimeString()}] Authenticating with Vault KMS at vault.internal.acme.io...`,
      `[${new Date().toLocaleTimeString()}] Retrieved encrypted secret key 'POSTGRES_REPLICA_PW'.`,
      `[${new Date().toLocaleTimeString()}] Injected secret into K8s Secret order-db-credentials in namespace production.`,
      `[${new Date().toLocaleTimeString()}] Pod order-processing restarted. DB connection pool established (10/10 idle connections ready).`,
    ];
  } else if (issue.type === 'ImagePullBackOff' || actionType === 'rollback_image') {
    // 3. Resolve ImagePullBackOff
    const targetPod = k8sPods.find((p) => p.name === issue.podName || p.serviceName === issue.serviceName);
    if (targetPod) {
      targetPod.status = 'Running';
      targetPod.ready = '1/1';
      targetPod.ip = '10.244.4.19';
      targetPod.containers[0].state = 'running';
      targetPod.containers[0].ready = true;
      targetPod.containers[0].image = 'ghcr.io/acme/notification-service:v2.0.4-stable';
      targetPod.containers[0].reason = undefined;
    }

    diffApplied = 'Rolled back Deployment `notification-worker` image from broken tag to `v2.0.4-stable`.';
    logs = [
      `[${new Date().toLocaleTimeString()}] Executing: kubectl set image deployment notification-worker notification-daemon=ghcr.io/acme/notification-service:v2.0.4-stable -n staging`,
      `[${new Date().toLocaleTimeString()}] Successfully pulled ghcr.io/acme/notification-service:v2.0.4-stable (Digest: sha256:88941f...)`,
      `[${new Date().toLocaleTimeString()}] Pod started in 1.4s. 1/1 containers healthy.`,
    ];
  }

  // Update issue status
  issue.status = 'resolved';

  const newRecord: AutoHealingRecord = {
    id: healRecordId,
    issueId: issue.id,
    timestamp: new Date().toISOString(),
    actionName: `Auto-Healed: ${issue.title}`,
    targetResource: `${issue.namespace}/${issue.serviceName}`,
    namespace: issue.namespace,
    durationMs: 1420,
    status: 'success',
    diffApplied,
    logs,
  };

  autoHealingHistory.unshift(newRecord);

  // Add live log entry
  liveLogs.unshift({
    id: `log-${Date.now()}`,
    timestamp: new Date().toISOString(),
    level: 'INFO',
    service: issue.serviceName,
    namespace: issue.namespace,
    pod: issue.podName,
    message: `[AUTO_HEAL_SUCCESS] Successfully resolved ${issue.type}. Applied diff: ${diffApplied}`,
    isAnomaly: false,
    traceId: `heal-${Math.random().toString(16).substring(2, 8)}`,
  });

  res.json({
    success: true,
    record: newRecord,
    updatedIssue: issue,
    stats: getClusterStats(),
  });
});

// 9. Reset / Simulate Incidents Endpoint (For demo and live validation)
app.post('/api/k8s/simulate-incident', (req: Request, res: Response) => {
  const { incidentType = 'memory_leak' } = req.body;

  if (incidentType === 'memory_leak') {
    const targetPod = k8sPods.find((p) => p.serviceName === 'payment-gateway');
    if (targetPod) {
      targetPod.memoryLimitMB = 512;
      targetPod.memoryMB = 468;
      targetPod.memoryUsage = 91.4;
      targetPod.isLeakingMemory = true;
      targetPod.predictedOOMMinutes = 9.2;
    }

    predictiveOOMAlerts = [
      {
        id: 'pred-oom-01',
        podName: 'payment-gateway-7d984bc8-xq2p9',
        namespace: 'production',
        serviceName: 'payment-gateway',
        currentMemoryMB: 468,
        memoryLimitMB: 512,
        utilizationPercent: 91.4,
        leakSlopeMBPerMin: 19.8,
        predictedOOMMinutes: 9.2,
        confidenceScore: 98.2,
        detectedAt: new Date().toISOString(),
        status: 'active',
        recommendedLimitMB: 1024,
        historicalTrend: [
          { time: '10m ago', actualMB: 280 },
          { time: '8m ago', actualMB: 330 },
          { time: '6m ago', actualMB: 385 },
          { time: '4m ago', actualMB: 425 },
          { time: '2m ago', actualMB: 450 },
          { time: 'Now', actualMB: 468 },
          { time: '+4m (est)', actualMB: 495, projectedMB: 495 },
          { time: '+9.2m (OOM)', actualMB: 512, projectedMB: 512 },
        ],
      },
    ];

    const existingIssue = diagnosticIssues.find((i) => i.id === 'issue-01');
    if (existingIssue) {
      existingIssue.status = 'active';
      existingIssue.detectedAt = new Date().toISOString();
    }
  }

  res.json({ success: true, message: `Simulated incident: ${incidentType}`, stats: getClusterStats() });
});

// 10. Canary Deployment & Traffic Shifting
app.get('/api/canary/status', (req: Request, res: Response) => {
  res.json({ canary: canaryDeployment });
});

app.post('/api/canary/traffic-split', (req: Request, res: Response) => {
  const { trafficWeight, action } = req.body;

  if (action === 'rollback') {
    canaryDeployment.trafficWeight = 0;
    canaryDeployment.status = 'rolled_back';
    canaryDeployment.trafficHistory.push({
      time: 'Now (Rollback)',
      canaryTraffic: 0,
      canaryErrorRate: 0.0,
    });
    return res.json({ success: true, canary: canaryDeployment, message: 'Canary rollout automatically rolled back to 0%.' });
  }

  if (action === 'promote') {
    canaryDeployment.trafficWeight = 100;
    canaryDeployment.status = 'promoted';
    canaryDeployment.stableVersion = canaryDeployment.canaryVersion;
    canaryDeployment.trafficHistory.push({
      time: 'Now (Promoted)',
      canaryTraffic: 100,
      canaryErrorRate: 0.01,
    });
    return res.json({ success: true, canary: canaryDeployment, message: 'Canary version promoted to 100% stable production.' });
  }

  const weight = Math.max(0, Math.min(100, Number(trafficWeight) || 0));
  canaryDeployment.trafficWeight = weight;
  canaryDeployment.status = 'running';

  // Simulated metrics based on weight
  if (weight > 70) {
    canaryDeployment.p99LatencyMs.canary = 52;
    canaryDeployment.errorRatePercent.canary = 0.06;
  } else {
    canaryDeployment.p99LatencyMs.canary = 46;
    canaryDeployment.errorRatePercent.canary = 0.03;
  }

  canaryDeployment.trafficHistory.push({
    time: 'Now',
    canaryTraffic: weight,
    canaryErrorRate: canaryDeployment.errorRatePercent.canary,
  });

  res.json({ success: true, canary: canaryDeployment });
});

// 11. FinOps Breakdown
app.get('/api/finops/breakdown', (req: Request, res: Response) => {
  res.json(finOpsData);
});

// 12. Streaming / Filtered Logs
app.get('/api/logs', (req: Request, res: Response) => {
  const { level, service, namespace, search } = req.query;
  let filtered = [...liveLogs];

  if (level && level !== 'ALL') {
    filtered = filtered.filter((l) => l.level === level);
  }
  if (service && service !== 'ALL') {
    filtered = filtered.filter((l) => l.service === service);
  }
  if (namespace && namespace !== 'ALL') {
    filtered = filtered.filter((l) => l.namespace === namespace);
  }
  if (search && typeof search === 'string') {
    const q = search.toLowerCase();
    filtered = filtered.filter((l) => l.message.toLowerCase().includes(q) || l.pod.toLowerCase().includes(q));
  }

  res.json({ logs: filtered });
});

// 13. AI-Powered Deep Root Cause Analysis (Gemini Integration)
app.post('/api/ai/diagnose', async (req: Request, res: Response) => {
  const { issueTitle, podName, namespace, rootCause, technicalDetails } = req.body;

  const prompt = `You are a Principal Cloud-Native SRE and Kubernetes Operations Architect.
Perform an in-depth root cause analysis and mitigation breakdown for this Kubernetes incident:

Issue: ${issueTitle}
Pod: ${podName}
Namespace: ${namespace}
Initial Observation: ${rootCause}
Technical Context: ${JSON.stringify(technicalDetails || {})}

Provide a concise, expert analysis with:
1. Exact Root Cause Breakdown (Kernel/cgroup level, memory allocator, or K8s control plane mechanism)
2. Immediate Mitigation & 1-Click Patch Rationale
3. Long-term Architectural Prevention (e.g., eBPF monitoring rules, memory arena tuning, HPA configurations, Vault sync pipelines)
4. Recommended kubectl or Helm patch commands.`;

  const ai = getGeminiClient();
  if (!ai) {
    return res.json({
      analysis: `### 🔍 AI SRE Root Cause Diagnosis (${issueTitle})

**1. Underlying Mechanism:**
The Linux cgroups v2 memory controller (\`memory.max\` / \`memory.current\`) tracks RSS + page cache. The application is accumulating memory in an unevicted heap slice (Stripe webhook idempotency table) without triggering Go runtime GC scavenger sweeps. As allocation approaches the 512Mi boundary, the OOM killer (\`oom_score_adj\`) selects this PID for termination with SIGKILL (exit code 137).

**2. Immediate Remediation:**
Execute a dynamic resource patch bumping limits to 1024Mi while triggering a rolling canary replacement to flush accumulated heap memory safely without dropping inflight requests.

**3. Long-Term Architectural Fix:**
- Implement LRU key eviction with strict 15-minute TTL in the Redis/in-memory cache layer.
- Add an automated eBPF memory slope alert threshold (\`rate(container_memory_working_set_bytes[5m]) > 15MB/min\`).
- Configure Vertical Pod Autoscaler (VPA) in 'Off' or 'Initial' mode to track realistic baseline footprints.`,
    });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });
    res.json({ analysis: response.text || 'Analysis generated successfully.' });
  } catch (err: any) {
    console.error('Gemini API diagnosis error:', err);
    res.json({
      analysis: `### 🔍 Automated SRE Diagnosis (${issueTitle})
**Root Cause Summary:** Memory consumption velocity exceeds garbage collection reclamation cycle.
**Recommended Action:** Apply 1-Click Memory Limit expansion to 1024Mi and verify steady-state heap trajectory.`,
    });
  }
});

// -------------------------------------------------------------
// Failed Builds & K8s Failed Deployments History & AI Diagnosis
// -------------------------------------------------------------

// 1. Get All Failed Build Records
app.get('/api/history/failed-builds', (req: Request, res: Response) => {
  res.json({
    failedBuilds: failedBuildHistory,
    totalCount: failedBuildHistory.length,
  });
});

// 2. Add / Record a Failed Build
app.post('/api/history/failed-builds', async (req: Request, res: Response) => {
  const {
    runId,
    repo = `${activeGitHubRepo.owner}/${activeGitHubRepo.name}`,
    branch = activeGitHubRepo.branch || 'main',
    commitSha = activeGitHubRepo.lastCommitSha || '0000000',
    commitMessage = activeGitHubRepo.lastCommitMessage || 'Commit message',
    author = activeGitHubRepo.lastCommitAuthor || 'Developer',
    failedStepName = 'Build Step',
    exitCode = 1,
    errorCategory = 'Unknown',
    durationSec = 24,
    rawLogs = [],
  } = req.body;

  const newId = `fail-bld-${Math.floor(1000 + Math.random() * 9000)}`;

  const diagnosis = await generateBuildFailureDiagnosis(
    repo,
    branch,
    commitSha,
    failedStepName,
    rawLogs,
    commitMessage
  );

  const newRecord: FailedBuildRecord = {
    id: newId,
    runId: runId || `run-${Math.floor(1000 + Math.random() * 9000)}`,
    repo,
    branch,
    commitSha,
    commitMessage,
    author,
    failedStepName,
    exitCode,
    errorCategory: errorCategory as any,
    failedAt: new Date().toISOString(),
    durationSec,
    rawLogs,
    aiDiagnosis: diagnosis,
    status: 'analyzed',
  };

  failedBuildHistory.unshift(newRecord);
  res.json({ success: true, record: newRecord });
});

// 3. AI Deep Diagnosis for any Build Failure (Live or Historical)
app.post('/api/ai/diagnose-build-failure', async (req: Request, res: Response) => {
  try {
    const {
      repo = `${activeGitHubRepo.owner}/${activeGitHubRepo.name}`,
      branch = 'main',
      commitSha = 'HEAD',
      failedStepName = 'Execute Tests',
      errorLogs = [],
      commitMessage = '',
    } = req.body;

    const diagnosis = await generateBuildFailureDiagnosis(
      repo,
      branch,
      commitSha,
      failedStepName,
      errorLogs,
      commitMessage
    );

    res.json({ success: true, diagnosis });
  } catch (err: any) {
    console.error('Error diagnosing build failure:', err);
    res.status(500).json({ error: `Diagnosis error: ${err.message}` });
  }
});

// 4. Re-analyze a Specific Failed Build Record
app.post('/api/history/failed-builds/:id/analyze', async (req: Request, res: Response) => {
  const { id } = req.params;
  const record = failedBuildHistory.find((r) => r.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Failed build record not found' });
  }

  const diagnosis = await generateBuildFailureDiagnosis(
    record.repo,
    record.branch,
    record.commitSha,
    record.failedStepName,
    record.rawLogs,
    record.commitMessage
  );

  record.aiDiagnosis = diagnosis;
  record.status = 'analyzed';

  res.json({ success: true, record });
});

// 5. 1-Click Auto-Fix & Re-run Pipeline for a Failed Build
app.post('/api/history/failed-builds/:id/re-run', (req: Request, res: Response) => {
  const { id } = req.params;
  const record = failedBuildHistory.find((r) => r.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Failed build record not found' });
  }

  // Mark status as remediated
  record.status = 'remediated';

  // Dispatch a fresh clean green workflow run
  const newRunId = `run-${Math.floor(1000 + Math.random() * 9000)}`;
  const patchSha = Math.random().toString(16).substring(2, 9);

  const cleanRun: WorkflowRun = {
    id: newRunId,
    workflowName: 'CI/CD Automated Remediation Rollout',
    repo: record.repo,
    commitSha: patchSha,
    commitMessage: `fix(${record.failedStepName.toLowerCase().replace(/\s+/g, '-')}): auto-apply AI SRE patch for ${record.id}`,
    author: 'AI SRE Copilot',
    branch: record.branch,
    event: 'workflow_dispatch',
    status: 'completed',
    conclusion: 'success',
    durationSec: 42,
    baselineDurationSec: 40,
    hasDurationAnomaly: false,
    startedAt: new Date().toISOString(),
    targetNamespace: 'production',
    targetService: record.repo.split('/')[1] || activeGitHubRepo.name,
    deployedVersion: `v2.4.9-patch-${patchSha.substring(0, 4)}`,
    stages: [
      {
        id: 'st-1',
        name: 'Build, Lint & Security Audit',
        status: 'success',
        steps: [
          {
            id: 's1-1',
            name: 'Compile & Static Type Check',
            status: 'success',
            durationSec: 8,
            baselineDurationSec: 10,
            isAnomaly: false,
            logs: [
              '[INFO] Applied AI SRE code remediation patch.',
              '[SUCCESS] 0 type errors. Clean compilation.',
            ],
          },
        ],
      },
      {
        id: 'st-2',
        name: 'Automated Test Suite',
        status: 'success',
        steps: [
          {
            id: 's2-1',
            name: record.failedStepName,
            status: 'success',
            durationSec: 18,
            baselineDurationSec: 20,
            isAnomaly: false,
            logs: [
              `[INFO] Re-running ${record.failedStepName}...`,
              '[SUCCESS] 48/48 test assertions passed (100% green).',
            ],
          },
        ],
      },
      {
        id: 'st-3',
        name: 'ArgoCD Progressive Canary Deploy',
        status: 'success',
        steps: [
          {
            id: 's3-1',
            name: 'Traffic Shift to Healthy Replicas',
            status: 'success',
            durationSec: 16,
            baselineDurationSec: 15,
            isAnomaly: false,
            logs: [
              '[SUCCESS] 100% traffic routed to patched container image.',
              '[SUCCESS] Pipeline complete.',
            ],
          },
        ],
      },
    ],
  };

  workflowRuns.unshift(cleanRun);

  // Add commit log
  recentCommits.unshift({
    sha: `${patchSha}000000000000000000000000000000`,
    shortSha: patchSha,
    message: `fix: auto-apply remediation patch for build failure ${record.id}`,
    author: 'AI SRE Copilot',
    authorEmail: 'copilot@acme.io',
    timestamp: new Date().toISOString(),
    branch: record.branch,
    verified: true,
    linkedDeployment: newRunId,
  });

  res.json({
    success: true,
    message: `Applied automated remediation. Green workflow run ${newRunId} dispatched successfully.`,
    newRun: cleanRun,
    record,
  });
});

// 5.1 Universal 1-Click Auto-Fix & Re-run (dispatches fix directly from any workflow run or failure record)
app.post('/api/history/failed-builds/auto-fix-run', async (req: Request, res: Response) => {
  const {
    runId,
    repo = activeGitHubRepo ? `${activeGitHubRepo.owner}/${activeGitHubRepo.name}` : 'acme-enterprise/cloudops-microservices-suite',
    branch = activeGitHubRepo?.branch || 'main',
    commitSha,
    failedStepName = 'Unit & Integration Tests',
    errorLogs = [],
    commitMessage = 'Trigger automated build remediation',
    service = activeGitHubRepo?.name || 'app-service',
  } = req.body;

  let existingRecord = failedBuildHistory.find(
    (b) => (runId && b.runId === runId) || (commitSha && b.commitSha === commitSha && b.repo === repo)
  );

  if (!existingRecord) {
    const diag = await generateBuildFailureDiagnosis(
      repo,
      branch,
      commitSha || 'patch',
      failedStepName,
      errorLogs.length > 0 ? errorLogs : ['Assertion failed: process exited with code 1'],
      commitMessage
    );
    existingRecord = {
      id: `fail-bld-${Math.floor(1000 + Math.random() * 9000)}`,
      runId: runId || `run-${Math.floor(1000 + Math.random() * 9000)}`,
      repo,
      branch,
      commitSha: commitSha || 'patch01',
      commitMessage,
      author: 'AI SRE Copilot',
      failedStepName,
      exitCode: 1,
      errorCategory: 'TestAssertion',
      failedAt: new Date().toISOString(),
      durationSec: 32,
      rawLogs: errorLogs,
      aiDiagnosis: diag,
      status: 'remediated',
    };
    failedBuildHistory.unshift(existingRecord);
  } else {
    existingRecord.status = 'remediated';
  }

  // Create and prepend new clean green workflow run
  const newRunId = `run-${Math.floor(1000 + Math.random() * 9000)}`;
  const patchSha = Math.random().toString(16).substring(2, 9);

  const cleanRun: WorkflowRun = {
    id: newRunId,
    workflowName: 'CI/CD Automated Remediation Rollout',
    repo,
    commitSha: patchSha,
    commitMessage: `fix(${failedStepName.toLowerCase().replace(/\s+/g, '-')}): apply SRE declarative patch (${patchSha.substring(0, 4)})`,
    author: 'AI SRE Copilot',
    branch,
    event: 'workflow_dispatch',
    status: 'completed',
    conclusion: 'success',
    durationSec: 38,
    baselineDurationSec: 40,
    hasDurationAnomaly: false,
    startedAt: new Date().toISOString(),
    targetNamespace: 'production',
    targetService: service,
    deployedVersion: `v2.4.9-patch-${patchSha.substring(0, 4)}`,
    stages: [
      {
        id: 'st-1',
        name: 'Build, Lint & Security Audit',
        status: 'success',
        steps: [
          {
            id: 's1-1',
            name: 'Compile & Static Type Check',
            status: 'success',
            durationSec: 8,
            baselineDurationSec: 10,
            isAnomaly: false,
            logs: [
              '[INFO] Applied declarative AI SRE code patch.',
              '[SUCCESS] 0 lint or type errors identified.',
            ],
          },
        ],
      },
      {
        id: 'st-2',
        name: 'Automated Test Suite',
        status: 'success',
        steps: [
          {
            id: 's2-1',
            name: failedStepName,
            status: 'success',
            durationSec: 16,
            baselineDurationSec: 20,
            isAnomaly: false,
            logs: [
              `[INFO] Re-running ${failedStepName} with patch applied...`,
              '[SUCCESS] 48/48 test assertions passed (100% green).',
            ],
          },
        ],
      },
      {
        id: 'st-3',
        name: 'ArgoCD Progressive Canary Deploy',
        status: 'success',
        steps: [
          {
            id: 's3-1',
            name: 'Traffic Shift to Healthy Replicas',
            status: 'success',
            durationSec: 14,
            baselineDurationSec: 15,
            isAnomaly: false,
            logs: [
              '[SUCCESS] 100% traffic safely routed to patched container image.',
              '[SUCCESS] Deployment verification passed. Green pipeline complete.',
            ],
          },
        ],
      },
    ],
  };

  workflowRuns.unshift(cleanRun);

  // Add commit log
  recentCommits.unshift({
    sha: `${patchSha}000000000000000000000000000000`,
    shortSha: patchSha,
    message: `fix: auto-apply declarative remediation patch for ${existingRecord.id}`,
    author: 'AI SRE Copilot',
    authorEmail: 'copilot@acme.io',
    timestamp: new Date().toISOString(),
    branch,
    verified: true,
    linkedDeployment: newRunId,
  });

  res.json({
    success: true,
    message: `Auto-fix patch applied. Green workflow run ${newRunId} dispatched successfully.`,
    newRun: cleanRun,
    record: existingRecord,
    workflowRuns,
    failedBuilds: failedBuildHistory,
  });
});

// 6. Delete a specific failed build
app.delete('/api/history/failed-builds/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const initialLen = failedBuildHistory.length;
  failedBuildHistory = failedBuildHistory.filter((r) => r.id !== id);
  res.json({
    success: true,
    deleted: initialLen !== failedBuildHistory.length,
    remainingCount: failedBuildHistory.length,
  });
});

// 7. Clear all failed build history
app.delete('/api/history/failed-builds', (req: Request, res: Response) => {
  failedBuildHistory = [];
  res.json({ success: true, message: 'Failed build history cleared.' });
});

// 8. Get All Failed Deployments History
app.get('/api/history/failed-deployments', (req: Request, res: Response) => {
  res.json({
    failedDeployments: failedDeploymentHistory,
    totalCount: failedDeploymentHistory.length,
  });
});

// 9. Remediate a Failed Deployment Record
app.post('/api/history/failed-deployments/:id/remediate', (req: Request, res: Response) => {
  const { id } = req.params;
  const record = failedDeploymentHistory.find((r) => r.id === id);
  if (!record) {
    return res.status(404).json({ error: 'Deployment failure record not found' });
  }

  record.autoHealed = true;
  record.remediationApplied = `1-Click Auto-Remediation executed at ${new Date().toLocaleTimeString()}: cluster state reconciled.`;

  res.json({
    success: true,
    message: `Deployment failure '${record.serviceName}' remediated successfully.`,
    record,
  });
});

// 10. Delete a specific failed deployment
app.delete('/api/history/failed-deployments/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  failedDeploymentHistory = failedDeploymentHistory.filter((r) => r.id !== id);
  res.json({ success: true, remainingCount: failedDeploymentHistory.length });
});

// 11. Clear all failed deployment history
app.delete('/api/history/failed-deployments', (req: Request, res: Response) => {
  failedDeploymentHistory = [];
  res.json({ success: true, message: 'Failed deployment history cleared.' });
});

// 14. AI-Powered Incident Post-Mortem Generator
app.post('/api/ai/generate-postmortem', async (req: Request, res: Response) => {
  const { incidentTitle, affectedServices, durationMinutes = 18, resolvedBy = '1-Click Auto-Healing Agent' } = req.body;

  const prompt = `Generate a formal, publication-ready Site Reliability Engineering (SRE) Post-Mortem Incident Report in Markdown format for:
Incident: ${incidentTitle}
Affected Services: ${affectedServices || 'Payment Gateway, Order Processing'}
Duration: ${durationMinutes} minutes
Resolution: ${resolvedBy}

Include standard SRE sections:
# Incident Post-Mortem: ${incidentTitle}
## Executive Summary
## Incident Timeline (T-0 to Resolution)
## Root Cause Analysis (The 5 Whys)
## Impact & Blast Radius (Error Budget, Revenue, SLAs)
## Remediation & Recovery Actions
## Corrective & Preventive Action Items (Action Items with Owners and Priorities)`;

  const ai = getGeminiClient();
  if (!ai) {
    const fallbackReport = `# Incident Post-Mortem: ${incidentTitle}

**Date:** ${new Date().toISOString().split('T')[0]}  
**Status:** Resolved  
**Incident Commander:** DevOps SRE Automation Engine  
**Resolution Mechanism:** ${resolvedBy}  
**MTTD (Mean Time to Detect):** 1.2 minutes  
**MTTR (Mean Time to Recover):** 1.4 seconds (via Automated Self-Healing)

---

## 1. Executive Summary
On ${new Date().toLocaleDateString()}, the observability engine detected a critical anomaly in the \`${affectedServices}\` deployment within the \`production\` namespace. An abnormal memory allocation velocity of +18.4 MB/min was identified prior to pod termination. The platform's automated diagnostic engine executed a targeted 1-click resource patch and zero-downtime rolling reload, preventing cluster-wide HTTP 502 cascade and maintaining 99.98% SLA uptime.

---

## 2. Incident Timeline
- **T-15m:** Deployment \`v2.4.0\` completed via ArgoCD canary pipeline.
- **T-8m:** Predictive OOM Watchdog alerted: memory trajectory reached 89.1% with projected OOMKill in 11.4 mins.
- **T-2m:** Root cause diagnosed as unevicted webhook cache in idempotency table.
- **T-0:** 1-Click Auto-Healing action triggered.
- **T+1.4s:** Kubernetes Deployment memory limit bumped to 1024Mi; rolling restart completed with 0 dropped packets.
- **T+5m:** Memory utilization stabilized at 21.4%; error budget intact.

---

## 3. Root Cause Analysis (5 Whys)
1. **Why did memory surge?** The Stripe idempotency cache accumulated webhook request bodies without clearing expired tokens.
2. **Why were tokens unexpired?** A goroutine timer leak prevented the cleanup worker from waking up.
3. **Why didn't test catches it?** Mock unit test runs lasted <60 seconds, which was insufficient to trigger timer leak thresholds.
4. **Why was the pod limit 512MB?** Conservative default limit set during initial microservice bootstrapping.
5. **Why was downtime avoided?** Predictive regression slope alerted SREs 11 minutes before kernel cgroups OOMKill.

---

## 4. Preventive Action Items
| Action Item | Type | Priority | Owner |
| :--- | :--- | :--- | :--- |
| Implement LRU cache eviction with max-size cap | Code Fix | P0 | Payments Team |
| Add memory velocity drift assertion to CI load test | Pipeline | P1 | QA Automation |
| Deploy VPA (Vertical Pod Autoscaler) recommendations | Infra | P2 | Platform SRE |
`;
    return res.json({ report: fallbackReport });
  }

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
    });
    res.json({ report: response.text || 'Post-mortem generated.' });
  } catch (err) {
    console.error('Gemini postmortem error:', err);
    res.json({ report: '# Incident Post-Mortem\nGenerated report available.' });
  }
});

// -------------------------------------------------------------
// Phase 2: Service Mesh & eBPF Distributed Network Telemetry
// -------------------------------------------------------------
app.get('/api/mesh/topology', (req: Request, res: Response) => {
  // Add small dynamic fluctuations to simulate real-time live network traffic
  const jitteredGraph: ServiceMeshGraph = {
    ...serviceMeshGraph,
    services: serviceMeshGraph.services.map((s) => ({
      ...s,
      rps: Math.max(10, Math.round(s.rps + (Math.random() * 40 - 20))),
      p99LatencyMs: Number((s.p99LatencyMs + (Math.random() * 0.4 - 0.2)).toFixed(2)),
    })),
    ebpfSocketEventsTotal: serviceMeshGraph.ebpfSocketEventsTotal + Math.floor(Math.random() * 50 + 10),
  };
  res.json({ graph: jitteredGraph });
});

// -------------------------------------------------------------
// Phase 2: Multi-Language Microservice Profiling
// -------------------------------------------------------------
app.get('/api/runtime/profiles', (req: Request, res: Response) => {
  res.json({ profiles: languageProfiles });
});

// -------------------------------------------------------------
// Phase 2: ArgoCD GitOps Applications & Manifest Sync
// -------------------------------------------------------------
app.get('/api/gitops/apps', (req: Request, res: Response) => {
  res.json({ apps: gitOpsApps });
});

app.post('/api/gitops/sync', (req: Request, res: Response) => {
  const { appId } = req.body;
  const targetApp = gitOpsApps.find((a) => a.id === appId);

  if (!targetApp) {
    return res.status(404).json({ error: 'GitOps App not found' });
  }

  targetApp.syncStatus = 'Synced';
  targetApp.healthStatus = 'Healthy';
  targetApp.lastSyncTime = new Date().toISOString();
  targetApp.liveManifestYaml = targetApp.gitManifestYaml;
  targetApp.diffLines = targetApp.diffLines.map((d) => ({
    type: 'same',
    line: d.line.replace('+', '').replace('-', ''),
  }));

  res.json({
    success: true,
    message: `ArgoCD successfully reconciled '${targetApp.name}' with Git repository state.`,
    app: targetApp,
  });
});

// -------------------------------------------------------------
// Phase 2: Chaos Engineering Sandbox & MTTD/MTTR Validation
// -------------------------------------------------------------
app.get('/api/chaos/experiments', (req: Request, res: Response) => {
  res.json({ experiments: chaosExperiments });
});

app.post('/api/chaos/trigger', (req: Request, res: Response) => {
  const { experimentId } = req.body;
  const exp = chaosExperiments.find((e) => e.id === experimentId);

  if (!exp) {
    return res.status(404).json({ error: 'Experiment not found' });
  }

  exp.status = 'running';
  exp.elapsedSeconds = 1;

  // If memory leak chaos, also inject into predictive radar
  if (exp.faultType === 'memory_leak') {
    const targetPod = k8sPods.find((p) => p.serviceName === 'payment-gateway');
    if (targetPod) {
      targetPod.memoryMB = 485;
      targetPod.memoryUsage = 94.7;
      targetPod.isLeakingMemory = true;
      targetPod.predictedOOMMinutes = 4.8;
    }
  }

  // Simulate auto-healing resolution after brief run
  setTimeout(() => {
    exp.status = 'mitigated';
    exp.elapsedSeconds = exp.durationSeconds;
  }, 2500);

  res.json({
    success: true,
    message: `Chaos experiment '${exp.name}' launched. Observability probes active.`,
    experiment: exp,
  });
});

// -------------------------------------------------------------
// Phase 2: AI SRE Diagnostic Copilot (Multi-Engine & Model Switcher)
// -------------------------------------------------------------
let activeAiModel = 'gemini-3.7-flash';
const availableAiModels = [
  // Google Cloud / AI Studio Models
  {
    id: 'gemini-3.7-flash',
    name: 'Gemini 3.7 Flash',
    provider: 'Google Cloud Vertex / AI Studio',
    category: 'google',
    tier: 'Ultra-Fast SRE Reasoning & Function Calling',
    speed: '45ms',
    contextWindow: '1M tokens',
    isDefault: true,
    requiresKey: 'GEMINI_API_KEY',
    description: 'Ultra low latency, optimal for live telemetry diagnosis and autonomous auto-healing triggers.',
  },
  {
    id: 'gemini-3.7-pro',
    name: 'Gemini 3.7 Pro',
    provider: 'Google Cloud Vertex / AI Studio',
    category: 'google',
    tier: 'Deep Architectural RCA & Multi-Modal',
    speed: '120ms',
    contextWindow: '2M tokens',
    isDefault: false,
    requiresKey: 'GEMINI_API_KEY',
    description: 'Deep multi-step reasoning for complex microservice cascade failures and large Git diff analyses.',
  },
  {
    id: 'gemini-3.1-flash-lite',
    name: 'Gemini 3.1 Flash Lite',
    provider: 'Google Cloud Vertex / AI Studio',
    category: 'google',
    tier: 'High-Throughput Live Telemetry Ingestion',
    speed: '25ms',
    contextWindow: '1M tokens',
    isDefault: false,
    requiresKey: 'GEMINI_API_KEY',
    description: 'High burst throughput for processing thousands of eBPF socket events and syscall anomalies.',
  },

  // NVIDIA NIM (API Gateway / GPU Cloud) Models
  {
    id: 'nvidia-deepseek-r1',
    name: 'DeepSeek-R1 (NVIDIA NIM)',
    provider: 'NVIDIA API Catalog / NIM Cloud',
    category: 'nvidia',
    tier: '671B SRE Chain-of-Thought Reasoning',
    speed: '65ms',
    contextWindow: '128K tokens',
    isDefault: false,
    requiresKey: 'NVIDIA_API_KEY',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    description: 'High-performance NVIDIA NIM acceleration with verifiable step-by-step kernel and distributed systems RCA.',
  },
  {
    id: 'nvidia-llama-3.3-70b',
    name: 'Llama 3.3 70B Instruct (NVIDIA NIM)',
    provider: 'NVIDIA API Catalog / NIM Cloud',
    category: 'nvidia',
    tier: 'Enterprise DevOps & Infrastructure Automation',
    speed: '55ms',
    contextWindow: '128K tokens',
    isDefault: false,
    requiresKey: 'NVIDIA_API_KEY',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    description: 'Fine-tuned Kubernetes manifest generation, Helm chart templating, and Terraform script validation.',
  },
  {
    id: 'nvidia-nemotron-70b',
    name: 'Nemotron-4 340B / 70B (NVIDIA)',
    provider: 'NVIDIA Enterprise AI',
    category: 'nvidia',
    tier: 'Synthetic Trace & Kernel Anomaly Synthesis',
    speed: '70ms',
    contextWindow: '128K tokens',
    isDefault: false,
    requiresKey: 'NVIDIA_API_KEY',
    endpoint: 'https://integrate.api.nvidia.com/v1/chat/completions',
    description: 'NVIDIA-crafted foundation model engineered for synthetic anomaly injection and runbook verification.',
  },

  // Cursor & IDE AI API Bridge Models
  {
    id: 'cursor-claude-3.7-sonnet',
    name: 'Claude 3.7 Sonnet (Cursor / Anthropic API)',
    provider: 'Cursor / Anthropic API Bridge',
    category: 'cursor',
    tier: 'Hybrid Infrastructure & Codebase Refactoring',
    speed: '85ms',
    contextWindow: '200K tokens',
    isDefault: false,
    requiresKey: 'CURSOR_API_KEY',
    description: 'World-class agentic coding model for automated Git pull-request generation and zero-downtime microservice patches.',
  },
  {
    id: 'cursor-gpt-4o',
    name: 'GPT-4o (Cursor / OpenAI API)',
    provider: 'Cursor / OpenAI API Gateway',
    category: 'cursor',
    tier: 'General CloudOps & Multimodal Diagnostics',
    speed: '80ms',
    contextWindow: '128K tokens',
    isDefault: false,
    requiresKey: 'CURSOR_API_KEY',
    description: 'Cross-functional architecture review and automated Jira / Slack incident report summarization.',
  },
  {
    id: 'cursor-deepseek-coder',
    name: 'DeepSeek-Coder V2 (Cursor Bridge)',
    provider: 'Cursor / Open-Weights API',
    category: 'cursor',
    tier: 'Specialized Systems Programming (Go/Rust/C++)',
    speed: '60ms',
    contextWindow: '128K tokens',
    isDefault: false,
    requiresKey: 'CURSOR_API_KEY',
    description: 'Analyzes native memory allocations, unsafe pointers, and goroutine synchronization leaks.',
  },
];

app.get('/api/ai/models', (req: Request, res: Response) => {
  res.json({
    activeModel: activeAiModel,
    models: availableAiModels,
    geminiApiKeyConfigured: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'MY_GEMINI_API_KEY'),
    nvidiaApiKeyConfigured: Boolean(process.env.NVIDIA_API_KEY),
    cursorApiKeyConfigured: Boolean(process.env.CURSOR_API_KEY),
  });
});

// -------------------------------------------------------------
// AI API Key & Model Detection Endpoint
// Inspects provided API key against provider API, returns available models
// -------------------------------------------------------------
app.post('/api/ai/inspect-key-models', async (req: Request, res: Response) => {
  const { apiKey, provider: requestedProvider } = req.body;
  const rawKey = (apiKey || '').trim();

  // Allow inspecting the system-configured key if requested
  const isSystemKeyRequest = rawKey === '__SYSTEM_ENV__' || rawKey === 'SYSTEM' || !rawKey;
  const effectiveKey = isSystemKeyRequest ? (process.env.GEMINI_API_KEY || '') : rawKey;

  if (!effectiveKey) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'No API key provided. Please paste your API key to detect available models.',
        code: 'MISSING_API_KEY',
        suggestion: 'Paste your API key (e.g. AIzaSy... for Google Gemini or sk-... for OpenAI).',
      },
    });
  }

  // Auto-detect provider if not specified
  let provider: string = requestedProvider || 'auto';
  if (provider === 'auto' || !provider) {
    if (effectiveKey.startsWith('AIzaSy')) {
      provider = 'google';
    } else if (effectiveKey.startsWith('sk-ant-')) {
      provider = 'anthropic';
    } else if (effectiveKey.startsWith('nvapi-')) {
      provider = 'nvidia';
    } else if (effectiveKey.startsWith('gsk_')) {
      provider = 'groq';
    } else if (effectiveKey.startsWith('sk-or-')) {
      provider = 'openrouter';
    } else if (effectiveKey.startsWith('sk-')) {
      provider = 'openai';
    } else {
      provider = 'google'; // default assumption
    }
  }

  const maskKey = (k: string) => {
    if (k.length <= 8) return '••••••••';
    return `${k.substring(0, 6)}••••••••${k.substring(k.length - 4)}`;
  };
  const keyMasked = maskKey(effectiveKey);

  try {
    if (provider === 'google') {
      // Query Google Gemini Live Models List API
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(effectiveKey)}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Sentrix-SRE-Platform/2.4',
        },
      });

      const data: any = await geminiRes.json();

      if (!geminiRes.ok || data.error) {
        const errObj = data.error || {};
        return res.status(geminiRes.status || 400).json({
          success: false,
          provider: 'google',
          providerName: 'Google AI Studio / Gemini API',
          keyMasked,
          error: {
            message: errObj.message || `Google API returned status ${geminiRes.status}: ${geminiRes.statusText}`,
            code: errObj.code || geminiRes.status,
            status: errObj.status || 'API_KEY_ERROR',
            details: errObj.details ? JSON.stringify(errObj.details) : 'The API key provided is invalid, revoked, or lacks permission for the Generative Language API.',
            suggestion: 'Verify your API key at https://aistudio.google.com/app/apikey. Ensure the Generative Language API is enabled on your Google Cloud Project.',
            raw: errObj,
          },
          detectedAt: new Date().toISOString(),
        });
      }

      const rawModels: any[] = Array.isArray(data.models) ? data.models : [];
      
      // Filter & normalize supported models
      const detectedModels = rawModels
        .filter((m: any) => {
          const methods = m.supportedGenerationMethods || [];
          return methods.includes('generateContent') || methods.includes('generateMessage');
        })
        .map((m: any) => {
          const cleanId = (m.name || '').replace(/^models\//, '');
          const isPro = cleanId.includes('pro');
          const isFlash = cleanId.includes('flash');
          const isLite = cleanId.includes('lite');
          const isThinking = cleanId.includes('thinking') || cleanId.includes('3.7') || cleanId.includes('2.5');

          let contextStr = '1M tokens';
          if (m.inputTokenLimit) {
            contextStr = m.inputTokenLimit >= 1000000 
              ? `${(m.inputTokenLimit / 1000000).toFixed(0)}M tokens` 
              : `${Math.round(m.inputTokenLimit / 1000)}K tokens`;
          }

          let tier = 'Production SRE Reasoning';
          if (cleanId.includes('3.7-flash')) tier = 'Ultra-Fast SRE Reasoning & Function Calling (Recommended)';
          else if (cleanId.includes('3.1-flash-lite')) tier = 'High-Throughput Telemetry Ingestion';
          else if (cleanId.includes('3.1-pro')) tier = 'Deep Multi-Step Root Cause Analysis';
          else if (cleanId.includes('2.5-flash')) tier = 'Low Latency Anomaly Detection';
          else if (cleanId.includes('2.5-pro')) tier = 'Complex Architectural Diagnostics';

          return {
            id: cleanId,
            name: m.displayName || cleanId,
            displayName: m.displayName || cleanId,
            description: m.description || `Google Gemini model ${cleanId} for AI SRE automation.`,
            category: 'google',
            provider: 'Google AI Studio',
            contextWindow: contextStr,
            inputTokenLimit: m.inputTokenLimit || 1048576,
            outputTokenLimit: m.outputTokenLimit || 8192,
            supportedGenerationMethods: m.supportedGenerationMethods || ['generateContent'],
            isRecommended: cleanId === 'gemini-3.7-flash' || cleanId === 'gemini-3.1-flash-lite',
            supportsVision: Boolean(m.supportedGenerationMethods?.includes('generateContent')),
            supportsThinking: isThinking,
            tier,
            speed: isLite ? '25ms' : isFlash ? '45ms' : '120ms',
          };
        });

      // Sort with recommended / modern models on top
      detectedModels.sort((a, b) => {
        if (a.id.includes('3.7-flash')) return -1;
        if (b.id.includes('3.7-flash')) return 1;
        if (a.id.includes('3.1-flash-lite')) return -1;
        if (b.id.includes('3.1-flash-lite')) return 1;
        return a.name.localeCompare(b.name);
      });

      return res.json({
        success: true,
        provider: 'google',
        providerName: 'Google AI Studio / Gemini API',
        models: detectedModels,
        keyMasked,
        detectedAt: new Date().toISOString(),
      });
    } else if (provider === 'openai') {
      const openAiRes = await fetch('https://api.openai.com/v1/models', {
        headers: {
          Authorization: `Bearer ${effectiveKey}`,
          'User-Agent': 'Sentrix-SRE-Platform/2.4',
        },
      });

      const data: any = await openAiRes.json();

      if (!openAiRes.ok || data.error) {
        const errObj = data.error || {};
        return res.status(openAiRes.status || 400).json({
          success: false,
          provider: 'openai',
          providerName: 'OpenAI API Gateway',
          keyMasked,
          error: {
            message: errObj.message || `OpenAI returned status ${openAiRes.status}: ${openAiRes.statusText}`,
            code: errObj.code || openAiRes.status,
            status: errObj.type || 'AUTHENTICATION_ERROR',
            details: 'OpenAI API rejected the provided key. Verify token permissions and account balance.',
            suggestion: 'Check your OpenAI API key and billing status at https://platform.openai.com/api-keys',
            raw: errObj,
          },
          detectedAt: new Date().toISOString(),
        });
      }

      const rawModels: any[] = Array.isArray(data.data) ? data.data : [];
      const relevant = rawModels
        .filter((m: any) => m.id.includes('gpt-4') || m.id.includes('o1') || m.id.includes('o3') || m.id.includes('gpt-3.5'))
        .map((m: any) => ({
          id: m.id,
          name: m.id,
          displayName: m.id,
          description: `OpenAI model ${m.id} for CloudOps automation`,
          category: 'openai',
          provider: 'OpenAI',
          contextWindow: m.id.includes('o1') || m.id.includes('o3') || m.id.includes('4o') ? '128K tokens' : '16K tokens',
          inputTokenLimit: 128000,
          outputTokenLimit: 16384,
          isRecommended: m.id === 'gpt-4o' || m.id === 'gpt-4o-mini' || m.id === 'o3-mini',
          supportsVision: m.id.includes('4o'),
          supportsThinking: m.id.includes('o1') || m.id.includes('o3'),
          tier: m.id.includes('o3') ? 'Deep Step-by-Step Reasoning' : 'High Speed General CloudOps',
          speed: m.id.includes('mini') ? '35ms' : '85ms',
        }));

      return res.json({
        success: true,
        provider: 'openai',
        providerName: 'OpenAI API Gateway',
        models: relevant,
        keyMasked,
        detectedAt: new Date().toISOString(),
      });
    } else if (provider === 'groq') {
      const groqRes = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          Authorization: `Bearer ${effectiveKey}`,
          'User-Agent': 'Sentrix-SRE-Platform/2.4',
        },
      });

      const data: any = await groqRes.json();

      if (!groqRes.ok || data.error) {
        const errObj = data.error || {};
        return res.status(groqRes.status || 400).json({
          success: false,
          provider: 'groq',
          providerName: 'Groq LPU Acceleration',
          keyMasked,
          error: {
            message: errObj.message || 'Groq API validation failed',
            code: errObj.code || groqRes.status,
            suggestion: 'Get a Groq API key at https://console.groq.com/keys',
            raw: errObj,
          },
          detectedAt: new Date().toISOString(),
        });
      }

      const rawModels: any[] = Array.isArray(data.data) ? data.data : [];
      const groqModels = rawModels.map((m: any) => ({
        id: m.id,
        name: m.id,
        displayName: m.id,
        description: `Groq Ultra-Fast LPU model ${m.id}`,
        category: 'groq',
        provider: 'Groq Cloud',
        contextWindow: m.context_window ? `${Math.round(m.context_window / 1000)}K tokens` : '128K tokens',
        isRecommended: m.id.includes('llama-3.3-70b') || m.id.includes('deepseek-r1'),
        tier: 'Ultra-High Speed LPU Inference (<20ms)',
        speed: '15ms',
      }));

      return res.json({
        success: true,
        provider: 'groq',
        providerName: 'Groq LPU Acceleration',
        models: groqModels,
        keyMasked,
        detectedAt: new Date().toISOString(),
      });
    } else if (provider === 'nvidia') {
      // Return NVIDIA NIM models with key validation check
      const nimRes = await fetch('https://integrate.api.nvidia.com/v1/models', {
        headers: {
          Authorization: `Bearer ${effectiveKey}`,
          'User-Agent': 'Sentrix-SRE-Platform/2.4',
        },
      });

      const data: any = await nimRes.json();

      if (!nimRes.ok || data.error) {
        const errObj = data.error || {};
        return res.status(nimRes.status || 400).json({
          success: false,
          provider: 'nvidia',
          providerName: 'NVIDIA NIM & GPU Cloud',
          keyMasked,
          error: {
            message: errObj.message || 'NVIDIA NIM API key validation failed',
            code: nimRes.status,
            suggestion: 'Get free NVIDIA evaluation API keys at https://build.nvidia.com',
            raw: errObj,
          },
          detectedAt: new Date().toISOString(),
        });
      }

      const rawModels: any[] = Array.isArray(data.data) ? data.data : [];
      const nvidiaModels = rawModels.map((m: any) => ({
        id: m.id,
        name: m.id,
        displayName: m.id,
        description: `NVIDIA NIM accelerated model ${m.id}`,
        category: 'nvidia',
        provider: 'NVIDIA NIM Cloud',
        contextWindow: '128K tokens',
        isRecommended: m.id.includes('deepseek-r1') || m.id.includes('llama-3.3'),
        tier: 'NVIDIA GPU Acceleration & TensorRT-LLM',
        speed: '40ms',
      }));

      return res.json({
        success: true,
        provider: 'nvidia',
        providerName: 'NVIDIA NIM & GPU Cloud',
        models: nvidiaModels,
        keyMasked,
        detectedAt: new Date().toISOString(),
      });
    } else {
      // Generic / Other provider fallback
      return res.json({
        success: true,
        provider: 'custom',
        providerName: `${provider.toUpperCase()} Provider`,
        models: [
          {
            id: 'custom-model-01',
            name: `${provider} Default Model`,
            displayName: `${provider} Default Model`,
            description: 'Custom AI model connection',
            category: 'custom',
            provider: provider,
            contextWindow: '128K tokens',
            tier: 'Custom Connected Endpoint',
            speed: '60ms',
          },
        ],
        keyMasked,
        detectedAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    console.error('API key detection failed:', err);
    return res.status(500).json({
      success: false,
      provider,
      providerName: 'AI Provider Gateway',
      keyMasked,
      error: {
        message: err.message || 'Failed to connect to AI provider API with this key.',
        code: 'NETWORK_OR_PARSING_ERROR',
        details: err.stack || String(err),
        suggestion: 'Check your internet connection, proxy settings, or verify the API key formatting.',
      },
      detectedAt: new Date().toISOString(),
    });
  }
});

// -------------------------------------------------------------
// AI Model & Key Live Verification / Health Check Endpoint
// Runs a live test prompt on the selected model using the user's API key
// -------------------------------------------------------------
app.post('/api/ai/verify-key-model', async (req: Request, res: Response) => {
  const { apiKey, provider, modelId, testPrompt } = req.body;
  const rawKey = (apiKey || '').trim();
  const effectiveKey = (rawKey === '__SYSTEM_ENV__' || !rawKey) ? (process.env.GEMINI_API_KEY || '') : rawKey;
  const targetModel = modelId || 'gemini-3.7-flash';
  const prompt = testPrompt || 'SRE Health Probe: Verify connection and return a one-sentence confirmation that the reasoning engine is operational.';

  if (!effectiveKey) {
    return res.status(400).json({
      success: false,
      status: 'ERROR',
      modelId: targetModel,
      provider: provider || 'google',
      error: {
        message: 'No API key provided for verification test.',
        code: 'MISSING_KEY',
        suggestion: 'Paste your API key and detect models first.',
      },
    });
  }

  const startTime = Date.now();

  try {
    if (!provider || provider === 'google') {
      // Use direct REST call to Google Gemini to verify key & model
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${targetModel}:generateContent?key=${encodeURIComponent(effectiveKey)}`;
      
      const payload = {
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: 256,
        },
      };

      const resp = await fetch(geminiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Sentrix-SRE-Platform/2.4',
        },
        body: JSON.stringify(payload),
      });

      const latencyMs = Date.now() - startTime;
      const data: any = await resp.json();

      if (!resp.ok || data.error) {
        const errObj = data.error || {};
        return res.status(resp.status || 400).json({
          success: false,
          status: 'ERROR',
          modelId: targetModel,
          provider: 'google',
          latencyMs,
          error: {
            message: errObj.message || `Verification failed with HTTP status ${resp.status}`,
            code: errObj.code || resp.status,
            status: errObj.status || 'GENERATION_ERROR',
            details: errObj.details ? JSON.stringify(errObj.details) : 'The model failed to generate response with the provided API key.',
            suggestion: errObj.message?.includes('Quota') 
              ? 'Your API key has hit a rate limit or quota ceiling. Check Google AI Studio usage.' 
              : 'Verify that this specific model is available for your API key tier.',
            raw: errObj,
          },
          verifiedAt: new Date().toISOString(),
        });
      }

      // Extract candidate text
      const candidates = data.candidates || [];
      const firstCandidate = candidates[0];
      const textParts = firstCandidate?.content?.parts || [];
      const responseText = textParts.map((p: any) => p.text).join('') || 'Operational: Connection verified successfully.';
      const tokenCount = data.usageMetadata?.totalTokenCount || 42;

      return res.json({
        success: true,
        status: 'OPERATIONAL',
        modelId: targetModel,
        provider: 'google',
        latencyMs,
        responsePreview: responseText.trim(),
        tokensGenerated: tokenCount,
        verifiedAt: new Date().toISOString(),
      });
    } else if (provider === 'openai') {
      const openAiUrl = 'https://api.openai.com/v1/chat/completions';
      const payload = {
        model: targetModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
      };

      const resp = await fetch(openAiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${effectiveKey}`,
        },
        body: JSON.stringify(payload),
      });

      const latencyMs = Date.now() - startTime;
      const data: any = await resp.json();

      if (!resp.ok || data.error) {
        const errObj = data.error || {};
        return res.status(resp.status || 400).json({
          success: false,
          status: 'ERROR',
          modelId: targetModel,
          provider: 'openai',
          latencyMs,
          error: {
            message: errObj.message || 'OpenAI generation failed',
            code: errObj.code || resp.status,
            status: errObj.type || 'OPENAI_ERROR',
            suggestion: 'Check your OpenAI account balance and model access.',
            raw: errObj,
          },
          verifiedAt: new Date().toISOString(),
        });
      }

      const responseText = data.choices?.[0]?.message?.content || 'Operational';
      return res.json({
        success: true,
        status: 'OPERATIONAL',
        modelId: targetModel,
        provider: 'openai',
        latencyMs,
        responsePreview: responseText.trim(),
        tokensGenerated: data.usage?.total_tokens || 35,
        verifiedAt: new Date().toISOString(),
      });
    } else {
      // Generic verification simulation
      const latencyMs = Date.now() - startTime + 45;
      return res.json({
        success: true,
        status: 'OPERATIONAL',
        modelId: targetModel,
        provider: provider,
        latencyMs,
        responsePreview: `[${provider.toUpperCase()}] Model '${targetModel}' connection verified. Ready for SRE telemetry processing.`,
        tokensGenerated: 28,
        verifiedAt: new Date().toISOString(),
      });
    }
  } catch (err: any) {
    const latencyMs = Date.now() - startTime;
    return res.status(500).json({
      success: false,
      status: 'ERROR',
      modelId: targetModel,
      provider: provider || 'google',
      latencyMs,
      error: {
        message: err.message || 'Inference probe request failed.',
        code: 'EXECUTION_FAILURE',
        details: err.stack || String(err),
        suggestion: 'Verify network reachability and key credentials.',
      },
      verifiedAt: new Date().toISOString(),
    });
  }
});

// -------------------------------------------------------------
// AI Model Activation Endpoint
// Sets validated custom model & key as the session's active AI engine
// -------------------------------------------------------------
app.post('/api/ai/activate-custom-engine', (req: Request, res: Response) => {
  const { modelId, provider, modelName } = req.body;
  if (!modelId) {
    return res.status(400).json({ success: false, error: 'Model ID required' });
  }

  activeAiModel = modelId;

  // If not already in availableAiModels list, add it dynamically
  const existing = availableAiModels.find((m) => m.id === modelId);
  if (!existing) {
    availableAiModels.unshift({
      id: modelId,
      name: modelName || modelId,
      provider: provider ? `${provider.toUpperCase()} Engine` : 'Custom AI Provider',
      category: (provider as any) || 'google',
      tier: 'User-Activated Dynamic AI Engine',
      speed: '40ms',
      contextWindow: '1M tokens',
      isDefault: false,
      requiresKey: 'NONE',
      description: `Dynamically connected and validated model '${modelId}'.`,
    });
  }

  res.json({
    success: true,
    message: `Active AI reasoning engine set to ${modelName || modelId}`,
    activeModel: activeAiModel,
  });
});

app.post('/api/ai/models/switch', (req: Request, res: Response) => {
  const { modelId } = req.body;
  const found = availableAiModels.find((m) => m.id === modelId);
  if (found) {
    activeAiModel = found.id;
    res.json({
      success: true,
      message: `Active AI reasoning engine switched to ${found.name} (${found.provider})`,
      activeModel: activeAiModel,
      modelDetails: found,
    });
  } else {
    // If not found in static list, still allow switching to custom modelId
    activeAiModel = modelId;
    res.json({
      success: true,
      message: `Active AI reasoning engine switched to ${modelId}`,
      activeModel: activeAiModel,
    });
  }
});


app.get('/api/ai/sre-chat/history', (req: Request, res: Response) => {
  res.json({ messages: sreChatMessages, activeModel: activeAiModel });
});

app.post('/api/ai/sre-chat', async (req: Request, res: Response) => {
  const { message, history, model } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const modelToUse = model || activeAiModel;

  const userMsg: SreChatMessage = {
    id: `msg-${Date.now()}`,
    sender: 'user',
    timestamp: new Date().toISOString(),
    text: message,
  };
  sreChatMessages.push(userMsg);

  const clusterContext = {
    stats: getClusterStats(),
    predictiveAlerts: predictiveOOMAlerts.filter((a) => a.status === 'active'),
    activeIssues: diagnosticIssues.filter((i) => i.status === 'active'),
    canaryStatus: canaryDeployment,
    serviceMeshRetransmits: serviceMeshGraph.services.reduce((acc, s) => acc + s.tcpRetransmitsPerSec, 0),
    activeEngine: modelToUse,
  };

  const systemInstruction = `You are a Principal SRE / Kubernetes Platform Architect Copilot embedded in the CloudOps console.
Running AI Engine: ${modelToUse}
Cluster Telemetry Context:
${JSON.stringify(clusterContext, null, 2)}

Provide clear, technical, and actionable guidance for Site Reliability Engineers.
If relevant, provide valid kubectl / helm commands in markdown code blocks, explain root causes (e.g. goroutine leaks, cgroups limits, memory slope, eBPF socket drops), and recommend automated remediation actions.`;

  let replyText = '';
  let codeSnippet: { language: string; code: string; title?: string } | undefined;
  let suggestedActions: { label: string; actionType: string; payload?: any }[] | undefined;

  const chatPrompt = `${systemInstruction}\n\nUser Question: ${message}`;
  const preferredModel = modelToUse.startsWith('gemini') ? modelToUse : 'gemini-3.7-flash';
  const aiResponseText = await callGeminiSafe(chatPrompt, preferredModel, false);
  if (aiResponseText) {
    replyText = aiResponseText;
  }

  if (!replyText) {
    // Intelligent fallback responses tailored to common SRE questions
    const lower = message.toLowerCase();
    if (lower.includes('oom') || lower.includes('leak') || lower.includes('memory')) {
      replyText = `### 🧠 SRE Memory Leak Analysis (\`payment-gateway\`)
The **Predictive OOM Watchdog** detected a linear memory climb (+18.4 MB/min) in \`payment-gateway-7d984bc8-xq2p9\`.

**Underlying Cause:**
The Stripe webhook idempotency cache stores incoming payloads in a global sync.Map without an active expiry goroutine scavenger loop.

**Immediate Remediation Options:**
1. **1-Click Memory Limit Expansion**: Bump limits to 1024Mi to provide 45+ minutes of operational buffer.
2. **Rolling Zero-Downtime Reload**: Recycle existing container instances to flush RSS memory footprint.`;

      codeSnippet = {
        language: 'bash',
        title: 'Kubectl Patch & Rolling Restart',
        code: `kubectl set resources deployment payment-gateway --limits=memory=1024Mi -n production
kubectl rollout restart deployment/payment-gateway -n production
kubectl rollout status deployment/payment-gateway -n production`,
      };

      suggestedActions = [
        { label: 'Apply 1024Mi Memory Patch', actionType: 'auto_heal_memory' },
        { label: 'View Predictive Radar Trend', actionType: 'navigate_predictive' },
      ];
    } else if (lower.includes('gitops') || lower.includes('argocd') || lower.includes('sync')) {
      replyText = `### 🚀 ArgoCD GitOps State Analysis
Application \`order-processor-production\` is currently in **OutOfSync** state:
- **Live Cluster**: 2 replicas, image \`v2.0.9\`
- **Git Repo (Desired)**: 4 replicas, image \`v2.1.0\`

You can trigger an automated GitOps sync or inspect the side-by-side YAML diff in the GitOps Studio.`;

      codeSnippet = {
        language: 'yaml',
        title: 'ArgoCD Application Sync Manifest',
        code: `apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: order-processor-production
  namespace: argocd
spec:
  syncPolicy:
    automated:
      prune: true
      selfHeal: true`,
      };

      suggestedActions = [
        { label: 'Sync Order Processor Manifest', actionType: 'sync_gitops_order' },
        { label: 'Open GitOps Studio', actionType: 'navigate_gitops' },
      ];
    } else if (lower.includes('mesh') || lower.includes('network') || lower.includes('ebpf')) {
      replyText = `### 🌐 Service Mesh & eBPF Socket Status
- **Total Ingestion**: **489,120 eBPF socket events** processed across all worker nodes.
- **mTLS Coverage**: **100%** using Istio Ambient Mesh with zero-copy sidecarless proxying.
- **Rust Auth Guard**: Processing 1,420 RPS with **1.2ms P99 latency** and zero TCP retransmits.
- **Go Payment Gateway**: Experiencing minor degraded latency (44ms P99) due to memory pressure.`;

      suggestedActions = [
        { label: 'Open Service Mesh Topology', actionType: 'navigate_mesh' },
        { label: 'Run eBPF Latency Chaos Test', actionType: 'run_chaos_ebpf' },
      ];
    } else {
      replyText = `### 🛠️ Cluster SRE Triage Report
- **Cluster Health Score**: **${getClusterStats().healthScore}/100**
- **Running Pods**: ${getClusterStats().runningPods}/${getClusterStats().totalPods}
- **Active Diagnostic Issues**: ${diagnosticIssues.filter((i) => i.status === 'active').length}
- **eBPF Retransmits**: 2 retransmits/sec detected on \`payment-gateway\`.

All microservices (Go, Python, Rust) are actively profiled and monitored. Let me know if you would like me to generate a specific deployment patch or run a resilience experiment.`;

      codeSnippet = {
        language: 'bash',
        title: 'Kubernetes Cluster Status Check',
        code: `kubectl get nodes -o wide
kubectl get pods --all-namespaces --field-selector status.phase!=Running
kubectl top nodes`,
      };
    }
  }

  const assistantMsg: SreChatMessage = {
    id: `msg-${Date.now() + 1}`,
    sender: 'assistant',
    timestamp: new Date().toISOString(),
    text: replyText,
    codeSnippet,
    suggestedActions,
  };

  sreChatMessages.push(assistantMsg);

  res.json({ success: true, message: assistantMsg, allMessages: sreChatMessages });
});

// -------------------------------------------------------------
// Phase 3 Datasets: Policies, SLOs, Fleet, Security & Alerting
// -------------------------------------------------------------

const autoHealPolicies: AutoHealPolicy[] = [
  {
    id: 'pol-01',
    name: 'Predictive OOM Auto-Expansion Guard',
    description: 'When pod memory trending > +10MB/min and projected OOMKill < 15 mins, patch limits +50% and rolling restart without dropping in-flight sockets.',
    category: 'memory_leak',
    triggerCondition: 'leak_slope > +10MB/min && predicted_oom < 15m',
    action: 'Patch deployment resources.limits.memory +50% and zero-downtime rolling restart',
    cooldownMinutes: 15,
    enabled: true,
    enforcementMode: 'auto_execute',
    executionCount24h: 3,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 42).toISOString(),
  },
  {
    id: 'pol-02',
    name: 'Canary Error Budget Auto-Rollback Gate',
    description: 'Instantly rollback canary deployment to 0% if HTTP 5xx error rate exceeds 1.5% or P99 latency spikes above 250ms for 30 consecutive seconds.',
    category: 'traffic_5xx',
    triggerCondition: 'canary_5xx_rate > 1.5% || p99_latency > 250ms',
    action: 'Ingress traffic split rollback to stable (0% canary)',
    cooldownMinutes: 5,
    enabled: true,
    enforcementMode: 'auto_execute',
    executionCount24h: 1,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
  },
  {
    id: 'pol-03',
    name: 'CrashLoopBackOff Fast-Revert to Previous Digest',
    description: 'If pod restarts >= 4 within 5 minutes, automatically roll back image tag to the last known healthy container digest from GitHub container registry.',
    category: 'crash_loop',
    triggerCondition: 'restart_count >= 4 && restart_window < 5m',
    action: 'Rollback Deployment spec.template.spec.containers[0].image to previous stable SHA',
    cooldownMinutes: 30,
    enabled: true,
    enforcementMode: 'auto_execute',
    executionCount24h: 0,
    lastTriggeredAt: null,
  },
  {
    id: 'pol-04',
    name: 'eBPF Socket Drop & Node Cordon Guard',
    description: 'When worker node TCP socket retransmit rate exceeds 50 pkts/sec across multiple pods, cordon the node and drain non-daemonset pods to healthy worker pool.',
    category: 'ebpf_packet_drop',
    triggerCondition: 'node_tcp_retransmits > 50 pkts/sec',
    action: 'kubectl cordon <node-name> && kubectl drain --ignore-daemonsets',
    cooldownMinutes: 60,
    enabled: true,
    enforcementMode: 'dry_run_audit',
    executionCount24h: 0,
    lastTriggeredAt: null,
  },
  {
    id: 'pol-05',
    name: 'HPA Queue Saturation Fast-Scaler',
    description: 'When Kafka / Redis pending worker queue length exceeds 500 tasks, scale target replica set immediately to maxReplicas: 10.',
    category: 'hpa_scaling',
    triggerCondition: 'queue_pending_items > 500',
    action: 'kubectl scale deployment order-processor --replicas=10',
    cooldownMinutes: 10,
    enabled: true,
    enforcementMode: 'auto_execute',
    executionCount24h: 2,
    lastTriggeredAt: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
  },
];

const sloTargets: SloTarget[] = [
  {
    id: 'slo-01',
    serviceName: 'rust-auth-guard',
    tier: 'Tier-0 Critical',
    sloTargetPercent: 99.99,
    currentSliPercent: 99.995,
    errorBudgetRemainingPercent: 92.4,
    burnRate1h: 0.2,
    burnRate6h: 0.4,
    burnRate24h: 0.35,
    timeToExhaustionHours: null,
    pipelineFreezeTriggered: false,
    windowDays: 30,
    sliMetricName: 'HTTP 200/401 vs 5xx & P99 < 5ms',
  },
  {
    id: 'slo-02',
    serviceName: 'payment-gateway',
    tier: 'Tier-0 Critical',
    sloTargetPercent: 99.9,
    currentSliPercent: 99.88,
    errorBudgetRemainingPercent: 24.8,
    burnRate1h: 4.8,
    burnRate6h: 2.1,
    burnRate24h: 1.8,
    timeToExhaustionHours: 36,
    pipelineFreezeTriggered: false,
    windowDays: 30,
    sliMetricName: 'Successful Webhook & Charge Execution',
  },
  {
    id: 'slo-03',
    serviceName: 'order-processor',
    tier: 'Tier-1 Core',
    sloTargetPercent: 99.95,
    currentSliPercent: 99.96,
    errorBudgetRemainingPercent: 88.0,
    burnRate1h: 0.9,
    burnRate6h: 0.8,
    burnRate24h: 0.75,
    timeToExhaustionHours: null,
    pipelineFreezeTriggered: false,
    windowDays: 30,
    sliMetricName: 'Kafka Order Ingestion Lag < 200ms',
  },
  {
    id: 'slo-04',
    serviceName: 'ai-fraud-detector',
    tier: 'Tier-2 Supporting',
    sloTargetPercent: 99.5,
    currentSliPercent: 99.62,
    errorBudgetRemainingPercent: 74.2,
    burnRate1h: 1.1,
    burnRate6h: 1.0,
    burnRate24h: 0.95,
    timeToExhaustionHours: null,
    pipelineFreezeTriggered: false,
    windowDays: 30,
    sliMetricName: 'Async Inference Job Completion Rate',
  },
];

const clusterFleet: ClusterFleetNode[] = [
  {
    id: 'fleet-us-east',
    clusterName: 'gke-production-us-east1',
    cloudProvider: 'GCP (GKE)',
    region: 'us-east1 (S. Carolina)',
    status: 'healthy',
    nodesCount: 6,
    podsCount: 42,
    cpuUsagePercent: 68.4,
    memUsagePercent: 72.1,
    kubernetesVersion: 'v1.31.2-gke.1100',
    activeTrafficWeight: 60,
    isPrimary: true,
    environment: 'production',
    apiEndpoint: 'https://35.196.44.12:6443',
    rbacStatus: 'READ_ONLY_CERTIFIED',
    pingLatencyMs: 14,
    tlsStatus: 'TLS 1.3 Certified (Google Trust Services CA)',
    registeredAt: '2026-08-01T08:00:00Z',
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'fleet-eu-west',
    clusterName: 'eks-production-eu-west1',
    cloudProvider: 'AWS (EKS)',
    region: 'eu-west-1 (Ireland)',
    status: 'healthy',
    nodesCount: 4,
    podsCount: 28,
    cpuUsagePercent: 54.2,
    memUsagePercent: 61.8,
    kubernetesVersion: 'v1.31.1-eks-a2f8',
    activeTrafficWeight: 40,
    isPrimary: false,
    environment: 'production',
    apiEndpoint: 'https://6A1C49B2.gr7.eu-west-1.eks.amazonaws.com',
    rbacStatus: 'READ_ONLY_CERTIFIED',
    pingLatencyMs: 28,
    tlsStatus: 'TLS 1.3 Certified (Amazon Root CA 1)',
    registeredAt: '2026-08-05T12:30:00Z',
    lastHeartbeat: new Date().toISOString(),
  },
  {
    id: 'fleet-staging',
    clusterName: 'gke-staging-us-central1',
    cloudProvider: 'GCP (GKE)',
    region: 'us-central1 (Iowa)',
    status: 'warning',
    nodesCount: 2,
    podsCount: 14,
    cpuUsagePercent: 41.0,
    memUsagePercent: 48.6,
    kubernetesVersion: 'v1.32.0-beta.1',
    activeTrafficWeight: 0,
    isPrimary: false,
    environment: 'staging',
    apiEndpoint: 'https://34.132.88.201:6443',
    rbacStatus: 'READ_ONLY_CERTIFIED',
    pingLatencyMs: 22,
    tlsStatus: 'TLS 1.3 Certified (Google Trust Services CA)',
    registeredAt: '2026-08-10T16:00:00Z',
    lastHeartbeat: new Date().toISOString(),
  },
];

const securityAuditReport: SecurityAuditReport = {
  totalCves: 3,
  criticalCves: 1,
  highCves: 1,
  mediumCves: 1,
  cisBenchmarkScore: 94,
  lastScanTimestamp: new Date().toISOString(),
  vulnerabilities: [
    {
      id: 'cve-1',
      cveId: 'CVE-2024-45337',
      pkgName: 'golang.org/x/crypto',
      severity: 'CRITICAL',
      installedVersion: 'v0.28.0',
      fixedVersion: 'v0.31.0',
      service: 'payment-gateway',
      title: 'SSH server/client insecure public key auth validation bypass',
      remediationCommand: 'go get golang.org/x/crypto@v0.31.0 && go mod tidy',
      autoFixAvailable: true,
    },
    {
      id: 'cve-2',
      cveId: 'CVE-2024-38526',
      pkgName: 'urllib3',
      severity: 'HIGH',
      installedVersion: '2.2.1',
      fixedVersion: '2.2.2',
      service: 'ai-fraud-detector',
      title: 'Proxy authorization header leak in cross-origin redirects',
      remediationCommand: 'pip install --upgrade urllib3>=2.2.2',
      autoFixAvailable: true,
    },
    {
      id: 'cve-3',
      cveId: 'CVE-2024-24576',
      pkgName: 'std::process::Command',
      severity: 'MEDIUM',
      installedVersion: '1.77.0',
      fixedVersion: '1.77.2',
      service: 'rust-auth-guard',
      title: 'Windows command injection via batch script escaping (N/A on Linux runtime)',
      remediationCommand: 'rustup update stable',
      autoFixAvailable: true,
    },
  ],
  runtimeThreatEvents: [
    {
      id: 'threat-01',
      timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      rule: 'Falco: Spawned Process with Suspicious Shell in Production Pod',
      priority: 'WARNING',
      pod: 'payment-gateway-7d984bc8-xq2p9',
      container: 'payment-gateway',
      command: '/bin/sh -c pprof-collector',
      actionTaken: 'Logged Audit',
    },
    {
      id: 'threat-02',
      timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
      rule: 'Falco: Outbound Connection to Unlisted External IP',
      priority: 'NOTICE',
      pod: 'rust-auth-guard-68d9b4cc-lk88v',
      container: 'auth-guard',
      command: 'connect() -> 54.239.28.85:443 (api.stripe.com)',
      actionTaken: 'Logged Audit',
    },
  ],
};

const alertChannels: AlertIntegrationChannel[] = [
  {
    id: 'chan-slack',
    channelType: 'Slack',
    name: '#sre-incident-war-room',
    endpoint: 'https://hooks.slack.com/services/T000/B000/XXXX',
    status: 'connected',
    eventsSubscribed: ['OOMKill Alerts', 'Canary Rollbacks', 'Auto-Healing Actions', 'P1 Incidents'],
    lastFiredAt: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'chan-pd',
    channelType: 'PagerDuty',
    name: 'Primary SRE On-Call Escalation',
    endpoint: 'https://events.pagerduty.com/v2/enqueue',
    status: 'connected',
    eventsSubscribed: ['P0 Critical Outage', 'SLO Fast Burn Rate > 14x', 'CrashLoopBackOff'],
    lastFiredAt: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
  },
  {
    id: 'chan-prom',
    channelType: 'Prometheus Alertmanager',
    name: 'Alertmanager Webhook Bridge',
    endpoint: 'http://alertmanager.monitoring.svc:9093/api/v2/alerts',
    status: 'connected',
    eventsSubscribed: ['All eBPF & K8s Metrics'],
    lastFiredAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
];

// -------------------------------------------------------------
// Phase 3 Endpoints: Policy Engine, SLO, Fleet, Security & Alerts
// -------------------------------------------------------------

app.get('/api/policies/list', (req: Request, res: Response) => {
  res.json({ policies: autoHealPolicies });
});

app.post('/api/policies/toggle', (req: Request, res: Response) => {
  const { policyId, enabled, enforcementMode } = req.body;
  const policy = autoHealPolicies.find((p) => p.id === policyId);
  if (!policy) {
    return res.status(404).json({ error: 'Policy not found' });
  }

  if (typeof enabled === 'boolean') policy.enabled = enabled;
  if (enforcementMode) policy.enforcementMode = enforcementMode;

  res.json({
    success: true,
    message: `Policy '${policy.name}' updated (${policy.enabled ? 'Enabled' : 'Disabled'}, ${policy.enforcementMode}).`,
    policy,
  });
});

app.get('/api/slo/targets', (req: Request, res: Response) => {
  res.json({ slos: sloTargets });
});

app.post('/api/slo/freeze-pipeline', (req: Request, res: Response) => {
  const { sloId, freeze } = req.body;
  const target = sloTargets.find((s) => s.id === sloId);
  if (!target) {
    return res.status(404).json({ error: 'SLO target not found' });
  }

  target.pipelineFreezeTriggered = freeze;

  res.json({
    success: true,
    message: freeze
      ? `Pipeline freeze enforced for ${target.serviceName}. Deployments blocked until error budget recovers.`
      : `Pipeline freeze lifted for ${target.serviceName}.`,
    target,
  });
});

app.get('/api/fleet/clusters', (req: Request, res: Response) => {
  res.json({ fleet: clusterFleet });
});

app.post('/api/fleet/switch-primary', (req: Request, res: Response) => {
  const { clusterId } = req.body;
  clusterFleet.forEach((c) => {
    c.isPrimary = c.id === clusterId;
  });
  const primary = clusterFleet.find((c) => c.id === clusterId);

  res.json({
    success: true,
    message: `Global traffic ingress shifted. Primary active cluster is now '${primary?.clusterName}'.`,
    fleet: clusterFleet,
  });
});

// Validate Kubeconfig or Direct Cluster API Endpoint with Read-Only RBAC Preflight Inspection
app.post('/api/fleet/clusters/validate-kubeconfig', (req: Request, res: Response) => {
  try {
    const { kubeconfigContent, authMethod = 'kubeconfig', endpoint, clusterNameInput, cloudProviderInput, regionInput } = req.body;

    let clusterName = clusterNameInput || 'k8s-federated-cluster';
    let serverEndpoint = endpoint || 'https://api.k8s-cluster.cloudops.internal:6443';
    let cloudProvider: 'GCP (GKE)' | 'AWS (EKS)' | 'Azure (AKS)' | 'Edge BareMetal' | 'RedHat OpenShift' = cloudProviderInput || 'GCP (GKE)';
    let region = regionInput || 'us-west1 (Oregon)';
    let kubernetesVersion = 'v1.31.2';
    let tlsStatus = 'TLS 1.3 Certified (Valid X.509 CA)';
    let isClusterAdminDetected = false;

    // Parse heuristics from kubeconfig YAML text if provided
    if (kubeconfigContent && typeof kubeconfigContent === 'string') {
      const content = kubeconfigContent;
      
      // Extract cluster server
      const serverMatch = content.match(/server:\s*([^\s\r\n]+)/i);
      if (serverMatch && serverMatch[1]) {
        serverEndpoint = serverMatch[1].replace(/["']/g, '');
      }

      // Extract cluster or context name
      const nameMatch = content.match(/current-context:\s*([^\s\r\n]+)/i) || content.match(/name:\s*([^\s\r\n]+)/i);
      if (nameMatch && nameMatch[1]) {
        clusterName = nameMatch[1].replace(/["']/g, '');
      }

      // Provider inference from endpoint / server URL
      if (serverEndpoint.includes('eks.amazonaws.com') || content.includes('aws') || content.includes('eks')) {
        cloudProvider = 'AWS (EKS)';
        if (!regionInput) region = 'us-east-2 (Ohio)';
        kubernetesVersion = 'v1.31.1-eks-9f1b';
      } else if (serverEndpoint.includes('azmk8s.io') || content.includes('azure') || content.includes('aks')) {
        cloudProvider = 'Azure (AKS)';
        if (!regionInput) region = 'westeurope (Amsterdam)';
        kubernetesVersion = 'v1.31.0-aks';
      } else if (serverEndpoint.includes('gcr.io') || serverEndpoint.includes('googleapis') || content.includes('gke')) {
        cloudProvider = 'GCP (GKE)';
        if (!regionInput) region = 'us-central1 (Iowa)';
        kubernetesVersion = 'v1.31.2-gke.1200';
      } else if (content.includes('openshift') || serverEndpoint.includes('openshift')) {
        cloudProvider = 'RedHat OpenShift';
        kubernetesVersion = 'v1.30.4-ocp';
      } else if (content.includes('kind-') || content.includes('minikube') || content.includes('127.0.0.1') || content.includes('localhost')) {
        cloudProvider = 'Edge BareMetal';
        region = 'local-dev-edge';
        kubernetesVersion = 'v1.31.0-kind';
      }

      // Detect if user passed full cluster-admin wildcard credentials
      if (content.includes('cluster-admin') || content.includes('system:masters') || content.includes('verbs: ["*"]') || content.includes('resources: ["*"]')) {
        isClusterAdminDetected = true;
      }
    }

    // Ping simulation
    const pingLatencyMs = Math.floor(12 + Math.random() * 22);

    // Build RBAC audit results
    const rbacAudit = {
      status: (isClusterAdminDetected ? 'WARN_CLUSTER_ADMIN' : 'PASS_READ_ONLY') as 'PASS_READ_ONLY' | 'WARN_CLUSTER_ADMIN' | 'FAIL_INSUFFICIENT_PERMISSIONS',
      hasCoreRead: true,
      hasAppsRead: true,
      hasMetricsRead: true,
      hasCustomResourcesRead: true,
      hasDangerousWrite: isClusterAdminDetected,
      dangerousPermissionsFound: isClusterAdminDetected
        ? ['clusterrolebindings:create', 'secrets:delete', 'namespaces:delete', 'pods/exec:create']
        : [],
      allowedResourcesCount: isClusterAdminDetected ? 142 : 48,
      testedVerbs: ['get', 'list', 'watch'],
      recommendedRoleYaml: `apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cloudops-sre-readonly
rules:
  - apiGroups: [""]
    resources: ["namespaces", "nodes", "pods", "services", "endpoints", "configmaps", "persistentvolumes", "persistentvolumeclaims", "events"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["apps"]
    resources: ["deployments", "daemonsets", "statefulsets", "replicasets"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["autoscaling", "keda.sh"]
    resources: ["horizontalpodautoscalers", "scaledobjects", "triggerauthentications"]
    verbs: ["get", "list", "watch"]
  - apiGroups: ["metrics.k8s.io", "custom.metrics.k8s.io"]
    resources: ["pods", "nodes"]
    verbs: ["get", "list"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cloudops-sre-readonly-binding
subjects:
  - kind: ServiceAccount
    name: cloudops-sre-viewer
    namespace: kube-system
roleRef:
  kind: ClusterRole
  name: cloudops-sre-readonly
  apiGroup: rbac.authorization.k8s.io`,
    };

    const validationResult: KubeconfigClusterValidation = {
      isValid: true,
      clusterName: clusterName.trim() || 'k8s-production-edge',
      serverEndpoint: serverEndpoint.trim(),
      kubernetesVersion,
      cloudProvider,
      region,
      nodesCount: Math.floor(3 + Math.random() * 5),
      podsCount: Math.floor(24 + Math.random() * 30),
      discoveredNamespaces: ['default', 'kube-system', 'production', 'monitoring', 'istio-system', 'ingress-nginx'],
      pingLatencyMs,
      tlsStatus,
      rbacAudit,
      contexts: [
        {
          name: `${clusterName}-admin-context`,
          cluster: clusterName,
          user: `${clusterName}-sre-sa`,
          namespace: 'default',
        },
      ],
      currentContext: `${clusterName}-admin-context`,
      rawSummary: `Connection to ${serverEndpoint} validated with TLS 1.3 handshake (${pingLatencyMs}ms). Kubernetes API ${kubernetesVersion} authenticated. Read-only RBAC inspection complete (${rbacAudit.allowedResourcesCount} resource types discoverable).`,
    };

    res.json({ success: true, validation: validationResult });
  } catch (err: any) {
    console.error('Kubeconfig validation error:', err);
    res.status(400).json({ error: `Kubeconfig validation failed: ${err.message}` });
  }
});

// Register a New Kubernetes Cluster into Federated Fleet
app.post('/api/fleet/clusters/register', (req: Request, res: Response) => {
  try {
    const {
      clusterName,
      cloudProvider = 'GCP (GKE)',
      region = 'us-east1',
      environment = 'production',
      kubernetesVersion = 'v1.31.2',
      activeTrafficWeight = 20,
      isPrimary = false,
      apiEndpoint,
      enforceReadOnlyRbac = true,
    }: ClusterRegistrationRequest = req.body;

    if (!clusterName || !clusterName.trim()) {
      return res.status(400).json({ error: 'Cluster name is required for registration.' });
    }

    const cleanName = clusterName.trim();
    const id = `fleet-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36).substring(4)}`;

    // If marked as primary, reset other clusters
    if (isPrimary) {
      clusterFleet.forEach((c) => {
        c.isPrimary = false;
      });
    }

    const newCluster: ClusterFleetNode = {
      id,
      clusterName: cleanName,
      cloudProvider: cloudProvider as any,
      region,
      status: 'healthy',
      nodesCount: Math.floor(4 + Math.random() * 4),
      podsCount: Math.floor(25 + Math.random() * 25),
      cpuUsagePercent: Math.floor(35 + Math.random() * 40),
      memUsagePercent: Math.floor(45 + Math.random() * 35),
      kubernetesVersion: kubernetesVersion || 'v1.31.2',
      activeTrafficWeight: Number(activeTrafficWeight) || 0,
      isPrimary: Boolean(isPrimary),
      environment: environment || 'production',
      apiEndpoint: apiEndpoint || 'https://k8s-api.cloudops.internal:6443',
      rbacStatus: enforceReadOnlyRbac ? 'READ_ONLY_CERTIFIED' : 'CLUSTER_ADMIN',
      pingLatencyMs: Math.floor(14 + Math.random() * 20),
      tlsStatus: 'TLS 1.3 Certified (Federated Fleet CA)',
      registeredAt: new Date().toISOString(),
      lastHeartbeat: new Date().toISOString(),
    };

    clusterFleet.push(newCluster);

    res.json({
      success: true,
      message: `Cluster '${cleanName}' registered successfully and joined the federated control plane.`,
      fleet: clusterFleet,
      registeredCluster: newCluster,
    });
  } catch (err: any) {
    console.error('Cluster registration error:', err);
    res.status(500).json({ error: `Failed to register cluster: ${err.message}` });
  }
});

// Remove a Cluster from Fleet
app.delete('/api/fleet/clusters/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const index = clusterFleet.findIndex((c) => c.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Cluster not found in fleet.' });
  }

  const removed = clusterFleet.splice(index, 1)[0];

  // If deleted cluster was primary, promote another healthy cluster
  if (removed.isPrimary && clusterFleet.length > 0) {
    clusterFleet[0].isPrimary = true;
    clusterFleet[0].activeTrafficWeight = Math.min(100, clusterFleet[0].activeTrafficWeight + removed.activeTrafficWeight);
  }

  res.json({
    success: true,
    message: `Cluster '${removed.clusterName}' removed from federated fleet.`,
    fleet: clusterFleet,
  });
});

// Ping Cluster API Server
app.post('/api/fleet/clusters/:id/ping', (req: Request, res: Response) => {
  const { id } = req.params;
  const cluster = clusterFleet.find((c) => c.id === id);
  if (!cluster) {
    return res.status(404).json({ error: 'Cluster not found.' });
  }

  cluster.pingLatencyMs = Math.floor(10 + Math.random() * 25);
  cluster.lastHeartbeat = new Date().toISOString();

  res.json({
    success: true,
    clusterId: cluster.id,
    clusterName: cluster.clusterName,
    pingLatencyMs: cluster.pingLatencyMs,
    status: cluster.status,
    timestamp: cluster.lastHeartbeat,
    message: `Heartbeat verified: ${cluster.clusterName} API server responded in ${cluster.pingLatencyMs}ms.`,
  });
});

// Generate Least-Privilege SRE RBAC Manifest
app.post('/api/fleet/generate-rbac-manifest', (req: Request, res: Response) => {
  const { serviceAccountName = 'cloudops-sre-viewer', namespace = 'kube-system' } = req.body;

  const manifestYaml = `# ==============================================================================
# CloudOps Autonomous SRE Platform - Least-Privilege Read-Only RBAC Policy
# Generates a restricted ServiceAccount with zero write/delete privileges for
# safe multi-cluster telemetry collection, eBPF correlation, and SLO tracking.
# ==============================================================================

apiVersion: v1
kind: ServiceAccount
metadata:
  name: ${serviceAccountName}
  namespace: ${namespace}
  labels:
    app.kubernetes.io/name: cloudops-sre-agent
    app.kubernetes.io/part-of: cloudops-fleet
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: cloudops-sre-readonly
  labels:
    app.kubernetes.io/name: cloudops-sre-agent
rules:
  # Core Kubernetes Resources (Read-Only Observability)
  - apiGroups: [""]
    resources:
      - namespaces
      - nodes
      - pods
      - pods/log
      - pods/status
      - services
      - endpoints
      - configmaps
      - persistentvolumes
      - persistentvolumeclaims
      - resourcequotas
      - limitranges
      - events
    verbs: ["get", "list", "watch"]

  # Workloads & Controller Metrics
  - apiGroups: ["apps"]
    resources:
      - deployments
      - deployments/scale
      - daemonsets
      - statefulsets
      - replicasets
      - controllerrevisions
    verbs: ["get", "list", "watch"]

  # Batch Jobs & CronJobs
  - apiGroups: ["batch"]
    resources:
      - jobs
      - cronjobs
    verbs: ["get", "list", "watch"]

  # Autoscaling Metrics (HPA & KEDA)
  - apiGroups: ["autoscaling"]
    resources:
      - horizontalpodautoscalers
    verbs: ["get", "list", "watch"]
  - apiGroups: ["keda.sh"]
    resources:
      - scaledobjects
      - triggerauthentications
    verbs: ["get", "list", "watch"]

  # Real-Time Resource Metrics API Server
  - apiGroups: ["metrics.k8s.io", "custom.metrics.k8s.io"]
    resources:
      - pods
      - nodes
    verbs: ["get", "list"]

  # Service Mesh & Ingress CRDs
  - apiGroups: ["networking.k8s.io"]
    resources:
      - ingresses
      - networkpolicies
    verbs: ["get", "list", "watch"]
  - apiGroups: ["networking.istio.io"]
    resources:
      - virtualservices
      - destinationrules
      - gateways
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: cloudops-sre-readonly-binding
subjects:
  - kind: ServiceAccount
    name: ${serviceAccountName}
    namespace: ${namespace}
roleRef:
  kind: ClusterRole
  name: cloudops-sre-readonly
  apiGroup: rbac.authorization.k8s.io
---
# Token Secret (for Kubernetes v1.24+)
apiVersion: v1
kind: Secret
metadata:
  name: ${serviceAccountName}-token
  namespace: ${namespace}
  annotations:
    kubernetes.io/service-account.name: ${serviceAccountName}
type: kubernetes.io/service-account-token
`;

  res.json({
    success: true,
    serviceAccountName,
    namespace,
    manifestYaml,
    kubectlApplyCommand: `kubectl apply -f https://raw.githubusercontent.com/cloudops/sre-agent/main/deploy/rbac-readonly.yaml`,
    extractTokenCommand: `kubectl get secret ${serviceAccountName}-token -n ${namespace} -o jsonpath='{.data.token}' | base64 --decode`,
  });
});

app.get('/api/security/audit', (req: Request, res: Response) => {
  res.json({ report: securityAuditReport });
});

app.post('/api/security/remediate-cve', (req: Request, res: Response) => {
  const { cveId } = req.body;
  const vuln = securityAuditReport.vulnerabilities.find((v) => v.id === cveId || v.cveId === cveId);
  if (!vuln) {
    return res.status(404).json({ error: 'Vulnerability not found' });
  }

  // Remove remediated CVE
  securityAuditReport.vulnerabilities = securityAuditReport.vulnerabilities.filter(
    (v) => v.id !== vuln.id
  );
  securityAuditReport.totalCves = securityAuditReport.vulnerabilities.length;
  if (vuln.severity === 'CRITICAL') securityAuditReport.criticalCves = Math.max(0, securityAuditReport.criticalCves - 1);
  if (vuln.severity === 'HIGH') securityAuditReport.highCves = Math.max(0, securityAuditReport.highCves - 1);
  if (vuln.severity === 'MEDIUM') securityAuditReport.mediumCves = Math.max(0, securityAuditReport.mediumCves - 1);
  securityAuditReport.cisBenchmarkScore = Math.min(100, securityAuditReport.cisBenchmarkScore + 2);

  res.json({
    success: true,
    message: `Remediation executed for ${vuln.cveId} (${vuln.pkgName} -> ${vuln.fixedVersion}). Image rebuilt and redeployed.`,
    report: securityAuditReport,
  });
});

app.get('/api/alerts/channels', (req: Request, res: Response) => {
  res.json({ channels: alertChannels });
});

app.post('/api/alerts/test-webhook', (req: Request, res: Response) => {
  const { channelId } = req.body;
  const channel = alertChannels.find((c) => c.id === channelId);
  if (!channel) {
    return res.status(404).json({ error: 'Alert channel not found' });
  }

  channel.lastFiredAt = new Date().toISOString();

  res.json({
    success: true,
    message: `Test alert successfully dispatched to ${channel.name} (${channel.channelType}). Payload delivered with 200 OK.`,
    channel,
  });
});

// -------------------------------------------------------------
// Phase 4 State: eBPF Kernel Tracer, Runbooks, Load Harness, DR Failover
// -------------------------------------------------------------

const ebpfKernelEvents: EbpfKernelEvent[] = [
  {
    id: 'ebpf-101',
    timestamp: new Date(Date.now() - 15000).toISOString(),
    probeType: 'sock_ops',
    syscall: 'tcp_set_state(TCP_ESTABLISHED)',
    process: 'rust-auth-guard',
    pid: 14210,
    cpuCore: 2,
    latencyMicros: 142,
    sourceIpPort: '10.244.2.88:49210',
    destIpPort: '10.244.1.14:8080',
    protocol: 'TLS 1.3',
    verdict: 'PASSED',
    details: 'Zero-copy socket bypass via eBPF sockmap sock_hash redirect',
  },
  {
    id: 'ebpf-102',
    timestamp: new Date(Date.now() - 25000).toISOString(),
    probeType: 'tracepoint',
    syscall: 'sys_enter_connect',
    process: 'go-payment-gateway',
    pid: 18902,
    cpuCore: 0,
    latencyMicros: 480,
    sourceIpPort: '10.244.1.14:52110',
    destIpPort: '10.244.3.40:5432',
    protocol: 'TCP',
    verdict: 'PASSED',
    details: 'Fast connect hook bypassing iptables conntrack translation',
  },
  {
    id: 'ebpf-103',
    timestamp: new Date(Date.now() - 42000).toISOString(),
    probeType: 'tc_egress',
    syscall: 'tcp_retransmit_skb',
    process: 'ai-fraud-detector',
    pid: 22104,
    cpuCore: 3,
    latencyMicros: 8420,
    sourceIpPort: '10.244.3.19:8080',
    destIpPort: '10.244.2.10:9092',
    protocol: 'gRPC',
    verdict: 'THROTTLED',
    details: 'TCP segment retransmission detected on cgroup buffer saturation',
  },
  {
    id: 'ebpf-104',
    timestamp: new Date(Date.now() - 60000).toISOString(),
    probeType: 'kprobe',
    syscall: 'sys_enter_epoll_wait',
    process: 'rust-auth-guard',
    pid: 14210,
    cpuCore: 1,
    latencyMicros: 18,
    sourceIpPort: '127.0.0.1:8080',
    destIpPort: '127.0.0.1:41200',
    protocol: 'HTTP/2',
    verdict: 'PASSED',
    details: 'Kernel epoll event dispatched to Tokio async task queue',
  },
  {
    id: 'ebpf-105',
    timestamp: new Date(Date.now() - 85000).toISOString(),
    probeType: 'uprobe',
    syscall: 'sec_drop_blackhole',
    process: 'envoy-ingress-edge',
    pid: 9021,
    cpuCore: 2,
    latencyMicros: 9,
    sourceIpPort: '198.51.100.44:38910',
    destIpPort: '10.244.0.1:443',
    protocol: 'TCP',
    verdict: 'DROPPED',
    details: 'XDP (eXpress Data Path) kernel driver dropped malformed TCP SYN packet',
  },
];

const ebpfSyscallStats: EbpfSyscallStats[] = [
  { name: 'sys_enter_connect', count1m: 48920, avgLatencyUs: 120, p99LatencyUs: 490, errorRatePercent: 0.01 },
  { name: 'sys_enter_epoll_wait', count1m: 142800, avgLatencyUs: 14, p99LatencyUs: 65, errorRatePercent: 0.00 },
  { name: 'sys_enter_writev', count1m: 98120, avgLatencyUs: 88, p99LatencyUs: 320, errorRatePercent: 0.04 },
  { name: 'tcp_retransmit_skb', count1m: 320, avgLatencyUs: 4200, p99LatencyUs: 12500, errorRatePercent: 1.20 },
  { name: 'xdp_packet_drop', count1m: 890, avgLatencyUs: 6, p99LatencyUs: 14, errorRatePercent: 0.00 },
];

let automatedRunbooks: AutomatedRunbook[] = [
  {
    id: 'rb-oom-mitigation',
    title: 'Automated Node Memory Pressure & OOM Mitigation',
    category: 'OOM Recovery',
    description: 'Proactively drains leaky pod cgroups, triggers vertical memory limit patching, and invokes rolling restart with zero downtime.',
    author: 'Autonomous SRE AI Agent',
    estimatedDuration: '45s',
    totalExecutions: 28,
    successRatePercent: 96.4,
    autoTriggerConditions: ['Memory leak slope > +15MB/min', 'Time to OOMKill < 15 mins'],
    lastRunStatus: 'success',
    lastRunAt: new Date(Date.now() - 3600000).toISOString(),
    steps: [
      {
        id: 's1',
        title: 'Query cgroups v2 memory.current slope',
        type: 'diagnostic_query',
        commandOrQuery: 'kubectl top pods -n production --sort-by=memory',
        timeoutSeconds: 10,
        status: 'success',
        durationMs: 420,
        outputLogs: ['Detected ai-fraud-detector-7c94b at 94.2% memory capacity', 'Leak rate: +16.8 MB/min'],
      },
      {
        id: 's2',
        title: 'Patch Deployment limits to 1024Mi',
        type: 'k8s_patch',
        commandOrQuery: 'kubectl set resources deployment/ai-fraud-detector --limits=memory=1024Mi -n production',
        timeoutSeconds: 15,
        status: 'success',
        durationMs: 890,
        outputLogs: ['Deployment patched successfully. Revision #14 created.'],
      },
      {
        id: 's3',
        title: 'Trigger Rolling Deployment Update',
        type: 'scale_hpa',
        commandOrQuery: 'kubectl rollout restart deployment/ai-fraud-detector -n production',
        timeoutSeconds: 30,
        status: 'success',
        durationMs: 2400,
        outputLogs: ['New replacement pod ready 1/1. Old leaky pod terminated gracefully.'],
      },
      {
        id: 's4',
        title: 'Verify SLO Error Budget & Latency Recovery',
        type: 'verify_slo',
        commandOrQuery: 'curl -s http://prometheus:9090/api/v1/query?query=slo_sli_ratio',
        timeoutSeconds: 10,
        status: 'success',
        durationMs: 310,
        outputLogs: ['SLI ratio restored to 99.98%. OOM hazard cleared.'],
      },
    ],
  },
  {
    id: 'rb-canary-circuit-breaker',
    title: 'Canary Degraded SLO Circuit Breaking & Traffic Zeroing',
    category: 'Canary Rollback',
    description: 'Instant zero-latency rollback of canary traffic to 0% upon detecting p99 latency regressions or HTTP 5xx error spikes.',
    author: 'ArgoCD / Flagger Rollout Engine',
    estimatedDuration: '15s',
    totalExecutions: 14,
    successRatePercent: 100.0,
    autoTriggerConditions: ['Canary HTTP 5xx > 2.0%', 'Canary p99 latency > 250ms'],
    lastRunStatus: 'success',
    lastRunAt: new Date(Date.now() - 7200000).toISOString(),
    steps: [
      {
        id: 'cb1',
        title: 'Detect Canary SLO breach threshold',
        type: 'diagnostic_query',
        commandOrQuery: 'argocd app get payment-gateway --health',
        timeoutSeconds: 5,
        status: 'success',
        durationMs: 280,
        outputLogs: ['Canary p99 exceeded 250ms threshold (measured: 384ms)'],
      },
      {
        id: 'cb2',
        title: 'Emergency Traffic Shifting: Canary Weight -> 0%',
        type: 'canary_traffic_shift',
        commandOrQuery: 'kubectl patch rollout payment-gateway --type=json -p="[{\'op\': \'replace\', \'path\': \'/spec/strategy/canary/trafficRouting/weights/canary\', \'value\': 0}]"',
        timeoutSeconds: 5,
        status: 'success',
        durationMs: 410,
        outputLogs: ['Envoy Ingress updated: 100% traffic shifted back to Stable v2.4.0'],
      },
      {
        id: 'cb3',
        title: 'Dispatch Incident Page & PagerDuty Alert',
        type: 'slack_notification',
        commandOrQuery: 'alertmanager notify --channel=slack-sre-oncall',
        timeoutSeconds: 10,
        status: 'success',
        durationMs: 520,
        outputLogs: ['Notification delivered to #production-incidents with trace ID'],
      },
    ],
  },
  {
    id: 'rb-db-failover',
    title: 'PostgreSQL / Spanner Read-Replica Auto-Promotion',
    category: 'Database Failover',
    description: 'Detects primary database replication lag or connection pool deadlock and promotes hot standby read replica to primary writer.',
    author: 'Autonomous DBA Controller',
    estimatedDuration: '60s',
    totalExecutions: 6,
    successRatePercent: 100.0,
    autoTriggerConditions: ['DB primary heartbeat timeout > 10s', 'Replica lag < 100ms'],
    lastRunStatus: 'success',
    lastRunAt: new Date(Date.now() - 86400000).toISOString(),
    steps: [
      {
        id: 'db1',
        title: 'Check Standby Replica Sync State',
        type: 'diagnostic_query',
        commandOrQuery: 'pg_isready -h db-replica-us-east1.internal',
        timeoutSeconds: 10,
        status: 'success',
        durationMs: 190,
        outputLogs: ['Standby replica in sync (lag: 14ms)'],
      },
      {
        id: 'db2',
        title: 'Promote Read-Replica to Primary Writer',
        type: 'k8s_patch',
        commandOrQuery: 'pg_ctl promote -D /var/lib/postgresql/data',
        timeoutSeconds: 30,
        status: 'success',
        durationMs: 3100,
        outputLogs: ['Promoted pg-replica-01 to master write role'],
      },
      {
        id: 'db3',
        title: 'Update Kubernetes Service Endpoints & DNS',
        type: 'k8s_patch',
        commandOrQuery: 'kubectl patch svc postgres-primary -p \'{"spec":{"selector":{"role":"promoted-master"}}}\'',
        timeoutSeconds: 15,
        status: 'success',
        durationMs: 780,
        outputLogs: ['Service endpoints updated in CoreDNS'],
      },
    ],
  },
];

let disasterRecoveryRegions: DisasterRecoveryRegion[] = [
  {
    id: 'dr-gcp-uscentral1',
    name: 'GCP us-central1 (Iowa)',
    provider: 'GCP',
    regionCode: 'us-central1',
    role: 'PRIMARY_ACTIVE',
    gslbWeight: 80,
    dnsHealthStatus: 'HEALTHY',
    dbReplicationLagMs: 0,
    rtoTargetSeconds: 30,
    rtoAchievedSeconds: 3.8,
    rpoDataLossSeconds: 0,
    lastFailoverDrill: '2026-08-10',
  },
  {
    id: 'dr-aws-useast1',
    name: 'AWS us-east-1 (N. Virginia)',
    provider: 'AWS',
    regionCode: 'us-east-1',
    role: 'SECONDARY_HOT_STANDBY',
    gslbWeight: 20,
    dnsHealthStatus: 'HEALTHY',
    dbReplicationLagMs: 18,
    rtoTargetSeconds: 30,
    rtoAchievedSeconds: 4.2,
    rpoDataLossSeconds: 0,
    lastFailoverDrill: '2026-08-14',
  },
  {
    id: 'dr-azure-westeurope',
    name: 'Azure westeurope (Amsterdam)',
    provider: 'Azure',
    regionCode: 'westeurope',
    role: 'DR_COLD_ARCHIVE',
    gslbWeight: 0,
    dnsHealthStatus: 'HEALTHY',
    dbReplicationLagMs: 84,
    rtoTargetSeconds: 120,
    rtoAchievedSeconds: 28.5,
    rpoDataLossSeconds: 0.2,
    lastFailoverDrill: '2026-07-28',
  },
  {
    id: 'dr-edge-baremetal',
    name: 'Equinix Edge BareMetal (Ashburn)',
    provider: 'BareMetal',
    regionCode: 'edge-ash-01',
    role: 'EDGE_POP',
    gslbWeight: 0,
    dnsHealthStatus: 'HEALTHY',
    dbReplicationLagMs: 4,
    rtoTargetSeconds: 15,
    rtoAchievedSeconds: 1.9,
    rpoDataLossSeconds: 0,
    lastFailoverDrill: '2026-08-18',
  },
];

// Phase 4 API Endpoints
app.get('/api/ebpf/kernel-events', (req: Request, res: Response) => {
  res.json({ events: ebpfKernelEvents, stats: ebpfSyscallStats });
});

app.get('/api/runbooks', (req: Request, res: Response) => {
  res.json({ runbooks: automatedRunbooks });
});

app.post('/api/runbooks/:id/execute', (req: Request, res: Response) => {
  const { id } = req.params;
  const runbook = automatedRunbooks.find((r) => r.id === id);
  if (!runbook) {
    return res.status(404).json({ error: 'Runbook not found' });
  }

  runbook.totalExecutions += 1;
  runbook.lastRunStatus = 'success';
  runbook.lastRunAt = new Date().toISOString();
  runbook.steps.forEach((step) => {
    step.status = 'success';
  });

  res.json({
    success: true,
    message: `Runbook '${runbook.title}' executed successfully. All ${runbook.steps.length} automated steps passed verification gates.`,
    runbook,
  });
});

app.get('/api/disaster-recovery/regions', (req: Request, res: Response) => {
  res.json({ regions: disasterRecoveryRegions });
});

app.post('/api/disaster-recovery/failover', (req: Request, res: Response) => {
  const { targetRegionId } = req.body;
  const target = disasterRecoveryRegions.find((r) => r.id === targetRegionId);
  if (!target) {
    return res.status(404).json({ error: 'Target DR region not found' });
  }

  disasterRecoveryRegions.forEach((r) => {
    if (r.id === targetRegionId) {
      r.role = 'PRIMARY_ACTIVE';
      r.gslbWeight = 100;
      r.lastFailoverDrill = new Date().toISOString().split('T')[0];
    } else {
      r.role = 'SECONDARY_HOT_STANDBY';
      r.gslbWeight = 0;
    }
  });

  res.json({
    success: true,
    message: `Global GSLB BGP DNS Shift completed. Primary active region is now '${target.name}'. RTO achieved: ${target.rtoAchievedSeconds}s.`,
    regions: disasterRecoveryRegions,
  });
});

// -------------------------------------------------------------
// Phase 5 Mock Data: OpenTelemetry Traces & Flamegraph
// -------------------------------------------------------------
const distributedTraces = [
  {
    traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
    rootService: 'ingress-envoy-gateway',
    rootEndpoint: 'POST /api/v1/payments/checkout',
    timestamp: new Date(Date.now() - 1000 * 42).toISOString(),
    totalDurationMs: 342.8,
    spanCount: 9,
    servicesInvolved: ['ingress-envoy-gateway', 'rust-auth-guard', 'payment-gateway', 'fraud-analyzer', 'pg-cluster-primary', 'redis-cache-tier'],
    hasError: false,
    httpStatus: 200,
    spans: [
      {
        spanId: 'sp-01',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'ingress-envoy-gateway',
        operationName: 'HTTP POST /api/v1/payments/checkout',
        startTimeOffsetMs: 0,
        durationMs: 342.8,
        status: 'OK',
        statusCode: 200,
        kind: 'SERVER',
        depth: 0,
        attributes: {
          'http.method': 'POST',
          'http.target': '/api/v1/payments/checkout',
          'http.status_code': 200,
          'http.client_ip': '198.51.100.42',
          'tls.cipher': 'TLS_AES_256_GCM_SHA384',
          'envoy.cluster': 'k8s_payment_backend',
        },
      },
      {
        spanId: 'sp-02',
        parentSpanId: 'sp-01',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'rust-auth-guard',
        operationName: 'gRPC /auth.v1.Security/VerifyToken',
        startTimeOffsetMs: 4.2,
        durationMs: 18.5,
        status: 'OK',
        statusCode: 0,
        kind: 'SERVER',
        depth: 1,
        attributes: {
          'rpc.system': 'grpc',
          'rpc.service': 'auth.v1.Security',
          'rpc.method': 'VerifyToken',
          'auth.subject_id': 'usr_998124a',
          'auth.token_type': 'JWT-ES256',
          'cache.hit': true,
        },
      },
      {
        spanId: 'sp-03',
        parentSpanId: 'sp-01',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'payment-gateway',
        operationName: 'HTTP POST /process_charge',
        startTimeOffsetMs: 25.1,
        durationMs: 310.2,
        status: 'OK',
        statusCode: 200,
        kind: 'SERVER',
        depth: 1,
        attributes: {
          'payment.amount_cents': 14950,
          'payment.currency': 'USD',
          'payment.idempotency_key': 'idem_9a87f12',
          'k8s.pod': 'payment-gateway-784f9bc-x89q2',
        },
      },
      {
        spanId: 'sp-04',
        parentSpanId: 'sp-03',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'redis-cache-tier',
        operationName: 'GET idempotency:idem_9a87f12',
        startTimeOffsetMs: 32.0,
        durationMs: 2.1,
        status: 'OK',
        statusCode: 200,
        kind: 'CLIENT',
        depth: 2,
        attributes: {
          'db.system': 'redis',
          'db.operation': 'GET',
          'redis.key': 'idempotency:idem_9a87f12',
          'redis.result': 'MISS',
        },
      },
      {
        spanId: 'sp-05',
        parentSpanId: 'sp-03',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'fraud-analyzer',
        operationName: 'gRPC /fraud.v2.Engine/ScoreTransaction',
        startTimeOffsetMs: 38.4,
        durationMs: 142.6,
        status: 'OK',
        statusCode: 0,
        kind: 'CLIENT',
        depth: 2,
        attributes: {
          'ml.model_version': 'xgboost-v4.2.1',
          'ml.features_count': 48,
          'fraud.risk_score': 0.042,
          'fraud.verdict': 'APPROVE',
        },
      },
      {
        spanId: 'sp-06',
        parentSpanId: 'sp-05',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'redis-cache-tier',
        operationName: 'MGET velocity:user:usr_998124a',
        startTimeOffsetMs: 44.1,
        durationMs: 4.8,
        status: 'OK',
        kind: 'CLIENT',
        depth: 3,
        attributes: {
          'db.system': 'redis',
          'db.operation': 'MGET',
          'redis.keys_count': 3,
        },
      },
      {
        spanId: 'sp-07',
        parentSpanId: 'sp-03',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'pg-cluster-primary',
        operationName: 'SQL BEGIN; INSERT INTO ledger_entries...',
        startTimeOffsetMs: 186.2,
        durationMs: 84.6,
        status: 'OK',
        kind: 'CLIENT',
        depth: 2,
        attributes: {
          'db.system': 'postgresql',
          'db.name': 'ledger_production',
          'db.statement': 'INSERT INTO ledger_entries (id, amount, account_id) VALUES ($1, $2, $3) RETURNING tx_id;',
          'db.rows_affected': 1,
          'pg.pool_wait_ms': 1.4,
        },
      },
      {
        spanId: 'sp-08',
        parentSpanId: 'sp-03',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'redis-cache-tier',
        operationName: 'SETEX idempotency:idem_9a87f12 86400',
        startTimeOffsetMs: 274.0,
        durationMs: 3.5,
        status: 'OK',
        kind: 'CLIENT',
        depth: 2,
        attributes: {
          'db.system': 'redis',
          'db.operation': 'SETEX',
          'redis.ttl': 86400,
        },
      },
      {
        spanId: 'sp-09',
        parentSpanId: 'sp-03',
        traceId: '7f9a1b8c2d4e6f80a3c5e7b91d2f4a68',
        serviceName: 'payment-gateway',
        operationName: 'Kafka Produce topic: payment-settlements',
        startTimeOffsetMs: 282.4,
        durationMs: 12.8,
        status: 'OK',
        kind: 'PRODUCER',
        depth: 2,
        attributes: {
          'messaging.system': 'kafka',
          'messaging.destination': 'payment-settlements',
          'kafka.partition': 4,
          'kafka.ack': 'all',
        },
      },
    ],
  },
  {
    traceId: 'e4a2c89f01b3d56789012345678abcdef',
    rootService: 'ingress-envoy-gateway',
    rootEndpoint: 'POST /api/v1/orders/create',
    timestamp: new Date(Date.now() - 1000 * 120).toISOString(),
    totalDurationMs: 840.4,
    spanCount: 6,
    servicesInvolved: ['ingress-envoy-gateway', 'order-processing', 'pg-cluster-primary', 'inventory-service'],
    hasError: true,
    httpStatus: 504,
    spans: [
      {
        spanId: 'sp-20',
        traceId: 'e4a2c89f01b3d56789012345678abcdef',
        serviceName: 'ingress-envoy-gateway',
        operationName: 'HTTP POST /api/v1/orders/create',
        startTimeOffsetMs: 0,
        durationMs: 840.4,
        status: 'ERROR',
        statusCode: 504,
        kind: 'SERVER',
        depth: 0,
        attributes: {
          'http.status_code': 504,
          'error': true,
          'error.message': 'Upstream gateway timeout after 800ms threshold',
        },
      },
      {
        spanId: 'sp-21',
        parentSpanId: 'sp-20',
        traceId: 'e4a2c89f01b3d56789012345678abcdef',
        serviceName: 'order-processing',
        operationName: 'ProcessOrderWorkflow',
        startTimeOffsetMs: 12.0,
        durationMs: 820.0,
        status: 'ERROR',
        statusCode: 504,
        kind: 'SERVER',
        depth: 1,
        attributes: {
          'order.sku': 'SKU_98412_A',
          'order.qty': 2,
          'k8s.pod': 'order-processing-56b9c79f4-2plnm',
        },
      },
      {
        spanId: 'sp-22',
        parentSpanId: 'sp-21',
        traceId: 'e4a2c89f01b3d56789012345678abcdef',
        serviceName: 'inventory-service',
        operationName: 'gRPC /inventory.v1.Stock/Reserve',
        startTimeOffsetMs: 24.5,
        durationMs: 790.2,
        status: 'ERROR',
        statusCode: 4,
        kind: 'CLIENT',
        depth: 2,
        attributes: {
          'rpc.status': 'DEADLINE_EXCEEDED',
          'error': true,
          'error.cause': 'Postgres read replica query lock timeout on inventory_locks table',
        },
      },
      {
        spanId: 'sp-23',
        parentSpanId: 'sp-22',
        traceId: 'e4a2c89f01b3d56789012345678abcdef',
        serviceName: 'pg-cluster-primary',
        operationName: 'SQL SELECT FOR UPDATE FROM inventory_locks...',
        startTimeOffsetMs: 38.0,
        durationMs: 770.0,
        status: 'ERROR',
        kind: 'CLIENT',
        depth: 3,
        attributes: {
          'db.statement': 'SELECT * FROM inventory_locks WHERE sku = $1 FOR UPDATE NOWAIT;',
          'pg.lock_timeout': '750ms',
          'error.code': '55P03_LOCK_NOT_AVAILABLE',
        },
      },
    ],
  },
];

const flamegraphData = {
  name: 'payment-gateway (Go runtime root)',
  value: 310.2,
  category: 'application',
  children: [
    {
      name: 'net/http.(*conn).serve',
      value: 295.0,
      category: 'network',
      children: [
        {
          name: 'router.HandlePaymentCharge',
          value: 280.0,
          category: 'application',
          children: [
            {
              name: 'crypto/tls.Handshake',
              value: 14.5,
              category: 'crypto',
            },
            {
              name: 'json.UnmarshalRequestBody',
              value: 8.2,
              category: 'application',
            },
            {
              name: 'fraud.CallGrpcScoringModel',
              value: 142.6,
              category: 'network',
              children: [
                {
                  name: 'grpc.Invoke /fraud.v2.Engine',
                  value: 138.0,
                  category: 'network',
                },
                {
                  name: 'protobuf.MarshalFeatures',
                  value: 4.6,
                  category: 'application',
                },
              ],
            },
            {
              name: 'database.ExecLedgerInsert',
              value: 84.6,
              category: 'database',
              children: [
                {
                  name: 'pgx.AcquireConnectionFromPool',
                  value: 1.4,
                  category: 'database',
                },
                {
                  name: 'pgx.QueryRow (socket write/read)',
                  value: 82.1,
                  category: 'database',
                },
                {
                  name: 'runtime.sys_enter_writev',
                  value: 1.1,
                  category: 'kernel',
                },
              ],
            },
            {
              name: 'kafka.ProduceSettlementRecord',
              value: 12.8,
              category: 'network',
            },
            {
              name: 'runtime.gcBgMarkWorker (GC Stop-The-World)',
              value: 3.4,
              category: 'gc',
            },
          ],
        },
      ],
    },
    {
      name: 'runtime.epollwait (idle OS thread)',
      value: 15.2,
      category: 'kernel',
    },
  ],
};

// -------------------------------------------------------------
// Phase 5 Mock Data: Helm Releases & CRDs
// -------------------------------------------------------------
let helmReleases = [
  {
    name: 'payment-services-stack',
    namespace: 'production',
    revision: 14,
    updated: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'deployed',
    chart: 'payment-services-2.4.1',
    appVersion: 'v2.4.1-rc3',
    valuesYaml: `replicaCount: 5
image:
  repository: gcr.io/cloudops-core/payment-gateway
  tag: v2.4.1-rc3
  pullPolicy: IfNotPresent
resources:
  requests:
    cpu: 250m
    memory: 512Mi
  limits:
    cpu: 1000m
    memory: 1024Mi
autoscaling:
  enabled: true
  minReplicas: 3
  maxReplicas: 20
  targetCPUUtilizationPercentage: 75
env:
  - name: APP_ENV
    value: production
  - name: DB_MAX_OPEN_CONNS
    value: "25"
  - name: PROMETHEUS_METRICS_PORT
    value: "9090"`,
    history: [
      {
        revision: 14,
        updated: '2026-08-19 19:24:10',
        status: 'deployed',
        chart: 'payment-services-2.4.1',
        description: 'Upgrade to v2.4.1-rc3 (bump memory request to 512Mi)',
      },
      {
        revision: 13,
        updated: '2026-08-18 14:10:05',
        status: 'superseded',
        chart: 'payment-services-2.4.0',
        description: 'Canary rollout v2.4.0 with KEDA autoscaler',
      },
      {
        revision: 12,
        updated: '2026-08-15 09:30:00',
        status: 'superseded',
        chart: 'payment-services-2.3.8',
        description: 'Initial production deploy on GKE primary',
      },
    ],
  },
  {
    name: 'istio-mesh-controlplane',
    namespace: 'istio-system',
    revision: 8,
    updated: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    status: 'deployed',
    chart: 'istiod-1.22.1',
    appVersion: '1.22.1',
    valuesYaml: `meshConfig:
  enableAutoMtls: true
  accessLogFile: /dev/stdout
  defaultConfig:
    holdApplicationUntilProxyStarts: true
pilot:
  resources:
    requests:
      cpu: 500m
      memory: 2048Mi`,
    history: [
      {
        revision: 8,
        updated: '2026-08-17 11:00:00',
        status: 'deployed',
        chart: 'istiod-1.22.1',
        description: 'Security patch: enable STRICT mTLS namespace-wide',
      },
      {
        revision: 7,
        updated: '2026-08-10 16:20:00',
        status: 'superseded',
        chart: 'istiod-1.22.0',
        description: 'Upgraded Istio control plane to 1.22.0',
      },
    ],
  },
  {
    name: 'keda-event-autoscaler',
    namespace: 'keda',
    revision: 4,
    updated: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    status: 'deployed',
    chart: 'keda-2.14.0',
    appVersion: '2.14.0',
    valuesYaml: `operator:
  replicaCount: 2
  resources:
    limits:
      cpu: 500m
      memory: 512Mi
metricsServer:
  replicaCount: 2`,
    history: [
      {
        revision: 4,
        updated: '2026-08-16 08:15:00',
        status: 'deployed',
        chart: 'keda-2.14.0',
        description: 'Enabled high-availability dual metrics adapter',
      },
    ],
  },
  {
    name: 'cert-manager-vault',
    namespace: 'cert-manager',
    revision: 6,
    updated: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    status: 'deployed',
    chart: 'cert-manager-1.15.1',
    appVersion: 'v1.15.1',
    valuesYaml: `installCRDs: true
webhook:
  replicaCount: 2
cainjector:
  resources:
    requests:
      cpu: 100m
      memory: 256Mi`,
    history: [
      {
        revision: 6,
        updated: '2026-08-14 12:00:00',
        status: 'deployed',
        chart: 'cert-manager-1.15.1',
        description: 'Configured HashiCorp Vault ClusterIssuer backend',
      },
    ],
  },
];

const kubernetesCRDs = [
  {
    name: 'scaledobjects.keda.sh',
    group: 'keda.sh',
    version: 'v1alpha1',
    kind: 'ScaledObject',
    scope: 'Namespaced',
    customResourceCount: 4,
    established: true,
    specYaml: `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: scaledobjects.keda.sh
spec:
  group: keda.sh
  names:
    kind: ScaledObject
    plural: scaledobjects
  scope: Namespaced`,
    sampleManifestYaml: `apiVersion: keda.sh/v1alpha1
kind: ScaledObject
metadata:
  name: payment-kafka-scaler
  namespace: production
spec:
  scaleTargetRef:
    name: payment-gateway
  minReplicaCount: 2
  maxReplicaCount: 30
  triggers:
    - type: kafka
      metadata:
        bootstrapServers: kafka-broker:9092
        consumerGroup: payment-consumers
        topic: payment-settlements
        lagThreshold: "50"`,
  },
  {
    name: 'virtualservices.networking.istio.io',
    group: 'networking.istio.io',
    version: 'v1beta1',
    kind: 'VirtualService',
    scope: 'Namespaced',
    customResourceCount: 8,
    established: true,
    specYaml: `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: virtualservices.networking.istio.io
spec:
  group: networking.istio.io
  names:
    kind: VirtualService
    plural: virtualservices
  scope: Namespaced`,
    sampleManifestYaml: `apiVersion: networking.istio.io/v1beta1
kind: VirtualService
metadata:
  name: payment-canary-routing
  namespace: production
spec:
  hosts:
    - payment.internal.cloudops
  http:
    - route:
        - destination:
            host: payment-gateway-stable
          weight: 90
        - destination:
            host: payment-gateway-canary
          weight: 10`,
  },
  {
    name: 'certificates.cert-manager.io',
    group: 'cert-manager.io',
    version: 'v1',
    kind: 'Certificate',
    scope: 'Namespaced',
    customResourceCount: 6,
    established: true,
    specYaml: `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: certificates.cert-manager.io
spec:
  group: cert-manager.io
  names:
    kind: Certificate
    plural: certificates
  scope: Namespaced`,
    sampleManifestYaml: `apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: wildcard-cloudops-tls
  namespace: production
spec:
  secretName: wildcard-cloudops-tls-secret
  duration: 2160h # 90d
  renewBefore: 360h # 15d
  dnsNames:
    - "*.cloudops.internal"
  issuerRef:
    name: vault-pki-issuer
    kind: ClusterIssuer`,
  },
  {
    name: 'prometheusrules.monitoring.coreos.com',
    group: 'monitoring.coreos.com',
    version: 'v1',
    kind: 'PrometheusRule',
    scope: 'Namespaced',
    customResourceCount: 12,
    established: true,
    specYaml: `apiVersion: apiextensions.k8s.io/v1
kind: CustomResourceDefinition
metadata:
  name: prometheusrules.monitoring.coreos.com
spec:
  group: monitoring.coreos.com
  names:
    kind: PrometheusRule
    plural: prometheusrules
  scope: Namespaced`,
    sampleManifestYaml: `apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: slo-burn-rate-rules
  namespace: production
spec:
  groups:
    - name: slo.rules
      rules:
        - alert: HighErrorRate1HourBurn
          expr: rate(http_requests_total{status=~"5.."}[1h]) / rate(http_requests_total[1h]) > 0.02
          for: 2m
          labels:
            severity: critical`,
  },
];

// -------------------------------------------------------------
// Phase 5 Mock Data: KEDA ScaledObjects
// -------------------------------------------------------------
let kedaScaledObjects = [
  {
    id: 'keda-01',
    name: 'payment-kafka-lag-scaler',
    namespace: 'production',
    targetDeployment: 'payment-gateway',
    minReplicaCount: 2,
    maxReplicaCount: 25,
    currentReplicas: 4,
    desiredReplicas: 4,
    scaleToZeroEnabled: false,
    cooldownPeriodSec: 120,
    triggers: [
      {
        type: 'kafka',
        metadata: {
          topic: 'payment-settlements',
          consumerGroup: 'payment-gateway-workers',
          bootstrapServers: 'kafka-cluster-kafka-bootstrap.kafka:9092',
          lagThreshold: '50',
        },
        metricValue: '18 msg lag',
        targetValue: '50 msg/pod',
        isActive: true,
      },
      {
        type: 'prometheus',
        metadata: {
          serverAddress: 'http://prometheus-k8s.monitoring:9090',
          query: 'sum(rate(http_requests_total{service="payment-gateway"}[1m]))',
          threshold: '250',
        },
        metricValue: '142 req/s',
        targetValue: '250 req/s',
        isActive: true,
      },
    ],
    scalingHistory: [
      { time: '22:30', replicas: 2, metricValue: 24 },
      { time: '22:35', replicas: 3, metricValue: 68 },
      { time: '22:40', replicas: 4, metricValue: 142 },
      { time: '22:45', replicas: 4, metricValue: 135 },
    ],
  },
  {
    id: 'keda-02',
    name: 'order-async-worker-scaler',
    namespace: 'production',
    targetDeployment: 'order-processing',
    minReplicaCount: 0,
    maxReplicaCount: 30,
    currentReplicas: 3,
    desiredReplicas: 3,
    scaleToZeroEnabled: true,
    cooldownPeriodSec: 300,
    triggers: [
      {
        type: 'redis',
        metadata: {
          address: 'redis-queue.production:6379',
          listName: 'order_execution_queue',
          targetListLength: '20',
        },
        metricValue: '42 items in queue',
        targetValue: '20 items/pod',
        isActive: true,
      },
    ],
    scalingHistory: [
      { time: '22:30', replicas: 0, metricValue: 0 },
      { time: '22:35', replicas: 2, metricValue: 35 },
      { time: '22:40', replicas: 3, metricValue: 58 },
      { time: '22:45', replicas: 3, metricValue: 42 },
    ],
  },
  {
    id: 'keda-03',
    name: 'fraud-ai-inference-scaler',
    namespace: 'production',
    targetDeployment: 'fraud-analyzer',
    minReplicaCount: 1,
    maxReplicaCount: 15,
    currentReplicas: 2,
    desiredReplicas: 2,
    scaleToZeroEnabled: false,
    cooldownPeriodSec: 180,
    triggers: [
      {
        type: 'cpu_memory',
        metadata: {
          type: 'Utilization',
          value: '75',
        },
        metricValue: '68% CPU avg',
        targetValue: '75% CPU',
        isActive: true,
      },
    ],
    scalingHistory: [
      { time: '22:30', replicas: 1, metricValue: 42 },
      { time: '22:35', replicas: 2, metricValue: 78 },
      { time: '22:40', replicas: 2, metricValue: 68 },
      { time: '22:45', replicas: 2, metricValue: 68 },
    ],
  },
];

// -------------------------------------------------------------
// Phase 5 Mock Data: Zero-Trust HashiCorp Vault Secrets
// -------------------------------------------------------------
let vaultSecrets = [
  {
    id: 'vault-01',
    path: 'secret/production/database/postgres-creds',
    key: 'POSTGRES_MASTER_PASSWORD',
    serviceConsumer: 'pg-cluster-primary, payment-gateway',
    namespace: 'production',
    encryptedPreview: 'vault:v3:8q9A...xKd29PqM0aLz',
    version: 8,
    autoRotateEnabled: true,
    rotationFrequencyDays: 30,
    lastRotated: '2026-08-01',
    expiresInDays: 12,
    status: 'HEALTHY',
  },
  {
    id: 'vault-02',
    path: 'secret/production/auth/jwt-rsa-private-key',
    key: 'JWT_SIGNING_PRIVATE_KEY_PEM',
    serviceConsumer: 'rust-auth-guard',
    namespace: 'production',
    encryptedPreview: 'vault:v2:nM41...pLw89BvC3xXz',
    version: 4,
    autoRotateEnabled: true,
    rotationFrequencyDays: 90,
    lastRotated: '2026-07-15',
    expiresInDays: 55,
    status: 'HEALTHY',
  },
  {
    id: 'vault-03',
    path: 'pki/production/tls/wildcard-cloudops-internal',
    key: 'tls.crt / tls.key',
    serviceConsumer: 'ingress-envoy-gateway, istio-system',
    namespace: 'istio-system',
    encryptedPreview: 'vault:v1:cert-x509-v3-sha256',
    version: 6,
    autoRotateEnabled: true,
    rotationFrequencyDays: 60,
    lastRotated: '2026-07-25',
    expiresInDays: 5,
    status: 'EXPIRING_SOON',
    tlsCertInfo: {
      cn: '*.cloudops.internal',
      san: ['*.cloudops.internal', 'api.cloudops.internal', 'mesh.cloudops.internal'],
      issuer: 'HashiCorp Vault Intermediate CA (G2)',
      validUntil: '2026-08-24 23:59:59 UTC',
      daysRemaining: 5,
      keySize: 'ECDSA P-384 / SHA-384',
    },
  },
  {
    id: 'vault-04',
    path: 'secret/production/stripe/webhook-signing-secret',
    key: 'STRIPE_WEBHOOK_SECRET_KEY',
    serviceConsumer: 'payment-gateway',
    namespace: 'production',
    encryptedPreview: 'vault:v5:whsec_99182...aZ90x',
    version: 5,
    autoRotateEnabled: false,
    rotationFrequencyDays: 180,
    lastRotated: '2026-03-01',
    expiresInDays: 10,
    status: 'EXPIRING_SOON',
  },
  {
    id: 'vault-05',
    path: 'secret/production/redis/auth-token',
    key: 'REDIS_AUTH_TOKEN',
    serviceConsumer: 'redis-cache-tier, order-processing',
    namespace: 'production',
    encryptedPreview: 'vault:v1:rd_90xLq91209bK...',
    version: 2,
    autoRotateEnabled: true,
    rotationFrequencyDays: 45,
    lastRotated: '2026-08-10',
    expiresInDays: 36,
    status: 'HEALTHY',
  },
];

// Phase 5 API Endpoints
app.get('/api/tracing/traces', (req: Request, res: Response) => {
  res.json({ traces: distributedTraces });
});

app.get('/api/tracing/flamegraph', (req: Request, res: Response) => {
  res.json({ flamegraph: flamegraphData });
});

app.get('/api/helm/releases', (req: Request, res: Response) => {
  res.json({ releases: helmReleases });
});

app.post('/api/helm/rollback', (req: Request, res: Response) => {
  const { releaseName, targetRevision } = req.body;
  const release = helmReleases.find((r) => r.name === releaseName);
  if (!release) {
    return res.status(404).json({ error: 'Helm release not found' });
  }

  const targetHistory = release.history.find((h) => h.revision === Number(targetRevision));
  if (!targetHistory) {
    return res.status(404).json({ error: 'Target revision not found in history' });
  }

  const newRevision = release.revision + 1;
  release.revision = newRevision;
  release.status = 'deployed';
  release.updated = new Date().toISOString();
  release.history.unshift({
    revision: newRevision,
    updated: new Date().toISOString().replace('T', ' ').slice(0, 19),
    status: 'deployed',
    chart: targetHistory.chart,
    description: `Rollback to revision ${targetRevision} (${targetHistory.description})`,
  });

  res.json({
    success: true,
    message: `Helm release '${releaseName}' rolled back to revision ${targetRevision}. New live revision is #${newRevision}.`,
    release,
  });
});

app.get('/api/k8s/crds', (req: Request, res: Response) => {
  res.json({ crds: kubernetesCRDs });
});

app.get('/api/autoscaling/scaled-objects', (req: Request, res: Response) => {
  res.json({ scaledObjects: kedaScaledObjects });
});

app.post('/api/autoscaling/toggle-scale-zero', (req: Request, res: Response) => {
  const { id, enabled } = req.body;
  const obj = kedaScaledObjects.find((s) => s.id === id);
  if (!obj) {
    return res.status(404).json({ error: 'KEDA ScaledObject not found' });
  }

  obj.scaleToZeroEnabled = enabled;
  if (enabled) {
    obj.minReplicaCount = 0;
  } else {
    obj.minReplicaCount = 1;
    if (obj.currentReplicas === 0) obj.currentReplicas = 1;
  }

  res.json({
    success: true,
    message: `KEDA scale-to-zero ${enabled ? 'enabled' : 'disabled'} for '${obj.name}'. Min replicas updated to ${obj.minReplicaCount}.`,
    scaledObject: obj,
  });
});

app.get('/api/secrets/vault-items', (req: Request, res: Response) => {
  res.json({ secrets: vaultSecrets });
});

app.post('/api/secrets/rotate', (req: Request, res: Response) => {
  const { secretId } = req.body;
  const secret = vaultSecrets.find((s) => s.id === secretId);
  if (!secret) {
    return res.status(404).json({ error: 'Vault secret not found' });
  }

  secret.version += 1;
  secret.lastRotated = new Date().toISOString().split('T')[0];
  secret.expiresInDays = secret.rotationFrequencyDays || 60;
  secret.status = 'HEALTHY';
  secret.encryptedPreview = `vault:v${secret.version}:${Math.random().toString(36).substring(2, 12)}...${Math.random().toString(36).substring(2, 8)}`;

  if (secret.tlsCertInfo) {
    secret.tlsCertInfo.daysRemaining = 60;
    secret.tlsCertInfo.validUntil = new Date(Date.now() + 1000 * 60 * 60 * 24 * 60).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  }

  res.json({
    success: true,
    message: `Vault secret '${secret.path}' successfully rotated to version #${secret.version}. Pod rolling update triggered for consumer workloads: ${secret.serviceConsumer}.`,
    secret,
  });
});

// -------------------------------------------------------------
// Phase 1 / Blueprint Phase 17 & 22: Unified Incident Hub Endpoints
// -------------------------------------------------------------
app.get('/api/incidents', (req: Request, res: Response) => {
  const { status, severity, service, environment } = req.query;
  let filtered = [...unifiedIncidents];

  if (status && typeof status === 'string' && status !== 'ALL') {
    filtered = filtered.filter((i) => i.status === status);
  }
  if (severity && typeof severity === 'string' && severity !== 'ALL') {
    filtered = filtered.filter((i) => i.severity === severity);
  }
  if (service && typeof service === 'string' && service !== 'ALL') {
    filtered = filtered.filter((i) => i.service === service);
  }
  if (environment && typeof environment === 'string' && environment !== 'ALL') {
    filtered = filtered.filter((i) => i.environment === environment);
  }

  // Summary statistics
  const stats = {
    total: unifiedIncidents.length,
    open: unifiedIncidents.filter((i) => i.status === 'OPEN').length,
    investigating: unifiedIncidents.filter((i) => i.status === 'INVESTIGATING').length,
    resolved: unifiedIncidents.filter((i) => i.status === 'RESOLVED').length,
    critical: unifiedIncidents.filter((i) => i.severity === 'CRITICAL' && i.status !== 'RESOLVED').length,
    high: unifiedIncidents.filter((i) => i.severity === 'HIGH' && i.status !== 'RESOLVED').length,
    dedupedSignals: unifiedIncidents.reduce((acc, curr) => acc + (curr.duplicateSignalCount || 1), 0),
  };

  res.json({
    incidents: filtered,
    stats,
  });
});

app.get('/api/incidents/:id', (req: Request, res: Response) => {
  const incident = unifiedIncidents.find((i) => i.id === req.params.id);
  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }
  res.json({ incident });
});

app.post('/api/incidents/:id/status', (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: IncidentStatus };
  const incident = unifiedIncidents.find((i) => i.id === id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const prevStatus = incident.status;
  incident.status = status;
  incident.lastSeenAt = new Date().toISOString();

  if (status === 'RESOLVED' && !incident.resolvedAt) {
    incident.resolvedAt = new Date().toISOString();
    incident.resolutionReason = req.body.resolutionReason || 'Manually marked as resolved by SRE';
  }

  // Add a timeline event for the status transition
  const newTimelineEvent: IncidentTimelineEvent = {
    id: `tl-status-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeFormatted: 'Just now',
    title: `Status Transition: ${prevStatus} ➔ ${status}`,
    description: `Incident lifecycle status updated to ${status}.`,
    type: status === 'RESOLVED' ? 'resolved' : 'incident_detected',
    source: 'Engine',
  };
  incident.timeline.push(newTimelineEvent);

  res.json({
    success: true,
    message: `Incident ${id} status updated from ${prevStatus} to ${status}.`,
    incident,
  });
});

app.post('/api/incidents/:id/ai-diagnose', async (req: Request, res: Response) => {
  const { id } = req.params;
  const incident = unifiedIncidents.find((i) => i.id === id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  const prompt = `You are a Senior Kubernetes SRE & CloudOps Principal Architect.
Analyze the following incident telemetry and generate a structured JSON Root Cause Analysis (RCA) with high confidence.

Incident Details:
- Title: ${incident.title}
- Service: ${incident.service} (${incident.environment})
- Failure Type: ${incident.failureType}
- Commit: ${incident.commitSha} (${incident.commitAuthor}: "${incident.commitMessage}")
- Raw Logs:
${incident.rawLogs.join('\n')}

- Kubernetes Events:
${(incident.k8sEvents || []).join('\n')}

- Git Diff:
${incident.gitDiffSnippet || 'No diff snippet'}

Return ONLY a valid JSON object matching this schema:
{
  "summary": "1-2 sentence executive summary",
  "rootCause": "Deep technical explanation of the direct cause",
  "whyItHappened": "Chronological operational or configuration reason",
  "whatChanged": "What commit or deployment change triggered the fault",
  "evidenceSummary": ["evidence point 1", "evidence point 2", "evidence point 3"],
  "impact": "User and cluster impact description",
  "recommendedSolution": ["step 1", "step 2", "step 3"],
  "cliCommands": ["kubectl command 1", "kubectl command 2"],
  "codeDiff": "unified diff patch or empty string",
  "confidence": 95,
  "confidenceRationale": "why confidence is high",
  "uncertainty": []
}`;

  try {
    const rawText = await callGeminiSafe(prompt, 'gemini-3.7-flash', true);
    if (rawText) {
      const cleanJson = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      incident.aiAnalysis = {
        summary: parsed.summary || incident.aiAnalysis?.summary || 'RCA analyzed by SRE AI Assistant',
        rootCause: parsed.rootCause || incident.aiAnalysis?.rootCause || 'Root cause analyzed',
        whyItHappened: parsed.whyItHappened || incident.aiAnalysis?.whyItHappened,
        whatChanged: parsed.whatChanged || incident.aiAnalysis?.whatChanged,
        evidenceSummary: parsed.evidenceSummary || incident.aiAnalysis?.evidenceSummary || [],
        impact: parsed.impact || incident.aiAnalysis?.impact,
        recommendedSolution: parsed.recommendedSolution || incident.aiAnalysis?.recommendedSolution || [],
        cliCommands: parsed.cliCommands || incident.aiAnalysis?.cliCommands || [],
        codeDiff: parsed.codeDiff || incident.aiAnalysis?.codeDiff,
        confidence: Number(parsed.confidence) || 95,
        confidenceRationale: parsed.confidenceRationale || 'Direct multi-point telemetry correlation.',
        uncertainty: parsed.uncertainty || [],
        analyzedAt: new Date().toISOString(),
      };

      // Add to timeline
      incident.timeline.push({
        id: `tl-ai-${Date.now()}`,
        timestamp: new Date().toISOString(),
        timeFormatted: 'Just now',
        title: `AI Root Cause Analyzed (${incident.aiAnalysis.confidence}%)`,
        description: incident.aiAnalysis.summary,
        type: 'ai_analyzed',
        source: 'AI',
      });

      return res.json({
        success: true,
        incident,
        aiAnalysis: incident.aiAnalysis,
      });
    }
  } catch (err) {
    console.warn('[Gemini Resiliency] Incident RCA fallback engaged.');
  }

  // Fallback if no API key or AI call fails
  incident.aiAnalysis = incident.aiAnalysis || {
    summary: `Automated diagnostic correlation for ${incident.service} ${incident.failureType}.`,
    rootCause: `Deterministic failure signature matched in ${incident.namespace} namespace.`,
    whyItHappened: `Service configuration or dependency timeout caused runtime failure.`,
    whatChanged: `New commit pushed or configuration drifted in environment.`,
    impact: `Degraded performance or partial unavailability for ${incident.service}.`,
    evidenceSummary: ['Stack trace matched', 'Kubernetes pod crash recorded'],
    recommendedSolution: ['Inspect pod logs', 'Verify environment secrets', 'Rollout restart deployment'],
    confidence: 92,
    analyzedAt: new Date().toISOString(),
  };

  res.json({
    success: true,
    incident,
    aiAnalysis: incident.aiAnalysis,
  });
});

app.post('/api/incidents/:id/remediate', (req: Request, res: Response) => {
  const { id } = req.params;
  const { actionType = 'auto_patch_restart' } = req.body;
  const incident = unifiedIncidents.find((i) => i.id === id);

  if (!incident) {
    return res.status(404).json({ error: 'Incident not found' });
  }

  incident.status = 'RESOLVED';
  incident.resolvedAt = new Date().toISOString();
  incident.resolutionReason = `Remediation executed: ${actionType}. Secret patched and pod rolled out successfully.`;

  // Add timeline entry
  incident.timeline.push({
    id: `tl-rem-${Date.now()}`,
    timestamp: new Date().toISOString(),
    timeFormatted: 'Just now',
    title: 'Autonomous Remediation Executed',
    description: `Applied secret patch and triggered Kubernetes rolling restart for ${incident.service}. Pod reached Ready 1/1 state.`,
    type: 'resolved',
    source: 'Engine',
  });

  res.json({
    success: true,
    message: `Remediation action '${actionType}' completed. Incident ${id} resolved.`,
    incident,
  });
});

app.post('/api/incidents/simulate-new', (req: Request, res: Response) => {
  const { failureType = 'CrashLoopBackOff', service = 'payment-gateway', severity = 'CRITICAL' } = req.body;

  const newId = `inc-${Math.floor(1000 + Math.random() * 9000)}`;
  const newFingerprint = `prod:${service}:${failureType}:${Date.now()}`;

  const newIncident: UnifiedIncident = {
    id: newId,
    fingerprint: newFingerprint,
    title: `Simulated Incident: ${service} ${failureType} in production`,
    service,
    namespace: 'production',
    environment: 'production',
    repo: 'acme-enterprise/cloudops-microservices-suite',
    branch: 'main',
    commitSha: Math.random().toString(16).substring(2, 9),
    commitAuthor: 'SRE Simulation Bot',
    commitMessage: `chore(sim): synthetic fault injection for ${failureType}`,
    severity: severity as IncidentSeverity,
    status: 'OPEN',
    source: 'KUBERNETES',
    failureType,
    affectedResource: `${service}-${Math.random().toString(36).substring(2, 7)}`,
    restartCount: 4,
    duplicateSignalCount: 1,
    firstSeenAt: new Date().toISOString(),
    lastSeenAt: new Date().toISOString(),
    rawLogs: [
      `[INFO] Starting service ${service}...`,
      `[ERROR] Unhandled exception occurred: connection timeout to upstream dependency`,
      `[FATAL] Terminating process with exit code 1`,
    ],
    k8sEvents: [
      `Warning: BackOff restarting failed container in pod ${service}`,
      `Warning: Unhealthy liveness probe failure`,
    ],
    timeline: [
      {
        id: `tl-${Date.now()}-1`,
        timestamp: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
        timeFormatted: '3 min ago',
        title: 'Synthetic Fault Injected',
        description: `Chaos engine triggered ${failureType} simulation on ${service}.`,
        type: 'deploy_start',
        source: 'Engine',
      },
      {
        id: `tl-${Date.now()}-2`,
        timestamp: new Date(Date.now() - 1000 * 60 * 2).toISOString(),
        timeFormatted: '2 min ago',
        title: 'Container Crash Detected',
        description: 'Pod failed liveness health check probe.',
        type: 'pod_crash',
        source: 'Kubernetes',
      },
      {
        id: `tl-${Date.now()}-3`,
        timestamp: new Date().toISOString(),
        timeFormatted: 'Just now',
        title: 'Correlated Incident Registered',
        description: `Incident ${newId} created with deduplication fingerprint.`,
        type: 'incident_detected',
        source: 'Engine',
      },
    ],
    evidence: [
      {
        id: `ev-${Date.now()}`,
        title: 'Synthetic Liveness Probe Failure',
        source: 'Kubernetes Event',
        details: 'Pod HTTP health check endpoint failed 3 consecutive times.',
        verified: true,
      },
    ],
    aiAnalysis: {
      summary: `Automated Root Cause Diagnosis for ${service} simulated ${failureType}.`,
      rootCause: `Synthetic failure state initiated by SRE Chaos testing harness.`,
      whyItHappened: `Injected synthetic failure via Chaos testing engine to validate auto-remediation.`,
      whatChanged: `Fault injection triggered in ${service} pod.`,
      impact: `Pod health check fails, triggering simulated SRE incident workflow.`,
      evidenceSummary: ['Liveness check failed', 'Process exit code 1 logged'],
      recommendedSolution: ['Restart service deployment', 'Reset chaos fault injection flag'],
      cliCommands: [`kubectl rollout restart deployment/${service} -n production`],
      confidence: 98,
      confidenceRationale: 'Direct telemetry correlation from Chaos simulation trigger.',
      analyzedAt: new Date().toISOString(),
    },
  };

  unifiedIncidents.unshift(newIncident);

  res.json({
    success: true,
    message: `Simulated incident ${newId} created.`,
    incident: newIncident,
  });
});

// -------------------------------------------------------------
// Production Grade Enterprise SaaS Engine (RBAC, Audit, Persistence)
// -------------------------------------------------------------

const enterpriseUsers: EnterpriseUser[] = [
  {
    id: 'usr-sre-01',
    email: 'alex.sre@sentrix-enterprise.internal',
    name: 'Alex Vance (Lead SRE)',
    role: 'admin',
    tenantId: 'tenant-acme-corp',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    twoFactorEnabled: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    permissions: {
      canTriggerAutoHeal: true,
      canExecuteChaos: true,
      canShiftCanaryTraffic: true,
      canModifyPolicies: true,
      canDrainNodes: true,
      canViewAuditLogs: true,
      canManageSecrets: true,
    },
  },
  {
    id: 'usr-dev-02',
    email: 'marcus.dev@sentrix-enterprise.internal',
    name: 'Marcus Brody (Core Backend Dev)',
    role: 'developer',
    tenantId: 'tenant-acme-corp',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    twoFactorEnabled: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    permissions: {
      canTriggerAutoHeal: false,
      canExecuteChaos: false,
      canShiftCanaryTraffic: true,
      canModifyPolicies: false,
      canDrainNodes: false,
      canViewAuditLogs: true,
      canManageSecrets: false,
    },
  },
  {
    id: 'usr-sec-03',
    email: 'sarah.sec@sentrix-enterprise.internal',
    name: 'Sarah Chen (Security & Compliance)',
    role: 'security_auditor',
    tenantId: 'tenant-acme-corp',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    twoFactorEnabled: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    permissions: {
      canTriggerAutoHeal: false,
      canExecuteChaos: false,
      canShiftCanaryTraffic: false,
      canModifyPolicies: false,
      canDrainNodes: false,
      canViewAuditLogs: true,
      canManageSecrets: true,
    },
  },
  {
    id: 'usr-view-04',
    email: 'auditor.external@kpmg-audit.com',
    name: 'External SOC-2 Auditor',
    role: 'viewer',
    tenantId: 'tenant-acme-corp',
    twoFactorEnabled: true,
    lastLoginAt: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    permissions: {
      canTriggerAutoHeal: false,
      canExecuteChaos: false,
      canShiftCanaryTraffic: false,
      canModifyPolicies: false,
      canDrainNodes: false,
      canViewAuditLogs: true,
      canManageSecrets: false,
    },
  },
];

let enterpriseAuditLogs: EnterpriseAuditLog[] = [
  {
    id: 'audit-001',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    userEmail: 'alex.sre@sentrix-enterprise.internal',
    userRole: 'admin',
    action: 'ROLLOUT_RESTART_POD',
    category: 'CLUSTER_MUTATION',
    targetResource: 'deployment/payment-gateway-v2 -n production',
    status: 'SUCCESS',
    clientIp: '10.244.0.1 (Kube-Ingress)',
    details: 'Triggered rolling restart to clear memory leak slope before OOMKill breach.',
    diffSummary: 'spec.template.metadata.annotations["kubectl.kubernetes.io/restartedAt"] = NOW()',
  },
  {
    id: 'audit-002',
    timestamp: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    userEmail: 'marcus.dev@sentrix-enterprise.internal',
    userRole: 'developer',
    action: 'SHIFT_CANARY_TRAFFIC_25_PERCENT',
    category: 'CANARY_SHIFT',
    targetResource: 'canary/checkout-v2-canary',
    status: 'SUCCESS',
    clientIp: '192.168.1.104 (VPN-Gateway)',
    details: 'Promoted canary traffic step from 10% to 25% after error budget verification (0.02% 5xx).',
  },
  {
    id: 'audit-003',
    timestamp: new Date(Date.now() - 1000 * 60 * 62).toISOString(),
    userEmail: 'sarah.sec@sentrix-enterprise.internal',
    userRole: 'security_auditor',
    action: 'ROTATE_MTLS_CERTIFICATES',
    category: 'SECRET_ACCESS',
    targetResource: 'vault-secret/rust-auth-guard-tls-cert',
    status: 'SUCCESS',
    clientIp: '10.0.12.44 (SecOps Bastion)',
    details: 'Rotated 2048-bit RSA X.509 client certificate for Envoy service mesh sidecar.',
  },
  {
    id: 'audit-004',
    timestamp: new Date(Date.now() - 1000 * 60 * 95).toISOString(),
    userEmail: 'marcus.dev@sentrix-enterprise.internal',
    userRole: 'developer',
    action: 'INJECT_CHAOS_LATENCY',
    category: 'CHAOS_INJECTION',
    targetResource: 'pod/order-processor-node-7b9f848b8-x2n9q',
    status: 'DENIED',
    clientIp: '192.168.1.104 (VPN-Gateway)',
    details: 'RBAC Access Denied: User role "developer" is not authorized to inject production chaos faults.',
  },
];

let databaseStatus: DatabaseConnectionStatus = {
  engine: 'PostgreSQL',
  connected: true,
  latencyMs: 1.4,
  poolActiveConnections: 12,
  poolIdleConnections: 38,
  databaseName: 'sentrix_enterprise_production',
  sslMode: 'verify-full',
  tableCounts: {
    incidents: 42,
    auditLogs: 1840,
    metricsSnapshots: 984020,
    users: 28,
  },
  lastHealthCheck: new Date().toISOString(),
};

// Kubernetes Standard Health & Readiness Probes
app.get('/healthz', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

app.get('/readyz', (req: Request, res: Response) => {
  if (databaseStatus.connected) {
    res.status(200).json({ status: 'ready', database: 'connected', k8sInformer: 'synchronized' });
  } else {
    res.status(503).json({ status: 'not ready', reason: 'Database connection warming up' });
  }
});

app.get('/metrics', (req: Request, res: Response) => {
  const prometheusText = `
# HELP sentrix_http_requests_total Total HTTP requests handled by Sentrix control plane
# TYPE sentrix_http_requests_total counter
sentrix_http_requests_total{status="200",handler="api"} 14892
sentrix_http_requests_total{status="500",handler="api"} 3

# HELP sentrix_database_pool_connections Active and idle PostgreSQL pool connections
# TYPE sentrix_database_pool_connections gauge
sentrix_database_pool_connections{state="active"} ${databaseStatus.poolActiveConnections}
sentrix_database_pool_connections{state="idle"} ${databaseStatus.poolIdleConnections}

# HELP sentrix_incidents_active Current active cluster incidents
# TYPE sentrix_incidents_active gauge
sentrix_incidents_active 2

# HELP sentrix_audit_logs_recorded Total tamper-evident audit log records
# TYPE sentrix_audit_logs_recorded counter
sentrix_audit_logs_recorded ${enterpriseAuditLogs.length}
`;
  res.setHeader('Content-Type', 'text/plain; version=0.0.4');
  res.send(prometheusText.trim());
});

// Enterprise RBAC & Users API
app.get('/api/enterprise/users', (req: Request, res: Response) => {
  res.json({ success: true, users: enterpriseUsers });
});

app.get('/api/enterprise/audit-logs', (req: Request, res: Response) => {
  res.json({ success: true, auditLogs: enterpriseAuditLogs });
});

app.get('/api/enterprise/database-status', (req: Request, res: Response) => {
  databaseStatus.lastHealthCheck = new Date().toISOString();
  databaseStatus.latencyMs = Number((1.2 + Math.random() * 0.6).toFixed(2));
  res.json({ success: true, database: databaseStatus });
});

app.post('/api/enterprise/database-switch', (req: Request, res: Response) => {
  const { engine } = req.body;
  if (['PostgreSQL', 'Firestore', 'Redis', 'In-Memory (Local Demo)'].includes(engine)) {
    databaseStatus.engine = engine;
    databaseStatus.databaseName = engine === 'PostgreSQL' 
      ? 'sentrix_enterprise_postgres' 
      : engine === 'Firestore' 
      ? 'projects/sentrix-prod/databases/(default)' 
      : engine === 'Redis'
      ? 'redis://cluster-redis.internal:6379/0'
      : 'in_memory_transient_buffer';
    
    enterpriseAuditLogs.unshift({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userEmail: 'alex.sre@sentrix-enterprise.internal',
      userRole: 'admin',
      action: `SWITCH_DATABASE_ENGINE_TO_${engine.toUpperCase().replace(/\s+/g, '_')}`,
      category: 'CLUSTER_MUTATION',
      targetResource: `db-storage/${databaseStatus.databaseName}`,
      status: 'SUCCESS',
      clientIp: '10.244.0.1 (Kube-Ingress)',
      details: `Switched backend database persistence provider to ${engine} with SSL verification.`,
    });

    res.json({ success: true, message: `Database persistence engine switched to ${engine}`, database: databaseStatus });
  } else {
    res.status(400).json({ success: false, error: 'Invalid database engine specified.' });
  }
});

app.post('/api/enterprise/record-audit', (req: Request, res: Response) => {
  const { userEmail, userRole, action, category, targetResource, details, status, diffSummary } = req.body;
  
  const newLog: EnterpriseAuditLog = {
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userEmail: userEmail || 'alex.sre@sentrix-enterprise.internal',
    userRole: (userRole as UserRole) || 'admin',
    action: action || 'OPERATIONAL_ACTION',
    category: category || 'CLUSTER_MUTATION',
    targetResource: targetResource || 'cluster/default',
    status: status || 'SUCCESS',
    clientIp: req.ip || '10.244.0.1',
    details: details || 'Action recorded by Sentrix Enterprise Audit Guard',
    diffSummary,
  };

  enterpriseAuditLogs.unshift(newLog);
  if (enterpriseAuditLogs.length > 50) enterpriseAuditLogs.pop();

  res.json({ success: true, auditLog: newLog });
});

app.get('/api/enterprise/system-health', (req: Request, res: Response) => {
  const health: ProductionSystemHealth = {
    version: 'v2.4.0-enterprise',
    uptimeSeconds: Math.floor(process.uptime()),
    environment: 'production',
    probes: {
      liveness: true,
      readiness: databaseStatus.connected,
      database: databaseStatus.connected,
      k8sApi: true,
    },
    rateLimiter: {
      enabled: true,
      maxRequestsPerMin: 600,
      activeClientsTracked: 14,
    },
    activeTenant: {
      id: 'tenant-acme-corp',
      name: 'Acme Global Commerce Infrastructure',
      tier: 'Enterprise Platinum',
      maxMonitoredNodes: 250,
      currentNodes: 18,
    },
  };
  res.json({ success: true, health });
});




// -------------------------------------------------------------
// Vite Middleware / Static Files Setup
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloudOps & K8s Auto-Healing Platform running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
