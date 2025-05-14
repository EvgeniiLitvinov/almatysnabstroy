const slideContainer = document.getElementById('slideContainer');
let slides = document.querySelectorAll('.slide');
const slideWidth = 1290;
let slideIndex = 1;
let autoSlideInterval;
let isSliding = false;

// Клонируем первый и последний слайды
const firstClone = slides[0].cloneNode(true);
const lastClone = slides[slides.length - 1].cloneNode(true);
firstClone.id = 'first-clone';
lastClone.id = 'last-clone';

slideContainer.appendChild(firstClone);
slideContainer.insertBefore(lastClone, slides[0]);

// Обновляем список слайдов после вставки
slides = document.querySelectorAll('.slide');

// Устанавливаем стартовую позицию
slideContainer.style.transform = `translateX(-${slideWidth * slideIndex}px)`;

// Обновление позиции слайдов
function updateSlidePosition() {
    slideContainer.style.transition = 'transform 0.5s ease-in-out';
    slideContainer.style.transform = `translateX(-${slideWidth * slideIndex}px)`;
}

// Смена слайда
function changeSlide(direction) {
    if (isSliding) return;
    isSliding = true;
    stopAutoSlide();

    slideIndex += direction;
    updateSlidePosition();
}

// Обработка завершения анимации
slideContainer.addEventListener('transitionend', () => {
    if (slides[slideIndex].id === 'first-clone') {
        slideContainer.style.transition = 'none';
        slideIndex = 1;
        slideContainer.style.transform = `translateX(-${slideWidth * slideIndex}px)`;
    }

    if (slides[slideIndex].id === 'last-clone') {
        slideContainer.style.transition = 'none';
        slideIndex = slides.length - 2;
        slideContainer.style.transform = `translateX(-${slideWidth * slideIndex}px)`;
    }

    isSliding = false;
    startAutoSlide();
});

// Автослайд
function autoSlide() {
    changeSlide(1);
}

// Запуск автослайдера
function startAutoSlide() {
    autoSlideInterval = setInterval(() => changeSlide(1), 5000);
}

// Остановка автослайдера
function stopAutoSlide() {
    clearInterval(autoSlideInterval);
}

// Инициализация
startAutoSlide();

// Навигация (бургер-меню / каталог)
document.querySelectorAll('.main-nav .dropdown > a').forEach(item => {
    item.addEventListener('click', (e) => {
        e.preventDefault();
        const parent = item.parentElement;
        parent.classList.toggle('open');
    });
});

// ===== Подменю по наведению только на ссылку =====
document.addEventListener('DOMContentLoaded', () => {
    const triggerLink = document.querySelector('.sub-dropdown > a');
    const subMenu = document.querySelector('.sub-dropdown .sub-sub');

    triggerLink.addEventListener('mouseenter', () => {
        subMenu.style.display = 'flex';
    });

    triggerLink.addEventListener('mouseleave', () => {
        setTimeout(() => {
            if (!subMenu.matches(':hover')) {
                subMenu.style.display = 'none';
            }
        }, 150);
    });

    subMenu.addEventListener('mouseenter', () => {
        subMenu.style.display = 'flex';
    });

    subMenu.addEventListener('mouseleave', () => {
        subMenu.style.display = 'none';
    });
});

// ===== Модальное окно =====
const modal = document.getElementById('modal');
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

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
        closeModal();
    }
});

// Закрытие каталога при клике вне
document.addEventListener('click', (e) => {
    const dropdown = document.querySelector('.main-nav .dropdown');
    const isClickInside = dropdown.contains(e.target);

    // Если клик вне и каталог открыт — закрыть
    if (!isClickInside && dropdown.classList.contains('open')) {
        dropdown.classList.remove('open');
    }
});
