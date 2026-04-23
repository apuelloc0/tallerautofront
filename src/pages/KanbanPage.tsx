import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_COLUMNS, STATUS_LABELS, OrderStatus } from "@/types/workshop";
import { Clock, User, Search, Filter, CheckCircle2, Info, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function KanbanPage() {
  const { orders, updateOrderStatus, getVehicle, technicians } = useWorkshop();
  const [filterTech, setFilterTech] = useState("");
  const [searchPlate, setSearchPlate] = useState("");

  // Aplicamos filtros combinados: por Técnico y por Placa
  const filteredOrders = orders.filter((o) => {
    const vehicle = getVehicle(o.vehicleId);
    const matchesTech = filterTech === "all" || !filterTech || o.technicianId === filterTech;
    const matchesPlate = !searchPlate || vehicle?.plate.toLowerCase().includes(searchPlate.toLowerCase());
    return matchesTech && matchesPlate;
  });

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const newStatus = result.destination.droppableId as OrderStatus;
    updateOrderStatus(result.draggableId, newStatus);
  };

  const columnColors: Record<OrderStatus, string> = {
    ingresado: "border-t-muted-foreground",
    en_diagnostico: "border-t-warning",
    esperando_repuestos: "border-t-destructive",
    en_reparacion: "border-t-primary",
    listo_entrega: "border-t-success",
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Tablero de Control</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">Gestiona el flujo visualmente. Arrastra tarjetas para cambiar estados y usa el check para finalizar servicios.</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar placa..." 
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={filterTech} onValueChange={setFilterTech}>
            <SelectTrigger className="w-full sm:w-48">
              <div className="flex items-center gap-2"><Filter className="h-3.5 w-3.5" /><SelectValue placeholder="Técnico" /></div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos los técnicos</SelectItem>
              {technicians.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-wrap gap-6 pb-8 items-start">
          {STATUS_COLUMNS.map((status) => {
            const columnOrders = filteredOrders.filter((o) => o.status === status);
            return (
              <div key={status} className="flex-1 min-w-[280px] max-w-full md:max-w-[350px]">
                <div className={`rounded-lg border border-t-4 ${columnColors[status]} bg-muted/30 p-3`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
                    <Badge variant="secondary" className="text-xs">{columnOrders.length}</Badge>
                  </div>
                  <Droppable droppableId={status}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="space-y-2 min-h-[120px]"
                      >
                        {columnOrders.map((order, index) => {
                          const vehicle = getVehicle(order.vehicleId);
                          return (
                            <Draggable key={order.id} draggableId={order.id} index={index}>
                              {(provided, snapshot) => (
                                <Card
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`cursor-grab active:cursor-grabbing ${
                                    snapshot.isDragging ? "shadow-lg ring-2 ring-primary" : ""
                                  }`}
                                >
                                  <CardContent className="p-3 space-y-2">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <span className="font-bold text-sm tracking-tighter">{vehicle?.plate}</span>
                                        {order.diagnosis?.includes("[REVISIÓN REQUERIDA]") && (
                                          <TooltipProvider>
                                            <Tooltip>
                                              <TooltipTrigger asChild>
                                                <AlertCircle className="h-3.5 w-3.5 text-orange-500 animate-pulse cursor-help" />
                                              </TooltipTrigger>
                                              <TooltipContent>Técnico solicita veredicto final</TooltipContent>
                                            </Tooltip>
                                          </TooltipProvider>
                                        )}
                                      </div>
                                      {status === "listo_entrega" && (
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          className="h-6 w-6 text-green-600 hover:text-green-700 hover:bg-green-50"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateOrderStatus(order.id, "entregado" as OrderStatus);
                                            toast.success("Vehículo entregado. La orden ahora está en el historial.");
                                          }}
                                          title="Marcar como Entregado"
                                        >
                                          <CheckCircle2 className="h-4 w-4" />
                                        </Button>
                                      )}
                                      {status !== "listo_entrega" && <span className="text-xs text-muted-foreground">{vehicle?.brand}</span>}
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{order.faultDescription}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" /> {(order.technicianName || "S/A").split(" ")[0]}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {order.createdAt}
                                      </span>
                                    </div>
                                  </CardContent>
                                </Card>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}
