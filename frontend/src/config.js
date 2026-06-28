// Determine the API base URL dynamically based on environment / hostname
const getApiBaseUrl = () => {
  // Respect Vite environment variable if provided
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  const hostname = window.location.hostname;
  
  // If running locally in development
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '0.0.0.0' || hostname.startsWith('192.168.')) {
    return 'http://127.0.0.1:8001';
  }
  
  // In production/deployment on Vercel, requests are routed through Vercel's backend service path
  return '/_/backend';
};

export const API_BASE_URL = getApiBaseUrl();
