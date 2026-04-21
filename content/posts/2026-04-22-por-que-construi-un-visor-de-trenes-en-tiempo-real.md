---
title: "Por qué construí un visor de trenes en tiempo real"
date: 2026-04-22 09:00:00 +0200
description: "Renfe tardó años y 164 millones de euros en renovar su web. Yo construí un visor de trenes en tiempo real en un par de días dentro de un Docker Sandbox. Esta es la historia."
categories: [Technology, AI, Software Development]
tags: ["renfe", "docker-sandboxes", "open-data", "coding-agents", "spain"]
type: post
language: es
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-04-22-por-que-construi-un-visor-de-trenes-en-tiempo-real/cover.png"
related:
  - "/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox"
---

![Por qué construí un visor de trenes en tiempo real](/images/posts/2026-04-22-por-que-construi-un-visor-de-trenes-en-tiempo-real/cover.png)

En enero de 2026, iba con mi familia en un tren a Barcelona. Las noticias del accidente de Adamuz llevaban días en todos los medios. Nuestra línea, Madrid-Barcelona, acumulaba retrasos por reducción de velocidad en varios tramos largos del recorrido debido a problemas en la infraestructura. Quería saber dónde estaba mi tren, cuánto retraso llevaba, y qué estaba pasando en la red. No había forma fácil de saberlo. Así que empecé a construir una app directamente desde el móvil durante el trayecto, usando [GitHub Copilot en modo agente](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox).

