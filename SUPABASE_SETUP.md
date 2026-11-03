# Matrimony App — Supabase Setup Guide

## 1. Disable Email Confirmation (Required for login to work immediately)

Go to: **Supabase Dashboard → Authentication → Providers → Email**
- Toggle **OFF** "Confirm email"
- Click **Save**

---

## 2. Create the `interests` table (Required for Send Interest to work)

Go to: **Supabase Dashboard → SQL Editor** → run this:

```sql
-- Create interests table
CREATE TABLE IF NOT EXISTS public.interests (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_profile_id   INT  NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;

-- Users can only see their own interests (sent or received)
CREATE POLICY "Users can read own interests"
  ON public.interests FOR SELECT
  USING (from_user_id = auth.uid());

-- Users can insert their own interests
CREATE POLICY "Users can send interests"
  ON public.interests FOR INSERT
  WITH CHECK (from_user_id = auth.uid());
```

---

## 3. Create the `messages` table (Optional, for real-time chat)

```sql
CREATE TABLE IF NOT EXISTS public.messages (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id  TEXT NOT NULL,
  sender_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content          TEXT NOT NULL,
  created_at       TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can read messages"
  ON public.messages FOR SELECT
  USING (sender_id = auth.uid());
```

---

## 4. Pages & Features Summary

| Page        | What's Real (Supabase)           | What's Demo         |
|-------------|----------------------------------|---------------------|
| Login       | ✅ Real Supabase Auth            | —                   |
| Register    | ✅ Real Supabase Auth + metadata | —                   |
| Dashboard   | ✅ Real interests count + user   | —                   |
| Browse      | ✅ Send Interest → DB            | Sample profile cards |
| Profile     | ✅ Send Interest → DB            | Profile data         |
| Messages    | ✅ Saves to DB (real convos)     | Demo chat shown      |
