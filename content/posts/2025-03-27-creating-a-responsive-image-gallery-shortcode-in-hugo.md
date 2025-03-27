---
title: "Creating a Responsive Image Gallery Shortcode in Hugo"
date: 2025-03-27 10:00:00 +0530
description: "A comprehensive guide to implementing a responsive image gallery with modal view in Hugo using shortcodes"
categories: [Hugo]
tags: ["hugo", "shortcode", "gallery", "tutorial"]
type: post
weight: 25
showTableOfContents: true
---

In this tutorial, I'll walk you through creating a responsive image gallery shortcode for Hugo that includes a modal view for full-size images. This solution provides a clean, grid-based layout with thumbnail images that expand to full size when clicked.

## Features

- Responsive grid layout
- Thumbnail generation with Hugo's image processing
- Modal view for full-size images
- Keyboard navigation (ESC to close)
- Customizable gallery directory
- Check if the gallery directory exists or if it is empty
- Automatic image title extraction from filenames
- Optimized image loading with different sizes for thumbnails and full view

## How to Use

### 1. Create the Shortcode

First, create a new file at `layouts/shortcodes/image-gallery.html` with the code provided below.

### 2. Prepare Your Images

Place your images in the `assets/album/[gallery-name]` directory. For example:

```
assets/
└── album/
├── vacation/
│ ├── beach-sunset.jpg
│ ├── mountain-view.jpg
│ └── city-lights.jpg
└── pets/
├── cat-sleeping.jpg
└── dog-playing.jpg
```

### 3. Use in Your Content

You can use the gallery in two ways:

1. Using the directory name

```markdown
{{</* image-gallery gallery_dir="vacation" */>}}
```

2. Using the current page's name (automatic):

```markdown
{{</* image-gallery */>}}
```

## How It Works

### Directory Structure

The shortcode looks for images in the `assets/album/` directory. You can either specify a gallery directory explicitly using the `gallery_dir` parameter, or it will default to using the current page's filename.

### Image Processing

The shortcode implements two levels of image processing:

1. Thumbnails: `300x300` with quality set to 50%

```hugo
($image.Fill "300x300 q50")
```

2. Full-size images: `1600x1600` with quality set to 50%

```hugo
($image.Fit "1600x1600 q50")
```

### Responsive Grid Layout

The gallery uses CSS Grid to create a responsive layout. Images are arranged in a grid where each thumbnail takes up approximately 19% of the container width, allowing for a 5-column layout on desktop screens.

### Modal Implementation

The modal view is implemented using vanilla JavaScript and includes several user-friendly features:

- Click outside the image to close
- Click the × button to close
- Press ESC key to close
- Automatic image centering
- Smooth transitions

## Customization Options

### Adjusting Thumbnail Size

To modify the thumbnail size, adjust the CSS width percentage in the `.image-gallery li` class:

```css
.image-gallery li {
    width: 19%; /* Change this value */
}
```

### Modifying Image Quality

You can adjust the image quality by changing the `q` parameter in the image processing:

```hugo
($image.Fill "300x300 q50") /* Change q50 to desired quality */
```

### Changing Modal Background

The modal background opacity can be adjusted in the CSS:

```css
.modal {
    background-color: rgba(0, 0, 0, 0.9); /* Adjust opacity here */
}
```

## Performance Considerations

- Images are automatically optimized using Hugo's image processing
- Thumbnails are generated at a smaller size to improve loading times
- The modal image loads only when clicked
- Image quality is set to 50% to balance quality and file size

## Browser Compatibility

This gallery implementation works in all modern browsers and is tested with:

- Chrome/Edge (latest versions)
- Firefox (latest version)
- Safari (latest version)
- Mobile browsers

## Limitations

- No built-in lazy loading (though this could be added)
- No swipe support for mobile (could be implemented with additional JavaScript)
- Requires images to be in the assets directory
- While the code includes alt text, it just uses the filename. You might want to implement a more robust system for alt text, perhaps using front matter or a separate metadata file.

### Integration Steps

1. Save the shortcode file in `layouts/shortcodes/image-gallery.html`

2. Add the CSS to your site, where you have several options:

   **Option A: Include directly in the shortcode**
   - The simplest approach is to keep the CSS within the shortcode file itself, wrapped in `<style>` tags (as shown in our original implementation)
   
   **Option B: Add to your theme's CSS**
   - Create or edit `/static/css/image-gallery.css` in your site directory
   - Add the CSS code there
   - Check your theme's configuration for adding the CSS file. In `Gokarna` theme, it is in the `hugo.toml` file.

3. Include the JavaScript:

   **Option A: Include directly in the shortcode**
   - Keep the JavaScript within the shortcode file itself, wrapped in `<script>` tags (as shown in our original implementation)
   
   **Option B: Add as a separate file**
   - Create `/static/js/image-gallery.js` in your site directory
   - Add the JavaScript code there
   - Check your theme's configuration for adding the JS file. In `Gokarna` theme, it is in the `hugo.toml` file.

