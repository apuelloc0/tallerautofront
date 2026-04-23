import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, Loader2, ArrowLeft, Eye, EyeOff, Building2, Key } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ROLE_LABELS, ROLE_DESCRIPTIONS, type UserRole } from "@/types/auth";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [regType, setRegType] = useState<"owner" | "employee">("owner");
  const [workshopName, setWorkshopName] = useState("");
  const [workshopIdCode, setWorkshopIdCode] = useState("");
  const [ownerKey, setOwnerKey] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [securityQuestion, setSecurityQuestion] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (regType === "owner") {
      if (!workshopName.trim()) {
        setError("El nombre del taller es obligatorio.");
        return;
      }
      if (!ownerKey.trim()) {
        setError("La clave de acceso para propietarios es obligatoria.");
        return;
      }
    }
    if (regType === "employee" && !workshopIdCode.trim()) {
      setError("El código del taller es obligatorio.");
      return;
    }
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    if (!securityQuestion || !securityAnswer) {
      setError("La pregunta de seguridad es necesaria para recuperar tu cuenta.");
      return;
    }

    try {
      // Para dueños, el rol es ADMINISTRADOR por defecto. Para empleados, el backend lo determina.
      const finalRole = regType === "owner" ? "ADMINISTRADOR" : undefined;

      const response = await register({
        full_name: name,
        username: email.toLowerCase().trim(),
        password,
        role: finalRole,
        workshop_name: regType === "owner" ? workshopName : undefined,
        join_code: regType === "employee" ? workshopIdCode : undefined,
        license_code: regType === "owner" ? ownerKey : undefined,
        security_questions: [{ question: securityQuestion, answer: securityAnswer }]
      });

      const successMsg = regType === "owner" 
        ? `Taller creado. Comparte este código con tu equipo para que se unan: ${response.join_code}`
        : "Tu solicitud de unión ha sido enviada. Espera a que el dueño te dé acceso.";

      toast({ title: "Registro exitoso", description: successMsg });
      navigate("/login");
    } catch (err: any) {
      // Manejo de error si la ruta no existe o falla el servidor
      const serverMessage = err.response?.data?.message;
      setError(err.response?.status === 404 ? "El servicio de registro no está disponible." : (serverMessage || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative p-4 py-10">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-6xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 z-10 relative">
        {/* Logo */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1 animate-in fade-in slide-in-from-left-10 duration-1000">
          <img src="/taller.png" alt="Logo" className="w-[140px] md:w-[220px] object-contain drop-shadow-2xl mb-2" />
          <h1 className="text-2xl md:text-4xl font-black tracking-tighter text-foreground mt-1">AutoTaller</h1>
          <p className="text-[10px] md:text-sm text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-80">Registro de Personal</p>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-md animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl rounded-[2rem] overflow-hidden border">
          <CardHeader className="text-center pb-2 pt-4">
            <CardTitle className="text-base font-bold">Solicitar Acceso</CardTitle>
            <CardDescription>Completa el formulario para crear tu cuenta interna</CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-4">
          <Tabs value={regType} onValueChange={(v) => setRegType(v as any)} className="mb-3">
            <TabsList className="grid w-full grid-cols-2 rounded-xl h-8">
              <TabsTrigger value="owner">Soy Dueño</TabsTrigger>
              <TabsTrigger value="employee">Soy Empleado</TabsTrigger>
            </TabsList>
          </Tabs>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-2 text-[10px] text-destructive">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-0.5">
                <Label htmlFor="name" className="text-[9px] font-bold uppercase ml-1 opacity-70">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan Pérez"
                  className="h-10 bg-background/50 border-white/10 rounded-xl"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="reg-email" className="text-[9px] font-bold uppercase ml-1 opacity-70">Correo electrónico</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="correo@taller.com"
                  className="h-10 bg-background/50 border-white/10 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

            {regType === "owner" && (
              <>
              <div className="space-y-0.5">
                <Label htmlFor="ws-name" className="text-[9px] font-bold uppercase ml-1 opacity-70">Nombre de tu Taller</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="ws-name"
                    className="pl-9 h-10 bg-background/50 border-white/10 rounded-xl"
                    placeholder="Ej: Taller Mecánico El Rayo"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-0.5">
                <Label htmlFor="owner-key" className="text-[9px] font-bold uppercase ml-1 opacity-70">Clave de Acceso Propietario</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="owner-key"
                    type="password"
                    className="pl-9 h-10 bg-background/50 border-white/10 rounded-xl"
                    placeholder="Clave de Licencia"
                    value={ownerKey}
                    onChange={(e) => setOwnerKey(e.target.value)}
                    required
                  />
                </div>
              </div>
              </>
            )}
            
            {regType === "employee" && (
              <>
                <div className="space-y-0.5">
                  <Label htmlFor="ws-id" className="text-[9px] font-bold uppercase ml-1 opacity-70">Código del Taller (ID)</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="ws-id"
                      className="pl-9 h-10 bg-background/50 border-white/10 rounded-xl"
                      placeholder="Pega el código de tu taller"
                      value={workshopIdCode}
                      onChange={(e) => setWorkshopIdCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-0.5">
                  <Label className="text-[9px] font-bold uppercase ml-1 opacity-70">Pregunta de Seguridad</Label>
                  <Select value={securityQuestion} onValueChange={setSecurityQuestion}>
                    <SelectTrigger className="h-10 bg-background/50 border-white/10 rounded-xl text-xs">
                      <SelectValue placeholder="Selecciona" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="¿Nombre de tu primera mascota?">¿Mascota?</SelectItem>
                      <SelectItem value="¿Ciudad donde naciste?">¿Ciudad?</SelectItem>
                      <SelectItem value="¿Nombre de tu abuela materna?">¿Abuela?</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-0.5">
                  <Label className="text-[9px] font-bold uppercase ml-1 opacity-70">Tu Respuesta</Label>
                  <Input className="h-10 bg-background/50 border-white/10 rounded-xl" placeholder="..." value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} />
                </div>
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="reg-password" className="text-[9px] font-bold uppercase ml-1 opacity-70">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="h-10 bg-background/50 border-white/10 rounded-xl"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-0.5">
                <Label htmlFor="confirm-password" className="text-[9px] font-bold uppercase ml-1 opacity-70">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    className="h-10 bg-background/50 border-white/10 rounded-xl"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-10 rounded-xl text-sm font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  "Crear Cuenta"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="text-center md:text-left md:ml-4 mt-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al inicio de sesión
          </Link>
        </div>
        </div>
      </div>
    </div>
  );
}
