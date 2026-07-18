-- AeroMatch AI — Database Schema
-- Run this in the Supabase SQL editor to initialize your database.

-- =====================================================
-- AIRPORTS (seed from FAA data — used for ICAO search/radius)
-- =====================================================
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

-- =====================================================
-- PARTNERSHIPS
-- =====================================================
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

-- =====================================================
-- AIRCRAFT FOR SALE (aggregated + user-posted)
-- =====================================================
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
  status        text        default 'active',  -- 'active' | 'sold' | 'pending' | 'closed'
  poster_id     uuid        references auth.users(id) on delete set null,

  -- Freshness + price history (Phase 2 ingestion: scraper/lib/ingest-core.mjs)
  first_seen_at    timestamptz default now(),
  last_seen_at     timestamptz default now(),  -- updated every ingest run; stale ⇒ marked sold
  content_hash     text,                       -- sha1 of listing fields; detects any change
  previous_price   integer,                    -- prior asking_price when a change was detected
  price_changed_at timestamptz,
  removed_at       timestamptz,                -- set when a listing vanishes from its source

  -- Quality score 0-100 (auto-maintained). Grade cutoffs (A>=78,B>=50,C<50) live
  -- in src/lib/listingQuality.ts; keep scoreRow() in sync with this expression.
  quality_score smallint generated always as (
      (case when asking_price is not null then 30 else 0 end)
    + (case when year is not null then 12 else 0 end)
    + (case when nullif(btrim(make), '') is not null and lower(btrim(make)) <> 'unknown' then 12 else 0 end)
    + (case when nullif(btrim(model), '') is not null and lower(btrim(model)) <> 'unknown' then 12 else 0 end)
    + (case when state is not null then 12 else 0 end)
    + (case when nullif(btrim(registration), '') is not null then 10 else 0 end)
    + (case when ttaf is not null then 7 else 0 end)
    + (case when description is not null and length(description) >= 80 then 5 else 0 end)
  ) stored
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
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

-- =====================================================
-- PARTNERSHIP SEEKERS (pilots looking for a partnership)
-- =====================================================
create table if not exists partnership_seekers (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),

  -- Aircraft preferences
  preferred_makes      text[],           -- e.g. ['Cessna', 'Cirrus']
  preferred_models     text,             -- free text, e.g. '172, 182, SR22'
  min_year             integer,
  max_year             integer,
  aircraft_category    text,             -- 'sel' | 'mel' | 'turboprop' | 'jet' | 'any'

  -- Budget (whole USD)
  max_buy_in           integer,
  max_monthly          integer,
  max_hourly           integer,

  -- Location
  home_airport         text        not null,   -- ICAO code, e.g. KAUS
  airport_name         text,
  city                 text,
  state                text,
  willing_to_travel_nm integer,                -- nautical miles willing to commute

  -- Pilot profile
  total_hours          integer,
  ratings_held         text[],           -- e.g. ['PPL', 'IFR', 'CPL']

  -- Partnership preferences
  preferred_share_types text[],          -- e.g. ['1/2', '1/3']
  preferred_scheduling  text,

  -- Flying profile
  intended_use         text[],           -- e.g. ['personal_travel', 'instrument_currency']
  hours_per_month      integer,

  -- Listing content
  title                text        not null,
  description          text,

  -- Contact
  contact_name         text,
  contact_email        text        not null,
  contact_method       text        default 'email',
  contact_phone        text,

  -- Status & auth
  status               text        default 'active',
  poster_id            uuid        references auth.users(id) on delete set null
);

create trigger partnership_seekers_updated_at
  before update on partnership_seekers
  for each row execute function update_updated_at();

-- Seekers: public read active listings
create policy "seekers_public_read" on partnership_seekers
  for select using (status = 'active');

-- Seekers: authenticated users can insert/manage their own
create policy "seekers_auth_insert" on partnership_seekers
  for insert with check (auth.uid() = poster_id);

create policy "seekers_owner_update" on partnership_seekers
  for update using (auth.uid() = poster_id);

create policy "seekers_owner_delete" on partnership_seekers
  for delete using (auth.uid() = poster_id);

alter table partnership_seekers enable row level security;

-- =====================================================
-- INDEXES
-- =====================================================
create index on partnerships (home_airport);
create index on partnerships (status);
create index on partnerships (make, model);
create index on partnerships (state);

