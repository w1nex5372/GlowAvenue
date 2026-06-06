import Logo from './Logo';

/** Elegant branded placeholder shown when a product has no images yet. */
export default function ImagePlaceholder({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center bg-gradient-to-br from-cream to-beige/70 ${className}`}
    >
      <Logo variant="mark" className="h-1/3 w-1/3 text-gold/35" />
    </div>
  );
}
