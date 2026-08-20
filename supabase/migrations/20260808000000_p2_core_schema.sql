-- ============================================================================
-- ObraMZ — MIGRATION 20260808000000: CORE, AUTH, DOMAIN MASTERS & INVENTORY
-- ============================================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- WAVE 1: CORE / AUTH / MULTI-TENANCY
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  nuit TEXT,
  address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'field_chief', 'clerk')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, user_id)
);

-- ----------------------------------------------------------------------------
-- WAVE 2: DOMAIN MASTERS (MATERIALS FIRST, CLIENTS, SUPPLIERS, PROJECTS, LOCATIONS)
-- ----------------------------------------------------------------------------

-- TABELA CANÓNICA DE MATERIAIS (CRIADA ANTES DE QUALQUER FK material_id)
CREATE TABLE IF NOT EXISTS public.materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  unit TEXT NOT NULL,
  min_stock NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (min_stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  nuit TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  nuit TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  client_id UUID REFERENCES public.clients(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  budget NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (budget >= 0),
  status TEXT NOT NULL DEFAULT 'active',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS public.inventory_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('warehouse', 'project', 'transit')),
  project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

-- ----------------------------------------------------------------------------
-- WAVE 3: COMPRAS, ENTREGAS, BATCHES, BALANCES, MOVIMENTOS E CUSTOS
-- ----------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.purchase_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  order_number TEXT NOT NULL,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  project_id UUID REFERENCES public.projects(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'pending_approval', 'approved', 'sent', 'partially_received', 'received', 'cancelled')),
  subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
  tax_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
  discount_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
  total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
  order_date DATE NOT NULL,
  expected_delivery_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, order_number)
);

CREATE TABLE IF NOT EXISTS public.purchase_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  unit_price NUMERIC(15, 2) NOT NULL CHECK (unit_price >= 0),
  total_price NUMERIC(15, 2) NOT NULL CHECK (total_price >= 0),
  received_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  delivery_number TEXT NOT NULL,
  purchase_order_id UUID NOT NULL REFERENCES public.purchase_orders(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  destination_type TEXT NOT NULL CHECK (destination_type IN ('central_stock', 'project')),
  destination_location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('expected', 'in_transit', 'arrived', 'in_inspection', 'partially_received', 'received', 'received_with_divergence', 'confirmed', 'rejected', 'cancelled')),
  delivery_date DATE NOT NULL,
  received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  document_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, delivery_number)
);

CREATE TABLE IF NOT EXISTS public.delivery_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  purchase_order_item_id UUID NOT NULL REFERENCES public.purchase_order_items(id) ON DELETE RESTRICT,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  ordered_quantity NUMERIC(15, 4) NOT NULL CHECK (ordered_quantity > 0),
  received_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  accepted_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (accepted_quantity >= 0),
  rejected_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
  unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.receipt_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  batch_number TEXT NOT NULL,
  delivery_id UUID NOT NULL REFERENCES public.deliveries(id) ON DELETE RESTRICT,
  idempotency_key TEXT NOT NULL,
  received_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  received_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.receipt_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  batch_id UUID NOT NULL REFERENCES public.receipt_batches(id) ON DELETE CASCADE,
  delivery_item_id UUID NOT NULL REFERENCES public.delivery_items(id) ON DELETE RESTRICT,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  received_quantity NUMERIC(15, 4) NOT NULL CHECK (received_quantity >= 0),
  accepted_quantity NUMERIC(15, 4) NOT NULL CHECK (accepted_quantity >= 0),
  rejected_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (rejected_quantity >= 0),
  rejection_reason TEXT,
  unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- INVENTORY BALANCES (CONSTRAINTS FÍSICAS + DERIVADOS PROTEGIDOS)
