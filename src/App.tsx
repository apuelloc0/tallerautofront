import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkshopProvider } from "@/context/WorkshopContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/context/AuthContext";
import { Layout } from "@/components/layout/Layout";
import { MobileNavbar } from "@/components/layout/MobileNavbar";
import Dashboard from "./pages/Dashboard";
import KanbanPage from "./pages/KanbanPage";
import OrdersPage from "./pages/OrdersPage";
import OrderFormPage from "./pages/OrderFormPage";
import InventoryPage from "./pages/InventoryPage";
import BillingPage from "./pages/BillingPage";
import ClientsPage from "./pages/ClientsPage";
import TechnicianPage from "./pages/TechnicianPage";
import LoginPage from "./pages/LoginPage";
import StaffPage from "./pages/StaffPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";
import SaasAdminPage from "./pages/SaasAdminPage";
import SettingsPage from "./pages/SettingsPage";

const queryClient = new QueryClient();

/** Componente para decidir qué dashboard mostrar en la raíz (/) */
const HomeDashboard = () => {
  const { user } = useAuth();
  if (user?.role === 'super_admin') return <Navigate to="/saas-admin" replace />;
  if (user?.role === 'admin' || user?.role === 'recepcionista') return <Layout><Dashboard /></Layout>;
  return <Navigate to="/tecnico" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <WorkshopProvider>
          <BrowserRouter 
            future={{ 
              v7_startTransition: true, 
              v7_relativeSplatPath: true 
            }}
          >
            <MobileNavbar />
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<LoginPage />} />

              {/* Redirecciones automáticas para evitar 404 en Super Admin */}
              <Route path="/saas/metrics" element={<Navigate to="/saas-admin" replace />} />
              <Route path="/saas/workshops" element={<Navigate to="/saas-admin" replace />} />
              <Route path="/saas/invites" element={<Navigate to="/saas-admin" replace />} />

              <Route path="/registro" element={<RegisterPage />} />
              <Route path="/recuperar-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              {/* Technician view — no sidebar, tecnico+ role */}
              <Route
                path="/tecnico"
                element={
                  <ProtectedRoute allowedRoles={["admin", "tecnico"]}>
                    <TechnicianPage />
                  </ProtectedRoute>
                }
              />

              {/* Admin & Recepcionista routes with sidebar */}
              <Route
                path="/"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista", "super_admin"]}>
                    <HomeDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/kanban"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><KanbanPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ordenes"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><OrdersPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ordenes/:id"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><OrderFormPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ordenes/nueva"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><OrderFormPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/inventario"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><InventoryPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/facturacion"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><BillingPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/personal"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Layout><StaffPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saas-admin"
                element={
                  <ProtectedRoute allowedRoles={["super_admin"]}>
                    <Layout><SaasAdminPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/configuracion"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Layout><SettingsPage /></Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clientes"
                element={
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><ClientsPage /></Layout>
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </WorkshopProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
