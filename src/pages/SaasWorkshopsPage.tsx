import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/api/api";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Building, Power, PowerOff, Trash2 } from "lucide-react";
import { CarLoader } from "@/components/ui/CarLoader";
import { toast } from "sonner";

export default function SaasWorkshopsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["saas-workshops"],
    queryFn: async () => {
      const { data } = await api.get("/invitations/workshops");
      return data.data;
    },
  });

  const updateWsMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { data } = await api.patch(`/invitations/workshops/${id}`, { payment_status: status });
      return data;
    },
    onSuccess: () => {
      toast.success("Estado del taller actualizado");
      queryClient.invalidateQueries({ queryKey: ["saas-workshops"] });
    },
  });

  const deleteWsMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/invitations/workshops/${id}`);
    },
    onSuccess: () => {
      toast.success("Taller y personal eliminados permanentemente");
      queryClient.invalidateQueries({ queryKey: ["saas-workshops"] });
    },
  });

  if (isLoading) return (
    <div className="flex h-[60vh] items-center justify-center">
      <CarLoader message="Listando talleres..." />
    </div>
  );

  const workshops = data || [];

  return (
    <div className="container max-w-5xl mx-auto py-8 space-y-6">
      <div className="flex items-center gap-2">
        <Building className="h-6 w-6 text-primary" />
        <h1 className="text-3xl font-bold tracking-tight">Gestión de Talleres</h1>
      </div>

      <Card className="border-none shadow-md overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre del Taller</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado Pago</TableHead>
                <TableHead>Registro</TableHead>
                <TableHead className="text-right">Acción</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workshops.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No hay talleres registrados.</TableCell></TableRow>
              ) : workshops.map((ws: any) => (
                <TableRow key={ws.id}>
                  <TableCell className="font-semibold">{ws.name}</TableCell>
                  <TableCell><Badge variant="secondary">{ws.subscription_plan?.toUpperCase()}</Badge></TableCell>
                  <TableCell>
                    <Badge className={ws.payment_status === 'active' ? 'bg-green-500' : 'bg-red-500'}>
                      {ws.payment_status?.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{new Date(ws.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right flex justify-end gap-1">
                    <Button 
                      variant="ghost" size="icon"
                      className={ws.payment_status === 'active' ? "text-red-500" : "text-green-500"}
                      onClick={() => updateWsMutation.mutate({ id: ws.id, status: ws.payment_status === 'active' ? 'suspended' : 'active' })}
                    >
                      {ws.payment_status === 'active' ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" size="icon"
                      className="text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if(window.confirm(`¿Eliminar permanentemente el taller "${ws.name}"?`)) {
                          deleteWsMutation.mutate(ws.id);
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
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