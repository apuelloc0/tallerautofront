import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquare, Loader2 } from "lucide-react";
import api from "@/api/api";
import { toast } from "sonner";

interface SuggestionsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SuggestionsDialog({ open, onOpenChange }: SuggestionsDialogProps) {
  const [suggestionType, setSuggestionType] = useState("mejora");
  const [suggestionText, setSuggestionText] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmitSuggestion = async () => {
    if (!suggestionText.trim()) return;
    setIsSending(true);
    try {
      await api.post("/invitations/suggestions", {
        type: suggestionType,
        content: suggestionText
      });
      toast.success("¡Gracias! Tu sugerencia ha sido enviada al equipo de desarrollo.");
      onOpenChange(false);
      setSuggestionText("");
    } catch (error) {
      toast.error("No se pudo enviar la sugerencia.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-[2.5rem] w-[90vw] max-w-[420px]">
        <DialogHeader>
          <DialogTitle>¿En qué podemos mejorar?</DialogTitle>
          <DialogDescription>Tu opinión ayuda a que Pistn sea la mejor herramienta para tu negocio.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Tipo de comentario</Label>
            <Select value={suggestionType} onValueChange={setSuggestionType}>
              <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="falla">Reportar una falla (Bug)</SelectItem>
                <SelectItem value="mejora">Sugerir una mejora</SelectItem>
                <SelectItem value="inquietud">Tengo una duda o inquietud</SelectItem>
                <SelectItem value="otro">Otro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase ml-1 opacity-70">Tu mensaje</Label>
            <Textarea 
              placeholder="Cuéntanos más detalles..." 
              className="rounded-xl min-h-[120px] bg-muted/30"
              value={suggestionText}
              onChange={(e) => setSuggestionText(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button className="w-full rounded-xl h-12 font-bold" onClick={handleSubmitSuggestion} disabled={isSending}>
            {isSending ? <Loader2 className="animate-spin mr-2" /> : <MessageSquare className="mr-2 h-4 w-4" />}
            Enviar Comentarios
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}