'use client';

import InjuryAnalyzer from '@/components/vision/InjuryAnalyzer';
import Link from 'next/link';
import styles from './injury.module.css';

export default function InjuryAnalysisPage() {
  return (
    <div className={styles.pageWrapper}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </Link>
        <div className={styles.logo}>MediHealth AI</div>
      </header>

      <main className={styles.main}>
        <InjuryAnalyzer />
      </main>
    </div>
  );
}
