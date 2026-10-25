
    // Bootstrap валідація при сабміті форми
    (function () {
        'use strict'
        const forms = document.querySelectorAll('.needs-validation')
        Array.from(forms).forEach(function (form) {
            form.addEventListener('submit', function (event) {
                if (!form.checkValidity()) {
                    event.preventDefault()
                    event.stopPropagation()
                }
                form.classList.add('was-validated')
            }, false)
        })
    })()

document.addEventListener('DOMContentLoaded', function () {

    const productGrid = document.querySelector('.centerblock');
    const paginationLinks = document.querySelectorAll('.pagination a');
    const productsPerPage = 6; 
    let currentPage = 1;

    /* Display the correct page of products */
    function showPage(page) {
        const productCards = productGrid.querySelectorAll('.product-card');
        productCards.forEach((card, index) => {
            if (index >= (page - 1) * productsPerPage && index < page * productsPerPage) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    /* Update pagination links' active state */
    function updatePagination() {
        paginationLinks.forEach(link => {
            link.classList.remove('active');
            if (parseInt(link.textContent) === currentPage) {
                link.classList.add('active');
            }
        });
    }

    /* Handle pagination click events */
    function handlePaginationClick(event) {
        event.preventDefault();
        currentPage = parseInt(event.target.textContent);
        showPage(currentPage);
        updatePagination();
    }

    /* Check if pagination links exist before adding event listeners */
    if (paginationLinks.length > 0) {
        paginationLinks.forEach(link => {
            link.addEventListener('click', handlePaginationClick);
        });
        showPage(currentPage);
        updatePagination();
    }

    /* Slider and its functionality */
    const sliderContainer = document.querySelector('.slider-container');
    const sliderControlsContainer = document.querySelector('.slider-controls');
    const sliderItems = document.querySelectorAll('.slider-item');

    class Carousel {
        constructor(container, items, controls) {
            this.carouselContainer = container;
            this.carouselControls = controls;
            this.carouselArray = [...items];
            this.isDragging = false;
            this.startX = 0;
            this.currentX = 0;
            this.animationID = 0;
            this.threshold = 50; 
            this.addDragEvents(); // Dragging slides
            this.startAutoSlide(); // Switch slides automatically
        }

        updateSlider() {
            this.carouselArray.forEach(el => {
                el.classList.remove('slider-item-1', 'slider-item-2', 'slider-item-3', 'slider-item-4', 'slider-item-5', 'slider-item-6');
            });
            this.carouselArray.slice(0, 6).forEach((el, i) => {
                el.classList.add(`slider-item-${i + 1}`);
            });
        }

        setCurrentState(direction) {
            if (direction.className.includes('slider-controls-previous')) {
                this.carouselArray.unshift(this.carouselArray.pop());
            } else {
                this.carouselArray.push(this.carouselArray.shift());
            }
            this.updateSlider();
        }

        setControls() {
            this.carouselControls.forEach(control => {
                const controlButton = document.createElement('button');
                controlButton.classList.add(`slider-controls-${control}`);
                controlButton.dataset.direction = control;
                const icon = document.createElement('i');
                icon.classList.add(control === 'previous' ? 'ri-arrow-left-s-line' : 'ri-arrow-right-s-line');
                controlButton.appendChild(icon);
                sliderControlsContainer.appendChild(controlButton);
            });
        }

        useControls() {
            const triggers = [...sliderControlsContainer.childNodes];
            triggers.forEach(control => {
                control.addEventListener('click', e => {
                    e.preventDefault();
                    this.setCurrentState(control);
                });
            });
        }


        //Dragging sliders 

        addDragEvents() {
            this.carouselContainer.addEventListener('mousedown', this.startDrag.bind(this));
            this.carouselContainer.addEventListener('mouseup', this.endDrag.bind(this));
            this.carouselContainer.addEventListener('mouseleave', this.endDrag.bind(this));
            this.carouselContainer.addEventListener('mousemove', this.drag.bind(this));
            this.carouselContainer.addEventListener('dragstart', (e) => e.preventDefault()); 
        }

        startDrag(event) {
            this.isDragging = true;
            this.startX = event.clientX;
            this.carouselContainer.style.cursor = 'grabbing';
        }

        drag(event) {
            if (!this.isDragging) return;
            event.preventDefault(); 
            this.currentX = event.clientX;
            const diff = this.currentX - this.startX;

            if (Math.abs(diff) > this.threshold) {
                if (diff > 0) {
                    this.setCurrentState({ className: 'slider-controls-previous' });
                } else {
                    this.setCurrentState({ className: 'slider-controls-next' });
                }
                this.isDragging = false; 
            }
        }

        endDrag() {
            this.isDragging = false;
            this.carouselContainer.style.cursor = 'grab';
        }

        // Switch slides automatically every 4 secs
        startAutoSlide() {
            setInterval(() => {
                this.setCurrentState({ className: 'slider-controls-next' });
            }, 4000); 
        }
    }

    const exampleCarousel = new Carousel(sliderContainer, sliderItems, ['previous', 'next']);
    exampleCarousel.setControls();
    exampleCarousel.useControls();
});


/* Dropdown menu */
const dropdownToggles = document.querySelectorAll('.custom-dropdown-toggle');
        
dropdownToggles.forEach(toggle => {
    toggle.addEventListener('click', (event) => {
        event.preventDefault();
        const dropdownId = toggle.dataset.dropdown;
        const dropdownMenu = document.getElementById(dropdownId);

        if (dropdownMenu.classList.contains('show')) {
            dropdownMenu.classList.remove('show');
        } else {
            // Close all other menu tabs before opening the new one
            document.querySelectorAll('.custom-dropdown-menu').forEach(menu => {
                if (menu !== dropdownMenu) {
                    menu.classList.remove('show');
                }
            });
            dropdownMenu.classList.add('show');
        }
    });
});

// Close menu when clicking out of it
document.addEventListener('click', (event) => {
    if (!event.target.closest('.leftblock')) {
        document.querySelectorAll('.custom-dropdown-menu').forEach(menu => menu.classList.remove('show'));
    }
});


/* Showing products (pagination) */
const productGrid = document.querySelector('.centerblock');
const paginationLinks = document.querySelectorAll('.pagination a');
const productsPerPage = 6; // Card num on a page
let currentPage = 1;

function showPage(page) {
    const productCards = productGrid.querySelectorAll('.product-card');
    productCards.forEach((card, index) => {
        if (index >= (page - 1) * productsPerPage && index < page * productsPerPage) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

function updatePagination() {
    paginationLinks.forEach(link => {
        link.classList.remove('active');
        if (parseInt(link.textContent) === currentPage) {
            link.classList.add('active');
        }
    });
}

function handlePaginationClick(event) {
    event.preventDefault();
    currentPage = parseInt(event.target.textContent);
    showPage(currentPage);
    updatePagination();
}

paginationLinks.forEach(link => {
    link.addEventListener('click', handlePaginationClick);
});

showPage(currentPage);
updatePagination();
        

       