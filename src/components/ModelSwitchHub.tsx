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
} from 'lucide-react';
import { AiModelOption, AiModelConfigState, AiProviderCategory } from '../types';

interface ModelSwitchHubProps {
  onNavigateToCopilot?: () => void;
  onShowToast?: (type: 'success' | 'error' | 'info' | 'warning', title: string, message: string) => void;
}

export const ModelSwitchHub: React.FC<ModelSwitchHubProps> = ({
  onNavigateToCopilot,
  onShowToast,
}) => {
  const [configState, setConfigState] = useState<AiModelConfigState>({
    activeModel: 'gemini-3.7-flash',
    models: [],
    nvidiaApiKeyConfigured: false,
    cursorApiKeyConfigured: false,
    geminiApiKeyConfigured: true,
  });
  const [selectedCategory, setSelectedCategory] = useState<AiProviderCategory | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [switchingModelId, setSwitchingModelId] = useState<string | null>(null);
  const [testPrompt, setTestPrompt] = useState('Analyze kubernetes memory slope for payment-gateway pod');
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [isTestingInference, setIsTestingInference] = useState(false);

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

  const currentActiveModel =
    configState.models.find((m) => m.id === configState.activeModel) || configState.models[0];

  const filteredModels =
    selectedCategory === 'all'
      ? configState.models
      : configState.models.filter((m) => m.category === selectedCategory);

  const getProviderIconColor = (cat: AiProviderCategory) => {
    switch (cat) {
      case 'google':
        return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30';
      case 'nvidia':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'cursor':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Hero Card */}
      <div className="bg-[#09090b] border border-white/10 rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Multi-LLM Orchestration
              </span>
              <span className="text-slate-500 text-xs">&bull;</span>
              <span className="text-xs text-slate-400 font-mono">NVIDIA NIM &bull; Cursor Bridge &bull; Gemini 3.7</span>
            </div>
            <h2 className="text-2xl font-black text-white tracking-tight flex items-center gap-2 font-display">
              <Cpu className="w-6 h-6 text-purple-400" />
              AI Model Switch & Inference Control Center
            </h2>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Dynamically switch reasoning engines across your SRE workspace. Run high-speed root-cause diagnostics, OOM slope forecasting, eBPF trace analysis, and automated kubectl remediations using Google Gemini, NVIDIA NIM API, or Cursor / Anthropic endpoints.
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
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-400' : ''}`} />
            </button>
          </div>
        </div>
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
              <span>Latency: <strong className="text-emerald-400 font-mono">{currentActiveModel?.speed}</strong></span>
              <span>&bull;</span>
              <span>Context: <strong className="text-cyan-400 font-mono">{currentActiveModel?.contextWindow}</strong></span>
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
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              {configState.nvidiaApiKeyConfigured ? 'KEY CONNECTED' : 'KEY READY / SETTINGS'}
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
              <Code2 className="w-4 h-4 text-purple-400" /> Cursor / Anthropic API Bridge
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                configState.cursorApiKeyConfigured
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}
            >
              {configState.cursorApiKeyConfigured ? 'BRIDGE ARMED' : 'BRIDGE READY / SETTINGS'}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 mb-2">
            Access Claude 3.7 Sonnet, GPT-4o, and DeepSeek-Coder through Cursor IDE / Anthropic API token.
          </p>
          <div className="text-[10px] font-mono text-slate-400 bg-[#18181b] px-2.5 py-1 rounded border border-white/5 flex items-center justify-between">
            <span>Env: CURSOR_API_KEY</span>
            <span className="text-purple-300">OpenAI / Claude API</span>
          </div>
        </div>
      </div>

      {/* Provider Filter Tabs */}
      <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'all', label: 'All AI Engines', count: configState.models.length },
            {
              id: 'nvidia',
              label: 'NVIDIA NIM Catalog',
              count: configState.models.filter((m) => m.category === 'nvidia').length,
            },
            {
              id: 'cursor',
              label: 'Cursor & Anthropic Bridge',
              count: configState.models.filter((m) => m.category === 'cursor').length,
            },
            {
              id: 'google',
              label: 'Google Gemini',
              count: configState.models.filter((m) => m.category === 'google').length,
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
          {filteredModels.length} Models Available
        </span>
      </div>

      {/* Model Selection Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredModels.map((model) => {
          const isActive = configState.activeModel === model.id;
          const isSwitching = switchingModelId === model.id;
          const badgeClass = getProviderIconColor(model.category);

          return (
            <div
              key={model.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col justify-between relative ${
                isActive
                  ? 'bg-[#18181b] border-purple-500 shadow-xl shadow-purple-500/10 ring-1 ring-purple-500/50'
                  : 'bg-[#09090b] border-white/10 hover:border-white/20'
              }`}
            >
              {isActive && (
                <div className="absolute top-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 text-[10px] font-bold">
                  <CheckCircle2 className="w-3 h-3 text-purple-400" />
                  <span>Current Engine</span>
                </div>
              )}

              <div>
                {/* Header info */}
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${badgeClass}`}>
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
            className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-black font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-md shrink-0"
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

      {/* How to configure NVIDIA / Cursor API Keys Information Card */}
      <div className="bg-[#09090b] border border-blue-500/30 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="text-sm font-bold text-white">How to Provide NVIDIA & Cursor API Keys</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-[#141416] border border-white/5 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-emerald-400" /> 1. NVIDIA NIM API Key
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              NVIDIA provides free evaluation credits and production API keys at <code className="text-emerald-300">build.nvidia.com</code>. Add <code className="text-white font-mono">NVIDIA_API_KEY=nvapi-...</code> in the project settings or environment variables to unlock high-speed inference for DeepSeek-R1 (671B) and Llama 3.3.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#141416] border border-white/5 space-y-2">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <Code2 className="w-4 h-4 text-purple-400" /> 2. Cursor / Anthropic API Key
            </h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              To route queries through Cursor IDE or Anthropic / OpenAI keys, configure <code className="text-white font-mono">CURSOR_API_KEY=...</code>. This enables Claude 3.7 Sonnet for autonomous codebase refactoring and Git PR generation.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
