import { useState } from "react";
import { DragDropContext, Droppable, Draggable, DropResult } from "@hello-pangea/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_COLUMNS, STATUS_LABELS, OrderStatus } from "@/types/workshop";
import { Clock, User } from "lucide-react";

export default function KanbanPage() {
  const { orders, updateOrderStatus, getVehicle, getTechnician } = useWorkshop();
  const [filterTech, setFilterTech] = useState("");

  const filteredOrders = filterTech
    ? orders.filter((o) => o.technicianId === filterTech)
    : orders;

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Pizarra Kanban</h1>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STATUS_COLUMNS.map((status) => {
            const columnOrders = filteredOrders.filter((o) => o.status === status);
            return (
              <div key={status} className="min-w-[260px] flex-shrink-0">
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
                          const tech = getTechnician(order.technicianId);
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
                                      <span className="font-bold text-sm">{vehicle?.plate}</span>
                                      <span className="text-xs text-muted-foreground">{vehicle?.brand}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground line-clamp-1">{order.faultDescription}</p>
                                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" /> {tech?.name?.split(" ")[0]}
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
