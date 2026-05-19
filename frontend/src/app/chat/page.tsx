"use client";

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { API_BASE_URL, analyzeInjury } from '@/lib/api';
import styles from './chat.module.css';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { PhotoUpload } from '@/components/chat/PhotoUpload';
import { VoiceInput } from '@/components/chat/VoiceInput';
import { CameraCapture } from '@/components/chat/CameraCapture';

interface Message {
  id: string;
  role: 'user' | 'ai';
  content: string;
  agentName?: string;
  imageUrl?: string;
}

export default function ChatPage() {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: 'ai',
      content: 'Hello! I am your Healthcare AI Assistant. How can I help you today?',
      agentName: 'Support Router'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [usePersonalAnalysis, setUsePersonalAnalysis] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      const token = localStorage.getItem('access_token');
      if (!token) {
        router.push('/login');
      }
    }
  }, [isMounted, router]);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const formatAgentName = (classification: string) => {
    if (!classification) return 'AI Assistant';
    return classification
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  const handleSpeak = (text: string) => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    window.speechSynthesis.speak(utterance);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!inputValue.trim() && !selectedImage) || isLoading) return;

    let imageUrl = '';
    if (selectedImage) {
      imageUrl = URL.createObjectURL(selectedImage);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(),
      imageUrl: imageUrl
    };

    const imageToProcess = selectedImage; // Store reference before clearing
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setSelectedImage(null);
    setIsLoading(true);

    try {
      const token = localStorage.getItem('access_token') || '';
      
      let finalQuery = userMsg.content;
      
      // If there's an image, analyze it first and prepend to query
      if (imageToProcess) {
        setIsLoading(true); // Ensure loading is shown during analysis
        const visionResult = await analyzeInjury(imageToProcess, token);
        finalQuery = `[IMAGE ANALYSIS CONTEXT]:\n${visionResult.analysis}\n\n[USER QUERY]:\n${userMsg.content || "Based on the image above, what can you tell me?"}`;
      }

      const res = await fetch(`${API_BASE_URL}/api/v1/chat/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          query: finalQuery,
          use_personal_analysis: usePersonalAnalysis
        }),
      });

      if (!res.ok) {
        let errorMessage = 'Failed to fetch response';
        try {
          const data = await res.json();
          errorMessage = data.detail || errorMessage;
        } catch (e) {
          const text = await res.text();
          errorMessage = text || `Server Error (${res.status})`;
        }
        throw new Error(errorMessage);
      }

      const data = await res.json();
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: data.response,
        agentName: formatAgentName(data.classification),
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (error: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'ai',
        content: error.message || 'Sorry, I encountered an error while processing your request.',
        agentName: 'System Error',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isMounted) return null;

  return (
    <div className={styles.chatWrapper}>
      <div className="mesh-bg" />
      
      {/* Chat Sidebar */}
      <aside className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)', marginBottom: '2rem' }}>
            Consultations
          </div>
          <Button variant="primary" fullWidth className={styles.newChatBtn} onClick={() => setMessages([{ id: 'init', role: 'ai', content: 'How can I assist you with your health data today?', agentName: 'Support Router' }])}>
            + New Consultation
          </Button>
        </div>
        
        <div className={styles.historyList}>
          {/* Recent consultations will appear here */}
        </div>

        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Button variant="ghost" size="small" onClick={() => router.push('/dashboard')}>
            Dashboard
          </Button>
          <ThemeToggle />
        </div>
      </aside>

      <main className={styles.mainChat}>
        <header className={styles.header}>
          <div className={styles.headerInfo}>
            <h2>AI Specialist Workspace</h2>
            <p>Clinical Intelligence Active</p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)' }}></div>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--secondary-hue)', opacity: 0.1 }}></div>
          </div>
        </header>
        
        <div className={styles.chatArea} ref={chatAreaRef}>
          {messages.map((msg, index) => (
            <div key={msg.id} className={`${styles.messageWrapper} ${styles[msg.role]} animate-slide-up`} style={{ animationDelay: `${index * 0.05}s` }}>
              <div className={`${styles.avatar} ${msg.role === 'user' ? styles.userAvatar : styles.aiAvatar}`}>
                {msg.role === 'user' ? '👤' : '🤖'}
              </div>
              <div className={styles.messageContent}>
                {msg.role === 'ai' && <span className={styles.agentName}>{msg.agentName}</span>}
                <div className={styles.bubble}>
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({node, ...props}) => <div style={{ overflowX: 'auto', margin: '1rem 0' }}><table style={{ borderCollapse: 'collapse', width: '100%', minWidth: '400px' }} {...props} /></div>,
                      th: ({node, ...props}) => <th style={{ borderBottom: '2px solid var(--border)', padding: '0.75rem', textAlign: 'left', fontWeight: 700, color: 'var(--primary)' }} {...props} />,
                      td: ({node, ...props}) => <td style={{ borderBottom: '1px solid var(--border)', padding: '0.75rem' }} {...props} />,
                      p: ({node, ...props}) => <p style={{ marginBottom: '0.5rem' }} {...props} />,
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                  {msg.imageUrl && (
                    <div className={styles.messageImageContainer}>
                      <img src={msg.imageUrl} alt="Uploaded attachment" className={styles.messageImage} />
                    </div>
                  )}
                  {msg.role === 'ai' && (
                    <button 
                      className={`${styles.speakBtn} ${isSpeaking ? styles.speaking : ''}`} 
                      onClick={() => handleSpeak(msg.content)}
                      title={isSpeaking ? "Stop reading" : "Read aloud"}
                    >
                      {isSpeaking ? (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="6" y="6" width="12" height="12"></rect>
                        </svg>
                      ) : (
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                          <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                          <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                        </svg>
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className={`${styles.messageWrapper} ${styles.ai} animate-fade-in`}>
              <div className={`${styles.avatar} ${styles.aiAvatar}`}>🧠</div>
              <div className={styles.messageContent}>
                <span className={styles.agentName}>Processing Data</span>
                <div className={`${styles.bubble} ${styles.loadingIndicator}`}>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                  <div className={styles.dot}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.inputArea}>
          <div className={styles.inputContainer}>
            <PhotoUpload onImageSelect={setSelectedImage} selectedImage={selectedImage} />
            <button 
              className={styles.cameraBtn} 
              onClick={() => setShowCamera(true)}
              title="Take Photo"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                <circle cx="12" cy="13" r="4"></circle>
              </svg>
            </button>
            <VoiceInput 
              onTranscript={(text) => setInputValue(prev => prev + (prev ? ' ' : '') + text)} 
              onRecordingStateChange={setIsRecording}
              isLoading={isLoading} 
            />
            <div style={{ position: 'relative', flex: 1 }}>
              {isRecording && (
                <div className={styles.recordingOverlay}>
                  <div className={styles.waveContainer}>
                    <div className={styles.wave}></div>
                    <div className={styles.wave}></div>
                    <div className={styles.wave}></div>
                    <div className={styles.wave}></div>
                  </div>
                  <span>Listening...</span>
                </div>
              )}
              <input 
                className={`${styles.inputBox} ${isRecording ? styles.inputRecording : ''}`}
              placeholder={isRecording ? "" : "Ask your medical query..."}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit(e as any)}
              disabled={isLoading || isRecording}
            />
              <button className={styles.sendBtn} onClick={handleSubmit} disabled={(!inputValue.trim() && !selectedImage) || isLoading || isRecording}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
              </button>
            </div>
          </div>
          
          <div className={styles.toggleBar}>
            <label className={styles.toggleItem}>
              <input 
                type="checkbox" 
                checked={usePersonalAnalysis} 
                onChange={() => setUsePersonalAnalysis(!usePersonalAnalysis)} 
                style={{ width: '18px', height: '18px' }}
              />
              Analyze My Reports
            </label>
            <span className={styles.toggleItem} style={{ opacity: 0.5 }}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
              Encrypted
            </span>
          </div>
        </div>

        {showCamera && (
          <CameraCapture 
            onCapture={(file) => setSelectedImage(file)} 
            onClose={() => setShowCamera(false)} 
          />
        )}
      </main>
    </div>
  );
}
