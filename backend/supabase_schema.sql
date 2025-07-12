-- Drop existing tables if they exist to ensure a clean slate
-- This is useful if you've run previous versions of the schema
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP TABLE IF EXISTS public.accounts CASCADE;

-- 1. Create the 'accounts' table (for the account owner/parent)
-- This table stores details about the main user account, linked to auth.users
create table public.accounts (
  id uuid not null primary key references auth.users(id) on delete cascade,
  full_name text,
  avatar_url text,
  subscription_status text default 'free',
  created_at timestamptz default now()
);

-- Set up Row Level Security (RLS) for 'accounts'
-- RLS ensures that users can only access and modify their own account data
alter table public.accounts enable row level security;

-- Policy to allow all authenticated users to view any account (e.g., for public profiles)
-- You might restrict this later if accounts should be private
create policy "Accounts are viewable by everyone."
  on accounts for select using (true);

-- Policy to allow a user to create their own account entry
create policy "Users can insert their own account."
  on accounts for insert with check (auth.uid() = id);

-- Policy to allow a user to update their own account entry
create policy "Users can update their own account."
  on accounts for update using (auth.uid() = id);


-- 2. Create the 'profiles' table (for the selectable listening profiles, e.g., child profiles)
-- This table stores details about individual listening profiles associated with an account
create table public.profiles (
  id uuid not null primary key default gen_random_uuid(), -- Unique ID for each profile
  account_id uuid not null references public.accounts(id) on delete cascade, -- Foreign key linking to the owning account
  name text, -- Name of the profile (e.g., "Rohan", "Anika", "Dad's Profile")
  age_group text, -- e.g., '3-7', '8-12', or 'adult'
  avatar_url text,
  created_at timestamptz default now()
);

-- Set up Row Level Security (RLS) for 'profiles'
-- RLS ensures that an account owner can only manage their own profiles
alter table public.profiles enable row level security;

-- Policy to allow an account owner to view their own profiles
create policy "Account owner can view their profiles."
  on profiles for select using (auth.uid() = account_id);

-- Policy to allow an account owner to insert new profiles under their account
create policy "Account owner can insert profiles."
  on profiles for insert with check (auth.uid() = account_id);

-- Policy to allow an account owner to update their own profiles
create policy "Account owner can update their profiles."
  on profiles for update using (auth.uid() = account_id);

-- Policy to allow an account owner to delete their own profiles
create policy "Account owner can delete their profiles."
  on profiles for delete using (auth.uid() = account_id);
