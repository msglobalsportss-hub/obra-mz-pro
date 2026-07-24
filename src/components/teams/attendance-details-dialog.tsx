import type { AttendanceRecord, Worker, Obra, Team, ProjectAssignment } from "@/lib/mock-data";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useObraMZStore } from "@/store/obramz-store";
import { useMemo } from "react";
import { Calendar, User, Building, MapPin, Clipboard, FileText, Clock, Users, ArrowRight, ShieldCheck, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { formatMins } from "@/lib/time-utils";

type AttendanceDetailsDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  record: AttendanceRecord | null;
};

export function AttendanceDetailsDialog({
  open,
  onOpenChange,
  record,
}: AttendanceDetailsDialogProps) {
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);
  const projectAssignments = useObraMZStore((s) => s.projectAssignments || []);

  const worker = useMemo(() => {
    if (!record) return null;
    return workers.find((w) => w.id === record.workerId);
  }, [workers, record]);

  const obra = useMemo(() => {
    if (!record) return null;
    return obras.find((o) => o.id === record.projectId);
  }, [obras, record]);

  const fase = useMemo(() => {
    if (!record || !obra) return null;
    return obra.fases?.find((f) => f.id === record.phaseId);
  }, [obra, record]);

  const team = useMemo(() => {
    if (!record || !record.teamId) return null;
    return teams.find((t) => t.id === record.teamId);
  }, [teams, record]);

  const assignment = useMemo(() => {
    if (!record || !record.assignmentId) return null;
    return projectAssignments.find((a) => a.id === record.assignmentId);
  }, [projectAssignments, record]);

  if (!record) return null;

  // Formatar Estado
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">Presente</Badge>;
      case "absent":
        return <Badge className="bg-rose-600 hover:bg-rose-700 text-white border-0">Ausente</Badge>;
      case "late":
        return <Badge className="bg-amber-600 hover:bg-amber-700 text-white border-0">Atrasado</Badge>;
      case "half_day":
        return <Badge className="bg-sky-600 hover:bg-sky-700 text-white border-0">Meio período</Badge>;
      case "justified_absence":
        return <Badge className="bg-purple-600 hover:bg-purple-700 text-white border-0">Falta justificada</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("pt-PT") + " às " + d.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit", hour12: false });
    } catch {
      return isoString;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalhes da Presença</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-3 text-sm">
          {/* Card Trabalhador */}
          <div className="flex items-center gap-3 p-3 border rounded bg-card">
            <Avatar className="h-10 w-10 shrink-0">
              {worker?.photo ? (
                <img src={worker.photo} alt={worker.name} className="object-cover" />
              ) : (
                <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                  {worker ? initials(worker.name) : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-foreground truncate">{worker?.name || "Trabalhador não encontrado"}</div>
              <div className="text-xs text-muted-foreground">{worker?.role || "—"}</div>
            </div>
            <div className="shrink-0">{getStatusBadge(record.status)}</div>
          </div>

          {/* Dados Gerais */}
          <div className="space-y-3.5 pt-1">
            <div className="flex items-start gap-2.5">
              <Calendar className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Data da Chamada</div>
                <div className="font-semibold text-foreground">{record.date}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Building className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Obra</div>
                <div className="font-semibold text-foreground">{obra?.nome || "Obra não encontrada"}</div>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Fase da Obra</div>
                <div className="font-semibold text-foreground">{fase?.nome || <span className="italic text-muted-foreground font-normal">Nenhuma fase específica</span>}</div>
              </div>
            </div>

            {/* Origem da Elegibilidade */}
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <div>
                <div className="text-xs text-muted-foreground">Origem da Atribuição</div>
                <div className="font-semibold text-foreground">
                  {assignment?.assignmentType === "team" ? (
                    <div className="space-y-1">
                      <div>Registado através da atribuição da equipa: <span className="text-primary">{team?.name || "Equipa não encontrada"}</span></div>
                      <div className="text-[11px] font-normal text-muted-foreground leading-normal">
                        Membro da equipa no momento da alocação (Snapshot).
                      </div>
                    </div>
                  ) : (
                    "Atribuição Individual"
                  )}
                </div>
              </div>
            </div>

            {/* Horário Registado */}
            {record.checkInTime && record.checkOutTime && (
              <div className="flex items-start gap-2.5">
                <Clock className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-muted-foreground">Horário Registado</div>
                  <div className="font-semibold text-foreground">
                    {record.checkInTime} às {record.checkOutTime}
                    <span className="font-normal text-muted-foreground text-[11px] block mt-0.5">
                      Duração efetiva: {formatMins(record.workedMinutes)} (Pausa: {record.breakMinutes || 0} min)
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Horas Extra */}
            {record.overtimeMinutes !== undefined && record.overtimeMinutes > 0 && (
              <div className="flex items-start gap-2.5">
                <Award className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-amber-600 font-bold">Horas Extra</div>
                  <div className="font-bold text-amber-700">{formatMins(record.overtimeMinutes)}</div>
                </div>
              </div>
            )}

            {/* Observações */}
            {record.notes && (
              <div className="flex items-start gap-2.5 border-t pt-3.5 mt-2">
                <FileText className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-muted-foreground">Observações</div>
                  <div className="font-normal text-foreground whitespace-pre-wrap leading-relaxed mt-0.5 bg-muted/40 p-2 rounded text-xs border border-border/60">
                    {record.notes}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Audit Timestamps */}
          <div className="border-t pt-3.5 space-y-1 text-[10px] text-muted-foreground">
            <div className="flex justify-between">
              <span>Registado em:</span>
              <span>{formatDate(record.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span>Última atualização:</span>
              <span>{formatDate(record.updatedAt)}</span>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-2">
          <Button className="w-full bg-primary hover:bg-primary-dark" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
