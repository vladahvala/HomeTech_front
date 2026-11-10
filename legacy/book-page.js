"use strict";

// images on page
const imgBtns = Array.from(document.querySelectorAll(".img-btn"));
const mainImg = document.querySelector(".img-main");
const mainImgBtns = Array.from(document.querySelectorAll(".img-main__btn"));
const overlayContainer = document.querySelector(".overlay-container");

// overlay images
const overlayImg = document.querySelector(".item-overlay__img");
const overlayBtns = Array.from(document.querySelectorAll(".overlay-btn"));
const overlayCloseBtn = document.querySelector(".item-overlay__btn");
const overlayImgBtns = Array.from(document.querySelectorAll(".overlay-img__btn"));

// cart
const cartIcon = document.querySelector(".cart_content i");
const cartBox = document.querySelector(".cart_box");
const normalPrice = document.querySelector(".price-box__main-new");
const qtyLabel = document.querySelector(".qty_label");
const proContainer = document.querySelector(".pro_content");
const cart_empty = document.querySelector(".cart_empty");

// btns increment and decrement
const qty = document.querySelector(".price-btn__txt");
const decr = document.querySelector(".price-btn__remove");
const incr = document.querySelector(".price-btn__add");
const addCart = document.querySelector(".price-cart__btn");

let proPrice = 800;
let totalQty = parseInt(qty.innerHTML); // Оновлення кількості товарів (число)
let totalPrice = proPrice * totalQty;
let nextImg = 0; // Додаємо ініціалізацію

/* Function to change main image */
function changeMainImage(index) {
    const imgSrc = imgBtns[index].querySelector("img").src;
    mainImg.src = imgSrc;
    overlayImg.src = imgSrc;
}

/* Event listener for thumbnail images */
imgBtns.forEach((btn, i) => {
    btn.addEventListener("click", () => {
        nextImg = i;
        changeMainImage(i);
    });
});

/* Event listener for main image navigation buttons */
mainImgBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        if (e.target.closest(".img-main__btnlft")) {
            nextImg = nextImg > 0 ? nextImg - 1 : imgBtns.length - 1;
        } else if (e.target.closest(".img-main__btnrgt")) {
            nextImg = nextImg < imgBtns.length - 1 ? nextImg + 1 : 0;
        }
        changeMainImage(nextImg);
    });
});

// Decrement of items
decr.addEventListener('click', () => {
    if (totalQty > 1) {
        totalQty--;
    }
    totalPrice = proPrice * totalQty;
    normalPrice.textContent = "₴" + totalPrice + ".00";
    qty.textContent = totalQty;
});

// Increment of items
incr.addEventListener('click', () => {
    totalQty++;
    totalPrice = proPrice * totalQty;
    normalPrice.textContent = "₴" + totalPrice + ".00";
    qty.textContent = totalQty;
});

// Adding and hiding the cart
cartIcon.addEventListener('click', () => {
    cartBox.classList.toggle('display');
});

addCart.addEventListener('click', () => {
    qtyLabel.style.display = "block";
    qtyLabel.innerHTML = totalQty;

    proContainer.innerHTML = "";

    let html = `
        <img src="https://bookclub.ua/images/db/goods/k/57884_124002_k.jpg" alt="">
        <div class="p_details">
            <p class="pro_txt">Джейн Ейр</p>
            <p class="price">
                ₴${proPrice}.00 <span>x</span> <span class="times">${totalQty}</span> 
                <span class="total">₴${proPrice * totalQty}.00</span>
            </p>
        </div>
        <div class="trash">
            <i class="ri-delete-bin-line trash"></i>
        </div>`;

    proContainer.insertAdjacentHTML("afterbegin", html);
    cart_empty.innerHTML = "";

    document.querySelector('.trash').addEventListener("click", () => {
        cart_empty.innerHTML = "Your Cart is Empty!";
        proContainer.innerHTML = "";
        qtyLabel.style.display = "none";
    });
});

/* Event listener for opening overlay */
mainImg.addEventListener("click", () => {
    overlayContainer.style.display = "block";
});

/* Event listener for closing overlay */
overlayCloseBtn.addEventListener("click", () => {
    overlayContainer.style.display = "none";
});

/* Event listener for overlay navigation */
overlayBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        if (e.target.closest(".item-overlay__btnlft")) {
            nextImg = nextImg > 0 ? nextImg - 1 : imgBtns.length - 1;
        } else if (e.target.closest(".item-overlay__btnrgt")) {
            nextImg = nextImg < imgBtns.length - 1 ? nextImg + 1 : 0;
        }
        changeMainImage(nextImg);
    });
});

/* Event listener for overlay thumbnail navigation */
overlayImgBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
        const index = parseInt(e.target.closest(".overlay-img__btn").dataset.img);
        nextImg = index;
        changeMainImage(index);
    });
});
