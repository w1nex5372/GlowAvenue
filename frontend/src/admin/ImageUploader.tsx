import { useRef, useState } from 'react';
import { UploadCloud, X, Loader2, Star } from 'lucide-react';
import { api, ApiError } from '../lib/api';

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
}

export default function ImageUploader({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError('');
    setUploading(true);
    try {
      const { urls } = await api.upload(Array.from(files));
      onChange([...value, ...urls]);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  const makeFirst = (url: string) => onChange([url, ...value.filter((u) => u !== url)]);

  return (
    <div>
      <div className="flex flex-wrap gap-3">
        {value.map((url, i) => (
          <div key={url} className="group relative h-24 w-24 overflow-hidden rounded-xl bg-cream ring-1 ring-ink/10">
            <img src={url} alt="" className="h-full w-full object-cover" />
            {i === 0 && (
              <span className="absolute left-1 top-1 rounded bg-gold px-1.5 py-0.5 text-[0.6rem] font-medium text-ink">
                Cover
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center gap-1 bg-ink/45 opacity-0 transition group-hover:opacity-100">
              {i !== 0 && (
                <button
                  type="button"
                  onClick={() => makeFirst(url)}
                  className="rounded-full bg-white/90 p-1.5 text-ink hover:bg-white"
                  title="Make cover image"
                >
                  <Star size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={() => remove(url)}
                className="rounded-full bg-white/90 p-1.5 text-red-600 hover:bg-white"
                title="Remove"
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
          className="flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-ink/20 text-ink/50 transition hover:border-gold hover:text-gold disabled:opacity-60"
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

      <p className="mt-2 text-xs text-ink/45">JPG, PNG or WEBP · max 5MB each · first image is the cover.</p>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
