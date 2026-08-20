/**
 * Diagnostics Helper: Runtime Cloud Gate
 * Categoria: providers
 */

import { defaultUnitOfWork } from "@/modules/inventory/application/actions/action-container";
import { SupabaseUnitOfWork } from "@/modules/inventory/infrastructure/repositories/supabase/supabase-unit-of-work";

export interface CloudGateStatus {
  supabaseConfigured: boolean;
  unitOfWorkType: "SupabaseUnitOfWork" | "InMemoryUnitOfWork";
  isProduction: boolean;
  gatePassed: boolean;
  diagnostics: string[];
}

export function checkRuntimeCloudGate(): CloudGateStatus {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey =
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY;

  const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const isSupabaseUow = defaultUnitOfWork instanceof SupabaseUnitOfWork;
  const isProduction = Boolean(import.meta.env.PROD);

  const diagnostics: string[] = [];

  if (isConfigured) {
    diagnostics.push("✅ Supabase URL e Anon Key canónicas configuradas.");
  } else {
    diagnostics.push("⚠️ Supabase não configurado via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY.");
  }

  if (isSupabaseUow) {
    diagnostics.push("✅ SupabaseUnitOfWork ativo com injeção de RPCs PL/pgSQL.");
  } else {
    diagnostics.push(isProduction ? "❌ ERRO: InMemoryUnitOfWork detetado em Produção!" : "ℹ️ InMemoryUnitOfWork ativo para ambiente DEV/TEST.");
  }

  const gatePassed = isConfigured && isSupabaseUow;

  return {
    supabaseConfigured: isConfigured,
    unitOfWorkType: isSupabaseUow ? "SupabaseUnitOfWork" : "InMemoryUnitOfWork",
    isProduction,
    gatePassed,
    diagnostics,
  };
}
