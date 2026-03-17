# Customize Supabase Confirmation Email

Use the **Supabase template** (not Resend). Resend only delivers the email; the content is controlled in Supabase.

1. Go to **Supabase Dashboard** → **Auth** → **Email Templates**
2. Select **Confirm signup**
3. Replace the subject and body with the template below

## Subject
```
Welcome to DoubleClout! Please confirm your signup
```

## Sender (in SMTP Settings)
- **Sender name**: `Sankalp from DoubleClout`
- **Sender email**: `sankalp@doubleclout.com` (or your verified domain)

## Body (HTML)
```html
<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #1a1a1a;">Hey there,</p>
<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #1a1a1a;">I'm <strong>Sankalp</strong>, founder of <strong>DoubleClout</strong>. I wanted to quickly check in and say thanks for signing up!</p>
<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #1a1a1a;">Follow this link to confirm your account:</p>
<p style="margin: 0 0 24px;"><a href="{{ .ConfirmationURL }}" style="color: #2563eb; text-decoration: underline; font-size: 16px;">Confirm your mail</a></p>
<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #1a1a1a;">Also, we've just started out, so your thoughts will be super valuable to us 🙏 Feel free to ask any questions, share feedback and give us a follow on X!</p>
<p style="margin: 0 0 16px; font-size: 16px; line-height: 1.5; color: #1a1a1a;">Enjoy your day!</p>
<p style="margin: 0; font-size: 16px; color: #1a1a1a;">Sankalp</p>
```

## Auth URL Configuration

In **Supabase Dashboard** → **Auth** → **URL Configuration**:

1. **Site URL**: `http://localhost:3000` (local) or `https://doubleclout.com` (prod)
2. **Redirect URLs** – add these exactly:
   - `http://localhost:3000/api/auth/callback`
   - `https://doubleclout.com/api/auth/callback`
   - `http://localhost:3000/reset-password`
   - `https://doubleclout.com/reset-password`

If these are wrong or missing, you’ll get `error=auth` after Google sign-in or email confirmation.
