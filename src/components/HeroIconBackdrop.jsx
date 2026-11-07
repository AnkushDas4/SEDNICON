import React, { memo } from 'react';
import { getRenderUrl } from '../utils/api';

// Curated 54 distinct icons across Languages, Dev Tools, Frameworks, AI, Gaming, Cloud, Databases, Security & Web3
const BACKDROP_ROWS = [
  // Row 0 - Upper boundary
  {
    offsetClass: 'translate-x-0',
    icons: [
      { name: 'terminal', size: 44 },
      { name: 'python', size: 36 },
      { name: 'cloud', size: 48 },
      { name: 'database', size: 38 },
      { name: 'security', size: 42 },
      { name: 'react', size: 50 },
      { name: 'sparkles', size: 36 },
      { name: 'docker', size: 46 },
      { name: 'gamepad', size: 40 },
    ],
  },
  // Row 1 - Upper-middle
  {
    offsetClass: 'translate-x-6 sm:translate-x-14',
    icons: [
      { name: 'rust', size: 40 },
      { name: 'code', size: 46 },
      { name: 'redis', size: 36 },
      { name: 'shield', size: 48 },
      { name: 'openai', size: 42 },
      { name: 'nextjs', size: 44 },
      { name: 'server', size: 38 },
      { name: 'currency_bitcoin', size: 42 },
      { name: 'rocket', size: 48 },
    ],
  },
  // Row 2 - Upper flank (around headline)
  {
    offsetClass: '-translate-x-4 sm:-translate-x-10',
    icons: [
      { name: 'typescript', size: 42 },
      { name: 'git', size: 38 },
      { name: 'postgresql', size: 46 },
      { name: 'lock', size: 36 },
      { name: 'brain', size: 48 },
      { name: 'vue', size: 40 },
      { name: 'kubernetes', size: 46 },
      { name: 'headphones', size: 42 },
      { name: 'bolt', size: 38 },
    ],
  },
  // Row 3 - Lower flank (around CTA)
  {
    offsetClass: 'translate-x-8 sm:translate-x-16',
    icons: [
      { name: 'golang', size: 44 },
      { name: 'github', size: 48 },
      { name: 'mongodb', size: 38 },
      { name: 'key', size: 36 },
      { name: 'psychology', size: 46 },
      { name: 'svelte', size: 40 },
      { name: 'aws', size: 44 },
      { name: 'globe', size: 42 },
      { name: 'layers', size: 46 },
    ],
  },
  // Row 4 - Lower-middle
  {
    offsetClass: '-translate-x-4 sm:-translate-x-8',
    icons: [
      { name: 'javascript', size: 40 },
      { name: 'linux', size: 46 },
      { name: 'mysql', size: 38 },
      { name: 'vpn_key', size: 36 },
      { name: 'smart_toy', size: 48 },
      { name: 'angular', size: 44 },
      { name: 'vercel', size: 42 },
      { name: 'monitor', size: 40 },
      { name: 'cpu', size: 46 },
    ],
  },
  // Row 5 - Lower boundary
  {
    offsetClass: 'translate-x-4 sm:translate-x-12',
    icons: [
      { name: 'swift', size: 42 },
      { name: 'nodejs', size: 46 },
      { name: 'storage', size: 38 },
      { name: 'radar', size: 40 },
      { name: 'memory', size: 44 },
      { name: 'flutter', size: 40 },
      { name: 'tailwindcss', size: 46 },
      { name: 'token', size: 36 },
      { name: 'auto_awesome', size: 48 },
    ],
  },
];

function HeroIconBackdropComponent() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden -z-10"
      style={{
        maskImage:
          'radial-gradient(ellipse 65% 50% at 50% 46%, transparent 12%, rgba(0,0,0,0.35) 36%, black 72%)',
        WebkitMaskImage:
          'radial-gradient(ellipse 65% 50% at 50% 46%, transparent 12%, rgba(0,0,0,0.35) 36%, black 72%)',
      }}
    >
      {/* Tilted & floating atmospheric mosaic layer */}
      <div className="animate-hero-backdrop flex w-[120%] -left-[10%] relative flex-col justify-between h-full py-2 sm:py-4 gap-4 sm:gap-7 lg:gap-9">
        {BACKDROP_ROWS.map((row, rowIdx) => (
          <div
            key={rowIdx}
            className={`flex items-center justify-around gap-5 sm:gap-10 lg:gap-16 transition-transform duration-700 ${row.offsetClass}`}
          >
            {row.icons.map((icon, iconIdx) => {
              const url = getRenderUrl({
                q: icon.name,
                color: 'ffffff',
                size: icon.size,
              });

              return (
                <div
                  key={`${icon.name}-${iconIdx}`}
                  className="flex shrink-0 items-center justify-center transition-opacity duration-300"
                  style={{ width: `${icon.size}px`, height: `${icon.size}px` }}
                >
                  <img
                    src={url}
                    alt=""
                    width={icon.size}
                    height={icon.size}
                    loading={rowIdx > 2 ? 'lazy' : 'eager'}
                    decoding="async"
                    onError={(e) => {
                      e.currentTarget.style.opacity = '0';
                    }}
                    className="h-full w-full object-contain invert dark:invert-0 opacity-[0.09] dark:opacity-[0.14] transition-opacity duration-300"
                  />
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export const HeroIconBackdrop = memo(HeroIconBackdropComponent);
export default HeroIconBackdrop;
