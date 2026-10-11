(()=>{
 const doc=document.documentElement;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 doc.classList.add('has-js');
 const header=document.getElementById('header');
 const progress=document.getElementById('scrollProgress');
 const heroMedia=document.getElementById('heroMedia');
 const heroVideo=document.querySelector('.hero-film');
 const toggle=document.getElementById('menuToggle');
 const menu=document.getElementById('mobileMenu');
 function closeMenu(){if(!menu)return;menu.hidden=true;toggle?.setAttribute('aria-expanded','false');toggle?.setAttribute('aria-label','Открыть меню');document.body.classList.remove('menu-open')}
 toggle?.addEventListener('click',()=>{const newOpen=toggle.getAttribute('aria-expanded')!=='true';if(newOpen){menu.hidden=false;document.body.classList.add('menu-open')}else closeMenu();toggle.setAttribute('aria-expanded',String(newOpen));toggle.setAttribute('aria-label',newOpen?'Закрыть меню':'Открыть меню')});
 menu?.querySelectorAll('a').forEach(link=>link.addEventListener('click',closeMenu));
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu?.hidden){closeMenu();toggle?.focus()}});
 // Card depth reacts to the pointer on fine-pointer screens only.
 if(!reduced&&matchMedia('(hover:hover) and (pointer:fine) and (min-width:801px)').matches){
   document.querySelectorAll('.route-card').forEach(card=>{
     card.addEventListener('pointermove',event=>{const rect=card.getBoundingClientRect();const x=(event.clientX-rect.left)/rect.width-.5;const y=(event.clientY-rect.top)/rect.height-.5;card.style.setProperty('--tilt-x',(-y*2.8).toFixed(2)+'deg');card.style.setProperty('--tilt-y',(x*2.8).toFixed(2)+'deg')});
     card.addEventListener('pointerleave',()=>{card.style.setProperty('--tilt-x','0deg');card.style.setProperty('--tilt-y','0deg')});
   });
 }
 const revealNodes=[...document.querySelectorAll('[data-reveal]')];
 if(reduced||!('IntersectionObserver'in window)){revealNodes.forEach(el=>el.classList.add('is-visible'))}
 else{const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}}),{rootMargin:'0px 0px -8% 0px',threshold:.08});revealNodes.forEach(el=>observer.observe(el));}
 const story=document.getElementById('experience');
 const storyLayers=[...document.querySelectorAll('[data-story-layer]')];
 const storyCopies=[...document.querySelectorAll('[data-story-copy]')];
 const storyBars=[...document.querySelectorAll('.story-progress span')];
 const storyCounter=document.getElementById('storyCounter');
 let currentScene=-1,scrollPending=false;
 function updateScroll(){scrollPending=false;const y=window.scrollY||0;
  header?.classList.toggle('is-scrolled',y>55);
  if(progress){const range=Math.max(1,doc.scrollHeight-innerHeight);progress.style.width=((y/range)*100).toFixed(2)+'%';}
  if(heroMedia&&!reduced&&y<innerHeight*1.2){heroMedia.style.transform=`scale(${1.035+y/innerHeight*.075}) translate3d(0,${(y*.11).toFixed(1)}px,0)`;}
  if(story && innerWidth>800){const rect=story.getBoundingClientRect();const length=Math.max(1,rect.height-innerHeight);const fraction=Math.max(0,Math.min(1,-rect.top/length));const index=Math.min(2,Math.floor(fraction*3));if(index!==currentScene){currentScene=index;storyLayers.forEach((el,i)=>el.classList.toggle('is-current',i===index));storyCopies.forEach((el,i)=>el.classList.toggle('is-current',i===index));storyBars.forEach((el,i)=>el.classList.toggle('is-current',i===index));if(storyCounter)storyCounter.textContent=String(index+1).padStart(2,'0')+' / 03';}}
 }
 function requestScroll(){if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll)}}
 // On mobile each story chapter is a real full-height section. Animate when it enters the viewport.
 if('IntersectionObserver' in window){
  const mobileChapters=[...document.querySelectorAll('[data-story-copy]')];
  const chapterWatcher=new IntersectionObserver(es=>es.forEach(e=>{
   if(e.isIntersecting) e.target.classList.add('story-visible');
  }),{threshold:.20,rootMargin:'0px 0px -5% 0px'});
  mobileChapters.forEach(el=>chapterWatcher.observe(el));
 } else document.querySelectorAll('[data-story-copy]').forEach(el=>el.classList.add('story-visible'));
 addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',requestScroll,{passive:true});updateScroll();
 if(heroVideo){heroVideo.play().catch(()=>{});document.addEventListener('visibilitychange',()=>{if(document.hidden)heroVideo.pause();else heroVideo.play().catch(()=>{})})}

})();
