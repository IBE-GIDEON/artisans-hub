-- Artisans Hub — initial schema
-- Money is stored as integer kobo (NGN minor units).

create extension if not exists pgcrypto;

-- ───────────────────────── Staff & access ─────────────────────────
create table public.staff (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name text not null,
  email text not null,
  role text not null default 'orders' check (role in ('owner', 'orders', 'kitchen', 'finance', 'catering')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.staff_invites (
  email text primary key,
  name text not null,
  role text not null default 'orders' check (role in ('owner', 'orders', 'kitchen', 'finance', 'catering')),
  created_at timestamptz not null default now()
);

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active);
$$;

create or replace function public.is_owner() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where user_id = auth.uid() and active and role = 'owner');
$$;

-- Invited emails become staff automatically when they create their account.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare inv public.staff_invites;
begin
  select * into inv from public.staff_invites where lower(email) = lower(new.email);
  if found then
    insert into public.staff (user_id, name, email, role) values (new.id, inv.name, new.email, inv.role)
    on conflict (user_id) do nothing;
    delete from public.staff_invites where email = inv.email;
  end if;
  return new;
end $$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

-- ───────────────────────── Catalogue ─────────────────────────
create table public.menu_items (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  category text not null check (category in ('Rice & meals', 'Quick bites', 'Small chops', 'Drinks', 'Combos')),
  description text not null default '',
  price_minor integer not null check (price_minor > 0),
  emoji text not null default '🍛',
  tone text not null default 'orange' check (tone in ('orange', 'yellow', 'green', 'brown', 'red')),
  tag text,
  available boolean not null default true,
  prep_minutes integer not null default 15 check (prep_minutes >= 0),
  allergens text[] not null default '{}',
  featured boolean not null default false,
  sort integer not null default 0,
  updated_at timestamptz not null default now()
);

create table public.zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  fee_minor integer not null check (fee_minor >= 0),
  eta_minutes integer not null default 30,
  active boolean not null default true,
  sort integer not null default 0
);

create table public.settings (
  id integer primary key default 1 check (id = 1),
  business_name text not null default 'Artisans Hub',
  open_time text not null default '08:00',
  close_time text not null default '21:00',
  pickup_point text not null default '',
  support_phone text not null default '',
  bank_name text not null default '',
  account_name text not null default '',
  account_number text not null default '',
  accepting_orders boolean not null default true,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Orders ─────────────────────────
create sequence public.order_ref_seq start 1001;
create sequence public.enquiry_ref_seq start 101;

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('AH-' || nextval('public.order_ref_seq')),
  access_token uuid not null unique default gen_random_uuid(),
  customer_name text not null,
  phone text not null,
  email text,
  fulfilment text not null check (fulfilment in ('delivery', 'pickup')),
  zone_id uuid references public.zones (id) on delete set null,
  landmark text,
  scheduled_for date not null,
  time_slot text not null,
  notes text,
  allergy_notes text,
  subtotal_minor integer not null,
  fee_minor integer not null default 0,
  discount_minor integer not null default 0,
  total_minor integer not null,
  payment_method text not null default 'bank_transfer' check (payment_method in ('bank_transfer', 'online')),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'verifying', 'paid', 'refunded')),
  status text not null default 'pending_payment'
    check (status in ('pending_payment', 'verifying', 'confirmed', 'preparing', 'ready', 'dispatched', 'completed', 'cancelled')),
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index orders_created_idx on public.orders (created_at desc);
create index orders_status_idx on public.orders (status);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  menu_item_id uuid references public.menu_items (id) on delete set null,
  name_snapshot text not null,
  unit_price_minor integer not null,
  quantity integer not null check (quantity between 1 and 50)
);
create index order_items_order_idx on public.order_items (order_id);
create index order_items_menu_idx on public.order_items (menu_item_id);

