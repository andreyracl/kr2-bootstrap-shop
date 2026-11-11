// ==========================================================
// Квест-Лаборатория: бронирование
// 1) подставляет квест, день и время в модальное окно;
// 2) проверяет формы встроенной валидацией Bootstrap;
// 3) показывает уведомление (toast) после отправки;
// 4) прокручивает ленту категорий на главной кнопками « и ».
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

    if (quest) bookingModal.querySelector('#booking-quest').value = quest;
    if (day) bookingModal.querySelector('#booking-day').value = day;
    bookingModal.querySelector('#booking-time').value = time || '';
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
