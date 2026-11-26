import {G0,idealRows,idealTotal,newFlight,advance,forces,impulse} from './physics.js';
const $=id=>document.getElementById(id);
const fmt=(v,d=0)=>Number.isFinite(v)?v.toLocaleString('de-DE',{maximumFractionDigits:d,minimumFractionDigits:d}):'–';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const label=(x,y,t,size=16,color='#eef5ff',anchor='start',weight=400)=>'<text x="'+x+'" y="'+y+'" fill="'+color+'" font-size="'+size+'" text-anchor="'+anchor+'" font-weight="'+weight+'">'+esc(t)+'</text>';
const line=(x1,y1,x2,y2,color='#263955',w=1,dash='')=>'<line x1="'+x1+'" y1="'+y1+'" x2="'+x2+'" y2="'+y2+'" stroke="'+color+'" stroke-width="'+w+'" '+(dash?'stroke-dasharray="'+dash+'"':'')+'/>';
const rect=(x,y,w,h,c)=>'<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" rx="5" fill="'+c+'"/>';
const circle=(x,y,r,c,o=1)=>'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+c+'" opacity="'+o+'"/>';
function arrow(x,y,dx,dy,c,t){
  if(Math.hypot(dx,dy)<2)return '';
  const a=Math.atan2(dy,dx),X=x+dx,Y=y+dy;
  const p1=(X-10*Math.cos(a-.55))+','+(Y-10*Math.sin(a-.55));
  const p2=(X-10*Math.cos(a+.55))+','+(Y-10*Math.sin(a+.55));
  return line(x,y,X,Y,c,3)+'<polygon points="'+X+','+Y+' '+p1+' '+p2+'" fill="'+c+'"/>'+label(X+7,Y+(dy>0?17:-7),t,15,c);
}
function rocket(x,y,tall=false,rotation=0){
  const h=tall?96:62;
  return '<g transform="translate('+x+' '+y+') rotate('+rotation+')"><path d="M0 '+(-h/2-19)+' L-17 '+(-h/2)+' V'+(h/2)+' H17 V'+(-h/2)+'Z" fill="#d8e8f4" stroke="#76d9ff" stroke-width="2"/><path d="M-17 '+(h/2-20)+' L-29 '+(h/2+7)+' H-17 M17 '+(h/2-20)+' L29 '+(h/2+7)+' H17" fill="#91a9c7" stroke="#76d9ff"/>'+circle(0,-h/2+13,7,'#1f4e79')+(tall?line(-17,3,17,3,'#1f4e79',3):'')+'<path d="M-8 '+(h/2)+' L-13 '+(h/2+9)+' H13 L8 '+(h/2)+'Z" fill="#61758f"/></g>';
}
let mode='recoil',pulseT=0,pulseRun=false,pulseFired=false,running=false,sims=[],samples=[],last=0,paint=0,acc=0;
const speeds=[.25,.5,1,2,4];
const tasks={
recoil:['Vergleiche Startrohr und eigenen Massenausstoß. Woher kommt jeweils die Kraft?','Löse einen Impuls aus. Begründe, warum beide Impulsänderungen gleich groß und entgegengesetzt sind.','Erkläre, weshalb Raketenantrieb auch ohne Umgebungsluft funktioniert.'],
flight:['Beginne mit zu kleinem Schub. Beobachte die Veränderung der Masse und Gewichtskraft. Erkläre die Bedingung für das Abheben.','Schalte die Gravitation aus und vergleiche mit unveränderten übrigen Einstellungen.','Schalte Luftwiderstand zu. Unterscheide ideales Δv und tatsächliche Geschwindigkeit.'],
compare:['Vergleiche ein- und zweistufiges Modell bei gleichen Einstellungen. Erkläre den Unterschied beim idealen Δv.','Wechsle zum Masse-Zeit-Diagramm. Warum ändert sich die Geschwindigkeit beim Abwurf nicht sprunghaft?','Beurteile, welche Aussagen das Modell erlaubt und welche nicht.']};
function cfg(){return {u:+$('u').value,flow:+$('flow').value,stages:+$('stages').value,gravity:$('gravity').checked,variableG:$('variableG').checked,drag:$('drag').checked};}
function drawRecoil(){
  const onboard=document.querySelector('input[name=kind]:checked').value==='rocket',j=+$('impulse').value,t=pulseFired?pulseT:0,p=impulse(j);
  $('impulseOut').textContent=fmt(j)+' kg·m/s';
  let b=rect(0,0,800,400,'#081322');
  for(let k=0;k<32;k++)b+=circle((k*97+23)%800,(k*53+17)%400,1.2,'#526783');
  const x=365+Math.min(245,t*j*3.6),gx=320-Math.min(240,t*j*4.0);
  b+=label(28,35,onboard?'Abgeschlossenes System: Rakete + Gas':'Flugkörper + Startvorrichtung + Erde',18,'#9eb0c7');
  if(!onboard){b+=rect(75,179,260,44,'#334a67')+'<path d="M75 201 H45 V293 H140" fill="none" stroke="#7b91aa" stroke-width="9"/>'+label(65,340,'Startvorrichtung / Erde',15,'#9eb0c7');}
  b+=rocket(x,201,false,90);
  if(onboard&&!pulseFired)b+=circle(353,201,8,'#ffad70')+label(365,275,'Reaktionsmasse an Bord',16,'#ffad70','middle');
  if(pulseFired){
    if(onboard){for(let k=0;k<14;k++)b+=circle(gx+(k%4)*10,181+Math.floor(k/4)*13,4,'#ffad70',.85);b+=arrow(gx,140,-Math.min(80,25+j*3),0,'#ffad70','−Δp');}
    else b+=arrow(150,140,-Math.min(80,25+j*3),0,'#ffad70','−Δp Erde');
    b+=arrow(x,110,Math.min(80,25+j*3),0,'#76d9ff','+Δp');
  }
  b+=label(400,380,pulseFired?'Gleicher Betrag · entgegengesetzte Richtung':'Löse einen Impuls aus und beobachte die Richtungen.',18,'#eef5ff','middle',650);
  $('recoilScene').innerHTML=b;
  $('pRocket').textContent=(pulseFired?'+'+fmt(p.rocket):'0')+' kg·m/s';
  $('pOther').textContent=(pulseFired?'−'+fmt(Math.abs(p.other)):'0')+' kg·m/s';
  $('pSum').textContent='0 kg·m/s';
  $('pOtherLabel').textContent=onboard?'Impulsänderung Gas':'Gegenimpuls Erde';
  $('pulseState').textContent=pulseRun?'in Bewegung':pulseFired?'Impuls übertragen':'bereit';
  $('recoilExplain').textContent=onboard?'Die Rakete stößt eigene Reaktionsmasse aus. Gas und Rakete erhalten entgegengesetzte Impulsänderungen. Umgebungsluft ist nicht nötig.':'Die Startvorrichtung übt von außen eine Kraft aus. Nach Verlassen des Rohrs besitzt der Flugkörper keinen eigenen Antrieb. Die Startvorrichtung und die Erde erhalten den Gegenimpuls.';
}
function resetPulse(){pulseT=0;pulseRun=false;pulseFired=false;drawRecoil();}
function record(){samples.push(sims.map(s=>({t:s.t,h:s.h,v:s.v,m:s.m,dv:s.dv})));if(samples.length>700)samples.shift();}
function resetFlight(){
  running=false;acc=0;
  const p=cfg();sims=mode==='compare'?[newFlight({...p,stages:2}),newFlight({...p,stages:1})]:[newFlight(p)];
  samples=[];record();render();
}
function controls(){
  const p=cfg();$('uOut').textContent=fmt(p.u)+' m/s';$('flowOut').textContent=fmt(p.flow,2)+' kg/s';$('speedOut').textContent=fmt(speeds[+$('speed').value],2)+'×';$('variableG').disabled=!p.gravity;$('stageChoice').hidden=mode==='compare';
  $('sceneTitle').textContent=mode==='compare'?'Zwei Raketen im Vergleich':'Kräfte beim Abheben';$('chartA').textContent=mode==='compare'?'● Zweistufig':'● Aktuelles Modell';$('chartB').hidden=mode!=='compare';
  $('threshold').textContent=p.gravity?'Startmasse: 100 kg. Anfangsgewicht: '+fmt(100*G0)+' N. Modellschub: '+fmt(p.u*p.flow)+' N. Abheben beginnt, wenn der Schub die Gewichtskraft übersteigt.':'Ohne Gravitation reicht jeder positive Schub zum Abheben.';
}
function drawFlight(){
  const scale=Math.ceil(Math.max(100,...sims.map(s=>s.peak*1.35))/100)*100;
  const bottom=345,top=125,range=bottom-top;
  let b='<defs><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#081322"/><stop offset="1" stop-color="#244d6b"/></linearGradient></defs><rect width="800" height="345" fill="url(#sky)"/>'+rect(0,345,800,85,'#142438');
  for(let k=0;k<=4;k++){const y=bottom-k*range/4;b+=line(78,y,770,y,'#38526a',1,'3 7')+label(68,y+4,fmt(scale*k/4)+' m',13,'#9eb0c7','end');}
  b+=line(78,bottom,770,bottom,'#a5b6c8',2);
  sims.forEach((s,i)=>{
    const x=sims.length===2?252+i*310:420,tall=s.p.stages===2&&s.i===0,f=forces(s),c=i?'#f5db79':'#76d9ff';
    const rocketBottom=tall?57:40,y=bottom-rocketBottom-Math.min(range,s.h/scale*range);
    if(sims.length===2)b+=label(x,29,i?'Einstufig':'Zweistufig',18,c,'middle',700);
    if($('trail').checked&&f.burning&&s.t>0){
      for(let k=0;k<34;k++){const p=((k*17%97)/97+s.t*1.5)%1;b+=circle(x+Math.sin(k*23.1)*28*p,y+rocketBottom+p*55,2+2*(1-p),'#ffad70',(1-p)*.7);}
    }
    b+=rocket(x,y,tall);
    const event=s.events.find(e=>e.label==='Stufenabwurf');
    if(event&&s.t-event.t<3){const a=s.t-event.t;b+='<g opacity="'+(1-a/3)+'">'+rect(x-60-a*10,y+34+a*16,24,40,'#7891aa')+label(x-64-a*10,y+91+a*16,'Stufe 1',12,'#9eb0c7')+'</g>';}
    if($('vectors').checked){const n=Math.max(1,f.thrust,f.weight,Math.abs(f.drag));b+=arrow(x+50,y,0,-f.thrust/n*65,'#76d9ff','Fₛ');b+=arrow(x+88,y,0,f.weight/n*65,'#ffad70','Fg');b+=arrow(x-74,y,0,-f.drag/n*65,'#c7a2ff','Fl');}
    b+=label(x,379,fmt(s.h,1)+' m · '+fmt(s.v,1)+' m/s',17,c,'middle',650)+label(x,405,s.status,13,'#9eb0c7','middle');
  });$('flightScene').innerHTML=b;
}
function drawChart(){
  const key=$('metric').value,values=samples.flatMap(row=>row.map(s=>s[key])),hi=Math.max(1,...values),lo=Math.min(0,...values),span=Math.max(1,hi-lo);
  const xmax=Math.max(5,...samples.flatMap(row=>row.map(s=>s.t))),X=t=>60+t/xmax*510,Y=v=>200-(v-lo)/span*166;
  let b=rect(0,0,600,245,'#0a1524');
  for(let k=0;k<=4;k++){
    const v=lo+k*span/4,t=k*xmax/4;b+=line(60,Y(v),570,Y(v),'#283e57')+label(53,Y(v)+4,fmt(v,span<10?1:0),12,'#9eb0c7','end')+line(X(t),34,X(t),200,'#283e57',1,'4 5')+label(X(t),220,fmt(t,1),12,'#9eb0c7','middle');
  }
  sims.forEach((s,i)=>{const pts=samples.map(row=>row[i]).filter(Boolean).map(v=>X(v.t)+','+Y(v[key])).join(' ');b+='<polyline points="'+pts+'" fill="none" stroke="'+(i?'#f5db79':'#76d9ff')+'" stroke-width="2.6" stroke-linejoin="round"/>';});
  for(const e of sims[0].events.filter(e=>e.label==='Stufenabwurf'))b+=line(X(e.t),34,X(e.t),200,'#c7a2ff',1.5,'6 5')+label(X(e.t)+4,28,'Abwurf',12,'#c7a2ff');
  b+=label(570,240,'Zeit / s',12,'#9eb0c7','end');$('chart').innerHTML=b;
}
function budget(){
  const s=sims[0],max=Math.max(1,...sims.map(s=>idealTotal(s.p)),Math.abs(s.v),Math.abs(s.gLoss),Math.abs(s.dLoss));
  function bar(name,v,c){return '<div class="budget-row"><div><small>'+esc(name)+'</small><div class="budget-track"><i style="width:'+Math.min(100,Math.abs(v)/max*100)+'%;background:'+c+'"></i></div></div><strong>'+fmt(v,1)+' m/s</strong></div>';}
  let b=bar('Ideales Δv bis jetzt',s.dv,'#76d9ff')+bar('Ideales Δv bei vollständigem Brennen',idealTotal(s.p),'#9cb8d9')+bar('Tatsächliche Geschwindigkeit',s.v,'#f5db79')+bar('Gravitationsbeitrag',-s.gLoss,'#ffad70')+bar('Luftwiderstandsbeitrag',-s.dLoss,'#c7a2ff');
  if(s.pad>0)b+=bar('Bodenreaktion',s.pad,'#9eb0c7');
  if(mode==='compare')b+=bar('Einstufig: ideales Δv gesamt',idealTotal(sims[1].p),'#f5db79')+bar('Einstufig: tatsächliche Geschwindigkeit',sims[1].v,'#f5db79');
  $('budget').innerHTML=b;
  const current=idealRows(s.p)[Math.min(s.i,s.ss.length-1)];
  $('liveEquation').textContent=s.i>=s.ss.length?'Alle Brennphasen abgeschlossen. Ideale Δv addiert: '+fmt(s.dv,1)+' m/s.':'Aktuelle Brennphase '+(s.i+1)+': '+fmt(s.p.u)+' · ln('+fmt(current.before,1)+' / '+fmt(s.m,1)+') = '+fmt(s.p.u*Math.log(current.before/s.m),1)+' m/s';
  $('events').textContent=s.events.length?s.events.map(e=>fmt(e.t,2)+' s: '+e.label).join(' · '):'Ereignisse: noch keine';
  $('currentStage').textContent='Verbleibendes Treibmittel der aktuellen Stufe: '+fmt(s.fuel,1)+' kg. '+(s.p.gravity?'Modell: erforderliches u beim Start bei unverändertem Massenausstoß > '+fmt(100*G0/s.p.flow,1)+' m/s.':'Gravitation ausgeschaltet.');
  const p=cfg(),rows=[...idealRows({...p,stages:2}).map(r=>({...r,name:'Zweistufig · '+r.i})),...idealRows({...p,stages:1}).map(r=>({...r,name:'Einstufig'}))];
  $('stageTable').innerHTML='<table class="stage-table"><thead><tr><th>Modell / Brennphase</th><th>m vor / kg</th><th>m nach / kg</th><th>Abwurf / kg</th><th>Δv ideal / m/s</th></tr></thead><tbody>'+rows.map(r=>'<tr><td>'+r.name+'</td><td>'+fmt(r.before)+'</td><td>'+fmt(r.after)+'</td><td>'+fmt(r.drop)+'</td><td>'+fmt(r.dv,1)+'</td></tr>').join('')+'<tr><th>Zweistufig gesamt</th><td></td><td></td><td></td><th>'+fmt(idealTotal({...p,stages:2}),1)+'</th></tr></tbody></table>';
}
function render(){
  if(!sims.length)return;controls();const s=sims[0],f=forces(s);
  $('time').textContent=fmt(s.t,1)+' s';$('height').textContent=fmt(s.h,1)+' m';$('velocity').textContent=fmt(s.v,1)+' m/s';$('mass').textContent=fmt(s.m,1)+' kg';
  $('thrust').textContent=fmt(f.thrust)+' N';$('weight').textContent=fmt(f.weight)+' N';$('twr').textContent=f.ratio===null?'ohne Gewicht':fmt(f.ratio,2);$('accel').textContent=fmt(f.a,1)+' m/s²';$('flightState').textContent=s.status;
  $('diagnosis').textContent=s.done?'Versuch beendet: '+s.status+'. Reset startet einen neuen Versuch.':!s.lifted&&f.thrust<=f.weight?'Der Schub reicht noch nicht aus. Durch Massenverlust kann die Gewichtskraft kleiner werden.':f.burning?'Schub und Gewichtskraft wirken entgegengesetzt. Mit abnehmender Masse verändert derselbe Schub die Geschwindigkeit stärker.':'Kein Schub mehr. Die Bewegung wird nur noch durch die eingeschalteten äußeren Kräfte verändert.';
  $('start').disabled=running||sims.every(s=>s.done);$('pause').disabled=!running;$('step').disabled=running||sims.every(s=>s.done);
  drawFlight();drawChart();budget();
}
function step(dt){for(const s of sims)advance(s,dt);const prev=samples[samples.length-1];if(sims.some((s,i)=>s.t-prev[i].t>=.2)||sims.every(s=>s.done))record();if(sims.every(s=>s.done))running=false;}
function setMode(m){mode=m;document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));$('recoilPanel').hidden=mode!=='recoil';$('flightPanel').hidden=mode==='recoil';$('tasks').innerHTML=tasks[m].map(t=>'<li>'+esc(t)+'</li>').join('');resetPulse();resetFlight();}
function loop(now){
  const real=Math.min(.1,Math.max(0,(now-(last||now))/1000));last=now;
  if(mode==='recoil'&&pulseRun){pulseT=Math.min(3.4,pulseT+real);if(pulseT>=3.4)pulseRun=false;drawRecoil();}
  if(mode!=='recoil'&&running){acc+=real*speeds[+$('speed').value];while(acc>=.025){step(.025);acc-=.025;if(!running)break;}if(now-paint>45||!running){render();paint=now;}}
  requestAnimationFrame(loop);
}
document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>setMode(b.dataset.mode)));
document.querySelectorAll('input[name=kind]').forEach(b=>b.addEventListener('change',resetPulse));
$('impulse').addEventListener('input',resetPulse);
$('pulse').addEventListener('click',()=>{pulseT=0;pulseFired=true;pulseRun=true;drawRecoil();});
$('pulsePause').addEventListener('click',()=>{if(pulseFired&&pulseT<3.4)pulseRun=!pulseRun;drawRecoil();});
$('pulseStep').addEventListener('click',()=>{pulseFired=true;pulseRun=false;pulseT=Math.min(3.4,pulseT+.25);drawRecoil();});
$('pulseReset').addEventListener('click',resetPulse);
for(const id of ['u','flow','stages','gravity','variableG','drag'])$(id).addEventListener('input',resetFlight);
for(const id of ['speed','vectors','trail','metric'])$(id).addEventListener('input',render);
$('start').addEventListener('click',()=>{running=true;render();});
$('pause').addEventListener('click',()=>{running=false;render();});
$('step').addEventListener('click',()=>{step(.25);render();});
$('reset').addEventListener('click',resetFlight);
document.querySelectorAll('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const p=b.dataset.preset;$('u').value=p==='weak'?200:p==='late'?400:600;$('flow').value=p==='weak'?1:2;$('gravity').checked=p!=='ideal';$('variableG').checked=false;$('drag').checked=false;resetFlight();}));
$('present').addEventListener('click',()=>{const on=$('shell').classList.toggle('present');$('present').textContent=on?'▣ Normalansicht':'▣ Präsentation';});
document.addEventListener('visibilitychange',()=>{if(document.hidden){running=false;pulseRun=false;render();drawRecoil();}});
setMode('recoil');requestAnimationFrame(loop);