4. Create the `assets/album/` directory and add your image galleries

> **Note**: Option A (including CSS and JavaScript directly in the shortcode) is recommended for portability, as it keeps everything self-contained. However, if you're using the gallery extensively throughout your site, Option B might be more maintainable.

Make sure your Hugo configuration allows processing of images in the assets directory. Add the following to your `config.toml`:

```toml
[imaging]
  anchor = "Smart"
  quality = 75
  resampleFilter = "Lanczos"
```

## Final implementation

The shortcode implementation, using an self-contained version of the CSS and JavaScript, would be the following HTML file:

```html
<style>
.image-gallery {
    overflow: auto;
    margin-left: -1% !important;
}

.image-gallery li {
    float: left;
    display: block;
    margin: 0 0 1% 1%;
    width: 19%;
}

.image-gallery li a {
    text-align: center;
    text-decoration: none !important;
    color: #777;
}

.image-gallery li a span {
    display: block;
    text-overflow: ellipsis;
    overflow: hidden;
    white-space: nowrap;
    padding: 3px 0;
}

.image-gallery li a img {
    width: 100%;
    display: block;
}

.gallery-image:focus {
    outline: 2px solid #0066cc;
    outline-offset: 2px;
}

/* Modal styles */
.modal {
    display: none;
    position: fixed;
    z-index: 1000;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.9);
    padding: 20px;
    box-sizing: border-box;
}

.modal-dialog {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-content {
    max-width: 90%;
    max-height: 90vh;
    object-fit: contain;
    margin: auto;
    display: block;
}

.modal-close {
    position: absolute;
    top: 15px;
    right: 25px;
    color: #f1f1f1;
    font-size: 40px;
    font-weight: bold;
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
    z-index: 1001;
}

.modal-close:hover,
.modal-close:focus {
    color: #bbb;
    outline: 2px solid #fff;
    outline-offset: 2px;
    text-decoration: none;
}

/* Add responsive breakpoints */
@media screen and (max-width: 768px) {
    .image-gallery li {
        width: 32%; /* 3 columns for tablets */
    }
}

@media screen and (max-width: 480px) {
    .image-gallery li {
        width: 48%; /* 2 columns for phones */
    }
}

/* Add loading spinner styles */
.loader {
    display: none;
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #555;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    z-index: 1001;
}

@keyframes spin {
    0% { transform: translate(-50%, -50%) rotate(0deg); }
    100% { transform: translate(-50%, -50%) rotate(360deg); }
}

/* Accessibility helper class */
.sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    border: 0;
}

</style>

{{ $dir := .Get "gallery_dir" }}
{{ if not $dir }}
    {{ $dir = .Page.File.BaseFileName }}
{{ end }}
{{ $dirPath := printf "assets/album/%s" $dir }}
{{ if not (fileExists $dirPath) }}
    <p>Gallery directory not found: {{ $dir }}</p>
{{ else }}
    {{ $images := readDir $dirPath }}
    {{ if eq (len $images) 0 }}
        <p>No images found in gallery: {{ $dir }}</p>
    {{ else }}
    <ul class="image-gallery">
    {{ range $images }}
      {{- $imagePath := printf "album/%s/%s" $dir .Name -}}
      {{- if $image := resources.Get $imagePath -}}
        {{- $imagetitle := index (split .Name ".") 0 -}}
        <li>
          <a href="#" data-image="{{ ($image.Fit "1600x1600 q50").Permalink }}" data-title="{{ $imagetitle }}" class="gallery-image">
            <img src="{{ ($image.Fill "300x300 q50").Permalink }}" alt="{{ $imagetitle }}" title="{{ $imagetitle }}">
            <span>{{ $imagetitle }}</span>
          </a>
        </li>
      {{- end -}}
    {{ end }}
    </ul>
    {{ end }}
{{ end }}
</ul>

<!-- Modal with improved accessibility -->
<div id="imageModal" class="modal" role="dialog" aria-modal="true" aria-labelledby="modalTitle" aria-describedby="modalDescription">
  <div class="modal-dialog" role="document">
      <button class="modal-close" aria-label="Close modal">&times;</button>
      <div class="loader" id="imageLoader" aria-hidden="true"></div>
      <img class="modal-content" id="modalImage" alt="">
      <div id="modalTitle" class="sr-only"></div>
      <div id="modalDescription" class="sr-only">Press Escape to close. Use Arrow Left and Arrow Right to navigate between images.</div>
  </div>
</div>


<script>
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
</script>

```

## Conclusion

This image gallery shortcode provides a robust solution for displaying image galleries in Hugo sites. It's lightweight, responsive, and easy to implement. The modal view ensures a good user experience for viewing full-size images, while the thumbnail grid provides an organized overview of your gallery.

Feel free to customize and extend this implementation to better suit your specific needs!
