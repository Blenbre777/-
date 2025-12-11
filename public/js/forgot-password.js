const form = document.getElementById('forgot-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('[FORGOT] submit clicked');
  messageEl.textContent = '';
  messageEl.classList.remove('text-success', 'text-danger');

  const userId = form.userId.value.trim();
  const email = form.email.value.trim();

  try {
    const res = await fetch('/password-reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, email }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || '비밀번호 찾기 요청에 실패했습니다.');
    }
    messageEl.textContent = data.message || '재설정 안내를 전송했습니다.';
    messageEl.classList.add('text-success');
  } catch (err) {
    messageEl.textContent = err.message;
    messageEl.classList.add('text-danger');
  }
});


