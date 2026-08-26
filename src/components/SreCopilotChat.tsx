import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Code2,
  Copy,
  CornerDownLeft,
  Cpu,
  Flame,
  Lightbulb,
  Radio,
  RefreshCw,
  Send,
  Sliders,
  Sparkles,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { SreChatMessage } from '../types';

interface SreCopilotChatProps {
  onExecuteAction?: (actionType: string, payload?: any) => void;
}

interface AiModelOption {
  id: string;
  name: string;
  provider: string;
  tier: string;
  speed: string;
  contextWindow: string;
  isDefault?: boolean;
}

export const SreCopilotChat: React.FC<SreCopilotChatProps> = ({ onExecuteAction }) => {
  const [messages, setMessages] = useState<SreChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [activeModel, setActiveModel] = useState<string>('gemini-3.7-flash');
  const [models, setModels] = useState<AiModelOption[]>([
    { id: 'gemini-3.7-flash', name: 'Gemini 3.7 Flash', provider: 'Google Cloud Vertex/AI Studio', tier: 'Ultra-Fast SRE Reasoning', speed: '45ms', contextWindow: '1M tokens' },
    { id: 'gemini-flash-latest', name: 'Gemini Flash Latest', provider: 'Google Cloud Vertex/AI Studio', tier: 'High-Throughput Live Telemetry', speed: '35ms', contextWindow: '1M tokens' },
    { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', provider: 'Google Cloud Vertex/AI Studio', tier: 'High-Throughput Microservice Telemetry', speed: '25ms', contextWindow: '1M tokens' },
    { id: 'deepseek-r1', name: 'DeepSeek-R1 (SRE Agent)', provider: 'Self-Hosted vLLM / Ollama', tier: 'Open-Weights Local Reasoning', speed: '85ms', contextWindow: '128K tokens' },
    { id: 'claude-3-7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic Bedrock Bridge', tier: 'Hybrid Infrastructure Orchestrator', speed: '95ms', contextWindow: '200K tokens' },
    { id: 'gpt-4o', name: 'OpenAI GPT-4o', provider: 'Azure OpenAI Service', tier: 'General CloudOps Automation', speed: '90ms', contextWindow: '128K tokens' },
  ]);
  const [isSwitchingModel, setIsSwitchingModel] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistoryAndModels = async () => {
    try {
      const [historyRes, modelsRes] = await Promise.all([
        fetch('/api/ai/sre-chat/history'),
        fetch('/api/ai/models'),
      ]);

      if (historyRes.ok) {
        const data = await historyRes.json();
        setMessages(data.messages || []);
        if (data.activeModel) setActiveModel(data.activeModel);
      }

      if (modelsRes.ok) {
        const mData = await modelsRes.json();
        if (mData.models) setModels(mData.models);
        if (mData.activeModel) setActiveModel(mData.activeModel);
      }
    } catch (err) {
      console.error('Failed to fetch chat history or models:', err);
    }
  };

  useEffect(() => {
    fetchHistoryAndModels();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleModelChange = async (modelId: string) => {
    try {
      setIsSwitchingModel(true);
      const res = await fetch('/api/ai/models/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ modelId }),
      });
      if (res.ok) {
        const data = await res.json();
        setActiveModel(data.activeModel);
      }
    } catch (err) {
      console.error('Error switching model:', err);
    } finally {
      setIsSwitchingModel(false);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || inputMessage;
    if (!text.trim() || isLoading) return;

    setInputMessage('');
    setIsLoading(true);

    // Optimistically add user message
    const tempUserMsg: SreChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      timestamp: new Date().toISOString(),
      text,
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch('/api/ai/sre-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, model: activeModel }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.allMessages) {
          setMessages(data.allMessages);
        } else if (data.message) {
          setMessages((prev) => [...prev, data.message]);
        }
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const currentModelObj = models.find((m) => m.id === activeModel) || models[0];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col h-[740px]">
      {/* Copilot Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Autonomous SRE AI Copilot
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live K8s Agent
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Correlating real-time Kubernetes metrics, predictive OOM slopes, GitOps manifests, and eBPF traces.
            </p>
          </div>
        </div>

        {/* AI Engine & Model Switcher Dropdown */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span className="text-[11px] font-bold text-slate-400">AI Model:</span>
            <select
              value={activeModel}
              onChange={(e) => handleModelChange(e.target.value)}
              disabled={isSwitchingModel}
              className="bg-transparent text-xs font-semibold text-white focus:outline-none cursor-pointer"
            >
              {models.map((m) => (
                <option key={m.id} value={m.id} className="bg-slate-900 text-white">
                  {m.name} ({m.tier})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchHistoryAndModels}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Refresh telemetry context & chat history"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Model Spec & Context Indicator Bar */}
      <div className="bg-slate-950/60 px-5 py-2 border-b border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-3">
          <span>Active Engine: <span className="font-semibold text-purple-300">{currentModelObj.name}</span></span>
          <span>&bull;</span>
          <span>Latency Tier: <span className="font-mono text-emerald-400 font-semibold">{currentModelObj.speed}</span></span>
          <span>&bull;</span>
          <span>Context Window: <span className="font-mono text-cyan-400">{currentModelObj.contextWindow}</span></span>
        </div>
        <span className="text-slate-500 font-mono text-[10px] hidden sm:inline">
          Provider: {currentModelObj.provider}
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-900/60">
        {messages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div
              key={msg.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0 mt-1">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed space-y-3 ${
                  isUser
                    ? 'bg-cyan-600 text-white shadow-md'
                    : 'bg-slate-950 border border-slate-800 text-slate-200 shadow-md'
                }`}
              >
                <div className="whitespace-pre-wrap">{msg.text}</div>

                {/* Optional Code Snippet Block */}
                {msg.codeSnippet && (
                  <div className="rounded-lg border border-slate-800 bg-slate-900 overflow-hidden mt-2">
                    <div className="bg-slate-800/80 px-3 py-1.5 border-b border-slate-700/60 flex items-center justify-between">
                      <span className="text-[11px] font-mono font-semibold text-slate-300 flex items-center gap-1.5">
                        <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                        {msg.codeSnippet.title || msg.codeSnippet.language}
                      </span>
                      <button
                        onClick={() => handleCopyCode(msg.codeSnippet!.code, msg.id)}
                        className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition-colors"
                      >
                        {copiedCodeId === msg.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <pre className="p-3 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                      {msg.codeSnippet.code}
                    </pre>
                  </div>
                )}

                {/* Interactive Action Chips inside message */}
                {msg.suggestedActions && msg.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-800/60 mt-3">
                    {msg.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => onExecuteAction && onExecuteAction(action.actionType, action.payload)}
                        className="px-2.5 py-1 rounded-md bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center gap-1 text-[11px] font-semibold transition-colors"
                      >
                        <Zap className="w-3 h-3 text-purple-400" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 text-purple-300 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />
              <span>Analyzing cluster telemetry with {currentModelObj.name}...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Prompts */}
      <div className="bg-slate-950 px-5 py-2 border-t border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px]">
        <span className="text-slate-500 font-semibold shrink-0">Quick Prompts:</span>
        <button
          onClick={() => handleSendMessage('Why is payment-gateway leaking memory and how to patch it?')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
        >
          Diagnose Payment Gateway Leak
        </button>
        <button
          onClick={() => handleSendMessage('Generate kubectl command to safely patch memory limits and rolling restart')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
        >
          Generate kubectl Patch
        </button>
        <button
          onClick={() => handleSendMessage('Explain Go vs Python vs Rust runtime metrics in this cluster')}
          className="px-2.5 py-1 rounded-md bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 whitespace-nowrap"
        >
          Multi-Language Telemetry Analysis
        </button>
      </div>

      {/* Input Box */}
      <div className="bg-slate-950 p-4 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-3"
        >
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Ask ${currentModelObj.name} about your cluster, incidents, or kubectl manifests...`}
            className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-purple-500/20"
          >
            <span>Send</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
