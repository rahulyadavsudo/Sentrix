import React, { useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowRight,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  Globe,
  Radio,
  RefreshCw,
  Server,
  Shield,
  Shuffle,
  Zap,
} from 'lucide-react';
import { DisasterRecoveryRegion } from '../types';

interface DisasterRecoveryHubProps {
  regions: DisasterRecoveryRegion[];
  onFailover: (targetRegionId: string) => Promise<void>;
  onRefresh: () => void;
}

export const DisasterRecoveryHub: React.FC<DisasterRecoveryHubProps> = ({
  regions,
  onFailover,
  onRefresh,
}) => {
  const [isFailingOver, setIsFailingOver] = useState<boolean>(false);
  const [selectedRegionId, setSelectedRegionId] = useState<string>('');

  const primaryRegion = regions.find((r) => r.role === 'PRIMARY_ACTIVE');

  const handleTriggerFailover = async (targetId: string) => {
    setIsFailingOver(true);
    await onFailover(targetId);
    setIsFailingOver(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Globe className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Multi-Cloud Disaster Recovery & GSLB Failover Hub
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono font-bold">
                  ACTIVE-ACTIVE GSLB
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Global Server Load Balancing (GSLB) with BGP anycast routing, Cross-Cloud Spanner/Kafka replication, and automated sub-5s regional RTO failover.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">Primary Active Region</div>
            <div className="text-sm font-bold text-cyan-400 font-mono flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>{primaryRegion?.name || 'GCP us-central1'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Global RTO / RPO Target vs Achieved Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Global RTO Target</div>
          <div className="text-2xl font-black text-white font-mono mt-1">&lt; 30.0s</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Recovery Time Objective</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Achieved Failover RTO</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">3.8s</div>
          <div className="text-[11px] text-emerald-400/80 mt-1 font-mono flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 87% Faster than SLO
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">RPO Target (Data Loss)</div>
          <div className="text-2xl font-black text-white font-mono mt-1">0.0s</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Zero RPO Tolerated</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Max Cross-Cloud DB Lag</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">18ms</div>
          <div className="text-[11px] text-slate-400 mt-1 font-mono">Kafka MirrorMaker 2.0</div>
        </div>
      </div>

      {/* Region Fleet Table & Failover Action Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Multi-Region Cloud Topology & GSLB Routing Weights
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">4 Global Regions Synchronized</span>
        </div>

        <div className="divide-y divide-slate-800">
          {regions.map((r) => {
            const isPrimary = r.role === 'PRIMARY_ACTIVE';
            return (
              <div
                key={r.id}
                className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-colors ${
                  isPrimary ? 'bg-cyan-950/15' : 'hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-xs ${
                      isPrimary
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-md shadow-cyan-500/10'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {r.provider}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white">{r.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                        {r.regionCode}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          isPrimary
                            ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 animate-pulse'
                            : 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}
                      >
                        {r.role}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                      <span>
                        GSLB Weight: <strong className="text-cyan-300">{r.gslbWeight}%</strong>
                      </span>
                      <span>
                        Replication Lag: <strong className="text-slate-200">{r.dbReplicationLagMs}ms</strong>
                      </span>
                      <span>
                        Achieved RTO: <strong className="text-emerald-400">{r.rtoAchievedSeconds}s</strong>
                      </span>
                      <span>
                        Last Drill: <strong className="text-slate-300">{r.lastFailoverDrill}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {isPrimary ? (
                    <span className="px-4 py-2 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-xs font-bold font-mono">
                      ● Active Primary
                    </span>
                  ) : (
                    <button
                      onClick={() => handleTriggerFailover(r.id)}
                      disabled={isFailingOver}
                      className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all disabled:opacity-50"
                    >
                      {isFailingOver ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Shuffle className="w-3.5 h-3.5 text-blue-400" />
                      )}
                      <span>Simulate Regional Failover</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
