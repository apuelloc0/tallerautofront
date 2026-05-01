import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      if ((window as any).turnstile && !widgetId) {
        try {
          widgetId = (window as any).turnstile.render("#turnstile-container-login", {
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
    try {
      if (!captchaToken && import.meta.env.PROD) {
        setError("Por favor completa la verificación de seguridad (Captcha).");
        return;
      }
      await login(username, password, captchaToken);
      toast({ title: "Bienvenido", description: "Sesión iniciada correctamente." });
      navigate("/", { replace: true }); // Siempre redirigir al Dashboard después de iniciar sesión
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 z-10 px-6">
        {/* Logo */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1 animate-in fade-in slide-in-from-left-10 duration-1000">
          <img src="/taller.png" alt="Logo" className="w-[180px] md:w-[280px] object-contain drop-shadow-2xl mb-4" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">AutoTaller</h1>
          <p className="text-xs md:text-base text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-80">Gestión Profesional</p>
        </div>

        {/* Formulario */}
        <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden border">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-xl font-bold">Bienvenido</CardTitle>
            <CardDescription>Ingresa tus credenciales para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive animate-in shake-in duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-[10px] font-bold uppercase ml-1 opacity-70 tracking-widest">Correo electrónico</Label>
                <Input
                  id="username"
                  type="email"
                  placeholder="correo@taller.com"
                  className="h-12 bg-background/50 border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-4"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between ml-1">
                  <Label htmlFor="password" className="text-[10px] font-bold uppercase opacity-70 tracking-widest">Contraseña</Label>
                  <Link
                    to="/recuperar-password"
                    className="text-[10px] font-bold text-primary hover:text-primary/80 transition-colors uppercase"
                  >
                    ¿Olvidó su clave?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className="h-12 bg-background/50 border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-4"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
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

              {/* Widget de Turnstile */}
              <div className="flex justify-center py-2">
                <div id="turnstile-container-login"></div>
              </div>

              <Button type="submit" className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={isLoading}>
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
          </CardContent>
        </Card>

        <p className="text-center md:text-left md:ml-4 text-xs text-muted-foreground">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="text-primary hover:underline font-medium">
            Solicitar acceso
          </Link>
        </p>
        </div>
      </div>
    </div>
  );
}
