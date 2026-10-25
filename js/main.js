// Bootstrap: валідація форми зворотного зв'язку
(function () {
  'use strict';

  const forms = document.querySelectorAll('.needs-validation');

  forms.forEach((form) => {
      form.addEventListener('submit', (event) => {
          if (!form.checkValidity()) {
              event.preventDefault();
              event.stopPropagation();
          }

          form.classList.add('was-validated');
      });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  /* =========================
     ПАГІНАЦІЯ КАТАЛОГУ
  ========================= */
  const productGrid = document.querySelector('.catalog__products');
  const paginationLinks = document.querySelectorAll('.pager__link');
  const productsPerPage = 6;
  let currentPage = 1;

  function showPage(page) {
      if (!productGrid) return;

      const productCards = productGrid.querySelectorAll('.product-card');
      const totalPages = Math.max(
          1,
          Math.ceil(productCards.length / productsPerPage)
      );

      currentPage = Math.min(Math.max(1, page), totalPages);

      productCards.forEach((card, index) => {
          const isVisible =
              index >= (currentPage - 1) * productsPerPage &&
              index < currentPage * productsPerPage;

          card.style.display = isVisible ? '' : 'none';
      });

      updatePagination(totalPages);
  }

  function updatePagination(totalPages) {
      paginationLinks.forEach((link) => {
          const page = Number.parseInt(link.textContent.trim(), 10);
          const isActive = page === currentPage;

          link.classList.toggle('pager__link--active', isActive);
          link.classList.toggle('active', isActive);
          link.setAttribute(
              'aria-current',
              isActive ? 'page' : 'false'
          );

          if (!Number.isNaN(page) && page > totalPages) {
              link.setAttribute('aria-disabled', 'true');
              link.style.pointerEvents = 'none';
              link.style.opacity = '0.5';
          } else {
              link.removeAttribute('aria-disabled');
              link.style.pointerEvents = '';
              link.style.opacity = '';
          }
      });
  }

  if (productGrid && paginationLinks.length > 0) {
      paginationLinks.forEach((link) => {
          link.addEventListener('click', (event) => {
              event.preventDefault();

              const page = Number.parseInt(
                  link.textContent.trim(),
                  10
              );

              if (!Number.isNaN(page)) {
                  showPage(page);
              }
          });
      });

      showPage(currentPage);
  }

  /* =========================
     СЛАЙДЕР
  ========================= */
  const sliderContainer = document.querySelector('.slider__track');
  const sliderItems = Array.from(
      document.querySelectorAll('.slider__item')
  );
  const previousButton = document.querySelector(
      '.slider__button--prev'
  );
  const nextButton = document.querySelector(
      '.slider__button--next'
  );
  const sliderDots = Array.from(
      document.querySelectorAll('.slider__dot')
  );

  if (sliderContainer && sliderItems.length > 0) {
      let currentSlide = sliderItems.findIndex((item) =>
          item.classList.contains('slider__item--pos-3')
      );

      if (currentSlide < 0) currentSlide = 0;

      let autoSlideTimer = null;
      let startX = 0;
      let isDragging = false;
      const dragThreshold = 50;

      function renderSlider() {
          sliderItems.forEach((item, index) => {
              item.classList.remove(
                  'slider__item--pos-1',
                  'slider__item--pos-2',
                  'slider__item--pos-3',
                  'slider__item--pos-4',
                  'slider__item--pos-5',
                  'slider__item--pos-6'
              );

              const position =
                  (index - currentSlide + 2 + sliderItems.length) %
                  sliderItems.length;

              item.classList.add(
                  `slider__item--pos-${position + 1}`
              );
          });

          sliderDots.forEach((dot, index) => {
              dot.classList.toggle(
                  'slider__dot--active',
                  index === currentSlide
              );

              dot.setAttribute(
                  'aria-current',
                  index === currentSlide ? 'true' : 'false'
              );
          });
      }

      function goToSlide(index) {
          currentSlide =
              (index + sliderItems.length) % sliderItems.length;

          renderSlider();
      }

      function nextSlide() {
          goToSlide(currentSlide + 1);
      }

      function previousSlide() {
          goToSlide(currentSlide - 1);
      }

      function stopAutoSlide() {
          if (autoSlideTimer !== null) {
              window.clearInterval(autoSlideTimer);
              autoSlideTimer = null;
          }
      }

      function startAutoSlide() {
          stopAutoSlide();
          autoSlideTimer = window.setInterval(nextSlide, 4000);
      }

      if (previousButton) {
          previousButton.addEventListener('click', () => {
              previousSlide();
              startAutoSlide();
          });
      }

      if (nextButton) {
          nextButton.addEventListener('click', () => {
              nextSlide();
              startAutoSlide();
          });
      }

      sliderDots.forEach((dot, index) => {
          dot.setAttribute('role', 'button');
          dot.setAttribute('tabindex', '0');

          dot.addEventListener('click', () => {
              goToSlide(index);
              startAutoSlide();
          });

          dot.addEventListener('keydown', (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  goToSlide(index);
                  startAutoSlide();
              }
          });
      });

      // Перетягування слайдів мишкою
      sliderContainer.addEventListener('mousedown', (event) => {
          if (event.target.closest('button')) return;

          isDragging = true;
          startX = event.clientX;
          sliderContainer.style.cursor = 'grabbing';
          stopAutoSlide();
      });

      sliderContainer.addEventListener('mousemove', (event) => {
          if (!isDragging) return;

          const difference = event.clientX - startX;

          if (Math.abs(difference) >= dragThreshold) {
              if (difference < 0) {
                  nextSlide();
              } else {
                  previousSlide();
              }

              isDragging = false;
              sliderContainer.style.cursor = '';
              startAutoSlide();
          }
      });

      function endDrag() {
          if (!isDragging) return;

          isDragging = false;
          sliderContainer.style.cursor = '';
          startAutoSlide();
      }

      sliderContainer.addEventListener('mouseup', endDrag);
      sliderContainer.addEventListener('mouseleave', endDrag);

      sliderContainer.addEventListener('dragstart', (event) => {
          event.preventDefault();
      });

      // Початкове відображення та автоматична зміна слайдів
      renderSlider();
      startAutoSlide();
  }

  /* =========================
     ВИПАДАЮЧЕ МЕНЮ КАТЕГОРІЙ
  ========================= */
  const dropdownToggles = document.querySelectorAll(
      '.category-menu__toggle'
  );

  const dropdownMenus = document.querySelectorAll(
      '.category-menu__list'
  );

  dropdownToggles.forEach((toggle) => {
      toggle.setAttribute('aria-expanded', 'false');

      toggle.addEventListener('click', (event) => {
          event.preventDefault();

          const dropdownId = toggle.dataset.dropdown;
          const dropdownMenu = document.getElementById(dropdownId);

          if (!dropdownMenu) return;

          const shouldOpen = !dropdownMenu.classList.contains('show');

          // Закриваємо інші категорії
          dropdownMenus.forEach((menu) => {
              menu.classList.remove('show');

              const relatedToggle = document.querySelector(
                  `.category-menu__toggle[data-dropdown="${menu.id}"]`
              );

              if (relatedToggle) {
                  relatedToggle.setAttribute(
                      'aria-expanded',
                      'false'
                  );
              }
          });

          // Відкриваємо вибрану категорію
          if (shouldOpen) {
              dropdownMenu.classList.add('show');

              toggle.setAttribute('aria-expanded', 'true');
          }
      });
  });

  // Закриваємо меню при кліку поза ним
  document.addEventListener('click', (event) => {
      if (!event.target.closest('.category-menu')) {
          dropdownMenus.forEach((menu) => {
              menu.classList.remove('show');
          });

          dropdownToggles.forEach((toggle) => {
              toggle.setAttribute('aria-expanded', 'false');
          });
      }
  });

});