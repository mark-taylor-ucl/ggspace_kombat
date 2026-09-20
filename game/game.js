import {installDebug} from './debug.js';
import {newMatch,updateMatch,currentPose,FIGHTER_HEIGHT} from './combat.js';
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d');
const W=960,H=540,ground=430;
const frameRects={bolt:[[18,11,466,486],[530,21,470,473],[1021,29,503,469],[36,502,510,503],[559,526,437,476],[1054,512,454,418]],colonel:[[36,22,464,472],[519,23,455,466],[1019,45,501,449],[31,528,531,464],[560,545,429,447],[1046,528,461,419]]};

const sprites={bolt:new Image(),colonel:new Image(),arena:new Image()};
sprites.bolt.src='/game/bolt-sprites.png';sprites.colonel.src='/game/colonel-sprites.png';sprites.arena.src=document.getElementById('arena-data').src;
const start=document.getElementById('start'),status=document.getElementById('status'),board=document.getElementById('board');
const keys=new Set(),pointers=new Map();let queuedAttack=null,jumpPressed=false,last=0,artReady=false,lastAnnounced=0,soundOn=true;
let game=newMatch();game.state='ready';
const debug=installDebug(start,clearInput);
function readScores(){try{const r=JSON.parse(localStorage.getItem('ggsf-scores')||'[]');return Array.isArray(r)?r.filter(s=>typeof s.name==='string'&&Number.isFinite(s.wins)):[]}catch{return []}}
function scores(){const rows=readScores();board.textContent=rows.length?'LOCAL BEST  '+rows.slice(0,5).map((s,i)=>`${i+1}. ${s.name} ${s.wins}`).join('   ·   '):'LOCAL BEST  —  BE FIRST TO WIN';}scores();
function announce(text){if(!soundOn||!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(text);voice.lang='en-GB';voice.pitch=.55;voice.rate=.86;voice.volume=1;const voices=window.speechSynthesis.getVoices();voice.voice=voices.find(v=>/Daniel|George|David|Alex/.test(v.name)&&v.lang.startsWith('en'))||voices.find(v=>v.lang==='en-GB')||voices.find(v=>v.lang.startsWith('en'))||null;window.speechSynthesis.speak(voice);}
const soundButton=document.getElementById('sound');soundButton.addEventListener('click',()=>{soundOn=!soundOn;soundButton.textContent=soundOn?'VOICE ON':'VOICE OFF';soundButton.setAttribute('aria-pressed',String(soundOn));if(soundOn)announce('Umpire ready.');else if('speechSynthesis' in window)window.speechSynthesis.cancel();});
function clearInput(){keys.clear();pointers.clear();queuedAttack=null;jumpPressed=false;}
function held(k){return keys.has(k)||[...pointers.values()].includes(k);}
function begin(){if(!artReady)return;debug.used=debug.enabled;debug.paused=false;debug.step=false;document.getElementById('debug-pause').textContent='PAUSE';clearInput();lastAnnounced=0;announce('Round one. Fight!');game=newMatch();last=performance.now();document.getElementById('ready-art').hidden=true;canvas.hidden=false;document.getElementById('again').hidden=true;start.textContent='RESTART KOMBAT';status.textContent='FIGHT!';canvas.focus({preventScroll:true});}
start.addEventListener('click',begin);document.getElementById('again').addEventListener('click',begin);
start.disabled=true;start.textContent='LOADING FIGHTERS';
Promise.all(Object.values(sprites).map(im=>im.decode())).then(()=>{artReady=true;start.disabled=false;start.textContent='START KOMBAT';status.textContent='READY TO KOMBAT'}).catch(()=>{status.textContent='Fighter artwork could not load. Refresh to try again.';start.textContent='ARTWORK UNAVAILABLE'});
function pressAction(k){if(game.state!=='playing')return;if(k==='j')queuedAttack='punch';if(k==='k')queuedAttack='kick';if(k==='w')jumpPressed=true;}
document.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(['arrowleft','arrowright','arrowup','a','d','w','j','k','l'].includes(k))e.preventDefault();if(e.repeat)return;if(k==='enter'&&game.state!=='playing'){begin();return;}if(['j','k'].includes(k)){pressAction(k);return;}if(['w','arrowup'].includes(k)){pressAction('w');return;}keys.add(k);});
document.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
document.querySelectorAll('[data-key]').forEach(el=>{const k=el.dataset.key;if(['j','k','w'].includes(k)){el.addEventListener('click',()=>pressAction(k));return;}
 el.addEventListener('pointerdown',e=>{e.preventDefault();pointers.set(e.pointerId,k);el.setPointerCapture(e.pointerId);});
 const release=e=>pointers.delete(e.pointerId);el.addEventListener('pointerup',release);el.addEventListener('pointercancel',release);el.addEventListener('lostpointercapture',release);
 el.addEventListener('keydown',e=>{if(e.key===' '){e.preventDefault();keys.add(k);}});el.addEventListener('keyup',()=>keys.delete(k));
});
window.addEventListener('pointerup',e=>pointers.delete(e.pointerId));window.addEventListener('pointercancel',clearInput);window.addEventListener('blur',clearInput);document.addEventListener('visibilitychange',()=>{clearInput();last=performance.now();});
function drawFighter(f){
 ctx.save();ctx.translate(f.x,ground);ctx.fillStyle='#05091677';ctx.beginPath();ctx.ellipse(0,3,42,8,0,0,Math.PI*2);ctx.fill();ctx.restore();
 const im=sprites[f.kind];if(!im.complete||!im.naturalWidth)return;const pose=currentPose(f);const [sx,sy,sw,sh]=frameRects[f.kind][pose],scale=FIGHTER_HEIGHT/frameRects[f.kind][0][3];
 ctx.save();ctx.translate(f.x,f.y);ctx.scale(f.face,1);ctx.imageSmoothingEnabled=false;if(f.damageFlash>0)ctx.globalAlpha=.65;ctx.drawImage(im,sx,sy,sw,sh,-sw*scale/2,-sh*scale,sw*scale,sh*scale);ctx.restore();
}
function render(){const {a,b,state,clock,round,score}=game;document.getElementById('health').textContent=`Bolt ${a.hp} / 100 · The Colonel ${b.hp} / 100 · Time ${Math.ceil(clock)}`;ctx.clearRect(0,0,W,H);if(sprites.arena.complete&&sprites.arena.naturalWidth)ctx.drawImage(sprites.arena,0,0,W,H);let g=ctx.createLinearGradient(0,0,0,H);g.addColorStop(0,'#080923aa');g.addColorStop(.7,'#06091a55');g.addColorStop(1,'#090412');ctx.fillStyle=g;ctx.fillRect(0,0,W,H);ctx.fillStyle='#08071bc0';ctx.fillRect(0,ground+2,W,H-ground);ctx.fillStyle='#a34de5';ctx.fillRect(0,ground, W,4);ctx.strokeStyle='#a366f044';for(let i=0;i<13;i++){ctx.beginPath();ctx.moveTo(i*92,ground+4);ctx.lineTo(480+(i-6)*170,H);ctx.stroke()}ctx.strokeStyle='#aa71fd33';for(let y=450;y<H;y+=25){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(W,y);ctx.stroke()}
drawFighter(a);drawFighter(b);ctx.fillStyle='#080819d9';ctx.fillRect(20,18,340,69);ctx.fillRect(600,18,340,69);ctx.fillStyle='#c891ff';ctx.font='bold 18px monospace';ctx.fillText('BOLT',32,41);ctx.fillStyle='#ff787c';ctx.textAlign='right';ctx.fillText('THE COLONEL',928,41);ctx.textAlign='left';ctx.fillStyle='#261733';ctx.fillRect(32,53,316,20);ctx.fillRect(612,53,316,20);ctx.fillStyle='#a9f536';ctx.fillRect(32,53,316*a.hp/100,20);ctx.fillStyle='#ff5d71';ctx.fillRect(612+316*(1-b.hp/100),53,316*b.hp/100,20);ctx.strokeStyle='#fff9';ctx.strokeRect(32,53,316,20);ctx.strokeRect(612,53,316,20);ctx.fillStyle='white';ctx.textAlign='center';ctx.font='bold 33px monospace';ctx.fillText(String(Math.ceil(clock)).padStart(2,'0'),480,55);ctx.font='15px monospace';ctx.fillText(`ROUND ${round}    ${score[0]} : ${score[1]}`,480,82);if(state!=='playing'){ctx.fillStyle='#050719b0';ctx.fillRect(0,135,W,160);ctx.fillStyle='white';ctx.font='bold 32px monospace';ctx.fillText(state==='ready'?'BOLT  VS  THE COLONEL':game.message,480,210);ctx.font='17px monospace';ctx.fillStyle='#dac8ff';ctx.fillText(state==='ready'?'PRESS START KOMBAT OR ENTER':state==='over'?'PRESS RESTART KOMBAT TO PLAY AGAIN':'GET READY',480,246)}if(game.finisherTime>0&&state==='playing'){ctx.fillStyle='#08030dcc';ctx.fillRect(190,105,580,68);ctx.fillStyle='#ffda50';ctx.font='italic bold 39px monospace';ctx.textAlign='center';ctx.shadowColor='#ff394d';ctx.shadowBlur=15;ctx.fillText('IMMORTALISE HIM!',480,151);ctx.shadowBlur=0;}for(const e of game.events){drawImpact(e);}}
function drawImpact(e){
 const age=.65-e.life,burst=Math.max(0,1-age/.35),r=18+age*65;
 ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=Math.min(1,e.life*4);
 ctx.lineWidth=4;ctx.strokeStyle=e.blocked?'#80efff':'#ffe94d';ctx.fillStyle=e.blocked?'#0b315bcc':'#ff5224';
 if(e.blocked){ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.stroke();ctx.beginPath();ctx.arc(0,0,r+7,-1.3,1.3);ctx.stroke();}
 else if(burst>0){ctx.beginPath();for(let i=0;i<20;i++){const angle=i*Math.PI/10,rad=i%2?r*.45:r;const x=Math.cos(angle)*rad,y=Math.sin(angle)*rad;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();for(let i=0;i<8;i++){let angle=i*Math.PI/4;ctx.beginPath();ctx.moveTo(Math.cos(angle)*(r+6),Math.sin(angle)*(r+6));ctx.lineTo(Math.cos(angle)*(r+15),Math.sin(angle)*(r+15));ctx.stroke();}}
 ctx.font='italic bold 19px monospace';ctx.textAlign='center';ctx.strokeStyle='#080717';ctx.lineWidth=5;const label=e.blocked?'BLOCK!':'BANG!';ctx.strokeText(label,0,-28-age*25);ctx.fillStyle=e.blocked?'#b9f6ff':'#fff2a2';ctx.fillText(label,0,-28-age*25);
 if(!e.blocked){ctx.font='bold 18px monospace';ctx.strokeText('−'+e.amount,0,28-age*20);ctx.fillText('−'+e.amount,0,28-age*20);}ctx.restore();
}

function tick(t){let dt=Math.min((t-last)/1000||0,.20);last=t;if(document.hidden){requestAnimationFrame(tick);return;}if(debug.enabled){dt=debug.step?1/60:debug.paused?0:dt*(debug.slow?.25:1);debug.step=false;}const input={move:(held('d')||held('arrowright')?1:0)-(held('a')||held('arrowleft')?1:0),block:held('l'),jump:jumpPressed,attack:queuedAttack};if(dt>0){jumpPressed=false;queuedAttack=null;}
 const was=game.state,previousRound=game.round;
 if(game.state!=='ready')while(dt>0){const step=Math.min(dt,1/60);updateMatch(game,input,step);input.attack=null;input.jump=false;dt-=step;if(game.round!==previousRound||game.state!==was){clearInput();break;}}
 if(game.state!=='ready')status.textContent=game.message;
 if(game.finisherSerial!==lastAnnounced){lastAnnounced=game.finisherSerial;announce('Immortalise him!');}
 if(was!=='over'&&game.state==='over'){document.getElementById('again').hidden=false;if(!debug.used&&game.score[0]>game.score[1]){const rows=readScores();rows.push({name:'BOLT',wins:game.score[0]});try{localStorage.setItem('ggsf-scores',JSON.stringify(rows.slice(-5)))}catch{}scores();}}
 render();debug.draw(ctx,game);requestAnimationFrame(tick);
}requestAnimationFrame(tick);
