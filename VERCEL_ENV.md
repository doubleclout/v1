# Vercel Environment Variables

Add these in Vercel → Project → Settings → Environment Variables.

## Required (copy these)

```
NEXT_PUBLIC_SUPABASE_URL=https://bafowilqrykdwycgpnbd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iKkF_x8fjhlbIWF0JYC8QQ_lxEs3QY2
```

Use the **new publishable key** above (Supabase deprecated legacy anon). Same env var name.

## Required (get from Supabase Dashboard)

1. **SUPABASE_SERVICE_ROLE_KEY**: Settings → API Keys → "+ New secret key" → create, copy
2. **DATABASE_URL**: Settings → Database → Connection string (URI) → copy

## Required (set after first deploy)

```
NEXT_PUBLIC_APP_URL=https://YOUR_VERCEL_URL.vercel.app
```

Or `https://doubleclout.com` after domain is connected.

## Optional (add when using)

- GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET
- Slack, Zoom, Google, LinkedIn, Redis, AI keys, Dodo
