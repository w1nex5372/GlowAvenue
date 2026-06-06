import Logo from './Logo';

/** Elegant branded placeholder shown when a product has no images yet. */
export default function ImagePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-cream via-cream to-beige/60 ${className}`}
    >
      <Logo
        variant="mark"
        className="h-[26%] w-[26%] min-h-[36px] min-w-[36px] text-gold/30"
      />
      <span className="text-[0.55rem] uppercase tracking-luxe text-ink/25">GlamAvenue</span>
    </div>
  );
}
