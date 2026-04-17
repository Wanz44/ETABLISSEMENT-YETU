import React, { createContext, useContext, useEffect, useState } from 'react';
import { UserProfile } from '../types';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase';

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
  name: 'Administrateur YETU',
  email: 'admin@yetu.com',
  role: 'admin',
  createdAt: new Date().toISOString(),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        setUser(fbUser);
        setProfile(DEFAULT_ADMIN);
        setLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error("Firebase Auth failed:", error);
          // Fallback to fake user if firebase fails
          setUser({ uid: 'admin-default', email: 'admin@yetu.com' });
          setProfile(DEFAULT_ADMIN);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
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
