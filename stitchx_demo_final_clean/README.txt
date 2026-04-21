StitchX Clean Full Bundle

This is the clean full deployable app.

Before deploy:
1. Open stitchx.js
2. Replace:
   const SUPABASE_URL = 'https://YOUR_PROJECT.supabase.co';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
3. Use your real Supabase Project URL and Publishable key
4. Run supabase_schema.sql in Supabase SQL Editor
5. In Supabase Authentication:
   - enable Email provider
   - Site URL = your Netlify/Vercel app URL with https://
   - Redirect URL = same app URL
6. Deploy the folder to Netlify or Vercel

After first signup:
- promote your account to admin with the SQL note at bottom of supabase_schema.sql

Helpful browser console test:
window.__stitchxHealth()
