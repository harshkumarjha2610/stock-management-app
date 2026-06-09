// MyApp/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/app/lib/api';

interface User {
  email: string;
  name: string;
  id: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize API (load token) and fetch profile if available
    const checkSession = async () => {
      try {
        setIsLoading(true);
        const existing = await api.init();
        if (existing) {
          // fetch profile
          try {
            const profile = await api.apiGet('/users/profile');
            if (profile?.role === 'STAFF') {
              try {
                const staff = await api.apiGet('/staff/me');
                setUser({ ...staff, role: profile.role, email: profile.email });
              } catch (innerErr) {
                setUser(profile);
              }
            } else {
              setUser(profile);
            }
          } catch (e) {
            try {
              const staff = await api.apiGet('/staff/me');
              setUser(staff);
            } catch (e2) {
              setUser(null);
            }
          }
        } else {
          setUser(null);
        }
      } catch (e) {
        console.error('Failed to load session:', e);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const data = await api.apiPost('/auth/login', { email, password });
      if (data?.token) {
        await api.setToken(data.token);
      }
      if (data?.user) {
        if (data.user.role === 'STAFF') {
          try {
            const staff = await api.apiGet('/staff/me');
            setUser({ ...staff, role: data.user.role, email: data.user.email });
          } catch (innerErr) {
            setUser(data.user);
          }
        } else {
          setUser(data.user);
        }
      }
      setIsLoading(false);
      return { success: true };
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, error: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    setUser(null);
    api.setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
