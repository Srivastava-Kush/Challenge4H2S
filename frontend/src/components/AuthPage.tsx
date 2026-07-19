import React, { useState } from 'react';
import { Shield, Mail, Lock, User, Eye, EyeOff, Globe, ArrowRight, Loader2, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AuthPageProps {
  onAuthSuccess: () => void;
  onCancel: () => void;
}

type PortalRole = 'fan' | 'ops' | 'volunteer';

const DEMO_ACCOUNTS: Record<'ops' | 'volunteer', { email: string; password: string; label: string }> = {
  ops: { email: 'ops@stadiumiq.demo', password: 'ops12345', label: 'Operations demo' },
  volunteer: { email: 'vol-2@stadium.com', password: 'password123', label: 'Volunteer demo' },
};

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess, onCancel }) => {
  const { login, register, loginWithGoogle, loading, error, clearError } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [portalRole, setPortalRole] = useState<PortalRole>('fan');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const completeIfAuthenticated = () => {
    window.setTimeout(() => {
      if (localStorage.getItem('stadiumiq_user')) onAuthSuccess();
    }, 100);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    clearError();
    if (mode === 'login') await login(email, password, portalRole);
    else await register(name, email, password);
    completeIfAuthenticated();
  };

  const handleGoogle = async () => {
    clearError();
    await loginWithGoogle();
    window.setTimeout(completeIfAuthenticated, 1400);
  };

  const selectPortal = (nextRole: PortalRole) => {
    setPortalRole(nextRole);
    clearError();
    if (nextRole === 'fan') return;
    const demo = DEMO_ACCOUNTS[nextRole];
    setMode('login');
    setEmail(demo.email);
    setPassword(demo.password);
  };

  return (
    <main className="auth-overlay">
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="auth-card" aria-labelledby="auth-title">
        <button type="button" onClick={onCancel} className="auth-close-btn" aria-label="Close sign in"><X size={18} /></button>
        <div className="auth-logo">
          <div className="auth-logo-icon"><Shield size={28} /></div>
          <div><h1 id="auth-title" className="auth-logo-title">StadiumIQ</h1><p className="auth-logo-sub">FIFA World Cup 2026</p></div>
        </div>

        <div className="auth-tabs" role="tablist" aria-label="Authentication mode">
          <button role="tab" aria-selected={mode === 'login'} onClick={() => { setMode('login'); clearError(); }} className={`auth-tab ${mode === 'login' ? 'active' : ''}`}>Sign In</button>
          <button role="tab" aria-selected={mode === 'register'} onClick={() => { setMode('register'); setPortalRole('fan'); clearError(); }} className={`auth-tab ${mode === 'register' ? 'active' : ''}`}>Sign Up</button>
        </div>

        <div className="auth-portal-grid" aria-label="Choose portal">
          {(['fan', 'ops', 'volunteer'] as const).map(currentRole => (
            <button key={currentRole} type="button" onClick={() => selectPortal(currentRole)} className={`auth-portal-btn ${portalRole === currentRole ? 'active' : ''}`}>
              <strong>{currentRole === 'fan' ? 'Fan' : currentRole === 'ops' ? 'Operations' : 'Volunteer'}</strong>
              <span>{currentRole === 'fan' ? 'Create an account' : 'Provisioned access'}</span>
            </button>
          ))}
        </div>

        {portalRole !== 'fan' && <div className="auth-demo-account" role="note"><strong>{DEMO_ACCOUNTS[portalRole].label}</strong><span>{DEMO_ACCOUNTS[portalRole].email}</span><code>{DEMO_ACCOUNTS[portalRole].password}</code></div>}
        {error && <div className="auth-error" role="alert">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'register' && <div className="auth-field"><label className="auth-label">Full Name</label><div className="auth-input-wrap"><User size={16} className="auth-input-icon" /><input type="text" placeholder="Your full name" value={name} onChange={event => setName(event.target.value)} required className="auth-input" /></div></div>}
          <div className="auth-field"><label className="auth-label">Email Address</label><div className="auth-input-wrap"><Mail size={16} className="auth-input-icon" /><input type="email" placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} required className="auth-input" /></div></div>
          <div className="auth-field"><label className="auth-label">Password</label><div className="auth-input-wrap"><Lock size={16} className="auth-input-icon" /><input type={showPassword ? 'text' : 'password'} value={password} onChange={event => setPassword(event.target.value)} required minLength={6} className="auth-input" /><button type="button" onClick={() => setShowPassword(value => !value)} className="auth-eye-btn" aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
          <button type="submit" className="auth-submit-btn" disabled={loading}>{loading ? <Loader2 size={18} className="spin" /> : <>{mode === 'login' ? `Sign in to ${portalRole === 'fan' ? 'StadiumIQ' : portalRole === 'ops' ? 'Operations' : 'Volunteer Portal'}` : 'Create Fan Account'}<ArrowRight size={16} /></>}</button>
        </form>

        {portalRole === 'fan' && <><div className="auth-divider"><span>or continue with</span></div><button onClick={handleGoogle} className="auth-google-btn" disabled={loading}><Globe size={18} />Sign in with Google</button></>}
        <p className="auth-demo-hint">Fan accounts can be created here. Operations and volunteer access is provisioned and locked.</p>
      </section>
    </main>
  );
};
