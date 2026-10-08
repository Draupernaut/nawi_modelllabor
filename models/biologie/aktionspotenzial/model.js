(()=>{
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const graph=$('#graph'),g=graph.getContext('2d');
  let DPR=Math.min(devicePixelRatio||1,2), mode='phase', running=false, t=0, last=performance.now(), manualV=null, manualT=null;
  const REST=-70, THRESH=-55;
  const phases={
    rest:{label:'Ruhepotenzial',v:-70,na:'geschlossen, aktivierbar',k:'geschlossen',naGate:'aktivierbar',kGate:'geschlossen',current:'v. a. K⁺-Leckstrom',naClass:'',kClass:'',naArrow:false,kArrow:false,refrac:'erregbar',title:'Ruhepotenzial',text:'Das Ruhepotenzial liegt bei etwa −70 mV. Entscheidend sind die Ionengradienten und die selektive Permeabilität der Membran, besonders über K⁺-Leckkanäle. Die Na⁺/K⁺-Pumpe erhält diese Gradienten langfristig.',cause:'Ionengradienten + v. a. K⁺-Leckstrom'},
    threshold:{label:'Schwellenwert',v:-55,na:'beginnen zu öffnen',k:'noch weitgehend geschlossen',naGate:'öffnet',kGate:'geschlossen',current:'beginnender Na⁺-Einstrom',naClass:'opening',kClass:'',naArrow:true,kArrow:false,refrac:'erregbar',title:'Schwelle erreicht',text:'Erreicht die Membran etwa −55 mV, öffnen erste spannungsabhängige Na⁺-Kanäle. Der Na⁺-Einstrom depolarisiert weiter und öffnet dadurch weitere Na⁺-Kanäle: eine positive Rückkopplung startet das Aktionspotenzial.',cause:'positive Rückkopplung der Na⁺-Kanalöffnung'},
    depol:{label:'Depolarisation',v:5,na:'weit geöffnet',k:'öffnen verzögert',naGate:'offen',kGate:'öffnet',current:'starker Na⁺-Einstrom',naClass:'open',kClass:'opening',naArrow:true,kArrow:false,refrac:'absolute Refraktärzeit',title:'Schnelle Depolarisation',text:'Na⁺ strömt entlang seines elektrochemischen Gradienten in die Zelle. Das Membranpotenzial wird rasch positiver. Die spannungsabhängigen K⁺-Kanäle öffnen deutlich verzögert.',cause:'Na⁺-Einstrom dominiert'},
    peak:{label:'Spitze / Overshoot',v:30,na:'inaktiviert',k:'weit geöffnet',naGate:'inaktiviert',kGate:'offen',current:'Na⁺-Strom endet, K⁺-Ausstrom steigt',naClass:'inactivated',kClass:'open',naArrow:false,kArrow:true,refrac:'absolute Refraktärzeit',title:'Spitze des Aktionspotenzials',text:'Viele Na⁺-Kanäle gehen in den inaktivierten Zustand über. Gleichzeitig sind die verzögert öffnenden K⁺-Kanäle nun stark geöffnet. Dadurch kippt der dominante Ionenstrom.',cause:'Na⁺-Inaktivierung + zunehmender K⁺-Ausstrom'},
    repol:{label:'Repolarisation',v:-35,na:'inaktiviert',k:'geöffnet',naGate:'inaktiviert',kGate:'offen',current:'starker K⁺-Ausstrom',naClass:'inactivated',kClass:'open',naArrow:false,kArrow:true,refrac:'absolute Refraktärzeit',title:'Repolarisation',text:'K⁺ verlässt die Zelle. Dadurch wird das Zellinnere wieder negativer. Die schnelle Repolarisation entsteht vor allem durch K⁺-Ausstrom und Na⁺-Kanal-Inaktivierung – nicht durch die Na⁺/K⁺-Pumpe.',cause:'K⁺-Ausstrom dominiert'},
    hyper:{label:'Hyperpolarisation',v:-80,na:'wieder geschlossen, aktivierbar',k:'schließen langsam',naGate:'aktivierbar',kGate:'schließt',current:'abklingender K⁺-Ausstrom',naClass:'',kClass:'opening',naArrow:false,kArrow:true,refrac:'relative Refraktärzeit',title:'Hyperpolarisation',text:'K⁺-Kanäle schließen verzögert. Deshalb fällt das Membranpotenzial kurz unter das Ruhepotenzial. Ein neues Aktionspotenzial ist bereits möglich, dafür muss der Reiz die größere Entfernung zum Schwellenwert überwinden.',cause:'K⁺-Leitfähigkeit bleibt vorübergehend erhöht'},
    return:{label:'Rückkehr zum Ruhepotenzial',v:-70,na:'geschlossen, aktivierbar',k:'geschlossen',naGate:'aktivierbar',kGate:'geschlossen',current:'v. a. Leckströme',naClass:'',kClass:'',naArrow:false,kArrow:false,refrac:'erregbar',title:'Rückkehr zum Ruhepotenzial',text:'Die K⁺-Kanäle schließen und die normalen Leckleitfähigkeiten dominieren wieder. Die Na⁺/K⁺-Pumpe erhält die Konzentrationsgradienten über längere Zeiträume; sie ist nicht der schnelle Rückstellmechanismus des einzelnen Aktionspotenzials.',cause:'K⁺-Kanäle schließen; Leckleitfähigkeiten dominieren'}
  };
  const phaseOrder=['rest','threshold','depol','peak','repol','hyper','return'];
  const keyframes=[{t:0,v:-70,p:'rest'},{t:.7,v:-70,p:'rest'},{t:1.15,v:-55,p:'threshold'},{t:1.9,v:30,p:'depol'},{t:2.2,v:30,p:'peak'},{t:3.7,v:-70,p:'repol'},{t:4.8,v:-80,p:'hyper'},{t:6.4,v:-70,p:'return'},{t:7,v:-70,p:'rest'}];
  const defaultGraphSubtitle='typischer Verlauf · Zeitlupe: 1 ms ≈ 1 s Animation';
  function toast(text){const e=$('#toast');e.textContent=text;e.classList.add('show');clearTimeout(toast.h);toast.h=setTimeout(()=>e.classList.remove('show'),1500)}
  function lerp(a,b,u){return a+(b-a)*u}
  function stateAt(time){
    if(time<=keyframes[0].t)return {v:keyframes[0].v,p:keyframes[0].p};
    for(let i=1;i<keyframes.length;i++){
      const a=keyframes[i-1],b=keyframes[i];
      if(time<=b.t){
        const u=(time-a.t)/(b.t-a.t);let p=a.p;
        if(time>=1.15&&time<1.9)p='depol';else if(time>=1.9&&time<2.45)p='peak';else if(time>=2.45&&time<4.25)p='repol';else if(time>=4.25&&time<5.65)p='hyper';else if(time>=5.65)p='return';
        return {v:lerp(a.v,b.v,u),p};
      }
    }
    return {v:-70,p:'rest'};
  }
  function refractoryAt(time){if(time>=1.15&&time<4.25)return 'absolute';if(time>=4.25&&time<5.65)return 'relative';return 'none'}
  function canvasSize(){const r=graph.getBoundingClientRect(),w=Math.max(10,Math.round(r.width*DPR)),h=Math.max(10,Math.round(r.height*DPR));if(graph.width!==w||graph.height!==h){graph.width=w;graph.height=h;g.setTransform(DPR,0,0,DPR,0,0)}return {w:r.width,h:r.height}}
  function voltageAtTrace(x){return stateAt(x).v}
  function subthresholdVoltage(time){if(time<.55)return REST;if(time<=1)return lerp(REST,manualV,(time-.55)/.45);if(time<=1.7)return lerp(manualV,REST,(time-1)/.7);return REST}
  function drawGraph(){
    const {w,h}=canvasSize(),pad={l:42,r:12,t:15,b:28},iw=w-pad.l-pad.r,ih=h-pad.t-pad.b,y=v=>pad.t+(40-v)/(40-(-90))*ih,x=time=>pad.l+time/7*iw;
    g.clearRect(0,0,w,h);g.font='10px system-ui';g.fillStyle='rgba(163,182,204,.8)';g.strokeStyle='rgba(90,116,148,.2)';
    [-80,-70,-55,0,30].forEach(v=>{g.beginPath();g.moveTo(pad.l,y(v));g.lineTo(w-pad.r,y(v));g.stroke();g.fillText(v+'',5,y(v)+3)});
    g.setLineDash([5,4]);g.strokeStyle='rgba(255,137,152,.6)';g.beginPath();g.moveTo(pad.l,y(THRESH));g.lineTo(w-pad.r,y(THRESH));g.stroke();g.setLineDash([]);
    g.beginPath();for(let i=0;i<=180;i++){const tt=7*i/180,v=manualV!==null?subthresholdVoltage(tt):voltageAtTrace(tt);i?g.lineTo(x(tt),y(v)):g.moveTo(x(tt),y(v))}
    g.strokeStyle=manualV!==null?'#76d9ff':'#75e1a8';g.lineWidth=2.5;g.shadowColor=g.strokeStyle;g.shadowBlur=6;g.stroke();g.shadowBlur=0;
    const cur=manualV!==null?(manualT??1):(mode==='run'?Math.min(t,7):phaseToTime(currentPhase()));
    const sv=manualV!==null?subthresholdVoltage(cur):(mode==='run'?stateAt(cur).v:phases[currentPhase()].v);
    g.fillStyle='#eef5ff';g.beginPath();g.arc(x(cur),y(sv),5,0,Math.PI*2);g.fill();g.fillStyle='rgba(163,182,204,.8)';g.fillText('0 ms',pad.l,h-8);g.fillText('7 ms',w-pad.r-27,h-8)
  }
  function phaseToTime(p){return ({rest:.3,threshold:1.15,depol:1.55,peak:2.1,repol:3.2,hyper:4.8,return:6.2})[p]??0}
  function currentPhase(){return document.querySelector('[data-phase].active')?.dataset.phase||'rest'}
  function setPhase(p,vOverride=null){mode='phase';running=false;manualV=null;manualT=null;$('#playBtn').textContent='▶ Ablauf starten';$('#graphSubtitle').textContent=defaultGraphSubtitle;$$('[data-phase]').forEach(b=>b.classList.toggle('active',b.dataset.phase===p));renderState(p,vOverride??phases[p].v);drawGraph()}
  function renderState(p,v){
    const s=phases[p];$('#voltageBig').textContent=(v<0?'−':'')+Math.round(Math.abs(v));$('#phaseName').textContent=s.label;$('#naState').textContent=s.na;$('#kState').textContent=s.k;$('#currentState').textContent=s.current;$('#naGate').textContent=s.naGate;$('#kGate').textContent=s.kGate;$('#naChannel').className='channel na-channel '+s.naClass;$('#kChannel').className='channel k-channel '+s.kClass;$('#naArrow').classList.toggle('on',s.naArrow);$('#kArrow').classList.toggle('on',s.kArrow);$('#explainTitle').textContent=s.title;$('#explainText').textContent=s.text;$('#causeText').textContent=s.cause;
    const rp=$('#refractoryPill');rp.textContent=s.refrac;rp.className='refractory-pill'+(s.refrac.startsWith('absolute')?' absolute':s.refrac.startsWith('relative')?' relative':'');
    const positive=v>0;$('#insideCharge').textContent=positive?'+':'−';$('#outsideCharge').textContent=positive?'−':'+'
  }
  function startAP(fromThreshold=false,isSecond=false){
    mode='run';running=true;t=fromThreshold?1.15:0;manualV=null;manualT=null;$('#playBtn').textContent='⏸ Pause';$('#graphSubtitle').textContent='laufender Ablauf · Zeitlupe: 1 ms ≈ 1 s Animation';
    $('#stimulusResult').className='stimulus-result success';
    if(isSecond){$('#stimulusResult strong').textContent='starker Reiz → neues Aktionspotenzial';$('#stimulusResult span').textContent='Der Schwellenwert wird trotz relativer Refraktärzeit erreicht.'}
    else{$('#stimulusResult strong').textContent='Schwelle erreicht → vollständiges Aktionspotenzial';$('#stimulusResult span').textContent='Die maximale Höhe hängt im Modell nicht von der weiteren Reizstärke ab.'}
    const st=stateAt(t);$$('[data-phase]').forEach(b=>b.classList.toggle('active',b.dataset.phase===st.p));renderState(st.p,st.v);drawGraph()
  }
  function subthreshold(delta){
    mode='phase';running=false;const v=REST+delta;manualV=v;manualT=1;$$('[data-phase]').forEach(b=>b.classList.remove('active'));renderState('rest',v);$('#graphSubtitle').textContent='aktuelle Reizantwort: unterschwellig · kein Aktionspotenzial';drawGraph();$('#stimulusResult').className='stimulus-result fail';$('#stimulusResult strong').textContent=`lokale Depolarisation bis ${v} mV`;$('#stimulusResult span').textContent='Schwelle −55 mV nicht erreicht → kein Aktionspotenzial';toast('Unterschwelliger Reiz')
  }
  function stimulate(isSecond=false){
    const delta=+$('#stimulus').value;
    if(isSecond&&mode!=='run'){$('#secondStimHint').textContent='Starte zuerst einen laufenden Aktionspotenzial-Ablauf.';toast('Zuerst Ablauf starten');return}
    if(mode==='run'){
      const r=refractoryAt(t),currentV=stateAt(t).v;
      if(r==='absolute'){const msg='Absolute Refraktärzeit: kein zweites Aktionspotenzial möglich – auch nicht bei stärkerem Reiz.';$('#secondStimHint').textContent=msg;toast('Na⁺-Kanäle sind inaktiviert');return}
      if(r==='relative'){
        const needed=Math.max(15,Math.ceil(THRESH-currentV));
        if(delta>=needed){$('#secondStimHint').textContent='Starker Reiz überwindet die erhöhte Schwelle: ein neues Aktionspotenzial startet sofort.';startAP(true,true);toast('Neues Aktionspotenzial')}
        else{$('#secondStimHint').textContent=`Relative Refraktärzeit: aktuell sind etwa ${needed} mV Depolarisation nötig.`;toast('Reiz noch zu schwach')}
        return
      }
      if(isSecond){if(delta>=15){startAP(false,true);toast('Neues Aktionspotenzial')}else{$('#secondStimHint').textContent='Membran erregbar, aber der Reiz bleibt unterschwellig.';toast('Schwelle nicht erreicht')}return}
    }
    if(delta>=15)startAP(false,false);else subthreshold(delta)
  }
  function updateRun(dt){
    if(!running)return;t+=dt;
    if(t>=7){running=false;mode='phase';setPhase('rest');$('#secondStimHint').textContent='Aktionspotenzial beendet. Die Membran ist wieder erregbar.';return}
    const st=stateAt(t);$$('[data-phase]').forEach(b=>b.classList.toggle('active',b.dataset.phase===st.p));renderState(st.p,st.v);
    const r=refractoryAt(t);
    if(r==='absolute')$('#secondStimHint').textContent='Jetzt: absolute Refraktärzeit – erneuter Reiz bleibt ohne Aktionspotenzial.';
    else if(r==='relative'){const needed=Math.max(15,Math.ceil(THRESH-st.v));$('#secondStimHint').textContent=`Jetzt: relative Refraktärzeit – aktuell sind etwa ${needed} mV Depolarisation nötig.`}
    else $('#secondStimHint').textContent='Membran erregbar.'
  }
  $$('[data-phase]').forEach(b=>b.onclick=()=>setPhase(b.dataset.phase));
  $$('[data-stim]').forEach(b=>b.onclick=()=>{$('#stimulus').value=b.dataset.stim;$('#stimOut').textContent=b.dataset.stim+' mV'});
  $('#stimulus').oninput=()=>{$('#stimOut').textContent=$('#stimulus').value+' mV'};
  $('#stimulateBtn').onclick=()=>stimulate(false);$('#secondStimBtn').onclick=()=>stimulate(true);
  $('#playBtn').onclick=()=>{if(mode!=='run'){startAP();return}running=!running;$('#playBtn').textContent=running?'⏸ Pause':'▶ Weiter'};
  $('#stepBtn').onclick=()=>{
    if(mode==='run'){
      running=false;t=Math.min(7,t+.55);
      if(t>=7){setPhase('rest');$('#secondStimHint').textContent='Aktionspotenzial beendet. Die Membran ist wieder erregbar.';return}
      const st=stateAt(t);renderState(st.p,st.v);$$('[data-phase]').forEach(b=>b.classList.toggle('active',b.dataset.phase===st.p));drawGraph();$('#playBtn').textContent='▶ Weiter'
    }else{const i=phaseOrder.indexOf(currentPhase());setPhase(phaseOrder[(i+1)%phaseOrder.length])}
  };
  $('#resetBtn').onclick=()=>{t=0;setPhase('rest');$('#stimulusResult').className='stimulus-result';$('#stimulusResult strong').textContent='Reiz wählen und auslösen';$('#stimulusResult span').textContent='Ruhe −70 mV · Schwelle −55 mV';$('#secondStimHint').textContent='Starte zuerst ein Aktionspotenzial.'};
  $('#presentBtn').onclick=()=>{const on=!document.body.classList.contains('presentation');document.body.classList.toggle('presentation',on);$('#presentBtn').textContent=on?'✕ Präsentation':'▣ Präsentation';requestAnimationFrame(drawGraph)};
  window.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.body.classList.contains('presentation'))$('#presentBtn').click()});
  window.addEventListener('resize',()=>{DPR=Math.min(devicePixelRatio||1,2);drawGraph()});
  function loop(now){const dt=Math.min(.04,(now-last)/1000);last=now;updateRun(dt);drawGraph();requestAnimationFrame(loop)}
  setPhase('rest');requestAnimationFrame(loop);
})();
