  // КЛІЄНТ-САЙД ВАЛІДАЦІЯ + ВІДПРАВКА
  const form = document.getElementById('regForm');
  const msg  = document.getElementById('formMsg');

  // === ВАРІАНТ 1 (найпростіший): Formspree ===
  // 1) Зайди на https://formspree.io , створити форму, скопіюй endpoint (URL).
  // 2) Встав URL у змінну ENDPOINT нижче.
  // 3) Готово: заявки приходитимуть на пошту/в дашборд Formspree.

  const USE_FORMSPREE = true;
  const ENDPOINT = 'https://formspree.io/f/your_form_id_here'; // ← заміни на свій

  // === ВАРІАНТ 2 (Google Forms, без коду) ===
  // Створюєш Google Form з цими полями → Отримуєш посилання → Вставляєш <iframe> у index.html.
  // (Див. інструкції нижче в коментарях.)

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msg.className = 'msg';
    msg.textContent = 'Перевіряємо дані…';

    const data = Object.fromEntries(new FormData(form));

    // Проста валідація
    if(!data.teamName?.trim() || !data.captainNick?.trim() ||
      !data.phone?.trim() || !data.email?.trim() ||
      !data.telegram?.trim() || !data.players?.trim() ||
      !data.rank?.trim() || !data.region?.trim() || !data.agree){
      msg.className = 'msg error';
      msg.textContent = 'Заповніть усі обов’язкові поля та підтвердження!';
      return;
    }

    try{
      if (USE_FORMSPREE){
        const res = await fetch(ENDPOINT, {
          method: 'POST',
          headers: { 'Accept': 'application/json' },
          body: new FormData(form)
        });
        if (res.ok){
          form.reset();
          msg.className = 'msg success';
          msg.textContent = 'Заявку надіслано! Перевіряй Telegram/Email протягом 24 год.';
        } else {
          throw new Error('Помилка надсилання. Перевір URL форми (ENDPOINT).');
        }
      } else {
        // Сюди можна підключити інший бекенд (Firebase/own API)
        throw new Error('Не налаштований спосіб відправки.');
      }
    }catch(err){
      msg.className = 'msg error';
      msg.textContent = err.message || 'Сталася помилка. Спробуйте пізніше.';
    }
  });
  // === Автонумерація гравців у textarea ===
  const playersTA = document.getElementById('players');
  const MAX_PLAYERS = 5;

  // Під час першого фокусу вставляємо "1) "
  playersTA.addEventListener('focus', () => {
    if (!playersTA.value.trim()) {
      playersTA.value = '1) ';
      // курсор в кінець
      playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
    }
  });

  // На Enter автоматично додаємо наступний номер
  playersTA.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();

      // Рахуємо, скільки вже непорожніх рядків
      const lines = playersTA.value.split('\n');
      const cleanLines = lines.filter(l => l.trim() !== '');
      const nextIndex = cleanLines.length + 1;

      if (nextIndex > MAX_PLAYERS) {
        // Не даємо додати більше 5
        showPlayersHint(`Максимум ${MAX_PLAYERS} гравців.`);
        return;
      }

      // Додаємо новий рядок з номером
      playersTA.value += `\n${nextIndex}) `;
      playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
    }
  });

  // При вставці тексту (paste) — акуратно перенумеровуємо
  playersTA.addEventListener('paste', (e) => {
    e.preventDefault();
    const paste = (e.clipboardData || window.clipboardData).getData('text');
    const existing = playersTA.value.replace(/\r/g, '');

    // Розбиваємо, прибираємо попередні номери "N) "
    let lines = (existing ? existing.split('\n') : []);
    if (lines.length === 0 || (lines.length === 1 && lines[0].trim() === '')) {
      lines = [];
    }
    const pastedLines = paste.split('\n').map(s => s.replace(/^\s*\d+\)\s*/, '').trim()).filter(Boolean);

    const all = [...lines.map(s => s.replace(/^\s*\d+\)\s*/, '')), ...pastedLines].filter(Boolean).slice(0, MAX_PLAYERS);

    // Збираємо з новою нумерацією
    const numbered = all.map((s, i) => `${i + 1}) ${s}`).join('\n');
    playersTA.value = numbered || '1) ';
    playersTA.selectionStart = playersTA.selectionEnd = playersTA.value.length;
  });

  // На blur або перед відправкою — підчистимо і перенумеруємо
  playersTA.addEventListener('blur', () => renumberPlayers());
  function renumberPlayers() {
    const lines = playersTA.value.split('\n')
      .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
      .filter(Boolean)
      .slice(0, MAX_PLAYERS);

    playersTA.value = lines.length
      ? lines.map((s, i) => `${i + 1}) ${s}`).join('\n')
      : '';
  }

  // Невелике повідомлення під textarea (використаємо існуючий #formMsg)
  function showPlayersHint(text) {
    msg.className = 'msg error';
    msg.textContent = text;
  }


  /*
  АЛЬТЕРНАТИВИ ЗБЕРЕЖЕННЯ ДАНИХ (без власного сервера):
  1) Formspree (найшвидше) — як вище.
  2) Google Forms → Вставити форму в index.html:
    <iframe src="ТВОЄ_ПОСИЛАННЯ_НА_GOOGLE_FORM" width="100%" height="1200" style="border:0"></iframe>
    (Тоді JS не потрібен — відповіді автоматично у Google Sheets.)
  3) Firebase (трохи складніше, але крутіше):
    - Створити проєкт у Firebase Console → Firestore Database → Rules (дозволити лише авторизованим або додати Cloud Function).
    - Додати в index.html SDK Firebase і в app.js зберігати форму в колекцію Firestore.
  */
