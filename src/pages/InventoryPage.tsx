import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkshop } from "@/context/WorkshopContext";
import { PART_CATEGORIES } from "@/data/mockData"; // Asegúrate de tener estas categorías definidas
import { Plus, Search, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import type { Part } from "@/types/workshop";

export default function InventoryPage() {
  const { parts, addPart, updatePart } = useWorkshop();
  const location = useLocation();
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editPart, setEditPart] = useState<Part | null>(null);
  const [form, setForm] = useState({ code: "", name: "", category: "", stock: 0, minStock: 5, price: 0, currency: "COP" });

  // Formateador dinámico según la moneda para la tabla y visualización
  const formatPrice = (value: number, currency: string = "COP") => {
    if (currency === "USD") {
      const formatted = new Intl.NumberFormat('en-US', { 
        style: 'currency', currency: 'USD' 
      }).format(value);
      return `USD ${formatted}`;
    }
    const formatted = new Intl.NumberFormat('es-CO', { 
      style: 'currency', currency: 'COP', maximumFractionDigits: 0 
    }).format(value);
    return `COP ${formatted}`;
  };

  // Efecto para capturar búsquedas desde el Dashboard
  useEffect(() => {
    if (location.state?.searchPart) {
      setSearch(location.state.searchPart);
    }
  }, [location.state]);

  const filtered = parts.filter((p) => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || p.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  const openNew = () => {
    setEditPart(null);
    setForm({ code: "", name: "", category: "", stock: 0, minStock: 5, price: 0, currency: "COP" });
    setDialogOpen(true);
  };

  const openEdit = (part: Part) => {
    setEditPart(part);
    setForm({ code: part.code, name: part.name, category: part.category, stock: part.stock, minStock: part.minStock, price: part.price, currency: (part as any).currency || "COP" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name || !form.category) { toast.error("Completa los campos"); return; }
    try {
      if (editPart) {
        await updatePart(editPart.id, form);
        toast.success("Repuesto actualizado");
      } else {
        await addPart(form);
        toast.success("Repuesto agregado");
      }
      setDialogOpen(false);
    } catch (error) {
      toast.error("Error al conectar con el servidor de inventario");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">Inventario de Repuestos</h1>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent><p className="max-w-xs">Control de stock. El inventario se descuenta automáticamente cuando los técnicos registran piezas en las órdenes.</p></TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Agregar</Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por código o nombre..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue placeholder="Categoría" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {PART_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead className="hidden md:table-cell">Categoría</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="hidden md:table-cell">Precio Unit.</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((part) => {
                const isLow = part.stock <= part.minStock;
                // Nueva fórmula: Stock actual sobre el mínimo. 
                // Si el stock es igual o mayor al mínimo, la barra se muestra llena (100%).
                // Si es menor, muestra proporcionalmente qué tanto falta para llegar al mínimo.
                const stockPercent = part.minStock > 0 ? Math.min((part.stock / part.minStock) * 100, 100) : 100;
                return (
                  <TableRow key={part.id} className="cursor-pointer" onClick={() => openEdit(part)}>
                    <TableCell className="font-mono text-xs">{part.code}</TableCell>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="secondary">{part.category}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={stockPercent} className={`w-16 h-2 ${isLow ? "[&>div]:bg-destructive" : ""}`} />
                        <span className="text-sm">{part.stock}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell font-medium">
                      {formatPrice(part.price, (part as any).currency)}
                    </TableCell>
                    <TableCell>
                      {isLow ? (
                        <Badge variant="destructive" className="gap-1">
                          <AlertTriangle className="h-3 w-3" /> Bajo
                        </Badge>
                      ) : (
                        <Badge variant="secondary">OK</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editPart ? "Editar Repuesto" : "Nuevo Repuesto"}</DialogTitle>
            <DialogDescription>Gestiona la información técnica y existencias del repuesto en el almacén.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Código</Label>
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Categoría</Label>
                <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                  <SelectTrigger><SelectValue placeholder="Categoría" /></SelectTrigger>
                  <SelectContent>
                    {PART_CATEGORIES.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>Stock</Label>
                <Input 
                  type="number" 
                  value={form.stock} 
                  onChange={(e) => setForm((f) => ({ ...f, stock: Math.max(0, Number(e.target.value)) }))} 
                  onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Stock mín.</Label>
                <Input 
                  type="number" 
                  value={form.minStock} 
                  onChange={(e) => setForm((f) => ({ ...f, minStock: Math.max(0, Number(e.target.value)) }))} 
                  onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <Label>Moneda</Label>
                <Select value={form.currency} onValueChange={(v) => setForm((f) => ({ ...f, currency: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="COP">COP ($)</SelectItem>
                    <SelectItem value="USD">USD (US$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Precio ({form.currency})</Label>
                <div className="relative">
                  <Input 
                    type="text" 
                    value={form.price === 0 ? "" : (form.currency === "COP" ? new Intl.NumberFormat('es-CO').format(form.price) : form.price)}
                    onChange={(e) => {
                      const rawValue = e.target.value.replace(/\D/g, "");
                      setForm(f => ({ ...f, price: rawValue ? parseInt(rawValue, 10) : 0 }));
                    }} 
                    className={cn(
                      "font-mono font-bold",
                      form.currency === "COP" ? "text-primary" : "text-green-600"
                    )}
                  />
                  {form.price > 0 && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] opacity-40 font-bold uppercase">
                      {form.currency}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