create index on aircraft_for_sale (make, model);
create index on aircraft_for_sale (status);
create index on aircraft_for_sale (state);
create index on aircraft_for_sale (asking_price);
create index on aircraft_for_sale (source, last_seen_at);
create index on aircraft_for_sale (price_changed_at) where price_changed_at is not null;
create index on aircraft_for_sale (quality_score);

create index on airports (state);
-- PostGIS-style radius search (if you enable the postgis extension):
-- create index on partnerships using gist (ll_to_earth(lat, lng));

-- =====================================================
-- FEEDBACK (user feedback, issues, requests, listing reports)
-- =====================================================
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

-- =====================================================
-- WAITLIST (email capture from hero search)
-- =====================================================
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

-- =====================================================
-- SAVED SEARCHES
-- =====================================================
create table if not exists saved_searches (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  user_id       uuid        references auth.users(id) on delete cascade not null,
  name          text        not null,
  search_params text        not null,
  path          text        not null default '/partnerships',
  unique(user_id, name)
);

-- Marketplace the saved search belongs to (e.g. '/partnerships' or '/aircraft'), so it
-- replays against the correct page. Added 2026-06-19; idempotent for existing databases.
alter table saved_searches add column if not exists path text not null default '/partnerships';

alter table saved_searches enable row level security;

create policy "saved_searches_owner_all" on saved_searches
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on saved_searches (user_id);

-- =====================================================
-- SAVED LISTINGS (per-user favorited listings)
-- =====================================================
-- A user "hearts" a specific listing. listing_type distinguishes marketplaces
-- ('partnership' today; 'aircraft' later) so the same table serves both.
-- Added 2026-06-19; additive + owner-scoped, mirrors saved_searches.
create table if not exists saved_listings (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  user_id       uuid        references auth.users(id) on delete cascade not null,
  listing_id    uuid        not null,
  listing_type  text        not null default 'partnership',
  note          text,       -- optional free-text note the user attaches to a save
  unique(user_id, listing_id, listing_type)
);

-- Additive (2026-06-25): existing databases get the optional per-save note column.
alter table saved_listings add column if not exists note text;

alter table saved_listings enable row level security;

create policy "saved_listings_owner_all" on saved_listings
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists saved_listings_user_id_idx on saved_listings (user_id);

-- =====================================================
-- ALERTS (email capture for new-listing alerts)
-- =====================================================
-- Visitors opt into alerts for a make/model or state from the programmatic
-- for-sale pages — NO account required. status='pending' is the seam for a
-- future double-opt-in confirmation (slice 2). Added 2026-06-20; strictly
-- additive + PII-protected: anon can INSERT but there is NO public SELECT
-- (mirrors the `waitlist` table — read submissions via service role / dashboard).
create table if not exists alerts (
  id          uuid        default gen_random_uuid() primary key,
  email       text        not null,
  context     text,
  source_path text,
  status      text        not null default 'pending',
  created_at  timestamptz default now(),
  unique(email, source_path)
);

alter table alerts enable row level security;

create policy "alerts_anyone_insert" on alerts
  for insert with check (true);

create policy "alerts_service_read" on alerts
  for select using (auth.role() = 'service_role');

create index if not exists alerts_status_idx on alerts (status);

-- =====================================================
-- THREADS (one per listing + inquirer pair)
-- =====================================================
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

-- =====================================================
-- MESSAGES
-- =====================================================
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

create index on partnership_seekers (home_airport);
create index on partnership_seekers (status);
create index on partnership_seekers (state);

-- Admin daily-report feedback (written by the admin "Submit feedback" action,
-- read by Claude to generate backlog items). Service-role only.
create table if not exists report_feedback (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now(),
  body        text        not null,
  source      text        default 'daily_report',
  status      text        default 'new',   -- 'new' | 'processed'
  response    text                          -- Claude's reply / what was done
);
alter table report_feedback enable row level security;

