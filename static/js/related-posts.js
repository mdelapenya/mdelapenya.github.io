(function () {
  var carousel = document.querySelector(".related-posts-carousel");
  if (!carousel) return;

  var list = carousel.querySelector(".related-posts-list");
  var leftBtn = carousel.querySelector(".related-posts-arrow-left");
  var rightBtn = carousel.querySelector(".related-posts-arrow-right");
  var cardWidth = 200 + 16; // card width + gap

  function updateArrows() {
    leftBtn.disabled = list.scrollLeft <= 0;
    rightBtn.disabled = list.scrollLeft + list.clientWidth >= list.scrollWidth - 5;
  }

  leftBtn.addEventListener("click", function () {
    list.scrollBy({ left: -cardWidth * 2, behavior: "smooth" });
  });

  rightBtn.addEventListener("click", function () {
    list.scrollBy({ left: cardWidth * 2, behavior: "smooth" });
  });

  list.addEventListener("scroll", updateArrows);
  window.addEventListener("resize", updateArrows);
  updateArrows();
})();
