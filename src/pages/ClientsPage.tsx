import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS } from "@/types/workshop";
import { Search, Phone, Mail, Car, User, Plus, Info, MessageCircle, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ClientsPage() {
  const { clients, vehicles, orders, getVehicle, addClient, addVehicle, workshop } = useWorkshop();
  const [search, setSearch] = useState("");
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [isAddingClient, setIsAddingClient] = useState(false);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Formulario unificado para Cliente + Vehículo Inicial
  const [newClientForm, setNewClientForm] = useState({ 
    first_name: "", 
    last_name: "",
    phone: "", 
    email: "", 
    address: "",
    plate: "", // Campo para el vehículo
    brand: "", // Campo para el vehículo
    model: ""  // Campo para el vehículo
  });

  const [newVehicleForm, setNewVehicleForm] = useState({ plate: "", brand: "", model: "", year: new Date().getFullYear(), color: "" });

  const filtered = clients.filter((c) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const clientVehicles = vehicles.filter((v) => v.clientId === c.id);
    return (
      (c.name || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q) ||
      clientVehicles.some((v) => v.plate?.toLowerCase().includes(q))
    );
  });

  const selectedClient = clients.find((c) => c.id === selectedClientId);
  const clientVehicles = vehicles.filter((v) => v.clientId === selectedClientId);
  const clientOrders = orders.filter((o) => o.clientId === selectedClientId);

  const handleAddClient = async () => {
    if (!newClientForm.first_name || !newClientForm.phone || !newClientForm.plate) {
      toast.error("Nombre, teléfono y placa del vehículo son obligatorios");
      return;
    }
    setIsSaving(true);
    try {
      // 1. Registramos al cliente
      const clientData = {
        first_name: newClientForm.first_name,
        last_name: newClientForm.last_name,
        phone: newClientForm.phone,
        email: newClientForm.email,
        address: newClientForm.address
      };
      const createdClient = await addClient(clientData);

      // 2. Registramos su primer vehículo automáticamente usando el ID devuelto por la API
      await addVehicle({
        plate: newClientForm.plate,
        brand: newClientForm.brand,
        model: newClientForm.model,
        year: new Date().getFullYear(),
        color: "N/A",
        clientId: createdClient.id
      });

      toast.success("Cliente y vehículo registrados con éxito");
      setIsAddingClient(false);
      setNewClientForm({ 
        first_name: "", last_name: "", phone: "", email: "", address: "", 
        plate: "", brand: "", model: "" 
      });
    } catch (error) {
      toast.error("Error al completar el registro");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddVehicle = async () => {
    if (!newVehicleForm.plate || !newVehicleForm.brand || !selectedClientId) {
      toast.error("Placa y marca son obligatorios");
      return;
    }
    setIsSaving(true);
    try {
      await addVehicle({ ...newVehicleForm, clientId: selectedClientId });
      toast.success("Vehículo registrado con éxito");
      setIsAddingVehicle(false);
      setNewVehicleForm({ plate: "", brand: "", model: "", year: new Date().getFullYear(), color: "" });
    } catch (error) {
      toast.error("Error al registrar vehículo");
    } finally {
      setIsSaving(false);
    }
  };

  const handleWhatsApp = (phone: string, name: string) => {
    let cleanPhone = phone.replace(/\D/g, ""); // Solo números
    // Si tiene 10 dígitos (formato estándar CO), agregamos el prefijo de país automáticamente
    if (cleanPhone.length === 10) {
      cleanPhone = "57" + cleanPhone;
    }
    const message = `Hola ${name}, te escribimos del taller ${workshop?.name || 'AutoTaller'} para informarte sobre el estado de tu vehículo...`;
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Clientes y Vehículos</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">Directorio centralizado. Gestiona contactos, vehículos registrados y el historial de servicios de cada cliente.</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Button onClick={() => setIsAddingClient(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo Cliente
        </Button>
      </div>

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
                    {(client.name || "??").split(" ").map((n) => n[0]).join("").slice(0, 2)}
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
                <DialogDescription>Detalles de contacto y vehículos asociados.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="flex items-center gap-2"><Phone className="h-4 w-4 text-muted-foreground" /> {selectedClient.phone}</p>
                    <Button size="xs" variant="outline" className="h-7 text-[10px] gap-1" onClick={() => handleWhatsApp(selectedClient.phone, selectedClient.name)}>
                      <MessageCircle className="h-3 w-3 text-green-600" /> WhatsApp
                    </Button>
                  </div>
                  <p className="flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {selectedClient.email}</p>
                  <p className="text-muted-foreground">{selectedClient.address}</p>
                </div>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold flex items-center gap-1"><Car className="h-4 w-4" /> Vehículos</h4>
                    <Button size="sm" variant="ghost" onClick={() => setIsAddingVehicle(true)}>
                      <Plus className="h-3 w-3 mr-1" /> Agregar
                    </Button>
                  </div>
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
                          <span>{v?.plate} — {o.faultDescription?.slice(0, 30)}...</span>
                          <Badge variant="secondary">{STATUS_LABELS[o.status] || o.status}</Badge>
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

      {/* Diálogo para nuevo cliente */}
      <Dialog open={isAddingClient} onOpenChange={setIsAddingClient}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo Cliente y Vehículo</DialogTitle>
            <DialogDescription>Registra los datos del cliente y su primer vehículo en un solo paso.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <h4 className="text-sm font-bold border-b pb-1">Datos personales</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input value={newClientForm.first_name} onChange={(e) => setNewClientForm({...newClientForm, first_name: e.target.value})} placeholder="Ej: Juan" />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input value={newClientForm.last_name} onChange={(e) => setNewClientForm({...newClientForm, last_name: e.target.value})} placeholder="Ej: Pérez" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Teléfono *</Label>
                <Input 
                  value={newClientForm.phone} 
                  onChange={(e) => {
                    const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                    let formatted = raw;
                    if (raw.length > 3 && raw.length <= 6) formatted = `${raw.slice(0, 3)} ${raw.slice(3)}`;
                    else if (raw.length > 6 && raw.length <= 10) formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
                    else if (raw.length > 10) formatted = `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7)}`;
                    setNewClientForm({...newClientForm, phone: formatted});
                  }} 
                  placeholder="Ej: 312 456 7890" 
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input value={newClientForm.email} onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})} placeholder="juan@correo.com" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input value={newClientForm.address} onChange={(e) => setNewClientForm({...newClientForm, address: e.target.value})} placeholder="Calle Principal #123" />
            </div>

            <h4 className="text-sm font-bold border-b pb-1 pt-2">Datos del vehículo</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Placa / Patente *</Label>
                <Input value={newClientForm.plate} onChange={(e) => setNewClientForm({...newClientForm, plate: e.target.value})} placeholder="ABC-123" />
              </div>
              <div className="space-y-2">
                <Label>Marca</Label>
                <Input value={newClientForm.brand} onChange={(e) => setNewClientForm({...newClientForm, brand: e.target.value})} placeholder="Toyota" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingClient(false)} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleAddClient} disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Guardar Cliente
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para nuevo vehículo */}
      <Dialog open={isAddingVehicle} onOpenChange={setIsAddingVehicle}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Vehículo para {selectedClient?.name}</DialogTitle>
            <DialogDescription>Añade un nuevo vehículo a la cuenta de este cliente.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="space-y-2">
              <Label>Placa / Patente *</Label>
              <Input value={newVehicleForm.plate} onChange={(e) => setNewVehicleForm({...newVehicleForm, plate: e.target.value})} placeholder="ABC-123" />
            </div>
            <div className="space-y-2">
              <Label>Marca *</Label>
              <Input value={newVehicleForm.brand} onChange={(e) => setNewVehicleForm({...newVehicleForm, brand: e.target.value})} placeholder="Toyota" />
            </div>
            <div className="space-y-2">
              <Label>Modelo</Label>
              <Input value={newVehicleForm.model} onChange={(e) => setNewVehicleForm({...newVehicleForm, model: e.target.value})} placeholder="Corolla" />
            </div>
            <div className="space-y-2">
              <Label>Año</Label>
              <Input type="number" value={newVehicleForm.year} onChange={(e) => setNewVehicleForm({...newVehicleForm, year: +e.target.value})} />
            </div>
            <div className="col-span-2 space-y-2">
              <Label>Color</Label>
              <Input value={newVehicleForm.color} onChange={(e) => setNewVehicleForm({...newVehicleForm, color: e.target.value})} placeholder="Gris Plata" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddingVehicle(false)}>Cancelar</Button>
            <Button onClick={handleAddVehicle}>Guardar Vehículo</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
