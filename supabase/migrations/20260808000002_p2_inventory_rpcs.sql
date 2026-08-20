-- ============================================================================
-- ObraMZ — MIGRATION 20260808000002: ATOMIC ZERO-TRUST PL/PGSQL RPCS (COMPLETO)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. RPC RECEIPT BATCH (ZERO TRUST, BLOQUEIO OVER-RECEIPT, RECONCILIAÇÃO PO)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_process_receipt_batch(
  p_company_id UUID,
  p_delivery_id UUID,
  p_idempotency_key TEXT,
  p_notes TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_delivery RECORD;
  v_batch_id UUID;
  v_existing_batch RECORD;
  v_item_input RECORD;
  v_delivery_item RECORD;
  v_accepted_qty NUMERIC;
  v_rejected_qty NUMERIC;
  v_derived_material_id UUID;
  v_authorized_unit_cost NUMERIC;
  v_balance RECORD;
  v_new_on_hand NUMERIC;
  v_new_wac NUMERIC;
  v_mov_id UUID;
  v_movement_ids UUID[] := ARRAY[]::UUID[];
  v_has_rejected_items BOOLEAN := false;
  v_all_items_fulfilled BOOLEAN := true;
  v_po_id UUID;
  v_po_has_any_receipt BOOLEAN := false;
  v_po_all_fulfilled BOOLEAN := true;
  v_new_delivery_status TEXT;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;

  SELECT tenant_id INTO v_tenant_id FROM public.company_members
  WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';

  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada %', p_company_id USING ERRCODE = '42501'; END IF;

  SELECT id, created_at INTO v_existing_batch FROM public.receipt_batches
  WHERE company_id = p_company_id AND idempotency_key = p_idempotency_key;

  IF v_existing_batch.id IS NOT NULL THEN
    RETURN jsonb_build_object('status', 'replayed', 'batchId', v_existing_batch.id, 'createdAt', v_existing_batch.created_at);
  END IF;

  SELECT * INTO v_delivery FROM public.deliveries WHERE id = p_delivery_id AND company_id = p_company_id FOR UPDATE;
  IF v_delivery.id IS NULL THEN RAISE EXCEPTION 'Entrega não encontrada no contexto da empresa' USING ERRCODE = '42501'; END IF;
  IF v_delivery.status = 'confirmed' THEN RETURN jsonb_build_object('status', 'replayed', 'message', 'Entrega já se encontra confirmada.'); END IF;

  v_po_id := v_delivery.purchase_order_id;

  INSERT INTO public.receipt_batches (tenant_id, company_id, batch_number, delivery_id, idempotency_key, received_by, notes)
  VALUES (v_tenant_id, p_company_id, 'BATCH-' || gen_random_uuid(), p_delivery_id, p_idempotency_key, v_user_id, p_notes)
  RETURNING id INTO v_batch_id;

  FOR v_item_input IN SELECT * FROM jsonb_to_recordset(p_items) AS x(deliveryItemId UUID, acceptedQuantity NUMERIC, rejectedQuantity NUMERIC, rejectionReason TEXT) LOOP
    v_accepted_qty := COALESCE(v_item_input.acceptedQuantity, 0);
    v_rejected_qty := COALESCE(v_item_input.rejectedQuantity, 0);

    IF v_accepted_qty < 0 OR v_rejected_qty < 0 THEN RAISE EXCEPTION 'Quantidades não podem ser negativas' USING ERRCODE = '22003'; END IF;
    IF (v_accepted_qty + v_rejected_qty) = 0 THEN CONTINUE; END IF;

    SELECT di.*, poi.unit_price AS authorized_unit_cost INTO v_delivery_item
    FROM public.delivery_items di JOIN public.purchase_order_items poi ON poi.id = di.purchase_order_item_id
    WHERE di.id = v_item_input.deliveryItemId AND di.delivery_id = p_delivery_id AND di.company_id = p_company_id FOR UPDATE OF di;

    IF v_delivery_item.id IS NULL THEN RAISE EXCEPTION 'Item de entrega % inválido', v_item_input.deliveryItemId USING ERRCODE = '42501'; END IF;

    v_derived_material_id := v_delivery_item.material_id;
    v_authorized_unit_cost := v_delivery_item.authorized_unit_cost;

    IF (v_delivery_item.received_quantity + v_accepted_qty + v_rejected_qty) > v_delivery_item.ordered_quantity THEN
      RAISE EXCEPTION 'Receção excede a quantidade autorizada na Entrega' USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.receipt_batch_items (tenant_id, company_id, batch_id, delivery_item_id, material_id, received_quantity, accepted_quantity, rejected_quantity, rejection_reason, unit_cost)
    VALUES (v_tenant_id, p_company_id, v_batch_id, v_delivery_item.id, v_derived_material_id, (v_accepted_qty + v_rejected_qty), v_accepted_qty, v_rejected_qty, v_item_input.rejectionReason, v_authorized_unit_cost);

    IF v_accepted_qty > 0 THEN
      INSERT INTO public.inventory_balances (tenant_id, company_id, material_id, location_id, stock_state, on_hand_quantity, reserved_quantity, average_cost, version)
      VALUES (v_tenant_id, p_company_id, v_derived_material_id, v_delivery.destination_location_id, 'available', 0, 0, 0, 1)
      ON CONFLICT (company_id, material_id, location_id, stock_state) DO NOTHING;

      SELECT * INTO v_balance FROM public.inventory_balances
      WHERE company_id = p_company_id AND material_id = v_derived_material_id AND location_id = v_delivery.destination_location_id AND stock_state = 'available' FOR UPDATE;

      v_new_on_hand := v_balance.on_hand_quantity + v_accepted_qty;
      v_new_wac := ((v_balance.on_hand_quantity * v_balance.average_cost) + (v_accepted_qty * v_authorized_unit_cost)) / v_new_on_hand;

      UPDATE public.inventory_balances SET on_hand_quantity = v_new_on_hand, average_cost = v_new_wac, version = version + 1, updated_at = now() WHERE id = v_balance.id;

      INSERT INTO public.stock_movements (tenant_id, company_id, material_id, movement_type, status, quantity, unit_cost, total_cost, destination_location_id, reference_type, reference_id, idempotency_key, performed_by)
      VALUES (v_tenant_id, p_company_id, v_derived_material_id, 'purchase_receipt', 'confirmed', v_accepted_qty, v_authorized_unit_cost, (v_accepted_qty * v_authorized_unit_cost), v_delivery.destination_location_id, 'receipt_batch', v_batch_id::text, (p_idempotency_key || ':' || v_derived_material_id), v_user_id)
      RETURNING id INTO v_mov_id;

      v_movement_ids := array_append(v_movement_ids, v_mov_id);
    END IF;

    UPDATE public.delivery_items SET received_quantity = received_quantity + (v_accepted_qty + v_rejected_qty), accepted_quantity = accepted_quantity + v_accepted_qty, rejected_quantity = rejected_quantity + v_rejected_qty, updated_at = now() WHERE id = v_delivery_item.id;
    UPDATE public.purchase_order_items SET received_quantity = received_quantity + v_accepted_qty, updated_at = now() WHERE id = v_delivery_item.purchase_order_item_id;
  END LOOP;

  SELECT EXISTS (SELECT 1 FROM public.delivery_items WHERE delivery_id = p_delivery_id AND rejected_quantity > 0), NOT EXISTS (SELECT 1 FROM public.delivery_items WHERE delivery_id = p_delivery_id AND received_quantity < ordered_quantity) INTO v_has_rejected_items, v_all_items_fulfilled;
  v_new_delivery_status := CASE WHEN v_all_items_fulfilled AND v_has_rejected_items THEN 'received_with_divergence' WHEN v_all_items_fulfilled THEN 'received' ELSE 'partially_received' END;

  UPDATE public.deliveries SET status = v_new_delivery_status, updated_at = now() WHERE id = p_delivery_id;

  SELECT EXISTS (SELECT 1 FROM public.purchase_order_items WHERE purchase_order_id = v_po_id AND received_quantity > 0), NOT EXISTS (SELECT 1 FROM public.purchase_order_items WHERE purchase_order_id = v_po_id AND received_quantity < quantity) INTO v_po_has_any_receipt, v_po_all_fulfilled;
  UPDATE public.purchase_orders SET status = CASE WHEN v_po_all_fulfilled THEN 'received' WHEN v_po_has_any_receipt THEN 'partially_received' ELSE status END, updated_at = now() WHERE id = v_po_id;

  RETURN jsonb_build_object('status', 'completed', 'batchId', v_batch_id, 'movementIds', v_movement_ids, 'deliveryStatus', v_new_delivery_status);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. RPC DISPATCH STOCK TRANSFER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_dispatch_stock_transfer(
  p_company_id UUID,
  p_transfer_id UUID,
  p_idempotency_key TEXT,
  p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_transfer RECORD;
  v_item_input RECORD;
  v_material_id UUID;
  v_qty NUMERIC;
  v_src_bal RECORD;
  v_trf_mov_id UUID;
  v_movement_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;

  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_transfer FROM public.stock_transfers WHERE id = p_transfer_id AND company_id = p_company_id FOR UPDATE;
  IF v_transfer.id IS NULL THEN RAISE EXCEPTION 'Transferência não encontrada'; END IF;

  FOR v_item_input IN SELECT * FROM jsonb_to_recordset(p_items) AS x(materialId UUID, quantity NUMERIC) LOOP
    v_material_id := v_item_input.materialId;
    v_qty := v_item_input.quantity;
    IF v_qty <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero'; END IF;

    SELECT * INTO v_src_bal FROM public.inventory_balances WHERE company_id = p_company_id AND material_id = v_material_id AND location_id = v_transfer.source_location_id AND stock_state = 'available' FOR UPDATE;
    IF v_src_bal.id IS NULL OR v_src_bal.available_quantity < v_qty THEN RAISE EXCEPTION 'Stock insuficiente na origem'; END IF;

    UPDATE public.inventory_balances SET on_hand_quantity = on_hand_quantity - v_qty, version = version + 1, updated_at = now() WHERE id = v_src_bal.id;

    INSERT INTO public.inventory_balances (tenant_id, company_id, material_id, location_id, stock_state, on_hand_quantity, reserved_quantity, average_cost, version)
    VALUES (v_tenant_id, p_company_id, v_material_id, v_transfer.transit_location_id, 'available', v_qty, 0, v_src_bal.average_cost, 1)
    ON CONFLICT (company_id, material_id, location_id, stock_state)
    DO UPDATE SET on_hand_quantity = inventory_balances.on_hand_quantity + v_qty, version = inventory_balances.version + 1, updated_at = now();

    INSERT INTO public.stock_movements (tenant_id, company_id, material_id, movement_type, status, quantity, unit_cost, total_cost, source_location_id, destination_location_id, reference_type, reference_id, idempotency_key, performed_by)
    VALUES (v_tenant_id, p_company_id, v_material_id, 'transfer_out', 'confirmed', v_qty, v_src_bal.average_cost, (v_qty * v_src_bal.average_cost), v_transfer.source_location_id, v_transfer.transit_location_id, 'stock_transfer', p_transfer_id::text, (p_idempotency_key || ':' || v_material_id), v_user_id)
    RETURNING id INTO v_trf_mov_id;

    v_movement_ids := array_append(v_movement_ids, v_trf_mov_id);
  END LOOP;

  UPDATE public.stock_transfers SET status = 'in_transit', dispatched_at = now(), updated_at = now() WHERE id = p_transfer_id;
  RETURN jsonb_build_object('status', 'completed', 'transferId', p_transfer_id, 'movementIds', v_movement_ids);
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. RPC CONFIRM STOCK TRANSFER RECEIPT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_confirm_stock_transfer_receipt(
  p_company_id UUID,
  p_transfer_id UUID,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_transfer RECORD;
  v_trf_item RECORD;
  v_trst_bal RECORD;
  v_mov_id UUID;
  v_movement_ids UUID[] := ARRAY[]::UUID[];
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;
  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_transfer FROM public.stock_transfers WHERE id = p_transfer_id AND company_id = p_company_id FOR UPDATE;
  IF v_transfer.id IS NULL THEN RAISE EXCEPTION 'Transferência não encontrada'; END IF;
  IF v_transfer.status = 'received' OR v_transfer.status = 'closed' THEN RETURN jsonb_build_object('status', 'replayed'); END IF;

  FOR v_trf_item IN SELECT * FROM public.stock_transfer_items WHERE transfer_id = p_transfer_id AND company_id = p_company_id LOOP
    SELECT * INTO v_trst_bal FROM public.inventory_balances WHERE company_id = p_company_id AND material_id = v_trf_item.material_id AND location_id = v_transfer.transit_location_id AND stock_state = 'available' FOR UPDATE;

    IF v_trst_bal.id IS NOT NULL AND v_trst_bal.on_hand_quantity > 0 THEN
      UPDATE public.inventory_balances SET on_hand_quantity = on_hand_quantity - v_trf_item.dispatched_quantity, version = version + 1, updated_at = now() WHERE id = v_trst_bal.id;

      INSERT INTO public.inventory_balances (tenant_id, company_id, material_id, location_id, stock_state, on_hand_quantity, reserved_quantity, average_cost, version)
      VALUES (v_tenant_id, p_company_id, v_trf_item.material_id, v_transfer.destination_location_id, 'available', v_trf_item.dispatched_quantity, 0, v_trst_bal.average_cost, 1)
      ON CONFLICT (company_id, material_id, location_id, stock_state)
      DO UPDATE SET on_hand_quantity = inventory_balances.on_hand_quantity + v_trf_item.dispatched_quantity, version = inventory_balances.version + 1, updated_at = now();

      INSERT INTO public.stock_movements (tenant_id, company_id, material_id, movement_type, status, quantity, unit_cost, total_cost, source_location_id, destination_location_id, reference_type, reference_id, idempotency_key, performed_by)
      VALUES (v_tenant_id, p_company_id, v_trf_item.material_id, 'transfer_in', 'confirmed', v_trf_item.dispatched_quantity, v_trst_bal.average_cost, (v_trf_item.dispatched_quantity * v_trst_bal.average_cost), v_transfer.transit_location_id, v_transfer.destination_location_id, 'stock_transfer', p_transfer_id::text, (p_idempotency_key || ':' || v_trf_item.material_id), v_user_id)
      RETURNING id INTO v_mov_id;

      v_movement_ids := array_append(v_movement_ids, v_mov_id);
    END IF;

    UPDATE public.stock_transfer_items SET received_quantity = dispatched_quantity WHERE id = v_trf_item.id;
  END LOOP;

  UPDATE public.stock_transfers SET status = 'received', received_at = now(), updated_at = now() WHERE id = p_transfer_id;
  RETURN jsonb_build_object('status', 'completed', 'transferId', p_transfer_id, 'movementIds', v_movement_ids);
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. RPC CONSUMO DE MATERIAIS EM OBRA (PROJECT MATERIAL CONSUMPTION)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_record_project_material_consumption(
  p_company_id UUID,
  p_project_id UUID,
  p_material_id UUID,
  p_source_location_id UUID,
  p_quantity NUMERIC,
  p_phase_id TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_balance RECORD;
  v_material RECORD;
  v_unit_cost NUMERIC;
  v_total_cost NUMERIC;
  v_mov_id UUID;
  v_entry_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;
  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;
  IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantidade deve ser maior que zero' USING ERRCODE = '22003'; END IF;

  SELECT unit INTO v_material FROM public.materials WHERE id = p_material_id AND company_id = p_company_id;
  IF v_material.unit IS NULL THEN RAISE EXCEPTION 'Material não encontrado'; END IF;

  SELECT * INTO v_balance FROM public.inventory_balances WHERE company_id = p_company_id AND material_id = p_material_id AND location_id = p_source_location_id AND stock_state = 'available' FOR UPDATE;
  IF v_balance.id IS NULL OR v_balance.available_quantity < p_quantity THEN RAISE EXCEPTION 'Stock insuficiente na obra para registar consumo'; END IF;

  v_unit_cost := v_balance.average_cost;
  v_total_cost := p_quantity * v_unit_cost;

  UPDATE public.inventory_balances SET on_hand_quantity = on_hand_quantity - p_quantity, version = version + 1, updated_at = now() WHERE id = v_balance.id;

  INSERT INTO public.stock_movements (tenant_id, company_id, material_id, movement_type, status, quantity, unit_cost, total_cost, source_location_id, reference_type, reference_id, idempotency_key, performed_by)
  VALUES (v_tenant_id, p_company_id, p_material_id, 'project_issue', 'confirmed', p_quantity, v_unit_cost, v_total_cost, p_source_location_id, 'project_cost', p_project_id::text, p_idempotency_key, v_user_id)
  RETURNING id INTO v_mov_id;

  INSERT INTO public.project_material_cost_entries (tenant_id, company_id, project_id, material_id, quantity, unit, unit_cost_at_consumption, total_cost, phase_id, movement_id, actor_id, source_location_id)
  VALUES (v_tenant_id, p_company_id, p_project_id, p_material_id, p_quantity, v_material.unit, v_unit_cost, v_total_cost, p_phase_id, v_mov_id, v_user_id, p_source_location_id)
  RETURNING id INTO v_entry_id;

  RETURN jsonb_build_object('status', 'completed', 'entryId', v_entry_id, 'movementId', v_mov_id, 'totalCost', v_total_cost);
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. RPC RESERVE STOCK (RESERVA DE STOCK COM LOCK E IMPEDIMENTO RESERVED > ON_HAND)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_reserve_stock(
  p_company_id UUID,
  p_material_id UUID,
  p_location_id UUID,
  p_quantity NUMERIC,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_balance RECORD;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;
  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;
  IF p_quantity <= 0 THEN RAISE EXCEPTION 'Quantidade de reserva deve ser positiva' USING ERRCODE = '22003'; END IF;

  SELECT * INTO v_balance FROM public.inventory_balances
  WHERE company_id = p_company_id AND material_id = p_material_id AND location_id = p_location_id AND stock_state = 'available'
  FOR UPDATE;

  IF v_balance.id IS NULL THEN RAISE EXCEPTION 'Saldo não encontrado para reserva'; END IF;
  IF (v_balance.reserved_quantity + p_quantity) > v_balance.on_hand_quantity THEN
    RAISE EXCEPTION 'Reserva excede o saldo físico em mão (on_hand_quantity)' USING ERRCODE = '23514';
  END IF;

  UPDATE public.inventory_balances
  SET reserved_quantity = reserved_quantity + p_quantity, version = version + 1, updated_at = now()
  WHERE id = v_balance.id;

  RETURN jsonb_build_object('status', 'completed', 'reservedQuantity', v_balance.reserved_quantity + p_quantity);
END;
$$;

-- ----------------------------------------------------------------------------
-- 6. RPC RELEASE RESERVATION (LIBERTAÇÃO DE RESERVA)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_release_reservation(
  p_company_id UUID,
  p_material_id UUID,
  p_location_id UUID,
  p_quantity NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_balance RECORD;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;
  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_balance FROM public.inventory_balances
  WHERE company_id = p_company_id AND material_id = p_material_id AND location_id = p_location_id AND stock_state = 'available' FOR UPDATE;

  IF v_balance.id IS NULL OR v_balance.reserved_quantity < p_quantity THEN
    RAISE EXCEPTION 'Quantidade de libertação excede o valor reservado';
  END IF;

  UPDATE public.inventory_balances
  SET reserved_quantity = reserved_quantity - p_quantity, version = version + 1, updated_at = now()
  WHERE id = v_balance.id;

  RETURN jsonb_build_object('status', 'completed', 'reservedQuantity', v_balance.reserved_quantity - p_quantity);
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. RPC CONSUME RESERVATION (CONSUMO DE RESERVA COM DEDUÇÃO FÍSICA E MOVEMENT)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_consume_reservation(
  p_company_id UUID,
  p_material_id UUID,
  p_location_id UUID,
  p_quantity NUMERIC,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_balance RECORD;
  v_mov_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;
  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_balance FROM public.inventory_balances
  WHERE company_id = p_company_id AND material_id = p_material_id AND location_id = p_location_id AND stock_state = 'available' FOR UPDATE;

  IF v_balance.id IS NULL OR v_balance.reserved_quantity < p_quantity OR v_balance.on_hand_quantity < p_quantity THEN
    RAISE EXCEPTION 'Reserva ou saldo físico insuficiente para consumo';
  END IF;

  UPDATE public.inventory_balances
  SET on_hand_quantity = on_hand_quantity - p_quantity,
      reserved_quantity = reserved_quantity - p_quantity,
      version = version + 1,
      updated_at = now()
  WHERE id = v_balance.id;

  INSERT INTO public.stock_movements (tenant_id, company_id, material_id, movement_type, status, quantity, unit_cost, total_cost, source_location_id, reference_type, reference_id, idempotency_key, performed_by)
  VALUES (v_tenant_id, p_company_id, p_material_id, 'project_issue', 'confirmed', p_quantity, v_balance.average_cost, (p_quantity * v_balance.average_cost), p_location_id, 'reservation_consume', p_idempotency_key, p_idempotency_key, v_user_id)
  RETURNING id INTO v_mov_id;

  RETURN jsonb_build_object('status', 'completed', 'movementId', v_mov_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. RPC ADJUST STOCK (AJUSTE FÍSICO COM GERAÇÃO PRIVILEGIADA DE MOVEMENT)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_adjust_stock(
  p_company_id UUID,
  p_material_id UUID,
  p_location_id UUID,
  p_new_quantity NUMERIC,
  p_reason TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_balance RECORD;
  v_diff NUMERIC;
  v_mov_type TEXT;
  v_mov_id UUID;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;
  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;
  IF p_new_quantity < 0 THEN RAISE EXCEPTION 'Quantidade de ajuste não pode ser negativa' USING ERRCODE = '22003'; END IF;

  INSERT INTO public.inventory_balances (tenant_id, company_id, material_id, location_id, stock_state, on_hand_quantity, reserved_quantity, average_cost, version)
  VALUES (v_tenant_id, p_company_id, p_material_id, p_location_id, 'available', 0, 0, 0, 1)
  ON CONFLICT (company_id, material_id, location_id, stock_state) DO NOTHING;

  SELECT * INTO v_balance FROM public.inventory_balances
  WHERE company_id = p_company_id AND material_id = p_material_id AND location_id = p_location_id AND stock_state = 'available' FOR UPDATE;

  v_diff := p_new_quantity - v_balance.on_hand_quantity;
  IF v_diff = 0 THEN RETURN jsonb_build_object('status', 'no_change'); END IF;

  UPDATE public.inventory_balances
  SET on_hand_quantity = p_new_quantity, version = version + 1, updated_at = now()
  WHERE id = v_balance.id;

  INSERT INTO public.stock_movements (tenant_id, company_id, material_id, movement_type, status, quantity, unit_cost, total_cost, destination_location_id, reference_type, reference_id, idempotency_key, performed_by, reason)
  VALUES (v_tenant_id, p_company_id, p_material_id, 'adjustment', 'confirmed', ABS(v_diff), v_balance.average_cost, (ABS(v_diff) * v_balance.average_cost), p_location_id, 'manual_adjustment', p_idempotency_key, p_idempotency_key, v_user_id, p_reason)
  RETURNING id INTO v_mov_id;

  RETURN jsonb_build_object('status', 'completed', 'newQuantity', p_new_quantity, 'movementId', v_mov_id);
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. RPC REVERSE MOVEMENT (ESTORNO AUDITÁVEL COM MOVEMENT REVERSAL PRIVILEGIADO)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.rpc_reverse_movement(
  p_company_id UUID,
  p_movement_id UUID,
  p_reason TEXT,
  p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_tenant_id UUID;
  v_target_mov RECORD;
  v_rev_mov_id UUID;
  v_balance RECORD;
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Utilizador não autenticado' USING ERRCODE = '42501'; END IF;
  SELECT tenant_id INTO v_tenant_id FROM public.company_members WHERE user_id = v_user_id AND company_id = p_company_id AND status = 'active';
  IF v_tenant_id IS NULL THEN RAISE EXCEPTION 'Acesso não autorizado para a empresa especificada' USING ERRCODE = '42501'; END IF;

  SELECT * INTO v_target_mov FROM public.stock_movements WHERE id = p_movement_id AND company_id = p_company_id FOR UPDATE;
  IF v_target_mov.id IS NULL THEN RAISE EXCEPTION 'Movimento a estornar não encontrado'; END IF;
  IF v_target_mov.status = 'cancelled' THEN RAISE EXCEPTION 'Movimento já se encontra cancelado ou estornado'; END IF;

  UPDATE public.stock_movements SET status = 'cancelled' WHERE id = p_movement_id;

  IF v_target_mov.destination_location_id IS NOT NULL THEN
    SELECT * INTO v_balance FROM public.inventory_balances
    WHERE company_id = p_company_id AND material_id = v_target_mov.material_id AND location_id = v_target_mov.destination_location_id AND stock_state = 'available' FOR UPDATE;

    IF v_balance.id IS NOT NULL THEN
      UPDATE public.inventory_balances SET on_hand_quantity = GREATEST(0, on_hand_quantity - v_target_mov.quantity), version = version + 1, updated_at = now() WHERE id = v_balance.id;
    END IF;
  END IF;

  INSERT INTO public.stock_movements (tenant_id, company_id, material_id, movement_type, status, quantity, unit_cost, total_cost, source_location_id, destination_location_id, reference_type, reference_id, idempotency_key, performed_by, reason)
  VALUES (v_tenant_id, p_company_id, v_target_mov.material_id, 'adjustment', 'confirmed', v_target_mov.quantity, v_target_mov.unit_cost, v_target_mov.total_cost, v_target_mov.destination_location_id, v_target_mov.source_location_id, 'reversal', p_movement_id::text, p_idempotency_key, v_user_id, p_reason)
  RETURNING id INTO v_rev_mov_id;

  RETURN jsonb_build_object('status', 'completed', 'reversedMovementId', p_movement_id, 'reversalMovementId', v_rev_mov_id);
END;
$$;
