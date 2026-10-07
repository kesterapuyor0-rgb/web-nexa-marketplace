import React from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  onClick?: () => void;
}

export const Logo: React.FC<LogoProps> = ({ size = 'md', showText = true, className = '', onClick }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-24 h-24',
  };

  return (
    <div
      id="webnexa-brand-logo"
      onClick={onClick}
      className={`inline-flex items-center gap-3 cursor-pointer select-none ${className}`}
    >
      {/* Circular Metallic Medallion Emblem Container */}
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden p-[2px] bg-gradient-to-br from-zinc-300 via-neutral-600 to-zinc-800 shadow-[0_0_15px_rgba(139,92,246,0.35)] shrink-0 group transition-transform duration-300 hover:scale-105`}
      >
        {/* Inner ring */}
        <div className="w-full h-full rounded-full overflow-hidden bg-[#16161a] flex items-center justify-center relative border border-white/20">
          <img
            src="/webnexa_logo.jpg"
            alt="WebNexa Official Emblem"
            className="w-full h-full object-cover object-center"
            onError={(e) => {
              // Fallback to high-precision metallic vector if file load fails
              const target = e.currentTarget;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#25252b] via-[#17171a] to-[#0d0d0f] text-white font-bold">
                    <span class="text-xs text-amber-300 font-cinzel tracking-tighter">WN</span>
                    <span class="text-[7px] text-purple-400 font-mono">NEXA</span>
                  </div>
                `;
              }
            }}
          />
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-cinzel text-xl font-extrabold tracking-wider text-metallic-silver">
              Web<span className="text-metallic-gold">Nexa</span>
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/60 text-purple-300 font-semibold border border-purple-500/30">
              MARKETPLACE
            </span>
          </div>
          <span className="text-[10px] text-zinc-400 tracking-wider font-medium">
            Next-Generation Web Solutions
          </span>
        </div>
      )}
    </div>
  );
};
