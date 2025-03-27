document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const loader = document.getElementById('imageLoader');
    const closeBtn = document.getElementsByClassName('modal-close')[0];

    // Open modal
    document.querySelectorAll('.gallery-image').forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            modal.style.display = "block";
            loader.style.display = "block"; // Show loader
            modalImg.style.display = "none"; // Hide image while loading
            
            const newImage = new Image();
            newImage.src = this.getAttribute('data-image');
            
            newImage.onload = function() {
                loader.style.display = "none"; // Hide loader
                modalImg.src = newImage.src;
                modalImg.style.display = "block"; // Show image
            };
            
            newImage.onerror = function() {
                loader.style.display = "none";
                alert('Error loading image');
                modal.style.display = "none";
            };
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