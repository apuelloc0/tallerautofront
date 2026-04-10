import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";
import type { AuthUser, UserRole } from "@/types/auth";
import { ROLE_ROUTES } from "@/types/auth";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
  canAccess: (route: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Mock users for development
const MOCK_USERS: (AuthUser & { password: string })[] = [
  { id: "u1", email: "admin@taller.com", password: "admin123", name: "Carlos Méndez", role: "admin" },
  { id: "u2", email: "recepcion@taller.com", password: "recepcion123", name: "María López", role: "recepcionista" },
  { id: "u3", email: "tecnico@taller.com", password: "tecnico123", name: "Pedro Ramírez", role: "tecnico" },
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("workshop_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    // Simulate API delay
    await new Promise((r) => setTimeout(r, 800));
    const found = MOCK_USERS.find((u) => u.email === email && u.password === password);
    if (!found) {
      setIsLoading(false);
      throw new Error("Credenciales inválidas. Verifica tu correo y contraseña.");
    }
    const { password: _, ...userData } = found;
    setUser(userData);
    localStorage.setItem("workshop_user", JSON.stringify(userData));
    setIsLoading(false);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    if (MOCK_USERS.find((u) => u.email === email)) {
      setIsLoading(false);
      throw new Error("Este correo ya está registrado.");
    }
    const newUser: AuthUser = { id: `u${Date.now()}`, email, name, role };
    setUser(newUser);
    localStorage.setItem("workshop_user", JSON.stringify(newUser));
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("workshop_user");
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
    // In production, this would send an email
  }, []);

  const resetPassword = useCallback(async (_token: string, _newPassword: string) => {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 800));
    setIsLoading(false);
  }, []);

  const canAccess = useCallback(
    (route: string) => {
      if (!user) return false;
      const routes = ROLE_ROUTES[user.role];
      return routes.some((r) => (r === "/" ? route === "/" : route.startsWith(r)));
    },
    [user]
  );

  const hasRole = useCallback(
    (role: UserRole) => user?.role === role,
    [user]
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        requestPasswordReset,
        resetPassword,
        canAccess,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
