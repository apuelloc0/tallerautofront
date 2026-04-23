import { useQuery } from "@tanstack/react-query";
import api from "@/api/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building, Wallet, TrendingUp, Users as UsersIcon, BarChart3, AlertCircle } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

export default function SaasMetricsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["saas-business-stats"],
    queryFn: async () => {
      const { data } = await api.get("/invitations/stats");
      return data.data;
    },
    staleTime: 30 * 60 * 1000,
  });

  const formatCOP = (v: number) => new Intl.NumberFormat('es-CO', {
    style: 'currency', currency: 'COP', maximumFractionDigits: 0
  }).format(v || 0);

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  if (!stats || !stats.kpis) return (
    <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground gap-2">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <p>No se pudieron cargar las métricas de la plataforma.</p>
    </div>
  );

  return (
    <div className="container max-w-5xl mx-auto py-2 space-y-4">
      <div className="flex items-center gap-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Métricas de Negocio</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard title="Talleres" value={stats.kpis.totalWorkshops} icon={Building} />
        <StatCard title="MRR Estimado" value={formatCOP(stats.kpis.mrr)} icon={Wallet} color="text-green-500" />
        <StatCard title="Conversión" value={`${stats.kpis.conversionRate}%`} icon={TrendingUp} color="text-orange-500" />
        <StatCard title="Usuarios Activos" value={stats.kpis.activeUsers} icon={UsersIcon} color="text-primary" />
      </div>

      <Card className="border-none shadow-md">
        <CardHeader className="py-3">
          <CardTitle className="text-base">Crecimiento de la Plataforma</CardTitle>
          <CardDescription className="text-xs">Nuevos talleres registrados por mes</CardDescription>
        </CardHeader>
        <CardContent className="pb-3">
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.growth || []}>
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
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color = "" }: any) {
  return (
    <Card>
      <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
        <CardDescription className="text-xs uppercase font-medium">{title}</CardDescription>
        <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
      </CardHeader>
      <CardContent className="p-3 pt-0"><CardTitle className="text-lg font-bold">{value}</CardTitle></CardContent>
    </Card>
  );
}