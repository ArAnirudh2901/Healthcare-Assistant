export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mediflow-backend.thankfulmeadow-e4b3805d.eastasia.azurecontainerapps.io';

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
