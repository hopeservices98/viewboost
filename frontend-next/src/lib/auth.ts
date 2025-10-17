import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  email: string;
  username: string;
  role: 'CREATOR' | 'AFFILIATE' | 'ADMIN';
  balance: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

// Store tokens in localStorage (client-side only)
export const setAuthTokens = (tokens: AuthTokens) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('authToken', tokens.accessToken);
    if (tokens.refreshToken) {
      localStorage.setItem('refreshToken', tokens.refreshToken);
    }
  }
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('authToken');
  }
  return null;
};

export const removeAuthTokens = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }
};

// Decode JWT token to get user info
export const getCurrentUser = (): User | null => {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<User & { exp: number; iat: number }>(token);

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (decoded.exp < currentTime) {
      removeAuthTokens();
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      username: decoded.username,
      role: decoded.role,
      balance: decoded.balance,
    };
  } catch (error) {
    console.error('Error decoding token:', error);
    removeAuthTokens();
    return null;
  }
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
  const user = getCurrentUser();
  return user !== null;
};

// Check if user has specific role
export const hasRole = (role: string): boolean => {
  const user = getCurrentUser();
  return user?.role === role;
};

// Check if user can access creator features
export const isCreator = (): boolean => {
  return hasRole('CREATOR') || hasRole('ADMIN');
};

// Check if user can access affiliate features
export const isAffiliate = (): boolean => {
  return hasRole('AFFILIATE') || hasRole('CREATOR') || hasRole('ADMIN');
};

// Check if user is admin
export const isAdmin = (): boolean => {
  return hasRole('ADMIN');
};

// Logout function
export const logout = () => {
  removeAuthTokens();
  window.location.href = '/auth/login';
};

// Auth context types
export interface AuthContextType {
  user: User | null;
  login: (tokens: AuthTokens) => void;
  logout: () => void;
  isAuthenticated: boolean;
  isCreator: boolean;
  isAffiliate: boolean;
  isAdmin: boolean;
}