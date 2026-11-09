# Feedback portal + newsletter: one-time setup (Aziz, ~10 minutes)

Pages: `/feedback/` (students, opens as a popup from the home page), `/reviews/` (public, all reviews),
`/admin/` (Aziz + Anwar only). Backend = the existing Supabase project `pqyywopouifskughckcf`
that already runs the azizsaif.com newsletter admin, so the Resend email function is already in place.
Google login is NOT enabled in that project yet (the azizsaif.com admin uses email/password + magic link).

1. **Database.** Supabase → SQL Editor → paste `admin/setup.sql` → Run. Creates `ab_seminars`,
   `ab_reviews`, `ab_subscribers`, `ab_campaigns`, the public view `ab_reviews_public`
   (name + scores + comment only), the `ab-newsletter` image bucket, and seeds the SAFI 2 Nov 2026 seminar.
   It also tightens the azizsaif.com newsletter policies to admin emails, because students now sign in
   to the same Auth project. The azizsaif.com admin keeps working.
2. **Auth URLs.** Supabase → Authentication → URL Configuration → Redirect URLs: add
   `https://anwarbaryil.com/**` and `https://azizsaif.com/**`. Set Site URL to `https://anwarbaryil.com/feedback/`.
   2b. **Google sign-in (optional, students see only email/password until this is done).**
   Google Cloud Console (project artful-wind-461910-f8) → APIs & Services → Credentials → Create OAuth client,
   Web application, name `anwarbaryil-supabase`, authorized redirect URI
   `https://pqyywopouifskughckcf.supabase.co/auth/v1/callback`. Do NOT reuse "Web client 1" or `azizsaif-newsletter`.
   OAuth consent screen → Publish app (Production), otherwise only listed test users can sign in.
   Supabase → Authentication → Providers → Google → enable, paste Client ID + secret, save.
   Then set `GOOGLE = true` in `assets/ab.js` and push.
   Optional: Authentication → Providers → Email → turn off "Confirm email" so students at a seminar
   can sign up and post in one step. Leave "Secure password change" off.
3. **Email function.** `send-email` is NOT deployed on this project yet (POST returns 404). Supabase → Edge Functions →
   Deploy a new function → name `send-email`, paste `~/aziz-saif-story/supabase/functions/send-email/index.ts`, deploy.
   Then Edge Functions → Secrets: `RESEND_API_KEY` (from resend.com/api-keys) and `ADMIN_EMAILS` (below).
   Or with the CLI: `npx supabase@latest login`, then `npx supabase functions deploy send-email --project-ref pqyywopouifskughckcf`
   from `~/aziz-saif-story`.
3b. **Anwar as sender.** Terminal:
   `supabase secrets set ADMIN_EMAILS="aziz@azizsaif.com,azizsaif1967@gmail.com,aziz6492370@gmail.com,anwar.barayil@gmail.com" --project-ref pqyywopouifskughckcf`
   Without this Anwar can see everything in /admin/ but "Send" returns "Not an authorized admin".
4. **From address.** Newsletter "From email" defaults to `newsletter@azizsaif.com` (the domain already
   verified in Resend). Reply-to is Anwar's Gmail. To send from `@anwarbaryil.com`, verify that domain at
   resend.com/domains first.
5. **Test.** Done 9 Nov by Claude as `ab-test-student@azizsaif.com`: sign-up, review insert (hidden), RLS checks all pass.
   Delete the test rows in /admin/ → Email database (ab-test-*@azizsaif.com) and Reviews (Test Student).
   Then: open `https://anwarbaryil.com/admin/`, sign in with Google, Seminars tab shows SAFI.
   Open the feedback link from that row in a private window, create a student account, submit.
   The review appears on `/reviews/` and the home page within a second.

Admin email list lives in three places: `setup.sql` (`ab_is_admin`), `assets/ab.js` (`ADMINS`),
and the `ADMIN_EMAILS` secret. Change all three together.
