// ==========================================================
// Квест-Лаборатория: общий скрипт для всех страниц
// 1) плавный уход со страницы при переходе по ссылке;
// 2) поиск квеста по сайту (окно «Поиск квеста» в шапке);
// 3) виджет чата с консультантом в правом нижнем углу;
// 4) отзывы игроков: показ сохранённых отзывов и пересчёт рейтингов.
// ==========================================================

// Пользователь попросил меньше анимаций в настройках системы.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;


// ---------- 1. Анимация перехода между страницами ----------
// Появление страницы и экран загрузки сделаны на чистом CSS.
// Здесь только «уход»: при клике по ссылке на другую страницу сайта
// содержимое плавно гаснет, и через 200 мс браузер открывает новую страницу.
document.addEventListener('click', (event) => {
  const link = event.target.closest('a[href]');
  if (!link || reduceMotion) return;

  const url = new URL(link.href, window.location.href);
  const isOtherPage = url.origin === window.location.origin && url.pathname !== window.location.pathname;
  const isPlainClick = !event.ctrlKey && !event.metaKey && !event.shiftKey && event.button === 0;

  if (isOtherPage && isPlainClick && !link.target && !link.hasAttribute('download')) {
    event.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { window.location.href = link.href; }, 200);
  }
});

// При возврате кнопкой «Назад» страница берётся из кеша — убираем затемнение.
window.addEventListener('pageshow', () => document.body.classList.remove('is-leaving'));


// ---------- 2. Поиск квеста ----------
// Список квестов лежит в js/quests-data.js (window.QUESTS).
const searchModal = document.getElementById('search-modal');
const searchInput = document.getElementById('search-input');
const searchResults = document.getElementById('search-results');
const searchStatus = document.getElementById('search-status');

// Приводим текст к одному виду: строчные буквы, «ё» = «е».
function normalize(text) {
  return text.toLowerCase().replace(/ё/g, 'е');
}

// Строка, по которой ищем: название, жанр, сюжет и «особенности».
function searchText(quest) {
  const extra = [];
  if (quest.age <= 12) extra.push('дети детский семейный');
  if (quest.actor) extra.push('актер актеры страшный');
  if (quest.genre === 'Хоррор' || quest.genre === 'Мистика') extra.push('страшный');
  extra.push(`${quest.players} человек игроков`);
  return normalize([quest.title, quest.genre, quest.difficulty, quest.short, ...extra].join(' '));
}

// Безопасная вставка текста в HTML (на случай кавычек и угловых скобок).
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function runSearch() {
  const query = normalize(searchInput.value.trim());
  if (query.length < 2) {
    searchResults.innerHTML = '';
    searchStatus.textContent = 'Введите хотя бы 2 буквы.';
    return;
  }

  // Каждое слово запроса должно встретиться в описании квеста.
  const words = query.split(/\s+/);
  const found = window.QUESTS.filter((quest) => {
    const text = searchText(quest);
    return words.every((word) => text.includes(word));
  });

  searchStatus.textContent = found.length
    ? `Найдено квестов: ${found.length}`
    : 'Ничего не нашлось. Попробуйте другое слово или откройте каталог.';

  searchResults.innerHTML = found.map((quest) => `
    <a class="list-group-item list-group-item-action d-flex gap-3 align-items-center" href="${quest.url}">
      <img class="search-result__img" src="${quest.img}" alt="" width="96" height="72">
      <span>
        <span class="d-block fw-semibold">${escapeHtml(quest.title)}</span>
        <span class="d-block small text-body-secondary">${quest.difficulty} · ${quest.genre} · ${quest.players} игроков · ${quest.age}+</span>
      </span>
    </a>`).join('');
}

if (searchModal && window.QUESTS) {
  searchInput.addEventListener('input', runSearch);
  // Курсор сразу в поле поиска, когда окно открылось.
  searchModal.addEventListener('shown.bs.modal', () => searchInput.focus());

  // Клавиша «/» открывает поиск, если пользователь не печатает в поле.
  document.addEventListener('keydown', (event) => {
    const typing = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (event.key === '/' && !typing) {
      event.preventDefault();
      bootstrap.Modal.getOrCreateInstance(searchModal).show();
    }
  });
}


// ---------- 3. Чат с консультантом ----------
// Это имитация. На готовые вопросы-кнопки консультант отвечает по теме,
// а на любое сообщение, написанное вручную, — одной и той же фразой
// с предложением позвонить администратору.
const chatToggle = document.getElementById('chat-toggle');
const chatPanel = document.getElementById('chat-panel');
const chatClose = document.getElementById('chat-close');
const chatMessages = document.getElementById('chat-messages');
const chatForm = document.getElementById('chat-form');
const chatInput = document.getElementById('chat-input');
const chatQuick = document.getElementById('chat-quick');

