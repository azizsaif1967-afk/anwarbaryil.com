#!/bin/bash
# Finishes the anwarbarayil.com Supabase setup through the Management API.
# Needs: SUPABASE_ACCESS_TOKEN (supabase.com/dashboard/account/tokens → Generate new token)
# Optional: RESEND_API_KEY (resend.com/api-keys). Without it the newsletter "Send" stays off.
# Run:  SUPABASE_ACCESS_TOKEN=sbp_xxx RESEND_API_KEY=re_xxx bash ~/anwarbarayil.com/admin/finish-setup.sh
set -euo pipefail
REF=pqyywopouifskughckcf; API=https://api.supabase.com/v1/projects/$REF
: "${SUPABASE_ACCESS_TOKEN:?Set SUPABASE_ACCESS_TOKEN first (dashboard → Account → Access Tokens)}"
H=(-H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" -H "Content-Type: application/json")
ADMINS="aziz@azizsaif.com,azizsaif1967@gmail.com,aziz6492370@gmail.com,anwar.barayil@gmail.com"

echo "1. Auth URLs"
curl -sS -f -X PATCH "$API/config/auth" "${H[@]}" -d '{"site_url":"https://anwarbarayil.com/feedback/","uri_allow_list":"https://anwarbarayil.com/**,https://azizsaif.com/**"}' \
  | python3 -c "import json,sys; d=json.load(sys.stdin); print('   site_url =',d.get('site_url')); print('   allow    =',d.get('uri_allow_list'))"

echo "2. Secrets"
SECRETS="[{\"name\":\"ADMIN_EMAILS\",\"value\":\"$ADMINS\"}"
[ -n "${RESEND_API_KEY:-}" ] && SECRETS="$SECRETS,{\"name\":\"RESEND_API_KEY\",\"value\":\"$RESEND_API_KEY\"}" || echo "   (no RESEND_API_KEY given, Send will stay off)"
curl -sS -f -X POST "$API/secrets" "${H[@]}" -d "$SECRETS]" >/dev/null && echo "   secrets set"

echo "3. Deploy send-email Edge Function"
( cd "$HOME/aziz-saif-story" && SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN" npx -y supabase@latest functions deploy send-email --project-ref "$REF" --use-api 2>&1 | tail -3 )

echo "4. Remove Claude's test rows"
SQL="delete from public.ab_reviews where email like 'ab-test-%@azizsaif.com'; delete from public.ab_subscribers where email like 'ab-test-%@azizsaif.com'; delete from auth.users where email = 'ab-test-student@azizsaif.com'; select count(*) as reviews from public.ab_reviews;"
curl -sS -f -X POST "$API/database/query" "${H[@]}" -d "$(python3 -c "import json,sys; print(json.dumps({'query':sys.argv[1]}))" "$SQL")" && echo

echo "5. Check"
curl -sS -o /dev/null -w "   send-email function HTTP %{http_code} (want 401, not 404)\n" -X POST "https://$REF.supabase.co/functions/v1/send-email" -H "Content-Type: application/json" -d '{}'
echo "Done. Open https://anwarbarayil.com/admin/ and send yourself a test newsletter."
