---
title: "Haciendo webs ultraligeras"
date: 2026-05-21 09:00:00 +0200
description: "En el año 2000 hice un curso de 300 horas para aprender a crear páginas web. En 2026 construí un fan site completo en un par de días con Claude. Este es el arco que une los dos momentos."
categories: [Technology, Software Development, AI]
tags: ["web-development", "historia", "coding-agents", "docker-sandboxes", "ia", "html", "jquery"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-05-21-haciendo-webs-ultraligeras/cover.png"
related:
  - "/posts/2026-04-22-por-que-construi-un-visor-de-trenes-en-tiempo-real"
  - "/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox"
  - "/posts/2026-04-06-tokens-are-the-new-aws-account"
---

![Haciendo webs ultraligeras](/images/posts/2026-05-21-haciendo-webs-ultraligeras/cover.png)

En el año 2000 me matriculé en un curso de creación de páginas web. Duraba 300 horas. Trescientas horas para aprender a escribir HTML.

Hoy, más de 25 años después, construí un fan site completo con Next.js, TypeScript y Vercel en un par de días, con un agente de IA haciendo la mayor parte del trabajo.

Este post no es nostalgia. Es un mapa de cómo ha cambiado el oficio, y por qué los desarrolladores que empiezan ahora tienen una ventaja que no existía antes.

## La primera web: una fan page en HTML plano

El primer proyecto que salió de ese curso fue una página sobre Gwyneth Paltrow. HTML puro, sin CSS externo, sin JavaScript. Cada etiqueta escrita a mano en el Bloc de notas de Windows.

Aprendíamos mirando el código fuente de otras webs. Clic derecho, "Ver código fuente", y a copiar lo que no entendías. No había Stack Overflow. No había tutoriales en vídeo. Había el manual del curso y el botón F12, que entonces no abría ninguna DevTools.

El proceso para saber si algo funcionaba era: guardar el fichero, cambiar a Internet Explorer, pulsar F5. Si el título se veía bien, celebración. Si no, a buscar la etiqueta mal cerrada entre cien líneas de HTML sin indentar.

Recuerdo con especial emoción la primera vez que metí un GIF de una rueda girando dentro de un [`<marquee>`](https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/marquee). La rueda no solo giraba: cruzaba la pantalla rodando.

## 2002: tablas, frames y un contador de visitas

Dos años después construí una web más ambiciosa: "Vampiro: The Beginnings", un sitio de rol alojado en Lycos. El resultado me llevó semanas.

La arquitectura era un `<frameset>` con dos frames: el contenido a la izquierda y el banner publicitario de Lycos a la derecha. El layout entero era una tabla anidada dentro de otra tabla, con `bordercolor="#94dece"` escrito directamente en el HTML. No existía la separación entre estructura y estilos. Todo estaba mezclado.

Para medir las visitas, integré un contador de miarroba.com: un `<script>` externo que pintaba un número en pantalla. Era la analítica de la época. E incluso creé un libro de firmas para que mis amigos pudiesen escribir algo guay.

El código tenía comentarios como `<!--espacio izquierdo para banners//-->`. Cuando lo lees hoy, ves a alguien intentando organizarse en un entorno sin herramientas.

## La carrera de los editores

Los editores de código cuentan la historia de la fricción que fuimos eliminando.

En aquella época, la mayoría de la gente usaba Dreamweaver para construir páginas web, así que ésa es la herramienta que nos enseñaban en el curso. Dreamweaver generaba el HTML por ti con una interfaz visual: arrastrabas elementos, los colocabas, y la herramienta escribía el código. Era cómodo, pero te distanciaba de lo que estaba pasando por debajo. Mirado a distancia, es exactamente lo mismo que pasa hoy con los agentes: en lugar de arrastrar cajitas, escribes un prompt, y la magia ocurre por debajo.

Yo prefería el Bloc de notas. Sabía construir las tablas de memoria. Sin asistente, sin vista previa en tiempo real, sin nada. Esa diferencia importaba: entendías lo que escribías porque no había nada entre tú y el HTML.

Notepad++ llegó y fue un salto real: coloreado de sintaxis, pestañas, búsqueda y reemplazo decente. Seguías escribiendo todo a mano, pero al menos el editor te ayudaba a ver lo que escribías.

En 2011 conocí Sublime Text. Fue otro nivel: multicursor, paleta de comandos, velocidad. Por primera vez el editor se sentía como una herramienta pensada para el trabajo en serio.

Después vino Atom, el editor de GitHub. Más extensible, más lento, pero con un ecosistema de plugins que lo hacía muy adaptable. Y luego VS Code, que ganó la guerra: rápido, extensible, con el soporte de Microsoft detrás y una comunidad que publicaba una extensión para todo.

Cada salto reducía la fricción. Pero el conocimiento seguía siendo tuyo. El editor te ayudaba a escribir; lo que escribías dependía de lo que sabías.

Y lo que había que saber estaba creciendo. JavaScript pasó de ser un adorno (un `alert`, un rollover, una validación tonta de formulario) a ser infraestructura. De repente las páginas tenían que reaccionar sin recargar, mover cosas por la pantalla, hablar con el servidor en segundo plano. Y JavaScript, en aquel momento, era un campo de minas: cada navegador implementaba el DOM a su manera, y un mismo `document.getElementById` podía romperse de tres formas distintas entre Internet Explorer, Firefox y el recién llegado Chrome. Normalizar el comportamiento a mano era un trabajo de arqueología.

## jQuery: la librería que no podías ignorar

En ese caos, jQuery se impuso. Abstraía todas las diferencias de navegador en una API coherente: selectores, eventos, animaciones, AJAX. Lo que antes requería veinte líneas de código condicional se hacía en tres.

Y como funcionaba, se volvió obligatorio. Hubo un período entero en que no usar jQuery era una señal de que no estabas al día: si manipulabas el DOM a mano, alguien te preguntaba por qué. Aprender jQuery dejó de ser una elección y pasó a ser una credencial. No porque fuera difícil, sino porque todo el ecosistema asumía que lo usabas.

Hoy ha desaparecido de la mayoría de proyectos nuevos. Los navegadores modernos implementan de forma nativa lo que añadía. Pero en su momento definió lo que significaba saber frontend.

## La explosión del frontend: territorio ajeno

Después de jQuery vino la gran explosión. React, Vue, Angular. npm, webpack, Babel. El frontend se convirtió en una disciplina con su propio ecosistema, sus propias convenciones y su propia curva de aprendizaje, independiente del backend.

Yo soy backend, principalmente [Go](/posts/2025-10-10-coding-agents). Ese mundo siempre fue territorio ajeno para mí. Podía construir una API robusta, diseñar un sistema de tests de integración con Testcontainers, razonar sobre concurrencia. Pero montar un proyecto de React desde cero, configurar webpack, entender el ciclo de vida de los componentes: eso requería un tiempo de inversión que no siempre tenía.

Durante años esa barrera fue real. Si querías construir algo con frontend, o lo hacías tú a medias o buscabas a alguien que supiera. No había término medio.

## 2026: ultraligera en un par de días

El 8 de mayo estuve en el Toledo Beat Festival. Vi actuar a Ultraligera y me quedé flipado: rock de guitarras fuertes, un frontman con la energía de Axl Rose, una banda que sonaba enorme en directo. Al día siguiente quería una forma de seguirles la pista, ver fechas de conciertos, escuchar su música en un sitio.

Hay un [sitio oficial](https://www.ultraligera.com/), pero es un poco flojo. Así que construí el que me hubiera gustado encontrar.

Lo hice dentro de un [Docker Sandbox](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox) con Claude como agente, desplegado en Vercel. Un fan site no oficial con discografía, fechas y enlaces a Spotify y YouTube. El resultado está en [ultraligera.vercel.app](https://ultraligera.vercel.app); la [ficha del proyecto](/projects/ultraligera/) detalla las automatizaciones que mantienen los datos al día.

Tardé un par de días. Y la clave no es que fuera rápido: es que yo, un desarrollador backend que no domina el frontend, lo construí sin bloquearme. Describí lo que quería, el agente generó el código, yo revisé y ajusté la dirección. El IDE dejó de ser el lugar donde escribes y se convirtió en el lugar donde [supervisas](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot).

Eso es lo que los agentes cambian para los que no son especialistas en un área: eliminan la [barrera entre tener una idea y poder ejecutarla](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day).

## El arco se cierra

Mi primera web fue una fan page de Gwyneth Paltrow, escrita en HTML plano en el Bloc de notas, después de 300 horas de curso. Sólo podía verla en mi equipo.

Mi última web es una fan page de Ultraligera, construida con Next.js y un agente de IA, en un par de días, desplegada automáticamente en Vercel con cada commit en la rama main.

El instinto es el mismo. La fricción no tiene nada que ver.

No hace falta hacer un curso de 300 horas para construir tu primera web. Las herramientas de hoy hace cinco años eran ciencia ficción, y los [tokens de IA](/posts/2026-04-06-tokens-are-the-new-aws-account) comprimen años de aprendizaje en meses. Eso no significa que el conocimiento no importe. Significa que la barrera de entrada ha desaparecido, y lo que queda es la idea.

_Recursos:_
- _[Web en Lycos, rescatada de Web Archive](https://web.archive.org/web/20031017204440/http://usuarios.lycos.es/dorian_themight/)_