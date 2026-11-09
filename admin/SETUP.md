# Feedback portal + newsletter: one-time setup (Aziz, ~10 minutes)

Pages: `/feedback/` (students, opens as a popup from the home page), `/reviews/` (public, all reviews),
`/admin/` (Aziz + Anwar only). Backend = the existing Supabase project `qtkvtwwtkxwigibockhi`
that already runs the azizsaif.com newsletter admin, so Google login and the Resend email function
are already in place.

1. **Database.** Supabase → SQL Editor → paste `admin/setup.sql` → Run. Creates `ab_seminars`,
   `ab_reviews`, `ab_subscribers`, `ab_campaigns`, the public view `ab_reviews_public`
   (name + scores + comment only), the `ab-newsletter` image bucket, and seeds the SAFI 2 Nov 2026 seminar.
   It also tightens the azizsaif.com newsletter policies to admin emails, because students now sign in
   to the same Auth project. The azizsaif.com admin keeps working.
2. **Auth URLs.** Supabase → Authentication → URL Configuration → Redirect URLs: add
   `https://anwarbaryil.com/**`. (Google provider is already enabled for azizsaif.com.)
   Optional: Authentication → Providers → Email → turn off "Confirm email" so students at a seminar
   can sign up and post in one step. Leave "Secure password change" off.
3. **Anwar as sender.** Terminal:
   `supabase secrets set ADMIN_EMAILS="aziz@azizsaif.com,azizsaif1967@gmail.com,aziz6492370@gmail.com,anwar.barayil@gmail.com" --project-ref qtkvtwwtkxwigibockhi`
   Without this Anwar can see everything in /admin/ but "Send" returns "Not an authorized admin".
4. **From address.** Newsletter "From email" defaults to `newsletter@azizsaif.com` (the domain already
   verified in Resend). Reply-to is Anwar's Gmail. To send from `@anwarbaryil.com`, verify that domain at
   resend.com/domains first.
5. **Test.** Open `https://anwarbaryil.com/admin/`, sign in with Google, Seminars tab shows SAFI.
   Open the feedback link from that row in a private window, create a student account, submit.
   The review appears on `/reviews/` and the home page within a second.

Admin email list lives in three places: `setup.sql` (`ab_is_admin`), `assets/ab.js` (`ADMINS`),
and the `ADMIN_EMAILS` secret. Change all three together.