-- =====================================================
-- APPLIED 2026-06-22 (human-greenlit; mirrors live DB)
-- =====================================================
-- Pilot profiles + listing reviews (migration: profiles_and_reviews)
create table if not exists profiles (
  user_id          uuid        primary key references auth.users(id) on delete cascade,
  display_name     text,
  home_airport     text,
  total_hours      integer,
  ratings_held     text[],
  mission          text,
  bio              text,
  avatar_url       text,
  verified         boolean     not null default false,       -- admin-only (trigger-protected)
  verified_ratings text[]      not null default '{}',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
-- triggers profiles_updated_at + profiles_protect_verification (verification is service-role only)
-- RLS: public read; owner insert/update (verified fields frozen for non-service-role)

create table if not exists listing_reviews (
  id             uuid        default gen_random_uuid() primary key,
  created_at     timestamptz default now(),
  target_type    text        not null check (target_type in ('partnership','seeker')),
  target_id      uuid        not null,
  author_user_id uuid        not null references auth.users(id) on delete cascade,
  rating         integer     check (rating between 1 and 5),
  body           text        not null check (char_length(body) between 1 and 2000),
  status         text        not null default 'visible' check (status in ('visible','hidden')),
  unique (target_type, target_id, author_user_id)
);

-- threads: can now target a seeker, not only a partnership (migration: threads_seeker_support)
alter table threads alter column partnership_id drop not null;
alter table threads add column if not exists seeker_id uuid references partnership_seekers(id) on delete cascade;
-- + constraint threads_one_target (exactly one of partnership_id / seeker_id)
-- + partial unique index threads_seeker_inquirer_uniq (seeker_id, inquirer_id)

-- alerts: double-opt-in + digest bookkeeping (migration: alerts_double_opt_in)
alter table alerts add column if not exists confirm_token     text default gen_random_uuid();
alter table alerts add column if not exists confirmed_at      timestamptz;
alter table alerts add column if not exists unsubscribe_token text default gen_random_uuid();
alter table alerts add column if not exists last_digest_at    timestamptz;

-- threads: unread-badge support (migration: threads_unread_badge)
-- Denormalized last-message fields let the nav query unread count without joining messages.
-- Read timestamps let each participant track which threads they've seen.
alter table threads add column if not exists last_message_at         timestamptz;
alter table threads add column if not exists last_message_sender_id  uuid references auth.users(id);
alter table threads add column if not exists inquirer_read_at        timestamptz;
alter table threads add column if not exists owner_read_at           timestamptz;

create policy "threads_participant_update" on threads
  for update using (auth.uid() = inquirer_id or auth.uid() = owner_id);

-- threads: can now target an aircraft_for_sale listing (migration: threads_aircraft_support)
-- ⚠️ Human: apply in Supabase SQL editor before this feature goes live.
alter table threads add column if not exists aircraft_for_sale_id uuid references aircraft_for_sale(id) on delete cascade;
-- + partial unique index threads_aircraft_inquirer_uniq (aircraft_for_sale_id, inquirer_id)
create unique index if not exists threads_aircraft_inquirer_uniq on threads (aircraft_for_sale_id, inquirer_id) where aircraft_for_sale_id is not null;

-- partnerships / partnership_seekers: new-match email digest bookkeeping
-- (migration: match_alert_last_sent_at). NULL means "never sent" — the cron
-- falls back to the listing's own created_at as the "since" cutoff.
-- ⚠️ Human: apply against live Supabase before the match-alert-digest cron goes
-- live — the route no-ops safely (sends nothing) until these columns exist.
alter table partnerships add column if not exists match_alert_last_sent_at timestamptz;
alter table partnership_seekers add column if not exists match_alert_last_sent_at timestamptz;

-- =====================================================
-- OUTREACH TARGETS (GTM)  (migration: create_outreach_targets)
-- Owners we're targeting for ClubHanger partnerships, seeded from FAA registry
-- pulls (KHWD East Bay + KOAK/KCCR Cirrus). Admin-only (service-role reads/writes;
-- RLS on with no public policy). ⚠️ Human: already applied to remote via MCP.
-- =====================================================
create table if not exists outreach_targets (
  id               uuid primary key default gen_random_uuid(),
  n_number         text unique not null,
  owner            text,
  make             text,
  model            text,
  year             int,
  airport          text,            -- target field: KHWD / KOAK / KCCR
  city             text,
  street           text,
  zip              text,
  mode_s_hex       text,
  registrant_type  text,            -- Individual / LLC / Corp ...
  based_confidence text default 'unconfirmed',  -- unconfirmed / address-residential / address-hangar / adsb-confirmed
  status           text not null default 'not_contacted',
                   -- not_contacted / contacted / replied / meeting / joined / dead
  channel          text,            -- mail / email / phone / in-person
  notes            text,
  contacted_at     timestamptz,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);
create index if not exists outreach_targets_status_idx on outreach_targets (status);
create index if not exists outreach_targets_airport_idx on outreach_targets (airport);
alter table outreach_targets enable row level security;
-- outreach_targets: ADS-B home-base confirmation (migration: outreach_add_confirmed_base)
alter table outreach_targets add column if not exists confirmed_base text;
alter table outreach_targets add column if not exists base_checked_at timestamptz;
alter table outreach_targets add column if not exists adsb_summary text;

-- ⚠️  HUMAN ACTION REQUIRED — migration: partnership_add_spec_fields
-- Adds TTAF/SMOH/engine_type to partnerships so the Engine Life, Airframe Time, and
-- Overhaul Timeline analysis panels on /partnerships/[id] can fire for user-posted listings.
-- Apply in the Supabase SQL editor BEFORE partnerships with these fields are submitted.
-- Until applied, submitting a form with TTAF/SMOH/Engine filled will fail server-side
-- (these are in the collapsed "More details" section so most users won't encounter this).
alter table partnerships add column if not exists ttaf integer;
alter table partnerships add column if not exists smoh integer;
alter table partnerships add column if not exists engine_type text;

-- ⚠️  HUMAN ACTION REQUIRED — migration: seeker_additional_airports
-- Adds additional_airports to partnership_seekers so pilots can specify up to 1 extra
-- airport they'd fly from. Column is optional (text[]); existing seekers unaffected.
-- Apply in the Supabase SQL editor. Until applied, the new "Also flying from" field on
-- /partnerships/seeking/new still submits successfully — additional airports are
-- silently dropped (graceful fallback in createSeekerListing), so no user-facing error.
alter table partnership_seekers add column if not exists additional_airports text[];
-- outreach_targets: resolved owner contact (migrations: outreach_add_owner_contact, outreach_add_owner_social)
alter table outreach_targets add column if not exists owner_name text;
alter table outreach_targets add column if not exists owner_email text;
alter table outreach_targets add column if not exists owner_phone text;
alter table outreach_targets add column if not exists owner_source text;
alter table outreach_targets add column if not exists owner_checked_at timestamptz;
alter table outreach_targets add column if not exists owner_social_url text;

-- ⚠️  HUMAN ACTION REQUIRED — migration: aircraft_add_contact_phone
-- Adds contact_phone to aircraft_for_sale so the optional "Phone" field on
-- /aircraft/new (already collected by partnerships/seeker listings) actually
-- saves, prefills on edit, and shows on the listing detail page (that display
-- logic + form input already shipped, but the column never existed, so the
-- field silently never saved). Apply in the Supabase SQL editor. Until applied,
-- createAircraftListing/updateAircraftListing detect the missing column and
-- retry without contact_phone, so posting/editing still succeeds — the phone
-- just won't save until this runs.
alter table aircraft_for_sale add column if not exists contact_phone text;

-- ⚠️  HUMAN ACTION REQUIRED — migration: partnership_add_price_history
-- Adds previous_buy_in_price/buy_in_price_changed_at to partnerships so an edited
-- buy-in can show the same "price reduced — a seller motivation signal" that
-- aircraft_for_sale listings already show (see previous_price/price_changed_at
-- above). Apply in the Supabase SQL editor. Until applied, updatePartnershipListing
-- detects the missing columns and retries without them, so editing still succeeds —
-- the price-history signal just won't record until this runs.
alter table partnerships add column if not exists previous_buy_in_price integer;
alter table partnerships add column if not exists buy_in_price_changed_at timestamptz;

-- ⚠️  HUMAN ACTION REQUIRED — migration: partnership_add_annual_damage
-- Adds annual_due/damage_history to partnerships so the Annual Inspection and
-- Damage History buyer-analysis panels (already live on aircraft_for_sale listing
-- pages, computed by the shared src/lib/annualStatus.ts + src/lib/damageHistory.ts)
-- can also fire on /partnerships/[id]. Both are optional fields on the "More
-- details" section of the post/edit form. Apply in the Supabase SQL editor. Until
-- applied, createPartnership/updatePartnershipListing detect the missing columns
-- and retry without them, so posting/editing still succeeds — these two fields
-- just won't save until this runs.
alter table partnerships add column if not exists annual_due date;
alter table partnerships add column if not exists damage_history boolean;

-- ─────────────────────────────────────────────────────────────────────────────
-- Test-account quarantine (applied 2026-07-05 via apply_migration)
-- The overnight drain does ad-hoc QA against production — it curls the signup +
-- post endpoints with @example.com accounts (e.g. nightshift-owner@example.com,
-- curlowner@example.com) and doesn't clean up. That leaked test listings onto the
-- public marketplace and inflated the daily signup metric. Two guards:
--
-- 1) Signup metric excludes @example.com so QA accounts don't count as real signups.
create or replace function public.count_signups(p_since timestamptz, p_until timestamptz)
returns integer language sql security definer set search_path to '' as $$
  select count(*)::int from auth.users
  where created_at >= p_since and created_at < p_until
    and email not like '%@example.com';
$$;

-- 2) Any listing posted by an @example.com account is auto-set to status='test' on
--    insert/update, so the public queries (which gate status='active') never show it.
--    Checks the POSTER's email — seed listings posted by the real account with
--    persona @example.com CONTACT emails are untouched. Scraped rows (poster_id
--    null) short-circuit. Applied to all three marketplace tables.
create or replace function public.quarantine_test_listing()
returns trigger language plpgsql security definer as $$
begin
  if new.poster_id is not null then
    if exists (select 1 from auth.users u where u.id = new.poster_id and u.email like '%@example.com') then
      new.status := 'test';
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_quarantine_test on partnerships;
create trigger trg_quarantine_test before insert or update of poster_id, status
  on partnerships for each row execute function quarantine_test_listing();
