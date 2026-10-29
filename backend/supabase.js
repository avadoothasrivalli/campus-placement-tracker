require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase = null;
if (url && key && !url.includes('YOUR_PROJECT_ID') && !key.includes('YOUR_SUPABASE')) {
  supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

function requireSupabase(req, res, next) {
  if (!supabase) {
    return res.status(503).json({
      error: 'Supabase is not configured. Copy backend/.env.example to backend/.env, add your Supabase URL and service-role key, then restart the server.'
    });
  }
  next();
}
module.exports = { supabase, requireSupabase };
