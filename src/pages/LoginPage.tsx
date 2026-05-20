import { useState, useEffect } from "react";
import pistonLogo from "@/assets/pistnlogo.png";
import loginbg from "@/assets/loginbg.webp";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const { login, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || "/";

  // Inicializar Turnstile cuando el componente se monta
  useEffect(() => {
    let widgetId: string | null = null;

    const renderWidget = () => {
      // Solo renderizar el widget en producción para evitar errores de dominio en localhost
      if (!import.meta.env.PROD) return;

      const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
      
      if (!siteKey) {
        console.error("❌ [SECURITY] Falta VITE_TURNSTILE_SITE_KEY en el archivo .env");
        return;
      }

      if ((window as any).turnstile && !widgetId) {
        try {
          widgetId = (window as any).turnstile.render("#turnstile-container-login", {
            sitekey: siteKey,
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
    try {
      if (!captchaToken && import.meta.env.PROD) {
        setError("Por favor completa la verificación de seguridad (Captcha).");
        return;
      }
      await login(username, password, captchaToken);
      toast({ title: "Bienvenido", description: "Sesión iniciada correctamente." });
      navigate("/dashboard", { replace: true }); // Redirigir a la lógica de selección de dashboard
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-[#241705] relative overflow-hidden p-4">
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
    <div className="w-full max-w-5xl z-10 px-4 animate-in fade-in zoom-in duration-700">
      <div className="flex flex-col md:flex-row bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl rounded-[2.5rem] overflow-hidden min-h-[600px]">
        
        {/* Lado Izquierdo: Imagen Decorativa */}
        <div className="hidden md:flex md:w-1/2 relative bg-black/20 items-center justify-center overflow-hidden">
          {/* Capa de imagen de fondo original */}
          <div 
            className="absolute inset-0 z-0 transition-all duration-700 bg-cover bg-center"
            style={{
              backgroundImage: `url(${loginbg})`
            }}
          />
        </div>

        {/* Lado Derecho: Formulario */}
        <div className="w-full md:w-1/2 flex-1 p-8 md:p-12 flex flex-col justify-center bg-white">
          <div className="space-y-6">
            {/* Logo y Branding */}
            <div className="flex justify-center mb-4">
              <img src={pistonLogo} alt="Pistn Logo" className="w-32 object-contain select-none" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-[#241705]">Bienvenido</h2>
              <p className="text-[#241705]/60 text-sm font-medium">Ingresa tus credenciales para acceder al sistema</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive animate-in shake-in duration-300">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-[10px] font-bold uppercase ml-1 text-[#241705]/70 tracking-widest">Correo electrónico</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="correo@taller.com"
                  className="h-12 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all px-4 text-[#241705] placeholder:text-[#241705]/30"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase text-[#241705]/70 tracking-widest">Contraseña</Label>
                  <Link
                    to="/recuperar-password"
                    className="text-[10px] font-bold text-[#bc430d] hover:text-[#bc430d]/80 transition-colors uppercase"
                  >
                    ¿Olvidó su clave?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 bg-gray-50 border-[#241705]/10 rounded-2xl focus:ring-[#bc430d] focus:border-[#bc430d] transition-all px-4 text-[#241705] placeholder:text-[#241705]/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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

              {/* Widget de Turnstile */}
              <div className="flex justify-center py-1">
                <div id="turnstile-container-login"></div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-2xl text-base font-bold bg-[#bc430d] hover:bg-[#bc430d]/90 text-white shadow-lg shadow-[#bc430d]/20 hover:scale-[1.02] active:scale-[0.98] transition-all border-none" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Entrar al Sistema"
                )}
              </Button>
            </form>

            <p className="text-center text-xs text-[#241705]/60 pt-4 font-medium">
              ¿No tienes cuenta?{" "}
              <Link to="/registro" className="text-[#bc430d] hover:underline font-bold">
                Solicitar acceso
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}
