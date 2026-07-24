import type { ProjectAssignment } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Calendar, User, Eye, Pencil, ShieldCheck, ShieldAlert, Ban, Info, Users, Award } from "lucide-react";

type WorkerProjectAssignmentDetailsDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  assignment: ProjectAssignment | null;
  onEditClick: (a: ProjectAssignment) => void;
  onCompleteClick: (a: ProjectAssignment) => void;
  onCancelClick: (a: ProjectAssignment) => void;
};

export function WorkerProjectAssignmentDetailsDialog({
  open,
  onOpenChange,
  assignment,
  onEditClick,
  onCompleteClick,
  onCancelClick,
}: WorkerProjectAssignmentDetailsDialogProps) {
  const workers = useObraMZStore((s) => s.workers || []);
  const obras = useObraMZStore((s) => s.obras || []);
  const teams = useObraMZStore((s) => s.teams || []);

  if (!assignment) return null;

  const isTeam = assignment.assignmentType === "team";

  // Encontrar dados relacionados
  const worker = !isTeam ? workers.find((w) => w.id === assignment.workerId) : null;
  const team = isTeam ? teams.find((t) => t.id === assignment.teamId) : null;
  
  // Líder da equipa
  const leader = isTeam && team?.leaderWorkerId
    ? workers.find((w) => w.id === team.leaderWorkerId)
    : null;

  const obra = obras.find((o) => o.id === assignment.projectId);
  const fase = obra?.fases?.find((f) => f.id === assignment.phaseId);

  const handleEdit = () => {
    onEditClick(assignment);
    onOpenChange(false);
  };

  const handleComplete = () => {
    onCompleteClick(assignment);
    onOpenChange(false);
  };

  const handleCancel = () => {
    onCancelClick(assignment);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5 text-primary" />
            Detalhes da Atribuição
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Status Badge */}
          <div className="flex justify-between items-center bg-muted/30 p-2.5 rounded border border-border/80 text-xs">
            <span className="font-semibold text-muted-foreground">Estado da Atribuição:</span>
            {assignment.status === "active" && (
              <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                Ativa
              </Badge>
            )}
            {assignment.status === "completed" && (
              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0">
                Concluída
              </Badge>
            )}
            {assignment.status === "cancelled" && (
              <Badge className="bg-red-600 hover:bg-red-700 text-white border-0">
                Cancelada
              </Badge>
            )}
          </div>

          {/* Dados do Trabalhador ou Equipa */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">
              {isTeam ? "Equipa Atribuída" : "Trabalhador Atribuído"}
            </h4>
            
            {!isTeam ? (
              // Trabalhador Individual
              worker ? (
                <div className="flex items-center gap-3 p-2 border rounded bg-card text-xs">
                  <div className="h-9 w-9 rounded-full overflow-hidden bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    {worker.photo ? (
                      <img src={worker.photo} alt={worker.name} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-xs font-bold">{worker.name.slice(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate">{worker.name}</div>
                    <div className="text-[10px] text-primary-dark font-medium">{worker.role}</div>
                  </div>
                  {worker.status === "inactive" && (
                    <Badge variant="secondary" className="text-[8px] text-muted-foreground">
                      Inativo
                    </Badge>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 p-2 border border-red-200 bg-red-50 text-red-800 text-xs rounded">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <span className="font-semibold">Atribuição inválida — beneficiário não identificado</span>
                </div>
              )
            ) : (
              // Equipa Completa
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 border rounded bg-card text-xs">
                  <div className="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center shrink-0">
                    <Users className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-foreground truncate">
                      {team?.name || "Equipa não encontrada"}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      Líder: {leader?.name || "Sem líder definido"}
                    </div>
                  </div>
                </div>

                {/* Membros capturados no snapshot */}
                <div className="space-y-1">
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase block px-1">
                    Membros da Equipa
                  </span>
                  <span className="text-[9px] text-muted-foreground block px-1 italic">
                    Membros registados no momento da atribuição
                  </span>
                  <div className="border rounded bg-muted/10 divide-y max-h-[140px] overflow-y-auto px-2 bg-background">
                    {!assignment.assignedWorkerIds || assignment.assignedWorkerIds.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-4 italic">
                        Sem membros capturados no snapshot.
                      </div>
                    ) : (
                      assignment.assignedWorkerIds.map((mId) => {
                        const m = workers.find((w) => w.id === mId);
                        return (
                          <div key={mId} className="flex items-center justify-between py-1.5 text-[11px]">
                            {m ? (
                              <>
                                <span className="font-medium text-foreground">{m.name}</span>
                                <span className="text-muted-foreground text-[10px]">{m.role}</span>
                              </>
                            ) : (
                              <span className="text-red-700 italic">Trabalhador não encontrado (ID: {mId})</span>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Dados da Obra */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Obra e Fase</h4>
            <div className="p-3 border rounded bg-card space-y-1.5 text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Obra:</span>
                {obra ? (
                  <span className="font-semibold text-foreground">{obra.nome}</span>
                ) : (
                  <span className="text-red-700 font-medium italic">Obra não encontrada</span>
                )}
              </div>

              {obra?.clienteNome && (
                <div>
                  <span className="text-muted-foreground block text-[10px] uppercase">Cliente:</span>
                  <span className="font-medium text-foreground">{obra.clienteNome}</span>
                </div>
              )}

              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Fase da Obra:</span>
                {assignment.phaseId ? (
                  fase ? (
                    <span className="font-medium text-foreground">{fase.nome}</span>
                  ) : (
                    <span className="text-amber-700 italic font-medium">Fase não encontrada</span>
                  )
                ) : (
                  <span className="text-muted-foreground italic">Sem fase específica</span>
                )}
              </div>
            </div>
          </div>

          {/* Período de Vigência */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Período de Atribuição</h4>
            <div className="grid grid-cols-2 gap-2 p-2.5 border rounded bg-card text-xs">
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Início:</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {formatDate(assignment.startDate)}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[10px] uppercase">Conclusão:</span>
                <span className="font-semibold text-foreground flex items-center gap-1 mt-0.5">
                  <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                  {assignment.endDate ? formatDate(assignment.endDate) : <span className="text-muted-foreground italic font-normal">Aberta (Sem fim)</span>}
                </span>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="space-y-1.5">
            <h4 className="text-xs font-bold text-muted-foreground uppercase">Observações</h4>
            <p className="text-xs italic bg-muted/40 p-2.5 border rounded leading-relaxed text-foreground">
              {assignment.notes || "Nenhuma observação registada para esta atribuição."}
            </p>
          </div>

          {/* Registo de criação */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-muted-foreground pt-1">
            <span>Criado em: {formatDate(assignment.createdAt)}</span>
            <span>Última atualização: {formatDate(assignment.updatedAt)}</span>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2 flex-col sm:flex-row">
          <div className="flex flex-1 justify-start gap-1">
            {assignment.status === "active" && (
              <>
                <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50 border-blue-200" onClick={handleComplete}>
                  <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                  Encerrar
                </Button>
                <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 border-red-200" onClick={handleCancel}>
                  <Ban className="h-3.5 w-3.5 mr-1" />
                  Cancelar
                </Button>
              </>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
            <Button className="bg-primary hover:bg-primary-dark" size="sm" onClick={handleEdit}>
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Editar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
