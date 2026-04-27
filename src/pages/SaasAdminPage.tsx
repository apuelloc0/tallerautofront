import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Plus, Copy, Check, RefreshCw, ShieldCheck, Building, Ticket, Power, PowerOff, BarChart3, TrendingUp, Users as UsersIcon, Wallet, Trash2, Database, Download, Key, DollarSign } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CarLoader } from "@/components/ui/CarLoader";

export default function SaasAdminPage() {
  const queryClient = useQueryClient();
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newlyGeneratedCode, setNewlyGeneratedCode] = useState<string | null>(null);
  const [showWorkshopDetailModal, setShowWorkshopDetailModal] = useState(false);
  const [selectedWorkshopDetails, setSelectedWorkshopDetails] = useState<any>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [selectedWsForPayment, setSelectedWsForPayment] = useState<any>(null);
  const [paymentForm, setPaymentForm] = useState({ amount: 0, reference: "" });

  // Seguridad: Redirigir si no es Super Admin
  useEffect(() => {
    if (!authLoading && (!user || user.role?.toLowerCase() !== "super_admin")) {
      toast.error("Acceso denegado. Se requieren permisos de plataforma.");
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  // Obtener lista de códigos con capacidad de refresco manual
  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["invitation-codes"],
    queryFn: async () => {
      const { data } = await api.get("/invitations");
      return data;
    },
    staleTime: 10 * 60 * 1000, // Los códigos se consideran frescos por 10 minutos
    refetchOnWindowFocus: false, // No recargar al cambiar de pestaña
  });

  // Obtener lista de talleres registrados
  const { data: wsResponse, isLoading: wsLoading } = useQuery({
    queryKey: ["saas-workshops"],
    queryFn: async () => {
      const { data } = await api.get("/invitations/workshops");
      return data;
    },
    staleTime: 10 * 60 * 1000, // Los talleres se consideran frescos por 10 minutos
    refetchOnWindowFocus: false,
  });

  // Obtener estadísticas de negocio (Caché por 30 minutos para ahorrar recursos)
  const { data: statsResponse, isLoading: statsLoading } = useQuery({
    queryKey: ["saas-business-stats"],
    queryFn: async () => {
      const { data } = await api.get("/invitations/stats");
      return data.data;
    },
    staleTime: 30 * 60 * 1000, // Estadísticas frescas por 30 minutos
    refetchOnWindowFocus: false,
  });

  // Obtener respaldos históricos
  const { data: archivesResponse, isLoading: archivesLoading } = useQuery({
    queryKey: ["saas-archives"],
    queryFn: async () => {
      const { data } = await api.get("/invitations/archives");
      return data;
    },
    staleTime: 30 * 60 * 1000, // El histórico cambia poco, caché de 30 min
    refetchOnWindowFocus: false,
  });

  // Obtener historial de pagos de plataforma
  const { data: paymentsResponse, isLoading: paymentsLoading } = useQuery({
    queryKey: ["saas-platform-payments"],
    queryFn: async () => {
      const { data } = await api.get("/invitations/platform-payments");
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Registrar pago manual de suscripción
  const addPaymentMutation = useMutation({
    mutationFn: async (payload: any) => {
      const { data } = await api.post("/invitations/platform-payments", payload);
      return data;
    },
    onSuccess: () => {
      toast.success("Pago registrado correctamente");
      queryClient.invalidateQueries({ queryKey: ["saas-platform-payments"] });
      queryClient.invalidateQueries({ queryKey: ["saas-business-stats"] });
      queryClient.invalidateQueries({ queryKey: ["saas-workshops"] });
      setPaymentModalOpen(false);
      setPaymentForm({ amount: 0, reference: "" });
    },
  });

  // Mutación para activar/suspender taller
  const updateWsMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data } = await api.patch(`/invitations/workshops/${id}`, { 
        payment_status: status 
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Estado del taller actualizado");
      queryClient.invalidateQueries({ queryKey: ["saas-workshops"] });
    },
  });

  // Mutación para eliminar código (con cascade)
  const deleteCodeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/invitations/${id}`);
      return data;
    },
    onSuccess: (data) => {
      toast.success(data.message || "Licencia eliminada");
      queryClient.invalidateQueries({ queryKey: ["invitation-codes"] });
      queryClient.invalidateQueries({ queryKey: ["saas-workshops"] });
    },
  });

  // Mutación para eliminar taller directamente
  const deleteWsMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/invitations/workshops/${id}`);
      return data;
    },
    onSuccess: () => {
      toast.success("Taller eliminado permanentemente");
      queryClient.invalidateQueries({ queryKey: ["saas-workshops"] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Error al eliminar taller");
    }
  });

  // Mutación para generar un nuevo código OWNER-XXXX-XXXX
  const generateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post("/invitations/generate");
      return data;
    },
    onSuccess: async (data) => {
      setNewlyGeneratedCode(data.code);
      setShowSuccessModal(true);
      toast.success("Licencia generada correctamente");
      await queryClient.invalidateQueries({ queryKey: ["invitation-codes"] });
    },
    onError: (error: any) => {
      const msg = error.response?.data?.message || "Error al generar el código";
      toast.error(msg);
    },
  });

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Código copiado al portapapeles");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const downloadBackup = (backup: any) => {
    const blob = new Blob([JSON.stringify(backup.backup_data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RESPALDO-${backup.workshop_name}-${backup.created_at.split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleOpenWorkshopDetails = (ws: any) => {
    setSelectedWorkshopDetails(ws);
    setShowWorkshopDetailModal(true);
  };

  // Lógica de carga inteligente:
  // Solo bloqueamos la pantalla si es la carga inicial (no hay datos previos en respuesta)
  // Si ya tenemos datos, React Query refresca en background sin molestar.
  const isInitialLoading = 
    (isLoading && !response) || 
    (wsLoading && !wsResponse) || 
    (archivesLoading && !archivesResponse) ||
    (paymentsLoading && !paymentsResponse);

  if (authLoading || isInitialLoading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <CarLoader message="Cargando plataforma SaaS..." />
      </div>
    );
  }

  const codes = response?.data || [];
  const workshops = wsResponse?.data || [];
  const stats = statsResponse || { kpis: {}, growth: [] };
  const archives = archivesResponse?.data || [];
  const platformPayments = paymentsResponse || [];

  const handleOpenPayment = (ws: any) => {
    setSelectedWsForPayment(ws);
    setPaymentForm({ amount: ws.subscription_plan === 'pro' ? 150000 : 400000, reference: "" });
    setPaymentModalOpen(true);
  };

  const formatCOP = (v: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(v || 0);

  return (
    <div className="max-w-5xl mx-auto py-1 space-y-3">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <h1 className="text-lg font-bold tracking-tight">Administración SaaS</h1>
          </div>
          <p className="text-muted-foreground text-xs leading-tight">Gestiona las licencias de acceso y talleres registrados.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            title="Actualizar lista"
            className="h-8"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          </Button>
          <Button 
            size="sm"
            className="h-8"
            onClick={() => generateMutation.mutate()} 
            disabled={generateMutation.isPending}
          >
            {generateMutation.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <Plus className="mr-1.5 h-3.5 w-3.5" />}
            Nueva Clave
          </Button>
        </div>
      </div>

      {/* KPIs de Negocio SaaS */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { title: "Talleres", value: stats.kpis.totalWorkshops || 0, icon: Building, color: "text-muted-foreground", bg: "bg-muted/50" },
          { title: "MRR Estimado", value: formatCOP(stats.kpis.mrr), icon: Wallet, color: "text-green-500", bg: "bg-green-500/10" },
          { title: "Conversión", value: `${stats.kpis.conversionRate || 0}%`, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
          { title: "Usuarios Activos", value: stats.kpis.activeUsers || 0, icon: UsersIcon, color: "text-primary", bg: "bg-primary/10" },
        ].map((kpi) => (
          <Card key={kpi.title} className="border-none bg-card/60 backdrop-blur-md shadow-sm rounded-[1.5rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between p-3 pb-0">
              <div className={cn("p-1.5 rounded-xl", kpi.bg)}>
                <kpi.icon className={cn("h-3.5 w-3.5", kpi.color)} />
              </div>
            </CardHeader>
            <CardContent className="p-3 pt-1">
              <div className="text-sm font-black tracking-tighter">{kpi.value}</div>
              <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60 tracking-wider">{kpi.title}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <div className="w-full overflow-x-auto no-scrollbar">
          <TabsList className="inline-flex w-max min-w-full md:grid md:grid-cols-5 h-10 p-1 bg-muted/50 rounded-xl gap-1">
            <TabsTrigger value="metrics" className="flex gap-2 text-xs h-8 px-4 rounded-lg">
              <BarChart3 className="h-3.5 w-3.5" /> Negocio
            </TabsTrigger>
            <TabsTrigger value="revenue" className="flex gap-2 text-xs h-8 px-4 rounded-lg">
              <Wallet className="h-3.5 w-3.5" /> Ingresos
            </TabsTrigger>
            <TabsTrigger value="codes" className="flex gap-2 text-xs h-8 px-4 rounded-lg">
              <Ticket className="h-3.5 w-3.5" /> Invitaciones
            </TabsTrigger>
            <TabsTrigger value="workshops" className="flex gap-2 text-xs h-8 px-4 rounded-lg">
              <Building className="h-3.5 w-3.5" /> Talleres
            </TabsTrigger>
            <TabsTrigger value="archives" className="flex gap-2 text-xs h-8 px-4 rounded-lg">
              <Database className="h-3.5 w-3.5" /> Histórico ({archives.length})
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="metrics" className="mt-2 outline-none">
          <Card>
            <CardHeader className="p-3">
              <CardTitle className="text-sm font-bold">Crecimiento de la Plataforma</CardTitle>
              <CardDescription className="text-xs">Nuevos talleres registrados por mes</CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0">
              <div className="h-[120px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.growth}>
                    <defs>
                      <linearGradient id="colorTalleres" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12}} />
                    <RechartsTooltip />
                    <Area type="monotone" dataKey="talleres" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTalleres)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-2 outline-none">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-3">
              <CardTitle className="text-sm font-bold">Historial de Cobros</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="h-8">
                  <TableHead className="h-8 py-0">Taller</TableHead>
                  <TableHead className="h-8 py-0">Monto</TableHead>
                  <TableHead className="h-8 py-0">Referencia</TableHead>
                  <TableHead className="h-8 py-0">Fecha</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {platformPayments.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs">No hay pagos registrados.</TableCell></TableRow>
                  ) : (
                    platformPayments.map((p: any) => (
                      <TableRow key={p.id}>
                        <TableCell className="text-xs font-semibold">{p.workshops?.name}</TableCell>
                        <TableCell className="text-xs text-green-600 font-bold">{formatCOP(p.amount)}</TableCell>
                        <TableCell className="text-[10px] text-muted-foreground">{p.reference || 'N/A'}</TableCell>
                        <TableCell className="text-[10px]">{new Date(p.created_at).toLocaleDateString()}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="codes" className="mt-2 outline-none">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-3">
              <CardTitle className="text-sm font-bold">Gestión de Claves</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent h-8">
                    <TableHead className="h-8 py-0">Código</TableHead>
                    <TableHead className="h-8 py-0">Estado</TableHead>
                    <TableHead className="h-8 py-0">Destinatario / Uso</TableHead>
                    <TableHead className="h-8 py-0 text-[11px]">Fecha</TableHead>
                    <TableHead className="h-8 py-0 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {codes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-16 text-muted-foreground">No hay códigos aún.</TableCell>
                    </TableRow>
                  ) : (
                    codes.map((item: any) => (
                      <TableRow key={item.id} className="group">
                        <TableCell className="font-mono font-bold text-primary text-[10px] break-all max-w-[200px] py-1 leading-tight">{item.code}</TableCell>
                        <TableCell>
                          {item.is_used ? 
                            <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Vinculado</Badge> : 
                            <Badge variant="default" className="bg-green-500">Disponible</Badge>
                          }
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-medium">{item.recipient_name || "Generación rápida"}</span>
                            <span className="text-[10px] text-muted-foreground">{item.recipient_email || (item.is_used ? "Taller Vinculado" : "Uso Libre")}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right space-x-1">
                          {!item.is_used ? (
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(item.code)}
                            >
                              {copiedCode === item.code ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                            </Button>
                          ) : (
                            <Badge variant="secondary" className="text-[9px]">En Uso</Badge>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if(confirm("¿ELIMINAR LICENCIA? Si está en uso, se borrará TODO el taller y su personal.")) {
                                deleteCodeMutation.mutate(item.id);
                              }
                            }}
                            disabled={deleteCodeMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workshops" className="mt-2 outline-none">
          <Card className="border-none shadow-md overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-3">
              <CardTitle className="text-sm font-bold">Talleres en la Plataforma</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="h-8 py-0">Nombre del Taller</TableHead>
                    <TableHead className="h-8 py-0">Plan</TableHead>
                    <TableHead className="h-8 py-0">Estado Pago</TableHead>
                    <TableHead className="h-8 py-0">Códigos (T / R)</TableHead>
                    <TableHead className="h-8 py-0">Registro</TableHead>
                    <TableHead className="h-8 py-0 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {workshops.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-xs">No hay talleres registrados.</TableCell>
                    </TableRow>
                  ) : (
                    workshops.map((ws: any) => (
                      <TableRow key={ws.id}>
                        <TableCell className="font-semibold cursor-pointer" onClick={() => handleOpenWorkshopDetails(ws)}>
                          {ws.name}
                          {ws.owner && ( // Muestra el nombre y correo del dueño si existe
                            <div className="text-xs text-muted-foreground font-normal">
                              {ws.owner.full_name} ({ws.owner.username})
                            </div>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="secondary">{ws.subscription_plan?.toUpperCase()}</Badge></TableCell>
                        <TableCell>
                          <Badge variant={ws.payment_status === 'active' ? 'default' : 'destructive'} className={ws.payment_status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                            {ws.payment_status?.slice(0, 3).toUpperCase()}
                          </Badge>
                        </TableCell>
                      <TableCell className="font-mono text-[10px] space-y-1">
                        <div className="text-primary font-bold">{ws.join_code_tech || '—'}</div>
                        <div className="text-muted-foreground">{ws.join_code_recep || '—'}</div>
                      </TableCell>
                        <TableCell className="text-[10px]">{new Date(ws.created_at).toLocaleDateString()}</TableCell>
                        <TableCell className="text-right flex justify-end gap-1">
                          <Button 
                            variant="outline" 
                            size="icon"
                            className="h-8 w-8 text-green-600 border-green-100 hover:bg-green-50"
                            onClick={() => handleOpenPayment(ws)}
                            title="Registrar Pago"
                          >
                            <DollarSign className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className={ws.payment_status === 'active' ? "text-red-500" : "text-green-500"}
                            onClick={() => updateWsMutation.mutate({ 
                              id: ws.id, 
                              status: ws.payment_status === 'active' ? 'suspended' : 'active' 
                            })}
                            disabled={updateWsMutation.isPending}
                          >
                            {ws.payment_status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if(confirm(`¿Eliminar permanentemente el taller "${ws.name}" y todo su personal?`)) {
                                deleteWsMutation.mutate(ws.id);
                              }
                            }}
                            disabled={deleteWsMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="archives" className="mt-2 outline-none">
          <Card className="border-none shadow-sm overflow-hidden">
            <CardHeader className="bg-muted/30 border-b p-3">
              <CardTitle className="text-sm font-bold text-orange-600">Almacén de Datos Eliminados</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="h-8">
                    <TableHead className="h-8 py-0">Taller</TableHead>
                    <TableHead className="h-8 py-0">Dueño</TableHead>
                    <TableHead className="h-8 py-0">Fecha Eliminación</TableHead>
                    <TableHead className="h-8 py-0 text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {archives.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-10 text-muted-foreground text-xs">No hay respaldos en el histórico.</TableCell>
                    </TableRow>
                  ) : (
                    archives.map((arc: any) => (
                      <TableRow key={arc.id} className="h-9">
                        <TableCell className="text-xs font-semibold py-1">{arc.workshop_name}</TableCell>
                        <TableCell className="text-[10px] py-1">{arc.owner_email}</TableCell>
                        <TableCell className="text-[10px] py-1">{new Date(arc.created_at).toLocaleString()}</TableCell>
                        <TableCell className="text-right py-1">
                          <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => downloadBackup(arc)}>
                            <Download className="h-3 w-3 mr-1" /> JSON
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de éxito para nueva licencia */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <Check className="h-5 w-5" /> Licencia Generada
            </DialogTitle>
            <DialogDescription>
              Copia esta clave y envíasela al dueño del nuevo taller para que pueda registrarse.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 bg-muted p-4 rounded-lg border">
            <code className="flex-1 font-mono font-bold text-sm break-all text-primary text-center">
              {newlyGeneratedCode}
            </code>
            <Button size="icon" variant="ghost" onClick={() => copyToClipboard(newlyGeneratedCode || "")}>
              {copiedCode === newlyGeneratedCode ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <DialogFooter>
            <Button className="w-full" onClick={() => setShowSuccessModal(false)}>Entendido</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para registrar pago de taller */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Registrar Pago de Suscripción</DialogTitle>
            <DialogDescription>Taller: {selectedWsForPayment?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Monto (COP)</Label>
              <Input 
                type="number" 
                value={paymentForm.amount} 
                onChange={e => setPaymentForm({...paymentForm, amount: Math.max(0, Number(e.target.value))})} 
                onFocus={(e) => setTimeout(() => e.target.select(), 0)}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Referencia de Pago</Label>
              <Input placeholder="Ej: Transferencia Bancaria o ID" value={paymentForm.reference} onChange={e => setPaymentForm({...paymentForm, reference: e.target.value})} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentModalOpen(false)}>Cancelar</Button>
            <Button onClick={() => addPaymentMutation.mutate({ workshop_id: selectedWsForPayment.id, ...paymentForm })} disabled={addPaymentMutation.isPending}>Guardar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de detalles del taller */}
      <Dialog open={showWorkshopDetailModal} onOpenChange={setShowWorkshopDetailModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" /> Detalles del Taller
            </DialogTitle>
            <DialogDescription>
              Información completa del taller y su administrador.
            </DialogDescription>
          </DialogHeader>
          {selectedWorkshopDetails && (
            <div className="space-y-4 py-2 text-sm">
              <div>
                <h4 className="font-bold text-muted-foreground mb-1">Información del Taller</h4>
                <p><span className="font-medium">Nombre:</span> {selectedWorkshopDetails.name}</p>
                <p><span className="font-medium">Dirección:</span> {selectedWorkshopDetails.address || 'N/A'}</p>
                <p><span className="font-medium">Teléfono:</span> {selectedWorkshopDetails.phone || 'N/A'}</p>
                <p><span className="font-medium">IVA:</span> {selectedWorkshopDetails.tax_rate}%</p>
                <div className="flex items-center gap-2 py-1">
                  <span className="font-medium">Plan:</span>
                  <Badge variant="secondary">{selectedWorkshopDetails.subscription_plan?.toUpperCase()}</Badge>
                </div>
                <div className="flex items-center gap-2 py-1">
                  <span className="font-medium">Estado de Pago:</span>
                  <Badge variant={selectedWorkshopDetails.payment_status === 'active' ? 'default' : 'destructive'} className={selectedWorkshopDetails.payment_status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                    {selectedWorkshopDetails.payment_status?.toUpperCase()}
                  </Badge>
                </div>
                <p><span className="font-medium">Registrado:</span> {new Date(selectedWorkshopDetails.created_at).toLocaleDateString()}</p>
              </div>
              {selectedWorkshopDetails.owner && (
                <div>
                  <h4 className="font-bold text-muted-foreground mb-1">Administrador del Taller</h4>
                  <p><span className="font-medium">Nombre:</span> {selectedWorkshopDetails.owner.full_name}</p>
                  <p><span className="font-medium">Email:</span> {selectedWorkshopDetails.owner.username}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button className="w-full" onClick={() => setShowWorkshopDetailModal(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
