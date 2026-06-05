// Trimmed runtime types for the rows this MVP cares about.
// Full DB types (via `supabase gen types typescript`) can replace these later.

export type ProductKind = "finished" | "prescription_frame";

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_urls: string[];
  brand: string | null;
  kind: ProductKind;
  finished_stock: number | null;
  is_online_available: boolean;
  // Phase 3 attributes — 全選填、可能 null / empty array
  face_shape: string[];
  frame_shape: string | null;
  frame_size: string | null;
  material: string | null;
  color: string | null;
  // Virtual try-on
  try_on_image_url: string | null;
  is_featured: boolean | null;
}

export interface AppointmentSlot {
  id: string;
  date: string; // ISO date "2026-04-20"
  start_time: string; // "10:00:00"
  end_time: string; // "11:00:00"
  capacity: number;
  booked_count: number;
  is_active: boolean;
}

export interface Appointment {
  id: string;
  slot_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  frame_product_id: string | null;
  note: string | null;
  status: "booked" | "completed" | "noshow" | "cancelled";
  cancel_token: string;
  created_at: string;
  cancelled_at: string | null;
}
