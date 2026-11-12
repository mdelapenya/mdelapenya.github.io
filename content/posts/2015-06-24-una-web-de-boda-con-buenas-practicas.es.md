---
title: "Crear una web de boda con buenas prácticas de ingeniería de software"
date: 2015-06-24T09:16:43+02:00
description: "Cómo monté la web de mi boda como si fuera un proyecto de verdad: commits pequeños, Git y un deploy en Heroku con cada cambio."
categories: software engineering
tags: [software engineering, heroku, git, instagram]
type: post
weight: 25
translationKey: creating-a-wedding-page-using-software-engineering-best-practices
translatedFrom: 3eaa239
---

Imagina que te casas el próximo verano y decides montar una web bonita para la boda, con fotos chulas e información útil para los invitados.

Imagina que, además, eres ingeniero de software y quieres hacerla tú mismo.

Este post trata de juntar las dos situaciones.

Primero intenté crear una web muy sencilla a partir de una plantilla básica. No debía conectarse a ninguna base de datos, así que decidí no usar ningún CMS o producto de blogs como Wordpress, Joomla!, Blogger, etc., y empecé a escribir HTML puro en **SublimeText3**.

Pronto me di cuenta de que no se me da bien diseñar ni crear páginas HTML bonitas. Busqué una plantilla HTML5, y quizá un framework CSS/JS que permitiera definir transiciones chulas entre las secciones de la web. Así encontré www.html5up.net. Este sitio tiene plantillas muy buenas que puedes descargar y personalizar. Después de probar varias, me quedé con **Big Picture**: [http://html5up.net/big-picture](http://html5up.net/big-picture). No usa el framework CSS más común hoy en día, Twitter Bootstrap. Usa Skel ([http://getskel.com](http://getskel.com)), un framework responsive ligero, que me funcionó muy bien para lo que necesitaba.

Descargué la plantilla y lo primero que hice fue crear un repo de Git, cuyo primer commit inicializaba la web con la plantilla tal cual. Como era un proyecto secreto, usé **[Bitbucket](https://bitbucket.org)** como repo remoto, porque ofrece *repos privados gratis*, que es genial. Así tenía una copia de seguridad del código siempre al día. Y a programar…

## Un cambio, un commit
Aunque fuera un arreglo menor en un texto, hacía commit. Si te obligas a abstraer tu forma de pensar para identificar responsabilidades separadas, podrás hacer commits más pequeños, que traten de una sola cosa. Y con muchos commits, cada uno con su propia responsabilidad, cuando más adelante encuentres un bug (ten por seguro que lo encontrarás), podrás identificar su causa raíz y corregir el commit concreto que lo provocó. Así pude potenciar fácilmente la plantilla por defecto y adaptarla a mis necesidades, por ejemplo añadiendo secciones nuevas o incluso funcionalidades nuevas.

Tengo que decir que es muy importante ver el progreso de lo que haces, así que monté un entorno local donde probar, verificar y revisar tu trabajo. En mi caso, configuré el **Apache 2.4.9** que viene preinstalado en mi MacBookPro con OS X Yosemite.

## Crear interacciones con contenido multimedia
Pensé que sería buena idea que la gente pudiera compartir en la web las fotos hechas durante la boda. Eso le daría un aspecto más interactivo a una web que, si no, sería estática.

Primero pensé en tener un sistema de ficheros, pero no quería pagar por almacenar esas fotos cuando hay servicios gratuitos que lo hacen por mí.

¿Qué opciones hay en este universo? Tengo una cuenta **Flickr** PRO para mis fotos personales, que me da almacenamiento ilimitado, pero ¿cómo me iban a mandar sus fotos los invitados? No, la descarté enseguida.

¿Y **Instagram**? Todo el mundo lo conoce, sabe usarlo y funciona bastante bien para este tipo de eventos. Decidí añadir una integración con Instagram, que recogiera las fotos marcadas con la etiqueta concreta que indiqué a mis invitados que usaran al subir sus imágenes.

Tras varias pruebas encontré una que parecía servir para mi propósito: [https://github.com/NOEinteractive/instagramphp](https://github.com/NOEinteractive/instagramphp). Hice git clone del repo, copié el instagram.php a mi proyecto y añadí la inicialización en mi index.html.

Como te puedes imaginar, tuve que convertir mis ficheros HTML a **PHP** para usar la integración. No fue tan malo, porque el principio del proyecto era mantenerlo simple. Y usar PHP solo requiere un servidor Apache y PHP instalado, algo que tienen todos los proveedores de hosting. Así que pasé todos los HTML a PHP e incluso pude refactorizar y extraer ficheros comunes a includes de PHP, como la cabecera o el pie, reutilizables entre otras páginas.

Vale, para que la integración con Instagram funcione, o mejor dicho, para conectar con los **web-services de Instagram**, tienes que crear una aplicación en Instagram, y te envían un código para tu app. Tendrás que proporcionar un par de valores como credenciales (username y access-token) para conectar con sus servicios web y obtener las imágenes leyendo la salida en formato JSON. Según lo que quieras, puedes obtener todas las imágenes de un usuario, los likes de una imagen, etc., pero en mi caso quería obtener todas las imágenes con la etiqueta que elegí para la boda. Así que modifiqué la integración para conectar con el endpoint específico de etiquetas:

{{< highlight bash >}}
https://api.instagram.com/v1/tags/{tag-name}?access_token=ACCESS-TOKEN
{{< / highlight >}}

Para hacerlo más chulo, trabajé en añadir la foto del usuario que hizo la foto como una insignia "superpuesta" sobre la imagen de Instagram, para que todo el mundo viera quién la hizo (orgullo propio). También añadí el número de likes de cada foto, para darles una alegría a los fotógrafos viendo cuántos likes sacaba la suya.

## Hora del deploy
Bueno, la web está casi lista. Lo siguiente que hay que pensar es dónde publicarla. Como he dicho, podría haber usado un proveedor de hosting, con Apache y PHP instalados por defecto. Pero no quería pagar nada por un proyecto tan pequeño.

Otra cosa rara de los proveedores de hosting, y que odio totalmente, es el **proceso de subida**.

¿Cuántos de vosotros subís sitios Wordpress personalizados a proveedores de hosting? ¿Y cuántos los subís por FTP? ¿Cómo controláis qué se sube, qué se actualiza y qué no? ¿Subís y descargáis la web entera?

FTP está bien para ficheros. Pero para código necesitas otra cosa. Necesitas controlar el despliegue del código que escribes: qué parte se despliega, cuál está lista para publicar. Así que necesitaba un proceso más "de ingeniería" para publicar la web.

Con "de ingeniería" quiero decir controlado. ¿Y cómo controlas el software que produces? Con tu repo de git.

Si puedes publicar y desplegar una versión concreta de tu código, tienes el control del despliegue. ¿Y cómo obtienes versiones concretas de tu código? Con tus commits, que eran pequeños y atómicos. Así puedes ir aportando valor a tu aplicación desplegando un conjunto de commits cada vez que lo necesites. Quizá la proporción de un commit, un deploy sea demasiado… o quizá no. Depende de ti, de tu negocio y de las reglas que te impongan tus jefes. En mi caso, decidí desplegar con cada commit.

Y pensé en **Heroku**.

[Heroku](https://www.heroku.com) es una plataforma de aplicaciones en la nube que soporta Ruby, Node.js, Python, Java y PHP por defecto. Y lo mejor: "**pagas según creces**". Encajaba muy bien con los requisitos de la web de mi boda, que a estas alturas era un proyecto PHP pequeño que no necesitaba una cuenta de pago en Heroku, porque con la gratuita bastaba.

Creé una aplicación en mi cuenta gratuita de Heroku, que permite 5 aplicaciones pequeñas, y la añadí como remoto de mi repo de Git. Y entonces…

{{< highlight bash >}}
git push origin master && git push heroku master
{{< / highlight >}}

Con estos comandos mi repo de Bitbucket y mi aplicación de Heroku quedan sincronizados, ya que Heroku despliega con cada git push.

Incluso podría haber añadido automáticamente un tag de git con cada deploy, pero me pareció innecesario. ¡Y voilà! Mi pequeña web de boda estaba funcionando en Heroku, en el commit que yo había elegido.

El siguiente paso era simplificar el nombre DNS: comprar un dominio y asignarlo a la URL de Heroku. Basta con configurar el dominio para que redirija a tu app y tendrás un nombre sencillo y bonito para ella.

## Métricas
Una vez desplegada, quizá quieras saber cuándo, desde dónde y cómo usa la gente la web de la boda. Para eso integré Google Analytics, para recoger todas esas métricas y ver si el móvil más usado es el iPhone o el Android, o cuál es el navegador más usado, Safari o Chrome. Además, te puede ayudar a decidir si debes arreglar la resolución de la web porque el 44% de tus usuarios usa 360x640 px.

Basta con añadir el script de Google Analytics en tu cabecera y todo funcionará.

## Resumen
Seguro que se te ocurren muchas otras formas, mucho mejores, de conseguir lo que he explicado aquí. Compártelas con nosotros, me encantará escucharte.

Para terminar: tanto si desarrollas un producto de software enorme como si haces un proyecto pequeño, **sigue buenas prácticas**. En lo demás, haz lo que quieras, pero **por favor, por favor, haz commits pequeños, y muchos**.
