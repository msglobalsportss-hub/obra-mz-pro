-- ============================================================================
-- ObraMZ — MIGRATION 20260808000001: ROW LEVEL SECURITY (RLS) DISCRIMINADO
-- ============================================================================

-- Habilitar RLS em todas as tabelas operacionais
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_locations ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipt_batch_items ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.inventory_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_transfer_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_material_cost_entries ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- FUNÇÕES DE APOIO À SEGURANÇA (SECURITY DEFINER COM SEARCH_PATH SEGURO)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.fn_user_has_company_access(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.company_members
    WHERE user_id = auth.uid()
      AND company_id = p_company_id
      AND status = 'active'
  );
$$;

-- ----------------------------------------------------------------------------
-- POLÍTICAS DISCRIMINADAS: PROFILES & MEMBERSHIP
-- ----------------------------------------------------------------------------

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY "members_select_policy" ON public.company_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.fn_user_has_company_access(company_id));

-- ----------------------------------------------------------------------------
-- POLÍTICAS DISCRIMINADAS: MATERIAIS, CLIENTES, FORNECEDORES, OBRAS, LOCAIS
-- ----------------------------------------------------------------------------

CREATE POLICY "materials_select" ON public.materials FOR SELECT TO authenticated USING (public.fn_user_has_company_access(company_id));
CREATE POLICY "materials_insert" ON public.materials FOR INSERT TO authenticated WITH CHECK (public.fn_user_has_company_access(company_id));
CREATE POLICY "materials_update" ON public.materials FOR UPDATE TO authenticated USING (public.fn_user_has_company_access(company_id)) WITH CHECK (public.fn_user_has_company_access(company_id));
CREATE POLICY "materials_delete" ON public.materials FOR DELETE TO authenticated USING (public.fn_user_has_company_access(company_id));

CREATE POLICY "locations_select" ON public.inventory_locations FOR SELECT TO authenticated USING (public.fn_user_has_company_access(company_id));
CREATE POLICY "locations_insert" ON public.inventory_locations FOR INSERT TO authenticated WITH CHECK (public.fn_user_has_company_access(company_id));
CREATE POLICY "locations_update" ON public.inventory_locations FOR UPDATE TO authenticated USING (public.fn_user_has_company_access(company_id)) WITH CHECK (public.fn_user_has_company_access(company_id));

-- ----------------------------------------------------------------------------
-- POLÍTICAS DISCRIMINADAS: INVENTORY BALANCES
-- ----------------------------------------------------------------------------

CREATE POLICY "balances_select" ON public.inventory_balances FOR SELECT TO authenticated USING (public.fn_user_has_company_access(company_id));
CREATE POLICY "balances_insert" ON public.inventory_balances FOR INSERT TO authenticated WITH CHECK (public.fn_user_has_company_access(company_id));
CREATE POLICY "balances_update" ON public.inventory_balances FOR UPDATE TO authenticated USING (public.fn_user_has_company_access(company_id)) WITH CHECK (public.fn_user_has_company_access(company_id));

-- ----------------------------------------------------------------------------
-- POLÍTICAS DISCRIMINADAS: STOCK MOVEMENTS (ESTRITAMENTE WRITE-PROTECTED PELO CLIENTE!)
-- ----------------------------------------------------------------------------

-- APENAS SELECT É PERMITIDO AO CLIENTE AUTHENTICATED
CREATE POLICY "movements_select" ON public.stock_movements
  FOR SELECT TO authenticated
  USING (public.fn_user_has_company_access(company_id));

-- NENHUMA POLICY DE INSERT, UPDATE OU DELETE É CRIADA PARA AUTHENTICATED.
-- A criação de stock_movements ocorre EXCLUSIVAMENTE via Stored Procedures SECURITY DEFINER.

-- ----------------------------------------------------------------------------
-- POLÍTICAS DISCRIMINADAS: COMPRAS, ENTREGAS E TRANSFERÊNCIAS
-- ----------------------------------------------------------------------------

CREATE POLICY "orders_select" ON public.purchase_orders FOR SELECT TO authenticated USING (public.fn_user_has_company_access(company_id));
CREATE POLICY "orders_insert" ON public.purchase_orders FOR INSERT TO authenticated WITH CHECK (public.fn_user_has_company_access(company_id));
CREATE POLICY "orders_update" ON public.purchase_orders FOR UPDATE TO authenticated USING (public.fn_user_has_company_access(company_id)) WITH CHECK (public.fn_user_has_company_access(company_id));

CREATE POLICY "deliveries_select" ON public.deliveries FOR SELECT TO authenticated USING (public.fn_user_has_company_access(company_id));
CREATE POLICY "deliveries_insert" ON public.deliveries FOR INSERT TO authenticated WITH CHECK (public.fn_user_has_company_access(company_id));
CREATE POLICY "deliveries_update" ON public.deliveries FOR UPDATE TO authenticated USING (public.fn_user_has_company_access(company_id)) WITH CHECK (public.fn_user_has_company_access(company_id));

CREATE POLICY "transfers_select" ON public.stock_transfers FOR SELECT TO authenticated USING (public.fn_user_has_company_access(company_id));
CREATE POLICY "transfers_insert" ON public.stock_transfers FOR INSERT TO authenticated WITH CHECK (public.fn_user_has_company_access(company_id));
CREATE POLICY "transfers_update" ON public.stock_transfers FOR UPDATE TO authenticated USING (public.fn_user_has_company_access(company_id)) WITH CHECK (public.fn_user_has_company_access(company_id));

CREATE POLICY "costs_select" ON public.project_material_cost_entries FOR SELECT TO authenticated USING (public.fn_user_has_company_access(company_id));
