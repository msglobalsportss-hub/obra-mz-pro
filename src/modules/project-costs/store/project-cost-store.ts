/**
 * Zustand Store Independente: projectCostStore
 * Categoria: modules/project-costs
 *
 * Store própria para gestão de custos acumulados e históricos de materiais da obra.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  ProjectMaterialCostEntry,
  RecordProjectMaterialConsumptionInput,
} from "../domain/entities";

interface ProjectCostState {
  entries: ProjectMaterialCostEntry[];

  recordConsumption: (
    input: RecordProjectMaterialConsumptionInput,
  ) => ProjectMaterialCostEntry;
  getEntriesByProject: (projectId: string) => ProjectMaterialCostEntry[];
  getTotalCostByProject: (projectId: string) => number;
}

export const useProjectCostStore = create<ProjectCostState>()(
  persist(
    (set, get) => ({
      entries: [],

      recordConsumption: (input) => {
        const id = `pmc-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
        const totalCost = input.quantity * input.unitCostAtConsumption;
        const entry: ProjectMaterialCostEntry = {
          id,
          projectId: input.projectId,
          materialId: input.materialId,
          quantity: input.quantity,
          unit: input.unit,
          unitCostAtConsumption: input.unitCostAtConsumption,
          totalCost,
          phaseId: input.phaseId,
          consumedAt: input.consumedAt || new Date().toISOString(),
          movementId: input.movementId,
          actorId: input.actorId,
          notes: input.notes,
          sourceLocationId: input.sourceLocationId,
        };

        set((state) => ({
          entries: [entry, ...state.entries],
        }));

        return entry;
      },

      getEntriesByProject: (projectId) => {
        return get().entries.filter((e) => e.projectId === projectId);
      },

      getTotalCostByProject: (projectId) => {
        return get()
          .getEntriesByProject(projectId)
          .reduce((sum, e) => sum + e.totalCost, 0);
      },
    }),
    {
      name: "obramz-project-costs-state",
    },
  ),
);
