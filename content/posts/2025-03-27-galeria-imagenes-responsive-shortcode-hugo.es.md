---
title: "Crear una galería de imágenes responsive en Hugo con un shortcode"
date: 2025-03-27 10:00:00 +0530
description: "Guía completa para montar en Hugo una galería de imágenes responsive con vista modal, usando un shortcode"
categories: [Hugo]
tags: ["hugo", "shortcode", "gallery", "tutorial"]
type: post
weight: 25
translationKey: creating-a-responsive-image-gallery-shortcode-in-hugo
translatedFrom: 80a503c
---

En este tutorial te explico paso a paso cómo crear un shortcode de Hugo para una galería de imágenes responsive, con una vista modal para ver las imágenes a tamaño completo. El resultado es una cuadrícula limpia de miniaturas que se amplían al hacer clic.

## Características

- Cuadrícula responsive
- Generación de miniaturas con el procesamiento de imágenes de Hugo
- Vista modal para las imágenes a tamaño completo
- Navegación con teclado (ESC para cerrar)
- Directorio de la galería configurable
- Comprobación de que el directorio de la galería existe y de que no está vacío
- Título de cada imagen extraído automáticamente del nombre del fichero
- Carga optimizada, con tamaños distintos para las miniaturas y para la vista completa

## Cómo usarlo

### 1. Crea el shortcode

Primero, crea un fichero nuevo en `layouts/shortcodes/image-gallery.html` con el código que tienes más abajo.

### 2. Prepara tus imágenes

Coloca las imágenes en el directorio `assets/album/[gallery-name]`. Por ejemplo:

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

### 3. Úsalo en tu contenido

Hay dos formas de usar la galería:

1. Indicando el nombre del directorio

```markdown
{{</* image-gallery gallery_dir="vacation" */>}}
```

2. Usando el nombre de la página actual (automático):

```markdown
{{</* image-gallery */>}}
```

## Cómo funciona

### Estructura de directorios

El shortcode busca las imágenes en el directorio `assets/album/`. Puedes indicar el directorio de la galería de forma explícita con el parámetro `gallery_dir`. Si no lo haces, usa por defecto el nombre del fichero de la página actual.

### Procesamiento de imágenes

El shortcode procesa las imágenes a dos niveles:

1. Miniaturas: `300x300` con la calidad al 50%

```hugo
($image.Fill "300x300 q50")
```

2. Imágenes a tamaño completo: `1600x1600` con la calidad al 50%

```hugo
($image.Fit "1600x1600 q50")
```

### Cuadrícula responsive

La galería usa CSS Grid para adaptarse al ancho de pantalla. Las imágenes se organizan en una cuadrícula donde cada miniatura ocupa aproximadamente el 19% del ancho del contenedor. Así caben 5 columnas en pantallas de escritorio.

### Implementación del modal

El modal está hecho con JavaScript puro e incluye varios detalles pensados para quien lo usa:

- Clic fuera de la imagen para cerrar
- Clic en el botón × para cerrar
- Tecla ESC para cerrar
- Centrado automático de la imagen
- Transiciones suaves

## Opciones de personalización

### Ajustar el tamaño de las miniaturas

Para cambiar el tamaño de las miniaturas, ajusta el porcentaje de ancho en el CSS, dentro de la clase `.image-gallery li`:

```css
.image-gallery li {
    width: 19%; /* Change this value */
}
```

### Modificar la calidad de la imagen

Puedes ajustar la calidad de la imagen cambiando el parámetro `q` en el procesamiento:

```hugo
($image.Fill "300x300 q50") /* Change q50 to desired quality */
```

### Cambiar el fondo del modal

La opacidad del fondo del modal se puede ajustar en el CSS:

```css
.modal {
    background-color: rgba(0, 0, 0, 0.9); /* Adjust opacity here */
}
```

## Consideraciones de rendimiento

- Las imágenes se optimizan automáticamente con el procesamiento de imágenes de Hugo
- Las miniaturas se generan en un tamaño menor para que la página cargue más rápido
- La imagen del modal solo se carga cuando haces clic
- La calidad de la imagen está al 50% para equilibrar calidad y tamaño de fichero

## Compatibilidad con navegadores

Esta galería funciona en todos los navegadores modernos y está probada con:

- Chrome/Edge (últimas versiones)
- Firefox (última versión)
- Safari (última versión)
- Navegadores móviles

## Limitaciones

- No incluye lazy loading (aunque se podría añadir)
- No admite gestos de deslizamiento (swipe) en móvil (se podría implementar con JavaScript adicional)
- Requiere que las imágenes estén en el directorio assets
- Aunque el código incluye texto alternativo, solo usa el nombre del fichero. Quizá te interese montar un sistema más robusto para el texto alternativo, por ejemplo con el front matter o con un fichero de metadatos aparte.

### Pasos de integración

1. Guarda el fichero del shortcode en `layouts/shortcodes/image-gallery.html`

2. Añade el CSS a tu sitio. Tienes varias opciones:

   **Opción A: incluirlo directamente en el shortcode**
   - Lo más sencillo es dejar el CSS dentro del propio fichero del shortcode, entre etiquetas `<style>` (como se ve en nuestra implementación original)
   
   **Opción B: añadirlo al CSS de tu tema**
   - Crea o edita `/static/css/image-gallery.css` en el directorio de tu sitio
   - Añade ahí el código CSS
   - Revisa la configuración de tu tema para saber cómo añadir el fichero CSS. En el tema `Gokarna`, se hace en el fichero `hugo.toml`.

3. Incluye el JavaScript:

   **Opción A: incluirlo directamente en el shortcode**
   - Deja el JavaScript dentro del propio fichero del shortcode, entre etiquetas `<script>` (como se ve en nuestra implementación original)
   
   **Opción B: añadirlo como fichero aparte**
   - Crea `/static/js/image-gallery.js` en el directorio de tu sitio
   - Añade ahí el código JavaScript
   - Revisa la configuración de tu tema para saber cómo añadir el fichero JS. En el tema `Gokarna`, se hace en el fichero `hugo.toml`.

4. Crea el directorio `assets/album/` y añade tus galerías de imágenes

> **Nota**: la opción A (incluir el CSS y el JavaScript directamente en el shortcode) es la recomendada por portabilidad, porque deja todo autocontenido. Pero si usas la galería mucho por todo el sitio, la opción B puede ser más fácil de mantener.

Asegúrate de que la configuración de Hugo permite procesar las imágenes del directorio assets. Añade lo siguiente a tu `config.toml`:

```toml
[imaging]
  anchor = "Smart"
  quality = 75
  resampleFilter = "Lanczos"
```

## Implementación final

La implementación del shortcode, con una versión autocontenida del CSS y del JavaScript, sería este fichero HTML:

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

## Conclusión

Este shortcode ofrece una solución sólida para mostrar galerías de imágenes en sitios Hugo. Es ligero, responsive y fácil de implementar. El modal da una buena experiencia para ver las imágenes a tamaño completo, y la cuadrícula de miniaturas da una visión ordenada de toda la galería.

Úsalo, adáptalo y amplíalo a lo que necesites en tu sitio.
