import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useWorkshop } from "@/context/WorkshopContext";
import { STATUS_LABELS, STATUS_COLUMNS, OrderStatus } from "@/types/workshop";
import { Wrench, Clock, MessageSquarePlus, Package, ChevronRight } from "lucide-react";
import { toast } from "sonner";

export default function TechnicianPage() {
  const { orders, setOrders, technicians, getVehicle, getClient, parts, updateOrderStatus } = useWorkshop();
  const [selectedTechId, setSelectedTechId] = useState(technicians[0]?.id || "");
  const [noteDialog, setNoteDialog] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");
  const [partDialog, setPartDialog] = useState<string | null>(null);
  const [selectedPartId, setSelectedPartId] = useState("");
  const [partQty, setPartQty] = useState(1);

  const techOrders = orders.filter((o) => o.technicianId === selectedTechId && o.status !== "listo_entrega");
  const tech = technicians.find((t) => t.id === selectedTechId);

  const addNote = () => {
    if (!noteText.trim() || !noteDialog) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === noteDialog
          ? { ...o, notes: [...o.notes, { id: `n${Date.now()}`, date: new Date().toISOString().split("T")[0], text: noteText, technicianId: selectedTechId }] }
          : o
      )
    );
    toast.success("Nota agregada");
    setNoteDialog(null);
    setNoteText("");
  };

  const addPart = () => {
    if (!selectedPartId || !partDialog) return;
    const part = parts.find((p) => p.id === selectedPartId);
    if (!part) return;
    setOrders((prev) =>
      prev.map((o) =>
        o.id === partDialog
          ? { ...o, usedParts: [...o.usedParts, { partId: part.id, name: part.name, quantity: partQty, unitPrice: part.price }] }
          : o
      )
    );
    toast.success("Repuesto registrado");
    setPartDialog(null);
    setSelectedPartId("");
    setPartQty(1);
  };

  const advanceStatus = (orderId: string, current: OrderStatus) => {
    const idx = STATUS_COLUMNS.indexOf(current);
    if (idx < STATUS_COLUMNS.length - 1) {
      updateOrderStatus(orderId, STATUS_COLUMNS[idx + 1]);
      toast.success(`Estado cambiado a: ${STATUS_LABELS[STATUS_COLUMNS[idx + 1]]}`);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-first header */}
      <div className="sticky top-0 z-10 bg-primary text-primary-foreground p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wrench className="h-5 w-5" />
          <h1 className="text-lg font-bold">Vista Técnico</h1>
        </div>
        <Select value={selectedTechId} onValueChange={setSelectedTechId}>
          <SelectTrigger className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {technicians.map((t) => (
              <SelectItem key={t.id} value={t.id}>{t.name} — {t.specialty}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="p-4 space-y-3">
        {techOrders.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Wrench className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Sin tareas asignadas</p>
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
                      <span className="text-sm text-muted-foreground ml-2">{vehicle?.brand} {vehicle?.model}</span>
                    </div>
                    <Badge variant="secondary">{STATUS_LABELS[order.status]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{order.faultDescription}</p>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Ingreso: {order.createdAt}
                  </div>

                  <div className="flex gap-2 flex-wrap pt-2">
                    <Button size="sm" onClick={() => advanceStatus(order.id, order.status)}>
                      <ChevronRight className="h-4 w-4 mr-1" /> Avanzar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setNoteDialog(order.id)}>
                      <MessageSquarePlus className="h-4 w-4 mr-1" /> Nota
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setPartDialog(order.id)}>
                      <Package className="h-4 w-4 mr-1" /> Repuesto
                    </Button>
                  </div>

                  {order.notes.length > 0 && (
                    <div className="pt-2 border-t space-y-1">
                      {order.notes.slice(-2).map((n) => (
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
          <DialogHeader><DialogTitle>Agregar Nota</DialogTitle></DialogHeader>
          <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Escribe una nota..." />
          <DialogFooter>
            <Button onClick={addNote}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add part dialog */}
      <Dialog open={!!partDialog} onOpenChange={() => setPartDialog(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Registrar Repuesto Usado</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Repuesto</Label>
              <Select value={selectedPartId} onValueChange={setSelectedPartId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                <SelectContent>
                  {parts.map((p) => (<SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Cantidad</Label>
              <Input type="number" value={partQty} onChange={(e) => setPartQty(+e.target.value)} min={1} />
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
