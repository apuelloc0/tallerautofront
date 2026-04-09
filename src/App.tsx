import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { WorkshopProvider } from "@/context/WorkshopContext";
import { Layout } from "@/components/layout/Layout";
import Dashboard from "./pages/Dashboard";
import KanbanPage from "./pages/KanbanPage";
import OrdersPage from "./pages/OrdersPage";
import OrderFormPage from "./pages/OrderFormPage";
import InventoryPage from "./pages/InventoryPage";
import BillingPage from "./pages/BillingPage";
import ClientsPage from "./pages/ClientsPage";
import TechnicianPage from "./pages/TechnicianPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <WorkshopProvider>
        <BrowserRouter>
          <Routes>
            {/* Technician view — no sidebar layout */}
            <Route path="/tecnico" element={<TechnicianPage />} />
            {/* All other routes with sidebar layout */}
            <Route path="/" element={<Layout><Dashboard /></Layout>} />
            <Route path="/kanban" element={<Layout><KanbanPage /></Layout>} />
            <Route path="/ordenes" element={<Layout><OrdersPage /></Layout>} />
            <Route path="/ordenes/:id" element={<Layout><OrderFormPage /></Layout>} />
            <Route path="/ordenes/nueva" element={<Layout><OrderFormPage /></Layout>} />
            <Route path="/inventario" element={<Layout><InventoryPage /></Layout>} />
            <Route path="/facturacion" element={<Layout><BillingPage /></Layout>} />
            <Route path="/clientes" element={<Layout><ClientsPage /></Layout>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </WorkshopProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
