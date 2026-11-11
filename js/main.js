// ==========================================================
// Квест-Лаборатория: бронирование
// 1) подставляет квест, день и время в модальное окно;
// 2) проверяет формы встроенной валидацией Bootstrap;
// 3) показывает уведомление (toast) после отправки;
// 4) прокручивает ленту категорий на главной кнопками « и »;
// 5) показывает поле «Режим игры» только для хоррор-квестов;
// 6) оставляет в списке «Игроков» только допустимое для квеста количество;
// 7) считает стоимость брони: сеанс + доплата за игроков + дополнительные услуги.
// ==========================================================

const bookingModal = document.getElementById('booking-modal');
const bookingToast = document.getElementById('booking-toast');

// 1. Заполнение модального окна.
// Bootstrap перед показом окна генерирует событие show.bs.modal.
// В event.relatedTarget лежит кнопка, по которой нажали, —
// из её data-атрибутов берём квест, день и время.
if (bookingModal) {
  bookingModal.addEventListener('show.bs.modal', (event) => {
    const button = event.relatedTarget;
    if (!button) return;

    const quest = button.dataset.quest;
    const day = button.dataset.day;
    const time = button.dataset.time;

    const questSelect = bookingModal.querySelector('#booking-quest');
    if (quest) questSelect.value = quest;
    if (day) bookingModal.querySelector('#booking-day').value = day;
    bookingModal.querySelector('#booking-time').value = time || '';

    // Сообщаем полю «Режим игры», что квест поменялся (см. пункт 5).
    questSelect.dispatchEvent(new Event('change'));

    // Если на странице хоррор-квеста выбран режим — переносим его в форму.
    const pageMode = document.querySelector('input[name="quest-mode"]:checked');
    if (pageMode) bookingModal.querySelector('#booking-mode').value = pageMode.value;
  });
}

// 2. Проверка форм.
// Стандартный приём из документации Bootstrap: класс was-validated
// включает красные/зелёные рамки и тексты .invalid-feedback.
document.querySelectorAll('.needs-validation').forEach((form) => {
  form.addEventListener('submit', (event) => {
    // Сервера пока нет, поэтому настоящую отправку отменяем всегда.
    event.preventDefault();

    if (!form.checkValidity()) {
      form.classList.add('was-validated');
      // Переводим фокус на первое ошибочное поле.
      form.querySelector(':invalid')?.focus();
      return;
    }

    form.classList.remove('was-validated');
    form.reset();

    // Если форма в модальном окне — закрываем окно.
    const modalElement = form.closest('.modal');
    if (modalElement) {
      bootstrap.Modal.getInstance(modalElement)?.hide();
    }

    // 3. Уведомление об успешной отправке.
    if (bookingToast) {
      bootstrap.Toast.getOrCreateInstance(bookingToast).show();
    }
  });

  // При очистке формы убираем подсветку ошибок.
  form.addEventListener('reset', () => form.classList.remove('was-validated'));
});

// 4. Лента категорий на главной.
// Кнопка с data-scroll="1" листает вперёд, с data-scroll="-1" — назад,
// на ширину видимой части ленты.
const categoryList = document.getElementById('category-list');

document.querySelectorAll('.category-scroll-btn').forEach((button) => {
  button.addEventListener('click', () => {
    const direction = Number(button.dataset.scroll);
    categoryList.scrollBy({ left: direction * categoryList.clientWidth * 0.8 });
  });
});

// 5. Поле «Режим игры».
// У блока поля есть атрибут data-mode-for с id списка квестов.
// У хоррор-квестов в этом списке есть атрибут data-horror.
// Если выбран хоррор-квест — поле видно и обязательно, иначе скрыто и выключено
// (выключенное поле браузер не проверяет и не отправляет).
document.querySelectorAll('[data-mode-for]').forEach((field) => {
  const questSelect = document.getElementById(field.dataset.modeFor);
  const modeSelect = field.querySelector('select');

  const update = () => {
    const isHorror = questSelect.selectedOptions[0]?.hasAttribute('data-horror') ?? false;
    field.classList.toggle('d-none', !isHorror);
    modeSelect.disabled = !isHorror;
  };

  questSelect.addEventListener('change', update);
  questSelect.form.addEventListener('reset', () => setTimeout(update));
  update();
});

// 6. Количество игроков в окне бронирования.
// У каждого квеста в списке есть data-min и data-max — сколько игроков он вмещает.
// Варианты вне этого диапазона прячем, чтобы нельзя было выбрать 8 человек в квест на 4.
const bookingQuest = document.getElementById('booking-quest');
const bookingPlayers = document.getElementById('booking-players');

