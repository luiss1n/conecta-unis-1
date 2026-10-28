export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      application_messages: {
        Row: { application_id: string; body: string; created_at: string; id: string; sender_id: string }
        Insert: { application_id: string; body: string; created_at?: string; id?: string; sender_id: string }
        Update: { application_id?: string; body?: string; created_at?: string; id?: string; sender_id?: string }
        Relationships: [
          { foreignKeyName: "application_messages_application_id_fkey"; columns: ["application_id"]; isOneToOne: false; referencedRelation: "job_applications"; referencedColumns: ["id"] },
          { foreignKeyName: "application_messages_sender_id_fkey"; columns: ["sender_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
        ]
      }
      job_applications: {
        Row: {
          applicant_city: string; applicant_education: string; applicant_email: string; applicant_headline: string;
          applicant_id: string; applicant_institution: string; applicant_name: string; applicant_phone: string;
          applicant_resume_name: string; applicant_resume_path: string; consent_at: string; cover_message: string;
          created_at: string; id: string; job_slug: string; status: string; updated_at: string
        }
        Insert: {
          applicant_city?: string; applicant_education?: string; applicant_email: string; applicant_headline?: string;
          applicant_id: string; applicant_institution?: string; applicant_name: string; applicant_phone?: string;
          applicant_resume_name?: string; applicant_resume_path?: string; consent_at: string; cover_message?: string;
          created_at?: string; id?: string; job_slug: string; status?: string; updated_at?: string
        }
        Update: {
          applicant_city?: string; applicant_education?: string; applicant_email?: string; applicant_headline?: string;
          applicant_id?: string; applicant_institution?: string; applicant_name?: string; applicant_phone?: string;
          applicant_resume_name?: string; applicant_resume_path?: string; consent_at?: string; cover_message?: string;
          created_at?: string; id?: string; job_slug?: string; status?: string; updated_at?: string
        }
        Relationships: [
          { foreignKeyName: "job_applications_applicant_id_fkey"; columns: ["applicant_id"]; isOneToOne: false; referencedRelation: "profiles"; referencedColumns: ["id"] },
          { foreignKeyName: "job_applications_job_slug_fkey"; columns: ["job_slug"]; isOneToOne: false; referencedRelation: "jobs"; referencedColumns: ["slug"] },
        ]
      }
      companies: {
        Row: {
          about: string
          city: string
          created_at: string
          initials: string
          name: string
          owner_id: string
          sector: string
          slug: string
          summary: string
          tone: string
        }
        Insert: {
          about?: string
          city: string
          created_at?: string
          initials?: string
          name: string
          owner_id: string
          sector: string
          slug?: string
          summary?: string
          tone?: string
        }
        Update: {
          about?: string
          city?: string
          created_at?: string
          initials?: string
          name?: string
          owner_id?: string
          sector?: string
          slug?: string
          summary?: string
          tone?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      company_details: {
        Row: {
          cnpj: string
          legal_name: string
          user_id: string
          website: string
        }
        Insert: {
          cnpj: string
          legal_name: string
          user_id: string
          website?: string
        }
        Update: {
          cnpj?: string
          legal_name?: string
          user_id?: string
          website?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_interests: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_interests_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_interests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          category: string
          date: string
          description: string
          endTime: string
          id: string
          location: string
          mode: string
          owner_id: string
          summary: string
          title: string
        }
        Insert: {
          category: string
          date: string
          description: string
          endTime: string
          id?: string
          location: string
          mode: string
          owner_id: string
          summary: string
          title: string
        }
        Update: {
          category?: string
          date?: string
          description?: string
          endTime?: string
          id?: string
          location?: string
          mode?: string
          owner_id?: string
          summary?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          activities: string[]
          benefits: string[]
          category: string
          city: string
          companySlug: string | null
          description: string
          mode: string
          owner_id: string
          publishedAt: string
          publisher_name: string | null
          requirements: string[]
          salary: string | null
          schedule: string
          slug: string
          summary: string
          title: string
          type: string
        }
        Insert: {
          activities?: string[]
          benefits?: string[]
          category: string
          city: string
          companySlug?: string | null
          description: string
          mode: string
          owner_id: string
          publishedAt?: string
          publisher_name?: string | null
          requirements?: string[]
          salary?: string | null
          schedule: string
          slug?: string
          summary: string
          title: string
          type: string
        }
        Update: {
          activities?: string[]
          benefits?: string[]
          category?: string
          city?: string
          companySlug?: string | null
          description?: string
          mode?: string
          owner_id?: string
          publishedAt?: string
          publisher_name?: string | null
          requirements?: string[]
          salary?: string | null
          schedule?: string
          slug?: string
          summary?: string
          title?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_companySlug_fkey"
            columns: ["companySlug"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "jobs_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professor_details: {
        Row: {
          department: string
          institution: string
          qualification: string
          subjects: string
          user_id: string
        }
        Insert: {
          department: string
          institution: string
          qualification: string
          subjects: string
          user_id: string
        }
        Update: {
          department?: string
          institution?: string
          qualification?: string
          subjects?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "professor_details_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string
          avatar_path: string
          banner_path: string
          bio: string
          city: string
          country: string
          created_at: string
          display_name: string
          education: string
          headline: string
          id: string
          institution: string
          phone: string
          resume_name: string
          resume_path: string
          state: string
          username: string
        }
        Insert: {
          address?: string
          avatar_path?: string
          banner_path?: string
          bio?: string
          city?: string
          country?: string
          created_at?: string
          display_name?: string
          education?: string
          headline?: string
          id: string
          institution?: string
          phone?: string
          resume_name?: string
          resume_path?: string
          state?: string
          username?: string
        }
        Update: {
          address?: string
          avatar_path?: string
          banner_path?: string
          bio?: string
          city?: string
          country?: string
          created_at?: string
          display_name?: string
          education?: string
          headline?: string
          id?: string
          institution?: string
          phone?: string
          resume_name?: string
          resume_path?: string
          state?: string
          username?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      save_registration: { Args: { payload: Json }; Returns: undefined }
      submit_job_application: { Args: { _consent: boolean; _cover_message?: string; _job_slug: string }; Returns: string }
      update_job_application_status: { Args: { _application_id: string; _status: string }; Returns: undefined }
    }
    Enums: {
      app_role: "company" | "professor" | "visitor" | "admin"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["company", "professor", "visitor", "admin"],
    },
  },
} as const
