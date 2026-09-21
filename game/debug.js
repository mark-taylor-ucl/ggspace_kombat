import {hurtbox,attackBox} from './combat.js';

// These are the engine's collision rectangles, not estimates from the artwork.
export function debugGeometry(game){
  return [game.a,game.b].map(f=>({name:f.kind,x:f.x,y:f.y,target:hurtbox(f),attack:attackBox(f),age:f.attack?.age??null,spent:!!f.attack?.hit}));
}
export function installDebug(anchor,clearInput){
  const toggle=document.createElement('button');
  toggle.type='button';toggle.id='debug-toggle';toggle.textContent='DEBUG OFF';toggle.setAttribute('aria-pressed','false');
  const panel=document.createElement('section');panel.id='debug-panel';panel.hidden=true;
  toggle.setAttribute('aria-controls',panel.id);
  panel.innerHTML='<p>CYAN: target · YELLOW: active strike · WHITE DASHED: last contact before knockback. Coordinates are arena pixels.</p><button type="button" id="debug-pause">PAUSE</button> <button type="button" id="debug-step">STEP 1/60s</button> <label><input type="checkbox" id="debug-slow"> Quarter speed</label><pre id="debug-readout" style="white-space:pre-wrap;text-align:left;font-size:12px"></pre>';
  anchor.after(toggle);
  document.querySelector('.controls').after(panel);
  const state={enabled:false,paused:false,step:false,slow:false,used:false};
  const pause=panel.querySelector('#debug-pause');
  toggle.onclick=()=>{state.enabled=!state.enabled;state.used ||= state.enabled;state.paused=false;state.step=false;clearInput();panel.hidden=!state.enabled;pause.textContent='PAUSE';toggle.textContent=state.enabled?'DEBUG ON':'DEBUG OFF';toggle.setAttribute('aria-pressed',String(state.enabled));};
  pause.onclick=()=>{state.paused=!state.paused;clearInput();pause.textContent=state.paused?'RESUME':'PAUSE';};
  panel.querySelector('#debug-step').onclick=()=>{state.paused=true;state.step=true;pause.textContent='RESUME';};
  panel.querySelector('#debug-slow').onchange=e=>{state.slow=e.target.checked;};
  function box(ctx,r,color,dashed=false){if(!r)return;ctx.strokeStyle=color;ctx.lineWidth=2;ctx.setLineDash(dashed?[5,4]:[]);ctx.strokeRect(r.left,r.top,r.right-r.left,r.bottom-r.top);}
  state.draw=(ctx,game)=>{
    if(!state.enabled)return;
    ctx.save();ctx.font='12px monospace';ctx.textAlign='left';
    const geometry=debugGeometry(game);
    for(const f of geometry){box(ctx,f.target,'#63efff');box(ctx,f.attack,'#ffec38');ctx.fillStyle='#fff';ctx.fillText(f.name+' TARGET',f.target.left,f.target.top-6);}
    const contact=game.lastContact;
    if(contact){box(ctx,contact.strike,'#fff',true);box(ctx,contact.target,'#fff',true);ctx.setLineDash([]);ctx.strokeStyle='#ff73f4';ctx.strokeRect(contact.x-4,contact.y-4,8,8);}
    ctx.restore();
    const fmt=r=>r?Object.values(r).map(v=>v.toFixed(1)).join(', '):'inactive';
    panel.querySelector('#debug-readout').textContent=geometry.map(f=>`${f.name}: target [L,R,T,B] ${fmt(f.target)} | strike ${fmt(f.attack)} | attack ${f.age===null?'idle':f.age.toFixed(3)+'s'}${f.spent?' (contact spent)':''}`).join('\n')+'\n'+(contact?`LAST: ${contact.attacker} ${contact.type} ${contact.blocked?'BLOCK':'HIT'} damage ${contact.amount} at (${contact.x.toFixed(1)}, ${contact.y.toFixed(1)})\nstrike ${fmt(contact.strike)} / target ${fmt(contact.target)}`:'No contact yet. Pause, queue a punch/kick, then step to inspect.')+'\nDebug sessions do not record local scores.';
  };
  return state;
}
