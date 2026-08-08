# ADR-007: Reservas de Inventário Não Reduzem Stock Físico

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto

O sistema de inventário do ObraMZ precisa de suportar a reserva antecipada de materiais para obras, sem comprometer a contabilização física de stock até ao momento do consumo efetivo.

## Decisão

Uma reserva de inventário (`InventoryReservation`) **reduz `availableQuantity`** mas **NÃO reduz `onHandQuantity`**.

A relação mantida pelo Inventory Engine é:

```
availableQuantity = onHandQuantity - reservedQuantity
```

### Regras

1. `reservedQuantity` é uma dimensão do saldo (`InventoryBalance`), não um estado de stock.
2. O estado de stock `reserved` (em `InventoryStockState`) existe para classificação logística de lotes em cenários específicos, **não** para contabilização dupla com `reservedQuantity`.
3. Uma reserva não gera `StockMovement` — é apenas uma promessa de consumo futuro.
4. O consumo efetivo gera um `StockMovement` do tipo `consumption`, que reduz `onHandQuantity`.
5. A libertação de uma reserva restaura `availableQuantity` sem alterar `onHandQuantity`.

## Alternativas Consideradas

- **Reservas reduzem onHandQuantity imediatamente**: Incorreto para cenários de obras onde o material pode não ser consumido.
- **Sem distinção entre reservado e físico**: Impossibilita pré-planeamento de materiais.

## Consequências

- **Positivas**: Visibilidade clara entre stock físico e stock disponível para novos compromissos.
- **Negativas**: Requer gestão ativa de expiração de reservas para evitar stock bloqueado desnecessariamente.
