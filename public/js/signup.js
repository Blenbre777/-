const form = document.getElementById('signup-form');
const messageEl = document.getElementById('message');

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  console.log('[SIGNUP] submit clicked');
  messageEl.textContent = '';
  messageEl.classList.remove('text-success', 'text-danger');

  const userId = form.userId.value.trim();
  const userName = form.userName.value.trim();
  const email = form.email.value.trim();
  const phone = form.phone.value.trim();
  const password = form.password.value.trim();

  try {
    const res = await fetch('/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, userName, email, phone, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || '회원가입 실패');
    }
    messageEl.textContent = data.message || '회원가입 완료';
    messageEl.classList.add('text-success');
    form.reset();
  } catch (err) {
    messageEl.textContent = err.message;
    messageEl.classList.add('text-danger');
  }
});


