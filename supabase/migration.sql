-- ============================================================
-- Lifestyle Medicine Gateway — Database Schema
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor)
-- ============================================================

-- 1. PROFILES — extends auth.users
create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'vendor', 'admin')),
  phone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 2. VENDOR PROFILES — store/brand info for vendors
create table public.vendor_profiles (
  id uuid references public.profiles(id) on delete cascade primary key,
  store_name text not null,
  store_description text,
  store_logo_url text,
  store_banner_url text,
  website text,
  instagram text,
  facebook text,
  twitter text,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.vendor_profiles enable row level security;

create policy "Vendor profiles are viewable by everyone"
  on public.vendor_profiles for select using (true);

create policy "Vendors can update own store"
  on public.vendor_profiles for update using (auth.uid() = id);

create policy "Vendors can insert own store"
  on public.vendor_profiles for insert with check (auth.uid() = id);

-- 3. ORDERS
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  subtotal numeric(10,2) not null default 0,
  shipping numeric(10,2) not null default 0,
  tax numeric(10,2) not null default 0,
  total numeric(10,2) not null default 0,
  -- shipping info
  first_name text not null,
  last_name text not null,
  email text not null,
  phone text,
  address text not null,
  city text not null,
  state text not null,
  zip text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select using (auth.uid() = user_id);

create policy "Users can create orders"
  on public.orders for insert with check (auth.uid() = user_id);

create policy "Admins can view all orders"
  on public.orders for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- Allow anonymous checkout (no auth required for insert)
create policy "Anyone can create orders"
  on public.orders for insert with check (true);

-- 4. ORDER ITEMS
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id integer not null, -- WP product ID
  product_name text not null,
  product_image text,
  product_slug text,
  price numeric(10,2) not null,
  quantity integer not null default 1,
  created_at timestamptz not null default now()
);

alter table public.order_items enable row level security;

create policy "Order items visible to order owner"
  on public.order_items for select using (
    exists (select 1 from public.orders where orders.id = order_items.order_id and orders.user_id = auth.uid())
  );

create policy "Anyone can insert order items"
  on public.order_items for insert with check (true);

-- 5. REVIEWS
create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id integer not null, -- WP product ID
  product_slug text not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  title text,
  content text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, product_id) -- one review per user per product
);

alter table public.reviews enable row level security;

create policy "Reviews are viewable by everyone"
  on public.reviews for select using (true);

create policy "Authenticated users can create reviews"
  on public.reviews for insert with check (auth.uid() = user_id);

create policy "Users can update own reviews"
  on public.reviews for update using (auth.uid() = user_id);

create policy "Users can delete own reviews"
  on public.reviews for delete using (auth.uid() = user_id);

-- 6. WISHLISTS
create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id integer not null,
  product_slug text not null,
  product_name text not null,
  product_image text,
  created_at timestamptz not null default now(),
  unique(user_id, product_id)
);

alter table public.wishlists enable row level security;

create policy "Users can view own wishlist"
  on public.wishlists for select using (auth.uid() = user_id);

create policy "Users can add to wishlist"
  on public.wishlists for insert with check (auth.uid() = user_id);

create policy "Users can remove from wishlist"
  on public.wishlists for delete using (auth.uid() = user_id);

-- 7. NEWSLETTER SUBSCRIBERS
create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

alter table public.newsletter_subscribers enable row level security;

create policy "Anyone can subscribe"
  on public.newsletter_subscribers for insert with check (true);

-- 8. CONTACT MESSAGES
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

create policy "Anyone can submit contact messages"
  on public.contact_messages for insert with check (true);

create policy "Admins can view contact messages"
  on public.contact_messages for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

-- ============================================================
-- INDEXES for performance
-- ============================================================
create index idx_orders_user_id on public.orders(user_id);
create index idx_orders_status on public.orders(status);
create index idx_order_items_order_id on public.order_items(order_id);
create index idx_reviews_product_id on public.reviews(product_id);
create index idx_reviews_user_id on public.reviews(user_id);
create index idx_wishlists_user_id on public.wishlists(user_id);
create index idx_wishlists_product_id on public.wishlists(product_id);

-- ============================================================
-- Updated_at trigger helper
-- ============================================================
create or replace function public.update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_profiles_updated_at
  before update on public.profiles
  for each row execute function public.update_updated_at();

create trigger update_vendor_profiles_updated_at
  before update on public.vendor_profiles
  for each row execute function public.update_updated_at();

create trigger update_orders_updated_at
  before update on public.orders
  for each row execute function public.update_updated_at();

create trigger update_reviews_updated_at
  before update on public.reviews
  for each row execute function public.update_updated_at();
