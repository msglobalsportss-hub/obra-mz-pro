# ADR-005: Integração Orientada a Eventos (Event-Driven Integration)

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto
O módulo de Inventário reage a ações iniciadas em múltiplos módulos (ex: Recepção de Entregas em Compras, Requisições em Obras, Faturação no Financeiro) e notifica o ERP de alterações relevantes de stock.

## Decisão
1. Adotar uma arquitetura de integração orientada a eventos (*Event-Driven Architecture*), distinguindo:
   - **Domain Events**: Eventos internos ao domínio de inventário (`StockMovementCreated`, `InventoryBalanceChanged`, `StockReserved`, etc.).
   - **Integration Events**: Eventos de integração entre módulos (`DeliveryConfirmed`, `PurchaseOrderApproved`, `ConsumptionRegistered`, `InventoryTransferCompleted`).
2. Todos os eventos contêm metadados estandardizados: `eventId`, `eventType`, `occurredAt`, `correlationId`, `causationId`, `tenantId`, `idempotencyKey`, `referenceType`, `referenceId`, e `version`.
3. Os contratos devem prever idempotência e rastreabilidade multi-tenant (`tenantId`, `companyId`).

## Consequências
- **Positivas**: Desacoplamento assíncrono entre módulos, suporte a audit trail distribuído e preparação nativa para sincronização offline e integração cloud/mobile.
- **Negativas**: Requer a manutenção rigorosa do esquema de metadados dos eventos.
