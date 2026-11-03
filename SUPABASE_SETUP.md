# Matrimony App — Supabase Setup Guide

## 1. Disable Email Confirmation (Required for login to work immediately)

Go to: **Supabase Dashboard → Authentication → Providers → Email**
- Toggle **OFF** "Confirm email"
- Click **Save**

---

## 2. Run Database Setup (Creates profiles, interests & messages tables)

Go to: **Supabase Dashboard → SQL Editor** → Paste and **Run** this all together:

```sql
-- ── 1. PROFILES TABLE ──
CREATE TABLE IF NOT EXISTS public.profiles (
  user_id       TEXT PRIMARY KEY,
  email         TEXT,
  name          TEXT,
  age           INT,
  gender        TEXT,
  height        TEXT,
  mother_tongue TEXT,
  caste         TEXT,
  religion      TEXT,
  nri           BOOLEAN DEFAULT false,
  city          TEXT,
  state         TEXT,
  college       TEXT,
  education     TEXT,
  occupation    TEXT,
  income        TEXT,
  photo         TEXT,
  father        TEXT,
  mother        TEXT,
  siblings      TEXT,
  pref_religion TEXT,
  pref_age_min  INT,
  pref_age_max  INT,
  about         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Open access so all devices can see and update profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can read profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can upsert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow all access to profiles" ON public.profiles;

CREATE POLICY "Allow all access to profiles"
  ON public.profiles
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 2. INTERESTS TABLE ──
CREATE TABLE IF NOT EXISTS public.interests (
  id                    TEXT PRIMARY KEY,
  from_user_id          TEXT NOT NULL,
  to_user_id            TEXT,
  to_profile_id         TEXT,
  from_user_name        TEXT,
  to_user_name          TEXT,
  from_user_photo       TEXT,
  to_user_photo         TEXT,
  from_user_city        TEXT,
  to_user_city          TEXT,
  from_user_occupation  TEXT,
  to_user_occupation    TEXT,
  status                TEXT NOT NULL DEFAULT 'pending',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own interests" ON public.interests;
DROP POLICY IF EXISTS "Users can send interests" ON public.interests;
DROP POLICY IF EXISTS "Users can update interest status" ON public.interests;
DROP POLICY IF EXISTS "Users can update interests" ON public.interests;
DROP POLICY IF EXISTS "Allow all access to interests" ON public.interests;

CREATE POLICY "Allow all access to interests"
  ON public.interests
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ── 3. MESSAGES TABLE ──
CREATE TABLE IF NOT EXISTS public.messages (
  id               TEXT PRIMARY KEY,
  conversation_id  TEXT NOT NULL,
  sender_id        TEXT NOT NULL,
  sender_name      TEXT,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
DROP POLICY IF EXISTS "Users can read messages" ON public.messages;
DROP POLICY IF EXISTS "Allow all access to messages" ON public.messages;

CREATE POLICY "Allow all access to messages"
  ON public.messages
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

---

## 3. Features Summary

| Feature     | Cross-Device Behavior |
|-------------|-----------------------|
| Register    | Saves to Supabase `profiles` + `auth.users` |
| Browse      | Automatically pulls all registered profiles from Supabase |
| Interests   | Stored in Supabase `interests` table & synced on login/browse |
| Messages    | Stored in Supabase `messages` table & synced on login/chat |
