import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS, OrderStatus } from "@/types/workshop";
import { Plus, Search } from "lucide-react";

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
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filtered = orders.filter((o) => {
    const vehicle = getVehicle(o.vehicleId);
    const client = getClient(o.clientId);
    const matchesSearch =
      !search ||
      vehicle?.plate.toLowerCase().includes(search.toLowerCase()) ||
      client?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Órdenes de Trabajo</h1>
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Orden</TableHead>
                <TableHead>Placa</TableHead>
                <TableHead className="hidden md:table-cell">Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Técnico</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="hidden md:table-cell">Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const vehicle = getVehicle(order.vehicleId);
                const client = getClient(order.clientId);
                const tech = getTechnician(order.technicianId);
                return (
                  <TableRow
                    key={order.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => navigate(`/ordenes/${order.id}`)}
                  >
                    <TableCell className="font-medium">{order.id.toUpperCase()}</TableCell>
                    <TableCell className="font-mono">{vehicle?.plate}</TableCell>
                    <TableCell className="hidden md:table-cell">{client?.name}</TableCell>
                    <TableCell className="hidden md:table-cell">{tech?.name}</TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant(order.status)}>
                        {STATUS_LABELS[order.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{order.createdAt}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