CREATE TABLE IF NOT EXISTS public.inventory_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  stock_state TEXT NOT NULL DEFAULT 'available' CHECK (stock_state IN ('available', 'reserved', 'damaged')),
  on_hand_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (on_hand_quantity >= 0),
  reserved_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
  available_quantity NUMERIC(15, 4) GENERATED ALWAYS AS (on_hand_quantity - reserved_quantity) STORED CHECK (available_quantity >= 0),
  average_cost NUMERIC(15, 2) NOT NULL DEFAULT 0 CHECK (average_cost >= 0),
  total_value NUMERIC(15, 2) GENERATED ALWAYS AS (on_hand_quantity * average_cost) STORED CHECK (total_value >= 0),
  version INT NOT NULL DEFAULT 1 CHECK (version >= 1),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(company_id, material_id, location_id, stock_state)
);

-- STOCK MOVEMENTS (LEDGER IMUTÁVEL DE MOVIMENTOS)
CREATE TABLE IF NOT EXISTS public.stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase_receipt', 'project_issue', 'transfer_out', 'transfer_in', 'adjustment')),
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  unit_cost NUMERIC(15, 2) NOT NULL CHECK (unit_cost >= 0),
  total_cost NUMERIC(15, 2) NOT NULL CHECK (total_cost >= 0),
  source_location_id UUID REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  destination_location_id UUID REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  reference_type TEXT,
  reference_id TEXT,
  idempotency_key TEXT NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  reason TEXT,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_source_ne_dest CHECK (source_location_id IS NULL OR destination_location_id IS NULL OR source_location_id <> destination_location_id),
  UNIQUE(company_id, idempotency_key)
);

-- STOCK TRANSFERS (TRANSFERÊNCIAS)
CREATE TABLE IF NOT EXISTS public.stock_transfers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  transfer_number TEXT NOT NULL,
  source_location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  transit_location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  destination_location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  status TEXT NOT NULL CHECK (status IN ('draft', 'dispatched', 'in_transit', 'received', 'closed')),
  idempotency_key TEXT NOT NULL,
  dispatched_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT chk_transfer_locations CHECK (source_location_id <> destination_location_id AND source_location_id <> transit_location_id),
  UNIQUE(company_id, idempotency_key),
  UNIQUE(company_id, transfer_number)
);

CREATE TABLE IF NOT EXISTS public.stock_transfer_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  transfer_id UUID NOT NULL REFERENCES public.stock_transfers(id) ON DELETE CASCADE,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  requested_quantity NUMERIC(15, 4) NOT NULL CHECK (requested_quantity > 0),
  dispatched_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (dispatched_quantity >= 0),
  received_quantity NUMERIC(15, 4) NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CUSTOS DE MATERIAIS DA OBRA (PROJECT MATERIAL COSTS)
CREATE TABLE IF NOT EXISTS public.project_material_cost_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE RESTRICT,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  material_id UUID NOT NULL REFERENCES public.materials(id) ON DELETE RESTRICT,
  quantity NUMERIC(15, 4) NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  unit_cost_at_consumption NUMERIC(15, 2) NOT NULL CHECK (unit_cost_at_consumption >= 0),
  total_cost NUMERIC(15, 2) NOT NULL CHECK (total_cost >= 0),
  phase_id TEXT,
  movement_id UUID NOT NULL REFERENCES public.stock_movements(id) ON DELETE RESTRICT,
  actor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  source_location_id UUID NOT NULL REFERENCES public.inventory_locations(id) ON DELETE RESTRICT,
  consumed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- ÍNDICES DE ALTA PERFORMANCE
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_company_members_user ON public.company_members(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_materials_company_code ON public.materials(company_id, code);
CREATE INDEX IF NOT EXISTS idx_balances_company_mat_loc ON public.inventory_balances(company_id, material_id, location_id);
CREATE INDEX IF NOT EXISTS idx_movements_company_mat_date ON public.stock_movements(company_id, material_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_transfers_company_status ON public.stock_transfers(company_id, status);
CREATE INDEX IF NOT EXISTS idx_project_costs_project ON public.project_material_cost_entries(company_id, project_id);
