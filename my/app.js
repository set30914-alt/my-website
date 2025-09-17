// ==================== НАЛАШТУВАННЯ ====================
// ЗАМІНИ на свої endpoint-и Formspree:
// ==================== НАЛАШТУВАННЯ ====================
const REG_ENDPOINT = 'https://formspree.io/f/mvgbjqyy';   // ← твій робочий endpoint
const SUPPORT_ENDPOINT = 'https://formspree.io/f/mvgbjqyy'; // (за потреби, заміниш пізніше)


// ==================== ФОРМА РЕЄСТРАЦІЇ ====================
const form = document.getElementById('regForm');
const msg  = document.getElementById('formMsg');

// Автонумерація гравців
const playersTA = document.getElementById('players');
const MAX_PLAYERS = 5;

if (playersTA) {
  playersTA.addEventListener('focus', () => {
    if (!playersTA.value.trim()) {
      playersTA.value = '1) ';
      playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
    }
  });

  playersTA.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const lines = playersTA.value.split('\n');
      const cleanLines = lines.filter(l => l.trim() !== '');
      const nextIndex = cleanLines.length + 1;

      if (nextIndex > MAX_PLAYERS) {
        showPlayersHint(`Максимум ${MAX_PLAYERS} гравців.`);
        return;
      }
      playersTA.value += `\n${nextIndex}) `;
      playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
    }
  });

  playersTA.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const existing = playersTA.value.replace(/\r/g, '');

    let lines = (existing ? existing.split('\n') : []);
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) lines = [];

    const pastedLines = paste.split('\n')
      .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
      .filter(Boolean);

    const all = [...lines.map(s => s.replace(/^\s*\d+\)\s*/, '')), ...pastedLines]
      .filter(Boolean).slice(0, MAX_PLAYERS);

    const numbered = all.map((s, i) => `${i + 1}) ${s}`).join('\n');
    playersTA.value = numbered || '1) ';
    playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
  });

  playersTA.addEventListener('blur', () => renumberPlayers());
}

function renumberPlayers() {
  if (!playersTA) return;
  const lines = playersTA.value.split('\n')
    .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_PLAYERS);

  playersTA.value = lines.length
    ? lines.map((s, i) => `${i + 1}) ${s}`).join('\n')
    : '';
}

function showPlayersHint(text) {
  if (!msg) return;
  msg.className = 'msg error';
  msg.textContent = text;
}

// Надсилання заявки через Formspree
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'msg';
    msg.textContent = 'Перевіряємо дані…';

    renumberPlayers();

    const data = Object.fromEntries(new FormData(form));
    if(!data.teamName?.trim() || !data.captainNick?.trim() ||
       !data.phone?.trim() || !data.email?.trim() ||
       !data.telegram?.trim() || !data.players?.trim() ||
       !data.rank?.trim() || !data.region?.trim() || !data.agree){
      msg.className = 'msg error';
      msg.textContent = 'Заповніть усі обов’язкові поля та підтвердження!';
      return;
    }

    try{
      const res = await fetch(REG_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: new FormData(form)
      });
      if (res.ok){
        form.reset();
        msg.className = 'msg success';
        msg.textContent = 'Заявку надіслано! Перевірте Telegram/Email протягом 24 год.';
      } else {
        throw new Error('Помилка надсилання. Перевірте REG_ENDPOINT.');
      }
    }catch(err){
      msg.className = 'msg error';
      msg.textContent = err.message || 'Сталася помилка. Спробуйте пізніше.';
    }
  });
}

// ==================== ФОРМА ПІДТРИМКИ ====================
const supportForm  = document.getElementById('supportForm');
const supportMsgEl = document.getElementById('supportMsg');
const supportBtn   = document.getElementById('supportBtn');

if (supportForm) {
  supportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (supportMsgEl) { supportMsgEl.className = 'msg'; supportMsgEl.textContent = 'Відправляємо…'; }

    const fd = new FormData(supportForm);
    const message  = (fd.get('message')  || '').toString().trim();
    const email    = (fd.get('email')    || '').toString().trim();
    const telegram = (fd.get('telegram') || '').toString().trim();

    if (!message) {
      if (supportMsgEl){ supportMsgEl.className='msg error'; supportMsgEl.textContent='Напишіть повідомлення.'; }
      return;
    }
    if (!email && !telegram) {
      if (supportMsgEl){ supportMsgEl.className='msg error'; supportMsgEl.textContent='Вкажіть email або @telegram для відповіді.'; }
      return;
    }

    fd.append('_subject', 'Повідомлення з сайту Standoff 2 Cup');
    fd.append('page', location.href);

    if (supportBtn) supportBtn.disabled = true;

    try{
      const res = await fetch(SUPPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: fd
      });
      if (res.ok){
        supportForm.reset();
        if (supportMsgEl){ supportMsgEl.className='msg success'; supportMsgEl.textContent='Повідомлення надіслано. Дякуємо!'; }
      } else {
        throw new Error('Не вдалося надіслати. Перевірте SUPPORT_ENDPOINT.');
      }
    }catch(err){
      if (supportMsgEl){ supportMsgEl.className='msg error'; supportMsgEl.textContent= err.message || 'Сталася помилка. Спробуйте пізніше.'; }
    }finally{
      if (supportBtn) supportBtn.disabled = false;
    }
  });
}
