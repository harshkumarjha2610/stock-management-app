// MyApp/context/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';

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
    // Simulate checking for an active session on mount
    const checkSession = async () => {
      try {
        // Here we could check AsyncStorage, SecureStore, etc.
        // For now, we start as unauthenticated.
        setUser(null);
      } catch (e) {
        console.error('Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const normalizedEmail = email.trim().toLowerCase();
    
    if (normalizedEmail === 'admin@employer.com' && password === '123456') {
      const mockUser: User = {
        email: normalizedEmail,
        name: 'Harsh Kumar',
        id: 'EMP-2401',
      };
      setUser(mockUser);
      setIsLoading(false);
      return { success: true };
    } else {
      setIsLoading(false);
      return { success: false, error: 'Invalid email or password' };
    }
  };

  const logout = () => {
    setUser(null);
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
