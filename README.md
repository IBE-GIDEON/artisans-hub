# Artisans Hub

Food ordering and catering for FUT Minna students: a customer storefront and a staff dashboard. Built with Next.js 15, Tailwind CSS 4 and Supabase (Postgres + Auth). Mobile-first, with dark and light themes.

## Run locally

```bash
npm install
cp .env.example .env.local   # then fill in the two Supabase values
npm run dev
```

- Storefront: http://localhost:3000
- Staff dashboard: http://localhost:3000/admin

## Launch checklist

1. **Owner account.** In the Supabase SQL editor run:
   ```sql
   insert into public.staff_invites (email, name, role) values ('you@example.com', 'Your Name', 'owner');
   ```
   Then go to `/admin/login` → "Invited? Create account" with that email, confirm the email, and sign in. Invite the rest of the team from **Settings → Team**.
2. **Settings** (dashboard): bank name, account number and account name; support phone; pickup point; opening hours; delivery zones and fees.
3. **Menu** (dashboard): confirm every price, description and allergen. The starter menu uses the prices from the handoff brief.
4. **Supabase → Authentication → URL configuration:** set the Site URL to your live domain and add `https://YOUR-DOMAIN/auth/callback` to Redirect URLs.
5. **Supabase → Authentication → Emails:** set up custom SMTP for reliable delivery (the built-in sender is rate-limited), and turn on leaked-password protection.
6. **Deploy** (e.g. Vercel) with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` set.
7. Review the FAQ copy in `src/app/(shop)/about/page.tsx` (cut-off times, refund and re-delivery rules) against your real policies.

## How it works

- **Customers never write to tables directly.** Orders, enquiries and lookups go through Postgres functions (`place_order`, `submit_enquiry`, `get_order`, `find_order`, `confirm_transfer_sent`) that validate input and **calculate prices and fees on the server** from the database.
- **Order pages** use an unguessable link (`/order/<token>`). Customers can also look an order up with its number and full phone number.
- **Payments:** bank transfer only. The customer taps "I've sent the transfer"; staff check the bank account and click "Mark paid & confirm".
- **Row-level security:** the menu, zones and settings are public read-only. Orders, enquiries, customers and the audit log are staff-only. Only the owner can change settings, zones and the team.
- **Audit log:** database triggers record every status, price, availability, quote and settings change, with who made it.
- **Live dashboard:** new orders and enquiries appear instantly via Supabase Realtime.
- **Money** is stored as integer kobo. Each order line keeps the item name and price as they were when it was ordered.

## Database

Migrations are in `supabase/migrations/`. Roles: `owner`, `orders`, `kitchen`, `finance`, `catering`.

## Not included yet

- Online card payments (Paystack/Flutterwave)
- SMS/WhatsApp notifications
- Menu photo uploads (items use emoji artwork for now)