// Ответы на кнопки: ключ — текст кнопки.
const QUICK_ANSWERS = {
  'Как выбрать квест?': 'Если играете впервые, начните с лёгкого или среднего уровня. Самый популярный квест — «Лаборатория доктора Z». Удобно подобрать по фильтрам в каталоге: сложность, жанр, возраст и число игроков.',
  'Сколько стоит?': 'Цена указана за команду: от 3 000 до 6 000 ₽ в зависимости от квеста и времени. Вечером и в выходные дороже. За игроков сверх базового состава — доплата от 500 ₽. Оплата на месте после игры.',
  'Можно с детьми?': 'Для детей от 6 лет подойдут «Тайна старого чердака» и «Музей забытых вещей». С 12 лет — «Кот Шрёдингера», «Лаборатория доктора Z» и другие. Участники до 14 лет играют со взрослым.',
  'Где вы находитесь?': 'У нас два филиала: ул. Бауманская, 7, стр. 2 (5 минут от м. Бауманская) и ул. Таганская, 24 (7 минут от м. Таганская). Карты — на странице «Контакты».',
};

// Ответ на любое сообщение, написанное вручную.
const CHAT_REPLY = 'Хороший вопрос! Передам его администратору. Быстрее всего ответят по телефону +7 (916) 482-37-15, ежедневно 10:00–23:30.';

function addMessage(text, from) {
  const message = document.createElement('div');
  message.className = `chat-msg chat-msg--${from}`;
  message.textContent = text;
  chatMessages.append(message);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return message;
}

// Показывает вопрос, затем «Анна печатает…» и через 0,9 с — ответ.
function ask(question, answer) {
  addMessage(question, 'user');
  const typing = addMessage('Анна печатает…', 'typing');
  setTimeout(() => {
    typing.remove();
    addMessage(answer, 'bot');
  }, 900);
}

function setChatOpen(open) {
  chatPanel.hidden = !open;
  chatToggle.setAttribute('aria-expanded', String(open));
  chatToggle.classList.toggle('is-open', open);
  if (open) {
    if (!chatMessages.children.length) {
      addMessage('Здравствуйте! Я Анна, консультант «Квест-Лаборатории». Помогу выбрать квест и время. Спросите что угодно или нажмите на готовый вопрос ниже.', 'bot');
    }
    chatInput.focus();
  }
}

if (chatToggle) {
  chatToggle.addEventListener('click', () => setChatOpen(chatPanel.hidden));
  chatClose.addEventListener('click', () => { setChatOpen(false); chatToggle.focus(); });

  // Esc закрывает чат.
  chatPanel.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { setChatOpen(false); chatToggle.focus(); }
  });

  // Сообщение, написанное вручную, — всегда одна и та же фраза.
  chatForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const text = chatInput.value.trim();
    if (!text) return;
    chatInput.value = '';
    ask(text, CHAT_REPLY);
  });

  // Готовые вопросы-кнопки — ответ по теме.
  chatQuick.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button) return;
    const question = button.textContent.trim();
    ask(question, QUICK_ANSWERS[question] || CHAT_REPLY);
  });
}


