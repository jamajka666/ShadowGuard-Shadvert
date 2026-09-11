import React from 'react';

interface ShadowGuardLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}

export const ShadowGuardLogo: React.FC<ShadowGuardLogoProps> = ({
  size = 'md',
  showSubtitle = true,
  className = '',
}) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-14 h-14' : 'w-10 h-10';
  const titleSize = size === 'sm' ? 'text-lg' : size === 'lg' ? 'text-3xl' : 'text-2xl';
  const [imgOk, setImgOk] = React.useState(true);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      {/* Real brand mark with SVG fallback */}
      <div className={`relative ${iconSize} shrink-0 group`}>
        {imgOk ? (
          <img
            src="/brand/icon-192.png"
            alt="ShadowGuard"
            className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(212,160,23,0.35)] transition-transform group-hover:scale-105 rounded-lg"
            onError={() => setImgOk(false)}
          />
        ) : (
          <>
        <svg
          viewBox="0 0 100 115"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_4px_12px_rgba(212,160,23,0.35)] transition-transform group-hover:scale-105"
        >
          <defs>
            {/* Bronze Rim Gradient */}
            <linearGradient id="bronzeRimGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#E6B800" />
              <stop offset="35%" stopColor="#CD7F32" />
              <stop offset="70%" stopColor="#8B5A2B" />
              <stop offset="100%" stopColor="#D4A017" />
            </linearGradient>

            {/* Dark Marble Texture Gradient */}
            <linearGradient id="blackMarbleGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#1C1C1E" />
              <stop offset="50%" stopColor="#121214" />
              <stop offset="100%" stopColor="#0A0A0C" />
            </linearGradient>

            {/* Glowing Cyan Eyes Filter */}
            <filter id="cyanEyeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Outer Shield Outline (Bronze) */}
          <path
            d="M50 5 L92 22 C92 68 76 98 50 110 C24 98 8 68 8 22 Z"
            fill="url(#bronzeRimGrad)"
            stroke="#F5D061"
            strokeWidth="1.5"
          />

          {/* Inner Shield (Dark Marble) */}
          <path
            d="M50 12 L85 27 C85 67 71 93 50 102 C29 93 15 67 15 27 Z"
            fill="url(#blackMarbleGrad)"
            stroke="#8B5A2B"
            strokeWidth="1"
          />

          {/* Gold Veins inside Black Marble */}
          <path d="M22 35 Q40 45 35 65 T60 85" stroke="#D4A017" strokeWidth="0.8" opacity="0.4" fill="none" />
          <path d="M78 30 Q60 50 72 70" stroke="#CD7F32" strokeWidth="0.8" opacity="0.3" fill="none" />

          {/* Hooded Shadow Ninja Silhouette */}
          <path
            d="M50 32 C35 32 28 42 28 58 C28 72 36 82 50 86 C64 82 72 72 72 58 C72 42 65 32 50 32 Z"
            fill="#050507"
          />
          <path
            d="M50 32 Q32 32 30 54 Q40 46 50 48 Q60 46 70 54 Q68 32 50 32 Z"
            fill="#121214"
            stroke="#8B5A2B"
            strokeWidth="0.5"
          />

          {/* Glowing Cyan Ninja Eyes */}
          <ellipse
            cx="40"
            cy="52"
            rx="4.5"
            ry="2.2"
            fill="#00F5FF"
            filter="url(#cyanEyeGlow)"
            transform="rotate(-5 40 52)"
          />
          <ellipse
            cx="60"
            cy="52"
            rx="4.5"
            ry="2.2"
            fill="#00F5FF"
            filter="url(#cyanEyeGlow)"
            transform="rotate(5 60 52)"
          />
          <circle cx="40" cy="52" r="1.2" fill="#FFFFFF" />
          <circle cx="60" cy="52" r="1.2" fill="#FFFFFF" />
        </svg>

        {/* Ambient Cyan Pulse Light */}
        <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-cyan-400 rounded-full blur-md opacity-60 animate-pulse pointer-events-none" />
          </>
        )}
      </div>

      {/* Brand Title & Subtitle */}
      <div className="flex flex-col leading-none">
        <span className={`font-black tracking-tight ${titleSize} flex items-center gap-1`}>
          <span className="text-slate-100">SHADOW</span>
          <span className="text-[#E6B800] drop-shadow-[0_0_8px_rgba(230,184,0,0.5)]">GUARD</span>
        </span>
        {showSubtitle && (
          <span className="text-[11px] sm:text-xs font-black tracking-widest text-cyan-400 uppercase mt-0.5 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Shadvert
          </span>
        )}
      </div>
    </div>
  );
};
