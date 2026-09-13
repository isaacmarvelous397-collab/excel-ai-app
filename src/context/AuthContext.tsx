import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, PlanType } from '../types';
import { api, getAuthToken } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  signup: (name: string, email: string, pass: string, confirm: string) => Promise<void>;
  loginWithGoogle: (name?: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setPlan: (plan: PlanType) => Promise<void>;
  updateUserState: (updatedUser: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    const token = getAuthToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const current = await api.getMe();
      setUser(current);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, pass: string) => {
    const loggedUser = await api.login(email, pass);
    setUser(loggedUser);
  };

  const signup = async (name: string, email: string, pass: string, confirm: string) => {
    const newUser = await api.signup(name, email, pass, confirm);
    setUser(newUser);
  };

  const loginWithGoogle = async (name?: string, email?: string) => {
    const googleUser = await api.loginWithGoogle(name, email);
    setUser(googleUser);
  };

  const logout = async () => {
    await api.logout();
    setUser(null);
  };

  const setPlan = async (plan: PlanType) => {
    await api.upgradePlan(plan);
    await refreshUser();
  };

  const updateUserState = (updatedUser: User) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        login,
        signup,
        loginWithGoogle,
        logout,
        refreshUser,
        setPlan,
        updateUserState,
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