create table public.catering_enquiries (
  id uuid primary key default gen_random_uuid(),
  ref text not null unique default ('CAT-' || nextval('public.enquiry_ref_seq')),
  name text not null,
  phone text not null,
  event_type text not null,
  event_date date not null,
  guests text not null,
  budget_minor integer,
  requested_items text not null default '',
  venue text not null,
  status text not null default 'new' check (status in ('new', 'contacted', 'quoted', 'accepted', 'scheduled', 'completed', 'lost')),
  quote_minor integer,
  deposit_minor integer,
  assigned_to text,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid,
  actor text not null,
  action text not null,
  entity text not null,
  detail text not null default '',
  at timestamptz not null default now()
);
create index audit_at_idx on public.audit_events (at desc);

create index orders_zone_idx on public.orders (zone_id);

-- ───────────────────────── Audit triggers ─────────────────────────
create or replace function public.audit_actor() returns text
language sql stable security definer set search_path = public as $$
  select coalesce((select name || ' (' || role || ')' from public.staff where user_id = auth.uid()),
                  case when auth.uid() is null then 'Customer' else 'Unknown user' end);
$$;

create or replace function public.audit_changes() returns trigger
language plpgsql security definer set search_path = public as $$
declare a text; e text; d text;
begin
  if tg_table_name = 'orders' then
    e := new.ref;
    if old.status is distinct from new.status then a := 'Changed order status'; d := old.status || ' → ' || new.status;
    elsif old.payment_status is distinct from new.payment_status then a := 'Changed payment status'; d := old.payment_status || ' → ' || new.payment_status;
    elsif old.internal_notes is distinct from new.internal_notes then a := 'Updated internal note'; d := '';
    else return new; end if;
  elsif tg_table_name = 'menu_items' then
    e := coalesce(new.name, old.name);
    if tg_op = 'INSERT' then a := 'Created menu item'; d := '₦' || (new.price_minor / 100);
    elsif tg_op = 'DELETE' then a := 'Deleted menu item'; d := '';
    elsif old.price_minor <> new.price_minor then a := 'Updated price'; d := '₦' || (old.price_minor / 100) || ' → ₦' || (new.price_minor / 100);
    elsif old.available <> new.available then a := case when new.available then 'Marked available' else 'Marked sold out' end; d := '';
    else a := 'Edited menu item'; d := ''; end if;
  elsif tg_table_name = 'catering_enquiries' then
    e := new.ref;
    if old.status is distinct from new.status then a := 'Moved enquiry'; d := old.status || ' → ' || new.status;
    else a := 'Updated quote'; d := coalesce('₦' || (new.quote_minor / 100), ''); end if;
  elsif tg_table_name = 'zones' then
    e := coalesce(new.name, old.name); a := lower(tg_op) || ' delivery zone'; d := '';
  elsif tg_table_name = 'settings' then
    e := 'Settings'; a := 'Updated business settings'; d := '';
  end if;
  insert into public.audit_events (actor_id, actor, action, entity, detail) values (auth.uid(), public.audit_actor(), a, e, d);
  return coalesce(new, old);
end $$;

create trigger audit_orders after update on public.orders for each row execute function public.audit_changes();
create trigger audit_menu after insert or update or delete on public.menu_items for each row execute function public.audit_changes();
create trigger audit_enquiries after update on public.catering_enquiries for each row execute function public.audit_changes();
create trigger audit_zones after insert or update or delete on public.zones for each row execute function public.audit_changes();
create trigger audit_settings after update on public.settings for each row execute function public.audit_changes();

create or replace function public.touch_updated_at() returns trigger language plpgsql set search_path = public as $$
begin new.updated_at := now(); return new; end $$;
create trigger touch_orders before update on public.orders for each row execute function public.touch_updated_at();
create trigger touch_menu before update on public.menu_items for each row execute function public.touch_updated_at();
create trigger touch_settings before update on public.settings for each row execute function public.touch_updated_at();