drop trigger if exists trg_quarantine_test on aircraft_for_sale;
create trigger trg_quarantine_test before insert or update of poster_id, status
  on aircraft_for_sale for each row execute function quarantine_test_listing();
drop trigger if exists trg_quarantine_test on partnership_seekers;
create trigger trg_quarantine_test before insert or update of poster_id, status
  on partnership_seekers for each row execute function quarantine_test_listing();

-- 3) Nightly sweep (safety net) — the 07:30 health check calls this to delete any
--    @example.com accounts + their rows older than 24h, so a cycle that forgets to
--    clean up doesn't pollute prod indefinitely. Age floor spares in-flight QA.
--    Scoped to @example.com posters; gmail-posted seed listings untouched.
create or replace function public.sweep_test_accounts(p_min_age_hours int default 24)
returns integer language plpgsql security definer set search_path to '' as $$
declare cutoff timestamptz := now() - make_interval(hours => p_min_age_hours); n int;
begin
  create temp table _sweep_ids on commit drop as
    select id, email from auth.users where email like '%@example.com' and created_at < cutoff;
  delete from public.threads       where inquirer_id in (select id from _sweep_ids) or owner_id in (select id from _sweep_ids);
  delete from public.partnerships        where poster_id in (select id from _sweep_ids);
  delete from public.aircraft_for_sale   where poster_id in (select id from _sweep_ids);
  delete from public.partnership_seekers where poster_id in (select id from _sweep_ids);
  delete from public.saved_listings      where user_id  in (select id from _sweep_ids);
  delete from public.airport_facility_ratings where user_id in (select id from _sweep_ids);
  delete from public.alerts              where email    in (select email from _sweep_ids);
  select count(*) into n from _sweep_ids;
  delete from auth.users where id in (select id from _sweep_ids);
  return n;
