-- ClubHanger — TASK-02: Pilot profiles + trust
-- Adds public pilot profiles (self-attested, admin-verifiable) and listing reviews.
--
-- NOT YET APPLIED to any database. Review, then run in the Supabase SQL editor
-- (or via `supabase db push`). Until applied, the app fails soft: profile/review
-- surfaces render empty states and never crash.

-- =====================================================
-- PROFILES (one per auth user)
-- =====================================================
create table if not exists profiles (
  user_id          uuid        primary key references auth.users(id) on delete cascade,
  display_name     text,
  home_airport     text,                       -- ICAO, e.g. KAUS
  total_hours      integer,
  ratings_held     text[],                     -- self-attested, e.g. ['PPL','IFR']
  mission          text,                       -- short "how I fly" line
  bio              text,
  avatar_url       text,

  -- Trust — admin-controlled only (never self-granted). See trigger below.
  verified         boolean     not null default false,
  verified_ratings text[]      not null default '{}',  -- subset of ratings ClubHanger confirmed

  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();

-- Enforce "verification is admin-only": a normal (authenticated) user can edit
-- their self-attested fields but cannot change verified/verified_ratings — those
-- are frozen unless the update runs under the service role (the /admin tooling).
create or replace function protect_profile_verification()
returns trigger language plpgsql as $$
begin
  if coalesce(auth.role(), current_user) <> 'service_role' then
    new.verified := old.verified;
    new.verified_ratings := old.verified_ratings;
  end if;
  return new;
end;
$$;

create trigger profiles_protect_verification
  before update on profiles
  for each row execute function protect_profile_verification();

alter table profiles enable row level security;

-- Public read (profiles are public identity pages).
create policy "profiles_public_read" on profiles
  for select using (true);

-- Owner can create and update their own profile (verification fields are frozen
-- by the trigger above for non-service-role callers).
create policy "profiles_owner_insert" on profiles
  for insert with check (auth.uid() = user_id);

create policy "profiles_owner_update" on profiles
  for update using (auth.uid() = user_id);

-- =====================================================
-- LISTING REVIEWS (social proof on partnerships + seekers)
-- =====================================================
create table if not exists listing_reviews (
  id             uuid        default gen_random_uuid() primary key,
  created_at     timestamptz default now(),
  target_type    text        not null check (target_type in ('partnership','seeker')),
  target_id      uuid        not null,
  author_user_id uuid        not null references auth.users(id) on delete cascade,
  rating         integer     check (rating between 1 and 5),  -- optional
  body           text        not null check (char_length(body) between 1 and 2000),
  status         text        not null default 'visible' check (status in ('visible','hidden')),
  unique (target_type, target_id, author_user_id)  -- one review per author per target
);

alter table listing_reviews enable row level security;

-- Public read of visible reviews.
create policy "listing_reviews_public_read" on listing_reviews
  for select using (status = 'visible');

-- Authenticated users can post as themselves.
create policy "listing_reviews_author_insert" on listing_reviews
  for insert with check (auth.uid() = author_user_id);

-- Authors can edit / delete their own review.
create policy "listing_reviews_author_update" on listing_reviews
  for update using (auth.uid() = author_user_id);

create policy "listing_reviews_author_delete" on listing_reviews
  for delete using (auth.uid() = author_user_id);

create index on listing_reviews (target_type, target_id, status);
create index on listing_reviews (author_user_id);
