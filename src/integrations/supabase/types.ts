export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          role: "customer" | "vendor" | "admin";
          phone: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["profiles"]["Row"], "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
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
        };
        Insert: Omit<Database["public"]["Tables"]["vendor_profiles"]["Row"], "is_approved" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["vendor_profiles"]["Insert"]>;
      };
      orders: {
        Row: {
          id: string;
          user_id: string | null;
          status: "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";
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
        };
        Insert: Omit<Database["public"]["Tables"]["orders"]["Row"], "id" | "status" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>;
      };
      galleries: {
        Row: {
          category: string
          created_at: string | null
          id: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          id?: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          id?: string
          title?: string
        }
        Relationships: []
      }
      gallery_items: {
        Row: {
          created_at: string | null
          gallery_id: string | null
          id: string
          image_url: string
        }
        Insert: {
          created_at?: string | null
          gallery_id?: string | null
          id?: string
          image_url: string
        }
        Update: {
          created_at?: string | null
          gallery_id?: string | null
          id?: string
          image_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "gallery_items_gallery_id_fkey"
            columns: ["gallery_id"]
            isOneToOne: false
            referencedRelation: "galleries"
            referencedColumns: ["id"]
          },
        ]
      }
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
        };
        Insert: Omit<Database["public"]["Tables"]["order_items"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["reviews"]["Row"], "id" | "created_at" | "updated_at">;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["wishlists"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>;
      };
      newsletter_subscribers: {
        Row: {
          id: string;
          email: string;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["newsletter_subscribers"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
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
        Insert: Omit<Database["public"]["Tables"]["contact_messages"]["Row"], "id" | "read" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>;
      };
      
      // CATALOG TABLES
      categories: {
        Row: {
          id: number;
          name: string;
          slug: string;
          type: "product" | "article" | "recipe";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["categories"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
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
          status: "draft" | "published" | "archived";
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["products"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>;
      };
      product_categories: {
        Row: {
          product_id: number;
          category_id: number;
        };
        Insert: Database["public"]["Tables"]["product_categories"]["Row"];
        Update: Database["public"]["Tables"]["product_categories"]["Row"];
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
          category_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Partial<Database["public"]["Tables"]["articles"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["articles"]["Insert"]>;
      };
      videos: {
        Row: {
          id: string;
          title: string;
          description: string | null;
          embed_url: string;
          thumbnail_url: string | null;
          created_at: string | null;
        }
        Insert: {
          id?: string;
          title: string;
          description?: string | null;
          embed_url: string;
          thumbnail_url?: string | null;
          created_at?: string | null;
        }
        Update: {
          title?: string;
          description?: string | null;
          embed_url?: string;
          thumbnail_url?: string | null;
          created_at?: string | null;
        }
        Relationships: []
      }
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
        };
        Insert: Partial<Database["public"]["Tables"]["recipes"]["Row"]>;
        Update: Partial<Database["public"]["Tables"]["recipes"]["Insert"]>;
      };
    };
  };
}
