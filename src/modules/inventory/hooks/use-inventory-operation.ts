/**
 * Hook de Execução de Operações de Inventário — useInventoryOperation
 * Categoria: hooks
 *
 * Gerencia a submissão de ações com chave de idempotência estável por intenção de submissão (ADR & Seção 25).
 * Trata o estado de carregamento, formatação de erros via InventoryErrorPresenter e feedback.
 */

import { useState, useCallback, useRef } from "react";
import { InventoryErrorPresenter } from "../application/presenters/inventory-error-presenter";
import { generateInventoryId } from "../core/helpers";
import type { InventoryExecutionOutputDTO } from "../application/dto/inventory-dto";

export interface UseInventoryOperationResult<TInput, TOutput = InventoryExecutionOutputDTO> {
  readonly execute: (input: TInput) => Promise<TOutput | null>;
  readonly loading: boolean;
  readonly error: string | null;
  readonly status: "idle" | "loading" | "completed" | "replayed" | "failed";
  readonly result: TOutput | null;
  readonly reset: () => void;
  readonly idempotencyKey: string;
  readonly renewIdempotencyKey: () => string;
}

export function useInventoryOperation<TInput, TOutput = InventoryExecutionOutputDTO>(
  operationFn: (input: TInput & { idempotencyKey: string }) => Promise<TOutput>,
  options?: {
    onSuccess?: (result: TOutput) => void;
    onError?: (formattedMessage: string, rawError: unknown) => void;
  },
): UseInventoryOperationResult<TInput, TOutput> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "completed" | "replayed" | "failed">(
    "idle",
  );
  const [result, setResult] = useState<TOutput | null>(null);

  // Manter chave de idempotência ESTÁVEL por intenção de submissão do utilizador
  const idempotencyKeyRef = useRef<string>(generateInventoryId("idem"));

  const renewIdempotencyKey = useCallback(() => {
    const newKey = generateInventoryId("idem");
    idempotencyKeyRef.current = newKey;
    return newKey;
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
    setStatus("idle");
    setResult(null);
    renewIdempotencyKey();
  }, [renewIdempotencyKey]);

  const execute = useCallback(
    async (input?: TInput): Promise<TOutput | null> => {
      setLoading(true);
      setError(null);
      setStatus("loading");

      try {
        const key = idempotencyKeyRef.current;
        const res = await operationFn({ ...(input || ({} as TInput)), idempotencyKey: key });

        setResult(res);
        const opStatus = (res as unknown as { status?: string }).status;
        if (opStatus === "replayed") {
          setStatus("replayed");
        } else {
          setStatus("completed");
        }

        options?.onSuccess?.(res);
        // Gerar nova chave para a PRÓXIMA intenção do utilizador apenas pós-sucesso
        renewIdempotencyKey();
        return res;
      } catch (err: unknown) {
        const formattedMsg = InventoryErrorPresenter.formatError(err);
        setError(formattedMsg);
        setStatus("failed");
        options?.onError?.(formattedMsg, err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [operationFn, options, renewIdempotencyKey],
  );

  return {
    execute,
    loading,
    error,
    status,
    result,
    reset,
    idempotencyKey: idempotencyKeyRef.current,
    renewIdempotencyKey,
  };
}
