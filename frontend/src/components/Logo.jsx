import React from 'react';

export default function Logo({ size = 'md', className = '' }) {
  const dims = {
    sm: 'w-6 h-6',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }[size] || 'w-9 h-9';

  return (
    <div className={`inline-flex items-center justify-center ${dims} ${className} select-none`}>
      <svg 
        className="w-full h-full" 
        viewBox="0 0 100 100" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Subtle drop shadow/glow for the spark */}
          <filter id="logoGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="1.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        
        {/* Outer Circular Ring */}
        <circle 
          cx="50" 
          cy="50" 
          r="38" 
          stroke="var(--logo-color, #00A88F)" 
          strokeWidth="8.5" 
        />

        {/* Serif-Style Inner V-path matching the brand image */}
        <g stroke="var(--logo-color, #00A88F)" strokeWidth="8.5" strokeLinecap="round" strokeLinejoin="round">
          {/* Main V body */}
          <path d="M 32,32 L 50,70 L 68,32" />
          {/* Left serif cap */}
          <path d="M 25,32 L 39,32" />
          {/* Right serif cap */}
          <path d="M 61,32 L 75,32" />
        </g>

        {/* Central wisdom spark (Gemini-style four-pointed star) */}
        <path 
          d="M 50,17 Q 50,25 58,25 Q 50,25 50,33 Q 50,25 42,25 Q 50,25 50,17 Z" 
          fill="var(--logo-spark-fill, #00A88F)" 
          filter="url(#logoGlow)"
        />
      </svg>
    </div>
  );
}



