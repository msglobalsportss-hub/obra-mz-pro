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
import { Badge } from "@/components/ui/badge";
import { useObraMZStore } from "@/store/obramz-store";
import { toast } from "sonner";
import {
  Search, Calendar, AlertCircle, Users, Check, X, Clock, HelpCircle, User,
  FileText, ChevronDown, ChevronUp, UserPlus, Ban, Copy, RotateCcw, AlertTriangle, CheckCircle2, XCircle
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { calculateWorkedMinutes, validateTimeFields, formatMins } from "@/lib/time-utils";
import { resolveWorkersScheduledForDate, type AttendanceSchedule } from "@/lib/attendance-schedule";
import { calculateAttendanceLabourCost } from "@/lib/attendance-labour-cost";
import { AttendanceExtraWorkerDialog } from "./attendance-extra-worker-dialog";
import { AttendanceDisableDayDialog } from "./attendance-disable-day-dialog";

type AttendanceRollCallDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  preselectedDate?: string | null;
  preselectedProjectId?: string | null;
};

interface RollCallWorkerItem {
  worker: Worker;
  assignment?: ProjectAssignment;
  schedule?: AttendanceSchedule;
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
  isExtra?: boolean;
  extraReason?: string;
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
  const attendanceSchedules = useObraMZStore((s) => s.attendanceSchedules || []);
  const attendanceRecords = useObraMZStore((s) => s.attendanceRecords || []);
  const disabledProjectDays = useObraMZStore((s) => s.disabledProjectDays || []);
  const enableProjectDay = useObraMZStore((s) => s.enableProjectDay);

  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const [date, setDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [workersList, setWorkersList] = useState<RollCallWorkerItem[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");

  const [collapsedTeams, setCollapsedTeams] = useState<Record<string, boolean>>({});
  const [extraWorkerDialogOpen, setExtraWorkerDialogOpen] = useState(false);
  const [disableDayDialogOpen, setDisableDayDialogOpen] = useState(false);

  // Verificação de dia desativado
  const currentDisabledRecord = useMemo(() => {
    if (!projectId || !date) return undefined;
    return disabledProjectDays.find((d) => d.projectId === projectId && d.date === date);
  }, [disabledProjectDays, projectId, date]);

  // Inicializar data e obra
  useEffect(() => {
    if (open) {
      setDate(preselectedDate || todayStr);
      setProjectId(preselectedProjectId && preselectedProjectId !== "all" ? preselectedProjectId : "");
      setWorkersList([]);
      setIsSaving(false);
      setProjectSearch("");
      setWorkerSearch("");
      setCollapsedTeams({});
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

  // 1. Carregar operários elegíveis dinamicamente via resolveWorkersScheduledForDate
  const eligibleWorkers = useMemo(() => {
    if (!date || !projectId) return [];

    const resolved = resolveWorkersScheduledForDate(
      projectId,
      date,
      attendanceSchedules,
      projectAssignments,
      workers,
      teams
    );

    const list = resolved.map((r) => ({
      worker: r.worker,
      assignment: r.assignment,
      schedule: r.schedule,
      team: r.team,
    }));

    // Ordenação: Equipa (Individual por último) e Nome do Trabalhador
    return list.sort((a, b) => {
      const teamA = a.team?.name || "ZZZZZZZZZZ";
      const teamB = b.team?.name || "ZZZZZZZZZZ";
      const teamCompare = teamA.localeCompare(teamB, "pt-PT");
      if (teamCompare !== 0) return teamCompare;
      return a.worker.name.localeCompare(b.worker.name, "pt-PT");
    });
  }, [date, projectId, attendanceSchedules, projectAssignments, workers, teams]);

  // 2. Mapear trabalhadores elegíveis para itens de chamada
  useEffect(() => {
    if (!date || !projectId) {
      setWorkersList([]);
      return;
    }

    const items: RollCallWorkerItem[] = eligibleWorkers.map((item) => {
      const existing = attendanceRecords.find(
        (r) => r.projectId === projectId && r.date === date && r.workerId === item.worker.id
      );

      const st = existing ? existing.status : "present";
      const nt = existing ? existing.notes || "" : "";
      const inT = existing?.checkInTime || "07:30";
      const outT = existing?.checkOutTime || "17:00";
      const brk = existing?.breakMinutes ?? 60;
      const ovt = existing?.overtimeMinutes ?? 0;

      return {
        worker: item.worker,
        assignment: item.assignment,
        schedule: item.schedule,
        team: item.team,
        status: st,
        notes: nt,
        checkInTime: inT,
        checkOutTime: outT,
        breakMinutes: brk,
        overtimeMinutes: ovt,
        showHours: existing ? !!(existing.checkInTime && existing.checkOutTime) : false,
        initialStatus: st,
        initialNotes: nt,
        initialCheckIn: inT,
        initialCheckOut: outT,
        initialBreak: brk,
        initialOvertime: ovt,
        isExtra: false,
      };
    });

    setWorkersList(items);
  }, [eligibleWorkers, date, projectId, attendanceRecords]);

  // Filtrar trabalhadores por pesquisa instantânea
  const filteredWorkersList = useMemo(() => {
    if (!workerSearch.trim()) return workersList;
    const q = workerSearch.toLowerCase().trim();
    return workersList.filter((item) => {
      const nameMatch = item.worker.name.toLowerCase().includes(q);
      const roleMatch = item.worker.role.toLowerCase().includes(q);
      const teamMatch = item.team ? item.team.name.toLowerCase().includes(q) : false;
      return nameMatch || roleMatch || teamMatch;
    });
  }, [workersList, workerSearch]);

  // Agrupar por equipa
  const groupedTeamsMap = useMemo(() => {
    const map = new Map<string, RollCallWorkerItem[]>();
    filteredWorkersList.forEach((item) => {
      const groupName = item.team ? item.team.name : "Sem Equipa";
      if (!map.has(groupName)) map.set(groupName, []);
      map.get(groupName)!.push(item);
    });
    return map;
  }, [filteredWorkersList]);

  // Contadores em Tempo Real
  const counts = useMemo(() => {
    let present = 0;
    let absent = 0;
    let justified = 0;
    let total = workersList.length;

    workersList.forEach((item) => {
      if (item.status === "present" || item.status === "late" || item.status === "half_day") {
        present++;
      } else if (item.status === "absent") {
        absent++;
      } else if (item.status === "justified_absence") {
        justified++;
      }
    });

    return { present, absent, justified, total };
  }, [workersList]);

  // Modificações globais em lote
  const handleMarkAllPresent = () => {
    setWorkersList((prev) => prev.map((item) => ({ ...item, status: "present" })));
    toast.success("Todos os trabalhadores marcados como Presentes.");
  };

  const handleMarkAllAbsent = () => {
    setWorkersList((prev) => prev.map((item) => ({ ...item, status: "absent" })));
    toast.success("Todos os trabalhadores marcados como Ausentes.");
  };

  const handleClearAll = () => {
    setWorkersList((prev) =>
      prev.map((item) => ({
        ...item,
        status: item.initialStatus,
        notes: item.initialNotes,
      }))
    );
    toast.info("Marcações da chamada repostas.");
  };

  // Copiar Chamada de Ontem
  const handleCopyYesterday = () => {
    if (!date || !projectId) return;

    const parts = date.split("-");
    const dObj = new Date(parseInt(parts[0]!, 10), parseInt(parts[1]!, 10) - 1, parseInt(parts[2]!, 10));
    dObj.setDate(dObj.getDate() - 1);

    const yYear = dObj.getFullYear();
    const yMonth = String(dObj.getMonth() + 1).padStart(2, "0");
    const yDay = String(dObj.getDate()).padStart(2, "0");
    const yesterdayStr = `${yYear}-${yMonth}-${yDay}`;

    const prevRecords = attendanceRecords.filter(
      (r) => r.projectId === projectId && r.date === yesterdayStr
    );

    if (prevRecords.length === 0) {
      toast.error(`Nenhuma chamada anterior encontrada para a data de ontem (${yesterdayStr}).`);
      return;
    }

    const prevMap = new Map(prevRecords.map((r) => [r.workerId, r]));
    let copiedCount = 0;

    setWorkersList((prev) =>
      prev.map((item) => {
        const prevRecord = prevMap.get(item.worker.id);
        if (prevRecord) {
          copiedCount++;
          return {
            ...item,
            status: prevRecord.status,
            notes: prevRecord.notes || item.notes,
            checkInTime: prevRecord.checkInTime || item.checkInTime,
            checkOutTime: prevRecord.checkOutTime || item.checkOutTime,
            breakMinutes: prevRecord.breakMinutes ?? item.breakMinutes,
            overtimeMinutes: prevRecord.overtimeMinutes ?? item.overtimeMinutes,
          };
        }
        return item;
      })
    );

    toast.success(`Chamada de ontem (${yesterdayStr}) copiada! ${copiedCount} trabalhadores preenchidos.`);
  };

  // Modificações por Equipa
  const handleMarkTeamStatus = (groupName: string, targetStatus: AttendanceStatus) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        const itemTeamName = item.team ? item.team.name : "Sem Equipa";
        if (itemTeamName === groupName) {
          return { ...item, status: targetStatus };
        }
        return item;
      })
    );
    toast.success(`Equipa "${groupName}": marcada como ${targetStatus === "present" ? "Presente" : "Ausente"}.`);
  };

  const handleClearTeamStatus = (groupName: string) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        const itemTeamName = item.team ? item.team.name : "Sem Equipa";
        if (itemTeamName === groupName) {
          return { ...item, status: item.initialStatus, notes: item.initialNotes };
        }
        return item;
      })
    );
    toast.info(`Equipa "${groupName}": marcações repostas.`);
  };

  const toggleTeamCollapse = (groupName: string) => {
    setCollapsedTeams((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  // Adicionar Trabalhador Extraordinário
  const handleAddExtraWorker = (extraWorker: Worker, reason: string, customNotes?: string) => {
    const newItem: RollCallWorkerItem = {
      worker: extraWorker,
      status: "present",
      notes: customNotes ? `Reforço (${reason}): ${customNotes}` : `Reforço (${reason})`,
      checkInTime: "07:30",
      checkOutTime: "17:00",
      breakMinutes: 60,
      overtimeMinutes: 0,
      showHours: false,
      initialStatus: "present",
      initialNotes: "",
      initialCheckIn: "07:30",
      initialCheckOut: "17:00",
      initialBreak: 60,
      initialOvertime: 0,
      isExtra: true,
      extraReason: reason,
    };

    setWorkersList((prev) => [newItem, ...prev]);
  };

  const handleReenableDay = () => {
    if (!projectId || !date) return;
    enableProjectDay(projectId, date);
    toast.success("Dia reativado com sucesso para presenças!");
  };

  // Atualizar estado individual de um operário
  const handleStatusChange = (workerId: string, status: AttendanceStatus) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        if (item.worker.id === workerId) {
          return { ...item, status };
        }
        return item;
      })
    );
  };

  const handleNotesChange = (workerId: string, notes: string) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        if (item.worker.id === workerId) {
          return { ...item, notes };
        }
        return item;
      })
    );
  };

  const handleTimeChange = (
    workerId: string,
    field: "checkInTime" | "checkOutTime" | "breakMinutes" | "overtimeMinutes",
    value: any
  ) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        if (item.worker.id === workerId) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const toggleShowHours = (workerId: string) => {
    setWorkersList((prev) =>
      prev.map((item) => {
        if (item.worker.id === workerId) {
          return { ...item, showHours: !item.showHours };
        }
        return item;
      })
    );
  };

  const hasChanges = useMemo(() => {
    return workersList.some(
      (item) =>
        item.status !== item.initialStatus ||
        item.notes !== item.initialNotes ||
        item.checkInTime !== item.initialCheckIn ||
        item.checkOutTime !== item.initialCheckOut ||
        item.breakMinutes !== item.initialBreak ||
        item.overtimeMinutes !== item.initialOvertime ||
        item.isExtra
    );
  }, [workersList]);

  // Guardar Chamada Diária
  const handleSave = () => {
    if (!date) {
      toast.error("Por favor, selecione uma data válida.");
      return;
    }
    if (!projectId) {
      toast.error("Por favor, selecione uma obra para efetuar a chamada.");
      return;
    }

    // Se o dia não estiver desativado, validar campos de horário se ativados
    if (!currentDisabledRecord) {
      for (const item of workersList) {
        const allowsHours = item.status === "present" || item.status === "late" || item.status === "half_day";
        if (allowsHours && item.showHours) {
          const err = validateTimeFields(item.checkInTime, item.checkOutTime, item.breakMinutes);
          if (err) {
            toast.error(`Trabalhador ${item.worker.name}: ${err}`);
            return;
          }
        }
      }
    }

    setIsSaving(true);

    const payloads = workersList.map((item) => {
      const allowsHours = item.status === "present" || item.status === "late" || item.status === "half_day";
      const hasTime = item.checkInTime && item.checkOutTime;

      const existing = attendanceRecords.find(
        (r) => r.projectId === projectId && r.date === date && r.workerId === item.worker.id
      );

      const costResult = calculateAttendanceLabourCost({
        status: item.status,
        paymentType: item.worker.paymentType,
        dailyRate: item.worker.dailyRate,
        hourlyRate: item.worker.hourlyRate,
        monthlyRate: item.worker.monthlyRate,
        overtimeHourlyRate: item.worker.overtimeHourlyRate,
        currency: item.worker.currency,
        defaultWorkingHours: item.worker.defaultWorkingHours,
        checkInTime: allowsHours && hasTime ? item.checkInTime : undefined,
        checkOutTime: allowsHours && hasTime ? item.checkOutTime : undefined,
        breakMinutes: allowsHours && hasTime ? item.breakMinutes : undefined,
        existingSnapshot: existing?.costCalculationVersion
          ? {
              paymentTypeSnapshot: existing.paymentTypeSnapshot,
              dailyRateSnapshot: existing.dailyRateSnapshot,
              hourlyRateSnapshot: existing.hourlyRateSnapshot,
              monthlyRateSnapshot: existing.monthlyRateSnapshot,
              overtimeHourlyRateSnapshot: existing.overtimeHourlyRateSnapshot,
              currencySnapshot: existing.currencySnapshot,
              defaultWorkingHoursSnapshot: existing.defaultWorkingHoursSnapshot,
            }
          : undefined,
      });

      return {
        projectId,
        phaseId: undefined,
        workerId: item.worker.id,
        teamId: item.team?.id,
        assignmentId: item.assignment?.id || item.schedule?.assignmentId,
        date,
        status: item.status,
        notes: item.notes.trim() || undefined,
        checkInTime: allowsHours && hasTime ? item.checkInTime : undefined,
        checkOutTime: allowsHours && hasTime ? item.checkOutTime : undefined,
        breakMinutes: allowsHours && hasTime ? item.breakMinutes : undefined,
        workedMinutes: allowsHours && hasTime ? calculateWorkedMinutes(item.checkInTime, item.checkOutTime, item.breakMinutes) : undefined,
        overtimeMinutes: allowsHours && item.overtimeMinutes > 0 ? item.overtimeMinutes : undefined,

        // Horas e Custos Operacionais
        regularHours: costResult.regularHours,
        overtimeHours: costResult.overtimeHours,
        workedHours: costResult.workedHours,
        regularLabourCost: costResult.regularLabourCost,
        overtimeLabourCost: costResult.overtimeLabourCost,
        labourCost: costResult.labourCost,

        // Snapshots Imutáveis
        paymentTypeSnapshot: costResult.paymentTypeSnapshot,
        dailyRateSnapshot: costResult.dailyRateSnapshot,
        hourlyRateSnapshot: costResult.hourlyRateSnapshot,
        monthlyRateSnapshot: costResult.monthlyRateSnapshot,
        overtimeHourlyRateSnapshot: costResult.overtimeHourlyRateSnapshot,
        currencySnapshot: costResult.currencySnapshot,
        defaultWorkingHoursSnapshot: costResult.defaultWorkingHoursSnapshot,

        costCalculatedAt: existing?.costCalculatedAt || new Date().toISOString(),
        costCalculationVersion: 1,
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

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen && hasChanges) {
      const discard = window.confirm("Existem alterações não guardadas na chamada. Tem a certeza de que pretende sair?");
      if (!discard) return;
    }
    onOpenChange(isOpen);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-4xl w-full max-h-[92vh] flex flex-col p-0 overflow-hidden">
          {/* Cabeçalho */}
          <DialogHeader className="p-4 sm:p-5 border-b bg-muted/20 shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <DialogTitle className="text-base font-bold flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Chamada Diária
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Registo em lote de presenças para todos os trabalhadores agendados na obra.
                </p>
              </div>

              {/* Contadores em Tempo Real */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
                  <CheckCircle2 className="h-3 w-3 mr-1" /> {counts.present} Presentes
                </Badge>
                <Badge variant="outline" className="text-[10px] bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30">
                  <XCircle className="h-3 w-3 mr-1" /> {counts.absent} Ausentes
                </Badge>
                {counts.justified > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/30">
                    {counts.justified} Licenças
                  </Badge>
                )}
                <Badge variant="secondary" className="text-[10px] font-bold">
                  Total: {counts.total}
                </Badge>
              </div>
            </div>

            {/* Seleção de Obra e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Data da Chamada *</Label>
                <div className="relative">
                  <Calendar className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-muted-foreground pointer-events-none" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="h-9 pl-8 text-xs font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Obra *</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Selecione a obra..." />
                  </SelectTrigger>
                  <SelectContent className="text-xs max-h-56">
                    <div className="p-1.5 border-b">
                      <div className="relative">
                        <Search className="h-3 w-3 absolute left-2 top-2 text-muted-foreground" />
                        <Input
                          placeholder="Filtrar obra..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="h-7 pl-7 text-[11px]"
                        />
                      </div>
                    </div>
                    {filteredObras.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </DialogHeader>

          {/* Banner de Dia Desativado (Se Existir) */}
          {currentDisabledRecord && (
            <div className="bg-amber-500/15 border-b border-amber-500/30 p-3 px-5 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-300">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Aviso:</strong> Este dia foi marcado como sem trabalho por motivo de{" "}
                  <strong>"{currentDisabledRecord.reason}"</strong>.
                </span>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleReenableDay}
                className="h-7 text-[11px] bg-background border-amber-500/40 text-amber-900 dark:text-amber-200"
              >
                <RotateCcw className="h-3 w-3 mr-1" /> Reativar Dia
              </Button>
            </div>
          )}

          {/* Toolbar de Ações Rápidas Globais e Pesquisa */}
          {projectId && date && (
            <div className="p-3 bg-muted/30 border-b space-y-2 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Botões de Marcação Global */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAllPresent}
                    className="h-7 text-[11px] gap-1 border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                  >
                    <Check className="h-3 w-3" /> Todos Presentes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleMarkAllAbsent}
                    className="h-7 text-[11px] gap-1 border-rose-500/30 text-rose-700 dark:text-rose-400 hover:bg-rose-500/10"
                  >
                    <X className="h-3 w-3" /> Todos Ausentes
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={handleClearAll}
                    className="h-7 text-[11px] text-muted-foreground"
                  >
                    Limpar
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleCopyYesterday}
                    className="h-7 text-[11px] gap-1 border-border/80"
                  >
                    <Copy className="h-3 w-3" /> Copiar Ontem
                  </Button>
                </div>

                {/* Adicionar Trabalhador Extra & Desativar Dia */}
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => setExtraWorkerDialogOpen(true)}
                    className="h-7 text-[11px] gap-1"
                  >
                    <UserPlus className="h-3.5 w-3.5 text-primary" /> Adicionar Trabalhador
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDisableDayDialogOpen(true)}
                    className="h-7 text-[11px] gap-1 text-amber-700 dark:text-amber-400 border-amber-500/30"
                  >
                    <Ban className="h-3.5 w-3.5" /> Desativar Dia
                  </Button>
                </div>
              </div>

              {/* Pesquisa Instantânea */}
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-2 text-muted-foreground pointer-events-none" />
                <Input
                  placeholder="Pesquisar por nome do trabalhador ou equipa..."
                  value={workerSearch}
                  onChange={(e) => setWorkerSearch(e.target.value)}
                  className="h-7 pl-8 text-xs bg-background"
                />
              </div>
            </div>
          )}

          {/* Conteúdo Principal (Lista por Equipas) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {!projectId || !date ? (
              <div className="p-8 text-center text-muted-foreground space-y-2 border border-dashed rounded-xl">
                <Calendar className="h-8 w-8 mx-auto opacity-40 text-primary" />
                <p className="text-xs">Selecione uma obra e uma data para iniciar a chamada diária.</p>
              </div>
            ) : filteredWorkersList.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground space-y-3 border border-dashed rounded-xl">
                <Users className="h-8 w-8 mx-auto opacity-40" />
                <div className="space-y-1">
                  <p className="text-xs font-semibold">Nenhum trabalhador agendado para esta data.</p>
                  <p className="text-[11px]">
                    Nenhum trabalhador tem escala ativa nesta obra para {date}. Pode clicar em "Adicionar Trabalhador" para incluir apoios pontuais.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setExtraWorkerDialogOpen(true)}
                  className="text-xs"
                >
                  <UserPlus className="h-3.5 w-3.5 mr-1.5" /> Adicionar Trabalhador
                </Button>
              </div>
            ) : (
              Array.from(groupedTeamsMap.entries()).map(([groupName, groupWorkers]) => {
                const isCollapsed = !!collapsedTeams[groupName];

                return (
                  <div key={groupName} className="border rounded-xl bg-card overflow-hidden">
                    {/* Cabeçalho do Grupo de Equipa */}
                    <div className="p-3 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => toggleTeamCollapse(groupName)}
                        className="flex items-center gap-2 font-bold text-xs text-foreground hover:opacity-80 transition-opacity"
                      >
                        {isCollapsed ? (
                          <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span>{groupName}</span>
                        <Badge variant="secondary" className="text-[10px] ml-1">
                          {groupWorkers.length}
                        </Badge>
                      </button>

                      {/* Ações por Equipa */}
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => handleMarkTeamStatus(groupName, "present")}
                          className="h-6 text-[10px] text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10 px-2"
                        >
                          ✓ Todos Presentes
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => handleMarkTeamStatus(groupName, "absent")}
                          className="h-6 text-[10px] text-rose-700 dark:text-rose-400 hover:bg-rose-500/10 px-2"
                        >
                          ✕ Todos Ausentes
                        </Button>
                        <Button
                          type="button"
                          size="xs"
                          variant="ghost"
                          onClick={() => handleClearTeamStatus(groupName)}
                          className="h-6 text-[10px] text-muted-foreground px-1.5"
                        >
                          Limpar
                        </Button>
                      </div>
                    </div>

                    {/* Lista de Operários da Equipa */}
                    {!isCollapsed && (
                      <div className="divide-y">
                        {groupWorkers.map((item) => {
                          const allowsHours = item.status === "present" || item.status === "late" || item.status === "half_day";

                          return (
                            <div
                              key={item.worker.id}
                              className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-muted/10 transition-colors"
                            >
                              {/* Dados do Trabalhador */}
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <Avatar className="h-8 w-8 border shrink-0">
                                  {item.worker.photo ? (
                                    <img src={item.worker.photo} alt={item.worker.name} className="object-cover" />
                                  ) : (
                                    <AvatarFallback className="text-[10px] font-bold">
                                      {initials(item.worker.name)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div className="min-w-0 flex-1">
                                  <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                                    <span className="truncate">{item.worker.name}</span>
                                    {item.isExtra && (
                                      <Badge variant="secondary" className="text-[9px] bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                                        Extra: {item.extraReason}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="text-[10px] text-muted-foreground truncate">
                                    {item.worker.role}
                                  </div>
                                </div>
                              </div>

                              {/* Seletor de Estado */}
                              <div className="flex flex-wrap items-center gap-1.5">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={item.status === "present" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(item.worker.id, "present")}
                                  className={`h-7 text-[11px] px-2.5 ${
                                    item.status === "present"
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-bold"
                                      : "border-border/80"
                                  }`}
                                >
                                  Presente
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={item.status === "absent" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(item.worker.id, "absent")}
                                  className={`h-7 text-[11px] px-2.5 ${
                                    item.status === "absent"
                                      ? "bg-rose-600 hover:bg-rose-700 text-white border-0 font-bold"
                                      : "border-border/80"
                                  }`}
                                >
                                  Ausente
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={item.status === "late" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(item.worker.id, "late")}
                                  className={`h-7 text-[11px] px-2.5 ${
                                    item.status === "late"
                                      ? "bg-amber-600 hover:bg-amber-700 text-white border-0 font-bold"
                                      : "border-border/80"
                                  }`}
                                >
                                  Atrasado
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={item.status === "half_day" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(item.worker.id, "half_day")}
                                  className={`h-7 text-[11px] px-2 ${
                                    item.status === "half_day"
                                      ? "bg-sky-600 hover:bg-sky-700 text-white border-0 font-bold"
                                      : "border-border/80"
                                  }`}
                                >
                                  Meio dia
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant={item.status === "justified_absence" ? "default" : "outline"}
                                  onClick={() => handleStatusChange(item.worker.id, "justified_absence")}
                                  className={`h-7 text-[11px] px-2 ${
                                    item.status === "justified_absence"
                                      ? "bg-purple-600 hover:bg-purple-700 text-white border-0 font-bold"
                                      : "border-border/80"
                                  }`}
                                >
                                  Licença
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Rodapé Fixo no Mobile e Desktop */}
          <DialogFooter className="p-4 border-t bg-background shrink-0 flex items-center justify-between gap-3 sticky bottom-0 z-10 shadow-lg">
            <div className="text-xs text-muted-foreground hidden sm:block">
              {hasChanges ? (
                <span className="text-amber-600 dark:text-amber-400 font-medium">
                  • Existem alterações pendentes por guardar.
                </span>
              ) : (
                "Pronto para registar."
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenChange(false)}
                className="text-xs h-9"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                size="sm"
                disabled={isSaving || !projectId || !date}
                onClick={handleSave}
                className="text-xs h-9 bg-primary hover:bg-primary-dark text-white font-bold flex-1 sm:flex-initial"
              >
                {isSaving ? "A guardar chamada..." : "Guardar Chamada"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Adicionar Trabalhador Extraordinário */}
      <AttendanceExtraWorkerDialog
        open={extraWorkerDialogOpen}
        onOpenChange={setExtraWorkerDialogOpen}
        existingWorkerIds={workersList.map((item) => item.worker.id)}
        onAddExtraWorker={handleAddExtraWorker}
      />

      {/* Modal de Desativar Dia */}
      <AttendanceDisableDayDialog
        open={disableDayDialogOpen}
        onOpenChange={setDisableDayDialogOpen}
        projectId={projectId}
        date={date}
        onDayDisabledConfirmed={() => {}}
      />
    </>
  );
}
