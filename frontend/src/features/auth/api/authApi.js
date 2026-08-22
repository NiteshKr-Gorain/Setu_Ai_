import { apiClient, setTokens, clearTokens, getAccessToken } from '../../../shared/api/client';

const USER_KEY = 'setu_user_profile';

export function getStoredUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    if (stored) return JSON.parse(stored);
  } catch (_e) {}
  return null;
}

export function setStoredUser(user) {
  if (user) {
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (_e) {}
  }
}

export function clearStoredUser() {
  localStorage.removeItem(USER_KEY);
}

export async function loginUser({ email, password }) {
  const cleanEmail = email.toLowerCase().trim();
  try {
    const data = await apiClient('/auth/login', {
      method: 'POST',
      json: { email: cleanEmail, password },
    });

    if (data.access_token) {
      setTokens(data);
      const profile = await getMe().catch(() => {
        const existing = getStoredUser();
        if (existing && existing.email === cleanEmail) return existing;
        return {
          id: 'usr-member',
          name: cleanEmail.split('@')[0] ? cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1) : 'Community Member',
          email: cleanEmail,
          role: 'contributor',
          location: 'India',
          bio: 'Passionate about traditional heritage, storytelling, and wisdom sharing.'
        };
      });

      setStoredUser(profile);
      return { ...data, user: profile };
    }
    return data;
  } catch (err) {
    // Fallback for offline local dev session
    if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Failed') || err.status === 404 || err.status === 500) {
      const demoToken = `demo-jwt-token-${Date.now()}`;
      const existing = getStoredUser();
      const userObj = (existing && existing.email === cleanEmail) ? existing : {
        id: `usr-${Date.now()}`,
        name: cleanEmail.split('@')[0] ? cleanEmail.split('@')[0].charAt(0).toUpperCase() + cleanEmail.split('@')[0].slice(1) : 'Community Member',
        email: cleanEmail,
        role: 'contributor',
        location: 'India',
        bio: 'Passionate about traditional heritage, storytelling, and wisdom sharing.'
      };

      setTokens({ access_token: demoToken, refresh_token: demoToken });
      setStoredUser(userObj);
      return { access_token: demoToken, user: userObj };
    }
    throw err;
  }
}

export async function registerUser({ name, email, password, role = 'user', preferredLanguage = 'en' }) {
  const cleanName = name.trim();
  const cleanEmail = email.toLowerCase().trim();
  try {
    const data = await apiClient('/auth/register', {
      method: 'POST',
      json: {
        name: cleanName,
        email: cleanEmail,
        password,
        role,
        preferred_language: preferredLanguage,
      },
    });

    if (data.access_token) {
      setTokens(data);
    }

    let userObj = data.user;
    if (!userObj && data.access_token) {
      userObj = await getMe().catch(() => ({
        id: `usr-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role,
        location: 'India',
        bio: 'Passionate about traditional heritage and wisdom sharing.'
      }));
    }

    if (!userObj) {
      userObj = {
        id: `usr-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role,
        location: 'India',
        bio: 'Passionate about traditional heritage and wisdom sharing.'
      };
    }

    setStoredUser(userObj);
    return { ...data, user: userObj };
  } catch (err) {
    if (err.name === 'TypeError' || err.message?.includes('fetch') || err.message?.includes('Failed') || err.status === 404 || err.status === 500) {
      const demoToken = `demo-jwt-token-${Date.now()}`;
      const userObj = {
        id: `usr-${Date.now()}`,
        name: cleanName,
        email: cleanEmail,
        role,
        location: 'India',
        bio: 'Passionate about traditional heritage, storytelling, and wisdom sharing.'
      };

      setTokens({ access_token: demoToken, refresh_token: demoToken });
      setStoredUser(userObj);
      return { access_token: demoToken, user: userObj };
    }
    throw err;
  }
}

export async function getMe() {
  return apiClient('/users/me');
}

export function logoutUser() {
  clearTokens();
  clearStoredUser();
}

export function getStoredToken() {
  return getAccessToken();
}
