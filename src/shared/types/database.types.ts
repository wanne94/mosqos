Connecting to db 5432
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      attendance: {
        Row: {
          attendance_date: string
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          created_by: string | null
          id: string
          late_minutes: number | null
          member_id: string
          notes: string | null
          organization_id: string
          scheduled_class_id: string
          status: string | null
        }
        Insert: {
          attendance_date: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          late_minutes?: number | null
          member_id: string
          notes?: string | null
          organization_id: string
          scheduled_class_id: string
          status?: string | null
        }
        Update: {
          attendance_date?: string
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          late_minutes?: number | null
          member_id?: string
          notes?: string | null
          organization_id?: string
          scheduled_class_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attendance_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: unknown
          new_data: Json | null
          old_data: Json | null
          organization_id: string | null
          record_id: string
          table_name: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id: string
          table_name: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: unknown
          new_data?: Json | null
          old_data?: Json | null
          organization_id?: string | null
          record_id?: string
          table_name?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          description: string
          id: string
          imported_at: string | null
          match_status: string | null
          matched_donation_id: string | null
          organization_id: string
          raw_data: Json | null
          reference: string | null
          transaction_date: string
          transaction_type: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          description: string
          id?: string
          imported_at?: string | null
          match_status?: string | null
          matched_donation_id?: string | null
          organization_id: string
          raw_data?: Json | null
          reference?: string | null
          transaction_date: string
          transaction_type: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          description?: string
          id?: string
          imported_at?: string | null
          match_status?: string | null
          matched_donation_id?: string | null
          organization_id?: string
          raw_data?: Json | null
          reference?: string | null
          transaction_date?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_transactions_matched_donation_id_fkey"
            columns: ["matched_donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          address: string | null
          availability: Json | null
          capacity: number | null
          code: string | null
          created_at: string
          created_by: string | null
          equipment: Json | null
          facilities: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_virtual: boolean | null
          location: string | null
          name: string
          organization_id: string
          updated_at: string
          updated_by: string | null
          virtual_link: string | null
        }
        Insert: {
          address?: string | null
          availability?: Json | null
          capacity?: number | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          equipment?: Json | null
          facilities?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          name: string
          organization_id: string
          updated_at?: string
          updated_by?: string | null
          virtual_link?: string | null
        }
        Update: {
          address?: string | null
          availability?: Json | null
          capacity?: number | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          equipment?: Json | null
          facilities?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_virtual?: boolean | null
          location?: string | null
          name?: string
          organization_id?: string
          updated_at?: string
          updated_by?: string | null
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classrooms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      communication_logs: {
        Row: {
          attachments: Json | null
          communication_type: string
          completed_at: string | null
          contact_method: string | null
          content: string | null
          created_at: string
          created_by: string | null
          direction: string
          id: string
          member_id: string | null
          organization_id: string
          scheduled_at: string | null
          service_case_id: string | null
          status: string | null
          subject: string | null
          summary: string | null
          support_request_id: string | null
        }
        Insert: {
          attachments?: Json | null
          communication_type: string
          completed_at?: string | null
          contact_method?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction: string
          id?: string
          member_id?: string | null
          organization_id: string
          scheduled_at?: string | null
          service_case_id?: string | null
          status?: string | null
          subject?: string | null
          summary?: string | null
          support_request_id?: string | null
        }
        Update: {
          attachments?: Json | null
          communication_type?: string
          completed_at?: string | null
          contact_method?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          direction?: string
          id?: string
          member_id?: string | null
          organization_id?: string
          scheduled_at?: string | null
          service_case_id?: string | null
          status?: string | null
          subject?: string | null
          summary?: string | null
          support_request_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "communication_logs_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_service_case_id_fkey"
            columns: ["service_case_id"]
            isOneToOne: false
            referencedRelation: "service_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "communication_logs_support_request_id_fkey"
            columns: ["support_request_id"]
            isOneToOne: false
            referencedRelation: "support_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      countries: {
        Row: {
          code: string
          created_at: string
          currency_code: string
          currency_symbol: string
          date_format: string
          hijri_enabled: boolean
          id: string
          is_active: boolean
          locale: string
          name: string
          name_native: string | null
          prayer_calculation_method: string | null
          regulations: Json | null
          timezone: string
          updated_at: string
        }
        Insert: {
          code: string
          created_at?: string
          currency_code: string
          currency_symbol: string
          date_format?: string
          hijri_enabled?: boolean
          id?: string
          is_active?: boolean
          locale?: string
          name: string
          name_native?: string | null
          prayer_calculation_method?: string | null
          regulations?: Json | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency_code?: string
          currency_symbol?: string
          date_format?: string
          hijri_enabled?: boolean
          id?: string
          is_active?: boolean
          locale?: string
          name?: string
          name_native?: string | null
          prayer_calculation_method?: string | null
          regulations?: Json | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          applied_by: string | null
          coupon_id: string
          created_at: string
          currency: string
          discount_applied: number
          final_amount: number | null
          id: string
          ip_address: unknown
          months_remaining: number | null
          organization_id: string
          original_amount: number | null
          redeemed_at: string | null
          status: string | null
          subscription_id: string | null
          user_agent: string | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applied_by?: string | null
          coupon_id: string
          created_at?: string
          currency?: string
          discount_applied: number
          final_amount?: number | null
          id?: string
          ip_address?: unknown
          months_remaining?: number | null
          organization_id: string
          original_amount?: number | null
          redeemed_at?: string | null
          status?: string | null
          subscription_id?: string | null
          user_agent?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applied_by?: string | null
          coupon_id?: string
          created_at?: string
          currency?: string
          discount_applied?: number
          final_amount?: number | null
          id?: string
          ip_address?: unknown
          months_remaining?: number | null
          organization_id?: string
          original_amount?: number | null
          redeemed_at?: string | null
          status?: string | null
          subscription_id?: string | null
          user_agent?: string | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "organization_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          currency: string | null
          current_usage: number | null
          description: string | null
          discount_type: string
          discount_value: number
          duration_months: number | null
          expires_at: string | null
          first_time_only: boolean | null
          id: string
          is_active: boolean | null
          min_billing_cycle: string | null
          minimum_amount: number | null
          name: string
          notes: string | null
          stackable: boolean | null
          starts_at: string | null
          updated_at: string
          usage_limit: number | null
          usage_limit_per_org: number | null
          valid_countries: string[] | null
          valid_plans: string[] | null
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_usage?: number | null
          description?: string | null
          discount_type: string
          discount_value: number
          duration_months?: number | null
          expires_at?: string | null
          first_time_only?: boolean | null
          id?: string
          is_active?: boolean | null
          min_billing_cycle?: string | null
          minimum_amount?: number | null
          name: string
          notes?: string | null
          stackable?: boolean | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          usage_limit_per_org?: number | null
          valid_countries?: string[] | null
          valid_plans?: string[] | null
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_usage?: number | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          duration_months?: number | null
          expires_at?: string | null
          first_time_only?: boolean | null
          id?: string
          is_active?: boolean | null
          min_billing_cycle?: string | null
          minimum_amount?: number | null
          name?: string
          notes?: string | null
          stackable?: boolean | null
          starts_at?: string | null
          updated_at?: string
          usage_limit?: number | null
          usage_limit_per_org?: number | null
          valid_countries?: string[] | null
          valid_plans?: string[] | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string | null
          code: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          duration_hours: number | null
          duration_weeks: number | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          level: string | null
          materials: Json | null
          max_students: number | null
          min_students: number | null
          name: string
          organization_id: string
          prerequisites: Json | null
          subject: string | null
          syllabus: string | null
          tuition_fee: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          duration_hours?: number | null
          duration_weeks?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          level?: string | null
          materials?: Json | null
          max_students?: number | null
          min_students?: number | null
          name: string
          organization_id: string
          prerequisites?: Json | null
          subject?: string | null
          syllabus?: string | null
          tuition_fee?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          category?: string | null
          code?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          duration_hours?: number | null
          duration_weeks?: number | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          level?: string | null
          materials?: Json | null
          max_students?: number | null
          min_students?: number | null
          name?: string
          organization_id?: string
          prerequisites?: Json | null
          subject?: string | null
          syllabus?: string | null
          tuition_fee?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          amount: number
          bank_transaction_id: string | null
          check_number: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          donation_date: string | null
          donation_type: string | null
          fund_id: string | null
          id: string
          is_anonymous: boolean | null
          is_tax_deductible: boolean | null
          member_id: string | null
          notes: string | null
          organization_id: string
          payment_intent_id: string | null
          payment_method: string | null
          pledge_id: string | null
          receipt_number: string | null
          receipt_sent: boolean | null
          receipt_sent_at: string | null
          recurring_donation_id: string | null
          reference_number: string | null
          status: string | null
          transaction_id: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          bank_transaction_id?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          donation_date?: string | null
          donation_type?: string | null
          fund_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_tax_deductible?: boolean | null
          member_id?: string | null
          notes?: string | null
          organization_id: string
          payment_intent_id?: string | null
          payment_method?: string | null
          pledge_id?: string | null
          receipt_number?: string | null
          receipt_sent?: boolean | null
          receipt_sent_at?: string | null
          recurring_donation_id?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          bank_transaction_id?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          donation_date?: string | null
          donation_type?: string | null
          fund_id?: string | null
          id?: string
          is_anonymous?: boolean | null
          is_tax_deductible?: boolean | null
          member_id?: string | null
          notes?: string | null
          organization_id?: string
          payment_intent_id?: string | null
          payment_method?: string | null
          pledge_id?: string | null
          receipt_number?: string | null
          receipt_sent?: boolean | null
          receipt_sent_at?: string | null
          recurring_donation_id?: string | null
          reference_number?: string | null
          status?: string | null
          transaction_id?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_bank_transaction_id_fkey"
            columns: ["bank_transaction_id"]
            isOneToOne: false
            referencedRelation: "bank_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_pledge_id_fkey"
            columns: ["pledge_id"]
            isOneToOne: false
            referencedRelation: "pledges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_recurring_donation_id_fkey"
            columns: ["recurring_donation_id"]
            isOneToOne: false
            referencedRelation: "recurring_donations"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          attendance_percentage: number | null
          attended_classes: number | null
          completion_percentage: number | null
          created_at: string
          created_by: string | null
          enrollment_date: string | null
          grade: string | null
          grade_points: number | null
          id: string
          member_id: string
          notes: string | null
          organization_id: string
          scheduled_class_id: string
          scholarship_amount: number | null
          scholarship_notes: string | null
          status: string | null
          total_classes: number | null
          tuition_balance: number | null
          tuition_paid: number | null
          updated_at: string
          updated_by: string | null
          withdrawal_date: string | null
          withdrawal_reason: string | null
        }
        Insert: {
          attendance_percentage?: number | null
          attended_classes?: number | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          enrollment_date?: string | null
          grade?: string | null
          grade_points?: number | null
          id?: string
          member_id: string
          notes?: string | null
          organization_id: string
          scheduled_class_id: string
          scholarship_amount?: number | null
          scholarship_notes?: string | null
          status?: string | null
          total_classes?: number | null
          tuition_balance?: number | null
          tuition_paid?: number | null
          updated_at?: string
          updated_by?: string | null
          withdrawal_date?: string | null
          withdrawal_reason?: string | null
        }
        Update: {
          attendance_percentage?: number | null
          attended_classes?: number | null
          completion_percentage?: number | null
          created_at?: string
          created_by?: string | null
          enrollment_date?: string | null
          grade?: string | null
          grade_points?: number | null
          id?: string
          member_id?: string
          notes?: string | null
          organization_id?: string
          scheduled_class_id?: string
          scholarship_amount?: number | null
          scholarship_notes?: string | null
          status?: string | null
          total_classes?: number | null
          tuition_balance?: number | null
          tuition_paid?: number | null
          updated_at?: string
          updated_by?: string | null
          withdrawal_date?: string | null
          withdrawal_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollments_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      evaluations: {
        Row: {
          areas_for_improvement: string | null
          created_at: string
          created_by: string | null
          description: string | null
          evaluation_date: string
          evaluation_type: string | null
          feedback: string | null
          grade: string | null
          id: string
          is_visible_to_student: boolean | null
          max_score: number | null
          member_id: string
          organization_id: string
          percentage: number | null
          rubric_scores: Json | null
          scheduled_class_id: string
          score: number | null
          strengths: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
          weight: number | null
        }
        Insert: {
          areas_for_improvement?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          evaluation_date: string
          evaluation_type?: string | null
          feedback?: string | null
          grade?: string | null
          id?: string
          is_visible_to_student?: boolean | null
          max_score?: number | null
          member_id: string
          organization_id: string
          percentage?: number | null
          rubric_scores?: Json | null
          scheduled_class_id: string
          score?: number | null
          strengths?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          weight?: number | null
        }
        Update: {
          areas_for_improvement?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          evaluation_date?: string
          evaluation_type?: string | null
          feedback?: string | null
          grade?: string | null
          id?: string
          is_visible_to_student?: boolean | null
          max_score?: number | null
          member_id?: string
          organization_id?: string
          percentage?: number | null
          rubric_scores?: Json | null
          scheduled_class_id?: string
          score?: number | null
          strengths?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "evaluations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evaluations_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          parent_id: string | null
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          parent_id?: string | null
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          category: string | null
          check_number: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          description: string | null
          expense_date: string | null
          fund_id: string | null
          id: string
          notes: string | null
          organization_id: string
          payment_method: string | null
          receipt_date: string | null
          receipt_url: string | null
          reference_number: string | null
          service_case_id: string | null
          status: string | null
          updated_at: string
          updated_by: string | null
          vendor: string | null
          vendor_contact: string | null
        }
        Insert: {
          amount: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expense_date?: string | null
          fund_id?: string | null
          id?: string
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          receipt_date?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          service_case_id?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
          vendor_contact?: string | null
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          category?: string | null
          check_number?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          description?: string | null
          expense_date?: string | null
          fund_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          receipt_date?: string | null
          receipt_url?: string | null
          reference_number?: string | null
          service_case_id?: string | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
          vendor?: string | null
          vendor_contact?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_service_case_id_fkey"
            columns: ["service_case_id"]
            isOneToOne: false
            referencedRelation: "service_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      funds: {
        Row: {
          created_at: string
          created_by: string | null
          current_amount: number | null
          description: string | null
          end_date: string | null
          fund_type: string | null
          goal_amount: number | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          start_date: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          fund_type?: string | null
          goal_amount?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          current_amount?: number | null
          description?: string | null
          end_date?: string | null
          fund_type?: string | null
          goal_amount?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          start_date?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "funds_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          email: string | null
          head_of_household_id: string | null
          id: string
          name: string
          notes: string | null
          organization_id: string
          phone: string | null
          state: string | null
          updated_at: string
          updated_by: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          head_of_household_id?: string | null
          id?: string
          name: string
          notes?: string | null
          organization_id: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          email?: string | null
          head_of_household_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          organization_id?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          updated_by?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "households_head_of_household_id_fkey"
            columns: ["head_of_household_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "households_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      members: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          date_of_birth: string | null
          date_of_birth_hijri: string | null
          email: string | null
          first_name: string
          gender: string | null
          household_id: string | null
          id: string
          joined_date: string | null
          last_name: string
          membership_status: string | null
          membership_type: string | null
          notes: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          self_registered: boolean | null
          state: string | null
          updated_at: string
          updated_by: string | null
          user_id: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          date_of_birth_hijri?: string | null
          email?: string | null
          first_name: string
          gender?: string | null
          household_id?: string | null
          id?: string
          joined_date?: string | null
          last_name: string
          membership_status?: string | null
          membership_type?: string | null
          notes?: string | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          self_registered?: boolean | null
          state?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          date_of_birth?: string | null
          date_of_birth_hijri?: string | null
          email?: string | null
          first_name?: string
          gender?: string | null
          household_id?: string | null
          id?: string
          joined_date?: string | null
          last_name?: string
          membership_status?: string | null
          membership_type?: string | null
          notes?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          self_registered?: boolean | null
          state?: string | null
          updated_at?: string
          updated_by?: string | null
          user_id?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "members_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean | null
          cancelled_at: string | null
          created_at: string
          current_member_count: number | null
          current_period_end: string | null
          current_period_start: string | null
          current_storage_used_mb: number | null
          id: string
          organization_id: string
          plan_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          trial_ends_at: string | null
          trial_start: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_member_count?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          current_storage_used_mb?: number | null
          id?: string
          organization_id: string
          plan_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          cancelled_at?: string | null
          created_at?: string
          current_member_count?: number | null
          current_period_end?: string | null
          current_period_start?: string | null
          current_storage_used_mb?: number | null
          id?: string
          organization_id?: string
          plan_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          trial_ends_at?: string | null
          trial_start?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country_id: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          onboarding_completed_at: string | null
          payment_config: Json | null
          postal_code: string | null
          primary_color: string | null
          secondary_color: string | null
          settings: Json | null
          setup_progress: Json | null
          slug: string
          state: string | null
          stripe_account_id: string | null
          timezone: string | null
          updated_at: string
          updated_by: string | null
          website: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          onboarding_completed_at?: string | null
          payment_config?: Json | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          setup_progress?: Json | null
          slug: string
          state?: string | null
          stripe_account_id?: string | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          onboarding_completed_at?: string | null
          payment_config?: Json | null
          postal_code?: string | null
          primary_color?: string | null
          secondary_color?: string | null
          settings?: Json | null
          setup_progress?: Json | null
          slug?: string
          state?: string | null
          stripe_account_id?: string | null
          timezone?: string | null
          updated_at?: string
          updated_by?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizations_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_pricing: {
        Row: {
          country_id: string
          created_at: string
          id: string
          plan_id: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly: string | null
          stripe_price_id_yearly: string | null
          trial_days: number | null
          updated_at: string
        }
        Insert: {
          country_id: string
          created_at?: string
          id?: string
          plan_id: string
          price_monthly: number
          price_yearly: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Update: {
          country_id?: string
          created_at?: string
          id?: string
          plan_id?: string
          price_monthly?: number
          price_yearly?: number
          stripe_price_id_monthly?: string | null
          stripe_price_id_yearly?: string | null
          trial_days?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_pricing_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_pricing_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_admins: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pledges: {
        Row: {
          created_at: string
          created_by: string | null
          currency: string | null
          due_date: string | null
          fund_id: string | null
          id: string
          member_id: string
          notes: string | null
          organization_id: string
          paid_amount: number | null
          payment_schedule: Json | null
          pledge_date: string | null
          status: string | null
          total_amount: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          fund_id?: string | null
          id?: string
          member_id: string
          notes?: string | null
          organization_id: string
          paid_amount?: number | null
          payment_schedule?: Json | null
          pledge_date?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          currency?: string | null
          due_date?: string | null
          fund_id?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          organization_id?: string
          paid_amount?: number | null
          payment_schedule?: Json | null
          pledge_date?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pledges_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pledges_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_donations: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string | null
          donation_count: number | null
          end_date: string | null
          frequency: string
          fund_id: string | null
          id: string
          last_payment_date: string | null
          member_id: string
          next_payment_date: string | null
          notes: string | null
          organization_id: string
          payment_method: string | null
          start_date: string
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          total_collected: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          donation_count?: number | null
          end_date?: string | null
          frequency: string
          fund_id?: string | null
          id?: string
          last_payment_date?: string | null
          member_id: string
          next_payment_date?: string | null
          notes?: string | null
          organization_id: string
          payment_method?: string | null
          start_date: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_collected?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          donation_count?: number | null
          end_date?: string | null
          frequency?: string
          fund_id?: string | null
          id?: string
          last_payment_date?: string | null
          member_id?: string
          next_payment_date?: string | null
          notes?: string | null
          organization_id?: string
          payment_method?: string | null
          start_date?: string
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          total_collected?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_donations_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_donations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recurring_donations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_classes: {
        Row: {
          attendance_required: boolean | null
          auto_attendance: boolean | null
          classroom_id: string | null
          course_id: string
          created_at: string
          created_by: string | null
          currency: string | null
          current_enrollment: number | null
          day_of_week: string | null
          days_of_week: string[] | null
          description: string | null
          end_date: string
          end_time: string | null
          id: string
          is_virtual: boolean | null
          max_students: number | null
          name: string
          notes: string | null
          organization_id: string
          start_date: string
          start_time: string | null
          status: string | null
          teacher_id: string | null
          tuition_fee: number | null
          tuition_frequency: string | null
          updated_at: string
          updated_by: string | null
          virtual_link: string | null
        }
        Insert: {
          attendance_required?: boolean | null
          auto_attendance?: boolean | null
          classroom_id?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_enrollment?: number | null
          day_of_week?: string | null
          days_of_week?: string[] | null
          description?: string | null
          end_date: string
          end_time?: string | null
          id?: string
          is_virtual?: boolean | null
          max_students?: number | null
          name: string
          notes?: string | null
          organization_id: string
          start_date: string
          start_time?: string | null
          status?: string | null
          teacher_id?: string | null
          tuition_fee?: number | null
          tuition_frequency?: string | null
          updated_at?: string
          updated_by?: string | null
          virtual_link?: string | null
        }
        Update: {
          attendance_required?: boolean | null
          auto_attendance?: boolean | null
          classroom_id?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string | null
          current_enrollment?: number | null
          day_of_week?: string | null
          days_of_week?: string[] | null
          description?: string | null
          end_date?: string
          end_time?: string | null
          id?: string
          is_virtual?: boolean | null
          max_students?: number | null
          name?: string
          notes?: string | null
          organization_id?: string
          start_date?: string
          start_time?: string | null
          status?: string | null
          teacher_id?: string | null
          tuition_fee?: number | null
          tuition_frequency?: string | null
          updated_at?: string
          updated_by?: string | null
          virtual_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_classes_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scheduled_classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      service_cases: {
        Row: {
          approved_amount: number | null
          assigned_at: string | null
          assigned_to: string | null
          assistance_date: string | null
          case_number: string | null
          case_type: string | null
          category: string | null
          closed_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          disbursed_amount: number | null
          due_date: string | null
          followup_date: string | null
          fund_id: string | null
          id: string
          is_confidential: boolean | null
          member_id: string | null
          notes_thread: Json | null
          organization_id: string
          outcome: string | null
          priority: string | null
          requested_amount: number | null
          requires_followup: boolean | null
          resolution_notes: string | null
          resolved_date: string | null
          status: string | null
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          approved_amount?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          assistance_date?: string | null
          case_number?: string | null
          case_type?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          disbursed_amount?: number | null
          due_date?: string | null
          followup_date?: string | null
          fund_id?: string | null
          id?: string
          is_confidential?: boolean | null
          member_id?: string | null
          notes_thread?: Json | null
          organization_id: string
          outcome?: string | null
          priority?: string | null
          requested_amount?: number | null
          requires_followup?: boolean | null
          resolution_notes?: string | null
          resolved_date?: string | null
          status?: string | null
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          approved_amount?: number | null
          assigned_at?: string | null
          assigned_to?: string | null
          assistance_date?: string | null
          case_number?: string | null
          case_type?: string | null
          category?: string | null
          closed_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          disbursed_amount?: number | null
          due_date?: string | null
          followup_date?: string | null
          fund_id?: string | null
          id?: string
          is_confidential?: boolean | null
          member_id?: string | null
          notes_thread?: Json | null
          organization_id?: string
          outcome?: string | null
          priority?: string | null
          requested_amount?: number | null
          requires_followup?: boolean | null
          resolution_notes?: string | null
          resolved_date?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_cases_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cases_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_cases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      student_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          followup_completed: boolean | null
          followup_date: string | null
          followup_notes: string | null
          id: string
          is_private: boolean | null
          is_visible_to_parent: boolean | null
          member_id: string
          note_date: string | null
          note_type: string | null
          organization_id: string
          requires_followup: boolean | null
          scheduled_class_id: string | null
          title: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          followup_completed?: boolean | null
          followup_date?: string | null
          followup_notes?: string | null
          id?: string
          is_private?: boolean | null
          is_visible_to_parent?: boolean | null
          member_id: string
          note_date?: string | null
          note_type?: string | null
          organization_id: string
          requires_followup?: boolean | null
          scheduled_class_id?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          followup_completed?: boolean | null
          followup_date?: string | null
          followup_notes?: string | null
          id?: string
          is_private?: boolean | null
          is_visible_to_parent?: boolean | null
          member_id?: string
          note_date?: string | null
          note_type?: string | null
          organization_id?: string
          requires_followup?: boolean | null
          scheduled_class_id?: string | null
          title?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_notes_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_notes_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          admin_limit: number | null
          created_at: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean
          is_popular: boolean | null
          member_limit: number | null
          name: string
          slug: string
          sort_order: number | null
          storage_limit_gb: number | null
          tier: number
          updated_at: string
        }
        Insert: {
          admin_limit?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          member_limit?: number | null
          name: string
          slug: string
          sort_order?: number | null
          storage_limit_gb?: number | null
          tier?: number
          updated_at?: string
        }
        Update: {
          admin_limit?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean
          is_popular?: boolean | null
          member_limit?: number | null
          name?: string
          slug?: string
          sort_order?: number | null
          storage_limit_gb?: number | null
          tier?: number
          updated_at?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          assigned_to: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          member_id: string | null
          organization_id: string
          priority: string | null
          requester_email: string | null
          requester_name: string | null
          requester_phone: string | null
          resolution_notes: string | null
          resolved_at: string | null
          source: string | null
          status: string | null
          subject: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          organization_id: string
          priority?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string | null
          subject: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          assigned_to?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          member_id?: string | null
          organization_id?: string
          priority?: string | null
          requester_email?: string | null
          requester_name?: string | null
          requester_phone?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          source?: string | null
          status?: string | null
          subject?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_requests_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          availability: Json | null
          bio: string | null
          certifications: Json | null
          compensation_type: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          email: string | null
          end_date: string | null
          first_name: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean | null
          last_name: string
          max_hours_per_week: number | null
          member_id: string | null
          organization_id: string
          phone: string | null
          photo_url: string | null
          qualifications: string | null
          specialization: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          availability?: Json | null
          bio?: string | null
          certifications?: Json | null
          compensation_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          end_date?: string | null
          first_name: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_name: string
          max_hours_per_week?: number | null
          member_id?: string | null
          organization_id: string
          phone?: string | null
          photo_url?: string | null
          qualifications?: string | null
          specialization?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          availability?: Json | null
          bio?: string | null
          certifications?: Json | null
          compensation_type?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          email?: string | null
          end_date?: string | null
          first_name?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean | null
          last_name?: string
          max_hours_per_week?: number | null
          member_id?: string | null
          organization_id?: string
          phone?: string | null
          photo_url?: string | null
          qualifications?: string | null
          specialization?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "teachers_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teachers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_registrations: {
        Row: {
          accessibility_needs: string | null
          amount_paid: number | null
          balance_due: number | null
          cancellation_reason: string | null
          cancelled_at: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deposit_paid: number | null
          dietary_requirements: string | null
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          emergency_contact_relation: string | null
          flight_details: Json | null
          id: string
          internal_notes: string | null
          medical_conditions: string | null
          member_id: string
          notes: string | null
          organization_id: string
          passport_country: string | null
          passport_expiry: string | null
          passport_number: string | null
          payment_deadline: string | null
          payment_status: string | null
          refund_amount: number | null
          refund_date: string | null
          registration_date: string | null
          registration_number: string | null
          room_sharing_with: Json | null
          room_type: string | null
          special_requests: string | null
          status: string | null
          total_amount: number | null
          trip_id: string
          updated_at: string
          updated_by: string | null
          visa_expiry_date: string | null
          visa_issue_date: string | null
          visa_notes: string | null
          visa_number: string | null
          visa_status: string | null
        }
        Insert: {
          accessibility_needs?: string | null
          amount_paid?: number | null
          balance_due?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deposit_paid?: number | null
          dietary_requirements?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          flight_details?: Json | null
          id?: string
          internal_notes?: string | null
          medical_conditions?: string | null
          member_id: string
          notes?: string | null
          organization_id: string
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          payment_deadline?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          registration_date?: string | null
          registration_number?: string | null
          room_sharing_with?: Json | null
          room_type?: string | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          trip_id: string
          updated_at?: string
          updated_by?: string | null
          visa_expiry_date?: string | null
          visa_issue_date?: string | null
          visa_notes?: string | null
          visa_number?: string | null
          visa_status?: string | null
        }
        Update: {
          accessibility_needs?: string | null
          amount_paid?: number | null
          balance_due?: number | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deposit_paid?: number | null
          dietary_requirements?: string | null
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          emergency_contact_relation?: string | null
          flight_details?: Json | null
          id?: string
          internal_notes?: string | null
          medical_conditions?: string | null
          member_id?: string
          notes?: string | null
          organization_id?: string
          passport_country?: string | null
          passport_expiry?: string | null
          passport_number?: string | null
          payment_deadline?: string | null
          payment_status?: string | null
          refund_amount?: number | null
          refund_date?: string | null
          registration_date?: string | null
          registration_number?: string | null
          room_sharing_with?: Json | null
          room_type?: string | null
          special_requests?: string | null
          status?: string | null
          total_amount?: number | null
          trip_id?: string
          updated_at?: string
          updated_by?: string | null
          visa_expiry_date?: string | null
          visa_issue_date?: string | null
          visa_notes?: string | null
          visa_number?: string | null
          visa_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trip_registrations_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_registrations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_registrations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          accommodation_details: string | null
          available_spots: number | null
          capacity: number | null
          code: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          deposit_amount: number | null
          description: string | null
          destination: string | null
          early_bird_deadline: string | null
          early_bird_price: number | null
          end_date: string
          exclusions: Json | null
          gallery: Json | null
          group_leader_id: string | null
          health_requirements: string | null
          highlights: Json | null
          hotel_madinah: string | null
          hotel_makkah: string | null
          id: string
          image_url: string | null
          inclusions: Json | null
          itinerary: string | null
          name: string
          notes: string | null
          organization_id: string
          price: number | null
          registration_deadline: string | null
          requirements: string | null
          start_date: string
          status: string | null
          trip_type: string | null
          updated_at: string
          updated_by: string | null
          visa_requirements: string | null
          waitlist_capacity: number | null
        }
        Insert: {
          accommodation_details?: string | null
          available_spots?: number | null
          capacity?: number | null
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          description?: string | null
          destination?: string | null
          early_bird_deadline?: string | null
          early_bird_price?: number | null
          end_date: string
          exclusions?: Json | null
          gallery?: Json | null
          group_leader_id?: string | null
          health_requirements?: string | null
          highlights?: Json | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          id?: string
          image_url?: string | null
          inclusions?: Json | null
          itinerary?: string | null
          name: string
          notes?: string | null
          organization_id: string
          price?: number | null
          registration_deadline?: string | null
          requirements?: string | null
          start_date: string
          status?: string | null
          trip_type?: string | null
          updated_at?: string
          updated_by?: string | null
          visa_requirements?: string | null
          waitlist_capacity?: number | null
        }
        Update: {
          accommodation_details?: string | null
          available_spots?: number | null
          capacity?: number | null
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          deposit_amount?: number | null
          description?: string | null
          destination?: string | null
          early_bird_deadline?: string | null
          early_bird_price?: number | null
          end_date?: string
          exclusions?: Json | null
          gallery?: Json | null
          group_leader_id?: string | null
          health_requirements?: string | null
          highlights?: Json | null
          hotel_madinah?: string | null
          hotel_makkah?: string | null
          id?: string
          image_url?: string | null
          inclusions?: Json | null
          itinerary?: string | null
          name?: string
          notes?: string | null
          organization_id?: string
          price?: number | null
          registration_deadline?: string | null
          requirements?: string | null
          start_date?: string
          status?: string | null
          trip_type?: string | null
          updated_at?: string
          updated_by?: string | null
          visa_requirements?: string | null
          waitlist_capacity?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "trips_group_leader_id_fkey"
            columns: ["group_leader_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_monthly_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          currency: string | null
          discount_amount: number | null
          donation_id: string | null
          due_date: string
          enrollment_id: string
          final_amount: number | null
          fund_id: string | null
          id: string
          member_id: string
          notes: string | null
          organization_id: string
          payment_date: string | null
          payment_method: string | null
          payment_month: string
          reference_number: string | null
          scheduled_class_id: string | null
          scholarship_amount: number | null
          status: string | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          donation_id?: string | null
          due_date: string
          enrollment_id: string
          final_amount?: number | null
          fund_id?: string | null
          id?: string
          member_id: string
          notes?: string | null
          organization_id: string
          payment_date?: string | null
          payment_method?: string | null
          payment_month: string
          reference_number?: string | null
          scheduled_class_id?: string | null
          scholarship_amount?: number | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          donation_id?: string | null
          due_date?: string
          enrollment_id?: string
          final_amount?: number | null
          fund_id?: string | null
          id?: string
          member_id?: string
          notes?: string | null
          organization_id?: string
          payment_date?: string | null
          payment_method?: string | null
          payment_month?: string
          reference_number?: string | null
          scheduled_class_id?: string | null
          scholarship_amount?: number | null
          status?: string | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tuition_monthly_payments_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_monthly_payments_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_monthly_payments_fund_id_fkey"
            columns: ["fund_id"]
            isOneToOne: false
            referencedRelation: "funds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_monthly_payments_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_monthly_payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_monthly_payments_scheduled_class_id_fkey"
            columns: ["scheduled_class_id"]
            isOneToOne: false
            referencedRelation: "scheduled_classes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      audit_statistics: {
        Row: {
          action: string | null
          first_activity: string | null
          last_activity: string | null
          table_name: string | null
          total_count: number | null
          unique_users: number | null
        }
        Relationships: []
      }
      recent_audit_activity: {
        Row: {
          action: string | null
          changed_fields: string[] | null
          created_at: string | null
          id: string | null
          organization_id: string | null
          organization_name: string | null
          record_id: string | null
          table_name: string | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      apply_audit_triggers: { Args: never; Returns: undefined }
      apply_coupon: {
        Args: {
          p_code: string
          p_organization_id: string
          p_original_amount: number
          p_subscription_id: string
        }
        Returns: Json
      }
      generate_case_number: { Args: never; Returns: string }
      generate_receipt_number: { Args: never; Returns: string }
      get_audit_history: {
        Args: { p_limit?: number; p_record_id: string; p_table_name: string }
        Returns: {
          action: string
          changed_fields: string[]
          created_at: string
          id: string
          new_data: Json
          old_data: Json
          user_email: string
        }[]
      }
      is_platform_admin: { Args: { check_user_id?: string }; Returns: boolean }
      purge_old_audit_logs: {
        Args: { p_days_to_keep?: number }
        Returns: number
      }
      seed_default_expense_categories: {
        Args: { p_organization_id: string }
        Returns: undefined
      }
      user_belongs_to_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      validate_coupon: {
        Args: {
          p_code: string
          p_country_code?: string
          p_organization_id: string
          p_plan_slug?: string
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

