# ADR-008: Separação entre Inventário Físico e Ajuste de Stock

- **Estado**: Aprovado
- **Data**: 2026-07-28

## Contexto

A contagem física de inventário e o ajuste de stock são processos distintos, mas frequentemente confundidos ou implementados como uma única operação. O ObraMZ exige rastreabilidade completa de ambos os processos.

## Decisão

O inventário físico (`PhysicalInventoryCount`) e o ajuste de stock (`StockAdjustment`) são entidades **completamente separadas**, com fluxos de aprovação independentes.

### Fluxo de Reconciliação

```
PhysicalInventoryCount (contagem)
  → under_review (revisão das diferenças)
    → StockAdjustment (documento de ajuste gerado pelo Engine)
      → approved (aprovação do ajuste)
        → confirmed (geração de StockMovements)
```

### Regras

1. `PhysicalInventoryCount` é um **processo de contagem** — regista quantidades observadas fisicamente.
2. `StockAdjustment` é um **documento de autorização** — regista as diferenças aprovadas para correção.
3. A reconciliação de um inventário físico **gera um `StockAdjustment`** automaticamente pelo Engine.
4. `StockAdjustment` também pode ser criado manualmente (ex: dano, perda, correção de dados).
5. `differenceQuantity` é sempre calculado pelo domínio/aplicação, **nunca** introduzido diretamente pela UI.
6. Nenhum ajuste pode ser confirmado sem: motivo, código do motivo, localização, pelo menos um item, responsável e `idempotencyKey`.

## Alternativas Consideradas

- **Inventário físico cria movimentos diretamente**: Impossibilita a fase de aprovação/revisão.
- **Ajuste e inventário físico como mesma entidade**: Reduz rastreabilidade e dificulta auditorias.

## Consequências

- **Positivas**: Rastreabilidade completa desde a contagem até à movimentação contabilística. Suporte nativo a fluxos de aprovação em dois passos.
- **Negativas**: Mais entidades a gerir; requer UI mais complexa para o utilizador.
