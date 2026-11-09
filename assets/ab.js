/* Shared Supabase client for anwarbaryil.com feedback portal. Anon key is public by design;
   security lives in the RLS policies in admin/setup.sql. */
const AB = (() => {
  const URL = 'https://qtkvtwwtkxwigibockhi.supabase.co';
  const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0a3Z0d3d0a3h3aWdpYm9ja2hpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0MDQ0ODEsImV4cCI6MjA5MTk4MDQ4MX0.6vYtrBuOWf0u3a98E77ICyLe0MkFJUF4pYW19EkjNwI';
  const ADMINS = ['aziz@azizsaif.com','azizsaif1967@gmail.com','aziz6492370@gmail.com','anwar.barayil@gmail.com'];
  const sb = window.supabase.createClient(URL, KEY);
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const initials = n => n.trim().split(/\s+/).slice(0,2).map(w => w[0].toUpperCase()).join('');
  const fmtDate = d => new Date(d + (d.length === 10 ? 'T00:00:00' : '')).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
  const isAdmin = email => ADMINS.includes(String(email||'').toLowerCase());
  // Verified-review card, same look as the homepage cards.
  const card = r => `<figure class="rv"><div class="rv-top"><span class="rv-av">${esc(initials(r.name))}</span><div><b>${esc(r.name)}</b><span class="rv-ok">✓ Verified student${r.class_div ? ' · ' + esc(r.class_div) : ''}</span></div><span class="rv-n">${r.r_overall ?? ''}<small>/10</small></span></div>${r.comment ? `<blockquote>${esc(r.comment)}</blockquote>` : ''}<figcaption>${esc(r.college)}, ${esc(r.city)} · ${fmtDate(r.held_on)}</figcaption></figure>`;
  return { sb, URL, ADMINS, esc, initials, fmtDate, isAdmin, card };
})();
