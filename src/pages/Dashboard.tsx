import { useMemo, useState } from "react";
import { Car, ClipboardList, DollarSign, Users, Loader2, BarChart3, Info, Calendar, Copy, Check, UserPlus, Wrench, AlertCircle, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkshop } from "@/context/WorkshopContext";
import { useAuth } from "@/context/AuthContext";
import { STATUS_LABELS } from "@/types/workshop";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/api/api";
import { CarLoader } from "@/components/ui/CarLoader";
 
export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [copiedTech, setCopiedTech] = useState(false);
  const [copiedRecep, setCopiedRecep] = useState(false);
  const { getVehicle, getClient, orders, technicians, parts } = useWorkshop();
  const queryClient = useQueryClient();

  const { data: stats, isLoading, isRefetching } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const { data } = await api.get("/dashboard");
      return data.data;
    },
    staleTime: 5 * 60 * 1000, // Considerar datos frescos por 5 minutos
    refetchOnWindowFocus: false,
  });

  // Lógica para el gráfico movida antes del return temprano para cumplir las reglas de Hooks.
  // Todos los Hooks (useMemo, useEffect, etc.) deben ejecutarse siempre antes de cualquier return condicional.
  const weeklyProductivityData = useMemo(() => {
    const daysLabels = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const last7Days = [];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('en-CA'); // Obtiene YYYY-MM-DD en hora local
      const dayName = daysLabels[d.getDay()];
      
      const count = orders.filter(o => {
        const isFinished = o.status === 'listo_entrega' || o.status === 'entregado';
        const orderDate = o.updatedAt || o.createdAt; 
        return isFinished && orderDate === dateStr;
      }).length;

      last7Days.push({ day: dayName, completadas: count, fullDate: dateStr });
    }
    return last7Days;
  }, [orders]);

  // Calculamos alertas de stock basadas en los datos reales del inventario local
  const lowStockParts = useMemo(() => {
    return parts.filter(p => p.stock <= p.minStock);
  }, [parts]);

  // Detectamos órdenes que requieren veredicto del administrador
  // Solo mostramos la alerta si tiene la etiqueta de revisión Y la orden no ha sido entregada
  const pendingReviewOrders = useMemo(() => {
    return orders.filter(o => 
      o.status !== 'entregado' && o.diagnosis?.includes("[REVISIÓN REQUERIDA]")
    );
  }, [orders]);

  const hasWeeklyData = weeklyProductivityData.some(d => d.completadas > 0);

  const copyCode = (code: string, type: 'tech' | 'recep') => {
    navigator.clipboard.writeText(code);
    if (type === 'tech') {
      setCopiedTech(true);
      setTimeout(() => setCopiedTech(false), 2000);
    } else {
      setCopiedRecep(true);
      setTimeout(() => setCopiedRecep(false), 2000);
    }
  };

  // Formateador COP consistente con el resto de la app
  const formatCOP = (v: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(v);

  if (isLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CarLoader message="Sincronizando datos..." />
      </div>
    );
  }

  // Calculamos disponibilidad real basada en datos locales para máxima precisión
  const totalTechsCount = technicians.length;
  // Un técnico está ocupado SOLO si tiene órdenes en diagnóstico, reparación o espera de repuestos
  const busyTechIds = new Set(
    orders
      .filter(o => o.technicianId && !['entregado', 'listo_entrega', 'ingresado'].includes(o.status))
      .map(o => o.technicianId)
  );
  const availableTechsCount = technicians.filter(t => !busyTechIds.has(t.id)).length;

  const kpis = [
    { title: "Vehículos Hoy", value: stats?.kpis?.vehiclesToday ?? 0, icon: Car, color: "text-primary" },
    { title: "Órdenes Activas", value: stats?.kpis?.activeOrders ?? 0, icon: ClipboardList, color: "text-primary" },
    { title: "Ventas del Mes", value: formatCOP(Number(stats?.kpis?.monthlySales ?? 0)), icon: DollarSign, color: "text-success" },
    { title: "Técnicos Disponibles", value: `${availableTechsCount}/${totalTechsCount}`, icon: Users, color: "text-primary" },
  ];

  // Ordenamos las órdenes por fecha de creación (más recientes primero)
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Header de Bienvenida */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-black tracking-tight">Hola, {user?.name.split(' ')[0]}</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-70 flex items-center gap-2">
            <Calendar className="h-3 w-3" /> {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <Button 
          variant="outline" 
          size="icon" 
          className="rounded-full h-10 w-10 border-primary/20 bg-background/50 backdrop-blur-sm shadow-sm" 
          onClick={() => queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })}
          disabled={isRefetching}
        >
          <RefreshCw className={`h-4 w-4 text-primary ${isRefetching ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Sección de Códigos (Sutil y moderna) */}
      {(user?.role?.toLowerCase() === 'administrador' || user?.role?.toLowerCase() === 'admin') && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-primary/10 border border-primary/10 rounded-[1.5rem] p-3 flex flex-col justify-between group transition-all active:scale-95">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase text-primary/60 tracking-tighter">Mecánicos</span>
              <UserPlus className="h-3 w-3 text-primary/40" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <code className="text-xs font-mono font-bold">{user.join_code_tech || '—'}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(user.join_code_tech!, 'tech')}>
                {copiedTech ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 opacity-40" />}
              </Button>
            </div>
          </div>
          <div className="bg-orange-500/10 border border-orange-500/10 rounded-[1.5rem] p-3 flex flex-col justify-between group transition-all active:scale-95">
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-black uppercase text-orange-600/60 tracking-tighter">Recepción</span>
              <Users className="h-3 w-3 text-orange-600/40" />
            </div>
            <div className="flex items-center justify-between mt-2">
              <code className="text-xs font-mono font-bold">{user.join_code_recep || '—'}</code>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copyCode(user.join_code_recep!, 'recep')}>
                {copiedRecep ? <Check className="h-3 w-3 text-green-600" /> : <Copy className="h-3 w-3 opacity-40" />}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Alerta de Veredicto Final (Solo aparece si hay órdenes pendientes de revisión) */}
      {pendingReviewOrders.length > 0 && (
        <Card className="border-orange-500/30 bg-orange-50/50 dark:bg-orange-950/20 backdrop-blur-md animate-in slide-in-from-top duration-500 rounded-[2rem]">
          <CardHeader className="p-4 pb-0">
            <div className="flex items-center gap-2 text-orange-600">
              <div className="h-2 w-2 rounded-full bg-orange-600 animate-ping" />
              <CardTitle className="text-[10px] font-black uppercase tracking-[0.1em]">Pendiente de Entrega</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-2">
            <div className="flex flex-wrap gap-2">
              {pendingReviewOrders.map(order => {
                const vehicle = getVehicle(order.vehicleId);
                return (
                  <Badge 
                    key={order.id} 
                    variant="outline" 
                    className="bg-background/80 border-orange-200 dark:border-orange-900/50 rounded-xl cursor-pointer hover:bg-orange-100 transition-colors py-1 px-3"
                    onClick={() => navigate("/kanban")}
                  >
                    {vehicle?.plate}
                  </Badge>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* KPIs Grilla Estilizada */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title} className="border-none bg-card/60 backdrop-blur-md shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-4 pb-0">
              <div className={cn("p-2 rounded-2xl bg-muted/50", kpi.color.replace('text-', 'bg-').replace('success', 'green-500/10').replace('primary', 'primary/10'))}>
                <kpi.icon className={cn("h-4 w-4", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="text-lg font-black tracking-tighter">{kpi.value}</div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-none bg-card/40 backdrop-blur-md rounded-[2rem]">
          <CardHeader className="py-3">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">Productividad Semanal</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">Vehículos finalizados o entregados en los últimos 7 días. Se actualiza instantáneamente al cambiar el estado de una orden.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent>
            {hasWeeklyData ? (
              <ResponsiveContainer width="100%" height={150}>
                <BarChart 
                  data={weeklyProductivityData}
                  style={{ cursor: 'pointer' }}
                  onClick={(data) => {
                    if (data && data.activePayload && data.activePayload.length > 0) {
                      const { fullDate } = data.activePayload[0].payload;
                      navigate("/ordenes", { state: { filterDate: fullDate } });
                    }
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <RechartsTooltip 
                    cursor={false} 
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-md p-2 text-xs">
                            <p className="font-bold text-popover-foreground">{label}</p>
                            <p className="text-muted-foreground">Completadas: <span className="text-primary font-medium">{payload[0].value}</span></p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="completadas" fill="hsl(21, 90%, 48%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[150px] flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed rounded-lg bg-muted/5">
                <BarChart3 className="h-10 w-10 mb-2 opacity-20" />
                <p className="text-sm font-medium">Sin actividad reciente</p>
                <p className="text-xs opacity-70 italic">El rendimiento por día aparecerá aquí a medida que entregues vehículos</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">Alertas de Stock</CardTitle>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent><p className="max-w-xs">Repuestos que han alcanzado el nivel mínimo de inventario. Es recomendable gestionar su reposición con los proveedores.</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockParts.length > 0 ? (
              lowStockParts.map((p) => (
                <div 
                  key={p.id} 
                  className="flex items-center justify-between cursor-pointer hover:bg-muted/50 p-1 rounded transition-colors"
                  onClick={() => navigate("/inventario", { state: { searchPart: p.code } })}
                >
                  <span className="text-sm">{p.name}</span>
                  <Badge variant="destructive" className="text-xs">{p.stock} uds</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin alertas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Estado Detallado de Técnicos */}
      <Card>
        <CardHeader className="py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wrench className="h-4 w-4 text-primary" /> Estado del Personal Operativo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {technicians.map((tech) => {
              const isBusy = busyTechIds.has(tech.id);
              const activeOrder = orders.find(o => 
                o.technicianId === tech.id && 
                !['entregado', 'listo_entrega', 'ingresado'].includes(o.status)
              );
              const vehicle = activeOrder ? getVehicle(activeOrder.vehicleId) : null;

              return (
                <div key={tech.id} className="flex items-center justify-between p-2 border rounded-lg bg-muted/30">
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{tech.name}</span>
                    <span className="text-[10px] text-muted-foreground">
                      {isBusy ? `Trabajando en: ${vehicle?.plate || 'Orden activa'}` : 'Sin tareas críticas'}
                    </span>
                  </div>
                  <Badge variant={isBusy ? "destructive" : "default"} className="text-[10px]">
                    {isBusy ? "OCUPADO" : "DISPONIBLE"}
                  </Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="text-lg">Vehículos Recientes</CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">Resumen de los últimos ingresos al taller. Permite un acceso rápido al estado actual de las órdenes más nuevas.</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const vehicle = getVehicle(order.vehicleId);
              const client = getClient(order.clientId);
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-muted px-1 rounded text-muted-foreground">
                        #{order.id.slice(0, 8)}
                      </span>
                      <span className="font-medium">{vehicle?.plate}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {vehicle?.brand} {vehicle?.model} — {client?.name}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="secondary" className="text-[10px] h-5">
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{order.createdAt}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
