/**
 * Provider do Supabase Realtime Multiutilizador por Empresa (ObraMZ)
 * Categoria: providers
 */

import React, { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./auth-provider";
import { inventoryStoreManager } from "@/modules/inventory/store/inventory-store";

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const { activeCompany } = useAuth();
  const companyId = activeCompany?.companyId;

  useEffect(() => {
    if (!companyId) return;

    // Criar canal de realtime isolado pela empresa ativa
    const channel = supabase
      .channel(`realtime_company_${companyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "inventory_balances",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log("[Realtime] Mudança em inventory_balances detetada:", payload);
          inventoryStoreManager.syncCompanyBalances(companyId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_movements",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log("[Realtime] Novo stock_movement detetado:", payload);
          inventoryStoreManager.syncCompanyMovements(companyId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "deliveries",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log("[Realtime] Mudança em deliveries detetada:", payload);
          inventoryStoreManager.syncCompanyDeliveries(companyId);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "stock_transfers",
          filter: `company_id=eq.${companyId}`,
        },
        (payload) => {
          console.log("[Realtime] Mudança em stock_transfers detetada:", payload);
          inventoryStoreManager.syncCompanyDeliveries(companyId);
        }
      )
      .subscribe();

    // Limpeza ao desmontar ou trocar de empresa
    return () => {
      supabase.removeChannel(channel);
    };
  }, [companyId]);

  return <>{children}</>;
}
