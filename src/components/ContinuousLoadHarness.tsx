import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertOctagon,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  Flame,
  Gauge,
  Layers,
  Play,
  RefreshCw,
  Sliders,
  Square,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { LoadTestConfig, LoadTestMetricPoint } from '../types';

export const ContinuousLoadHarness: React.FC = () => {
  const [targetService, setTargetService] = useState<string>('rust-auth-guard');
  const [rpsTarget, setRpsTarget] = useState<number>(2500);
  const [concurrencyWorkers, setConcurrencyWorkers] = useState<number>(32);
  const [durationSeconds, setDurationSeconds] = useState<number>(30);
  const [distributionType, setDistributionType] = useState<string>('ramp_up');
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [elapsedSec, setElapsedSec] = useState<number>(0);
  const [metrics, setMetrics] = useState<LoadTestMetricPoint[]>([]);

  // Simulated metrics loop during active test
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setElapsedSec((prev) => {
          const next = prev + 1;
          if (next >= durationSeconds) {
            setIsRunning(false);
            return durationSeconds;
          }

          // Generate simulated metric point
          const variance = (Math.random() - 0.5) * 0.1;
          const currentRps = Math.round(rpsTarget * (Math.min(1.0, next / 5) + variance));
          const p50 = Math.round(12 + Math.random() * 4);
          const p90 = Math.round(p50 * 2.2);
          const p99 = Math.round(p50 * 4.5 + (next > 10 ? 80 : 0));
          const errRate = next > 12 && targetService === 'py-ai-fraud-detector' ? 1.4 : 0.02;

          const point: LoadTestMetricPoint = {
            timeSec: next,
            actualRps: currentRps,
            p50Ms: p50,
            p90Ms: p90,
            p99Ms: p99,
            errorRatePercent: errRate,
            status2xx: Math.round(currentRps * (1 - errRate / 100)),
            status4xx: Math.round(currentRps * 0.005),
            status5xx: Math.round(currentRps * (errRate / 100)),
          };

          setMetrics((m) => [...m.slice(-20), point]);
          return next;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, durationSeconds, rpsTarget, targetService]);

  const handleStart = () => {
    setIsRunning(true);
    setElapsedSec(0);
    setMetrics([]);
  };

  const handleStop = () => {
    setIsRunning(false);
  };

  const latestPoint = metrics[metrics.length - 1] || {
    actualRps: 0,
    p50Ms: 0,
    p90Ms: 0,
    p99Ms: 0,
    errorRatePercent: 0,
    status2xx: 0,
    status4xx: 0,
    status5xx: 0,
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Zap className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                Distributed Synthetic Traffic & Resiliency Stress Generator
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono font-bold">
                  HIGH-RPS STRESS HARNESS
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Generate high-concurrency synthetic HTTP/gRPC load to benchmark autoscaling thresholds, canary traffic shifters, and eBPF socket throttles.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={handleStop}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/20 transition-all"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>Abort Load Test ({elapsedSec}s / {durationSeconds}s)</span>
            </button>
          ) : (
            <button
              onClick={handleStart}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Launch Stress Test ({rpsTarget} RPS)</span>
            </button>
          )}
        </div>
      </div>

      {/* Control Panel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        {/* Target Service */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Target Workload</label>
          <select
            value={targetService}
            disabled={isRunning}
            onChange={(e) => setTargetService(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          >
            <option value="rust-auth-guard">Rust Auth Guard (/api/v1/verify)</option>
            <option value="go-payment-gateway">Go Payment Gateway (/api/v1/charge)</option>
            <option value="py-ai-fraud-detector">Python AI Fraud Detector (/api/v1/score)</option>
            <option value="order-processor-node">Node.js Order Processor (/api/v1/orders)</option>
          </select>
        </div>

        {/* Target RPS */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-2">
            <span>Target RPS</span>
            <span className="text-cyan-400 font-mono">{rpsTarget.toLocaleString()} RPS</span>
          </div>
          <input
            type="range"
            min="100"
            max="15000"
            step="100"
            value={rpsTarget}
            disabled={isRunning}
            onChange={(e) => setRpsTarget(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Concurrency Workers */}
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase mb-2">
            <span>Goroutine Workers</span>
            <span className="text-purple-400 font-mono">{concurrencyWorkers} Workers</span>
          </div>
          <input
            type="range"
            min="4"
            max="128"
            step="4"
            value={concurrencyWorkers}
            disabled={isRunning}
            onChange={(e) => setConcurrencyWorkers(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer disabled:opacity-50"
          />
        </div>

        {/* Distribution Pattern */}
        <div>
          <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Load Profile</label>
          <select
            value={distributionType}
            disabled={isRunning}
            onChange={(e) => setDistributionType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
          >
            <option value="ramp_up">Linear Ramp-Up (0 ➔ 100%)</option>
            <option value="constant">Sustained Constant Load</option>
            <option value="spike">Sudden Spike Burst (10x)</option>
            <option value="sinusoidal">Sinusoidal Diurnal Wave</option>
          </select>
        </div>
      </div>

      {/* Real-Time Telemetry Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Active Throughput</div>
          <div className="text-2xl font-black text-cyan-400 font-mono mt-1">
            {latestPoint.actualRps.toLocaleString()} <span className="text-xs text-slate-500">RPS</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            2xx: <span className="text-emerald-400">{latestPoint.status2xx}</span> | 5xx:{' '}
            <span className={latestPoint.status5xx > 0 ? 'text-rose-400 font-bold' : 'text-slate-500'}>
              {latestPoint.status5xx}
            </span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Median Latency (p50)</div>
          <div className="text-2xl font-black text-emerald-400 font-mono mt-1">
            {latestPoint.p50Ms} <span className="text-xs text-slate-500">ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            Fast path socket latency
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Tail Latency (p99)</div>
          <div className="text-2xl font-black text-orange-400 font-mono mt-1">
            {latestPoint.p99Ms} <span className="text-xs text-slate-500">ms</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            p90: <span className="text-slate-300">{latestPoint.p90Ms}ms</span>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">HTTP Error Rate</div>
          <div className="text-2xl font-black font-mono mt-1 text-white">
            <span className={latestPoint.errorRatePercent > 1.0 ? 'text-rose-400' : 'text-emerald-400'}>
              {latestPoint.errorRatePercent.toFixed(2)}%
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2 font-mono">
            SLO Limit: &lt; 0.10%
          </div>
        </div>
      </div>

      {/* Live Waterfall Chart Representation */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
              Live Synthetic Load & Response Latency Trace Timeline
            </h3>
          </div>
          <span className="text-xs font-mono text-slate-400">
            {metrics.length > 0 ? `${metrics.length} sample windows recorded` : 'Ready to begin test'}
          </span>
        </div>

        {metrics.length === 0 ? (
          <div className="h-44 border border-dashed border-slate-800 rounded-xl flex flex-col items-center justify-center text-slate-500 text-xs">
            <Zap className="w-6 h-6 text-slate-600 mb-2" />
            Click <strong>"Launch Stress Test"</strong> to stream synthetic load telemetry in real time.
          </div>
        ) : (
          <div className="h-44 flex items-end gap-1.5 pt-4">
            {metrics.map((m, idx) => {
              const maxRps = rpsTarget * 1.2 || 1000;
              const heightPercent = Math.min(100, Math.max(10, (m.actualRps / maxRps) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                  {/* Tooltip on hover */}
                  <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-950 border border-slate-800 text-[10px] text-slate-200 font-mono p-1.5 rounded pointer-events-none z-20 whitespace-nowrap shadow-lg">
                    {m.actualRps} RPS • {m.p99Ms}ms p99 • {m.errorRatePercent}% err
                  </div>

                  <div
                    style={{ height: `${heightPercent}%` }}
                    className={`w-full rounded-t transition-all ${
                      m.errorRatePercent > 1.0
                        ? 'bg-rose-500'
                        : m.p99Ms > 100
                        ? 'bg-amber-500'
                        : 'bg-gradient-to-t from-cyan-600 to-cyan-400'
                    }`}
                  />
                  <span className="text-[9px] font-mono text-slate-600">{m.timeSec}s</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
