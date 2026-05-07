export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://mediflow-backend.thankfulmeadow-e4b3805d.eastasia.azurecontainerapps.io';

export const getApiUrl = (path: string) => {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
