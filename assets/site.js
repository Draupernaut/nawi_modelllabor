(()=> {
  const catalogEl=document.querySelector('#catalog'); if(!catalogEl)return;
  const search=document.querySelector('#searchInput'), grade=document.querySelector('#gradeFilter'), readyOnly=document.querySelector('#readyOnly'), reset=document.querySelector('#resetFilters'), count=document.querySelector('#resultCount'), readyCount=document.querySelector('#readyCount'), totalCount=document.querySelector('#totalCount'), empty=document.querySelector('#emptyState'), chips=[...document.querySelectorAll('[data-subject]')];
  let models=[], subject='all';
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const subjectLabel={chemie:'⚗️ Chemie',biologie:'🧬 Biologie',physik:'🪐 Physik'};
  function gradeLabel(grades){const a=[...(grades||[])].sort((x,y)=>x-y);if(!a.length)return 'Klassenstufe offen';const consecutive=a.every((v,i)=>i===0||v===a[i-1]+1);return consecutive&&a.length>1?'Kl. '+a[0]+'–'+a[a.length-1]:'Kl. '+a.join(', ');}
  function card(m){
    const ready=m.status==='ready', tags=[...(m.topics||[]).slice(0,3),gradeLabel(m.grades)];
    const action=ready?'<a class="button primary" href="'+esc(m.href)+'"'+(m.external?' target="_blank" rel="noopener noreferrer"':'')+'>Modell starten'+(m.external?' ↗':'')+'</a>':'<span class="button disabled" aria-disabled="true">In Planung</span>';
    return '<article class="catalog-card" data-subject="'+esc(m.subject)+'"><div class="card-top"><span class="subject">'+(subjectLabel[m.subject]||esc(m.subject))+'</span><span class="badge '+(ready?'ready':'')+'">'+(ready?'Einsatzbereit':'Geplant')+'</span></div><h3>'+esc(m.title)+'</h3><p>'+esc(m.description)+'</p><div class="tags">'+tags.map(t=>'<span class="tag">'+esc(t)+'</span>').join('')+'</div><div class="card-actions">'+action+'</div></article>';
  }
  function syncUrl(){
    const p=new URLSearchParams(), q=search.value.trim();
    if(q)p.set('q',q); if(subject!=='all')p.set('fach',subject); if(grade.value!=='all')p.set('klasse',grade.value); if(readyOnly.checked)p.set('bereit','1');
    history.replaceState(null,'',location.pathname+(p.size?'?'+p.toString():'')+location.hash);
  }
  function render(){
    const q=search.value.trim().toLowerCase(), g=grade.value;
    const filtered=models.filter(m=>{if(subject!=='all'&&m.subject!==subject)return false;if(g!=='all'&&!(m.grades||[]).includes(Number(g)))return false;if(readyOnly.checked&&m.status!=='ready')return false;const hay=[m.title,m.description,...(m.topics||[]),...(m.features||[])].join(' ').toLowerCase();return !q||hay.includes(q);}).sort((a,b)=>(a.status==='ready'?0:1)-(b.status==='ready'?0:1)||a.title.localeCompare(b.title,'de'));
    catalogEl.innerHTML=filtered.map(card).join(''); count.textContent=filtered.length+' '+(filtered.length===1?'Modell':'Modelle')+' angezeigt'; empty.hidden=filtered.length!==0; syncUrl();
  }
  function setSubject(next){subject=subjectLabel[next]?next:'all';chips.forEach(x=>{const active=x.dataset.subject===subject;x.classList.toggle('active',active);x.setAttribute('aria-pressed',String(active));});}
  function restoreFilters(){const p=new URLSearchParams(location.search);search.value=p.get('q')||'';setSubject(p.get('fach')||'all');const g=p.get('klasse');grade.value=[...grade.options].some(o=>o.value===g)?g:'all';readyOnly.checked=p.get('bereit')==='1';}
  chips.forEach(b=>b.addEventListener('click',()=>{setSubject(b.dataset.subject);render();})); search.addEventListener('input',render); grade.addEventListener('change',render); readyOnly.addEventListener('change',render); reset.addEventListener('click',()=>{search.value='';grade.value='all';readyOnly.checked=false;setSubject('all');render();search.focus();});
  restoreFilters();
  fetch('./catalog.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Katalog nicht verfügbar');return r.json();}).then(data=>{models=data.models||[];totalCount.textContent=models.length;readyCount.textContent=models.filter(m=>m.status==='ready').length;render();}).catch(()=>{catalogEl.innerHTML='<div class="empty">Der Modellkatalog konnte nicht geladen werden. Bitte Seite neu laden.</div>';count.textContent='';});
  if('serviceWorker' in navigator)addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
})();