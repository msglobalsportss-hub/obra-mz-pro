import { useState } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Ban, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface AttendanceDisableDayDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  date: string;
  onDayDisabledConfirmed: (reason: string, notes?: string) => void;
}

export function AttendanceDisableDayDialog({
  open,
  onOpenChange,
  projectId,
  date,
  onDayDisabledConfirmed,
}: AttendanceDisableDayDialogProps) {
  const disableProjectDay = useObraMZStore((s) => s.disableProjectDay);

  const [reason, setReason] = useState<string>("Chuva");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!projectId || !date) return;

    try {
      disableProjectDay(projectId, date, reason, notes);
      toast.success(`Dia ${date} marcado como sem trabalho (${reason}).`);
      onDayDisabledConfirmed(reason, notes);
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || "Erro ao desativar o dia.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-5 border-b bg-muted/20">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <Ban className="h-4 w-4" /> Desativar Dia de Trabalho
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-300 flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500 mt-0.5" />
              <div className="space-y-1 text-[11px]">
                <p className="font-semibold">Desativar Chamada para a Data {date}</p>
                <p>
                  Esta ação sinalizará o dia como sem trabalho (ex: paragem por intempérie ou feriado). A marcação de presenças deixa de ser obrigatória.
                </p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo da Desativação *</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Chuva">Chuva / Intempérie</SelectItem>
                  <SelectItem value="Feriado">Feriado / Tolerância de Ponto</SelectItem>
                  <SelectItem value="Falta de Materiais">Falta de Materiais / Equipamento</SelectItem>
                  <SelectItem value="Segurança">Segurança / Paragem Técnica</SelectItem>
                  <SelectItem value="Outro">Outro Motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Notas Adicionais (Opcional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ex: Chuva intensa no período da manhã impediu os trabalhos de alvenaria..."
                className="text-xs h-16 resize-none"
              />
            </div>
          </div>

          <DialogFooter className="p-4 border-t bg-muted/10 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-9"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs h-9 bg-amber-600 hover:bg-amber-700 text-white"
            >
              Confirmar Desativação do Dia
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
