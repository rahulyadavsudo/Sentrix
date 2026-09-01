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
  Globe,
  HardDrive,
  Layers,
  LogIn,
  Menu,
  Moon,
  PanelLeft,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Sun,
  Trash2,
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
  onOpenRepoSyncModal?: () => void;
  onConnectRepo?: (repoUrl: string, token?: string) => Promise<any>;
  primaryClusterName?: string;
  activeAiModelName?: string;
  onOpenModelSwitchTab?: () => void;
  onOpenUITemplates?: () => void;
  onOpenAiAssistant?: () => void;
  isDemoMode?: boolean;
  onClearDemoData?: () => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
  unreadNotificationCount?: number;
  onToggleNotifications?: () => void;
  onOpenCommandPalette?: () => void;
  activeIssueCount?: number;
  currentUser?: { name: string; email: string; avatarUrl: string; role: string } | null;
  onOpenAuthModal?: () => void;
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
  onOpenRepoSyncModal,
  onConnectRepo,
  primaryClusterName = 'gke-prod-us-west1',
  activeAiModelName = 'Gemini 3.7 Flash',
  onOpenModelSwitchTab,
  onOpenUITemplates,
  onOpenAiAssistant,
  isDemoMode,
  onClearDemoData,
  onToggleSidebar,
  isSidebarCollapsed,
  unreadNotificationCount = 0,
  onToggleNotifications,
  onOpenCommandPalette,
  activeIssueCount = 0,
  currentUser,
  onOpenAuthModal,
}) => {
  const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

  const isLight = theme === 'light';

  return (
    <header
      className={`${
        isLight
          ? 'bg-white/95 border-b border-slate-200/80 text-slate-900 shadow-xs backdrop-blur-md'
          : 'bg-[#090b10]/95 border-b border-[#161a26] text-white shadow-md backdrop-blur-md'
      } sticky top-0 z-40 transition-colors duration-200`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-5 lg:px-8 py-2">
        <div className="flex items-center justify-between gap-2.5 sm:gap-4">
          {/* Left: Sidebar Toggle + Org/Cluster Selector + GitHub Repo + Search */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-1 max-w-2xl min-w-0">
            {/* Sidebar Toggle Button */}
            {onToggleSidebar && (
              <button
                type="button"
                onClick={onToggleSidebar}
                className={`p-2 rounded-xl border transition-all cursor-pointer shrink-0 ${
                  isLight
                    ? 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200 hover:text-slate-900'
                    : 'bg-[#121622] border-[#202738] text-slate-300 hover:bg-[#181d2c] hover:text-white'
                }`}
                title={isSidebarCollapsed ? 'Expand Navigation Sidebar' : 'Collapse Navigation Sidebar'}
              >
                <PanelLeft className="w-4 h-4 text-emerald-400" />
              </button>
            )}

            {/* Cluster Selector Dropdown */}
            <div className="relative shrink-0">
              <button
                type="button"
                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                className={`flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs font-semibold shadow-xs transition-all whitespace-nowrap ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-900'
                    : 'bg-[#121622] hover:bg-[#181d2c] border-[#202738] text-white'
                }`}
              >
                <div className="w-4 h-4 rounded-md bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <ShieldCheck className="w-3 h-3" />
                </div>
                <span className="hidden md:inline font-mono text-[11px]">{primaryClusterName}</span>
                <span className="md:hidden font-mono text-[11px]">GKE</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {isOrgDropdownOpen && (
                <div
                  className={`absolute top-full left-0 mt-2 w-60 rounded-2xl border shadow-2xl p-2 z-50 space-y-1 animate-in fade-in duration-150 ${
                    isLight
                      ? 'bg-white border-slate-200 text-slate-900 shadow-slate-900/15'
                      : 'bg-[#10131c] border-[#202738] text-white shadow-black/80'
                  }`}
                >
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-2 py-1 font-mono">
                    Select Kubernetes Fleet
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      onOpenRegisterCluster?.();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-emerald-700' : 'hover:bg-[#181d2c] text-emerald-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>gke-prod-us-west1</span>
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                      Primary
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      onOpenRegisterCluster?.();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-[#181d2c] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span>eks-us-east-1</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">AWS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOrgDropdownOpen(false);
                      onOpenRegisterCluster?.();
                    }}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors ${
                      isLight ? 'hover:bg-slate-100 text-slate-700' : 'hover:bg-[#181d2c] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-400" />
                      <span>aks-westeurope</span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">Azure</span>
                  </button>

                  <div className="pt-1 border-t border-slate-800/60 mt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOrgDropdownOpen(false);
                        onOpenRegisterCluster?.();
                      }}
                      className="w-full px-2 py-1.5 rounded-lg text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 flex items-center gap-1.5 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Attach Cluster (Kubeconfig)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Connected GitHub Repository Pill */}
            <button
              type="button"
              onClick={onOpenRepoSyncModal}
              className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border text-xs shadow-xs transition-all whitespace-nowrap group shrink-0 ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-900'
                  : 'bg-[#121622] hover:bg-[#181d2c] border-emerald-500/30 hover:border-emerald-500/60 text-white'
              }`}
              title="Click to switch or connect a GitHub repository across all services"
            >
              <Github className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              <span className="font-mono text-emerald-500 font-bold max-w-[100px] sm:max-w-[130px] truncate">
                {repo?.owner && repo?.name ? `${repo.owner}/${repo.name}` : 'Connect Repo'}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Global Search Button / Trigger for Spotlight Command Palette */}
            <div
              onClick={onOpenCommandPalette}
              className={`relative flex-1 max-w-xs hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                isLight
                  ? 'bg-slate-100/90 hover:bg-slate-200/70 border-slate-200 text-slate-600 hover:text-slate-900'
                  : 'bg-[#121622] hover:bg-[#161c2b] border-[#202738] hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
              title="Press ⌘K or Ctrl+K to search all commands and modules"
            >
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-xs truncate select-none">Search modules, incidents, CVEs...</span>
              <div className="ml-auto flex items-center gap-0.5">
                <kbd className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Action Icons & Live Status Indicators */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Live Operational Status Pill */}
            <div
              className={`hidden xl:flex items-center gap-2 px-2.5 py-1 rounded-xl border text-[11px] font-mono font-bold ${
                activeIssueCount > 0
                  ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              }`}
              title={activeIssueCount > 0 ? `${activeIssueCount} active diagnostic issues detected` : 'Cluster SLO & Telemetry 100% nominal'}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeIssueCount > 0 ? 'bg-rose-400 animate-ping' : 'bg-emerald-400 animate-pulse'
                }`}
              />
              <span>{activeIssueCount > 0 ? `${activeIssueCount} Alerts` : '99.98% SLO'}</span>
            </div>

            {/* Theme Toggle */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                  isLight
                    ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                    : 'bg-[#121622] hover:bg-[#181d2c] border-[#202738] text-slate-300'
                }`}
                title={`Switch to ${isLight ? 'Dark Luxury' : 'Clean Light'} Mode`}
              >
                {isLight ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Telemetry Refresh Icon */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className={`p-2 rounded-xl border transition-colors disabled:opacity-50 cursor-pointer ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-[#121622] hover:bg-[#181d2c] border-[#202738] text-slate-300'
              }`}
              title="Refresh telemetry"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            {/* Interactive Notification Bell with Unread Count Badge */}
            <button
              type="button"
              onClick={onToggleNotifications}
              className={`p-2 rounded-xl border transition-all relative cursor-pointer group ${
                isLight
                  ? 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                  : 'bg-[#121622] hover:bg-[#181d2c] border-[#202738] text-slate-300'
              }`}
              title={`Notifications & Alerts (${unreadNotificationCount} unread)`}
            >
              <Bell className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 border-2 border-[#090b10] text-[9px] font-mono font-black text-white flex items-center justify-center animate-pulse shadow-md">
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </span>
              )}
            </button>

            {/* Clear Demo Data / Pure Live Mode Toggle */}
            {isDemoMode ? (
              <button
                type="button"
                onClick={onClearDemoData}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/30 text-xs font-bold transition-all shadow-xs group cursor-pointer"
                title="Click to remove all mock and demo data to operate in pure live mode"
              >
                <Trash2 className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:inline">Clear Demo</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClearDemoData}
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-500 text-xs font-bold transition-all shadow-xs group cursor-pointer"
                title="Live mode active. Click to purge all cached states and verify pure live integration."
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Live Mode</span>
              </button>
            )}

            {/* AI Assistant Pill Button */}
            <button
              onClick={onOpenAiAssistant}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e241c] hover:bg-[#143328] text-[#10b981] border border-[#10b981]/40 text-xs font-bold transition-all shadow-xs group cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5 text-[#10b981] group-hover:rotate-12 transition-transform" />
              <span className="hidden sm:inline">AI Copilot</span>
            </button>

            {/* User Profile Avatar with Online Status */}
            <div className="flex items-center gap-2 pl-1.5 border-l border-slate-700/50">
              <button
                type="button"
                onClick={onOpenAuthModal}
                className={`flex items-center gap-2 p-1 rounded-xl transition-all cursor-pointer group ${
                  isLight ? 'hover:bg-slate-200/70' : 'hover:bg-slate-800/60'
                }`}
                title={currentUser ? `Logged in as ${currentUser.name} (${currentUser.role})` : 'Click to Sign In / Manage Operator Profile'}
              >
                {currentUser ? (
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full overflow-hidden border border-emerald-500/50 bg-slate-800 shadow-xs flex items-center justify-center">
                      <img
                        src={currentUser.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(currentUser.email)}`}
                        alt={currentUser.name}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[#090b10] absolute -bottom-0.5 -right-0.5" />
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-xs">
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </div>
                )}

                {currentUser && (
                  <div className="hidden lg:block text-left">
                    <div className="text-[11px] font-bold leading-tight group-hover:text-emerald-400 transition-colors">
                      {currentUser.name}
                    </div>
                    <div className="text-[9px] font-mono text-slate-400 leading-tight">
                      {currentUser.role}
                    </div>
                  </div>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
