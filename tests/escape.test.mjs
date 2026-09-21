import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch,updateMatch,startAttack} from '../game/combat.js';

for(const hz of [30,60,120])for(const side of [-1,1])test(`corner jump crosses active CPU at ${hz}Hz, side ${side}`,()=>{
 const g=newMatch(()=>.5);g.a.x=side===-1?90:870;g.b.x=g.a.x-side*158;
 let crossed=false;for(let i=0;i<hz*1.4;i++){updateMatch(g,{move:-side,jump:i===0},1/hz,true);crossed ||=side===-1?g.a.x>g.b.x:g.a.x<g.b.x;}
 assert.equal(crossed,true);assert.equal(g.a.hp,100);
});
test('CPU approaches at 115 arena pixels per second',()=>{
 const g=newMatch(()=>.5);for(let i=0;i<60;i++)updateMatch(g,{},1/60,true);
 assert.ok(Math.abs(g.b.x-620)<.01);
});
test('CPU stays in recovery after attack ends',()=>{
 const g=newMatch(()=>.5);startAttack(g.b,'punch');
 for(let i=0;i<30;i++)updateMatch(g,{},1/60,true);
 assert.equal(g.b.attack,null);assert.ok(g.b.recover>.5);const x=g.b.x;
 for(let i=0;i<25;i++)updateMatch(g,{},1/60,true);
 assert.equal(g.b.attack,null);assert.equal(g.b.x,x);
});
test('Bolt can create space with a counterattack',()=>{
 const g=newMatch(()=>.5);g.a.x=400;g.b.x=562;startAttack(g.a,'punch');
 for(let i=0;i<25;i++)updateMatch(g,{},1/120,false);
 assert.equal(g.b.hp,90);assert.equal(g.b.x,590);assert.ok(g.b.recover>0);
});
