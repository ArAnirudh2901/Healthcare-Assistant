"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { API_BASE_URL } from '@/lib/api';
import styles from '../auth.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const formData = new URLSearchParams();
      formData.append('username', email);
      formData.append('password', password);

      const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to login');
      }

      const data = await res.json();
      // In a real app, use HTTP-only cookies. For MVP, localStorage.
      localStorage.setItem('access_token', data.access_token);
      router.push('/dashboard');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <div className="mesh-bg" />
      
      {/* Brand Side */}
      <div className={styles.leftSide + " animate-fade-in"}>
        <div className={styles.overlay + " animate-slide-up"}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '32px', height: '32px', background: 'white', color: 'var(--primary)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</span>
            MediHealth
          </div>
          <h2>Accelerating Medical <br/>Insights with AI.</h2>
          <p>Join thousands of healthcare professionals using our multi-agent orchestrator for precision diagnostics.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className={styles.rightSide}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        
        <div className={`glass-panel animate-scale-in ${styles.authCard}`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Sign In</h1>
            <p className={styles.subtitle}>Welcome back to your healthcare workspace</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleLogin}>
            <Input 
              label="Email Address" 
              type="email" 
              placeholder="doctor@hospital.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Input 
              label="Password" 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <Button type="submit" fullWidth isLoading={isLoading} size="large" style={{ marginTop: '1rem' }}>
              Sign In to Dashboard
            </Button>
          </form>

          <div className={styles.footer}>
            New to MediHealth? <Link href="/signup">Create an account</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
