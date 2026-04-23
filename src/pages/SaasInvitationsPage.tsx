import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Loader2, Plus, Copy, Check, Ticket, RefreshCw, Mail, User, Zap, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

export default function SaasInvitationsPage() {
  const queryClient = useQueryClient();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newInvite, setNewInvite] = useState({ name: "", email: "" });

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["invitation-codes"],
    queryFn: async () => {
      const { data } = await api.get("/invitations");
      return data;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async (payload?: { name: string, email: string }) => {
      const { data } = await api.post("/invitations/generate", payload);
      return data;
    },
    onSuccess: (data) => {
      toast.success("Nueva licencia generada exitosamente");
      queryClient.invalidateQueries({ queryKey: ["invitation-codes"] });
      setIsModalOpen(false);
      setNewInvite({ name: "", email: "" });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Error al generar el código";
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/invitations/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Licencia eliminada correctamente");
      queryClient.invalidateQueries({ queryKey: ["invitation-codes"] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "No se pudo eliminar la licencia";
      toast.error(msg);
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const sendWhatsApp = (code: string, name?: string) => {
    const message = encodeURIComponent(
      `¡Hola${name ? ' ' + name : ''}! Aquí tienes tu licencia de acceso para el Sistema de Gestión de Talleres:\n\n🔑 Código: ${code}\n\nPuedes registrarte aquí: ${window.location.origin}/registro`
    );
    window.open(`https://wa.me/?text=${message}`, '_blank');
  };

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  const codes = response?.data || [];

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Ticket className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Invitaciones SaaS</h1>
          </div>
          <p className="text-muted-foreground">Gestiona las licencias de acceso para nuevos dueños de talleres.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            title="Actualizar lista"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>

          <Button 
            variant="secondary"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Zap className="mr-2 h-4 w-4 fill-current" /> Generación Rápida
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Generar con Datos
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nueva Licencia de Acceso</DialogTitle>
                <DialogDescription>
                  Opcional: ingresa los datos del cliente para rastrear esta invitación.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nombre (Opcional)</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" placeholder="Ej: Taller El Rayo" value={newInvite.name} onChange={e => setNewInvite({...newInvite, name: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email (Opcional)</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input className="pl-9" type="email" placeholder="cliente@correo.com" value={newInvite.email} onChange={e => setNewInvite({...newInvite, email: e.target.value})} />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button onClick={() => generateMutation.mutate(newInvite)} disabled={generateMutation.isPending}>
                  {generateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                  Confirmar y Guardar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardHeader className="bg-muted/30 border-b">
          <CardTitle>Licencias Generadas</CardTitle>
          <CardDescription>Listado de llaves de activación y sus estados de uso.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Licencia de Acceso</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Destinatario</TableHead>
                <TableHead>Fecha Creación</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {codes.map((item: any) => (
                <TableRow key={item.id} className="group">
                  <TableCell className="font-mono text-[10px] font-bold text-primary break-all max-w-[180px] leading-tight">
                    {item.code}
                  </TableCell>
                  <TableCell>
                    {item.is_used ? 
                      <Badge variant="outline" className="bg-orange-50 text-orange-700">Usado</Badge> : 
                      <Badge variant="default" className="bg-green-500">Disponible</Badge>
                    }
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium">{item.recipient_name || "Generación Rápida"}</span>
                      <span className="text-[10px] text-muted-foreground">{item.recipient_email || (item.is_used ? "Taller Vinculado" : "Uso Libre")}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {!item.is_used && (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            onClick={() => sendWhatsApp(item.code, item.recipient_name)}
                            title="Enviar por WhatsApp"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(item.code)}
                            title="Copiar licencia"
                          >
                            {copiedCode === item.code ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                          </Button>
                        </>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          const msg = item.is_used 
                            ? "¿ELIMINAR TODO EL TALLER? Esta licencia está activa. Si la borras, se eliminará el taller y todo su personal."
                            : "¿Estás seguro de que deseas eliminar esta licencia?";

                          if (window.confirm(msg)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        title="Eliminar permanentemente"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}