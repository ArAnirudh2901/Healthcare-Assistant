"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import styles from './dashboard.module.css';

interface Report {
  id: string;
  name: string;
  date: string;
  status: 'completed' | 'pending';
  type: string;
  url?: string;
  blobName?: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const fetchUserAndReports = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch('http://localhost:8000/api/v1/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) throw new Error('Auth failed');

        const userData = await res.json();
        const email = userData.email;
        setUserEmail(email);

        // Load persisted reports from localStorage using user-specific key
        const userReportsKey = `patient_reports_${email}`;
        const savedReports = localStorage.getItem(userReportsKey);
        if (savedReports) {
          setReports(JSON.parse(savedReports));
        } else {
          setReports([]);
        }
      } catch (e) {
        console.error('Error fetching user or reports:', e);
        router.push('/login');
      }
    };

    fetchUserAndReports();
  }, [router]);

  // Sync reports to localStorage whenever they change
  useEffect(() => {
    if (isMounted && userEmail) {
      const userReportsKey = `patient_reports_${userEmail}`;
      localStorage.setItem(userReportsKey, JSON.stringify(reports));
    }
  }, [reports, isMounted, userEmail]);

  const handleDelete = async (report: Report) => {
    if (!confirm(`Are you sure you want to delete "${report.name}"?`)) return;

    try {
      if (report.blobName) {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`http://localhost:8000/api/v1/documents/${report.blobName}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          console.warn('Failed to delete from Azure, but removing from local view.');
        }
      }

      setReports(prev => prev.filter(r => r.id !== report.id));
    } catch (error) {
      console.error('Delete error:', error);
      setReports(prev => prev.filter(r => r.id !== report.id));
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      alert('Currently, only PDF reports are supported for AI analysis.');
      return;
    }

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('http://localhost:8000/api/v1/documents/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errorMessage = errorData.detail || 'Upload failed. Please check your Azure storage configuration.';
        throw new Error(errorMessage);
      }

      const data = await res.json();
      
      const newReport: Report = {
        id: Date.now().toString(),
        name: file.name,
        date: new Date().toISOString().split('T')[0],
        status: 'completed',
        type: 'AI Indexed',
        url: data.azure_url,
        blobName: data.blob_name
      };
      
      setReports(prev => [newReport, ...prev]);
      alert('Report successfully uploaded to Azure and indexed!');
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className={styles.dashboardWrapper}>
      <div className="mesh-bg" />
      
      {/* Sidebar Navigation */}
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <span>+</span> KDS Intel
        </div>
        
        <nav className={styles.nav}>
          <Link href="/dashboard" className={styles.navItem + " " + styles.navItemActive}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path></svg>
            Dashboard
          </Link>
          <Link href="/analysis" className={styles.navItem}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
            AI Analytics
          </Link>
          <Link href="/chat" className={styles.navItem}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            Consultation
          </Link>
          <Link href="/profile" className={styles.navItem}>
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path></svg>
            My Profile
          </Link>
        </nav>

        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button variant="ghost" size="small" onClick={() => { localStorage.removeItem('access_token'); router.push('/login'); }}>
            Log Out
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      <main className={styles.mainContent}>
        {/* Header */}
        <header className={styles.header + " animate-slide-up"}>
          <div className={styles.welcome}>
            <h1>Patient Dashboard</h1>
            <p>Welcome back, {userEmail?.split('@')[0] || 'Member'}</p>
          </div>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <input
              type="file"
              id="report-upload"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
              accept=".pdf,.jpg,.jpeg,.png"
            />
            <label htmlFor="report-upload">
              <Button as="span" variant="primary" isLoading={isUploading} size="large">
                <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" style={{ marginRight: '0.5rem' }}><path d="M12 4v16m8-8H4"></path></svg>
                {isUploading ? 'Uploading...' : 'Upload New Report'}
              </Button>
            </label>
          </div>
        </header>

        {/* Stats Grid */}
        <div className={styles.statsGrid + " animate-slide-up"} style={{ animationDelay: '0.1s' }}>
          <Card variant="glass" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>📄</div>
            <div className={styles.statInfo}>
              <h3>Total Reports</h3>
              <p>{reports.length}</p>
            </div>
          </Card>
          <Card variant="glass" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'var(--secondary-hue)', opacity: 0.1, color: 'var(--secondary)' }}></div>
            <div className={styles.statIcon} style={{ position: 'absolute', background: 'transparent', color: 'var(--secondary)' }}>🧪</div>
            <div className={styles.statInfo}>
              <h3>AI Indexed</h3>
              <p>{reports.filter(r => r.type === 'AI Indexed').length}</p>
            </div>
          </Card>
          <Card variant="glass" className={styles.statCard}>
            <div className={styles.statIcon} style={{ background: 'hsla(var(--accent-hue), 80%, 60%, 0.1)', color: 'var(--accent)' }}>⚡</div>
            <div className={styles.statInfo}>
              <h3>Consultations</h3>
              <p>12</p>
            </div>
          </Card>
        </div>

        {/* Section Title */}
        <div className={styles.sectionTitle + " animate-slide-up"} style={{ animationDelay: '0.2s' }}>
          <h2>Recent Medical Files</h2>
          <Button variant="ghost" size="small">View All</Button>
        </div>

        {reports.length === 0 ? (
          <Card variant="glass" padding="large" style={{ textAlign: 'center', marginTop: '2rem' }} className="animate-fade-in">
            <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>📂</div>
            <h2 style={{ marginBottom: '1rem' }}>Your clinical vault is empty</h2>
            <p style={{ color: 'var(--muted-foreground)', marginBottom: '2rem' }}>
              Upload your medical reports to begin AI-powered orchestration and insights.
            </p>
            <label htmlFor="report-upload" style={{ cursor: 'pointer' }}>
               <Button as="span" variant="primary">Add Your First Report</Button>
            </label>
          </Card>
        ) : (
          <div className={styles.reportsGrid}>
            {reports.map((report, index) => (
              <Card 
                key={report.id} 
                className={styles.reportCard + " animate-scale-in"} 
                hoverable 
                style={{ animationDelay: `${index * 0.1 + 0.3}s` }}
              >
                <div className={styles.reportHeader}>
                  <div className={styles.reportType}>
                    {report.type === 'Radiology' || report.type === 'Imaging' ? '🩻' : '📄'}
                  </div>
                  <span className={`${styles.statusBadge} ${report.status === 'completed' ? styles.statusCompleted : styles.statusPending}`}>
                    {report.status}
                  </span>
                </div>
                
                <div className={styles.reportTitle}>
                  <h3>{report.name}</h3>
                  <div className={styles.reportMeta}>
                    <span>{report.type}</span>
                    <span>•</span>
                    <span>{report.date}</span>
                  </div>
                </div>

                <div className={styles.reportFooter}>
                  <Button 
                    variant="primary" 
                    size="small" 
                    fullWidth
                    onClick={() => report.url ? window.open(report.url, '_blank') : alert('Report is still being processed.')}
                  >
                    View Report
                  </Button>
                  <Button 
                    variant="outline" 
                    size="small"
                    onClick={() => handleDelete(report)}
                  >
                    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Link href="/chat" className={styles.floatingChat} title="Launch AI Consultation">
        <svg width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
      </Link>
    </div>
  );
}
