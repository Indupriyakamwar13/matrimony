// src/lib/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://jzopfgumtcyiebwfpipa.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_ZQvuAXBfeqfq1JIOd3jb3g_vjkj7ltB";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
