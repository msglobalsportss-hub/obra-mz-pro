import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { Calendar, User, Clock, Building, Users, Info, ShieldCheck, DollarSign, Tag, FileText } from "lucide-react";
import type { AttendanceRecord, AttendanceStatus } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { formatAttendanceHours, formatMins } from "@/lib/time-utils";
import { calculateRecordCost } from "@/lib/attendance-analytics";
import { formatCurrency } from "@/components/teams/attendance-summary-card";

type AttendanceRecordDetailDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: AttendanceRecord | null;
};

export function AttendanceRecordDetailDialog({
  open,
  onOpenChange,
  record,
}: AttendanceRecordDetailDialogProps) {
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);

  if (!record) return null;

  const worker = workers.find((w) => w.id === record.workerId);
  const obra = obras.find((o) => o.id === record.projectId);
  const fase = obra?.fases?.find((f) => f.id === record.phaseId);
  const team = record.teamId ? teams.find((t) => t.id === record.teamId) : null;

  const costResult = calculateRecordCost(record, worker);

  const getStatusBadge = (status: AttendanceStatus) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">Presente 🟢</Badge>;
      case "absent":
        return <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-0">Ausente 🔴</Badge>;
      case "late":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0">Atrasado 🟡</Badge>;
      case "half_day":
        return <Badge className="bg-sky-600 hover:bg-sky-700 text-white border-0">Meio Período 🔵</Badge>;
      case "justified_absence":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">Falta Justificada ⚪</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRateSourceLabel = (source?: "hourly" | "daily" | "monthly_estimated") => {
    switch (source) {
      case "hourly":
        return "Taxa Horária Directa";
      case "daily":
        return "Taxa Diária (Inferida 8h)";
      case "monthly_estimated":
        return "Salário Mensal Estimado (Proporcional 22 dias)";
      default:
        return "Não configurado";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        <DialogHeader className="p-4 bg-muted/30 border-b">
          <DialogTitle className="text-sm font-bold flex items-center gap-2">
            <Info className="h-4 w-4 text-primary" />
            Detalhes do Registo de Presença
          </DialogTitle>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Perfil do Trabalhador */}
          <div className="flex items-center gap-3 bg-card p-3 rounded-lg border">
            <Avatar className="h-10 w-10">
              {worker?.photo ? (
                <img src={worker.photo} alt={worker.name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-muted font-bold text-xs">
                  {worker ? initials(worker.name) : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex flex-col flex-1 min-w-0">
              <span className="font-bold text-foreground text-sm truncate">{worker?.name || "Trabalhador Desconhecido"}</span>
              <span className="text-muted-foreground">{worker?.role || "—"}</span>
            </div>
            <div>{getStatusBadge(record.status)}</div>
          </div>

          {/* Dados Gerais */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 bg-muted/20 rounded-md space-y-0.5 border border-border/40">
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Calendar className="h-3 w-3 text-muted-foreground" />
                Data do Registo
              </div>
              <div className="font-bold text-foreground">{record.date}</div>
            </div>

            <div className="p-2.5 bg-muted/20 rounded-md space-y-0.5 border border-border/40">
              <div className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Building className="h-3 w-3 text-muted-foreground" />
                Obra / Fase
              </div>
              <div className="font-bold text-foreground truncate">{obra?.nome || "Desconhecida"}</div>
              <div className="text-[10px] text-muted-foreground truncate">{fase?.nome || "Sem fase"}</div>
            </div>
          </div>

          {/* Horários e Durações */}
          <div className="p-3 bg-muted/20 rounded-md space-y-2 border border-border/40">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3 text-primary" />
              Horários e Horas Trabalhadas (24h)
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-border/40">
              <div>
                <span className="text-[10px] text-muted-foreground block">Entrada</span>
                <span className="font-semibold text-foreground">{record.checkInTime || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Saída</span>
                <span className="font-semibold text-foreground">{record.checkOutTime || "—"}</span>
              </div>
              <div>
                <span className="text-[10px] text-muted-foreground block">Pausa</span>
                <span className="font-semibold text-foreground">
                  {record.breakMinutes ? `${record.breakMinutes} min` : "—"}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/40">
              <span className="text-muted-foreground font-medium">Horas Trabalhadas:</span>
              <span className="font-bold text-foreground">
                {formatAttendanceHours(record.workedMinutes, record.overtimeMinutes)}
              </span>
            </div>
          </div>

          {/* Custo Estimado e Origem */}
          <div className="p-3 bg-slate-500/5 rounded-md space-y-1.5 border border-slate-500/10">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground font-medium flex items-center gap-1">
                <DollarSign className="h-3.5 w-3.5 text-slate-600" />
                Custo Operacional Estimado:
              </span>
              <span className="font-black text-slate-800 text-sm">
                {costResult.isAvailable ? formatCurrency(costResult.cost) : "Indisponível"}
              </span>
            </div>
            
            <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 border-t border-slate-500/10">
              <span className="flex items-center gap-1">
                <Tag className="h-3 w-3 text-slate-400" />
                Fonte de Cálculo Salarial:
              </span>
              <span className="font-semibold text-foreground">
                {getRateSourceLabel(costResult.rateSource)}
              </span>
            </div>
          </div>

          {/* Observações */}
          <div className="p-3 bg-muted/20 rounded-md space-y-1 border border-border/40">
            <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <FileText className="h-3 w-3 text-muted-foreground" />
              Observações
            </div>
            <div className="italic text-muted-foreground">
              {record.notes ? `"${record.notes}"` : "Nenhuma observação registada."}
            </div>
          </div>

          {/* Metadados de Timestamp */}
          <div className="flex items-center justify-between text-[9px] text-muted-foreground/70 pt-2 border-t">
            <span>Criado em: {record.createdAt ? new Date(record.createdAt).toLocaleString("pt-PT") : "—"}</span>
            <span>Atualizado em: {record.updatedAt ? new Date(record.updatedAt).toLocaleString("pt-PT") : "—"}</span>
          </div>
        </div>

        <DialogFooter className="p-3 bg-muted/30 border-t">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