end $$;
revoke all on function public.sweep_test_accounts(int) from public, anon, authenticated;

-- alerts: owner read access (migration: alerts_owner_select). The `alerts` table has
-- no `user_id` (email-only, no-account-required capture) — a signed-in user can only
-- read their OWN rows, matched by their JWT's email, never anyone else's. Powers the
-- new read-only "/alerts/manage" page. ⚠️ ADDITIVE — apply against the live Supabase
-- DB; until applied, the page's query returns no rows (never an error).
create policy "alerts_owner_select" on alerts
  for select using (auth.jwt() ->> 'email' = email);

-- ⚠️  HUMAN ACTION REQUIRED — migration: profiles_favorite_airports
-- Adds favorite_airports to profiles so a pilot can list up to 3 favorite/frequently-
-- visited airports (base airport reuses the already-existing profiles.home_airport
-- column). Optional (text[]); existing profiles unaffected. Apply in the Supabase SQL
-- editor. Until applied, /account's profile form still saves successfully — favorite
-- airports are silently dropped (graceful fallback in updateProfile), so no user-facing
-- error; the base airport already saves today.
alter table profiles add column if not exists favorite_airports text[];

-- ⚠️  HUMAN ACTION REQUIRED — migration: airport_facility_ratings
-- Airport community-hub slice 2 ("ratings"): lets a signed-in pilot rate a curated
-- FBO/flying club shown on /airports/[icao] (1-5 stars, one rating per pilot per
-- facility, upsertable). facility_name/facility_type identify a facility from the
-- hardcoded AIRPORT_FACILITIES data in src/lib/seo.ts (not a DB row), so no FK there.
-- RLS mirrors saved_listings exactly: owner-scoped read/write only — aggregate reads
-- go through the service-role client (getFacilityRatingSummaries), same pattern as
-- getSaveCounts, so no public select policy is needed. Apply in the Supabase SQL
-- editor. Until applied, the rating widget shows no aggregate and submits fail soft
-- (no error surfaced) — the FBO/flying-club list itself is unaffected.
create table if not exists airport_facility_ratings (
  id            uuid        default gen_random_uuid() primary key,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  user_id       uuid        references auth.users(id) on delete cascade not null,
  airport_icao  text        not null,
  facility_name text        not null,
  facility_type text        not null,
  rating        smallint    not null check (rating between 1 and 5),
  unique(user_id, airport_icao, facility_name)
);

