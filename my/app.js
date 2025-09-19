// Глобальні посилання на елементи (якщо сторінка їх має)
const form      = document.getElementById('regForm');
const submitBtn = document.getElementById('submitBtn');
const goPayBtn  = document.getElementById('goPay');
const msgEl     = document.getElementById('formMsg');

/* =========================
   КНОПКИ: "Оплата" → "Заявка"
   з TTL у localStorage
========================= */
const TTL_MS = 20 * 60 * 1000; // 20 хв

function isClickedFresh(){
  const raw = localStorage.getItem('clickedPay');
  if (!raw) return false;
  try {
    const { ts } = JSON.parse(raw);
    return Date.now() - ts < TTL_MS;
  } catch {
    return false;
  }
}

function refreshSubmitState(){
  const clicked = isClickedFresh();

  if (submitBtn) {
    submitBtn.disabled = !clicked;
    submitBtn.classList.toggle('btn-disabled', !clicked);
  }
  if (goPayBtn) {
    goPayBtn.disabled = clicked;
    goPayBtn.classList.toggle('btn-disabled', clicked);
  }
}

// ініціалізація стану при завантаженні
refreshSubmitState();

// слухач для "Перейти до оплати"
if (goPayBtn) {
  goPayBtn.addEventListener('click', () => {
    localStorage.setItem('clickedPay', JSON.stringify({ ts: Date.now() }));
    refreshSubmitState();
    window.location.href = 'payment.html';
  });
}

// сабміт заявки
if (form) {
  form.addEventListener('submit', (e) => {
    if (submitBtn && submitBtn.disabled){
      e.preventDefault();
      if (msgEl){
        msgEl.className='msg error';
        msgEl.textContent='Спочатку натисніть «Перейти до оплати».';
      }
      return;
    }

    // демо-поведінка без сервера (щоб було видно, що натиснулось)
    e.preventDefault();
    localStorage.removeItem('clickedPay');
    if (msgEl){
      msgEl.className='msg success';
      msgEl.textContent='Заявку прийнято! Зараз перенаправлю...';
    }
    setTimeout(() => { window.location.href = 'index.html'; }, 900);
  });
}

/* =========================
   Автонумерація гравців
========================= */
const playersTA = document.getElementById('players');
const MAX_PLAYERS = 5;

function showPlayersHint(text){
  if (msgEl){
    msgEl.className = 'msg error';
    msgEl.textContent = text;
  }
}

function renumberPlayers(){
  if (!playersTA) return;
  const lines = playersTA.value.split('\n')
    .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
    .filter(Boolean)
    .slice(0, MAX_PLAYERS);

  playersTA.value = lines.length
    ? lines.map((s, i) => `${i + 1}) ${s}`).join('\n')
    : '';
}

if (playersTA){
  playersTA.addEventListener('focus', () => {
    if (!playersTA.value.trim()){
      playersTA.value = '1) ';
      playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
    }
  });

  playersTA.addEventListener('keydown', (e) => {
    if (e.key === 'Enter'){
      e.preventDefault();

      const rawLines = playersTA.value.split('\n');
      const cleanLines = rawLines.map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
                                 .filter(Boolean);
      const nextIndex = cleanLines.length + 1;

      if (nextIndex > MAX_PLAYERS){
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

    const existingLines = playersTA.value.split('\n')
      .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
      .filter(Boolean);

    const pastedLines = paste.split('\n')
      .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
      .filter(Boolean);

    const all = [...existingLines, ...pastedLines].slice(0, MAX_PLAYERS);
    playersTA.value = all.map((s, i) => `${i + 1}) ${s}`).join('\n') || '1) ';
    playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
  });

  playersTA.addEventListener('blur', renumberPlayers);
}

/* =========================
   Техпідтримка
========================= */
const supportForm = document.getElementById('supportForm');
const supportBtn  = document.getElementById('supportBtn');
const supportMsg  = document.getElementById('supportMsg');

if (supportForm){
  supportForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const message  = (document.getElementById('supportMessage') || {}).value?.trim() || '';
    const honeypot = supportForm.querySelector('input[name="_gotcha"]')?.value?.trim() || '';

    if (honeypot){ return; } // бот — ігноруємо
    if (!message || message.length < 10){
      if (supportMsg){
        supportMsg.className = 'msg error';
        supportMsg.textContent = 'Будь ласка, опишіть проблему детальніше (мінімум 10 символів).';
      }
      return;
    }

    if (supportBtn) supportBtn.disabled = true;
    if (supportMsg){
      supportMsg.className = 'msg success';
      supportMsg.textContent = 'Дякуємо! Ми отримали ваше звернення та відповімо найближчим часом.';
    }
    supportForm.reset();
    if (supportBtn) supportBtn.disabled = false;
  });
}
/* Кінець