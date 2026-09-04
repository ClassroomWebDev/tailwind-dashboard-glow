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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          ambassador_code: string | null
          ambassador_id: string | null
          created_at: string
          deleted_at: string | null
          deleted_by: string | null
          district: string
          facebook_link: string | null
          full_name: string
          id: string
          institution: string
          mobile: string
          season_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ambassador_code?: string | null
          ambassador_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          district: string
          facebook_link?: string | null
          full_name: string
          id?: string
          institution: string
          mobile: string
          season_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ambassador_code?: string | null
          ambassador_id?: string | null
          created_at?: string
          deleted_at?: string | null
          deleted_by?: string | null
          district?: string
          facebook_link?: string | null
          full_name?: string
          id?: string
          institution?: string
          mobile?: string
          season_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      attendances: {
        Row: {
          ambassador_id: string
          created_at: string
          id: string
          marked_by: string | null
          present: boolean
          session_id: string
          updated_at: string
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          id?: string
          marked_by?: string | null
          present?: boolean
          session_id: string
          updated_at?: string
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          id?: string
          marked_by?: string | null
          present?: boolean
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendances_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "class_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      batches: {
        Row: {
          class_time: string | null
          community_link: string | null
          course_id: string
          created_at: string
          created_by: string | null
          days_of_week: number[]
          id: string
          name: string
          notes: string | null
          start_date: string
          total_classes: number
          updated_at: string
        }
        Insert: {
          class_time?: string | null
          community_link?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          id?: string
          name: string
          notes?: string | null
          start_date: string
          total_classes?: number
          updated_at?: string
        }
        Update: {
          class_time?: string | null
          community_link?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          days_of_week?: number[]
          id?: string
          name?: string
          notes?: string | null
          start_date?: string
          total_classes?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "batches_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      big_opportunities: {
        Row: {
          ambassador_price: number
          apply_url: string | null
          banner_url: string | null
          commission: number
          coordinator_price: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          leadership_points_per_sale: number
          price: number
          regular_price: number
          sort_order: number
          student_price: number
          title: string
          updated_at: string
        }
        Insert: {
          ambassador_price?: number
          apply_url?: string | null
          banner_url?: string | null
          commission?: number
          coordinator_price?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leadership_points_per_sale?: number
          price?: number
          regular_price?: number
          sort_order?: number
          student_price?: number
          title: string
          updated_at?: string
        }
        Update: {
          ambassador_price?: number
          apply_url?: string | null
          banner_url?: string | null
          commission?: number
          coordinator_price?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          leadership_points_per_sale?: number
          price?: number
          regular_price?: number
          sort_order?: number
          student_price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      certificate_templates: {
        Row: {
          authority_name: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string
          is_active: boolean
          name: string
          signature_url: string | null
          updated_at: string
        }
        Insert: {
          authority_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          name?: string
          signature_url?: string | null
          updated_at?: string
        }
        Update: {
          authority_name?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          name?: string
          signature_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      certificates: {
        Row: {
          approved_by: string | null
          course_id: string
          created_at: string
          id: string
          issued_at: string | null
          serial_no: string | null
          status: string
          template_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          approved_by?: string | null
          course_id: string
          created_at?: string
          id?: string
          issued_at?: string | null
          serial_no?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          approved_by?: string | null
          course_id?: string
          created_at?: string
          id?: string
          issued_at?: string | null
          serial_no?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "certificate_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "certificates_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      class_sessions: {
        Row: {
          batch_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          sequence_no: number | null
          session_date: string
          session_type: string
          start_time: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          sequence_no?: number | null
          session_date?: string
          session_type?: string
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          sequence_no?: number | null
          session_date?: string
          session_type?: string
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "class_sessions_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "class_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      cms_sections: {
        Row: {
          body: string | null
          created_at: string
          created_by: string | null
          id: string
          image_url: string | null
          is_published: boolean
          kind: string
          link_label: string | null
          link_url: string | null
          sort_order: number
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          kind?: string
          link_label?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          kind?: string
          link_label?: string | null
          link_url?: string | null
          sort_order?: number
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_wings: {
        Row: {
          address: string | null
          badge_label: string | null
          created_at: string
          created_by: string | null
          description: string | null
          email: string | null
          helpline: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          social_links: Json
          sort_order: number
          tagline: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          badge_label?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          helpline?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          social_links?: Json
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          badge_label?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          email?: string | null
          helpline?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          social_links?: Json
          sort_order?: number
          tagline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      course_topics: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          note: string | null
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string | null
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_topics_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          ambassador_price: number
          banner_url: string | null
          class_quantity: number
          coordinator_price: number
          created_at: string
          created_by: string | null
          details: string | null
          end_date: string | null
          has_certificate: boolean
          id: string
          leadership_points_per_sale: number
          learning_points_per_class: number
          mission: string | null
          name: string
          regular_price: number
          season_id: string | null
          start_date: string | null
          student_price: number
          updated_at: string
        }
        Insert: {
          ambassador_price?: number
          banner_url?: string | null
          class_quantity?: number
          coordinator_price?: number
          created_at?: string
          created_by?: string | null
          details?: string | null
          end_date?: string | null
          has_certificate?: boolean
          id?: string
          leadership_points_per_sale?: number
          learning_points_per_class?: number
          mission?: string | null
          name: string
          regular_price?: number
          season_id?: string | null
          start_date?: string | null
          student_price?: number
          updated_at?: string
        }
        Update: {
          ambassador_price?: number
          banner_url?: string | null
          class_quantity?: number
          coordinator_price?: number
          created_at?: string
          created_by?: string | null
          details?: string | null
          end_date?: string | null
          has_certificate?: boolean
          id?: string
          leadership_points_per_sale?: number
          learning_points_per_class?: number
          mission?: string | null
          name?: string
          regular_price?: number
          season_id?: string | null
          start_date?: string | null
          student_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      event_attendances: {
        Row: {
          ambassador_id: string
          created_at: string
          event_id: string
          id: string
          marked_by: string | null
          present: boolean
          updated_at: string
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          event_id: string
          id?: string
          marked_by?: string | null
          present?: boolean
          updated_at?: string
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          event_id?: string
          id?: string
          marked_by?: string | null
          present?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_attendances_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_cancelled: boolean
          learning_points: number
          location: string
          starts_at: string
          title: string
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_cancelled?: boolean
          learning_points?: number
          location?: string
          starts_at: string
          title: string
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_cancelled?: boolean
          learning_points?: number
          location?: string
          starts_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      logo_boards: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          link_url: string | null
          logo_url: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          logo_url: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          link_url?: string | null
          logo_url?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      member_reviews: {
        Row: {
          author_name: string
          created_at: string
          id: string
          institution: string | null
          moderated_by: string | null
          photo_url: string | null
          rating: number
          review_text: string
          role: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name: string
          created_at?: string
          id?: string
          institution?: string | null
          moderated_by?: string | null
          photo_url?: string | null
          rating?: number
          review_text: string
          role?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string
          created_at?: string
          id?: string
          institution?: string | null
          moderated_by?: string | null
          photo_url?: string | null
          rating?: number
          review_text?: string
          role?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "member_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_achievements: {
        Row: {
          achieved_at: string
          created_at: string
          id: string
          leadership_points: number
          learning_points: number
          milestone_id: string
          user_id: string
        }
        Insert: {
          achieved_at?: string
          created_at?: string
          id?: string
          leadership_points?: number
          learning_points?: number
          milestone_id: string
          user_id: string
        }
        Update: {
          achieved_at?: string
          created_at?: string
          id?: string
          leadership_points?: number
          learning_points?: number
          milestone_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "milestone_achievements_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "season_milestones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "milestone_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          audience: Database["public"]["Enums"]["notice_audience"]
          content: string
          created_at: string
          created_by: string | null
          id: string
          target_roles: Database["public"]["Enums"]["app_role"][]
          target_user_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          audience?: Database["public"]["Enums"]["notice_audience"]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_roles?: Database["public"]["Enums"]["app_role"][]
          target_user_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          audience?: Database["public"]["Enums"]["notice_audience"]
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          target_roles?: Database["public"]["Enums"]["app_role"][]
          target_user_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          event_id: string | null
          id: string
          is_read: boolean
          kind: string
          notice_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          notice_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          event_id?: string | null
          id?: string
          is_read?: boolean
          kind?: string
          notice_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_notice_id_fkey"
            columns: ["notice_id"]
            isOneToOne: false
            referencedRelation: "notices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          alt_mobile: string | null
          auto_id: string | null
          badge_url: string | null
          blood_group: string | null
          can_access_all_seasons: boolean
          career_objective: string | null
          coordinator_id: string | null
          created_at: string
          created_by: string | null
          date_of_birth: string | null
          designation: string | null
          education: Json
          experience: string | null
          facebook_link: string | null
          father_name: string | null
          favourite_book: string | null
          favourite_movies: string | null
          favourite_person: string | null
          favourite_place: string | null
          favourite_teacher: string | null
          full_name: string
          hobby: string | null
          home_district: string | null
          id: string
          idol: string | null
          institution: string | null
          languages: string | null
          leadership_points: number
          learning_points: number
          marital_status: string | null
          mentor_id: string | null
          mobile: string
          mother_name: string | null
          nid_no: string | null
          permanent_address: string | null
          photo_url: string | null
          present_address: string | null
          professional_title: string | null
          ref1_designation: string | null
          ref1_email: string | null
          ref1_name: string | null
          ref1_phone: string | null
          ref1_relation: string | null
          ref2_designation: string | null
          ref2_email: string | null
          ref2_name: string | null
          ref2_phone: string | null
          ref2_relation: string | null
          religion: string | null
          season_id: string | null
          signature_url: string | null
          soft_skills: string | null
          status: Database["public"]["Enums"]["account_status"]
          support_manager_id: string | null
          technical_skills: string | null
          ultimate_goal: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          alt_mobile?: string | null
          auto_id?: string | null
          badge_url?: string | null
          blood_group?: string | null
          can_access_all_seasons?: boolean
          career_objective?: string | null
          coordinator_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          designation?: string | null
          education?: Json
          experience?: string | null
          facebook_link?: string | null
          father_name?: string | null
          favourite_book?: string | null
          favourite_movies?: string | null
          favourite_person?: string | null
          favourite_place?: string | null
          favourite_teacher?: string | null
          full_name?: string
          hobby?: string | null
          home_district?: string | null
          id: string
          idol?: string | null
          institution?: string | null
          languages?: string | null
          leadership_points?: number
          learning_points?: number
          marital_status?: string | null
          mentor_id?: string | null
          mobile?: string
          mother_name?: string | null
          nid_no?: string | null
          permanent_address?: string | null
          photo_url?: string | null
          present_address?: string | null
          professional_title?: string | null
          ref1_designation?: string | null
          ref1_email?: string | null
          ref1_name?: string | null
          ref1_phone?: string | null
          ref1_relation?: string | null
          ref2_designation?: string | null
          ref2_email?: string | null
          ref2_name?: string | null
          ref2_phone?: string | null
          ref2_relation?: string | null
          religion?: string | null
          season_id?: string | null
          signature_url?: string | null
          soft_skills?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          support_manager_id?: string | null
          technical_skills?: string | null
          ultimate_goal?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          alt_mobile?: string | null
          auto_id?: string | null
          badge_url?: string | null
          blood_group?: string | null
          can_access_all_seasons?: boolean
          career_objective?: string | null
          coordinator_id?: string | null
          created_at?: string
          created_by?: string | null
          date_of_birth?: string | null
          designation?: string | null
          education?: Json
          experience?: string | null
          facebook_link?: string | null
          father_name?: string | null
          favourite_book?: string | null
          favourite_movies?: string | null
          favourite_person?: string | null
          favourite_place?: string | null
          favourite_teacher?: string | null
          full_name?: string
          hobby?: string | null
          home_district?: string | null
          id?: string
          idol?: string | null
          institution?: string | null
          languages?: string | null
          leadership_points?: number
          learning_points?: number
          marital_status?: string | null
          mentor_id?: string | null
          mobile?: string
          mother_name?: string | null
          nid_no?: string | null
          permanent_address?: string | null
          photo_url?: string | null
          present_address?: string | null
          professional_title?: string | null
          ref1_designation?: string | null
          ref1_email?: string | null
          ref1_name?: string | null
          ref1_phone?: string | null
          ref1_relation?: string | null
          ref2_designation?: string | null
          ref2_email?: string | null
          ref2_name?: string | null
          ref2_phone?: string | null
          ref2_relation?: string | null
          religion?: string | null
          season_id?: string | null
          signature_url?: string | null
          soft_skills?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          support_manager_id?: string | null
          technical_skills?: string | null
          ultimate_goal?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_coordinator_id_fkey"
            columns: ["coordinator_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_mentor_id_fkey"
            columns: ["mentor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_support_manager_id_fkey"
            columns: ["support_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      program_settings: {
        Row: {
          brand_logo_url: string | null
          brand_name: string | null
          brand_primary: string | null
          brand_title: string
          certificate_threshold_percent: number
          created_at: string
          helpline_note: string | null
          helpline_whatsapp: string | null
          id: boolean
          key: string
          org_address: string | null
          org_facebook: string | null
          org_helpline: string | null
          org_name: string
          org_website: string | null
          season_start: string
          season_target_points: number
          updated_at: string
          value: Json | null
        }
        Insert: {
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_primary?: string | null
          brand_title?: string
          certificate_threshold_percent?: number
          created_at?: string
          helpline_note?: string | null
          helpline_whatsapp?: string | null
          id?: boolean
          key: string
          org_address?: string | null
          org_facebook?: string | null
          org_helpline?: string | null
          org_name?: string
          org_website?: string | null
          season_start?: string
          season_target_points?: number
          updated_at?: string
          value?: Json | null
        }
        Update: {
          brand_logo_url?: string | null
          brand_name?: string | null
          brand_primary?: string | null
          brand_title?: string
          certificate_threshold_percent?: number
          created_at?: string
          helpline_note?: string | null
          helpline_whatsapp?: string | null
          id?: boolean
          key?: string
          org_address?: string | null
          org_facebook?: string | null
          org_helpline?: string | null
          org_name?: string
          org_website?: string | null
          season_start?: string
          season_target_points?: number
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      promo_resources: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          ambassador_id: string
          created_at: string
          facebook_link: string | null
          id: string
          mobile: string
          name: string
          note: string | null
          status: string
          updated_at: string
        }
        Insert: {
          ambassador_id: string
          created_at?: string
          facebook_link?: string | null
          id?: string
          mobile: string
          name: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          ambassador_id?: string
          created_at?: string
          facebook_link?: string | null
          id?: string
          mobile?: string
          name?: string
          note?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prospects_ambassador_id_fkey"
            columns: ["ambassador_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          ambassador_id: string
          amount: number
          approved_at: string | null
          approved_by: string | null
          big_opportunity_id: string | null
          course_id: string | null
          created_at: string
          deleted_at: string | null
          id: string
          invoice_no: string | null
          notes: string | null
          order_no: string | null
          payment_method: string
          payment_ref: string | null
          season_id: string | null
          status: Database["public"]["Enums"]["sale_status"]
          student_district: string | null
          student_email: string | null
          student_institution: string | null
          student_mobile: string
          student_name: string
          submitted_by: string | null
          tx_id: string | null
          updated_at: string
        }
        Insert: {
          ambassador_id: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          big_opportunity_id?: string | null
          course_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_no?: string | null
          notes?: string | null
          order_no?: string | null
          payment_method: string
          payment_ref?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          student_district?: string | null
          student_email?: string | null
          student_institution?: string | null
          student_mobile: string
          student_name: string
          submitted_by?: string | null
          tx_id?: string | null
          updated_at?: string
        }
        Update: {
          ambassador_id?: string
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          big_opportunity_id?: string | null
          course_id?: string | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          invoice_no?: string | null
          notes?: string | null
          order_no?: string | null
          payment_method?: string
          payment_ref?: string | null
          season_id?: string | null
          status?: Database["public"]["Enums"]["sale_status"]
          student_district?: string | null
          student_email?: string | null
          student_institution?: string | null
          student_mobile?: string
          student_name?: string
          submitted_by?: string | null
          tx_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_big_opportunity_id_fkey"
            columns: ["big_opportunity_id"]
            isOneToOne: false
            referencedRelation: "big_opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      season_milestones: {
        Row: {
          created_at: string
          id: string
          min_leadership_points: number
          min_learning_points: number
          reward_description: string | null
          season_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          min_leadership_points?: number
          min_learning_points?: number
          reward_description?: string | null
          season_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          min_leadership_points?: number
          min_learning_points?: number
          reward_description?: string | null
          season_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "season_milestones_season_id_fkey"
            columns: ["season_id"]
            isOneToOne: false
            referencedRelation: "seasons"
            referencedColumns: ["id"]
          },
        ]
      }
      seasons: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          is_archived: boolean
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          start_date?: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          is_archived?: boolean
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_contacts: {
        Row: {
          available_hours: string | null
          created_at: string
          created_by: string | null
          email: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          photo_url: string | null
          role_label: string | null
          sort_order: number
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          available_hours?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          photo_url?: string | null
          role_label?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          available_hours?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          photo_url?: string | null
          role_label?: string | null
          sort_order?: number
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      support_links: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          label: string
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label: string
          platform?: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          label?: string
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
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
      can_view_all_sales: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_downstream: { Args: { _profile_id: string }; Returns: boolean }
      is_my_ambassador: { Args: { _profile_id: string }; Returns: boolean }
      is_my_supervisor: { Args: { _profile_id: string }; Returns: boolean }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      leaderboard_ambassadors: {
        Args: { _limit?: number }
        Returns: {
          auto_id: string
          full_name: string
          institution: string
          leadership_points: number
          learning_points: number
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      leaderboard_ambassadors_season: {
        Args: { _limit?: number; _season_id?: string }
        Returns: {
          auto_id: string
          full_name: string
          institution: string
          leadership_points: number
          learning_points: number
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      leaderboard_coordinators: {
        Args: { _limit?: number }
        Returns: {
          auto_id: string
          full_name: string
          institution: string
          rank: number
          sales_amount: number
          sales_count: number
          user_id: string
        }[]
      }
      leaderboard_top: {
        Args: { _limit?: number }
        Returns: {
          auto_id: string
          full_name: string
          institution: string
          leadership_points: number
          learning_points: number
          rank: number
          total_points: number
          user_id: string
        }[]
      }
      my_leaderboard_rank: {
        Args: never
        Returns: {
          leader_points: number
          rank: number
          total_points: number
        }[]
      }
      next_auto_id: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      next_certificate_serial: { Args: never; Returns: string }
      recalc_points: { Args: { _user_id: string }; Returns: undefined }
      role_prefix: {
        Args: { _role: Database["public"]["Enums"]["app_role"] }
        Returns: string
      }
      sync_milestone_achievements: {
        Args: { _user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      account_status: "active" | "held"
      app_role:
        | "ambassador"
        | "coordinator"
        | "mentor"
        | "support_manager"
        | "admin"
      notice_audience: "all" | "roles" | "individual"
      sale_status: "pending" | "approved" | "rejected"
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
      account_status: ["active", "held"],
      app_role: [
        "ambassador",
        "coordinator",
        "mentor",
        "support_manager",
        "admin",
      ],
      notice_audience: ["all", "roles", "individual"],
      sale_status: ["pending", "approved", "rejected"],
    },
  },
} as const
