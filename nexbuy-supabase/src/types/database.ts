export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string
          phone: string | null
          point_balance: number
          preferred_locale: string
          status: 'disabled' | 'active'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string
          phone?: string | null
          point_balance?: number
          preferred_locale?: string
          status?: 'disabled' | 'active'
        }
        Update: {
          name?: string
          phone?: string | null
          preferred_locale?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: number
          parent_id: number | null
          slug: string
          sort_order: number
        }
        Insert: {
          parent_id?: number | null
          slug: string
          sort_order?: number
        }
        Update: {
          parent_id?: number | null
          slug?: string
          sort_order?: number
        }
      }
      products: {
        Row: {
          id: string
          category_id: number
          sku: string
          type: 'physical' | 'digital'
          price: number
          stock: number
          max_downloads: number | null
          download_expiry_hours: number | null
          status: 'inactive' | 'active'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          category_id: number
          sku: string
          type?: 'physical' | 'digital'
          price: number
          stock?: number
          max_downloads?: number | null
          download_expiry_hours?: number | null
          status?: 'inactive' | 'active'
        }
        Update: {
          category_id?: number
          sku?: string
          type?: 'physical' | 'digital'
          price?: number
          stock?: number
          max_downloads?: number | null
          download_expiry_hours?: number | null
          status?: 'inactive' | 'active'
          updated_at?: string
        }
      }
      product_translations: {
        Row: {
          id: number
          product_id: string
          locale: string
          name: string
          description: string | null
        }
        Insert: {
          product_id: string
          locale: string
          name: string
          description?: string | null
        }
        Update: {
          locale?: string
          name?: string
          description?: string | null
        }
      }
      product_images: {
        Row: {
          id: string
          product_id: string
          url: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          product_id: string
          url: string
          sort_order?: number
        }
        Update: {
          url?: string
          sort_order?: number
        }
      }
      product_variants: {
        Row: {
          id: string
          product_id: string
          variant_name: string
          price_adjustment: number
          stock: number
          sku: string | null
        }
        Insert: {
          id?: string
          product_id: string
          variant_name: string
          price_adjustment?: number
          stock?: number
          sku?: string | null
        }
        Update: {
          variant_name?: string
          price_adjustment?: number
          stock?: number
          sku?: string | null
        }
      }
      orders: {
        Row: {
          id: string
          order_no: string
          user_id: string
          status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          payment_method: 'manual_confirmation'
          payment_status: 'unpaid' | 'paid' | 'refunding' | 'refunded'
          shipping_method: 'home_delivery' | 'seven_eleven' | 'family_mart'
          shipping_fee: number
          sub_total: number
          discount_amount: number
          point_discount: number
          total_amount: number
          recipient_name: string
          recipient_phone: string
          shipping_address: string | null
          store_id: string | null
          tracking_no: string | null
          note: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_no: string
          user_id: string
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          payment_method?: 'manual_confirmation'
          payment_status?: 'unpaid' | 'paid' | 'refunding' | 'refunded'
          shipping_method: 'home_delivery' | 'seven_eleven' | 'family_mart'
          shipping_fee?: number
          sub_total: number
          discount_amount?: number
          point_discount?: number
          total_amount: number
          recipient_name: string
          recipient_phone: string
          shipping_address?: string | null
          store_id?: string | null
          note?: string | null
        }
        Update: {
          status?: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'
          payment_status?: 'unpaid' | 'paid' | 'refunding' | 'refunded'
          tracking_no?: string | null
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          variant_id: string | null
          product_name: string
          unit_price: number
          quantity: number
          subtotal: number
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          variant_id?: string | null
          product_name: string
          unit_price: number
          quantity: number
          subtotal: number
        }
        Update: {}
      }
      order_coupons: {
        Row: {
          id: string
          order_id: string
          coupon_id: number
          discount_amount: number
        }
        Insert: {
          id?: string
          order_id: string
          coupon_id: number
          discount_amount: number
        }
        Update: {}
      }
      coupons: {
        Row: {
          id: number
          code: string
          type: 'fixed_amount' | 'percentage'
          value: number
          min_order_amount: number
          usage_limit: number | null
          used_count: number
          start_at: string
          expired_at: string
          status: 'disabled' | 'active'
        }
        Insert: {
          code: string
          type: 'fixed_amount' | 'percentage'
          value: number
          min_order_amount?: number
          usage_limit?: number | null
          start_at?: string
          expired_at?: string
          status?: 'disabled' | 'active'
        }
        Update: {
          code?: string
          type?: 'fixed_amount' | 'percentage'
          value?: number
          min_order_amount?: number
          usage_limit?: number | null
          used_count?: number
          start_at?: string
          expired_at?: string
          status?: 'disabled' | 'active'
        }
      }
      points: {
        Row: {
          id: string
          user_id: string
          order_id: string | null
          type: 'earn' | 'redeem' | 'expire' | 'adjust'
          amount: number
          expires_at: string | null
          note: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          order_id?: string | null
          type: 'earn' | 'redeem' | 'expire' | 'adjust'
          amount: number
          expires_at?: string | null
          note?: string | null
        }
        Update: {
          amount?: number
        }
      }
      point_rules: {
        Row: {
          id: number
          earn_rate: number
          redeem_rate: number
          point_expiry_months: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          earn_rate: number
          redeem_rate: number
          point_expiry_months: number
          updated_by?: string | null
        }
        Update: {
          earn_rate?: number
          redeem_rate?: number
          point_expiry_months?: number
          updated_by?: string | null
        }
      }
      digital_downloads: {
        Row: {
          id: string
          order_item_id: string
          user_id: string
          token: string
          download_count: number
          max_downloads: number
          expires_at: string
          is_revoked: boolean
        }
        Insert: {
          id?: string
          order_item_id: string
          user_id: string
          token?: string
          max_downloads: number
          expires_at: string
          is_revoked?: boolean
        }
        Update: {
          download_count?: number
          is_revoked?: boolean
        }
      }
      user_addresses: {
        Row: {
          id: string
          user_id: string
          label: string
          recipient_name: string
          phone: string
          address_type: 'regular' | 'convenience_store'
          zip_code: string | null
          city: string | null
          address: string | null
          store_id: string | null
          store_name: string | null
          is_default: boolean
        }
        Insert: {
          id?: string
          user_id: string
          label: string
          recipient_name: string
          phone: string
          address_type?: 'regular' | 'convenience_store'
          zip_code?: string | null
          city?: string | null
          address?: string | null
          store_id?: string | null
          store_name?: string | null
          is_default?: boolean
        }
        Update: {
          label?: string
          recipient_name?: string
          phone?: string
          address_type?: 'regular' | 'convenience_store'
          zip_code?: string | null
          city?: string | null
          address?: string | null
          store_id?: string | null
          store_name?: string | null
          is_default?: boolean
        }
      }
      wishlists: {
        Row: {
          id: string
          user_id: string
          product_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
        }
        Update: {}
      }
      shipping_methods: {
        Row: {
          id: number
          name: string
          type: 'home_delivery' | 'seven_eleven' | 'family_mart'
          base_fee: number
          free_shipping_threshold: number | null
          is_active: boolean
        }
        Insert: {
          name: string
          type: 'home_delivery' | 'seven_eleven' | 'family_mart'
          base_fee: number
          free_shipping_threshold?: number | null
          is_active?: boolean
        }
        Update: {
          name?: string
          type?: 'home_delivery' | 'seven_eleven' | 'family_mart'
          base_fee?: number
          free_shipping_threshold?: number | null
          is_active?: boolean
        }
      }
      cart_items: {
        Row: {
          id: string
          user_id: string
          product_id: string
          variant_id: string | null
          quantity: number
          coupon_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          product_id: string
          variant_id?: string | null
          quantity?: number
          coupon_code?: string | null
        }
        Update: {
          quantity?: number
          coupon_code?: string | null
          updated_at?: string
        }
      }
      admins: {
        Row: {
          id: string
          email: string
          password_hash: string
          name: string
          role: 'super_admin' | 'admin'
          status: 'disabled' | 'active'
          refresh_token: string | null
          refresh_token_expiry: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          password_hash: string
          name: string
          role?: 'super_admin' | 'admin'
          status?: 'disabled' | 'active'
        }
        Update: {
          name?: string
          role?: 'super_admin' | 'admin'
          status?: 'disabled' | 'active'
          refresh_token?: string | null
          refresh_token_expiry?: string | null
          updated_at?: string
        }
      }
    }
    Views: {}
    Functions: {
      create_order: {
        Args: {
          p_user_id: string
          p_shipping_address_id?: string
          p_shipping_method_id?: number
          p_recipient_name?: string
          p_recipient_phone?: string
          p_shipping_address?: string
          p_store_id?: string
          p_points_to_redeem?: number
          p_note?: string
        }
        Returns: string
      }
      cancel_order: {
        Args: {
          p_user_id: string
          p_order_no: string
        }
        Returns: void
      }
    }
    Enums: {
      user_status: 'disabled' | 'active'
      product_type: 'physical' | 'digital'
      product_status: 'inactive' | 'active'
      address_type: 'regular' | 'convenience_store'
      order_status: 'pending' | 'paid' | 'processing' | 'shipped' | 'completed' | 'cancelled'
      payment_method: 'manual_confirmation'
      payment_status: 'unpaid' | 'paid' | 'refunding' | 'refunded'
      shipping_method_type: 'home_delivery' | 'seven_eleven' | 'family_mart'
      coupon_type: 'fixed_amount' | 'percentage'
      coupon_status: 'disabled' | 'active'
      point_type: 'earn' | 'redeem' | 'expire' | 'adjust'
      admin_role: 'super_admin' | 'admin'
    }
  }
}
