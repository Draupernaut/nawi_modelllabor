// MIT. Idealized 1D classroom model; deliberately fictitious masses and speeds.
export const G0=9.81, R=6371000, LIMIT=120;
export function normalize(p={}) {
  const bound=(v,a,b,d)=>v===undefined||!Number.isFinite(+v)?d:Math.max(a,Math.min(b,+v));
  return {u:bound(p.u,100,800,600),flow:bound(p.flow,.5,4,2),stages:+p.stages===1?1:2,gravity:p.gravity!==false,variableG:!!p.variableG,drag:!!p.drag};
}
export function stages(n){return n===1?[{fuel:60,dry:25}]:[{fuel:40,dry:15},{fuel:20,dry:10}];}
export function idealRows(p){p=normalize(p);let m=100;const ss=stages(p.stages);
  return ss.map((s,i)=>{const before=m,after=m-s.fuel,dv=p.u*Math.log(before/after),drop=i<ss.length-1?s.dry:0;m=after-drop;return {i:i+1,before,after,drop,dv};});
}
export function idealTotal(p){return idealRows(p).reduce((sum,r)=>sum+r.dv,0);}
export function newFlight(p){p=normalize(p);const ss=stages(p.stages);return {p,ss,m:100,i:0,fuel:ss[0].fuel,t:0,h:0,v:0,dv:0,gLoss:0,dLoss:0,pad:0,peak:0,lifted:false,done:false,status:'bereit',events:[]};}
export function gravity(s){return !s.p.gravity?0:s.p.variableG?G0*(R/(R+Math.max(0,s.h)))**2:G0;}
export function forces(s){
  const burning=!s.done&&s.i<s.ss.length&&s.fuel>1e-8;
  const thrust=burning?s.p.flow*s.p.u:0,weight=s.m*gravity(s);
  const drag=s.p.drag?-.16*Math.exp(-Math.max(0,s.h)/8000)*s.v:0;
  const a=(thrust-weight+drag)/s.m;
  return {burning,thrust,weight,drag,a:s.h===0&&s.v<=0?Math.max(0,a):a,ratio:weight>0?thrust/weight:null};
}
export function advance(s,dt){
  if(s.done||dt<=0)return;
  let rem=Math.min(dt,LIMIT-s.t);
  while(rem>1e-9&&!s.done){
    const burn=s.i<s.ss.length&&s.fuel>1e-8;
    const h=Math.min(rem,.025,burn?s.fuel/s.p.flow:Infinity);
    const m0=s.m,dm=burn?Math.min(s.fuel,s.p.flow*h):0,m1=m0-dm;
    const dv=dm>0?s.p.u*Math.log(m0/m1):0,g=gravity(s),d=forces(s).drag/m0;
    let v=s.v+dv-g*h+d*h,y=s.h+(s.v+v)*h/2;
    s.dv+=dv;s.gLoss+=g*h;s.dLoss-=d*h;
    if(s.h<=0&&s.v<=0&&v<=0){s.pad-=v;v=0;y=0;}
    if(y<0&&s.lifted){y=0;v=0;s.done=true;s.status='gelandet';s.events.push({t:s.t+h,label:'Boden erreicht'});}
    s.m=m1;s.fuel=Math.max(0,s.fuel-dm);s.v=v;s.h=Math.max(0,y);s.t+=h;rem-=h;s.peak=Math.max(s.peak,s.h);
    if(!s.lifted&&s.h>1e-7){s.lifted=true;s.events.push({t:s.t,label:'Abheben'});}
    if(!s.done&&burn&&s.fuel<=1e-8){
      s.events.push({t:s.t,label:'Brennschluss '+(s.i+1)});
      if(s.i+1<s.ss.length){s.m-=s.ss[s.i].dry;s.events.push({t:s.t,label:'Stufenabwurf'});s.i++;s.fuel=s.ss[s.i].fuel;}
      else{s.i=s.ss.length;s.fuel=0;if(!s.lifted){s.done=true;s.status='nicht abgehoben';}}
    }
    if(!s.done)s.status=s.i>=s.ss.length?(s.v>=0?'Freiflug':'Sinkflug'):(s.lifted?'Stufe '+(s.i+1)+' brennt':'am Boden');
  }
  if(s.t>=LIMIT-1e-8&&!s.done){s.done=true;s.status='Modellzeit beendet';}
}
export function impulse(j){j=Math.max(0,+j||0);return {rocket:j,other:-j,sum:0};}
