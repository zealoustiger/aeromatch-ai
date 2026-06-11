-- AeroMatch AI — Database Schema
-- Run this in the Supabase SQL editor to initialize your database.

-- ============================================================
-- AIRPORTS (seed from FAA data — used for ICAO search/radius)
-- ============================================================
create table if not exists airports (
  icao   text primary key,
  iata   text,
  name   text not null,
  city   text,
  state  text,
  lat    decimal(9,6) not null,
  lng    decimal(9,6) not null,
  elevation integer,
  type   text  -- 'large_airport' | 'medium_airport' | 'small_airport' | 'heliport'
);

-- ============================================================
-- PARTNERSHIPS
-- ============================================================
create table if not exists partnerships (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  -- Aircraft
  make          text        not null,
  model         text        not null,
  year          integer,
  registration  text,               -- N-number (optional at post time)

  -- Location
  home_airport  text        not null,   -- ICAO e.g. KAUS
  airport_name  text,
  city          text,
  state         text,
  lat           decimal(9,6),
  lng           decimal(9,6),

  -- Deal structure
  share_type    text        not null,   -- '1/2' | '1/3' | '1/4' | 'leaseback' | 'dry_lease' | 'other'
  shares_available integer  default 1,
  total_shares  integer,

  -- Costs (in whole USD)
  buy_in_price  integer,
  monthly_fixed integer,
  hourly_wet    integer,

  -- Requirements
  min_hours     integer,
  ratings_required text[],            -- e.g. ['PPL', 'IFR']

  -- Scheduling
  scheduling_system text,             -- 'Google Calendar' | 'FlyingClub' | 'OpenPilot' | 'Other'

  -- Listing content
  title         text        not null,
  description   text,
  images        text[],               -- Supabase Storage URLs

  -- Contact
  contact_name  text,
  contact_email text        not null,
  contact_method text       default 'email',  -- 'email' | 'phone' | 'both'
  contact_phone text,

  -- Status
  status        text        default 'pending',  -- 'active' | 'pending' | 'closed'

  -- Auth
  poster_id     uuid        references auth.users(id) on delete set null
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger partnerships_updated_at
  before update on partnerships
  for each row execute function update_updated_at();

-- ============================================================
-- AIRCRAFT FOR SALE (aggregated + user-posted)
-- ============================================================
create table if not exists aircraft_for_sale (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),

  -- Source
  source        text        not null,   -- 'barnstormers' | 'trade-a-plane' | 'controller' | 'user'
  source_url    text,
  source_id     text,                   -- external ID for dedup
  unique (source, source_id),

  -- Aircraft
  make          text,
  model         text,
  year          integer,
  registration  text,                   -- N-number

  -- Specs (LLM-parsed from description)
  ttaf          integer,                -- total time airframe (hours)
  smoh          integer,                -- since major overhaul (hours)
  annual_due    date,
  damage_history boolean,
  avionics      text[],                 -- e.g. ['Garmin G1000', 'ADS-B Out']
  engine_type   text,

  -- Listing
  title         text        not null,
  description   text,
  asking_price  integer,                -- parsed price in USD
  price_text    text,                   -- raw price string from source

  -- Location
  location      text,
  state         text,

  -- Status & auth
  status        text        default 'active',
  poster_id     uuid        references auth.users(id) on delete set null
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table partnerships     enable row level security;
alter table aircraft_for_sale enable row level security;
alter table airports          enable row level security;

-- Airports: public read
create policy "airports_public_read" on airports
  for select using (true);

-- Partnerships: public read active listings
create policy "partnerships_public_read" on partnerships
  for select using (status = 'active');

-- Partnerships: authenticated users can insert (must own the row)
create policy "partnerships_auth_insert" on partnerships
  for insert with check (auth.uid() = poster_id);

-- Partnerships: users can update/delete their own
create policy "partnerships_owner_update" on partnerships
  for update using (auth.uid() = poster_id);

create policy "partnerships_owner_delete" on partnerships
  for delete using (auth.uid() = poster_id);

-- Aircraft for sale: public read active
create policy "aircraft_public_read" on aircraft_for_sale
  for select using (status = 'active');

-- Aircraft for sale: service role can upsert (scraper)
create policy "aircraft_service_upsert" on aircraft_for_sale
  for all using (auth.role() = 'service_role');

-- Aircraft for sale: authenticated users can insert own listings
create policy "aircraft_auth_insert" on aircraft_for_sale
  for insert with check (auth.uid() = poster_id);

create policy "aircraft_owner_update" on aircraft_for_sale
  for update using (auth.uid() = poster_id);

-- ============================================================
-- INDEXES
-- ============================================================
create index on partnerships (home_airport);
create index on partnerships (status);
create index on partnerships (make, model);
create index on partnerships (state);

create index on aircraft_for_sale (make, model);
create index on aircraft_for_sale (status);
create index on aircraft_for_sale (state);
create index on aircraft_for_sale (asking_price);

create index on airports (state);
-- PostGIS-style radius search (if you enable the postgis extension):
-- create index on partnerships using gist (ll_to_earth(lat, lng));

-- ============================================================
-- FEEDBACK (user feedback, issues, requests, listing reports)
-- ============================================================
create table if not exists feedback (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  type        text        not null default 'feedback',  -- 'feedback' | 'issue' | 'request' | 'report'
  message     text        not null,
  email       text,
  listing_id  uuid,        -- set when type = 'report'
  page_path   text,
  status      text        default 'new'  -- 'new' | 'reviewed' | 'resolved'
);

alter table feedback enable row level security;

-- Anyone (including anonymous visitors) can submit feedback
create policy "feedback_public_insert" on feedback
  for insert with check (true);

-- No public read — view submissions via Supabase dashboard / service role

create index on feedback (status);
create index on feedback (type);

-- ============================================================
-- WAITLIST (email capture from hero search)
-- ============================================================
create table if not exists waitlist (
  email         text primary key,
  search_params text,
  source        text,
  created_at    timestamptz default now()
);

alter table waitlist enable row level security;

create policy "waitlist_anyone_insert" on waitlist
  for insert with check (true);

create policy "waitlist_service_read" on waitlist
  for select using (auth.role() = 'service_role');

-- ============================================================
-- SAVED SEARCHES
-- ============================================================
create table if not exists saved_searches (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  user_id       uuid        references auth.users(id) on delete cascade not null,
  name          text        not null,
  search_params text        not null,
  unique(user_id, name)
);

alter table saved_searches enable row level security;

create policy "saved_searches_owner_all" on saved_searches
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on saved_searches (user_id);

-- ============================================================
-- THREADS (one per listing + inquirer pair)
-- ============================================================
create table if not exists threads (
  id             uuid        default gen_random_uuid() primary key,
  created_at     timestamptz default now(),
  partnership_id uuid        references partnerships(id) on delete cascade not null,
  inquirer_id    uuid        references auth.users(id) on delete cascade not null,
  owner_id       uuid        references auth.users(id) on delete cascade not null,
  unique(partnership_id, inquirer_id)
);

alter table threads enable row level security;

create policy "threads_participant_select" on threads
  for select using (auth.uid() = inquirer_id or auth.uid() = owner_id);

create policy "threads_inquirer_insert" on threads
  for insert with check (auth.uid() = inquirer_id);

-- ============================================================
-- MESSAGES
-- ============================================================
create table if not exists messages (
  id         uuid        default gen_random_uuid() primary key,
  created_at timestamptz default now(),
  thread_id  uuid        references threads(id) on delete cascade not null,
  sender_id  uuid        references auth.users(id) on delete cascade not null,
  body       text        not null check (char_length(body) <= 2000)
);

alter table messages enable row level security;

create policy "messages_participant_select" on messages
  for select using (
    exists (
      select 1 from threads t where t.id = thread_id
      and (t.inquirer_id = auth.uid() or t.owner_id = auth.uid())
    )
  );

create policy "messages_participant_insert" on messages
  for insert with check (
    auth.uid() = sender_id
    and exists (
      select 1 from threads t where t.id = thread_id
      and (t.inquirer_id = auth.uid() or t.owner_id = auth.uid())
    )
  );

create index on threads (inquirer_id);
create index on threads (owner_id);
create index on threads (partnership_id);
create index on messages (thread_id, created_at);
