import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Wrench, Loader2, Eye, EyeOff, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const { resetPassword, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Verificación de seguridad al cargar: 
  // Si no hay token en el storage, el usuario no debería estar aquí.
  useEffect(() => {
    const token = localStorage.getItem("password_reset_token");
    if (!token) {
      navigate("/login");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const token = localStorage.getItem("password_reset_token");
    const userId = localStorage.getItem("password_reset_userid");

    if (!token || !userId) {
      setError("La sesión de recuperación ha expirado. Intenta de nuevo.");
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

    try {
      await resetPassword(token, password, userId);
      setSuccess(true);
      toast({ title: "Contraseña actualizada", description: "Ya puedes iniciar sesión con tu nueva contraseña." });
      // LIMPIEZA DE SEGURIDAD: Borramos el token para que no pueda ser usado de nuevo
      localStorage.removeItem("password_reset_token");
      localStorage.removeItem("password_reset_userid");
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (success) {
    return (
      <div className="h-screen flex items-center justify-center bg-background p-4 overflow-hidden">
        <div className="w-full max-w-md space-y-6">
          <div className="flex flex-col items-center gap-2">
            <img src="/taller.png" alt="Logo" className="w-[120px] object-contain drop-shadow-xl" />
          </div>
          <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl rounded-[2.5rem] p-4 border">
            <CardContent className="flex flex-col items-center gap-4 py-8">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="text-center space-y-1">
                <p className="text-lg font-semibold text-foreground">¡Contraseña actualizada!</p>
                <p className="text-xs text-muted-foreground">Ya puedes ingresar con tus nuevas credenciales.</p>
              </div>
              <Button className="w-full h-12 rounded-2xl font-bold" onClick={() => navigate("/login")}>
                Ir al inicio de sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex items-center justify-center bg-background relative overflow-hidden p-4">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 z-10 px-6">
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1 animate-in fade-in slide-in-from-left-10 duration-1000">
          <img src="/taller.png" alt="Logo" className="w-[180px] md:w-[280px] object-contain drop-shadow-2xl mb-4" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">AutoTaller</h1>
          <p className="text-xs md:text-base text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-80">Gestión Profesional</p>
        </div>

        <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden border">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-xl font-bold">Nueva Contraseña</CardTitle>
            <CardDescription>Ingresa tu nueva contraseña para acceder al sistema</CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-6">
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive animate-in shake-in duration-300">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="new-password" className="text-[10px] font-bold uppercase ml-1 opacity-70 tracking-widest">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Mínimo 6 caracteres"
                    className="h-12 bg-background/50 border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-4"
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

              <div className="space-y-1.5">
                <Label htmlFor="confirm-new-password" className="text-[10px] font-bold uppercase ml-1 opacity-70 tracking-widest">Confirmar contraseña</Label>
                <Input
                  id="confirm-new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  className="h-12 bg-background/50 border-white/10 rounded-2xl focus:ring-primary focus:border-primary transition-all px-4"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" className="w-full h-12 rounded-2xl text-base font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Actualizar Contraseña"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
}
