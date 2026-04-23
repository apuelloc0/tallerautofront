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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkshop } from "@/context/WorkshopContext";
import { INVOICE_STATUS_LABELS } from "@/types/workshop";
import type { Invoice, InvoiceItem, InvoiceStatus } from "@/types/workshop";
import { Plus, FileText, Eye, Info } from "lucide-react";
import { toast } from "sonner";

export default function BillingPage() {
  const { invoices, createInvoice, downloadInvoicePDF, orders, getClient, getOrder, getVehicle, workshop } = useWorkshop();
  const [createOpen, setCreateOpen] = useState(false);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [laborCost, setLaborCost] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);

  // Formateador COP
  const formatCOP = (v: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(v);

  const handleCreate = async () => {
    const order = getOrder(selectedOrderId);
    if (!order) { toast.error("Selecciona una orden"); return; }
    
    try {
      await createInvoice(selectedOrderId, laborCost);
      toast.success("Factura creada y guardada en el sistema");
      setCreateOpen(false);
      setSelectedOrderId("");
      setLaborCost(0);
    } catch (error) {
      toast.error("Error al crear la factura en el servidor");
    }
  };

  const statusVariant = (s: InvoiceStatus) => {
    if (s === "pagada") return "default" as const;
    if (s === "anulada") return "destructive" as const;
    return "secondary" as const;
  };

  const handleDownload = async (id: string) => {
    setIsDownloading(true);
    try {
      await downloadInvoicePDF(id);
      toast.success("PDF generado correctamente");
    } catch (error) {
      toast.error("No se pudo generar el PDF");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Facturación</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">Generación de facturas. Selecciona una orden lista para importar repuestos y añadir el costo de mano de obra.</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
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
                    <TableCell className="font-mono">#{inv.id?.slice(0, 8).toUpperCase() || '---'}</TableCell>
                    <TableCell>{client?.name}</TableCell>
                    <TableCell className="hidden md:table-cell font-mono">#{inv.orderId?.slice(0, 8).toUpperCase() || '---'}</TableCell>
                    <TableCell className="font-semibold">{formatCOP(inv.total)}</TableCell>
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
                <SelectTrigger><SelectValue placeholder="Seleccionar orden lista" /></SelectTrigger>
                <SelectContent>
                  {orders
                    .filter((o) => {
                      // 1. Solo mostrar órdenes terminadas o entregadas
                      const isReady = o.status === "listo_entrega" || o.status === "entregado";
                      // 2. Opcional: No mostrar órdenes que ya tienen factura
                      const isAlreadyInvoiced = invoices.some(inv => inv.orderId === o.id);
                      return isReady && !isAlreadyInvoiced;
                    })
                    .map((o) => {
                      const v = getVehicle(o.vehicleId);
                      return <SelectItem key={o.id} value={o.id}>#{o.id?.slice(0, 8).toUpperCase() || '---'} — {v?.plate}</SelectItem>;
                    })}
                </SelectContent>
              </Select>
            </div>
            {selectedOrderId && (() => {
              const order = getOrder(selectedOrderId);
              if (!order) return null;
              const partsTotal = (order.usedParts || []).reduce((s, p) => s + p.quantity * p.unitPrice, 0);
              const subtotal = partsTotal + laborCost;
              const taxRate = (workshop?.tax_rate || 16) / 100;
              const tax = subtotal * taxRate;
              return (
                <>
                  <div className="space-y-2">
                    <Label>Piezas registradas</Label>
                    {(!order.usedParts || order.usedParts.length === 0) ? (
                      <p className="text-sm text-muted-foreground">Sin piezas registradas</p>
                    ) : (
                      order.usedParts.map((p, i) => (
                        <div key={i} className="flex justify-between text-sm">
                          <span>{p.quantity}x {p.name}</span>
                          <span>{formatCOP(p.quantity * p.unitPrice)}</span>
                        </div>
                      ))
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Mano de obra ($)</Label>
                    <Input 
                      type="number" 
                      value={laborCost} 
                      onChange={(e) => setLaborCost(Math.max(0, Number(e.target.value)))} 
                      onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                      min={0}
                    />
                  </div>
                  <Separator />
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between"><span>Subtotal:</span><span>{formatCOP(subtotal)}</span></div>
                    <div className="flex justify-between"><span>Impuesto ({workshop?.tax_rate || 16}%):</span><span>{formatCOP(tax)}</span></div>
                    <div className="flex justify-between font-bold text-base"><span>Total:</span><span>{formatCOP(subtotal + tax)}</span></div>
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
          <DialogHeader><DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Factura #{previewInvoice?.id.slice(0, 8).toUpperCase()}</DialogTitle></DialogHeader>
          {previewInvoice && (() => {
            const client = getClient(previewInvoice.clientId);
            return (
              <div className="space-y-4">
                <div className="text-sm space-y-1">
                  <p><strong>Cliente:</strong> {client?.name}</p>
                  <p><strong>Fecha:</strong> {previewInvoice.createdAt}</p>
                  <p><strong>Orden:</strong> #{previewInvoice.orderId?.slice(0, 8).toUpperCase() || '---'}</p>
                </div>
                <Separator />
                <div className="space-y-2">
                  {(previewInvoice.items || []).map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.quantity}x {item.description}</span>
                      <span>{formatCOP(item.total)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-medium">
                    <span>Mano de obra</span>
                    <span>{formatCOP(previewInvoice.laborCost || 0)}</span>
                  </div>
                </div>
                <Separator />
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span>Subtotal:</span><span>{formatCOP(previewInvoice.subtotal)}</span></div>
                  <div className="flex justify-between"><span>IVA:</span><span>{formatCOP(previewInvoice.tax)}</span></div>
                  <div className="flex justify-between font-bold text-lg"><span>Total:</span><span>{formatCOP(previewInvoice.total)}</span></div>
                </div>
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={() => handleDownload(previewInvoice.id)}
                  disabled={isDownloading}
                >
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
