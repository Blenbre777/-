const userNameEl = document.getElementById('user-name');
const logoutBtn = document.getElementById('logout-btn');

async function fetchMe() {
  try {
    const res = await fetch('/me');
    if (res.status === 401) {
      window.location.href = '/html/login.html';
      return;
    }
    const data = await res.json();
    userNameEl.textContent = data.userName ? `${data.userName}님` : data.userId;
  } catch (err) {
    console.error('사용자 정보 불러오기 실패', err);
    window.location.href = '/html/login.html';
  }
}

async function handleLogout() {
  try {
    await fetch('/logout', { method: 'POST' });
  } catch (err) {
    console.error('로그아웃 실패', err);
  } finally {
    window.location.href = '/html/login.html';
  }
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', handleLogout);
}

fetchMe();


