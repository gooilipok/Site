import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export const BauSquadLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const dimensions = {
    sm: { icon: 36, font: 'text-xl' },
    md: { icon: 48, font: 'text-2xl' },
    lg: { icon: 72, font: 'text-4xl' }
  }[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* GRAPHIC EMBLEM (Compass, Pencil, Ruler, A T) */}
      <svg
        width={dimensions.icon}
        height={dimensions.icon}
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 drop-shadow-md"
      >
        {/* Outer Ring with Ticks */}
        <circle cx="100" cy="100" r="88" stroke="#1E2B37" strokeWidth="4" />
        <circle cx="100" cy="100" r="84" stroke="#C5A059" strokeWidth="1.5" strokeDasharray="4 4" />

        {/* Major Axis Ticks */}
        <line x1="100" y1="8" x2="100" y2="20" stroke="#1E2B37" strokeWidth="3" />
        <line x1="100" y1="180" x2="100" y2="192" stroke="#1E2B37" strokeWidth="3" />
        <line x1="8" y1="100" x2="20" y2="100" stroke="#1E2B37" strokeWidth="3" />
        <line x1="180" y1="100" x2="192" y2="100" stroke="#1E2B37" strokeWidth="3" />

        {/* Ruler Bar Across Compass */}
        <rect x="50" y="90" width="100" height="12" fill="#1E2B37" rx="2" />
        {/* Ruler Tick Marks */}
        <line x1="60" y1="90" x2="60" y2="95" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="70" y1="90" x2="70" y2="98" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="80" y1="90" x2="80" y2="95" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="90" y1="90" x2="90" y2="98" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="100" y1="90" x2="100" y2="95" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="110" y1="90" x2="110" y2="98" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="120" y1="90" x2="120" y2="95" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="130" y1="90" x2="130" y2="98" stroke="#FFFFFF" strokeWidth="1.5" />
        <line x1="140" y1="90" x2="140" y2="95" stroke="#FFFFFF" strokeWidth="1.5" />

        {/* Compass Legs */}
        {/* Left Leg */}
        <path d="M 100 45 L 55 145" stroke="#1E2B37" strokeWidth="9" strokeLinecap="round" />
        {/* Right Leg */}
        <path d="M 100 45 L 145 145" stroke="#1E2B37" strokeWidth="9" strokeLinecap="round" />

        {/* Top Hinge Circle */}
        <circle cx="100" cy="45" r="14" fill="#1E2B37" />
        <circle cx="100" cy="45" r="6" fill="#C5A059" />

        {/* Central Pencil */}
        <path d="M 94 50 L 106 50 L 106 125 L 100 145 L 94 125 Z" fill="#C5A059" stroke="#1E2B37" strokeWidth="2" />
        {/* Pencil Tip */}
        <path d="M 97 135 L 100 145 L 103 135 Z" fill="#1E2B37" />

        {/* Letters A and T inside */}
        <text x="66" y="80" fill="#1E2B37" fontFamily="monospace" fontWeight="900" fontSize="24" textAnchor="middle">A</text>
        <text x="134" y="80" fill="#1E2B37" fontFamily="monospace" fontWeight="900" fontSize="24" textAnchor="middle">T</text>
      </svg>

      {showText && (
        <div className={`font-black uppercase tracking-wider font-sans leading-none ${dimensions.font}`}>
          <span className="text-white">BAU</span>
          <span className="text-[#c5a059]">SQUAD</span>
        </div>
      )}
    </div>
  );
};
