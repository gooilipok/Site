import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthTokens, UserRole } from '../types';
import { apiFetch } from '../utils/api';

export interface AuthRegisterResult {
  success: boolean;
  error?: string;
  autoLoggedIn?: boolean;
  requireVerification?: boolean;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  registerStep1: (payload: {
    email: string;
    username: string;
    password: string;
    terms_accepted: boolean;
    privacy_accepted: boolean;
    consent_accepted: boolean;
  }) => Promise<AuthRegisterResult>;
  verifyEmailCode: (email: string, code: string, extraData?: { username?: string; password?: string }) => Promise<{ success: boolean; error?: string }>;
  resendVerificationCode: (email: string, username?: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  updateProfile: (username?: string, newPassword?: string, telegramHandle?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'bausquad_auth_tokens';
const USER_KEY = 'bausquad_user_data';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [tokens, setTokens] = useState<AuthTokens | null>(() => {
    try {
      const saved = localStorage.getItem(TOKEN_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      localStorage.removeItem(TOKEN_KEY);
      return null;
    }
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load current user profile from server on startup
  useEffect(() => {
    const initAuth = async () => {
      if (tokens?.access_token) {
        try {
          const resp = await apiFetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${tokens.access_token}` }
          });
          if (resp.ok) {
            const data = await resp.json();
            setUser(data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(data.user));
          } else {
            // Token expired or invalid
            logout();
          }
        } catch {
          // Fallback to local state if server offline
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const saveAuthSession = (u: User, t: AuthTokens) => {
    setUser(u);
    setTokens(t);
    localStorage.setItem(USER_KEY, JSON.stringify(u));
    localStorage.setItem(TOKEN_KEY, JSON.stringify(t));
  };

  const login = async (identifier: string, pass: string) => {
    try {
      const resp = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login_identifier: identifier, password: pass })
      });

      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Ошибка входа' };
      }

      saveAuthSession(data.user, data.tokens);
      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка соединения с сервером' };
    }
  };

  const registerStep1 = async (payload: {
    email: string;
    username: string;
    password: string;
    terms_accepted: boolean;
    privacy_accepted: boolean;
    consent_accepted: boolean;
  }) => {
    try {
      const resp = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Ошибка регистрации' };
      }

      // If backend instantly created session (e.g. bypass mode or pre-verified)
      if (data.user && data.tokens) {
        saveAuthSession(data.user, data.tokens);
        return { success: true, autoLoggedIn: true, message: data.message };
      }

      return {
        success: true,
        autoLoggedIn: false,
        requireVerification: true,
        message: data.message || 'Код подтверждения отправлен на вашу почту'
      };
    } catch {
      return { success: false, error: 'Ошибка соединения с сервером' };
    }
  };

  const resendVerificationCode = async (email: string, username?: string) => {
    try {
      const resp = await apiFetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, username })
      });

      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Не удалось повторно отправить код' };
      }

      return { success: true, message: data.message || 'Новый проверочный код успешно отправлен' };
    } catch {
      return { success: false, error: 'Ошибка соединения с сервером' };
    }
  };

  const verifyEmailCode = async (
    email: string,
    code: string,
    extraData?: { username?: string; password?: string }
  ) => {
    try {
      const resp = await apiFetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          code,
          username: extraData?.username,
          password: extraData?.password
        })
      });

      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Неверный код подтверждения' };
      }

      if (data.user && data.tokens) {
        saveAuthSession(data.user, data.tokens);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка соединения с сервером' };
    }
  };

  const updateProfile = async (username?: string, newPassword?: string, telegramHandle?: string) => {
    if (!tokens?.access_token) return { success: false, error: 'Не авторизован' };

    try {
      const resp = await apiFetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${tokens.access_token}`
        },
        body: JSON.stringify({ username, new_password: newPassword, telegram_handle: telegramHandle })
      });

      const data = await resp.json();
      if (!resp.ok) {
        return { success: false, error: data.error || 'Ошибка обновления профиля' };
      }

      setUser(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return { success: true };
    } catch {
      return { success: false, error: 'Ошибка соединения' };
    }
  };

  const logout = () => {
    setUser(null);
    setTokens(null);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        tokens,
        isAuthenticated: !!user,
        isLoading,
        login,
        registerStep1,
        verifyEmailCode,
        resendVerificationCode,
        updateProfile,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
