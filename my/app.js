// ---- Firebase SDK (ES Modules через CDN) ----
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// 1) Скопіюй свій конфіг із Firebase Console → Project settings → Your apps
const firebaseConfig = {
  apiKey: "PASTE_API_KEY",
  authDomain: "PASTE_AUTH_DOMAIN",
  projectId: "PASTE_PROJECT_ID",
  storageBucket: "PASTE_STORAGE_BUCKET",
  messagingSenderId: "PASTE_SENDER_ID",
  appId: "PASTE_APP_ID",
};

// 2) Ініціалізація
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// -------------------------------------------------------------
// === ФОРМА РЕЄСТРАЦІЇ КОМАНДИ (збереження в Firestore) ===
const form = document.getElementById('regForm');
const msg  = document.getElementById('formMsg');

if (form) {
  const playersTA = document.getElementById('players');
  const MAX_PLAYERS = 5;

  // Автонумерація — слухачі тільки якщо textarea існує
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

    playersTA.addEventListener('blur', () => renumberPlayers(playersTA, MAX_PLAYERS));
  }

  function renumberPlayers(ta, max) {
    const lines = ta.value.split('\n')
      .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
      .filter(Boolean)
      .slice(0, max);
    ta.value = lines.length ? lines.map((s, i) => `${i + 1}) ${s}`).join('\n') : '';
  }

  function showPlayersHint(text) {
    if (!msg) return;
    msg.className = 'msg error';
    msg.textContent = text;
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (msg) { msg.className = 'msg'; msg.textContent = 'Перевіряємо дані…'; }

    if (playersTA) renumberPlayers(playersTA, MAX_PLAYERS);

    const data = Object.fromEntries(new FormData(form));

    // Проста валідація
    if(!data.teamName?.trim() || !data.captainNick?.trim() ||
       !data.phone?.trim() || !data.email?.trim() ||
       !data.telegram?.trim() || !data.players?.trim() ||
       !data.rank?.trim() || !data.region?.trim() || !data.agree){
      if (msg) { msg.className = 'msg error'; msg.textContent = 'Заповніть усі обов’язкові поля та підтвердження!'; }
      return;
    }

    // Масив гравців (без номерів)
    const players = (playersTA ? playersTA.value : data.players)
      .split('\n')
      .map(s => s.replace(/^\s*\d+\)\s*/, '').trim())
      .filter(Boolean);

    try {
      await addDoc(collection(db, 'registrations'), {
        teamName: data.teamName.trim(),
        captainNick: data.captainNick.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        telegram: data.telegram.trim(),
        players,
        rank: data.rank,
        region: data.region,
        date: data.date || null,
        createdAt: serverTimestamp(),
        ua: navigator.userAgent
      });

      form.reset();
      if (msg) { msg.className = 'msg success'; msg.textContent = 'Заявку надіслано! Ми зв’яжемося у Telegram/Email.'; }
      if (playersTA) playersTA.value = '';
    } catch (err) {
      console.error(err);
      if (msg) { msg.className = 'msg error'; msg.textContent = 'Не вдалося зберегти заявку. Перевірте налаштування Firebase/Rules.'; }
    }
  });
}

// -------------------------------------------------------------
// === ФОРМА ТЕХПІДТРИМКИ (тільки повідомлення) → Firestore ===
const supportForm  = document.getElementById('supportForm');
const supportMsgEl = document.getElementById('supportMsg');
const supportBtn   = document.getElementById('supportBtn');

if (supportForm) {
  supportForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const textEl = document.getElementById('supportMessage');
    const text = (textEl?.value || '').trim();
    if (!text) {
      if (supportMsgEl) { supportMsgEl.className = 'msg error'; supportMsgEl.textContent = 'Напишіть повідомлення.'; }
      return;
    }
    if (supportBtn) supportBtn.disabled = true;

    try {
      await addDoc(collection(db, 'support_messages'), {
        message: text,
        page: location.href,
        createdAt: serverTimestamp(),
        ua: navigator.userAgent
      });
      supportForm.reset();
      if (supportMsgEl) { supportMsgEl.className = 'msg success'; supportMsgEl.textContent = 'Повідомлення надіслано. Дякуємо!'; }
    } catch (err) {
      console.error(err);
      if (supportMsgEl) { supportMsgEl.className = 'msg error'; supportMsgEl.textContent = 'Не вдалося надіслати повідомлення. Перевірте Firebase/Rules.'; }
    } finally {
      if (supportBtn) supportBtn.disabled = false;
    }
  });
}