if (bookingQuest && bookingPlayers) {
  bookingQuest.addEventListener('change', () => {
    const option = bookingQuest.selectedOptions[0];
    const min = Number(option.dataset.min) || 2;
    const max = Number(option.dataset.max) || 8;

    Array.from(bookingPlayers.options).forEach((playerOption) => {
      if (!playerOption.value) return; // пункт «Сколько вас будет»
      const count = Number(playerOption.value);
      playerOption.hidden = count < min || count > max;
      playerOption.disabled = playerOption.hidden;
    });

    // Если уже выбранное число не подходит новому квесту — сбрасываем выбор.
    if (bookingPlayers.selectedOptions[0]?.disabled) bookingPlayers.value = '';
  });
}

// 7. Расчёт стоимости в окне бронирования.
// Цены берутся из data-атрибутов выбранного квеста:
// data-price — цена дневного сеанса за команду до data-included человек,
// data-extra — доплата за каждого следующего игрока.
// Сеансы с 17:00 дороже на 800 ₽ (как в расписании на странице квеста).
const EVENING_SURCHARGE = 800;
const bookingForm = document.getElementById('booking-form');
const bookingTime = document.getElementById('booking-time');
const bookingLines = document.getElementById('booking-lines');
const bookingTotal = document.getElementById('booking-total');
const bookingTotalFooter = document.getElementById('booking-total-footer');
const serviceVideo = document.getElementById('service-video');
const serviceWatch = document.getElementById('service-watch');
const watchCountField = document.getElementById('service-watch-count-field');
const watchCount = document.getElementById('service-watch-count');
const serviceEscort = document.getElementById('service-escort');
const escortField = document.querySelector('[data-escort-only]');

// 3500 → «3 500 ₽»
function formatPrice(value) {
  return `${value.toLocaleString('ru-RU')} ₽`;
}

function priceLine(label, value) {
  return `<li class="d-flex justify-content-between gap-3"><span>${label}</span><span class="text-nowrap">${formatPrice(value)}</span></li>`;
}

function updateBookingPrice() {
  const quest = bookingQuest.selectedOptions[0];

  // Сопровождение доступно только в квестах для детей.
  const hasEscort = Boolean(quest && quest.hasAttribute('data-escort'));
  escortField.classList.toggle('d-none', !hasEscort);
  serviceEscort.disabled = !hasEscort;
  if (!hasEscort) serviceEscort.checked = false;

  // Поле «сколько гостей» показываем, только если отмечено наблюдение.
  watchCountField.classList.toggle('d-none', !serviceWatch.checked);

  if (!quest || !quest.value) {
    bookingLines.innerHTML = '<li class="text-body-secondary">Выберите квест, время и количество игроков.</li>';
    bookingTotal.textContent = '—';
    bookingTotalFooter.textContent = '—';
    return;
  }

  const included = Number(quest.dataset.included);
  const extraPerPlayer = Number(quest.dataset.extra);
  const hour = Number(bookingTime.value.split(':')[0]);
  const isEvening = bookingTime.value !== '' && hour >= 17;
  const sessionPrice = Number(quest.dataset.price) + (isEvening ? EVENING_SURCHARGE : 0);

  const lines = [];
  let total = 0;

  const sessionLabel = `Сеанс ${isEvening ? 'вечером' : 'днём'}, команда до ${included} чел.`;
  lines.push(priceLine(sessionLabel, sessionPrice));
  total += sessionPrice;

  // Доплата за игроков сверх включённых в цену.
  const players = Number(bookingPlayers.value) || 0;
  const extraPlayers = Math.max(0, players - included);
  if (extraPlayers > 0) {
    lines.push(priceLine(`Доп. игроки: ${extraPlayers} × ${formatPrice(extraPerPlayer)}`, extraPlayers * extraPerPlayer));
    total += extraPlayers * extraPerPlayer;
  }

  if (serviceVideo.checked) {
    const price = Number(serviceVideo.dataset.price);
    lines.push(priceLine('Видео прохождения', price));
    total += price;
  }

  if (serviceWatch.checked) {
    const guests = Math.min(6, Math.max(1, Number(watchCount.value) || 1));
    const price = guests * Number(serviceWatch.dataset.price);
    lines.push(priceLine(`Наблюдение: ${guests} × ${formatPrice(Number(serviceWatch.dataset.price))}`, price));
    total += price;
  }

  if (serviceEscort.checked) {
    const price = Number(serviceEscort.dataset.price);
    lines.push(priceLine('Сопровождение администратором', price));
    total += price;
  }

  bookingLines.innerHTML = lines.join('');
  bookingTotal.textContent = formatPrice(total);
  bookingTotalFooter.textContent = formatPrice(total);
}

if (bookingForm && bookingLines) {
  // Любое изменение в форме — пересчитываем цену.
  bookingForm.addEventListener('change', updateBookingPrice);
  bookingForm.addEventListener('input', updateBookingPrice);
  bookingForm.addEventListener('reset', () => setTimeout(updateBookingPrice));
  // При открытии окна квест и время уже подставлены — сразу показываем цену.
  bookingModal.addEventListener('shown.bs.modal', updateBookingPrice);
  updateBookingPrice();
}
