export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = "customer" | "business_owner" | "staff" | "super_admin";
export type BusinessStatus = "active" | "suspended" | "pending";
export type BookingStatus =
  | "pending"
  | "confirmed"
  | "cancelled"
  | "completed"
  | "no_show";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "past_due"
  | "cancelled"
  | "paused";
export type ApplicationStatus = "pending" | "approved" | "rejected";
export type OfferStatus = "active" | "expired" | "draft";
export type TierName = "essential" | "growth" | "premium";

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          user_id: string;
          role: UserRole;
          full_name: string | null;
          email: string | null;
          phone: string | null;
          avatar_url: string | null;
          locale: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["profiles"]["Row"],
          "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>;
      };
      localities: {
        Row: {
          id: string;
          name_ar: string;
          name_he: string;
          name_en: string;
          slug: string;
          region: string | null;
          sort_order: number;
          active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["localities"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["localities"]["Insert"]>;
      };
      categories: {
        Row: {
          id: string;
          name_ar: string;
          name_he: string;
          name_en: string;
          slug: string;
          icon: string | null;
          sort_order: number;
          active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["categories"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>;
      };
      tiers: {
        Row: {
          id: string;
          name: TierName;
          display_name_ar: string;
          display_name_he: string;
          display_name_en: string;
          max_staff: number;
          max_reminders_per_month: number;
          max_active_offers: number;
          can_respond_to_reviews: boolean;
          analytics_level: "none" | "basic" | "full";
          placement: "standard" | "improved" | "featured";
          price_monthly_ils: number;
          price_yearly_ils: number;
          trial_days: number;
          active: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["tiers"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["tiers"]["Insert"]>;
      };
      businesses: {
        Row: {
          id: string;
          owner_id: string;
          name: string;
          slug: string;
          description: string | null;
          category_id: string;
          locality_id: string;
          address: string | null;
          phone: string | null;
          whatsapp: string | null;
          logo_url: string | null;
          cover_url: string | null;
          gallery_urls: string[] | null;
          rating_avg: number;
          rating_count: number;
          status: BusinessStatus;
          placement: "standard" | "improved" | "featured";
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["businesses"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["businesses"]["Insert"]>;
      };
      services: {
        Row: {
          id: string;
          business_id: string;
          name: string;
          description: string | null;
          duration_minutes: number;
          price_ils: number;
          deposit_ils: number | null;
          active: boolean;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["services"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>;
      };
      staff: {
        Row: {
          id: string;
          business_id: string;
          user_id: string | null;
          full_name: string;
          title: string | null;
          bio: string | null;
          photo_url: string | null;
          active: boolean;
          sort_order: number;
        };
        Insert: Omit<Database["public"]["Tables"]["staff"]["Row"], "id">;
        Update: Partial<Database["public"]["Tables"]["staff"]["Insert"]>;
      };
      business_hours: {
        Row: {
          id: string;
          business_id: string;
          day_of_week: number;
          open_time: string;
          close_time: string;
          is_closed: boolean;
        };
        Insert: Omit<Database["public"]["Tables"]["business_hours"]["Row"], "id">;
        Update: Partial<
          Database["public"]["Tables"]["business_hours"]["Insert"]
        >;
      };
      bookings: {
        Row: {
          id: string;
          business_id: string;
          customer_id: string | null;
          staff_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          starts_at: string;
          ends_at: string;
          status: BookingStatus;
          total_price_ils: number;
          deposit_paid_ils: number | null;
          payment_ref: string | null;
          notes: string | null;
          guest_token: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["bookings"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      offers: {
        Row: {
          id: string;
          business_id: string;
          title: string;
          description: string | null;
          discount_type: "percentage" | "fixed";
          discount_value: number;
          valid_from: string;
          valid_until: string | null;
          status: OfferStatus;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["offers"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["offers"]["Insert"]>;
      };
      reviews: {
        Row: {
          id: string;
          booking_id: string;
          business_id: string;
          customer_id: string | null;
          rating: number;
          comment: string | null;
          is_hidden: boolean;
          is_published: boolean;
          created_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["reviews"]["Row"],
          "id" | "created_at"
        >;
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>;
      };
      subscriptions: {
        Row: {
          id: string;
          business_id: string;
          tier_id: string;
          status: SubscriptionStatus;
          trial_ends_at: string | null;
          current_period_start: string | null;
          current_period_end: string | null;
          stripe_subscription_id: string | null;
          stripe_customer_id: string | null;
          reminders_sent_this_month: number;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["subscriptions"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<Database["public"]["Tables"]["subscriptions"]["Insert"]>;
      };
      business_applications: {
        Row: {
          id: string;
          applicant_name: string;
          applicant_email: string;
          applicant_phone: string;
          business_name: string;
          business_category_id: string | null;
          business_locality_id: string | null;
          business_address: string | null;
          message: string | null;
          status: ApplicationStatus;
          admin_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<
          Database["public"]["Tables"]["business_applications"]["Row"],
          "id" | "created_at" | "updated_at"
        >;
        Update: Partial<
          Database["public"]["Tables"]["business_applications"]["Insert"]
        >;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// Convenience types
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Locality = Database["public"]["Tables"]["localities"]["Row"];
export type Category = Database["public"]["Tables"]["categories"]["Row"];
export type Tier = Database["public"]["Tables"]["tiers"]["Row"];
export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type Service = Database["public"]["Tables"]["services"]["Row"];
export type Staff = Database["public"]["Tables"]["staff"]["Row"];
export type BusinessHours =
  Database["public"]["Tables"]["business_hours"]["Row"];
export type Booking = Database["public"]["Tables"]["bookings"]["Row"];
export type Offer = Database["public"]["Tables"]["offers"]["Row"];
export type Review = Database["public"]["Tables"]["reviews"]["Row"];
export type Subscription =
  Database["public"]["Tables"]["subscriptions"]["Row"];
export type BusinessApplication =
  Database["public"]["Tables"]["business_applications"]["Row"];

// Extended types with joins
export type BusinessWithDetails = Business & {
  category: Category;
  locality: Locality;
  services?: Service[];
  staff?: Staff[];
  business_hours?: BusinessHours[];
  offers?: Offer[];
  reviews?: Review[];
  subscription?: Subscription & { tier: Tier };
};
