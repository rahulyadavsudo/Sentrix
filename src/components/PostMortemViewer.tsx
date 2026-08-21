import React, { useState } from 'react';
import {
  Bot,
  Check,
  Copy,
  Download,
  FileCheck2,
  FileText,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const PostMortemViewer: React.FC = () => {
  const [report, setReport] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [incidentTitle, setIncidentTitle] = useState(
    'Predictive Memory Leak & Idempotency Cache Trajectory in Payment Gateway'
  );
  const [affectedServices, setAffectedServices] = useState('payment-gateway, order-processing');

  const handleGenerate = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/ai/generate-postmortem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          incidentTitle,
          affectedServices,
          durationMinutes: 14,
          resolvedBy: '1-Click Auto-Healing Agent (Resource Limit Patch + Rolling Canary)',
        }),
      });
      const data = await res.json();
      setReport(data.report || 'Report generated successfully.');
    } catch (err) {
      console.error('Failed to generate postmortem:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([report], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-postmortem-${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            AI-Powered SRE Incident Post-Mortem Generator
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Generates standardized post-mortems formatted with Timeline, The 5 Whys, Blast Radius metrics, MTTD/MTTR telemetry, and preventive action item tables.
          </p>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{report ? 'Regenerate Post-Mortem' : 'Generate Full SRE Post-Mortem'}</span>
        </button>
      </div>

      {/* Incident Input Parameters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-md grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Incident Name / Title:
          </label>
          <input
            type="text"
            value={incidentTitle}
            onChange={(e) => setIncidentTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 block mb-1">
            Affected Services / Pods:
          </label>
          <input
            type="text"
            value={affectedServices}
            onChange={(e) => setAffectedServices(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          />
        </div>
      </div>

      {/* Report Viewer Box */}
      {report ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-md space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
              <FileCheck2 className="w-4 h-4 text-purple-400" />
              <span>Publication-Ready Markdown Report</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied Markdown!' : 'Copy Markdown'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-xs font-semibold border border-purple-500/40 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .md</span>
              </button>
            </div>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-[500px] overflow-y-auto">
            {report}
          </div>
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-slate-900 border border-slate-800 text-center space-y-3">
          <Bot className="w-10 h-10 text-purple-400 mx-auto opacity-70" />
          <h3 className="text-sm font-bold text-white">No Post-Mortem Report Generated Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Click the "Generate Full SRE Post-Mortem" button above to generate a comprehensive markdown post-mortem for this incident.
          </p>
        </div>
      )}
    </div>
  );
};
