// ==========================================================
// Квест-Лаборатория: фильтры каталога
// У каждой колонки с карточкой есть data-атрибуты:
// data-difficulty, data-genre, data-age, data-min-players,
// data-max-players, data-features.
// Скрипт сравнивает их с выбранными фильтрами и прячет лишние карточки.
// ==========================================================

const filtersForm = document.getElementById('filters-form');
const questItems = document.querySelectorAll('#quest-list > [data-difficulty]');
const resultsCount = document.getElementById('results-count');
const emptyState = document.getElementById('empty-state');
const emptyReset = document.getElementById('empty-reset');

// Жанры для кнопок «Не страшный» / «Страшный или хоррор» на главной.
const SCARE_GENRES = {
  no: ['adventure', 'detective', 'scifi'],
  yes: ['horror', 'mystic'],
};

// Значения отмеченных чекбоксов с указанным name.
function checkedValues(name) {
  return Array.from(filtersForm.querySelectorAll(`input[name="${name}"]:checked`))
    .map((input) => input.value);
}

function applyFilters() {
  const difficulties = checkedValues('difficulty');
  const genres = checkedValues('genre');
  const features = checkedValues('feature');
  const age = Number(filtersForm.elements.age.value);         // 0 — «любой»
  const players = Number(filtersForm.elements.players.value); // 0 — «любое»

  let visible = 0;

  questItems.forEach((item) => {
    const data = item.dataset;
    const itemFeatures = data.features.split(' ');
    const matches =
      (difficulties.length === 0 || difficulties.includes(data.difficulty)) &&
      (genres.length === 0 || genres.includes(data.genre)) &&
      features.every((feature) => itemFeatures.includes(feature)) &&
      (!age || Number(data.age) <= age) &&
      (!players || (players >= Number(data.minPlayers) && players <= Number(data.maxPlayers)));

    // Класс Bootstrap d-none скрывает элемент (display: none).
    item.classList.toggle('d-none', !matches);
    if (matches) visible += 1;
  });

  resultsCount.textContent = visible;
  emptyState.hidden = visible > 0;
}

// Отмечает чекбоксы группы name, значения которых есть в списке values.
function checkValues(name, values) {
  values.forEach((value) => {
    const checkbox = filtersForm.querySelector(`input[name="${name}"][value="${value}"]`);
    if (checkbox) checkbox.checked = true;
  });
}

// Фильтры из адреса страницы. Так работают ссылки категорий с главной:
// catalog.html?difficulty=easy, ?scare=no, ?age=12, ?players=6, ?feature=actor.
function applyFiltersFromUrl() {
  const params = new URLSearchParams(window.location.search);

  checkValues('difficulty', params.getAll('difficulty'));
  checkValues('genre', params.getAll('genre'));
  checkValues('feature', params.getAll('feature'));
  checkValues('genre', SCARE_GENRES[params.get('scare')] || []);

  if (params.has('age')) filtersForm.elements.age.value = params.get('age');
  if (params.has('players')) filtersForm.elements.players.value = params.get('players');

  applyFilters();
}

if (filtersForm) {
  filtersForm.addEventListener('change', applyFilters);

  // После сброса формы значения меняются не сразу, поэтому ждём один тик.
  filtersForm.addEventListener('reset', () => setTimeout(applyFilters));

  emptyReset.addEventListener('click', () => filtersForm.reset());

  applyFiltersFromUrl();
}
