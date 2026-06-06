import { useState } from 'react';
import { Mail, Instagram, Music2, Facebook, Send } from 'lucide-react';
import { useSettings } from '../lib/SettingsContext';

export default function Contact() {
  const settings = useSettings();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const email = settings.contactEmail || 'hello@glamavenue.co.uk';

  const mailto = `mailto:${email}?subject=${encodeURIComponent(
    `GlamAvenue enquiry from ${name || 'a customer'}`,
  )}&body=${encodeURIComponent(message)}`;

  const socials = [
    { url: settings.instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: settings.tiktokUrl, icon: Music2, label: 'TikTok' },
    { url: settings.facebookUrl, icon: Facebook, label: 'Facebook' },
  ].filter((s) => s.url);

  return (
    <>
      <section className="bg-ink text-cream">
        <div className="container-luxe py-16 text-center md:py-20">
          <span className="eyebrow">Contact</span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl">Get in touch</h1>
          <p className="mx-auto mt-4 max-w-xl text-cream/70">
            Questions about a piece, an order or a bundle? We'd love to hear from you.
          </p>
        </div>
      </section>

      <section className="bg-white">
        <div className="container-luxe grid gap-12 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h2 className="font-serif text-2xl">Reach us directly</h2>
            <a
              href={`mailto:${email}`}
              className="mt-6 inline-flex items-center gap-3 text-ink/75 transition hover:text-gold"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-gold/15 text-gold-dark">
                <Mail size={18} />
              </span>
              {email}
            </a>

            {socials.length > 0 && (
              <>
                <h3 className="mt-10 text-sm uppercase tracking-luxe text-ink/45">Follow along</h3>
                <div className="mt-4 flex gap-3">
                  {socials.map(({ url, icon: Icon, label }) => (
                    <a
                      key={label}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink/70 transition hover:border-gold hover:text-gold"
                    >
                      <Icon size={18} />
                    </a>
                  ))}
                </div>
              </>
            )}
          </div>

          <form
            className="card-surface p-6 sm:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              window.location.href = mailto;
            }}
          >
            <h2 className="font-serif text-2xl">Send a message</h2>
            <div className="mt-5">
              <label className="field-label" htmlFor="name">Your name</label>
              <input
                id="name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jane Doe"
              />
            </div>
            <div className="mt-4">
              <label className="field-label" htmlFor="message">Message</label>
              <textarea
                id="message"
                className="input min-h-[140px] resize-y"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="How can we help?"
              />
            </div>
            <button type="submit" className="btn-gold mt-6 w-full">
              <Send size={18} /> Send message
            </button>
            <p className="mt-3 text-center text-xs text-ink/45">
              Opens your email app with the message ready to send.
            </p>
          </form>
        </div>
      </section>
    </>
  );
}
