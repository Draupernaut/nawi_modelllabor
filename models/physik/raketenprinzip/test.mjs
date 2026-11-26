import assert from 'node:assert/strict';
import {newFlight,advance,forces,idealTotal,impulse,normalize,LIMIT} from './physics.js';
const close=(a,b,tol=1e-6)=>assert.ok(Math.abs(a-b)<tol,a+' != '+b);
function run(p,t=120){const s=newFlight(p);for(let k=0;k<t*40&&!s.done;k++)advance(s,.025);return s;}
assert.equal(impulse(10).sum,0);
assert.equal(newFlight({stages:1}).m,100);assert.equal(newFlight({stages:2}).m,100);
for(const n of [1,2]){const p={stages:n,u:600,flow:2,gravity:false,drag:false};const s=run(p,31);close(s.dv,idealTotal(p));close(s.v,s.dv);assert.ok(s.h>0);}
assert.ok(idealTotal({stages:2})>idealTotal({stages:1}));
const weak=run({stages:1,u:100,flow:.5});assert.equal(weak.h,0);assert.equal(weak.lifted,false);
const strong=newFlight({u:600,flow:2});assert.ok(forces(strong).thrust>forces(strong).weight);advance(strong,.25);assert.ok(strong.h>0);
const late=run({u:400,flow:2},10);assert.ok(late.lifted);assert.ok(late.events.find(e=>e.label==='Abheben').t>0);
const a=newFlight({stages:2,gravity:false,u:600,flow:2});advance(a,19.999);const before=a.v;advance(a,.001);assert.equal(a.i,1);close(a.m,45);assert.ok(a.v-before<.1);
assert.ok(run({gravity:false,drag:true},10).v<run({gravity:false,drag:false},10).v);
let count=0;for(const stages of [1,2])for(const gravity of [true,false])for(const drag of [true,false])for(const u of [100,400,800])for(const flow of [.5,2,4]){const s=run({stages,gravity,drag,u,flow,variableG:true});assert.ok(Number.isFinite(s.v)&&s.h>=0&&s.m>0&&s.t<=LIMIT+1e-6);count++;}
assert.equal(normalize({u:Infinity}).u,600);assert.equal(normalize({flow:-3}).flow,.5);
console.log('OK: '+count+' Parameterkombinationen; Impuls, Massenbilanz, ideale Gleichung, Stufenabwurf, Abhebegrenze und Dämpfung.');