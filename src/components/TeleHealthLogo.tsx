import React from 'react';

interface TeleHealthLogoProps {
  size?: number;
  variant?: 'icon' | 'horizontal' | 'full';
  className?: string;
  showTagline?: boolean;
  theme?: 'light' | 'dark';
}

export const TeleHealthLogo: React.FC<TeleHealthLogoProps> = ({
  size = 40,
  variant = 'icon',
  className = '',
  showTagline = true,
  theme = 'light',
}) => {
  const isDark = theme === 'dark';
  const primaryTextColor = isDark ? 'text-white' : 'text-[#0D47A1]';
  const taglineTextColor = isDark ? 'text-slate-400' : 'text-slate-500';

  // Base SVG rendering for the logo emblem
  const renderEmblem = (emblemSize: number) => {
    return (
      <svg
        width={emblemSize}
        height={emblemSize}
        viewBox="0 0 450 450"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="select-none"
      >
        <defs>
          {/* Main Blue Gradient */}
          <linearGradient id="blueGradient" x1="150" y1="100" x2="300" y2="350" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D47A1" />
            <stop offset="100%" stopColor="#1565C0" />
          </linearGradient>

          {/* Teal / Green Gradient */}
          <linearGradient id="tealGradient" x1="160" y1="90" x2="290" y2="225" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#00E5D4" />
            <stop offset="100%" stopColor="#00BFA6" />
          </linearGradient>

          {/* Blue Avatar Gradient */}
          <linearGradient id="avatarBlue" x1="175" y1="260" x2="235" y2="330" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#0D47A1" />
            <stop offset="100%" stopColor="#1A237E" />
          </linearGradient>

          {/* Clip path for cutting off avatars inside the rounded phone bottom */}
          <clipPath id="phoneInnerClip">
            <rect x="156" y="106" width="138" height="238" rx="30" />
          </clipPath>
        </defs>

        {/* 1. Stethoscope ear tubes (binaural loop) on the left */}
        <path
          d="M 150 160 C 110 160 100 210 100 240 C 100 280 120 310 150 310"
          stroke="url(#blueGradient)"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        {/* Ear tip dot on left binaural */}
        <circle cx="150" cy="160" r="7" fill="url(#blueGradient)" />

        {/* 2. Stethoscope chestpiece (diaphragm) on the right */}
        {/* Diaphragm connection curve from phone bottom right */}
        <path
          d="M 265 340 C 315 340 335 300 335 247"
          stroke="url(#blueGradient)"
          strokeWidth="11"
          strokeLinecap="round"
          fill="none"
        />
        {/* Diaphragm Outer Circle */}
        <circle
          cx="335"
          cy="225"
          r="22"
          stroke="url(#blueGradient)"
          strokeWidth="10"
          fill={isDark ? "#1E293B" : "#FFFFFF"}
        />
        {/* Diaphragm Inner Circle */}
        <circle
          cx="335"
          cy="225"
          r="12"
          fill="url(#tealGradient)"
        />

        {/* 3. Smartphone Frame */}
        <rect
          x="150"
          y="100"
          width="150"
          height="250"
          rx="36"
          fill={isDark ? "#1E293B" : "#FFFFFF"}
          stroke="url(#blueGradient)"
          strokeWidth="12"
        />

        {/* Smartphone Speaker Pill at the top */}
        <rect
          x="205"
          y="114"
          width="40"
          height="6"
          rx="3"
          fill="url(#blueGradient)"
        />

        {/* 4. Clustered content inside the phone, utilizing the inner clip path */}
        <g clipPath="url(#phoneInnerClip)">
          {/* Teal Heart */}
          <path
            d="M 225 225 C 185 185 160 155 160 130 C 160 108 178 90 200 90 C 213 90 221 97 225 103 C 229 97 237 90 250 90 C 272 90 290 108 290 130 C 290 155 265 185 225 225 Z"
            fill="url(#tealGradient)"
          />

          {/* White Medical Cross inside Heart */}
          <rect x="213" y="140" width="24" height="10" rx="3.5" fill="white" />
          <rect x="220" y="133" width="10" height="24" rx="3.5" fill="white" />

          {/* White ECG Zig-zag Line crossing Heart */}
          <path
            d="M 165 145 L 182 145 L 189 157 L 197 122 L 205 168 L 211 145 L 239 145 L 245 159 L 253 125 L 261 166 L 267 145 L 285 145"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Avatar 1: Clinician (Deep Blue, Left) */}
          {/* Head */}
          <circle cx="205" cy="255" r="14" fill="url(#avatarBlue)" />
          {/* Body */}
          <path
            d="M 175 325 C 175 292 190 280 205 280 C 220 280 235 292 235 325 Z"
            fill="url(#avatarBlue)"
          />

          {/* Avatar 2: Patient (Teal, Right) */}
          {/* Head */}
          <circle cx="245" cy="270" r="10.5" fill="url(#tealGradient)" />
          {/* Body */}
          <path
            d="M 222 325 C 222 299 232 291 245 291 C 258 291 268 299 268 325 Z"
            fill="url(#tealGradient)"
          />
        </g>
      </svg>
    );
  };

  if (variant === 'icon') {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${className}`}>
        {renderEmblem(size)}
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className={`flex items-center gap-4 ${className}`}>
        {renderEmblem(size)}
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-2">
            <span className={`text-2xl font-black tracking-tight ${primaryTextColor}`}>
              Clinova
            </span>
          </div>
          {showTagline && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="h-[2px] w-4 bg-[#00BFA6]" />
              <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${taglineTextColor}`}>
                Healthcare Without Bounds
              </span>
              <div className="h-[2px] w-4 bg-[#00BFA6]" />
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full Stacked Logo (Centered with text below)
  return (
    <div className={`flex flex-col items-center text-center ${className}`}>
      {renderEmblem(size)}
      <div className="mt-4">
        <div className="flex items-center justify-center gap-2">
          <span className={`text-3xl md:text-4xl font-black tracking-tight ${primaryTextColor}`}>
            Clinova
          </span>
        </div>
        {showTagline && (
          <div className="flex items-center justify-center gap-3 mt-2.5">
            <div className="h-[2px] w-6 bg-[#00BFA6]" />
            <span className={`text-xs font-black uppercase tracking-[0.2em] ${taglineTextColor}`}>
              Healthcare Without Bounds
            </span>
            <div className="h-[2px] w-6 bg-[#00BFA6]" />
          </div>
        )}
      </div>
    </div>
  );
};
