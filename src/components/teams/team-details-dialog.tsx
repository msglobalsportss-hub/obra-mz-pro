import type { Team, Worker } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { Users, User, Phone, Award, ShieldAlert, Calendar, Clock, Plus } from "lucide-react";

type TeamDetailsDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  team: Team | null;
  onEditClick: (team: Team) => void;
  onAssignClick?: (teamId: string) => void;
};

export function TeamDetailsDialog({
  open,
  onOpenChange,
  team,
  onEditClick,
  onAssignClick,
}: TeamDetailsDialogProps) {
  const workers = useObraMZStore((s) => s.workers || []);
  const projectAssignments = useObraMZStore((s) => s.projectAssignments || []);
  const obras = useObraMZStore((s) => s.obras || []);

  if (!team) return null;

  // Encontrar o líder da equipa
  const leader = team.leaderWorkerId
    ? workers.find((w) => w.id === team.leaderWorkerId)
    : null;

  // Encontrar atribuições da equipa
  const teamAssignments = projectAssignments.filter(
    (a) => a.assignmentType === "team" && a.teamId === team.id
  );
  const activeAssignments = teamAssignments.filter((a) => a.status === "active");
  const historyAssignments = teamAssignments.filter((a) => a.status !== "active");

  const handleEdit = () => {
    onEditClick(team);
    onOpenChange(false);
  };

  const handleAssign = () => {
    if (onAssignClick) {
      onAssignClick(team.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Detalhes da Equipa
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Informações Básicas */}
          <div className="bg-muted/40 p-4 rounded-lg border border-border space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-foreground truncate">{team.name}</h3>
              {team.status === "active" ? (
                <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] h-5">
                  Ativa
                </Badge>
              ) : (
                <Badge variant="secondary" className="text-muted-foreground text-[10px] h-5">
                  Inativa
                </Badge>
              )}
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              {team.description || "Nenhuma descrição definida para esta equipa."}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-muted-foreground border-t border-border/60 pt-2 mt-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                Criada em: {formatDate(team.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                Última atualização: {formatDate(team.updatedAt)}
              </span>
            </div>
          </div>

          {/* Líder da Equipa */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Award className="h-3.5 w-3.5 text-primary" />
              Líder da Equipa
            </Label>
            {leader ? (
              <div className="flex items-center gap-3 p-2 border rounded-lg bg-primary-soft/10">
                <div className="h-8 w-8 rounded-full overflow-hidden bg-primary flex items-center justify-center shrink-0">
                  {leader.photo ? (
                    <img src={leader.photo} alt={leader.name} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-[10px] font-bold text-primary-foreground">{leader.name.slice(0, 2).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-foreground truncate">{leader.name}</div>
                  <div className="text-[10px] text-primary-dark font-medium">{leader.role}</div>
                </div>
                {leader.phone && (
                  <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-mono">
                    <Phone className="h-3 w-3" />
                    {leader.phone}
                  </span>
                )}
              </div>
            ) : (
              <div className="text-xs text-muted-foreground italic bg-muted/20 p-2 border rounded-lg">
                Nenhum líder selecionado para esta equipa.
              </div>
            )}
          </div>

          {/* Lista de Membros */}
          <div className="space-y-1.5">
            <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
              <Users className="h-3.5 w-3.5 text-primary" />
              Membros Integrantes ({team.workerIds?.length || 0})
            </Label>
            
            <div className="border rounded-lg overflow-hidden divide-y bg-background">
              {(!team.workerIds || team.workerIds.length === 0) ? (
                <div className="text-center text-xs text-muted-foreground p-6 italic">
                  Esta equipa não possui membros integrados.
                </div>
              ) : (
                team.workerIds.map((memberId) => {
                  const member = workers.find((w) => w.id === memberId);
                  
                  if (!member) {
                    return (
                      <div key={memberId} className="flex items-center gap-2 p-2.5 text-xs bg-red-50/20 text-destructive">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        <span className="italic font-medium">Trabalhador não encontrado (ID: {memberId})</span>
                      </div>
                    );
                  }

                  const isLeader = team.leaderWorkerId === member.id;

                  return (
                    <div key={member.id} className={`flex items-center justify-between p-2.5 text-xs ${member.status === "inactive" ? "opacity-70 bg-muted/20" : ""}`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="h-7 w-7 rounded-full overflow-hidden bg-muted border flex items-center justify-center shrink-0">
                          {member.photo ? (
                            <img src={member.photo} alt={member.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold">{member.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="font-semibold text-foreground truncate">{member.name}</div>
                          <div className="text-[10px] text-muted-foreground">{member.role}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 shrink-0">
                        {isLeader && (
                          <Badge className="bg-primary text-primary-foreground text-[8px] h-4 px-1.5 font-bold border-0">
                            LÍDER
                          </Badge>
                        )}
                        {member.status === "inactive" ? (
                          <Badge variant="secondary" className="text-[8px] h-4 px-1 text-muted-foreground">
                            Inativo
                          </Badge>
                        ) : (
                          <Badge className="bg-emerald-600 text-white border-0 text-[8px] h-4 px-1">
                            Ativo
                          </Badge>
                        )}
                        {member.phone && (
                          <span className="text-[10px] text-muted-foreground font-mono ml-1 flex items-center gap-0.5">
                            <Phone className="h-2.5 w-2.5" />
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Secção de Atribuições às Obras */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Atribuições às Obras
              </Label>
              {team.status === "active" && onAssignClick && (
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[10px] border-primary text-primary hover:bg-primary-soft/10"
                  onClick={handleAssign}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Atribuir à Obra
                </Button>
              )}
            </div>

            {teamAssignments.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground p-4 bg-muted/20 border rounded-lg italic">
                Nenhuma atribuição registada para esta equipa.
              </div>
            ) : (
              <div className="space-y-3">
                {/* Atribuições Atuais */}
                <div>
                  <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Atribuições Atuais</div>
                  {activeAssignments.length === 0 ? (
                    <div className="text-[11px] text-muted-foreground italic px-2 py-1 bg-muted/10 rounded">
                      Nenhuma atribuição ativa no momento.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {activeAssignments.map((a) => {
                        const obra = obras.find((o) => o.id === a.projectId);
                        const fase = obra?.fases?.find((f) => f.id === a.phaseId);
                        return (
                          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border rounded bg-card text-xs gap-2">
                            <div>
                              <span className="font-semibold text-foreground">{obra?.nome || "Obra desconhecida"}</span>
                              {fase && <span className="text-muted-foreground text-[10px] block">Fase: {fase.nome}</span>}
                              <span className="text-[10px] text-muted-foreground block">
                                Período: {formatDate(a.startDate)} {a.endDate ? `até ${formatDate(a.endDate)}` : "(Sem data de fim)"}
                              </span>
                            </div>
                            <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[9px] w-fit">
                              Ativa
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Histórico de Atribuições */}
                {historyAssignments.length > 0 && (
                  <div>
                    <div className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">Histórico de Atribuições</div>
                    <div className="space-y-1.5">
                      {historyAssignments.map((a) => {
                        const obra = obras.find((o) => o.id === a.projectId);
                        const fase = obra?.fases?.find((f) => f.id === a.phaseId);
                        return (
                          <div key={a.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-2 border rounded bg-muted/20 text-xs gap-2 opacity-80">
                            <div>
                              <span className="font-semibold text-muted-foreground">{obra?.nome || "Obra desconhecida"}</span>
                              {fase && <span className="text-muted-foreground text-[10px] block">Fase: {fase.nome}</span>}
                              <span className="text-[10px] text-muted-foreground block">
                                Período: {formatDate(a.startDate)} {a.endDate ? `até ${formatDate(a.endDate)}` : ""}
                              </span>
                            </div>
                            {a.status === "completed" ? (
                              <Badge className="bg-blue-600 hover:bg-blue-700 text-white border-0 text-[9px] w-fit">
                                Concluída
                              </Badge>
                            ) : (
                              <Badge className="bg-red-600 hover:bg-red-700 text-white border-0 text-[9px] w-fit">
                                Cancelada
                              </Badge>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button className="bg-primary hover:bg-primary-dark" onClick={handleEdit}>
            Editar equipa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children, className, htmlFor }: { children: React.ReactNode; className?: string; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className={`text-xs font-semibold text-foreground ${className || ""}`}>
      {children}
    </label>
  );
}
