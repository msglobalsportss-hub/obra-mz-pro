import { useEffect, useState, useMemo } from "react";
import type { AttendanceRecord, Worker, Obra, Team, ProjectAssignment, AttendanceStatus } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useObraMZStore } from "@/store/obramz-store";
import { toast } from "sonner";
import { Search, Calendar, AlertCircle, Users, Check, X, Clock, HelpCircle, User, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { calculateWorkedMinutes, validateTimeFields, formatMins } from "@/lib/time-utils";

type AttendanceRollCallDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preselectedDate?: string | null;
  preselectedProjectId?: string | null;
};

interface RollCallWorkerItem {
  worker: Worker;
  assignment: ProjectAssignment;
  team?: Team;
  status: AttendanceStatus;
  notes: string;
  checkInTime: string;
  checkOutTime: string;
  breakMinutes: number;
  overtimeMinutes: number;
  showHours: boolean;
  initialStatus: AttendanceStatus;
  initialNotes: string;
  initialCheckIn: string;
  initialCheckOut: string;
  initialBreak: number;
  initialOvertime: number;
}

export function AttendanceRollCallDialog({
  open,
  onOpenChange,
  preselectedDate = null,
  preselectedProjectId = null,
}: AttendanceRollCallDialogProps) {
  const bulkUpsertAttendanceRecords = useObraMZStore((s) => s.bulkUpsertAttendanceRecords);
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);
  const projectAssignments = useObraMZStore((s) => s.projectAssignments || []);
  const attendanceRecords = useObraMZStore((s) => s.attendanceRecords || []);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [date, setDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [workersList, setWorkersList] = useState<RollCallWorkerItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  // Inicializar data e obra
  useEffect(() => {
    if (open) {
      setDate(preselectedDate || todayStr);
      setProjectId(preselectedProjectId && preselectedProjectId !== "all" ? preselectedProjectId : "");
      setWorkersList([]);
      setIsSaving(false);
      setProjectSearch("");
    }
  }, [open, preselectedDate, preselectedProjectId, todayStr]);

  // Filtrar Obras Selecionáveis (Ativas)
  const selectableObras = useMemo(() => {
    return obras.filter((o) => o.estado !== "concluida" && o.estado !== "cancelada");
  }, [obras]);

  const filteredObras = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    return selectableObras.filter((o) => {
      return q === "" || o.nome.toLowerCase().includes(q);
    });
  }, [selectableObras, projectSearch]);

  // 1. Carregar operários elegíveis dinamicamente
  const eligibleWorkers = useMemo(() => {
    if (!date || !projectId) return [];

    // Apenas ativos
    const activeWorkers = workers.filter((w) => w.status === "active" && w.id !== "invalid-orphan");

    const list: { worker: Worker; assignment: ProjectAssignment; team?: Team }[] = [];

    activeWorkers.forEach((w) => {
      // Regra A: Atribuição individual
      let matchingAssign = projectAssignments.find((a) => {
        if (a.status !== "active") return false;
        if (a.projectId !== projectId) return false;

        const sDate = a.startDate;
        const eDate = a.endDate || "9999-12-31";
        if (date < sDate || date > eDate) return false;

        return a.assignmentType === "worker" && a.workerId === w.id;
      });

      // Regra B: Atribuição de equipa (via snapshot)
      if (!matchingAssign) {
        matchingAssign = projectAssignments.find((a) => {
          if (a.status !== "active") return false;
          if (a.projectId !== projectId) return false;

          const sDate = a.startDate;
          const eDate = a.endDate || "9999-12-31";
          if (date < sDate || date > eDate) return false;

          return a.assignmentType === "team" && a.assignedWorkerIds?.includes(w.id);
        });
      }

      if (matchingAssign) {
        const team = matchingAssign.assignmentType === "team" ? teams.find((t) => t.id === matchingAssign.teamId) : undefined;
        list.push({
          worker: w,
          assignment: matchingAssign,
          team,
        });
      }
    });

    // Ordenação: Equipa (Individual por último) e Nome do Trabalhador
    return list.sort((a, b) => {
      const teamA = a.team?.name || "ZZZZZZZZZZ";
      const teamB = b.team?.name || "ZZZZZZZZZZ";
      const teamCompare = teamA.localeCompare(teamB, "pt-PT");
      if (teamCompare !== 0) return teamCompare;
      return a.worker.name.localeCompare(b.worker.name, "pt-PT");
    });
  }, [date, projectId, workers, projectAssignments, teams]);

  // 2. Mapear trabalhadores elegíveis para itens de chamada (se existirem na base de dados, carrega status; senão, inicia como "present")
  useEffect(() => {
    if (!date || !projectId) {
      setWorkersList([]);
      return;
    }

    const list = eligibleWorkers.map((ew) => {
      const existing = attendanceRecords.find(
        (r) => r.workerId === ew.worker.id && r.projectId === projectId && r.date === date
      );

      const statusVal = existing ? existing.status : "present";
      const notesVal = existing?.notes || "";
      const checkInVal = existing?.checkInTime || "";
      const checkOutVal = existing?.checkOutTime || "";
      const breakVal = existing?.breakMinutes || 0;
      const overtimeVal = existing?.overtimeMinutes || 0;

      return {
        worker: ew.worker,
        assignment: ew.assignment,
        team: ew.team,
        status: statusVal,
        notes: notesVal,
        checkInTime: checkInVal,
        checkOutTime: checkOutVal,
        breakMinutes: breakVal,
        overtimeMinutes: overtimeVal,
        showHours: !!(checkInVal || overtimeVal),
        initialStatus: statusVal,
        initialNotes: notesVal,
        initialCheckIn: checkInVal,
        initialCheckOut: checkOutVal,
        initialBreak: breakVal,
        initialOvertime: overtimeVal,
      };
    });

    setWorkersList(list);
  }, [date, projectId, eligibleWorkers, attendanceRecords]);

  // Verificar se existem alterações não guardadas
  const hasChanges = useMemo(() => {
    return workersList.some(
      (item) =>
        item.status !== item.initialStatus ||
        item.notes !== item.initialNotes ||
        item.checkInTime !== item.initialCheckIn ||
        item.checkOutTime !== item.initialCheckOut ||
        item.breakMinutes !== item.initialBreak ||
        item.overtimeMinutes !== item.initialOvertime
    );
  }, [workersList]);

  // Mudar de data com validação de alterações descartadas
  const handleDateChange = (newVal: string) => {
    if (hasChanges) {
      const discard = window.confirm("Existem alterações não guardadas na chamada diária. Deseja descartá-las?");
      if (!discard) return;
    }
    setDate(newVal);
  };

  // Mudar de obra com validação de alterações descartadas
  const handleProjectChange = (newVal: string) => {
    if (hasChanges) {
      const discard = window.confirm("Existem alterações não guardadas na chamada diária. Deseja descartá-las?");
      if (!discard) return;
    }
    setProjectId(newVal);
  };

  // Modificar estado de presença de um trabalhador com confirmações de limpeza de horas
  const updateWorkerStatus = (workerId: string, newStatus: AttendanceStatus) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        if (item.worker.id === workerId) {
          // Se o estado não permitir horas e houver horas preenchidas, pedir confirmação
          if (newStatus === "absent" || newStatus === "justified_absence") {
            const hasHoursData = item.checkInTime || item.checkOutTime || item.breakMinutes > 0 || item.overtimeMinutes > 0;
            if (hasHoursData) {
              const confirmClear = window.confirm(
                `Alterar o estado de ${item.worker.name} para ${newStatus === "absent" ? "Ausente" : "Falta Justificada"} irá apagar as horas registadas para este trabalhador. Deseja continuar?`
              );
              if (!confirmClear) return item;
            }
            return {
              ...item,
              status: newStatus,
              checkInTime: "",
              checkOutTime: "",
              breakMinutes: 0,
              overtimeMinutes: 0,
              showHours: false,
            };
          }
          return { ...item, status: newStatus };
        }
        return item;
      })
    );
  };

  // Modificar nota de um trabalhador
  const updateWorkerNotes = (workerId: string, newNotes: string) => {
    setWorkersList((prev) =>
      prev.map((item) =>
        item.worker.id === workerId ? { ...item, notes: newNotes } : item
      )
    );
  };

  // Modificar horas de um trabalhador
  const updateWorkerHours = (
    workerId: string,
    field: "checkInTime" | "checkOutTime" | "breakMinutes" | "overtimeMinutes",
    value: any
  ) => {
    setWorkersList((prev) =>
      prev.map((item) =>
        item.worker.id === workerId ? { ...item, [field]: value } : item
      )
    );
  };

  // Expandir/recolher seção de horas por trabalhador
  const toggleWorkerHours = (workerId: string) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        if (item.worker.id === workerId) {
          // Bloquear se o trabalhador estiver ausente
          const isAbsent = item.status === "absent" || item.status === "justified_absence";
          if (isAbsent && !item.showHours) {
            toast.error("Não é possível registar horas para trabalhadores ausentes ou em falta justificada.");
            return item;
          }
          return { ...item, showHours: !item.showHours };
        }
        return item;
      })
    );
  };

  // Resumo em tempo real da chamada
  const summary = useMemo(() => {
    const total = workersList.length;
    const present = workersList.filter((item) => item.status === "present").length;
    const absent = workersList.filter((item) => item.status === "absent").length;
    const late = workersList.filter((item) => item.status === "late").length;
    const halfDay = workersList.filter((item) => item.status === "half_day").length;

    return { total, present, absent, late, halfDay };
  }, [workersList]);

  // Gravar chamada em massa (Upsert)
  const handleSave = async () => {
    if (!projectId || !date || workersList.length === 0) return;

    // Validar tempos de cada trabalhador
    for (const item of workersList) {
      const allowsHours = item.status === "present" || item.status === "late" || item.status === "half_day";
      if (allowsHours && (item.checkInTime || item.checkOutTime || item.overtimeMinutes > 0)) {
        const error = validateTimeFields(item.checkInTime, item.checkOutTime, item.breakMinutes, item.overtimeMinutes);
        if (error) {
          toast.error(`Erro no trabalhador ${item.worker.name}: ${error}`);
          return;
        }
      }
    }

    setIsSaving(true);

    const payloads = workersList.map((item) => {
      const allowsHours = item.status === "present" || item.status === "late" || item.status === "half_day";
      const hasTime = item.checkInTime && item.checkOutTime;

      return {
        projectId,
        phaseId: undefined, // Sem fase na chamada em massa por defeito
        workerId: item.worker.id,
        teamId: item.team?.id,
        assignmentId: item.assignment.id,
        date,
        status: item.status,
        notes: item.notes.trim() || undefined,
        checkInTime: allowsHours && hasTime ? item.checkInTime : undefined,
        checkOutTime: allowsHours && hasTime ? item.checkOutTime : undefined,
        breakMinutes: allowsHours && hasTime ? item.breakMinutes : undefined,
        workedMinutes: allowsHours && hasTime ? calculateWorkedMinutes(item.checkInTime, item.checkOutTime, item.breakMinutes) : undefined,
        overtimeMinutes: allowsHours && item.overtimeMinutes > 0 ? item.overtimeMinutes : undefined,
      };
    });

    try {
      const result = bulkUpsertAttendanceRecords(payloads);
      
      if (result.created === 0 && result.updated === 0) {
        toast.info("Nenhuma alteração necessária.");
      } else {
        toast.success(`Chamada guardada: ${result.created} registos criados e ${result.updated} atualizados.`);
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao gravar a chamada diária.");
    } finally {
      setIsSaving(false);
    }
  };

  // Tratar fecho do diálogo se houver alterações
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && hasChanges) {
      const discard = window.confirm("Existem alterações não guardadas. Tem a certeza de que pretende sair?");
      if (!discard) return;
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[92vh] flex flex-col p-0">
        <DialogHeader className="px-5 pt-5 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Chamada Diária da Obra
          </DialogTitle>
        </DialogHeader>

        {/* Seletores Principais */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 px-5 pb-3 border-b">
          <div className="space-y-1">
            <Label htmlFor="rc-date">Data da Chamada *</Label>
            <Input
              id="rc-date"
              type="date"
              max={todayStr}
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="rc-project">Obra *</Label>
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger id="rc-project" className="text-xs h-9">
                <SelectValue placeholder="Escolher obra..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-1.5 pt-1 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar obra..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </div>
                {filteredObras.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-3">
                    Nenhuma obra ativa.
                  </div>
                ) : (
                  filteredObras.map((o) => (
                    <SelectItem key={o.id} value={o.id}>
                      {o.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Resumo da chamada */}
        {projectId && date && workersList.length > 0 && (
          <div className="bg-muted/40 px-5 py-2.5 border-b grid grid-cols-5 gap-2 text-center text-xs">
            <div className="space-y-0.5 border-r border-border/60">
              <div className="text-[10px] text-muted-foreground uppercase font-bold">Total</div>
              <div className="font-black text-foreground text-sm">{summary.total}</div>
            </div>
            <div className="space-y-0.5 border-r border-border/60">
              <div className="text-[10px] text-emerald-600 uppercase font-bold">Presentes</div>
              <div className="font-black text-emerald-600 text-sm">{summary.present}</div>
            </div>
            <div className="space-y-0.5 border-r border-border/60">
              <div className="text-[10px] text-rose-600 uppercase font-bold">Ausentes</div>
              <div className="font-black text-rose-600 text-sm">{summary.absent}</div>
            </div>
            <div className="space-y-0.5 border-r border-border/60">
              <div className="text-[10px] text-amber-600 uppercase font-bold">Atrasados</div>
              <div className="font-black text-amber-600 text-sm">{summary.late}</div>
            </div>
            <div className="space-y-0.5">
              <div className="text-[10px] text-sky-600 uppercase font-bold">Meio Dia</div>
              <div className="font-black text-sky-600 text-sm">{summary.halfDay}</div>
            </div>
          </div>
        )}

        {/* Listagem de Operários */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {!projectId || !date ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground">
              <Calendar className="h-8 w-8 mb-2 opacity-50" />
              <span>Selecione a data e a obra para carregar a lista de chamada.</span>
            </div>
          ) : workersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-xs text-muted-foreground">
              <AlertCircle className="h-8 w-8 mb-2 text-amber-500 opacity-85" />
              <span>Não existem trabalhadores elegíveis nesta obra para a data selecionada.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {workersList.map((item) => {
                const calculated = calculateWorkedMinutes(item.checkInTime, item.checkOutTime, item.breakMinutes);
                const isAbsentStatus = item.status === "absent" || item.status === "justified_absence";

                return (
                  <div
                    key={item.worker.id}
                    className="flex flex-col p-3 border rounded-lg bg-card gap-2.5 hover:shadow-xs transition-shadow"
                  >
                    {/* Linha Principal (Avatar + Nome + Botoes de Presença + Relógio) */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar className="h-8 w-8">
                          {item.worker.photo ? (
                            <img src={item.worker.photo} alt={item.worker.name} className="object-cover" />
                          ) : (
                            <AvatarFallback className="bg-muted text-[10px] font-bold">
                              {initials(item.worker.name)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="min-w-0 flex flex-col">
                          <span className="font-bold text-xs text-foreground truncate">{item.worker.name}</span>
                          <span className="text-[9px] text-muted-foreground">
                            {item.worker.role} •{" "}
                            {item.team ? (
                              <span className="text-primary font-semibold">{item.team.name}</span>
                            ) : (
                              "Atribuição Individual"
                            )}
                          </span>
                        </div>
                      </div>

                      {/* Selector de Presença e Botão de Relógio */}
                      <div className="flex items-center gap-2 self-end sm:self-auto">
                        <div className="flex items-center bg-muted/80 p-0.5 rounded-lg border gap-0.5">
                          <button
                            onClick={() => updateWorkerStatus(item.worker.id, "present")}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                              item.status === "present"
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Presente
                          </button>
                          <button
                            onClick={() => updateWorkerStatus(item.worker.id, "absent")}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                              item.status === "absent"
                                ? "bg-rose-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Ausente
                          </button>
                          <button
                            onClick={() => updateWorkerStatus(item.worker.id, "late")}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                              item.status === "late"
                                ? "bg-amber-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Atrasado
                          </button>
                          <button
                            onClick={() => updateWorkerStatus(item.worker.id, "half_day")}
                            className={`px-2.5 py-1 text-[10px] font-semibold rounded-md transition-all ${
                              item.status === "half_day"
                                ? "bg-sky-600 text-white shadow-xs"
                                : "text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            Meio Dia
                          </button>
                        </div>

                        {/* Botão de Relógio (Registar Horas) */}
                        <button
                          onClick={() => toggleWorkerHours(item.worker.id)}
                          className={`p-1.5 rounded-md border transition-all ${
                            item.showHours
                              ? "bg-primary text-primary-foreground border-primary"
                              : isAbsentStatus
                              ? "opacity-40 cursor-not-allowed bg-muted text-muted-foreground"
                              : "bg-background text-muted-foreground hover:text-foreground border-border"
                          }`}
                          title="Registar horas para este trabalhador"
                          type="button"
                        >
                          <Clock className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Sub-painel Inline de Horas */}
                    {item.showHours && !isAbsentStatus && (
                      <div className="bg-muted/30 p-2.5 rounded-lg border border-dashed grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-bold text-muted-foreground">Entrada</label>
                          <Input
                            type="time"
                            value={item.checkInTime}
                            onChange={(e) => updateWorkerHours(item.worker.id, "checkInTime", e.target.value)}
                            className="h-7 text-[10px] bg-background"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-bold text-muted-foreground">Saída</label>
                          <Input
                            type="time"
                            value={item.checkOutTime}
                            onChange={(e) => updateWorkerHours(item.worker.id, "checkOutTime", e.target.value)}
                            className="h-7 text-[10px] bg-background"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-bold text-muted-foreground">Pausa (min)</label>
                          <Input
                            type="number"
                            min="0"
                            value={item.breakMinutes}
                            onChange={(e) => updateWorkerHours(item.worker.id, "breakMinutes", Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="h-7 text-[10px] bg-background"
                          />
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <label className="text-[9px] font-bold text-muted-foreground">Extra (min)</label>
                          <Input
                            type="number"
                            min="0"
                            value={item.overtimeMinutes}
                            onChange={(e) => updateWorkerHours(item.worker.id, "overtimeMinutes", Math.max(0, parseInt(e.target.value, 10) || 0))}
                            className="h-7 text-[10px] bg-background"
                          />
                        </div>

                        {/* Linha Resumo do Trabalhador */}
                        {item.checkInTime && item.checkOutTime && (
                          <div className="sm:col-span-4 bg-background/60 p-1.5 rounded text-[10px] flex justify-between font-medium">
                            <span>Horas Normais: <span className="text-foreground font-bold">{formatMins(calculated)}</span></span>
                            {item.overtimeMinutes > 0 && (
                              <span>Horas Extra: <span className="text-amber-600 font-bold">{formatMins(item.overtimeMinutes)}</span></span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Nota do Trabalhador */}
                    <div className="relative">
                      <FileText className="absolute left-2.5 top-2 h-3.5 w-3.5 text-muted-foreground/60" />
                      <Input
                        placeholder="Adicionar nota para este trabalhador..."
                        value={item.notes}
                        onChange={(e) => updateWorkerNotes(item.worker.id, e.target.value)}
                        className="pl-8 text-[10px] h-7 bg-muted/20 border-0"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <DialogFooter className="px-5 py-4 border-t gap-2 bg-muted/10">
          <Button variant="outline" onClick={() => handleOpenChange(false)} className="text-xs h-9">
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!projectId || !date || workersList.length === 0 || isSaving}
            className="bg-primary hover:bg-primary-dark text-white text-xs h-9 px-4"
          >
            {isSaving ? "A guardar chamada..." : "Guardar Chamada"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
