// Client imports
import { ENV } from '../config/env';

// Base URL
const BASE_URL = ENV.API_URL;

// Storage keys
const TOKEN_KEY = 'setu_access_token';
const REFRESH_KEY = 'setu_refresh_token';

// Read access
export function getAccessToken() {
  return localStorage.getItem(TOKEN_KEY);
}

// Read refresh
export function getRefreshToken() {
  return localStorage.getItem(REFRESH_KEY);
}

// Save tokens
export function setTokens({ access_token, refresh_token }) {
  if (access_token) localStorage.setItem(TOKEN_KEY, access_token);
  if (refresh_token) localStorage.setItem(REFRESH_KEY, refresh_token);
}

// Clear tokens
export function clearTokens() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

// Auth aliases
export const setAuthToken = (token) => setTokens({ access_token: token });
export const clearAuthToken = clearTokens;
export const getAuthToken = getAccessToken;

// Custom error
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Refresh state
let refreshInFlight = null;

// Refresh token
async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new ApiError('No refresh token available', 401);

  if (!refreshInFlight) {
    refreshInFlight = fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
      .then(async (res) => {
        if (!res.ok) throw new ApiError('Session expired', res.status);
        const data = await res.json();
        setTokens(data);
        return data;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

// API request
export async function apiRequest(path, options = {}) {
  const { json, auth = true, isFormData = false, headers = {}, ...rest } = options;

  // Execute fetch
  const doFetch = async () => {
    const finalHeaders = { ...headers };
    if (json !== undefined) finalHeaders['Content-Type'] = 'application/json';
    if (auth) {
      const token = getAccessToken();
      if (token) finalHeaders['Authorization'] = `Bearer ${token}`;
    }

    return fetch(`${BASE_URL}${path}`, {
      ...rest,
      headers: finalHeaders,
      body: isFormData ? rest.body : json !== undefined ? JSON.stringify(json) : rest.body,
    });
  };

  let response = await doFetch();

  // Retry auth
  if (response.status === 401 && auth && getRefreshToken() && !getRefreshToken().startsWith('demo-')) {
    try {
      await refreshAccessToken();
      response = await doFetch();
    } catch {
      clearTokens();
      window.dispatchEvent(new CustomEvent('setu:session-expired'));
      throw new ApiError('Session expired, please sign in again', 401);
    }
  }

  // Parse JSON
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  }

  // Handle failure
  if (!response.ok) {
    let message = data?.detail || data?.message || `Request failed (${response.status})`;
    if (typeof message !== 'string') {
      if (Array.isArray(message)) {
        message = message.map(m => {
          const locStr = Array.isArray(m.loc) ? m.loc.slice(1).join('.') : '';
          return `${locStr ? locStr + ': ' : ''}${m.msg}`;
        }).join(', ');
      } else if (typeof message === 'object') {
        message = Object.entries(message)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(', ') : val}`)
          .join(', ');
      } else {
        message = JSON.stringify(message);
      }
    }
    throw new ApiError(message, response.status, data);
  }

  return data;
}

// Client alias
export const apiClient = apiRequest;

// Helper methods
export const api = {
  get: (path, options) => apiRequest(path, { ...options, method: 'GET' }),
  post: (path, json, options) => apiRequest(path, { ...options, method: 'POST', json }),
  put: (path, json, options) => apiRequest(path, { ...options, method: 'PUT', json }),
  delete: (path, options) => apiRequest(path, { ...options, method: 'DELETE' }),
  postForm: (path, formData, options) =>
    apiRequest(path, { ...options, method: 'POST', isFormData: true, body: formData }),
};

// URL export
export { BASE_URL };
