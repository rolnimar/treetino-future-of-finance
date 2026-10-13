import { useState, useRef, useEffect } from 'react';
import {
  DEMO_PERSONAS,
  getActivePersona,
  setActivePersona,
  type DemoPersona,
} from './demo-personas';

interface PersonaSwitcherProps {
  isDark?: boolean;
}

export function PersonaSwitcher({ isDark = false }: PersonaSwitcherProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPersona, setCurrentPersona] = useState<DemoPersona | null>(() =>
    getActivePersona(),
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handlePersonaChange = () => {
      setCurrentPersona(getActivePersona());
    };
    window.addEventListener('treetino-persona-changed', handlePersonaChange);
    return () => {
      window.removeEventListener(
        'treetino-persona-changed',
        handlePersonaChange,
      );
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (id: string | null) => {
    setActivePersona(id);
    setIsOpen(false);
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 sm:gap-2 rounded-full border px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-mono transition-all cursor-pointer shadow-2xs whitespace-nowrap ${
          isDark
            ? 'border-white/20 bg-white/10 text-white hover:bg-white/20'
            : currentPersona
              ? 'border-blue-400/30 bg-blue-950/60 text-blue-200 md:border-blue-200 md:bg-blue-50/95 md:text-blue-950 font-bold hover:bg-blue-900/60 md:hover:bg-blue-100'
              : 'border-white/20 bg-white/10 text-white md:border-zinc-200 md:bg-zinc-50 md:text-zinc-700 hover:bg-white/20 md:hover:bg-zinc-100'
        }`}
        title="Switch demo persona (Host, Investor, Admin)"
      >
        <span
          className={`h-2 w-2 rounded-full ${
            currentPersona ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'
          }`}
        />
        {/* Responsive Label */}
        <span className="font-semibold hidden sm:inline">
          {currentPersona ? currentPersona.label : 'Select Persona'}
        </span>
        <span className="font-semibold sm:hidden">
          {currentPersona ? currentPersona.shortLabel : 'Persona'}
        </span>

        {currentPersona && (
          <span
            className={`text-[10px] hidden xl:inline ${
              isDark ? 'text-zinc-300' : 'text-zinc-500'
            }`}
          >
            {currentPersona.address.slice(0, 4)}…
            {currentPersona.address.slice(-4)}
          </span>
        )}
        <svg
          className={`h-3 w-3 ${isDark ? 'text-zinc-300' : 'text-zinc-500'} transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl border border-zinc-200 bg-white p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 text-zinc-900">
          <div className="px-3 py-2 border-b border-zinc-100">
            <p className="text-[11px] font-bold font-mono uppercase tracking-wider text-[#183d89]">
              Demo Persona Switcher
            </p>
            <p className="text-xs text-zinc-500 mt-0.5">
              Simulate full multi-wallet lifecycle on Solana Devnet
            </p>
          </div>

          <div className="py-1 space-y-1">
            {DEMO_PERSONAS.map((persona) => {
              const isActive = currentPersona?.id === persona.id;
              return (
                <button
                  key={persona.id}
                  type="button"
                  onClick={() => handleSelect(persona.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all flex flex-col gap-0.5 cursor-pointer ${
                    isActive
                      ? 'bg-blue-50 border border-blue-200'
                      : 'hover:bg-zinc-50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-zinc-900 flex items-center gap-1.5">
                      {persona.label}
                      {isActive && (
                        <span className="rounded-full bg-[#183d89] px-1.5 py-0.2 text-[9px] text-white font-mono uppercase">
                          Active
                        </span>
                      )}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">
                      {persona.shortLabel}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-500 line-clamp-1">
                    {persona.description}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500">
                    {persona.address.slice(0, 6)}…{persona.address.slice(-6)}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="pt-1 mt-1 border-t border-zinc-100">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className="w-full text-left px-3 py-2 rounded-xl text-xs text-zinc-600 hover:bg-zinc-100 cursor-pointer flex items-center justify-between"
            >
              <span>Use Browser Extension (Phantom / Solflare)</span>
              {!currentPersona && (
                <span className="text-[10px] font-bold text-emerald-600 font-mono">
                  Connected
                </span>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
