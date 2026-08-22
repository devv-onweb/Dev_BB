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

const DEMO_USERS: Record<string, { user: User; pass: string }> = {
  'admin@bloodbank.org': {
    pass: 'AdminPassword123!',
    user: {
      id: 'admin-rajesh-01',
      name: 'Dr. Rajesh Sharma (Medical Director)',
      email: 'admin@bloodbank.org',
      role: 'ADMIN',
      phone: '+91-98200-11223',
      blood_group: 'O_POS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'donor.aarav@example.com': {
    pass: 'DonorPassword123!',
    user: {
      id: 'donor-aarav-01',
      name: 'Aarav Patel',
      email: 'donor.aarav@example.com',
      role: 'DONOR',
      phone: '+91-98765-43210',
      blood_group: 'O_POS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'donor.pooja@example.com': {
    pass: 'DonorPassword123!',
    user: {
      id: 'donor-pooja-02',
      name: 'Pooja Sharma',
      email: 'donor.pooja@example.com',
      role: 'DONOR',
      phone: '+91-98111-22334',
      blood_group: 'A_POS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'patient.amit@example.com': {
    pass: 'PatientPassword123!',
    user: {
      id: 'patient-amit-01',
      name: 'Amit Verma',
      email: 'patient.amit@example.com',
      role: 'PATIENT',
      phone: '+91-97555-66778',
      blood_group: 'O_NEG',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'patient.kavita@example.com': {
    pass: 'PatientPassword123!',
    user: {
      id: 'patient-kavita-02',
      name: 'Kavita Rao',
      email: 'patient.kavita@example.com',
      role: 'PATIENT',
      phone: '+91-98666-77889',
      blood_group: 'A_NEG',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
  'patient.suresh@example.com': {
    pass: 'PatientPassword123!',
    user: {
      id: 'patient-suresh-03',
      name: 'Suresh Iyer',
      email: 'patient.suresh@example.com',
      role: 'PATIENT',
      phone: '+91-99777-88990',
      blood_group: 'B_POS',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  },
};

const LOCAL_USERS_KEY = 'bloodbank_local_registered_users';

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
        // If it's a demo/offline token, preserve user session
        if (storedToken.startsWith('demo-token-')) {
          setIsLoading(false);
          return;
        }

        try {
          const res = await axiosClient.get<{ success: boolean; user: User }>('/auth/me');
          if (res.data.success) {
            setUser(res.data.user);
            localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
          }
        } catch {
          // If backend is unreachable but we have a saved user, keep offline session
          const savedUser = localStorage.getItem(USER_KEY);
          if (!savedUser) {
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);
            setUser(null);
            setToken(null);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    const normalizedEmail = email.toLowerCase().trim();

    try {
      // 1. Try Backend API first
      const res = await axiosClient.post<AuthResponse>('/auth/login', {
        email: normalizedEmail,
        password,
      });

      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return receivedUser;
    } catch (apiError: any) {
      // If backend responded with 401/400 (Explicit authentication failure), check if it's a known demo user
      const isNetworkOr404 =
        !apiError.response ||
        apiError.response.status === 404 ||
        apiError.response.status === 502 ||
        apiError.response.status === 500 ||
        apiError.response.status === 401;

      if (isNetworkOr404) {
        // Check Built-in Demo Accounts
        const demo = DEMO_USERS[normalizedEmail];
        if (demo) {
          if (demo.pass === password || password === 'AdminPassword123!' || password === 'DonorPassword123!' || password === 'PatientPassword123!') {
            const demoToken = `demo-token-${demo.user.id}-${Date.now()}`;
            localStorage.setItem(TOKEN_KEY, demoToken);
            localStorage.setItem(USER_KEY, JSON.stringify(demo.user));
            setToken(demoToken);
            setUser(demo.user);
            return demo.user;
          }
        }

        // Check LocalStorage registered accounts
        try {
          const localUsersRaw = localStorage.getItem(LOCAL_USERS_KEY);
          if (localUsersRaw) {
            const localUsers: Array<{ user: User; pass: string }> = JSON.parse(localUsersRaw);
            const found = localUsers.find((u) => u.user.email.toLowerCase() === normalizedEmail);
            if (found && found.pass === password) {
              const localToken = `demo-token-${found.user.id}-${Date.now()}`;
              localStorage.setItem(TOKEN_KEY, localToken);
              localStorage.setItem(USER_KEY, JSON.stringify(found.user));
              setToken(localToken);
              setUser(found.user);
              return found.user;
            }
          }
        } catch (e) {
          console.warn('Error reading local users:', e);
        }
      }

      // If neither backend nor local matched, throw error
      throw apiError;
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const normalizedEmail = payload.email.toLowerCase().trim();

    try {
      // 1. Try Backend API first
      const res = await axiosClient.post<AuthResponse>('/auth/register', {
        ...payload,
        email: normalizedEmail,
      });

      const { token: receivedToken, user: receivedUser } = res.data;

      localStorage.setItem(TOKEN_KEY, receivedToken);
      localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));

      setToken(receivedToken);
      setUser(receivedUser);

      return receivedUser;
    } catch (apiError: any) {
      // Fallback for Vercel demo or offline mode
      const isNetworkOr404 =
        !apiError.response ||
        apiError.response.status === 404 ||
        apiError.response.status === 502 ||
        apiError.response.status === 500;

      if (isNetworkOr404) {
        const newUser: User = {
          id: 'user-' + Date.now(),
          name: payload.name.trim(),
          email: normalizedEmail,
          role: payload.role || 'PATIENT',
          phone: payload.phone?.trim() || null,
          blood_group: payload.blood_group || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        const demoToken = `demo-token-${newUser.id}-${Date.now()}`;

        // Save to local registered users list
        try {
          const localUsersRaw = localStorage.getItem(LOCAL_USERS_KEY);
          const localUsers = localUsersRaw ? JSON.parse(localUsersRaw) : [];
          localUsers.push({ user: newUser, pass: payload.password });
          localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(localUsers));
        } catch (e) {
          console.warn('Error saving local user:', e);
        }

        localStorage.setItem(TOKEN_KEY, demoToken);
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));

        setToken(demoToken);
        setUser(newUser);

        return newUser;
      }

      throw apiError;
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const refreshProfile = async () => {
    const storedToken = localStorage.getItem(TOKEN_KEY);
    if (storedToken?.startsWith('demo-token-')) return;

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
        isAuthenticated: !!user && !!token,
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
