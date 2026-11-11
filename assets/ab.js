/* Shared Supabase client for anwarbarayil.com feedback portal. Anon key is public by design;
   security lives in the RLS policies in admin/setup.sql. */
const AB = (() => {
  const URL = 'https://pqyywopouifskughckcf.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBxeXl3b3BvdWlmc2t1Z2hja2NmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQxODY1NzMsImV4cCI6MjEwOTc2MjU3M30.MDd_VBANCofulsgY5lzQOXeg5I8Ng1z-RBoXcUofZ7I';
  const ADMINS = ['aziz@azizsaif.com','azizsaif1967@gmail.com','aziz6492370@gmail.com','anwar.barayil@gmail.com'];
  const GOOGLE = false; // shortcut: Google provider not enabled in Supabase yet, flip to true after SETUP.md step 2b
  const sb = window.supabase.createClient(URL, KEY);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = n => n.trim().split(/\s+/).slice(0,2).map(w => w[0].toUpperCase()).join('');
  const fmtDate = d => new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
  const isAdmin = email => ADMINS.includes(String(email||'').toLowerCase());
  // Verified-review card, same look as the homepage cards.
  const card = r => `<figure class="rv"><div class="rv-top"><span class="rv-av">${esc(initials(r.name))}</span><div><b>${esc(r.name)}</b><span class="rv-ok">✓ Verified student${r.class_div ? ' · ' + esc(r.class_div) : ''}</span></div><span class="rv-n">${r.r_overall ?? ''}<small>/10</small></span></div>${r.comment ? `<blockquote>${esc(r.comment)}</blockquote>` : ''}<figcaption>${esc(r.college)}, ${esc(r.city)} · ${fmtDate(r.held_on)}</figcaption></figure>`;
  return { sb, URL, ADMINS, GOOGLE, esc, initials, fmtDate, isAdmin, card };
})();
