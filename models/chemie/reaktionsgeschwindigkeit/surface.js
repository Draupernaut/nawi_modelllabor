(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const collisionPanel=$('#collisionPanel'),surfacePanel=$('#surfacePanel');
  const collisionActions=$('#collisionActions'),surfaceActions=$('#surfaceActions');
  const tabs=$$('[data-model-mode]');
  const arena=$('#surfaceArena'),ctx=arena.getContext('2d'),graph=$('#surfaceGraph'),g=graph.getContext('2d');
  let DPR=Math.min(devicePixelRatio||1,2),last=performance.now(),initialized=false,running=true;
  let fragments=1,remaining=64,product=0,modelT=0,history=[],graphAcc=0,reactions=[],reagent=[],products=[],flashes=[];
  const COL={A:'#55c8ff',B:'#d9a45a',B2:'#f2c98c',C:'#75e1a8',text:'#eef5ff',muted:'#93a7bf'};
  const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=(n,d=1)=>Number(n).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
  const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1400)};
  function canvasSize(c,cx){const r=c.getBoundingClientRect(),w=Math.max(10,Math.round(r.width*DPR)),h=Math.max(10,Math.round(r.height*DPR));if(c.width!==w||c.height!==h){c.width=w;c.height=h;cx.setTransform(DPR,0,0,DPR,0,0)}return{w:r.width,h:r.height}}
  function box(){const r=arena.getBoundingClientRect();return{x:22,y:22,w:Math.max(40,r.width-44),h:Math.max(40,r.height-44)}}
  function startEdges(){return 32*Math.sqrt(fragments)}
  function accessibleEdges(){return remaining<=0?0:startEdges()*Math.sqrt(remaining/64)}
  function expectedRate(){return 2.4*(accessibleEdges()/32)}
  function fragmentRects(){
    const b=box(),grid=Math.sqrt(fragments),sideUnits=8/grid;
    const denom=8+(grid-1)*2.8,unit=clamp(Math.min((b.w-90)/denom,(b.h-90)/denom),8,16);
    const gap=unit*2.8,baseSide=sideUnits*unit,scale=Math.sqrt(Math.max(0,remaining/64)),side=baseSide*scale;
    const total=grid*baseSide+(grid-1)*gap,startX=b.x+(b.w-total)/2,startY=b.y+(b.h-total)/2,out=[];
    for(let row=0;row<grid;row++)for(let col=0;col<grid;col++){
      const cx=startX+col*(baseSide+gap)+baseSide/2,cy=startY+row*(baseSide+gap)+baseSide/2;
      out.push({x:cx-side/2,y:cy-side/2,w:side,h:side,cx,cy});
    }
    return out;
  }
  function resetSolutionDots(){
    reagent=[];products=[];const b=box();
    for(let i=0;i<34;i++){const a=rnd(0,Math.PI*2),sp=rnd(24,44);reagent.push({x:rnd(b.x+8,b.x+b.w-8),y:rnd(b.y+8,b.y+b.h-8),vx:Math.cos(a)*sp,vy:Math.sin(a)*sp})}
  }
  function resetSurface(showToast=true){
    remaining=64;product=0;modelT=0;history=[];graphAcc=0;reactions=[];flashes=[];running=true;
    $('#surfacePlayBtn').textContent='⏸ Pause';resetSolutionDots();recordHistory(0,true);updateSurfaceUI();
    if(showToast)toast('Oberflächenversuch neu gestartet');
  }
  function randomSurfacePoint(){
    const rects=fragmentRects();if(!rects.length)return{x:0,y:0};const r=rects[Math.floor(Math.random()*rects.length)],side=Math.floor(Math.random()*4),u=Math.random();
    if(side===0)return{x:r.x+u*r.w,y:r.y};if(side===1)return{x:r.x+r.w,y:r.y+u*r.h};if(side===2)return{x:r.x+u*r.w,y:r.y+r.h};return{x:r.x,y:r.y+u*r.h};
  }
  function reactOne(){
    if(remaining<=0)return;
    const p=randomSurfacePoint();remaining--;product++;reactions.push(modelT);flashes.push({x:p.x,y:p.y,t:0});
    const a=rnd(0,Math.PI*2),sp=rnd(25,48);products.push({x:p.x,y:p.y,vx:Math.cos(a)*sp,vy:Math.sin(a)*sp});
    if(products.length>70)products.shift();
  }
  function stepChemistry(dt){
    if(remaining<=0)return;
    const lambda=expectedRate()*dt,p=1-Math.exp(-lambda);
    if(Math.random()<p)reactOne();
  }
  function moveDots(list,dt){
    const b=box();
    for(const p of list){p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.x<b.x+5){p.x=b.x+5;p.vx=Math.abs(p.vx)}if(p.x>b.x+b.w-5){p.x=b.x+b.w-5;p.vx=-Math.abs(p.vx)}if(p.y<b.y+5){p.y=b.y+5;p.vy=Math.abs(p.vy)}if(p.y>b.y+b.h-5){p.y=b.y+b.h-5;p.vy=-Math.abs(p.vy)}}
  }
  function advance(dt){
    modelT+=dt;moveDots(reagent,dt);moveDots(products,dt);stepChemistry(dt);
    for(const f of flashes)f.t+=dt;flashes=flashes.filter(f=>f.t<.55);reactions=reactions.filter(t=>modelT-t<5);recordHistory(dt);
  }
  function recordHistory(dt=0,force=false){graphAcc+=dt;if(force||graphAcc>.22){graphAcc=0;history.push({t:modelT,C:product});history=history.filter(x=>modelT-x.t<=60)}}
  function drawDot(x,y,r,col,glow=4){ctx.save();ctx.fillStyle=col;ctx.shadowColor=col;ctx.shadowBlur=glow;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore()}
  function roundedRect(c,x,y,w,h,r){c.beginPath();if(c.roundRect)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h)}
  function drawSurface(){
    const {w,h}=canvasSize(arena,ctx),b=box();ctx.clearRect(0,0,w,h);
    const grd=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);grd.addColorStop(0,'rgba(14,42,65,.92)');grd.addColorStop(1,'rgba(6,16,28,.98)');
    ctx.fillStyle=grd;ctx.strokeStyle='rgba(120,151,190,.42)';ctx.lineWidth=1.2;roundedRect(ctx,b.x,b.y,b.w,b.h,18);ctx.fill();ctx.stroke();
    for(const p of reagent)drawDot(p.x,p.y,4.2,COL.A,3);
    for(const p of products)drawDot(p.x,p.y,4.6,COL.C,4);
    for(const r of fragmentRects()){
      if(r.w<.8)continue;
      const rg=ctx.createLinearGradient(r.x,r.y,r.x+r.w,r.y+r.h);rg.addColorStop(0,COL.B2);rg.addColorStop(1,COL.B);
      ctx.save();ctx.fillStyle=rg;ctx.strokeStyle='rgba(255,226,180,.75)';ctx.lineWidth=1.2;ctx.shadowColor='rgba(217,164,90,.35)';ctx.shadowBlur=7;roundedRect(ctx,r.x,r.y,r.w,r.h,Math.min(6,r.w*.12));ctx.fill();ctx.stroke();ctx.restore();
      if(r.w>22){ctx.save();ctx.strokeStyle='rgba(113,72,24,.20)';ctx.lineWidth=.7;const lines=Math.max(2,Math.round(Math.sqrt(64/fragments)));for(let i=1;i<lines;i++){const x=r.x+r.w*i/lines,y=r.y+r.h*i/lines;ctx.beginPath();ctx.moveTo(x,r.y);ctx.lineTo(x,r.y+r.h);ctx.stroke();ctx.beginPath();ctx.moveTo(r.x,y);ctx.lineTo(r.x+r.w,y);ctx.stroke()}ctx.restore()}
    }
    for(const f of flashes){const u=f.t/.55,rad=8+u*26;ctx.save();ctx.globalAlpha=1-u;ctx.strokeStyle=COL.C;ctx.lineWidth=2.5;ctx.beginPath();ctx.arc(f.x,f.y,rad,0,Math.PI*2);ctx.stroke();ctx.restore()}
    if(remaining<=0){ctx.save();ctx.fillStyle='rgba(7,15,28,.82)';ctx.strokeStyle='rgba(117,225,168,.45)';roundedRect(ctx,w/2-105,h/2-28,210,56,12);ctx.fill();ctx.stroke();ctx.fillStyle=COL.text;ctx.textAlign='center';ctx.font='800 13px system-ui';ctx.fillText('Feststoff vollständig umgesetzt',w/2,h/2+4);ctx.restore()}
  }
  function drawGraph(){
    const {w,h}=canvasSize(graph,g),pad={l:32,r:10,t:12,b:25},iw=w-pad.l-pad.r,ih=h-pad.t-pad.b;g.clearRect(0,0,w,h);
    g.strokeStyle='rgba(95,122,157,.2)';g.fillStyle='rgba(160,180,204,.75)';g.font='10px system-ui';
    for(let i=0;i<=4;i++){const y=pad.t+ih*i/4;g.beginPath();g.moveTo(pad.l,y);g.lineTo(w-pad.r,y);g.stroke();g.fillText(Math.round(64*(1-i/4)),5,y+3)}
    const t0=Math.max(0,modelT-60),t1=Math.max(t0+1,modelT);
    if(history.length>1){g.beginPath();history.forEach((p,i)=>{const x=pad.l+iw*(p.t-t0)/(t1-t0),y=pad.t+ih*(1-p.C/64);i?g.lineTo(x,y):g.moveTo(x,y)});g.strokeStyle=COL.C;g.lineWidth=2.4;g.lineJoin='round';g.shadowColor=COL.C;g.shadowBlur=6;g.stroke();g.shadowBlur=0}
    g.fillText('−60 s',pad.l,h-7);g.fillText('jetzt',w-35,h-7);
  }
  function updateSurfaceUI(){
    const edges=accessibleEdges(),rel=startEdges()/32;
    $('#surfaceEdges').textContent=fmt(edges,0);$('#surfaceRelative').textContent=fmt(rel,1)+'×';$('#surfaceRate').textContent=fmt(expectedRate(),1);$('#surfaceProduct').textContent=product;
    $('#surfaceRemaining').textContent=remaining;$('#surfaceFragments').textContent=fragments;$('#surfaceStartEdges').textContent=fmt(startEdges(),0);
    const label=fragments===1?'1 großes Stück':fragments===4?'4 Stücke':'Pulver · 16 Stücke';$('#surfaceShapeBadge').textContent=label;
    let text;if(remaining<=0)text='Der Feststoff ist vollständig umgesetzt.';else if(modelT<1)text=`Alle Varianten starten mit 64 Feststoffeinheiten. ${label} besitzt zu Beginn ${fmt(rel,1)}-mal so viel zugängliche Modelloberfläche wie das große Stück.`;else if(fragments===1)text='Das große Stück besitzt die kleinste zugängliche Oberfläche. Entsprechend entstehen pro Zeit weniger Produkte.';else if(fragments===4)text='Durch Zerteilen entstehen mehr gleichzeitig zugängliche Reaktionsorte; der Graph steigt steiler.';else text='Das stark zerteilte „Pulver“ besitzt die größte zugängliche Oberfläche und zeigt die schnellste Produktbildung.';$('#surfaceInterpretation').textContent=text;
  }
  function setSurfacePreset(n){
    fragments=Number(n);$$('[data-surface-preset]').forEach(b=>b.classList.toggle('active',Number(b.dataset.surfacePreset)===fragments));resetSurface(false);toast(fragments===1?'Großes Stück geladen':fragments===4?'4 Stücke geladen':'Pulver-Modell geladen');
  }
  function setMode(mode){
    const surface=mode==='surface';
    if(surface && $('#playBtn').textContent.includes('Pause'))$('#playBtn').click();
    if(!surface && running){running=false;$('#surfacePlayBtn').textContent='▶ Weiter'}
    collisionPanel.hidden=surface;surfacePanel.hidden=!surface;collisionActions.hidden=surface;surfaceActions.hidden=!surface;
    tabs.forEach(b=>b.classList.toggle('active',b.dataset.modelMode===mode));
    if(surface&&!initialized){initialized=true;resetSurface(false)}
    requestAnimationFrame(()=>{if(surface){drawSurface();drawGraph();updateSurfaceUI()}})
  }
  tabs.forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.modelMode)));
  $$('[data-surface-preset]').forEach(b=>b.addEventListener('click',()=>setSurfacePreset(b.dataset.surfacePreset)));
  $('#surfaceResetBtn').onclick=()=>resetSurface(true);
  $('#surfacePlayBtn').onclick=()=>{running=!running;$('#surfacePlayBtn').textContent=running?'⏸ Pause':'▶ Weiter'};
  $('#surfaceStepBtn').onclick=()=>{running=false;$('#surfacePlayBtn').textContent='▶ Weiter';for(let i=0;i<60;i++)advance(1/60);updateSurfaceUI();drawSurface();drawGraph()};
  $('#surfaceClearGraphBtn').onclick=()=>{history=[];recordHistory(0,true);toast('Graph neu gestartet')};
  function togglePresentation(){const on=!document.body.classList.contains('presentation');document.body.classList.toggle('presentation',on);$('#presentBtn').textContent=on?'✕ Präsentation':'▣ Präsentation';$('#surfacePresentBtn').textContent=on?'✕ Präsentation':'▣ Präsentation';requestAnimationFrame(()=>{drawSurface();drawGraph()})}
  $('#surfacePresentBtn').onclick=togglePresentation;
  $('#presentBtn').addEventListener('click',()=>{requestAnimationFrame(()=>{if(initialized){drawSurface();drawGraph()}})});
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('presentation')&&!surfacePanel.hidden)$('#surfacePresentBtn').click()});
  function frame(now){
    const dt=Math.min(.04,(now-last)/1000);last=now;
    if(initialized&&!surfacePanel.hidden){if(running)advance(dt);else{moveDots(reagent,dt*.25);moveDots(products,dt*.25)}drawSurface();drawGraph();updateSurfaceUI()}
    requestAnimationFrame(frame);
  }
  window.addEventListener('resize',()=>{DPR=Math.min(devicePixelRatio||1,2)});
  setMode('collision');requestAnimationFrame(frame);
})();