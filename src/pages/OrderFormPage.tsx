import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS, OrderStatus } from "@/types/workshop";
import { ArrowLeft, Save, Loader2, ImagePlus, X, FileImage, CheckCircle2, LayoutDashboard } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/api";
import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";

export default function OrderFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { createOrder, updateOrder, clients, vehicles, technicians, getOrder } = useWorkshop();
  const [isSaving, setIsSaving] = useState(false);
  const isEditing = !!id && id !== "nueva";
  const existingOrder = isEditing ? getOrder(id) : null;
  const isFinished = existingOrder?.status === 'entregado';

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
    },
    images: (existingOrder as any)?.images || []
  });

  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (form.images.length >= 3) {
      toast.error("Límite alcanzado: Máximo 3 fotos de peritaje por orden.");
      return;
    }

    const file = files[0];
    setIsUploading(true);

    try {
      // Opciones de compresión para ahorrar espacio en Supabase
      const options = {
        maxSizeMB: 0.8,            // Máximo 800KB (ideal para peritaje)
        maxWidthOrHeight: 1280,    // Redimensionar fotos 4K a HD
        useWebWorker: true,
      };

      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("image", compressedFile); 

      // Apuntamos al endpoint correcto en el controlador de órdenes
      const { data } = await api.post("/service-orders/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (data.ok) {
        setForm(f => ({ ...f, images: [...f.images, data.url] }));
        toast.success("Foto subida correctamente");
      }
    } catch (error) {
      toast.error("No se pudo subir la imagen");
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_: any, i: number) => i !== index) }));
  };

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
        {isFinished && <Badge className="bg-green-600 animate-in zoom-in duration-300">ORDEN FINALIZADA</Badge>}
      </div>

      <Card>
        <CardHeader><CardTitle>Datos del Cliente y Vehículo</CardTitle></CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Cliente *</Label>
            <Select value={form.client_id} onValueChange={(v) => setForm((f) => ({ ...f, client_id: v, vehicle_id: "" }))} disabled={isFinished}>
              <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
              <SelectContent>
                {clients.map((c) => (<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Vehículo *</Label>
            <Select value={form.vehicle_id} onValueChange={(v) => setForm((f) => ({ ...f, vehicle_id: v }))} disabled={isFinished}>
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
                      disabled={isFinished}
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
              <Select value={form.fuel_level} onValueChange={(v) => setForm({ ...form, fuel_level: v })} disabled={isFinished}>
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
            <Textarea value={form.fault_description} onChange={(e) => setForm((f) => ({ ...f, fault_description: e.target.value }))} placeholder="Describa la falla reportada por el cliente..." disabled={isFinished} />
          </div>
          <div className="space-y-2">
            <Label>Diagnóstico preliminar</Label>
            <Textarea value={form.diagnosis} onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))} placeholder="Diagnóstico del técnico..." disabled={isFinished} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Técnico asignado</Label>
              <Select value={form.technician_id} onValueChange={(v) => setForm((f) => ({ ...f, technician_id: v }))} disabled={isFinished}>
                <SelectTrigger><SelectValue placeholder="Asignar técnico" /></SelectTrigger>
                <SelectContent>
                  {technicians.map((t) => (<SelectItem key={t.id} value={t.id}>{t.name} ({t.specialty})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              {isFinished ? (
                <div className="h-10 px-3 py-2 rounded-xl border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900/50 flex items-center text-sm font-bold text-green-600 gap-2">
                  <CheckCircle2 className="h-4 w-4" /> Finalizado y Entregado
                </div>
              ) : (
                <Select 
                  value={form.status} 
                  onValueChange={(v) => setForm((f) => ({ ...f, status: v as OrderStatus }))}
                  disabled={!isEditing} 
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!isEditing && (
                <p className="text-[10px] text-muted-foreground italic ml-1">
                  Las órdenes nuevas inician automáticamente en "Ingresado".
                </p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Fotos de Peritaje</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {form.images.map((url: string, index: number) => (
                <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border bg-muted">
                  <img src={url} alt="Peritaje" className="object-cover w-full h-full" />
                  <button 
                    onClick={() => !isFinished && removeImage(index)}
                    className={cn("absolute top-1 right-1 bg-destructive text-destructive-foreground p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity", isFinished && "hidden")}
                    disabled={isFinished}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              
              {form.images.length < 3 && (
                <label className={cn(
                  "flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-xl cursor-pointer hover:bg-muted/50 transition-colors",
                (isUploading || isFinished) && "opacity-50 cursor-not-allowed"
              )}>
                {isUploading ? (
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImagePlus className="h-6 w-6 text-muted-foreground mb-1" />
                    <span className="text-[10px] text-muted-foreground font-medium uppercase">Subir Foto</span>
                  </>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={isUploading || isFinished} 
                />
              </label>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        {isFinished ? (
          <Button className="w-full sm:w-auto rounded-xl" onClick={() => navigate("/")}>
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Volver al Dashboard
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => navigate("/ordenes")} disabled={isSaving}>Cancelar</Button>
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              Guardar Orden
            </Button>
          </>
        )}
      </div>
    </div>
  );
}