import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
  images: string[];
  index: number;
  alt: string;
  onIndexChange: (i: number) => void;
  onClose: () => void;
}

/**
 * Lightweight fullscreen image viewer.
 * - Dark overlay, centered image, prev/next arrows, counter.
 * - Keyboard: ESC closes, ← / → navigate.
 * - Click outside the image closes; click image toggles 1x / 2x zoom.
 * - Mouse wheel zooms (1x–3x). Touch: swipe to navigate, swipe down to close.
 * No extra dependencies — Framer Motion is already bundled for fade in/out.
 */
export default function Lightbox({ images, index, alt, onIndexChange, onClose }: Props) {
  const [zoom, setZoom] = useState(1);
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const hasMany = images.length > 1;

  const go = useCallback(
    (dir: number) => {
      onIndexChange((index + dir + images.length) % images.length);
      setZoom(1);
    },
    [index, images.length, onIndexChange],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  // Lock background scroll while open.
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  const onWheel = (e: React.WheelEvent) => {
    setZoom((z) => Math.min(3, Math.max(1, Number((z - Math.sign(e.deltaY) * 0.25).toFixed(2)))));
  };

  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      if (hasMany) go(dx < 0 ? 1 : -1);
    } else if (dy > 90 && Math.abs(dy) > Math.abs(dx)) {
      onClose();
    }
  };

  const arrowClass =
    'absolute top-1/2 z-10 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-cream/80 transition hover:bg-white/10 hover:text-cream';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Product image viewer"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/95 p-6 backdrop-blur-sm sm:p-16"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full text-cream/80 transition hover:bg-white/10 hover:text-cream"
      >
        <X size={24} />
      </button>

      {hasMany && (
        <span className="absolute left-1/2 top-6 -translate-x-1/2 text-sm tracking-wide2 text-cream/70">
          {index + 1} / {images.length}
        </span>
      )}

      {hasMany && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          aria-label="Previous image"
          className={`${arrowClass} left-3`}
        >
          <ChevronLeft size={28} />
        </button>
      )}

      <img
        src={images[index]}
        alt={`${alt} — image ${index + 1}`}
        draggable={false}
        onClick={(e) => { e.stopPropagation(); setZoom((z) => (z > 1 ? 1 : 2)); }}
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ transform: `scale(${zoom})`, cursor: zoom > 1 ? 'zoom-out' : 'zoom-in' }}
        className="max-h-full max-w-full select-none rounded-lg object-contain shadow-2xl transition-transform duration-200"
      />

      {hasMany && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          aria-label="Next image"
          className={`${arrowClass} right-3`}
        >
          <ChevronRight size={28} />
        </button>
      )}

      {hasMany && (
        <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
          {images.map((_, i) => (
            <span
              key={i}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-5 bg-gold' : 'w-1.5 bg-cream/40'}`}
            />
          ))}
        </div>
      )}
    </motion.div>
  );
}
