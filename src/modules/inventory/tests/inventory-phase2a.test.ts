import { describe, it, expect } from "vitest";
import { buildBalanceDimensionKey } from "../core/helpers";
import { WeightedAverageCostCalculator } from "../core/services/weighted-average-cost-calculator";
import { BalanceKeyResolver } from "../core/services/balance-key-resolver";
import {
  toTenantId,
  toCompanyId,
  toMaterialId,
  toInventoryLocationId,
} from "../core/shared/primitives";

describe("Phase 2A Structural Domain Tests", () => {
  it("should build balance dimension keys deterministically without batch or expiration date", () => {
    const key = buildBalanceDimensionKey({
      tenantId: "T1",
      companyId: "C1",
      materialId: "M1",
      locationId: "L1",
      stockState: "available",
    });
    expect(key).toBe("T1|C1|M1|L1|available|no-batch|no-exp");
  });

  it("should build balance dimension keys with batch and expiration date", () => {
    const key = buildBalanceDimensionKey({
      tenantId: "T1",
      companyId: "C1",
      materialId: "M1",
      locationId: "L1",
      stockState: "available",
      batchId: "B100",
      expirationDate: "2026-12-31",
    });
    expect(key).toBe("T1|C1|M1|L1|available|B100|2026-12-31");
  });

  it("should calculate initial WAC when current quantity is zero", () => {
    const wac = WeightedAverageCostCalculator.calculateNewAverage({
      currentQuantity: 0,
      currentAverageCost: 0,
      incomingQuantity: 100,
      incomingUnitCost: 45.5,
    });
    expect(wac).toBe(45.5);
  });

  it("should calculate weighted average cost accurately for inbound stock", () => {
    // Current: 100 @ 50 MT = 5000 MT
    // Incoming: 50 @ 80 MT = 4000 MT
    // Total: 150 @ 60 MT = 9000 MT
    const wac = WeightedAverageCostCalculator.calculateNewAverage({
      currentQuantity: 100,
      currentAverageCost: 50,
      incomingQuantity: 50,
      incomingUnitCost: 80,
    });
    expect(wac).toBe(60);
  });

  it("should normalize floating point values to 6 decimal places", () => {
    const normalized = WeightedAverageCostCalculator.normalizeDecimal(0.1 + 0.2);
    expect(normalized).toBe(0.3);
  });

  it("should resolve dimension keys via BalanceKeyResolver", () => {
    const key = BalanceKeyResolver.resolveKey({
      tenantId: toTenantId("TENANT-1"),
      companyId: toCompanyId("COMP-1"),
      materialId: toMaterialId("MAT-1"),
      locationId: toInventoryLocationId("LOC-1"),
      stockState: "available",
    });
    expect(key).toBe("TENANT-1|COMP-1|MAT-1|LOC-1|available|no-batch|no-exp");
  });
});