alter table airport_facility_ratings enable row level security;

create policy "airport_facility_ratings_owner_all" on airport_facility_ratings
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists airport_facility_ratings_lookup_idx
  on airport_facility_ratings (airport_icao, facility_name);

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_price_drop_opt_in
-- Lets a subscriber turn OFF price-drop matches on an alert while keeping the
-- new-listing alert (default true — everyone keeps getting price-drop matches,
-- the same behavior as today, unless they explicitly opt out). Only meaningful
-- for aircraft-for-sale alerts today — partnerships/seekers have no price-drop
-- tracking. Apply in the Supabase SQL editor. Until applied, the capture-form
-- checkbox and the /alerts/manage toggle both fail soft (insert/update retries
-- without the column, same graceful-fallback pattern as profiles.favorite_airports)
-- and the digest cron treats every alert as opted in — i.e. current behavior is
-- fully preserved either way.
alter table alerts add column if not exists price_drop_opt_in boolean not null default true;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_frequency
-- Lets a subscriber choose their digest cadence — 'weekly' (default, today's
-- fixed behavior, zero change for existing subscribers) or 'daily'. No 'instant'
-- option: the live send path is a single daily cron gated per-alert by
-- last_digest_at, with no event-driven/real-time trigger, so promising instant
-- delivery would be a fabricated capability (see src/lib/alertFrequency.ts).
-- Apply in the Supabase SQL editor. Until applied, the capture-form selector and
-- the /alerts/manage toggle both fail soft (insert/update retries without the
-- column, same graceful-fallback pattern as price_drop_opt_in) and the digest
-- cron treats every alert as weekly — i.e. current behavior is fully preserved
-- either way.
alter table alerts add column if not exists frequency text not null default 'weekly'
  check (frequency in ('daily', 'weekly'));

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_last_confirm_sent_at
-- Lets a subscriber whose double-opt-in confirmation email got lost request it
-- again from `/alerts/manage` (Pending rows) or right after submitting
-- `AlertSignup`, rate-limited to 1 resend per row per ~10 minutes. Nullable, no
-- default needed. Apply in the Supabase SQL editor. Until applied, the resend
-- action still sends the email (it just can't enforce the cooldown — the
-- update after sending fails soft and is skipped, same graceful-fallback
-- pattern as price_drop_opt_in/frequency above).
alter table alerts add column if not exists last_confirm_sent_at timestamptz;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_paused_until
-- Lets "Pause" have a real end date — "Snooze 30 days" on /alerts/manage and
-- the unsubscribe-recovery box sets this alongside status='paused'; the
-- digest cron auto-resumes the alert (status back to 'confirmed', this column
-- cleared) once the date has passed, rather than requiring the subscriber to
-- come back and resume manually. Nullable, no default — an indefinite Pause
-- (the existing behavior) simply never sets it. Apply in the Supabase SQL
-- editor. Until applied, "Snooze 30 days" falls back to a plain indefinite
-- Pause (graceful-fallback insert/update retry, same pattern as
-- price_drop_opt_in/frequency above) — no user-facing error either way.
alter table alerts add column if not exists paused_until timestamptz;

