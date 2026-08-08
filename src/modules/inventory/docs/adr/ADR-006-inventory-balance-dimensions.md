# ADR-006: Dimensões da Chave de Saldo de Inventário

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto

O saldo de inventário (`InventoryBalance`) é um read model que agrega o stock de um material numa dimensão específica. Na Fase 1, a chave de saldo era composta apenas por `materialId + locationType + projectId`, o que é insuficiente para suportar múltiplos estados de stock (danificado, em inspeção, disponível) e rastreabilidade por lote e validade.

## Decisão

A chave lógica de um `InventoryBalance` deve considerar **todas** as seguintes dimensões:

```
tenantId + companyId + materialId + locationId + stockState + batchId? + expirationDate?
```

### Implicações

- `stockState` permite que o mesmo material na mesma localização tenha saldos separados por estado (ex: `available` vs `damaged`).
- `batchId` e `expirationDate` são opcionais e normalizados para valores fixos (`no-batch`, `no-exp`) quando ausentes, garantindo chaves determinísticas.
- A função `buildBalanceDimensionKey()` centraliza este cálculo.

### Nota de Extensibilidade Futura

> **Nota Arquitetural**: Caso novas dimensões sejam necessárias no futuro (por exemplo `ownerId`, `projectId`, `supplierId` ou outras dimensões de propriedade ou consignação), a estrutura da chave de saldo poderá ser expandida adicionando os novos campos sem alterar o conceito fundamental de `InventoryBalance` como read model derivado.

## Alternativas Consideradas

- **Apenas `materialId + locationId`**: Insuficiente. Não suporta múltiplos estados de stock nem rastreabilidade por lote.
- **Manter `central_stock | project`**: Demasiado rígido para as novas localizações (viatura, contentor, área temporária, etc.).

## Consequências

- **Positivas**: Suporte nativo a múltiplos estados de stock, lotes e validades sem reestruturação futura.
- **Negativas**: Queries de saldo total de um material requerem agregação de múltiplas linhas.
