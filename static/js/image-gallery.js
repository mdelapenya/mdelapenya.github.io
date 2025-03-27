document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const closeBtn = document.getElementsByClassName('modal-close')[0];

    // Open modal
    document.querySelectorAll('.gallery-image').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = "block";
            modalImg.src = this.getAttribute('data-image');
        });
    });

    // Close modal
    closeBtn.onclick = function() {
        modal.style.display = "none";
    }

    // Close on outside click
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }

    // Close on escape key press
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape' && modal.style.display === "block") {
            modal.style.display = "none";
        }
    });
});