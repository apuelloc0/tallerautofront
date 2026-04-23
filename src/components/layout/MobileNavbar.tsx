import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Wrench, 
  Menu, 
  Columns3, 
  Package, 
  Receipt, 
  ShieldCheck, 
  Settings, 
  LogOut,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function MobileNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  if (!user) return null;

  const role = user.role?.toLowerCase();
  const isSuperAdmin = role === 'super_admin';
  const isAdmin = role === 'admin' || role === 'administrador';
  const isReceptionist = role === 'recepcionista';
  const isTech = role === 'tecnico';

  // Si estamos en login o registro, no mostramos la barra
  const hideOnPaths = ['/login', '/registro', '/recuperar-password', '/reset-password'];
  if (hideOnPaths.includes(location.pathname)) return null;

  // Items Principales: Los más usados que van fijos en la barra (Máximo 3 para dejar espacio al "Más")
  const mainItems = [
    { label: "SaaS", icon: BarChart3, path: "/saas-admin", show: isSuperAdmin },
    { label: "Inicio", icon: LayoutDashboard, path: "/", show: isAdmin || isReceptionist },
    { label: "Pizarra", icon: Columns3, path: "/kanban", show: isAdmin || isReceptionist },
    { label: "Trabajo", icon: Wrench, path: "/tecnico", show: isTech || isAdmin },
  ].filter(item => item.show);

  // Items Secundarios: Van dentro del menú "Más" para limpiar la vista
  const moreItems = [
    { label: "Órdenes", icon: ClipboardList, path: "/ordenes", show: isAdmin || isReceptionist },
    { label: "Clientes", icon: Users, path: "/clientes", show: isAdmin || isReceptionist },
    { label: "Inventario", icon: Package, path: "/inventario", show: isAdmin || isReceptionist },
    { label: "Facturación", icon: Receipt, path: "/facturacion", show: isAdmin || isReceptionist },
    { label: "Personal", icon: ShieldCheck, path: "/personal", show: isAdmin },
    { label: "Configuración", icon: Settings, path: "/configuracion", show: isAdmin },
  ].filter(item => item.show);

  return (
    <nav className="md:hidden fixed bottom-6 left-6 right-6 z-40 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-white/20 dark:bg-white/5 backdrop-blur-xl saturate-150 border border-white/20 dark:border-white/10 shadow-[0_8px_32px_0_rgba(0,0,0,0.2)] rounded-[2rem] h-16 flex items-center justify-around px-2 py-1">
        {mainItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300 gap-0.5 outline-none",
                isActive ? "text-primary" : "text-muted-foreground/60 hover:text-foreground"
              )}
            >
              {isActive && (
                <div className="absolute inset-x-1 inset-y-1 bg-primary/10 rounded-2xl animate-in fade-in zoom-in duration-300" />
              )}
              <item.icon className={cn("h-5 w-5 transition-transform", isActive && "scale-110")} />
              <span className="text-[9px] font-bold uppercase tracking-tighter">{item.label}</span>
              {isActive && (
                <div className="absolute -bottom-1 w-1 h-1 rounded-full bg-primary" />
              )}
            </button>
          );
        })}
        
        {/* Menú "Más" */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full gap-0.5 text-muted-foreground/60 outline-none">
              <Menu className="h-5 w-5" />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Más</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent 
            side="top" 
            align="end" 
            className="w-56 mb-4 rounded-2xl bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl p-2 z-[110]"
          >
            <DropdownMenuLabel className="text-[10px] text-muted-foreground uppercase px-3 py-1 tracking-widest">Operaciones</DropdownMenuLabel>
            <DropdownMenuSeparator className="opacity-20" />
            
            <div className="grid gap-0.5">
              {moreItems.map((item) => (
                <DropdownMenuItem 
                  key={item.path} 
                  onClick={() => navigate(item.path)}
                  className="flex items-center gap-3 py-2.5 px-3 rounded-xl focus:bg-primary/10 focus:text-primary cursor-pointer transition-colors outline-none"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-sm font-medium">{item.label}</span>
                </DropdownMenuItem>
              ))}
            </div>

            <DropdownMenuSeparator className="opacity-20" />
            <DropdownMenuItem 
              onClick={() => { logout(); navigate("/login"); }}
              className="flex items-center gap-3 py-2.5 px-3 rounded-xl focus:bg-destructive/10 text-destructive cursor-pointer outline-none"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Cerrar Sesión</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}