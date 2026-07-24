import { useEffect, useState, useMemo } from "react";
import type { Team, Worker } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useObraMZStore } from "@/store/obramz-store";
import { toast } from "sonner";
import { Search, Users, ShieldAlert, Award } from "lucide-react";

type TeamFormDialogProps = {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  teamToEdit?: Team | null;
};

export function TeamFormDialog({
  open,
  onOpenChange,
  teamToEdit = null,
}: TeamFormDialogProps) {
  const createTeam = useObraMZStore((s) => s.createTeam);
  const updateTeam = useObraMZStore((s) => s.updateTeam);
  const workers = useObraMZStore((s) => s.workers || []);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<Team["status"]>("active");
  const [selectedWorkerIds, setSelectedWorkerIds] = useState<string[]>([]);
  const [leaderWorkerId, setLeaderWorkerId] = useState<string>("none");
  const [memberSearch, setMemberSearch] = useState("");

  // Carregar dados na edição ou limpar no registo
  useEffect(() => {
    if (open) {
      if (teamToEdit) {
        setName(teamToEdit.name);
        setDescription(teamToEdit.description || "");
        setStatus(teamToEdit.status);
        setSelectedWorkerIds(teamToEdit.workerIds || []);
        setLeaderWorkerId(teamToEdit.leaderWorkerId || "none");
        setMemberSearch("");
      } else {
        setName("");
        setDescription("");
        setStatus("active");
        setSelectedWorkerIds([]);
        setLeaderWorkerId("none");
        setMemberSearch("");
      }
    }
  }, [open, teamToEdit]);

  // Regra de negócio: Limpar automaticamente o líder se ele for removido dos membros
  useEffect(() => {
    if (leaderWorkerId !== "none" && !selectedWorkerIds.includes(leaderWorkerId)) {
      setLeaderWorkerId("none");
    }
  }, [selectedWorkerIds, leaderWorkerId]);

  // Lista de trabalhadores selecionáveis:
  // - Novos trabalhadores inativos são impedidos (apenas trabalhadores ativos).
  // - Trabalhadores inativos antigos já na equipa mantêm-se selecionáveis.
  const selectableWorkers = useMemo(() => {
    return workers.filter((w) => {
      // Se já pertencia à equipa, mantém-se na lista mesmo que seja inativo
      const isAlreadyInTeam = teamToEdit?.workerIds.includes(w.id);
      return w.status === "active" || isAlreadyInTeam;
    });
  }, [workers, teamToEdit]);

  // Filtro de pesquisa de membros por Nome ou Função
  const filteredSelectableWorkers = useMemo(() => {
    return selectableWorkers.filter((w) => {
      const query = memberSearch.toLowerCase().trim();
      return (
        query === "" ||
        w.name.toLowerCase().includes(query) ||
        w.role.toLowerCase().includes(query)
      );
    });
  }, [selectableWorkers, memberSearch]);

  // Mapear os candidatos a líder:
  // - Devem estar selecionados em selectedWorkerIds.
  // - Não podem ser trabalhadores inativos (exceto se já fosse o líder atual).
  const leaderCandidates = useMemo(() => {
    return workers.filter((w) => {
      const isSelected = selectedWorkerIds.includes(w.id);
      const isCurrentLeader = teamToEdit?.leaderWorkerId === w.id;
      // Ativos selecionados, ou o líder inativo atual se ainda selecionado como membro
      return isSelected && (w.status === "active" || isCurrentLeader);
    });
  }, [workers, selectedWorkerIds, teamToEdit]);

  const handleMemberToggle = (workerId: string) => {
    setSelectedWorkerIds((prev) => {
      if (prev.includes(workerId)) {
        return prev.filter((id) => id !== workerId);
      } else {
        return [...prev, workerId];
      }
    });
  };

  const handleSave = () => {
    if (!name.trim()) {
      toast.error("O nome da equipa é obrigatório.");
      return;
    }

    const leaderIdValue = leaderWorkerId === "none" ? undefined : leaderWorkerId;

    // Validação extra: O líder deve fazer parte dos membros
    if (leaderIdValue && !selectedWorkerIds.includes(leaderIdValue)) {
      toast.error("O líder da equipa deve ser selecionado como membro.");
      return;
    }

    const payload: Omit<Team, "id" | "createdAt" | "updatedAt"> = {
      name: name.trim(),
      description: description.trim() || undefined,
      status,
      workerIds: selectedWorkerIds,
      leaderWorkerId: leaderIdValue,
    };

    try {
      if (teamToEdit) {
        updateTeam(teamToEdit.id, payload);
        toast.success("Equipa atualizada com sucesso!");
      } else {
        createTeam(payload);
        toast.success("Equipa criada com sucesso!");
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {teamToEdit ? "Editar Equipa" : "Criar Nova Equipa"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Informações Básicas */}
          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="team-name">Nome da Equipa *</Label>
              <Input
                id="team-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex.: Equipa de Pedreiros - Bloco B"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="team-desc">Descrição / Atribuição</Label>
              <Textarea
                id="team-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Descrição dos trabalhos ou foco da equipa..."
                rows={2}
              />
            </div>

            {teamToEdit && (
              <div className="space-y-1">
                <Label htmlFor="team-status">Estado da Equipa</Label>
                <Select value={status} onValueChange={(v: any) => setStatus(v)}>
                  <SelectTrigger id="team-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativa</SelectItem>
                    <SelectItem value="inactive">Inativa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Seleção de Membros */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-1">
                <Users className="h-4 w-4 text-primary" />
                Membros da Equipa ({selectedWorkerIds.length} selecionados)
              </Label>
              <span className="text-[10px] text-muted-foreground">Novos inativos são omitidos</span>
            </div>

            {/* Caixa de Pesquisa Interna de Membros */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Pesquisar trabalhador por nome ou função..."
                value={memberSearch}
                onChange={(e) => setMemberSearch(e.target.value)}
                className="pl-8 h-8 text-xs bg-muted/20"
              />
            </div>

            {/* Lista com Scroll */}
            <div className="border rounded-md max-h-[160px] overflow-y-auto divide-y bg-background px-3">
              {filteredSelectableWorkers.length === 0 ? (
                <div className="text-center text-xs text-muted-foreground py-6">
                  Nenhum trabalhador disponível.
                </div>
              ) : (
                filteredSelectableWorkers.map((w) => {
                  const isChecked = selectedWorkerIds.includes(w.id);
                  return (
                    <div key={w.id} className="flex items-center justify-between py-2 text-xs">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          id={`member-${w.id}`}
                          checked={isChecked}
                          onCheckedChange={() => handleMemberToggle(w.id)}
                        />
                        <div className="h-6 w-6 rounded-full overflow-hidden bg-muted border flex items-center justify-center shrink-0">
                          {w.photo ? (
                            <img src={w.photo} alt={w.name} className="h-full w-full object-cover" />
                          ) : (
                            <span className="text-[9px] font-bold">{w.name.slice(0, 2).toUpperCase()}</span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <label htmlFor={`member-${w.id}`} className="font-medium cursor-pointer text-foreground block truncate">
                            {w.name}
                          </label>
                          <span className="text-[10px] text-muted-foreground">{w.role}</span>
                        </div>
                      </div>
                      
                      {w.status === "inactive" && (
                        <span className="text-[9px] text-destructive bg-destructive/10 border border-destructive/20 rounded px-1">
                          Inativo
                        </span>
                      )}
                    </div>
                  );
                }))}
            </div>
          </div>

          {/* Seleção do Líder */}
          <div className="space-y-1.5 border-t pt-3">
            <Label htmlFor="team-leader" className="flex items-center gap-1.5">
              <Award className="h-4 w-4 text-primary" />
              Líder da Equipa (Opcional)
            </Label>
            <Select value={leaderWorkerId} onValueChange={setLeaderWorkerId}>
              <SelectTrigger id="team-leader">
                <SelectValue placeholder="Escolher líder..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem líder definido</SelectItem>
                {leaderCandidates.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} ({c.role}) {c.status === "inactive" ? "— Inativo" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-[10px] text-muted-foreground flex items-center gap-1.5 bg-muted/40 p-2 rounded">
              <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
              Apenas membros selecionados e ativos no sistema podem ser escolhidos como novos líderes.
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="bg-primary hover:bg-primary-dark" onClick={handleSave}>
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