-- ───────────────────────── Row level security ─────────────────────────
alter table public.staff enable row level security;
alter table public.staff_invites enable row level security;
alter table public.menu_items enable row level security;
alter table public.zones enable row level security;
alter table public.settings enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.catering_enquiries enable row level security;
alter table public.audit_events enable row level security;

create policy "staff read staff" on public.staff for select to authenticated using ((select public.is_staff()) or user_id = (select auth.uid()));
create policy "owner manages staff" on public.staff for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner removes staff" on public.staff for delete to authenticated using ((select public.is_owner()));

create policy "owner reads invites" on public.staff_invites for select to authenticated using ((select public.is_owner()));
create policy "owner adds invites" on public.staff_invites for insert to authenticated with check ((select public.is_owner()));
create policy "owner removes invites" on public.staff_invites for delete to authenticated using ((select public.is_owner()));

create policy "public reads menu" on public.menu_items for select to anon, authenticated using (true);
create policy "staff adds menu" on public.menu_items for insert to authenticated with check ((select public.is_staff()));
create policy "staff edits menu" on public.menu_items for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff deletes menu" on public.menu_items for delete to authenticated using ((select public.is_staff()));

create policy "public reads zones" on public.zones for select to anon, authenticated using (true);
create policy "owner adds zones" on public.zones for insert to authenticated with check ((select public.is_owner()));
create policy "owner edits zones" on public.zones for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));
create policy "owner deletes zones" on public.zones for delete to authenticated using ((select public.is_owner()));

create policy "public reads settings" on public.settings for select to anon, authenticated using (true);
create policy "owner edits settings" on public.settings for update to authenticated using ((select public.is_owner())) with check ((select public.is_owner()));

create policy "staff reads orders" on public.orders for select to authenticated using ((select public.is_staff()));
create policy "staff edits orders" on public.orders for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "staff reads order items" on public.order_items for select to authenticated using ((select public.is_staff()));

create policy "staff reads enquiries" on public.catering_enquiries for select to authenticated using ((select public.is_staff()));
create policy "staff edits enquiries" on public.catering_enquiries for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "staff reads audit" on public.audit_events for select to authenticated using ((select public.is_staff()));

-- ───────────────────────── Public RPCs ─────────────────────────
-- Customers never write tables directly: these functions validate input and compute prices server-side.

