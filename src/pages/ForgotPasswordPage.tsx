import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, CheckCircle2, ShieldQuestion, AlertCircle } from "lucide-react";
import api from "@/api/api";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const [username, setUsername] = useState("");
  const [step, setStep] = useState<"user" | "question" | "success">("user");
  const [question, setQuestion] = useState("");
  const [answer, setSecurityAnswer] = useState("");
  const [userId, setUserId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleVerifyUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const cleanUsername = username.toLowerCase().trim();
      const { data } = await api.get(`/users/verify/${encodeURIComponent(cleanUsername)}`);
      
      if (!data.securityQuestions || data.securityQuestions.length === 0) {
        setError("Este usuario no tiene preguntas de seguridad configuradas. Contacta a soporte.");
        return;
      }

      setUserId(data.userId);
      setQuestion(data.securityQuestions[0].question);
      setStep("question");
    } catch (err: any) {
      // Capturamos el mensaje exacto que envía el servidor (404 o 403)
      setError(err.response?.data?.message || "Usuario no encontrado o inactivo");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const { data } = await api.post("/users/verify-answers", {
        userId,
        answers: [{ index: 0, answer }]
      });
      // Guardamos el token para la siguiente pantalla
      localStorage.setItem("password_reset_token", data.resetToken);
      localStorage.setItem("password_reset_userid", userId);
      setStep("success");
    } catch (err: any) {
      setError(err.response?.data?.message || "Respuesta incorrecta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-x-hidden p-4 py-8">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-500/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-center justify-center gap-8 md:gap-20 z-10 px-6">
        {/* Logo y Branding */}
        <div className="flex flex-col items-center md:items-start text-center md:text-left gap-1 animate-in fade-in slide-in-from-left-10 duration-1000">
          <img src="/taller.png" alt="Logo" className="w-[180px] md:w-[280px] object-contain drop-shadow-2xl mb-4" />
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-foreground">AutoTaller</h1>
          <p className="text-xs md:text-base text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-80">Gestión Profesional</p>
        </div>

        {/* Contenedor del Formulario */}
        <div className="w-full max-w-md space-y-4 animate-in fade-in slide-in-from-right-10 duration-1000 delay-200">
        <Card className="bg-white/40 dark:bg-slate-900/40 backdrop-blur-xl border-white/20 dark:border-white/10 shadow-2xl rounded-[2.5rem] overflow-hidden border">
          <CardHeader className="text-center pb-2 pt-6">
            <CardTitle className="text-xl font-bold">Recuperar Contraseña</CardTitle>
            <CardDescription>
              {step === "user" && "Ingresa tu correo para buscar tu cuenta"}
              {step === "question" && "Responde para validar tu identidad"}
              {step === "success" && "Identidad validada con éxito"}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-6">
            {error && (
              <div className="mb-4 flex items-center gap-2 rounded-xl bg-destructive/10 p-3 text-xs text-destructive animate-in shake-in duration-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}

            {step === "success" ? (
              <div className="flex flex-col items-center gap-4 py-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                  <CheckCircle2 className="h-8 w-8 text-success" />
                </div>
                <p className="text-sm text-center text-muted-foreground">Tu identidad ha sido confirmada. Ahora puedes elegir una nueva clave.</p>
                <Button className="w-full rounded-2xl h-12 font-bold" onClick={() => navigate("/reset-password")}>
                  Establecer nueva contraseña
                </Button>
              </div>
            ) : step === "user" ? (
              <form onSubmit={handleVerifyUser} className="space-y-5">
                <div className="space-y-1.5">
                  <Label htmlFor="reset-email" className="text-[10px] font-bold uppercase ml-1 opacity-70 tracking-widest">Correo electrónico</Label>
                  <Input id="reset-email" type="email" placeholder="correo@taller.com" className="h-12 bg-background/50 rounded-2xl px-4" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-12 rounded-2xl font-bold shadow-lg" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Siguiente"}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyAnswer} className="space-y-5">
                <div className="space-y-3 bg-primary/5 p-4 rounded-2xl border border-primary/10">
                  <div className="flex items-center gap-2 text-primary">
                    <ShieldQuestion className="h-4 w-4" />
                    <span className="text-xs font-bold uppercase tracking-tight">Pregunta de Seguridad</span>
                  </div>
                  <p className="text-sm font-medium">{question}</p>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Tu Respuesta</Label>
                  <Input className="h-12 bg-background/50 rounded-2xl px-4" placeholder="Escribe aquí..." value={answer} onChange={e => setSecurityAnswer(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full h-12 rounded-2xl font-bold shadow-lg shadow-primary/20" disabled={isLoading}>
                  {isLoading ? <Loader2 className="animate-spin" /> : "Verificar"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>

        <div className="text-center md:text-left md:ml-4">
          <Link
            to="/login"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline font-medium uppercase tracking-tighter"
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
