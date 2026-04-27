import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any | null;
  profile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin profile for the app without login
const DEFAULT_ADMIN: UserProfile = {
  uid: 'admin-default',
  name: 'Administrateur GRACE (Local)',
  email: 'admin@yetu.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Local session initialization
    const initLocalAuth = () => {
      setUser({ uid: 'admin-local', email: 'admin@yetu.com' });
      setProfile(DEFAULT_ADMIN);
      setLoading(false);
    };

    const timer = setTimeout(initLocalAuth, 500);
    return () => clearTimeout(timer);
  }, []);

  const login = async () => {};
  const register = async () => {};
  const logout = async () => {};

  return (
    <AuthContext.Provider value={{ user, profile, loading, login, register, logout }}>
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
