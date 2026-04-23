import React, { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import type { AuthUser, UserRole } from "@/types/auth";
import { ROLE_ROUTES } from "@/types/auth";
import api from "@/api/api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  register: (regData: any) => Promise<void>;
  logout: () => void;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string, userId: string) => Promise<void>;
  canAccess: (route: string) => boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

/** Mapea los roles del Backend (Supabase) a los del Frontend */
const mapRole = (backendRole: string): UserRole => {
  if (!backendRole) return "mechanic"; // Valor por defecto seguro
  const role = backendRole.toLowerCase();
  if (role === "administrador") return "admin";
  if (role === "super_admin") return "super_admin" as any;
  return role as UserRole;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = localStorage.getItem("workshop_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  // Sincronizar datos del usuario con el backend al cargar la app
  useEffect(() => {
    const syncUser = async () => {
      const token = localStorage.getItem("authToken");
      if (token && user) {
        try {
          const { data } = await api.get("/auth/me");
          if (data.ok) {
            const updatedData: AuthUser = {
              ...user,
              name: data.user.full_name,
              join_code_tech: data.user.join_code_tech,
              join_code_recep: data.user.join_code_recep,
              workshop_id: data.user.workshop_id
            };
            localStorage.setItem("workshop_user", JSON.stringify(updatedData));
            setUser(updatedData);
          }
        } catch (err) {
          console.error("Error syncing user data");
          // Si la cuenta fue borrada o el taller eliminado, sacamos al usuario
          logout();
        }
      }
    };
    syncUser();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/login", { username, password });
      
      if (data.ok) {
        const { token, user: rawUser } = data;

        const userData: AuthUser = {
          id: rawUser.id,
          username: rawUser.username,
          email: rawUser.username, // Usamos el username como email para la interfaz
          name: rawUser.full_name, // Mapeamos full_name a name
          role: mapRole(rawUser.role),
          workshop_id: rawUser.workshop_id,
          join_code_tech: rawUser.join_code_tech,
          join_code_recep: rawUser.join_code_recep
        };

        // Guardamos el token para el interceptor de Axios
        localStorage.setItem("authToken", token);
        localStorage.setItem("workshop_user", JSON.stringify(userData));
        setUser(userData);
      } else {
        throw new Error(data.message || "Error al iniciar sesión");
      }
    } catch (err: any) {
      console.error("Login error details:", err.response?.data || err.message);
      throw new Error(err.response?.data?.message || "Usuario o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (regData: any) => {
    setIsLoading(true);
    try {
      const { data } = await api.post("/auth/register", regData);

      if (!data.ok) {
        throw new Error(data.message || "Error en el registro");
      }
      
      return data; // Devolvemos la respuesta para que la página de registro la use
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "No se pudo crear la cuenta");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("workshop_user");
    localStorage.removeItem("authToken");
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    setIsLoading(true);
    try {
      await api.get(`/users/verify-user/${email}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string, userId: string) => {
    setIsLoading(true);
    try {
      await api.post("/users/reset-password", { token, newPassword, userId });
    } catch (err: any) {
      throw new Error(err.response?.data?.message || "No se pudo restablecer la contraseña");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const canAccess = useCallback(
    (route: string) => {
      if (!user) return false;
      
      // El Administrador de taller y el Super Admin Global tienen acceso total
      if (user.role === 'admin' || (user.role as string) === 'super_admin') return true;

      const routes = ROLE_ROUTES[user.role as keyof typeof ROLE_ROUTES];
      if (!routes) return false; // Evita que la app se rompa si el rol no existe
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
