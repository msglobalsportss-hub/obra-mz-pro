import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X, RotateCcw, Building, Users, User, Clock, DollarSign, ShieldAlert, Sparkles } from "lucide-react";
import type { AttendanceFilterState, AttendanceRecordSource } from "@/lib/attendance-filters/attendance-filter-types";
import type { Worker, Obra, Team, AttendanceStatus } from "@/lib/mock-data";
import { countActiveAdvancedFilters } from "@/lib/attendance-filters/attendance-filter-utils";
import { resetAttendanceFilters } from "@/lib/attendance-filters/attendance-filter-defaults";

type AttendanceAdvancedFilterSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  state: AttendanceFilterState;
  onChange: (newState: AttendanceFilterState) => void;
  workers: Worker[];
  obras: Obra[];
  teams: Team[];
};

const allStatuses: { value: AttendanceStatus; label: string; color: string }[] = [
  { value: "present", label: "Presente", color: "bg-emerald-600 text-white" },
  { value: "late", label: "Atrasado", color: "bg-amber-600 text-white" },
  { value: "half_day", label: "Meio período", color: "bg-sky-600 text-white" },
  { value: "absent", label: "Ausente", color: "bg-rose-600 text-white" },
  { value: "justified_absence", label: "Falta justificada", color: "bg-purple-600 text-white" },
];

const allSources: { value: AttendanceRecordSource; label: string }[] = [
  { value: "manual", label: "Manual" },
  { value: "roll_call", label: "Chamada Diária" },
  { value: "imported", label: "Importado" },
  { value: "system", label: "Sistema" },
];

