// Copy to assets/supabase-config.js and paste your project values.
// Supabase Dashboard → Project Settings → API
// Anon key is safe to use in the browser when RLS/RPC is configured.
window.ASR_SUPABASE = {
  url: "https://YOUR_PROJECT_REF.supabase.co",
  anonKey: "YOUR_ANON_KEY",
  // Parent portal origin. On signup we auto-create the parent's account and
  // email a login link that opens this URL. Use the deployed portal in prod.
  portalUrl: "http://localhost:5173",
};
