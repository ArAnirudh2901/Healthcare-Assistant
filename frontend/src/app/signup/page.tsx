"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import styles from '../auth.module.css';

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          password: password,
          full_name: name,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || 'Failed to create account');
      }

      // Auto login or redirect to login
      router.push('/login');
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
            KDS Intelligence
          </div>
          <h2>Transforming Data <br/>into Diagnostics.</h2>
          <p>Experience the next generation of healthcare AI with multi-turn memory and specialized medical agents.</p>
        </div>
      </div>

      {/* Form Side */}
      <div className={styles.rightSide}>
        <div className={styles.blob1}></div>
        <div className={styles.blob2}></div>
        
        <div className={`glass-panel animate-scale-in ${styles.authCard}`}>
          <div className={styles.header}>
            <h1 className={styles.title}>Get Started</h1>
            <p className={styles.subtitle}>Join the future of healthcare diagnostics</p>
          </div>

          {error && (
            <div className={styles.errorAlert}>
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </div>
          )}

          <form className={styles.form} onSubmit={handleSignup}>
            <Input 
              label="Full Name" 
              type="text" 
              placeholder="Dr. Jane Smith" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
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
              Create Account
            </Button>
          </form>

          <div className={styles.footer}>
            Already have an account? <Link href="/login">Sign in here</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
