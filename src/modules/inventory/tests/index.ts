/**
 * Master Test Runner do Módulo de Inventário — Fases 2A e 2B
 */

import { runInventoryPhase2ATests } from "./inventory-phase2a.test";
import { runInventoryEnginePhase2BTests } from "./inventory-engine.test";
import { runInventoryDeliveriesIntegrationTests } from "./inventory-deliveries-integration.test";
import { runInventoryRebuilderTests } from "./inventory-rebuilder.test";

export async function runAllInventoryModuleTests(): Promise<boolean> {
  console.log("================================================================");
  console.log("=== RUNNING ALL INVENTORY MODULE TESTS (PHASE 2A & PHASE 2B) ===");
  console.log("================================================================\n");

  const p2a = runInventoryPhase2ATests();
  const p2bEngine = await runInventoryEnginePhase2BTests();
  const p2bDeliveries = await runInventoryDeliveriesIntegrationTests();
  const p2bRebuilder = await runInventoryRebuilderTests();

  const allPassed = p2a && p2bEngine && p2bDeliveries && p2bRebuilder;

  console.log("\n================================================================");
  if (allPassed) {
    console.log("=== ALL INVENTORY MODULE TESTS PASSED SUCCESSFULLY! (100%) ===");
  } else {
    console.error("=== SOME INVENTORY MODULE TESTS FAILED. CHECK LOGS ABOVE. ===");
  }
  console.log("================================================================\n");

  return allPassed;
}
