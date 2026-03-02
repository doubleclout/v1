# Deploy to Vercel

## Fix the "invalid characters" error

Use **Project Name: `doubleclout`** (not `test1`). Vercel rejects names with certain patterns.

## Root Directory

Set to **`apps/web`** (not `./`).

## Environment Variables (paste these)

```
DATABASE_URL=postgresql://postgres.bafowilqrykdwycgpnbd:[password]@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres
NEXT_PUBLIC_SUPABASE_URL=https://bafowilqrykdwycgpnbd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iKkF_x8fjhlbIWF0JYC8QQ_lxEs3QY2
NEXT_PUBLIC_APP_URL=https://doubleclout.com
SUPABASE_SERVICE_ROLE_KEY=<from Supabase API Keys - New secret key>
```

Add SUPABASE_SERVICE_ROLE_KEY from Supabase → Settings → API Keys → + New secret key.

## Deploy

Click **Deploy**.
