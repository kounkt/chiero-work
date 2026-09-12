/* Only allowlisted events and labels are sent. No form values or full referrers. */
(() => {
 const local=['127.0.0.1','localhost'].includes(location.hostname);
 const api=local?'http://127.0.0.1:8791':'https://chiero-workbook-service.nkt1214.workers.dev';
 const storage={get(k){try{return sessionStorage.getItem(k)||'';}catch{return '';}},set(k,v){try{sessionStorage.setItem(k,v);}catch{}}};
 const valid=s=>/^[a-zA-Z0-9_./-]{0,80}$/.test(s)?s:'';
 const params=new URLSearchParams(location.search);
 let source=valid(params.get('utm_source')||'');
 if(!source){try{const h=new URL(document.referrer).hostname;source=h.includes('instagram.com')?'instagram':h.includes('threads.')?'threads':h==='t.co'||h==='x.com'?'x':h==='note.com'?'note':h==='chiero.jp'?'corporate':'';}catch{}}
 if(source)storage.set('chiero-lead-source',source);
 const placement=valid(params.get('from')||'');if(placement)storage.set('chiero-lead-entry',placement);
 const hash=new URLSearchParams(location.hash.slice(1));const receipt=hash.get('receipt');
 if(receipt && /^[a-f0-9-]{36}\.[A-Za-z0-9_-]{43}$/.test(receipt)){
  storage.set('chiero-lead-receipt',receipt);history.replaceState(null,'',location.pathname+location.search+(location.pathname==='/'?'#pricing':''));
 }
 function track(event,where=''){
  if(navigator.globalPrivacyControl || navigator.doNotTrack==='1')return;
  const body=JSON.stringify({id:crypto.randomUUID(),event,page:location.pathname,placement:valid(where),referrerSource:storage.get('chiero-lead-source'),receipt:storage.get('chiero-lead-receipt')});
  fetch(api+'/events',{method:'POST',headers:{'Content-Type':'application/json'},body,keepalive:true}).catch(()=>{});
 }
 window.chieroFunnel={track,source:()=>storage.get('chiero-lead-source'),placement:()=>storage.get('chiero-lead-entry'),accept(receipt){storage.set('chiero-lead-receipt',receipt);}};
 if(!location.pathname.includes('/privacy/'))track('page_view');
 document.addEventListener('click',event=>{
  const a=event.target.closest('a');if(!a)return;
  let kind=a.dataset.funnel;
  if(!kind){const h=a.getAttribute('href')||'';kind=h.includes('apply.chiero.jp')?'booking_click':h.includes('lin.ee')?'line_click':h.includes('/ai-kit/')?'kit_click':h.includes('/workbook/')?'workbook_click':h.includes('/worksheet/')?'worksheet_click':h.startsWith('mailto:')?'email_click':'';}
  if(kind){const fallback=a.closest('section')?.id||'other';const where=a.dataset.placement||a.dataset.bookingLocation||fallback;track(kind,where);if(kind==='kit_click')storage.set('chiero-lead-entry',valid(where));}
 });
 const form=document.querySelector('[data-workbook-form]');
 if(form){if(local)form.dataset.api=api;let seen=false;const observer=new IntersectionObserver(entries=>{if(!seen&&entries.some(e=>e.isIntersecting)){seen=true;track('registration_view',form.dataset.source||'workbook');observer.disconnect();}},{threshold:.15});observer.observe(form);}
 const copy=document.querySelector('[data-copy-line]');
 copy?.addEventListener('click',async()=>{const status=document.querySelector('[data-copy-status]');try{await navigator.clipboard.writeText(document.querySelector('#line-first-message').textContent);status.textContent='コピーしました。LINEのトークに貼り付けて、続きをどうぞ。';}catch{status.textContent='コピーできませんでした。上の文章を選択してコピーしてください。';}});
})();