// ---------- 4. Отзывы игроков ----------
// Отзывы, оставленные через форму, хранятся в localStorage под ключами
// ql-reviews-<квест>, например ql-reviews-ward13.
// В разметке у блоков рейтинга есть data-атрибуты с исходными значениями:
// data-base-sum (сумма оценок), data-base-count (число отзывов), data-base-five (сколько «пятёрок»).
// Скрипт добавляет к ним новые отзывы и обновляет среднюю оценку, звёзды и счётчики.
const QLReviews = (() => {
  const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля',
    'августа', 'сентября', 'октября', 'ноября', 'декабря'];
  const PREFIX = 'ql-reviews-';

  function load(slug) {
    try {
      return JSON.parse(localStorage.getItem(PREFIX + slug)) || [];
    } catch {
      return [];
    }
  }

  function save(slug, review) {
    const reviews = load(slug);
    reviews.push(review);
    localStorage.setItem(PREFIX + slug, JSON.stringify(reviews));
  }

  // Все сохранённые отзывы: { ward13: [...], attic: [...] }.
  function all() {
    const result = {};
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key.startsWith(PREFIX)) result[key.slice(PREFIX.length)] = load(key.slice(PREFIX.length));
    }
    return result;
  }

  // Склонение: 1 отзыв, 2 отзыва, 5 отзывов.
  function plural(n, one, few, many) {
    const mod10 = n % 10;
    const mod100 = n % 100;
    if (mod10 === 1 && mod100 !== 11) return one;
    if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
    return many;
  }

  function starsHtml(rating) {
    return `<span class="rating-stars" role="img" aria-label="Оценка ${rating} из 5">${'★'.repeat(rating)}`
      + `<span class="rating-stars__empty">${'★'.repeat(5 - rating)}</span></span>`;
  }

  // Карточка отзыва. Текст вставляется через textContent — HTML в отзыве не сработает.
  function createCard(review) {
    const column = document.createElement('div');
    column.className = 'col-12 col-md-6 col-lg-4';
    const date = new Date(review.date);

    column.innerHTML = `
      <article class="card h-100 review-card review-card--new">
        <div class="card-body d-flex flex-column">
          <div class="d-flex align-items-center gap-3 mb-3">
            <span class="review-card__avatar review-card__avatar--1" aria-hidden="true"></span>
            <div>
              <h3 class="h6 mb-0"></h3>
              <time class="small text-body-secondary"></time>
            </div>
            <span class="ms-auto">${starsHtml(review.rating)}</span>
          </div>
          <p class="card-text mb-0"></p>
          <p class="mt-3 mb-0"><span class="badge rounded-pill text-bg-primary">Новый отзыв</span></p>
        </div>
      </article>`;

    column.querySelector('.review-card__avatar').textContent = review.name[0].toUpperCase();
    column.querySelector('h3').textContent = review.name;
    column.querySelector('time').textContent = `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
    column.querySelector('time').dateTime = date.toISOString().slice(0, 10);
    column.querySelector('.card-text').textContent = review.text;

    if (review.mode) {
      const badge = document.createElement('span');
      badge.className = 'badge rounded-pill review-card__mode ms-2';
      badge.textContent = `Режим: ${review.mode}`;
      column.querySelector('.mt-3').append(badge);
    }
    return column;
  }

  // Пересчитывает все рейтинги и счётчики на странице.
  function updateRatings() {
    const stored = all();
    const allStored = Object.values(stored).flat();

    document.querySelectorAll('[data-rating-for]').forEach((block) => {
      const slug = block.dataset.ratingFor;
      const extra = slug === 'all' ? allStored : (stored[slug] || []);

      const count = Number(block.dataset.baseCount) + extra.length;
      const sum = Number(block.dataset.baseSum) + extra.reduce((total, r) => total + r.rating, 0);
      const five = Number(block.dataset.baseFive) + extra.filter((r) => r.rating === 5).length;
      const average = sum / count;

      const avgElement = block.querySelector('[data-rating-avg]');
      if (avgElement) avgElement.textContent = average.toFixed(1).replace('.', ',');

      const starsElement = block.querySelector('.rating-stars');
      if (starsElement) starsElement.outerHTML = starsHtml(Math.round(average));

      const countElement = block.querySelector('[data-rating-count]');
      if (countElement) {
        countElement.textContent = countElement.dataset.ratingCount === 'dative'
          ? `по ${count} ${plural(count, 'отзыву', 'отзывам', 'отзывам')}`
          : `${count} ${plural(count, 'отзыв', 'отзыва', 'отзывов')}`;
      }

      const fiveElement = block.querySelector('[data-rating-five]');
      if (fiveElement) fiveElement.textContent = Math.round((100 * five) / count);
    });

    // Общее число отзывов в тексте и на кнопке «Все отзывы».
    const total = document.querySelector('[data-rating-for="all"]');
    if (total) {
      const totalCount = Number(total.dataset.baseCount) + allStored.length;
      document.querySelectorAll('[data-total-count]').forEach((el) => { el.textContent = totalCount; });

      // Полоски распределения оценок на странице всех отзывов.
      document.querySelectorAll('[data-dist-row]').forEach((row) => {
        const stars = Number(row.dataset.distRow);
        const value = Number(row.dataset.base) + allStored.filter((r) => r.rating === stars).length;
        const percent = Math.round((100 * value) / totalCount);
        row.querySelector('.progress-bar').style.width = `${percent}%`;
        row.querySelector('.progress').setAttribute('aria-valuenow', percent);
        row.querySelector('.progress').setAttribute('aria-label', `Оценка ${stars}: ${value} ${plural(value, 'отзыв', 'отзыва', 'отзывов')}`);
        row.querySelector('.rating-dist__count').textContent = value;
      });
    }
  }

  // Показывает сохранённые отзывы в начале списков с data-review-list.
  function renderStored() {
    document.querySelectorAll('[data-review-list]').forEach((list) => {
      load(list.dataset.reviewList).forEach((review) => list.prepend(createCard(review)));
    });
  }

  return { load, save, createCard, updateRatings, renderStored };
})();

window.QLReviews = QLReviews;
QLReviews.renderStored();
QLReviews.updateRatings();