create or replace function public.place_order(payload jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  s public.settings;
  z public.zones;
  o public.orders;
  line jsonb;
  m public.menu_items;
  qty integer;
  subtotal integer := 0;
  fee integer := 0;
  ful text := payload->>'fulfilment';
  phone text := regexp_replace(coalesce(payload->>'phone', ''), '\s', '', 'g');
begin
  select * into s from public.settings where id = 1;
  if not s.accepting_orders then raise exception 'We are not accepting orders right now'; end if;
  if length(trim(coalesce(payload->>'customer_name', ''))) < 2 then raise exception 'Name is required'; end if;
  if phone !~ '^0[789][01][0-9]{8}$' then raise exception 'Invalid phone number'; end if;
  if ful not in ('delivery', 'pickup') then raise exception 'Invalid fulfilment'; end if;
  if jsonb_typeof(payload->'items') <> 'array' or jsonb_array_length(payload->'items') = 0 then raise exception 'Cart is empty'; end if;
  if jsonb_array_length(payload->'items') > 30 then raise exception 'Too many items'; end if;
  if (payload->>'scheduled_for')::date < current_date then raise exception 'Date is in the past'; end if;

  if ful = 'delivery' then
    select * into z from public.zones where id = (payload->>'zone_id')::uuid and active;
    if not found then raise exception 'Delivery zone unavailable'; end if;
    if length(trim(coalesce(payload->>'landmark', ''))) < 3 then raise exception 'Landmark is required'; end if;
    fee := z.fee_minor;
  end if;

  insert into public.orders (customer_name, phone, email, fulfilment, zone_id, landmark, scheduled_for, time_slot, notes, allergy_notes,
                             subtotal_minor, fee_minor, total_minor, payment_method)
  values (left(trim(payload->>'customer_name'), 120), phone, nullif(left(trim(coalesce(payload->>'email', '')), 200), ''), ful,
          case when ful = 'delivery' then z.id end,
          case when ful = 'delivery' then left(trim(payload->>'landmark'), 200) end,
          (payload->>'scheduled_for')::date, left(coalesce(payload->>'time_slot', 'As soon as possible'), 40),
          nullif(left(trim(coalesce(payload->>'notes', '')), 500), ''), nullif(left(trim(coalesce(payload->>'allergy_notes', '')), 300), ''),
          0, fee, 0, 'bank_transfer')
  returning * into o;

  for line in select * from jsonb_array_elements(payload->'items') loop
    qty := (line->>'quantity')::integer;
    if qty is null or qty < 1 or qty > 50 then raise exception 'Invalid quantity'; end if;
    select * into m from public.menu_items where id = (line->>'menu_item_id')::uuid;
    if not found or not m.available then raise exception '% is no longer available', coalesce(m.name, 'An item'); end if;
    insert into public.order_items (order_id, menu_item_id, name_snapshot, unit_price_minor, quantity) values (o.id, m.id, m.name, m.price_minor, qty);
    subtotal := subtotal + m.price_minor * qty;
  end loop;

  update public.orders set subtotal_minor = subtotal, total_minor = subtotal + fee where id = o.id;
  return jsonb_build_object('ref', o.ref, 'token', o.access_token);
end $$;

create or replace function public.get_order(token uuid) returns jsonb
language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'ref', o.ref, 'token', o.access_token, 'customer_name', o.customer_name, 'phone', o.phone,
    'fulfilment', o.fulfilment, 'zone_name', z.name, 'landmark', o.landmark, 'scheduled_for', o.scheduled_for, 'time_slot', o.time_slot,
    'subtotal_minor', o.subtotal_minor, 'fee_minor', o.fee_minor, 'total_minor', o.total_minor,
    'payment_method', o.payment_method, 'payment_status', o.payment_status, 'status', o.status,
    'created_at', o.created_at, 'updated_at', o.updated_at,
    'lines', (select coalesce(jsonb_agg(jsonb_build_object('name', i.name_snapshot, 'unit_price_minor', i.unit_price_minor, 'quantity', i.quantity)), '[]') from public.order_items i where i.order_id = o.id)
  )
  from public.orders o left join public.zones z on z.id = o.zone_id
  where o.access_token = token;
$$;

create or replace function public.find_order(order_ref text, phone_last4 text) returns uuid
language sql stable security definer set search_path = public as $$
  select access_token from public.orders
  where upper(ref) = upper(trim(order_ref)) and length(phone_last4) = 4 and right(phone, 4) = phone_last4
  limit 1;
$$;

create or replace function public.confirm_transfer_sent(token uuid) returns void
language sql security definer set search_path = public as $$
  update public.orders set status = 'verifying', payment_status = 'verifying'
  where access_token = token and status = 'pending_payment';
$$;

create or replace function public.submit_enquiry(payload jsonb) returns text
language plpgsql security definer set search_path = public as $$
declare r text; phone text := regexp_replace(coalesce(payload->>'phone', ''), '\s', '', 'g');
begin
  if length(trim(coalesce(payload->>'name', ''))) < 2 then raise exception 'Name is required'; end if;
  if phone !~ '^0[789][01][0-9]{8}$' then raise exception 'Invalid phone number'; end if;
  if (payload->>'event_date')::date < current_date then raise exception 'Date is in the past'; end if;
  if length(trim(coalesce(payload->>'venue', ''))) < 2 then raise exception 'Venue is required'; end if;
  insert into public.catering_enquiries (name, phone, event_type, event_date, guests, budget_minor, requested_items, venue)
  values (left(trim(payload->>'name'), 120), phone, left(payload->>'event_type', 60), (payload->>'event_date')::date, left(payload->>'guests', 20),
          nullif(payload->>'budget_minor', '')::integer, left(coalesce(payload->>'requested_items', ''), 1000), left(trim(payload->>'venue'), 200))
  returning ref into r;
  return r;
