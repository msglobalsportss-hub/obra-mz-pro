# Modelo de Dados Futuro — Módulo de Inventário ObraMZ

> **Nota**: Este documento é conceptual. Nenhuma migração SQL real é executada nesta fase.
> As tabelas e constraints aqui descritas serão implementadas quando a integração com Supabase for efectuada.

---

## Princípios do Modelo de Dados

- Todas as tabelas incluem `tenant_id` e `company_id` para suporte multi-empresa.
- Entidades históricas (movimentos, auditoria, idempotência) usam **append-only** — sem UPDATE ou DELETE.
- Entidades de suporte usam **soft delete** com campo `is_active` ou `status`.
- Chaves primárias: UUIDs (`uuid` no Supabase).
- Timestamps: `timestamptz` (UTC).

---

## Tabelas

### `inventory_locations`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `tenant_id` | `text` | NOT NULL |
| `company_id` | `text` | NOT NULL |
| `code` | `text` | NOT NULL |
| `name` | `text` | NOT NULL |
| `description` | `text` | NULL |
| `type` | `text` | NOT NULL |
| `project_id` | `text` | NULL |
| `parent_location_id` | `uuid` | FK → `inventory_locations.id` |
| `address` | `text` | NULL |
| `province` | `text` | NULL |
| `city` | `text` | NULL |
| `is_active` | `boolean` | NOT NULL DEFAULT true |
| `is_default` | `boolean` | NOT NULL DEFAULT false |
| `allows_inbound` | `boolean` | NOT NULL DEFAULT true |
| `allows_outbound` | `boolean` | NOT NULL DEFAULT true |
| `allows_reservations` | `boolean` | NOT NULL DEFAULT true |
| `allows_transfers` | `boolean` | NOT NULL DEFAULT true |
| `allows_consumption` | `boolean` | NOT NULL DEFAULT true |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() |
| `updated_at` | `timestamptz` | NOT NULL DEFAULT now() |
| `created_by` | `text` | NULL |
| `updated_by` | `text` | NULL |

**Índices**: `(tenant_id, company_id)`, `(tenant_id, company_id, code) UNIQUE`, `(type)`, `(project_id)`

**Soft Delete**: `is_active = false` (nunca eliminar fisicamente)

---

### `inventory_policies`

| Campo | Tipo | Restrições |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `tenant_id` | `text` | NOT NULL |
| `company_id` | `text` | NOT NULL |
| `material_id` | `text` | NOT NULL |
| `location_id` | `uuid` | NULL, FK → `inventory_locations.id` |
| `minimum_stock` | `numeric` | NULL |
| `maximum_stock` | `numeric` | NULL |
| `reorder_point` | `numeric` | NULL |
| `reorder_quantity` | `numeric` | NULL |
| `allow_negative_stock` | `boolean` | NOT NULL DEFAULT false |
| `reservable` | `boolean` | NOT NULL DEFAULT true |
| `transferable` | `boolean` | NOT NULL DEFAULT true |
| `consumable` | `boolean` | NOT NULL DEFAULT true |
| `requires_batch` | `boolean` | NOT NULL DEFAULT false |
| `requires_expiration_date` | `boolean` | NOT NULL DEFAULT false |
| `costing_method` | `text` | NOT NULL DEFAULT 'weighted_average' |
| `is_active` | `boolean` | NOT NULL DEFAULT true |
| `created_at` | `timestamptz` | NOT NULL |
| `updated_at` | `timestamptz` | NOT NULL |
| `created_by` | `text` | NULL |
| `updated_by` | `text` | NULL |

**Índices**: `(tenant_id, company_id, material_id)`, `(tenant_id, company_id, material_id, location_id) UNIQUE`

---

### `stock_movements` (append-only — imutável)

