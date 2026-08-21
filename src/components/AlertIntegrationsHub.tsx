import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  ExternalLink,
  MessageSquare,
  Radio,
  RefreshCw,
  Send,
  ShieldAlert,
  Terminal,
  Zap,
} from 'lucide-react';
import { AlertIntegrationChannel } from '../types';

interface AlertIntegrationsHubProps {
  channels: AlertIntegrationChannel[];
  onTestWebhook: (channelId: string) => Promise<void>;
}

export const AlertIntegrationsHub: React.FC<AlertIntegrationsHubProps> = ({
  channels,
  onTestWebhook,
}) => {
  const [testingId, setTestingId] = useState<string | null>(null);

  const handleTest = async (id: string) => {
    setTestingId(id);
    await onTestWebhook(id);
    setTestingId(null);
  };

  const getChannelIcon = (type: string) => {
    switch (type) {
      case 'Slack':
        return <MessageSquare className="w-5 h-5 text-emerald-400" />;
      case 'PagerDuty':
        return <ShieldAlert className="w-5 h-5 text-rose-400" />;
      case 'Prometheus Alertmanager':
        return <Radio className="w-5 h-5 text-amber-400" />;
      default:
        return <Bell className="w-5 h-5 text-cyan-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <Bell className="w-5 h-5 text-amber-400" />
            Alert Integrations & Webhook Notification Dispatcher
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Live notification routing syncing predictive OOM alerts, automated remediation receipts, and SLO burn rate events with Slack war rooms, PagerDuty, and Prometheus Alertmanager.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div className="text-right">
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Channels</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {channels.filter((c) => c.status === 'connected').length} Connected
            </div>
          </div>
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {channels.map((channel) => {
          return (
            <div
              key={channel.id}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                      {getChannelIcon(channel.channelType)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">{channel.name}</h3>
                      <span className="text-xs text-slate-400">{channel.channelType}</span>
                    </div>
                  </div>

                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                {/* Webhook Endpoint */}
                <div className="mt-4 bg-slate-950 border border-slate-800 rounded-lg p-2.5">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block">Webhook Target</span>
                  <div className="text-[11px] font-mono text-cyan-300 truncate mt-0.5">
                    {channel.endpoint}
                  </div>
                </div>

                {/* Subscribed Events */}
                <div className="mt-3">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold block mb-1.5">
                    Subscribed Telemetry Topics
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {channel.eventsSubscribed.map((evt, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700"
                      >
                        {evt}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button & Last Fired */}
              <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[10px] text-slate-500">
                  Last fired: {channel.lastFiredAt ? new Date(channel.lastFiredAt).toLocaleTimeString() : 'Never'}
                </span>

                <button
                  onClick={() => handleTest(channel.id)}
                  disabled={testingId === channel.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-xs font-bold text-white transition-all border border-slate-700"
                >
                  {testingId === channel.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )}
                  <span>{testingId === channel.id ? 'Sending...' : 'Test Alert'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
