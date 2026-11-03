// src/pages/api/auth/signup.js
import { supabase } from "../../../lib/supabaseClient";

/**
 * API endpoint for user signup.
 * Expects a POST request with JSON body containing:
 *   fullName, email, password, gender, dob, motherTongue, religion, caste
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const {
    fullName,
    email,
    password,
    gender = "",
    dob = new Date().toISOString(),
    motherTongue = "",
    religion = "",
    caste = "",
  } = req.body;

  // Use Supabase Auth signUp. The client key works for development;
  // In production you would use the service role key on a secure server.
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        gender,
        dob,
        mother_tongue: motherTongue,
        religion,
        caste,
      },
    },
  });

  if (error) {
    console.error("Signup error:", error);
    return res.status(400).json({ error: error.message });
  }

  return res.status(200).json({ user: data.user });
}
