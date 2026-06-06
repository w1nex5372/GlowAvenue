interface LogoProps {
  /** mark = monogram only, inline = monogram + wordmark in a row, stacked = centered column */
  variant?: 'mark' | 'inline' | 'stacked';
  /** Show the "Timeless Elegance" sub-line (stacked variant). */
  tagline?: boolean;
  className?: string;
}

/**
 * GlamAvenue brand logo. Recreated as SVG so it scales crisply everywhere.
 * Uses `currentColor`, so set the colour via a text utility (e.g. `text-gold`).
 *
 * To use the official artwork instead, drop a file in /public and swap the
 * monogram markup below for an <img src="/logo.svg" /> element.
 */
function Monogram({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} role="img" aria-label="GlamAvenue monogram">
      <circle cx="32" cy="32" r="29" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text
        x="32"
        y="42"
        textAnchor="middle"
        fontFamily='"Playfair Display", Georgia, serif'
        fontSize="30"
        fontWeight="600"
        fill="currentColor"
      >
        GA
      </text>
      <path
        d="M49 12 l1.6 4.2 L55 18 l-4.4 1.8 L49 24 l-1.6-4.2 L43 18 l4.4-1.8 Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default function Logo({ variant = 'inline', tagline = false, className = '' }: LogoProps) {
  if (variant === 'mark') {
    return <Monogram className={className || 'h-10 w-10'} />;
  }

  if (variant === 'stacked') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <Monogram className="h-14 w-14" />
        <span className="mt-3 font-serif text-2xl font-semibold tracking-wide2">GLAMAVENUE</span>
        {tagline && (
          <span className="mt-1 text-[0.6rem] uppercase tracking-luxe opacity-80">
            Timeless Elegance
          </span>
        )}
      </div>
    );
  }

  // inline
  return (
    <span className={`flex items-center gap-3 ${className}`}>
      <Monogram className="h-9 w-9 shrink-0" />
      <span className="flex flex-col leading-none">
        <span className="font-serif text-xl font-semibold tracking-wide2">GLAMAVENUE</span>
        {tagline && (
          <span className="mt-1 text-[0.55rem] uppercase tracking-luxe opacity-75">
            Timeless Elegance
          </span>
        )}
      </span>
    </span>
  );
}
