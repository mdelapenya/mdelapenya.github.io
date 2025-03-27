document.addEventListener('DOMContentLoaded', function() {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImage');
    const modalTitle = document.getElementById('modalTitle');
    const loader = document.getElementById('imageLoader');
    const closeBtn = document.getElementsByClassName('modal-close')[0];
    const galleryImages = document.querySelectorAll('.gallery-image');
    let currentImageIndex = 0;

    // Store focusable elements and last focused element
    let focusableElements;
    let lastFocusedElement;

    // Function to get all focusable elements in modal
    function getFocusableElements() {
        return modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
    }

    // Function to trap focus in modal
    function trapFocus(e) {
        if (!modal.contains(document.activeElement)) {
            focusableElements[0].focus();
            e.preventDefault();
        }
    }

    // Function to navigate between images
    function navigateImages(direction) {
        currentImageIndex = (currentImageIndex + direction + galleryImages.length) % galleryImages.length;
        const nextImage = galleryImages[currentImageIndex];
        showImage(nextImage);
    }

    // Function to show image in modal
    function showImage(element) {
        loader.style.display = "block";
        modalImg.style.display = "none";
        
        const newImage = new Image();
        newImage.src = element.getAttribute('data-image');
        const imageTitle = element.getAttribute('data-title');
        
        modalTitle.textContent = `Image: ${imageTitle}`;
        modalImg.alt = imageTitle;
        
        newImage.onload = function() {
            loader.style.display = "none";
            modalImg.src = newImage.src;
            modalImg.style.display = "block";
        };
        
        newImage.onerror = function() {
            loader.style.display = "none";
            alert('Error loading image');
            closeModal();
        };
    }

    // Function to open modal
    function openModal(element) {
        lastFocusedElement = document.activeElement;
        modal.style.display = "block";
        currentImageIndex = Array.from(galleryImages).indexOf(element);
        showImage(element);
        
        // Set up focus trap
        focusableElements = getFocusableElements();
        document.addEventListener('focus', trapFocus, true);
        closeBtn.focus();
    }

    // Function to close modal
    function closeModal() {
        modal.style.display = "none";
        document.removeEventListener('focus', trapFocus, true);
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    }

    // Event Listeners
    galleryImages.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            openModal(this);
        });
    });

    closeBtn.onclick = closeModal;

    window.onclick = function(event) {
        if (event.target == modal) {
            closeModal();
        }
    }

    // Enhanced keyboard navigation
    document.addEventListener('keydown', function(event) {
        if (modal.style.display === "block") {
            switch(event.key) {
                case 'Escape':
                    closeModal();
                    break;
                case 'ArrowLeft':
                    navigateImages(-1);
                    break;
                case 'ArrowRight':
                    navigateImages(1);
                    break;
                case 'Tab':
                    if (event.shiftKey && document.activeElement === focusableElements[0]) {
                        focusableElements[focusableElements.length - 1].focus();
                        event.preventDefault();
                    } else if (!event.shiftKey && document.activeElement === focusableElements[focusableElements.length - 1]) {
                        focusableElements[0].focus();
                        event.preventDefault();
                    }
                    break;
            }
        }
    });
});