import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Cpu,
  Zap,
  Key,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Terminal,
  Layers,
  ArrowRight,
  Info,
  Check,
  Globe,
  Sliders,
  Radio,
  Lock,
  Code2,
  Eye,
  EyeOff,
  AlertTriangle,
  AlertOctagon,
  HelpCircle,
  Copy,
  CheckCheck,
  Search,
  ChevronDown,
  Trash2,
  Activity,
} from 'lucide-react';
import {
  AiModelOption,
  AiModelConfigState,
  AiProviderCategory,
  DetectedAiModel,
  ApiKeyDetectionResult,
  ModelVerificationResult,
  ApiKeyErrorDetails,
} from '../types';

interface ModelSwitchHubProps {
  onNavigateToCopilot?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const ModelSwitchHub: React.FC<ModelSwitchHubProps> = ({
  onNavigateToCopilot,
  onShowToast,
}) => {
  // Config state from server
  const [configState, setConfigState] = useState<AiModelConfigState>({
    activeModel: 'gemini-3.7-flash',
    models: [],
    nvidiaApiKeyConfigured: false,
    cursorApiKeyConfigured: false,
    geminiApiKeyConfigured: true,
  });

  // User API key & detection states
  const [apiKeyInput, setApiKeyInput] = useState<string>(() => {
    return localStorage.getItem('sentrix_custom_ai_key') || '';
  });
  const [selectedProvider, setSelectedProvider] = useState<AiProviderCategory>('google');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isDetectingModels, setIsDetectingModels] = useState(false);
  const [detectionResult, setDetectionResult] = useState<ApiKeyDetectionResult | null>(null);
  const [detectionError, setDetectionError] = useState<ApiKeyErrorDetails | null>(null);

  // Model selection dropdown state
  const [selectedModelId, setSelectedModelId] = useState<string>('');
  const [modelSearchQuery, setModelSearchQuery] = useState<string>('');
  const [modelFilterCategory, setModelFilterCategory] = useState<'all' | 'recommended' | 'fast' | 'reasoning'>('all');

