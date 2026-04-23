import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS, OrderStatus } from "@/types/workshop";
import { Plus, Search, Info, Calendar, X } from "lucide-react";

const statusBadgeVariant = (status: OrderStatus) => {
  switch (status) {
    case "listo_entrega": return "default" as const;
    case "esperando_repuestos": return "destructive" as const;
    default: return "secondary" as const;
  }
};

export default function OrdersPage() {
  const { orders, getVehicle, getClient, getTechnician } = useWorkshop();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>(location.state?.filterDate || "");
  const [activeTab, setActiveTab] = useState(location.state?.filterDate ? "history" : "active");

  // Limpiamos el estado de navegación para que el filtro no persista al recargar manualmente
  useEffect(() => {
    if (location.state?.filterDate) {
      window.history.replaceState({}, document.title);
    }
  }, []);

  const filtered = orders.filter((o) => {
    const vehicle = getVehicle(o.vehicleId);
    const client = getClient(o.clientId);
    const matchesSearch =
      !search ||
      vehicle?.plate.toLowerCase().includes(search.toLowerCase()) ||
      client?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    const orderDate = o.updatedAt || o.createdAt;
    const matchesDate = !dateFilter || orderDate === dateFilter;

    return matchesSearch && matchesStatus && matchesDate;
  });

  // Dividimos las órdenes filtradas por su estado terminal
  const activeOrders = filtered.filter(o => o.status !== 'entregado');
  const historyOrders = filtered.filter(o => o.status === 'entregado');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent><p className="max-w-xs">Gestión centralizada de servicios. Permite el seguimiento detallado de reparaciones, desde el diagnóstico inicial hasta la entrega final del vehículo.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button onClick={() => navigate("/ordenes/nueva")}>
          <Plus className="h-4 w-4 mr-1" /> Nueva Orden
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por placa o cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            {dateFilter && (
              <Badge variant="outline" className="h-10 px-3 flex gap-2 bg-primary/5 border-primary/20 animate-in fade-in zoom-in duration-200">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-medium">Filtrando: {dateFilter}</span>
                <button onClick={() => setDateFilter("")} className="ml-1 hover:text-destructive transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </Badge>
            )}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                {Object.entries(STATUS_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
                <TabsTrigger value="active">En Proceso ({activeOrders.length})</TabsTrigger>
                <TabsTrigger value="history">Historial ({historyOrders.length})</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value="active" className="mt-0 border-t">
              <OrderTable 
                orders={activeOrders} 
                getVehicle={getVehicle} 
                getClient={getClient} 
                getTechnician={getTechnician} 
                navigate={navigate} 
              />
            </TabsContent>
            
            <TabsContent value="history" className="mt-0 border-t">
              <OrderTable 
                orders={historyOrders} 
                getVehicle={getVehicle} 
                getClient={getClient} 
                getTechnician={getTechnician} 
                navigate={navigate} 
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function OrderTable({ orders, getVehicle, getClient, getTechnician, navigate }: any) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Orden</TableHead>
          <TableHead>Placa</TableHead>
          <TableHead className="hidden md:table-cell">Cliente</TableHead>
          <TableHead className="hidden md:table-cell">Técnico</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead className="hidden md:table-cell text-right">Fecha</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
              No se encontraron órdenes en esta categoría.
            </TableCell>
          </TableRow>
        ) : (
          orders.map((order: any) => {
            const vehicle = getVehicle(order.vehicleId);
            const client = getClient(order.clientId);
            const tech = getTechnician(order.technicianId);
            return (
              <TableRow
                key={order.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => navigate(`/ordenes/${order.id}`)}
              >
                <TableCell className="font-medium">#{order.id.slice(0, 8).toUpperCase()}</TableCell>
                <TableCell className="font-mono">{vehicle?.plate}</TableCell>
                <TableCell className="hidden md:table-cell">{client?.name}</TableCell>
                <TableCell className="hidden md:table-cell">{order.technicianName || tech?.name || "Sin asignar"}</TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant(order.status)}>
                    {STATUS_LABELS[order.status] || order.status}
                  </Badge>
                </TableCell>
                <TableCell className="hidden md:table-cell text-right">{order.createdAt}</TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </Table>
  );
}
