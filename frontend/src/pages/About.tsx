import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Truck, Gem } from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';
import Logo from '../components/Logo';
import SectionHeading from '../components/SectionHeading';

const PILLARS = [
  { icon: Gem, title: 'Considered design', text: 'Timeless, wearable pieces that never feel dated.' },
  { icon: Sparkles, title: 'Quality materials', text: '18k gold plated stainless steel with a lasting finish.' },
  { icon: ShieldCheck, title: 'Kind to skin', text: 'Hypoallergenic and tarnish-resistant for daily wear.' },
  { icon: Truck, title: 'UK shipping', text: 'Dispatched quickly with tracked delivery.' },
];

export default function About() {
  const settings = useSettings();
  const store = settings.storeName || 'GlamAvenue';

  return (
    <>
      <section className="bg-ink text-cream">
        <div className="container-luxe flex flex-col items-center py-20 text-center md:py-28">
          <Logo variant="stacked" tagline className="text-gold" />
          <h1 className="mt-8 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
            Affordable elegance, made to last
          </h1>
        </div>
      </section>

      <section className="bg-cream">
        <div className="container-luxe grid gap-10 py-16 md:grid-cols-2 md:py-24">
          <div>
            <span className="eyebrow">Our Story</span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl">Luxury, reimagined for every day</h2>
          </div>
          <div className="space-y-5 text-ink/70">
            <p>
              {store} was born from a simple idea: elegant jewellery shouldn't come with a luxury
              price tag. We curate gold plated stainless steel pieces that feel premium, look
              timeless, and are made to be worn and loved every single day.
            </p>
            <p>
              From delicate bracelets to statement necklaces, every piece is chosen for its quality,
              comfort and lasting shine — so you can build a jewellery collection that grows with you.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-luxe py-16 md:py-24">
          <SectionHeading eyebrow="What we stand for" title="The GlamAvenue promise" />
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, text }) => (
              <div key={title} className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                  <Icon size={24} />
                </span>
                <h3 className="mt-5 font-serif text-lg">{title}</h3>
                <p className="mt-2 text-sm text-ink/60">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-beige/40">
        <div className="container-luxe py-16 text-center md:py-20">
          <h2 className="font-serif text-3xl sm:text-4xl">Ready to find your piece?</h2>
          <Link to="/collection" className="btn-gold mt-8">
            Explore the Collection
          </Link>
        </div>
      </section>
    </>
  );
}
