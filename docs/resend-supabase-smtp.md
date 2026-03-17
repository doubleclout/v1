# Resend + Supabase SMTP Setup

Supabase's default email service is limited to **2 emails per hour** and is for testing only. Use Resend for production.

## 1. Resend setup

1. Sign up at [resend.com](https://resend.com)
2. [Verify your domain](https://resend.com/domains) (e.g. `doubleclout.com`)
3. [Create an API key](https://resend.com/api-keys)

## 2. Configure Supabase to use Resend

1. Go to **Supabase Dashboard** → **Project** → **Authentication** → **Email Templates** (or **Providers** → **Auth**)
2. Find **SMTP Settings** / **Custom SMTP**
3. Enable custom SMTP and enter:

| Field | Value |
|-------|-------|
| **Sender email** | `sankalp@doubleclout.com` (must be from a verified domain) |
| **Sender name** | `Sankalp from DoubleClout` |
| **Host** | `smtp.resend.com` |
| **Port** | `465` |
| **Username** | `resend` |
| **Password** | Your Resend API key |

4. Save

## 3. Result

- No more 2 emails/hour limit
- Emails sent from your domain
- Better deliverability
- You can still customize templates in Supabase → Auth → Email Templates

## 4. Troubleshooting: Not receiving confirmation emails

### Check Supabase Auth settings

1. **Supabase Dashboard** → **Authentication** → **Providers** → **Email**
   - Ensure **Confirm email** is **enabled** (otherwise no confirmation email is sent)

2. **Supabase Dashboard** → **Authentication** → **Email Templates**
   - Confirm the **Confirm signup** template exists and has `{{ .ConfirmationURL }}` in the body

### If using default Supabase email (no custom SMTP)

- Supabase limits to **2 emails per hour** per project
- If you've hit the limit, wait an hour or set up Resend (above)

### If using Resend SMTP

1. **Resend dashboard** → **Domains** – ensure `doubleclout.com` (or your sender domain) is **verified**
2. **Resend dashboard** → **Logs** – check if emails were attempted and any delivery errors
3. **Supabase Dashboard** → **Project Settings** → **Auth** – confirm SMTP settings are saved and "Enable Custom SMTP" is on
4. **Sender email** must match a verified domain (e.g. `sankalp@doubleclout.com`)

### Other checks

- **Spam/junk folder** – confirmation emails often land there
- **Supabase Dashboard** → **Authentication** → **Users** – if the user shows as "Unconfirmed", the email was sent but may not have been delivered
