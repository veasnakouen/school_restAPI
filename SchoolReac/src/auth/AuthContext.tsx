import React, { createContext, useState, useContext, ReactNode, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import * as api from '../services/api';

interface AuthContextType {
  user: api.User | null;
  token: string | null;
  isLoading: boolean; // For login/logout actions
  isInitializing: boolean; // For initial auth check
  loadingMessage: string | null;
  setLoading: (isLoading: boolean, message?: string | null) => void;
  login: (credentials: { email: string; password: string }, rememberMe: boolean) => Promise<void>;
  logout: (options?: { navigate: boolean }) => void;
  updateUser: (updatedData: Partial<api.User>) => void;
  isAdmin: () => boolean;
  isAuthenticated: boolean;
}

/**
 * 🔥 DEV-ONLY: Set to `true` to bypass login and mock an admin user.
 * This is useful for frontend development without a running backend.
 * ‼️ IMPORTANT: Set this to `false` for production builds.
 */
export const DEV_MODE_MOCK_AUTH = false;

const mockUser: api.User = {
  id: 'dev-user-id',
  userName: 'devadmin@school.com',
  fullName: 'Dev Admin',
  email: 'devadmin@school.com',
  roles: ['Admin', 'User'],
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<api.User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false); // For login/logout actions
  const [isInitializing, setIsInitializing] = useState(true); // For initial auth check
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const logout = useCallback((options = { navigate: true }) => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("user");
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    sessionStorage.removeItem("user");
    sessionStorage.removeItem("accessToken");
    if (options.navigate) {
      navigate('/login');
    }
  }, [navigate]);

  const updateUser = useCallback((updatedData: Partial<api.User>) => {
    setUser(currentUser => {
      if (!currentUser) return null;
      const newUser = { ...currentUser, ...updatedData };
      // Update the same storage that was used for login
      const storage = localStorage.getItem('user') ? localStorage : sessionStorage;
      storage.setItem('user', JSON.stringify(newUser));
      return newUser;
    });
  }, []);

  // This effect runs once on app startup to check for an existing session.
  useEffect(() => {
    if (DEV_MODE_MOCK_AUTH) {
      console.warn(
        '%c🚀 DEV MODE: AUTHENTICATION IS MOCKED',
        'color: #ffb300; font-weight: bold; font-size: 14px; padding: 4px;'
      );
      setUser(mockUser);
      setToken('dev-mock-token');
      setIsInitializing(false);
      return;
    }

    const validateToken = async () => {
      const storedToken = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (storedToken) {
        try {
          // The axios interceptor will add the token to this request
          const profile = await api.getProfile();
          setUser(profile);
          setToken(storedToken);
        } catch (error) {
          // Token is invalid, clear storage.
          logout({ navigate: false }); // Don't navigate, just clear state
        }
      }
      setIsInitializing(false);
    };

    validateToken();
  }, [logout]);

  const login = async (credentials: { email: string; password: string }, rememberMe: boolean) => {
    setIsLoading(true);
    setLoadingMessage('Logging in...');
    try {
      const response = await api.login(credentials);
      // Manually construct the user object from the API response, as it's flat.
      const user: api.User = {
        id: response.userId,
        email: response.email,
        fullName: response.fullName,
        userName: response.email, // Backend doesn't return userName on login, use email as a fallback
        roles: response.role,
        phoneNumber: response.phoneNumber,
        imageUrl: response.imageUrl,
      };
      const { accessToken, refreshToken } = response;

      const storage = rememberMe ? localStorage : sessionStorage;
      const otherStorage = rememberMe ? sessionStorage : localStorage;

      // Clear the other storage to avoid conflicts
      otherStorage.removeItem('user');
      otherStorage.removeItem('accessToken');
      setUser(user);
      setToken(accessToken);
      storage.setItem('user', JSON.stringify(user));
      storage.setItem('accessToken', accessToken);
      // Refresh token is long-lived, always store in localStorage
      localStorage.setItem('refreshToken', refreshToken);
    } finally {
      setLoadingMessage(null);
      setIsLoading(false);
    }
  };

  const setLoading = (isLoading: boolean, message: string | null = null) => {
    setIsLoading(isLoading);
    setLoadingMessage(message);
  };

  const isAdmin = () => !!(user?.roles?.includes('Admin') || user?.roles?.includes('Administrator'));
  const isAuthenticated = !!user;

  const value = { user, token, login, logout, updateUser, isAdmin,isAuthenticated, isLoading, isInitializing, loadingMessage, setLoading } satisfies AuthContextType;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};