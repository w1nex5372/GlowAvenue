interface Props {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'left' | 'center';
}

export default function SectionHeading({ eyebrow, title, subtitle, align = 'center' }: Props) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow && <span className="eyebrow">{eyebrow}</span>}
      <h2 className="mt-3 font-serif text-3xl leading-tight sm:text-4xl">{title}</h2>
      {subtitle && <p className="mt-4 text-ink/60">{subtitle}</p>}
      {align === 'center' && (
        <span className="mx-auto mt-6 block h-px w-16 bg-gold/60" aria-hidden />
      )}
    </div>
  );
}
