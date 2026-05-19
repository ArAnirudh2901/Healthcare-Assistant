'use client';

import React, { useState, useRef } from 'react';
import { transcribeAudio } from '@/lib/api';
import styles from './VoiceInput.module.css';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
  isLoading: boolean;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({ 
  onTranscript, 
  onRecordingStateChange,
  isLoading: parentLoading 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') 
        ? 'audio/webm' 
        : 'audio/ogg';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        await handleTranscription(audioBlob);
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      if (onRecordingStateChange) onRecordingStateChange(true);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      alert('Could not access microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (onRecordingStateChange) onRecordingStateChange(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    if (blob.size < 100) {
      console.warn('Audio blob too small, likely no sound captured.');
      return;
    }
    
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || '';
      const result = await transcribeAudio(blob, token);
      if (result.transcript) {
        onTranscript(result.transcript);
      }
    } catch (err) {
      console.error('Transcription failed:', err);
      alert('Transcription failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.voiceContainer}>
      <button
        type="button"
        onMouseDown={startRecording}
        onMouseUp={stopRecording}
        onMouseLeave={stopRecording} // Stop if mouse leaves button
        onTouchStart={startRecording}
        onTouchEnd={stopRecording}
        className={`${styles.micBtn} ${isRecording ? styles.recording : ''} ${loading || parentLoading ? styles.disabled : ''}`}
        disabled={loading || parentLoading}
        title="Hold to speak"
      >
        {loading ? (
          <div className={styles.spinner}></div>
        ) : isRecording ? (
          <div className={styles.pulse}></div>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
            <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        )}
      </button>
    </div>
  );
};
