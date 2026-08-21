import React, { useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle2,
  Cpu,
  Database,
  FileCode2,
  Flame,
  Layers,
  Lightbulb,
  Radio,
  Server,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { LanguageRuntimeTelemetry, MicroserviceLanguage } from '../types';

interface MicroserviceProfilerProps {
  profiles: LanguageRuntimeTelemetry[];
}

export const MicroserviceProfiler: React.FC<MicroserviceProfilerProps> = ({ profiles }) => {
  const [selectedLang, setSelectedLang] = useState<MicroserviceLanguage>('Go');

  const currentProfile = profiles.find((p) => p.language === selectedLang) || profiles[0];

  const getLanguageHeaderColor = (lang: string) => {
    switch (lang) {
      case 'Go':
        return 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400';
      case 'Python':
        return 'from-yellow-500/20 to-amber-500/10 border-yellow-500/30 text-yellow-400';
      case 'Rust':
        return 'from-orange-500/20 to-red-500/10 border-orange-500/30 text-orange-400';
      default:
        return 'from-slate-700/20 to-slate-800/10 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileCode2 className="w-5 h-5 text-cyan-400" />
            Multi-Language Microservice Runtime Profiler
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Deep language-level telemetry profiling Go goroutines and GC cycles, Python GIL contention & AsyncIO event loops, and Rust Tokio thread pools with zero-copy buffer analytics.
          </p>
        </div>

        {/* Language Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
          {(['Go', 'Python', 'Rust'] as MicroserviceLanguage[]).map((lang) => (
            <button
              key={lang}
              onClick={() => setSelectedLang(lang)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                selectedLang === lang
                  ? 'bg-slate-800 text-white shadow-md border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  lang === 'Go'
                    ? 'bg-cyan-400'
                    : lang === 'Python'
                    ? 'bg-yellow-400'
                    : 'bg-orange-400'
                }`}
              />
              <span>{lang} Microservice</span>
            </button>
          ))}
        </div>
      </div>

      {currentProfile && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Main Runtime Telemetry Card */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header info */}
            <div className={`bg-gradient-to-r ${getLanguageHeaderColor(currentProfile.language)} border rounded-xl p-5 shadow-md`}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Service Name & Compiler Target
                  </span>
                  <h3 className="text-xl font-bold text-white mt-0.5">{currentProfile.serviceName}</h3>
                  <p className="text-xs text-slate-300 font-mono mt-1">{currentProfile.runtimeVersion}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900/80 border border-slate-700 text-white">
                    PID Process Telemetry
                  </span>
                </div>
              </div>
            </div>

            {/* Language-Specific Metrics */}
            {currentProfile.language === 'Go' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-cyan-400" />
                  Go Runtime (Goroutines, GC & Channels)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Goroutines</div>
                    <div className="text-xl font-bold text-amber-400 font-mono mt-1">
                      {currentProfile.goroutinesCount?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-amber-400/80 mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Potential Leak (+120/m)
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">GC Pause (P99)</div>
                    <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                      {currentProfile.gcPauseMicroseconds} µs
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Sub-millisecond latency</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Heap Allocations</div>
                    <div className="text-xl font-bold text-purple-400 font-mono mt-1">
                      {currentProfile.heapAllocMB} MB
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">GOGC Target: 100%</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Channel Saturation</div>
                    <div className="text-xl font-bold text-rose-400 font-mono mt-1">
                      {currentProfile.channelSaturationPercent}%
                    </div>
                    <div className="text-[10px] text-rose-400/80 mt-1">Buffer capacity high</div>
                  </div>
                </div>
              </div>
            )}

            {currentProfile.language === 'Python' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Flame className="w-4 h-4 text-yellow-400" />
                  Python 3.12 GIL & AsyncIO Engine
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">GIL Contention</div>
                    <div className="text-xl font-bold text-yellow-400 font-mono mt-1">
                      {currentProfile.gilContentionPercent}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Matrix regression lock</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Memory Fragment Index</div>
                    <div className="text-xl font-bold text-purple-400 font-mono mt-1">
                      {currentProfile.memoryFragmentationIndex}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Glibc arena overhead</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">AsyncIO Loop Lag</div>
                    <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                      {currentProfile.asyncioLagMs} ms
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Uvicorn worker latency</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Celery Queue Depth</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                      {currentProfile.celeryPendingTasks} tasks
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Normal background load</div>
                  </div>
                </div>
              </div>
            )}

            {currentProfile.language === 'Rust' && (
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-orange-400" />
                  Rust Async (Tokio & Zero-Copy Architecture)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Tokio Active Tasks</div>
                    <div className="text-xl font-bold text-orange-400 font-mono mt-1">
                      {currentProfile.tokioActiveTasks?.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Zero task starvation
                    </div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Thread Pool Saturation</div>
                    <div className="text-xl font-bold text-cyan-400 font-mono mt-1">
                      {currentProfile.threadPoolSaturationPercent}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">16 OS Kernel Threads</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Zero-Copy Buffer Eff.</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                      {currentProfile.zeroCopyEfficiencyPercent}%
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">Ring buffer memory bypass</div>
                  </div>

                  <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5">
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Unsafe Blocks Audit</div>
                    <div className="text-xl font-bold text-emerald-400 font-mono mt-1">
                      0 Unsafe
                    </div>
                    <div className="text-[10px] text-emerald-400 mt-1">100% Memory Safe</div>
                  </div>
                </div>
              </div>
            )}

            {/* General Process Resource Telemetry */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-400" />
                OS & Kernel cgroup Allocation Telemetry
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-500 block">Active Threads</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {currentProfile.activeThreads}
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-500 block">Open File Descriptors</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {currentProfile.openFileDescriptors} / 65536
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-500 block">Open Sockets</span>
                  <span className="text-base font-bold font-mono text-white mt-0.5 block">
                    {currentProfile.networkSockets}
                  </span>
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <span className="text-slate-500 block">CPU Throttled Periods</span>
                  <span className={`text-base font-bold font-mono mt-0.5 block ${currentProfile.cpuThrottledPeriods > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {currentProfile.cpuThrottledPeriods}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* SRE Tuning Recommendations Drawer */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
                <Lightbulb className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Automated SRE Tuning Recommendations
                </h4>
              </div>

              <div className="space-y-3">
                {currentProfile.recommendations.map((rec, i) => (
                  <div
                    key={i}
                    className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 text-xs text-slate-300 space-y-1.5"
                  >
                    <div className="flex items-center gap-2 text-amber-400 font-semibold">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Optimization {i + 1}</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">{rec}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Diagnostic CLI Snippet */}
            <div className="mt-6 pt-4 border-t border-slate-800">
              <span className="text-[11px] font-semibold text-slate-400 block mb-2">
                Live Profiling CLI Command:
              </span>
              <div className="bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-cyan-300 overflow-x-auto">
                {currentProfile.language === 'Go' && 'go tool pprof http://localhost:6060/debug/pprof/heap'}
                {currentProfile.language === 'Python' && 'py-spy top --pid $(pgrep -f uvicorn)'}
                {currentProfile.language === 'Rust' && 'cargo flamegraph --bin rust-auth-guard'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
