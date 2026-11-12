// ==========================================================
// Квест-Лаборатория: личный кабинет (демо-версия)
// Сервера нет, поэтому «вход» и брони хранятся в localStorage браузера:
// ql-user — имя и телефон, ql-bookings — список броней.
// Брони добавляет main.js при отправке формы бронирования.
// ==========================================================

const loginSection = document.getElementById('account-login');
const profileSection = document.getElementById('account-profile');
const loginForm = document.getElementById('login-form');
const bookingList = document.getElementById('booking-list');
const bookingEmpty = document.getElementById('booking-empty');

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function countMyReviews() {
  let count = 0;
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key.startsWith('ql-reviews-')) count += readJson(key, []).length;
  }
  return count;
}

function renderBookings() {
  const bookings = readJson('ql-bookings', []);
  bookingList.innerHTML = '';
  bookingEmpty.hidden = bookings.length > 0;

  bookings.slice().reverse().forEach((booking) => {
    const item = document.createElement('li');
    item.className = 'list-group-item d-flex flex-wrap justify-content-between align-items-center gap-3 py-3';
    item.innerHTML = `
      <div>
        <p class="fw-semibold mb-1"></p>
        <p class="small text-body-secondary mb-0"></p>
      </div>
      <div class="d-flex align-items-center gap-3">
        <span class="fw-semibold"></span>
        <button class="btn btn-sm btn-outline-danger" type="button">Отменить</button>
      </div>`;
    item.querySelector('.fw-semibold').textContent = booking.quest;
    item.querySelector('.small').textContent =
      [booking.when, booking.players && `${booking.players} игроков`, booking.mode && `режим: ${booking.mode}`]
        .filter(Boolean).join(' · ');
    item.querySelector('span.fw-semibold').textContent = booking.total || '';
    item.querySelector('button').addEventListener('click', () => {
      const rest = readJson('ql-bookings', []).filter((b) => b.id !== booking.id);
      localStorage.setItem('ql-bookings', JSON.stringify(rest));
      renderAccount();
    });
    bookingList.append(item);
  });

  // 5 % от суммы броней — бонусные баллы.
  const sum = bookings.reduce((total, b) => total + (Number(String(b.total).replace(/\D/g, '')) || 0), 0);
  document.getElementById('bonus-points').textContent = Math.round(sum * 0.05).toLocaleString('ru-RU');
}

function renderAccount() {
  const user = readJson('ql-user', null);
  loginSection.hidden = Boolean(user);
  profileSection.hidden = !user;
  if (!user) return;

  document.getElementById('profile-title').textContent = `Здравствуйте, ${user.name}!`;
  document.getElementById('profile-phone').textContent = `+7 ${user.phone}`;
  document.getElementById('profile-avatar').textContent = user.name[0].toUpperCase();
  document.getElementById('review-count').textContent = countMyReviews();
  renderBookings();
}

if (loginForm) {
  loginForm.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!loginForm.checkValidity()) {
      loginForm.classList.add('was-validated');
      loginForm.querySelector(':invalid')?.focus();
      return;
    }
    localStorage.setItem('ql-user', JSON.stringify({
      name: loginForm.elements.name.value.trim(),
      phone: loginForm.elements.phone.value.trim(),
    }));
    renderAccount();
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('ql-user');
    loginForm.reset();
    loginForm.classList.remove('was-validated');
    renderAccount();
  });

  renderAccount();
}
