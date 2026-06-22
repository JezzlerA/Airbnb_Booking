// src/db/supabaseClient.js
// Initializes and exports the Supabase JS client.
// Falls back gracefully to null if environment variables are not configured.

import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate that credentials look real (not the placeholder strings)
const isConfigured =
  supabaseUrl &&
  supabaseKey &&
  !supabaseUrl.includes('your-project-id') &&
  !supabaseKey.includes('your-anon-public-key');

export const supabase = isConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : null;

export const SUPABASE_ENABLED = isConfigured;

if (!isConfigured) {
  console.warn(
    '[HavenShare] Supabase is NOT configured. The app is running in ' +
    'offline mode using localStorage. To connect Supabase, fill in your ' +
    'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in the .env file.'
  );
} else {
  console.info('[HavenShare] ✅ Supabase backend connected successfully.');
}
