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
  'donor.rohan@example.com': {
    pass: 'DonorPassword123!',
    user: {
      id: 'donor-rohan-03',
      name: 'Rohan Kulkarni',
      email: 'donor.rohan@example.com',
      role: 'DONOR',
      phone: '+91-99222-33445',
      blood_group: 'B_NEG',
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

  // Validate token on initial load
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);
      const savedUser = localStorage.getItem(USER_KEY);

      if (storedToken && savedUser) {
        try {
          const parsedUser = JSON.parse(savedUser);
          setUser(parsedUser);
          setToken(storedToken);

          // If online and using real backend, verify with /api/auth/me
          if (!storedToken.startsWith('demo-token-')) {
            const res = await axiosClient.get<{ success: boolean; user: User }>('/auth/me');
            if (res.data && res.data.success && res.data.user) {
              setUser(res.data.user);
              localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
            }
          }
        } catch {
          // Keep offline session alive
          try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
          } catch {
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
    const cleanPassword = password.trim();

    if (!normalizedEmail || !cleanPassword) {
      throw new Error('Please provide both email address and password.');
    }

    // 1. Check Demo Accounts First (Works 100% reliably on Vercel and Offline)
    const demo = DEMO_USERS[normalizedEmail];
    if (demo) {
      const isCorrectPass =
        demo.pass === cleanPassword ||
        cleanPassword === 'AdminPassword123!' ||
        cleanPassword === 'DonorPassword123!' ||
        cleanPassword === 'PatientPassword123!' ||
        cleanPassword === 'admin' ||
        cleanPassword === 'password' ||
        cleanPassword === '123456';

      if (isCorrectPass) {
        const demoToken = `demo-token-${demo.user.id}-${Date.now()}`;
        localStorage.setItem(TOKEN_KEY, demoToken);
        localStorage.setItem(USER_KEY, JSON.stringify(demo.user));
        setToken(demoToken);
        setUser(demo.user);
        return demo.user;
      }
    }

    // 2. Check Locally Registered Accounts (in localStorage)
    try {
      const localUsersRaw = localStorage.getItem(LOCAL_USERS_KEY);
      if (localUsersRaw) {
        const localUsers: Array<{ user: User; pass: string }> = JSON.parse(localUsersRaw);
        const found = localUsers.find((u) => u.user.email.toLowerCase() === normalizedEmail);
        if (found && found.pass === cleanPassword) {
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

    // 3. Try Backend API (When running on Localhost with Express server)
    try {
      const res = await axiosClient.post<AuthResponse>('/auth/login', {
        email: normalizedEmail,
        password: cleanPassword,
      });

      // Verify the response is genuine JSON and has token + user
      if (res.data && typeof res.data === 'object' && res.data.success && res.data.token && res.data.user) {
        const { token: receivedToken, user: receivedUser } = res.data;
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        return receivedUser;
      }
    } catch (apiErr: any) {
      const errMsg = apiErr.response?.data?.message;
      if (errMsg) {
        throw new Error(errMsg);
      }
    }

    // If demo user was matched by email but password was wrong
    if (demo) {
      throw new Error(`Incorrect password for ${demo.user.name}. Please use '${demo.pass}'.`);
    }

    throw new Error('Authentication failed. Please verify your email and password.');
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    const normalizedEmail = payload.email.toLowerCase().trim();

    try {
      // 1. Try Backend API first
      const res = await axiosClient.post<AuthResponse>('/auth/register', {
        ...payload,
        email: normalizedEmail,
      });

      if (res.data && typeof res.data === 'object' && res.data.success && res.data.token && res.data.user) {
        const { token: receivedToken, user: receivedUser } = res.data;
        localStorage.setItem(TOKEN_KEY, receivedToken);
        localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
        setToken(receivedToken);
        setUser(receivedUser);
        return receivedUser;
      }
    } catch (apiError: any) {
      console.warn('Backend register failed or unavailable, registering locally:', apiError);
    }

    // Fallback registration in localStorage
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
      if (res.data && res.data.success && res.data.user) {
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
