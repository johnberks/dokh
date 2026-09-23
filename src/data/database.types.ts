export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      device_push_tokens: {
        Row: {
          device_id_hash: string;
          expo_push_token: string;
          id: string;
          last_seen_at: string;
          platform: Database['public']['Enums']['device_platform'];
          revoked_at: string | null;
          user_id: string;
        };
        Insert: {
          device_id_hash: string;
          expo_push_token: string;
          id?: string;
          last_seen_at?: string;
          platform: Database['public']['Enums']['device_platform'];
          revoked_at?: string | null;
          user_id: string;
        };
        Update: {
          device_id_hash?: string;
          expo_push_token?: string;
          id?: string;
          last_seen_at?: string;
          platform?: Database['public']['Enums']['device_platform'];
          revoked_at?: string | null;
          user_id?: string;
        };
        Relationships: [];
      };
      import_issues: {
        Row: {
          created_at: string;
          created_work_entry_id: string | null;
          id: string;
          import_id: string;
          issue_code: string;
          payload: Json;
          resolved_at: string | null;
          row_number: number;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          created_work_entry_id?: string | null;
          id?: string;
          import_id: string;
          issue_code: string;
          payload?: Json;
          resolved_at?: string | null;
          row_number: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          created_work_entry_id?: string | null;
          id?: string;
          import_id?: string;
          issue_code?: string;
          payload?: Json;
          resolved_at?: string | null;
          row_number?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'import_issues_created_work_entry_id_user_id_fkey';
            columns: ['created_work_entry_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'work_entries';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'import_issues_import_id_user_id_fkey';
            columns: ['import_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'imports';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      imports: {
        Row: {
          confirmed_at: string | null;
          created_at: string;
          file_sha256: string;
          id: string;
          issue_count: number;
          original_filename: string;
          row_count: number;
          source: Database['public']['Enums']['import_source'];
          status: Database['public']['Enums']['import_status'];
          storage_path: string;
          summary: Json;
          updated_at: string;
          user_id: string;
          valid_count: number;
        };
        Insert: {
          confirmed_at?: string | null;
          created_at?: string;
          file_sha256: string;
          id?: string;
          issue_count?: number;
          original_filename: string;
          row_count?: number;
          source: Database['public']['Enums']['import_source'];
          status?: Database['public']['Enums']['import_status'];
          storage_path: string;
          summary?: Json;
          updated_at?: string;
          user_id: string;
          valid_count?: number;
        };
        Update: {
          confirmed_at?: string | null;
          created_at?: string;
          file_sha256?: string;
          id?: string;
          issue_count?: number;
          original_filename?: string;
          row_count?: number;
          source?: Database['public']['Enums']['import_source'];
          status?: Database['public']['Enums']['import_status'];
          storage_path?: string;
          summary?: Json;
          updated_at?: string;
          user_id?: string;
          valid_count?: number;
        };
        Relationships: [];
      };
      notification_preferences: {
        Row: {
          important_work_changes: boolean;
          receivable_due_day: boolean;
          undated_weekly_reminder: boolean;
          upcoming_work_reminder: boolean;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          important_work_changes?: boolean;
          receivable_due_day?: boolean;
          undated_weekly_reminder?: boolean;
          upcoming_work_reminder?: boolean;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          important_work_changes?: boolean;
          receivable_due_day?: boolean;
          undated_weekly_reminder?: boolean;
          upcoming_work_reminder?: boolean;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_path: string | null;
          city: string | null;
          country_code: string;
          created_at: string;
          display_name: string;
          graduation_year: number | null;
          id: string;
          locale: string;
          onboarding_completed_at: string | null;
          professional_status: Database['public']['Enums']['professional_status'];
          specialty: string | null;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          avatar_path?: string | null;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          display_name: string;
          graduation_year?: number | null;
          id: string;
          locale?: string;
          onboarding_completed_at?: string | null;
          professional_status: Database['public']['Enums']['professional_status'];
          specialty?: string | null;
          timezone: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          avatar_path?: string | null;
          city?: string | null;
          country_code?: string;
          created_at?: string;
          display_name?: string;
          graduation_year?: number | null;
          id?: string;
          locale?: string;
          onboarding_completed_at?: string | null;
          professional_status?: Database['public']['Enums']['professional_status'];
          specialty?: string | null;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      receivables: {
        Row: {
          amount_cents: number;
          competence_month: string;
          created_at: string;
          currency: string;
          expected_on: string | null;
          id: string;
          invalidated_at: string | null;
          received_at: string | null;
          residency_id: string | null;
          updated_at: string;
          user_id: string;
          work_entry_id: string | null;
        };
        Insert: {
          amount_cents: number;
          competence_month: string;
          created_at?: string;
          currency?: string;
          expected_on?: string | null;
          id?: string;
          invalidated_at?: string | null;
          received_at?: string | null;
          residency_id?: string | null;
          updated_at?: string;
          user_id: string;
          work_entry_id?: string | null;
        };
        Update: {
          amount_cents?: number;
          competence_month?: string;
          created_at?: string;
          currency?: string;
          expected_on?: string | null;
          id?: string;
          invalidated_at?: string | null;
          received_at?: string | null;
          residency_id?: string | null;
          updated_at?: string;
          user_id?: string;
          work_entry_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'receivables_residency_id_user_id_fkey';
            columns: ['residency_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'residencies';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'receivables_work_entry_id_user_id_fkey';
            columns: ['work_entry_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'work_entries';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      residencies: {
        Row: {
          active: boolean;
          created_at: string;
          expected_ends_on: string | null;
          id: string;
          institution: string | null;
          level_label: string | null;
          monthly_amount_cents: number;
          payment_day: number;
          specialty: string;
          starts_on: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          expected_ends_on?: string | null;
          id?: string;
          institution?: string | null;
          level_label?: string | null;
          monthly_amount_cents: number;
          payment_day: number;
          specialty: string;
          starts_on: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          expected_ends_on?: string | null;
          id?: string;
          institution?: string | null;
          level_label?: string | null;
          monthly_amount_cents?: number;
          payment_day?: number;
          specialty?: string;
          starts_on?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      subscription_entitlements: {
        Row: {
          entitlement: string;
          environment: Database['public']['Enums']['subscription_environment'];
          expires_at: string | null;
          is_active: boolean;
          last_event_id: string;
          product_id: string;
          store: Database['public']['Enums']['subscription_store'];
          updated_at: string;
          user_id: string;
        };
        Insert: {
          entitlement?: string;
          environment: Database['public']['Enums']['subscription_environment'];
          expires_at?: string | null;
          is_active?: boolean;
          last_event_id: string;
          product_id: string;
          store: Database['public']['Enums']['subscription_store'];
          updated_at?: string;
          user_id: string;
        };
        Update: {
          entitlement?: string;
          environment?: Database['public']['Enums']['subscription_environment'];
          expires_at?: string | null;
          is_active?: boolean;
          last_event_id?: string;
          product_id?: string;
          store?: Database['public']['Enums']['subscription_store'];
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      work_entries: {
        Row: {
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          id: string;
          import_id: string | null;
          import_row_key: string | null;
          location_id: string;
          occurrence_key: string | null;
          series_id: string | null;
          source: Database['public']['Enums']['work_entry_source'];
          start_time: string | null;
          timezone: string;
          type: Database['public']['Enums']['work_entry_type'];
          updated_at: string;
          user_id: string;
          work_date: string;
        };
        Insert: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          import_id?: string | null;
          import_row_key?: string | null;
          location_id: string;
          occurrence_key?: string | null;
          series_id?: string | null;
          source?: Database['public']['Enums']['work_entry_source'];
          start_time?: string | null;
          timezone: string;
          type: Database['public']['Enums']['work_entry_type'];
          updated_at?: string;
          user_id: string;
          work_date: string;
        };
        Update: {
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          id?: string;
          import_id?: string | null;
          import_row_key?: string | null;
          location_id?: string;
          occurrence_key?: string | null;
          series_id?: string | null;
          source?: Database['public']['Enums']['work_entry_source'];
          start_time?: string | null;
          timezone?: string;
          type?: Database['public']['Enums']['work_entry_type'];
          updated_at?: string;
          user_id?: string;
          work_date?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'work_entries_import_owner';
            columns: ['import_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'imports';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'work_entries_location_id_user_id_fkey';
            columns: ['location_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'work_locations';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'work_entries_series_id_user_id_fkey';
            columns: ['series_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'work_series';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      work_locations: {
        Row: {
          archived_at: string | null;
          city: string | null;
          color_source: Database['public']['Enums']['work_location_color_source'];
          color_token: string;
          created_at: string;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          archived_at?: string | null;
          city?: string | null;
          color_source?: Database['public']['Enums']['work_location_color_source'];
          color_token: string;
          created_at?: string;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          city?: string | null;
          color_source?: Database['public']['Enums']['work_location_color_source'];
          color_token?: string;
          created_at?: string;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      work_preferences: {
        Row: {
          default_duration_minutes: number | null;
          default_payment_term_days: number | null;
          default_start_time: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          default_duration_minutes?: number | null;
          default_payment_term_days?: number | null;
          default_start_time?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          default_duration_minutes?: number | null;
          default_payment_term_days?: number | null;
          default_start_time?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      work_series: {
        Row: {
          active: boolean;
          created_at: string;
          ends_on: string | null;
          frequency: Database['public']['Enums']['work_series_frequency'];
          id: string;
          materialized_until: string | null;
          rrule: string;
          starts_on: string;
          timezone: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          active?: boolean;
          created_at?: string;
          ends_on?: string | null;
          frequency: Database['public']['Enums']['work_series_frequency'];
          id?: string;
          materialized_until?: string | null;
          rrule: string;
          starts_on: string;
          timezone: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          active?: boolean;
          created_at?: string;
          ends_on?: string | null;
          frequency?: Database['public']['Enums']['work_series_frequency'];
          id?: string;
          materialized_until?: string | null;
          rrule?: string;
          starts_on?: string;
          timezone?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      confirm_receivable_received: {
        Args: { p_receivable_id: string };
        Returns: {
          receivable_id: string;
          received_at: string;
        }[];
      };
      create_or_update_residency: {
        Args: {
          p_expected_ends_on: string;
          p_institution: string;
          p_level_label: string;
          p_monthly_amount_cents: number;
          p_payment_day: number;
          p_residency_id: string;
          p_specialty: string;
          p_starts_on: string;
        };
        Returns: {
          receivables_changed: number;
          residency_id: string;
        }[];
      };
      create_work_with_receivable: {
        Args: {
          p_amount_cents: number;
          p_description: string;
          p_duration_minutes: number;
          p_expected_on: string;
          p_idempotency_key: string;
          p_location_id: string;
          p_start_time: string;
          p_timezone: string;
          p_type: Database['public']['Enums']['work_entry_type'];
          p_work_date: string;
        };
        Returns: {
          receivable_id: string;
          work_id: string;
        }[];
      };
      deactivate_residency: {
        Args: { p_residency_id: string };
        Returns: string;
      };
      delete_work_with_receivable: {
        Args: { p_idempotency_key: string; p_work_entry_id: string };
        Returns: {
          receivable_id: string;
          work_id: string;
        }[];
      };
      generate_residency_receivables: {
        Args: { p_residency_id: string };
        Returns: number;
      };
      update_work_with_receivable: {
        Args: {
          p_amount_cents: number;
          p_description: string;
          p_duration_minutes: number;
          p_expected_on: string;
          p_idempotency_key: string;
          p_location_id: string;
          p_start_time: string;
          p_timezone: string;
          p_type: Database['public']['Enums']['work_entry_type'];
          p_work_date: string;
          p_work_entry_id: string;
        };
        Returns: {
          receivable_id: string;
          work_id: string;
        }[];
      };
    };
    Enums: {
      device_platform: 'ios' | 'android';
      import_source: 'plantaozinho' | 'csv' | 'compatible_file';
      import_status:
        | 'uploaded'
        | 'parsing'
        | 'ready'
        | 'confirmed'
        | 'failed'
        | 'empty'
        | 'cancelled';
      professional_status: 'general_practitioner' | 'resident';
      subscription_environment: 'sandbox' | 'production';
      subscription_store: 'app_store' | 'play_store';
      work_entry_source: 'manual' | 'import' | 'recurrence';
      work_entry_type: 'shift' | 'procedure' | 'appointment';
      work_location_color_source: 'automatic' | 'free_palette' | 'premium_palette';
      work_series_frequency: 'weekly' | 'biweekly' | 'monthly' | 'custom';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      device_platform: ['ios', 'android'],
      import_source: ['plantaozinho', 'csv', 'compatible_file'],
      import_status: ['uploaded', 'parsing', 'ready', 'confirmed', 'failed', 'empty', 'cancelled'],
      professional_status: ['general_practitioner', 'resident'],
      subscription_environment: ['sandbox', 'production'],
      subscription_store: ['app_store', 'play_store'],
      work_entry_source: ['manual', 'import', 'recurrence'],
      work_entry_type: ['shift', 'procedure', 'appointment'],
      work_location_color_source: ['automatic', 'free_palette', 'premium_palette'],
      work_series_frequency: ['weekly', 'biweekly', 'monthly', 'custom'],
    },
  },
} as const;