-- alerts: stranded-pending confirm reminder guard (migration: alerts_confirm_reminder)
-- Marks when the ONE "still want these alerts?" reminder was sent to a
-- status='pending' row that never clicked the original double-opt-in confirm
-- link. Nullable, no default. Apply in the Supabase SQL editor. Until
-- applied, the reminder cron block skips sending entirely (never risks a
-- duplicate reminder without a way to mark a row already-reminded) — no
-- user-facing error either way.
alter table alerts add column if not exists confirm_reminder_sent_at timestamptz;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_email_change
-- Lets a subscriber move every alert they own to a new email address, via a
-- double-opt-in confirmation sent to the NEW address (the "Update email" flow
-- on /alerts/manage) — previously the only option was delete-and-resubscribe.
-- `pending_email` holds the requested new address until confirmed;
-- `email_change_token` is the one-time confirm token, shared across every row
-- for the same owner so one click moves all of them at once. Both nullable,
-- no default. Apply in the Supabase SQL editor. Until applied,
-- requestAlertEmailChange fails soft with a clear "not available yet" message
-- (never a silent no-op, never a 500) — no other alert behavior changes.
alter table alerts add column if not exists pending_email text;
alter table alerts add column if not exists email_change_token text;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_source
-- Persists the per-placement capture-point tag (e.g. `card_watch`,
-- `filter_toolbar`, `compare_page`, `digest_cross_sell`, …) that today only
-- reaches PostHog's `alert_subscribed` event, never the DB — so per-widget
-- conversion can't be computed from the `alerts` table itself (see
-- `admin-alerts-scoreboard`'s "Follow-up for true per-placement precision").
-- Nullable, no default — rows created before this migration simply have
-- `source is null`. Apply in the Supabase SQL editor. Until applied, every
-- insert path fails soft and retries without `source` (same graceful-fallback
-- pattern as price_drop_opt_in/frequency above) — no user-facing error either way.
alter table alerts add column if not exists source text;

-- alerts: one-time "widen your alert?" email guard (migration: alerts_widen_suggested)
-- Marks when the ONE "hasn't matched anything yet, widen it?" email was sent to a
-- confirmed alert that's never matched a single listing (last_digest_at is null).
-- Nullable, no default. Apply in the Supabase SQL editor. Until applied, the
-- widen-suggestion cron block skips sending entirely (never risks a duplicate
-- suggestion without a way to mark a row already-suggested) — no user-facing
-- error either way.
alter table alerts add column if not exists widen_suggested_at timestamptz;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alert_cron_runs
-- A visible "Last run" health log for the `alert-digest` cron — today a silently broken
-- send (bad deploy, Resend outage, one of the migrations above still unapplied) is
-- invisible until a subscriber complains. One summary row per cron pass; read-only,
-- admin-viewed on /admin/alerts. Additive/new table, no FK into `alerts` (a run covers
-- many alerts, not one). Apply in the Supabase SQL editor. Until applied, the cron's
-- insert fails soft (relation-not-exists, same graceful-fallback precedent as every
-- `alerts.*` column above) and the digest send itself is completely unaffected — only
-- the admin health panel has no data to show.
create table if not exists alert_cron_runs (
  id                       uuid        default gen_random_uuid() primary key,
  created_at               timestamptz default now(),
  processed                int         not null default 0,
  sent                     int         not null default 0,
  emails_sent              int         not null default 0,
  skipped                  int         not null default 0,
  unparseable              int         not null default 0,
  not_due                  int         not null default 0,
  reminders_sent           int         not null default 0,
  widen_suggestions_sent   int         not null default 0,
  duration_ms              int         not null default 0
);

create index if not exists alert_cron_runs_created_at_idx on alert_cron_runs (created_at desc);

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_target_price
-- Lets a "watch this listing's price" alert (aircraft `?watch=price` /
-- partnership `?watch=price`) carry an optional target price — the cron only
-- sends a drop notice once the price is AT or BELOW this figure, instead of on
-- every drop no matter how small. Nullable, no default — a blank target keeps
-- today's "alert on any genuine drop" behavior unchanged. Apply in the
-- Supabase SQL editor. Until applied, every insert path fails soft and
-- retries without `target_price` (same graceful-fallback pattern as
-- price_drop_opt_in/frequency above) and the cron treats every watch alert as
-- having no target (current behavior) — no user-facing error either way.
alter table alerts add column if not exists target_price numeric;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_unsubscribe_reason
-- Lets the unsubscribe-recovery page ("Changed your mind?") record WHY someone
-- left when it's an honest success, not churn — specifically "I found my
-- aircraft." Nullable, no default. Apply in the Supabase SQL editor. Until
-- applied, markAlertFoundAircraftByToken fails soft and no-ops (same
-- graceful-fallback pattern as target_price above) — the "Found my aircraft"
-- button still shows its congratulatory confirmation either way.
alter table alerts add column if not exists unsubscribe_reason text;

