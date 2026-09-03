// Hand-written to match supabase/migrations/0001_init.sql.
// Regenerate with `npm run types` once `npx supabase login` + project link is set up (see package.json).

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          created_at?: string
        }
        Relationships: []
      }
      sets: {
        Row: {
          id: string
          owner_id: string
          title: string
          description: string | null
          exam_date: string | null
          visibility: 'private' | 'shared'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          title: string
          description?: string | null
          exam_date?: string | null
          visibility?: 'private' | 'shared'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          title?: string
          description?: string | null
          exam_date?: string | null
          visibility?: 'private' | 'shared'
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      cards: {
        Row: {
          id: string
          set_id: string
          term: string
          definition: string
          term_image: string | null
          definition_image: string | null
          position: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          set_id: string
          term: string
          definition: string
          term_image?: string | null
          definition_image?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          set_id?: string
          term?: string
          definition?: string
          term_image?: string | null
          definition_image?: string | null
          position?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      set_members: {
        Row: {
          set_id: string
          user_id: string
          role: 'viewer' | 'editor'
          created_at: string
        }
        Insert: {
          set_id: string
          user_id: string
          role?: 'viewer' | 'editor'
          created_at?: string
        }
        Update: {
          set_id?: string
          user_id?: string
          role?: 'viewer' | 'editor'
          created_at?: string
        }
        Relationships: []
      }
      card_progress: {
        Row: {
          user_id: string
          card_id: string
          set_id: string
          box: number
          consecutive_correct: number
          lapses: number
          times_seen: number
          times_correct: number
          starred: boolean
          due_at: string
          last_seen_at: string | null
        }
        Insert: {
          user_id: string
          card_id: string
          set_id: string
          box?: number
          consecutive_correct?: number
          lapses?: number
          times_seen?: number
          times_correct?: number
          starred?: boolean
          due_at?: string
          last_seen_at?: string | null
        }
        Update: {
          user_id?: string
          card_id?: string
          set_id?: string
          box?: number
          consecutive_correct?: number
          lapses?: number
          times_seen?: number
          times_correct?: number
          starred?: boolean
          due_at?: string
          last_seen_at?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          id: string
          user_id: string
          set_id: string
          mode: 'flashcards' | 'learn' | 'test' | 'cram'
          started_at: string
          ended_at: string | null
          cards_seen: number
          cards_correct: number
        }
        Insert: {
          id?: string
          user_id: string
          set_id: string
          mode: 'flashcards' | 'learn' | 'test' | 'cram'
          started_at?: string
          ended_at?: string | null
          cards_seen?: number
          cards_correct?: number
        }
        Update: {
          id?: string
          user_id?: string
          set_id?: string
          mode?: 'flashcards' | 'learn' | 'test' | 'cram'
          started_at?: string
          ended_at?: string | null
          cards_seen?: number
          cards_correct?: number
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          id: string
          user_id: string
          set_id: string
          question_count: number
          score: number
          config: Json
          answers: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          set_id: string
          question_count: number
          score: number
          config?: Json
          answers?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          set_id?: string
          question_count?: number
          score?: number
          config?: Json
          answers?: Json
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: {
      add_member_by_email: {
        Args: { p_set: string; p_email: string; p_role?: 'viewer' | 'editor' }
        Returns: Database['public']['Tables']['set_members']['Row']
      }
    }
    Enums: Record<string, never>
  }
}