end $$;

revoke all on function public.place_order(jsonb), public.get_order(uuid), public.find_order(text, text),
  public.confirm_transfer_sent(uuid), public.submit_enquiry(jsonb) from public;
grant execute on function public.place_order(jsonb), public.get_order(uuid), public.find_order(text, text),
  public.confirm_transfer_sent(uuid), public.submit_enquiry(jsonb) to anon, authenticated;

revoke execute on function public.handle_new_user(), public.audit_changes(), public.audit_actor() from public, anon, authenticated;

-- Live order updates in the dashboard
alter publication supabase_realtime add table public.orders, public.catering_enquiries;

-- ───────────────────────── Starter data ─────────────────────────
insert into public.settings (id, pickup_point, support_phone) values (1, 'Artisans Hub kitchen, Main Campus', '');

insert into public.zones (name, fee_minor, eta_minutes, sort) values
  ('Main Campus (Gidan Kwano)', 30000, 25, 1),
  ('Female Hostels', 40000, 30, 2),
  ('Male Hostels', 40000, 30, 3),
  ('Off-campus — Gidan Kwano village', 60000, 40, 4);

insert into public.menu_items (name, category, description, price_minor, emoji, tone, tag, prep_minutes, allergens, featured, sort) values
  ('Jollof Rice & Chicken', 'Rice & meals', 'Smoky party-style jollof with a well-seasoned chicken portion.', 250000, '🍗', 'orange', 'Campus favourite', 15, '{}', true, 1),
  ('Fried Rice & Chicken', 'Rice & meals', 'Colourful fried rice with mixed veg and a savoury chicken portion.', 280000, '🍛', 'yellow', 'Popular', 15, '{Egg}', true, 2),
  ('Rice & Beans Combo', 'Rice & meals', 'A filling everyday plate with stew, plantain and protein.', 220000, '🍚', 'green', 'Budget pick', 12, '{}', false, 3),
  ('Noodles & Egg', 'Quick bites', 'Quick, comforting stir-fried noodles topped with fried egg.', 150000, '🍜', 'yellow', 'Quick bite', 8, '{Egg,Gluten}', false, 4),
  ('Beans & Plantain', 'Rice & meals', 'Soft, peppery beans served with sweet fried plantain (dodo).', 180000, '🍌', 'green', 'Student pick', 10, '{}', false, 5),
  ('Small Chops Box', 'Small chops', 'Samosa, spring roll, puff-puff and mosa — perfect for sharing.', 250000, '🥟', 'orange', 'Shareable', 20, '{Gluten}', true, 6),
  ('Puff-Puff (6 pcs)', 'Small chops', 'Soft, golden bite-sized puff-puff, lightly dusted.', 80000, '🍩', 'yellow', 'Sweet treat', 10, '{Gluten}', false, 7),
  ('Samosa & Spring Roll (4 pcs)', 'Small chops', 'Crispy savoury bites; fillings subject to availability.', 150000, '🥠', 'brown', 'Party snack', 15, '{Gluten}', false, 8),
  ('Zobo (50cl)', 'Drinks', 'Chilled hibiscus drink with ginger and pineapple notes.', 50000, '🧃', 'red', 'Chilled', 0, '{}', false, 9),
  ('Bottled Water', 'Drinks', '75cl bottled table water.', 30000, '💧', 'green', null, 0, '{}', false, 10),
  ('Campus Combo', 'Combos', 'Rice of the day, protein and a chilled drink. Best value.', 250000, '🍱', 'orange', 'Combo deal', 15, '{}', true, 11),
  ('Group Meal Pack', 'Combos', 'Larger pack for 2–3 friends: rice, chicken, plantain, drinks.', 450000, '🥘', 'brown', 'Group order', 25, '{}', false, 12);

-- Seeding should not appear in the audit log
delete from public.audit_events;
