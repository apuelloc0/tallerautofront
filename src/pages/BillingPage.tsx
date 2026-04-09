import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useWorkshop } from "@/context/WorkshopContext";
import { INVOICE_STATUS_LABELS } from "@/types/workshop";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/types/workshop";
import { Plus, FileText, Eye } from "lucide-react";
import { toast } from "sonner";

export default function BillingPage() {
  const { invoices, setInvoices, orders, getClient, getOrder, getVehicle } = useWorkshop();
  const [createOpen, setCreateOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [laborCost, setLaborCost] = useState(0);
  const TAX_RATE = 0.16;

  const handleCreate = () => {
    const order = getOrder(selectedOrderId);
    if (!order) { toast.error("Selecciona una orden"); return; }
    const items: InvoiceItem[] = order.usedParts.map((p) => ({
      description: p.name, quantity: p.quantity, unitPrice: p.unitPrice, total: p.quantity * p.unitPrice,
    }));
    const partsTotal = items.reduce((s, i) => s + i.total, 0);
    const subtotal = partsTotal + laborCost;
    const tax = subtotal * TAX_RATE;
    const newInv: Invoice = {
      id: `inv${Date.now()}`, orderId: selectedOrderId, clientId: order.clientId,
      items, laborCost, subtotal, tax, total: subtotal + tax,
      status: "pendiente", createdAt: new Date().toISOString().split("T")[0],
    };
    setInvoices((prev) => [...prev, newInv]);
    toast.success("Factura creada");
    setCreateOpen(false);
    setSelectedOrderId("");
    setLaborCost(0);
  };

  const statusVariant = (s: InvoiceStatus) => {
    if (s === "pagada") return "default" as const;
    if (s === "anulada") return "destructive" as const;
    return "secondary" as const;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Facturación</h1>
        <Button onClick={() => setCreateOpen(true)}><Plus className="h-4 w-4 mr-1" /> Nueva Factura</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factura</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="hidden md:table-cell">Orden</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => {
                const client = getClient(inv.clientId);
                return (
                  <TableRow key={inv.id}>
                    <TableCell className="font-mono">{inv.id.toUpperCase()}</TableCell>
                    <TableCell>{client?.name}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono">{inv.orderId.toUpperCase()}</TableCell>
                    <TableCell className="font-semibold">${inv.total.toFixed(2)}</TableCell>
                    <TableCell><Badge variant={statusVariant(inv.status)}>{INVOICE_STATUS_LABELS[inv.status]}</Badge></TableCell>
                    <TableCell>
                      <Button variant="ghost" size="icon" onClick={() => setPreviewInvoice(inv)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create invoice dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva Factura</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Orden vinculada</Label>
              <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
                <SelectTrigger><SelectValue placeholder="Seleccionar orden" /></SelectTrigger>
                <SelectContent>
                  {orders.map((o) => {
                    const v = getVehicle(o.vehicleId);
                    return <SelectItem key={o.id} value={o.id}>{o.id.toUpperCase()} — {v?.plate}</SelectItem>;
                  })}
                </SelectContent>
              </Select>
            </div>
            {selectedOrderId && (() => {
              const order = getOrder(selectedOrderId);
              if (!order) return null;
              const partsTotal = order.usedParts.reduce((s, p) => s + p.quantity * p.unitPrice, 0);
              const subtotal = partsTotal + laborCost;
              const tax = subtotal * TAX_RATE;
              return (
                <>
                  <div className="space-y-2">
                    <Label>Piezas registradas</Label>
                    {order.usedParts.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Sin piezas registradas</p>
                    ) : (
                      order.usedParts.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{p.quantity}x {p.name}</span>
                          <span>${(p.quantity * p.unitPrice).toFixed(2)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Mano de obra ($)</Label>
                    <Input type="number" value={laborCost} onChange={(e) => setLaborCost(+e.target.value)} />
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>${subtotal.toFixed(2)}</span></div>
                    <div className="flex justify-between"><span>IVA (16%):</span><span>${tax.toFixed(2)}</span></div>
                    <div className="flex justify-between font-bold text-base"><span>Total:</span><span>${(subtotal + tax).toFixed(2)}</span></div>
                  </div>
                </>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancelar</Button>
            <Button onClick={handleCreate}>Crear Factura</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview invoice dialog */}
      <Dialog open={!!previewInvoice} onOpenChange={() => setPreviewInvoice(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Factura {previewInvoice?.id.toUpperCase()}</DialogTitle></DialogHeader>
          {previewInvoice && (() => {
            const client = getClient(previewInvoice.clientId);
            return (
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <p><strong>Cliente:</strong> {client?.name}</p>
                  <p><strong>Fecha:</strong> {previewInvoice.createdAt}</p>
                  <p><strong>Orden:</strong> {previewInvoice.orderId.toUpperCase()}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  {previewInvoice.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.description}</span>
                      <span>${item.total.toFixed(2)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span>Mano de obra</span>
                    <span>${previewInvoice.laborCost.toFixed(2)}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal:</span><span>${previewInvoice.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>IVA:</span><span>${previewInvoice.tax.toFixed(2)}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>${previewInvoice.total.toFixed(2)}</span></div>
                </div>
                <Button className="w-full" variant="outline" onClick={() => toast.info("Generación de PDF — conectar con API")}>
                  <FileText className="h-4 w-4 mr-1" /> Generar PDF
                </Button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
