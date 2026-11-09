/* Newsletter import: turns an uploaded .html / .pdf / .csv / .txt into { subject, body, fromName, from, reply }.
   Runs fully in the browser; nothing is uploaded. */
window.NLImport = (() => {
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  const safeUrl = u => /^(https?:|mailto:|tel:)/i.test(u = String(u || '').trim()) ? u : (/^www\./i.test(u) ? 'https://' + u : '');
  const linkify = s => esc(s).replace(/\b(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi, m => `<a href="${esc(safeUrl(m.replace(/&amp;/g, '&')))}">${m}</a>`);
  const H2 = t => `<h2 style="font-family:Georgia,serif;color:#0F2A47;font-size:22px;margin:22px 0 8px">${esc(t)}</h2>`;
  const P = t => `<p>${linkify(t).replace(/\n/g, '<br>')}</p>`;
  const BTN = (t, u) => (u = safeUrl(u)) ? `<p><a href="${esc(u)}" style="display:inline-block;background:${/wa\.me|whatsapp/i.test(u) ? '#25D366' : '#C9962E'};color:#fff;padding:12px 22px;border-radius:999px;text-decoration:none;font-weight:700">${esc(t || 'Find out more')}</a></p>` : '';
  const IMG = u => (u = safeUrl(u)) ? `<p><img src="${esc(u)}" alt="" style="max-width:100%;border-radius:8px"></p>` : '';

  /* ---- CSV: header row, one section per row ---- */
  function parseCSV(text) {
    const rows = []; let row = [], cell = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c; }
      else if (c === '"') q = true;
      else if (c === ',') { row.push(cell); cell = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
      else cell += c;
    }
    if (cell || row.length) { row.push(cell); rows.push(row); }
    return rows.filter(r => r.some(c => c.trim()));
  }
  function fromCSV(text) {
    const [head, ...rows] = parseCSV(text.replace(/^﻿/, ''));
    if (!head) throw new Error('The CSV is empty.');
    const keys = head.map(h => h.trim().toLowerCase().replace(/[\s-]+/g, '_'));
    const known = ['subject','from_name','from_email','reply_to','heading','text','image_url','button_text','button_url'];
    if (!keys.some(k => known.includes(k))) throw new Error('CSV first row must be column names: ' + known.join(', ') + '. Download the CSV template.');
    const recs = rows.map(r => Object.fromEntries(keys.map((k, i) => [k, (r[i] || '').trim()])));
    const first = k => recs.find(r => r[k])?.[k] || '';
    const body = recs.map(r => (r.heading ? H2(r.heading) : '') + IMG(r.image_url) + (r.text ? r.text.split(/\n\s*\n/).map(P).join('') : '') + BTN(r.button_text, r.button_url)).join('\n');
    return { subject: first('subject') || first('heading'), body, fromName: first('from_name'), from: first('from_email'), reply: first('reply_to'), branded: true, note: recs.length + ' section(s)' };
  }

  /* ---- HTML: keep the design, drop scripts and our own wrapper/footer ---- */
  function fromHTML(text) {
    const doc = new DOMParser().parseFromString(text, 'text/html');
    doc.querySelectorAll('script,iframe,object,embed,form,meta,link,base').forEach(e => e.remove());
    doc.querySelectorAll('*').forEach(e => [...e.attributes].forEach(a => { if (/^on/i.test(a.name) || /^\s*javascript:/i.test(a.value)) e.removeAttribute(a.name); }));
    const subject = doc.title.trim() || doc.querySelector('h1,h2')?.textContent.trim() || '';
    let root = doc.body;
    const foot = [...doc.querySelectorAll('p')].find(p => /joined Anwar Barayil's newsletter/i.test(p.textContent));
    if (foot) { root = foot.parentElement; foot.remove(); } // re-imported sample: unwrap, wrapHtml adds the footer again
    const styles = [...doc.querySelectorAll('style')].map(s => s.outerHTML).join('');
    if (!root.textContent.trim() && !root.querySelector('img')) throw new Error('The HTML file has no visible content.');
    return { subject, body: (styles + root.innerHTML).trim(), branded: false, note: 'HTML design kept' };
  }

  /* ---- plain text (txt and PDF): first line = subject, short stand-alone lines = headings ---- */
  function fromLines(paras) {
    paras = paras.map(p => p.trim()).filter(Boolean);
    if (!paras.length) throw new Error('No text found. A scanned PDF is an image: paste the text instead.');
    const subject = paras.shift();
    const body = H2(subject) + '\n' + paras.map(p => p.length < 70 && !/[.,:;]$/.test(p) && !p.includes('\n') ? H2(p) : P(p)).join('\n');
    return { subject, body, branded: true, note: paras.length + 1 + ' paragraph(s)' };
  }
  const fromText = t => fromLines(t.replace(/\r/g, '').split(/\n\s*\n/));

  let pdfjs;
  async function loadPdfJs() {
    if (pdfjs) return pdfjs;
    await new Promise((ok, bad) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = ok; s.onerror = () => bad(new Error('Could not load the PDF reader. Check the connection.')); document.head.append(s); });
    pdfjs = window.pdfjsLib; pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return pdfjs;
  }
  // shortcut: PDF images and exact fonts are not carried over (text + links only); add pictures with Insert image
  async function fromPDF(buf) {
    const pdf = await (await loadPdfJs()).getDocument({ data: buf }).promise;
    const paras = []; let cur = '', lastY = null, lastH = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const items = (await (await pdf.getPage(n)).getTextContent()).items.filter(i => i.str !== undefined);
      for (const it of items) {
        const y = it.transform[5], h = Math.abs(it.transform[3]) || lastH;
        if (lastY !== null && Math.abs(lastY - y) > 1) {            // new line
          const gap = Math.abs(lastY - y);
          if (gap > Math.max(h, lastH) * 1.6 || Math.abs(h - lastH) > 1.5) { paras.push(cur); cur = ''; } // blank gap or font-size change = new paragraph
          else cur += cur.endsWith('-') ? '' : ' ';
        }
        cur += it.str; lastY = y; lastH = h;
      }
      paras.push(cur); cur = ''; lastY = null;
    }
    const r = fromLines(paras.map(p => p.replace(/\s+/g, ' ')));
    r.note = pdf.numPages + ' page(s), ' + r.note;
    return r;
  }

  async function read(file) {
    const name = file.name.toLowerCase();
    if (file.size > 10 * 1024 * 1024) throw new Error('File is over 10 MB.');
    if (name.endsWith('.pdf')) return fromPDF(await file.arrayBuffer());
    const text = await file.text();
    if (name.endsWith('.csv')) return fromCSV(text);
    if (/\.html?$/.test(name)) return fromHTML(text);
    if (name.endsWith('.txt')) return fromText(text);
    throw new Error('Use a .pdf, .html, .csv or .txt file.');
  }
  return { read, parseCSV, fromCSV, fromHTML, fromText };
})();
