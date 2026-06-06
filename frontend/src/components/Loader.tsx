export default function Loader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-3 py-20 text-ink/50">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-gold border-t-transparent" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
