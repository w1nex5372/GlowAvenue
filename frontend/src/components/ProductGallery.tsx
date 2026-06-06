import { useState } from 'react';
import ImagePlaceholder from './ImagePlaceholder';

export default function ProductGallery({ images, alt }: { images: string[]; alt: string }) {
  const [active, setActive] = useState(0);

  if (!images || images.length === 0) {
    return <ImagePlaceholder className="aspect-square w-full rounded-3xl" />;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="aspect-square w-full overflow-hidden rounded-3xl bg-cream">
        <img src={images[active]} alt={alt} className="h-full w-full object-cover" />
      </div>

      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-3">
          {images.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setActive(i)}
              className={`aspect-square overflow-hidden rounded-xl bg-cream ring-2 transition ${
                i === active ? 'ring-gold' : 'ring-transparent hover:ring-gold/40'
              }`}
            >
              <img src={src} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
