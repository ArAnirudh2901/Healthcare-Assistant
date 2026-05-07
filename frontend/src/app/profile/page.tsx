"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { API_BASE_URL } from '@/lib/api';
import styles from './profile.module.css';

interface UserProfile {
  full_name: string;
  email: string;
  mobile?: string;
  blood_group?: string;
  dob?: string;
  gender?: string;
  height?: string;
  weight?: string;
  emergency_contact?: string;
  allergies?: string;
}

export default function Profile() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [editForm, setEditForm] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          router.push('/login');
          return;
        }

        const res = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Failed to fetch user');
        }

        const data = await res.json();
        const userData = {
          full_name: data.full_name || 'Medical Patient',
          email: data.email,
          mobile: data.mobile || '+1 (555) 012-3456',
          blood_group: data.blood_group || 'O Positive',
          dob: data.dob || '1990-01-01',
          gender: data.gender || 'Male',
          height: data.height || "5'11\"",
          weight: data.weight || '75 kg',
          emergency_contact: data.emergency_contact || '+1 (555) 999-8888',
          allergies: data.allergies || 'None reported'
        };
        setUser(userData);
        setEditForm(userData);
      } catch (error) {
        console.error(error);
        localStorage.removeItem('access_token');
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    router.push('/login');
  };

  const handleSave = async () => {
    if (!editForm) return;
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setUser(editForm);
      setIsEditing(false);
      setIsSaving(false);
      alert('Medical Profile updated successfully!');
    }, 1000);
  };

  const handleCancel = () => {
    setEditForm(user);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className={styles.profileContainer}>
        <div className="glass-panel animate-pulse" style={{ height: '400px' }}></div>
      </div>
    );
  }

  return (
    <div className={styles.profileContainer}>
      <div className="mesh-bg" />
      <header className={styles.header + " animate-slide-up"}>
        <Button variant="ghost" size="small" onClick={() => router.push('/dashboard')}>
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          Dashboard
        </Button>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>Medical Identity</h1>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <ThemeToggle />
          {!isEditing && (
            <Button variant="primary" size="small" onClick={() => setIsEditing(true)}>
              Edit Profile
            </Button>
          )}
        </div>
      </header>
      
      <div className={`glass-panel animate-scale-in ${styles.profileCard}`}>
        <div className={styles.photoSection}>
          <div className={styles.profilePhoto}>
            👤
          </div>
        </div>
        
        <div className={styles.userInfo}>
          {isEditing ? (
            <div style={{ maxWidth: '400px', margin: '0 auto 2.5rem' }}>
              <Input 
                label="Full Name" 
                value={editForm?.full_name} 
                onChange={(e) => setEditForm(prev => prev ? {...prev, full_name: e.target.value} : null)}
              />
            </div>
          ) : (
            <>
              <h2>{user?.full_name}</h2>
              <span className={styles.emailBadge}>{user?.email}</span>
            </>
          )}
        </div>
        
        {/* Personal Information Section */}
        <div className={styles.sectionTitle}>
          <h3>Personal Information</h3>
        </div>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Email Address</span>
            <span className={styles.detailValue} style={{ opacity: 0.7 }}>{user?.email}</span>
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Date of Birth</span>
            {isEditing ? (
              <Input label="" type="date" value={editForm?.dob} onChange={(e) => setEditForm(prev => prev ? {...prev, dob: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.dob}</span>
            )}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Gender</span>
            {isEditing ? (
              <Input label="" value={editForm?.gender} onChange={(e) => setEditForm(prev => prev ? {...prev, gender: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.gender}</span>
            )}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Mobile Number</span>
            {isEditing ? (
              <Input label="" value={editForm?.mobile} onChange={(e) => setEditForm(prev => prev ? {...prev, mobile: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.mobile}</span>
            )}
          </div>
        </div>

        {/* Clinical Metrics Section */}
        <div className={styles.sectionTitle} style={{ marginTop: '2.5rem' }}>
          <h3>Clinical Metrics</h3>
        </div>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Blood Group</span>
            {isEditing ? (
              <Input label="" value={editForm?.blood_group} onChange={(e) => setEditForm(prev => prev ? {...prev, blood_group: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.blood_group}</span>
            )}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Height</span>
            {isEditing ? (
              <Input label="" value={editForm?.height} onChange={(e) => setEditForm(prev => prev ? {...prev, height: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.height}</span>
            )}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Weight</span>
            {isEditing ? (
              <Input label="" value={editForm?.weight} onChange={(e) => setEditForm(prev => prev ? {...prev, weight: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.weight}</span>
            )}
          </div>

          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Allergies</span>
            {isEditing ? (
              <Input label="" value={editForm?.allergies} onChange={(e) => setEditForm(prev => prev ? {...prev, allergies: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.allergies}</span>
            )}
          </div>
        </div>

        {/* Emergency Section */}
        <div className={styles.sectionTitle} style={{ marginTop: '2.5rem' }}>
          <h3>Emergency Contact</h3>
        </div>
        <div className={styles.detailsGrid}>
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Primary Contact</span>
            {isEditing ? (
              <Input label="" value={editForm?.emergency_contact} onChange={(e) => setEditForm(prev => prev ? {...prev, emergency_contact: e.target.value} : null)} style={{ marginBottom: 0 }} />
            ) : (
              <span className={styles.detailValue}>{user?.emergency_contact}</span>
            )}
          </div>
        </div>
        
        <div className={styles.actions} style={{ marginTop: '3rem' }}>
          {isEditing ? (
            <div style={{ display: 'flex', gap: '1rem', width: '100%' }}>
              <Button variant="primary" fullWidth onClick={handleSave} isLoading={isSaving}>
                Save Clinical Data
              </Button>
              <Button variant="outline" fullWidth onClick={handleCancel}>
                Cancel
              </Button>
            </div>
          ) : (
            <Button variant="outline" fullWidth onClick={handleLogout} style={{ border: '1px solid var(--error)', color: 'var(--error)' }}>
              Sign Out from MediHealth
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
