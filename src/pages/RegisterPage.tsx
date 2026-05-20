import { useState, useEffect } from "react";
import pistonLogo from "@/assets/pistnlogo.png";
import loginbg from "@/assets/loginbg.webp";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
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
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { register, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Inicializar Turnstile cuando el componente se monta
  useEffect(() => {
    let widgetId: string | null = null;

    const renderWidget = () => {
      // Solo renderizar el widget en producción para evitar errores de dominio y ruido en consola en localhost
      if (!import.meta.env.PROD) return;

      if ((window as any).turnstile && !widgetId) {
        try {
          widgetId = (window as any).turnstile.render("#turnstile-container", {
            sitekey: import.meta.env.VITE_TURNSTILE_SITE_KEY,
            theme: 'light',
            callback: (token: string) => setCaptchaToken(token),
            'expired-callback': () => setCaptchaToken(null),
            'error-callback': () => setCaptchaToken(null),
          });
        } catch (e) {
          console.warn("Turnstile render retry...", e);
        }
      }
    };

    const timer = setInterval(renderWidget, 1000);
    renderWidget(); // Intento inmediato
    return () => clearInterval(timer);
  }, []);

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
    if (!acceptedTerms) {
      setError("Debes aceptar los Términos de Servicio y la Política de Privacidad.");
      return;
    }
    
    if (!captchaToken && import.meta.env.PROD) {
      setError("Por favor completa la verificación de seguridad (Captcha).");
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
        captchaToken: captchaToken, // Enviamos el token al backend
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
    <div className="min-h-screen flex items-center justify-center bg-[#241705] relative p-4 py-4 overflow-hidden">
      {/* Capa de fondo con gradiente direccional */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          background: `linear-gradient(135deg, #bc430d 0%, #241705 100%)`,
        }}
      />
      {/* Resplandor ambiental para dar profundidad */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-[#bc430d] rounded-full blur-[120px] opacity-20 animate-pulse z-0" />

      {/* Contenedor Principal (La Caja Dividida) */}
      <div className="w-[90%] md:w-full max-w-3xl z-10 animate-in fade-in zoom-in duration-700">
        <div className="bg-white border border-[#241705]/10 shadow-2xl rounded-[2.5rem] overflow-hidden p-5 md:p-7">
          
          <div className="space-y-2">
            {/* Logo y Branding */}
            <div className="flex justify-center mb-2">
              <img src={pistonLogo} alt="Pistn Logo" className="w-32 md:w-40 object-contain select-none" />
            </div>

              <div className="text-center space-y-0 mb-0">
                <h2 className="text-xl font-bold text-[#241705]">Solicitar Acceso</h2>
                <p className="text-[#241705]/60 text-[13px] font-medium">Completa el formulario para crear tu cuenta interna</p>
              </div>

              <div className="flex justify-center mb-1">
                <Tabs value={regType} onValueChange={(v) => setRegType(v as any)} className="w-full max-w-xs">
                  <TabsList className="flex w-full rounded-xl h-9 bg-black/5 p-1 gap-1">
                    <TabsTrigger value="owner" className="flex-1 rounded-lg text-[11px] font-bold transition-all data-[state=active]:bg-[#bc430d] data-[state=active]:text-white data-[state=inactive]:text-[#241705]/60 shadow-none">Soy Dueño</TabsTrigger>
                    <TabsTrigger value="employee" className="flex-1 rounded-lg text-[11px] font-bold transition-all data-[state=active]:bg-[#bc430d] data-[state=active]:text-white data-[state=inactive]:text-[#241705]/60 shadow-none">Soy Empleado</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
              {error && (
                <div className="md:col-span-2 flex items-center gap-2 rounded-xl bg-destructive/10 p-2 text-[11px] text-destructive animate-in shake-in duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1">
                <Label htmlFor="name" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Nombre completo</Label>
                <Input
                  id="name"
                  placeholder="Ej: Juan Pérez"
                  className="h-10 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all px-4 text-[#241705] placeholder:text-[#241705]/30"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-email" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Correo electrónico</Label>
                <Input
                  id="reg-email"
                  type="email"
                  placeholder="correo@taller.com"
                  className="h-10 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all px-4 text-[#241705] placeholder:text-[#241705]/30"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>

            {regType === "owner" && (
              <>
              <div className="space-y-1">
                <Label htmlFor="ws-name" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Nombre de tu Taller</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="ws-name"
                    className="pl-10 h-10 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all text-[#241705] placeholder:text-[#241705]/30"
                    placeholder="Ej: Taller Mecánico El Rayo"
                    value={workshopName}
                    onChange={(e) => setWorkshopName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label htmlFor="owner-key" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Clave de Acceso Propietario</Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/40" />
                  <Input
                    id="owner-key"
                    type="password"
                    className="pl-10 h-10 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all text-[#241705] placeholder:text-[#241705]/30"
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
                <div className="space-y-1 md:col-span-2">
                  <Label htmlFor="ws-id" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Código del Taller (ID)</Label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#241705]/30" />
                    <Input
                      id="ws-id"
                      className="pl-10 h-10 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all text-[#241705] placeholder:text-[#241705]/30"
                      placeholder="Pega el código de tu taller"
                      value={workshopIdCode}
                      onChange={(e) => setWorkshopIdCode(e.target.value)}
                      required
                    />
                  </div>
                </div>
              </>
            )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:col-span-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Pregunta Seguridad</Label>
                  <Select value={securityQuestion} onValueChange={setSecurityQuestion}>
                    <SelectTrigger className="h-10 bg-gray-50 border-[#241705]/10 rounded-2xl text-xs text-[#241705] focus:ring-[#bc430d]">
                      <SelectValue placeholder="Elegir" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="¿Nombre de tu primera mascota?">¿Mascota?</SelectItem>
                      <SelectItem value="¿Ciudad donde naciste?">¿Ciudad?</SelectItem>
                      <SelectItem value="¿Nombre de tu abuela materna?">¿Abuela?</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Respuesta</Label>
                  <Input className="h-10 bg-gray-50 border-[#241705]/10 rounded-2xl text-[#241705] px-4 placeholder:text-[#241705]/30" placeholder="..." value={securityAnswer} onChange={e => setSecurityAnswer(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="reg-password" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Contraseña</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="h-10 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all px-4 text-[#241705] placeholder:text-[#241705]/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#241705]/40 hover:text-[#241705]"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="confirm-password" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite la contraseña"
                    className="h-10 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all px-4 text-[#241705] placeholder:text-[#241705]/30"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                  />
                </div>
              </div>

              {/* Widget de Turnstile */}
              <div className="md:col-span-2 flex justify-center py-0">
                <div id="turnstile-container"></div>
              </div>

              <div className="md:col-span-2 flex items-center justify-center space-x-2 px-4 py-1">
                <Checkbox 
                  id="terms" 
                  checked={acceptedTerms} 
                  onCheckedChange={(checked) => setAcceptedTerms(!!checked)}
                  className="mt-0.5 border-[#241705]/20 data-[state=checked]:bg-[#bc430d] data-[state=checked]:border-[#bc430d]"
                />
                <label htmlFor="terms" className="text-[10px] text-[#241705]/60 leading-tight cursor-pointer">
                  Acepto los{" "}
                  <Link to="/terminos" className="font-bold underline hover:text-[#bc430d]">Términos de Servicio</Link> y la{" "}
                  <Link to="/privacidad" className="font-bold underline hover:text-[#bc430d]">Política de Privacidad</Link> de Pistn.
                </label>
              </div>

              <Button type="submit" className="md:col-span-2 w-full max-w-sm mx-auto h-10 rounded-2xl text-base font-bold bg-[#bc430d] hover:bg-[#bc430d]/90 text-white shadow-lg shadow-[#bc430d]/20 hover:scale-[1.01] active:scale-[0.99] transition-all border-none" disabled={isLoading}>
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

            <div className="text-center pt-1">
              <Link
                to="/login"
                className="inline-flex items-center gap-1 text-xs text-[#bc430d] hover:underline font-bold"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
