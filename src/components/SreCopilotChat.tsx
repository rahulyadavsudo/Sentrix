import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  Check,
  Code2,
  Copy,
  CornerDownLeft,
  Flame,
  Lightbulb,
  Radio,
  RefreshCw,
  Send,
  Sparkles,
  Terminal,
  User,
  Zap,
} from 'lucide-react';
import { SreChatMessage } from '../types';

interface SreCopilotChatProps {
  onExecuteAction?: (actionType: string, payload?: any) => void;
}

export const SreCopilotChat: React.FC<SreCopilotChatProps> = ({ onExecuteAction }) => {
  const [messages, setMessages] = useState<SreChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchHistory = async () => {
    try {
      const res = await fetch('/api/ai/sre-chat/history');
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

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
        body: JSON.stringify({ message: text }),
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

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-xl overflow-hidden flex flex-col h-[700px]">
      {/* Copilot Header */}
      <div className="bg-slate-950 border-b border-slate-800 px-5 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              Gemini SRE & CloudOps Autonomous Copilot
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live K8s Agent
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              Correlating real-time Kubernetes metrics, predictive OOM slopes, GitOps manifests, and eBPF traces.
            </p>
          </div>
        </div>

        <button
          onClick={fetchHistory}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          title="Refresh telemetry context"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
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
                  <div className="pt-2 border-t border-slate-800/80 flex flex-wrap gap-2">
                    {msg.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => onExecuteAction && onExecuteAction(action.actionType, action.payload)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-bold text-[11px] transition-all shadow-sm"
                      >
                        <Zap className="w-3 h-3" />
                        <span>{action.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/30 text-cyan-300 flex items-center justify-center shrink-0 mt-1">
                  <User className="w-4 h-4" />
                </div>
              )}
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
              <span>Analyzing cluster telemetry and generating SRE triage report...</span>
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
            placeholder="Ask AI SRE Copilot anything about your cluster, incidents, or kubectl manifests..."
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
