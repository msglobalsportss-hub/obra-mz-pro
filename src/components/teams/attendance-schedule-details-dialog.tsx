import type { AttendanceSchedule, Worker, Obra, Team } from "@/lib/mock-data";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, Users, Briefcase, Info, Clock, CheckCircle2, XCircle, FileText } from "lucide-react";
import { initials } from "@/lib/format";
import { translateDayOfWeek } from "@/lib/attendance-schedule/attendance-schedule-utils";

interface AttendanceScheduleDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schedule: AttendanceSchedule | null;
  worker?: Worker;
  obra?: Obra;
  team?: Team;
  onEdit?: (schedule: AttendanceSchedule) => void;
}

export function AttendanceScheduleDetailsDialog({
  open,
  onOpenChange,
  schedule,
  worker,
  obra,
  team,
  onEdit,
}: AttendanceScheduleDetailsDialogProps) {
  if (!schedule) return null;

  const isActive = schedule.status === "active";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md w-full max-h-[90vh] overflow-y-auto p-0">
        <DialogHeader className="p-5 border-b bg-muted/20">
          <div className="flex items-center justify-between gap-2">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Detalhes da Escala de Presença
            </DialogTitle>
            <Badge
              variant={isActive ? "default" : "secondary"}
              className={`text-[10px] ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {isActive ? "Ativa" : "Inativa"}
            </Badge>
          </div>
        </DialogHeader>

        <div className="p-5 space-y-4 text-xs">
          {/* Informação do Trabalhador */}
          <div className="p-3 border rounded-xl bg-card flex items-center gap-3">
            <Avatar className="h-10 w-10 border shrink-0">
              {worker?.photo ? (
                <img src={worker.photo} alt={worker.name} className="object-cover" />
              ) : (
                <AvatarFallback className="font-bold text-xs">
                  {worker ? initials(worker.name) : "?"}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm text-foreground truncate">
                {worker?.name || `Trabalhador ${schedule.workerId}`}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {worker?.role || "Trabalhador"}
              </div>
            </div>
          </div>

          {/* Obra e Equipa */}
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2.5 border rounded-lg bg-card space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Briefcase className="h-3 w-3 text-primary" /> Obra
              </span>
              <p className="font-bold text-foreground truncate">{obra?.nome || "Obra —"}</p>
            </div>
            <div className="p-2.5 border rounded-lg bg-card space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <Users className="h-3 w-3 text-amber-500" /> Origem
              </span>
              <p className="font-bold text-foreground truncate">
                {team ? `Equipa: ${team.name}` : "Individual"}
              </p>
            </div>
          </div>

          {/* Período */}
          <div className="p-3 border rounded-xl bg-card space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Período da Escala
            </span>
            <div className="flex items-center justify-between font-bold text-foreground">
              <span>{schedule.startDate}</span>
              <span className="text-muted-foreground text-[10px]">até</span>
              <span>{schedule.endDate}</span>
            </div>
          </div>

          {/* Dias de Trabalho da Semana */}
          <div className="space-y-1.5">
            <span className="text-[10px] text-muted-foreground font-semibold">
              Dias Úteis Regulares ({schedule.workingDays.length}/7)
            </span>
            <div className="flex flex-wrap gap-1.5">
              {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(
                (day) => {
                  const isWorking = schedule.workingDays.includes(day as any);
                  return (
                    <Badge
                      key={day}
                      variant={isWorking ? "default" : "outline"}
                      className={`text-[10px] ${
                        isWorking
                          ? "bg-primary text-white"
                          : "bg-muted/30 text-muted-foreground border-dashed"
                      }`}
                    >
                      {translateDayOfWeek(day as any)}
                    </Badge>
                  );
                }
              )}
            </div>
          </div>

          {/* Datas Extraordinárias */}
          {schedule.includedDates && schedule.includedDates.length > 0 && (
            <div className="space-y-1.5 border-t pt-2">
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Datas Extraordinárias de Trabalho (
                {schedule.includedDates.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {schedule.includedDates.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Datas Sem Trabalho */}
          {schedule.excludedDates && schedule.excludedDates.length > 0 && (
            <div className="space-y-1.5 border-t pt-2">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
                <XCircle className="h-3.5 w-3.5" /> Datas Sem Trabalho / Folgas (
                {schedule.excludedDates.length})
              </span>
              <div className="flex flex-wrap gap-1">
                {schedule.excludedDates.map((d) => (
                  <span
                    key={d}
                    className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20"
                  >
                    {d}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Notas */}
          {schedule.notes && (
            <div className="p-3 border rounded-xl bg-muted/20 space-y-1">
              <span className="text-[10px] text-muted-foreground font-semibold flex items-center gap-1">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" /> Notas
              </span>
              <p className="text-foreground text-[11px] whitespace-pre-wrap">{schedule.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="text-[10px] text-muted-foreground border-t pt-2 space-y-0.5">
            <div>Criado em: {new Date(schedule.createdAt).toLocaleString("pt-MZ")}</div>
            <div>Última atualização: {new Date(schedule.updatedAt).toLocaleString("pt-MZ")}</div>
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
            Fechar
          </Button>
          {onEdit && (
            <Button
              type="button"
              size="sm"
              onClick={() => {
                onOpenChange(false);
                onEdit(schedule);
              }}
              className="text-xs h-9 bg-primary text-white"
            >
              Editar Escala
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
