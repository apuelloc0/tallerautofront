import { Car } from "lucide-react";
import { cn } from "@/lib/utils";

interface CarLoaderProps {
  message?: string;
  className?: string;
}

export function CarLoader({ message, className }: CarLoaderProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
      <div className="relative w-28 h-14 flex items-center justify-center overflow-hidden">
        {/* Efecto de velocidad de fondo */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent animate-shimmer" />
        
        {/* El Automóvil con animación de desplazamiento */}
        <Car className="h-8 w-8 text-primary animate-car-move drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
      </div>

      <style>{`
        @keyframes car-move {
          0%, 100% { transform: translateX(-30px); }
          50% { transform: translateX(30px); }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-car-move { animation: car-move 1.2s ease-in-out infinite; }
        .animate-shimmer { animation: shimmer 2s linear infinite; }
      `}</style>
    </div>
  );
}