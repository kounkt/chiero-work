(() => {
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const toggle=document.querySelector('body.hub #motion-toggle,body.coaching #motion-toggle');
 let paused=media.matches;
 const sync=()=>{document.documentElement.classList.toggle('motion-paused',paused);if(toggle){toggle.textContent=paused?'動きを再開する':'動きを止める';toggle.setAttribute('aria-pressed',String(paused));}if(paused)document.querySelectorAll('.pending').forEach(e=>e.classList.remove('pending'));};
 toggle?.addEventListener('click',()=>{paused=!paused;sync();});media.addEventListener('change',e=>{paused=e.matches;sync();});sync();
 if('IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.remove('pending');observer.unobserve(e.target);}}),{threshold:.08});document.querySelectorAll('.reveal').forEach(e=>{if(e.getBoundingClientRect().top>innerHeight&&!paused)e.classList.add('pending');observer.observe(e);});}
 const questions=[['どれが、正解なんだろう。','この選択で、<br><em>何を大切にしたい？</em>','正しさを探すところから、自分の判断の軸を確かめるところへ。'],['続けるべき？ やめるべき？','続けたいものと、<br><em>手放したいものは？</em>','ひとつの二択にしていたことを、分けて眺めてみる。'],['どうしたら、期待に応えられる？','その期待は、<br><em>自分も望んでいる？</em>','人からの期待と、自分の望み。その重なりと違いを確かめる。']];
 document.querySelectorAll('[data-question]').forEach(button=>button.addEventListener('click',()=>{const n=Number(button.dataset.question);document.querySelectorAll('[data-question]').forEach(b=>{b.classList.toggle('selected',b===button);b.setAttribute('aria-pressed',String(b===button));});document.querySelector('#old-question').textContent=questions[n][0];document.querySelector('#new-question').innerHTML=questions[n][1];document.querySelector('#question-note').textContent=questions[n][2];document.querySelector('#question-index').textContent=String(n+1).padStart(2,'0');}));
 const dialog=document.querySelector('#booking-dialog');let trigger=null;
 const bookingLink=document.querySelector('#booking-next');
 const selectTheme=()=>{const type=dialog.querySelector('input:checked')?.value||'undecided';const url=new URL('https://apply.chiero.jp/p/UIA2tAAbI1rW');url.searchParams.set('utm_source','work-chiero');url.searchParams.set('utm_content',type);bookingLink.href=url.toString();};
 const open=(type,button)=>{trigger=button;dialog.querySelectorAll('input[name=theme]').forEach(r=>r.checked=r.value===type);selectTheme();dialog.showModal();document.body.classList.add('dialog-open');};
 dialog?.querySelector('.dialog-close').addEventListener('click',()=>dialog.close());
 dialog?.addEventListener('change',selectTheme);
 dialog?.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
 dialog?.addEventListener('close',()=>{document.body.classList.remove('dialog-open');trigger?.focus();});
 document.addEventListener('click',event=>{const book=event.target.closest('[data-book]');if(book){event.preventDefault();document.querySelectorAll('.service-menu[open]').forEach(m=>m.open=false);open(book.dataset.book,book);}});
 document.querySelectorAll('.service-menu').forEach(menu=>{menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.open=false));document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.open){menu.open=false;menu.querySelector('summary').focus();}});document.addEventListener('click',e=>{if(menu.open&&!menu.contains(e.target))menu.open=false;});});
 const sticky=document.querySelector('.coaching .mobile-sticky');if(sticky){const hero=document.querySelector('.coach-hero'),start=document.querySelector('#start'),final=document.querySelector('.final-conversation');let scheduled=false;const update=()=>{scheduled=false;const a=start.getBoundingClientRect(),b=final.getBoundingClientRect();sticky.hidden=hero.getBoundingClientRect().bottom>0||(a.top<innerHeight&&a.bottom>0)||(b.top<innerHeight);};addEventListener('scroll',()=>{if(!scheduled){scheduled=true;requestAnimationFrame(update);}},{passive:true});addEventListener('resize',update);update();}
})();
