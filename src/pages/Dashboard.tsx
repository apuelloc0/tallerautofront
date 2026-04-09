import { Car, ClipboardList, DollarSign, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS } from "@/types/workshop";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const weeklyData = [
  { day: "Lun", completadas: 4 },
  { day: "Mar", completadas: 6 },
  { day: "Mié", completadas: 3 },
  { day: "Jue", completadas: 7 },
  { day: "Vie", completadas: 5 },
  { day: "Sáb", completadas: 2 },
];

export default function Dashboard() {
  const { orders, parts, technicians, getVehicle, getClient } = useWorkshop();

  const activeOrders = orders.filter((o) => o.status !== "listo_entrega").length;
  const todayVehicles = orders.filter((o) => o.status !== "listo_entrega").length;
  const availableTechs = technicians.filter((t) => t.available).length;
  const lowStockParts = parts.filter((p) => p.stock <= p.minStock);

  const kpis = [
    { title: "Vehículos Hoy", value: todayVehicles, icon: Car, color: "text-primary" },
    { title: "Órdenes Activas", value: activeOrders, icon: ClipboardList, color: "text-primary" },
    { title: "Ventas del Mes", value: "$2,450", icon: DollarSign, color: "text-success" },
    { title: "Técnicos Disponibles", value: `${availableTechs}/${technicians.length}`, icon: Users, color: "text-primary" },
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Productividad Semanal</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="day" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip />
                <Bar dataKey="completadas" fill="hsl(21, 90%, 48%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Alertas de Stock</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lowStockParts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alertas</p>
            ) : (
              lowStockParts.map((p) => (
                <div key={p.id} className="flex items-center justify-between">
                  <span className="text-sm">{p.name}</span>
                  <Badge variant="destructive" className="text-xs">{p.stock} uds</Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Vehículos Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentOrders.map((order) => {
              const vehicle = getVehicle(order.vehicleId);
              const client = getClient(order.clientId);
              return (
                <div key={order.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{vehicle?.plate}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      {vehicle?.brand} {vehicle?.model}
                    </span>
                    <span className="text-sm text-muted-foreground ml-2">— {client?.name}</span>
                  </div>
                  <Badge variant="secondary" className="text-xs">{STATUS_LABELS[order.status]}</Badge>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
