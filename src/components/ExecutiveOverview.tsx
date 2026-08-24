import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownLeft,
  ArrowUpRight,
  Bot,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Cpu,
  CreditCard,
  DollarSign,
  ExternalLink,
  Flame,
  HardDrive,
  Layers,
  Lock,
  MessageSquare,
  Network,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Server,
  Shield,
  ShieldAlert,
  Sparkles,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { ClusterOverview, ClusterFleetNode, DiagnosticIssue, GitHubRepo } from '../types';

interface ExecutiveOverviewProps {
  clusterOverview: ClusterOverview | null;
  clusterFleet: ClusterFleetNode[];
  repo: GitHubRepo | null;
  issues: DiagnosticIssue[];
  onOpenRegisterCluster: () => void;
  onSimulateIncident: (type: string) => void;
  onNavigateTab: (tab: string) => void;
  onShowToast: (type: 'success' | 'error' | 'info', title: string, description: string) => void;
}

export const ExecutiveOverview: React.FC<ExecutiveOverviewProps> = ({
  clusterOverview,
  clusterFleet,
  repo,
  issues,
  onOpenRegisterCluster,
  onSimulateIncident,
  onNavigateTab,
  onShowToast,
}) => {
  const [selectedClusterFilter, setSelectedClusterFilter] = useState<'ALL' | 'GKE' | 'EKS' | 'AKS'>('ALL');
  const [actionTab, setActionTab] = useState<'shift' | 'heal'>('shift');
  const [trafficAmount, setTrafficAmount] = useState<string>('550.00');
  const [selectedRegion, setSelectedRegion] = useState<string>('us-west1');
  const [selectedClusterKey, setSelectedClusterKey] = useState<string>('**** 8458');
  const [isExecuting, setIsExecuting] = useState<boolean>(false);

  // Weekly bar chart data matching the dual-tone segmented pill visual in the reference screenshot
  const weeklyData = [
    { day: 'Mon', orangeVal: 40, greenVal: 0, total: 320, active: false },
    { day: 'Tue', orangeVal: 30, greenVal: 35, total: 680, active: false },
    { day: 'Wed', orangeVal: 0, greenVal: 55, total: 890, active: false },
    { day: 'Thu', orangeVal: 45, greenVal: 0, total: 410, active: false },
    { day: 'Fri', orangeVal: 0, greenVal: 75, total: 1150, active: false },
    { day: 'Sat', orangeVal: 0, greenVal: 60, total: 950, active: false },
    { day: 'Sun', orangeVal: 35, greenVal: 0, total: 425, active: true },
  ];

  // Recent SRE telemetry transactions/events list
  const recentEvents = [
    {
      id: 'tx-1',
      title: 'payment-gateway',
      user: 'Ryan Brown',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&auto=format&fit=crop&q=80',
      time: '06:41 PM',
      value: '+ $685.00',
      subValue: '99.98% SLO',
      type: 'positive',
    },
    {
      id: 'tx-2',
      title: 'YouTube Stream Proxy',
      user: 'Media Mesh',
      avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=60&auto=format&fit=crop&q=80',
      time: '08:14 PM',
      value: '- $510.50',
      subValue: 'Latency Spike (340ms)',
      type: 'negative',
    },
    {
      id: 'tx-3',
      title: 'auth-jwt-service',
      user: 'Tom Scott',
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=60&auto=format&fit=crop&q=80',
      time: '05:28 PM',
      value: '+ $390.00',
      subValue: 'Zero Pod Crashes',
      type: 'positive',
    },
    {
      id: 'tx-4',
      title: 'checkout-v2-api',
      user: 'Olivia Taylor',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=60&auto=format&fit=crop&q=80',
      time: '07:36 AM',
      value: '+ $816.00',
      subValue: 'KEDA Scaled 4x',
      type: 'positive',
    },
    {
      id: 'tx-5',
      title: 'spotify-sync-worker',
      user: 'Worker Node 2',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=60&auto=format&fit=crop&q=80',
      time: '04:12 PM',
      value: '- $15.50',
      subValue: 'OOM Warning Mitigated',
      type: 'neutral',
    },
  ];

  const handleExecuteAction = () => {
    setIsExecuting(true);
    setTimeout(() => {
      setIsExecuting(false);
      onShowToast(
        'success',
        actionTab === 'shift' ? 'Traffic Reallocated' : 'Auto-Healing Dispatched',
        `Action applied to cluster ${selectedClusterKey} with capacity ${trafficAmount} req/s.`
      );
    }, 600);
  };

  const primaryFleetNode = clusterFleet.find((c) => c.isPrimary) || clusterFleet[0];

  return (
    <div className="space-y-6 animate-fadeIn pb-12 font-sans">
      {/* Top Main Columns Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================= LEFT SUB-COLUMN: Overview & Card Management ================= */}
        <div className="lg:col-span-5 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white font-display">
              Overview
            </h1>
          </div>

          {/* Subheader: Card Management */}
          <div className="flex items-center justify-between text-slate-400 text-sm font-medium pt-1">
            <span>Card management</span>
            <button
              onClick={onOpenRegisterCluster}
              className="p-1.5 rounded-full bg-[#18181b] hover:bg-[#27272a] text-slate-300 hover:text-white transition-all border border-white/10"
              title="Register / Connect new Kubernetes Cluster"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Primary High-End Solid Dark Cluster Card (Matches Payoneer card from screenshot) */}
          <div className="relative overflow-hidden rounded-3xl bg-[#141416] border border-white/10 p-6 sm:p-7 text-white shadow-2xl shadow-black/80 transition-all hover:border-white/20">
            {/* Background subtle radial glow */}
            <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-cyan-500/5 blur-3xl pointer-events-none" />

            {/* Top row: Brand & Cluster Identifier */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                {/* Rainbow/Color Ring Logo matching screenshot */}
                <div className="relative flex items-center justify-center w-6 h-6 rounded-full">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-amber-400 via-rose-500 to-cyan-400 p-[2px]">
                    <div className="w-full h-full bg-[#141416] rounded-full" />
                  </div>
                </div>
                <span className="font-bold text-base tracking-tight text-white font-display">
                  Sentrix Fleet
                </span>
              </div>
              <span className="font-mono text-xs text-slate-400 tracking-wider">
                {selectedClusterKey}
              </span>
            </div>

            {/* Main Numeric Display (Rich Big Typography from screenshot) */}
            <div className="mt-8 mb-6 relative z-10">
              <div className="flex items-baseline gap-1.5">
                <span className="text-3xl sm:text-4xl lg:text-[42px] font-black tracking-tight text-white font-display">
                  35,900.50
                </span>
                <span className="text-xl sm:text-2xl font-light text-slate-400 font-display">
                  €
                </span>
              </div>
            </div>

            {/* Bottom Row: Expiry / Nodes count */}
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono relative z-10 pt-2 border-t border-white/5">
              <span>{clusterOverview?.stats.readyNodes || 17} / {clusterOverview?.stats.totalNodes || 24} Nodes Ready</span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                PRIMARY INGRESS
              </span>
            </div>
          </div>

          {/* Currency / Cloud Selector Pills (EUR, USD, UAH -> ALL, GKE, EKS, AKS) */}
          <div className="flex items-center gap-2">
            {(['ALL', 'GKE', 'EKS', 'AKS'] as const).map((filter) => {
              const active = selectedClusterFilter === filter;
              return (
                <button
                  key={filter}
                  onClick={() => setSelectedClusterFilter(filter)}
                  className={`px-5 py-2 rounded-full text-xs font-bold transition-all duration-200 ${
                    active
                      ? 'bg-white text-black shadow-lg shadow-white/10'
                      : 'bg-[#18181b] text-slate-400 hover:text-white hover:bg-[#27272a] border border-white/5'
                  }`}
                >
                  {filter === 'ALL' ? 'EUR' : filter === 'GKE' ? 'USD' : filter === 'EKS' ? 'UAH' : 'GBP'}
                </button>
              );
            })}
          </div>

          {/* Last Transactions / SRE Telemetry Events */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between text-slate-400 text-sm font-medium">
              <span>Last transactions</span>
              <button
                onClick={() => onNavigateTab('traces')}
                className="text-slate-400 hover:text-white transition-colors"
                title="Search telemetry traces"
              >
                <Search className="w-4 h-4" />
              </button>
            </div>

            {/* Transactions Grid (2x2 with clean rounded cards matching screenshot) */}
            <div className="grid grid-cols-2 gap-3">
              {recentEvents.slice(0, 4).map((evt) => (
                <div
                  key={evt.id}
                  onClick={() => onNavigateTab('traces')}
                  className="p-4 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-slate-300 truncate max-w-[90px]">
                      {evt.user}
                    </span>
                    <img
                      src={evt.avatar}
                      alt={evt.user}
                      className="w-7 h-7 rounded-full object-cover ring-1 ring-white/10"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div
                    className={`text-sm sm:text-base font-extrabold font-display ${
                      evt.type === 'positive'
                        ? 'text-emerald-400'
                        : evt.type === 'negative'
                        ? 'text-rose-400'
                        : 'text-slate-200'
                    }`}
                  >
                    {evt.value}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {evt.time}
                  </div>
                </div>
              ))}
            </div>

            {/* Bottom 5th transaction + View More Card */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div
                onClick={() => onNavigateTab('traces')}
                className="p-4 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/15 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-300">Spotify</span>
                  <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold">
                    S
                  </div>
                </div>
                <div className="text-sm sm:text-base font-extrabold text-rose-400 font-display">
                  - $15.50
                </div>
              </div>

              <div
                onClick={() => onNavigateTab('incidents')}
                className="p-4 rounded-2xl bg-[#141416] border border-white/5 hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center gap-1.5 group"
              >
                <Layers className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                <span className="text-xs font-semibold text-slate-300 group-hover:text-white">
                  View more
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ================= RIGHT SUB-COLUMN: Charts, Action Panel & Pastel Stats ================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Top Search & Profile Bar (Matching top-right of screenshot) */}
          <div className="flex items-center justify-between gap-4">
            {/* Search input */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search"
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#141416] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-white/30 transition-all"
              />
            </div>

            {/* Top Right Icons & Avatar */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSimulateIncident('memory_leak')}
                className="p-2 rounded-full bg-[#141416] border border-white/10 text-slate-400 hover:text-white transition-all"
                title="SRE Insights & Alerts"
              >
                <Zap className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateTab('incidents')}
                className="relative p-2 rounded-full bg-[#141416] border border-white/10 text-slate-400 hover:text-white transition-all"
                title="Notifications"
              >
                <MessageSquare className="w-4 h-4" />
                {issues.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {issues.length}
                  </span>
                )}
              </button>

              {/* User Avatar */}
              <div className="w-9 h-9 rounded-full ring-2 ring-white/15 overflow-hidden cursor-pointer">
                <img
                  src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"
                  alt="User Profile"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
          </div>

          {/* Middle Row: Weekly Segmented Pill Chart + Withdraw/Exchange Action Box */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            {/* Left Box (Weekly Dual-Tone Pill Chart) */}
            <div className="md:col-span-6 space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium">
                <span>Week 2-11 October</span>
                <Calendar className="w-4 h-4 text-slate-400" />
              </div>

              {/* Big Rich Value Display */}
              <div className="flex items-baseline gap-1">
                <span className="text-4xl sm:text-5xl font-black text-white font-display">
                  1280.00
                </span>
                <span className="text-2xl font-light text-slate-400 font-display">
                  €
                </span>
              </div>

              {/* Dual-Tone Segmented Pill Bar Chart (Exact replica of reference UI) */}
              <div className="pt-4 pb-2 relative">
                {/* Horizontal scale labels */}
                <div className="absolute right-0 top-0 bottom-6 flex flex-col justify-between text-[10px] font-mono text-slate-600 pointer-events-none">
                  <span>950</span>
                  <span>475</span>
                  <span>0</span>
                </div>

                {/* Bars row */}
                <div className="grid grid-cols-7 gap-2.5 items-end h-40 pr-8">
                  {weeklyData.map((col, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                      {/* Pill Bar Container */}
                      <div className="w-full max-w-[28px] h-32 rounded-full bg-[#18181b] p-1 flex flex-col justify-end relative overflow-hidden border border-white/5 group-hover:border-white/20 transition-all">
                        {/* Green Upper Segment */}
                        {col.greenVal > 0 && (
                          <div
                            style={{ height: `${col.greenVal}%` }}
                            className="w-full rounded-t-full rounded-b-md bg-[#a3e635] transition-all duration-500 mb-0.5"
                          />
                        )}

                        {/* Orange Lower Segment */}
                        {col.orangeVal > 0 && (
                          <div
                            style={{ height: `${col.orangeVal}%` }}
                            className="w-full rounded-b-full rounded-t-md bg-[#fb923c] transition-all duration-500"
                          />
                        )}

                        {/* Floating active pill tag (Sun = 425 in screenshot) */}
                        {col.active && (
                          <div className="absolute -top-1 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-white text-black text-[9px] font-black shadow-lg">
                            425
                          </div>
                        )}
                      </div>

                      {/* Day Label */}
                      <span className="text-[10px] font-medium text-slate-400">
                        {col.day}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Box (Withdraw / Exchange -> Traffic Shift / Auto-Heal Action Panel) */}
            <div className="md:col-span-6 space-y-4">
              {/* Tabs: Withdraw / Exchange */}
              <div className="flex items-center gap-6 border-b border-white/5 pb-2">
                <button
                  onClick={() => setActionTab('shift')}
                  className={`text-base font-bold transition-all font-display ${
                    actionTab === 'shift' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Withdraw
                </button>
                <button
                  onClick={() => setActionTab('heal')}
                  className={`text-base font-bold transition-all font-display ${
                    actionTab === 'heal' ? 'text-white' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Exchange
                </button>
              </div>

              {/* Currency & Card Selectors */}
              <div className="grid grid-cols-2 gap-2.5">
                <button className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#141416] border border-white/10 text-xs font-semibold text-white hover:border-white/20 transition-all">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">€</span>
                    <span>EUR</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-[#141416] border border-white/10 text-xs font-semibold text-white hover:border-white/20 transition-all">
                  <div className="flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5 text-slate-400" />
                    <span>****8458</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>

              {/* Amount Input Box */}
              <div className="p-3.5 rounded-2xl bg-[#141416] border border-white/10 space-y-1">
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Amount</span>
                </div>
                <div className="flex items-center justify-between">
                  <input
                    type="text"
                    value={trafficAmount}
                    onChange={(e) => setTrafficAmount(e.target.value)}
                    className="bg-transparent text-xl font-extrabold text-white focus:outline-none w-full font-display"
                  />
                  <span className="text-xs text-slate-400 font-mono">EUR</span>
                </div>
              </div>

              {/* Min / Max Range Helper */}
              <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono px-1">
                <span>min 18.00 EUR</span>
                <span>max 35,900.50 EUR</span>
              </div>

              {/* Solid White Primary Button (Matching 'Review' in screenshot) */}
              <button
                onClick={handleExecuteAction}
                disabled={isExecuting}
                className="w-full py-3.5 rounded-full bg-white text-black font-extrabold text-sm hover:bg-slate-100 transition-all shadow-xl shadow-white/10 flex items-center justify-center gap-2 disabled:opacity-50 font-display"
              >
                <Activity className={`w-4 h-4 ${isExecuting ? 'animate-spin' : ''}`} />
                <span>{isExecuting ? 'Processing...' : 'Review'}</span>
              </button>
            </div>
          </div>

          {/* Three Colorful Pastel Summary Cards (Exact replica of lavender, butter yellow, and mint green cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            {/* Card 1: Total Earning (Lavender #DCE4FD) */}
            <div className="p-5 rounded-3xl bg-[#dce4fd] text-[#0b101e] shadow-xl space-y-3 transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#3b4763]">
                <span>Total earning</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#0b101e]">
                75,854.50
              </div>
            </div>

            {/* Card 2: Total Spendings (Butter Yellow #FDE8B3) */}
            <div className="p-5 rounded-3xl bg-[#fde8b3] text-[#1c1402] shadow-xl space-y-3 transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#5a4816]">
                <span>Total spendings</span>
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#1c1402]">
                8,947.00
              </div>
            </div>

            {/* Card 3: Spending Goal (Mint Green #D2F4E2) */}
            <div className="p-5 rounded-3xl bg-[#d2f4e2] text-[#061e12] shadow-xl space-y-3 transition-all hover:scale-[1.02]">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1e5238]">
                <span>Spending goal</span>
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div className="text-2xl sm:text-3xl font-black font-display tracking-tight text-[#061e12]">
                9,500.00
              </div>
            </div>
          </div>

          {/* Bottom SRE & Support Cards (Matching bottom cards in screenshot) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Support Card */}
            <div className="p-5 rounded-3xl bg-[#141416] border border-white/5 space-y-3">
              <div className="flex items-center justify-between text-white text-sm font-bold font-display">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center text-[10px]">
                    S
                  </div>
                  <span>Support</span>
                </div>
                <div className="flex items-center gap-2 text-slate-400">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs text-slate-400">
                Contact our Customer Care team
              </p>
              <div className="text-xs font-semibold text-slate-200 hover:text-cyan-300 transition-colors cursor-pointer">
                Payoneer.custhelp.com
              </div>
            </div>

            {/* Time to get paid / Autonomous Auto-Healing Card */}
            <div className="p-5 rounded-3xl bg-[#141416] border border-white/5 space-y-3">
              <div className="flex items-center gap-2 text-white text-sm font-bold font-display">
                <ArrowDownLeft className="w-4 h-4 text-slate-400" />
                <span>Time to get paid</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Request payments from clients all over the world and get paid for your services
              </p>
              <button
                onClick={() => onNavigateTab('incidents')}
                className="text-xs font-semibold text-white hover:underline block pt-1"
              >
                Request a payment
              </button>
            </div>
          </div>

          {/* Footer Copyright and App store pills */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 text-[11px] text-slate-500 border-t border-white/5">
            <div>
              &copy; 2005-2026 Sentrix Control Inc. &bull; Privacy &bull; Terms &bull; Fees
            </div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded-lg bg-[#141416] border border-white/10 text-slate-300 font-semibold text-[10px]">
                Download on the App Store
              </div>
              <div className="px-3 py-1 rounded-lg bg-[#141416] border border-white/10 text-slate-300 font-semibold text-[10px]">
                GET IT ON Google Play
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
