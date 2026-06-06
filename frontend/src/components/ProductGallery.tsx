import { useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Maximize2 } from 'lucide-react';
import ImagePlaceholder from './ImagePlaceholder';
import Lightbox from './Lightbox';

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);

  // Touch handling so a swipe navigates while a tap opens the lightbox.
  const moved = useRef(false);
  const startX = useRef(0);
  const startY = useRef(0);

  if (!images || images.length === 0) {
    return <ImagePlaceholder className="aspect-square w-full rounded-3xl ring-1 ring-ink/5" />;
  }

  const hasMany = images.length > 1;
  const step = (dir: number) => setActive((i) => (i + dir + images.length) % images.length);

  const onTouchStart = (e: React.TouchEvent) => {
    moved.current = false;
    startX.current = e.touches[0].clientX;
    startY.current = e.touches[0].clientY;
  };
  const onTouchMove = (e: React.TouchEvent) => {
    const dx = Math.abs(e.touches[0].clientX - startX.current);
    const dy = Math.abs(e.touches[0].clientY - startY.current);
    if (dx > 10 && dx > dy) moved.current = true;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!moved.current || !hasMany) return;
    const dx = e.changedTouches[0].clientX - startX.current;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
  };
  const onMainClick = () => {
    if (moved.current) {
      moved.current = false;
      return; // it was a swipe, not a tap
    }
    setOpen(true);
  };

  return (
    <>
      <div className="flex gap-4">
        {/* Vertical thumbnails — desktop only */}
        {hasMany && (
          <div className="hidden w-[68px] shrink-0 flex-col gap-3 md:flex">
            {images.map((src, i) => (
              <button
                key={src + i}
                type="button"
                onClick={() => setActive(i)}
                aria-label={`View image ${i + 1}`}
                aria-current={i === active}
                className={`aspect-square overflow-hidden rounded-xl bg-cream transition ${
                  i === active ? 'ring-2 ring-gold' : 'ring-1 ring-ink/10 hover:ring-gold/50'
                }`}
              >
                <img src={src} alt="" loading="lazy" className="h-full w-full object-contain p-1.5" />
              </button>
            ))}
          </div>
        )}

        {/* Main image */}
        <div className="min-w-0 flex-1">
          <button
            type="button"
            onClick={onMainClick}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
            aria-label="Open image full screen"
            className="group relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-3xl bg-cream ring-1 ring-ink/5"
          >
            <img
              src={images[active]}
              alt={alt}
              decoding="async"
              className="h-full w-full object-contain p-4 transition-transform duration-[800ms] ease-out group-hover:scale-[1.03] sm:p-8"
            />
            <span className="pointer-events-none absolute bottom-3 right-3 hidden h-9 w-9 items-center justify-center rounded-full bg-white/85 text-ink/70 opacity-0 backdrop-blur transition-opacity duration-300 group-hover:opacity-100 md:flex">
              <Maximize2 size={16} />
            </span>
          </button>

          {/* Mobile dots */}
          {hasMany && (
            <div className="mt-4 flex justify-center gap-2 md:hidden">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setActive(i)}
                  aria-label={`Go to image ${i + 1}`}
                  className={`h-1.5 rounded-full transition-all ${
                    i === active ? 'w-5 bg-gold' : 'w-1.5 bg-ink/20'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <Lightbox
            images={images}
            index={active}
            alt={alt}
            onIndexChange={setActive}
            onClose={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
