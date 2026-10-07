(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const arena=$('#arena'),ctx=arena.getContext('2d'),graph=$('#graph'),g=graph.getContext('2d');
  let DPR=Math.min(devicePixelRatio||1,2),last=performance.now(),running=true,modelT=0,history=[],graphAcc=0;
  let particles=[],flashes=[],events=[];
  const controls={temp:350,aStart:26,bStart:26,volume:1,ea:44,catalyst:false};
  const COLORS={A:'#55c8ff',B:'#ffd15c',C:'#75e1a8',ok:'#70e5a4',fail:'#ff8998',text:'#eef5ff',muted:'#93a7bf'};
  const radius=7.5;
  const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const fmt=(n,d=1)=>Number(n).toLocaleString('de-DE',{minimumFractionDigits:d,maximumFractionDigits:d});
  const id=()=>crypto.randomUUID?.()||Math.random().toString(36).slice(2);
  function toast(t){const e=$('#toast');e.textContent=t;e.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(()=>e.classList.remove('show'),1400)}
  function canvasSize(c,cx){const r=c.getBoundingClientRect(),w=Math.max(10,Math.round(r.width*DPR)),h=Math.max(10,Math.round(r.height*DPR));if(c.width!==w||c.height!==h){c.width=w;c.height=h;cx.setTransform(DPR,0,0,DPR,0,0)}return {w:r.width,h:r.height}}
  function box(){const r=arena.getBoundingClientRect(),s=Math.sqrt(controls.volume);const w=clamp(r.width*(.60+.32*s),r.width*.62,r.width*.95),h=clamp(r.height*(.60+.32*s),r.height*.62,r.height*.94);return{x:(r.width-w)/2,y:(r.height-h)/2,w,h}}
  function speedScale(){return 46*Math.sqrt(controls.temp/300)}
  function make(type,x,y){const b=box(),ang=rnd(0,Math.PI*2),spd=speedScale()*rnd(.72,1.28);return{id:id(),type,x:x??rnd(b.x+18,b.x+b.w-18),y:y??rnd(b.y+18,b.y+b.h-18),vx:Math.cos(ang)*spd,vy:Math.sin(ang)*spd}}
  function resetParticles(){particles=[];for(let i=0;i<controls.aStart;i++)particles.push(make('A'));for(let i=0;i<controls.bStart;i++)particles.push(make('B'));modelT=0;history=[];graphAcc=0;flashes=[];events=[];recordHistory(0,true);updateUI()}
  function counts(){let A=0,B=0,C=0;for(const p of particles)p.type==='A'?A++:p.type==='B'?B++:C++;return{A,B,C}}
  function effectiveEa(){return controls.ea*(controls.catalyst?.70:1)}
  function kineticProxy(a,b){const rvx=a.vx-b.vx,rvy=a.vy-b.vy;return .0064*(rvx*rvx+rvy*rvy)}
  function orientationSuccess(){return Math.random()<.68}
  function react(a,b,energy){
    const x=(a.x+b.x)/2,y=(a.y+b.y)/2;particles=particles.filter(p=>p!==a&&p!==b);const c=make('C',x,y);c.vx=(a.vx+b.vx)*.48;c.vy=(a.vy+b.vy)*.48;particles.push(c);flashes.push({x,y,t:0,ok:true});events.push({t:modelT,ok:true,energy});
  }
  function fail(a,b,energy){flashes.push({x:(a.x+b.x)/2,y:(a.y+b.y)/2,t:0,ok:false});events.push({t:modelT,ok:false,energy})}
  function collide(dt){
    const b=box();
    for(const p of particles){
      const target=speedScale();const cur=Math.hypot(p.vx,p.vy)||1;const factor=1+(target-cur)*.012*dt;p.vx*=factor;p.vy*=factor;
      p.x+=p.vx*dt;p.y+=p.vy*dt;
      if(p.x<b.x+radius){p.x=b.x+radius;p.vx=Math.abs(p.vx)}if(p.x>b.x+b.w-radius){p.x=b.x+b.w-radius;p.vx=-Math.abs(p.vx)}if(p.y<b.y+radius){p.y=b.y+radius;p.vy=Math.abs(p.vy)}if(p.y>b.y+b.h-radius){p.y=b.y+b.h-radius;p.vy=-Math.abs(p.vy)}
    }
    for(let i=0;i<particles.length;i++)for(let j=i+1;j<particles.length;j++){
      const a=particles[i],b2=particles[j];if(!a||!b2)continue;const dx=b2.x-a.x,dy=b2.y-a.y,d2=dx*dx+dy*dy,min=radius*2;if(d2>=min*min||d2<.01)continue;
      const d=Math.sqrt(d2),nx=dx/d,ny=dy/d,rel=(b2.vx-a.vx)*nx+(b2.vy-a.vy)*ny;if(rel>=0)continue;
      const isAB=(a.type==='A'&&b2.type==='B')||(a.type==='B'&&b2.type==='A');
      const energy=kineticProxy(a,b2);
      if(isAB){const ok=energy>=effectiveEa()&&orientationSuccess();if(ok){react(a,b2,energy);return collide(dt*.15)}else fail(a,b2,energy)}
      const impulse=-rel*.96;a.vx-=impulse*nx;a.vy-=impulse*ny;b2.vx+=impulse*nx;b2.vy+=impulse*ny;const overlap=min-d;a.x-=nx*overlap*.5;a.y-=ny*overlap*.5;b2.x+=nx*overlap*.5;b2.y+=ny*overlap*.5;
    }
    for(const f of flashes)f.t+=dt;flashes=flashes.filter(f=>f.t<.42);events=events.filter(e=>modelT-e.t<5);
  }
  function recordHistory(dt=0,force=false){graphAcc+=dt;if(force||graphAcc>.22){graphAcc=0;const n=counts();history.push({t:modelT,C:n.C});history=history.filter(x=>modelT-x.t<=60)}}
  function rates(){const recent=events.filter(e=>modelT-e.t<=2.5),span=Math.min(2.5,Math.max(.5,modelT||.5)),coll=recent.length/span,succ=recent.filter(e=>e.ok).length/span;return{coll,succ,share:coll?succ/coll:0}}
  function drawCircle(x,y,r,col){ctx.save();const gr=ctx.createRadialGradient(x-r*.35,y-r*.4,1,x,y,r);gr.addColorStop(0,'#fff');gr.addColorStop(.22,col);gr.addColorStop(1,col+'d9');ctx.fillStyle=gr;ctx.shadowColor=col;ctx.shadowBlur=5;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();ctx.restore()}
  function drawArena(){const {w,h}=canvasSize(arena,ctx);ctx.clearRect(0,0,w,h);const b=box();const tempNorm=(controls.temp-220)/(750-220);const grd=ctx.createLinearGradient(b.x,b.y,b.x+b.w,b.y+b.h);grd.addColorStop(0,`rgba(${Math.round(20+70*tempNorm)},${Math.round(42+25*tempNorm)},${Math.round(68-18*tempNorm)},.92)`);grd.addColorStop(1,'rgba(7,16,28,.97)');ctx.fillStyle=grd;ctx.strokeStyle='rgba(120,151,190,.42)';ctx.lineWidth=1.2;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(b.x,b.y,b.w,b.h,18);else{ctx.rect(b.x,b.y,b.w,b.h)}ctx.fill();ctx.stroke();for(const p of particles)drawCircle(p.x,p.y,p.type==='C'?8.5:radius,COLORS[p.type]);for(const f of flashes){const u=f.t/.42,r=9+u*27;ctx.save();ctx.globalAlpha=(1-u)*.8;ctx.strokeStyle=f.ok?COLORS.ok:COLORS.fail;ctx.lineWidth=f.ok?3:1.5;ctx.beginPath();ctx.arc(f.x,f.y,r,0,Math.PI*2);ctx.stroke();ctx.restore()}}
  function drawGraph(){const {w,h}=canvasSize(graph,g),pad={l:32,r:10,t:12,b:25},iw=w-pad.l-pad.r,ih=h-pad.t-pad.b;g.clearRect(0,0,w,h);const maxC=Math.max(5,...history.map(x=>x.C));g.strokeStyle='rgba(95,122,157,.2)';g.fillStyle='rgba(160,180,204,.75)';g.font='10px system-ui';for(let i=0;i<=4;i++){const y=pad.t+ih*i/4;g.beginPath();g.moveTo(pad.l,y);g.lineTo(w-pad.r,y);g.stroke();g.fillText(Math.round(maxC*(1-i/4)),5,y+3)}const t0=Math.max(0,modelT-60),t1=Math.max(t0+1,modelT);if(history.length>1){g.beginPath();history.forEach((p,i)=>{const x=pad.l+iw*(p.t-t0)/(t1-t0),y=pad.t+ih*(1-p.C/maxC);i?g.lineTo(x,y):g.moveTo(x,y)});g.strokeStyle=COLORS.C;g.lineWidth=2.4;g.lineJoin='round';g.shadowColor=COLORS.C;g.shadowBlur=6;g.stroke();g.shadowBlur=0}g.fillText('−60 s',pad.l,h-7);g.fillText('jetzt',w-35,h-7)}
  function syncOutputs(){
    $('#tempOut').textContent=`${controls.temp} K`;$('#aStartOut').textContent=controls.aStart;$('#bStartOut').textContent=controls.bStart;$('#volumeOut').textContent=fmt(controls.volume,2);$('#eaOut').textContent=fmt(controls.ea,0);$('#catalystText').textContent=controls.catalyst?'an':'aus';$('#tempBadge').textContent=controls.temp;$('#catalystBadge').hidden=!controls.catalyst;$('#eaEffective').textContent=fmt(effectiveEa(),0);
  }
  function updateUI(){const n=counts(),r=rates();$('#aCount').textContent=n.A;$('#bCount').textContent=n.B;$('#cCount').textContent=n.C;$('#productCount').textContent=n.C;$('#collisionRate').textContent=fmt(r.coll,1);$('#successRate').textContent=fmt(r.succ,1);$('#successShare').textContent=fmt(r.share*100,0)+' %';syncOutputs();let text='';if(n.A===0||n.B===0)text='Ein Reaktionspartner ist aufgebraucht: Die Produktbildung kommt zum Stillstand.';else if(r.coll<.6&&modelT>2)text='Nur wenige A-B-Stöße: Die Teilchendichte ist gering oder die Teilchen treffen selten aufeinander.';else if(r.coll>1.2&&r.share<.08)text='Viele Stöße, aber nur wenige sind erfolgreich: Die Energieschwelle ist im Verhältnis zur Temperatur hoch.';else if(r.succ>.7)text='Viele erfolgreiche Stöße: Produkt C entsteht momentan schnell.';else text='A und B stoßen zusammen. Nur ein Teil der Stöße besitzt genügend Energie und die passende Orientierung.';$('#interpretation').textContent=text}
  function setFromUI(){controls.temp=+$('#temp').value;controls.aStart=+$('#aStart').value;controls.bStart=+$('#bStart').value;controls.volume=+$('#volume').value;controls.ea=+$('#ea').value;controls.catalyst=$('#catalyst').checked;syncOutputs()}
  function applyPreset(name){const p={base:{temp:350,a:26,b:26,v:1,ea:44,cat:false},hot:{temp:620,a:26,b:26,v:1,ea:44,cat:false},dense:{temp:350,a:44,b:44,v:1,ea:44,cat:false},catalyst:{temp:350,a:26,b:26,v:1,ea:44,cat:true}}[name];controls.temp=p.temp;controls.aStart=p.a;controls.bStart=p.b;controls.volume=p.v;controls.ea=p.ea;controls.catalyst=p.cat;$('#temp').value=p.temp;$('#aStart').value=p.a;$('#bStart').value=p.b;$('#volume').value=p.v;$('#ea').value=p.ea;$('#catalyst').checked=p.cat;$$('[data-preset]').forEach(b=>b.classList.toggle('active',b.dataset.preset===name));syncOutputs();resetParticles();toast('Versuch geladen')}
  ['temp','aStart','bStart','volume','ea'].forEach(id=>$('#'+id).addEventListener('input',()=>{setFromUI();if(id==='temp'){const target=speedScale();for(const p of particles){const m=Math.hypot(p.vx,p.vy)||1,sp=target*rnd(.82,1.18);p.vx=p.vx/m*sp;p.vy=p.vy/m*sp}}if(id==='volume'){const b=box();for(const p of particles){p.x=clamp(p.x,b.x+radius,b.x+b.w-radius);p.y=clamp(p.y,b.y+radius,b.y+b.h-radius)}}$$('[data-preset]').forEach(b=>b.classList.remove('active'))}));
  $('#catalyst').addEventListener('change',()=>{setFromUI();$$('[data-preset]').forEach(b=>b.classList.remove('active'))});
  $$('[data-preset]').forEach(b=>b.onclick=()=>applyPreset(b.dataset.preset));
  $('#applyBtn').onclick=()=>{setFromUI();resetParticles();toast('Neue Startbedingungen übernommen')};
  $('#resetBtn').onclick=()=>applyPreset('base');
  $('#playBtn').onclick=()=>{running=!running;$('#playBtn').textContent=running?'⏸ Pause':'▶ Weiter'};
  $('#stepBtn').onclick=()=>{running=false;$('#playBtn').textContent='▶ Weiter';for(let i=0;i<30;i++){modelT+=1/60;collide(1/60);recordHistory(1/60)}updateUI();drawArena();drawGraph()};
  $('#clearGraphBtn').onclick=()=>{history=[];recordHistory(0,true);toast('Graph neu gestartet')};
  $('#presentBtn').onclick=()=>{const on=!document.body.classList.contains('presentation');document.body.classList.toggle('presentation',on);$('#presentBtn').textContent=on?'✕ Präsentation':'▣ Präsentation';requestAnimationFrame(()=>{drawArena();drawGraph()})};
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('presentation')){$('#presentBtn').click()}});
  function loop(now){const dt=Math.min(.035,(now-last)/1000);last=now;if(running){modelT+=dt;collide(dt);recordHistory(dt)}drawArena();drawGraph();updateUI();requestAnimationFrame(loop)}
  window.addEventListener('resize',()=>{DPR=Math.min(devicePixelRatio||1,2)});
  applyPreset('base');requestAnimationFrame(loop);
})();
