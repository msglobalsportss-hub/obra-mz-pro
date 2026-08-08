/**
 * Testes de Limites Arquiteturais de UI — Inventory UI Boundary Tests
 * Categoria: tests
 *
 * Teste de arquitetura (Seção 32) garantindo que:
 * 1. Ficheiros de UI (components, features, hooks) NUNCA importam diretamente ficheiros internos do Core/Engine/Infraestrutura.
 * 2. Componentes de UI NUNCA invocam mutações diretas de stock como setState, storeBalanceProjection ou new StockMovement.
 */

import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as path from "path";

function getFilesRecursively(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFilesRecursively(filePath));
    } else if (filePath.endsWith(".ts") || filePath.endsWith(".tsx")) {
      results.push(filePath);
    }
  });
  return results;
}

describe("Inventory UI Architectural Boundary Checks (Vitest)", () => {
  const baseUiPath = path.resolve(__dirname, "..");
  const uiDirectories = [
    path.join(baseUiPath, "components"),
    path.join(baseUiPath, "features"),
    path.join(baseUiPath, "hooks"),
  ];

  const forbiddenImports = [
    "core/domain/repositories",
    "core/domain/entities",
    "core/domain/factories",
    "core/engine/inventory-engine",
    "core/services/balance-key-resolver",
    "infrastructure/repositories",
    "infrastructure/event-bus",
    "infrastructure/in-memory-unit-of-work",
  ];

  const forbiddenMutations = [
    "balance.onHandQuantity +=",
    "balance.reservedQuantity -=",
    "storeBalanceProjection(",
    "new StockMovement(",
  ];

  it("should guarantee no UI file imports internal core or infrastructure modules directly", () => {
    uiDirectories.forEach((dir) => {
      if (!fs.existsSync(dir)) return;
      const files = getFilesRecursively(dir);

      files.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");

        forbiddenImports.forEach((forbidden) => {
          const regex = new RegExp(`import.*from.*['"]${forbidden}['"]`);
          expect(
            regex.test(content),
            `O ficheiro de UI '${path.relative(baseUiPath, filePath)}' importa ilegalmente o módulo interno '${forbidden}'`,
          ).toBe(false);
        });
      });
    });
  });

  it("should guarantee no UI file performs direct stock mutations or raw repository calls", () => {
    uiDirectories.forEach((dir) => {
      if (!fs.existsSync(dir)) return;
      const files = getFilesRecursively(dir);

      files.forEach((filePath) => {
        const content = fs.readFileSync(filePath, "utf-8");

        forbiddenMutations.forEach((forbidden) => {
          expect(
            content.includes(forbidden),
            `O ficheiro de UI '${path.relative(baseUiPath, filePath)}' contém mutação direta proibida: '${forbidden}'`,
          ).toBe(false);
        });
      });
    });
  });
});
