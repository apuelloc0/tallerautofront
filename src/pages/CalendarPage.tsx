import { useMemo, useState } from "react";
import { useWorkshop } from "@/context/WorkshopContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, ArrowLeft, Car, LogOut, LogIn, ChevronRight } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { STATUS_LABELS } from "@/types/workshop";

export default function CalendarPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { orders, getVehicle, getClient } = useWorkshop();
  
  // Estado para el día seleccionado (por defecto hoy o lo que venga del dashboard)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    location.state?.initialDate ? new Date(location.state.initialDate + 'T00:00:00') : new Date()
  );

  const dateKey = useMemo(() => selectedDate?.toLocaleDateString('en-CA'), [selectedDate]);

  // Órdenes que ingresaron este día
  const entries = useMemo(() => 
    orders.filter(o => o.createdAt === dateKey), [orders, dateKey]);

  // Órdenes que se entregaron este día
  const exits = useMemo(() => 
    orders.filter(o => o.status === 'entregado' && o.updatedAt === dateKey), [orders, dateKey]);

  // Datos para los puntos indicadores del calendario
  const activityMap = useMemo(() => {
    const map: Record<string, { entry: boolean, exit: boolean }> = {};
    orders.forEach(o => {
      if (o.createdAt) {
        if (!map[o.createdAt]) map[o.createdAt] = { entry: false, exit: false };
        map[o.createdAt].entry = true;
      }
      if (o.status === 'entregado' && o.updatedAt) {
        if (!map[o.updatedAt]) map[o.updatedAt] = { entry: false, exit: false };
        map[o.updatedAt].exit = true;
      }
    });
    return map;
  }, [orders]);

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" /> Historial de Movimientos
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Cronograma de ingresos y salidas del taller</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendario Lateral */}
        <Card className="lg:col-span-4 border-none shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] p-4 flex justify-center">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="p-0"
            modifiers={{
              hasEntry: (date) => activityMap[date.toLocaleDateString('en-CA')]?.entry,
              hasExit: (date) => activityMap[date.toLocaleDateString('en-CA')]?.exit,
            }}
            modifiersStyles={{
              hasEntry: { fontWeight: 'bold', color: 'hsl(var(--primary))', textDecoration: 'underline' },
              hasExit: { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderRadius: '50%' }
            }}
          />
        </Card>

        {/* Detalle del Día Seleccionado */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between bg-primary/10 p-4 rounded-3xl border border-primary/20">
            <div className="flex flex-col">
              <span className="text-[10px] font-black uppercase tracking-widest text-primary/70">Fecha Seleccionada</span>
              <span className="text-xl font-bold">{selectedDate?.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-background/50">{entries.length} Entradas</Badge>
              <Badge variant="outline" className="bg-background/50 border-green-500/30 text-green-600">{exits.length} Salidas</Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Columna de Entradas */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-2">
                <LogIn className="h-3 w-3 text-primary" /> Ingresos de Vehículos
              </h3>
              {entries.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-3xl opacity-40 text-xs">No hubo ingresos</div>
              ) : entries.map(order => (
                <OrderCard key={order.id} order={order} type="entry" getVehicle={getVehicle} getClient={getClient} navigate={navigate} />
              ))}
            </div>

            {/* Columna de Salidas */}
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 ml-2">
                <LogOut className="h-3 w-3 text-green-500" /> Vehículos Entregados
              </h3>
              {exits.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed rounded-3xl opacity-40 text-xs">No hubo entregas</div>
              ) : exits.map(order => (
                <OrderCard key={order.id} order={order} type="exit" getVehicle={getVehicle} getClient={getClient} navigate={navigate} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrderCard({ order, type, getVehicle, getClient, navigate }: any) {
  const v = getVehicle(order.vehicleId);
  const c = getClient(order.clientId);

  return (
    <Card 
      className={cn(
        "group cursor-pointer border-none shadow-sm transition-all active:scale-95 rounded-2xl overflow-hidden",
        type === 'entry' ? "hover:bg-primary/5" : "hover:bg-green-500/5"
      )}
      onClick={() => navigate(`/ordenes/${order.id}`)}
    >
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-xl", type === 'entry' ? "bg-primary/10" : "bg-green-500/10")}>
            <Car className={cn("h-4 w-4", type === 'entry' ? "text-primary" : "text-green-600")} />
          </div>
          <div className="flex flex-col">
            <span className="font-mono font-bold text-sm">{v?.plate || 'S/P'}</span>
            <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[120px]">{c?.name || 'Cliente'}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-[8px] uppercase tracking-tighter">{STATUS_LABELS[order.status]}</Badge>
          <ChevronRight className="h-4 w-4 opacity-20 group-hover:opacity-100 transition-opacity" />
        </div>
      </CardContent>
    </Card>
  );
}