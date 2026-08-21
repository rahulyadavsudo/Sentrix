import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Cpu,
  FileCode2,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Zap,
} from 'lucide-react';
import { SecurityAuditReport } from '../types';

interface SecurityComplianceAuditProps {
  report: SecurityAuditReport | null;
  onRemediateCve: (cveId: string) => Promise<void>;
}

export const SecurityComplianceAudit: React.FC<SecurityComplianceAuditProps> = ({
  report,
  onRemediateCve,
}) => {
  const [remediatingId, setRemediatingId] = useState<string | null>(null);

  if (!report) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-3 text-cyan-400" />
        <p>Scanning container image registries and Falco eBPF security hooks...</p>
      </div>
    );
  }

  const handleRemediate = async (id: string) => {
    setRemediatingId(id);
    await onRemediateCve(id);
    setRemediatingId(null);
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/40 font-bold';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/40 font-bold';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/40';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            Container Security, Trivy CVE Scanner & Falco eBPF Threats
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Continuous vulnerability scanning across Go, Python, and Rust images paired with kernel-level Falco eBPF runtime threat detection and 1-click package auto-patching.
          </p>
        </div>

        {/* CIS Benchmark Score */}
        <div className="flex items-center gap-3 bg-slate-950 px-4 py-2.5 rounded-xl border border-slate-800">
          <Shield className="w-6 h-6 text-emerald-400" />
          <div>
            <div className="text-[10px] text-slate-500 uppercase font-semibold">CIS Benchmark Score</div>
            <div className="text-sm font-bold text-emerald-400 font-mono">
              {report.cisBenchmarkScore}/100 PASSED
            </div>
          </div>
        </div>
      </div>

      {/* Security Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Vulnerabilities</div>
          <div className="text-2xl font-bold text-white font-mono mt-1">{report.totalCves}</div>
          <div className="text-[11px] text-slate-400 mt-1">Images scanned: 4</div>
        </div>

        <div className="bg-slate-900 border border-rose-500/30 rounded-xl p-4 shadow-md bg-rose-500/5">
          <div className="text-[10px] text-rose-400 uppercase font-semibold">Critical CVEs</div>
          <div className="text-2xl font-bold text-rose-400 font-mono mt-1">{report.criticalCves}</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Requires immediate patch</div>
        </div>

        <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4 shadow-md bg-amber-500/5">
          <div className="text-[10px] text-amber-400 uppercase font-semibold">High Severity CVEs</div>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">{report.highCves}</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Remediation available</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md">
          <div className="text-[10px] text-slate-500 uppercase font-semibold">Falco Runtime Events</div>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">
            {report.runtimeThreatEvents.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Audit log verified</div>
        </div>
      </div>

      {/* Vulnerabilities Table & 1-Click Patching */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <AlertOctagon className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-white">Active Container Image Vulnerabilities (Trivy Scanner)</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">Scanned: {new Date(report.lastScanTimestamp).toLocaleTimeString()}</span>
        </div>

        {report.vulnerabilities.length === 0 ? (
          <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800">
            <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <div className="text-sm font-bold text-white">Zero Known Vulnerabilities</div>
            <p className="text-xs text-slate-400 mt-1">All container images comply with CIS Docker & K8s Benchmark.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {report.vulnerabilities.map((vuln) => (
              <div
                key={vuln.id}
                className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex items-center gap-2.5">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getSeverityBadge(vuln.severity)}`}>
                      {vuln.severity}
                    </span>
                    <strong className="text-xs font-mono text-cyan-300">{vuln.cveId}</strong>
                    <span className="text-xs text-slate-400 font-semibold">• Service: <span className="text-slate-200">{vuln.service}</span></span>
                  </div>

                  <div className="text-xs font-semibold text-white">{vuln.title}</div>

                  <div className="text-[11px] text-slate-400 flex items-center gap-3">
                    <span>Package: <strong className="text-slate-300 font-mono">{vuln.pkgName}</strong></span>
                    <span>Installed: <strong className="text-rose-400 font-mono">{vuln.installedVersion}</strong></span>
                    <span>Fixed in: <strong className="text-emerald-400 font-mono">{vuln.fixedVersion}</strong></span>
                  </div>

                  <div className="pt-1">
                    <code className="text-[10px] font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded border border-slate-800">
                      {vuln.remediationCommand}
                    </code>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    onClick={() => handleRemediate(vuln.id)}
                    disabled={remediatingId === vuln.id}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all"
                  >
                    {remediatingId === vuln.id ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Zap className="w-3.5 h-3.5" />
                    )}
                    <span>{remediatingId === vuln.id ? 'Rebuilding Image...' : '1-Click Auto-Patch'}</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Falco eBPF Runtime Threat Detection */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Terminal className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Falco eBPF Kernel Threat Audit Events</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">eBPF Probe: Active</span>
        </div>

        <div className="space-y-2">
          {report.runtimeThreatEvents.map((threat) => (
            <div
              key={threat.id}
              className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    {threat.priority}
                  </span>
                  <span className="font-semibold text-slate-200">{threat.rule}</span>
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Pod: <strong className="text-slate-300">{threat.pod}</strong> | Command: <code className="text-cyan-300">{threat.command}</code>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px]">
                <span className="text-slate-500">{new Date(threat.timestamp).toLocaleTimeString()}</span>
                <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
                  Action: {threat.actionTaken}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
