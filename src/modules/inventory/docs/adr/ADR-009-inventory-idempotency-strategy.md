# ADR-009: Estratégia de Idempotência do Inventário

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto

Operações de inventário (confirmação de entrega, reserva, transferência, ajuste) podem ser acionadas por eventos de integração que chegam mais de uma vez em cenários de retry, falha de rede ou processamento duplicado. O sistema deve garantir que a mesma operação não é executada duas vezes.

## Decisão

Toda operação de inventário que altera estado persistido **deve incluir uma `idempotencyKey` única por `tenantId + companyId`**.

### Implementação

1. `ProcessedInventoryOperation` regista cada operação processada com `idempotencyKey + status`.
2. Antes de executar qualquer operação, o Engine verifica `IProcessedInventoryOperationRepository.findByIdempotencyKey()`.
3. Se já existir um registo `completed`, retorna o `resultReferenceId` sem reprocessar.
4. Se existir um registo `processing`, aguarda ou retorna conflito.
5. A constraint de unicidade `(tenantId, companyId, idempotencyKey)` é aplicada na base de dados.

### Entidades que exigem idempotencyKey

- `StockMovement` — campo obrigatório
- `InventoryReservation` — campo obrigatório
- `StockTransfer` — campo obrigatório
- `StockAdjustment` — campo obrigatório
- `PhysicalInventoryCount` — campo obrigatório

### Geração de idempotencyKey

Recomendado: `UUIDv4` ou `hash(operationType + referenceType + referenceId + timestamp)`.

## Alternativas Consideradas

- **Sem idempotência**: Inaceitável em sistemas de inventário com eventos assíncronos.
- **Idempotência apenas na camada de API**: Insuficiente — não protege o Engine de chamadas internas duplicadas.

## Consequências

- **Positivas**: Segurança em retries e integrações assíncronas. Comportamento previsível em falhas parciais.
- **Negativas**: Overhead de verificação antes de cada operação. Requer limpeza periódica de `ProcessedInventoryOperation` antigos.
