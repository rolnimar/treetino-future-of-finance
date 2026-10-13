import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { CloseIcon } from '../victron/victron-icons';

export interface FintechModalAction {
  label: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  disabled?: boolean;
  isLoading?: boolean;
}

export interface FintechModalProps {
  isOpen: boolean;
  onClose: () => void;
  // 1. Icon (top centered)
  icon: ReactNode;
  // 2. Tag (pill badge)
  tag?: string;
  tagColorClass?: string;
  // 3. Heading
  title: ReactNode;
  // 4. Text (subtitle / description)
  description?: ReactNode;
  // 5. Main Point (central content tile)
  children?: ReactNode;
  // 6. Two Buttons
  primaryButton?: FintechModalAction;
  secondaryButton?: FintechModalAction;
  // Optional microcopy / trust footer
  footerNote?: ReactNode;
  // Optional width/class override if needed
  maxWidthClass?: string;
}

export function FintechModal({
  isOpen,
  onClose,
  icon,
  tag,
  tagColorClass,
  title,
  description,
  children,
  primaryButton,
  secondaryButton,
  footerNote,
  maxWidthClass,
}: FintechModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="fintech-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-zinc-950/60 backdrop-blur-md animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={`relative w-full ${
          maxWidthClass || 'max-w-[420px]'
        } rounded-3xl bg-white p-5 sm:p-6 shadow-[0_25px_70px_-15px_rgba(0,0,0,0.35)] border border-zinc-200/90 animate-scale-up flex flex-col max-h-[90vh] overflow-hidden space-y-4`}
      >
        {/* Top-Right Dismiss Button */}
        <button
          type="button"
          aria-label="Close modal"
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-400 hover:text-zinc-700 transition cursor-pointer z-10"
        >
          <CloseIcon className="h-4 w-4" />
        </button>

        {/* 1. Icon, 2. Tag, 3. Heading, 4. Text */}
        <div className="text-center space-y-2 shrink-0 pt-1">
          {/* 1. Icon */}
          <div className="mx-auto flex items-center justify-center shrink-0">
            {icon}
          </div>

          {/* 2. Tag */}
          {tag && (
            <div className="pt-0.5">
              <span
                className={`inline-flex items-center font-mono text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                  tagColorClass ||
                  'text-[#183d89] bg-blue-50 border border-blue-100/80'
                }`}
              >
                {tag}
              </span>
            </div>
          )}

          {/* 3. Heading */}
          <h3
            id="fintech-modal-title"
            className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-950 leading-snug px-2"
          >
            {title}
          </h3>

          {/* 4. Text */}
          {description && (
            <p className="text-xs sm:text-[13px] text-zinc-500 font-normal max-w-xs mx-auto leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {/* 5. Main Point (Children Body) */}
        {children && (
          <div className="overflow-y-auto flex-1 space-y-3 pr-0.5 scrollbar-none text-left">
            {children}
          </div>
        )}

        {/* 6. Two Buttons & Footer */}
        <div className="pt-2 shrink-0 space-y-2 border-t border-zinc-100">
          {primaryButton && (
            <button
              type="button"
              disabled={primaryButton.disabled || primaryButton.isLoading}
              onClick={primaryButton.onClick}
              className="w-full h-12 rounded-2xl bg-gradient-to-r from-[#183d89] via-[#2052b0] to-[#2563eb] hover:from-[#1d4bb5] hover:to-[#3b82f6] text-sm sm:text-base font-semibold text-white shadow-md shadow-blue-900/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{primaryButton.label}</span>
            </button>
          )}

          {secondaryButton &&
            (secondaryButton.variant === 'link' ? (
              <button
                type="button"
                disabled={secondaryButton.disabled}
                onClick={secondaryButton.onClick}
                className="w-full text-center py-1 text-xs text-zinc-500 hover:text-zinc-900 font-medium transition cursor-pointer"
              >
                {secondaryButton.label}
              </button>
            ) : (
              <button
                type="button"
                disabled={secondaryButton.disabled}
                onClick={secondaryButton.onClick}
                className="w-full h-11 rounded-2xl border border-zinc-200/90 bg-white hover:bg-zinc-50 text-sm font-semibold text-zinc-700 transition cursor-pointer shadow-2xs active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span>{secondaryButton.label}</span>
              </button>
            ))}

          {footerNote && (
            <p className="text-center text-[10px] text-zinc-400 font-mono pt-0.5">
              {footerNote}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
