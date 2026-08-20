import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/page-header";
import { PageContainer } from "@/components/shared/page-container";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Plus, Search, Pencil, X, Users, Briefcase, UserCheck, UserX, Ban, ShieldAlert, Award, Eye, ClipboardList, ShieldCheck
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { roles, type Worker, type Team, type ProjectAssignment } from "@/lib/mock-data";
import { formatMZN, formatDate } from "@/lib/format";
import { useMemo, useState } from "react";
import { useObraMZStore } from "@/store/obramz-store";
import { WorkerFormDialog } from "@/components/teams/worker-form-dialog";
import { WorkerDetailsDialog } from "@/components/teams/worker-details-dialog";
import { TeamFormDialog } from "@/components/teams/team-form-dialog";
import { TeamDetailsDialog } from "@/components/teams/team-details-dialog";
import { WorkerProjectAssignmentFormDialog } from "@/components/teams/worker-project-assignment-form-dialog";
import { WorkerProjectAssignmentDetailsDialog } from "@/components/teams/worker-project-assignment-details-dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { StatCard } from "@/components/stat-card";
import { toast } from "sonner";

export const Route = createFileRoute("/app/equipas/")({ component: EquipasPage });

function EquipasPage() {
  const workers = useObraMZStore((s) => s.workers || []);
  const setWorkerStatus = useObraMZStore((s) => s.setWorkerStatus);
  const teams = useObraMZStore((s) => s.teams || []);
  const setTeamStatus = useObraMZStore((s) => s.setTeamStatus);

  const projectAssignments = useObraMZStore((s) => s.projectAssignments || []);
  const createProjectAssignment = useObraMZStore((s) => s.createProjectAssignment);
  const updateProjectAssignment = useObraMZStore((s) => s.updateProjectAssignment);
  const completeProjectAssignment = useObraMZStore((s) => s.completeProjectAssignment);
  const cancelProjectAssignment = useObraMZStore((s) => s.cancelProjectAssignment);
  const obras = useObraMZStore((s) => s.obras || []);

  // --- Estados do Tab Trabalhadores ---
  const [workerFormOpen, setWorkerFormOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<Worker | null>(null);
  const [detailWorker, setDetailWorker] = useState<Worker | null>(null);
  const [workerSearch, setWorkerSearch] = useState("");
  const [workerStatusFilter, setWorkerStatusFilter] = useState<string>("all");
  const [workerRoleFilter, setWorkerRoleFilter] = useState<string>("all");
  const [deactivateWorkerId, setDeactivateWorkerId] = useState<string | null>(null);

  // --- Estados do Tab Equipas ---
  const [teamFormOpen, setTeamFormOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [detailTeam, setDetailTeam] = useState<Team | null>(null);
  const [teamSearch, setTeamSearch] = useState("");
  const [teamStatusFilter, setTeamStatusFilter] = useState<string>("all");
  const [deactivateTeamId, setDeactivateTeamId] = useState<string | null>(null);

  // --- Estados do Tab Atribuições ---
  const [assignFormOpen, setAssignFormOpen] = useState(false);
  const [selectedAssign, setSelectedAssign] = useState<ProjectAssignment | null>(null);
  const [detailAssign, setDetailAssign] = useState<ProjectAssignment | null>(null);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignStatusFilter, setAssignStatusFilter] = useState<string>("all");
  const [assignProjectFilter, setAssignProjectFilter] = useState<string>("all");
  const [assignTypeFilter, setAssignTypeFilter] = useState<string>("all");
  const [preselectedWorkerIdForAssign, setPreselectedWorkerIdForAssign] = useState<string | null>(null);
  const [preselectedTeamIdForAssign, setPreselectedTeamIdForAssign] = useState<string | null>(null);

  // Estados de confirmação/encerramento de atribuição
  const [completeAssignId, setCompleteAssignId] = useState<string | null>(null);
  const [completeEndDate, setCompleteEndDate] = useState("");
  const [cancelAssignId, setCancelAssignId] = useState<string | null>(null);

  // --- Cálculos e Filtros: Trabalhadores ---
  const workersCount = workers.length;
  const activeWorkersCount = workers.filter((w) => w.status === "active").length;
  const inactiveWorkersCount = workers.filter((w) => w.status === "inactive").length;
  
  const potentialDailyCost = useMemo(() => {
    return workers
      .filter((w) => w.status === "active" && w.paymentType === "daily")
      .reduce((acc, curr) => acc + (curr.dailyRate || 0), 0);
  }, [workers]);

  const isWorkerFiltered = workerSearch !== "" || workerStatusFilter !== "all" || workerRoleFilter !== "all";
  const clearWorkerFilters = () => {
    setWorkerSearch("");
    setWorkerStatusFilter("all");
    setWorkerRoleFilter("all");
  };

  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      const matchSearch =
        workerSearch.trim() === "" ||
        w.name.toLowerCase().includes(workerSearch.toLowerCase()) ||
        w.role.toLowerCase().includes(workerSearch.toLowerCase()) ||
        (w.phone && w.phone.toLowerCase().includes(workerSearch.toLowerCase())) ||
        (w.employeeCode && w.employeeCode.toLowerCase().includes(workerSearch.toLowerCase()));

      const matchStatus = workerStatusFilter === "all" || w.status === workerStatusFilter;
      const matchRole = workerRoleFilter === "all" || w.role === workerRoleFilter;

      return matchSearch && matchStatus && matchRole;
    });
  }, [workers, workerSearch, workerStatusFilter, workerRoleFilter]);

  // --- Cálculos e Filtros: Equipas ---
  const teamsCount = teams.length;
  const activeTeamsCount = teams.filter((t) => t.status === "active").length;
  const inactiveTeamsCount = teams.filter((t) => t.status === "inactive").length;
  
  const totalAssignments = useMemo(() => {
    return teams.reduce((acc, curr) => acc + (curr.workerIds?.length || 0), 0);
  }, [teams]);

  const isTeamFiltered = teamSearch !== "" || teamStatusFilter !== "all";
  const clearTeamFilters = () => {
    setTeamSearch("");
    setTeamStatusFilter("all");
  };

  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      const leader = t.leaderWorkerId ? workers.find((w) => w.id === t.leaderWorkerId) : null;
      const leaderName = leader ? leader.name.toLowerCase() : "";

      const matchSearch =
        teamSearch.trim() === "" ||
        t.name.toLowerCase().includes(teamSearch.toLowerCase()) ||
        (t.description && t.description.toLowerCase().includes(teamSearch.toLowerCase())) ||
        leaderName.includes(teamSearch.toLowerCase());

      const matchStatus = teamStatusFilter === "all" || t.status === teamStatusFilter;

      return matchSearch && matchStatus;
    });
  }, [teams, workers, teamSearch, teamStatusFilter]);

  // --- Cálculos e Filtros: Atribuições ---
  const totalActiveAssigns = projectAssignments.filter((a) => a.status === "active").length;
  
  // Trabalhadores atualmente atribuídos (considerando atribuições individuais e de equipa)
  const activeAssignedWorkers = useMemo(() => {
    const ids = new Set<string>();
    projectAssignments.forEach((a) => {
      if (a.status === "active") {
        if (a.assignmentType === "team") {
          const members = a.assignedWorkerIds || [];
          members.forEach((mId) => {
            if (mId && mId !== "invalid-orphan") ids.add(mId);
          });
        } else {
          if (a.workerId && a.workerId !== "invalid-orphan") ids.add(a.workerId);
        }
      }
    });
    return ids.size;
  }, [projectAssignments]);

  // Equipas atribuídas ativas
  const activeAssignedTeams = useMemo(() => {
    const ids = new Set<string>();
    projectAssignments.forEach((a) => {
      if (a.status === "active" && a.assignmentType === "team" && a.teamId) {
        ids.add(a.teamId);
      }
    });
    return ids.size;
  }, [projectAssignments]);

  const totalCompletedAssigns = projectAssignments.filter((a) => a.status === "completed").length;

  const isAssignFiltered = assignSearch !== "" || assignStatusFilter !== "all" || assignProjectFilter !== "all" || assignTypeFilter !== "all";
  const clearAssignFilters = () => {
    setAssignSearch("");
    setAssignStatusFilter("all");
    setAssignProjectFilter("all");
    setAssignTypeFilter("all");
  };

  const filteredAssignments = useMemo(() => {
    return projectAssignments.filter((a) => {
      const type = a.assignmentType;

      if (assignTypeFilter !== "all" && type !== assignTypeFilter) return false;
      if (assignStatusFilter !== "all" && a.status !== assignStatusFilter) return false;
      if (assignProjectFilter !== "all" && a.projectId !== assignProjectFilter) return false;

      const query = assignSearch.toLowerCase().trim();
      if (query === "") return true;

      const obra = obras.find((o) => o.id === a.projectId);
      const fase = obra?.fases?.find((f) => f.id === a.phaseId);
      const obraName = obra ? obra.nome.toLowerCase() : "";
      const faseName = fase ? fase.nome.toLowerCase() : "";

      if (type === "team") {
        const team = teams.find((t) => t.id === a.teamId);
        const teamName = team ? team.name.toLowerCase() : "";
        const leader = team?.leaderWorkerId ? workers.find((w) => w.id === team.leaderWorkerId) : null;
        const leaderName = leader ? leader.name.toLowerCase() : "";
        return (
          teamName.includes(query) ||
          leaderName.includes(query) ||
          obraName.includes(query) ||
          faseName.includes(query)
        );
      } else {
        const worker = workers.find((w) => w.id === a.workerId);
        const workerName = worker ? worker.name.toLowerCase() : "";
        const workerRole = worker ? worker.role.toLowerCase() : "";
        return (
          workerName.includes(query) ||
          workerRole.includes(query) ||
          obraName.includes(query) ||
          faseName.includes(query)
        );
      }
    });
  }, [projectAssignments, workers, obras, teams, assignSearch, assignStatusFilter, assignProjectFilter, assignTypeFilter]);

  // --- Ações: Trabalhadores ---
  const handleAddWorker = () => {
    setSelectedWorker(null);
    setWorkerFormOpen(true);
  };

  const handleEditWorker = (worker: Worker) => {
    setSelectedWorker(worker);
    setWorkerFormOpen(true);
  };

  const handleOpenDetailWorker = (worker: Worker) => {
    setDetailWorker(worker);
  };

  const handleToggleWorkerStatus = (worker: Worker) => {
    if (worker.status === "active") {
      setDeactivateWorkerId(worker.id);
    } else {
      setWorkerStatus(worker.id, "active");
      toast.success(`Trabalhador ${worker.name} reativado com sucesso.`);
    }
  };

  const confirmWorkerDeactivation = () => {
    if (deactivateWorkerId) {
      setWorkerStatus(deactivateWorkerId, "inactive");
      toast.success("Trabalhador suspenso/inativado no sistema.");
      setDeactivateWorkerId(null);
    }
  };

  // --- Ações: Equipas ---
  const handleAddTeam = () => {
    setSelectedTeam(null);
    setTeamFormOpen(true);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeam(team);
    setTeamFormOpen(true);
  };

  const handleOpenDetailTeam = (team: Team) => {
    setDetailTeam(team);
  };

  const handleToggleTeamStatus = (team: Team) => {
    if (team.status === "active") {
      setDeactivateTeamId(team.id);
    } else {
      setTeamStatus(team.id, "active");
      toast.success(`Equipa ${team.name} reativada com sucesso.`);
    }
  };

  const confirmTeamDeactivation = () => {
    if (deactivateTeamId) {
      setTeamStatus(deactivateTeamId, "inactive");
      toast.success("Equipa inativada no sistema.");
      setDeactivateTeamId(null);
    }
  };

  // --- Ações: Atribuições ---
  const handleAddAssign = () => {
    setSelectedAssign(null);
    setPreselectedWorkerIdForAssign(null);
    setPreselectedTeamIdForAssign(null);
    setAssignFormOpen(true);
  };

  const handleEditAssign = (assign: ProjectAssignment) => {
    setSelectedAssign(assign);
    setPreselectedWorkerIdForAssign(null);
    setPreselectedTeamIdForAssign(null);
    setAssignFormOpen(true);
  };

  const handleOpenDetailAssign = (assign: ProjectAssignment) => {
    setDetailAssign(assign);
  };

  // Encerramento
  const handleStartCompleteAssign = (assign: ProjectAssignment) => {
    setCompleteAssignId(assign.id);
    setCompleteEndDate(new Date().toISOString().slice(0, 10));
  };

  const confirmCompleteAssign = () => {
    if (completeAssignId) {
      const assign = projectAssignments.find((a) => a.id === completeAssignId);
      if (!assign) return;

      if (!completeEndDate) {
        toast.error("A data de conclusão é obrigatória.");
        return;
      }
      if (completeEndDate < assign.startDate) {
        toast.error("A data de conclusão não pode ser anterior à data de início.");
        return;
      }

      completeProjectAssignment(completeAssignId, completeEndDate);
      toast.success("Atribuição encerrada com sucesso!");
      setCompleteAssignId(null);
    }
  };

  // Cancelamento
  const handleStartCancelAssign = (assign: ProjectAssignment) => {
    setCancelAssignId(assign.id);
  };

  const confirmCancelAssign = () => {
    if (cancelAssignId) {
      cancelProjectAssignment(cancelAssignId);
      toast.success("Atribuição cancelada com sucesso!");
      setCancelAssignId(null);
    }
  };

  return (
    <PageContainer>
      <PageHeader
        title="Equipas e Trabalhadores"
        description="Gestão da força de trabalho, equipas de especialidade e alocações operacionais em obras."
        breadcrumbs={[{ label: "Equipas & Trabalhadores" }]}
      />

      <Tabs defaultValue="trabalhadores" className="space-y-4">
        <TabsList className="bg-muted/80 p-1 rounded-md border w-fit">
          <TabsTrigger value="trabalhadores" className="px-4 py-2 text-xs">Trabalhadores</TabsTrigger>
          <TabsTrigger value="equipas" className="px-4 py-2 text-xs">Equipas</TabsTrigger>
          <TabsTrigger value="atribuicoes" className="px-4 py-2 text-xs">Atribuições</TabsTrigger>
        </TabsList>

        {/* Tab Trabalhadores */}
        <TabsContent value="trabalhadores" className="space-y-4 outline-none">
          {/* Indicadores Trabalhadores */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total de Trabalhadores"
              value={workersCount}
              icon={Users}
              tone="default"
            />
            <StatCard
              label="Trabalhadores Ativos"
              value={activeWorkersCount}
              icon={UserCheck}
              tone="success"
            />
            <StatCard
              label="Trabalhadores Inativos"
              value={inactiveWorkersCount}
              icon={UserX}
              tone="warning"
            />
            <StatCard
              label="Custo Diário Potencial"
              value={formatMZN(potentialDailyCost)}
              icon={Briefcase}
              tone="primary"
              hint="Taxa total de diaristas ativos"
            />
          </div>

          {/* Filtros Trabalhadores */}
          <Card className="p-4 bg-card/60">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtros</span>
                {isWorkerFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearWorkerFilters}
                    className="text-xs text-destructive hover:bg-destructive/10 h-7"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Limpar filtros
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome, telefone ou código..."
                    value={workerSearch}
                    onChange={(e) => setWorkerSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <Select value={workerStatusFilter} onValueChange={setWorkerStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={workerRoleFilter} onValueChange={setWorkerRoleFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as funções</SelectItem>
                    {roles.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Listagem Trabalhadores */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-muted-foreground">
              A mostrar {filteredWorkers.length} de {workers.length} trabalhadores.
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary-dark" onClick={handleAddWorker}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Novo Trabalhador
            </Button>
          </div>

          {filteredWorkers.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={Users}
                title="Sem trabalhadores"
                description={
                  workers.length === 0
                    ? "Comece por registar os trabalhadores da empresa."
                    : "Nenhum trabalhador corresponde aos filtros ativos."
                }
                action={
                  workers.length === 0 ? (
                    <Button variant="outline" size="sm" onClick={handleAddWorker}>
                      Registar Trabalhador
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={clearWorkerFilters}>
                      Limpar Filtros
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[60px]"></TableHead>
                      <TableHead>Trabalhador</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Contacto</TableHead>
                      <TableHead>Regime</TableHead>
                      <TableHead className="text-right">Taxa</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right w-[160px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWorkers.map((w) => (
                      <TableRow key={w.id} className={w.status === "inactive" ? "opacity-70 bg-muted/20" : ""}>
                        <TableCell className="py-2.5">
                          {w.photo ? (
                            <img src={w.photo} alt={w.name} className="h-8 w-8 rounded-full object-cover border" />
                          ) : (
                            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                              {w.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-foreground">{w.name}</div>
                          {w.employeeCode && <span className="text-[10px] text-muted-foreground font-mono">{w.employeeCode}</span>}
                        </TableCell>
                        <TableCell>{w.role}</TableCell>
                        <TableCell className="text-muted-foreground">{w.phone || "—"}</TableCell>
                        <TableCell>
                          {w.paymentType === "daily" && "Diário"}
                          {w.paymentType === "hourly" && "Horário"}
                          {w.paymentType === "monthly" && "Mensal"}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          {w.paymentType === "daily" && formatMZN(w.dailyRate || 0)}
                          {w.paymentType === "hourly" && `${formatMZN(w.hourlyRate || 0)} /h`}
                          {w.paymentType === "monthly" && formatMZN(w.monthlyRate || 0)}
                        </TableCell>
                        <TableCell>
                          {w.status === "active" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] h-4">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground text-[10px] h-4">
                              Inativo
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right py-2">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenDetailWorker(w)} title="Ver Detalhes">
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEditWorker(w)} title="Editar">
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={`h-8 w-8 ${w.status === "active" ? "text-destructive hover:bg-destructive/10" : "text-emerald-600 hover:bg-emerald-50"}`}
                              onClick={() => handleToggleWorkerStatus(w)}
                              title={w.status === "active" ? "Desativar" : "Ativar"}
                            >
                              {w.status === "active" ? <Ban className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards */}
              <div className="grid gap-3 md:hidden">
                {filteredWorkers.map((w) => (
                  <Card key={w.id} className={`p-4 ${w.status === "inactive" ? "opacity-75 bg-muted/30" : ""}`}>
                    <div className="flex gap-3">
                      {w.photo ? (
                        <img src={w.photo} alt={w.name} className="h-10 w-10 rounded-full object-cover border shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                          {w.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="font-semibold text-xs truncate">{w.name}</div>
                          {w.status === "active" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[8px] h-3.5 px-1.5">
                              Ativo
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground text-[8px] h-3.5 px-1.5">
                              Inativo
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-primary font-medium">{w.role}</div>
                        <div className="text-[10px] text-muted-foreground mt-1">Contacto: {w.phone || "—"}</div>
                        <div className="flex justify-between items-center text-[10px] text-foreground font-semibold mt-1">
                          <span>
                            {w.paymentType === "daily" && "Diário"}
                            {w.paymentType === "hourly" && "Horário"}
                            {w.paymentType === "monthly" && "Mensal"}
                          </span>
                          <span>
                            {w.paymentType === "daily" && formatMZN(w.dailyRate || 0)}
                            {w.paymentType === "hourly" && `${formatMZN(w.hourlyRate || 0)}/h`}
                            {w.paymentType === "monthly" && formatMZN(w.monthlyRate || 0)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-1.5 border-t pt-2 mt-3">
                      <Button variant="outline" size="sm" className="h-7 text-[10px] font-normal" onClick={() => handleOpenDetailWorker(w)}>
                        <Eye className="h-3 w-3 mr-1" />Detalhes
                      </Button>
                      <Button variant="outline" size="sm" className="h-7 text-[10px] font-normal" onClick={() => handleEditWorker(w)}>
                        <Pencil className="h-3 w-3 mr-1" />Editar
                      </Button>
                      <Button
                        variant={w.status === "active" ? "destructive" : "outline"}
                        size="sm"
                        className={`h-7 text-[10px] font-normal ${w.status === "inactive" ? "text-emerald-600 hover:bg-emerald-50 border-emerald-200" : ""}`}
                        onClick={() => handleToggleWorkerStatus(w)}
                      >
                        {w.status === "active" ? "Desativar" : "Ativar"}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab Equipas */}
        <TabsContent value="equipas" className="space-y-4 outline-none">
          {/* Indicadores Equipas */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total de Equipas"
              value={teamsCount}
              icon={Users}
              tone="default"
            />
            <StatCard
              label="Equipas Ativas"
              value={activeTeamsCount}
              icon={UserCheck}
              tone="success"
            />
            <StatCard
              label="Equipas Inativas"
              value={inactiveTeamsCount}
              icon={UserX}
              tone="warning"
            />
            <StatCard
              label="Total de Alocações"
              value={totalAssignments}
              icon={ClipboardList}
              tone="primary"
              hint="Membros registados nas equipas"
            />
          </div>

          {/* Filtros Equipas */}
          <Card className="p-4 bg-card/60">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtros</span>
                {isTeamFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTeamFilters}
                    className="text-xs text-destructive hover:bg-destructive/10 h-7"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Limpar filtros
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="relative sm:col-span-2">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar por nome de equipa, descrição ou líder..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="pl-9 h-9"
                  />
                </div>

                <Select value={teamStatusFilter} onValueChange={setTeamStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="inactive">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Listagem Equipas */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-muted-foreground">
              A mostrar {filteredTeams.length} de {teams.length} equipas.
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary-dark" onClick={handleAddTeam}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Criar Equipa
            </Button>
          </div>

          {filteredTeams.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={Users}
                title="Sem equipas"
                description={
                  teams.length === 0
                    ? "Crie as equipas de trabalho da empresa para agrupar operários."
                    : "Nenhuma equipa corresponde aos critérios de pesquisa."
                }
                action={
                  teams.length === 0 ? (
                    <Button variant="outline" size="sm" onClick={handleAddTeam}>
                      Criar Primeira Equipa
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={clearTeamFilters}>
                      Limpar Filtros
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <>
              {/* Desktop Table Equipas */}
              <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Equipa</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Líder</TableHead>
                      <TableHead className="text-center">Membros</TableHead>
                      <TableHead>Resumo Visual</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right w-[160px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeams.map((t) => {
                      const leader = t.leaderWorkerId ? workers.find((w) => w.id === t.leaderWorkerId) : null;
                      
                      const memberNames = (t.workerIds || [])
                        .map((mid) => workers.find((w) => w.id === mid)?.name)
                        .filter(Boolean);

                      return (
                        <TableRow key={t.id} className={t.status === "inactive" ? "opacity-70 bg-muted/20" : ""}>
                          <TableCell className="font-semibold text-foreground">{t.name}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate" title={t.description}>
                            {t.description || "—"}
                          </TableCell>
                          <TableCell>
                            {leader ? (
                              <span className="inline-flex items-center gap-1.5 font-medium text-xs text-foreground">
                                <Award className="h-3.5 w-3.5 text-primary shrink-0" />
                                {leader.name}
                              </span>
                            ) : (
                              <span className="text-muted-foreground italic text-xs">Sem líder definido</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-bold">{t.workerIds?.length || 0}</TableCell>
                          <TableCell>
                            {memberNames.length === 0 ? (
                              <span className="text-muted-foreground italic text-[10px]">Vazia</span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground font-medium truncate max-w-[150px] block" title={memberNames.join(", ")}>
                                {memberNames.slice(0, 2).join(", ")}
                                {memberNames.length > 2 ? ` (+${memberNames.length - 2})` : ""}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {t.status === "active" ? (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] h-4">
                                Ativa
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground text-[10px] h-4">
                                Inativa
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenDetailTeam(t)} title="Ver Detalhes">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEditTeam(t)} title="Editar">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={`h-8 w-8 ${t.status === "active" ? "text-destructive hover:bg-destructive/10" : "text-emerald-600 hover:bg-emerald-50"}`}
                                onClick={() => handleToggleTeamStatus(t)}
                                title={t.status === "active" ? "Desativar" : "Ativar"}
                              >
                                {t.status === "active" ? <Ban className="h-3.5 w-3.5" /> : <UserCheck className="h-3.5 w-3.5" />}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards Equipas */}
              <div className="grid gap-3 md:hidden">
                {filteredTeams.map((t) => {
                  const leader = t.leaderWorkerId ? workers.find((w) => w.id === t.leaderWorkerId) : null;
                  return (
                    <Card key={t.id} className={`p-4 ${t.status === "inactive" ? "opacity-75 bg-muted/30" : ""}`}>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="font-semibold text-xs truncate">{t.name}</div>
                          {t.status === "active" ? (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[8px] h-3.5 px-1.5">
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground text-[8px] h-3.5 px-1.5">
                              Inativa
                            </Badge>
                          )}
                        </div>
                        {t.description && <div className="text-[10px] text-muted-foreground line-clamp-1">{t.description}</div>}
                        
                        <div className="text-[10px] text-muted-foreground space-y-0.5 mt-2 pt-2 border-t border-border/60">
                          <div>
                            Líder:{" "}
                            <span className="font-semibold text-foreground">
                              {leader ? leader.name : "Nenhum líder"}
                            </span>
                          </div>
                          <div>Membros integrados: <span className="font-bold text-foreground">{t.workerIds?.length || 0}</span></div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 border-t pt-2 mt-3">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-normal" onClick={() => handleOpenDetailTeam(t)}>
                          <Eye className="h-3 w-3 mr-1" />Detalhes
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-normal" onClick={() => handleEditTeam(t)}>
                          <Pencil className="h-3 w-3 mr-1" />Editar
                        </Button>
                        <Button
                          variant={t.status === "active" ? "destructive" : "outline"}
                          size="sm"
                          className={`h-7 text-[10px] font-normal ${t.status === "inactive" ? "text-emerald-600 hover:bg-emerald-50 border-emerald-200" : ""}`}
                          onClick={() => handleToggleTeamStatus(t)}
                        >
                          {t.status === "active" ? "Desativar" : "Ativar"}
                        </Button>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        {/* Tab Atribuições */}
        <TabsContent value="atribuicoes" className="space-y-4 outline-none">
          {/* Indicadores Atribuições */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Atribuições Ativas"
              value={totalActiveAssigns}
              icon={ClipboardList}
              tone="primary"
            />
            <StatCard
              label="Operários Alocados"
              value={activeAssignedWorkers}
              icon={UserCheck}
              tone="success"
              hint="Trabalhadores totais nas alocações"
            />
            <StatCard
              label="Equipas Alocadas"
              value={activeAssignedTeams}
              icon={Users}
              tone="default"
              hint="Equipas ativas nas obras"
            />
            <StatCard
              label="Atribuições Concluídas"
              value={totalCompletedAssigns}
              icon={ShieldCheck}
              tone="default"
              hint="Histórico de alocações finalizadas"
            />
          </div>

          {/* Filtros Atribuições */}
          <Card className="p-4 bg-card/60">
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Filtros de Alocação</span>
                {isAssignFiltered && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAssignFilters}
                    className="text-xs text-destructive hover:bg-destructive/10 h-7"
                  >
                    <X className="mr-1 h-3.5 w-3.5" />
                    Limpar filtros
                  </Button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <div className="relative sm:col-span-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar..."
                    value={assignSearch}
                    onChange={(e) => setAssignSearch(e.target.value)}
                    className="pl-9 h-9 animate-none"
                  />
                </div>

                <Select value={assignTypeFilter} onValueChange={setAssignTypeFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Tipo de Atribuição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os tipos</SelectItem>
                    <SelectItem value="worker">Trabalhador</SelectItem>
                    <SelectItem value="team">Equipa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={assignStatusFilter} onValueChange={setAssignStatusFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Estado da atribuição" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os estados</SelectItem>
                    <SelectItem value="active">Ativas</SelectItem>
                    <SelectItem value="completed">Concluídas</SelectItem>
                    <SelectItem value="cancelled">Canceladas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={assignProjectFilter} onValueChange={setAssignProjectFilter}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Filtrar por obra..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as obras</SelectItem>
                    {obras.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Listagem Atribuições */}
          <div className="flex justify-between items-center mb-2">
            <div className="text-xs text-muted-foreground">
              A mostrar {filteredAssignments.length} de {projectAssignments.length} atribuições.
            </div>
            <Button size="sm" className="bg-primary hover:bg-primary-dark" onClick={handleAddAssign}>
              <Plus className="mr-1 h-3.5 w-3.5" />
              Nova Atribuição
            </Button>
          </div>

          {filteredAssignments.length === 0 ? (
            <Card className="p-12">
              <EmptyState
                icon={ClipboardList}
                title="Sem atribuições"
                description={
                  projectAssignments.length === 0
                    ? "Atribua operários ou equipas a obras para gerir as suas atividades."
                    : "Nenhuma atribuição encontrada para os critérios de busca."
                }
                action={
                  projectAssignments.length === 0 ? (
                    <Button variant="outline" size="sm" onClick={handleAddAssign}>
                      Criar Atribuição
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={clearAssignFilters}>
                      Limpar Filtros
                    </Button>
                  )
                }
              />
            </Card>
          ) : (
            <>
              {/* Desktop Table Atribuições */}
              <div className="hidden md:block rounded-lg border bg-card overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[100px]">Tipo</TableHead>
                      <TableHead>Beneficiário</TableHead>
                      <TableHead>Obra</TableHead>
                      <TableHead>Fase da Obra</TableHead>
                      <TableHead>Data de Início</TableHead>
                      <TableHead>Data de Fim</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right w-[160px]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAssignments.map((a) => {
                      const type = a.assignmentType;
                      const isTeamType = type === "team";
                      
                      const worker = !isTeamType ? workers.find((w) => w.id === a.workerId) : null;
                      const team = isTeamType ? teams.find((t) => t.id === a.teamId) : null;
                      const leader = isTeamType && team?.leaderWorkerId ? workers.find((w) => w.id === team.leaderWorkerId) : null;

                      const obra = obras.find((o) => o.id === a.projectId);
                      const fase = obra?.fases?.find((f) => f.id === a.phaseId);

                      return (
                        <TableRow key={a.id} className={a.status !== "active" ? "opacity-75 bg-muted/20" : ""}>
                          <TableCell>
                            {isTeamType ? (
                              <Badge className="bg-primary-soft text-primary-dark border-0 text-[9px] font-semibold">
                                Equipa
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-[9px] font-semibold border-border/80">
                                Trabalhador
                              </Badge>
                            )}
                          </TableCell>
                          
                          <TableCell>
                            {isTeamType ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-foreground flex items-center gap-1.5">
                                  <Users className="h-3.5 w-3.5 text-primary shrink-0" />
                                  {team?.name || <span className="text-red-600 italic">Equipa não encontrada</span>}
                                </span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                  Líder: {leader?.name || "Sem líder"} • {a.assignedWorkerIds?.length || team?.workerIds?.length || 0} membros
                                </span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2">
                                {worker?.photo ? (
                                  <img src={worker.photo} alt={worker.name} className="h-6 w-6 rounded-full object-cover border" />
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-[9px] font-bold">
                                    {worker?.name.slice(0, 2).toUpperCase() || "??"}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-semibold text-foreground">
                                    {a.workerId === "invalid-orphan" || !worker ? (
                                      <span className="text-red-600 italic font-semibold">Atribuição inválida — beneficiário não identificado</span>
                                    ) : (
                                      worker.name
                                    )}
                                  </span>
                                  <span className="text-[9px] text-muted-foreground">{worker?.role || "—"}</span>
                                </div>
                              </div>
                            )}
                          </TableCell>
                          
                          <TableCell className="font-medium">{obra?.nome || <span className="text-red-600 italic">Obra não encontrada</span>}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{fase?.nome || <span className="italic text-muted-foreground">Sem fase específica</span>}</TableCell>
                          <TableCell className="text-xs">{formatDate(a.startDate)}</TableCell>
                          <TableCell className="text-xs">{a.endDate ? formatDate(a.endDate) : <span className="text-muted-foreground italic">Aberta</span>}</TableCell>
                          <TableCell>
                            {a.status === "active" && (
                              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] h-4">
                                Ativa
                              </Badge>
                            )}
                            {a.status === "completed" && (
                              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-[10px] h-4">
                                Concluída
                              </Badge>
                            )}
                            {a.status === "cancelled" && (
                              <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 text-[10px] h-4">
                                Cancelada
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => handleOpenDetailAssign(a)} title="Ver Detalhes">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => handleEditAssign(a)} title="Editar">
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {a.status === "active" && (
                                <>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-emerald-600 hover:bg-emerald-50" onClick={() => handleStartCompleteAssign(a)} title="Encerrar Atribuição">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:bg-destructive/10" onClick={() => handleStartCancelAssign(a)} title="Cancelar Atribuição">
                                    <Ban className="h-3.5 w-3.5" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Cards Atribuições */}
              <div className="grid gap-3 md:hidden">
                {filteredAssignments.map((a) => {
                  const type = a.assignmentType;
                  const isTeamType = type === "team";
                  
                  const worker = !isTeamType ? workers.find((w) => w.id === a.workerId) : null;
                  const team = isTeamType ? teams.find((t) => t.id === a.teamId) : null;

                  const obra = obras.find((o) => o.id === a.projectId);
                  const fase = obra?.fases?.find((f) => f.id === a.phaseId);

                  return (
                    <Card key={a.id} className={`p-4 ${a.status !== "active" ? "opacity-85 bg-muted/20" : ""}`}>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="font-semibold text-xs truncate flex items-center gap-1">
                            {isTeamType ? <Users className="h-3.5 w-3.5 text-primary shrink-0" /> : null}
                            {isTeamType ? (
                              team?.name || "Equipa não encontrada"
                            ) : worker ? (
                              worker.name
                            ) : (
                              <span className="text-red-600 italic font-semibold">Atribuição inválida — beneficiário não identificado</span>
                            )}
                          </div>
                          {a.status === "active" && (
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[8px] h-3.5 px-1.5">
                              Ativa
                            </Badge>
                          )}
                          {a.status === "completed" && (
                            <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-[8px] h-3.5 px-1.5">
                              Concluída
                            </Badge>
                          )}
                          {a.status === "cancelled" && (
                            <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 text-[8px] h-3.5 px-1.5">
                              Cancelada
                            </Badge>
                          )}
                        </div>
                        <div className="text-[10px] text-primary-dark font-medium">
                          {isTeamType ? `Equipa • ${a.assignedWorkerIds?.length || team?.workerIds?.length || 0} membros` : `Trabalhador • ${worker?.role || "Não identificado"}`}
                        </div>
                        
                        <div className="text-[10px] text-muted-foreground space-y-0.5 mt-2 pt-2 border-t border-border/60">
                          <div>Obra: <span className="font-semibold text-foreground">{obra?.nome || "Desconhecida"}</span></div>
                          <div>Fase: <span className="text-foreground">{fase?.nome || "Sem fase específica"}</span></div>
                          <div>
                            Período:{" "}
                            <span className="font-medium text-foreground">
                              {formatDate(a.startDate)} {a.endDate ? `até ${formatDate(a.endDate)}` : "(Aberta)"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end gap-1.5 border-t pt-2 mt-3">
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-normal" onClick={() => handleOpenDetailAssign(a)}>
                          <Eye className="h-3 w-3 mr-1" />Detalhes
                        </Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px] font-normal" onClick={() => handleEditAssign(a)}>
                          <Pencil className="h-3 w-3 mr-1" />Editar
                        </Button>
                        {a.status === "active" && (
                          <>
                            <Button variant="outline" size="sm" className="h-7 text-[10px] font-normal text-emerald-600 hover:bg-emerald-50" onClick={() => handleStartCompleteAssign(a)}>
                              Encerrar
                            </Button>
                            <Button variant="destructive" size="sm" className="h-7 text-[10px] font-normal" onClick={() => handleStartCancelAssign(a)}>
                              Cancelar
                            </Button>
                          </>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* --- Diálogos de Trabalhadores --- */}
      <WorkerFormDialog
        open={workerFormOpen}
        onOpenChange={setWorkerFormOpen}
        workerToEdit={selectedWorker}
      />
      <WorkerDetailsDialog
        open={detailWorker !== null}
        onOpenChange={(o) => !o && setDetailWorker(null)}
        worker={detailWorker}
        onEditClick={handleEditWorker}
        onAssignClick={(wId) => {
          setPreselectedWorkerIdForAssign(wId);
          setPreselectedTeamIdForAssign(null);
          setSelectedAssign(null);
          setAssignFormOpen(true);
        }}
      />
      <ConfirmDialog
        open={deactivateWorkerId !== null}
        onOpenChange={(o) => !o && setDeactivateWorkerId(null)}
        title="Desativar Trabalhador?"
        description="O trabalhador ficará inativo e indisponível para novos registos, mas todo o seu histórico salarial e profissional será totalmente mantido."
        confirmLabel="Desativar"
        tone="destructive"
        onConfirm={confirmWorkerDeactivation}
      />

      {/* --- Diálogos de Equipas --- */}
      <TeamFormDialog
        open={teamFormOpen}
        onOpenChange={setTeamFormOpen}
        teamToEdit={selectedTeam}
      />
      <TeamDetailsDialog
        open={detailTeam !== null}
        onOpenChange={(o) => !o && setDetailTeam(null)}
        team={detailTeam}
        onEditClick={handleEditTeam}
        onAssignClick={(tId) => {
          setPreselectedTeamIdForAssign(tId);
          setPreselectedWorkerIdForAssign(null);
          setSelectedAssign(null);
          setAssignFormOpen(true);
        }}
      />
      <ConfirmDialog
        open={deactivateTeamId !== null}
        onOpenChange={(o) => !o && setDeactivateTeamId(null)}
        title="Desativar Equipa?"
        description="A equipa ficará inativa e os seus membros continuarão associados a ela, mas ela não poderá ser alocada a novos trabalhos até ser reativada."
        confirmLabel="Desativar"
        tone="destructive"
        onConfirm={confirmTeamDeactivation}
      />

      {/* --- Diálogos de Atribuições --- */}
      <WorkerProjectAssignmentFormDialog
        open={assignFormOpen}
        onOpenChange={(o) => {
          setAssignFormOpen(o);
          if (!o) {
            setPreselectedWorkerIdForAssign(null);
            setPreselectedTeamIdForAssign(null);
          }
        }}
        assignmentToEdit={selectedAssign}
        preselectedWorkerId={preselectedWorkerIdForAssign}
        preselectedTeamId={preselectedTeamIdForAssign}
      />

      <WorkerProjectAssignmentDetailsDialog
        open={detailAssign !== null}
        onOpenChange={(o) => !o && setDetailAssign(null)}
        assignment={detailAssign}
        onEditClick={handleEditAssign}
        onCompleteClick={handleStartCompleteAssign}
        onCancelClick={handleStartCancelAssign}
      />

      {/* Confirmação de Encerramento (Com Seletor de Data de Fim) */}
      <Dialog open={completeAssignId !== null} onOpenChange={(o) => !o && setCompleteAssignId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-blue-600">
              <ShieldCheck className="h-5 w-5" />
              Encerrar Atribuição
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2 text-xs">
            <p className="text-muted-foreground leading-relaxed">
              Indique a data oficial de conclusão da atribuição do trabalhador ou equipa a esta obra. O registo será marcado como concluído e mantido no histórico.
            </p>
            <div className="space-y-1">
              <Label htmlFor="complete-date">Data de Conclusão *</Label>
              <Input
                id="complete-date"
                type="date"
                value={completeEndDate}
                onChange={(e) => setCompleteEndDate(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setCompleteAssignId(null)}>
              Cancelar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" size="sm" onClick={confirmCompleteAssign}>
              Confirmar Conclusão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmação de Cancelamento */}
      <ConfirmDialog
        open={cancelAssignId !== null}
        onOpenChange={(o) => !o && setCancelAssignId(null)}
        title={
          <div className="flex items-center gap-2 text-destructive">
            <Ban className="h-5 w-5 text-destructive" />
            <span>Cancelar Atribuição?</span>
          </div>
        }
        description="Esta ação cancela a atribuição selecionada. O registo será mantido no histórico como cancelado. Esta operação não pode ser desfeita."
        confirmLabel="Cancelar Atribuição"
        tone="destructive"
        onConfirm={confirmCancelAssign}
      />
    </PageContainer>
  );
}
