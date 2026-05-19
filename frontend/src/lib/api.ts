export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const getApiUrl = (path: string) => {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

export async function fetchWithTimeout(resource: string, options: RequestInit & { timeout?: number } = {}) {
  const { timeout = 10000 } = options; // Default 10s timeout
  
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error: any) {
    clearTimeout(id);
    if (error.name === 'AbortError') {
      throw new Error('Request timed out. Please check if the backend is running and accessible.');
    }
    throw error;
  }
}

export async function analyzeInjury(file: File, token: string) {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithTimeout(getApiUrl('/api/v1/vision/analyze-injury'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to analyze image');
  }

  return response.json();
}

export async function transcribeAudio(audioBlob: Blob, token: string) {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');

  const response = await fetchWithTimeout(getApiUrl('/api/v1/speech/transcribe'), {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail || 'Failed to transcribe audio');
  }

  return response.json();
}
