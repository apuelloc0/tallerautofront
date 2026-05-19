import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import pistonLogo from "@/assets/piston.webp";
import { 
  LayoutDashboard, 
  Columns3, 
  Package, 
  Users, 
  ChevronRight, 
  CheckCircle2 
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const TOUR_STEPS = [
  {
    title: "¡Bienvenido a Pistn!",
    description: "Estamos listos para transformar la gestión de tu taller. Déjanos darte un breve recorrido por las herramientas clave.",
    icon: <img src={pistonLogo} className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 animate-bounce" alt="Pistn" />,
    badge: "Inicio"
  },
  {
    title: "Dashboard Inteligente",
    description: "Aquí verás tus indicadores clave (KPIs), vehículos listos para entrega y alertas de stock en tiempo real.",
    icon: <LayoutDashboard className="h-12 w-12 text-primary mx-auto mb-4" />,
    badge: "Control"
  },
  {
    title: "Tablero Kanban",
    description: "Gestiona el flujo de trabajo arrastrando los vehículos. Desde que ingresan hasta que el técnico solicita el veredicto final.",
    icon: <Columns3 className="h-12 w-12 text-primary mx-auto mb-4" />,
    badge: "Operaciones"
  },
  {
    title: "Inventario y Repuestos",
    description: "Controla tu stock con precisión. El sistema descuenta automáticamente los repuestos cuando los técnicos los usan.",
    icon: <Package className="h-12 w-12 text-primary mx-auto mb-4" />,
    badge: "Almacén"
  },
  {
    title: "Gestión de Personal",
    description: "Crea tu equipo usando los códigos de unión. Recuerda activar a tus empleados para que puedan empezar a trabajar.",
    icon: <Users className="h-12 w-12 text-primary mx-auto mb-4" />,
    badge: "Equipo",
    adminOnly: true
  }
];

export function OnboardingTour() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Verificar si el usuario ya vio el tour en este navegador
    const hasSeenTour = localStorage.getItem(`pistn_tour_seen_${user?.id}`);
    if (!hasSeenTour && user) {
      // Pequeño delay para que no salga disparado antes de que cargue el dashboard
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const filteredSteps = TOUR_STEPS.filter(step => 
    !step.adminOnly || (user?.role?.toLowerCase() === 'administrador' || user?.role?.toLowerCase() === 'admin')
  );

  const handleNext = () => {
    if (currentStep < filteredSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(`pistn_tour_seen_${user?.id}`, "true");
  };

  const step = filteredSteps[currentStep];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-[2.5rem] border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <div className="pt-6 text-center">
          <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 uppercase text-[9px] font-black tracking-widest">
            {step.badge} • Paso {currentStep + 1} de {filteredSteps.length}
          </Badge>
          
          <div className="animate-in zoom-in duration-300">
            {step.icon}
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-2xl font-black tracking-tight text-center">
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground leading-relaxed px-2">
              {step.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex justify-center gap-1.5 py-4">
          {filteredSteps.map((_, idx) => (
            <div 
              key={idx} 
              className={cn(
                "h-1.5 rounded-full transition-all duration-300",
                idx === currentStep ? "w-8 bg-primary" : "w-1.5 bg-muted"
              )} 
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-center mt-2">
          <Button 
            onClick={handleNext} 
            className="w-full h-12 rounded-2xl font-bold text-base shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
          >
            {currentStep === filteredSteps.length - 1 ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" /> ¡Empezar ahora!
              </>
            ) : (
              <>
                Siguiente <ChevronRight className="ml-2 h-5 w-5" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}