
/* Slide-in sections animation */
document.addEventListener("DOMContentLoaded", function () {
    const sections = document.querySelectorAll(".first, .second, .third, .four, .five, .six");
  
    function checkVisibility() {
      sections.forEach((section) => {
        const rect = section.getBoundingClientRect();
        if (rect.top < window.innerHeight - 100) {
          section.classList.add("show");
        }
      });
    }
  
    window.addEventListener("scroll", checkVisibility);
    checkVisibility(); 
});



/* Scroll to Top Button */
$(window).on(`scroll`, function () {
  $('.scroll-top').toggleClass(`show`, $(window).scrollTop() >= 100);
});

$(`.scroll-top`).on('click', function() {
  $('html, body').stop().animate({scrollTop: 0},
    300);
})

let path = document.querySelector(`.scroll-top path`);
let length_path = path.getTotalLength();

path.style.strokeDasharray = length_path + " " + length_path;
path.style.strokeDashoffset = length_path;
path.getBoundingClientRect();
path.style.transition = path.style.WebkitTransition = "stroke-dashoffset 10ms linear";

function updateScrollTop(){
  let offset = $(document).height() - $(window).height();
  path.style.strokeDashoffset = length_path - ($(window).scrollTop()* length_path)/offset;
}

updateScrollTop();
$(window).scroll(updateScrollTop);