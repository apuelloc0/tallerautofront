import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS } from "@/types/workshop";
import { Search, Phone, Mail, Car, User } from "lucide-react";

export default function ClientsPage() {
  const { clients, vehicles, orders, getVehicle } = useWorkshop();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const clientVehicles = vehicles.filter((v) => v.clientId === c.id);
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      clientVehicles.some((v) => v.plate.toLowerCase().includes(q))
    );
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientVehicles = vehicles.filter((v) => v.clientId === selectedClientId);
  const clientOrders = orders.filter((o) => o.clientId === selectedClientId);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Clientes y Vehículos</h1>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar por nombre, teléfono o placa..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((client) => {
          const cvehicles = vehicles.filter((v) => v.clientId === client.id);
          return (
            <Card key={client.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedClientId(client.id)}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">
                    {client.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{client.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> {client.phone}</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {cvehicles.map((v) => (
                    <Badge key={v.id} variant="secondary" className="text-xs">{v.plate} {v.brand}</Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selectedClientId} onOpenChange={() => setSelectedClientId(null)}>
        <DialogContent className="max-w-lg">
          {selectedClient && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {selectedClient.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedClient.phone}</p>
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedClient.email}</p>
                  <p className="text-muted-foreground">{selectedClient.address}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2 flex items-center gap-1"><Car className="h-4 w-4" /> Vehículos</h4>
                  {clientVehicles.map((v) => (
                    <div key={v.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                      <span className="font-mono font-medium">{v.plate}</span>
                      <span>{v.brand} {v.model} ({v.year})</span>
                      <Badge variant="outline">{v.color}</Badge>
                    </div>
                  ))}
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold mb-2">Historial de Órdenes</h4>
                  {clientOrders.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sin órdenes registradas</p>
                  ) : (
                    clientOrders.map((o) => {
                      const v = getVehicle(o.vehicleId);
                      return (
                        <div key={o.id} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
                          <span>{v?.plate} — {o.faultDescription.slice(0, 30)}...</span>
                          <Badge variant="secondary">{STATUS_LABELS[o.status]}</Badge>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
