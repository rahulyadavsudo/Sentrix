import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Activity,
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  Flame,
  Search,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export type StatusType = 'healthy' | 'warning' | 'critical' | 'investigating' | 'resolved' | 'nominal' | 'info';

interface AnimatedStatusBadgeProps {
  status: StatusType | string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showPulse?: boolean;
  className?: string;
}

export const AnimatedStatusBadge: React.FC<AnimatedStatusBadgeProps> = ({
  status,
  label,
  size = 'md',
  showPulse = true,
  className = '',
}) => {
  const normStatus = status.toLowerCase();

  const isCritical = normStatus.includes('crit') || normStatus.includes('open') || normStatus.includes('fail') || normStatus.includes('error') || normStatus.includes('crash');
  const isWarning = normStatus.includes('warn') || normStatus.includes('investigat') || normStatus.includes('hot') || normStatus.includes('risk');
  const isHealthy = normStatus.includes('health') || normStatus.includes('resolv') || normStatus.includes('pass') || normStatus.includes('nom') || normStatus.includes('ready') || normStatus.includes('ok');

  const displayLabel = label || status.toUpperCase();

  const getColors = () => {
    if (isCritical) {
      return {
        bg: 'bg-rose-500/20',
        text: 'text-rose-300',
        border: 'border-rose-500/50',
        dot: 'bg-rose-400',
        shadow: 'shadow-rose-950/40',
      };
    }
    if (isWarning) {
      return {
        bg: 'bg-amber-500/20',
        text: 'text-amber-300',
        border: 'border-amber-500/50',
        dot: 'bg-amber-400',
        shadow: 'shadow-amber-950/40',
      };
    }
    if (isHealthy) {
      return {
        bg: 'bg-emerald-500/20',
        text: 'text-emerald-300',
        border: 'border-emerald-500/50',
        dot: 'bg-emerald-400',
        shadow: 'shadow-emerald-950/40',
      };
    }
    return {
      bg: 'bg-cyan-500/20',
      text: 'text-cyan-300',
      border: 'border-cyan-500/50',
      dot: 'bg-cyan-400',
      shadow: 'shadow-cyan-950/40',
    };
  };

  const colors = getColors();

  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2',
  }[size];

  return (
    <motion.span
      layout
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`inline-flex items-center rounded-full font-mono font-bold border shadow-xs transition-colors duration-300 ${colors.bg} ${colors.text} ${colors.border} ${colors.shadow} ${sizeClasses} ${className}`}
    >
      {showPulse && (
        <span className="relative flex h-2 w-2">
          {isCritical && (
            <motion.span
              animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75`}
            />
          )}
          {isWarning && (
            <motion.span
              animate={{ scale: [1, 1.6, 1], opacity: [0.7, 0.2, 0.7] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              className={`absolute inline-flex h-full w-full rounded-full ${colors.dot} opacity-75`}
            />
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${colors.dot}`} />
        </span>
      )}

      {isCritical && <Flame className="w-3 h-3 text-rose-400" />}
      {isWarning && <AlertTriangle className="w-3 h-3 text-amber-400" />}
      {isHealthy && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}

      <span>{displayLabel}</span>
    </motion.span>
  );
};

interface AnimatedHealthMeterProps {
  score: number;
  maxScore?: number;
  label?: string;
  showPercent?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'emerald-rose' | 'gradient' | 'dynamic';
}

export const AnimatedHealthMeter: React.FC<AnimatedHealthMeterProps> = ({
  score,
  maxScore = 100,
  label,
  showPercent = true,
  size = 'md',
}) => {
  const percentage = Math.min(100, Math.max(0, (score / maxScore) * 100));

  const getColor = (pct: number) => {
    if (pct >= 80) return 'bg-emerald-500';
    if (pct >= 50) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const getTextColor = (pct: number) => {
    if (pct >= 80) return 'text-emerald-400';
    if (pct >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const heightClasses = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  return (
    <div className="space-y-1.5 w-full">
      {(label || showPercent) && (
        <div className="flex justify-between items-center text-xs font-mono">
          {label && <span className="text-slate-400 font-medium">{label}</span>}
          {showPercent && (
            <motion.span
              key={percentage}
              initial={{ opacity: 0.5, y: -2 }}
              animate={{ opacity: 1, y: 0 }}
              className={`font-bold ${getTextColor(percentage)}`}
            >
              {percentage.toFixed(1)}%
            </motion.span>
          )}
        </div>
      )}
      <div className={`w-full bg-slate-950 rounded-full overflow-hidden border border-slate-800/80 ${heightClasses}`}>
        <motion.div
          className={`h-full rounded-full ${getColor(percentage)} shadow-xs`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
    </div>
  );
};

interface AnimatedMetricCardProps {
  title: string;
  value: string | number;
  subValue?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral' | 'critical';
  trendValue?: string;
  onClick?: () => void;
  className?: string;
}

export const AnimatedMetricCard: React.FC<AnimatedMetricCardProps> = ({
  title,
  value,
  subValue,
  icon,
  trend,
  trendValue,
  onClick,
  className = '',
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      onClick={onClick}
      className={`p-4 rounded-xl border bg-slate-900/80 border-slate-800 hover:border-slate-700 shadow-lg flex items-center justify-between transition-shadow duration-300 ${
        onClick ? 'cursor-pointer hover:shadow-cyan-950/30' : ''
      } ${className}`}
    >
      <div className="space-y-1 min-w-0">
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate font-mono">
          {title}
        </p>
        <motion.p
          key={String(value)}
          initial={{ scale: 0.95, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-2xl font-black text-white font-display tracking-tight"
        >
          {value}
        </motion.p>
        {(subValue || trendValue) && (
          <div className="flex items-center gap-1.5 text-xs">
            {trend === 'critical' && <span className="text-rose-400 font-bold">{trendValue}</span>}
            {trend === 'up' && <span className="text-emerald-400 font-bold">{trendValue}</span>}
            {trend === 'down' && <span className="text-amber-400 font-bold">{trendValue}</span>}
            {subValue && <span className="text-slate-400 truncate">{subValue}</span>}
          </div>
        )}
      </div>

      <motion.div
        whileHover={{ rotate: 5, scale: 1.05 }}
        className="w-11 h-11 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300 shrink-0 ml-3 shadow-inner"
      >
        {icon}
      </motion.div>
    </motion.div>
  );
};
