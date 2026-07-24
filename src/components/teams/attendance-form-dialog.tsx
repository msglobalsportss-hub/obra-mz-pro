import { useEffect, useState, useMemo } from "react";
import type { AttendanceRecord, Worker, Obra, Team, ProjectAssignment, AttendanceStatus } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useObraMZStore } from "@/store/obramz-store";
import { toast } from "sonner";
import { Search, Calendar, AlertTriangle, AlertCircle, Users, Award, ShieldCheck, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { calculateWorkedMinutes, validateTimeFields, formatMins } from "@/lib/time-utils";

type AttendanceFormDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  attendanceToEdit?: AttendanceRecord | null;
  preselectedDate?: string | null;
  preselectedProjectId?: string | null;
};

export function AttendanceFormDialog({
  open,
  onOpenChange,
  attendanceToEdit = null,
  preselectedDate = null,
  preselectedProjectId = null,
}: AttendanceFormDialogProps) {
  const addAttendanceRecord = useObraMZStore((s) => s.addAttendanceRecord);
  const updateAttendanceRecord = useObraMZStore((s) => s.updateAttendanceRecord);
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);
  const projectAssignments = useObraMZStore((s) => s.projectAssignments || []);
  const attendanceRecords = useObraMZStore((s) => s.attendanceRecords || []);

  // Form states
  const [date, setDate] = useState("");
  const [projectId, setProjectId] = useState("");
  const [phaseId, setPhaseId] = useState("none");
  const [workerId, setWorkerId] = useState("");
  const [status, setStatus] = useState<AttendanceStatus>("present");
  const [notes, setNotes] = useState("");

  // Opcionais de horas
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [breakMins, setBreakMins] = useState<number>(0);
  const [overtimeMins, setOvertimeMins] = useState<number>(0);
  const [showHoursSection, setShowHoursSection] = useState(false);

  const [projectSearch, setProjectSearch] = useState("");
  const [workerSearch, setWorkerSearch] = useState("");

  // Inicializar formulário
  useEffect(() => {
    if (open) {
      if (attendanceToEdit) {
        setDate(attendanceToEdit.date);
        setProjectId(attendanceToEdit.projectId);
        setPhaseId(attendanceToEdit.phaseId || "none");
        setWorkerId(attendanceToEdit.workerId);
        setStatus(attendanceToEdit.status);
        setNotes(attendanceToEdit.notes || "");
        setCheckInTime(attendanceToEdit.checkInTime || "");
        setCheckOutTime(attendanceToEdit.checkOutTime || "");
        setBreakMins(attendanceToEdit.breakMinutes || 0);
        setOvertimeMins(attendanceToEdit.overtimeMinutes || 0);
        setShowHoursSection(!!(attendanceToEdit.checkInTime || attendanceToEdit.overtimeMinutes));
      } else {
        const today = new Date().toISOString().slice(0, 10);
        setDate(preselectedDate || today);
        setProjectId(preselectedProjectId || "");
        setPhaseId("none");
        setWorkerId("");
        setStatus("present");
        setNotes("");
        setCheckInTime("");
        setCheckOutTime("");
        setBreakMins(0);
        setOvertimeMins(0);
        setShowHoursSection(false);
      }
      setProjectSearch("");
      setWorkerSearch("");
    }
  }, [open, attendanceToEdit, preselectedDate, preselectedProjectId]);

  // Sempre que a obra mudar, resetar fase e trabalhador
  const handleProjectChange = (val: string) => {
    setProjectId(val);
    setPhaseId("none");
    setWorkerId("");
  };

  // Sempre que a data mudar, resetar trabalhador para evitar inconsistências
  const handleDateChange = (val: string) => {
    setDate(val);
    setWorkerId("");
  };

  // Tratar alteração do estado
  const handleStatusChange = (val: string) => {
    const newStatus = val as AttendanceStatus;
    // Se o estado não permitir horas e já existirem horas preenchidas, pedir confirmação
    if (newStatus === "absent" || newStatus === "justified_absence") {
      const hasHoursData = checkInTime || checkOutTime || breakMins > 0 || overtimeMins > 0;
      if (hasHoursData) {
        const discard = window.confirm(
          "Alterar o estado para Ausente ou Falta Justificada irá apagar as horas registadas neste formulário. Deseja continuar?"
        );
        if (!discard) return;
      }
      // Limpar campos de horas
      setCheckInTime("");
      setCheckOutTime("");
      setBreakMins(0);
      setOvertimeMins(0);
      setShowHoursSection(false);
    }
    setStatus(newStatus);
  };

  // 1. Filtrar Obras Selecionáveis (Apenas ativas/em andamento, exceto se estiver em edição)
  const selectableObras = useMemo(() => {
    return obras.filter((o) => {
      const isCurrent = attendanceToEdit?.projectId === o.id;
      const isActive = o.estado !== "concluida" && o.estado !== "cancelada";
      return isActive || isCurrent;
    });
  }, [obras, attendanceToEdit]);

  const filteredObras = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    return selectableObras.filter((o) => {
      return q === "" || o.nome.toLowerCase().includes(q) || (o.clienteNome && o.clienteNome.toLowerCase().includes(q));
    });
  }, [selectableObras, projectSearch]);

  const selectedObra = useMemo(() => {
    return obras.find((o) => o.id === projectId);
  }, [obras, projectId]);

  const projectPhases = useMemo(() => {
    return selectedObra?.fases || [];
  }, [selectedObra]);

  // 2. Determinar trabalhadores elegíveis para a obra e data selecionadas
  const eligibleWorkersInfo = useMemo(() => {
    if (!date || !projectId) return [];

    // Filtrar apenas trabalhadores ativos e desconsiderar órfãos diagnósticos
    const activeWorkers = workers.filter(
      (w) => (w.status === "active" && w.id !== "invalid-orphan") || w.id === attendanceToEdit?.workerId
    );

    const list: { worker: Worker; assignment: ProjectAssignment; team?: Team }[] = [];

    activeWorkers.forEach((w) => {
      // Regra A: Procurar atribuição individual primeiro
      let matchingAssign = projectAssignments.find((a) => {
        if (a.status !== "active" && a.id !== attendanceToEdit?.assignmentId) return false;
        if (a.projectId !== projectId) return false;

        // Validar se a data está no período da atribuição
        const sDate = a.startDate;
        const eDate = a.endDate || "9999-12-31";
        if (date < sDate || date > eDate) return false;

        return a.assignmentType === "worker" && a.workerId === w.id;
      });

      // Regra B: Se não encontrou individual, procurar atribuição de equipa
      if (!matchingAssign) {
        matchingAssign = projectAssignments.find((a) => {
          if (a.status !== "active" && a.id !== attendanceToEdit?.assignmentId) return false;
          if (a.projectId !== projectId) return false;

          // Validar datas
          const sDate = a.startDate;
          const eDate = a.endDate || "9999-12-31";
          if (date < sDate || date > eDate) return false;

          // Snapshot da equipa
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

    return list;
  }, [date, projectId, workers, projectAssignments, teams, attendanceToEdit]);

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.toLowerCase().trim();
    return eligibleWorkersInfo.filter((ew) => {
      return q === "" || ew.worker.name.toLowerCase().includes(q) || ew.worker.role.toLowerCase().includes(q);
    });
  }, [eligibleWorkersInfo, workerSearch]);

  // 3. Detetar Duplicações (Aviso na UI)
  const isDuplicate = useMemo(() => {
    if (!workerId || !projectId || !date) return false;
    return attendanceRecords.some(
      (r) =>
        r.id !== attendanceToEdit?.id &&
        r.workerId === workerId &&
        r.projectId === projectId &&
        r.date === date
    );
  }, [attendanceRecords, workerId, projectId, date, attendanceToEdit]);

  // Cálculo de horas em tempo real
  const calculatedWorkedMinutes = useMemo(() => {
    return calculateWorkedMinutes(checkInTime, checkOutTime, breakMins);
  }, [checkInTime, checkOutTime, breakMins]);

  const allowsHours = status === "present" || status === "late" || status === "half_day";

  const handleSave = () => {
    if (!date) {
      toast.error("A data é obrigatória.");
      return;
    }
    if (!projectId) {
      toast.error("A seleção da obra é obrigatória.");
      return;
    }
    if (!workerId) {
      toast.error("A seleção do trabalhador é obrigatória.");
      return;
    }
    if (!status) {
      toast.error("O estado de presença é obrigatório.");
      return;
    }

    // Validar fase pertencente à obra
    const phaseIdValue = phaseId === "none" ? undefined : phaseId;
    if (phaseIdValue && !projectPhases.some((f) => f.id === phaseIdValue)) {
      toast.error("A fase selecionada não pertence à obra escolhida.");
      return;
    }

    // Obter informação da atribuição correspondente
    const assignInfo = eligibleWorkersInfo.find((ew) => ew.worker.id === workerId);
    if (!assignInfo) {
      toast.error("Este trabalhador não possui uma atribuição ativa nesta obra para a data selecionada.");
      return;
    }

    // Validar horas se preenchidas e permitidas
    if (allowsHours) {
      const timeError = validateTimeFields(checkInTime, checkOutTime, breakMins, overtimeMins);
      if (timeError) {
        toast.error(timeError);
        return;
      }
    }

    const payload = {
      projectId,
      phaseId: phaseIdValue,
      workerId,
      teamId: assignInfo.team?.id,
      assignmentId: assignInfo.assignment.id,
      date,
      status,
      notes: notes.trim() || undefined,
      checkInTime: allowsHours && checkInTime && checkOutTime ? checkInTime : undefined,
      checkOutTime: allowsHours && checkInTime && checkOutTime ? checkOutTime : undefined,
      breakMinutes: allowsHours && checkInTime && checkOutTime ? breakMins : undefined,
      workedMinutes: allowsHours && checkInTime && checkOutTime ? calculatedWorkedMinutes : undefined,
      overtimeMinutes: allowsHours && overtimeMins > 0 ? overtimeMins : undefined,
    };

    try {
      if (attendanceToEdit) {
        updateAttendanceRecord(attendanceToEdit.id, payload);
        toast.success("Registo de presença atualizado com sucesso!");
      } else {
        addAttendanceRecord(payload);
        toast.success("Presença registada com sucesso!");
      }
      onOpenChange(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao registar a presença.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {attendanceToEdit ? "Editar Presença" : "Registar Presença na Obra"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 1. Data */}
          <div className="space-y-1.5">
            <Label htmlFor="att-date">Data da Presença *</Label>
            <Input
              id="att-date"
              type="date"
              value={date}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          {/* 2. Obra */}
          <div className="space-y-1.5">
            <Label htmlFor="att-project">Obra *</Label>
            <Select value={projectId} onValueChange={handleProjectChange}>
              <SelectTrigger id="att-project">
                <SelectValue placeholder="Escolher obra..." />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-1.5 pt-1 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por obra..."
                      value={projectSearch}
                      onChange={(e) => setProjectSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </div>
                {filteredObras.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-3">
                    Nenhuma obra ativa encontrada.
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

          {/* 3. Fase da Obra */}
          <div className="space-y-1.5">
            <Label htmlFor="att-phase">Fase da Obra (Opcional)</Label>
            <Select value={phaseId} onValueChange={setPhaseId} disabled={!projectId}>
              <SelectTrigger id="att-phase">
                <SelectValue placeholder={projectId ? "Sem fase específica" : "Escolha uma obra primeiro"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem fase específica</SelectItem>
                {projectPhases.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 4. Trabalhador (Apenas elegíveis para a data/obra selecionada) */}
          <div className="space-y-1.5">
            <Label htmlFor="att-worker">Trabalhador Elegível *</Label>
            <Select
              value={workerId}
              onValueChange={setWorkerId}
              disabled={!projectId || !date}
            >
              <SelectTrigger id="att-worker">
                <SelectValue
                  placeholder={
                    !projectId || !date
                      ? "Selecione data e obra primeiro"
                      : "Escolher trabalhador..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <div className="px-2 pb-1.5 pt-1 border-b">
                  <div className="relative">
                    <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Pesquisar por nome ou cargo..."
                      value={workerSearch}
                      onChange={(e) => setWorkerSearch(e.target.value)}
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                </div>
                {filteredWorkers.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-3">
                    Nenhum trabalhador elegível encontrado neste período.
                  </div>
                ) : (
                  filteredWorkers.map((ew) => (
                    <SelectItem key={ew.worker.id} value={ew.worker.id}>
                      {ew.worker.name} ({ew.worker.role})
                      {ew.team ? ` — Equipa: ${ew.team.name}` : " — Individual"}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Informações da Alocação Ativa */}
          {workerId && date && projectId && (
            (() => {
              const info = eligibleWorkersInfo.find((ew) => ew.worker.id === workerId);
              if (!info) return null;
              return (
                <div className="bg-muted/40 p-2.5 rounded border border-border space-y-1 text-[11px] leading-relaxed">
                  <div className="font-semibold text-foreground uppercase tracking-wider text-[10px]">Elegibilidade de Trabalho</div>
                  <div>Origem da alocação: <span className="font-bold text-foreground">{info.assignment.assignmentType === "team" ? `Equipa (${info.team?.name})` : "Atribuição Individual"}</span></div>
                  <div>Validade: <span className="font-semibold text-foreground">{info.assignment.startDate} {info.assignment.endDate ? `até ${info.assignment.endDate}` : "(Sem data de fim)"}</span></div>
                </div>
              );
            })()
          )}

          {/* 5. Estado de Presença */}
          <div className="space-y-1.5">
            <Label htmlFor="att-status">Estado *</Label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger id="att-status">
                <SelectValue placeholder="Estado..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Presente</SelectItem>
                <SelectItem value="absent">Ausente</SelectItem>
                <SelectItem value="late">Atrasado</SelectItem>
                <SelectItem value="half_day">Meio período</SelectItem>
                <SelectItem value="justified_absence">Falta justificada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Secção Opcional de Horas (Apenas se permite horas no estado) */}
          {allowsHours && (
            <div className="border rounded-lg overflow-hidden bg-muted/20">
              <button
                type="button"
                onClick={() => setShowHoursSection(!showHoursSection)}
                className="w-full flex items-center justify-between p-3 text-xs font-semibold text-foreground hover:bg-muted/40 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  Registar horas de trabalho (Opcional)
                </span>
                {showHoursSection ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {showHoursSection && (
                <div className="p-3 border-t bg-card space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="att-checkin" className="text-[11px]">Hora Entrada</Label>
                      <Input
                        id="att-checkin"
                        type="time"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="att-checkout" className="text-[11px]">Hora Saída</Label>
                      <Input
                        id="att-checkout"
                        type="time"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label htmlFor="att-break" className="text-[11px]">Pausa (minutos)</Label>
                      <Input
                        id="att-break"
                        type="number"
                        min="0"
                        value={breakMins}
                        onChange={(e) => setBreakMins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="h-8 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="att-overtime" className="text-[11px]">Horas Extra (minutos)</Label>
                      <Input
                        id="att-overtime"
                        type="number"
                        min="0"
                        value={overtimeMins}
                        onChange={(e) => setOvertimeMins(Math.max(0, parseInt(e.target.value, 10) || 0))}
                        className="h-8 text-xs"
                      />
                    </div>
                  </div>

                  {/* Resumo de horas calculado */}
                  {checkInTime && checkOutTime && (
                    <div className="bg-muted/40 p-2 rounded text-[11px] space-y-1">
                      <div className="flex justify-between">
                        <span>Horas normais trabalhadas:</span>
                        <span className="font-bold text-foreground">{formatMins(calculatedWorkedMinutes)}</span>
                      </div>
                      {overtimeMins > 0 && (
                        <div className="flex justify-between border-t border-dashed pt-1 mt-1">
                          <span>Horas extra:</span>
                          <span className="font-bold text-amber-600">{formatMins(overtimeMins)}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Avisos de Duplicação */}
          {isDuplicate && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 p-2.5 rounded text-xs leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold">Erro de Duplicação:</span> Já existe um registo de presença para este trabalhador nesta obra e data.
              </div>
            </div>
          )}

          {/* 6. Observações */}
          <div className="space-y-1.5">
            <Label htmlFor="att-notes">Observações</Label>
            <Textarea
              id="att-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indique observações sobre atrasos, justificações de faltas..."
              rows={2}
            />
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            className="bg-primary hover:bg-primary-dark"
            onClick={handleSave}
            disabled={isDuplicate || !workerId || !projectId || !date}
          >
            Gravar Presença
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
