import { useState } from "react";
import { useWorkshop } from "@/context/WorkshopContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Save, Building2, Percent, Phone, MapPin, Loader2, ShieldCheck, Key, Lock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function SettingsPage() {
  const { workshop, updateWorkshopProfile, updateUserStatus } = useWorkshop();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: workshop?.name || "",
    address: workshop?.address || "",
    phone: workshop?.phone || "",
    tax_rate: workshop?.tax_rate || 16,
  });

  const [securityForm, setSecurityForm] = useState({
    newPassword: "",
    question: "",
    answer: ""
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateWorkshopProfile(form);
      toast.success("Configuración del taller actualizada correctamente");
    } catch (error) {
      toast.error("No se pudieron guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSecurity = async () => {
    setLoading(true);
    try {
      const payload: any = {};
      if (securityForm.newPassword) payload.password = securityForm.newPassword;
      if (securityForm.question && securityForm.answer) {
        payload.security_questions = [{ question: securityForm.question, answer: securityForm.answer }];
      }
      await updateUserStatus(user!.id, true, payload);
      toast.success("Seguridad actualizada con éxito.");
    } catch (error) {
      toast.error("No se pudo actualizar la seguridad");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Configuración del Taller</h1>
        <p className="text-muted-foreground text-sm">Gestiona la identidad de tu negocio y la seguridad de tu acceso.</p>
      </div>

      <Tabs defaultValue="workshop" className="w-full">
        <TabsList className="bg-muted/50 p-1 rounded-xl mb-4">
          <TabsTrigger value="workshop" className="rounded-lg px-6">Taller</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg px-6">Seguridad</TabsTrigger>
        </TabsList>

        <TabsContent value="workshop">
          <Card className="border-none shadow-md bg-card/60 backdrop-blur-md rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" /> Perfil Comercial
              </CardTitle>
              <CardDescription>Esta información aparecerá en tus facturas PDF.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Nombre Comercial</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="rounded-xl h-11 bg-background/50" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">Teléfono</Label>
                  <Input 
                    value={form.phone} 
                    onChange={(e) => {
                      const raw = e.target.value.replace(/\D/g, "").slice(0, 11);
                      let formatted = raw;
                      if (raw.length > 3 && raw.length <= 6) formatted = `${raw.slice(0, 3)} ${raw.slice(3)}`;
                      else if (raw.length > 6 && raw.length <= 10) formatted = `${raw.slice(0, 3)} ${raw.slice(3, 6)} ${raw.slice(6)}`;
                      else if (raw.length > 10) formatted = `${raw.slice(0, 4)} ${raw.slice(4, 7)} ${raw.slice(7)}`;
                      setForm({...form, phone: formatted});
                    }} 
                    placeholder="Ej: 312 456 7890" 
                    className="rounded-xl h-11 bg-background/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>IVA / Impuesto (%)</Label>
                  <Input 
                    type="number" 
                    value={form.tax_rate} 
                    onChange={e => setForm({...form, tax_rate: Math.max(0, Number(e.target.value))})} 
                    className="rounded-xl h-11 bg-background/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Dirección</Label>
                <Input value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="rounded-xl h-11 bg-background/50" />
              </div>
              <Button className="w-full h-12 rounded-2xl font-bold shadow-lg" onClick={handleSave} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-4 w-4" />}
                Guardar Perfil
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card className="border-none shadow-md bg-card/60 backdrop-blur-md rounded-[2rem]">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2 text-orange-600">
                <Lock className="h-5 w-5" /> Seguridad de Acceso
              </CardTitle>
              <CardDescription>Actualiza tu contraseña y preguntas de recuperación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 bg-muted/30 p-4 rounded-[1.5rem]">
                <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><Key className="h-3 w-3" /> Recuperación</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Nueva Pregunta</Label>
                    <Select value={securityForm.question} onValueChange={v => setSecurityForm({...securityForm, question: v})}>
                      <SelectTrigger className="h-10 bg-background rounded-xl"><SelectValue placeholder="Elegir..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="¿Nombre de tu primera mascota?">¿Mascota?</SelectItem>
                        <SelectItem value="¿Ciudad donde naciste?">¿Ciudad?</SelectItem>
                        <SelectItem value="¿Nombre de tu abuela materna?">¿Abuela?</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Tu Respuesta</Label>
                    <Input value={securityForm.answer} onChange={e => setSecurityForm({...securityForm, answer: e.target.value})} className="h-10 rounded-xl bg-background" placeholder="..." />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase ml-1 opacity-70 tracking-widest">Nueva Contraseña</Label>
                <Input type="password" value={securityForm.newPassword} onChange={e => setSecurityForm({...securityForm, newPassword: e.target.value})} className="h-11 rounded-xl bg-background/50" placeholder="••••••••" />
              </div>

              <Button className="w-full h-12 rounded-2xl font-bold bg-orange-600 hover:bg-orange-700 shadow-orange-500/20 shadow-lg" onClick={handleUpdateSecurity} disabled={loading}>
                {loading ? <Loader2 className="animate-spin mr-2" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                Actualizar Seguridad
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}