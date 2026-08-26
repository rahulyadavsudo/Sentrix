import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  X,
  Check,
  Layout,
  Moon,
  Sun,
  Palette,
  ArrowRight,
  Maximize2,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

// Image assets generated for the templates
import linearDarkImg from '../assets/images/linear_minimal_dark_ui_1787729335919.jpg';
import swissLightImg from '../assets/images/swiss_clean_light_ui_1787729354007.jpg';
import executiveBentoImg from '../assets/images/executive_bento_dark_ui_1787729369174.jpg';

export interface UITemplateOption {
  id: 'linear-dark' | 'swiss-light' | 'executive-bento';
  title: string;
  subtitle: string;
  tag: string;
  image: string;
  themeType: 'dark' | 'light';
  palette: { name: string; hex: string }[];
  characteristics: string[];
  bestFor: string;
}

export const UI_TEMPLATES: UITemplateOption[] = [
  {
    id: 'linear-dark',
    title: 'Linear Obsidian Titanium',
    subtitle: 'Ultra-refined developer tool aesthetic with razor-thin hairline borders and obsidian slate surfaces.',
    tag: 'Minimal Dark',
    image: linearDarkImg,
    themeType: 'dark',
    palette: [
      { name: 'Canvas', hex: '#0B0C0E' },
      { name: 'Surface', hex: '#14151A' },
      { name: 'Border', hex: '#23252D' },
      { name: 'Accent', hex: '#38BDF8' },
    ],
    characteristics: [
      'Zero glow and zero heavy gradients for maximum visual calm',
      'High-contrast crisp monospace telemetry and tight typographic rhythm',
      'Single-line minimal resource meters with muted status tags',
      'Whisper-thin 1px dividers and generous negative space',
    ],
    bestFor: 'Engineers who want distraction-free, high-density K8s telemetry like Linear or Vercel.',
  },
  {
    id: 'swiss-light',
    title: 'Swiss Clean Light Minimal',
    subtitle: 'High-contrast editorial typography, cool off-white canvas, and crisp micro-borders.',
    tag: 'Classy Light',
    image: swissLightImg,
    themeType: 'light',
    palette: [
      { name: 'Canvas', hex: '#F9FAFB' },
      { name: 'Card', hex: '#FFFFFF' },
      { name: 'Divider', hex: '#E5E7EB' },
      { name: 'Text', hex: '#111827' },
    ],
    characteristics: [
      'Pristine white and cool gray (#f9fafb) structured surfaces',
      'Subtle pastel indicators (emerald, amber, slate) with no harsh saturation',
      'Generous padding with mathematical 16px/24px spacing grid',
      'Stripe & Raycast inspired minimalist cloud observability',
    ],
    bestFor: 'Teams looking for an executive, ultra-clean daylight presentation with maximum legibility.',
  },
  {
    id: 'executive-bento',
    title: 'Executive Bento Charcoal',
    subtitle: 'Structured modular bento-box grid with quiet monochrome surfaces and focused alerts.',
    tag: 'Modern Bento',
    image: executiveBentoImg,
    themeType: 'dark',
    palette: [
      { name: 'Charcoal', hex: '#0E1117' },
      { name: 'Bento Box', hex: '#161B22' },
      { name: 'Highlight', hex: '#30363D' },
      { name: 'Status', hex: '#10B981' },
    ],
    characteristics: [
      'Symmetrical bento-grid card modularity with unified 12px radii',
      'Flat depth hierarchy that replaces visual noise with purposeful whitespace',
      'Calm telemetry sparklines and focused, non-blinking status badges',
      'Balanced contrast compliant with WCAG AA guidelines',
    ],
    bestFor: 'DevOps leads and SRE managers who require an organized, clutter-free bird-eye view.',
  },
];

interface UITemplateShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTemplate: string;
  onSelectTemplate: (templateId: 'linear-dark' | 'swiss-light' | 'executive-bento') => void;
}

