import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  signInWithPopup,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User as FirebaseUser
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db, googleProvider } from '../firebase';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'fan' | 'ops' | 'volunteer';
  authProvider: 'mongo' | 'google';
  avatar?: string;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string, expectedRole?: UserProfile['role']) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // On mount: restore JWT session from localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('stadiumiq_token');
    const savedUser = localStorage.getItem('stadiumiq_user');
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('stadiumiq_token');
        localStorage.removeItem('stadiumiq_user');
      }
    }
    setLoading(false);
  }, []);

  // Firebase auth state listener (for Google sign-in)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser && !token) {
        // Firebase user logged in — sync with Firestore and set profile
        try {
          const userDocRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userDocRef);

          let profile: UserProfile;
          if (snap.exists()) {
            profile = snap.data() as UserProfile;
          } else {
            profile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Fan',
              email: firebaseUser.email || '',
              role: 'fan',
              authProvider: 'google',
              avatar: firebaseUser.photoURL || undefined
            };
            await setDoc(userDocRef, profile);
          }

          const idToken = await firebaseUser.getIdToken();
          setToken(idToken);
          setUser(profile);
          localStorage.setItem('stadiumiq_token', idToken);
          localStorage.setItem('stadiumiq_user', JSON.stringify(profile));
        } catch (err) {
          console.error('Firestore sync error:', err);
        }
      }
    });
    return () => unsubscribe();
  }, [token]);

  const login = useCallback(async (email: string, password: string, expectedRole?: UserProfile['role']) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, expectedRole })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('stadiumiq_token', data.token);
      localStorage.setItem('stadiumiq_user', JSON.stringify(data.user));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role: 'fan' })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('stadiumiq_token', data.token);
      localStorage.setItem('stadiumiq_user', JSON.stringify(data.user));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed');
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('stadiumiq_token');
    localStorage.removeItem('stadiumiq_user');
    firebaseSignOut(auth).catch(console.error);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, loginWithGoogle, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
