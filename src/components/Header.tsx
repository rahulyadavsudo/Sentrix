import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  Bot,
  CheckCircle2,
  ChevronDown,
  Cpu,
  Github,
  HardDrive,
  Moon,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldCheck,
  Sparkles,
  Sun,
  Zap,
} from 'lucide-react';
import { ClusterStats, GitHubRepo } from '../types';

interface HeaderProps {
  stats: ClusterStats | null;
  repo: GitHubRepo | null;
  autonomousHealing: boolean;
  onToggleAutonomousHealing: () => void;
  onSimulateIncident: (type: string) => void;
  onTriggerPipeline: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  onOpenRegisterCluster?: () => void;
  primaryClusterName?: string;
  activeAiModelName?: string;
  onOpenModelSwitchTab?: () => void;
  onOpenUITemplates?: () => void;
  onOpenAiAssistant?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  stats,
  repo,
  autonomousHealing,
  onToggleAutonomousHealing,
  onSimulateIncident,
  onTriggerPipeline,
  onRefresh,
  isLoading,
  theme = 'dark',
  onToggleTheme,
  onOpenRegisterCluster,
  primaryClusterName = 'gke-prod-us-west1',
  activeAiModelName = 'Gemini 3.7 Flash',
  onOpenModelSwitchTab,
  onOpenUITemplates,
  onOpenAiAssistant,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  return (
    <header className="bg-[#090b10] border-b border-[#161a26] text-white sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Organization / Cluster Selector + Search Bar */}
          <div className="flex items-center gap-3 flex-1 max-w-2xl">
            {/* SentriX HQ Selector Pill */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#121622] hover:bg-[#181d2c] border border-[#202738] text-xs font-semibold text-white shadow-sm transition-all whitespace-nowrap"
              >
                <div className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <span>SentriX HQ</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isOrgDropdownOpen && (
                <div className="absolute top-full left-0 mt-2 w-56 bg-[#10131c] border border-[#202738] rounded-xl shadow-2xl p-2 z-50 space-y-1">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 py-1">
                    Select Cluster & Org
                  </div>
                  <button
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      onOpenRegisterCluster?.();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#181d2c] text-emerald-400 font-semibold flex items-center justify-between"
                  >
                    <span>SentriX HQ (Primary)</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  </button>
                  <button
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      onOpenRegisterCluster?.();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#181d2c] text-slate-300 flex items-center justify-between"
                  >
                    <span>EKS us-east-1</span>
                    <span className="text-[10px] text-slate-500 font-mono">AWS</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      onOpenRegisterCluster?.();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg text-xs hover:bg-[#181d2c] text-slate-300 flex items-center justify-between"
                  >
                    <span>AKS westeurope</span>
                    <span className="text-[10px] text-slate-500 font-mono">Azure</span>
                  </button>
                </div>
              )}
            </div>

            {/* Global Search Bar with Keyboard Shortcut */}
            <div className="relative flex-1 max-w-md hidden sm:block">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets, threats, CVEs, IPs, incidents..."
                className="w-full pl-8 pr-12 py-1.5 rounded-xl bg-[#121622] border border-[#202738] focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/40 text-xs text-slate-200 placeholder:text-slate-500 transition-all outline-none"
              />
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700">
                ⌘K
              </span>
            </div>
          </div>

          {/* Right Action Icons & Profile Info matching screenshot */}
          <div className="flex items-center gap-2.5">
            {/* Live Pulse Activity Icon */}
            <button
              onClick={() => onSimulateIncident('memory_leak')}
              className="p-2 rounded-xl bg-[#121622] hover:bg-[#181d2c] border border-[#202738] text-slate-400 hover:text-emerald-400 transition-colors"
              title="Test Live Telemetry Pulse"
            >
              <Activity className="w-3.5 h-3.5" />
            </button>

            {/* Telemetry Refresh Icon */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-2 rounded-xl bg-[#121622] hover:bg-[#181d2c] border border-[#202738] text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Notification Bell with Red Alert Dot */}
            <button
              onClick={() => onSimulateIncident('ddos')}
              className="p-2 rounded-xl bg-[#121622] hover:bg-[#181d2c] border border-[#202738] text-slate-400 hover:text-white transition-colors relative"
              title="Notifications & Alerts"
            >
              <Bell className="w-3.5 h-3.5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 border border-[#090b10]" />
            </button>

            {/* AI Assistant Emerald Pill Button */}
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#0e241c] hover:bg-[#143328] text-[#10b981] border border-[#10b981]/40 text-xs font-bold transition-all shadow-sm group"
            >
              <Bot className="w-3.5 h-3.5 text-[#10b981] group-hover:rotate-12 transition-transform" />
              <span>AI Assistant</span>
            </button>

            {/* User Profile Info & Avatar */}
            <div className="flex items-center gap-2 pl-1 border-l border-[#202738]">
              <div className="relative">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/40">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                    alt="Marcus Weber"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090b10] absolute -bottom-0.5 -right-0.5" />
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-white leading-none">Marcus Weber</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5 leading-none">
                  SOC Analyst Lead
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
