import { useEffect, useState, useMemo } from "react";
import type { ProjectAssignment, Worker, Obra, Team } from "@/lib/mock-data";
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
import { Search, Calendar, AlertTriangle, AlertCircle, Info, Users, Award } from "lucide-react";

type WorkerProjectAssignmentFormDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  assignmentToEdit?: ProjectAssignment | null;
  preselectedWorkerId?: string | null;
  preselectedTeamId?: string | null;
};

export function WorkerProjectAssignmentFormDialog({
  open,
  onOpenChange,
  assignmentToEdit = null,
  preselectedWorkerId = null,
  preselectedTeamId = null,
}: WorkerProjectAssignmentFormDialogProps) {
  const createProjectAssignment = useObraMZStore((s) => s.createProjectAssignment);
  const updateProjectAssignment = useObraMZStore((s) => s.updateProjectAssignment);
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);
  const projectAssignments = useObraMZStore((s) => s.projectAssignments || []);

  // Form states
  const [assignmentType, setAssignmentType] = useState<"worker" | "team">("worker");
  const [workerId, setWorkerId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [projectId, setProjectId] = useState("");
  const [phaseId, setPhaseId] = useState("none");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [notes, setNotes] = useState("");

  const [workerSearch, setWorkerSearch] = useState("");
  const [projectSearch, setProjectSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");

  // Restrição de edição histórica: concluída ou cancelada
  const isHistoric = assignmentToEdit ? assignmentToEdit.status !== "active" : false;

  // Carregar dados ou resetar
  useEffect(() => {
    if (open) {
      if (assignmentToEdit) {
        setAssignmentType(assignmentToEdit.assignmentType);
        setWorkerId(assignmentToEdit.workerId || "");
        setTeamId(assignmentToEdit.teamId || "");
        setProjectId(assignmentToEdit.projectId);
        setPhaseId(assignmentToEdit.phaseId || "none");
        setStartDate(assignmentToEdit.startDate);
        setEndDate(assignmentToEdit.endDate || "");
        setNotes(assignmentToEdit.notes || "");
      } else {
        if (preselectedTeamId) {
          setAssignmentType("team");
          setTeamId(preselectedTeamId);
          setWorkerId("");
        } else if (preselectedWorkerId) {
          setAssignmentType("worker");
          setWorkerId(preselectedWorkerId);
          setTeamId("");
        } else {
          setAssignmentType("worker");
          setWorkerId("");
          setTeamId("");
        }
        setProjectId("");
        setPhaseId("none");
        
        // Sugerir a data atual no formato YYYY-MM-DD
        const today = new Date().toISOString().slice(0, 10);
        setStartDate(today);
        setEndDate("");
        setNotes("");
      }
      setWorkerSearch("");
      setProjectSearch("");
      setTeamSearch("");
    }
  }, [open, assignmentToEdit, preselectedWorkerId, preselectedTeamId]);

  // Sempre que a obra mudar, redefinir a fase
  const handleProjectChange = (val: string) => {
    setProjectId(val);
    setPhaseId("none");
  };

  // Ao alterar a equipa em modo de edição de uma equipa ativa, confirmar substituição do snapshot
  const handleTeamChange = (newTeamId: string) => {
    if (
      assignmentToEdit &&
      assignmentToEdit.assignmentType === "team" &&
      assignmentToEdit.teamId &&
      assignmentToEdit.teamId !== newTeamId
    ) {
      const confirmChange = window.confirm(
        "Aviso: Ao alterar a equipa desta atribuição, a lista (snapshot) de membros associados será substituída pelos membros ativos da nova equipa selecionada. Deseja prosseguir?"
      );
      if (!confirmChange) {
        return; // Cancelar alteração
      }
    }
    setTeamId(newTeamId);
  };

  // 1. Filtrar Trabalhadores Selecionáveis
  const selectableWorkers = useMemo(() => {
    return workers.filter((w) => {
      const isCurrent = assignmentToEdit?.workerId === w.id || preselectedWorkerId === w.id;
      return w.status === "active" || isCurrent;
    });
  }, [workers, assignmentToEdit, preselectedWorkerId]);

  const filteredWorkers = useMemo(() => {
    const q = workerSearch.toLowerCase().trim();
    return selectableWorkers.filter((w) => {
      return (
        q === "" ||
        w.name.toLowerCase().includes(q) ||
        w.role.toLowerCase().includes(q) ||
        (w.employeeCode && w.employeeCode.toLowerCase().includes(q))
      );
    });
  }, [selectableWorkers, workerSearch]);

  // 2. Filtrar Equipas Selecionáveis
  const selectableTeams = useMemo(() => {
    return teams.filter((t) => {
      const isCurrent = assignmentToEdit?.teamId === t.id || preselectedTeamId === t.id;
      return t.status === "active" || isCurrent;
    });
  }, [teams, assignmentToEdit, preselectedTeamId]);

  const filteredTeams = useMemo(() => {
    const q = teamSearch.toLowerCase().trim();
    return selectableTeams.filter((t) => {
      return q === "" || t.name.toLowerCase().includes(q);
    });
  }, [selectableTeams, teamSearch]);

  const selectedTeam = useMemo(() => {
    return teams.find((t) => t.id === teamId);
  }, [teams, teamId]);

  // Calcular membros ativos da equipa selecionada
  const selectedTeamActiveMembersCount = useMemo(() => {
    if (!selectedTeam) return 0;
    return workers.filter((w) => w.status === "active" && selectedTeam.workerIds.includes(w.id)).length;
  }, [selectedTeam, workers]);

  // 3. Filtrar Obras Selecionáveis
  const selectableObras = useMemo(() => {
    return obras.filter((o) => {
      const isCurrent = assignmentToEdit?.projectId === o.id;
      const isActive = o.estado !== "concluida" && o.estado !== "cancelada";
      return isActive || isCurrent;
    });
  }, [obras, assignmentToEdit]);

  const filteredObras = useMemo(() => {
    const q = projectSearch.toLowerCase().trim();
    return selectableObras.filter((o) => {
      return q === "" || o.nome.toLowerCase().includes(q) || (o.clienteNome && o.clienteNome.toLowerCase().includes(q));
    });
  }, [selectableObras, projectSearch]);

  // Fases da obra selecionada
  const selectedObra = useMemo(() => {
    return obras.find((o) => o.id === projectId);
  }, [obras, projectId]);

  const projectPhases = useMemo(() => {
    return selectedObra?.fases || [];
  }, [selectedObra]);

  // 4. Detetar Sobreposições
  // - Para Trabalhador
  const hasWorkerSameProjectOverlap = useMemo(() => {
    if (assignmentType !== "worker" || !workerId || !projectId || !startDate) return false;
    
    const activeSameProject = projectAssignments.filter(
      (a) =>
        a.status === "active" &&
        a.assignmentType === "worker" &&
        a.workerId === workerId &&
        a.projectId === projectId &&
        a.id !== assignmentToEdit?.id
    );

    const s1 = startDate;
    const e1 = endDate || "9999-12-31";

    for (const a of activeSameProject) {
      const s2 = a.startDate;
      const e2 = a.endDate || "9999-12-31";

      if (s1 <= e2 && s2 <= e1) return true;
    }
    return false;
  }, [projectAssignments, assignmentType, workerId, projectId, startDate, endDate, assignmentToEdit]);

  const overlappingWorkerOtherProject = useMemo(() => {
    if (assignmentType !== "worker" || !workerId || !projectId || !startDate) return null;

    const activeOtherProjects = projectAssignments.filter(
      (a) =>
        a.status === "active" &&
        a.assignmentType === "worker" &&
        a.workerId === workerId &&
        a.projectId !== projectId &&
        a.id !== assignmentToEdit?.id
    );

    const s1 = startDate;
    const e1 = endDate || "9999-12-31";

    for (const a of activeOtherProjects) {
      const s2 = a.startDate;
      const e2 = a.endDate || "9999-12-31";

      if (s1 <= e2 && s2 <= e1) {
        const otherObraName = obras.find((o) => o.id === a.projectId)?.nome || "Outra Obra";
        return { assignment: a, obraName: otherObraName };
      }
    }
    return null;
  }, [projectAssignments, assignmentType, workerId, projectId, startDate, endDate, assignmentToEdit, obras]);

  // - Para Equipa
  const hasTeamSameProjectOverlap = useMemo(() => {
    if (assignmentType !== "team" || !teamId || !projectId || !startDate) return false;
    
    const activeSameProject = projectAssignments.filter(
      (a) =>
        a.status === "active" &&
        a.assignmentType === "team" &&
        a.teamId === teamId &&
        a.projectId === projectId &&
        a.id !== assignmentToEdit?.id
    );

    const s1 = startDate;
    const e1 = endDate || "9999-12-31";

    for (const a of activeSameProject) {
      const s2 = a.startDate;
      const e2 = a.endDate || "9999-12-31";

      if (s1 <= e2 && s2 <= e1) return true;
    }
    return false;
  }, [projectAssignments, assignmentType, teamId, projectId, startDate, endDate, assignmentToEdit]);

  const overlappingTeamOtherProject = useMemo(() => {
    if (assignmentType !== "team" || !teamId || !projectId || !startDate) return null;

    const activeOtherProjects = projectAssignments.filter(
      (a) =>
        a.status === "active" &&
        a.assignmentType === "team" &&
        a.teamId === teamId &&
        a.projectId !== projectId &&
        a.id !== assignmentToEdit?.id
    );

    const s1 = startDate;
    const e1 = endDate || "9999-12-31";

    for (const a of activeOtherProjects) {
      const s2 = a.startDate;
      const e2 = a.endDate || "9999-12-31";

      if (s1 <= e2 && s2 <= e1) {
        const otherObraName = obras.find((o) => o.id === a.projectId)?.nome || "Outra Obra";
        return { assignment: a, obraName: otherObraName };
      }
    }
    return null;
  }, [projectAssignments, assignmentType, teamId, projectId, startDate, endDate, assignmentToEdit, obras]);

  const handleSave = () => {
    if (assignmentType === "worker" && !workerId) {
      toast.error("A seleção do trabalhador é obrigatória.");
      return;
    }
    if (assignmentType === "team" && !teamId) {
      toast.error("A seleção da equipa é obrigatória.");
      return;
    }
    if (!projectId) {
      toast.error("A seleção da obra é obrigatória.");
      return;
    }
    if (!startDate) {
      toast.error("A data de início é obrigatória.");
      return;
    }
    if (endDate && endDate < startDate) {
      toast.error("A data de fim não pode ser anterior à data de início.");
      return;
    }

    // Validar trabalhador ativo na criação
    if (assignmentType === "worker" && !assignmentToEdit) {
      const worker = workers.find((w) => w.id === workerId);
      if (!worker || worker.status !== "active") {
        toast.error("Não é possível criar novas atribuições para trabalhadores inativos.");
        return;
      }
    }

    // Validar equipa ativa na criação
    if (assignmentType === "team" && !assignmentToEdit) {
      const team = teams.find((t) => t.id === teamId);
      if (!team || team.status !== "active") {
        toast.error("Não é possível criar novas atribuições para equipas inativas.");
        return;
      }
    }

    const obra = obras.find((o) => o.id === projectId);
    if (!obra) {
      toast.error("A obra selecionada não é válida.");
      return;
    }

    const phaseIdValue = phaseId === "none" ? undefined : phaseId;
    if (phaseIdValue && !obra.fases?.some((f) => f.id === phaseIdValue)) {
      toast.error("A fase selecionada não pertence à obra escolhida.");
      return;
    }

    // Impedir sobreposição na mesma obra
    if (assignmentType === "worker" && hasWorkerSameProjectOverlap) {
      toast.error("Bloqueado: O trabalhador já possui uma atribuição ativa nesta obra durante o período.");
      return;
    }
    if (assignmentType === "team" && hasTeamSameProjectOverlap) {
      toast.error("Bloqueado: A equipa já possui uma atribuição ativa nesta obra durante o período.");
      return;
    }

    const payload: Omit<ProjectAssignment, "id" | "createdAt" | "updatedAt" | "status"> = {
      assignmentType,
      projectId,
      phaseId: phaseIdValue,
      startDate,
      endDate: endDate || undefined,
      notes: notes.trim() || undefined,
      workerId: assignmentType === "worker" ? workerId : undefined,
      teamId: assignmentType === "team" ? teamId : undefined,
    };

    try {
      if (assignmentToEdit) {
        updateProjectAssignment(assignmentToEdit.id, payload);
        toast.success("Atribuição de obra atualizada com sucesso!");
      } else {
        createProjectAssignment(payload);
        toast.success("Atribuição criada com sucesso!");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao guardar a atribuição.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {assignmentToEdit ? "Editar Atribuição" : "Atribuir Trabalhador/Equipa a Obra"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Tipo de Atribuição */}
          <div className="space-y-1.5 pb-2 border-b">
            <Label>Tipo de Atribuição</Label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="assignmentType"
                  value="worker"
                  disabled={assignmentToEdit !== null || preselectedWorkerId !== null || preselectedTeamId !== null || isHistoric}
                  checked={assignmentType === "worker"}
                  onChange={() => setAssignmentType("worker")}
                  className="accent-primary"
                />
                Trabalhador
              </label>
              <label className="flex items-center gap-1.5 text-xs font-semibold text-foreground cursor-pointer">
                <input
                  type="radio"
                  name="assignmentType"
                  value="team"
                  disabled={assignmentToEdit !== null || preselectedWorkerId !== null || preselectedTeamId !== null || isHistoric}
                  checked={assignmentType === "team"}
                  onChange={() => setAssignmentType("team")}
                  className="accent-primary"
                />
                Equipa
              </label>
            </div>
          </div>

          {/* Seleção do Trabalhador */}
          {assignmentType === "worker" && (
            <div className="space-y-1">
              <Label htmlFor="assign-worker">Trabalhador *</Label>
              {preselectedWorkerId ? (
                <div className="p-2 border rounded bg-muted text-xs font-semibold text-foreground">
                  {workers.find((w) => w.id === preselectedWorkerId)?.name || "Trabalhador selecionado"}
                </div>
              ) : (
                <Select value={workerId} onValueChange={setWorkerId} disabled={isHistoric}>
                  <SelectTrigger id="assign-worker">
                    <SelectValue placeholder="Escolher trabalhador..." />
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
                        Nenhum trabalhador ativo encontrado.
                      </div>
                    ) : (
                      filteredWorkers.map((w) => (
                        <SelectItem key={w.id} value={w.id}>
                          {w.name} ({w.role}) {w.status === "inactive" ? "— Inativo" : ""}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {/* Seleção de Equipa */}
          {assignmentType === "team" && (
            <div className="space-y-1">
              <Label htmlFor="assign-team">Equipa *</Label>
              {preselectedTeamId ? (
                <div className="p-2 border rounded bg-muted text-xs font-semibold text-foreground">
                  {teams.find((t) => t.id === preselectedTeamId)?.name || "Equipa selecionada"}
                </div>
              ) : (
                <Select value={teamId} onValueChange={handleTeamChange} disabled={isHistoric}>
                  <SelectTrigger id="assign-team">
                    <SelectValue placeholder="Escolher equipa..." />
                  </SelectTrigger>
                  <SelectContent>
                    <div className="px-2 pb-1.5 pt-1 border-b">
                      <div className="relative">
                        <Search className="absolute left-2 top-2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Pesquisar por equipa..."
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                          className="pl-8 h-8 text-xs"
                        />
                      </div>
                    </div>
                    {filteredTeams.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-3">
                        Nenhuma equipa ativa encontrada.
                      </div>
                    ) : (
                      filteredTeams.map((t) => {
                        const leader = t.leaderWorkerId ? workers.find((w) => w.id === t.leaderWorkerId) : null;
                        return (
                          <SelectItem key={t.id} value={t.id}>
                            {t.name} (Líder: {leader?.name || "Sem líder"}, {t.workerIds.length} membros)
                          </SelectItem>
                        );
                      })
                    )}
                  </SelectContent>
                </Select>
              )}

              {/* Informações da Equipa Selecionada */}
              {selectedTeam && (
                <div className="bg-muted/40 p-2.5 rounded border border-border space-y-1.5 text-[11px] leading-relaxed mt-1">
                  <div className="font-semibold text-foreground uppercase tracking-wider text-[10px] flex items-center gap-1">
                    <Users className="h-3 w-3 text-primary" />
                    Membros da Equipa ({selectedTeam.workerIds.length} operários)
                  </div>
                  <div>
                    Líder: <span className="font-bold text-foreground">
                      {selectedTeam.leaderWorkerId ? (
                        workers.find((w) => w.id === selectedTeam.leaderWorkerId)?.name || "Líder não encontrado"
                      ) : "Sem líder definido"}
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal max-h-[80px] overflow-y-auto">
                    Membros: {selectedTeam.workerIds.map((mid) => workers.find((w) => w.id === mid)?.name).filter(Boolean).join(", ")}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Seleção da Obra */}
          <div className="space-y-1">
            <Label htmlFor="assign-project">Obra *</Label>
            <Select value={projectId} onValueChange={handleProjectChange} disabled={isHistoric}>
              <SelectTrigger id="assign-project">
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
                      {o.nome} {o.clienteNome ? `— ${o.clienteNome}` : ""} ({o.estado === "concluida" ? "Concluída" : o.estado === "cancelada" ? "Cancelada" : "Ativa"})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção da Fase (Opcional) */}
          <div className="space-y-1">
            <Label htmlFor="assign-phase">Fase da Obra (Opcional)</Label>
            <Select value={phaseId} onValueChange={setPhaseId} disabled={!projectId || isHistoric}>
              <SelectTrigger id="assign-phase">
                <SelectValue placeholder={projectId ? "Sem fase específica" : "Selecione uma obra primeiro"} />
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

          {/* Datas de Vigência */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="assign-start">Data de Início *</Label>
              <Input
                id="assign-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="assign-end">Data de Fim (Opcional)</Label>
              <Input
                id="assign-end"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Aviso se a equipa selecionada não tiver membros ativos */}
          {assignmentType === "team" && selectedTeam && selectedTeamActiveMembersCount === 0 && (
            <div className="flex items-start gap-2 bg-yellow-50 border border-yellow-200 text-yellow-800 p-2.5 rounded text-xs leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 mt-0.5" />
              <div>
                <span className="font-bold">Aviso:</span> Esta equipa não possui membros ativos no momento. A atribuição será guardada com uma lista vazia de membros no snapshot.
              </div>
            </div>
          )}

          {/* Avisos de Concorrência Visual (Não bloqueantes) */}
          {assignmentType === "worker" && overlappingWorkerOtherProject && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded text-xs leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Aviso de Atribuição Dupla:</span> Este trabalhador já possui uma atribuição ativa na obra <span className="font-semibold">"{overlappingWorkerOtherProject.obraName}"</span> no mesmo período.
              </div>
            </div>
          )}

          {assignmentType === "team" && overlappingTeamOtherProject && (
            <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-800 p-2.5 rounded text-xs leading-relaxed">
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-bold">Aviso de Atribuição Dupla:</span> Esta equipa já possui uma atribuição ativa na obra <span className="font-semibold">"{overlappingTeamOtherProject.obraName}"</span> no mesmo período.
              </div>
            </div>
          )}

          {/* Bloqueio de Sobreposição na mesma obra */}
          {assignmentType === "worker" && hasWorkerSameProjectOverlap && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 p-2.5 rounded text-xs leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold">Erro de Sobreposição:</span> O trabalhador já possui uma atribuição ativa nesta obra durante o período selecionado.
              </div>
            </div>
          )}

          {assignmentType === "team" && hasTeamSameProjectOverlap && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-800 p-2.5 rounded text-xs leading-relaxed">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
              <div>
                <span className="font-bold">Erro de Sobreposição:</span> Esta equipa já possui uma atribuição ativa nesta obra durante o período selecionado.
              </div>
            </div>
          )}

          {/* Observações */}
          <div className="space-y-1">
            <Label htmlFor="assign-notes">Observações</Label>
            <Textarea
              id="assign-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Indique o objetivo da alocação..."
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
            disabled={(assignmentType === "worker" && hasWorkerSameProjectOverlap) || (assignmentType === "team" && hasTeamSameProjectOverlap)}
          >
            Guardar Atribuição
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
