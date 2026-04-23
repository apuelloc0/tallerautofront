import { ReactNode, useState, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Sun, Moon, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWorkshop } from "@/context/WorkshopContext";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/api/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function Layout({ children }: { children: ReactNode }) {
  const { users } = useWorkshop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Estado del tema sincronizado con localStorage
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("workshop-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("workshop-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("workshop-theme", "light");
    }
    // Notificamos a otros componentes (como el Sidebar) que el tema cambió
    window.dispatchEvent(new Event("storage"));
  }, [isDark]);

  // Suscripción Realtime: Escuchar cambios en la base de datos
  useEffect(() => {
    const channel = supabase
      .channel('workshop-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_orders' }, (payload) => {
        if (payload.eventType === 'INSERT') toast.info("Nueva orden recibida");
        if (payload.eventType === 'UPDATE') toast.success("Orden actualizada");
        // Si cambia una orden, refrescamos estadísticas del dashboard y lista de órdenes
        queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] });
        queryClient.invalidateQueries({ queryKey: ["workshop-orders"] });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, () => {
        // Si se registra alguien nuevo, actualizamos la lista de personal para ver la alerta
        queryClient.invalidateQueries({ queryKey: ["workshop-users"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  // Calculamos usuarios pendientes de aprobación
  const pendingUsersCount = (users || []).filter(u => !u.active).length;
  const isAdmin = user?.role === 'admin' || (user?.role as string) === 'super_admin';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <span className="text-sm font-medium text-muted-foreground">
                Sistema de Gestión de Taller
              </span>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && pendingUsersCount > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative h-9 w-9 text-orange-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-950/30"
                  onClick={() => navigate("/personal")}
                  title={`${pendingUsersCount} solicitudes de registro pendientes`}
                >
                  <Bell className="h-4 w-4" />
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
                    {pendingUsersCount}
                  </span>
                </Button>
              )}

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDark(!isDark)}
                className="h-9 w-9 rounded-md"
                title={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-4 md:p-6 pb-28 md:pb-6">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
