import React, { createContext, useContext, useState, useEffect } from 'react';
import * as authApi from './api/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => authApi.getStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  // Fast & non-blocking auth session hydration on initial load
  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const token = authApi.getStoredToken();
      const storedUser = authApi.getStoredUser();

      if (storedUser && isMounted) {
        setCurrentUser(storedUser);
      }

      if (token && !token.startsWith('demo-')) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Auth hydration timeout')), 1000)
          );

          const profile = await Promise.race([authApi.getMe(), timeoutPromise]);
          if (isMounted && profile) {
            setCurrentUser(profile);
            authApi.setStoredUser(profile);
          }
        } catch (_err) {
          if (storedUser && isMounted) {
            setCurrentUser(storedUser);
          }
        }
      }

      if (isMounted) {
        setIsLoading(false);
      }
    }

    initAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  // Login handler
  const login = async (credentials) => {
    const data = await authApi.loginUser(credentials);
    if (data.user) {
      setCurrentUser(data.user);
      authApi.setStoredUser(data.user);
    }
    return data;
  };

  // Register handler
  const register = async (userData) => {
    const data = await authApi.registerUser(userData);
    if (data.user) {
      setCurrentUser(data.user);
      authApi.setStoredUser(data.user);
    }
    return data;
  };

  // Logout handler
  const logout = () => {
    authApi.logoutUser();
    setCurrentUser(null);
  };

  // Direct session login (used by RFID tap, hardware kiosks, and token sessions)
  const loginWithSession = (tokens, user) => {
    if (tokens) {
      authApi.setTokens(tokens);
    }
    if (user) {
      setCurrentUser(user);
      authApi.setStoredUser(user);
    }
  };

  // Session-only local profile update
  const patchLocalProfile = (patch) => {
    setCurrentUser((prev) => {
      const updated = prev ? { ...prev, ...patch } : patch;
      authApi.setStoredUser(updated);
      return updated;
    });
  };

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
    loginWithSession,
    patchLocalProfile,
    isAuthenticated: !!currentUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