| Campo | Tipo | Restrições |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `tenant_id` | `text` | NOT NULL |
| `company_id` | `text` | NOT NULL |
| `material_id` | `text` | NOT NULL |
| `movement_type` | `text` | NOT NULL |
| `status` | `text` | NOT NULL |
| `source_location_id` | `uuid` | NULL, FK → `inventory_locations.id` |
| `destination_location_id` | `uuid` | NULL, FK → `inventory_locations.id` |
| `quantity` | `numeric` | NOT NULL CHECK (quantity > 0) |
| `unit_cost` | `numeric` | NULL CHECK (unit_cost >= 0) |
| `total_cost` | `numeric` | NULL |
| `resulting_average_cost` | `numeric` | NULL |
| `stock_state` | `text` | NOT NULL DEFAULT 'available' |
| `batch_id` | `uuid` | NULL, FK → `inventory_batches.id` |
| `expiration_date` | `date` | NULL |
| `reference_type` | `text` | NOT NULL |
| `reference_id` | `text` | NOT NULL |
| `reference_number` | `text` | NULL |
| `correlation_id` | `text` | NOT NULL |
| `causation_id` | `text` | NULL |
| `idempotency_key` | `text` | NOT NULL |
| `occurred_at` | `timestamptz` | NOT NULL |
| `confirmed_at` | `timestamptz` | NULL |
| `created_at` | `timestamptz` | NOT NULL DEFAULT now() |
| `created_by` | `text` | NULL |
| `reversal_of_movement_id` | `uuid` | NULL, FK → `stock_movements.id` |
| `reversed_by_movement_id` | `uuid` | NULL, FK → `stock_movements.id` |
| `metadata` | `jsonb` | NULL |

**Índices**:
- `(tenant_id, company_id, material_id)`
- `(tenant_id, company_id, occurred_at)`
- `(tenant_id, company_id, reference_type, reference_id)`
- `(tenant_id, company_id, idempotency_key) UNIQUE`
- `(material_id, destination_location_id, occurred_at)`
- `(correlation_id)`

**Nota**: Nunca DELETE ou UPDATE em movimentos confirmados. Cancelamentos atualizam apenas `status`.

---

### `inventory_balances` (read model — upsert)

| Campo | Tipo | Restrições |
|-------|------|-----------|
| `id` | `uuid` | PK |
| `tenant_id` | `text` | NOT NULL |
| `company_id` | `text` | NOT NULL |
| `material_id` | `text` | NOT NULL |
| `location_id` | `uuid` | NOT NULL, FK → `inventory_locations.id` |
| `stock_state` | `text` | NOT NULL DEFAULT 'available' |
| `batch_id` | `uuid` | NULL, FK → `inventory_batches.id` |
| `expiration_date` | `date` | NULL |
| `on_hand_quantity` | `numeric` | NOT NULL DEFAULT 0 |
| `reserved_quantity` | `numeric` | NOT NULL DEFAULT 0 |
| `available_quantity` | `numeric` | NOT NULL DEFAULT 0 |
| `average_cost` | `numeric` | NOT NULL DEFAULT 0 |
| `total_value` | `numeric` | NOT NULL DEFAULT 0 |
| `last_movement_id` | `uuid` | NULL, FK → `stock_movements.id` |
| `last_movement_at` | `timestamptz` | NULL |
| `version` | `integer` | NOT NULL DEFAULT 1 |
| `created_at` | `timestamptz` | NOT NULL |
| `updated_at` | `timestamptz` | NOT NULL |

**Constraint de Unicidade** (ADR-006):
```sql
UNIQUE (tenant_id, company_id, material_id, location_id, stock_state,
        COALESCE(batch_id::text, 'no-batch'),
        COALESCE(expiration_date::text, 'no-exp'))
```

**Índices**:
- `(tenant_id, company_id, material_id)`
- `(tenant_id, company_id, location_id)`
- Índice único composto acima

---

### `inventory_reservations`

| Campo | Tipo |
|-------|------|
| `id` | `uuid` PK |
| `tenant_id` | `text` NOT NULL |
| `company_id` | `text` NOT NULL |
| `material_id` | `text` NOT NULL |
| `location_id` | `uuid` FK |
| `project_id` | `text` NULL |
| `quantity` | `numeric` NOT NULL |
| `fulfilled_quantity` | `numeric` NOT NULL DEFAULT 0 |
| `released_quantity` | `numeric` NOT NULL DEFAULT 0 |
| `status` | `text` NOT NULL |
| `reference_type` | `text` NOT NULL |
| `reference_id` | `text` NOT NULL |
| `reference_number` | `text` NULL |
| `required_at` | `timestamptz` NULL |
| `expires_at` | `timestamptz` NULL |
| `correlation_id` | `text` NOT NULL |
| `idempotency_key` | `text` NOT NULL |
| `created_at`, `updated_at`, `confirmed_at`, `completed_at`, `cancelled_at` | `timestamptz` |
| `created_by`, `updated_by` | `text` NULL |
| `cancellation_reason` | `text` NULL |
| `metadata` | `jsonb` NULL |

