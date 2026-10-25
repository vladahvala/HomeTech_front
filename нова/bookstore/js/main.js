// ===== Меню категорій (BEM: .category-menu) =====
(function () {
  var toggles = document.querySelectorAll('.category-menu__toggle');

  toggles.forEach(function (toggle) {
    toggle.addEventListener('click', function (event) {
      event.preventDefault();

      var menu = document.getElementById(toggle.dataset.dropdown);
      if (!menu) return;

      var isOpen = menu.classList.contains('category-menu__list--open');

      // закриваємо всі списки, відкриваємо лише натиснутий
      document.querySelectorAll('.category-menu__list--open').forEach(function (openMenu) {
        openMenu.classList.remove('category-menu__list--open');
      });

      if (!isOpen) {
        menu.classList.add('category-menu__list--open');
      }
    });
  });
})();


// ===== Слайдер (BEM: .slider) =====
// Позиція слайда — модифікатор slider__item--pos-N (1..6), центр — pos-3
(function () {
  var items = Array.prototype.slice.call(document.querySelectorAll('.slider__item'));
  var dots = Array.prototype.slice.call(document.querySelectorAll('.slider__dot'));
  var prev = document.querySelector('.slider__button--prev');
  var next = document.querySelector('.slider__button--next');

  if (!items.length) return;

  var total = items.length;
  var CENTER = 3;
  var positions = items.map(function (_, index) { return index + 1; });

  function render() {
    items.forEach(function (item, index) {
      for (var p = 1; p <= total; p++) {
        item.classList.remove('slider__item--pos-' + p);
      }
      item.classList.add('slider__item--pos-' + positions[index]);
    });

    var centerIndex = positions.indexOf(CENTER);
    dots.forEach(function (dot, index) {
      dot.classList.toggle('slider__dot--active', index === centerIndex);
    });
  }

  function shift(step) {
    positions = positions.map(function (p) {
      return ((p - 1 + step + total) % total) + 1;
    });
    render();
  }

  if (next) next.addEventListener('click', function () { shift(-1); });
  if (prev) prev.addEventListener('click', function () { shift(1); });

  // клік по точці переміщує відповідний слайд у центр
  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      shift(CENTER - positions[index]);
    });
  });

  render();
})();


// ===== Валідація форми зворотного зв'язку (Bootstrap) =====
(function () {
  var forms = document.querySelectorAll('.needs-validation');

  forms.forEach(function (form) {
    form.addEventListener('submit', function (event) {
      if (!form.checkValidity()) {
        event.preventDefault();
        event.stopPropagation();
      }
      form.classList.add('was-validated');
    });
  });
})();
