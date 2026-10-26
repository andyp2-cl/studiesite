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
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
  public: {
    Tables: {
      achievements: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_hidden: boolean
          key: string
          name: string
          rule: Json
          sort_order: number
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id?: string
          is_hidden?: boolean
          key: string
          name: string
          rule: Json
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_hidden?: boolean
          key?: string
          name?: string
          rule?: Json
          sort_order?: number
        }
        Relationships: []
      }
      ai_calls: {
        Row: {
          cost_usd: number
          created_at: string
          id: string
          input_tokens: number
          model: string
          output_tokens: number
          purpose: string
          user_id: string | null
        }
        Insert: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model: string
          output_tokens?: number
          purpose: string
          user_id?: string | null
        }
        Update: {
          cost_usd?: number
          created_at?: string
          id?: string
          input_tokens?: number
          model?: string
          output_tokens?: number
          purpose?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_calls_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_hidden: boolean
          name: string
          slug: string
          sort_order: number
          subject_id: string
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_hidden?: boolean
          name: string
          slug: string
          sort_order?: number
          subject_id: string
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_hidden?: boolean
          name?: string
          slug?: string
          sort_order?: number
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      attempts: {
        Row: {
          answer: string
          correct: boolean
          created_at: string
          duration_ms: number | null
          explanation_text: string | null
          from_mix: boolean
          gave_up: boolean
          generator_key: string | null
          generator_seed: number | null
          id: string
          level: number
          moment_id: string
          task_id: string | null
          used_hint: boolean
          user_id: string
        }
        Insert: {
          answer: string
          correct: boolean
          created_at?: string
          duration_ms?: number | null
          explanation_text?: string | null
          from_mix?: boolean
          gave_up?: boolean
          generator_key?: string | null
          generator_seed?: number | null
          id?: string
          level: number
          moment_id: string
          task_id?: string | null
          used_hint?: boolean
          user_id: string
        }
        Update: {
          answer?: string
          correct?: boolean
          created_at?: string
          duration_ms?: number | null
          explanation_text?: string | null
          from_mix?: boolean
          gave_up?: boolean
          generator_key?: string | null
          generator_seed?: number | null
          id?: string
          level?: number
          moment_id?: string
          task_id?: string | null
          used_hint?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attempts_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attempts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content_blocks: {
        Row: {
          body_md: string
          created_at: string
          id: string
          moment_id: string
          sort_order: number
          title: string | null
          type: Database["public"]["Enums"]["content_block_type"]
          unlock_level: number | null
          updated_at: string
        }
        Insert: {
          body_md?: string
          created_at?: string
          id?: string
          moment_id: string
          sort_order?: number
          title?: string | null
          type: Database["public"]["Enums"]["content_block_type"]
          unlock_level?: number | null
          updated_at?: string
        }
        Update: {
          body_md?: string
          created_at?: string
          id?: string
          moment_id?: string
          sort_order?: number
          title?: string | null
          type?: Database["public"]["Enums"]["content_block_type"]
          unlock_level?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_blocks_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      generators: {
        Row: {
          created_at: string
          generator_key: string
          id: string
          moment_id: string
          params_per_level: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          generator_key: string
          id?: string
          moment_id: string
          params_per_level?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          generator_key?: string
          id?: string
          moment_id?: string
          params_per_level?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "generators_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: true
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_progress: {
        Row: {
          current_level: number
          moment_id: string
          quiz_passed_at: string | null
          read_at: string | null
          stars: number
          updated_at: string
          user_id: string
          writing_approved_at: string | null
        }
        Insert: {
          current_level?: number
          moment_id: string
          quiz_passed_at?: string | null
          read_at?: string | null
          stars?: number
          updated_at?: string
          user_id: string
          writing_approved_at?: string | null
        }
        Update: {
          current_level?: number
          moment_id?: string
          quiz_passed_at?: string | null
          read_at?: string | null
          stars?: number
          updated_at?: string
          user_id?: string
          writing_approved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moment_progress_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moment_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          area_id: string
          created_at: string
          description: string | null
          id: string
          is_hidden: boolean
          mode: Database["public"]["Enums"]["moment_mode"]
          name: string
          slug: string
          sort_order: number
          source: Database["public"]["Enums"]["moment_source"]
          updated_at: string
        }
        Insert: {
          area_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_hidden?: boolean
          mode?: Database["public"]["Enums"]["moment_mode"]
          name: string
          slug: string
          sort_order?: number
          source?: Database["public"]["Enums"]["moment_source"]
          updated_at?: string
        }
        Update: {
          area_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_hidden?: boolean
          mode?: Database["public"]["Enums"]["moment_mode"]
          name?: string
          slug?: string
          sort_order?: number
          source?: Database["public"]["Enums"]["moment_source"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "moments_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar: string | null
          coins: number
          created_at: string
          daily_goal_xp: number | null
          display_name: string
          freeze_refilled_week: string | null
          grade: number | null
          id: string
          last_active_date: string | null
          level: number
          pass_correct: number | null
          role: Database["public"]["Enums"]["user_role"]
          sound_enabled: boolean
          streak: number
          streak_freezes: number
          theme: string
          updated_at: string
          username: string
          xp: number
        }
        Insert: {
          avatar?: string | null
          coins?: number
          created_at?: string
          daily_goal_xp?: number | null
          display_name: string
          freeze_refilled_week?: string | null
          grade?: number | null
          id: string
          last_active_date?: string | null
          level?: number
          pass_correct?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          sound_enabled?: boolean
          streak?: number
          streak_freezes?: number
          theme?: string
          updated_at?: string
          username: string
          xp?: number
        }
        Update: {
          avatar?: string | null
          coins?: number
          created_at?: string
          daily_goal_xp?: number | null
          display_name?: string
          freeze_refilled_week?: string | null
          grade?: number | null
          id?: string
          last_active_date?: string | null
          level?: number
          pass_correct?: number | null
          role?: Database["public"]["Enums"]["user_role"]
          sound_enabled?: boolean
          streak?: number
          streak_freezes?: number
          theme?: string
          updated_at?: string
          username?: string
          xp?: number
        }
        Relationships: []
      }
      reward_redemptions: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          id: string
          price: number
          reward_id: string
          status: Database["public"]["Enums"]["redemption_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          price: number
          reward_id: string
          status?: Database["public"]["Enums"]["redemption_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          price?: number
          reward_id?: string
          status?: Database["public"]["Enums"]["redemption_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_decided_by_fkey"
            columns: ["decided_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reward_redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards: {
        Row: {
          created_at: string
          description: string | null
          icon: string
          id: string
          is_active: boolean
          name: string
          price: number
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name: string
          price: number
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_active?: boolean
          name?: string
          price?: number
          sort_order?: number
        }
        Relationships: []
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      sources: {
        Row: {
          area_id: string
          content: string
          created_at: string
          error: string | null
          fetched_at: string | null
          id: string
          sort_order: number
          status: Database["public"]["Enums"]["source_status"]
          title: string
          url: string | null
        }
        Insert: {
          area_id: string
          content?: string
          created_at?: string
          error?: string | null
          fetched_at?: string | null
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["source_status"]
          title: string
          url?: string | null
        }
        Update: {
          area_id?: string
          content?: string
          created_at?: string
          error?: string | null
          fetched_at?: string | null
          id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["source_status"]
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sources_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          color: string
          created_at: string
          description: string | null
          icon: string
          id: string
          is_hidden: boolean
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_hidden?: boolean
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string
          created_at?: string
          description?: string | null
          icon?: string
          id?: string
          is_hidden?: boolean
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          answer: Json
          choices: Json | null
          created_at: string
          hint_md: string | null
          id: string
          level: number
          moment_id: string
          prompt_md: string
          solution_md: string | null
          source: Database["public"]["Enums"]["task_origin"]
          status: Database["public"]["Enums"]["task_status"]
          type: Database["public"]["Enums"]["task_type"]
          updated_at: string
          upload_id: string | null
        }
        Insert: {
          answer: Json
          choices?: Json | null
          created_at?: string
          hint_md?: string | null
          id?: string
          level: number
          moment_id: string
          prompt_md: string
          solution_md?: string | null
          source?: Database["public"]["Enums"]["task_origin"]
          status?: Database["public"]["Enums"]["task_status"]
          type: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          upload_id?: string | null
        }
        Update: {
          answer?: Json
          choices?: Json | null
          created_at?: string
          hint_md?: string | null
          id?: string
          level?: number
          moment_id?: string
          prompt_md?: string
          solution_md?: string | null
          source?: Database["public"]["Enums"]["task_origin"]
          status?: Database["public"]["Enums"]["task_status"]
          type?: Database["public"]["Enums"]["task_type"]
          updated_at?: string
          upload_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_upload_fk"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      uploads: {
        Row: {
          area_id: string | null
          created_at: string
          error: string | null
          id: string
          mime_type: string
          status: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          subject_id: string
          uploaded_by: string | null
        }
        Insert: {
          area_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          mime_type: string
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path: string
          subject_id: string
          uploaded_by?: string | null
        }
        Update: {
          area_id?: string | null
          created_at?: string
          error?: string | null
          id?: string
          mime_type?: string
          status?: Database["public"]["Enums"]["upload_status"]
          storage_path?: string
          subject_id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "uploads_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "uploads_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_monsters: {
        Row: {
          count: number
          first_at: string
          monster_id: number
          user_id: string
        }
        Insert: {
          count?: number
          first_at?: string
          monster_id: number
          user_id: string
        }
        Update: {
          count?: number
          first_at?: string
          monster_id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_monsters_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_submissions: {
        Row: {
          ai_call_id: string | null
          body: string
          char_count: number
          created_at: string
          feedback_md: string | null
          id: string
          moment_id: string
          user_id: string
          verdict: Database["public"]["Enums"]["writing_verdict"] | null
          writing_task_id: string
        }
        Insert: {
          ai_call_id?: string | null
          body: string
          char_count: number
          created_at?: string
          feedback_md?: string | null
          id?: string
          moment_id: string
          user_id: string
          verdict?: Database["public"]["Enums"]["writing_verdict"] | null
          writing_task_id: string
        }
        Update: {
          ai_call_id?: string | null
          body?: string
          char_count?: number
          created_at?: string
          feedback_md?: string | null
          id?: string
          moment_id?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["writing_verdict"] | null
          writing_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_submissions_ai_call_id_fkey"
            columns: ["ai_call_id"]
            isOneToOne: false
            referencedRelation: "ai_calls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writing_submissions_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writing_submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "writing_submissions_writing_task_id_fkey"
            columns: ["writing_task_id"]
            isOneToOne: false
            referencedRelation: "writing_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      writing_tasks: {
        Row: {
          created_at: string
          id: string
          min_chars: number
          moment_id: string
          prompt_md: string
          rubric_md: string
          sort_order: number
          status: Database["public"]["Enums"]["task_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_chars?: number
          moment_id: string
          prompt_md: string
          rubric_md?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_chars?: number
          moment_id?: string
          prompt_md?: string
          rubric_md?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["task_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "writing_tasks_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      xp_events: {
        Row: {
          amount: number
          attempt_id: string | null
          coins: number
          created_at: string
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          amount: number
          attempt_id?: string | null
          coins?: number
          created_at?: string
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          amount?: number
          attempt_id?: string | null
          coins?: number
          created_at?: string
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "xp_events_attempt_id_fkey"
            columns: ["attempt_id"]
            isOneToOne: false
            referencedRelation: "attempts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "xp_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_leaderboard: {
        Args: { p_period?: string }
        Returns: {
          avatar: string
          display_name: string
          level: number
          streak: number
          user_id: string
          xp: number
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      content_block_type: "intro" | "deepening" | "reading"
      moment_mode: "levels" | "read"
      moment_source: "generator" | "tasks"
      redemption_status: "pending" | "approved" | "denied"
      source_status: "pending" | "ready" | "failed"
      task_origin: "admin" | "ai"
      task_status: "draft" | "published"
      task_type:
        | "numeric"
        | "expression"
        | "multiple_choice"
        | "true_false"
        | "free_text"
      upload_status: "uploaded" | "processing" | "ready" | "failed"
      user_role: "admin" | "student"
      writing_verdict: "approved" | "almost" | "not_yet"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      content_block_type: ["intro", "deepening", "reading"],
      moment_mode: ["levels", "read"],
      moment_source: ["generator", "tasks"],
      redemption_status: ["pending", "approved", "denied"],
      source_status: ["pending", "ready", "failed"],
      task_origin: ["admin", "ai"],
      task_status: ["draft", "published"],
      task_type: [
        "numeric",
        "expression",
        "multiple_choice",
        "true_false",
        "free_text",
      ],
      upload_status: ["uploaded", "processing", "ready", "failed"],
      user_role: ["admin", "student"],
      writing_verdict: ["approved", "almost", "not_yet"],
    },
  },
} as const
