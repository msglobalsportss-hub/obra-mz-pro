import { useEffect, useState } from "react";
import type { AttendanceSchedule, DayOfWeek, Worker, Obra, Team } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, Plus, X, User, Users, Briefcase, AlertCircle, Info } from "lucide-react";
import {
  defaultWorkingDays,
  validateScheduleForm,
  translateDayOfWeek,
} from "@/lib/attendance-schedule";

interface AttendanceScheduleFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scheduleToEdit?: AttendanceSchedule | null;
  preselectedProjectId?: string | null;
}

export function AttendanceScheduleFormDialog({
  open,
  onOpenChange,
  scheduleToEdit = null,
  preselectedProjectId = null,
}: AttendanceScheduleFormDialogProps) {
  const addAttendanceSchedule = useObraMZStore((s) => s.addAttendanceSchedule);
  const updateAttendanceSchedule = useObraMZStore((s) => s.updateAttendanceSchedule);
  const bulkAddTeamAttendanceSchedules = useObraMZStore((s) => s.bulkAddTeamAttendanceSchedules);

  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);

  const todayStr = new Date().toISOString().slice(0, 10);

  const [scheduleType, setScheduleType] = useState<"worker" | "team">("worker");
  const [projectId, setProjectId] = useState("");
  const [workerId, setWorkerId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [workingDays, setWorkingDays] = useState<DayOfWeek[]>([...defaultWorkingDays]);
  const [includedDates, setIncludedDates] = useState<string[]>([]);
  const [excludedDates, setExcludedDates] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [notes, setNotes] = useState("");

  const [tempIncludedDate, setTempIncludedDate] = useState("");
  const [tempExcludedDate, setTempExcludedDate] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      if (scheduleToEdit) {
        setScheduleType(scheduleToEdit.teamId ? "team" : "worker");
        setProjectId(scheduleToEdit.projectId);
        setWorkerId(scheduleToEdit.workerId);
        setTeamId(scheduleToEdit.teamId || "");
        setStartDate(scheduleToEdit.startDate);
        setEndDate(scheduleToEdit.endDate);
        setWorkingDays([...scheduleToEdit.workingDays]);
        setIncludedDates([...(scheduleToEdit.includedDates || [])]);
        setExcludedDates([...(scheduleToEdit.excludedDates || [])]);
        setStatus(scheduleToEdit.status === "cancelled" ? "inactive" : scheduleToEdit.status);
        setNotes(scheduleToEdit.notes || "");
      } else {
        setScheduleType("worker");
        setProjectId(preselectedProjectId || obras[0]?.id || "");
        setWorkerId("");
        setTeamId("");
        setStartDate(todayStr);
        setEndDate(todayStr);
        setWorkingDays([...defaultWorkingDays]);
        setIncludedDates([]);
        setExcludedDates([]);
        setStatus("active");
        setNotes("");
      }
      setTempIncludedDate("");
      setTempExcludedDate("");
    }
  }, [open, scheduleToEdit, preselectedProjectId, obras, todayStr]);

  const activeWorkers = workers.filter((w) => w.status === "active" && w.id !== "invalid-orphan");
  const activeObras = obras.filter((o) => o.estado !== "cancelada");
  const activeTeams = teams.filter((t) => t.status === "active");

  const allDays: DayOfWeek[] = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  const toggleDayOfWeek = (day: DayOfWeek) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const handleAddIncludedDate = () => {
    if (!tempIncludedDate) return;
    if (tempIncludedDate < startDate || tempIncludedDate > endDate) {
      toast.error(`A data deve estar no intervalo (${startDate} a ${endDate}).`);
      return;
    }
    if (includedDates.includes(tempIncludedDate)) {
      toast.info("Esta data já foi adicionada às datas extraordinárias.");
      return;
    }
    if (excludedDates.includes(tempIncludedDate)) {
      toast.error("Esta data já está na lista de datas sem trabalho.");
      return;
    }
    setIncludedDates([...includedDates, tempIncludedDate].sort());
    setTempIncludedDate("");
  };

  const handleRemoveIncludedDate = (dateStr: string) => {
    setIncludedDates(includedDates.filter((d) => d !== dateStr));
  };

  const handleAddExcludedDate = () => {
    if (!tempExcludedDate) return;
    if (tempExcludedDate < startDate || tempExcludedDate > endDate) {
      toast.error(`A data deve estar no intervalo (${startDate} a ${endDate}).`);
      return;
    }
    if (excludedDates.includes(tempExcludedDate)) {
      toast.info("Esta data já foi adicionada às datas sem trabalho.");
      return;
    }
    if (includedDates.includes(tempExcludedDate)) {
      toast.error("Esta data já está na lista de datas extraordinárias.");
      return;
    }
    setExcludedDates([...excludedDates, tempExcludedDate].sort());
    setTempExcludedDate("");
  };

  const handleRemoveExcludedDate = (dateStr: string) => {
    setExcludedDates(excludedDates.filter((d) => d !== dateStr));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formError = validateScheduleForm({
      projectId,
      startDate,
      endDate,
      workingDays,
      includedDates,
      excludedDates,
      scheduleType,
      workerId,
      teamId,
    });

    if (formError) {
      toast.error(formError);
      return;
    }

    setIsSubmitting(true);

    try {
      if (scheduleToEdit) {
        // Edição individual
        updateAttendanceSchedule(scheduleToEdit.id, {
          projectId,
          workerId,
          teamId: teamId || undefined,
          startDate,
          endDate,
          workingDays,
          includedDates,
          excludedDates,
          status,
          notes: notes.trim() || undefined,
        });
        toast.success("Escala de presença atualizada com sucesso!");
        onOpenChange(false);
      } else {
        // Criação de nova escala
        if (scheduleType === "team") {
          // Criação por Equipa (Transacional)
          const newSchedules = bulkAddTeamAttendanceSchedules(teamId, projectId, {
            startDate,
            endDate,
            workingDays,
            includedDates,
            excludedDates,
            status,
            notes: notes.trim() || undefined,
          });
          toast.success(
            `Escalas criadas com sucesso para ${newSchedules.length} trabalhadores da equipa!`
          );
          onOpenChange(false);
        } else {
          // Criação por Trabalhador Individual
          addAttendanceSchedule({
            projectId,
            workerId,
            teamId: teamId || undefined,
            startDate,
            endDate,
            workingDays,
            includedDates,
            excludedDates,
            status,
            notes: notes.trim() || undefined,
          });
          toast.success("Escala de presença criada com sucesso!");
          onOpenChange(false);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao guardar a escala de presença.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg w-full max-h-[92vh] overflow-y-auto p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-5 border-b bg-muted/20">
            <DialogTitle className="text-sm font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              {scheduleToEdit ? "Editar Escala de Presença" : "Nova Escala de Presença"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 space-y-4 text-xs">
            {/* Tipo de Escala (Criar por Trabalhador vs Equipa) */}
            {!scheduleToEdit && (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Modo de Configuração</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant={scheduleType === "worker" ? "default" : "outline"}
                    size="sm"
                    className="h-9 text-xs justify-start gap-2"
                    onClick={() => setScheduleType("worker")}
                  >
                    <User className="h-3.5 w-3.5" /> Por Trabalhador
                  </Button>
                  <Button
                    type="button"
                    variant={scheduleType === "team" ? "default" : "outline"}
                    size="sm"
                    className="h-9 text-xs justify-start gap-2"
                    onClick={() => setScheduleType("team")}
                  >
                    <Users className="h-3.5 w-3.5 text-amber-500" /> Por Equipa
                  </Button>
                </div>
              </div>
            )}

            {/* Seleção da Obra */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Obra *</Label>
              <Select value={projectId} onValueChange={setProjectId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Selecione a obra..." />
                </SelectTrigger>
                <SelectContent className="text-xs">
                  {activeObras.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Seleção do Trabalhador ou Equipa */}
            {scheduleType === "worker" ? (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Trabalhador *</Label>
                <Select value={workerId} onValueChange={setWorkerId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione o trabalhador..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {activeWorkers.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.role})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Equipa *</Label>
                <Select value={teamId} onValueChange={setTeamId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione a equipa..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    {activeTeams.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name} ({t.workerIds.length} membros)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                  <Info className="h-3 w-3 text-amber-500 shrink-0" />
                  Criará escalas individuais para todos os elementos ativos da equipa.
                </p>
              </div>
            )}

            {/* Intervalo de Datas */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data Inicial *</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Data Final *</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Dias da Semana (Botões Compactos) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Dias de Trabalho da Semana</Label>
              <div className="grid grid-cols-7 gap-1">
                {allDays.map((day) => {
                  const isSelected = workingDays.includes(day);
                  return (
                    <Button
                      key={day}
                      type="button"
                      variant={isSelected ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleDayOfWeek(day)}
                      className={`h-9 p-0 text-[10px] font-bold ${
                        isSelected
                          ? "bg-primary text-white"
                          : "bg-muted/20 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {translateDayOfWeek(day).slice(0, 3)}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Datas Extraordinárias (includedDates) */}
            <div className="space-y-1.5 border-t pt-3">
              <Label className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                Datas Extraordinárias de Trabalho (Trabalho no Fim de Semana)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={tempIncludedDate}
                  min={startDate}
                  max={endDate}
                  onChange={(e) => setTempIncludedDate(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddIncludedDate}
                  className="h-9 text-xs px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              {includedDates.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {includedDates.map((d) => (
                    <Badge
                      key={d}
                      variant="secondary"
                      className="text-[10px] bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 gap-1"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => handleRemoveIncludedDate(d)}
                        className="hover:opacity-80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Datas Sem Trabalho (excludedDates) */}
            <div className="space-y-1.5 border-t pt-3">
              <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                Datas Sem Trabalho (Feriados / Pontes)
              </Label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={tempExcludedDate}
                  min={startDate}
                  max={endDate}
                  onChange={(e) => setTempExcludedDate(e.target.value)}
                  className="h-9 text-xs flex-1"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleAddExcludedDate}
                  className="h-9 text-xs px-3"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Adicionar
                </Button>
              </div>
              {excludedDates.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {excludedDates.map((d) => (
                    <Badge
                      key={d}
                      variant="secondary"
                      className="text-[10px] bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30 gap-1"
                    >
                      {d}
                      <button
                        type="button"
                        onClick={() => handleRemoveExcludedDate(d)}
                        className="hover:opacity-80"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Estado e Notas */}
            <div className="grid grid-cols-2 gap-3 border-t pt-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Estado</Label>
                <Select
                  value={status}
                  onValueChange={(val: any) => setStatus(val)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="text-xs">
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Notas (Opcional)</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Turno especial de betonagem..."
                  className="text-xs h-9 min-h-[36px] resize-none"
                />
              </div>
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
              disabled={isSubmitting}
              className="text-xs h-9 bg-primary text-white"
            >
              {isSubmitting
                ? "A guardar..."
                : scheduleToEdit
                ? "Atualizar Escala"
                : "Guardar Escala"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
