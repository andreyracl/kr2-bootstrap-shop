// ==========================================================
// Квест-Лаборатория: форма отзыва на странице квеста
// После проверки отзыв сохраняется в localStorage, появляется первым в списке,
// а средняя оценка и число отзывов пересчитываются (функции — в site.js, QLReviews).
// ==========================================================

const reviewForm = document.getElementById('review-form');
const reviewList = document.getElementById('review-list');

if (reviewForm && reviewList && window.QLReviews) {
  const slug = reviewForm.dataset.quest;

  // Если пользователь вошёл в кабинет — подставляем имя.
  try {
    const user = JSON.parse(localStorage.getItem('ql-user'));
    if (user) reviewForm.elements.name.value = user.name;
  } catch { /* нет данных — ничего не делаем */ }

  reviewForm.addEventListener('submit', (event) => {
    event.preventDefault();

    if (!reviewForm.checkValidity()) {
      reviewForm.classList.add('was-validated');
      reviewForm.querySelector(':invalid')?.focus();
      return;
    }

    const review = {
      name: reviewForm.elements.name.value.trim(),
      rating: Number(reviewForm.elements.rating.value),
      text: reviewForm.elements.text.value.trim(),
      mode: reviewForm.elements.mode ? reviewForm.elements.mode.value : '',
      date: new Date().toISOString(),
    };

    QLReviews.save(slug, review);
    reviewList.prepend(QLReviews.createCard(review));
    QLReviews.updateRatings();

    reviewForm.reset();
    reviewForm.classList.remove('was-validated');
    bootstrap.Collapse.getOrCreateInstance(document.getElementById('review-form-box')).hide();

    const toast = document.getElementById('booking-toast');
    if (toast) {
      document.getElementById('booking-toast-text').textContent = 'Спасибо! Ваш отзыв опубликован.';
      bootstrap.Toast.getOrCreateInstance(toast).show();
    }
  });
}
