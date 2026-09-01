import React, { useState, useMemo } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Bell,
  Bot,
  Check,
  CheckCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Flame,
  GitBranch,
  Info,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  Terminal,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { DiagnosticIssue, PredictiveOOMAlert, WorkflowRun, AutoHealingRecord } from '../types';
import { TabType } from './NavigationTabs';

export interface AppNotification {
  id: string;
  category: 'incident' | 'predictive' | 'cicd' | 'security' | 'heal' | 'system';
  severity: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  description: string;
  timestamp: string;
  service?: string;
  actionLabel?: string;
  targetTab?: TabType;
  read: boolean;
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
  issues: DiagnosticIssue[];
  predictiveAlerts: PredictiveOOMAlert[];
  workflowRuns: WorkflowRun[];
  healingHistory: AutoHealingRecord[];
  onNavigateToTab: (tab: TabType) => void;
  onHealIssue?: (issueId: string) => void;
  theme?: 'dark' | 'light';
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSimulateIncident?: (type: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  isOpen,
  onClose,
  issues,
  predictiveAlerts,
  workflowRuns,
  healingHistory,
  onNavigateToTab,
  onHealIssue,
  theme = 'dark',
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSimulateIncident,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'critical' | 'incident' | 'cicd' | 'security'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const isLight = theme === 'light';

  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      // Filter by category / severity tab
      if (selectedFilter === 'critical') {
        if (item.severity !== 'critical') return false;
      } else if (selectedFilter === 'incident') {
        if (item.category !== 'incident' && item.category !== 'heal') return false;
      } else if (selectedFilter === 'cicd') {
        if (item.category !== 'cicd') return false;
      } else if (selectedFilter === 'security') {
        if (item.category !== 'security') return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          (item.service && item.service.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [notifications, selectedFilter, searchQuery]);

  if (!isOpen) return null;

  const getNotificationIcon = (category: AppNotification['category'], severity: AppNotification['severity']) => {
    switch (category) {
      case 'incident':
        return <Flame className="w-4 h-4 text-rose-400" />;
      case 'predictive':
        return <TrendingUp className="w-4 h-4 text-amber-400" />;
      case 'cicd':
        return <GitBranch className="w-4 h-4 text-cyan-400" />;
      case 'security':
        return <ShieldAlert className="w-4 h-4 text-purple-400" />;
      case 'heal':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      default:
        if (severity === 'critical') return <AlertOctagon className="w-4 h-4 text-rose-400" />;
        if (severity === 'warning') return <AlertTriangle className="w-4 h-4 text-amber-400" />;
        return <Info className="w-4 h-4 text-blue-400" />;
    }
  };

  const getSeverityBadge = (severity: AppNotification['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'warning':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'success':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Floating Notification Flyout Card */}
      <div
        className={`fixed top-14 right-4 sm:right-6 md:right-8 z-50 w-[95vw] sm:w-[460px] max-h-[85vh] rounded-2xl border shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 ${
          isLight
            ? 'bg-white/95 border-slate-200 text-slate-900 shadow-slate-900/15 backdrop-blur-xl'
            : 'bg-[#0f131d]/95 border-[#202738] text-white shadow-black/60 backdrop-blur-xl'
        }`}
      >
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'border-slate-200 bg-slate-50/70' : 'border-[#1b2234] bg-[#0c0f17]'}`}>
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                <Bell className="w-4 h-4" />
              </div>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white font-mono text-[10px] font-extrabold rounded-full animate-pulse shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-sm tracking-tight">Notifications & Alerts</h3>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {notifications.length} Total
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Live operational telemetry & triage receipts</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer ${
                  isLight
                    ? 'border-slate-300 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                    : 'border-slate-700 text-slate-300 hover:bg-[#1a2133] hover:text-white'
                }`}
                title="Mark all as read"
              >
                <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline text-[11px]">Mark Read</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                isLight
                  ? 'border-slate-200 text-slate-500 hover:bg-slate-200 hover:text-slate-900'
                  : 'border-slate-800 text-slate-400 hover:bg-[#1a2133] hover:text-white'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Chips & Search Bar */}
        <div className={`p-3 border-b space-y-2 ${isLight ? 'border-slate-200 bg-white' : 'border-[#1b2234] bg-[#0f131d]'}`}>
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter alerts by service, severity, keyword..."
              className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border transition-colors focus:outline-hidden ${
                isLight
                  ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:bg-white'
                  : 'bg-[#141926] border-[#222b3e] text-slate-200 placeholder:text-slate-500 focus:border-emerald-500/60'
              }`}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { id: 'all', label: 'All', count: notifications.length },
              {
                id: 'critical',
                label: 'Critical',
                count: notifications.filter((n) => n.severity === 'critical').length,
              },
              {
                id: 'incident',
                label: 'Incidents',
                count: notifications.filter((n) => n.category === 'incident' || n.category === 'heal').length,
              },
              {
                id: 'cicd',
                label: 'CI/CD',
                count: notifications.filter((n) => n.category === 'cicd').length,
              },
              {
                id: 'security',
                label: 'Security',
                count: notifications.filter((n) => n.category === 'security').length,
              },
            ].map((tab) => {
              const active = selectedFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSelectedFilter(tab.id as any)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer ${
                    active
                      ? isLight
                        ? 'bg-emerald-100 text-emerald-900 border-emerald-400 font-bold'
                        : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                      : isLight
                      ? 'text-slate-600 border-slate-200 hover:bg-slate-100'
                      : 'text-slate-400 border-[#1f2638] hover:bg-[#151b29] hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`ml-1 px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                        active
                          ? 'bg-emerald-500/30 text-emerald-200'
                          : isLight
                          ? 'bg-slate-200 text-slate-700'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Notifications Scroll List */}
        <div className="flex-1 overflow-y-auto divide-y divide-[#1b2234]/40 max-h-[50vh] p-2 space-y-1.5">
          {filteredNotifications.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">All Systems Nominal</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                  {searchQuery
                    ? 'No alerts match your search query.'
                    : 'No pending critical incidents or unread alerts in this queue.'}
                </p>
              </div>
              {onSimulateIncident && (
                <button
                  type="button"
                  onClick={() => {
                    onSimulateIncident('ddos');
                    onClose();
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#121622] hover:bg-[#1a2133] border border-[#222a3e] text-xs font-semibold text-slate-300 transition-colors"
                >
                  <Flame className="w-3.5 h-3.5 text-rose-400" />
                  <span>Simulate Test Incident</span>
                </button>
              )}
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const isUnread = !notif.read;

              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded-xl border transition-all duration-150 relative group ${
                    isUnread
                      ? isLight
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-900 shadow-xs'
                        : 'bg-[#121724] border-[#222c42] text-white shadow-xs'
                      : isLight
                      ? 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50'
                      : 'bg-[#0e111a]/80 border-[#1a2030] text-slate-300 hover:bg-[#121622]'
                  }`}
                >
                  {/* Unread blue dot indicator */}
                  {isUnread && (
                    <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-500/50 animate-pulse" />
                  )}

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-slate-800/80 border border-slate-700/60 shrink-0 mt-0.5">
                      {getNotificationIcon(notif.category, notif.severity)}
                    </div>

                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span
                          className={`px-1.5 py-0.2 rounded-md text-[9px] font-extrabold uppercase tracking-wider border ${getSeverityBadge(
                            notif.severity
                          )}`}
                        >
                          {notif.severity}
                        </span>

                        {notif.service && (
                          <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 border border-slate-700">
                            {notif.service}
                          </span>
                        )}

                        <span className="text-[10px] text-slate-500 font-mono">{notif.timestamp}</span>
                      </div>

                      <h4
                        className={`text-xs font-bold leading-tight line-clamp-1 ${
                          isUnread ? (isLight ? 'text-slate-900' : 'text-white') : 'text-slate-300'
                        }`}
                      >
                        {notif.title}
                      </h4>

                      <p className="text-[11px] text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {notif.description}
                      </p>

                      {/* Action buttons */}
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                        {notif.targetTab && (
                          <button
                            type="button"
                            onClick={() => {
                              onMarkAsRead(notif.id);
                              onNavigateToTab(notif.targetTab!);
                              onClose();
                            }}
                            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                              isLight
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600'
                                : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border-emerald-500/40'
                            }`}
                          >
                            <span>{notif.actionLabel || 'View in Hub'}</span>
                            <ChevronRight className="w-3 h-3" />
                          </button>
                        )}

                        {isUnread && (
                          <button
                            type="button"
                            onClick={() => onMarkAsRead(notif.id)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700 transition-colors"
                          >
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className={`p-3 border-t flex items-center justify-between text-xs ${isLight ? 'border-slate-200 bg-slate-50' : 'border-[#1b2234] bg-[#0c0f17]'}`}>
          <button
            type="button"
            onClick={onClearAll}
            className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear notification history</span>
          </button>

          <button
            type="button"
            onClick={() => {
              onNavigateToTab('alerts');
              onClose();
            }}
            className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer"
          >
            <span>Alert Webhooks Hub</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </>
  );
};
