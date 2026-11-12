/* Lead gate: 4 one-line questions, then emails Anwar a "connect" reminder and unlocks the page.
   Usage: abGate.on(fn) runs fn once unlocked; abGate.open('what they unlocked') shows the form.
   shortcut: client-side only, the files are still public at their URLs. A real lock needs signed URLs. */
(()=>{const K='ab-unlocked',subs=[];
const has=()=>{try{return !!(localStorage.getItem(K)||localStorage.getItem('ab-clips'))}catch(_){return false}};
const done=()=>{try{localStorage.setItem(K,'1')}catch(_){}subs.splice(0).forEach(f=>f())};
const css=`#vg{border:0;border-radius:16px;padding:28px;width:min(440px,92vw);box-shadow:0 30px 80px rgba(0,0,0,.35);background:#FBF8F1;color:#141414;font-family:inherit}
#vg::backdrop{background:rgba(10,21,22,.65)}#vg .vg-bar{height:4px;background:#F3EEE2;border-radius:2px;margin:0 0 22px}#vg .vg-bar i{display:block;height:100%;width:0;background:#C9962E;border-radius:2px;transition:width .4s}
#vg .vg-t{font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:#C9962E;margin:0 0 8px}
#vg .vg-q{display:block;font:700 26px/1.2 "Cormorant Garamond",Georgia,serif;margin:0 0 14px;animation:vgin .35s}@keyframes vgin{from{opacity:0;transform:translateX(16px)}}
#vgI{width:100%;font:inherit;font-size:18px;padding:12px 14px;border:1.5px solid #E8E1CF;border-radius:10px;box-sizing:border-box;background:#fff}#vgI:focus{outline:2px solid #C9962E;border-color:transparent}
#vg .vg-go{margin-top:14px;display:flex;justify-content:space-between;align-items:center;gap:10px}#vg .vg-go button{background:#0F2A47;color:#fff;border:0;border-radius:99px;padding:11px 22px;font:800 15px inherit;cursor:pointer}
#vg .vg-go span{font-size:12px;color:#5E6670}#vg .vg-x{position:absolute;top:10px;right:14px;background:none;border:0;font-size:24px;cursor:pointer;color:#5E6670}`;
let dlg,what='';
function build(){document.head.insertAdjacentHTML('beforeend','<style>'+css+'</style>');
document.body.insertAdjacentHTML('beforeend','<dialog id="vg" aria-labelledby="vgQ"><button class="vg-x" type="button" aria-label="Close">&times;</button><form id="vgf" novalidate><div class="vg-bar"><i></i></div><p class="vg-t">Free · takes 20 seconds</p><label class="vg-q" id="vgQ" for="vgI"></label><input id="vgI" required><div class="vg-go"><span id="vgN"></span><button>Next &rarr;</button></div></form></dialog>');
dlg=document.getElementById('vg');const f=document.getElementById('vgf'),I=document.getElementById('vgI'),Q=document.getElementById('vgQ'),N=document.getElementById('vgN'),bar=dlg.querySelector('.vg-bar i'),btn=f.querySelector('button');
dlg.querySelector('.vg-x').onclick=()=>dlg.close();
const S=[{k:'Name',q:()=>'First, your name?',t:'text',ac:'name'},{k:'Mobile',q:d=>'Thanks '+d.Name.split(' ')[0]+'. Your WhatsApp number?',t:'tel',ac:'tel',pt:'[0-9+ \\(\\)\\-]{8,}'},{k:'Company',q:()=>'College or company?',t:'text',ac:'organization'},{k:'City',q:()=>'And your city?',t:'text',ac:'address-level2'}];
let i=0,d={};
const show=()=>{const s=S[i];Q.textContent=s.q(d);Q.style.animation='none';Q.offsetWidth;Q.style.animation='';I.type=s.t;I.autocomplete=s.ac;I.value=d[s.k]||'';s.pt?I.pattern=s.pt:I.removeAttribute('pattern');N.textContent='Step '+(i+1)+' of '+S.length;bar.style.width=(i/S.length*100)+'%';I.focus()};
dlg.reset=()=>{i=0;I.hidden=btn.hidden=false;show()};
f.addEventListener('submit',e=>{e.preventDefault();const v=I.value.trim();if(!v||!I.checkValidity()){I.reportValidity();return}
d[S[i].k]=v;if(++i<S.length)return show();
bar.style.width='100%';Q.textContent='Unlocked. Anwar may WhatsApp you once.';I.hidden=btn.hidden=true;N.textContent='';
let n=d.Mobile.replace(/[^0-9]/g,'');if(n.length===10)n='91'+n;const wa='https://wa.me/'+n;
fetch('https://formsubmit.co/ajax/c411e0fd2158ffd37fb38dbcb99b501c',{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:'Reminder to connect: '+d.Name+' ('+d.Company+', '+d.City+') unlocked '+what,_cc:'anwar.barayil@gmail.com',_template:'table',_captcha:'false',
Note:'Hello Anwar, '+d.Name+' from '+d.Company+', '+d.City+' came to anwarbaryil.com and unlocked '+what+'. A short WhatsApp today while it is fresh works best. Tap to message: '+wa,
Name:d.Name,WhatsApp:d.Mobile,Message_link:wa,Company:d.Company,City:d.City,Unlocked:what,Page:location.href})}).catch(()=>{});
done();setTimeout(()=>dlg.close(),1400)})}
window.abGate={unlocked:has,on:f=>has()?f():subs.push(f),open:w=>{if(has())return done();what=w||'the full talk';if(!dlg)build();dlg.showModal();dlg.reset()}};
})();
