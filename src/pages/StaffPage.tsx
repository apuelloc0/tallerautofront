import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkshop } from "@/context/WorkshopContext";
import { useAuth } from "@/context/AuthContext";
import { ROLE_LABELS, ROLE_DESCRIPTIONS } from "@/types/auth";
import { UserCheck, UserX, Mail, ShieldAlert, Info } from "lucide-react";
import { toast } from "sonner";

export default function StaffPage() {
  const { users, updateUserStatus, deleteUser } = useWorkshop();
  const { user: currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const handleToggleActive = async (userId: string, currentStatus: boolean) => {
    console.log("Intentando actualizar usuario:", userId, "a estado:", !currentStatus);
    setIsProcessing(userId);
    try {
      await updateUserStatus(userId, !currentStatus);
      toast.success(currentStatus ? "Acceso revocado" : "Acceso concedido");
    } catch (error: any) {
      console.error("Error detallado capturado:", error);
      // Si el backend envió un mensaje, lo usamos. Si no, usamos el error técnico de Axios.
      const serverMessage = error.response?.data?.message;
      const technicalError = error.message;
      toast.error(`Error: ${serverMessage || technicalError || "Desconocido"}`);
    } finally {
      setIsProcessing(null);
    }
  };

  const handleDeleteRequest = (userId: string) => {
    setUserToDelete(userId);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;
    
    setIsProcessing(userToDelete);
    try {
      await deleteUser(userToDelete);
      toast.success("Solicitud denegada y eliminada");
      setUserToDelete(null);
    } catch (error: any) {
      const message = error.response?.data?.message || "No se pudo eliminar la solicitud";
      toast.error(message);
    } finally {
      setIsProcessing(null);
    }
  };

  // Filtramos la lista para excluir al usuario actual y separar por estado
  const otherUsers = users.filter(u => u.id !== currentUser?.id);
  
  const pendingUsers = otherUsers.filter(u => u.active !== true);
  const activeUsers = otherUsers.filter(u => u.active === true);

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold tracking-tight">Gestión de Personal</h1>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent><p className="max-w-xs">Controla los accesos al sistema. Aprueba nuevas solicitudes o revoca permisos de usuarios activos.</p></TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {pendingUsers.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader>
            <div className="flex items-center gap-2 text-orange-600">
              <ShieldAlert className="h-5 w-5" />
              <CardTitle className="text-lg">Solicitudes Pendientes</CardTitle>
            </div>
            <CardDescription>Estos usuarios se han registrado pero aún no tienen acceso.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Usuario/Email</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acción</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingUsers.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.username}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <Badge variant="outline" className="w-fit">{ROLE_LABELS[u.role.toLowerCase()] || u.role}</Badge>
                          <span className="text-[10px] text-muted-foreground mt-1">Esperando aprobación</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            onClick={() => handleDeleteRequest(u.id)}
                            disabled={isProcessing === u.id}
                          >
                            <UserX className="mr-2 h-4 w-4" /> Denegar
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleToggleActive(u.id, u.active)}
                            disabled={isProcessing === u.id}
                          >
                            <UserCheck className="mr-2 h-4 w-4" /> Aprobar Acceso
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personal con Acceso</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acceso</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeUsers.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="font-medium">{u.full_name}</div>
                    <div className="text-xs text-muted-foreground">{u.username}</div>
                  </TableCell>
                  <TableCell><Badge variant="secondary">{ROLE_LABELS[u.role.toLowerCase()] || u.role}</Badge></TableCell>
                  <TableCell>
                    {u.active ? (
                      <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0">Activo</Badge>
                    ) : (
                      <Badge variant="outline">Inactivo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Switch 
                      checked={u.active} 
                      onCheckedChange={() => handleToggleActive(u.id, u.active)}
                      disabled={isProcessing === u.id || u.role.toLowerCase() === 'admin'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de confirmación para denegar solicitud */}
      <Dialog open={!!userToDelete} onOpenChange={(open) => !open && setUserToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Denegar Solicitud</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas denegar y eliminar esta solicitud de acceso? Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserToDelete(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isProcessing === userToDelete}>
              Confirmar Denegación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}