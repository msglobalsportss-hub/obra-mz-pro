# ObraMZ — Regras de Negócio e Domínio (Domain Rules)

Este documento define as regras canónicas do domínio ObraMZ. Qualquer alteração ou nova funcionalidade deve respeitar estritamente estas regras.

---

## 1. PEDIDO DE COMPRA (Purchase Order)
- Um Pedido de Compra pertence obrigatoriamente a um único **Fornecedor**.
- Um Pedido de Compra pode ter **várias Entregas** associadas.
- Um Pedido de Compra **nunca pode ser cancelado** se já existir pelo menos uma Entrega confirmada.
- O estado do Pedido (`draft` -> `pending_approval` -> `approved` -> `sent` -> `partially_received` -> `received` / `cancelled`) reflete a reconciliação acumulada de todas as entregas.

---

## 2. ENTREGA (Delivery)
- Uma Entrega é um documento comercial/logístico ligado a um único **Pedido de Compra**.
- Uma Entrega pode gerar múltiplos **ReceiptBatches** (lotes de receção física).
- **Idempotência Total**: Uma Entrega no estado `confirmed` é estritamente imutável. Qualquer nova tentativa de confirmação deve retornar silenciosamente sem reprocessar.
- Confirmar uma Entrega é um **fechamento documental** — NUNCA cria nem altera movimentos de stock diretamente. Entrada física de stock só ocorre no momento do processamento do `ReceiptBatch`.

---

## 3. LOTE DE RECEÇÃO (ReceiptBatch)
- Um `ReceiptBatch` é a unidade atómica de entrada de stock no armazém/obra.
- **Tudo-ou-Nada (All-or-Nothing)**: Se a entrada de um único item falhar no InventoryEngine, nenhum movimento do lote é persistido.
- Chave de Idempotência obrigatória: `delivery:{deliveryId}:batch:{batchId}`.
- Um `ReceiptBatch` processado com sucesso é registado com o seu `processedAt` e lista de `movementIds` correspondentes.

---

## 4. MOVIMENTO DE STOCK (StockMovement)
- Um `StockMovement` é **imutável**. Nunca é editado nem eliminado.
- Correção de movimentos é efetuada exclusivamente por **Reversão** (gerando um movimento oposto com referência ao movimento original).
- O **InventoryEngine** é a ÚNICA autoridade autorizada a criar e registar movimentos de stock.

---

## 5. SALDO DE INVENTÁRIO (InventoryBalance)
- `InventoryBalance` é uma projeção determinística calculada a partir dos movimentos de stock acumulados.
- É proibido alterar saldos manualmente fora do `InventoryEngine`.
- Distinção estrita:
  - `quantityOnHand` = Stock físico total na localização.
  - `reservedQuantity` = Stock reservado para tarefas/obras.
  - `availableQuantity` = `quantityOnHand` - `reservedQuantity`.

---

## 6. RESERVAS (InventoryReservation)
- Criar uma reserva reduz o **stock disponível**, mas NÃO altera o stock físico (`quantityOnHand`).
- O consumo da reserva converte a quantidade reservada em movimento de saída real (`ISSUE_STOCK`).

---

## 7. TRANSFERÊNCIAS INTERNAS (StockTransfer)
- Estados da Transferência: `expedida` -> `em_transito` -> `recebida` -> `fechada` / `cancelada`.
- Cada transferência é um documento operacional contendo: `sourceLocationId`, `transitLocationId` e `destinationLocationId`.
- **Destino Congelado**: O destino final é registado na criação do documento `StockTransfer`. A confirmação da chegada consulta a `destinationLocationId` do documento — é estritamente proibido inferir o destino ou usar valores hardcoded (`PROJ-1`).

---

## 8. CONSUMO E CUSTOS DA OBRA (ProjectMaterialCost)
- Registar o consumo de material numa obra:
  1. Reduz o inventário físico da obra via `InventoryEngine.issueStock()`.
  2. Regista uma entrada no módulo de Custos da Obra (`ProjectMaterialCostEntry`) com a quantidade e o **Custo Médio Ponderado (WAC)** no momento do consumo.
  3. NÃO cria qualquer movimento no Fluxo de Caixa (a saída financeira ocorreu na compra/pagamento ao fornecedor).

---

## 9. TENANT E COMPANY SCOPE
- Todas as operações recebem `tenantId` e `companyId` válidos a partir da sessão ativa.
- IDs genéricos de teste (`TENANT-A`, `COMP-1`, `PROJ-1`) são proibidos em código de produção e restritos a fixtures e testes unitários.
