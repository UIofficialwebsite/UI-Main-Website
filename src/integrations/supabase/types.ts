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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_audit_log: {
        Row: {
          action: string
          admin_email: string
          admin_user_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_email: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_email?: string
          admin_user_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string | null
          user_agent?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          created_by: string | null
          email: string
          id: string
          is_super_admin: boolean
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email: string
          id?: string
          is_super_admin?: boolean
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string
          id?: string
          is_super_admin?: boolean
        }
        Relationships: []
      }
      app_routes: {
        Row: {
          component_name: string
          entity_id: string | null
          entity_type: string | null
          id: string
          path: string
          route_type: string | null
          updated_at: string | null
        }
        Insert: {
          component_name: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          path: string
          route_type?: string | null
          updated_at?: string | null
        }
        Update: {
          component_name?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          path?: string
          route_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      batch_schedule: {
        Row: {
          batch_name: string
          course_id: string
          file_link: string
          id: string
          subject_name: string
        }
        Insert: {
          batch_name: string
          course_id: string
          file_link: string
          id?: string
          subject_name: string
        }
        Update: {
          batch_name?: string
          course_id?: string
          file_link?: string
          id?: string
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_schedule_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      cashfree_webhook_events: {
        Row: {
          cf_payment_id: string | null
          event_type: string | null
          id: string
          order_id: string | null
          processed_at: string | null
          processing_error: string | null
          raw_payload: Json
          received_at: string | null
          signature_valid: boolean
        }
        Insert: {
          cf_payment_id?: string | null
          event_type?: string | null
          id?: string
          order_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          raw_payload: Json
          received_at?: string | null
          signature_valid: boolean
        }
        Update: {
          cf_payment_id?: string | null
          event_type?: string | null
          id?: string
          order_id?: string | null
          processed_at?: string | null
          processing_error?: string | null
          raw_payload?: Json
          received_at?: string | null
          signature_valid?: boolean
        }
        Relationships: []
      }
      communities: {
        Row: {
          branch: string | null
          class_level: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          exam_type: string | null
          group_link: string
          group_type: string
          id: string
          is_active: boolean | null
          level: string | null
          member_count: number | null
          name: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          branch?: string | null
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_type?: string | null
          group_link: string
          group_type: string
          id?: string
          is_active?: boolean | null
          level?: string | null
          member_count?: number | null
          name: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          branch?: string | null
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          exam_type?: string | null
          group_link?: string
          group_type?: string
          id?: string
          is_active?: boolean | null
          level?: string | null
          member_count?: number | null
          name?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      country_codes: {
        Row: {
          code: string
          created_at: string | null
          dial_code: string
          id: string
          name: string
          phone_length: number
        }
        Insert: {
          code: string
          created_at?: string | null
          dial_code: string
          id?: string
          name: string
          phone_length: number
        }
        Update: {
          code?: string
          created_at?: string | null
          dial_code?: string
          id?: string
          name?: string
          phone_length?: number
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          discount_amount: number
          enrollment_id: string | null
          final_amount: number
          id: string
          order_id: string | null
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_id: string
          discount_amount: number
          enrollment_id?: string | null
          final_amount: number
          id?: string
          order_id?: string | null
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_id?: string
          discount_amount?: number
          enrollment_id?: string | null
          final_amount?: number
          id?: string
          order_id?: string | null
          redeemed_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          applicable_course_ids: string[] | null
          applicable_user_emails: string[] | null
          code: string
          created_at: string
          created_by: string | null
          current_uses: number
          discount_type: string
          discount_value: number
          display_label: string | null
          display_priority: number
          id: string
          is_active: boolean
          is_auto_applied: boolean
          is_first_purchase_only: boolean
          max_discount: number | null
          max_total_uses: number | null
          max_uses_per_user: number
          min_order_amount: number
          min_prev_enrollments: number | null
          prev_enrolled_within_days: number | null
          stackable: boolean
          updated_at: string
          user_segment: string | null
          valid_from: string | null
          valid_until: string | null
          visibility: string
        }
        Insert: {
          applicable_course_ids?: string[] | null
          applicable_user_emails?: string[] | null
          code: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type: string
          discount_value: number
          display_label?: string | null
          display_priority?: number
          id?: string
          is_active?: boolean
          is_auto_applied?: boolean
          is_first_purchase_only?: boolean
          max_discount?: number | null
          max_total_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          min_prev_enrollments?: number | null
          prev_enrolled_within_days?: number | null
          stackable?: boolean
          updated_at?: string
          user_segment?: string | null
          valid_from?: string | null
          valid_until?: string | null
          visibility?: string
        }
        Update: {
          applicable_course_ids?: string[] | null
          applicable_user_emails?: string[] | null
          code?: string
          created_at?: string
          created_by?: string | null
          current_uses?: number
          discount_type?: string
          discount_value?: number
          display_label?: string | null
          display_priority?: number
          id?: string
          is_active?: boolean
          is_auto_applied?: boolean
          is_first_purchase_only?: boolean
          max_discount?: number | null
          max_total_uses?: number | null
          max_uses_per_user?: number
          min_order_amount?: number
          min_prev_enrollments?: number | null
          prev_enrolled_within_days?: number | null
          stackable?: boolean
          updated_at?: string
          user_segment?: string | null
          valid_from?: string | null
          valid_until?: string | null
          visibility?: string
        }
        Relationships: []
      }
      course_addons: {
        Row: {
          course_id: string
          created_at: string | null
          id: string
          price: number
          subject_name: string
        }
        Insert: {
          course_id: string
          created_at?: string | null
          id?: string
          price?: number
          subject_name: string
        }
        Update: {
          course_id?: string
          created_at?: string | null
          id?: string
          price?: number
          subject_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_addons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_faqs: {
        Row: {
          answer: string
          course_id: string
          created_at: string
          id: string
          question: string
        }
        Insert: {
          answer: string
          course_id: string
          created_at?: string
          id?: string
          question: string
        }
        Update: {
          answer?: string
          course_id?: string
          created_at?: string
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_faqs_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          batch_type: string | null
          bestseller: boolean | null
          branch: string | null
          course_type: string | null
          created_at: string | null
          description: string
          discounted_price: number | null
          duration: string
          end_date: string | null
          enroll_now_link: string | null
          exam_category: string | null
          expiry_date: string | null
          features: string[] | null
          id: string
          image_url: string | null
          is_live: boolean | null
          language: string | null
          level: string | null
          parent_course_id: string | null
          payment_type: string | null
          price: number
          rating: number | null
          start_date: string | null
          students_enrolled: number | null
          subject: string | null
          tags: string[] | null
          title: string
          updated_at: string | null
          valid_till: string | null
        }
        Insert: {
          batch_type?: string | null
          bestseller?: boolean | null
          branch?: string | null
          course_type?: string | null
          created_at?: string | null
          description: string
          discounted_price?: number | null
          duration: string
          end_date?: string | null
          enroll_now_link?: string | null
          exam_category?: string | null
          expiry_date?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_live?: boolean | null
          language?: string | null
          level?: string | null
          parent_course_id?: string | null
          payment_type?: string | null
          price: number
          rating?: number | null
          start_date?: string | null
          students_enrolled?: number | null
          subject?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
          valid_till?: string | null
        }
        Update: {
          batch_type?: string | null
          bestseller?: boolean | null
          branch?: string | null
          course_type?: string | null
          created_at?: string | null
          description?: string
          discounted_price?: number | null
          duration?: string
          end_date?: string | null
          enroll_now_link?: string | null
          exam_category?: string | null
          expiry_date?: string | null
          features?: string[] | null
          id?: string
          image_url?: string | null
          is_live?: boolean | null
          language?: string | null
          level?: string | null
          parent_course_id?: string | null
          payment_type?: string | null
          price?: number
          rating?: number | null
          start_date?: string | null
          students_enrolled?: number | null
          subject?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
          valid_till?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_parent_course_id_fkey"
            columns: ["parent_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string | null
          department: string | null
          employee_code: string
          employee_type: string | null
          end_date: string | null
          full_name: string
          id: string
          is_active: boolean
          position: string
          start_date: string | null
          status: string | null
          updated_at: string | null
          verification_certificate_url: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          employee_code: string
          employee_type?: string | null
          end_date?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          position: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          verification_certificate_url?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          employee_code?: string
          employee_type?: string | null
          end_date?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          position?: string
          start_date?: string | null
          status?: string | null
          updated_at?: string | null
          verification_certificate_url?: string | null
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          amount: number | null
          coupon_code: string | null
          coupon_id: string | null
          course_id: string
          created_at: string | null
          discount_amount: number | null
          id: string
          order_id: string | null
          payment_id: string | null
          status: string | null
          subject_name: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          coupon_code?: string | null
          coupon_id?: string | null
          course_id: string
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          status?: string | null
          subject_name?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          coupon_code?: string | null
          coupon_id?: string | null
          course_id?: string
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          payment_id?: string | null
          status?: string | null
          subject_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      focus_options: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          label: string
          parent_id: string | null
          profile_column_to_update: string
          value_to_save: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          label: string
          parent_id?: string | null
          profile_column_to_update: string
          value_to_save: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          label?: string
          parent_id?: string | null
          profile_column_to_update?: string
          value_to_save?: string
        }
        Relationships: [
          {
            foreignKeyName: "focus_options_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "focus_options"
            referencedColumns: ["id"]
          },
        ]
      }
      iitm_branch_notes: {
        Row: {
          branch: string
          created_at: string
          description: string | null
          diploma_specialization: string | null
          download_count: number
          file_link: string | null
          id: string
          is_active: boolean
          level: string
          subject: string
          subject_id: number | null
          title: string
          updated_at: string
          week_number: number
        }
        Insert: {
          branch: string
          created_at?: string
          description?: string | null
          diploma_specialization?: string | null
          download_count?: number
          file_link?: string | null
          id?: string
          is_active?: boolean
          level: string
          subject: string
          subject_id?: number | null
          title: string
          updated_at?: string
          week_number: number
        }
        Update: {
          branch?: string
          created_at?: string
          description?: string | null
          diploma_specialization?: string | null
          download_count?: number
          file_link?: string | null
          id?: string
          is_active?: boolean
          level?: string
          subject?: string
          subject_id?: number | null
          title?: string
          updated_at?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "iitm_branch_notes_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "iitm_bs_subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      iitm_bs_subjects: {
        Row: {
          branch: string
          created_at: string | null
          display_order: number | null
          id: number
          level: string
          specialization: string | null
          subject_name: string
        }
        Insert: {
          branch: string
          created_at?: string | null
          display_order?: number | null
          id?: number
          level: string
          specialization?: string | null
          subject_name: string
        }
        Update: {
          branch?: string
          created_at?: string | null
          display_order?: number | null
          id?: number
          level?: string
          specialization?: string | null
          subject_name?: string
        }
        Relationships: []
      }
      important_dates: {
        Row: {
          branch: string | null
          category: string | null
          created_at: string
          created_by: string | null
          date_value: string
          description: string | null
          exam_type: string | null
          id: string
          is_highlighted: boolean | null
          level: string | null
          matter: string | null
          tag: string | null
          title: string
          updated_at: string
        }
        Insert: {
          branch?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date_value: string
          description?: string | null
          exam_type?: string | null
          id?: string
          is_highlighted?: boolean | null
          level?: string | null
          matter?: string | null
          tag?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          branch?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          date_value?: string
          description?: string | null
          exam_type?: string | null
          id?: string
          is_highlighted?: boolean | null
          level?: string | null
          matter?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          application_url: string | null
          company: string
          created_at: string
          deadline: string | null
          description: string | null
          duration: string | null
          experience_level: string | null
          id: string
          is_active: boolean
          is_featured: boolean
          job_type: string
          location: string
          requirements: string[] | null
          skills: string[] | null
          stipend: string | null
          title: string
          updated_at: string
        }
        Insert: {
          application_url?: string | null
          company?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          job_type: string
          location: string
          requirements?: string[] | null
          skills?: string[] | null
          stipend?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          application_url?: string | null
          company?: string
          created_at?: string
          deadline?: string | null
          description?: string | null
          duration?: string | null
          experience_level?: string | null
          id?: string
          is_active?: boolean
          is_featured?: boolean
          job_type?: string
          location?: string
          requirements?: string[] | null
          skills?: string[] | null
          stipend?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      news_updates: {
        Row: {
          branch: string | null
          button_text: string | null
          button_url: string | null
          category: string | null
          content: string
          created_at: string
          created_by: string | null
          date_time: string | null
          description: string | null
          exam_type: string | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          is_important: boolean | null
          level: string | null
          publish_date: string | null
          tag: string | null
          title: string
          updated_at: string
        }
        Insert: {
          branch?: string | null
          button_text?: string | null
          button_url?: string | null
          category?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          date_time?: string | null
          description?: string | null
          exam_type?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_important?: boolean | null
          level?: string | null
          publish_date?: string | null
          tag?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          branch?: string | null
          button_text?: string | null
          button_url?: string | null
          category?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          date_time?: string | null
          description?: string | null
          exam_type?: string | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          is_important?: boolean | null
          level?: string | null
          publish_date?: string | null
          tag?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          class_level: string | null
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          display_order_no: number | null
          download_count: number | null
          exam_type: string | null
          file_link: string | null
          id: string
          is_active: boolean | null
          session: string | null
          shift: string | null
          subject: string | null
          title: string
          updated_at: string
        }
        Insert: {
          class_level?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order_no?: number | null
          download_count?: number | null
          exam_type?: string | null
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          session?: string | null
          shift?: string | null
          subject?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          class_level?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          display_order_no?: number | null
          download_count?: number | null
          exam_type?: string | null
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          session?: string | null
          shift?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          page_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          page_path: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          page_path?: string
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen: string
          p256dh: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen?: string
          p256dh: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      payment_processor_log: {
        Row: {
          amount: number | null
          cashfree_order_status: string | null
          cf_payment_id: string | null
          created_at: string | null
          duration_ms: number | null
          email_sent: boolean | null
          error_message: string | null
          final_status: string | null
          id: string
          order_id: string | null
          payment_mode: string | null
          result: string | null
          source: string
        }
        Insert: {
          amount?: number | null
          cashfree_order_status?: string | null
          cf_payment_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          email_sent?: boolean | null
          error_message?: string | null
          final_status?: string | null
          id?: string
          order_id?: string | null
          payment_mode?: string | null
          result?: string | null
          source: string
        }
        Update: {
          amount?: number | null
          cashfree_order_status?: string | null
          cf_payment_id?: string | null
          created_at?: string | null
          duration_ms?: number | null
          email_sent?: boolean | null
          error_message?: string | null
          final_status?: string | null
          id?: string
          order_id?: string | null
          payment_mode?: string | null
          result?: string | null
          source?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number | null
          batch: string | null
          coupon_code: string | null
          courses: string | null
          created_at: string
          customer_email: string | null
          customer_phone: string | null
          discount_applied: boolean | null
          discount_type: string | null
          discount_value: number | null
          id: string
          net_amount: number | null
          order_id: string
          payment_group: string | null
          payment_id: string | null
          payment_mode: string | null
          payment_time: string | null
          raw_response: Json | null
          status: string | null
          user_id: string | null
          utr: string | null
        }
        Insert: {
          amount?: number | null
          batch?: string | null
          coupon_code?: string | null
          courses?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          discount_applied?: boolean | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          net_amount?: number | null
          order_id: string
          payment_group?: string | null
          payment_id?: string | null
          payment_mode?: string | null
          payment_time?: string | null
          raw_response?: Json | null
          status?: string | null
          user_id?: string | null
          utr?: string | null
        }
        Update: {
          amount?: number | null
          batch?: string | null
          coupon_code?: string | null
          courses?: string | null
          created_at?: string
          customer_email?: string | null
          customer_phone?: string | null
          discount_applied?: boolean | null
          discount_type?: string | null
          discount_value?: number | null
          id?: string
          net_amount?: number | null
          order_id?: string
          payment_group?: string | null
          payment_id?: string | null
          payment_mode?: string | null
          payment_time?: string | null
          raw_response?: Json | null
          status?: string | null
          user_id?: string | null
          utr?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          branch: string | null
          class: string | null
          created_at: string | null
          dial_code: string | null
          email: string | null
          exam: string | null
          exam_type: string | null
          full_name: string | null
          gender: string | null
          id: string
          interests: string[] | null
          level: string | null
          phone: string | null
          profile_completed: boolean | null
          program_type: string | null
          role: string | null
          selected_subjects: string[] | null
          student_name: string | null
          student_status: string | null
          subjects: string[] | null
          updated_at: string | null
        }
        Insert: {
          branch?: string | null
          class?: string | null
          created_at?: string | null
          dial_code?: string | null
          email?: string | null
          exam?: string | null
          exam_type?: string | null
          full_name?: string | null
          gender?: string | null
          id: string
          interests?: string[] | null
          level?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          program_type?: string | null
          role?: string | null
          selected_subjects?: string[] | null
          student_name?: string | null
          student_status?: string | null
          subjects?: string[] | null
          updated_at?: string | null
        }
        Update: {
          branch?: string | null
          class?: string | null
          created_at?: string | null
          dial_code?: string | null
          email?: string | null
          exam?: string | null
          exam_type?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          interests?: string[] | null
          level?: string | null
          phone?: string | null
          profile_completed?: boolean | null
          program_type?: string | null
          role?: string | null
          selected_subjects?: string[] | null
          student_name?: string | null
          student_status?: string | null
          subjects?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotional_group_members: {
        Row: {
          attempts: number
          created_at: string
          email: string
          email_normalized: string
          error_message: string | null
          group_email: string
          group_id: string
          id: string
          processed_at: string | null
          source: string | null
          status: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          email: string
          email_normalized: string
          error_message?: string | null
          group_email: string
          group_id: string
          id?: string
          processed_at?: string | null
          source?: string | null
          status?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          email?: string
          email_normalized?: string
          error_message?: string | null
          group_email?: string
          group_id?: string
          id?: string
          processed_at?: string | null
          source?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotional_group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "promotional_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      promotional_groups: {
        Row: {
          created_at: string
          google_group_id: string | null
          group_email: string
          group_name: string
          group_number: number
          id: string
          is_current: boolean
          is_full: boolean
          max_members: number
          member_count: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          google_group_id?: string | null
          group_email: string
          group_name: string
          group_number: number
          id?: string
          is_current?: boolean
          is_full?: boolean
          max_members?: number
          member_count?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          google_group_id?: string | null
          group_email?: string
          group_name?: string
          group_number?: number
          id?: string
          is_current?: boolean
          is_full?: boolean
          max_members?: number
          member_count?: number
          updated_at?: string
        }
        Relationships: []
      }
      pyqs: {
        Row: {
          branch: string | null
          class_level: string | null
          content_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          download_count: number | null
          exam_type: string | null
          file_link: string | null
          id: string
          is_active: boolean | null
          level: string | null
          session: string | null
          shift: string | null
          subject: string | null
          title: string
          updated_at: string
          year: number | null
        }
        Insert: {
          branch?: string | null
          class_level?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          exam_type?: string | null
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          session?: string | null
          shift?: string | null
          subject?: string | null
          title: string
          updated_at?: string
          year?: number | null
        }
        Update: {
          branch?: string | null
          class_level?: string | null
          content_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          exam_type?: string | null
          file_link?: string | null
          id?: string
          is_active?: boolean | null
          level?: string | null
          session?: string | null
          shift?: string | null
          subject?: string | null
          title?: string
          updated_at?: string
          year?: number | null
        }
        Relationships: []
      }
      study_groups: {
        Row: {
          branch: string | null
          class_level: string | null
          created_at: string
          created_by: string | null
          description: string | null
          exam_type: string | null
          group_type: string | null
          id: string
          invite_link: string | null
          level: string | null
          name: string
          subjects: string[] | null
          updated_at: string
        }
        Insert: {
          branch?: string | null
          class_level?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_type?: string | null
          group_type?: string | null
          id?: string
          invite_link?: string | null
          level?: string | null
          name: string
          subjects?: string[] | null
          updated_at?: string
        }
        Update: {
          branch?: string | null
          class_level?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          exam_type?: string | null
          group_type?: string | null
          id?: string
          invite_link?: string | null
          level?: string | null
          name?: string
          subjects?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      study_materials: {
        Row: {
          branch: string | null
          class_level: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          download_count: number | null
          exam_category: string | null
          file_url: string
          id: string
          is_free: boolean | null
          level: string | null
          material_type: Database["public"]["Enums"]["material_type"]
          preview_image_url: string | null
          session: string | null
          shift: string | null
          subject: string | null
          title: string
          topic: string | null
          updated_at: string | null
          week_number: number | null
          year: number | null
        }
        Insert: {
          branch?: string | null
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          exam_category?: string | null
          file_url: string
          id?: string
          is_free?: boolean | null
          level?: string | null
          material_type?: Database["public"]["Enums"]["material_type"]
          preview_image_url?: string | null
          session?: string | null
          shift?: string | null
          subject?: string | null
          title: string
          topic?: string | null
          updated_at?: string | null
          week_number?: number | null
          year?: number | null
        }
        Update: {
          branch?: string | null
          class_level?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          exam_category?: string | null
          file_url?: string
          id?: string
          is_free?: boolean | null
          level?: string | null
          material_type?: Database["public"]["Enums"]["material_type"]
          preview_image_url?: string | null
          session?: string | null
          shift?: string | null
          subject?: string | null
          title?: string
          topic?: string | null
          updated_at?: string | null
          week_number?: number | null
          year?: number | null
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          company: string | null
          created_at: string
          email: string
          id: string
          is_approved: boolean | null
          is_featured: boolean | null
          name: string
          position: string | null
          rating: number | null
          testimonial_text: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          created_at?: string
          email: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name: string
          position?: string | null
          rating?: number | null
          testimonial_text: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          is_approved?: boolean | null
          is_featured?: boolean | null
          name?: string
          position?: string | null
          rating?: number | null
          testimonial_text?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_usage_logs: {
        Row: {
          branch: string | null
          created_at: string | null
          email: string | null
          id: string
          input_details: Json | null
          level: string | null
          phone: string | null
          result_details: Json | null
          tool_name: string
          user_id: string | null
        }
        Insert: {
          branch?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          input_details?: Json | null
          level?: string | null
          phone?: string | null
          result_details?: Json | null
          tool_name: string
          user_id?: string | null
        }
        Update: {
          branch?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          input_details?: Json | null
          level?: string | null
          phone?: string | null
          result_details?: Json | null
          tool_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      user_recommendations: {
        Row: {
          course_id: string
          generated_at: string | null
          score: number
          source: string
          user_id: string
        }
        Insert: {
          course_id: string
          generated_at?: string | null
          score: number
          source: string
          user_id: string
        }
        Update: {
          course_id?: string
          generated_at?: string | null
          score?: number
          source?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_recommendations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_recommendations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      youtube_cache: {
        Row: {
          channel_id: string | null
          data: Json
          etag: string | null
          id: string
          last_updated: string | null
        }
        Insert: {
          channel_id?: string | null
          data: Json
          etag?: string | null
          id?: string
          last_updated?: string | null
        }
        Update: {
          channel_id?: string | null
          data?: Json
          etag?: string | null
          id?: string
          last_updated?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      save_push_subscription: {
        Args: {
          p_endpoint: string
          p_p256dh: string
          p_auth: string
          p_user_agent?: string
        }
        Returns: undefined
      }
      delete_push_subscription: {
        Args: { p_endpoint: string }
        Returns: undefined
      }
      bulk_assign_promotional_group_slots: {
        Args: { p_emails: string[]; p_group_id: string }
        Returns: number
      }
      claim_promotional_group_slot: {
        Args: { p_email: string; p_source?: string }
        Returns: {
          becomes_full: boolean
          group_email: string
          group_id: string
          group_number: number
          member_id: string
          was_already_assigned: boolean
        }[]
      }
      enroll_student_with_addons:
        | {
            Args: {
              p_addon_subjects: string[]
              p_course_id: string
              p_order_id: string
              p_payment_id: string
              p_status: string
              p_total_amount: number
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_addon_course_ids: string[]
              p_main_course_id: string
              p_order_id: string
              p_payment_id: string
              p_status?: string
              p_total_amount: number
              p_user_id: string
            }
            Returns: undefined
          }
      generate_all_recommendations: { Args: never; Returns: string }
      generate_content_recs_for_user: {
        Args: { user_id_input: string }
        Returns: undefined
      }
      get_my_role: { Args: never; Returns: string }
      get_public_testimonials: {
        Args: never
        Returns: {
          company: string
          created_at: string
          id: string
          is_approved: boolean
          is_featured: boolean
          name: string
          position: string
          rating: number
          testimonial_text: string
          updated_at: string
          user_id: string
        }[]
      }
      increment_download_count: {
        Args: { content_id: string; table_name: string; user_email?: string }
        Returns: undefined
      }
      is_admin: { Args: { user_email: string }; Returns: boolean }
      is_admin_user: { Args: { user_email: string }; Returns: boolean }
      is_current_user_admin: { Args: never; Returns: boolean }
      is_super_admin: { Args: { user_email: string }; Returns: boolean }
      redeem_coupon: {
        Args: {
          p_coupon_id: string
          p_discount: number
          p_enrollment_id: string
          p_final: number
          p_order_id: string
          p_user_id: string
        }
        Returns: boolean
      }
      register_promotional_group: {
        Args: {
          p_google_group_id: string
          p_group_email: string
          p_group_name: string
          p_group_number: number
          p_make_current?: boolean
        }
        Returns: string
      }
      verify_employee: {
        Args: { p_employee_code: string }
        Returns: {
          department: string
          employee_code: string
          employee_type: string
          end_date: string
          full_name: string
          is_active: boolean
          position: string
          start_date: string
          status: string
          verification_certificate_url: string
        }[]
      }
    }
    Enums: {
      material_type: "note" | "pyq" | "question_bank" | "ui_ki_padhai"
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

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
      material_type: ["note", "pyq", "question_bank", "ui_ki_padhai"],
    },
  },
} as const
