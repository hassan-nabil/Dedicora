export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          onboarding_completed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          onboarding_completed?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          mode: "single" | "breakdown"
          status: "active" | "paused" | "completed" | "abandoned" | "deleted"
          current_step: "task" | "assign" | "timer" | "report"
          current_task_index: number
          total_estimated_seconds: number
          total_actual_seconds: number
          total_overtime_seconds: number
          total_break_seconds: number
          report_data: Json | null
          started_at: string | null
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          mode?: "single" | "breakdown"
          status?: "active" | "paused" | "completed" | "abandoned" | "deleted"
          current_step?: "task" | "assign" | "timer" | "report"
          current_task_index?: number
          total_estimated_seconds?: number
          total_actual_seconds?: number
          total_overtime_seconds?: number
          total_break_seconds?: number
          report_data?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          mode?: "single" | "breakdown"
          status?: "active" | "paused" | "completed" | "abandoned" | "deleted"
          current_step?: "task" | "assign" | "timer" | "report"
          current_task_index?: number
          total_estimated_seconds?: number
          total_actual_seconds?: number
          total_overtime_seconds?: number
          total_break_seconds?: number
          report_data?: Json | null
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          id: string
          session_id: string
          order_index: number
          title: string
          description: string | null
          estimated_seconds: number
          actual_seconds: number
          overtime_seconds: number
          status: "pending" | "active" | "completed" | "skipped"
          started_at: string | null
          completed_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          order_index?: number
          title: string
          description?: string | null
          estimated_seconds?: number
          actual_seconds?: number
          overtime_seconds?: number
          status?: "pending" | "active" | "completed" | "skipped"
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          order_index?: number
          title?: string
          description?: string | null
          estimated_seconds?: number
          actual_seconds?: number
          overtime_seconds?: number
          status?: "pending" | "active" | "completed" | "skipped"
          started_at?: string | null
          completed_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          id: string
          session_id: string
          user_id: string
          content: string
          updated_at: string
        }
        Insert: {
          id?: string
          session_id: string
          user_id: string
          content?: string
          updated_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          user_id?: string
          content?: string
          updated_at?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: "user" | "assistant" | "system"
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: "user" | "assistant" | "system"
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: "user" | "assistant" | "system"
          content?: string
          created_at?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          user_id: string
          audio_enabled: boolean
          theme_mode: string
          color_blind_mode: string
          preferred_session_duration: number
          daily_goal_minutes: number
          updated_at: string
        }
        Insert: {
          user_id: string
          audio_enabled?: boolean
          theme_mode?: string
          color_blind_mode?: string
          preferred_session_duration?: number
          daily_goal_minutes?: number
          updated_at?: string
        }
        Update: {
          user_id?: string
          audio_enabled?: boolean
          theme_mode?: string
          color_blind_mode?: string
          preferred_session_duration?: number
          daily_goal_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
