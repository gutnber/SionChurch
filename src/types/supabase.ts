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
          created_at: string
          name: string
          email: string
          phone: string
          role: 'admin' | 'pastor' | 'leader' | 'server' | 'member'
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          name: string
          email: string
          phone: string
          role?: 'admin' | 'pastor' | 'leader' | 'server' | 'member'
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          email?: string
          phone?: string
          role?: 'admin' | 'pastor' | 'leader' | 'server' | 'member'
          avatar_url?: string | null
        }
      }
      events: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          date: string
          location: string
          image_url: string | null
          visibility: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          date: string
          location: string
          image_url?: string | null
          visibility?: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          date?: string
          location?: string
          image_url?: string | null
          visibility?: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
      }
      news: {
        Row: {
          id: string
          created_at: string
          title: string
          content: string
          image_url: string | null
          author_id: string
          visibility: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          content: string
          image_url?: string | null
          author_id: string
          visibility?: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          content?: string
          image_url?: string | null
          author_id?: string
          visibility?: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
      }
      activities: {
        Row: {
          id: string
          created_at: string
          day_of_week: string
          title: string
          description: string
          time: string
          location: string
        }
        Insert: {
          id?: string
          created_at?: string
          day_of_week: string
          title: string
          description: string
          time: string
          location: string
        }
        Update: {
          id?: string
          created_at?: string
          day_of_week?: string
          title?: string
          description?: string
          time?: string
          location?: string
        }
      }
      gallery: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          image_url: string
          visibility: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          image_url: string
          visibility?: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          image_url?: string
          visibility?: 'public' | 'admin' | 'pastor' | 'leader' | 'server' | 'member'
        }
      }
      themes: {
        Row: {
          id: string
          created_at: string
          name: string
          primary_color: string
          secondary_color: string
          accent_color: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          primary_color: string
          secondary_color: string
          accent_color: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          primary_color?: string
          secondary_color?: string
          accent_color?: string
          is_active?: boolean
        }
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
  }
}