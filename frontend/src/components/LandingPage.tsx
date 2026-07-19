import { ArrowRight, Compass, Shield, Users, Utensils } from 'lucide-react';

interface LandingPageProps {
  onExplore: () => void;
  onAuthenticate: () => void;
}

export function LandingPage({ onExplore, onAuthenticate }: LandingPageProps) {
  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="Main navigation">
        <div className="landing-brand"><span className="landing-brand-icon"><Shield size={20} /></span><span>StadiumIQ</span></div>
        <button onClick={onAuthenticate} className="landing-login">Login / Sign up</button>
      </nav>
      <section className="landing-hero">
        <p className="landing-eyebrow">FIFA WORLD CUP 2026 · METLIFE STADIUM</p>
        <h1>Every match day,<br /><em>made simpler.</em></h1>
        <p className="landing-copy">Navigate the stadium, follow live crowd conditions, order food, and get the help you need—before you reach the gate.</p>
        <div className="landing-actions"><button onClick={onExplore} className="landing-primary">Explore the stadium <ArrowRight size={17} /></button><button onClick={onAuthenticate} className="landing-secondary">Sign in to your portal</button></div>
      </section>
      <section className="landing-features" aria-label="StadiumIQ features">
        <article><Compass size={21} /><h2>Navigate with confidence</h2><p>Find the fastest, accessible route using live stadium data.</p></article>
        <article><Utensils size={21} /><h2>Plan your match day</h2><p>Browse food, fixtures, facilities, and match updates in one place.</p></article>
        <article><Users size={21} /><h2>Connected stadium teams</h2><p>Secure portals support fan, volunteer, and operations workflows.</p></article>
      </section>
    </main>
  );
}
