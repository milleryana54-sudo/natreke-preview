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
  if(story){const rect=story.getBoundingClientRect();const length=Math.max(1,rect.height-innerHeight);const fraction=Math.max(0,Math.min(1,-rect.top/length));const index=Math.min(2,Math.floor(fraction*3));if(index!==currentScene){currentScene=index;storyLayers.forEach((el,i)=>el.classList.toggle('is-current',i===index));storyCopies.forEach((el,i)=>el.classList.toggle('is-current',i===index));storyBars.forEach((el,i)=>el.classList.toggle('is-current',i===index));if(storyCounter)storyCounter.textContent=String(index+1).padStart(2,'0')+' / 03';}}
 }
 function requestScroll(){if(!scrollPending){scrollPending=true;requestAnimationFrame(updateScroll)}}
 addEventListener('scroll',requestScroll,{passive:true});addEventListener('resize',requestScroll,{passive:true});updateScroll();
 if(heroVideo){heroVideo.play().catch(()=>{});document.addEventListener('visibilitychange',()=>{if(document.hidden)heroVideo.pause();else heroVideo.play().catch(()=>{})})}
 // A working procedural 3D globe, rendered in Canvas with mathematical 3D projection.
 // The latitude/longitude pins are geographic reference points, not invented itineraries.
 const canvas=document.getElementById('travelGlobe');if(!canvas)return;
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const pins=[{lat:41.2,lng:74.8,name:'КЫРГЫЗСТАН',color:'#f2ac8b'}, {lat:28.4,lng:84.1,name:'НЕПАЛ',color:'#f2ac8b'}, {lat:-8.45,lng:115.2,name:'БАЛИ',color:'#f2ac8b'}];
 let width=0,height=0,dpr=1,lastTime=0,active=true,lngCenter=99,pitch=0.18,drag=false,oldX=0,oldY=0;
 function resize(){const rect=canvas.getBoundingClientRect();width=Math.round(rect.width);height=Math.round(rect.height);if(!width||!height)return;dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);ctx.setTransform(dpr,0,0,dpr,0,0)}
 function project(lat,lng,r){const phi=lat*Math.PI/180;const theta=(lng-lngCenter)*Math.PI/180;const x=r*Math.cos(phi)*Math.sin(theta),y=-r*Math.sin(phi),z=r*Math.cos(phi)*Math.cos(theta);const yp=y*Math.cos(pitch)-z*Math.sin(pitch),zp=y*Math.sin(pitch)+z*Math.cos(pitch);const scale=1+zp/(r*9);return{x:width/2+x*scale,y:height/2+yp*scale,z:zp};}
 function wire(points,strokeWidth,color,r){ctx.beginPath();let drawing=false;for(const coord of points){const p=project(coord[0],coord[1],r);if(p.z>r*.012){if(!drawing)ctx.moveTo(p.x,p.y);else ctx.lineTo(p.x,p.y);drawing=true;}else drawing=false;}ctx.strokeStyle=color;ctx.lineWidth=strokeWidth;ctx.stroke();}
 function draw(t){if(!active||!width||!height)return;ctx.clearRect(0,0,width,height);const r=Math.min(width*.43,height*.43,295);if(!drag&&!reduced){const dt=Math.min(40,t-lastTime||16);lngCenter+=dt*.00038;}lastTime=t;
  // Shaded sphere, with physically oriented surface grid.
  const shading=ctx.createRadialGradient(width/2-r*.35,height/2-r*.39,r*.08,width/2,height/2,r*1.08);shading.addColorStop(0,'#2d49487a');shading.addColorStop(.61,'#1c34365a');shading.addColorStop(1,'#071417e0');ctx.beginPath();ctx.arc(width/2,height/2,r,0,Math.PI*2);ctx.fillStyle=shading;ctx.fill();ctx.strokeStyle='#8ba9a333';ctx.lineWidth=1.4;ctx.stroke();
  ctx.beginPath();ctx.ellipse(width/2,height/2,r*1.23,r*.38,-.32,0,Math.PI*2);ctx.strokeStyle='#c46b4938';ctx.lineWidth=1.15;ctx.stroke();
  for(let lat=-75;lat<=75;lat+=15){const points=[];for(let lng=-180;lng<=180;lng+=2)points.push([lat,lng]);wire(points,lat===0?1.2:.65,lat===0?'#c46b4988':'#9cb5b33b',r)}
  for(let lng=-180;lng<180;lng+=15){const points=[];for(let lat=-88;lat<=88;lat+=2)points.push([lat,lng]);wire(points,.7,'#9cb5b344',r)}
  // One pin for each actual destination; slight radial offset prevents globe marker clipping.
  for(const pin of pins){const p=project(pin.lat,pin.lng,r);if(p.z<0)continue;const ring=(Math.sin(t*.0018)*.5+.5)*5+9;ctx.beginPath();ctx.arc(p.x,p.y,ring,0,Math.PI*2);ctx.strokeStyle='#db805573';ctx.lineWidth=1;ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,4.5,0,Math.PI*2);ctx.fillStyle=pin.color;ctx.shadowColor=pin.color;ctx.shadowBlur=17;ctx.fill();ctx.shadowBlur=0;ctx.font='700 10px Manrope,Arial,sans-serif';ctx.letterSpacing='1px';const labelX=p.x+14,labelY=p.y-11;ctx.fillStyle='#eef4ef';ctx.fillText(pin.name,labelX,labelY);}
  if(!reduced)requestAnimationFrame(draw);
 }
 function resetGlobe(){resize();draw(performance.now())}
 canvas.addEventListener('pointerdown',e=>{drag=true;oldX=e.clientX;oldY=e.clientY;canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('pointermove',e=>{if(!drag)return;lngCenter-=(e.clientX-oldX)*.28;pitch=Math.max(-.55,Math.min(.55,pitch+(e.clientY-oldY)*.004));oldX=e.clientX;oldY=e.clientY;if(reduced)draw(performance.now())});
 ['pointerup','pointercancel','lostpointercapture'].forEach(type=>canvas.addEventListener(type,()=>{drag=false}));
 if('ResizeObserver' in window)new ResizeObserver(resetGlobe).observe(canvas);else addEventListener('resize',resetGlobe);
 const globeObserver=('IntersectionObserver' in window)?new IntersectionObserver(entries=>{active=entries[0].isIntersecting;if(active&&!reduced)requestAnimationFrame(draw)}):null;if(globeObserver)globeObserver.observe(canvas);
 resize();if(reduced)draw(0);else requestAnimationFrame(draw);
})();
