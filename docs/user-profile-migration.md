# User Profile Migration

Run this migration to add profile fields (first name, last name, avatar URL, phone) to the `user` table:

```sql
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "first_name" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "last_name" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "avatar_url" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "phone" text;
```

**Option 1 – Supabase SQL Editor**

1. Supabase Dashboard → SQL Editor
2. Paste and run the SQL above

**Option 2 – Drizzle push (dev)**

```bash
cd packages/db && DATABASE_URL="your-connection-string" pnpm exec drizzle-kit push:pg
```
