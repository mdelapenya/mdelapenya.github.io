---
title: "Mandé un mensaje por Telegram. Apareció una pull request en GitHub."
date: 2026-05-22 09:00:00 +0200
description: "Describí por Telegram la idea de un post. Veinte minutos después, existía una pull request en GitHub. No abrí un terminal, no toqué git, no ejecuté ni un solo comando."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "nanoclaw", "telegram", "hugo", "skills", "content-pipeline", "developer-experience"]
type: post
weight: 30
translationKey: i-sent-a-message-on-telegram-a-pull-request-appeared-on-github
translatedFrom: 4f8b4e7
---

![Mandé un mensaje por Telegram](/images/posts/2026-05-22-i-sent-a-message-on-telegram-a-pull-request-appeared-on-github/cover.png)

Escribí un mensaje en Telegram. Algo como: "Quiero escribir un post sobre la configuración que acabamos de montar para escribir en el blog desde Telegram." Se lo mandé a TheBlog, uno de los topics de mi grupo de IA personal. Veinte minutos después, el agente me envió un enlace. En GitHub había una pull request con el borrador de este post, una rama, un commit convencional y una descripción de PR estructurada. No había abierto un terminal. No había ejecutado git. Ni siquiera había abierto el portátil.

Esto no es una demo. Es el mismo asistente que ya lee mis facturas de la luz, resume mis correos y responde preguntas sobre mi cuenta del banco. El sistema que describí en [Una IA personal que lee mis facturas](/es/posts/2026-04-27-una-ia-personal-que-lee-mis-facturas/) acaba de ganar una capacidad nueva. La infraestructura ya estaba. Solo conecté un topic nuevo.

## Dos sistemas, un solo flujo de trabajo

Esto funciona gracias a dos piezas.

