import { useState } from "react";
import type { Worker } from "@/lib/mock-data";
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
import { UserPlus, Info } from "lucide-react";
import { toast } from "sonner";

interface AttendanceExtraWorkerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingWorkerIds: string[];
  onAddExtraWorker: (worker: Worker, reason: string, notes?: string) => void;
}

export function AttendanceExtraWorkerDialog({
  open,
  onOpenChange,
  existingWorkerIds,
  onAddExtraWorker,
}: AttendanceExtraWorkerDialogProps) {
  const workers = useObraMZStore((s) => s.workers || []);

  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [reason, setReason] = useState<string>("Apoio");
  const [customNotes, setCustomNotes] = useState("");

  const availableWorkers = workers.filter(
    (w) => w.status === "active" && w.id !== "invalid-orphan" && !existingWorkerIds.includes(w.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWorkerId) {
      toast.error("Selecione um trabalhador.");
      return;
    }

    const worker = workers.find((w) => w.id === selectedWorkerId);
    if (!worker) return;

    onAddExtraWorker(worker, reason, customNotes);
    toast.success(`${worker.name} adicionado a esta chamada como trabalhador extraordinário!`);

    setSelectedWorkerId("");
    setReason("Apoio");
    setCustomNotes("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-5 border-b bg-muted/20">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <UserPlus className="h-4 w-4 text-primary" /> Adicionar Trabalhador Extraordinário
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 bg-amber-500/10 p-2.5 rounded-lg border border-amber-500/20 text-amber-800 dark:text-amber-300">
              <Info className="h-4 w-4 shrink-0 text-amber-500" />
              Este trabalhador será incluído apenas na chamada desta data, sem alterar escalas permanentes.
            </p>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Trabalhador *</Label>
              <Select value={selectedWorkerId} onValueChange={setSelectedWorkerId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione o trabalhador..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {availableWorkers.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground text-[11px]">
                      Todos os trabalhadores ativos já estão na chamada.
                    </div>
                  ) : (
                    availableWorkers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.role})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Motivo do Reforço</Label>
              <Select value={reason} onValueChange={setReason}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  <SelectItem value="Apoio">Apoio Pontual</SelectItem>
                  <SelectItem value="Horas Extra">Turno / Horas Extra</SelectItem>
                  <SelectItem value="Substituição">Substituição de Faltoso</SelectItem>
                  <SelectItem value="Outro">Outro Motivo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Observações (Opcional)</Label>
              <Textarea
                value={customNotes}
                onChange={(e) => setCustomNotes(e.target.value)}
                placeholder="Ex: Alocado para apoiar na betonagem da laje..."
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
              disabled={!selectedWorkerId}
              className="text-xs h-9 bg-primary text-white"
            >
              Adicionar à Chamada
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
