/**
 * Contexto e Provider de Autenticação e Multi-Tenancy (Supabase Auth)
 * Categoria: providers
 */

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";
import { inventoryStoreManager } from "@/modules/inventory/store/inventory-store";

export interface CompanyMemberInfo {
  id: string;
  tenantId: string;
  companyId: string;
  companyName: string;
  role: "admin" | "manager" | "field_chief" | "clerk";
  status: "active" | "invited" | "suspended";
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  activeCompany: CompanyMemberInfo | null;
  userCompanies: CompanyMemberInfo[];
  switchActiveCompany: (companyId: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userCompanies, setUserCompanies] = useState<CompanyMemberInfo[]>([]);
  const [activeCompany, setActiveCompany] = useState<CompanyMemberInfo | null>(null);

  useEffect(() => {
    // Escutar alterações de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        await loadUserCompanies(session.user.id);
      } else {
        setUserCompanies([]);
        setActiveCompany(null);
        inventoryStoreManager.logout();
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function loadUserCompanies(userId: string) {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("company_members")
        .select("id, tenant_id, company_id, role, status, companies(name)")
        .eq("user_id", userId)
        .eq("status", "active");

      if (error || !data || data.length === 0) {
        setUserCompanies([]);
        setActiveCompany(null);
        setIsLoading(false);
        return;
      }

      const mapped: CompanyMemberInfo[] = data.map((d: any) => ({
        id: d.id,
        tenantId: d.tenant_id,
        companyId: d.company_id,
        companyName: d.companies?.name ?? "Empresa ObraMZ",
        role: d.role,
        status: d.status,
      }));

      setUserCompanies(mapped);

      // Empresa ativa default = primeira empresa da lista se nenhuma selecionada
      const currentActive = activeCompany ?? mapped[0];
      setActiveCompany(currentActive);
      inventoryStoreManager.switchCompanyScope(currentActive.tenantId, currentActive.companyId);
    } catch (err) {
      console.error("Erro ao carregar empresas do utilizador:", err);
    } finally {
      setIsLoading(false);
    }
  }

  async function switchActiveCompany(companyId: string) {
    const target = userCompanies.find((c) => c.companyId === companyId);
    if (!target) {
      throw new Error(`Utilizador não possui associação ativa à empresa ${companyId}`);
    }
    setActiveCompany(target);
    inventoryStoreManager.switchCompanyScope(target.tenantId, target.companyId);
  }

  async function signOut() {
    await supabase.auth.signOut();
    inventoryStoreManager.logout();
    setUser(null);
    setSession(null);
    setActiveCompany(null);
    setUserCompanies([]);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        activeCompany,
        userCompanies,
        switchActiveCompany,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser utilizado dentro de um AuthProvider");
  }
  return context;
}
