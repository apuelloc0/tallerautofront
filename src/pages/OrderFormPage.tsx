import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS, OrderStatus } from "@/types/workshop";
import { ArrowLeft, Save } from "lucide-react";
import { toast } from "sonner";

export default function OrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { orders, setOrders, clients, vehicles, technicians, getOrder, getVehicle, getClient } = useWorkshop();
  const isEditing = !!id && id !== "nueva";
  const existingOrder = isEditing ? getOrder(id) : null;

  const [form, setForm] = useState({
    vehicleId: existingOrder?.vehicleId || "",
    clientId: existingOrder?.clientId || "",
    technicianId: existingOrder?.technicianId || "",
    faultDescription: existingOrder?.faultDescription || "",
    diagnosis: existingOrder?.diagnosis || "",
    status: existingOrder?.status || ("ingresado" as OrderStatus),
  });

  const handleSave = () => {
    if (!form.vehicleId || !form.clientId || !form.technicianId) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    const now = new Date().toISOString().split("T")[0];
    if (isEditing && existingOrder) {
      setOrders((prev) =>
        prev.map((o) => (o.id === id ? { ...o, ...form, updatedAt: now } : o))
      );
      toast.success("Orden actualizada");
    } else {
      const newOrder = {
        id: `o${Date.now()}`,
        ...form,
        photos: [],
        notes: [],
        usedParts: [],
        createdAt: now,
        updatedAt: now,
      };
      setOrders((prev) => [...prev, newOrder]);
      toast.success("Orden creada");
    }
    navigate("/ordenes");
  };

  const clientVehicles = vehicles.filter((v) => v.clientId === form.clientId);

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/ordenes")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? "Editar Orden" : "Nueva Orden"}</h1>
      </div>

      <Card>
        <CardHeader><CardTitle>Datos del Cliente y Vehículo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={form.clientId} onValueChange={(v) => setForm((f) => ({ ...f, clientId: v, vehicleId: "" }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vehículo *</Label>
            <Select value={form.vehicleId} onValueChange={(v) => setForm((f) => ({ ...f, vehicleId: v }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar vehículo" /></SelectTrigger>
              <SelectContent>
                {clientVehicles.map((v) => (
                  <SelectItem key={v.id} value={v.id}>{v.plate} — {v.brand} {v.model}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Detalles de la Orden</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descripción de la falla *</Label>
            <Textarea value={form.faultDescription} onChange={(e) => setForm((f) => ({ ...f, faultDescription: e.target.value }))} placeholder="Describa la falla reportada por el cliente..." />
          </div>
          <div className="space-y-2">
            <Label>Diagnóstico preliminar</Label>
            <Textarea value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="Diagnóstico del técnico..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Técnico asignado *</Label>
              <Select value={form.technicianId} onValueChange={(v) => setForm((f) => ({ ...f, technicianId: v }))}>
                <SelectTrigger><SelectValue placeholder="Asignar técnico" /></SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name} ({t.specialty})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {Object.entries(STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fotos de Peritaje</Label>
            <div className="border-2 border-dashed rounded-lg p-8 text-center text-muted-foreground">
              <p className="text-sm">Arrastra fotos aquí o haz clic para seleccionar</p>
              <p className="text-xs mt-1">(Funcionalidad simulada — conectar con API)</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate("/ordenes")}>Cancelar</Button>
        <Button onClick={handleSave}>
          <Save className="h-4 w-4 mr-1" /> Guardar Orden
        </Button>
      </div>
    </div>
  );
}