-- ⚠️  HUMAN ACTION REQUIRED — migration: email_engagement_events
-- Logs `email.opened`/`email.clicked` webhook events from Resend, tagged by
-- which email template sent them (the `type` tag `sendEmail`/`email.ts` now
-- attaches to every send) — feeds the "Email engagement" panel on
-- /admin/alerts (GOAL.md's "prove it converts," the email half). Additive/new
-- table, no FK (an event covers one send, not one `alerts` row — we don't
-- have a reliable way to join a Resend email id back to a specific alert
-- today). Apply in the Supabase SQL editor. Until applied, the webhook's
-- insert fails soft (relation-not-exists, same graceful-fallback precedent as
-- `alert_cron_runs`) — bounce/complaint handling (already live) is
-- unaffected either way. Also needs a human to tick the `email.opened` and
-- `email.clicked` boxes for this endpoint in the Resend dashboard — until
-- then Resend simply never sends these events, same honest-empty-panel
-- posture.
create table if not exists email_engagement_events (
  id               uuid        default gen_random_uuid() primary key,
  created_at       timestamptz default now(),
  event_type       text        not null,
  email_type       text,
  resend_email_id  text,
  link_url         text
);

create index if not exists email_engagement_events_created_at_idx on email_engagement_events (created_at desc);

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_new_listing_opt_out
-- Lets a subscriber mute new-listing sends and get ONLY price-drop matches on
-- an alert ("only email me when something gets cheaper") — the missing
-- complement to `price_drop_opt_in`, which can only ADD drops on top of
-- new-listing emails, never mute them. Default false — everyone keeps
-- getting new-listing sends, the same behavior as today, unless they
-- explicitly switch to "Drops only" via the /alerts/manage mode toggle.
-- Aircraft-only, same scope as price_drop_opt_in (partnerships/seekers have
-- no drops-only UI). Apply in the Supabase SQL editor. Until applied, the
-- /alerts/manage toggle fails soft (update retries without the column, same
-- graceful-fallback pattern as price_drop_opt_in/frequency above) and the
-- digest cron treats every alert as new_listing_opt_out=false — i.e. current
-- behavior is fully preserved either way.
alter table alerts add column if not exists new_listing_opt_out boolean not null default false;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_unsubscribed_at
-- Records WHEN an alert flipped to `status='unsubscribed'` — today only the
-- status itself is stored, so the Monday admin funnel email can only show a
-- current-total unsubscribe count, never an honest week-over-week delta (see
-- alertFunnelWeekly.ts / email.ts's buildAdminAlertFunnelEmail). Nullable, no
-- default, forward-only — rows unsubscribed before this migration simply have
-- no timestamp and won't appear in a WoW bucket, same honest-gap posture as
-- last_confirm_sent_at/paused_until above. Stamped by the one-click unsubscribe
-- route and the spam-complaint webhook handler; cleared back to null by every
-- path that revives an alert away from 'unsubscribed' (the 3 UnsubscribeRecover
-- actions + reviveIfUnsubscribed). Apply in the Supabase SQL editor. Until
-- applied, every write path fails soft and retries without the column (same
-- graceful-fallback pattern as every `alerts.*` column above) and the funnel
-- email keeps rendering unsubscribes as a current-total only, exactly as today.
alter table alerts add column if not exists unsubscribed_at timestamptz;

-- ⚠️  HUMAN ACTION REQUIRED — migration: alerts_paused_bounced_at
-- Slice 2 of the status-change-timestamps item (slice 1 was unsubscribed_at
-- above): records WHEN an alert flipped to `status='paused'` or
-- `status='bounced'` — today only the status itself is stored, so the Monday
-- admin funnel email can only show current-total Paused/Bounced counts, never
-- an honest week-over-week delta (see alertFunnelWeekly.ts /
-- email.ts's buildAdminAlertFunnelEmail). Both nullable, no default,
-- forward-only — rows paused/bounced before this migration simply have no
-- timestamp and won't appear in a WoW bucket, same honest-gap posture as
-- unsubscribed_at above. `paused_at` is stamped by pauseAlert/snoozeAlert/
-- pauseAllAlerts/pauseAlertByToken/snoozeAlertByToken (src/app/actions.ts) and
-- the alert-digest cron's listing-watch auto-pause; cleared by resumeAlert/
-- resumeAllAlerts and the cron's snooze auto-resume. `bounced_at` is stamped
-- by pauseAlertsForBouncedEmail (src/lib/alertBounce.ts); cleared by
-- resumeAlert (which already accepts a prior 'bounced' status) and
-- resumeAllAlerts (now also resumes bounced rows, not just paused ones). Apply
-- in the Supabase SQL editor. Until applied, every write path fails soft and
-- retries without the column (same graceful-fallback pattern as every
-- `alerts.*` column above) and the funnel email keeps rendering Paused/Bounced
-- as current-totals only, exactly as today.
alter table alerts add column if not exists paused_at timestamptz;
alter table alerts add column if not exists bounced_at timestamptz;
