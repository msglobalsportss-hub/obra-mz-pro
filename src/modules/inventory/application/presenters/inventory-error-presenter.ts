/**
 * Presenter de Erros do Inventário — InventoryErrorPresenter
 * Categoria: application/presenters
 *
 * Mapeia exceções e erros técnicos do domínio/aplicação para mensagens amigáveis em Português.
 * Garante que a UI nunca exibe stack traces ou mensagens brutas de erro ao utilizador final.
 */

export class InventoryErrorPresenter {
  static formatError(error: unknown): string {
    if (!error) return "Ocorreu um erro inesperado. Tenta novamente.";

    const message = error instanceof Error ? error.message : String(error);

    if (
      message.includes("INSUFFICIENT_STOCK") ||
      message.includes("InsufficientStockError") ||
      message.includes("disponível insuficiente")
    ) {
      return "Stock disponível insuficiente na localização selecionada para concluir esta operação.";
    }

    if (
      message.includes("INSUFFICIENT_AVAILABLE_STOCK") ||
      message.includes("InsufficientAvailableStockError")
    ) {
      return "Stock disponível insuficiente. A quantidade reservada excede o stock físico disponível.";
    }

    if (
      message.includes("INVENTORY_BALANCE_CONFLICT") ||
      message.includes("InventoryBalanceConflictError")
    ) {
      return "O saldo de inventário foi alterado por outra operação concorrente. Atualiza os dados e tenta novamente.";
    }

    if (
      message.includes("INVENTORY_OPERATION_ALREADY_PROCESSING") ||
      message.includes("InventoryOperationAlreadyProcessingError")
    ) {
      return "Esta operação já está em processamento pelo sistema. Aguarda alguns instantes.";
    }

    if (
      message.includes("INVENTORY_MOVEMENT_ALREADY_REVERSED") ||
      message.includes("InventoryMovementAlreadyReversedError")
    ) {
      return "Este movimento de inventário já foi revertido anteriormente e não pode ser estornado duas vezes.";
    }

    if (
      message.includes("INVENTORY_DELIVERY_ALREADY_PROCESSED") ||
      message.includes("InventoryDeliveryAlreadyProcessedError")
    ) {
      return "Esta receção de entrega já foi processada anteriormente no inventário.";
    }

    if (
      message.includes("INVENTORY_RESERVATION_NOT_FOUND") ||
      message.includes("InventoryReservationNotFoundError")
    ) {
      return "Reserva de inventário não encontrada ou já cancelada.";
    }

    if (
      message.includes("INVENTORY_RESERVATION_STATE") ||
      message.includes("InventoryReservationStateError")
    ) {
      return "A reserva não se encontra num estado válido para esta operação.";
    }

    if (
      message.includes("INVENTORY_TRANSFER_VALIDATION") ||
      message.includes("InventoryTransferValidationError")
    ) {
      return "Transferência inválida: verifica se a origem é diferente do destino e se as localizações estão ativas.";
    }

    if (
      message.includes("INVENTORY_POLICY_VIOLATION") ||
      message.includes("InventoryPolicyViolationError")
    ) {
      return "Esta operação viola as políticas de inventário configuradas para este material/localização.";
    }

    if (
      message.includes("INVALID_INVENTORY_QUANTITY") ||
      message.includes("InvalidInventoryQuantityError")
    ) {
      return "Quantidade inválida. Fornece um valor numérico estritamente positivo.";
    }

    if (
      message.includes("INVALID_INVENTORY_COST") ||
      message.includes("InvalidInventoryCostError")
    ) {
      return "Custo unitário inválido. Fornece um valor numérico não-negativo.";
    }

    if (message.includes("razão do ajuste é obrigatória")) {
      return "É obrigatório fornecer a descrição da razão do ajuste de stock.";
    }

    return message;
  }
}
