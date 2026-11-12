/* Appointment picker, ported from azizsaif.com/contact: 30-min slots in India time (IST, UTC+5:30, no DST).
   Drop <details class="appt"></details> on a page and load this file. Stays a small pill until clicked.
   Sends via the site's FormSubmit key (aziz@ inbox, cc Anwar) with a one-click Google Calendar link. */
(()=>{const START=10*60,END=19*60,STEP=30,DAYS=14,LEAD=120,OFF=330,ENDPOINT='https://formsubmit.co/ajax/c411e0fd2158ffd37fb38dbcb99b501c';
const css=`.appt{display:inline-block;max-width:100%;margin:14px 0;vertical-align:top}
.appt>summary{list-style:none;display:inline-flex;align-items:center;gap:8px;cursor:pointer;background:#0F2A47;color:#fff;border-radius:99px;padding:10px 18px;font-weight:800;font-size:15px;transition:transform .2s}
.appt>summary::-webkit-details-marker{display:none}.appt>summary:hover{transform:translateY(-2px)}.appt[open]>summary{background:#C9962E;color:#141414}
.appt-b{margin-top:10px;width:min(520px,calc(100vw - 32px));box-sizing:border-box;background:#fff;border:1px solid #E8E1CF;border-radius:14px;padding:16px;box-shadow:0 14px 40px rgba(15,42,71,.12);animation:apin .3s}
@keyframes apin{from{opacity:0;transform:translateY(-6px)}}
.ap-l{font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#C9962E;margin:0 0 8px;display:flex;justify-content:space-between}.ap-l span{color:#5E6670;letter-spacing:0;text-transform:none;font-weight:600}
.ap-d{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:12px;scrollbar-width:thin}
.ap-d button,.ap-s button{border:1.5px solid #E8E1CF;background:#FBF8F1;border-radius:10px;cursor:pointer;font:inherit;color:#141414}
.ap-d button{flex:none;padding:6px 10px;font-size:12px;line-height:1.2;text-align:center}.ap-d b{display:block;font-size:17px}
.ap-s{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:6px;margin-bottom:12px}.ap-s button{padding:7px 4px;font-weight:700;font-size:14px}.ap-s small{display:block;font-weight:500;font-size:10px;color:#5E6670}
.ap-d button.on,.ap-s button.on{background:#0F2A47;border-color:#0F2A47;color:#fff}.ap-s button.on small{color:#E9C77A}.ap-d button:hover,.ap-s button:hover{border-color:#C9962E}
.ap-f{display:grid;grid-template-columns:1fr 1fr;gap:6px}.ap-f input{font:inherit;font-size:14px;padding:9px 10px;border:1.5px solid #E8E1CF;border-radius:9px;min-width:0}
.ap-f input:last-of-type{grid-column:1/-1}.ap-f button{grid-column:1/-1;background:#C9962E;border:0;border-radius:99px;padding:11px;font:800 15px inherit;cursor:pointer}
.ap-m{font-size:13px;margin:8px 0 0;color:#5E6670}.ap-m.ok{color:#1a7f3c;font-weight:700}
@media (max-width:480px){.ap-f{grid-template-columns:1fr}}`;
document.head.insertAdjacentHTML('beforeend','<style>'+css+'</style>');
const pad=n=>String(n).padStart(2,'0'),hm=m=>{const h=Math.floor(m/60);return (h%12||12)+':'+pad(m%60)+(h<12?' am':' pm')};
const inst=(d,m)=>new Date(d.u+(m-OFF)*60000),same=new Date().getTimezoneOffset()===-OFF;
const loc=t=>t.toLocaleTimeString([],{hour:'numeric',minute:'2-digit'});
const days=[];{const n=new Date(Date.now()+OFF*60000);for(let i=0;days.length<DAYS;i++){const u=Date.UTC(n.getUTCFullYear(),n.getUTCMonth(),n.getUTCDate()+i),w=new Date(u);if(w.getUTCDay()===0)continue;
days.push({u,lab:w.toLocaleDateString('en-IN',{weekday:'short',timeZone:'UTC'}),d:w.getUTCDate(),mon:w.toLocaleDateString('en-IN',{month:'short',timeZone:'UTC'})})}}
const slots=d=>{const a=[];for(let m=START;m<END;m+=STEP){const t=inst(d,m);if(t-Date.now()>LEAD*60000)a.push({m,t})}return a};
document.querySelectorAll('details.appt').forEach(el=>{
el.innerHTML='<summary>&#128197; Book a 30-min call with Anwar</summary><div class="appt-b"><p class="ap-l">1 · Day <span>India time (IST)</span></p><div class="ap-d"></div><p class="ap-l">2 · Time'+(same?'':' <span>your time below</span>')+'</p><div class="ap-s"></div><form class="ap-f" hidden><input name="Name" placeholder="Your name" required autocomplete="name"><input name="WhatsApp" type="tel" placeholder="WhatsApp number" required autocomplete="tel" pattern="[0-9+ \\(\\)\\-]{8,}"><input name="Company" placeholder="College or company (optional)" autocomplete="organization"><button>Request this slot</button></form><p class="ap-m"></p></div>';
const D=el.querySelector('.ap-d'),S=el.querySelector('.ap-s'),F=el.querySelector('form'),M=el.querySelector('.ap-m');
const open=days.filter(d=>slots(d).length);let di=0,pick=null;
const rd=()=>{D.innerHTML=open.map((d,i)=>`<button type="button" data-i="${i}" class="${i===di?'on':''}">${d.lab}<b>${d.d}</b>${d.mon}</button>`).join('')};
const rs=()=>{S.innerHTML=slots(open[di]).map(s=>`<button type="button" data-m="${s.m}" class="${pick&&pick.d===di&&pick.m===s.m?'on':''}">${hm(s.m)}${same?'':'<small>'+loc(s.t)+'</small>'}</button>`).join('')};
D.onclick=e=>{const b=e.target.closest('button');if(!b)return;di=+b.dataset.i;rd();rs()};
S.onclick=e=>{const b=e.target.closest('button');if(!b)return;pick={d:di,m:+b.dataset.m};rs();F.hidden=false;M.className='ap-m';M.textContent=open[di].lab+' '+open[di].d+' '+open[di].mon+', '+hm(pick.m)+' IST. Now your name and number.';F.Name.focus()};
F.onsubmit=async e=>{e.preventDefault();if(!F.reportValidity())return;const d=open[pick.d],t=inst(d,pick.m),t2=new Date(+t+30*60000),z=x=>x.toISOString().replace(/[-:]|\.\d{3}/g,'');
const v=Object.fromEntries(new FormData(F)),when=d.lab+' '+d.d+' '+d.mon+', '+hm(pick.m)+' IST';let n=v.WhatsApp.replace(/[^0-9]/g,'');if(n.length===10)n='91'+n;
const cal='https://calendar.google.com/calendar/render?action=TEMPLATE&text='+encodeURIComponent('Call: '+v.Name+(v.Company?' ('+v.Company+')':''))+'&dates='+z(t)+'/'+z(t2)+'&ctz=Asia/Kolkata&details='+encodeURIComponent('WhatsApp: https://wa.me/'+n+'\nBooked on '+location.href);
const b=F.querySelector('button');b.disabled=true;b.textContent='Sending…';
try{const r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json',Accept:'application/json'},body:JSON.stringify({_subject:'Appointment request: '+v.Name+', '+when,_cc:'anwar.barayil@gmail.com',_template:'table',_captcha:'false',
Requested_time_IST:when,Their_local_time:t.toLocaleString(),Name:v.Name,WhatsApp:v.WhatsApp,Message_link:'https://wa.me/'+n,Company:v.Company||'',Add_to_calendar:cal,Next_step:'WhatsApp them to confirm this slot or suggest the nearest free one.',Page:location.href})});
if(!r.ok)throw 0;F.hidden=true;S.innerHTML='';D.innerHTML='';M.className='ap-m ok';M.textContent='Requested: '+when+'. Anwar will confirm on WhatsApp.'}
catch(_){b.disabled=false;b.textContent='Request this slot';M.innerHTML='Could not send. <a href="https://wa.me/919840244034?text='+encodeURIComponent('Hello Anwar, can we talk on '+when+'? '+v.Name)+'">Ask on WhatsApp instead</a>.'}};
el.addEventListener('toggle',()=>{if(el.open&&!D.innerHTML&&!M.classList.contains('ok')){rd();rs()}});
});})();
