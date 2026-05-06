import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../api/apiClient';

interface User {
  id: number;
  email: string;
  fullName: string;
  employeeCode: string;
  role: {
    id: number;
    roleName: string;
  };
  mfaRequired: boolean;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (loginId: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string, confirmPassword: string) => Promise<void>;
  setupMfa: (mfaMethod: 'totp' | 'sms' | 'email', phoneNumber?: string) => Promise<any>;
  verifyMfaSetup: (code: string) => Promise<any>;
}

export const useAuth = (): AuthContextType => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const notifyAuthChanged = useCallback(() => {
    window.dispatchEvent(new Event('auth-changed'));
  }, []);

  // Initialize auth state from localStorage
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient
        .getCurrentUser()
        .then((response) => setUser(response.data))
        .catch(() => {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        });
    }
  }, []);

  const login = useCallback(async (loginId: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.login(loginId, password);
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      setUser(response.data.user);
      notifyAuthChanged();
      navigate('/dashboard');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, notifyAuthChanged]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await apiClient.logout();
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setUser(null);
      notifyAuthChanged();
      navigate('/login');
    } finally {
      setIsLoading(false);
    }
  }, [navigate, notifyAuthChanged]);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string, confirmPassword: string) => {
      setIsLoading(true);
      try {
        await apiClient.changePassword(currentPassword, newPassword, confirmPassword);
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  const setupMfa = useCallback(async (mfaMethod: 'totp' | 'sms' | 'email', phoneNumber?: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.setupMfa(mfaMethod, phoneNumber);
      return response.data;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMfaSetup = useCallback(async (code: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.verifyMfa(code);
      setUser((previousUser) =>
        previousUser
          ? {
              ...previousUser,
              mfaRequired: true,
            }
          : previousUser,
      );
      notifyAuthChanged();
      return response.data;
    } finally {
      setIsLoading(false);
    }
  }, [notifyAuthChanged]);

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    changePassword,
    setupMfa,
    verifyMfaSetup,
  };
};
