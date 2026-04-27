import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import imageCompression from "browser-image-compression";
import api from "@/api/api";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useWorkshop } from "@/context/WorkshopContext";
import { useAuth } from "@/context/AuthContext";
import { STATUS_LABELS, STATUS_COLUMNS, OrderStatus } from "@/types/workshop";
import { Wrench, Clock, MessageSquarePlus, Package, ChevronRight, LogOut, ArrowLeft, Sun, Moon, Info, Trash2, RefreshCw, CheckCircle2, Phone, Menu, Loader2, ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function TechnicianPage() {
  const { orders, getVehicle, getClient, parts, updateOrderStatus, updateOrder, addPartToOrder, removePartFromOrder, refreshData } = useWorkshop();
  const { user, logout, canAccess } = useAuth(); // Obtenemos el técnico logueado y utilidades de acceso
  const navigate = useNavigate();
  const [noteDialog, setNoteDialog] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [partDialog, setPartDialog] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [isFinishing, setIsFinishing] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const handleImageUpload = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const order = orders.find(o => o.id === orderId);
    if (order && (order as any).images?.length >= 3) {
      toast.error("Máximo 3 fotos por orden.");
      return;
    }

    const file = files[0];
    setIsUploading(orderId);

    try {
      const options = { maxSizeMB: 0.8, maxWidthOrHeight: 1280, useWebWorker: true };
      const compressedFile = await imageCompression(file, options);

      const formData = new FormData();
      formData.append("image", compressedFile); 

      const { data } = await api.post("/service-orders/upload-image", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });

      if (data.ok) {
        const currentImages = (order as any).images || [];
        await updateOrder(orderId, { ...order, images: [...currentImages, data.url] });
        toast.success("Foto añadida a la orden");
      }
    } catch (error) {
      toast.error("Error al subir imagen");
    } finally {
      setIsUploading(null);
    }
  };

  // Formateador COP consistente
  const formatCOP = (v: number) => 
    new Intl.NumberFormat('es-CO', { 
      style: 'currency', currency: 'COP', maximumFractionDigits: 0 
    }).format(v);

  // Lógica de tema para la vista técnica
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("workshop-theme");
    if (savedTheme) return savedTheme === "dark";
    return document.documentElement.classList.contains("dark");
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("workshop-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("workshop-theme", "light");
    }
  }, [isDark]);

  // Lógica de filtrado e identificación de rol:
  const isAdmin = user?.role === 'admin' || user?.role === 'ADMINISTRADOR' || user?.role === 'SUPER_ADMIN';

  // - Si es ADMIN: Ve TODAS las órdenes activas (Supervisión de patio)
  // - Si es TÉCNICO: Solo ve las asignadas a él
  const techOrders = orders.filter((o) => 
    (isAdmin || o.technicianId === user?.id) && 
    o.status !== "listo_entrega" &&
    o.status !== "entregado"
  );

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshData();
      toast.success("Datos actualizados");
    } finally {
      setIsRefreshing(false);
    }
  };

  const openNoteDialog = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    setNoteText(order?.diagnosis || "");
    setNoteDialog(orderId);
  };

  const addNote = async () => {
    if (!noteText.trim() || !noteDialog) return;
    try {
      const order = orders.find(o => o.id === noteDialog);
      if (!order) return; 
      
      // Usamos updateOrder para guardar el nuevo diagnóstico/nota en la DB
      await updateOrder(noteDialog, { ...order, diagnosis: noteText });
      
      toast.success("Nota/Diagnóstico actualizado en el servidor");
      setNoteDialog(null);
      setNoteText("");
    } catch (e) {
      toast.error("Error al guardar la nota");
    }
  };

  const addPart = async () => {
    if (!partDialog) return;

    if (!selectedPartId) {
      toast.error("Por favor, selecciona un repuesto de la lista");
      return;
    }

    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) {
      toast.error("El repuesto seleccionado no se encontró en el inventario local");
      return;
    }

    if (part.stock < partQty) {
      toast.error(`Stock insuficiente. Solo quedan ${part.stock} unidades de ${part.name}.`);
      return;
    }

    try {
      if (!confirm(`¿Confirmas que usarás ${partQty} unidad(es) de ${part.name}?`)) return;

      await addPartToOrder(partDialog, selectedPartId, partQty);
      toast.success("Repuesto registrado y descontado del stock");
      setPartDialog(null);
      setSelectedPartId("");
      setPartQty(1);
    } catch (e: any) {
      console.error("Error al asignar repuesto:", e);
      const errorMsg = e.response?.data?.message || "No se pudo conectar con el servidor para registrar el repuesto";
      toast.error(errorMsg);
    }
  };

  const handleRemovePart = async (orderId: string, itemId: string, partId: string, qty: number, name: string) => {
    if (!confirm(`¿Eliminar ${name} de esta orden? El stock se devolverá al almacén.`)) return;
    try {
      await removePartFromOrder(orderId, itemId, partId, qty);
      toast.success("Repuesto removido y stock restaurado");
    } catch (e) {
      toast.error("No se pudo eliminar el repuesto");
    }
  };

  const handleRequestAdminReview = async (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;
    
    if (!confirm("¿Confirmas que el trabajo está terminado? Se notificará al administrador para que de el veredicto final de entrega.")) return;
    
    setIsFinishing(orderId);
    try {
      // Generamos una marca de tiempo para la bitácora
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const isOwner = isAdmin;
      const statusText = isOwner ? 'AUTORIZADO' : 'FINALIZADO';
      const systemNote = `[REVISIÓN REQUERIDA] ✅ ${time} - El ${isOwner ? 'Administrador' : 'Técnico'} ${user?.name} ha marcado el trabajo como ${statusText}.`;
      const newDiagnosis = order.diagnosis ? `${order.diagnosis}\n\n${systemNote}` : systemNote;

      await updateOrder(orderId, { ...order, diagnosis: newDiagnosis, status: 'listo_entrega' as OrderStatus });
      toast.success(isOwner ? "Orden movida a lista para entrega." : "Notificación enviada al administrador.");
    } catch (e) {
      toast.error("No se pudo enviar la solicitud de revisión");
    } finally {
      setIsFinishing(null);
    }
  };

  const handleFinalizeOrder = async (orderId: string) => {
    if (!confirm("¿Confirmas que el vehículo ha sido entregado al cliente? Esta acción cerrará la orden.")) return;
    try {
      await updateOrderStatus(orderId, "entregado" as OrderStatus);
      toast.success("Vehículo entregado. La orden ha sido cerrada.");
    } catch (e) {
      toast.error("No se pudo finalizar la orden.");
    }
  };

  const advanceStatus = (orderId: string, current: OrderStatus) => {
    const idx = STATUS_COLUMNS.indexOf(current);
    if (idx < STATUS_COLUMNS.length - 1) {
      const nextStatus = STATUS_COLUMNS[idx + 1];

      // Bloqueo visual de seguridad para el técnico
      if (nextStatus === 'listo_entrega' && !['ADMINISTRADOR', 'SUPER_ADMIN'].includes(user?.role || '')) {
        toast.error("La entrega final requiere autorización del Administrador.");
        return;
      }

      updateOrderStatus(orderId, STATUS_COLUMNS[idx + 1]);
      toast.success(`Estado cambiado a: ${STATUS_LABELS[STATUS_COLUMNS[idx + 1]]}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first header */}
      <header className="sticky top-0 z-[60] bg-primary/95 text-primary-foreground backdrop-blur-md px-4 py-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/taller.png" alt="Logo" className="h-10 w-10 object-contain shrink-0" />
            <div className="flex flex-col min-w-0">
              <h1 className="text-sm font-bold leading-none tracking-tight truncate">{isAdmin ? 'Supervisión de Patio' : 'Hoja de Trabajo'}</h1>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] opacity-80 font-medium truncate max-w-[120px]">
                  Usuario: {user?.name}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 opacity-60 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="bg-popover text-popover-foreground border shadow-md">
                      <p className="text-xs">Actualiza diagnósticos y registra repuestos para la facturación final.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-0.5">
            <Button 
              variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-white/10 transition-colors"
              onClick={handleManualRefresh} disabled={isRefreshing} title="Sincronizar"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-primary-foreground hover:bg-white/10 transition-colors"
              onClick={() => setIsDark(!isDark)} title="Cambiar tema"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-primary-foreground hover:bg-white/10 transition-colors">
                  <Menu className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl mt-2 border-primary/10">
                <DropdownMenuLabel className="text-[10px] uppercase tracking-widest text-muted-foreground px-3 py-2">Acciones</DropdownMenuLabel>
                <DropdownMenuSeparator className="opacity-40" />
                {canAccess("/") && (
                  <DropdownMenuItem onClick={() => navigate("/")} className="gap-2 py-2.5 cursor-pointer">
                    <ArrowLeft className="h-4 w-4" /> Regresar al Panel
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={() => { logout(); navigate("/login"); }} 
                  className="text-destructive focus:text-destructive gap-2 py-2.5 cursor-pointer"
                >
                  <LogOut className="h-4 w-4" /> Salir del Sistema
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="p-4 space-y-3 pb-32">
        {techOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground flex flex-col items-center justify-center min-h-[50vh]">
            <img 
              src="/taller.png" 
              alt="Logo" 
              className="w-[10rem] h-[10rem] md:w-[15rem] md:h-[15rem] mx-auto mb-6 opacity-10 grayscale object-contain" 
            />
            <p className="text-lg font-medium opacity-50">Sin tareas asignadas</p>
          </div>
        ) : (
          techOrders.map((order) => {
            const vehicle = getVehicle(order.vehicleId);
            const client = getClient(order.clientId);
            return (
              <Card key={order.id}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold font-mono">{vehicle?.plate}</span>
                      <div className="flex flex-col">
                        <span className="text-xs text-muted-foreground">{vehicle?.brand} {vehicle?.model} — {client?.name}</span>
                        {client?.phone && (
                          <span className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5"><Phone className="h-3 w-3" /> {client.phone}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant="secondary">{STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.faultDescription}</p>
                  {order.diagnosis && (
                    <p className="text-xs italic text-primary/80 bg-primary/5 p-2 rounded border-l-2 border-primary line-clamp-3">Bitácora: {order.diagnosis}</p>
                  )}
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Ingreso: {order.createdAt}
                  </div>

                  <div className="flex gap-2 flex-wrap pt-2">
                    {order.status === 'en_reparacion' && !isAdmin && (
                      <Button 
                        size="sm" 
                        className="bg-green-600 hover:bg-green-700" 
                        onClick={() => handleRequestAdminReview(order.id)}
                        disabled={isFinishing === order.id}
                      >
                        {isFinishing === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} 
                        Terminar Trabajo
                      </Button>
                    )}

                    {order.status === 'listo_entrega' && isAdmin && (
                      <Button 
                        size="sm" 
                        className="bg-primary hover:bg-primary/90" 
                        onClick={() => handleFinalizeOrder(order.id)}
                        disabled={isFinishing === order.id}
                      >
                        {isFinishing === order.id ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />} 
                        Finalizar Orden
                      </Button>
                    )}

                    <Select 
                      value={order.status} 
                      onValueChange={(newVal) => {
                        if (newVal === 'listo_entrega' && !isAdmin) {
                          toast.error("Usa el botón 'Terminar Trabajo' para finalizar.");
                          return;
                        }
                        if (newVal === 'entregado' && !isAdmin) {
                          toast.error("Solo un administrador puede marcar la orden como entregada.");
                          return;
                        }
                        updateOrderStatus(order.id, newVal as OrderStatus);
                        toast.success(`Estado actualizado a: ${STATUS_LABELS[newVal as OrderStatus]}`);
                      }}
                    >
                      <SelectTrigger className="h-9 w-[160px] text-xs">
                        <SelectValue placeholder="Cambiar estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_LABELS)
                          .filter(([key]) => {
                            if (isAdmin) return true;
                            return key !== 'entregado' && key !== 'listo_entrega';
                          })
                          .map(([key, label]) => (
                            <SelectItem key={key} value={key}>{label}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>

                    <Button size="sm" variant="outline" onClick={() => openNoteDialog(order.id)}>
                      <MessageSquarePlus className="h-4 w-4 mr-1" /> Nota
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPartDialog(order.id)}>
                      <Package className="h-4 w-4 mr-1" /> Repuesto
                    </Button>
                  </div>

                  {/* Sección de fotos para el técnico */}
                  <div className="pt-2 border-t">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground mb-2">Fotos de Peritaje ({order.images?.length || 0}/3):</p>
                    <div className="grid grid-cols-4 gap-2">
                      {order.images?.map((url: string, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border">
                          <img src={url} className="object-cover w-full h-full" alt="Peritaje" />
                        </div>
                      ))}
                      {(!order.images || order.images.length < 3) && (
                        <label className={cn(
                          "flex flex-col items-center justify-center aspect-square border-2 border-dashed rounded-lg cursor-pointer hover:bg-muted transition-colors",
                          isUploading === order.id && "opacity-50 pointer-events-none"
                        )}>
                          {isUploading === order.id ? (
                            <Loader2 className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <ImagePlus className="h-4 w-4 text-muted-foreground" />
                          )}
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={(e) => handleImageUpload(order.id, e)}
                            disabled={!!isUploading}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Repuestos ya cargados a esta orden */}
                  {(order.usedParts?.length || 0) > 0 && (
                    <div className="pt-2 border-t space-y-1 bg-muted/20 p-2 rounded-md">
                      <div className="flex justify-between items-center mb-1">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Repuestos instalados:</p>
                        <span className="text-[10px] font-bold text-primary">
                          Total: {formatCOP((order.usedParts || []).reduce((s, p) => s + (p.unitPrice * p.quantity), 0))}
                        </span>
                      </div>
                      {order.usedParts.map((p, idx) => (
                        <div key={p.id} className="flex justify-between text-xs items-center">
                          <span>{p.quantity}x {p.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground font-mono">{formatCOP(p.unitPrice * p.quantity)}</span>
                            <Button 
                              variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                              onClick={() => handleRemovePart(order.id, p.id, p.partId, p.quantity, p.name)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {(order.notes?.length || 0) > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      {(order.notes || []).slice(-2).map((n) => (
                        <p key={n.id} className="text-xs text-muted-foreground">
                          <span className="font-medium">{n.date}:</span> {n.text}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add note dialog */}
      <Dialog open={!!noteDialog} onOpenChange={() => setNoteDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Nota</DialogTitle>
            <DialogDescription>Añade un diagnóstico o nota adicional sobre el estado de este vehículo.</DialogDescription>
          </DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Escribe una nota..." />
          <DialogFooter>
            <Button onClick={addNote}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add part dialog */}
      <Dialog open={!!partDialog} onOpenChange={() => setPartDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Repuesto Usado</DialogTitle>
            <DialogDescription>Selecciona el repuesto del almacén y la cantidad instalada en el vehículo.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Repuesto</Label>
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {parts
                    .filter(p => p.stock > 0)
                    .map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.name} - {formatCOP(p.price)} (Stock: {p.stock})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input 
                type="number" 
                value={partQty} 
                onChange={(e) => setPartQty(Math.max(1, Number(e.target.value)))} 
                min={1} 
                max={parts.find(p => p.id === selectedPartId)?.stock || 1}
                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={addPart}>Registrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
