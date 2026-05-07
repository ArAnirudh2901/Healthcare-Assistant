"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { API_BASE_URL } from '@/lib/api';
import styles from './analysis.module.css';

interface LabParameter {
  test_name: string;
  value: number;
  unit: string;
  status: 'NORMAL' | 'HIGH' | 'LOW';
  category: string;
}

interface AnalysisData {
  summary: string;
  stats: {
    total_tests: number;
    high_values: number;
    low_values: number;
    normal_values: number;
  };
  aggregated_data: LabParameter[];
}

const COLORS = ['#10b981', '#ef4444', '#f59e0b']; // Normal, High, Low

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export default function AnalysisPage() {
  const [data, setData] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${API_BASE_URL}/api/v1/documents/analytical-report`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!res.ok) {
          throw new Error('Failed to fetch analysis');
        }
        
        const result = await res.json();
        if (result.status === 'empty') {
          setError(result.summary);
        } else {
          setData(result);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p>Analyzing your medical history...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.errorContainer}>
        <h2>Analysis Unavailable</h2>
        <p>{error || "No data available."}</p>
        <Link href="/dashboard" className="text-blue-600 mt-4 block">Return to Dashboard</Link>
      </div>
    );
  }

  // Prepare data for charts
  const pieData = [
    { name: 'Normal', value: data.stats.normal_values },
    { name: 'High', value: data.stats.high_values },
    { name: 'Low', value: data.stats.low_values },
  ].filter(item => item.value > 0);

  // Group by category for bar chart
  const categories: Record<string, number> = {};
  data.aggregated_data.forEach(item => {
    categories[item.category] = (categories[item.category] || 0) + 1;
  });
  const barData = Object.keys(categories).map(cat => ({
    name: cat,
    count: categories[cat]
  }));

  return (
    <div className={styles.analysisContainer}>
      <header className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </Link>
        <div className="font-bold text-blue-600">MediHealth AI</div>
      </header>

      <main className={styles.mainContent}>
        <h1 className={styles.pageTitle}>Comprehensive Health Analysis</h1>
        
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <span className={styles.statLabel}>Total Tests</span>
            <span className={styles.statValue}>{data.stats.total_tests}</span>
          </div>
          <div className={styles.statCard} style={{ borderLeft: '4px solid #10b981' }}>
            <span className={styles.statLabel}>Normal</span>
            <span className={styles.statValue}>{data.stats.normal_values}</span>
          </div>
          <div className={styles.statCard} style={{ borderLeft: '4px solid #ef4444' }}>
            <span className={styles.statLabel}>High</span>
            <span className={styles.statValue}>{data.stats.high_values}</span>
          </div>
          <div className={styles.statCard} style={{ borderLeft: '4px solid #f59e0b' }}>
            <span className={styles.statLabel}>Low</span>
            <span className={styles.statValue}>{data.stats.low_values}</span>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <h2>Test Distribution by Category</h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <h2>Health Status Overview</h2>
            <div style={{ width: '100%', height: 300 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={styles.summaryCard}>
          <h2>Executive Medical Summary</h2>
          <div className={styles.summaryContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {data.summary}
            </ReactMarkdown>
          </div>
        </div>
      </main>
    </div>
  );
}