**Índices**: `(tenant_id, company_id, idempotency_key) UNIQUE`, `(material_id, location_id, status)`, `(reference_type, reference_id)`

---

### `stock_transfers` + `stock_transfer_items`

**`stock_transfers`**: `id`, `tenant_id`, `company_id`, `transfer_number`, `source_location_id`, `destination_location_id`, `status`, timestamps de fluxo, `correlation_id`, `idempotency_key`, `notes`, `cancellation_reason`

**`stock_transfer_items`**: `id`, `transfer_id` (FK), `material_id`, quantidades (requested, approved, dispatched, received), `unit_cost`, `batch_id`, `expiration_date`, `notes`

**Índices**: `(tenant_id, company_id, idempotency_key) UNIQUE` em transfers; `(transfer_id)` em items

---

### `stock_adjustments` + `stock_adjustment_items`

**`stock_adjustments`**: `id`, `tenant_id`, `company_id`, `adjustment_number`, `location_id`, `type`, `status`, `reason_code`, `reason`, timestamps de fluxo, `correlation_id`, `idempotency_key`, `notes`

**`stock_adjustment_items`**: `id`, `adjustment_id` (FK), `material_id`, `system_quantity`, `counted_quantity`, `difference_quantity`, `unit_cost`, `stock_state`, `batch_id`, `expiration_date`, `notes`

**Índices**: `(tenant_id, company_id, idempotency_key) UNIQUE` em adjustments

---

### `physical_inventory_counts` + `physical_inventory_count_items`

**`physical_inventory_counts`**: `id`, `tenant_id`, `company_id`, `count_number`, `location_id`, `status`, `scope`, timestamps, `correlation_id`, `idempotency_key`, `notes`

**`physical_inventory_count_items`**: `id`, `physical_count_id` (FK), `material_id`, `location_id`, `stock_state`, `batch_id`, `expiration_date`, `expected_quantity`, `counted_quantity`, `difference_quantity`, `counted_at`, `counted_by`, `notes`

---

### `inventory_batches`

| Campo | Tipo |
|-------|------|
| `id` | `uuid` PK |
| `tenant_id`, `company_id` | `text` NOT NULL |
| `material_id` | `text` NOT NULL |
| `batch_number` | `text` NOT NULL |
| `supplier_batch_number` | `text` NULL |
| `manufactured_at`, `received_at`, `expiration_date` | `timestamptz`/`date` NULL |
| `status` | `text` NOT NULL |
| `supplier_id` | `text` NULL |
| `delivery_id` | `text` NULL |
| `notes` | `text` NULL |
| `created_at`, `updated_at` | `timestamptz` |

**Índices**: `(tenant_id, company_id, material_id, batch_number) UNIQUE`, `(expiration_date)`, `(status)`

---

### `inventory_audit_logs` (append-only)

| Campo | Tipo |
|-------|------|
| `id` | `uuid` PK |
| `tenant_id`, `company_id` | `text` NOT NULL |
| `entity_type` | `text` NOT NULL |
| `entity_id` | `text` NOT NULL |
| `action` | `text` NOT NULL |
| `actor_id` | `text` NULL |
| `correlation_id`, `causation_id` | `text` NULL |
| `reference_type`, `reference_id` | `text` NULL |
| `occurred_at` | `timestamptz` NOT NULL |
| `previous_state`, `next_state`, `metadata` | `jsonb` NULL |

**Índices**: `(tenant_id, company_id, entity_type, entity_id)`, `(occurred_at)`, `(correlation_id)`

---

### `processed_inventory_operations` (append-only)

