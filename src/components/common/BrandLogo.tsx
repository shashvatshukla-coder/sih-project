import React from 'react';

export interface BrandLogoProps {
  variant?: 'full' | 'icon-only' | 'horizontal' | 'compact' | 'badge';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'hero';
  showMotto?: boolean;
  className?: string;
  onClick?: () => void;
  animated?: boolean;
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  variant = 'horizontal',
  size = 'md',
  showMotto = false,
  className = '',
  onClick,
  animated = false
}) => {
  const sizeMap = {
    xs: { icon: 'w-7 h-7', text: 'text-xs', sub: 'text-[9px]', full: 'w-20' },
    sm: { icon: 'w-9 h-9', text: 'text-sm', sub: 'text-[10px]', full: 'w-28' },
    md: { icon: 'w-11 h-11', text: 'text-base', sub: 'text-[11px]', full: 'w-36' },
    lg: { icon: 'w-14 h-14', text: 'text-lg', sub: 'text-xs', full: 'w-48' },
    xl: { icon: 'w-20 h-20', text: 'text-xl', sub: 'text-sm', full: 'w-64' },
    hero: { icon: 'w-32 h-32 md:w-40 md:h-40', text: 'text-2xl md:text-3xl', sub: 'text-xs md:text-sm', full: 'w-72 md:w-96' }
  };

  const currentSize = sizeMap[size];

  if (variant === 'full') {
    return (
      <div 
        className={`inline-flex flex-col items-center select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <div className={`relative overflow-hidden rounded-2xl p-2 bg-white/95 dark:bg-slate-900/90 shadow-sm border border-slate-200/80 dark:border-slate-800 ${animated ? 'animate-float' : ''}`}>
          <img
            src="/bhu-drishti-logo.png"
            alt="Bhu-Drishti Emblem"
            className={`${currentSize.full} h-auto object-contain rounded-xl drop-shadow-md`}
          />
        </div>
      </div>
    );
  }

  if (variant === 'icon-only') {
    return (
      <div
        className={`relative inline-flex items-center justify-center rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-0.5 shadow-sm ${currentSize.icon} ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <img
          src="/bhu-drishti-logo.png"
          alt="Bhu-Drishti Logo"
          className="w-full h-full object-cover object-top rounded-lg"
        />
      </div>
    );
  }

  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 shadow-xs ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 bg-white shadow-xs">
          <img src="/bhu-drishti-logo.png" alt="Bhu-Drishti" className="w-full h-full object-cover object-top" />
        </div>
        <div className="flex items-center gap-1.5 font-bold text-xs text-emerald-900 dark:text-emerald-200 tracking-tight">
          <span>BHU-DRISHTI</span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">IND</span>
        </div>
      </div>
    );
  }

  // Horizontal variant (default)
  return (
    <div
      className={`inline-flex items-center gap-3 select-none ${onClick ? 'cursor-pointer group' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`relative overflow-hidden rounded-xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 p-1 shadow-sm shrink-0 ${currentSize.icon} ${animated ? 'group-hover:scale-105 transition-transform' : ''}`}>
        <img
          src="/bhu-drishti-logo.png"
          alt="Bhu-Drishti Icon"
          className="w-full h-full object-cover object-top rounded-lg"
        />
      </div>

      <div className="leading-none text-left min-w-0">
        <div className="flex items-center gap-1.5">
          <span className={`font-black tracking-wider text-slate-900 dark:text-white ${currentSize.text} font-sans uppercase`}>
            BHU-DR<span className="text-emerald-600 dark:text-emerald-400">I</span>SHTI
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-mono font-bold border border-emerald-500/20">
            OFFICIAL
          </span>
        </div>
        {showMotto ? (
          <p className="text-[10px] text-amber-600 dark:text-amber-400 font-medium tracking-tight mt-1 truncate">
            One evidence layer for every land decision.
          </p>
        ) : (
          <p className={`text-slate-500 dark:text-slate-400 font-medium mt-1 truncate ${currentSize.sub}`}>
            Land Intelligence Platform
          </p>
        )}
      </div>
    </div>
  );
};
