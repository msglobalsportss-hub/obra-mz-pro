export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
          updated_at?: string
        }
      }
      companies: {
        Row: {
          id: string
          tenant_id: string
          name: string
          nuit: string | null
          address: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          nuit?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          nuit?: string | null
          address?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          full_name: string
          email: string
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name: string
          email: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      company_members: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          user_id: string
          role: "admin" | "manager" | "field_chief" | "clerk"
          status: "active" | "invited" | "suspended"
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          user_id: string
          role: "admin" | "manager" | "field_chief" | "clerk"
          status?: "active" | "invited" | "suspended"
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          user_id?: string
          role?: "admin" | "manager" | "field_chief" | "clerk"
          status?: "active" | "invited" | "suspended"
          created_at?: string
          updated_at?: string
        }
      }
      materials: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          code: string
          name: string
          description: string | null
          category: string
          unit: string
          min_stock: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          code: string
          name: string
          description?: string | null
          category: string
          unit: string
          min_stock?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          code?: string
          name?: string
          description?: string | null
          category?: string
          unit?: string
          min_stock?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory_locations: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          code: string
          name: string
          type: "warehouse" | "project" | "transit"
          project_id: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          code: string
          name: string
          type: "warehouse" | "project" | "transit"
          project_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          code?: string
          name?: string
          type?: "warehouse" | "project" | "transit"
          project_id?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      inventory_balances: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          material_id: string
          location_id: string
          stock_state: string
          on_hand_quantity: number
          reserved_quantity: number
          available_quantity: number
          average_cost: number
          total_value: number
          version: number
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          material_id: string
          location_id: string
          stock_state?: string
          on_hand_quantity?: number
          reserved_quantity?: number
          average_cost?: number
          version?: number
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          material_id?: string
          location_id?: string
          stock_state?: string
          on_hand_quantity?: number
          reserved_quantity?: number
          average_cost?: number
          version?: number
          updated_at?: string
        }
      }
      stock_movements: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          material_id: string
          movement_type: string
          status: string
          quantity: number
          unit_cost: number
          total_cost: number
          source_location_id: string | null
          destination_location_id: string | null
          reference_type: string | null
          reference_id: string | null
          idempotency_key: string
          performed_by: string
          reason: string | null
          occurred_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          material_id: string
          movement_type: string
          status?: string
          quantity: number
          unit_cost: number
          total_cost: number
          source_location_id?: string | null
          destination_location_id?: string | null
          reference_type?: string | null
          reference_id?: string | null
          idempotency_key: string
          performed_by: string
          reason?: string | null
          occurred_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          material_id?: string
          movement_type?: string
          status?: string
          quantity?: number
          unit_cost?: number
          total_cost?: number
          source_location_id?: string | null
          destination_location_id?: string | null
          reference_type?: string | null
          reference_id?: string | null
          idempotency_key?: string
          performed_by?: string
          reason?: string | null
          occurred_at?: string
          created_at?: string
        }
      }
      stock_transfers: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          transfer_number: string
          source_location_id: string
          transit_location_id: string
          destination_location_id: string
          status: string
          idempotency_key: string
          dispatched_at: string | null
          received_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          transfer_number: string
          source_location_id: string
          transit_location_id: string
          destination_location_id: string
          status: string
          idempotency_key: string
          dispatched_at?: string | null
          received_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          transfer_number?: string
          source_location_id?: string
          transit_location_id?: string
          destination_location_id?: string
          status?: string
          idempotency_key?: string
          dispatched_at?: string | null
          received_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stock_transfer_items: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          transfer_id: string
          material_id: string
          requested_quantity: number
          dispatched_quantity: number
          received_quantity: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          transfer_id: string
          material_id: string
          requested_quantity: number
          dispatched_quantity?: number
          received_quantity?: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          transfer_id?: string
          material_id?: string
          requested_quantity?: number
          dispatched_quantity?: number
          received_quantity?: number
          created_at?: string
        }
      }
      receipt_batches: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          batch_number: string
          delivery_id: string
          idempotency_key: string
          received_at: string
          received_by: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          batch_number: string
          delivery_id: string
          idempotency_key: string
          received_at?: string
          received_by: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          batch_number?: string
          delivery_id?: string
          idempotency_key?: string
          received_at?: string
          received_by?: string
          notes?: string | null
          created_at?: string
        }
      }
      receipt_batch_items: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          batch_id: string
          delivery_item_id: string
          material_id: string
          received_quantity: number
          accepted_quantity: number
          rejected_quantity: number
          rejection_reason: string | null
          unit_cost: number
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          batch_id: string
          delivery_item_id: string
          material_id: string
          received_quantity: number
          accepted_quantity: number
          rejected_quantity?: number
          rejection_reason?: string | null
          unit_cost: number
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          batch_id?: string
          delivery_item_id?: string
          material_id?: string
          received_quantity?: number
          accepted_quantity?: number
          rejected_quantity?: number
          rejection_reason?: string | null
          unit_cost?: number
          created_at?: string
        }
      }
      deliveries: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          delivery_number: string
          purchase_order_id: string
          supplier_id: string
          destination_type: string
          destination_location_id: string
          status: string
          delivery_date: string
          received_by: string | null
          document_reference: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          delivery_number: string
          purchase_order_id: string
          supplier_id: string
          destination_type: string
          destination_location_id: string
          status: string
          delivery_date: string
          received_by?: string | null
          document_reference?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          delivery_number?: string
          purchase_order_id?: string
          supplier_id?: string
          destination_type?: string
          destination_location_id?: string
          status?: string
          delivery_date?: string
          received_by?: string | null
          document_reference?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      delivery_items: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          delivery_id: string
          purchase_order_item_id: string
          material_id: string
          ordered_quantity: number
          received_quantity: number
          accepted_quantity: number
          rejected_quantity: number
          unit_cost: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          delivery_id: string
          purchase_order_item_id: string
          material_id: string
          ordered_quantity: number
          received_quantity?: number
          accepted_quantity?: number
          rejected_quantity?: number
          unit_cost: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          delivery_id?: string
          purchase_order_item_id?: string
          material_id?: string
          ordered_quantity?: number
          received_quantity?: number
          accepted_quantity?: number
          rejected_quantity?: number
          unit_cost?: number
          created_at?: string
          updated_at?: string
        }
      }
      project_material_cost_entries: {
        Row: {
          id: string
          tenant_id: string
          company_id: string
          project_id: string
          material_id: string
          quantity: number
          unit: string
          unit_cost_at_consumption: number
          total_cost: number
          phase_id: string | null
          movement_id: string
          actor_id: string
          source_location_id: string
          consumed_at: string
          created_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          company_id: string
          project_id: string
          material_id: string
          quantity: number
          unit: string
          unit_cost_at_consumption: number
          total_cost: number
          phase_id?: string | null
          movement_id: string
          actor_id: string
          source_location_id: string
          consumed_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          company_id?: string
          project_id?: string
          material_id?: string
          quantity?: number
          unit?: string
          unit_cost_at_consumption?: number
          total_cost?: number
          phase_id?: string | null
          movement_id?: string
          actor_id?: string
          source_location_id?: string
          consumed_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      rpc_process_receipt_batch: {
        Args: {
          p_company_id: string
          p_delivery_id: string
          p_idempotency_key: string
          p_notes: string
          p_items: Json
        }
        Returns: Json
      }
      rpc_dispatch_stock_transfer: {
        Args: {
          p_company_id: string
          p_transfer_id: string
          p_idempotency_key: string
          p_items: Json
        }
        Returns: Json
      }
      rpc_record_project_material_consumption: {
        Args: {
          p_company_id: string
          p_project_id: string
          p_material_id: string
          p_source_location_id: string
          p_quantity: number
          p_phase_id: string | null
          p_idempotency_key: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never
