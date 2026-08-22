import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import axiosClient, { TOKEN_KEY, USER_KEY } from '../api/axiosClient.js';
import { User, Role, BloodGroup, AuthResponse } from '../types/index.js';

interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  role?: Role;
  phone?: string;
  blood_group?: BloodGroup;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(USER_KEY);
    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate token with backend /api/auth/me on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        try {
          const res = await axiosClient.get<{ success: boolean; user: User }>('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          }
        } catch {
          // Token is invalid/expired
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          setUser(null);
          setToken(null);
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const res = await axiosClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const res = await axiosClient.post<AuthResponse>('/auth/register', payload);

    const { token: receivedToken, user: receivedUser } = res.data;

    localStorage.setItem(TOKEN_KEY, receivedToken);
    localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));

    setToken(receivedToken);
    setUser(receivedUser);

    return receivedUser;
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    try {
      const res = await axiosClient.get<{ success: boolean; user: User }>('/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.error('Failed to refresh profile:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
