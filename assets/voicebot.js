/* ==========================================================================
   voice guide for anwarbarayil.com (ported from azizsaif.com)
   Greets the visitor, speaks the six AI service lines, lets them choose
   (tap or voice). Pure Web Speech API — no server, works on GitHub Pages.
   ========================================================================== */
(function () {
  "use strict";

  var SERVICES_PAGE = "/#book";
  var WA = "https://wa.me/919840244034";

  var SERVICES = [
    { key: "career", name: "Career talk: sales is worth choosing",
      say: "Career talk. Ninety minutes on why sales belongs beside engineering, medicine, law and accountancy. For final year business and management students.",
      desc: "Why sales belongs beside engineering, medicine, law and accountancy. For final-year business and management students. 90 minutes.",
      kw: ["career", "talk", "students", "college", "one", "1", "first"] },
    { key: "goals", name: "Goal-setting workshop",
      say: "Goal setting workshop. A half day guided exercise. Every student leaves with written goals and a first step. All twenty four students rated it useful.",
      desc: "A guided exercise where every student leaves with written goals and a first step. Rated interesting, useful or practical by all 24. Half day.",
      kw: ["goal", "goals", "workshop", "setting", "two", "2", "second"] },
    { key: "selling", name: "Selling-skills course",
      say: "Selling skills course. Finding customers, the sales call, handling objections and closing. Drawn from twenty seven years at Gillette, P and G and Etisalat. One to two days.",
      desc: "Finding customers, the sales call, handling objections and closing, drawn from 27 years at Gillette, P&amp;G and Etisalat. 1 to 2 days.",
      kw: ["selling", "skills", "course", "objection", "closing", "three", "3", "third"] },
    { key: "team", name: "Sales team training",
      say: "Sales team training. Field sales, trade marketing and sales planning for F M C G, telecom and retail teams. Built around your company.",
      desc: "Field sales, trade marketing and sales planning for FMCG, telecom and retail teams. Custom length.",
      kw: ["team", "company", "corporate", "fmcg", "telecom", "retail", "field", "four", "4", "fourth"] }
  ];

  var GREETING_DISPLAY = "Welcome! Anwar Barayil trains colleges and companies in sales. Pick one of the four sessions below, or tap the mic and just say it.";
  var GREETING_SPOKEN = "Welcome! Anwar Barayil trains colleges and companies in sales, across South India first. There are four sessions: a career talk, a goal setting workshop, a selling skills course, and sales team training. Which one would you like to hear about?";

  var WF_GREETING_DISPLAY = GREETING_DISPLAY;
  var WF_GREETING_SPOKEN = GREETING_SPOKEN;

  var path = location.pathname.replace(/index\.html$/, "/");
  var IS_HOME = (path === "/" || path === "");
  /* DATASET is rewired to workflows on the homepage in init(), once the
     inline script in index.html has published window.__AZ_WF_LIST. */
  var DATASET = SERVICES;
  var IS_WORKFLOW_MODE = false;
  var muted = false, greeted = false, primed = false, voice = null;
  var listening = false, rec = null, restartTimer = null;

  /* ---------- speech ---------- */
  function pickVoice() {
    if (!("speechSynthesis" in window)) return;
    var all = speechSynthesis.getVoices();
    if (!all.length) return;
    var pref = ["Google UK English Female", "Microsoft Aria", "Google US English",
      "Samantha", "Google English (India)", "Microsoft Zira"];
    for (var i = 0; i < pref.length; i++) {
      var m = all.find(function (v) { return v.name && v.name.indexOf(pref[i]) > -1; });
      if (m) { voice = m; return; }
    }
    voice = all.find(function (v) { return /^en-GB/i.test(v.lang); }) ||
      all.find(function (v) { return /^en/i.test(v.lang); }) || all[0];
  }
  if ("speechSynthesis" in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }

  function speak(text) {
    if (muted || !("speechSynthesis" in window) || !text) return;
    try {
      speechSynthesis.cancel();
      if (listening) stopRec();              // pause the mic so we don't hear ourselves
      if (!voice) pickVoice();
      var u = new SpeechSynthesisUtterance(text);
      if (voice) { u.voice = voice; u.lang = voice.lang; }
      u.rate = 0.98; u.pitch = 1; u.volume = 1;
      u.onend = function () { if (listening) startRec(); };
      u.onerror = function () { if (listening) startRec(); };
      // Chrome / Safari race: cancel()+speak() back-to-back can drop the
      // new utterance. Defer one tick and explicitly resume() first.
      setTimeout(function () {
        try { speechSynthesis.resume(); speechSynthesis.speak(u); }
        catch (e) { if (listening) startRec(); }
      }, 60);
    } catch (e) { if (listening) startRec(); }
  }
  function stopSpeech() { try { speechSynthesis.cancel(); } catch (e) {} }

  /* ---------- DOM ---------- */
  var els = {};
  function build() {
    var launch = document.createElement("button");
    launch.className = "azvb-launch azvb-pulse";
    launch.type = "button";
    launch.setAttribute("aria-label", "Open the training sessions voice guide");
    launch.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>';

    var bubble = document.createElement("div");
    bubble.className = "azvb-bubble";
    bubble.setAttribute("role", "status");
    bubble.innerHTML = 'Hi! Need help choosing a <b>training session</b>? Tap to talk →<button type="button" aria-label="Dismiss">×</button>';

    var panel = document.createElement("section");
    panel.className = "azvb-panel";
    panel.setAttribute("aria-label", "Training sessions voice guide");
    panel.innerHTML =
      '<div class="azvb-head"><span class="azvb-dot"></span><b>Anwar Barayil · Session Guide</b>' +
      '<button class="azvb-x" type="button" aria-label="Close assistant">×</button></div>' +
      '<div class="azvb-body">' +
        '<div class="azvb-main">' +
          '<p class="azvb-greet">' + GREETING_DISPLAY + '</p>' +
          '<ul class="azvb-opts"></ul>' +
        '</div>' +
        '<div class="azvb-detail"></div>' +
      '</div>' +
      '<div class="azvb-foot">' +
        '<button class="azvb-mic" type="button" aria-label="Speak your choice">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>' +
        '</button>' +
        '<span class="azvb-status">Tap a session, or tap the mic and say it.</span>' +
        '<button class="azvb-sound" type="button" aria-label="Mute voice" title="Mute voice">🔊</button>' +
      '</div>';

    document.body.appendChild(launch);
    document.body.appendChild(bubble);
    document.body.appendChild(panel);

    els = {
      launch: launch, bubble: bubble, panel: panel,
      opts: panel.querySelector(".azvb-opts"),
      main: panel.querySelector(".azvb-main"),
      detail: panel.querySelector(".azvb-detail"),
      mic: panel.querySelector(".azvb-mic"),
      status: panel.querySelector(".azvb-status"),
      sound: panel.querySelector(".azvb-sound")
    };

    renderOpts();

    launch.addEventListener("click", function () { primeAudio(); togglePanel(); });
    bubble.querySelector("button").addEventListener("click", function (e) { e.stopPropagation(); hideBubble(); });
    bubble.addEventListener("click", function () { primeAudio(); openPanel(); });
    panel.querySelector(".azvb-x").addEventListener("click", closePanel);
    els.sound.addEventListener("click", toggleMute);
    els.mic.addEventListener("click", function () { primeAudio(); toggleListen(); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen()) closePanel(); });
  }

  /* ---------- dataset rendering ---------- */
  function renderOpts() {
    if (!els.opts) return;
    els.opts.innerHTML = "";
    DATASET.forEach(function (s, i) {
      var li = document.createElement("li");
      var b = document.createElement("button");
      b.type = "button";
      var num = IS_WORKFLOW_MODE ? s.num : (i + 1);
      b.innerHTML = '<span class="azvb-num">' + num + '</span>' + s.name;
      b.addEventListener("click", function () { showService(s); });
      li.appendChild(b);
      els.opts.appendChild(li);
    });
  }

  function activateWorkflowMode() {
    var list = window.__AZ_WF_LIST;
    if (!list || !list.length || !els.opts) return;
    DATASET = list;
    IS_WORKFLOW_MODE = true;
    var greetEl = els.panel.querySelector(".azvb-greet");
    if (greetEl) greetEl.textContent = WF_GREETING_DISPLAY;
    var head = els.panel.querySelector(".azvb-head b");
    if (head) head.textContent = "Anwar Barayil · Session Guide";
    if (els.status) els.status.textContent = "Tap a workflow, or say its number / topic.";
    var bub = els.bubble && els.bubble.querySelector("b");
    if (bub) bub.textContent = "AI Workflow Guide";
    renderOpts();
  }

  /* ---------- panel state ---------- */
  function isOpen() { return els.panel.classList.contains("azvb-open"); }
  function hideBubble() { if (els.bubble) els.bubble.style.display = "none"; }
  function showMain() { els.main.style.display = ""; els.detail.classList.remove("azvb-show"); }

  function openPanel() {
    hideBubble();
    els.launch.classList.remove("azvb-pulse");
    els.panel.classList.add("azvb-open");
    if (!greeted) {
      greeted = true;
      speak(IS_WORKFLOW_MODE ? WF_GREETING_SPOKEN : GREETING_SPOKEN);
    }
  }
  function closePanel() { els.panel.classList.remove("azvb-open"); stopSpeech(); stopListening(); }
  function togglePanel() { isOpen() ? closePanel() : openPanel(); }

  function toggleMute() {
    muted = !muted;
    els.sound.textContent = muted ? "🔇" : "🔊";
    els.sound.setAttribute("aria-label", muted ? "Unmute voice" : "Mute voice");
    if (muted) stopSpeech();
  }

  function showService(s) {
    els.main.style.display = "none";
    els.detail.classList.add("azvb-show");

    if (IS_WORKFLOW_MODE) {
      var anchor = "#ai-workflow";
      var card = (typeof window.__AZ_WF_FOCUS === "function") ? window.__AZ_WF_FOCUS(s.num) : null;
      els.detail.innerHTML =
        '<button class="azvb-back" type="button">← All workflows</button>' +
        '<h4><span class="azvb-num" style="margin-right:8px">' + s.num + '</span>' + s.name + '</h4>' +
        '<p>' + (s.desc || "") + '</p>' +
        '<a class="azvb-cta" href="' + anchor + '">Scroll to card →</a>' +
        '<a class="azvb-cta alt" href="' + WA + '?text=' +
          encodeURIComponent("Hello Anwar, about item " + s.num + " — " + s.name) +
          '" target="_blank" rel="noopener">WhatsApp</a>';
      els.detail.querySelector(".azvb-back").addEventListener("click", showMain);
      els.status.textContent = "Speaking: workflow " + s.num + " · " + s.name;
      speak(s.say + " To deploy this one, message me on WhatsApp.");
      return;
    }

    els.detail.innerHTML =
      '<button class="azvb-back" type="button">← All sessions</button>' +
      '<h4>' + s.name + '</h4>' +
      '<p>' + s.desc + '</p>' +
      '<a class="azvb-cta" href="' + SERVICES_PAGE + '">Book this session →</a>' +
      '<a class="azvb-cta alt" href="' + WA + '?text=' +
        encodeURIComponent("Hello Anwar, I would like the " + s.name + " for our college/company.") + '" target="_blank" rel="noopener">WhatsApp</a>';
    els.detail.querySelector(".azvb-back").addEventListener("click", showMain);
    els.status.textContent = "Showing: " + s.name;
    speak(s.say + " You can tap Book this session, or message Anwar on WhatsApp.");
  }

  /* ---------- audio priming (browsers need a user gesture) ---------- */
  function primeAudio() {
    if (primed) return;
    primed = true;
    try { var u = new SpeechSynthesisUtterance(" "); u.volume = 0; speechSynthesis.speak(u); } catch (e) {}
  }

  /* ---------- voice input (continuous, chat-bot style) ---------- */
  function toggleListen() { if (listening) stopListening(); else startListening(); }

  function startListening() {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { els.status.textContent = "Voice input isn't supported in this browser — tap a session above."; return; }
    listening = true;
    stopSpeech();
    els.mic.classList.add("azvb-listening");
    els.status.textContent = "Listening… say a session, or say “close”.";
    startRec();
  }

  function stopListening() {
    listening = false;
    if (restartTimer) { clearTimeout(restartTimer); restartTimer = null; }
    stopRec();
    if (els.mic) els.mic.classList.remove("azvb-listening");
  }

  function startRec() {
    if (rec || !listening) return;
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    rec = new SR();
    rec.lang = "en-IN"; rec.interimResults = false; rec.maxAlternatives = 1;
    try { rec.continuous = true; } catch (e) {}
    rec.onresult = function (ev) {
      var said = (ev.results[ev.results.length - 1][0].transcript || "").toLowerCase().trim();
      if (!said) return;
      els.status.textContent = "You said: “" + said + "”";
      if (/\b(close|exit|quit|cancel|stop listening|that'?s all|never mind|good ?bye)\b/.test(said)) { stopListening(); closePanel(); return; }
      if (/\b(back|all services|all workflows|main menu|menu|list|start over)\b/.test(said)) {
        showMain();
        speak(IS_WORKFLOW_MODE ? "Okay — all workflows. Which number or topic?" : "Okay, all sessions. Which one would you like?");
        return;
      }
      var match = DATASET.find(function (s) { return s.kw.some(function (k) { return k && said.indexOf(k) > -1; }); });
      if (match) { showService(match); }
      else if (IS_WORKFLOW_MODE) {
        els.status.textContent = "Didn't catch a workflow — try again.";
        speak("I didn't catch that. Say a number from one to twenty-three, or a topic like recruitment, invoices, voice agent, social media, or weekly review.");
      }
      else { els.status.textContent = "Didn't catch a session, try again."; speak("I didn't catch that. You can say, for example: career talk, goal setting, selling skills, or sales team."); }
    };
    rec.onerror = function (e) {
      if (e && (e.error === "not-allowed" || e.error === "service-not-allowed")) {
        listening = false;
        if (els.mic) els.mic.classList.remove("azvb-listening");
        els.status.textContent = "Microphone is blocked — allow mic access, or tap a session above.";
      }
    };
    rec.onend = function () {
      rec = null;
      if (listening) {
        if (restartTimer) clearTimeout(restartTimer);
        restartTimer = setTimeout(function () { if (listening && !rec) startRec(); }, 350);
      } else if (els.mic) { els.mic.classList.remove("azvb-listening"); }
    };
    try { rec.start(); } catch (e) { rec = null; }
  }

  function stopRec() {
    if (rec) { try { rec.onend = null; rec.onresult = null; rec.stop(); } catch (e) {} rec = null; }
  }

  /* ---------- init ---------- */
  function init() {
    if (document.querySelector(".azvb-launch")) return;
    build();

    // If the homepage's inline script published a workflow list, switch the
    // panel to the 23 workflows. Poll briefly in case voicebot.js wins the
    // race (defer + inline script ordering is reliable but cheap to belt-and-brace).
    function trySwap(attempts) {
      if (window.__AZ_WF_LIST && window.__AZ_WF_LIST.length) {
        activateWorkflowMode();
        return;
      }
      if (attempts > 0) setTimeout(function(){ trySwap(attempts - 1); }, 200);
    }
    trySwap(10);

    // first interaction anywhere primes audio so the greeting can be spoken
    ["pointerdown", "keydown", "touchstart"].forEach(function (ev) {
      window.addEventListener(ev, primeAudio, { once: true, passive: true });
    });
    // The panel never opens on its own — it opens only when the visitor taps
    // the launcher button (or the home-page nudge bubble). On the home page we
    // reveal that small bubble; on every other page only the launcher shows.
    setTimeout(function () { if (els.bubble && IS_HOME) els.bubble.style.display = ""; }, 600);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
