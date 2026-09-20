import test from 'node:test';
import assert from 'node:assert/strict';
import {newMatch,startAttack,updateMatch,hurtbox,attackBox} from '../game/combat.js';
import {debugGeometry} from '../game/debug.js';

test('debug geometry uses exact engine rectangles for both directions and airborne targets',()=>{
  const g=newMatch();g.b.y=290;startAttack(g.a,'punch');startAttack(g.b,'kick');g.a.attack.age=.15;g.b.attack.age=.24;
  const before=JSON.stringify(g);const result=debugGeometry(g);
  for(const [i,f] of [g.a,g.b].entries()){assert.deepEqual(result[i].target,hurtbox(f));assert.deepEqual(result[i].attack,attackBox(f));}
  assert.equal(JSON.stringify(g),before,'debug reads must not change combat state');
});
test('inactive and spent attacks show no active strike rectangle',()=>{
  const g=newMatch();startAttack(g.a,'punch');assert.equal(debugGeometry(g)[0].attack,null);
  g.a.attack.age=.15;assert.ok(debugGeometry(g)[0].attack);g.a.attack.hit=true;assert.equal(debugGeometry(g)[0].attack,null);
});
test('contact snapshot preserves pre-knockback geometry and actual damage',()=>{
  const g=newMatch();g.a.x=400;g.b.x=562;const target=hurtbox(g.b);startAttack(g.a,'punch');
  for(let i=0;i<20;i++)updateMatch(g,{},1/120,false);
  assert.equal(g.lastContact.amount,10);assert.equal(g.lastContact.blocked,false);assert.deepEqual(g.lastContact.target,target);
  assert.notDeepEqual(g.lastContact.target,hurtbox(g.b));
  assert.ok(g.lastContact.x>g.lastContact.strike.left&&g.lastContact.x<g.lastContact.strike.right);
});
test('blocked contact snapshot records zero damage',()=>{
  const g=newMatch();g.a.x=400;g.b.x=562;g.b.guard=3;startAttack(g.a,'punch');
  for(let i=0;i<20;i++)updateMatch(g,{},1/120,false);
  assert.equal(g.lastContact.amount,0);assert.equal(g.lastContact.blocked,true);assert.equal(g.b.hp,100);
});
