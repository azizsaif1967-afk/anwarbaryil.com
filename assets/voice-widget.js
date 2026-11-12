/* ============================================================
   anwarbarayil.com voice assistant (ported from azizsaif.com)
   Self-contained, Shadow DOM (no CSS clashes), no backend.
   Speaks answers (SpeechSynthesis) + listens (SpeechRecognition),
   types the answer in sync. Loads on every page via:
     <script defer src="/assets/voice-widget.js"></script>
   ============================================================ */
(function () {
  if (window.__azVoice) return;
  window.__azVoice = true;
  // Skip pages that already have a dedicated full-screen voice bot
  if (location.pathname.indexOf("/voice-bot") !== -1) return;

  var WA = "https://wa.me/919840244034";
  /* ---------- knowledge base ---------- */
  var KB = [
    { q: ["hello","hi","hey","namaste","who are you","what is this","start"],
      a: "Hello! I'm the assistant on Anwar Barayil's site. Anwar is a sales trainer for colleges and companies, based in Chennai. Ask about his sessions, his background, where he travels, or say 'book'." },
    { q: ["who is anwar","about anwar","about him","background","experience","anwar barayil","gillette","etisalat"],
      a: "Anwar Barayil has fifty years in sales, from clerk to owner, including 27 years at Gillette, P&G and Etisalat. He now trains students and sales teams." },
    { q: ["session","sessions","what can","offer","services","programme","program","options","help"],
      a: "Four sessions: a 90 minute career talk on why sales is a career worth choosing, a half day goal-setting workshop, a one to two day selling-skills course, and custom sales team training for companies." },
    { q: ["career","talk","students","college","mba","pgdm"],
      a: "The career talk is 90 minutes for final-year business and management students. It shows why sales belongs beside engineering, medicine, law and accountancy." },
    { q: ["goal","goals","workshop"],
      a: "The goal-setting workshop is a half day. Every student leaves with written goals and a first step. All 24 SAFI students rated it interesting, useful or practical." },
    { q: ["selling","skills","course","objection","closing","cold call"],
      a: "The selling-skills course runs one to two days: finding customers, the sales call, handling objections and closing." },
    { q: ["team","company","corporate","fmcg","telecom","retail","field sales"],
      a: "Sales team training covers field sales, trade marketing and sales planning for FMCG, telecom and retail teams. Length is set around your company." },
    { q: ["where","travel","kerala","tamil","chennai","karnataka","andhra","location","city"],
      a: "Anwar is based in Chennai. South India comes first: Kerala, Tamil Nadu, Karnataka and Andhra Pradesh. Anywhere else is possible when the host covers travel and stay." },
    { q: ["feedback","rating","review","safi","score"],
      a: "At SAFI Institute in Calicut, 24 management students rated the session. 96 percent want selling skills next. See the feedback section on this page." },
    { q: ["cost","price","fee","how much","charge","rate"],
      a: "The fee depends on the session, the length and the city. Send the details on WhatsApp at +91 98402 44034 and Anwar will reply with a quote." },
    { q: ["contact","whatsapp","email","phone","reach","book","call","hire","invite"],
      a: "WhatsApp or call Anwar on +91 98402 44034, or email anwar.barayil@gmail.com. You can also use the booking form on this page." },
    { q: ["thank","thanks","great","perfect","ok"],
      a: "You're welcome! To book, WhatsApp +91 98402 44034." }
  ];
  var FB = [
    "I can tell you about Anwar's four sessions, his background, where he travels, or how to book. Try 'sessions' or 'book'.",
    "Not sure on that one. Ask about the career talk, selling skills, sales team training, or say 'contact' to reach Anwar."
  ];
  /* Page-scoped override: a page may set window.AZ_VOICE_KB / AZ_VOICE_FALLBACK
     before this script loads to restrict the bot to its own content. */
  if (typeof window !== "undefined") {
    if (Array.isArray(window.AZ_VOICE_KB) && window.AZ_VOICE_KB.length) KB = window.AZ_VOICE_KB;
    if (Array.isArray(window.AZ_VOICE_FALLBACK) && window.AZ_VOICE_FALLBACK.length) FB = window.AZ_VOICE_FALLBACK;
  }
  function answer(t) {
    t = (t || "").toLowerCase();
    var best = null, score = 0;
    for (var i = 0; i < KB.length; i++) {
      var s = 0, e = KB[i];
      for (var j = 0; j < e.q.length; j++) if (t.indexOf(e.q[j]) !== -1) s += e.q[j].split(" ").length;
      if (s > score) { score = s; best = e; }
    }
    return score ? best.a : FB[Math.floor(Math.random() * FB.length)];
  }

  /* ---------- UI (shadow DOM) ---------- */
  var host = document.createElement("div");
  host.setAttribute("id", "az-voice-host");
  (document.body || document.documentElement).appendChild(host);
  var root = host.attachShadow ? host.attachShadow({ mode: "open" }) : host;

  root.innerHTML =
    '<style>' +
    ':host,*{box-sizing:border-box}' +
    '.fab{position:fixed;right:18px;bottom:86px;z-index:2147483000;width:58px;height:58px;border:none;border-radius:50%;cursor:pointer;background:radial-gradient(circle at 38% 32%,#2563EB,#143E76);color:#fff;font-size:24px;box-shadow:0 8px 26px rgba(20,40,90,.45);display:grid;place-items:center;transition:transform .15s}' +
    '.fab:hover{transform:scale(1.07)}' +
    '.wafab{position:fixed;right:18px;bottom:18px;z-index:2147483000;width:58px;height:58px;border-radius:50%;background:#25D366;display:grid;place-items:center;box-shadow:0 8px 26px rgba(18,90,40,.45);text-decoration:none;transition:transform .15s}' +
    '.wafab:hover{transform:scale(1.07)}' +
    '.fab.live{animation:pl 1.4s infinite}' +
    '@keyframes pl{0%{box-shadow:0 0 0 0 rgba(37,99,235,.5)}70%{box-shadow:0 0 0 16px rgba(37,99,235,0)}100%{box-shadow:0 0 0 0 rgba(37,99,235,0)}}' +
    '.panel{position:fixed;right:18px;bottom:86px;z-index:2147483000;width:340px;max-width:calc(100vw - 28px);background:#0E1726;color:#EAF0FA;border:1px solid #243042;border-radius:16px;box-shadow:0 18px 50px rgba(0,0,0,.5);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;display:none;overflow:hidden}' +
    '.panel.open{display:block}' +
    '.hd{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:12px 14px;background:linear-gradient(135deg,#0A1422,#143E76);font-weight:700;font-size:14px}' +
    '.hd .x{background:transparent;border:none;color:#cbd5e1;font-size:18px;cursor:pointer;line-height:1}' +
    /* avatar (talks while the bot speaks) */
    '.avbar{display:flex;align-items:center;gap:11px;padding:13px 14px;background:linear-gradient(135deg,#0E1726,#16233b);border-bottom:1px solid #243042}' +
    '.av{width:46px;height:46px;border-radius:50%;position:relative;flex-shrink:0;background:radial-gradient(circle at 50% 34%,#cfe3ff 0%,#3b82f6 58%,#143E76 100%);box-shadow:0 6px 16px rgba(20,40,90,.45),inset 0 -10px 18px rgba(0,0,0,.22);transition:transform .3s}' +
    '.av.spk{transform:scale(1.04)}' +
    '.av::before,.av::after{content:"";position:absolute;width:5px;height:5px;border-radius:50%;background:#0b1220;top:38%;animation:blink 5s infinite}' +
    '.av::before{left:31%}.av::after{right:31%}' +
    '@keyframes blink{0%,90%,100%{transform:scaleY(1)}93%,97%{transform:scaleY(.1)}}' +
    '.av .mo{position:absolute;left:50%;bottom:26%;transform:translateX(-50%) scaleY(.4);width:13px;height:4px;border-radius:99px;background:#0b1220}' +
    '.av.spk .mo{animation:talk .34s infinite ease-in-out}' +
    '@keyframes talk{0%,100%{transform:translateX(-50%) scaleY(.45)}50%{transform:translateX(-50%) scaleY(1.7)}}' +
    '.avtx b{display:block;font-size:13.5px;color:#EAF0FA;line-height:1.1}' +
    '.avtx span{font-size:10px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;color:#64748b;display:inline-flex;align-items:center;gap:5px;margin-top:3px}' +
    '.avtx span::before{content:"";width:6px;height:6px;border-radius:50%;background:#64748b}' +
    '.avtx span.on::before{background:#22c55e}.avtx span.on{color:#22c55e}' +
    '@media(prefers-reduced-motion:reduce){.av,.av::before,.av::after,.av .mo{animation:none}}' +
    '.bd{padding:12px 14px;max-height:300px;overflow-y:auto;font-size:14px;line-height:1.55}' +
    '.msg{margin:8px 0;display:flex;gap:8px}' +
    '.msg.u{flex-direction:row-reverse}' +
    '.b{padding:8px 11px;border-radius:12px;max-width:84%}' +
    '.msg.bot .b{background:rgba(37,99,235,.14);border:1px solid rgba(37,99,235,.3)}' +
    '.msg.u .b{background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.14)}' +
    '.b a{color:#7Fb0ff}' +
    '.ft{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #243042}' +
    '.ft input{flex:1;background:rgba(255,255,255,.06);border:1px solid #243042;border-radius:10px;padding:9px 11px;color:#fff;font-size:14px;outline:none}' +
    '.ft button{border:none;border-radius:10px;cursor:pointer;font-weight:700;font-size:13px;padding:0 13px;color:#fff}' +
    '.mic{background:#2563EB}.mic.live{background:#16a34a}.snd{background:#334155}' +
    '.chips{display:flex;flex-wrap:wrap;gap:6px;padding:0 12px 12px}' +
    '.chip{font-size:12px;border:1px solid #243042;background:rgba(255,255,255,.05);color:#cbd5e1;border-radius:99px;padding:6px 10px;cursor:pointer}' +
    '.chip:hover{border-color:#2563EB;color:#fff}' +
    '@media(prefers-reduced-motion:reduce){.fab.live{animation:none}}' +
    '</style>' +
    '<button class="fab" id="fab" aria-label="Talk to the assistant">🎙</button>' +
    '<a class="wafab" id="wafab" target="_blank" rel="noopener" aria-label="Chat on WhatsApp" href="https://wa.me/919840244034?text=Hello%20Anwar%2C%20I%20would%20like%20to%20book%20a%20training%20session.">' +
      '<svg viewBox="0 0 32 32" width="30" height="30" fill="#fff"><path d="M16 .5C7.4.5.5 7.4.5 16c0 2.8.8 5.5 2.2 7.9L.5 31.5l7.8-2.1A15.4 15.4 0 0 0 16 31.5C24.6 31.5 31.5 24.6 31.5 16S24.6.5 16 .5zm0 28c-2.5 0-4.9-.7-7-1.9l-.5-.3-4.6 1.2 1.2-4.5-.3-.5A12.8 12.8 0 0 1 2.7 16C2.7 8.6 8.6 2.7 16 2.7S29.3 8.6 29.3 16 23.4 28.5 16 28.5zm8.2-9.9c-.4-.2-2.6-1.3-3-1.4-.4-.1-.7-.2-1 .2-.3.4-1.1 1.4-1.4 1.7-.3.3-.5.3-.9.1-.4-.2-1.9-.7-3.6-2.2-1.3-1.2-2.2-2.6-2.5-3-.3-.4 0-.6.2-.8.2-.2.4-.5.6-.7.2-.2.2-.4.4-.7.1-.3.1-.5 0-.7-.1-.2-1-2.4-1.4-3.3-.4-.8-.7-.7-1-.7h-.8c-.3 0-.7.1-1.1.5-.4.4-1.5 1.4-1.5 3.5s1.5 4.1 1.7 4.4c.2.3 3 4.6 7.3 6.4 1 .4 1.8.7 2.4.9 1 .3 1.9.3 2.6.2.8-.1 2.6-1.1 3-2.1.4-1 .4-1.9.3-2.1-.1-.2-.4-.3-.8-.5z"/></svg>' +
      '</a>' +
    '<div class="panel" id="panel" role="dialog" aria-label="Site voice assistant">' +
      '<div class="hd"><span>🎙 Ask this site</span><button class="x" id="x" aria-label="Close">✕</button></div>' +
      '<div class="avbar"><div class="av" id="av"><span class="mo"></span></div><div class="avtx"><b>Anwar’s assistant</b><span id="avst">Ready — tap the mic</span></div></div>' +
      '<div class="bd" id="bd"></div>' +
      '<div class="chips" id="chips"></div>' +
      '<div class="ft"><input id="in" type="text" placeholder="Ask or tap the mic…" autocomplete="off"><button class="mic" id="mic" title="Speak">🎤</button><button class="snd" id="snd">Send</button></div>' +
    '</div>';

  var $ = function (id) { return root.getElementById ? root.getElementById(id) : root.querySelector("#" + id); };
  var fab = $("fab"), panel = $("panel"), bd = $("bd"), input = $("in"), mic = $("mic"), snd = $("snd"), chips = $("chips"), x = $("x");
  var av = $("av"), avst = $("avst");
  var greeted = false, primed = false;
  function avState(mode) {
    if (!av) return;
    if (mode === "speaking") { av.classList.add("spk"); avst.textContent = "Speaking…"; avst.classList.add("on"); }
    else if (mode === "thinking") { av.classList.remove("spk"); avst.textContent = "Thinking…"; avst.classList.add("on"); }
    else if (mode === "listening") { av.classList.remove("spk"); avst.textContent = "Listening…"; avst.classList.add("on"); }
    else { av.classList.remove("spk"); avst.textContent = "Ready — tap the mic"; avst.classList.remove("on"); }
  }

  function prime() { if (primed || !window.speechSynthesis) return; primed = true; try { speechSynthesis.getVoices(); var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} }
  function toPlain(h) { return h.replace(/&amp;/g, "and").replace(/<[^>]*>/g, ""); }
  function addUser(t) { var m = document.createElement("div"); m.className = "msg u"; m.innerHTML = '<div class="b"></div>'; m.firstChild.textContent = t; bd.appendChild(m); bd.scrollTop = bd.scrollHeight; }
  function botReveal(html) {
    var m = document.createElement("div"); m.className = "msg bot"; m.innerHTML = '<div class="b"></div>';
    var bub = m.firstChild; bd.appendChild(m); bd.scrollTop = bd.scrollHeight;
    var plain = toPlain(html), words = plain.split(/\s+/).filter(Boolean), shown = 0, timer = null;
    function render() { bub.textContent = words.slice(0, shown).join(" "); bd.scrollTop = bd.scrollHeight; }
    function finish() { if (timer) { clearInterval(timer); timer = null; } bub.innerHTML = html; bd.scrollTop = bd.scrollHeight; avState("idle"); }
    timer = setInterval(function () { shown++; if (shown >= words.length) finish(); else render(); }, 300);
    if (window.speechSynthesis) {
      try { speechSynthesis.cancel(); } catch (e) {}
      var u = new SpeechSynthesisUtterance(plain); u.lang = "en-IN"; u.rate = 0.98;
      var vs = speechSynthesis.getVoices(); var pref = vs.find(function (v) { return v.name.indexOf("Google UK English") > -1 || v.name.indexOf("Daniel") > -1 || v.name.indexOf("Samantha") > -1 || (v.lang && v.lang.indexOf("en") === 0 && v.name.indexOf("Microsoft") < 0); });
      if (pref) u.voice = pref;
      try { speechSynthesis.resume(); } catch (e) {}
      u.onboundary = function (e) { if (e.charIndex != null) { var i = plain.slice(0, e.charIndex).split(/\s+/).filter(Boolean).length; if (i > shown) { shown = i; render(); } } };
      u.onstart = function () { avState("speaking"); };
      u.onend = u.onerror = finish;
      setTimeout(function () { try { speechSynthesis.resume(); speechSynthesis.speak(u); } catch (e) {} }, 70);
    }
  }
  // No assistant backend on this site: KB answers only, unless a page sets AZ_ASSISTANT_URL.
  var ASSISTANT_URL = (typeof window.AZ_ASSISTANT_URL === "string" && window.AZ_ASSISTANT_URL) || "";
  var convo = [];      // running [{role,content}] history for context
  var asking = false;  // guard against overlapping requests

  function respond(t) {
    addUser(t);
    convo.push({ role: "user", content: t });
    if (convo.length > 12) convo = convo.slice(-12);
    if (asking) return;
    asking = true;
    avState("thinking");
    var done = false;
    function fallback() { if (done) return; done = true; asking = false; botReveal(answer(t)); }
    // If the function is slow or unreachable, drop back to the KB.
    if (!ASSISTANT_URL) { fallback(); return; }
    var fb = setTimeout(fallback, 8000);
    fetch(ASSISTANT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: convo, page: location.pathname })
    })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (d) {
        if (done) return;
        done = true; clearTimeout(fb); asking = false;
        var reply = (d && d.reply) ? d.reply : answer(t);
        convo.push({ role: "assistant", content: reply });
        botReveal(reply);
      })
      .catch(function () { clearTimeout(fb); fallback(); });
  }

  // Chips: a page may override via window.AZ_VOICE_CHIPS (array of strings).
  var CHIPS = (Array.isArray(window.AZ_VOICE_CHIPS) && window.AZ_VOICE_CHIPS.length)
    ? window.AZ_VOICE_CHIPS
    : ["Sessions", "About Anwar", "Where", "Fee", "Book"];
  CHIPS.forEach(function (c) {
    var b = document.createElement("button"); b.className = "chip"; b.textContent = c;
    b.addEventListener("click", function () { prime(); respond(c); }); chips.appendChild(b);
  });

  function openPanel() {
    prime(); panel.classList.add("open");
    if (!greeted) {
      greeted = true;
      // A page may override the opening line via window.AZ_VOICE_GREETING.
      var g = (typeof window.AZ_VOICE_GREETING === "string" && window.AZ_VOICE_GREETING)
        ? window.AZ_VOICE_GREETING
        : "Hello! I'm the assistant on Anwar Barayil's site. Ask about his sessions, his background, where he travels, or say 'book'.";
      setTimeout(function () { botReveal(g); }, 250);
    }
  }
  function closePanel() { panel.classList.remove("open"); try { speechSynthesis.cancel(); } catch (e) {} }
  fab.addEventListener("click", function () { panel.classList.contains("open") ? closePanel() : openPanel(); });
  // Public hooks so any page button (e.g. a hero "Talk to AI now" CTA) can open the assistant.
  window.azOpenVoice = openPanel;
  window.azCloseVoice = closePanel;
  document.addEventListener("click", function (ev) {
    var trg = ev.target.closest && ev.target.closest("[data-voice-open]");
    if (trg) { ev.preventDefault(); openPanel(); }
  });
  x.addEventListener("click", closePanel);
  function send() { var v = input.value.trim(); if (!v) return; input.value = ""; respond(v); }
  snd.addEventListener("click", send);
  input.addEventListener("keydown", function (e) { if (e.key === "Enter") send(); });

  /* ---------- speech recognition ---------- */
  var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, listening = false;
  if (SR) {
    rec = new SR(); rec.continuous = false; rec.interimResults = true; rec.lang = "en-IN";
    rec.onstart = function () { listening = true; mic.classList.add("live"); fab.classList.add("live"); avState("listening"); };
    rec.onresult = function (e) { var t = Array.from(e.results).map(function (r) { return r[0].transcript; }).join(""); if (e.results[e.results.length - 1].isFinal) { stop(); respond(t); } };
    rec.onerror = function () { stop(); };
    rec.onend = function () { if (listening) stop(); };
  } else { mic.style.display = "none"; }
  function stop() { listening = false; mic.classList.remove("live"); fab.classList.remove("live"); if (av && !av.classList.contains("spk")) avState("idle"); }
  mic.addEventListener("click", function () { prime(); if (!SR) return; if (listening) { rec.stop(); } else { try { speechSynthesis.cancel(); } catch (e) {} try { rec.start(); } catch (e) {} } });

  if (window.speechSynthesis) { try { speechSynthesis.onvoiceschanged = function () {}; } catch (e) {} }
})();
