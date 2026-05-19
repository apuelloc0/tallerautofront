import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import api from "@/api/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar as CalendarIcon, ArrowLeft, Users, Building, UserCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CarLoader } from "@/components/ui/CarLoader";

export default function SaasCalendarPage() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());

  const { data: users, isLoading } = useQuery({
    queryKey: ["saas-all-users"],
    queryFn: async () => {
      const { data } = await api.get("/invitations/all-users");
      return data.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const dateKey = useMemo(() => selectedDate?.toLocaleDateString('en-CA'), [selectedDate]);

  // Usuarios que se unieron el día seleccionado
  const joinedToday = useMemo(() => 
    (users || []).filter((u: any) => u.created_at?.split('T')[0] === dateKey), 
  [users, dateKey]);

  // Mapa para poner puntos en el calendario donde hubo registros
  const activityMap = useMemo(() => {
    const map: Record<string, boolean> = {};
    (users || []).forEach((u: any) => {
      if (u.created_at) {
        const d = u.created_at.split('T')[0];
        map[d] = true;
      }
    });
    return map;
  }, [users]);

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><CarLoader message="Pistn: Analizando registros..." /></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/saas-admin")} className="rounded-full">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6 text-primary" /> Calendario de Adopción
          </h1>
          <p className="text-muted-foreground text-sm font-medium">Cronograma de nuevos usuarios en la plataforma</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <Card className="lg:col-span-5 border-none shadow-xl bg-card/60 backdrop-blur-md rounded-[2.5rem] p-4 flex justify-center h-fit">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="p-0"
            modifiers={{
              hasJoined: (date) => activityMap[date.toLocaleDateString('en-CA')],
            }}
            modifiersStyles={{
              hasJoined: { fontWeight: 'bold', color: 'hsl(var(--primary))', borderBottom: '2px solid hsl(var(--primary))' }
            }}
          />
        </Card>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-primary/5 p-4 rounded-3xl border border-primary/10 flex justify-between items-center">
            <div>
              <p className="text-[10px] font-black uppercase text-primary/60 tracking-widest">Registros del día</p>
              <p className="text-lg font-bold">
                {selectedDate?.toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <Badge className="h-7 rounded-lg">{joinedToday.length} nuevos</Badge>
          </div>

          <div className="space-y-2">
            {joinedToday.length === 0 ? (
              <div className="p-12 text-center border-2 border-dashed rounded-[2rem] opacity-30">
                <Users className="h-10 w-10 mx-auto mb-2" />
                <p className="text-xs font-bold uppercase">Nadie se unió este día</p>
              </div>
            ) : (
              joinedToday.map((u: any) => (
                <Card key={u.id} className="border-none shadow-sm bg-card/40 rounded-2xl overflow-hidden hover:bg-card/80 transition-colors">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-xl", 
                        u.role === 'ADMINISTRADOR' ? "bg-orange-500/10" : "bg-primary/10"
                      )}>
                        {u.role === 'ADMINISTRADOR' ? <Building className="h-4 w-4 text-orange-600" /> : <UserCheck className="h-4 w-4 text-primary" />}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm tracking-tight">{u.full_name}</span>
                        <span className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                           {u.workshops?.name || 'Sin Taller'} • {u.username}
                        </span>
                      </div>
                    </div>
                    <Badge variant="outline" className={cn(
                      "text-[9px] font-black uppercase tracking-tighter",
                      u.role === 'ADMINISTRADOR' ? "border-orange-200 text-orange-600" : "border-primary/20 text-primary"
                    )}>
                      {u.role}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}