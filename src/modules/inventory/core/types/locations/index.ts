/**
 * Domínio de Localizações de Inventário — Fase 2A.
 *
 * Tipos extensíveis sem obrigar a alterar switch statements no Core.
 */

/** Tipos de localização predefinidos do sistema ObraMZ */
export type StandardInventoryLocationType =
  | "main_warehouse" // Armazém Principal
  | "secondary_warehouse" // Armazém Secundário
  | "project" // Localização de Obra
  | "vehicle" // Viatura
  | "container" // Contentor
  | "temporary" // Área Temporária
  | "supplier" // Localização de Fornecedor (supplier_direct)
  | "returned_goods" // Material Devolvido
  | "damaged_goods" // Material Danificado
  | "scrap"; // Sucata/Abate

/**
 * Union type aberta para tipos de localização.
 * Novos tipos customizados podem ser adicionados sem alterar o Core.
 */
export type InventoryLocationType = StandardInventoryLocationType | (string & {});

/** Referência a uma localização de inventário */
export interface InventoryLocationRef {
  locationType: InventoryLocationType;
  locationId?: string;
  projectId?: string;
  sectionOrBayId?: string;
}
