---
title: "Mejora la experiencia del usuario con un framework CSS"
date: 2011-05-05 08:00:00 +0200
image: ""
description: "Hablaremos en este post del desarrollo de interfaces de usuario en entornos web."
categories: [CSS]
tags: ["css", "framework", "blueprint", "960gs", "cssgrid", "yui"]
type: post
weight: 1
language: es
showTableOfContents: true
---

Particularmente soy de la opinión de que una muy buena aplicación puede caer en el olvido si su aspecto es «feo»: puede utilizar los recursos de una manera extra óptima, o los algoritmos utilizados en sus tripas pueden tener un diseño magistral, pero si la interfaz del usuario deja que desear, es muy posible que un usuario no lo valore tanto.Es por ello que voy a hablaros hoy de jQuery y de las ventajas de utilizar un framework frente a no usarlo.

Navegando por internet, encontré [este post](http://www.vcarrer.com/2008/08/when-to-use-css-framework.html) recientemente, en el cual las ventajas de utilizar un framework. Lo voy a intentar traducir, aportando mis consideraciones:

## ¿Qué es framework CSS?

"Un framework CSS es una librería preconstruida cuya finalidad es permitir usar el lenguaje de Hojas de Estilo en Cascada (CSS) de una manera más fácil y más cerca de cumplir los estándares de presentación de una página web" – traducido de [Wikipedia](http://en.wikipedia.org/wiki/CSS_framework#CSS_framework).

## ¿Cuándo usar un framework CSS?

Vamos a considerar los escenarios en los que considero adecuado utilizar un framework:

- Trabajamos en un gran proyecto (en tamaño o en impacto).
- Trabajamos dentro de un equipo y debe establecerse un estándar de codificación.
- Trabajo solo y quiero controlar el código.

## Ventajas y Desventajas de utilizar un framework CSS

### Ventajas (+):

- La mayoría son cross-browser, esto es: los soportan la mayor parte de los navegadores.
- En función del tamaño de la comunidad del framework, así será el soporte a bugs. Lo mismo que para el número de ejemplos de código.
- Te ofrecen la mayor parte del código CSS que necesitarás en mucho tiempo.
- ¡Incluso puedes aprender viendo el código CSS!

### Desventajas (-):

- Habrá algo de código CSS que no se utilizará, pero realmente es despreciable en cuanto al tamaño, ya que el beneficio lo compensa con creces.
- A pesar de no ser de difícil aprendizaje, al principio puede abrumar ver tanto código del framework, y puede llevar cierto tiempo el manejarlo con soltura. Por ello es necesario dedicarle tiempo al aprendizaje del framework, y esto puede causar desánimo inicialmente.
- Para corregir algún bug es imprescindible conocer cómo funciona el framework.

## Ejemplos de frameworks CSS

Os dejo una lista de frameworks CSS, aunque hay muchos más:

- YUI Library
- 960 GridSystem
- Blueprint

### jQueryui

Particularmente recomiendo jQuery, el cual no he añadido en la lista anterior a propósito, ya que los anteriores frameworks ayudan a crear, además de los CSS, los **layouts** (plantillas, disposición de los espacios…), y vengo de un mundo de desarrollo web en el que me baso en Struts Tiles o Velocity como frameworks para generar los layouts (aunque seguramente podrían integrarse ambos frameworks… mmm….según lo escribo pienso en ponerlo en práctica… algún día).

Ya centrándome en jQueryui, lo recomiendo por dos motivos principales:

1. Está muy difundido entre la comunidad de desarrolladores, y
2. Ofrece una variedad bastante grande de combinaciones de estilos en su web [jqueryui.com](http://jqueryui.com/), desde la que podremos utilizar alguna de los interfaces ya existentes, o bien configurar nosotros mismos el aspecto final de nuestra hoja de estilos. Para ello dispone de una (maravillosa) herramienta ([Themeroller](http://jqueryui.com/themeroller/)) para poder personalizar la el aspecto de la hoja de estilos del paquete a descargar, que permite visualizar el aspecto final del paquete en caliente (con todos los widgets del framework cambiando su aspecto según se modifican en la herramienta).

![Montaje con los temas predefinidos en Themeroller](/images/posts/2011-05-05-framework-css/jqueryui-theme-roller-gallery.png)

Además, desde la opción «Roll your Own» podremos personalizar las siguientes categorías, junto con las propiedades asociadas:

- **Font-settings**: Familia, Peso y tamaño
- **Corner-radius**: los píxeles del corner-radius
- **Header/Toolbar**: Color de fondo y textura (via imagen), colores del borde, del texto y de los iconos de las cabeceras de dialogs, tabs, accordion, …
- **Content**: Color de fondo y textura (via imagen), colores del borde, del texto y de los iconos del contenido dialogs, tabs, accordion, …
- **Clickable default-state**: Color de fondo y textura (via imagen), colores del borde, del texto y de los iconos de los elementos clickables de dialogs, tabs, accordion, … en su estado por defecto.
- **Clickable hover-state**: Color de fondo y textura (via imagen), colores del borde, del texto y de los iconos de los elementos clickables de dialogs, tabs, accordion, … al pasar por encima de ellos.
- **Clickable active-state**: Color de fondo y textura (via imagen), colores del borde, del texto y de los iconos de los elementos clickables de dialogs, tabs, accordion, … en su estado activo.
- **Highligth**: Color de fondo y textura (via imagen), colores del borde, del texto y de los iconos de los mensajes de información.
- **Error**: Color de fondo y textura (via imagen), colores del borde, del texto y de los iconos de los mensajes de error.
- **Modal Screen for overlays**: Color de fondo y textura (via imagen)  y opacidad del fondo de las capas modales.
- **Drop Shadows**: Color de fondo y textura (via imagen) , opacidad, grosor de la opacidad, offsets (top y left) y redondeo de las esquinas (en px) de las sombras.

![Montaje con la modificación del tema con Themeroller](/images/posts/2011-05-05-framework-css/jqueryui-theme-roller-your-own.png)

Y con un simple click lo tendríamos listo para descargar!

Además, la documentación online es muy buena, ya que los ejemplos de código están al alcance de la mano, dentro del API, lo cual permite consultar rápidamente la documentación y ver un ejemplo de uso.

Por ello, **mi recomendación es la de SÍ utilizar un framework** (el que cada uno considere interesante) como marco del trabajo, ya que ayudará sobremanera a que el resultado adquiera un valor añadido que sin el framework no tendría.
