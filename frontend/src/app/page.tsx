import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function Home() {
  return (
    <main style={{ position: 'relative', overflow: 'hidden' }}>
      <div className="mesh-bg" />
      
      {/* Navigation Bar */}
      <nav style={{ 
        height: '80px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        padding: '0 2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', letterSpacing: '-1px' }}>
          KDS<span style={{ color: 'var(--foreground)' }}>Intelligence</span>
        </div>
        <div style={{ display: 'flex', gap: '2rem', alignItems: 'center' }}>
          <Link href="/login" style={{ fontWeight: 500, color: 'var(--muted-foreground)' }}>Login</Link>
          <Link href="/signup">
            <Button variant="primary" size="small">Get Started</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container" style={{ 
        paddingTop: '8rem', 
        paddingBottom: '6rem', 
        textAlign: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        <div className="animate-slide-up">
          <span style={{ 
            background: 'var(--primary-light)', 
            color: 'var(--primary)', 
            padding: '0.5rem 1rem', 
            borderRadius: 'var(--radius-full)',
            fontSize: '0.875rem',
            fontWeight: 600,
            marginBottom: '2rem',
            display: 'inline-block'
          }}>
            Revolutionizing Medical Diagnostics
          </span>
          <h1 style={{ 
            fontSize: 'clamp(2.5rem, 8vw, 4.5rem)', 
            lineHeight: 1.1, 
            marginBottom: '1.5rem',
            maxWidth: '900px',
            margin: '0 auto 1.5rem'
          }}>
            Intelligent AI Agents for <span style={{ color: 'var(--primary)' }}>Healthcare Excellence.</span>
          </h1>
          <p style={{ 
            fontSize: '1.25rem', 
            color: 'var(--muted-foreground)', 
            maxWidth: '600px', 
            margin: '0 auto 3rem',
            lineHeight: 1.6
          }}>
            KDS Intelligence orchestrates multi-turn medical agents to provide high-precision diagnostics, report analysis, and clinical decision support.
          </p>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <Link href="/signup">
              <Button variant="primary" size="large">Start Free Trial</Button>
            </Link>
            <Link href="/chat">
              <Button variant="outline" size="large">Live Demo</Button>
            </Link>
          </div>
        </div>

        {/* Dashboard Preview / Floating Cards */}
        <div className="animate-fade-in" style={{ marginTop: '6rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem' }}>
          <Card variant="glass" hoverable padding="large" className="animate-float" style={{ animationDelay: '0s' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            </div>
            <h3 style={{ marginBottom: '0.75rem' }}>Medical Analysis</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9375rem' }}>Advanced RAG-based analysis of medical records with clinical precision.</p>
          </Card>

          <Card variant="glass" hoverable padding="large" className="animate-float" style={{ animationDelay: '1s' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
            </div>
            <h3 style={{ marginBottom: '0.75rem' }}>Real-time Insights</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9375rem' }}>Instant medical report processing and visual data tracking for patients.</p>
          </Card>

          <Card variant="glass" hoverable padding="large" className="animate-float" style={{ animationDelay: '2s' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem', color: 'white' }}>
              <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
            </div>
            <h3 style={{ marginBottom: '0.75rem' }}>Secure & Compliant</h3>
            <p style={{ color: 'var(--muted-foreground)', fontSize: '0.9375rem' }}>Enterprise-grade security with full data isolation and HIPAA readiness.</p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ padding: '4rem 0', borderTop: '1px solid var(--border)', marginTop: '4rem' }}>
        <div className="container" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800 }}>KDS</div>
          <div style={{ color: 'var(--muted-foreground)', fontSize: '0.875rem' }}>
            © 2026 Kinetix Digital Solutions. All rights reserved.
          </div>
        </div>
      </footer>
    </main>
  );
}