En marzo de 2026, Renfe lanzó un visor en tiempo real para trenes de alta velocidad y larga distancia. La noticia se recibió con un titular revelador en Xataka: "La sorpresa no es que Renfe ofrezca un mapa en tiempo real de trenes... la sorpresa es que no parece hecha por Renfe." <sup>[1](#ref-1)</sup> Yo tenía un prototipo desde enero, pero le faltaba todo. En abril necesitaba un proyecto real para demostrar el uso de [Docker Sandboxes](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox), y renfe-maps era el candidato perfecto. Lo retomé dentro de un sandbox con Claude. En un par de días, [renfe-maps](https://renfe-maps.vercel.app) pasó de prototipo a app completa: Cercanías, alertas, streaming en tiempo real cada 5 segundos, y una API abierta. Cubriendo lo que el visor oficial no cubre. Esta es la historia de por qué lo necesitaba y qué descubrí por el camino.

## La historia digital de Renfe: 164 millones después

La relación de Renfe con la tecnología es una historia de presupuestos que nunca son suficientes y resultados que nunca convencen.

En 2009, Renfe adjudicó a Indra 11,5 millones de euros por el "Plan Estratégico de Sistemas de Información de Renfe." <sup>[2](#ref-2)</sup> Los resultados fueron discretos. Las críticas a la web continuaron durante años.

Yo fui tester de la app Android de Renfe en 2013, y recuerdo una reunión con un jefe de proyecto (bastante joven, por cierto). Le pregunté por qué se asignaba el asiento de 4 como el predeterminado si el viajero no solicitaba asiento. Su respuesta: "Es que si no me dices nada, te asigno el de 4." Me quedé boquiabierto. Ese era el nivel de decisiones de producto que se tomaban con 11,5 millones de euros de presupuesto.

En 2019, Renfe sacó a licitación la renovación de su portal por 700.000 euros. <sup>[2](#ref-2)</sup> La reacción del sector fue inmediata. David Bonilla, fundador de Manfred, lo resumió <sup>[2](#ref-2)</sup>: "Con 700.000 euros no creo que puedas pagar ni el 20% de las horas de freelance necesarias." A unos 85.000 euros al año por persona (con coste de empresa), eso da para 8 personas durante un año. "Y con 8 personas en un año no has empezado ni a arreglar la web de Renfe."

En 2023, Renfe cambió de escala: 164 millones de euros repartidos en dos contratos. <sup>[3](#ref-3)</sup> 85,5 millones para Sqills Products BV (sistema de servicio al viajero) y 78,6 millones para la UTE Accenture + Evolutio Cloud Enable (diseño, construcción y operación del nuevo sistema de venta y reserva, incluyendo web, app, taquillas y máquinas de autoventa). 114 veces más que el intento de 2019.

Entre medias, el lanzamiento del AVLO tumbó la web. La campaña "Disculpen las mejoras" en verano de 2025, en pleno caos de retrasos y cancelaciones, se convirtió en meme nacional. <sup>[4](#ref-4)</sup>

El visor de tiempo real para largo recorrido se lanzó el 8 de marzo de 2026 <sup>[5](#ref-5)</sup>, siete semanas después del [accidente de Adamuz](https://es.wikipedia.org/wiki/Accidente_ferroviario_de_Adamuz), que se cobró 46 vidas en la primera colisión entre dos trenes en la red de alta velocidad española. Varios medios enmarcaron el visor como parte de la respuesta de Renfe a la presión pública por más transparencia tras la tragedia. <sup>[4](#ref-4)</sup>

## Dos visores para lo que uno hace solo

Renfe necesitó dos webs separadas para cubrir su red de trenes en tiempo real.

La primera, [tiempo-real.renfe.com](https://tiempo-real.renfe.com/) <sup>[6](#ref-6)</sup>, se lanzó en noviembre de 2025 y cubre solo Cercanías. Xataka la reseñó con sorpresa: funciona bien, y eso ya es noticia tratándose de Renfe. <sup>[1](#ref-1)</sup>

La segunda, [tiempo-real.largorecorrido.renfe.com](https://tiempo-real.largorecorrido.renfe.com/) <sup>[7](#ref-7)</sup>, llegó en marzo de 2026 y cubre AVE, larga distancia y media distancia. Renfe planea unificar ambos visores en noviembre de 2026. <sup>[5](#ref-5)</sup>

[renfe-maps](https://renfe-maps.vercel.app) <sup>[8](#ref-8)</sup> cubre todos los servicios en una sola aplicación. Y añade lo que ninguno de los dos visores oficiales ofrece.

| | Visor oficial (LD) | Visor oficial (Cercanías) | renfe-maps |
|---|---|---|---|
| Servicios | AVE, LD, MD | Cercanías | AVE, LD, MD, Cercanías |
| Actualización | ~15s polling | ~15s polling | SSE cada 5s |
| API abierta | ❌ | ❌ | ✅ REST + SSE + OpenAPI |
| Portal de desarrolladores | ❌ | ❌ | ✅ Scalar |
| Alertas/incidencias | ❌ | ❌ | ✅ |
| Ficha técnica del tren | ❌ | ❌ | ✅ |
| Itinerario completo del tren | ✅ | ❌ | ✅ |
| Trenes pasando por estación | ❌ | ❌ | ✅ |
| Filtro por estado del tren | ❌ | ❌ | ✅ |
| Filtro accesibilidad | ❌ | ❌ | ✅ |
| Búsqueda por tren | ✅ | ❌ | ✅ |
| Seguir tren | ✅ | ✅ | ✅ |

No es que el visor oficial sea malo. Es que está fragmentado, no tiene API, y su modelo de datos es opaco. renfe-maps nació porque necesitaba un visor que cubriera todo, con datos accesibles y documentación OpenAPI generada automáticamente.

## Los datos abiertos de Renfe

Renfe publica 55 datasets en [data.renfe.com](https://data.renfe.com/) <sup>[9](#ref-9)</sup>. Eso incluye horarios estáticos en formato GTFS, posiciones de vehículos en GTFS-RT (actualizadas cada 15 minutos) y alertas de servicio (cada 20 segundos). También hay datos de estaciones, indicadores de calidad y puntualidad.

Lo que falta es un feed de Trip Updates: predicciones de llegada con retrasos estimados. Eso es lo que permitiría saber "tu tren llega 12 minutos tarde a la próxima estación" en lugar de solo "tu tren está aquí en el mapa."

Para poner esto en contexto, así están otros operadores europeos:

- **SNCF** (Francia): GTFS-RT Trip Updates cada 2 minutos. Todo centralizado en [transport.data.gouv.fr](https://transport.data.gouv.fr/).
- **Deutsche Bahn** (Alemania): portal para desarrolladores con retrasos, cancelaciones y cambios de vía en tiempo real.
- **SBB** (Suiza): ventana de predicción de 3 horas. Feeds GTFS-RT completos para todo el transporte público suizo.

Renfe ha mejorado mucho en 2025-2026. Pero sigue por detrás de los principales operadores europeos en calidad de API.

La comunidad ha llenado huecos: [CercaníasDirecto](https://cercaniasdirecto.com/) ofrece un radar de Cercanías usando los datos GTFS de Renfe. [Positrén](https://positren.nebulacodex.com/) muestra trenes de media distancia, larga distancia, AVE y Cercanías en un mapa. David Guardo documentó [cómo construir un mapa de Cercanías](https://davidguardo.com/internet/mapa-en-tiempo-real-de-los-trenes-de-cercanias-renfe-usando-datos-abiertos/) con datos abiertos. Cuando los datos existen, la gente construye cosas.

## Lo que descubrí: las APIs no documentadas

El visor oficial de largo recorrido no usa los feeds GTFS-RT públicos de data.renfe.com. Usa endpoints JSON internos, no documentados, pero accesibles sin autenticación.

Los descubrí inspeccionando el `main.bundle.js` del visor. Dos URLs:

- `https://tiempo-real.largorecorrido.renfe.com/renfe-visor/flotaLD.json` contiene las posiciones de la flota activa (unos 174 trenes). Incluye código comercial, estación anterior y siguiente, hora estimada de llegada, coordenadas y retraso. No incluye rumbo ni velocidad. Ni los feeds GTFS-RT ni los endpoints del visor los incluyen. Tanto renfe-maps como el visor oficial tienen que calcular el bearing en el cliente a partir de los deltas de posición entre ticks. Es un workaround que funciona, pero que no debería ser necesario: si los trenes ya reportan su posición GPS, incluir el rumbo es trivial.

- `https://tiempo-real.largorecorrido.renfe.com/renfe-visor/trenesConEstacionesLD.json` contiene la geometría completa de las rutas: todas las paradas con horarios programados y estimados, paradas completadas y pendientes. Este endpoint es el que desbloqueó el itinerario completo de cada tren y la lista de trenes que pasan por una estación en renfe-maps. Sin él, esas funcionalidades no serían posibles con los feeds públicos.

La ironía: los mejores datos del visor oficial no están disponibles como API abierta. Están ahí, accesibles con un curl, pero sin documentar y sin garantía de estabilidad. renfe-maps los consume, los enriquece, y los expone con documentación OpenAPI y un portal de desarrolladores. Los datos que Renfe no documenta, nosotros los documentamos.

## ¿Cuánto cuesta realmente un visor de trenes?

Hay que ser honesto con las cifras. Los 164 millones de euros de 2023 cubren la transformación digital completa de Renfe: sistema de venta, reservas, app, taquillas, máquinas de autoventa. <sup>[3](#ref-3)</sup> No es el presupuesto del visor de tiempo real.

Pero el visor en sí funciona sobre dos endpoints JSON que un proyecto personal puede replicar y ampliar en un fin de semana. La inversión real y costosa no es el visor: son los feeds GTFS, los GPS en los trenes, el pipeline de datos, la infraestructura ferroviaria. Eso sí cuesta millones y lleva años.

Una vez que los datos existen, construir un visor es trabajo de commodity. Yo lo hice en un par de días con un [Docker Sandbox](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox), Claude como agente de código, y una skill de product owner que evolucionó con cada iteración. El coste fue mi tiempo y unos cuantos tokens de API.

El contraste no es "164 millones vs. gratis." Es "una vez que tienes los datos, la capa de presentación debería ser rápida y abierta." Y ahora mismo no lo es.

## Por qué importa

Dinero público, datos públicos. Renfe mejoró enormemente en 2025 y 2026 con data.renfe.com, los visores de tiempo real y la publicación de datos de puntualidad. Eso merece reconocimiento.

Pero queda camino. Los feeds de posiciones se actualizan cada 15 minutos. No hay feed público de Trip Updates. Las APIs más útiles (las del visor) no están documentadas. La red de Cercanías y la de largo recorrido siguen en visores separados.

Cuando las entidades públicas publican buenos datos abiertos, los ciudadanos construyen cosas encima. renfe-maps existe porque Renfe publicó feeds GTFS-RT. Podría ser mejor si publicaran más.

El accidente de Adamuz demostró por qué la transparencia en tiempo real importa. Los datos no deberían ser una respuesta a la tragedia. Deberían ser la norma.

---

_Fuentes:_
- <a id="ref-1"></a>_<sup>1</sup> [Xataka: "La sorpresa es que no parece hecha por Renfe" (2025)](https://www.xataka.com/movilidad/sorpresa-no-que-2025-renfe-ofrezca-mapa-tiempo-real-trenes-cercanias-sorpresa-que-no-parece-hecha-renfe)_
- <a id="ref-2"></a>_<sup>2</sup> [Xataka: "700.000 euros es un presupuesto ridículo" (2019)](https://www.xataka.com/empresas-y-economia/que-700-000-euros-presupuesto-ridiculo-para-arreglar-web-renfe)_
- <a id="ref-3"></a>_<sup>3</sup> [Xataka: "80 millones para arreglar su web" (2023)](https://www.xataka.com/servicios/renfe-invertira-casi-80-millones-euros-arreglar-su-pagina-web-114-veces-que-ultimo-intento)_
- <a id="ref-4"></a>_<sup>4</sup> [PR Noticias: "Del Disculpen las mejoras a la transparencia" (2026)](https://prnoticias.com/2026/03/09/renfe-del-disculpen-las-mejoras-a-la-transparencia-en-tiempo-real/)_
- <a id="ref-5"></a>_<sup>5</sup> [Nota de prensa de Renfe (marzo 2026)](https://grupo.renfe.com/es/es/sala-de-prensa/noticias/2026/03/renfe-estrena-web-tiempo-real-trenes-alta-velocidad-larga-media-distancia)_
- <a id="ref-6"></a>_<sup>6</sup> [Renfe visor tiempo real (Cercanías)](https://tiempo-real.renfe.com/)_
- <a id="ref-7"></a>_<sup>7</sup> [Renfe visor tiempo real (largo recorrido)](https://tiempo-real.largorecorrido.renfe.com/)_
- <a id="ref-8"></a>_<sup>8</sup> [renfe-maps](https://renfe-maps.vercel.app)_
- <a id="ref-9"></a>_<sup>9</sup> [Portal de datos abiertos de Renfe](https://data.renfe.com/)_
