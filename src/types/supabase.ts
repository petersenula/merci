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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_users: {
        Row: {
          created_at: string
          note: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          note?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          note?: string | null
          user_id?: string
        }
        Relationships: []
      }
      allocation_scheme_parts: {
        Row: {
          created_at: string
          destination_id: string | null
          destination_kind: Database["public"]["Enums"]["tip_destination_kind"]
          destination_type: string | null
          employer_payout_account_id: string | null
          id: string
          label: string
          part_index: number
          percent: number
          scheme_id: string
        }
        Insert: {
          created_at?: string
          destination_id?: string | null
          destination_kind: Database["public"]["Enums"]["tip_destination_kind"]
          destination_type?: string | null
          employer_payout_account_id?: string | null
          id?: string
          label: string
          part_index: number
          percent: number
          scheme_id: string
        }
        Update: {
          created_at?: string
          destination_id?: string | null
          destination_kind?: Database["public"]["Enums"]["tip_destination_kind"]
          destination_type?: string | null
          employer_payout_account_id?: string | null
          id?: string
          label?: string
          part_index?: number
          percent?: number
          scheme_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_scheme_parts_employer_payout_account_id_fkey"
            columns: ["employer_payout_account_id"]
            isOneToOne: false
            referencedRelation: "employer_payout_accounts_delete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "allocation_scheme_parts_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "allocation_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      allocation_schemes: {
        Row: {
          active_from: string | null
          active_to: string | null
          created_at: string
          description: string | null
          employer_id: string
          id: string
          is_default: boolean
          name: string
          payment_page_owner_id: string | null
          payment_page_owner_type: string | null
          show_goal: boolean | null
          show_goal_amount: boolean | null
          show_progress: boolean | null
          updated_at: string
        }
        Insert: {
          active_from?: string | null
          active_to?: string | null
          created_at?: string
          description?: string | null
          employer_id: string
          id?: string
          is_default?: boolean
          name: string
          payment_page_owner_id?: string | null
          payment_page_owner_type?: string | null
          show_goal?: boolean | null
          show_goal_amount?: boolean | null
          show_progress?: boolean | null
          updated_at?: string
        }
        Update: {
          active_from?: string | null
          active_to?: string | null
          created_at?: string
          description?: string | null
          employer_id?: string
          id?: string
          is_default?: boolean
          name?: string
          payment_page_owner_id?: string | null
          payment_page_owner_type?: string | null
          show_goal?: boolean | null
          show_goal_amount?: boolean | null
          show_progress?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "allocation_schemes_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "allocation_schemes_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers_public_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      auth_email_index: {
        Row: {
          created_at: string
          email: string
          email_confirmed: boolean
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          email_confirmed?: boolean
          id: string
        }
        Update: {
          created_at?: string
          email?: string
          email_confirmed?: boolean
          id?: string
        }
        Relationships: []
      }
      employer_payout_accounts_delete: {
        Row: {
          created_at: string
          employer_id: string
          id: string
          is_active: boolean
          name: string
          stripe_account_id: string
          type: Database["public"]["Enums"]["employer_account_type"]
        }
        Insert: {
          created_at?: string
          employer_id: string
          id?: string
          is_active?: boolean
          name: string
          stripe_account_id: string
          type?: Database["public"]["Enums"]["employer_account_type"]
        }
        Update: {
          created_at?: string
          employer_id?: string
          id?: string
          is_active?: boolean
          name?: string
          stripe_account_id?: string
          type?: Database["public"]["Enums"]["employer_account_type"]
        }
        Relationships: [
          {
            foreignKeyName: "employer_payout_accounts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "employer_payout_accounts_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers_public_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      employers: {
        Row: {
          address: Json | null
          billing_email: string | null
          category: string | null
          country_code: string
          created_at: string
          currency: string
          display_name: string | null
          goal_amount_cents: number | null
          goal_earned_since_start: number | null
          goal_start_amount: number | null
          goal_start_date: string | null
          goal_title: string | null
          invite_code: string | null
          is_active: boolean
          locale: string
          logo_url: string | null
          name: string
          onboarding_checks: Json | null
          phone: string | null
          platform_fee_percent: number | null
          push_enabled: boolean
          registration_number: string | null
          settings: Json
          slug: string
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_deleted_at: string | null
          stripe_onboarding_complete: boolean
          stripe_payouts_enabled: boolean | null
          stripe_status: string | null
          timezone: string
          updated_at: string
          user_id: string
          vat_number: string | null
          wallet_balance_cents: number
        }
        Insert: {
          address?: Json | null
          billing_email?: string | null
          category?: string | null
          country_code?: string
          created_at?: string
          currency?: string
          display_name?: string | null
          goal_amount_cents?: number | null
          goal_earned_since_start?: number | null
          goal_start_amount?: number | null
          goal_start_date?: string | null
          goal_title?: string | null
          invite_code?: string | null
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name: string
          onboarding_checks?: Json | null
          phone?: string | null
          platform_fee_percent?: number | null
          push_enabled?: boolean
          registration_number?: string | null
          settings?: Json
          slug: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_deleted_at?: string | null
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean | null
          stripe_status?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          vat_number?: string | null
          wallet_balance_cents?: number
        }
        Update: {
          address?: Json | null
          billing_email?: string | null
          category?: string | null
          country_code?: string
          created_at?: string
          currency?: string
          display_name?: string | null
          goal_amount_cents?: number | null
          goal_earned_since_start?: number | null
          goal_start_amount?: number | null
          goal_start_date?: string | null
          goal_title?: string | null
          invite_code?: string | null
          is_active?: boolean
          locale?: string
          logo_url?: string | null
          name?: string
          onboarding_checks?: Json | null
          phone?: string | null
          platform_fee_percent?: number | null
          push_enabled?: boolean
          registration_number?: string | null
          settings?: Json
          slug?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_deleted_at?: string | null
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean | null
          stripe_status?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          vat_number?: string | null
          wallet_balance_cents?: number
        }
        Relationships: []
      }
      employers_earners: {
        Row: {
          created_at: string
          earner_id: string
          employer_id: string
          id: string
          is_active: boolean
          pending: boolean
          role: string
          share_page_access: boolean | null
          since_date: string | null
          until_date: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          earner_id: string
          employer_id: string
          id?: string
          is_active?: boolean
          pending?: boolean
          role?: string
          share_page_access?: boolean | null
          since_date?: string | null
          until_date?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          earner_id?: string
          employer_id?: string
          id?: string
          is_active?: boolean
          pending?: boolean
          role?: string
          share_page_access?: boolean | null
          since_date?: string | null
          until_date?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employers_earners_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "earners_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employers_earners_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "profiles_earner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_employer"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fk_employer"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers_public_view"
            referencedColumns: ["user_id"]
          },
        ]
      }
      landing_distribution_schemes: {
        Row: {
          created_at: string | null
          description: string | null
          description_de: string | null
          description_en: string | null
          description_fr: string | null
          description_it: string | null
          id: string
          image_url: string
          image_url_de: string | null
          image_url_en: string | null
          image_url_fr: string | null
          image_url_it: string | null
          is_active: boolean | null
          profession_label: string
          profession_label_de: string | null
          profession_label_en: string | null
          profession_label_fr: string | null
          profession_label_it: string | null
          role: string
          sort_order: number | null
          title: string
          title_de: string | null
          title_en: string | null
          title_fr: string | null
          title_it: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          id?: string
          image_url: string
          image_url_de?: string | null
          image_url_en?: string | null
          image_url_fr?: string | null
          image_url_it?: string | null
          is_active?: boolean | null
          profession_label: string
          profession_label_de?: string | null
          profession_label_en?: string | null
          profession_label_fr?: string | null
          profession_label_it?: string | null
          role: string
          sort_order?: number | null
          title: string
          title_de?: string | null
          title_en?: string | null
          title_fr?: string | null
          title_it?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          description_de?: string | null
          description_en?: string | null
          description_fr?: string | null
          description_it?: string | null
          id?: string
          image_url?: string
          image_url_de?: string | null
          image_url_en?: string | null
          image_url_fr?: string | null
          image_url_it?: string | null
          is_active?: boolean | null
          profession_label?: string
          profession_label_de?: string | null
          profession_label_en?: string | null
          profession_label_fr?: string | null
          profession_label_it?: string | null
          role?: string
          sort_order?: number | null
          title?: string
          title_de?: string | null
          title_en?: string | null
          title_fr?: string | null
          title_it?: string | null
        }
        Relationships: []
      }
      landing_live_previews: {
        Row: {
          context_image_url: string
          context_label: string
          created_at: string | null
          currency: string
          goal_amount_cents: number
          goal_raised_amount_cents: number | null
          goal_start_amount_cents: number | null
          goal_title: string | null
          id: string
          is_active: boolean
          name: string
          order: number | null
          payment_amount_cents: number
          payment_image_url: string | null
        }
        Insert: {
          context_image_url: string
          context_label: string
          created_at?: string | null
          currency?: string
          goal_amount_cents: number
          goal_raised_amount_cents?: number | null
          goal_start_amount_cents?: number | null
          goal_title?: string | null
          id?: string
          is_active?: boolean
          name: string
          order?: number | null
          payment_amount_cents: number
          payment_image_url?: string | null
        }
        Update: {
          context_image_url?: string
          context_label?: string
          created_at?: string | null
          currency?: string
          goal_amount_cents?: number
          goal_raised_amount_cents?: number | null
          goal_start_amount_cents?: number | null
          goal_title?: string | null
          id?: string
          is_active?: boolean
          name?: string
          order?: number | null
          payment_amount_cents?: number
          payment_image_url?: string | null
        }
        Relationships: []
      }
      landing_qr_scenes: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_active: boolean | null
          sort_order: number | null
          title_de: string | null
          title_en: string | null
          title_fr: string | null
          title_it: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean | null
          sort_order?: number | null
          title_de?: string | null
          title_en?: string | null
          title_fr?: string | null
          title_it?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean | null
          sort_order?: number | null
          title_de?: string | null
          title_en?: string | null
          title_fr?: string | null
          title_it?: string | null
        }
        Relationships: []
      }
      landing_tip_previews: {
        Row: {
          created_at: string | null
          currency: string
          goal_amount_cents: number
          goal_earned_since_start_cents: number | null
          goal_start_amount_cents: number | null
          goal_title: string | null
          id: string
          image_url: string | null
          is_active: boolean
          name: string
        }
        Insert: {
          created_at?: string | null
          currency?: string
          goal_amount_cents: number
          goal_earned_since_start_cents?: number | null
          goal_start_amount_cents?: number | null
          goal_title?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name: string
        }
        Update: {
          created_at?: string | null
          currency?: string
          goal_amount_cents?: number
          goal_earned_since_start_cents?: number | null
          goal_start_amount_cents?: number | null
          goal_title?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          name?: string
        }
        Relationships: []
      }
      ledger_balances: {
        Row: {
          account_id: string | null
          account_id_norm: string | null
          account_type: string | null
          balance_end_cents: number
          balance_start_cents: number
          created_at: string
          currency: string
          date: string
          id: string
        }
        Insert: {
          account_id?: string | null
          account_id_norm?: string | null
          account_type?: string | null
          balance_end_cents: number
          balance_start_cents: number
          created_at?: string
          currency: string
          date: string
          id?: string
        }
        Update: {
          account_id?: string | null
          account_id_norm?: string | null
          account_type?: string | null
          balance_end_cents?: number
          balance_start_cents?: number
          created_at?: string
          currency?: string
          date?: string
          id?: string
        }
        Relationships: []
      }
      ledger_delete: {
        Row: {
          available_on: string | null
          created_at: string
          currency: string
          description: string | null
          earner_id: string | null
          employer_id: string | null
          fee: number
          gross: number
          id: string
          inserted_at: string
          is_platform: boolean | null
          net: number
          reporting_category: string | null
          scheme_id: string | null
          source_id: string | null
          source_type: string | null
          stripe_account_id: string
          stripe_data: Json
          type: string
        }
        Insert: {
          available_on?: string | null
          created_at: string
          currency: string
          description?: string | null
          earner_id?: string | null
          employer_id?: string | null
          fee: number
          gross: number
          id: string
          inserted_at?: string
          is_platform?: boolean | null
          net: number
          reporting_category?: string | null
          scheme_id?: string | null
          source_id?: string | null
          source_type?: string | null
          stripe_account_id: string
          stripe_data: Json
          type: string
        }
        Update: {
          available_on?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          earner_id?: string | null
          employer_id?: string | null
          fee?: number
          gross?: number
          id?: string
          inserted_at?: string
          is_platform?: boolean | null
          net?: number
          reporting_category?: string | null
          scheme_id?: string | null
          source_id?: string | null
          source_type?: string | null
          stripe_account_id?: string
          stripe_data?: Json
          type?: string
        }
        Relationships: []
      }
      ledger_platform_balances_delete: {
        Row: {
          balance_end_cents: number | null
          balance_start_cents: number | null
          created_at: string | null
          currency: string | null
          date: string | null
          id: string
        }
        Insert: {
          balance_end_cents?: number | null
          balance_start_cents?: number | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          id?: string
        }
        Update: {
          balance_end_cents?: number | null
          balance_start_cents?: number | null
          created_at?: string | null
          currency?: string | null
          date?: string | null
          id?: string
        }
        Relationships: []
      }
      ledger_platform_transactions_delete: {
        Row: {
          amount_gross_cents: number | null
          application_fee_cents: number | null
          created_at: string | null
          currency: string | null
          id: string
          net_cents: number | null
          raw: Json | null
          reporting_category: string | null
          stripe_balance_transaction_id: string | null
          stripe_fee_cents: number | null
          type: string | null
        }
        Insert: {
          amount_gross_cents?: number | null
          application_fee_cents?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          net_cents?: number | null
          raw?: Json | null
          reporting_category?: string | null
          stripe_balance_transaction_id?: string | null
          stripe_fee_cents?: number | null
          type?: string | null
        }
        Update: {
          amount_gross_cents?: number | null
          application_fee_cents?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          net_cents?: number | null
          raw?: Json | null
          reporting_category?: string | null
          stripe_balance_transaction_id?: string | null
          stripe_fee_cents?: number | null
          type?: string | null
        }
        Relationships: []
      }
      ledger_sync_accounts: {
        Row: {
          account_type: string
          created_at: string
          environment: string
          id: string
          internal_id: string | null
          is_active: boolean
          last_synced_ts: number
          last_synced_tx_id: string | null
          lock_token: string | null
          locked_at: string | null
          stripe_account_id: string | null
        }
        Insert: {
          account_type: string
          created_at?: string
          environment?: string
          id?: string
          internal_id?: string | null
          is_active?: boolean
          last_synced_ts?: number
          last_synced_tx_id?: string | null
          lock_token?: string | null
          locked_at?: string | null
          stripe_account_id?: string | null
        }
        Update: {
          account_type?: string
          created_at?: string
          environment?: string
          id?: string
          internal_id?: string | null
          is_active?: boolean
          last_synced_ts?: number
          last_synced_tx_id?: string | null
          lock_token?: string | null
          locked_at?: string | null
          stripe_account_id?: string | null
        }
        Relationships: []
      }
      ledger_sync_jobs: {
        Row: {
          account_type: string
          attempts: number
          created_at: string
          error: string | null
          from_ts: number | null
          id: string
          job_type: string
          status: string
          stripe_account_id: string | null
          to_ts: number | null
          updated_at: string
        }
        Insert: {
          account_type: string
          attempts?: number
          created_at?: string
          error?: string | null
          from_ts?: number | null
          id?: string
          job_type: string
          status?: string
          stripe_account_id?: string | null
          to_ts?: number | null
          updated_at?: string
        }
        Update: {
          account_type?: string
          attempts?: number
          created_at?: string
          error?: string | null
          from_ts?: number | null
          id?: string
          job_type?: string
          status?: string
          stripe_account_id?: string | null
          to_ts?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      ledger_transactions: {
        Row: {
          account_type: string | null
          amount_gross_cents: number
          balance_after: number | null
          calculated_balance_cents: number | null
          created_at: string
          currency: string
          earner_id: string | null
          employer_id: string | null
          id: string
          internal_account_id: string | null
          is_live: boolean | null
          net_cents: number
          operation_type: string
          raw: Json | null
          reporting_category: string | null
          review_rating: number | null
          stripe_account_id: string | null
          stripe_balance_transaction_id: string
          stripe_fee_cents: number | null
          stripe_object_id: string | null
          tip_id: string | null
          tip_split_id: string | null
        }
        Insert: {
          account_type?: string | null
          amount_gross_cents: number
          balance_after?: number | null
          calculated_balance_cents?: number | null
          created_at: string
          currency: string
          earner_id?: string | null
          employer_id?: string | null
          id?: string
          internal_account_id?: string | null
          is_live?: boolean | null
          net_cents: number
          operation_type: string
          raw?: Json | null
          reporting_category?: string | null
          review_rating?: number | null
          stripe_account_id?: string | null
          stripe_balance_transaction_id: string
          stripe_fee_cents?: number | null
          stripe_object_id?: string | null
          tip_id?: string | null
          tip_split_id?: string | null
        }
        Update: {
          account_type?: string | null
          amount_gross_cents?: number
          balance_after?: number | null
          calculated_balance_cents?: number | null
          created_at?: string
          currency?: string
          earner_id?: string | null
          employer_id?: string | null
          id?: string
          internal_account_id?: string | null
          is_live?: boolean | null
          net_cents?: number
          operation_type?: string
          raw?: Json | null
          reporting_category?: string | null
          review_rating?: number | null
          stripe_account_id?: string | null
          stripe_balance_transaction_id?: string
          stripe_fee_cents?: number | null
          stripe_object_id?: string | null
          tip_id?: string | null
          tip_split_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ledger_transactions_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "earners_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ledger_transactions_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "profiles_earner"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles_earner: {
        Row: {
          avatar_url: string | null
          city: string | null
          country_code: string | null
          created_at: string
          currency: string
          display_name: string
          email: string | null
          first_name: string | null
          goal_amount_cents: number
          goal_earned_since_start: number | null
          goal_start_amount: number
          goal_start_date: string
          goal_title: string | null
          id: string
          is_active: boolean
          lang: string
          last_name: string | null
          onboarding_checks: Json | null
          phone: string | null
          platform_fee_percent: number | null
          push_enabled: boolean
          slug: string
          stripe_account_id: string | null
          stripe_charges_enabled: boolean | null
          stripe_deleted_at: string | null
          stripe_onboarding_complete: boolean
          stripe_payouts_enabled: boolean | null
          stripe_status: string | null
          updated_at: string
          wallet_balance_cents: number
        }
        Insert: {
          avatar_url?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          display_name: string
          email?: string | null
          first_name?: string | null
          goal_amount_cents?: number
          goal_earned_since_start?: number | null
          goal_start_amount?: number
          goal_start_date?: string
          goal_title?: string | null
          id?: string
          is_active?: boolean
          lang?: string
          last_name?: string | null
          onboarding_checks?: Json | null
          phone?: string | null
          platform_fee_percent?: number | null
          push_enabled?: boolean
          slug: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_deleted_at?: string | null
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean | null
          stripe_status?: string | null
          updated_at?: string
          wallet_balance_cents?: number
        }
        Update: {
          avatar_url?: string | null
          city?: string | null
          country_code?: string | null
          created_at?: string
          currency?: string
          display_name?: string
          email?: string | null
          first_name?: string | null
          goal_amount_cents?: number
          goal_earned_since_start?: number | null
          goal_start_amount?: number
          goal_start_date?: string
          goal_title?: string | null
          id?: string
          is_active?: boolean
          lang?: string
          last_name?: string | null
          onboarding_checks?: Json | null
          phone?: string | null
          platform_fee_percent?: number | null
          push_enabled?: boolean
          slug?: string
          stripe_account_id?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_deleted_at?: string | null
          stripe_onboarding_complete?: boolean
          stripe_payouts_enabled?: boolean | null
          stripe_status?: string | null
          updated_at?: string
          wallet_balance_cents?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          user_id: string | null
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          user_id?: string | null
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          user_id?: string | null
        }
        Relationships: []
      }
      stripe_webhook_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          received_at: string
          stripe_account_id: string | null
          stripe_created_at: string
          stripe_event_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          received_at?: string
          stripe_account_id?: string | null
          stripe_created_at: string
          stripe_event_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          received_at?: string
          stripe_account_id?: string | null
          stripe_created_at?: string
          stripe_event_id?: string
        }
        Relationships: []
      }
      support_requests: {
        Row: {
          category: string
          created_at: string
          email: string
          id: string
          lang: string | null
          message: string
          name: string | null
          page_url: string | null
          role: string | null
          status: string
          subject: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string
          email: string
          id?: string
          lang?: string | null
          message: string
          name?: string | null
          page_url?: string | null
          role?: string | null
          status?: string
          subject: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          email?: string
          id?: string
          lang?: string | null
          message?: string
          name?: string | null
          page_url?: string | null
          role?: string | null
          status?: string
          subject?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      tip_splits: {
        Row: {
          amount_cents: number
          created_at: string
          destination_id: string | null
          destination_kind: Database["public"]["Enums"]["tip_destination_kind"]
          employer_payout_account_id: string | null
          error_message: string | null
          id: string
          label: string
          part_index: number
          percent: number
          review_rating: number | null
          status: string
          stripe_transfer_id: string | null
          tip_id: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          destination_id?: string | null
          destination_kind: Database["public"]["Enums"]["tip_destination_kind"]
          employer_payout_account_id?: string | null
          error_message?: string | null
          id?: string
          label: string
          part_index: number
          percent: number
          review_rating?: number | null
          status?: string
          stripe_transfer_id?: string | null
          tip_id: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          destination_id?: string | null
          destination_kind?: Database["public"]["Enums"]["tip_destination_kind"]
          employer_payout_account_id?: string | null
          error_message?: string | null
          id?: string
          label?: string
          part_index?: number
          percent?: number
          review_rating?: number | null
          status?: string
          stripe_transfer_id?: string | null
          tip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tip_splits_employer_payout_account_id_fkey"
            columns: ["employer_payout_account_id"]
            isOneToOne: false
            referencedRelation: "employer_payout_accounts_delete"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tip_splits_tip_id_fkey"
            columns: ["tip_id"]
            isOneToOne: false
            referencedRelation: "tips"
            referencedColumns: ["id"]
          },
        ]
      }
      tips: {
        Row: {
          amount_gross_cents: number
          amount_net_cents: number
          balance_transaction_id: string | null
          checkout_session_id: string | null
          client_country: string | null
          client_ip_hash: string | null
          client_user_agent: string | null
          created_at: string
          currency: string
          distribution_error: string | null
          distribution_status: string
          earner_id: string | null
          employer_id: string | null
          finalized_at: string | null
          id: string
          payment_amount_cents: number | null
          payment_currency: string | null
          payment_intent_id: string | null
          review_rating: number | null
          review_text: string | null
          scheme_id: string | null
          settlement_gross_cents: number | null
          settlement_net_cents: number | null
          source: string | null
          status: string
          stripe_balance_txn_id: string | null
          stripe_charge_id: string | null
          stripe_transfer_id: string | null
          transfer_group: string | null
        }
        Insert: {
          amount_gross_cents: number
          amount_net_cents: number
          balance_transaction_id?: string | null
          checkout_session_id?: string | null
          client_country?: string | null
          client_ip_hash?: string | null
          client_user_agent?: string | null
          created_at?: string
          currency?: string
          distribution_error?: string | null
          distribution_status?: string
          earner_id?: string | null
          employer_id?: string | null
          finalized_at?: string | null
          id?: string
          payment_amount_cents?: number | null
          payment_currency?: string | null
          payment_intent_id?: string | null
          review_rating?: number | null
          review_text?: string | null
          scheme_id?: string | null
          settlement_gross_cents?: number | null
          settlement_net_cents?: number | null
          source?: string | null
          status: string
          stripe_balance_txn_id?: string | null
          stripe_charge_id?: string | null
          stripe_transfer_id?: string | null
          transfer_group?: string | null
        }
        Update: {
          amount_gross_cents?: number
          amount_net_cents?: number
          balance_transaction_id?: string | null
          checkout_session_id?: string | null
          client_country?: string | null
          client_ip_hash?: string | null
          client_user_agent?: string | null
          created_at?: string
          currency?: string
          distribution_error?: string | null
          distribution_status?: string
          earner_id?: string | null
          employer_id?: string | null
          finalized_at?: string | null
          id?: string
          payment_amount_cents?: number | null
          payment_currency?: string | null
          payment_intent_id?: string | null
          review_rating?: number | null
          review_text?: string | null
          scheme_id?: string | null
          settlement_gross_cents?: number | null
          settlement_net_cents?: number | null
          source?: string | null
          status?: string
          stripe_balance_txn_id?: string | null
          stripe_charge_id?: string | null
          stripe_transfer_id?: string | null
          transfer_group?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tips_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "earners_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_earner_id_fkey"
            columns: ["earner_id"]
            isOneToOne: false
            referencedRelation: "profiles_earner"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tips_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tips_employer_id_fkey"
            columns: ["employer_id"]
            isOneToOne: false
            referencedRelation: "employers_public_view"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "tips_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "allocation_schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      user_index: {
        Row: {
          created_at: string
          email: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          role: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_payout_queue_delete: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          earner_id: string
          error: string | null
          id: string
          processed_at: string | null
          status: string
          stripe_transfer_id: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          earner_id: string
          error?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          earner_id?: string
          error?: string | null
          id?: string
          processed_at?: string | null
          status?: string
          stripe_transfer_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      earners_public: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          currency: string | null
          display_name: string | null
          goal_amount_cents: number | null
          goal_earned_since_start: number | null
          goal_start_amount: number | null
          goal_start_date: string | null
          goal_title: string | null
          id: string | null
          is_active: boolean | null
          lang: string | null
          slug: string | null
          stripe_charges_enabled: boolean | null
          stripe_payouts_enabled: boolean | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          goal_amount_cents?: number | null
          goal_earned_since_start?: number | null
          goal_start_amount?: number | null
          goal_start_date?: string | null
          goal_title?: string | null
          id?: string | null
          is_active?: boolean | null
          lang?: string | null
          slug?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_payouts_enabled?: boolean | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          currency?: string | null
          display_name?: string | null
          goal_amount_cents?: number | null
          goal_earned_since_start?: number | null
          goal_start_amount?: number | null
          goal_start_date?: string | null
          goal_title?: string | null
          id?: string | null
          is_active?: boolean | null
          lang?: string | null
          slug?: string | null
          stripe_charges_enabled?: boolean | null
          stripe_payouts_enabled?: boolean | null
        }
        Relationships: []
      }
      employers_public_view: {
        Row: {
          currency: string | null
          display_name: string | null
          goal_amount_cents: number | null
          goal_earned_since_start: number | null
          goal_start_amount: number | null
          goal_start_date: string | null
          goal_title: string | null
          invite_code: string | null
          is_active: boolean | null
          logo_url: string | null
          name: string | null
          slug: string | null
          stripe_account_id: string | null
          user_id: string | null
        }
        Insert: {
          currency?: string | null
          display_name?: never
          goal_amount_cents?: number | null
          goal_earned_since_start?: number | null
          goal_start_amount?: number | null
          goal_start_date?: string | null
          goal_title?: string | null
          invite_code?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          stripe_account_id?: string | null
          user_id?: string | null
        }
        Update: {
          currency?: string | null
          display_name?: never
          goal_amount_cents?: number | null
          goal_earned_since_start?: number | null
          goal_start_amount?: number | null
          goal_start_date?: string | null
          goal_title?: string | null
          invite_code?: string | null
          is_active?: boolean | null
          logo_url?: string | null
          name?: string | null
          slug?: string | null
          stripe_account_id?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      add_to_wallet: {
        Args: { p_amount: number; p_earner_id: string }
        Returns: undefined
      }
      add_to_wallet_employer: {
        Args: { p_amount: number; p_employer_id: string }
        Returns: undefined
      }
      bytea_to_text: { Args: { data: string }; Returns: string }
      earner_employers_list: {
        Args: { input_earner_id: string }
        Returns: {
          employer_id: string
          employer_name: string
          employer_slug: string
          id: string
          invite_code: string
          is_active: boolean
          pending: boolean
          role: string
        }[]
      }
      http: {
        Args: { request: Database["public"]["CompositeTypes"]["http_request"] }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "http_request"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_delete:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_get:
        | {
            Args: { uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_head: {
        Args: { uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_header: {
        Args: { field: string; value: string }
        Returns: Database["public"]["CompositeTypes"]["http_header"]
        SetofOptions: {
          from: "*"
          to: "http_header"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_list_curlopt: {
        Args: never
        Returns: {
          curlopt: string
          value: string
        }[]
      }
      http_patch: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_post:
        | {
            Args: { content: string; content_type: string; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
        | {
            Args: { data: Json; uri: string }
            Returns: Database["public"]["CompositeTypes"]["http_response"]
            SetofOptions: {
              from: "*"
              to: "http_response"
              isOneToOne: true
              isSetofReturn: false
            }
          }
      http_put: {
        Args: { content: string; content_type: string; uri: string }
        Returns: Database["public"]["CompositeTypes"]["http_response"]
        SetofOptions: {
          from: "*"
          to: "http_response"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      http_reset_curlopt: { Args: never; Returns: boolean }
      http_set_curlopt: {
        Args: { curlopt: string; value: string }
        Returns: boolean
      }
      ledger_daily_deltas: {
        Args: { p_account_type?: string; p_day: string }
        Returns: {
          account_type: string
          currency: string
          delta: number
          internal_account_id: string
        }[]
      }
      process_wallet_auto_queue: { Args: never; Returns: undefined }
      process_wallet_pending: { Args: never; Returns: undefined }
      recalculate_goal_earned: {
        Args: { p_owner_id: string; p_owner_type: string }
        Returns: number
      }
      run_wallet_auto_queue: { Args: never; Returns: undefined }
      text_to_bytea: { Args: { data: string }; Returns: string }
      urlencode:
        | { Args: { data: Json }; Returns: string }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
        | {
            Args: { string: string }
            Returns: {
              error: true
            } & "Could not choose the best candidate function between: public.urlencode(string => bytea), public.urlencode(string => varchar). Try renaming the parameters or the function itself in the database so function overloading can be resolved"
          }
      user_index_upsert: {
        Args: { p_role: string; p_user_id: string }
        Returns: undefined
      }
    }
    Enums: {
      employer_account_type: "team" | "employer" | "external"
      employer_member_role: "worker" | "manager" | "admin"
      payout_mode: "scheme_defined" | "personal" | "employer_pooled"
      tip_destination_kind: "earner" | "team" | "employer" | "external"
    }
    CompositeTypes: {
      http_header: {
        field: string | null
        value: string | null
      }
      http_request: {
        method: unknown
        uri: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content_type: string | null
        content: string | null
      }
      http_response: {
        status: number | null
        content_type: string | null
        headers: Database["public"]["CompositeTypes"]["http_header"][] | null
        content: string | null
      }
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
      employer_account_type: ["team", "employer", "external"],
      employer_member_role: ["worker", "manager", "admin"],
      payout_mode: ["scheme_defined", "personal", "employer_pooled"],
      tip_destination_kind: ["earner", "team", "employer", "external"],
    },
  },
} as const
