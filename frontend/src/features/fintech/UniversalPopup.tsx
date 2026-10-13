import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { CloseIcon } from '../victron/victron-icons';

export interface PopupButton {
  label: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  colorClass?: string;
}

export interface UniversalPopupProps {
  isOpen: boolean;
  onClose: () => void;
  // 1. Icon (centered circle at top)
  icon: ReactNode;
  // 2. Tag (pill badge)
  tag: string;
  tagColorClass?: string;
  // 3. Heading (centered bold title)
  title: string;
  // 4. Text (centered explanation)
  description?: string;
  // 5. Main Point (THE ONE central card)
  mainPoint: ReactNode;
  // 6. Two Buttons
  primaryButton: PopupButton;
  secondaryButton?: PopupButton;
  // Optional microcopy under buttons
  footerNote?: string;
  // Theme mode
  dark?: boolean;
}

export function UniversalPopup({
  isOpen,
  onClose,
  icon,
  tag,
  tagColorClass,
  title,
  description,
  mainPoint,
  primaryButton,
  secondaryButton,
  footerNote,
  dark = false,
}: UniversalPopupProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="universal-popup-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/80 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full max-w-[420px] max-h-[92vh] overflow-y-auto rounded-[32px] p-6 shadow-[0_25px_80px_-15px_rgba(0,0,0,0.85)] animate-scale-up flex flex-col text-center space-y-4 ${
          dark
            ? 'bg-gradient-to-b from-[#0d162d] via-[#090f20] to-[#070b14] border border-blue-500/30 text-white'
            : 'bg-white border border-zinc-200/90 text-zinc-950'
        }`}
      >
        {/* Top-Right Dismiss Button */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className={`absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full transition cursor-pointer z-10 ${
            dark
              ? 'bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white'
              : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700'
          }`}
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* 1. Icon */}
        <div className="mx-auto flex items-center justify-center shrink-0 pt-1">
          {icon}
        </div>

        {/* 2. Tag */}
        <div>
          <span
            className={`inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full ${
              tagColorClass ||
              (dark
                ? 'text-blue-300 bg-blue-950/80 border border-blue-400/40'
                : 'text-[#183d89] bg-blue-50 border border-blue-100/80')
            }`}
          >
            {tag}
          </span>
        </div>

        {/* 3. Heading & 4. Text */}
        <div className="space-y-1 px-1">
          <h3
            id="universal-popup-title"
            className={`text-xl sm:text-2xl font-bold tracking-tight leading-snug ${
              dark ? 'text-white' : 'text-zinc-950'
            }`}
          >
            {title}
          </h3>
          {description && (
            <p
              className={`text-xs font-normal leading-relaxed max-w-xs mx-auto ${
                dark ? 'text-slate-300' : 'text-zinc-500'
              }`}
            >
              {description}
            </p>
          )}
        </div>

        {/* 5. Main Point (The ONE single central card) */}
        <div
          className={`rounded-2xl p-4 text-left ${
            dark
              ? 'border border-blue-500/25 bg-[#080d1a]/95 text-white shadow-inner'
              : 'border border-zinc-200/80 bg-zinc-50/70'
          }`}
        >
          {mainPoint}
        </div>

        {/* 6. Two Buttons */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            disabled={primaryButton.disabled || primaryButton.isLoading}
            onClick={primaryButton.onClick}
            className={`w-full h-12 rounded-2xl ${
              primaryButton.colorClass ||
              'bg-gradient-to-r from-[#183d89] via-[#2052b0] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] shadow-blue-900/20'
            } text-sm sm:text-base font-semibold text-white shadow-md active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50`}
          >
            <span>
              {primaryButton.isLoading ? 'Processing…' : primaryButton.label}
            </span>
          </button>

          {secondaryButton && (
            <button
              type="button"
              disabled={secondaryButton.disabled}
              onClick={secondaryButton.onClick}
              className={`w-full h-11 rounded-2xl transition cursor-pointer shadow-2xs active:scale-[0.98] flex items-center justify-center gap-2 text-sm font-semibold ${
                dark
                  ? 'border border-blue-500/30 bg-white/5 hover:bg-white/10 text-slate-200'
                  : 'border border-zinc-200/90 bg-white hover:bg-zinc-50 text-zinc-700'
              }`}
            >
              <span>{secondaryButton.label}</span>
            </button>
          )}

          {footerNote && (
            <p
              className={`text-center text-[10px] font-mono pt-1 ${
                dark ? 'text-slate-400' : 'text-zinc-400'
              }`}
            >
              {footerNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
