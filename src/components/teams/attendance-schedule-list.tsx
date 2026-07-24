import { useMemo, useState } from "react";
import type { AttendanceSchedule, Worker, Obra, Team } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Search,
  Plus,
  Filter,
  MoreHorizontal,
  Eye,
  Pencil,
  Power,
  Trash2,
  Calendar,
  Users,
  Briefcase,
  AlertCircle,
} from "lucide-react";
import { initials } from "@/lib/format";
import { translateDayOfWeek } from "@/lib/attendance-schedule/attendance-schedule-utils";
import { AttendanceScheduleCard } from "./attendance-schedule-card";
import { AttendanceScheduleDetailsDialog } from "./attendance-schedule-details-dialog";
import { AttendanceScheduleFormDialog } from "./attendance-schedule-form-dialog";
import { toast } from "sonner";

interface AttendanceScheduleListProps {
  onOpenNewScheduleForm?: () => void;
}

export function AttendanceScheduleList({ onOpenNewScheduleForm }: AttendanceScheduleListProps) {
  const attendanceSchedules = useObraMZStore((s) => s.attendanceSchedules || []);
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);

  const updateAttendanceSchedule = useObraMZStore((s) => s.updateAttendanceSchedule);
  const deleteAttendanceSchedule = useObraMZStore((s) => s.deleteAttendanceSchedule);

  const [projectFilter, setProjectFilter] = useState("all");
  const [workerFilter, setWorkerFilter] = useState("all");
  const [teamFilter, setTeamFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [selectedScheduleDetails, setSelectedScheduleDetails] = useState<AttendanceSchedule | null>(null);
  const [scheduleToEdit, setScheduleToEdit] = useState<AttendanceSchedule | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const workerMap = useMemo(() => new Map(workers.map((w) => [w.id, w])), [workers]);
  const obraMap = useMemo(() => new Map(obras.map((o) => [o.id, o])), [obras]);
  const teamMap = useMemo(() => new Map(teams.map((t) => [t.id, t])), [teams]);

  // Filtragem combinada de escalas
  const filteredSchedules = useMemo(() => {
    return attendanceSchedules.filter((schedule) => {
      if (projectFilter !== "all" && schedule.projectId !== projectFilter) return false;
      if (workerFilter !== "all" && schedule.workerId !== workerFilter) return false;
      if (teamFilter !== "all" && schedule.teamId !== teamFilter) return false;
      if (statusFilter !== "all" && schedule.status !== statusFilter) return false;

      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const workerName = workerMap.get(schedule.workerId)?.name.toLowerCase() || "";
        const obraName = obraMap.get(schedule.projectId)?.nome.toLowerCase() || "";
        const teamName = schedule.teamId ? teamMap.get(schedule.teamId)?.name.toLowerCase() || "" : "";

        const matchesWorker = workerName.includes(query);
        const matchesObra = obraName.includes(query);
        const matchesTeam = teamName.includes(query);

        if (!matchesWorker && !matchesObra && !matchesTeam) return false;
      }

      return true;
    });
  }, [
    attendanceSchedules,
    projectFilter,
    workerFilter,
    teamFilter,
    statusFilter,
    searchQuery,
    workerMap,
    obraMap,
    teamMap,
  ]);

  const activeCount = useMemo(
    () => attendanceSchedules.filter((s) => s.status === "active").length,
    [attendanceSchedules]
  );

  const handleToggleStatus = (schedule: AttendanceSchedule) => {
    const newStatus = schedule.status === "active" ? "inactive" : "active";
    try {
      updateAttendanceSchedule(schedule.id, { status: newStatus });
      toast.success(
        `Escala ${newStatus === "active" ? "ativada" : "desativada"} com sucesso!`
      );
    } catch (err: any) {
      toast.error(err.message || "Erro ao alterar o estado da escala.");
    }
  };

  const handleDelete = (schedule: AttendanceSchedule) => {
    const workerName = workerMap.get(schedule.workerId)?.name || "este trabalhador";
    const confirmed = window.confirm(
      `Tem a certeza de que pretende eliminar a escala de presença de ${workerName}? Os registos históricos de presença efetuados serão preservados.`
    );
    if (confirmed) {
      deleteAttendanceSchedule(schedule.id);
      toast.success("Escala eliminada com sucesso.");
    }
  };

  const handleClearFilters = () => {
    setProjectFilter("all");
    setWorkerFilter("all");
    setTeamFilter("all");
    setStatusFilter("all");
    setSearchQuery("");
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho de Ações e Filtros */}
      <div className="p-4 border rounded-xl bg-card space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Escalas de Presença Ativas
              <Badge variant="secondary" className="text-[10px] ml-1 bg-primary/10 text-primary">
                {activeCount} ativas
              </Badge>
            </h3>
            <p className="text-[11px] text-muted-foreground">
              Planeamento de presenças regulares e excepções para a Chamada Diária.
            </p>
          </div>

          <Button
            size="sm"
            onClick={() => {
              setScheduleToEdit(null);
              setIsFormOpen(true);
            }}
            className="text-xs h-9 bg-primary text-white shrink-0"
          >
            <Plus className="h-4 w-4 mr-1.5" /> Nova Escala
          </Button>
        </div>

        {/* Toolbar de Pesquisa e Filtros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-2 pt-2 border-t">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>

          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todas as obras" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Todas as Obras</SelectItem>
              {obras.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todas as equipas" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Todas as Equipas</SelectItem>
              {teams.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 text-xs">
              <SelectValue placeholder="Todos os estados" />
            </SelectTrigger>
            <SelectContent className="text-xs">
              <SelectItem value="all">Todos os Estados</SelectItem>
              <SelectItem value="active">Apenas Ativas</SelectItem>
              <SelectItem value="inactive">Apenas Inativas</SelectItem>
            </SelectContent>
          </Select>

          {(projectFilter !== "all" ||
            workerFilter !== "all" ||
            teamFilter !== "all" ||
            statusFilter !== "all" ||
            searchQuery.trim() !== "") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Lista de Escalas (Mobile Cards vs Desktop Table) */}
      {filteredSchedules.length === 0 ? (
        <div className="p-8 border rounded-xl bg-card text-center space-y-3">
          <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h4 className="font-bold text-sm">Nenhuma escala encontrada</h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {attendanceSchedules.length === 0
                ? "Nenhuma escala de presença foi configurada ainda. Clique em 'Nova Escala' para criar a primeira."
                : "Nenhuma escala de presença corresponde aos filtros selecionados."}
            </p>
          </div>
          {attendanceSchedules.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearFilters} className="text-xs">
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Mobile View: Cards */}
          <div className="grid grid-cols-1 gap-3 md:hidden">
            {filteredSchedules.map((schedule) => (
              <AttendanceScheduleCard
                key={schedule.id}
                schedule={schedule}
                worker={workerMap.get(schedule.workerId)}
                obra={obraMap.get(schedule.projectId)}
                team={schedule.teamId ? teamMap.get(schedule.teamId) : undefined}
                onViewDetails={(s) => setSelectedScheduleDetails(s)}
                onEdit={(s) => {
                  setScheduleToEdit(s);
                  setIsFormOpen(true);
                }}
                onToggleStatus={handleToggleStatus}
                onDelete={handleDelete}
              />
            ))}
          </div>

          {/* Desktop View: Table */}
          <div className="hidden md:block border rounded-xl bg-card overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b bg-muted/40 text-muted-foreground font-semibold">
                  <th className="p-3">Trabalhador</th>
                  <th className="p-3">Obra</th>
                  <th className="p-3">Origem</th>
                  <th className="p-3">Período</th>
                  <th className="p-3">Dias da Semana</th>
                  <th className="p-3 text-center">Excepções</th>
                  <th className="p-3">Estado</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredSchedules.map((schedule) => {
                  const worker = workerMap.get(schedule.workerId);
                  const obra = obraMap.get(schedule.projectId);
                  const team = schedule.teamId ? teamMap.get(schedule.teamId) : undefined;
                  const isActive = schedule.status === "active";

                  const includedCount = schedule.includedDates?.length || 0;
                  const excludedCount = schedule.excludedDates?.length || 0;

                  return (
                    <tr key={schedule.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar className="h-7 w-7 border shrink-0">
                            {worker?.photo ? (
                              <img src={worker.photo} alt={worker.name} className="object-cover" />
                            ) : (
                              <AvatarFallback className="text-[10px] font-bold">
                                {worker ? initials(worker.name) : "?"}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-bold text-foreground">
                              {worker?.name || `Trabalhador ${schedule.workerId}`}
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {worker?.role || "Trabalhador"}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3 font-medium text-foreground">
                        {obra?.nome || "Obra —"}
                      </td>

                      <td className="p-3">
                        {team ? (
                          <Badge variant="outline" className="text-[10px] gap-1 font-normal">
                            <Users className="h-3 w-3 text-amber-500" /> {team.name}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">Individual</span>
                        )}
                      </td>

                      <td className="p-3 text-muted-foreground">
                        <span className="font-medium text-foreground">{schedule.startDate}</span> a{" "}
                        <span className="font-medium text-foreground">{schedule.endDate}</span>
                      </td>

                      <td className="p-3">
                        <div className="flex flex-wrap gap-1">
                          {schedule.workingDays.map((day) => (
                            <span
                              key={day}
                              className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-muted/60 text-foreground border border-border/50"
                            >
                              {translateDayOfWeek(day).slice(0, 3)}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="p-3 text-center">
                        {includedCount > 0 || excludedCount > 0 ? (
                          <div className="flex items-center justify-center gap-2 text-[10px]">
                            {includedCount > 0 && (
                              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                +{includedCount}
                              </span>
                            )}
                            {excludedCount > 0 && (
                              <span className="text-rose-600 dark:text-rose-400 font-bold">
                                -{excludedCount}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-[10px]">—</span>
                        )}
                      </td>

                      <td className="p-3">
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
                      </td>

                      <td className="p-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" aria-label="Opções da escala">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="text-xs">
                            <DropdownMenuItem onClick={() => setSelectedScheduleDetails(schedule)}>
                              <Eye className="h-3.5 w-3.5 mr-2" /> Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setScheduleToEdit(schedule);
                                setIsFormOpen(true);
                              }}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-2" /> Editar Escala
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(schedule)}>
                              <Power className="h-3.5 w-3.5 mr-2" />{" "}
                              {isActive ? "Desativar" : "Ativar"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(schedule)}
                              className="text-rose-600"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-2" /> Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Modal de Formulário */}
      <AttendanceScheduleFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        scheduleToEdit={scheduleToEdit}
      />

      {/* Modal de Detalhes */}
      {selectedScheduleDetails && (
        <AttendanceScheduleDetailsDialog
          open={!!selectedScheduleDetails}
          onOpenChange={(open) => {
            if (!open) setSelectedScheduleDetails(null);
          }}
          schedule={selectedScheduleDetails}
          worker={workerMap.get(selectedScheduleDetails.workerId)}
          obra={obraMap.get(selectedScheduleDetails.projectId)}
          team={
            selectedScheduleDetails.teamId
              ? teamMap.get(selectedScheduleDetails.teamId)
              : undefined
          }
          onEdit={(s) => {
            setScheduleToEdit(s);
            setIsFormOpen(true);
          }}
        />
      )}
    </div>
  );
}
