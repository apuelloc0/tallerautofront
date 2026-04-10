import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import type { UserRole } from "@/types/auth";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, user, canAccess } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to their default route
    const defaultRoute = user.role === "tecnico" ? "/tecnico" : "/";
    return <Navigate to={defaultRoute} replace />;
  }

  if (!canAccess(location.pathname)) {
    const defaultRoute = user?.role === "tecnico" ? "/tecnico" : "/";
    return <Navigate to={defaultRoute} replace />;
  }

  return <>{children}</>;
}