  // Verification health check states
  const [isVerifyingModel, setIsVerifyingModel] = useState(false);
  const [verificationResult, setVerificationResult] = useState<ModelVerificationResult | null>(null);
  const [verificationError, setVerificationError] = useState<ApiKeyErrorDetails | null>(null);
  const [customVerificationPrompt, setCustomVerificationPrompt] = useState<string>(
    'SRE Health Probe: Verify connection and return a one-sentence status confirmation.'
  );
  const [showRawErrorDetails, setShowRawErrorDetails] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);

  // Catalog / Global switcher states
  const [selectedCategory, setSelectedCategory] = useState<AiProviderCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [switchingModelId, setSwitchingModelId] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('Analyze kubernetes memory slope for payment-gateway pod');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTestingInference, setIsTestingInference] = useState(false);

  // Auto-detect provider based on key format
  useEffect(() => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) return;
    if (trimmed.startsWith('AIzaSy')) {
      setSelectedProvider('google');
    } else if (trimmed.startsWith('sk-ant-')) {
      setSelectedProvider('anthropic');
    } else if (trimmed.startsWith('nvapi-')) {
      setSelectedProvider('nvidia');
    } else if (trimmed.startsWith('gsk_')) {
      setSelectedProvider('groq');
    } else if (trimmed.startsWith('sk-or-')) {
      setSelectedProvider('openrouter');
    } else if (trimmed.startsWith('sk-')) {
      setSelectedProvider('openai');
    }
  }, [apiKeyInput]);

  const fetchModelsConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/ai/models');
      if (res.ok) {
        const data = await res.json();
        setConfigState({
          activeModel: data.activeModel || 'gemini-3.7-flash',
          models: data.models || [],
          nvidiaApiKeyConfigured: Boolean(data.nvidiaApiKeyConfigured),
          cursorApiKeyConfigured: Boolean(data.cursorApiKeyConfigured),
          geminiApiKeyConfigured: Boolean(data.geminiApiKeyConfigured),
        });
      }
    } catch (err) {
      console.error('Failed to fetch AI models:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModelsConfig();
  }, []);

  // Action: Detect available models for the pasted API key
  const handleDetectModels = async (keyToUse?: string) => {
    const effectiveKey = (keyToUse !== undefined ? keyToUse : apiKeyInput).trim();
    if (!effectiveKey) {
      setDetectionError({
        message: 'Please paste or enter an API key to detect available models.',
        code: 'EMPTY_INPUT',
        suggestion: 'Enter your Google Gemini, OpenAI, Groq, Anthropic, or NVIDIA API key.',
      });
      return;
    }

    try {
      setIsDetectingModels(true);
      setDetectionError(null);
      setDetectionResult(null);
      setVerificationResult(null);
      setVerificationError(null);

      const res = await fetch('/api/ai/inspect-key-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: effectiveKey,
          provider: selectedProvider,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setDetectionResult(data);
        if (data.models && data.models.length > 0) {
          // Auto-select first recommended model or first model in list
          const recommended = data.models.find((m: DetectedAiModel) => m.isRecommended) || data.models[0];
          setSelectedModelId(recommended.id);
          
          // Save valid key in localStorage for persistence
          if (effectiveKey !== '__SYSTEM_ENV__') {
            localStorage.setItem('sentrix_custom_ai_key', effectiveKey);
          }

          onShowToast?.(
            'success',
            'Models Detected Successfully',
            `Found ${data.models.length} available models for ${data.providerName}.`
          );

          // Automatically trigger live verification on the selected model
          verifyModelHealth(effectiveKey, data.provider, recommended.id);
        } else {
          setDetectionError({
            message: 'No generation models were returned for this API key tier.',
            code: 'NO_MODELS_FOUND',
            suggestion: 'Verify that Generative Language API or model permissions are enabled in your console.',
          });
        }
      } else {
        const err = data.error || {
          message: 'Failed to inspect API key. Upstream provider returned an error.',
          code: res.status,
          suggestion: 'Please verify the API key formatting and expiration date.',
        };
        setDetectionError(err);
        onShowToast?.('error', 'API Key Error', err.message);
      }
    } catch (err: any) {
      console.error('API key detection network failure:', err);
      setDetectionError({
        message: 'Network connection failed while validating API key.',
        code: 'NETWORK_ERROR',
        details: err.message || String(err),
        suggestion: 'Check your internet connection and ensure API endpoints are reachable.',
      });
      onShowToast?.('error', 'Connection Error', 'Failed to reach AI provider API gateway.');
    } finally {
      setIsDetectingModels(false);
    }
  };

  // Action: Live verify model & API key health
  const verifyModelHealth = async (key: string, provider: string, modelId: string) => {
    if (!modelId) return;

    try {
      setIsVerifyingModel(true);
      setVerificationError(null);
      setVerificationResult(null);

      const res = await fetch('/api/ai/verify-key-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: key || apiKeyInput,
          provider: provider || selectedProvider,
          modelId,
          testPrompt: customVerificationPrompt,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setVerificationResult(data);
        onShowToast?.(
          'success',
          'API Key & Model Verified!',
          `Model ${modelId} is operational (${data.latencyMs}ms response time).`
        );
      } else {
        const err = data.error || {
          message: `Verification failed for model ${modelId}.`,
          code: res.status,
          suggestion: 'Check if this model is allowed on your API key tier.',
        };
        setVerificationError(err);
        onShowToast?.('error', 'Model Verification Failed', err.message);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setVerificationError({
        message: 'Failed to complete test inference call with this model and key.',
        code: 'PROBE_FAILED',
        details: err.message || String(err),
        suggestion: 'Verify network reachability or try a different model.',
      });
    } finally {
      setIsVerifyingModel(false);
    }
  };

  // Action: User switches model from dropdown
  const handleModelDropdownChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModelId = e.target.value;
    setSelectedModelId(newModelId);
    if (newModelId && apiKeyInput.trim()) {
      verifyModelHealth(apiKeyInput.trim(), detectionResult?.provider || selectedProvider, newModelId);
    }
  };

  // Action: Activate verified model as the workspace's primary reasoning engine
  const handleActivateCustomEngine = async () => {
    if (!selectedModelId) return;
    try {
      const selectedModelObj = detectionResult?.models.find((m) => m.id === selectedModelId);
      const res = await fetch('/api/ai/activate-custom-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: selectedModelId,
          provider: detectionResult?.provider || selectedProvider,
          modelName: selectedModelObj?.name || selectedModelId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setConfigState((prev) => ({ ...prev, activeModel: data.activeModel }));
        onShowToast?.(
          'success',
          'Active Reasoning Engine Updated',
          `Workspace SRE Copilot & Root Cause Analysis now powered by ${selectedModelObj?.name || selectedModelId}.`
        );
      }
    } catch (err) {
      console.error('Failed to activate custom engine:', err);
      onShowToast?.('error', 'Activation Error', 'Failed to activate selected model.');
    }
  };

  // Switch model from preloaded catalog
  const handleSwitchModel = async (modelId: string) => {
    try {
      setSwitchingModelId(modelId);
      const res = await fetch('/api/ai/models/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      if (res.ok) {
        const data = await res.json();
        setConfigState((prev) => ({ ...prev, activeModel: data.activeModel }));
        onShowToast?.(
          'success',
          'AI Model Switched',
          `Active reasoning engine is now ${data.modelDetails?.name || modelId}. SRE Copilot & RCA updated.`
        );
      }
    } catch (err) {
      console.error('Failed to switch model:', err);
      onShowToast?.('error', 'Switch Error', 'Failed to switch AI model engine.');
    } finally {
      setSwitchingModelId(null);
    }
  };

  // Live sandbox test inference
  const handleTestInference = async () => {
    if (!testPrompt.trim() || isTestingInference) return;
    try {
      setIsTestingInference(true);
      setTestOutput(null);
      const res = await fetch('/api/ai/sre-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testPrompt, model: configState.activeModel }),
      });
      if (res.ok) {
        const data = await res.json();
        const msg = data.message?.text || 'Inference executed successfully. Telemetry parsed.';
        setTestOutput(msg);
      }
    } catch (err) {
      console.error('Inference test failed:', err);
      setTestOutput('Error running inference test on current model.');
    } finally {
      setIsTestingInference(false);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setApiKeyInput(text.trim());
        onShowToast?.('info', 'Pasted Key', 'API key pasted from clipboard. Ready to detect models.');
      }
    } catch (err) {
      console.warn('Clipboard read failed:', err);
    }
  };

  const handleClearKey = () => {
    setApiKeyInput('');
    setDetectionResult(null);
    setDetectionError(null);
    setVerificationResult(null);
    setVerificationError(null);
    localStorage.removeItem('sentrix_custom_ai_key');
    onShowToast?.('info', 'Key Cleared', 'API key removed from local input.');
  };

  const currentActiveModel =
    configState.models.find((m) => m.id === configState.activeModel) || configState.models[0];

  const filteredCatalogModels =
    selectedCategory === 'all'
      ? configState.models
      : configState.models.filter((m) => m.category === selectedCategory);

  // Filter detected models for the dropdown and preview
  const filteredDetectedModels = (detectionResult?.models || []).filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      m.id.toLowerCase().includes(modelSearchQuery.toLowerCase()) ||
      m.description.toLowerCase().includes(modelSearchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (modelFilterCategory === 'recommended') return m.isRecommended;
    if (modelFilterCategory === 'fast') return m.speed && m.speed.includes('25ms') || m.id.includes('lite') || m.id.includes('flash');
    if (modelFilterCategory === 'reasoning') return m.supportsThinking || m.id.includes('pro') || m.id.includes('r1') || m.id.includes('o1');
    return true;
  });

  const selectedDetectedModelObj = (detectionResult?.models || []).find((m) => m.id === selectedModelId);

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                <Key className="w-3 h-3" /> Live API Key & Model Detector
              </span>
              <span className="text-slate-500 text-xs">&bull;</span>
              <span className="text-xs text-slate-400 font-mono">Dynamic Model Discovery &bull; Health Verification</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 font-display">
              <Cpu className="w-6 h-6 text-cyan-400" />
              API Key Inspector & AI Model Selection Hub
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Paste your API key to automatically detect all accessible models from Google Gemini, OpenAI, Groq, NVIDIA NIM, or Anthropic. Select your preferred reasoning model from the interactive dropdown and run instant health check probes to verify operational status.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {onNavigateToCopilot && (
              <button
                onClick={onNavigateToCopilot}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-500/20 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                <span>Open SRE Copilot</span>
              </button>
            )}
            <button
              onClick={fetchModelsConfig}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#18181b] hover:bg-[#27272a] text-slate-300 border border-white/10 transition-all disabled:opacity-50"
              title="Refresh Models"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* PRIMARY FEATURE: Interactive API Key Input, Model Dropdown & Verification Suite */}
      <div className="bg-[#0b0c10] border border-cyan-500/30 rounded-2xl p-6 shadow-2xl relative overflow-hidden space-y-6">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20"></div>

        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>1. Paste API Key & Detect Available Models</span>
                {detectionResult?.success && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                    {detectionResult.models.length} Models Detected
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">
                Enter your provider API key. The platform calls the provider's model catalog to dynamically retrieve supported models.
              </p>
            </div>
          </div>

          {/* Quick Action Helpers */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setApiKeyInput('__SYSTEM_ENV__');
                setSelectedProvider('google');
                handleDetectModels('__SYSTEM_ENV__');
              }}
              className="px-3 py-1.5 rounded-lg bg-[#18181b] hover:bg-[#27272a] text-cyan-300 text-xs font-semibold border border-cyan-500/30 hover:border-cyan-500/60 transition-all flex items-center gap-1.5"
              title="Use the preconfigured environment Gemini API Key"
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Use System Key</span>
            </button>
          </div>
        </div>

        {/* Step 1: API Key Input Field */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                id="api-key-input-field"
                type={showApiKey ? 'text' : 'password'}
                value={apiKeyInput === '__SYSTEM_ENV__' ? '•••••••• (Pre-configured System Gemini Key)' : apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste API Key (e.g., AIzaSy... for Gemini, sk-... for OpenAI, gsk_... for Groq)"
                className="w-full bg-[#141416] border border-white/15 focus:border-cyan-400 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 font-mono focus:outline-none transition-colors pr-24 shadow-inner"
              />

              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                {apiKeyInput && (
                  <button
                    onClick={handleClearKey}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-white/5 transition-colors"
                    title="Clear Key"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                  title={showApiKey ? 'Hide Key' : 'Show Key'}
                >
                  {showApiKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Provider Selector Override */}
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value as AiProviderCategory)}
              className="bg-[#141416] border border-white/15 text-slate-200 text-xs font-semibold rounded-xl px-3 py-3 focus:outline-none focus:border-cyan-400 transition-colors"
            >
              <option value="google">Google Gemini (AI Studio)</option>
              <option value="openai">OpenAI (GPT-4o / o1 / o3)</option>
              <option value="groq">Groq LPU (Ultra-Fast)</option>
              <option value="nvidia">NVIDIA NIM (DeepSeek / Llama)</option>
              <option value="anthropic">Anthropic (Claude)</option>
              <option value="openrouter">OpenRouter Gateway</option>
            </select>

            {/* Detect Models Button */}
            <button
              id="btn-detect-models"
              onClick={() => handleDetectModels()}
              disabled={isDetectingModels || !apiKeyInput.trim()}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-40 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0 cursor-pointer"
            >
              {isDetectingModels ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-black" />
                  <span>Detecting Models...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Detect Available Models</span>
                </>
              )}
            </button>
          </div>

          {/* Input helper & detected provider pill */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 px-1">
            <div className="flex items-center gap-2">
              <span>Detected Provider Format:</span>
              <span className="font-semibold text-cyan-300 font-mono px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30">
                {selectedProvider === 'google'
                  ? 'Google AI Studio (Gemini)'
                  : selectedProvider === 'openai'
                  ? 'OpenAI API'
                  : selectedProvider === 'groq'
                  ? 'Groq Cloud LPU'
                  : selectedProvider === 'nvidia'
                  ? 'NVIDIA NIM'
                  : selectedProvider.toUpperCase()}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePasteFromClipboard}
                className="text-slate-400 hover:text-cyan-300 transition-colors flex items-center gap-1 underline underline-offset-2"
              >
                <Copy className="w-3 h-3" /> Paste from Clipboard
              </button>
            </div>
          </div>
        </div>

        {/* ERROR STATE: Prominent API Key Error Display */}
        {detectionError && (
          <div className="rounded-xl border border-rose-500/50 bg-rose-950/30 p-5 space-y-3 relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-400 shrink-0 mt-0.5">
                <AlertOctagon className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-rose-300 flex items-center gap-2">
                    <span>API Key Error</span>
                    {detectionError.code && (
                      <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 rounded bg-rose-500/20 border border-rose-500/40 text-rose-200">
                        Code: {detectionError.code}
                      </span>
                    )}
                  </h4>
                  <span className="text-[10px] uppercase font-bold text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
                    Validation Failed
                  </span>
                </div>
                <p className="text-xs text-rose-200 leading-relaxed font-medium">
                  {detectionError.message}
                </p>
                {detectionError.suggestion && (
                  <p className="text-xs text-rose-300/80 leading-relaxed pt-1">
                    <strong>Suggestion:</strong> {detectionError.suggestion}
                  </p>
                )}
              </div>
            </div>

            {/* Error Troubleshooting Details */}
            <div className="pt-2 border-t border-rose-500/20 flex flex-wrap items-center justify-between gap-3 text-[11px]">
              <div className="text-slate-400">
                Troubleshooting: Ensure the key is active, has no trailing spaces, and has Generative Language API permissions enabled.
              </div>
              <div className="flex items-center gap-2">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-bold text-[11px] border border-rose-500/40 transition-colors flex items-center gap-1"
                >
                  <ExternalLink className="w-3 h-3" /> Get Gemini API Key
                </a>
                <button
                  onClick={() => setShowRawErrorDetails(!showRawErrorDetails)}
                  className="text-rose-400 hover:underline text-[11px]"
                >
                  {showRawErrorDetails ? 'Hide Debug Details' : 'View Debug Trace'}
                </button>
              </div>
            </div>

            {showRawErrorDetails && detectionError.raw && (
              <pre className="p-3 rounded-lg bg-black/60 border border-rose-500/30 text-[10px] font-mono text-rose-300 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(detectionError.raw, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* Step 2 & 3: Model Dropdown Selection & Live Verification */}
        {detectionResult?.success && detectionResult.models.length > 0 && (
          <div className="space-y-4 pt-2 border-t border-white/10 animate-in fade-in duration-300">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Sliders className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    2. Select Model from Dropdown Menu
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Choose an accessible model discovered for your API key.
                  </p>
                </div>
              </div>

              {/* Filter pills */}
              <div className="hidden sm:flex items-center gap-1 bg-[#141416] p-1 rounded-lg border border-white/10 text-[11px]">
                {(['all', 'recommended', 'fast', 'reasoning'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setModelFilterCategory(filter)}
                    className={`px-2.5 py-1 rounded text-[10px] font-bold capitalize transition-colors ${
                      modelFilterCategory === filter
                        ? 'bg-cyan-500 text-black shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Model Dropdown & Action Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
              <div className="lg:col-span-8">
                <div className="relative">
                  <select
                    id="model-dropdown-menu"
                    value={selectedModelId}
                    onChange={handleModelDropdownChange}
                    className="w-full bg-[#18181b] border-2 border-cyan-500/40 hover:border-cyan-400 focus:border-cyan-400 rounded-xl px-4 py-3 text-xs text-white font-semibold focus:outline-none appearance-none cursor-pointer pr-10 shadow-lg"
                  >
                    {filteredDetectedModels.map((m) => (
                      <option key={m.id} value={m.id} className="bg-[#18181b] text-white py-2">
                        {m.name || m.id} {m.isRecommended ? '★ (Recommended)' : ''} &bull; {m.contextWindow} &bull; {m.tier || m.category}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-cyan-400">
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </div>
              </div>

              {/* Re-verify Button */}
              <div className="lg:col-span-4 flex items-center gap-2">
                <button
                  id="btn-verify-model"
                  onClick={() =>
                    verifyModelHealth(
                      apiKeyInput.trim(),
                      detectionResult.provider,
                      selectedModelId
                    )
                  }
                  disabled={isVerifyingModel || !selectedModelId}
                  className="w-full py-3 px-4 rounded-xl bg-[#1f232d] hover:bg-[#282e3c] border border-cyan-500/40 text-cyan-300 font-bold text-xs flex items-center justify-center gap-2 transition-all disabled:opacity-50 shadow-md"
                >
                  {isVerifyingModel ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                      <span>Verifying Model...</span>
                    </>
                  ) : (
                    <>
                      <Activity className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Re-Test Key & Model</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Selected Model Details Preview Card */}
            {selectedDetectedModelObj && (
              <div className="rounded-xl bg-[#14161d] border border-white/10 p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white font-display">
                        {selectedDetectedModelObj.name}
                      </span>
                      {selectedDetectedModelObj.isRecommended && (
                        <span className="px-2 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                          Recommended
                        </span>
                      )}
                      <span className="text-xs text-slate-500 font-mono">({selectedDetectedModelObj.id})</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedDetectedModelObj.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={handleActivateCustomEngine}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Activate as SRE Engine</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/5 text-[11px]">
                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Context Window:</span>
                    <span className="text-cyan-400 font-mono font-bold">{selectedDetectedModelObj.contextWindow}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Speed / Latency:</span>
                    <span className="text-emerald-400 font-mono font-bold">{selectedDetectedModelObj.speed || '45ms'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Vision / Multimodal:</span>
                    <span className="text-purple-300 font-semibold">{selectedDetectedModelObj.supportsVision ? 'Supported' : 'Text-Only'}</span>
                  </div>
                  <div className="p-2 rounded bg-black/40 border border-white/5">
                    <span className="text-slate-500 block text-[10px]">Reasoning Tier:</span>
                    <span className="text-slate-200 font-semibold truncate block">{selectedDetectedModelObj.tier || 'Production'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* VERIFICATION OUTCOME: SUCCESS BANNER */}
            {verificationResult?.success && (
              <div className="rounded-xl border border-emerald-500/40 bg-emerald-950/20 p-4 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    <h5 className="text-xs font-bold text-emerald-300">
                      API Key & Model Verified Operational!
                    </h5>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> {verificationResult.latencyMs}ms roundtrip
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {verificationResult.tokensGenerated} tokens
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-black/40 border border-white/5 text-[11px] font-mono text-emerald-200/90 whitespace-pre-wrap leading-relaxed">
                  <span className="text-slate-500 select-none block text-[9px] uppercase tracking-wider mb-1">Model Inference Response:</span>
                  {verificationResult.responsePreview}
                </div>
              </div>
            )}

            {/* VERIFICATION OUTCOME: ERROR BANNER */}
            {verificationError && (
              <div className="rounded-xl border border-amber-500/50 bg-amber-950/30 p-4 space-y-2 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    <h5 className="text-xs font-bold text-amber-300">
                      Model Probe Verification Failed
                    </h5>
                  </div>
                  {verificationError.code && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                      HTTP {verificationError.code}
                    </span>
                  )}
                </div>

                <p className="text-xs text-amber-200">
                  {verificationError.message}
                </p>
                {verificationError.suggestion && (
                  <p className="text-[11px] text-amber-300/80">
                    <strong>Tip:</strong> {verificationError.suggestion}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Active Model Overview & Provider Keys Readiness Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Active Engine Card */}
        <div className="bg-[#09090b] border border-purple-500/30 rounded-xl p-4 relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-400" /> Active Reasoning Model
            </span>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Active Live
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="text-base font-bold text-white font-display">
              {currentActiveModel?.name || configState.activeModel}
            </div>
            <div className="text-xs text-purple-300 font-medium">{currentActiveModel?.tier}</div>
            <div className="flex items-center gap-3 text-[11px] text-slate-400 pt-1">
              <span>Latency: <strong className="text-emerald-400 font-mono">{currentActiveModel?.speed || '45ms'}</strong></span>
              <span>&bull;</span>
              <span>Context: <strong className="text-cyan-400 font-mono">{currentActiveModel?.contextWindow || '1M tokens'}</strong></span>
            </div>
          </div>
        </div>

        {/* NVIDIA NIM Provider Status */}
        <div className="bg-[#09090b] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" /> NVIDIA NIM & GPU Cloud
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                configState.nvidiaApiKeyConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300 border border-white/10'
              }`}
            >
              {configState.nvidiaApiKeyConfigured ? 'KEY CONNECTED' : 'KEY READY'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Supports DeepSeek-R1 (671B reasoning), Llama 3.3 70B, and Nemotron through NVIDIA NIM API.
          </p>
          <div className="text-[10px] font-mono text-slate-400 bg-[#18181b] px-2.5 py-1 rounded border border-white/5 flex items-center justify-between">
            <span>Env: NVIDIA_API_KEY</span>
            <span className="text-emerald-400">NIM Catalog</span>
          </div>
        </div>

        {/* Cursor & Anthropic Bridge Status */}
        <div className="bg-[#09090b] border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-purple-400" /> Cursor / OpenAI Bridge
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                configState.cursorApiKeyConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-slate-700 text-slate-300 border border-white/10'
              }`}
            >
              {configState.cursorApiKeyConfigured ? 'BRIDGE ARMED' : 'BRIDGE READY'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Access Claude 3.7 Sonnet, GPT-4o, and DeepSeek-Coder through Cursor IDE / OpenAI API token.
          </p>
          <div className="text-[10px] font-mono text-slate-400 bg-[#18181b] px-2.5 py-1 rounded border border-white/5 flex items-center justify-between">
            <span>Env: CURSOR_API_KEY</span>
            <span className="text-purple-300">OpenAI / Claude</span>
          </div>
        </div>
      </div>

      {/* Provider Catalog Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All Pre-Configured Engines', count: configState.models.length },
            {
              id: 'google',
              label: 'Google Gemini',
              count: configState.models.filter((m) => m.category === 'google').length,
            },
            {
              id: 'nvidia',
              label: 'NVIDIA NIM Catalog',
              count: configState.models.filter((m) => m.category === 'nvidia').length,
            },
            {
              id: 'cursor',
              label: 'Cursor Bridge',
              count: configState.models.filter((m) => m.category === 'cursor').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
                selectedCategory === tab.id
                  ? 'bg-white text-black border-white shadow-md'
                  : 'bg-[#141416] text-slate-400 border-white/10 hover:text-white hover:bg-[#1f1f23]'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <span className="text-xs text-slate-400 font-mono hidden sm:inline">
          {filteredCatalogModels.length} Catalog Models
        </span>
      </div>

      {/* Pre-configured Model Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCatalogModels.map((model) => {
          const isActive = configState.activeModel === model.id;
          const isSwitching = switchingModelId === model.id;

          return (
            <div
              key={model.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between relative ${
                isActive
                  ? 'bg-[#18181b] border-cyan-500 shadow-xl shadow-cyan-500/10 ring-1 ring-cyan-500/50'
                  : 'bg-[#09090b] border-white/10 hover:border-white/20'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                  <span>Current Engine</span>
                </div>
              )}

              <div>
                {/* Header info */}
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold border text-cyan-400 bg-cyan-500/10 border-cyan-500/30">
                    {model.provider}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white font-display mb-1 flex items-center gap-2">
                  {model.name}
                </h3>
                <div className="text-xs text-purple-300 font-medium mb-2">{model.tier}</div>

                <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
                  {model.description}
                </p>
              </div>

              {/* Specs & Switch Action */}
              <div className="space-y-3 pt-3 border-t border-white/5">
                <div className="flex items-center justify-between text-[11px] text-slate-300">
                  <span>Latency: <span className="font-mono text-emerald-400 font-bold">{model.speed}</span></span>
                  <span>Context: <span className="font-mono text-cyan-400 font-bold">{model.contextWindow}</span></span>
                </div>

                {model.requiresKey && (
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                    <Key className="w-3 h-3 text-slate-500" />
                    <span>Uses: {model.requiresKey}</span>
                  </div>
                )}

                <button
                  onClick={() => handleSwitchModel(model.id)}
                  disabled={isActive || isSwitching}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 cursor-default'
                      : 'bg-white text-black hover:bg-slate-200 active:scale-98 shadow-md'
                  }`}
                >
                  {isSwitching ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Switching Engine...</span>
                    </>
                  ) : isActive ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Active Engine</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-3.5 h-3.5 text-purple-600 fill-current" />
                      <span>Select This Model</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Inference Test & Diagnostics Playground */}
      <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-cyan-400" />
            <div>
              <h3 className="text-sm font-bold text-white">Live Inference Test Sandbox</h3>
              <p className="text-xs text-slate-400">
                Execute a sample SRE diagnostic telemetry query directly with your active model (
                <span className="text-purple-300 font-bold">{currentActiveModel?.name}</span>).
              </p>
            </div>
          </div>
          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            Realtime Probe
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          <input
            type="text"
            value={testPrompt}
            onChange={(e) => setTestPrompt(e.target.value)}
            placeholder="Enter SRE diagnostics prompt (e.g. Generate kubectl rolling restart command)..."
            className="flex-1 bg-[#141416] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            onClick={handleTestInference}
            disabled={isTestingInference || !testPrompt.trim()}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0 cursor-pointer"
          >
            {isTestingInference ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Running Inference...</span>
              </>
            ) : (
              <>
                <Zap className="w-3.5 h-3.5" />
                <span>Run Diagnostic Test</span>
              </>
            )}
          </button>
        </div>

        {testOutput && (
          <div className="rounded-xl border border-white/10 bg-[#121214] p-4 text-xs font-mono text-cyan-300 whitespace-pre-wrap leading-relaxed">
            {testOutput}
          </div>
        )}
      </div>
    </div>
  );
};
