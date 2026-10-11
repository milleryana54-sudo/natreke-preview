/* NATREKE / Satellite Earth globe. Source: NASA Blue Marble Next Generation.
   Local texture; no 3rd-party scripts, trackers or external API calls. */
(()=>{
  'use strict';
  const canvas=document.getElementById('travelGlobe');
  const wrap=canvas?.closest('.globe-block');
  const markers=document.getElementById('globeMarkers');
  if(!canvas||!wrap)return;
  const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:false,preserveDrawingBuffer:false}) || canvas.getContext('experimental-webgl',{alpha:true,antialias:true});
  // Canvas 2D fallback for devices/browsers without WebGL; still a real rotating Earth.
  function initCanvasGlobe(){
    const ctx=canvas.getContext('2d');if(!ctx)return;
    const photo=new Image();photo.decoding='async';
    let tex=null,tw=0,th=0,w=0,h=0,r=0,yaw=90*Math.PI/180,pitch=.12;
    let drag=false,oldX=0,oldY=0,active=true,prev=0,frame=0;
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
    const dots=[{name:'Кыргызстан',lat:41.2,lng:74.8,href:'kyrgyzstan/'},{name:'Непал',lat:28.4,lng:84.1,href:'nepal/'},{name:'Бали',lat:-8.45,lng:115.2,href:'bali/'}];
    for(const pin of dots){if(!markers)continue;
      const el=document.createElement('a');el.href=pin.href;el.title='Открыть '+pin.name;
      el.className='globe-marker';el.setAttribute('aria-label','Тур '+pin.name);
      el.innerHTML='<span class="globe-marker-dot"></span><span class="globe-marker-label">'+pin.name+'</span>';
      markers.appendChild(el);pin.el=el;
    }
    if(markers)markers.setAttribute('aria-hidden','false');
    const raster=document.createElement('canvas'),S=224;raster.width=raster.height=S;const rctx=raster.getContext('2d');
    const out=rctx.createImageData(S,S);
    function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;r=Math.min(w,h)*.425;
      if(w>10&&h>10){const pixelRatio=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.round(w*pixelRatio);canvas.height=Math.round(h*pixelRatio);ctx.setTransform(pixelRatio,0,0,pixelRatio,0,0)}
      draw();}
    function draw(){if(!tex||!r||!w||!h)return;
      const cp=Math.cos(pitch),sp=Math.sin(pitch);const tdata=tex;const d=out.data;
      for(let iy=0;iy<S;iy++){
        const y=(S/2-iy-.5)/(S*.5);
        for(let ix=0;ix<S;ix++){
          const x=(ix+.5-S/2)/(S*.5),r2=x*x+y*y,k=(iy*S+ix)*4;
          if(r2>=1){d[k+3]=0;continue;}
          const z=Math.sqrt(1-r2),worldY=y*cp+z*sp,worldZ=-y*sp+z*cp;
          const lat=Math.asin(Math.max(-1,Math.min(1,worldY)));
          const lng=Math.atan2(x,worldZ)+yaw;
          const u=((lng/(Math.PI*2)+.5)%1+1)%1;
          const v=Math.max(0,Math.min(.9999,.5-lat/Math.PI));
          const px=Math.min(tw-1,Math.floor(u*tw)),py=Math.min(th-1,Math.floor(v*th));
          const idx=(py*tw+px)*4;
          const intensity=.49+.64*Math.max(0,(-.5*x+.67*y+1.5*z)/1.72);
          d[k]=Math.min(255,tdata[idx]*intensity);d[k+1]=Math.min(255,tdata[idx+1]*intensity);d[k+2]=Math.min(255,tdata[idx+2]*intensity);d[k+3]=255;
        }
      }
      rctx.putImageData(out,0,0);
      ctx.clearRect(0,0,w,h);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
      ctx.drawImage(raster,w/2-r,h/2-r,r*2,r*2);
      for(const pin of dots){if(!pin.el)continue;
        const lat=pin.lat*Math.PI/180,delta=pin.lng*Math.PI/180-yaw;
        const x=Math.cos(lat)*Math.sin(delta),y=Math.sin(lat)*cp-Math.cos(lat)*Math.cos(delta)*sp;
        const z=Math.sin(lat)*sp+Math.cos(lat)*Math.cos(delta)*cp;
        pin.el.style.opacity=z>.04?'1':'0';pin.el.style.pointerEvents=z>.04?'auto':'none';
        pin.el.style.left=w/2+x*r+'px';pin.el.style.top=h/2-y*r+'px';
      }
      wrap.classList.add('is-3d-ready');
    }
    function loop(t){frame=0;if(!active||document.hidden)return;
      if(!prev||t-prev>70){const dt=prev?Math.min(100,t-prev):16;prev=t;if(!drag)yaw=(yaw+dt*.000035)%(Math.PI*2);draw();}
      if(!reduced)frame=requestAnimationFrame(loop);
    }
    photo.onload=()=>{const temp=document.createElement('canvas');temp.width=photo.width;temp.height=photo.height;const tctx=temp.getContext('2d');tctx.drawImage(photo,0,0);tex=tctx.getImageData(0,0,photo.width,photo.height).data;tw=photo.width;th=photo.height;resize();if(!reduced)frame=requestAnimationFrame(loop);};
    photo.src='assets/images/earth-nasa-blue-marble.webp';
    canvas.addEventListener('pointerdown',e=>{drag=true;oldX=e.clientX;oldY=e.clientY;canvas.setPointerCapture(e.pointerId)});
    canvas.addEventListener('pointermove',e=>{if(!drag)return;yaw-=(e.clientX-oldX)*.005;pitch=Math.max(-.55,Math.min(.55,pitch+(e.clientY-oldY)*.004));oldX=e.clientX;oldY=e.clientY;draw()});
    ['pointerup','pointercancel','lostpointercapture'].forEach(n=>canvas.addEventListener(n,()=>{drag=false}));
    if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
    if('IntersectionObserver' in window)new IntersectionObserver(e=>{active=e[0].isIntersecting;if(active&&tex&&!reduced&&!frame){prev=0;frame=requestAnimationFrame(loop)}else if(!active&&frame){cancelAnimationFrame(frame);frame=0}},{threshold:.02}).observe(canvas);
    resize();
  }
  if(!gl){initCanvasGlobe();return;}

  const vs=`attribute vec2 aPos; varying vec2 vUV; void main(){ vUV=aPos*.5+.5; gl_Position=vec4(aPos,0.,1.); }`;
  const fs=`precision highp float;
    varying vec2 vUV;
    uniform sampler2D uEarth;
    uniform vec2 uSize;
    uniform float uRadius, uLon, uPitch;
    const float PI=3.141592653589793;
    void main(){
       vec2 xy=((vUV-.5)*uSize)/uRadius;
       float dd=dot(xy,xy);
       if(dd>1.0) discard;
       float z=sqrt(max(0.,1.0-dd));
       vec3 n=vec3(xy,z);
       float cp=cos(uPitch),sp=sin(uPitch);
       vec3 earth=vec3(n.x,n.y*cp+n.z*sp,-n.y*sp+n.z*cp);
       float lat=asin(clamp(earth.y,-1.,1.));
       float lon=atan(earth.x,earth.z)+uLon;
       vec2 textureUV=vec2(fract(lon/(2.*PI)+.5),clamp(lat/PI+.5,.001,.999));
       vec3 color=texture2D(uEarth,textureUV).rgb;
       // Sunlight comes from the upper left; preserve the satellite's natural colors.
       float diffuse=max(dot(n,normalize(vec3(-.5,.67,1.5))),0.);
       float brightness=.49+.64*diffuse;
       color*=brightness;
       float oceanGlow=pow(1.-z,3.)*.12;
       color+=vec3(.06,.22,.30)*oceanGlow;
       gl_FragColor=vec4(color,1.);
    }`;
  function shader(type,source){const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS)){console.warn('Globe shader',gl.getShaderInfoLog(sh));gl.deleteShader(sh);return null;}return sh;}
  const vertex=shader(gl.VERTEX_SHADER,vs),frag=shader(gl.FRAGMENT_SHADER,fs);
  if(!vertex||!frag)return;
  const prog=gl.createProgram();gl.attachShader(prog,vertex);gl.attachShader(prog,frag);gl.linkProgram(prog);
  if(!gl.getProgramParameter(prog,gl.LINK_STATUS))return;
  gl.useProgram(prog);
  const corners=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,corners);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const loc=gl.getAttribLocation(prog,'aPos');gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
  const sz=gl.getUniformLocation(prog,'uSize'),rad=gl.getUniformLocation(prog,'uRadius'),lonU=gl.getUniformLocation(prog,'uLon'),pitchU=gl.getUniformLocation(prog,'uPitch');
  let w=0,h=0,r=0,lon=90*Math.PI/180,pitch=.12,textureReady=false,dragging=false,lastX=0,lastY=0;
  let inView=true,prev=0,frame=0;
  const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
  const pins=[
    {name:'Кыргызстан',lat:41.2,lng:74.8,href:'kyrgyzstan/'},
    {name:'Непал',lat:28.4,lng:84.1,href:'nepal/'},
    {name:'Бали',lat:-8.45,lng:115.2,href:'bali/'}
  ];
  if(markers){
    for(const pin of pins){const el=document.createElement('a');el.className='globe-marker';el.href=pin.href;el.title='Открыть путешествие: '+pin.name;el.setAttribute('aria-label','Тур: '+pin.name);el.innerHTML='<span class="globe-marker-dot"></span><span class="globe-marker-label">'+pin.name+'</span>';markers.appendChild(el);pin.el=el;}
    markers.setAttribute('aria-hidden','false');
  }
  function resize(){const bounds=canvas.getBoundingClientRect();w=bounds.width;h=bounds.height; if(w<5||h<5)return;
    const dpr=Math.min(window.devicePixelRatio||1,window.innerWidth<800?1.6:2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);gl.viewport(0,0,canvas.width,canvas.height);
    r=Math.min(w,h)*.425;
    gl.uniform2f(sz,w,h);gl.uniform1f(rad,r);
    if(textureReady)render();
  }
  function drawPins(){
    const cp=Math.cos(pitch),sp=Math.sin(pitch);
    for(const pin of pins){if(!pin.el)continue;
      const latitude=pin.lat*Math.PI/180,delta=pin.lng*Math.PI/180-lon;
      const x=Math.cos(latitude)*Math.sin(delta);
      const y=Math.sin(latitude)*cp-Math.cos(latitude)*Math.cos(delta)*sp;
      const z=Math.sin(latitude)*sp+Math.cos(latitude)*Math.cos(delta)*cp;
      const visible=z>.04;
      pin.el.style.opacity=visible?'1':'0';pin.el.style.pointerEvents=visible?'auto':'none';
      pin.el.style.left=(w/2+x*r)+'px';pin.el.style.top=(h/2-y*r)+'px';
    }
  }
  function render(){if(!textureReady||!w||!h)return;
    gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.useProgram(prog);
    gl.uniform1f(lonU,lon);gl.uniform1f(pitchU,pitch);gl.drawArrays(gl.TRIANGLES,0,6);drawPins();
  }
  const texture=gl.createTexture();const img=new Image();img.decoding='async';
  img.onload=()=>{
    gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.REPEAT);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    gl.generateMipmap(gl.TEXTURE_2D);gl.uniform1i(gl.getUniformLocation(prog,'uEarth'),0);
    textureReady=true;wrap.classList.add('is-3d-ready');resize();render();
    if(!reduced)frame=requestAnimationFrame(loop);
  };
  img.onerror=()=>console.warn('NATREKE Earth texture did not load');
  img.src='assets/images/earth-nasa-blue-marble.webp';
  function loop(t){frame=0;if(!inView||document.hidden)return;
    const interval=window.innerWidth<800?44:30;
    if(!prev||t-prev>interval){const dt=prev?Math.min(t-prev,65):16;prev=t;
      if(!dragging){lon=(lon+dt*.000035)%(Math.PI*2);}render();}
    frame=requestAnimationFrame(loop);
  }
  function dragEnd(){dragging=false;}
  canvas.addEventListener('pointerdown',e=>{dragging=true;lastX=e.clientX;lastY=e.clientY;canvas.setPointerCapture(e.pointerId);});
  canvas.addEventListener('pointermove',e=>{if(!dragging)return;
    lon-=(e.clientX-lastX)*.005;pitch=Math.max(-.55,Math.min(.55,pitch+(e.clientY-lastY)*.004));lastX=e.clientX;lastY=e.clientY;render();
  });
  ['pointerup','pointercancel','lostpointercapture'].forEach(event=>canvas.addEventListener(event,dragEnd));
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();wrap.classList.remove('is-3d-ready');cancelAnimationFrame(frame)});
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(canvas);else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>{inView=entries[0].isIntersecting;
    if(inView&&textureReady&&!reduced&&!frame){prev=0;frame=requestAnimationFrame(loop)}
    if(!inView&&frame){cancelAnimationFrame(frame);frame=0;}
  },{threshold:.05});io.observe(canvas);}
  document.addEventListener('visibilitychange',()=>{if(!document.hidden&&inView&&textureReady&&!reduced&&!frame){prev=0;frame=requestAnimationFrame(loop)}});
  resize();
})();
