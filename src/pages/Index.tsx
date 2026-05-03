import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, LayoutDashboard, Wrench, ShieldCheck, Users } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import jeepImage from "../assets/jeep2.webp";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Si el usuario ya está autenticado, lo enviamos directo al dashboard interno
  useEffect(() => {
    if (user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-950 relative overflow-hidden text-white">
      {/* SECCIÓN FONDO/IZQUIERDA: Imagen (Background en móvil, lateral en escritorio) */}
      <div className="absolute inset-0 md:relative md:w-1/2 overflow-hidden bg-muted z-0">
        <img 
          src={jeepImage} 
          alt="Mantenimiento Jeep" 
          className="absolute inset-0 w-full h-full object-cover object-center animate-in fade-in duration-1000"
        />
        {/* Overlay extra de oscurecimiento para legibilidad en móviles */}
        <div className="absolute inset-0 bg-slate-950/60 md:hidden z-[5]" />
        
        {/* Overlays oscuros para efecto cinematográfico y transición suave (Compartidos) */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent z-10" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-slate-950 z-10" />
        
        {/* Badge flotante decorativo sobre la imagen */}
        <div className="hidden md:block absolute bottom-10 left-10 z-20 bg-slate-900/80 backdrop-blur-md p-4 rounded-2xl border border-white/10 shadow-2xl animate-in slide-in-from-bottom-10 duration-1000 delay-500">
          <p className="text-orange-500 font-black italic text-lg leading-none mb-1">Power & Control</p>
          <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Engineered for Workshops</p>
        </div>
      </div>

      {/* SECCIÓN DERECHA: Contenido y CTAs */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 relative z-10">
        {/* Elementos decorativos de fondo (Consistencia visual con Login/Register) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[70%] h-[70%] bg-primary/15 rounded-full blur-[140px]" />
          <div className="absolute bottom-[-10%] right-[10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="max-w-xl w-full text-center z-20 space-y-6 md:space-y-8 animate-in fade-in slide-in-from-right-10 duration-1000">
          {/* Logo y Cabecera */}
          <div className="flex flex-col items-center gap-6">
            <img 
              src="/taller.png" 
              alt="AutoTaller Logo" 
              className="w-32 md:w-48 object-contain drop-shadow-2xl animate-pulse" 
            />
            <div className="space-y-1">
              <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-white italic">
                Auto<span className="text-primary">Taller</span>
              </h1>
              <p className="text-sm md:text-lg text-orange-500/80 font-bold uppercase tracking-[0.3em]">
                Gestión Profesional de Patio
              </p>
            </div>
          </div>

          {/* Propuesta de valor corta */}
          <div className="space-y-4">
            <p className="text-xl md:text-3xl text-white font-bold leading-tight tracking-tight">
              La plataforma integral para modernizar tu taller mecánico. 
            </p>
            <p className="text-slate-400 text-base md:text-lg font-medium border-l-4 border-primary/40 pl-4">
              Control de órdenes, inventarios y personal en tiempo real.
            </p>
          </div>

          {/* Acciones Principales */}
          <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
            <Button asChild size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-all">
              <Link to="/login">
                Entrar al Sistema <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto h-14 px-8 rounded-2xl text-lg font-bold border-2 border-white/10 hover:bg-white/5 transition-all bg-white/5 text-white">
              <Link to="/registro">
                Registrar mi Taller
              </Link>
            </Button>
          </div>

          {/* Mini Features (Sutiles) */}
          <div className="hidden md:grid grid-cols-4 gap-4 pt-12 border-t border-white/10">
            <div className="flex flex-col items-center gap-1 opacity-80">
              <LayoutDashboard className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Dashboard</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-80">
              <Wrench className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Órdenes</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-80">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Seguridad</span>
            </div>
            <div className="flex flex-col items-center gap-1 opacity-80">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300">Personal</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Index;
