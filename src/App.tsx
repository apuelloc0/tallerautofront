import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkshopProvider } from "@/context/WorkshopContext";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import KanbanPage from "./pages/KanbanPage";
import OrdersPage from "./pages/OrdersPage";
import OrderFormPage from "./pages/OrderFormPage";
import InventoryPage from "./pages/InventoryPage";
import BillingPage from "./pages/BillingPage";
import ClientsPage from "./pages/ClientsPage";
import TechnicianPage from "./pages/TechnicianPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <WorkshopProvider>
          <BrowserRouter>
            <Routes>
              {/* Public auth routes */}
              <Route path="/login" element={<LoginPage />} />
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
                  <ProtectedRoute allowedRoles={["admin", "recepcionista"]}>
                    <Layout><Dashboard /></Layout>
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
