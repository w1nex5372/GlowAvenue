import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { api, ApiError } from '../lib/api';

const MAX_FILE_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const IMAGE_ROLES = ['Hero', 'Model', 'Close-up', 'Lifestyle'];

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

/**
 * Image manager for products.
 * - Upload one or more images.
 * - Reorder by drag-and-drop, or with the ◄ / ► buttons.
 * - The first image is the cover (shown on cards, the gallery default and
 *   featured sections); use the ★ button to promote any image to cover.
 */
export default function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const dragIndex = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    const selected = Array.from(files);
    const invalidType = selected.find((file) => !ALLOWED_TYPES.has(file.type));
    const oversized = selected.find((file) => file.size > MAX_FILE_BYTES);
    if (invalidType) {
      setError(`${invalidType.name}: only JPG, PNG and WEBP images are allowed.`);
      return;
    }
    if (oversized) {
      setError(`${oversized.name}: maximum file size is 5MB.`);
      return;
    }
    setUploading(true);
    try {
      const { urls } = await api.upload(selected);
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length || from === to) return;
    const next = value.slice();
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  // Drag-and-drop reordering (native HTML5 — no dependencies).
  const onDrop = (target: number) => {
    if (dragIndex.current !== null) move(dragIndex.current, target);
    dragIndex.current = null;
    setDragOver(null);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div
            key={url}
            draggable
            onDragStart={() => {
              dragIndex.current = i;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(i);
            }}
            onDrop={() => onDrop(i)}
            onDragEnd={() => {
              dragIndex.current = null;
              setDragOver(null);
            }}
            className={`group relative h-28 w-28 cursor-grab overflow-hidden rounded-xl bg-cream ring-1 transition active:cursor-grabbing ${
              dragOver === i ? 'ring-2 ring-gold' : 'ring-ink/10'
            }`}
          >
            <img src={url} alt="" className="h-full w-full object-contain p-2" draggable={false} />

            <span className="absolute left-1.5 top-1.5 rounded bg-ink/80 px-1.5 py-0.5 text-[0.6rem] font-medium text-white">
              {IMAGE_ROLES[i] ?? `Image ${i + 1}`}
              {i === 0 ? ' / Cover' : ''}
            </span>

            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-ink/55 py-1.5 opacity-0 backdrop-blur-sm transition group-hover:opacity-100">
              <button
                type="button"
                onClick={() => move(i, i - 1)}
                disabled={i === 0}
                aria-label="Move earlier"
                className="rounded p-1 text-cream/90 transition hover:text-gold disabled:opacity-30"
              >
                <ChevronLeft size={14} />
              </button>
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => move(i, 0)}
                  aria-label="Set as cover"
                  title="Set as cover"
                  className="rounded p-1 text-cream/90 transition hover:text-gold"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => move(i, i + 1)}
                disabled={i === value.length - 1}
                aria-label="Move later"
                className="rounded p-1 text-cream/90 transition hover:text-gold disabled:opacity-30"
              >
                <ChevronRight size={14} />
              </button>
              <button
                type="button"
                onClick={() => remove(url)}
                aria-label="Remove"
                title="Remove"
                className="rounded p-1 text-red-300 transition hover:text-red-400"
              >
                <X size={14} />
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink/20 text-ink/50 transition hover:border-gold hover:text-gold disabled:opacity-60"
        >
          {uploading ? <Loader2 size={20} className="animate-spin" /> : <UploadCloud size={20} />}
          <span className="text-[0.65rem]">{uploading ? 'Uploading…' : 'Add image'}</span>
        </button>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      <p className="mt-2 text-xs leading-relaxed text-ink/45">
        JPG, PNG or WEBP · max 5MB each · drag to reorder. The first image is the{' '}
        <span className="font-medium text-ink/60">cover</span> — shown on product cards, as the
        default gallery image and in featured sections.
      </p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
