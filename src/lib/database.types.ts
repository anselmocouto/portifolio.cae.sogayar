// Tipos manuais, confirmados via information_schema.columns no Supabase real (03/07/2026).
// Idealmente substituir por: supabase gen types typescript --project-id <id> > src/lib/database.types.ts

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          color: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          color?: string
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['categories']['Insert']>
      }
      projects: {
        Row: {
          id: string
          title: string
          summary: string | null
          content: string | null
          category_id: string | null
          outlet: string | null
          external_url: string | null
          published_at: string | null
          cover_path: string | null
          featured: boolean
          status: 'draft' | 'published'
          sort_order: number
          links: { url: string; description: string }[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          summary?: string | null
          content?: string | null
          category_id?: string | null
          outlet?: string | null
          external_url?: string | null
          published_at?: string | null
          cover_path?: string | null
          featured?: boolean
          status?: 'draft' | 'published'
          sort_order?: number
          links?: { url: string; description: string }[]
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['projects']['Insert']>
      }
      project_files: {
        Row: {
          id: string
          project_id: string
          file_path: string
          file_name: string
          mime_type: string | null
          size_bytes: number | null
          downloadable: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          file_path: string
          file_name: string
          mime_type?: string | null
          size_bytes?: number | null
          downloadable?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['project_files']['Insert']>
      }
      site_settings: {
        Row: {
          id: number
          full_name: string
          headline: string
          bio: string
          city: string | null
          email: string | null
          photo_path: string | null
          banner_path: string | null
          social_links: Record<string, string>
          updated_at: string
          personal_statement: string | null
        }
        Insert: Partial<Database['public']['Tables']['site_settings']['Row']> & { id: number }
        Update: Partial<Database['public']['Tables']['site_settings']['Row']>
      }
      contact_messages: {
        Row: {
          id: string
          name: string
          email: string
          message: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email: string
          message: string
          read?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['contact_messages']['Insert']>
      }
    }
  }
}