La primera es [NanoClaw](https://github.com/nanocoai/nanoclaw): un orquestador de IA de código abierto que corre en el NAS de mi casa, dentro de una VM. Cuando llega un mensaje a Telegram, NanoClaw levanta un contenedor para ese topic, carga su configuración y ejecuta Claude Code dentro. Cada topic es un agente aislado, con su propio espacio de trabajo, su propia personalidad y sus propias herramientas. TheBlog es uno de ellos. Su único trabajo es gestionar el blog.

La segunda es [blog-skills](https://github.com/mdelapenya/blog-skills): cinco ficheros `SKILL.md`, uno por cada paso del proceso. Ya [conté cómo quitaron la fricción de escribir](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day). Lo que cambia aquí es dónde se ejecutan. Cada skill se invoca desde Telegram. Cada pregunta que hace la skill vuelve a Telegram. Yo contesto desde el móvil. El agente escribe.

## Lo que sabe el topic de TheBlog

Cuando NanoClaw levanta el contenedor de TheBlog, ya tiene todo lo que necesita.

El repositorio del blog está clonado de antemano en la VM. El contenedor lo monta directamente: sin checkout, sin clone, sin esperas. El agente puede leer todos los posts existentes, ejecutar comandos de git, crear ramas, hacer commit y push.

El repositorio de blog-skills también está clonado y montado. Las cinco skills están instaladas como slash commands. Cuando el agente ejecuta `/blog-planner` o `/blog-writer`, carga un fichero de skill que ya está en disco.

La autenticación va con un token de GitHub de grano fino. El alcance es mínimo por diseño: Contents (lectura y escritura) y Pull Requests (lectura y escritura), limitado solo al repositorio del blog. No puede tocar ningún otro repositorio. No puede leer datos de la organización. El mínimo privilegio es el punto de partida, no un añadido posterior. El token vive en el entorno del contenedor y se inyecta al arrancarlo.

El resultado: el agente empieza cada conversación con toda la cadena de herramientas lista. Sin preparación, sin instalaciones, sin configurar el entorno. La VM es la infraestructura persistente. El agente hereda todo lo que necesita.

## El flujo, paso a paso

Cuando le mando a TheBlog "quiero escribir un post sobre X", esto es lo que pasa.

**Comprobación del estado del repo.** El agente ejecuta `git status` y confirma que está en `main` y con el árbol de trabajo limpio. Si queda trabajo a medias de una sesión anterior, se detiene y me pregunta antes de seguir.

**`/blog-planner`.** El planner recorre todos los posts existentes, detecta huecos y oportunidades de referencias cruzadas, y luego me entrevista en dos o tres rondas centradas. ¿Cuál es el enfoque? ¿Qué experiencia personal lo ancla? ¿Qué debería llevarse el lector? Produce un esqueleto estructurado: front matter, un borrador del arranque, títulos de sección con una descripción de una frase y referencias cruzadas sugeridas. Lo reviso y lo apruebo antes de que se escriba nada.

**Creación de la rama.** En cuanto apruebo el esqueleto, el agente crea una rama: `post/YYYY-MM-DD-slug`. Antes actualiza `main` y comprueba que la rama no exista ya.

**`/blog-writer`.** El writer toma el esqueleto y redacta sección a sección. En cada una me hace una pregunta concreta para recoger mi perspectiva real y no prosa genérica. Contesto desde Telegram. El agente escribe.

**`/blog-editor`.** El editor pasa una lista de comprobación: front matter completo, densidad de cada sección, redundancias, rayas largas, coherencia de tono, calidad del cierre. Señala los problemas y aplica las correcciones. Cuando una corrección requiere mi criterio, me pregunta.

**`/blog-keeper`.** El keeper audita todos los enlaces internos y referencias cruzadas: destinos rotos, enlaces prematuros a posts sin publicar, adelantos de "próximamente" que ya tienen su post. Es de solo lectura. Informa, no edita.

**Commit, push y `/pr-scribe`.** El agente hace commit del fichero, sube la rama y ejecuta `/pr-scribe` para generar, a partir del diff, un título de Conventional Commits y una descripción de PR estructurada. El cuerpo de la PR incluye qué ha cambiado, por qué importa y un plan de pruebas.

**El enlace llega al chat.** El agente me manda la URL de la PR. La abro en el móvil, leo el borrador y decido: aprobar, comentar o pedir cambios.

Todo el proceso es una conversación con puntos de control. El agente pregunta, yo contesto, el trabajo avanza. No estoy mirando cómo se ejecuta un script. Estoy colaborando con algo que guarda todo el contexto entre pasos para que no tenga que hacerlo yo.

## Escribir desde el móvil

Antes trazaba una línea entre dispositivos. El ordenador era donde producía cosas. El móvil era donde las consumía. Esa línea se sostenía porque producir exigía una cadena de herramientas: un editor, un terminal, git, Hugo, un navegador para previsualizar. Todo eso vivía en el ordenador.

Esa línea ya no existe.

El móvil no ha cambiado. Es el agente quien ha absorbido la cadena de herramientas. Cada paso que requería un terminal, un sistema de ficheros o un comando de git ocurre dentro de un contenedor que controla el agente. Yo aporto las ideas y las decisiones. El agente se ocupa del resto.

Lo que cambia de verdad cuando desaparece esa fricción: ya no pospongo escribir hasta "cuando esté en mi mesa". Una ocurrencia mientras espero en cualquier sitio se convierte en un borrador. Una conversación se convierte en un esqueleto. El post que habría esperado al fin de semana sale el martes, arrancado desde un mensaje que mandé lejos del ordenador.

Para este flujo, el móvil no es una versión recortada del ordenador. Es la herramienta adecuada. Entrada de texto, rápida, siempre encima. El agente hace el resto.

## El círculo se cierra

Este post empezó como un mensaje en Telegram. El agente abrió la PR. Yo aprobé el merge.

---

_Recursos:_
- _[NanoClaw](https://github.com/nanocoai/nanoclaw)_
- _[blog-skills](https://github.com/mdelapenya/blog-skills)_
- _[coding-skills](https://github.com/mdelapenya/coding-skills)_
- _[Documentación de las skills de Claude Code](https://docs.anthropic.com/en/docs/claude-code/skills)_
