import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-6 text-center text-cream">
      <Logo variant="stacked" className="text-gold" />
      <h1 className="mt-10 font-serif text-6xl">404</h1>
      <p className="mt-3 text-cream/70">The page you're looking for can't be found.</p>
      <Link to="/" className="btn-gold mt-8">
        Back to Home
      </Link>
    </div>
  );
}
