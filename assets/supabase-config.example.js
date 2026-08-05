// Copy to assets/supabase-config.js and paste your project values.
// Supabase Dashboard → Project Settings → API
// Anon key is safe to use in the browser when RLS/RPC is configured.
window.ASR_SUPABASE = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_ANON_KEY",
  // Parent portal origin (shown after signup → Create password there).
  // Local portal: http://localhost:5180  |  Deployed S3 portal in prod.
  portalUrl: "http://localhost:5180",
};
