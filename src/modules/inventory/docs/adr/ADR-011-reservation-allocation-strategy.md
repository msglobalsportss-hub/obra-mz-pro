# ADR-011: Estratégia de Alocação de Reservas (Reservation Allocation Strategy)

- **Estado**: Aprovado (Preparação Arquitetural)
- **Data**: 2026-07-28

## Contexto

À medida que o módulo de Inventário do ObraMZ evoluir para além da Fase 2A/2B, as reservas de materiais (`InventoryReservation`) precisarão de suportar cenários avançados de alocação física e logística. Uma única reserva para uma obra pode necessitar de ser satisfeita por materiais distribuídos por diferentes lotes, localizações físicas, contentores ou classificações de stock.

## Decisão

A alocação física de uma reserva será gerida futuramente por uma entidade dedicada denominada **`InventoryReservationAllocation`**.

### Princípios de Alocação Futura

1. **Múltiplos Lotes**: Uma única reserva poderá ser satisfeita por frações de vários lotes (`InventoryBatch`).
2. **Múltiplas Localizações**: Uma reserva poderá capturar stock disponível em mais do que uma localização (`InventoryLocation`).
3. **Múltiplos Contentores / Áreas**: Suporte a subdivisões logísticas (contentores, baías, prateleiras).
4. **Múltiplos Estados de Stock**: Alocação permitida em diferentes classificações válidas de stock.

### Independência entre Alocação e Custeio (Regra Crítica)

> **Regra Arquitetural**: A estratégia de alocação de reservas é **totalmente independente** da estratégia de custeio (FIFO, Custo Médio Ponderado / Average Cost, FEFO, LIFO).

- A **alocação** decide *de onde* e *de que lotes* o material físico é reservado ou retirado.
- O **custeio** decide *como o valor financeiro* é calculado no momento da movimentação.
- Ambas as estratégias não estão acopladas na arquitetura do domínio.

## Entidade Futura (Não Implementada nesta Fase)

```typescript
// Conceito conceptual — NÃO implementado na Fase 2A/2B
export interface InventoryReservationAllocation {
  id: string;
  reservationId: string;
  materialId: string;
  locationId: string;
  batchId?: string;
  quantity: number;
  allocatedAt: string;
}
```

## Consequências

- **Positivas**: Domínio preparado para rastreabilidade logística avançada sem acoplamento financeiro. Flexibilidade total para alocação em múltiplos pontos de distribuição.
- **Negativas**: Nenhuma nesta fase (preparação apenas conceptual e de documentação).
