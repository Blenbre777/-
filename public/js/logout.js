const btn = document.getElementById('logout-btn');
const messageEl = document.getElementById('message');

btn.addEventListener('click', async () => {
  console.log('[LOGOUT] button clicked');
  messageEl.textContent = '';

  try {
    const res = await fetch('/logout', { method: 'POST' });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || '로그아웃 실패');
    }
    messageEl.textContent = data.message || '로그아웃 완료';
  } catch (err) {
    messageEl.textContent = err.message;
  }
});