export const UITemplateShowcaseModal: React.FC<UITemplateShowcaseModalProps> = ({
  isOpen,
  onClose,
  currentTemplate,
  onSelectTemplate,
}) => {
  const [selectedPreview, setSelectedPreview] = useState<UITemplateOption>(UI_TEMPLATES[0]);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: 'spring', damping: 26, stiffness: 320 }}
          className="bg-[#0e1015] border border-white/15 rounded-2xl max-w-5xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="p-5 sm:px-6 border-b border-white/10 flex items-center justify-between bg-[#12151c]">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                <Palette className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white font-display flex items-center gap-2">
                  Minimal & Classy UI Design Templates
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-white/10 text-slate-300">
                    Curated Archetypes
                  </span>
                </h2>
                <p className="text-xs text-slate-400">
                  Select a refined, clutter-free design aesthetic for your Kubernetes observability dashboard
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content: Template Grid & Live Preview */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1">
            {/* 3 Template Selection Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {UI_TEMPLATES.map((tmpl) => {
                const isSelected = selectedPreview.id === tmpl.id;
                const isCurrentlyActive = currentTemplate === tmpl.id;

                return (
                  <motion.div
                    key={tmpl.id}
                    whileHover={{ y: -3 }}
                    onClick={() => setSelectedPreview(tmpl)}
                    className={`rounded-xl border p-4 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#171b24] border-cyan-400 ring-2 ring-cyan-400/30 shadow-lg shadow-cyan-500/10'
                        : 'bg-[#12141a] border-white/10 hover:border-white/20'
                    }`}
                  >
                    <div>
                      {/* Thumbnail Preview */}
                      <div className="relative rounded-lg overflow-hidden border border-white/10 aspect-video mb-3 group">
                        <img
                          src={tmpl.image}
                          alt={tmpl.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomedImage(tmpl.image);
                          }}
                          className="absolute top-2 right-2 p-1.5 rounded bg-black/60 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          title="Zoom preview"
                        >
                          <Maximize2 className="w-3.5 h-3.5" />
                        </button>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 backdrop-blur-sm text-slate-200 border border-white/10">
                          {tmpl.tag}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <h3 className="text-xs font-bold text-white">{tmpl.title}</h3>
                        {tmpl.themeType === 'dark' ? (
                          <Moon className="w-3.5 h-3.5 text-slate-400" />
                        ) : (
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">
                        {tmpl.subtitle}
                      </p>
                    </div>

                    {/* Color Swatches & Action */}
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {tmpl.palette.map((p) => (
                          <span
                            key={p.name}
                            className="w-3 h-3 rounded-full border border-white/20"
                            style={{ backgroundColor: p.hex }}
                            title={`${p.name}: ${p.hex}`}
                          />
                        ))}
                      </div>
                      {isCurrentlyActive ? (
                        <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Active
                        </span>
                      ) : (
                        <span className="text-[11px] font-medium text-cyan-400 flex items-center gap-0.5">
                          View details &rarr;
                        </span>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Selected Template Deep-Dive Breakdown */}
            <div className="bg-[#12151d] border border-white/10 rounded-xl p-5 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                      {selectedPreview.tag}
                    </span>
                    <h3 className="text-sm font-bold text-white font-display">
                      {selectedPreview.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {selectedPreview.subtitle}
                  </p>
                </div>

                <button
                  onClick={() => {
                    onSelectTemplate(selectedPreview.id);
                    onClose();
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all shrink-0"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply This UI Template</span>
                </button>
              </div>

              {/* Large Image Preview with Key Highlights */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                <div className="lg:col-span-7 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-inner group relative cursor-pointer" onClick={() => setZoomedImage(selectedPreview.image)}>
                  <img
                    src={selectedPreview.image}
                    alt={selectedPreview.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-auto object-cover group-hover:scale-102 transition-transform duration-300"
                  />
                  <div className="absolute bottom-2 right-2 px-2.5 py-1 rounded bg-black/70 backdrop-blur-sm text-[11px] text-white flex items-center gap-1.5 opacity-80 group-hover:opacity-100">
                    <Maximize2 className="w-3 h-3" /> Click to enlarge
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Design System & Characteristics
                    </h4>
                    <ul className="space-y-2">
                      {selectedPreview.characteristics.map((c, i) => (
                        <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-3 border-t border-white/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                      Target Archetype
                    </h4>
                    <p className="text-xs text-slate-400 bg-black/30 p-3 rounded-lg border border-white/5">
                      {selectedPreview.bestFor}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
                      Refined Color Palette
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedPreview.palette.map((pal) => (
                        <div
                          key={pal.name}
                          className="flex items-center gap-2 p-2 rounded-lg bg-black/20 border border-white/5"
                        >
                          <span
                            className="w-4 h-4 rounded-md border border-white/20 shrink-0"
                            style={{ backgroundColor: pal.hex }}
                          />
                          <div className="text-[11px] font-mono leading-tight">
                            <div className="text-white font-medium">{pal.name}</div>
                            <div className="text-slate-400">{pal.hex}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Action */}
          <div className="p-4 sm:px-6 bg-[#0c0d12] border-t border-white/10 flex items-center justify-between">
            <div className="text-xs text-slate-400">
              Need custom layout adjustments? You can switch templates anytime from the header bar.
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 text-xs font-semibold transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  onSelectTemplate(selectedPreview.id);
                  onClose();
                }}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-cyan-500/20 transition-all"
              >
                <span>Apply {selectedPreview.title}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Fullscreen Lightbox Zoom Modal */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-lg flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setZoomedImage(null)}
        >
          <div className="relative max-w-6xl w-full">
            <button
              onClick={() => setZoomedImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-cyan-400 text-sm font-bold flex items-center gap-1"
            >
              <X className="w-5 h-5" /> Close Zoom
            </button>
            <img
              src={zoomedImage}
              alt="High-resolution UI Template Mockup"
              referrerPolicy="no-referrer"
              className="w-full h-auto rounded-xl border border-white/20 shadow-2xl max-h-[85vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </AnimatePresence>
  );
};
