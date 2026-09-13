// Generated from the live Supabase schema via PostgREST's OpenAPI introspection
// (GET {SUPABASE_URL}/rest/v1/ with Accept: application/openapi+json), since the
// Supabase CLI's official generator needs an interactive login this environment
// doesn't have. Covers all 28 tables in the public schema — the previous
// version of this file only defined 3 (articles, videos, recipes), which is why
// most other tables silently typed to `never` throughout the app.
//
// To regenerate later with the official tool instead:
//   npx supabase login
//   npx supabase gen types typescript --project-id usrtaxvjwidfxajbjlpj > src/integrations/supabase/types.ts

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      affiliate_stores: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          affiliate_url: string;
          is_active: boolean | null;
          sort_order: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["affiliate_stores"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["affiliate_stores"]["Insert"]>;
        Relationships: [];
      };
      articles: {
        Row: {
          id: number;
          author_id: string | null;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          image_url: string | null;
          created_at: string;
          updated_at: string;
          category_name: string | null;
          status: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["articles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "articles_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            // Synthetic: not a direct FK, but vendor_profiles.id is itself a FK to
            // profiles.id (1:1 extension table), so PostgREST resolves and embeds
            // vendor_profiles under articles via this shared reference at runtime
            // (verified against the live API) — this entry is what lets that
            // .select("*, vendor_profiles(...)") pattern type-check correctly.
            foreignKeyName: "articles_author_id_vendor_profiles_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      bookings: {
        Row: {
          id: string;
          order_id: string | null;
          product_id: number | null;
          customer_id: string | null;
          vendor_id: string | null;
          start_time: string;
          end_time: string;
          status: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["bookings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "bookings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "bookings_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          type: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
        Relationships: [];
      };
      chat_conversations: {
        Row: {
          id: string;
          customer_id: string | null;
          vendor_id: string | null;
          last_message_at: string;
          created_at: string;
          guest_name: string | null;
          guest_email: string | null;
          is_support: boolean | null;
          status: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["chat_conversations"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["chat_conversations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "chat_conversations_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chat_conversations_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      chat_messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string | null;
          content: string;
          created_at: string;
          sender_type: string | null;
          sender_name: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["chat_messages"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["chat_messages"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey";
            columns: ["conversation_id"];
            isOneToOne: false;
            referencedRelation: "chat_conversations";
            referencedColumns: ["id"];
          },
        ];
      };
      contact_messages: {
        Row: {
          id: string;
          name: string;
          email: string;
          subject: string;
          message: string;
          read: boolean;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["contact_messages"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
        Relationships: [];
      };
      galleries: {
        Row: {
          id: string;
          title: string;
          category: string;
          created_at: string | null;
          vendor_id: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["galleries"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["galleries"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "galleries_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      gallery_items: {
        Row: {
          id: string;
          gallery_id: string | null;
          image_url: string;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["gallery_items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["gallery_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "gallery_items_gallery_id_fkey";
            columns: ["gallery_id"];
            isOneToOne: false;
            referencedRelation: "galleries";
            referencedColumns: ["id"];
          },
        ];
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          created_at: string;
          full_name: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          user_id: string | null;
          recipient_role: string | null;
          type: string;
          title: string;
          message: string;
          link: string | null;
          metadata: Json | null;
          read: boolean | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["notifications"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["notifications"]["Insert"]>;
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: number;
          product_name: string;
          product_image: string | null;
          product_slug: string | null;
          price: number;
          quantity: number;
          created_at: string;
          status: string | null;
          tracking_number: string | null;
          vendor_id: string | null;
          variant_id: number | null;
        };
        Insert: Partial<Database["public"]["Tables"]["order_items"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          status: string;
          subtotal: number;
          shipping: number;
          tax: number;
          total: number;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          address: string;
          city: string;
          state: string;
          zip: string;
          created_at: string;
          updated_at: string;
          stripe_session_id: string | null;
          payment_status: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["orders"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      popups: {
        Row: {
          id: string;
          title: string;
          content: string | null;
          image_url: string | null;
          cta_type: string | null;
          cta_url: string | null;
          cta_button_text: string | null;
          is_active: boolean | null;
          display_delay: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["popups"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["popups"]["Insert"]>;
        Relationships: [];
      };
      product_categories: {
        Row: {
          product_id: number;
          category_id: number;
        };
        Insert: Partial<Database["public"]["Tables"]["product_categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["product_categories"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "product_categories_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "product_categories_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      products: {
        Row: {
          id: number;
          vendor_id: string | null;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          price: number;
          image_url: string | null;
          stock: number;
          status: string;
          created_at: string;
          updated_at: string;
          brand: string | null;
          tags: string[] | null;
          category: string | null;
          variants: Json | null;
          images: string[] | null;
          store_category: string | null;
          product_type: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "products_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: string;
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
        Relationships: [];
      };
      recipes: {
        Row: {
          id: number;
          author_id: string | null;
          title: string;
          slug: string;
          excerpt: string | null;
          content: string | null;
          image_url: string | null;
          prep_time: number | null;
          cook_time: number | null;
          created_at: string;
          updated_at: string;
          status: string | null;
          tags: string[] | null;
        };
        Insert: Partial<Database["public"]["Tables"]["recipes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "recipes_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      reviews: {
        Row: {
          id: string;
          user_id: string;
          product_id: number;
          product_slug: string;
          rating: number;
          title: string | null;
          content: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["reviews"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      scheduled_posts: {
        Row: {
          id: string;
          title: string;
          caption: string;
          hashtags: string[] | null;
          image_url: string | null;
          source_type: string | null;
          source_id: string | null;
          source_url: string | null;
          platforms: string[] | null;
          scheduled_at: string;
          status: string | null;
          published_at: string | null;
          fb_post_id: string | null;
          ig_post_id: string | null;
          error_message: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["scheduled_posts"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["scheduled_posts"]["Insert"]>;
        Relationships: [];
      };
      service_availability: {
        Row: {
          id: string;
          vendor_id: string | null;
          product_id: number | null;
          day_of_week: number;
          start_time: string;
          end_time: string;
          slot_duration: number | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["service_availability"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["service_availability"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "service_availability_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "service_availability_product_id_fkey";
            columns: ["product_id"];
            isOneToOne: false;
            referencedRelation: "products";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_earnings: {
        Row: {
          id: string;
          vendor_id: string | null;
          order_id: string | null;
          amount: number;
          platform_fee: number;
          status: string | null;
          created_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["vendor_earnings"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["vendor_earnings"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vendor_earnings_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "vendor_earnings_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_follows: {
        Row: {
          id: string;
          user_id: string;
          vendor_id: string;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendor_follows"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["vendor_follows"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vendor_follows_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_profiles: {
        Row: {
          id: string;
          store_name: string;
          store_description: string | null;
          store_logo_url: string | null;
          store_banner_url: string | null;
          website: string | null;
          instagram: string | null;
          facebook: string | null;
          twitter: string | null;
          is_approved: boolean;
          created_at: string;
          updated_at: string;
          is_live: boolean | null;
          store_categories: string[] | null;
          ai_enabled: boolean | null;
          ai_instructions: string | null;
          vendor_type: string | null;
          representative_name: string | null;
          commission_rate: number | null;
          store_slug: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendor_profiles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["vendor_profiles"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vendor_profiles_id_fkey";
            columns: ["id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_streams: {
        Row: {
          vendor_id: string;
          mux_stream_id: string | null;
          mux_stream_key: string | null;
          mux_playback_id: string | null;
          is_live: boolean | null;
          stream_title: string | null;
          last_streamed_at: string | null;
          created_at: string | null;
          updated_at: string | null;
        };
        Insert: Partial<Database["public"]["Tables"]["vendor_streams"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["vendor_streams"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vendor_streams_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      vendor_withdrawals: {
        Row: {
          id: string;
          vendor_id: string;
          amount: number;
          paypal_email: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["vendor_withdrawals"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["vendor_withdrawals"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "vendor_withdrawals_vendor_id_fkey";
            columns: ["vendor_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          embed_url: string;
          thumbnail_url: string | null;
          created_at: string | null;
          author_id: string | null;
          status: string | null;
          youtube_id: string | null;
          is_featured: boolean | null;
        };
        Insert: Partial<Database["public"]["Tables"]["videos"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["videos"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "videos_author_id_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            // Synthetic — see the matching note on articles.author_id above.
            foreignKeyName: "videos_author_id_vendor_profiles_fkey";
            columns: ["author_id"];
            isOneToOne: false;
            referencedRelation: "vendor_profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      wishlists: {
        Row: {
          id: string;
          user_id: string;
          product_id: number;
          product_slug: string;
          product_name: string;
          product_image: string | null;
          created_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["wishlists"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "wishlists_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
}
