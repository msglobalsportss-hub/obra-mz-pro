import type { AttendanceSchedule, Worker, Obra, Team } from "@/lib/mock-data";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Power, Trash2, Calendar, Users, Briefcase } from "lucide-react";
import { initials } from "@/lib/format";
import { translateDayOfWeek } from "@/lib/attendance-schedule/attendance-schedule-utils";

interface AttendanceScheduleCardProps {
  schedule: AttendanceSchedule;
  worker?: Worker;
  obra?: Obra;
  team?: Team;
  onViewDetails: (s: AttendanceSchedule) => void;
  onEdit: (s: AttendanceSchedule) => void;
  onToggleStatus: (s: AttendanceSchedule) => void;
  onDelete: (s: AttendanceSchedule) => void;
}

export function AttendanceScheduleCard({
  schedule,
  worker,
  obra,
  team,
  onViewDetails,
  onEdit,
  onToggleStatus,
  onDelete,
}: AttendanceScheduleCardProps) {
  const isActive = schedule.status === "active";
  const includedCount = schedule.includedDates?.length || 0;
  const excludedCount = schedule.excludedDates?.length || 0;

  return (
    <Card className="p-3.5 border border-border/80 bg-card hover:bg-muted/20 transition-all space-y-2.5 relative overflow-hidden">
      <div className="flex items-center justify-between border-b border-border/50 pb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar className="h-8 w-8 border shrink-0">
            {worker?.photo ? (
              <img src={worker.photo} alt={worker.name} className="object-cover" />
            ) : (
              <AvatarFallback className="text-[10px] font-bold">
                {worker ? initials(worker.name) : "?"}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-bold text-xs text-foreground truncate">
              {worker?.name || `Trabalhador ${schedule.workerId}`}
            </div>
            <div className="text-[10px] text-muted-foreground truncate">
              {worker?.role || "Trabalhador"}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground"
                aria-label="Ações da escala"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-xs">
              <DropdownMenuItem onClick={() => onViewDetails(schedule)}>
                <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalhes
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(schedule)}>
                <Pencil className="h-3.5 w-3.5 mr-2" /> Editar Escala
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onToggleStatus(schedule)}>
                <Power className="h-3.5 w-3.5 mr-2" /> {isActive ? "Desativar" : "Ativar"}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onDelete(schedule)} className="text-rose-600">
                <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0">
          <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
          <span className="truncate font-medium text-foreground">{obra?.nome || "Obra —"}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground min-w-0 justify-end">
          <Users className="h-3.5 w-3.5 shrink-0 text-amber-500" />
          <span className="truncate">{team ? `Equipa: ${team.name}` : "Individual"}</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
        <span>
          Período: <strong className="text-foreground">{schedule.startDate}</strong> a{" "}
          <strong className="text-foreground">{schedule.endDate}</strong>
        </span>
      </div>

      <div className="flex flex-wrap gap-1 pt-1">
        {schedule.workingDays.map((day) => (
          <span
            key={day}
            className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border/50"
          >
            {translateDayOfWeek(day).slice(0, 3)}
          </span>
        ))}
      </div>

      {(includedCount > 0 || excludedCount > 0) && (
        <div className="flex items-center gap-3 text-[10px] text-muted-foreground pt-1 border-t border-border/40">
          {includedCount > 0 && (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              +{includedCount} extra
            </span>
          )}
          {excludedCount > 0 && (
            <span className="text-rose-600 dark:text-rose-400 font-semibold">
              -{excludedCount} folgas
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
