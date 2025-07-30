document.addEventListener('DOMContentLoaded', () => {
  /* ===================== СЛАЙДЕР ===================== */
  (function initSlider() {
    const slideContainer = document.getElementById('slideContainer');
    let slides = document.querySelectorAll('.slide');
    if (!slideContainer || slides.length === 0) return;

    let slideIndex = 1;
    let autoSlideInterval = null;
    let isSliding = false;

    // Клонируем крайние слайды
    const firstClone = slides[0].cloneNode(true);
    const lastClone  = slides[slides.length - 1].cloneNode(true);
    firstClone.id = 'first-clone';
    lastClone.id  = 'last-clone';
    slideContainer.appendChild(firstClone);
    slideContainer.insertBefore(lastClone, slides[0]);

    slides = document.querySelectorAll('.slide');

    // Адаптивная ширина
    const getSlideWidth = () => slides[0].getBoundingClientRect().width || 0;

    function setPosition(withTransition = false) {
      const slideWidth = getSlideWidth();
      slideContainer.style.transition = withTransition ? 'transform 0.5s ease-in-out' : 'none';
      slideContainer.style.transform = `translateX(-${slideWidth * slideIndex}px)`;
    }

    function changeSlide(delta) {
      if (isSliding) return;
      isSliding = true;
      stopAuto();
      slideIndex += delta;
      setPosition(true);
    }

    slideContainer.addEventListener('transitionend', () => {
      const cur = slides[slideIndex];
      if (!cur) return;

      if (cur.id === 'first-clone') {
        slideIndex = 1;
        setPosition(false);
      } else if (cur.id === 'last-clone') {
        slideIndex = slides.length - 2;
        setPosition(false);
      }

      isSliding = false;
      startAuto();
    });

    // Автослайд
    const startAuto = () => {
      if (autoSlideInterval) return;
      autoSlideInterval = setInterval(() => changeSlide(1), 5000);
    };
    const stopAuto = () => {
      clearInterval(autoSlideInterval);
      autoSlideInterval = null;
    };

    // Инициализация
    setPosition(false);
    startAuto();

    // Кнопки
    const prevButton = document.querySelector('.carousel-nav .prev');
    const nextButton = document.querySelector('.carousel-nav .next');
    if (prevButton) prevButton.addEventListener('click', () => changeSlide(-1));
    if (nextButton) nextButton.addEventListener('click', () => changeSlide(1));

    // Пауза при ховере
    slideContainer.addEventListener('mouseenter', stopAuto);
    slideContainer.addEventListener('mouseleave', startAuto);

    // Пересчёт на ресайз
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => setPosition(false), 100);
    });
  })();


  /* ===================== НАВИГАЦИЯ / КАТАЛОГ ===================== */
  // Бургер-меню верхнего уровня ("Каталог")
  document.querySelectorAll('.main-nav .dropdown > a').forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const parent = a.parentElement;
      const nowOpen = !parent.classList.contains('open');
      parent.classList.toggle('open', nowOpen);
      // синхронизация aria
      a.setAttribute('aria-expanded', String(nowOpen));
      if (!nowOpen) {
        // закрываем все дочерние подменю при сворачивании каталога
        parent.querySelectorAll('li.sub-dropdown.open').forEach(li => {
          li.classList.remove('open');
          const sub = li.querySelector(':scope > .sub-sub');
          if (sub) sub.style.display = 'none';
          const link = li.querySelector(':scope > a');
          if (link) link.setAttribute('aria-expanded', 'false');
        });
      }
    });
  });

  // === Подменю всех уровней: нормализация + hover-intent + клик-переключатель ===
  (function initSubmenus() {
    const nav = document.querySelector('.main-nav');
    if (!nav) return;

    // --- НОРМАЛИЗАЦИЯ: автоматически помечаем пункты с подменю и скрываем их ---
    nav.querySelectorAll('.dropdown-content li').forEach(li => {
      const childSub = li.querySelector(':scope > ul.sub-sub');
      if (childSub) {
        li.classList.add('sub-dropdown');
        li.classList.remove('open');           // закрыто по умолчанию
        childSub.style.display = 'none';       // на всякий случай
        const a = li.querySelector(':scope > a');
        if (a) {
          a.setAttribute('aria-haspopup', 'true');
          a.setAttribute('aria-expanded', 'false');
        }
      }
    });

    const openTimers  = new WeakMap();
    const closeTimers = new WeakMap();

    const hasSub    = (li) => !!li.querySelector(':scope > .sub-sub');
    const submenuOf = (li) => li.querySelector(':scope > .sub-sub');

    const openSub = (li) => {
      const submenu = submenuOf(li);
      if (!submenu) return;

      // Закрываем только соседей текущего уровня
      li.parentElement
        .querySelectorAll(':scope > li.sub-dropdown.open')
        .forEach(sib => { if (sib !== li) closeSub(sib); });

      li.classList.add('open');
      submenu.style.display = 'flex';
      const a = li.querySelector(':scope > a');
      if (a) a.setAttribute('aria-expanded', 'true');
    };

    const closeSub = (li) => {
      const submenu = submenuOf(li);
      if (!submenu) return;
      li.classList.remove('open');
      submenu.style.display = 'none';
      const a = li.querySelector(':scope > a');
      if (a) a.setAttribute('aria-expanded', 'false');
    };

    // Обработчики на каждый пункт с подменю (все уровни)
    nav.querySelectorAll('li.sub-dropdown').forEach(li => {
      // Наведение с задержкой — исключаем мгновенное открытие 3-го уровня
      li.addEventListener('mouseenter', () => {
        if (!hasSub(li)) return;
        clearTimeout(closeTimers.get(li));
        const t = setTimeout(() => openSub(li), 180); // задержка открытия
        openTimers.set(li, t);
      });

      // Уход — небольшая задержка для перехода курсора в дочернее меню
      li.addEventListener('mouseleave', () => {
        if (!hasSub(li)) return;
        clearTimeout(openTimers.get(li));

        const submenu = submenuOf(li);
        const t = setTimeout(() => {
          const stillHover = li.matches(':hover') || (submenu && submenu.matches(':hover'));
          if (!stillHover) closeSub(li);
        }, 150);
        closeTimers.set(li, t);
      });

      // Клик — переключатель (тачпады/мобилки)
      const a = li.querySelector(':scope > a');
      if (a) {
        a.addEventListener('click', (e) => {
          if (!hasSub(li)) return; // обычные ссылки пропускаем
          e.preventDefault();
          e.stopPropagation();
          clearTimeout(openTimers.get(li));
          clearTimeout(closeTimers.get(li));

          if (li.classList.contains('open')) {
            closeSub(li);
          } else {
            // закрыть соседей текущего уровня перед открытием
            li.parentElement
              .querySelectorAll(':scope > li.sub-dropdown.open')
              .forEach(sib => { if (sib !== li) closeSub(sib); });
            openSub(li);
          }
        });
      }
    });
  })();


  /* ===================== МОДАЛЬНОЕ ОКНО ===================== */
  (function initModal() {
    const modal = document.getElementById('modal');
    if (!modal) return;

    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

    function openModal() {
      modal.classList.add('active');
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    function closeModal() {
      const modalRect = modal.getBoundingClientRect();
      modal.style.width = `${modalRect.width}px`;
      modal.classList.remove('active');

      setTimeout(() => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        modal.style.width = '';
      }, 300);
    }

    modal.addEventListener('click', closeModal);

    const closeButton = modal.querySelector('.close');
    if (closeButton) {
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        closeModal();
      });
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
      }
    });

    window.openModal = openModal;
    window.closeModal = closeModal;
  })();


  /* ===================== ЗАКРЫТИЕ КАТАЛОГА СНАРУЖИ ===================== */
  document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.main-nav .dropdown');
    if (!dropdown) return;

    const clickedInsideDropdown = dropdown.contains(e.target);
    if (!clickedInsideDropdown && dropdown.classList.contains('open')) {
      // Закрываем каталог
      dropdown.classList.remove('open');

      // И все открытые подменю внутри него
      dropdown.querySelectorAll('li.sub-dropdown.open').forEach(li => {
        li.classList.remove('open');
        const submenu = li.querySelector(':scope > .sub-sub');
        if (submenu) submenu.style.display = 'none';
        const a = li.querySelector(':scope > a');
        if (a) a.setAttribute('aria-expanded', 'false');
      });

      // Обновляем aria у кнопки каталога
      const btn = dropdown.querySelector(':scope > a');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    }
  });
});

