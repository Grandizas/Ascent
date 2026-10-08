// Generated from the Supabase schema (supabase gen types). Do not edit by hand;
// regenerate after each migration.

export type Json
  = | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18'
  }
  public: {
    Tables: {
      journal_entries: {
        Row: {
          body: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
          written_at: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          written_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          written_at?: string
        }
        Relationships: []
      }
      journey_attempts: {
        Row: {
          created_at: string
          end_reason: string | null
          ended_at: string | null
          id: string
          journey_id: string
          number: number
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          journey_id: string
          number: number
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          end_reason?: string | null
          ended_at?: string | null
          id?: string
          journey_id?: string
          number?: number
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'journey_attempts_journey_id_user_id_fkey'
            columns: ['journey_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'journeys'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      journey_rules: {
        Row: {
          created_at: string
          id: string
          journey_id: string
          kind: string
          label: string
          position: number
          suggested: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          journey_id: string
          kind: string
          label: string
          position?: number
          suggested?: boolean
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          journey_id?: string
          kind?: string
          label?: string
          position?: number
          suggested?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'journey_rules_journey_id_user_id_fkey'
            columns: ['journey_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'journeys'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      journey_setbacks: {
        Row: {
          attempt_id: string
          created_at: string
          id: string
          note: string
          occurred_at: string
          outcome: string
          user_id: string
        }
        Insert: {
          attempt_id: string
          created_at?: string
          id?: string
          note?: string
          occurred_at?: string
          outcome: string
          user_id?: string
        }
        Update: {
          attempt_id?: string
          created_at?: string
          id?: string
          note?: string
          occurred_at?: string
          outcome?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'journey_setbacks_attempt_id_user_id_fkey'
            columns: ['attempt_id', 'user_id']
            isOneToOne: false
            referencedRelation: 'journey_attempts'
            referencedColumns: ['id', 'user_id']
          },
        ]
      }
      journeys: {
        Row: {
          checkpoint_days: number[]
          color: string
          created_at: string
          id: string
          length_days: number
          name: string
          updated_at: string
          user_id: string
          what_text: string
          why_text: string
          why_written_at: string
        }
        Insert: {
          checkpoint_days: number[]
          color?: string
          created_at?: string
          id?: string
          length_days: number
          name: string
          updated_at?: string
          user_id?: string
          what_text?: string
          why_text: string
          why_written_at?: string
        }
        Update: {
          checkpoint_days?: number[]
          color?: string
          created_at?: string
          id?: string
          length_days?: number
          name?: string
          updated_at?: string
          user_id?: string
          what_text?: string
          why_text?: string
          why_written_at?: string
        }
        Relationships: []
      }
      mood_entries: {
        Row: {
          created_at: string
          id: string
          level: number
          logged_at: string
          note: string
          score: number
          tags: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          level: number
          logged_at?: string
          note?: string
          score: number
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          level?: number
          logged_at?: string
          note?: string
          score?: number
          tags?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string
          id: string
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string
          id: string
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_journey: {
        Args: {
          p_checkpoint_days: number[]
          p_color: string
          p_length_days: number
          p_name: string
          p_rules?: Json
          p_what: string
          p_why: string
        }
        Returns: string
      }
      is_valid_timezone: { Args: { tz: string }, Returns: boolean }
      journal_feed: {
        Args: {
          p_before?: string
          p_days?: number
          p_level?: number
          p_notes_only?: boolean
          p_query?: string
          p_tag?: string
          p_time_zone: string
        }
        Returns: {
          at: string
          body: string
          day: string
          id: string
          kind: string
          level: number
          matches: boolean
          score: number
          tags: string[]
        }[]
      }
      journal_months: {
        Args: { p_time_zone: string }
        Returns: {
          average: number
          entries: number
          month: string
          notes: number
        }[]
      }
      journal_tags: {
        Args: { p_limit?: number }
        Returns: {
          entries: number
          tag: string
        }[]
      }
      journey_attempt_moods: {
        Args: never
        Returns: {
          attempt_id: string
          before_average: number
          before_entries: number
          during_average: number
          during_entries: number
        }[]
      }
      record_setback: {
        Args: { p_journey_id: string, p_note: string, p_outcome: string }
        Returns: string
      }
      replace_journey_rules: {
        Args: { p_journey_id: string, p_rules: Json }
        Returns: undefined
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

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
      & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    & DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R
    }
      ? R
      : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables']
    & DefaultSchema['Views'])
    ? (DefaultSchema['Tables']
      & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
        ? R
        : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I
  }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U
  }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
