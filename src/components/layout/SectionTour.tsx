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
import { ChevronRight, CheckCircle2, HelpCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

interface TourStep {
  title: string;
  description: string;
  icon: React.ReactNode;
}

interface SectionTourProps {
  sectionKey: string;
  sectionName: string;
  steps: TourStep[];
}

export function SectionTour({ sectionKey, sectionName, steps }: SectionTourProps) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const hasSeenTour = localStorage.getItem(`pistn_tour_${sectionKey}_${user?.id}`);
    // Solo mostramos si ya vio el tour principal (opcional) y no ha visto este
    const hasSeenMainTour = localStorage.getItem(`pistn_tour_seen_${user?.id}`);
    
    if (!hasSeenTour && hasSeenMainTour && user) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [user, sectionKey]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem(`pistn_tour_${sectionKey}_${user?.id}`, "true");
  };

  const step = steps[currentStep];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-[380px] rounded-[2rem] border-none shadow-2xl bg-card/95 backdrop-blur-xl">
        <div className="pt-4 text-center">
          <Badge variant="outline" className="mb-4 bg-primary/5 text-primary border-primary/20 uppercase text-[9px] font-black tracking-widest">
            Guía de {sectionName} • {currentStep + 1} / {steps.length}
          </Badge>
          
          <div className="text-primary mb-4 flex justify-center animate-in zoom-in duration-300">
            {step.icon}
          </div>

          <DialogHeader className="space-y-2">
            <DialogTitle className="text-xl font-black tracking-tight text-center">
              {step.title}
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground text-sm leading-relaxed px-2">
              {step.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="flex justify-center gap-1.5 py-4">
          {steps.map((_, idx) => (
            <div 
              key={idx} 
              className={cn(
                "h-1 rounded-full transition-all duration-300",
                idx === currentStep ? "w-6 bg-primary" : "w-1 bg-muted"
              )} 
            />
          ))}
        </div>

        <DialogFooter className="sm:justify-center">
          <Button 
            onClick={handleNext} 
            variant="secondary"
            className="w-full h-11 rounded-xl font-bold text-sm shadow-sm transition-all"
          >
            {currentStep === steps.length - 1 ? (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" /> Entendido
              </>
            ) : (
              <>
                Continuar <ChevronRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}