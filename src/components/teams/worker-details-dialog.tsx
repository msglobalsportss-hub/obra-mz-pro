import type { Worker } from "@/lib/mock-data";
import { useObraMZStore } from "@/store/obramz-store";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatMZN } from "@/lib/format";
import { Phone, Mail, User, ShieldAlert, Award, Calendar, Layers, MapPin, Plus } from "lucide-react";

type WorkerDetailsDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  worker: Worker | null;
  onEditClick: (worker: Worker) => void;
  onAssignClick?: (workerId: string) => void;
};

export function WorkerDetailsDialog({
  open,
  onOpenChange,
  worker,
  onEditClick,
  onAssignClick,
}: WorkerDetailsDialogProps) {
  const teams = useObraMZStore((s) => s.teams || []);
  const projectAssignments = useObraMZStore((s) => s.projectAssignments || []);
  const obras = useObraMZStore((s) => s.obras || []);

  if (!worker) return null;

  // Encontrar as equipas do trabalhador
  const workerTeams = teams.filter((t) => t.workerIds.includes(worker.id));

  // Encontrar atribuições de obras do trabalhador
  const workerAssignments = projectAssignments.filter((a) => a.workerId === worker.id);
  const activeAssignments = workerAssignments.filter((a) => a.status === "active");
  const historyAssignments = workerAssignments.filter((a) => a.status !== "active");

  const renderFallback = (val?: string) => {
    return val ? <span className="text-foreground font-medium">{val}</span> : <span className="text-muted-foreground italic">Não informado</span>;
  };

  const getGenderLabel = (g?: string) => {
    if (g === "male") return "Masculino";
    if (g === "female") return "Feminino";
    if (g === "other") return "Outro";
    if (g === "prefer_not_to_say") return "Prefere não dizer";
    return undefined;
  };

  const getDocTypeLabel = (t?: string) => {
    if (t === "bi") return "B.I. (Bilhete de Identidade)";
    if (t === "passport") return "Passaporte";
    if (t === "dire") return "D.I.R.E.";
    if (t === "other") return "Outro";
    return undefined;
  };

  const handleEdit = () => {
    onEditClick(worker);
    onOpenChange(false);
  };

  const handleAssign = () => {
    if (onAssignClick) {
      onAssignClick(worker.id);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Ficha Detalhada do Trabalhador
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Cabeçalho Principal (Foto, Nome, Contactos Básicos) */}
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-muted/40 p-4 rounded-lg border">
            {worker.photo ? (
              <img
                src={worker.photo}
                alt={worker.name}
                className="h-20 w-20 rounded-full object-cover border-2 border-primary"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold">
                {worker.name.slice(0, 2).toUpperCase()}
              </div>
            )}

            <div className="text-center sm:text-left min-w-0 flex-1 space-y-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-foreground truncate">{worker.name}</h3>
                {worker.status === "active" ? (
                  <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white border-0 text-[10px] h-5 px-2">
                    Ativo
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-muted-foreground text-[10px] h-5 px-2">
                    Inativo
                  </Badge>
                )}
              </div>

              <div className="text-sm text-primary font-semibold">{worker.role}</div>
              
              {worker.employeeCode && (
                <div className="text-xs text-muted-foreground font-mono">
                  Cód: <span className="font-semibold">{worker.employeeCode}</span>
                </div>
              )}

              <div className="flex flex-wrap justify-center sm:justify-start gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {worker.phone || "Sem telefone"}
                </span>
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {worker.email || "Sem e-mail"}
                </span>
              </div>
            </div>
          </div>

          {/* Grid de Informações */}
          <div className="grid gap-6 md:grid-cols-2">
            
            {/* Bloco 1: Dados Pessoais */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                <User className="h-3.5 w-3.5" />
                Dados Pessoais
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Data de Nascimento:</span>
                  {renderFallback(worker.dateOfBirth ? formatDate(worker.dateOfBirth) : undefined)}
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Nacionalidade:</span>
                  {renderFallback(worker.nationality)}
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Género:</span>
                  {renderFallback(getGenderLabel(worker.gender))}
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Tipo de Documento:</span>
                  {renderFallback(getDocTypeLabel(worker.documentType))}
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Nº do Documento:</span>
                  {renderFallback(worker.documentNumber)}
                </div>
                <div className="flex flex-col py-0.5">
                  <span className="text-muted-foreground mb-0.5">Morada / Endereço:</span>
                  <span className="text-foreground font-medium leading-relaxed">
                    {worker.address || <span className="text-muted-foreground italic">Não informado</span>}
                  </span>
                </div>
              </div>
            </div>

            {/* Bloco 2: Profissional e Remuneração */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                <Award className="h-3.5 w-3.5" />
                Dados Profissionais e Salário
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Data de Contratação:</span>
                  {renderFallback(worker.hireDate ? formatDate(worker.hireDate) : undefined)}
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Regime de Remuneração:</span>
                  <span className="text-foreground font-semibold">
                    {worker.paymentType === "daily" && "Diário (por dia trabalhado)"}
                    {worker.paymentType === "hourly" && "Horário (por hora trabalhada)"}
                    {worker.paymentType === "monthly" && "Mensal (salário fixo mensal)"}
                  </span>
                </div>
                <div className="flex justify-between py-0.5 bg-primary-soft/30 px-2 py-1 rounded">
                  <span className="text-primary-dark font-medium">Taxa Contratual:</span>
                  <span className="text-primary-dark font-bold text-sm">
                    {worker.paymentType === "daily" && formatMZN(worker.dailyRate || 0)}
                    {worker.paymentType === "hourly" && `${formatMZN(worker.hourlyRate || 0)} /h`}
                    {worker.paymentType === "monthly" && formatMZN(worker.monthlyRate || 0)}
                  </span>
                </div>
                <div className="flex flex-col py-0.5">
                  <span className="text-muted-foreground mb-0.5">Observações Profissionais:</span>
                  <p className="text-foreground leading-relaxed italic bg-muted/30 p-2 rounded border border-border/40">
                    {worker.notes || "Sem observações adicionais."}
                  </p>
                </div>
              </div>
            </div>

          </div>

          <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-border">
            {/* Bloco 3: Contacto de Emergência */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-destructive" />
                Contacto de Emergência
              </h4>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Nome do Contacto:</span>
                  {renderFallback(worker.emergencyContactName)}
                </div>
                <div className="flex justify-between py-0.5">
                  <span className="text-muted-foreground">Telefone de Emergência:</span>
                  {renderFallback(worker.emergencyContactPhone)}
                </div>
              </div>
            </div>

            {/* Bloco 4: Filiação em Equipas */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground border-b pb-1.5 flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                Equipas Associadas
              </h4>
              <div className="space-y-2 text-xs">
                {workerTeams.length === 0 ? (
                  <p className="text-muted-foreground italic text-xs py-1">
                    Este trabalhador não pertence a nenhuma equipa registada.
                  </p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {workerTeams.map((t) => (
                      <div key={t.id} className="flex items-center justify-between p-1.5 rounded border border-border bg-muted/20">
                        <span className="font-semibold text-foreground">{t.name}</span>
                        {t.leaderWorkerId === worker.id ? (
                          <Badge className="bg-primary text-primary-foreground text-[9px] h-4 px-1.5 font-semibold">
                            Líder da Equipa
                          </Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Membro</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Secção de Atribuições às Obras */}
          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary" />
                Atribuições às Obras
              </h4>
              {worker.status === "active" && (
                <Button
                  variant="outline"
                  size="xs"
                  className="h-7 text-[10px] border-primary text-primary hover:bg-primary-soft/10"
                  onClick={handleAssign}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Atribuir a Obra
                </Button>
              )}
            </div>

            {workerAssignments.length === 0 ? (
              <div className="text-center text-xs text-muted-foreground p-4 bg-muted/20 border rounded-lg italic">
                Nenhuma atribuição registada para este trabalhador.
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
            Editar ficha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
