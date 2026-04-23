import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS, OrderStatus } from "@/types/workshop";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function OrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createOrder, updateOrder, clients, vehicles, technicians, getOrder } = useWorkshop();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!id && id !== "nueva";
  const existingOrder = isEditing ? getOrder(id) : null;

  const [form, setForm] = useState({
    vehicle_id: (existingOrder as any)?.vehicle_id || "",
    client_id: (existingOrder as any)?.client_id || "",
    technician_id: (existingOrder as any)?.technician_id || "",
    fault_description: (existingOrder as any)?.fault_description || "",
    diagnosis: existingOrder?.diagnosis || "",
    status: existingOrder?.status || ("ingresado" as OrderStatus),
    fuel_level: (existingOrder as any)?.fuel_level || "1/4",
    reception_checklist: (existingOrder as any)?.reception_checklist || {
      spareTire: false,
      jack: false,
      tools: false,
      radio: true,
      floorMats: true
    }
  });

  const handleSave = async () => {
    if (!form.vehicle_id || !form.client_id) {
      toast.error("Completa los campos obligatorios");
      return;
    }
    
    setIsSaving(true);
    try {
      if (isEditing) {
        await updateOrder(id, form);
        toast.success("Orden actualizada");
      } else {
        await createOrder(form);
        toast.success("Orden creada correctamente");
      }
      navigate("/ordenes");
    } catch (error) {
      toast.error("Error al guardar la orden");
    } finally {
      setIsSaving(false);
    }
  };

  const clientVehicles = vehicles.filter((v) => v.clientId === form.client_id);

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
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v, vehicle_id: "" }))}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vehículo *</Label>
            <Select value={form.vehicle_id} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))}>
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
        <CardHeader><CardTitle>Inventario de Recepción</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-muted-foreground">Elementos a bordo</Label>
              <div className="grid grid-cols-1 gap-2">
                {[
                  { id: "spareTire", label: "Llanta de repuesto" },
                  { id: "jack", label: "Gato / Herramientas" },
                  { id: "tools", label: "Estuche de herramientas" },
                  { id: "radio", label: "Radio / Pantalla" },
                  { id: "floorMats", label: "Tapetes" },
                ].map((item) => (
                  <div key={item.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={item.id} 
                      checked={(form.reception_checklist as any)[item.id]} 
                      onCheckedChange={(checked) => setForm({
                        ...form, 
                        reception_checklist: { ...form.reception_checklist, [item.id]: !!checked }
                      })}
                    />
                    <label htmlFor={item.id} className="text-sm font-medium leading-none cursor-pointer">
                      {item.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label>Nivel de Combustible</Label>
              <Select value={form.fuel_level} onValueChange={(v) => setForm({ ...form, fuel_level: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="E">Vacío (Reserva)</SelectItem>
                  <SelectItem value="1/4">1/4 de tanque</SelectItem>
                  <SelectItem value="1/2">1/2 tanque</SelectItem>
                  <SelectItem value="3/4">3/4 de tanque</SelectItem>
                  <SelectItem value="F">Lleno (Full)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Detalles de la Orden</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Descripción de la falla *</Label>
            <Textarea value={form.fault_description} onChange={(e) => setForm((f) => ({ ...f, fault_description: e.target.value }))} placeholder="Describa la falla reportada por el cliente..." />
          </div>
          <div className="space-y-2">
            <Label>Diagnóstico preliminar</Label>
            <Textarea value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="Diagnóstico del técnico..." />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Técnico asignado</Label>
              <Select value={form.technician_id} onValueChange={(v) => setForm((f) => ({ ...f, technician_id: v }))}>
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
        <Button variant="outline" onClick={() => navigate("/ordenes")} disabled={isSaving}>Cancelar</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
          Guardar Orden
        </Button>
      </div>
    </div>
  );
}