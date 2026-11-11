---
title: "Liferay Struts Portlet y Ajax"
date: 2011-07-22 08:00:00 +0200
image: ""
description: "Cómo realizar un uso específico de Ajax para presentar datos dentro de un portlet de Struts en Liferay."
categories: [Liferay]
tags: ["liferay", "struts", "ajax", "jquery", "portlet", "java", "servlets"]
type: post
weight: 1
showTableOfContents: true
translationKey: ajax-in-a-struts-portlet-on-liferay
---

En esta entrada me gustaría enseñar cómo realizar un uso específico de Ajax para presentar datos dentro de un portlet de Struts, lo cual considero bastante habitual en las aplicaciones de gestión.

En el ejemplo que nos ocupa, quiero mostrar el detalle de una fila de una tabla en un dialog de jQuery, de modo que en un primer paso se recupere la colección de datos a pintar, sólo los datos de la fila, y a continuación se muestre de forma asíncrona los datos del elemento seleccionado en una capa modal de tipo 'dialog', mejorando en gran medida la usabilidad de la página.

## El entorno

Versión de Liferay: 5.2.3

Tecnología de Portlet: Struts

Framework javascript: jQuery

## La especificación

El objetivo es levantar un dialog de jQuery con la información del detalle de un elemento, utilizando ajax en la recarga. Debería quedar algo parecido a esto:

![Listado de elementos](/images/posts/2011-07-22-liferay-struts-portlet-y-ajax/ajax-listado-elementos.png)

![Detalle recuperado via ajax](/images/posts/2011-07-22-liferay-struts-portlet-y-ajax/ajax-detalle-elemento.png)

## La implementación

Lo primero de todo es tener desarrollado un portlet de Struts, el cual no es el alcance de esta entrada. Seguramente prepare más adelante una entrada explicando cómo construir un portlet de Struts para que despliegue en Liferay.

Lo segundo es presentar, por ejemplo, un listado con los elementos que quiero mostrar su detalle en una capa.

A continuación crearemos un enlace (imagen, botón, etc) al final de la fila para que al pulsarlo se levante una capa con los datos en cuestión, traídos de BBDD via Ajax. Mediante jQuery debemos enlazar el click sobre el enlace para realizar la petición Ajax.

### En la parte servidor

Debemos tener definido un Action de Struts que será llamado a través de Ajax. Para ello, lo habitual: la definimos en el struts-config.xml y la codificamos en el paquete que corresponda.

Es importante tener en cuenta que el forward de este Action será el JSP que presente únicamente los datos concretos del elemento, y que éste será levantado por el dialog una vez se complete la petición Ajax.

Codificando el Action, debemos recoger un ID (por ejemplo) que nos permita ir a BBDD a por los datos del elemento. Lo recogeremos y se lo pasaremos a la request para que esté disponible en el JSP, con `request.setAttribute(...)`.

### En la parte cliente

Tendremos dos JSP: el primero con el listado de elementos, y el segundo con el detalle del elemento seleccionado, a modo de '*include*'.

El JSP detalle únicamente deberá leer de la request el atributo seteado en el Action para pintarlo en pantalla.

El JSP con el listado deberá implementar una función javascript (con jQuery) para hacer la petición Ajax al action correspondiente. La función ajax, llamada desde el enlace de cada fila, podría ser como ésta (dejo un archivo con la implementación de la función): [ajax-struts-portlet](https://mdelapenya.wordpress.com/wp-content/uploads/2011/07/ajax-struts-portlet1.doc)

La clave está en el paso del parámetro **`_spage`** con valor la URL del action. En este caso, **`/portlet_action/portlet_name/module_name/view_detail`** está definida en el struts-config.xml.

Por otro lado, es imprescindible que el WindowState sea **`EXCLUSIVE`**.

Realmente me ha costado bastante llegar aquí, ya que por falta de tiempo o por desacierto con la investigación, siempre encontraba errores. Al principio le pasaba al RenderURL como parámetro «struts_action», lo cual siempre me llevaba en el JSP de detalle a la página definida en el **`viewPage`** del fichero portlet.xml. Pero con esta variación se soluciona ésto y rápidamente conseguimos aumentar la usabilidad de la aplicación, ya que permitimos al usuario visualizar la información en una página, sin amontonarla. Ahora no tardaré más que un par de minutos en presentar los datos de esta manera.

Espero sirva de ayuda, y si tenéis alguna duda tan sólo dejad un comentario 😉
