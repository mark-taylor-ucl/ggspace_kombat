const KEY = 'gg-kombat-leaderboard-v1';
export function cleanName(value) {
  return String(value).normalize('NFKC').replace(/[\p{Cc}\p{Cf}]/gu, '').trim().replace(/\s+/g, ' ').slice(0, 20);
}
export function readEntries(storage) {
  try {
    const entries = JSON.parse(storage.getItem(KEY) || '[]');
    return Array.isArray(entries) ? entries.filter(e => e && typeof e.id === 'string' && typeof e.name === 'string' && cleanName(e.name) && Number.isFinite(e.at)) : [];
  } catch { return []; }
}
export function rankEntries(entries) {
  const players = new Map();
  for (const entry of entries) {
    const name = cleanName(entry.name), key = name.toLocaleLowerCase('en');
    const row = players.get(key) || {name, wins: 0};
    row.wins++;
    players.set(key, row);
  }
  return [...players.values()].sort((a, b) => b.wins - a.wins || a.name.localeCompare(b.name));
}
export function saveWin(storage, id, name) {
  name = cleanName(name);
  if (!name) throw new Error('Enter a name to register your win.');
  const entries = readEntries(storage);
  if (entries.some(e => e.id === id)) return;
  entries.push({id, name, at: Date.now()});
  storage.setItem(KEY, JSON.stringify(entries));
}
export function installLeaderboard(host) {
  host.innerHTML = `<h2>HALL OF KOMBAT</h2><p>On this device · Ranked by matches won</p>
    <form hidden id="winner-form"><h3>VICTORY! REGISTER YOUR NAME</h3>
    <label for="winner-name">Player name</label>
    <input id="winner-name" name="player" maxlength="20" required autocomplete="nickname" placeholder="Your champion name">
    <button type="submit">SAVE MY WIN</button><button type="button" id="skip-win">SKIP</button></form>
    <p id="score-feedback" role="status"></p><div id="score-rows"></div>
    <p>Names are nicknames, not accounts. Scores stay in this browser. Debug matches do not count.</p>`;
  const style = document.createElement('style');
  style.textContent = '#board{max-width:650px;margin:24px auto;border:2px solid #8245af;border-radius:12px;background:#130d24}#board h2{color:#ffe08a;letter-spacing:2px}#board p{line-height:1.5}#board form{padding:16px;background:#291039;border-radius:8px}#board label{display:block;margin:12px}#board input{font:16px system-ui;width:100%;max-width:340px;padding:12px;border:2px solid #bd9ceb;border-radius:6px;margin-bottom:12px}#board button{margin:6px;font-size:15px;touch-action:manipulation}#board table{width:100%;border-collapse:collapse;text-align:left;table-layout:fixed}#board th,#board td{padding:12px 6px;border-bottom:1px solid #492b60;overflow-wrap:anywhere}#board th:first-child{width:50px}#board th:last-child{width:65px}#board input:focus-visible{outline:3px solid #ffe08a}';
  document.head.append(style);
  const form = host.querySelector('form'), input = host.querySelector('input'), feedback = host.querySelector('#score-feedback'), rows = host.querySelector('#score-rows');
  let pending = null;
  const render = () => {
    let entries = [];
    try { entries = readEntries(window.localStorage); } catch {}
    const ranked = rankEntries(entries).slice(0, 10);
    rows.replaceChildren();
    if (!ranked.length) { rows.textContent = 'No champions yet. Beat The Colonel to claim your place!'; return; }
    const table = document.createElement('table');
    table.innerHTML = '<caption>Top 10 champions</caption><thead><tr><th scope="col">Rank</th><th scope="col">Player</th><th scope="col">Wins</th></tr></thead><tbody></tbody>';
    ranked.forEach((row, i) => {
      const tr = document.createElement('tr');
      [i + 1, row.name, row.wins].forEach(value => { const td = document.createElement('td'); td.textContent = value; tr.append(td); });
      table.querySelector('tbody').append(tr);
    });
    rows.append(table);
  };
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!pending) return;
    if (!cleanName(input.value)) { feedback.textContent = 'Enter a name to register your win.'; input.focus(); return; }
    try { saveWin(window.localStorage, pending, input.value); }
    catch { feedback.textContent = 'Could not save. Allow browser storage and try again. Your win is still ready to register.'; return; }
    pending = null; form.hidden = true;
    feedback.textContent = `Win saved for ${cleanName(input.value)}!`;
    render();
  });
  host.querySelector('#skip-win').addEventListener('click', () => { pending = null; form.hidden = true; feedback.textContent = 'Win skipped. Play again whenever you’re ready.'; });
  window.addEventListener('storage', render);
  render();
  return {
    reset() { pending = null; form.hidden = true; feedback.textContent = ''; },
    finish(game, debugUsed) {
      if (debugUsed || game.score[0] <= game.score[1]) return;
      pending = crypto.randomUUID(); form.hidden = false;
      feedback.textContent = 'You beat The Colonel! Add your name below.';
      host.scrollIntoView({block: 'center', behavior: 'smooth'});
    }
  };
}
