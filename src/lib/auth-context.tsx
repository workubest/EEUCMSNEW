import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User, UserRole } from '@/types';
import { demoUsers, demoCredentials } from './demo-data';

const GAS_PROXY_ENABLED = import.meta.env.VITE_GAS_PROXY_ENABLED === 'true';
const GAS_PROXY_URL = import.meta.env.VITE_GAS_PROXY_URL || 'http://localhost:3001/api/auth/login';
const GAS_HEALTH_URL = import.meta.env.VITE_GAS_PROXY_URL || 'http://localhost:3001/api/health';

type GasProxyUser = {
  id?: string;
  userId?: string;
  email?: string;
  name?: string;
  full_name?: string;
  role?: string;
  region?: string;
  service_center?: string;
  serviceCenter?: string;
  active?: boolean;
  createdAt?: string;
};

type GasProxyResponse = {
  success?: boolean;
  user?: GasProxyUser;
  token?: string;
  error?: string;
};

interface AuthContextType {
  user: User | null;
  userRole: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isLoading: boolean;
  isBackendOnline: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  useEffect(() => {
    // Check GAS proxy availability
    if (GAS_PROXY_ENABLED && GAS_HEALTH_URL) {
      fetch(GAS_HEALTH_URL, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
        .then(() => setIsBackendOnline(true))
        .catch(() => setIsBackendOnline(false));
    }

    // Load stored user from localStorage (GAS proxy + demo auth only)
    const storedUser = localStorage.getItem('eeu_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);



  const login = async (email: string, password: string) => {
    // Check if using demo credentials
    const isValidAdmin = email === demoCredentials.admin.email && password === demoCredentials.admin.password;
    const isValidStaff = email === demoCredentials.staff.email && password === demoCredentials.staff.password;
    const isValidManager = email === demoCredentials.manager.email && password === demoCredentials.manager.password;

    // Check if using GAS proxy credentials
    const isValidGasAdmin = email === 'admin@eeu.com' && password === 'admin123';

    // Try Google Apps Script proxy authentication if enabled
    if (GAS_PROXY_ENABLED && GAS_PROXY_URL) {
      try {
        console.log('Attempting authentication via GAS proxy server...');

        const response = await fetch(GAS_PROXY_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            path: '/auth/login',
            data: {
              email: email.trim(),
              password: password.trim()
            }
          })
        });

        const result: GasProxyResponse = await response.json();

        if (result.success && result.user && result.token) {
          // Map proxy response to User type
          const userData: User = {
            id: result.user.id || result.user.userId,
            email: result.user.email || email,
            name: result.user.name || result.user.full_name || email.split('@')[0],
            role: (result.user.role as UserRole) || 'staff',
            active: result.user.active !== false,
            createdAt: result.user.createdAt || new Date().toISOString(),
            region: result.user.region,
            serviceCenter: result.user.service_center || result.user.serviceCenter
          };

          setUser(userData);
          localStorage.setItem('eeu_user', JSON.stringify(userData));
          localStorage.setItem('eeu_token', result.token);

          console.log('GAS proxy authentication successful');
          return { success: true };
        } else {
          console.log('GAS proxy authentication failed:', result.error);
          return { success: false, error: result.error || 'Authentication failed' };
        }
      } catch (error) {
        console.error('GAS proxy authentication error:', error);
        // Fall back to other methods if proxy fails
      }
    } else if (GAS_PROXY_ENABLED) {
      console.warn('GAS proxy enabled but no proxy URL configured');
    }

    // Supabase auth removed - using GAS proxy and demo auth only

    // Fall back to demo authentication
    if (isValidAdmin || isValidStaff || isValidManager || isValidGasAdmin) {
      const foundUser = demoUsers.find(u => u.email === email);
      if (foundUser) {
        setUser(foundUser);
        localStorage.setItem('eeu_user', JSON.stringify(foundUser));
        return { success: true };
      }

      // Handle GAS proxy admin credentials
      if (isValidGasAdmin) {
        const gasAdminUser: User = {
          id: 'gas-admin-001',
          email: 'admin@eeu.com',
          name: 'GAS Admin',
          role: 'admin',
          active: true,
          createdAt: new Date().toISOString(),
        };
        setUser(gasAdminUser);
        localStorage.setItem('eeu_user', JSON.stringify(gasAdminUser));
        return { success: true };
      }
    }

    return { success: false, error: 'Invalid email or password' };
  };

  const logout = async () => {
    // Clear GAS proxy token if exists
    localStorage.removeItem('eeu_token');
    setUser(null);
    localStorage.removeItem('eeu_user');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      userRole: user?.role || null, 
      isAuthenticated: !!user, 
      login, 
      logout, 
      isLoading,
      isBackendOnline 
    }}>
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
