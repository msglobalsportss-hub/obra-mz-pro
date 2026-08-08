/**
 * Validações estruturais do domínio de Inventário — Fase 2A.
 *
 * Estas são validações ESTRUTURAIS (formato, tipo, limites numéricos),
 * NÃO validações de negócio (stock disponível, políticas, permissões).
 *
 * Separação de responsabilidades:
 * - Tipos TypeScript: validação em tempo de compilação
 * - Estas funções: validação em tempo de execução (entrada de dados)
 * - Regras de negócio: implementadas nos Domain Services (Fase 2B)
 *
 * Reutiliza padrões do projeto ObraMZ existente (sem nova framework de testes).
 */

import type { InventoryBalanceDimensions } from "../domain/entities";

// ---------------------------------------------------------------------------
// Resultado de Validação
// ---------------------------------------------------------------------------

export interface ValidationResult {
  readonly isValid: boolean;
  readonly errors: readonly ValidationError[];
}

export interface ValidationError {
  readonly field: string;
  readonly code: string;
  readonly message: string;
}

const ok = (): ValidationResult => ({ isValid: true, errors: [] });
const fail = (errors: ValidationError[]): ValidationResult => ({ isValid: false, errors });
const error = (field: string, code: string, message: string): ValidationError => ({
  field,
  code,
  message,
});

// ---------------------------------------------------------------------------
// Validações de Quantidade e Valor Monetário
// ---------------------------------------------------------------------------

/**
 * Quantidade deve ser um número finito positivo (> 0).
 */
export function validatePositiveQuantity(
  value: unknown,
  field = "quantity",
): ValidationError | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return error(field, "INVALID_QUANTITY", `${field} deve ser um número positivo finito.`);
  }
  return null;
}

/**
 * Quantidade pode ser zero ou positiva (>= 0).
 */
export function validateNonNegativeQuantity(
  value: unknown,
  field = "quantity",
): ValidationError | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return error(field, "NEGATIVE_QUANTITY", `${field} não pode ser negativo.`);
  }
  return null;
}

/**
 * Preço/custo deve ser zero ou positivo (>= 0).
 */
export function validateNonNegativePrice(value: unknown, field = "price"): ValidationError | null {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return error(field, "NEGATIVE_PRICE", `${field} não pode ser negativo.`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validações de Identificadores
// ---------------------------------------------------------------------------

/**
 * ID deve ser uma string não vazia sem espaços iniciais/finais.
 */
export function validateNonEmptyId(value: unknown, field = "id"): ValidationError | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return error(field, "EMPTY_ID", `${field} não pode estar vazio.`);
  }
  return null;
}

/**
 * String obrigatória.
 */
export function validateRequiredString(value: unknown, field: string): ValidationError | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return error(field, "REQUIRED_STRING", `${field} é obrigatório.`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validações de Data
// ---------------------------------------------------------------------------

/**
 * Data ISO 8601 válida.
 */
export function validateISO8601Date(value: unknown, field: string): ValidationError | null {
  if (typeof value !== "string") {
    return error(field, "INVALID_DATE_TYPE", `${field} deve ser uma string ISO 8601.`);
  }
  const parsed = Date.parse(value);
  if (isNaN(parsed)) {
    return error(field, "INVALID_DATE", `${field} não é uma data ISO 8601 válida.`);
  }
  return null;
}

// ---------------------------------------------------------------------------
// Validações Específicas do Domínio de Inventário
// ---------------------------------------------------------------------------

/**
 * Valida que origem e destino são diferentes (transferências).
 */
export function validateSourceDifferentFromDestination(
  sourceLocationId: string,
  destinationLocationId: string,
): ValidationError | null {
  if (sourceLocationId === destinationLocationId) {
    return error(
      "destinationLocationId",
      "SAME_LOCATION",
      "A localização de origem e destino não podem ser iguais.",
    );
  }
  return null;
}

/**
 * Valida a estrutura mínima de uma referência de negócio.
 */
export function validateInventoryReference(
  referenceType: unknown,
  referenceId: unknown,
): ValidationError[] {
  const errors: ValidationError[] = [];
  const typeErr = validateRequiredString(referenceType, "referenceType");
  if (typeErr) errors.push(typeErr);
  const idErr = validateNonEmptyId(referenceId, "referenceId");
  if (idErr) errors.push(idErr);
  return errors;
}

/**
 * Valida as dimensões da chave de saldo (ADR-006).
 */
export function validateBalanceDimensions(
  dimensions: Partial<InventoryBalanceDimensions>,
): ValidationResult {
  const errors: ValidationError[] = [];

  const required: Array<keyof InventoryBalanceDimensions> = [
    "tenantId",
    "companyId",
    "materialId",
    "locationId",
    "stockState",
  ];

  for (const field of required) {
    const val = dimensions[field];
    const err = validateNonEmptyId(typeof val === "string" ? val : undefined, field);
    if (err) errors.push(err);
  }

  return errors.length === 0 ? ok() : fail(errors);
}

/**
 * Valida a chave de idempotência.
 */
export function validateIdempotencyKey(value: unknown): ValidationError | null {
  return validateNonEmptyId(value, "idempotencyKey");
}

// ---------------------------------------------------------------------------
// Validação de StockMovement estrutural
// ---------------------------------------------------------------------------

export interface StockMovementStructuralInput {
  materialId: string;
  quantity: number;
  unitCost?: number;
  movementType: string;
  referenceType: string;
  referenceId: string;
  correlationId: string;
  idempotencyKey: string;
  occurredAt: string;
  tenantId: string;
  companyId: string;
}

export function validateStockMovementStructure(
  input: StockMovementStructuralInput,
): ValidationResult {
  const errors: ValidationError[] = [];

  const idFields: Array<
    keyof Pick<
      StockMovementStructuralInput,
      "materialId" | "tenantId" | "companyId" | "correlationId" | "idempotencyKey"
    >
  > = ["materialId", "tenantId", "companyId", "correlationId", "idempotencyKey"];
  for (const field of idFields) {
    const err = validateNonEmptyId(input[field], field);
    if (err) errors.push(err);
  }

  const qErr = validatePositiveQuantity(input.quantity);
  if (qErr) errors.push(qErr);

  if (input.unitCost !== undefined) {
    const cErr = validateNonNegativePrice(input.unitCost, "unitCost");
    if (cErr) errors.push(cErr);
  }

  const refErrors = validateInventoryReference(input.referenceType, input.referenceId);
  errors.push(...refErrors);

  const dateErr = validateISO8601Date(input.occurredAt, "occurredAt");
  if (dateErr) errors.push(dateErr);

  return errors.length === 0 ? ok() : fail(errors);
}