| Campo | Tipo |
|-------|------|
| `id` | `uuid` PK |
| `tenant_id`, `company_id` | `text` NOT NULL |
| `idempotency_key` | `text` NOT NULL |
| `operation_type` | `text` NOT NULL |
| `reference_type`, `reference_id` | `text` NULL |
| `correlation_id` | `text` NULL |
| `status` | `text` NOT NULL |
| `result_reference_id` | `text` NULL |
| `failure_code`, `failure_message` | `text` NULL |
| `processed_at`, `created_at` | `timestamptz` NOT NULL |

**Constraint de Unicidade (ADR-009)**:
```sql
UNIQUE (tenant_id, company_id, idempotency_key)
```

---

## Notas sobre supplier_direct

A classificação `supplier_direct` é **apenas logística** e não cria uma tabela separada.
Quando a entrega é `supplier_direct`, o campo `destination_location_id` do movimento aponta
para uma localização do tipo `project`, não para uma localização de fornecedor.
O Engine garante que nenhum saldo é criado sem localização de destino válida.

---

## Campos que necessitam de migração futura

Os seguintes dados existentes precisarão de migração quando a persistência for implementada:

| Dado Existente | Destino Futuro |
|----------------|---------------|
| `InventoryBalance` (Fase 6.3) com `locationType: "central_stock"` | `inventory_balances` com `location_id` apontando para `main_warehouse` |
| `InventoryBalance` com `locationType: "project"` | `inventory_balances` com `location_id` apontando para localização `project` |
| `StockMovement` (Fase 6.3) com `destinationLocationType` | `stock_movements` com `destination_location_id` |
| Materiais existentes | Referenciados por `material_id` (string) — sem migração de entidade |
| Compras e Entregas existentes | Referenciadas por `reference_type: "purchase_order"` e `"delivery"` |
| `Custos históricos` | `average_cost` reconstruível a partir dos movimentos |

---

## Future Database Evolution

### 1. Estratégia de Índices Avançada
- **Índices compostos parciais**: `stock_movements` filtrados por `status = 'confirmed'` para acelerar o recálculo de saldos.
- **Índices BRIN / TimescaleDB**: `occurred_at` em `stock_movements` e `inventory_audit_logs` para dados temporais de elevado volume.
- **Índices GIN sobre `metadata`**: Para pesquisas aceleradas por campos personalizados de integração em JSONB.

### 2. Arquivamento de Auditoria e Retenção de Histórico
- Movimentos com mais de 5 anos podem ser movidos para armazenamento frio (ex: Supabase Storage / Parquet S3) mantendo agregados mensais.
- `inventory_audit_logs` arquivados anualmente por `tenant_id` e `occurred_at`.
- `processed_inventory_operations` expurgados com retenção de 90 dias após conclusão bem-sucedida.

### 3. Crescimento Esperado e Particionamento (Partitioning)
- Particionamento por intervalo temporal (`RANGE` em `occurred_at`) na tabela `stock_movements` (mensal ou anual).
- Particionamento por lista (`LIST` em `tenant_id`) para isolamento de clientes Enterprise de grande porte.

### 4. Multi-empresa em Larga Escala (Multi-tenancy Scaling)
- Row Level Security (RLS) no Supabase forçando o isolamento automático por `tenant_id` e `company_id`.
- Suporte nativo a réplicas de leitura para relatórios e análises de inventário em tempo real.

### 5. Sincronização Offline e Observabilidade
- `requestId` e `traceId` no `InventoryTransactionContext` propagados para a base de dados.
- Suporte a sincronização bidirecional por cliente local (ex: PWA de obra offline) utilizando `idempotency_key` para reconciliação diferida.

### 6. Event Sourcing Compatibility
- **Imutabilidade Nativa**: A tabela `stock_movements` funciona como um *Event Store* imutável de todas as alterações físicas e contabilísticas.
- **Projeções Derivadas**: A tabela `inventory_balances` é uma projeção (Read Model) inteiramente reconstruível a partir do histórico de `stock_movements`.
- **Evolução Transparente**: A arquitetura do domínio está preparada para evoluir para uma infraestrutura completa baseada em Event Sourcing sem necessidade de alterar as entidades do domínio, as interfaces dos repositórios ou a API pública.