export function AttendanceAdvancedFilterSheet({
  open,
  onOpenChange,
  state,
  onChange,
  workers,
  obras,
  teams,
}: AttendanceAdvancedFilterSheetProps) {
  const activeCount = countActiveAdvancedFilters(state);

  const toggleArrayValue = <T extends string>(arr: T[], val: T): T[] => {
    return arr.includes(val) ? arr.filter((x) => x !== val) : [...arr, val];
  };

  const handleReset = () => {
    const resetState = resetAttendanceFilters(state);
    // Preserva o período atual
    resetState.dateFrom = state.dateFrom;
    resetState.dateTo = state.dateTo;
    resetState.periodMode = state.periodMode;
    onChange(resetState);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col h-full bg-background border-l">
        {/* Cabeçalho */}
        <SheetHeader className="p-4 bg-muted/30 border-b flex flex-row items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <SheetTitle className="text-base font-bold text-foreground flex items-center gap-2">
                Filtros Avançados
                {activeCount > 0 && (
                  <Badge className="bg-primary text-white text-[10px] h-5 px-1.5 font-bold">
                    {activeCount}
                  </Badge>
                )}
              </SheetTitle>
              <SheetDescription className="text-xs text-muted-foreground">
                Refine as presenças cruzando múltiplos critérios operacionais.
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {/* Corpo com Scroll */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 text-xs">
          
          {/* 1. OBRAS (MULTI-SELEÇÃO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-primary" /> Obras
              </span>
              {state.selectedProjectIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...state, selectedProjectIds: [] })}
                  className="text-[10px] text-muted-foreground hover:text-rose-600 font-semibold"
                >
                  Limpar ({state.selectedProjectIds.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {obras.map((o) => {
                const selected = state.selectedProjectIds.includes(o.id);
                return (
                  <Badge
                    key={o.id}
                    variant={selected ? "default" : "outline"}
                    onClick={() =>
                      onChange({
                        ...state,
                        selectedProjectIds: toggleArrayValue(state.selectedProjectIds, o.id),
                      })
                    }
                    className={`cursor-pointer text-xs py-1 px-2.5 transition-all select-none ${
                      selected ? "bg-primary text-white shadow-xs font-bold" : "hover:bg-muted"
                    }`}
                  >
                    {o.nome}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* 2. EQUIPAS (MULTI-SELEÇÃO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Equipas
              </span>
              {state.selectedTeamIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...state, selectedTeamIds: [] })}
                  className="text-[10px] text-muted-foreground hover:text-rose-600 font-semibold"
                >
                  Limpar ({state.selectedTeamIds.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {teams.map((t) => {
                const selected = state.selectedTeamIds.includes(t.id);
                return (
                  <Badge
                    key={t.id}
                    variant={selected ? "default" : "outline"}
                    onClick={() =>
                      onChange({
                        ...state,
                        selectedTeamIds: toggleArrayValue(state.selectedTeamIds, t.id),
                      })
                    }
                    className={`cursor-pointer text-xs py-1 px-2.5 transition-all select-none ${
                      selected ? "bg-primary text-white shadow-xs font-bold" : "hover:bg-muted"
                    }`}
                  >
                    {t.name}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* 3. ESTADOS DE PRESENÇA (MULTI-SELEÇÃO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Estado de Presença
              </span>
              {state.selectedStatuses.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...state, selectedStatuses: [] })}
                  className="text-[10px] text-muted-foreground hover:text-rose-600 font-semibold"
                >
                  Limpar ({state.selectedStatuses.length})
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allStatuses.map((st) => {
                const selected = state.selectedStatuses.includes(st.value);
                return (
                  <Badge
                    key={st.value}
                    variant={selected ? "default" : "outline"}
                    onClick={() =>
                      onChange({
                        ...state,
                        selectedStatuses: toggleArrayValue(state.selectedStatuses, st.value),
                      })
                    }
                    className={`cursor-pointer text-xs py-1 px-2.5 transition-all select-none ${
                      selected ? `${st.color} shadow-xs font-bold` : "hover:bg-muted"
                    }`}
                  >
                    {st.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          {/* 4. TRABALHADORES (MULTI-SELEÇÃO) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-primary" /> Trabalhadores Específicos
              </span>
              {state.selectedWorkerIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange({ ...state, selectedWorkerIds: [] })}
                  className="text-[10px] text-muted-foreground hover:text-rose-600 font-semibold"
                >
                  Limpar ({state.selectedWorkerIds.length})
                </button>
              )}
            </div>
            <div className="max-h-36 overflow-y-auto border rounded-lg p-2 space-y-1 bg-muted/10">
              {workers
                .filter((w) => w.status === "active" && w.id !== "invalid-orphan")
                .map((w) => {
                  const selected = state.selectedWorkerIds.includes(w.id);
                  return (
                    <label
                      key={w.id}
                      className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/40 cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={selected}
                        onCheckedChange={() =>
                          onChange({
                            ...state,
                            selectedWorkerIds: toggleArrayValue(state.selectedWorkerIds, w.id),
                          })
                        }
                      />
                      <span className="font-medium text-foreground">{w.name}</span>
                      <span className="text-[10px] text-muted-foreground">({w.role || "—"})</span>
                    </label>
                  );
                })}
            </div>
          </div>

          {/* 5. HORAS & HORAS EXTRA */}
          <div className="space-y-3 pt-2 border-t">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-primary" /> Horas & Horas Extra
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyWithHours}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyWithHours: !!checked,
                      onlyWithoutHours: checked ? false : state.onlyWithoutHours,
                    })
                  }
                />
                <span>Apenas com horas</span>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyWithoutHours}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyWithoutHours: !!checked,
                      onlyWithHours: checked ? false : state.onlyWithHours,
                    })
                  }
                />
                <span>Apenas sem horas</span>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyWithOvertime}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyWithOvertime: !!checked,
                      onlyWithoutOvertime: checked ? false : state.onlyWithoutOvertime,
                    })
                  }
                />
                <span>Apenas com horas extra</span>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyWithoutOvertime}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyWithoutOvertime: !!checked,
                      onlyWithOvertime: checked ? false : state.onlyWithOvertime,
                    })
                  }
                />
                <span>Apenas sem horas extra</span>
              </label>
            </div>
          </div>

          {/* 6. CUSTOS OPERACIONAIS */}
          <div className="space-y-3 pt-2 border-t">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-primary" /> Custos Operacionais
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyWithCost}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyWithCost: !!checked,
                      onlyWithoutCost: checked ? false : state.onlyWithoutCost,
                    })
                  }
                />
                <span>Apenas com custo</span>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyWithoutCost}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyWithoutCost: !!checked,
                      onlyWithCost: checked ? false : state.onlyWithCost,
                    })
                  }
                />
                <span>Apenas sem custo</span>
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Custo Mínimo (MTn)</span>
                <Input
                  type="number"
                  placeholder="0"
                  value={state.minimumCost ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      minimumCost: e.target.value !== "" ? Number(e.target.value) : null,
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>

              <div>
                <span className="text-[10px] font-semibold text-muted-foreground block mb-1">Custo Máximo (MTn)</span>
                <Input
                  type="number"
                  placeholder="Sem limite"
                  value={state.maximumCost ?? ""}
                  onChange={(e) =>
                    onChange({
                      ...state,
                      maximumCost: e.target.value !== "" ? Number(e.target.value) : null,
                    })
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 7. ESTADO ATIVO / INATIVO */}
          <div className="space-y-3 pt-2 border-t">
            <span className="font-bold text-foreground flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-primary" /> Filtros Operacionais de Cadastro
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyActiveWorkers}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyActiveWorkers: !!checked,
                      onlyInactiveWorkers: checked ? false : state.onlyInactiveWorkers,
                    })
                  }
                />
                <span>Operários ativos</span>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyInactiveWorkers}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyInactiveWorkers: !!checked,
                      onlyActiveWorkers: checked ? false : state.onlyActiveWorkers,
                    })
                  }
                />
                <span>Operários inativos</span>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyActiveTeams}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyActiveTeams: !!checked,
                      onlyInactiveTeams: checked ? false : state.onlyInactiveTeams,
                    })
                  }
                />
                <span>Equipas ativas</span>
              </label>

              <label className="flex items-center gap-2 p-2 border rounded-lg bg-card cursor-pointer">
                <Checkbox
                  checked={state.onlyInactiveTeams}
                  onCheckedChange={(checked) =>
                    onChange({
                      ...state,
                      onlyInactiveTeams: !!checked,
                      onlyActiveTeams: checked ? false : state.onlyActiveTeams,
                    })
                  }
                />
                <span>Equipas inativas</span>
              </label>
            </div>
          </div>

        </div>

        {/* Rodapé com botão Limpar */}
        <SheetFooter className="p-4 bg-muted/30 border-t flex flex-row items-center justify-between shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={activeCount === 0}
            className="text-xs h-9 border"
          >
            <RotateCcw className="h-3.5 w-3.5 mr-1.5" />
            Limpar Filtros
          </Button>

          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-xs h-9 bg-primary text-white"
          >
            Ver Resultados
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
