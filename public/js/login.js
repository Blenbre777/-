const form = document.getElementById('login-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('[LOGIN] submit clicked');
  messageEl.textContent = '';

  const userId = form.userId.value.trim();
  const password = form.password.value.trim();

  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || '로그인 실패');
    }
    messageEl.textContent = data.message || '로그인 성공';
    // 로그인 성공 시 메인 페이지로 이동
    window.location.href = '/html/index.html';
  } catch (err) {
    messageEl.textContent = err.message;
  }
});

