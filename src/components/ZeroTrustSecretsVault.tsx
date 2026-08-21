import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Copy,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  RefreshCw,
  RotateCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import { VaultSecretItem } from '../types';

interface ZeroTrustSecretsVaultProps {
  secrets: VaultSecretItem[];
  onRotateSecret: (secretId: string) => Promise<void>;
  onRefresh?: () => void;
}

export function ZeroTrustSecretsVault({
  secrets,
  onRotateSecret,
  onRefresh,
}: ZeroTrustSecretsVaultProps) {
  const [selectedSecretId, setSelectedSecretId] = useState<string>(
    secrets[0]?.id || ''
  );
  const [showEncryptedPreview, setShowEncryptedPreview] = useState<boolean>(false);
  const [isRotating, setIsRotating] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentSecret =
    secrets.find((s) => s.id === selectedSecretId) || secrets[0];

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRotate = async (id: string) => {
    setIsRotating(true);
    try {
      await onRotateSecret(id);
    } finally {
      setIsRotating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HEALTHY':
        return 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
      case 'EXPIRING_SOON':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'EXPIRED':
        return 'bg-rose-500/10 border-rose-500/30 text-rose-400';
      default:
        return 'bg-slate-800 border-slate-700 text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-emerald-500/20 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white tracking-wide">
                Zero-Trust Secrets & HashiCorp Vault Manager
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 uppercase">
                Vault CSI Driver v1.4 Active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-exposure KMS key lifecycle, automated secret rotation triggers, and TLS X.509 certificate expiry monitoring with automatic pod restart rollouts.
            </p>
          </div>
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all flex items-center gap-1 text-xs font-medium self-start md:self-auto"
            title="Refresh Secrets"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Secrets List */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Encrypted Vault Secrets ({secrets.length})
            </span>
            <span className="text-[10px] font-mono text-emerald-400">
              mTLS CSI Sync: OK
            </span>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by path or key name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2.5">
            {secrets
              .filter(
                (s) =>
                  s.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  s.key.toLowerCase().includes(searchQuery.toLowerCase())
              )
              .map((sec) => {
                const isSelected = sec.id === selectedSecretId;
                return (
                  <div
                    key={sec.id}
                    onClick={() => setSelectedSecretId(sec.id)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                        : 'bg-slate-900/80 border-slate-800 hover:bg-slate-800/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5 truncate max-w-[210px]">
                        <KeyRound className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="text-xs font-mono font-bold text-white truncate">
                          {sec.key}
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(
                          sec.status
                        )}`}
                      >
                        {sec.status === 'EXPIRING_SOON'
                          ? `${sec.expiresInDays}d left`
                          : sec.status}
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 truncate mb-2">
                      {sec.path}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-slate-800/80">
                      <span>Ver: #{sec.version}</span>
                      <span>Consumers: {sec.serviceConsumer.split(',')[0]}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* Right Column: Secret Details & Rotation Controls */}
        <div className="lg:col-span-7 space-y-4">
          {currentSecret ? (
            <div className="space-y-4">
              {/* Main Card */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-mono text-white">
                        {currentSecret.key}
                      </h3>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(
                          currentSecret.status
                        )}`}
                      >
                        {currentSecret.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-mono">
                      Vault Path: {currentSecret.path}
                    </p>
                  </div>

                  {/* 1-Click Rotate Button */}
                  <button
                    onClick={() => handleRotate(currentSecret.id)}
                    disabled={isRotating}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition-all self-start md:self-auto disabled:opacity-50"
                  >
                    <RotateCw
                      className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin' : ''}`}
                    />
                    <span>Rotate Secret & Rollout</span>
                  </button>
                </div>

                {/* Secret Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Live Version</div>
                    <div className="text-lg font-bold text-emerald-400 mt-1">
                      v{currentSecret.version}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Expiry Countdown</div>
                    <div className="text-lg font-bold text-amber-400 mt-1">
                      {currentSecret.expiresInDays} Days
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Auto-Rotate</div>
                    <div className="text-lg font-bold text-white mt-1">
                      {currentSecret.autoRotateEnabled
                        ? `${currentSecret.rotationFrequencyDays}d`
                        : 'Manual'}
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                    <div className="text-[10px] text-slate-500 uppercase">Last Rotated</div>
                    <div className="text-xs font-bold text-slate-300 mt-2">
                      {currentSecret.lastRotated}
                    </div>
                  </div>
                </div>
              </div>

              {/* Encrypted Value Preview with Zero-Exposure Masking */}
              <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                      Zero-Exposure KMS Ciphertext Preview
                    </h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowEncryptedPreview(!showEncryptedPreview)}
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-all"
                    >
                      {showEncryptedPreview ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Reveal Ciphertext
                        </>
                      )}
                    </button>
                    <button
                      onClick={() =>
                        handleCopy(currentSecret.encryptedPreview, 'secret-preview')
                      }
                      className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1 transition-all"
                    >
                      <Copy className="w-3 h-3" />
                      <span>
                        {copiedKey === 'secret-preview' ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 font-mono text-xs text-emerald-300 truncate">
                  {showEncryptedPreview
                    ? currentSecret.encryptedPreview
                    : '••••••••••••••••••••••••••••••••••••••••••••••••••••'}
                </div>

                <div className="text-[11px] text-slate-400">
                  <strong>Consuming Workloads:</strong> {currentSecret.serviceConsumer}
                </div>
              </div>

              {/* TLS Certificate X.509 Inspector (if applicable) */}
              {currentSecret.tlsCertInfo && (
                <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-lg space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-400" />
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                        TLS X.509 Certificate Metadata
                      </h4>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {currentSecret.tlsCertInfo.keySize}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Common Name (CN):</span>
                      <span className="text-slate-200">{currentSecret.tlsCertInfo.cn}</span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">Subject Alternative Names (SANs):</span>
                      <span className="text-cyan-300">
                        {currentSecret.tlsCertInfo.san.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-1 border-b border-slate-800/40">
                      <span className="text-slate-500">CA Issuer:</span>
                      <span className="text-slate-300">{currentSecret.tlsCertInfo.issuer}</span>
                    </div>
                    <div className="flex items-center justify-between py-1">
                      <span className="text-slate-500">Valid Until:</span>
                      <span className="text-amber-400 font-bold">
                        {currentSecret.tlsCertInfo.validUntil} ({currentSecret.tlsCertInfo.daysRemaining} days left)
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-12 text-center text-slate-500">
              Select a Vault secret to inspect.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
