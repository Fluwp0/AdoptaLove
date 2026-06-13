import { getToken } from './authSession';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export async function apiClient(path, options = {}) {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const response = await fetch(`${API_URL}${path}`, {
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers
    },
    ...options
  });

  return response;
}
