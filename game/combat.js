export const WIDTH=960, GROUND=430, FIGHTER_HEIGHT=180;
const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
const MOVES={
 punch:{damage:10,startup:.13,active:.10,recovery:.25,pose:2,near:57,far:98,top:-125,bottom:-90},
 kick:{damage:16,startup:.21,active:.12,recovery:.36,pose:3,near:65,far:122,top:-145,bottom:-95}
};
export function fighter(x,kind){return {x,y:GROUND,vy:0,hp:100,kind,face:kind==='bolt'?1:-1,attack:null,block:false,stun:0,walking:false,anim:0,guard:0,think:.9,recover:0,damageFlash:0};}
export function newMatch(rng=Math.random){return {a:fighter(225,'bolt'),b:fighter(735,'colonel'),state:'playing',clock:90,round:1,score:[0,0],freeze:0,message:'FIGHT!',events:[],rng,playerAttacks:0,playerDamage:0,result:null,finisherShown:false,finisherSerial:0,finisherTime:0};}
export function startAttack(f,type){if(!MOVES[type]||f.attack||f.stun>0||f.block||f.hp<=0)return false;f.attack={type,age:0,hit:false,face:f.face};f.walking=false;return true;}
function rect(f,near,far,top,bottom,face=f.face){const x1=f.x+near*face,x2=f.x+far*face;return {left:Math.min(x1,x2),right:Math.max(x1,x2),top:f.y+top,bottom:f.y+bottom};}
export function hurtbox(f){return rect(f,-20,70,-174,-15);}
export function attackBox(f){if(!f.attack)return null;const m=MOVES[f.attack.type],t=f.attack.age;if(t<m.startup||t>=m.startup+m.active||f.attack.hit)return null;return rect(f,m.near,m.far,m.top,m.bottom,f.attack.face);}
const overlap=(a,b)=>a.left<b.right&&a.right>b.left&&a.top<b.bottom&&a.bottom>b.top;
export function currentPose(f){if(f.attack){const m=MOVES[f.attack.type];if(f.attack.age>=m.startup&&f.attack.age<m.startup+m.active+.10)return m.pose;}if(f.y<GROUND-5)return 5;if(f.block)return 4;return f.walking&&Math.floor(f.anim*9)%2?1:0;}
function move(f,axis,dt){f.anim+=dt;f.stun=Math.max(0,f.stun-dt);f.damageFlash=Math.max(0,f.damageFlash-dt);f.walking=!!axis&&f.stun===0&&!f.attack&&f.y===GROUND;
 if(!f.attack&&f.stun===0)f.x=clamp(f.x+axis*(f.block?85:230)*dt,90,870);
 f.vy+=1150*dt;f.y=Math.min(GROUND,f.y+f.vy*dt);if(f.y===GROUND)f.vy=0;
 if(f.attack){f.attack.age+=dt;const m=MOVES[f.attack.type];if(f.attack.age>=m.startup+m.active+m.recovery){f.attack=null;if(f.kind==='colonel')f.recover=.65;}}
}
function hit(att,def){const box=attackBox(att);if(!box||!overlap(box,hurtbox(def)))return null;att.attack.hit=true;const m=MOVES[att.attack.type];const blocked=def.block&&def.y===GROUND&&def.face===-att.attack.face;const target=hurtbox(def);return {strike:{...box},target:{...target},att,def,amount:blocked?0:m.damage,blocked,type:att.attack.type,face:att.attack.face,x:(Math.max(box.left,target.left)+Math.min(box.right,target.right))/2,y:(Math.max(box.top,target.top)+Math.min(box.bottom,target.bottom))/2};}
export function roundOutcome(g){if(g.a.hp<=0||g.b.hp<=0)return {reason:'KO',winner:g.a.hp===g.b.hp?null:g.a.hp>g.b.hp?0:1};if(g.clock<=0)return {reason:'TIME UP',winner:g.a.hp===g.b.hp?null:g.a.hp>g.b.hp?0:1};return null;}
function endRound(g,outcome){g.result=outcome;g.state='pause';g.freeze=2.4;g.a.attack=null;g.b.attack=null;g.a.block=false;g.b.block=false;if(outcome.winner!==null)g.score[outcome.winner]++;g.message=outcome.reason+' · '+(outcome.winner===null?'DRAW':outcome.winner===0?'BOLT WINS ROUND':'THE COLONEL WINS ROUND');}
export function updateMatch(g,input,dt,aiEnabled=true){
 g.finisherTime=Math.max(0,g.finisherTime-dt);
 g.events=g.events.map(e=>({...e,life:e.life-dt})).filter(e=>e.life>0);
 if(g.state==='over')return;
 if(g.state==='pause'){g.freeze-=dt;if(g.freeze<=0){if(Math.max(...g.score)>=2||g.round>=3){g.state='over';g.message=g.score[0]===g.score[1]?'MATCH DRAW':(g.score[0]>g.score[1]?'BOLT':'THE COLONEL')+' WINS MATCH';}else{g.lastContact=null;g.round++;g.a=fighter(225,'bolt');g.b=fighter(735,'colonel');g.clock=90;g.finisherShown=false;g.finisherTime=0;g.state='playing';g.message='ROUND '+g.round+' · FIGHT!';}}return;}
 const a=g.a,b=g.b;g.clock=Math.max(0,g.clock-dt);
 if(!a.attack)a.face=a.x<b.x?1:-1;if(!b.attack)b.face=b.x<a.x?1:-1;
 a.block=!!input.block&&a.y===GROUND&&!a.attack&&a.stun===0;
 if(input.attack&&startAttack(a,input.attack))g.playerAttacks++;
 if(input.jump&&a.y===GROUND&&!a.attack&&!a.block&&a.stun===0)a.vy=-700;
 let cpuAxis=0;b.recover=Math.max(0,b.recover-dt);b.guard=Math.max(0,b.guard-dt);b.block=b.guard>0&&!b.attack&&b.stun===0;
 if(aiEnabled&&b.recover===0&&b.stun===0){let dist=Math.abs(a.x-b.x);cpuAxis=a.y<GROUND-40?0:dist>168?b.face:dist<162?-b.face:0;b.think-=dt;if(b.think<=0){b.think=.55+g.rng()*.45;if(a.attack&&g.rng()<.30)b.guard=.4;else if(dist<185){b.block=false;startAttack(b,g.rng()<.40?'kick':'punch');}}}
 move(a,input.move||0,dt);move(b,cpuAxis*.50,dt);
 // Bodies cannot walk through each other; jumping over an opponent remains possible.
 const gap=Math.abs(a.x-b.x);if(gap<158&&Math.abs(a.y-b.y)<130){const side=a.x<b.x?-1:1,push=(158-gap)/2;a.x=clamp(a.x+side*push,90,870);b.x=clamp(b.x-side*push,90,870);}
 // Collect contacts before applying damage, allowing genuine simultaneous hits.
 const contacts=[hit(a,b),hit(b,a)].filter(Boolean);
 for(const h of contacts){g.lastContact={strike:h.strike,target:h.target,x:h.x,y:h.y,attacker:h.att.kind,type:h.type,amount:h.amount,blocked:h.blocked};h.def.hp=clamp(h.def.hp-h.amount,0,100);h.def.damageFlash=.16;if(!h.blocked){h.def.stun=.2;h.def.attack=null;if(h.def.kind==='colonel')h.def.recover=.65;h.def.x=clamp(h.def.x+h.face*28,90,870);if(h.att===a)g.playerDamage+=h.amount;}
 g.events.push({x:h.x,y:h.y,amount:h.amount,blocked:h.blocked,life:.65});g.message=(h.att.kind==='bolt'?'BOLT':'COLONEL')+' '+h.type.toUpperCase()+(h.blocked?' · BLOCKED':' · −'+h.amount);}
 const outcome=roundOutcome(g);if(outcome)endRound(g,outcome);else if(!g.finisherShown&&b.hp>0&&b.hp<=10){g.finisherShown=true;g.finisherSerial++;g.finisherTime=3;g.message='IMMORTALISE HIM!';}
}
