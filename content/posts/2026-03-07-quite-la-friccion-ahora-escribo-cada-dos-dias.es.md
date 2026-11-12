---
title: "Quité la fricción. Ahora escribo un día sí y otro no."
date: 2026-03-07 09:00:00 +0100
description: "Front matter, referencias cruzadas, auditorías de enlaces, promoción en redes. Cinco archivos SKILL.md eliminaron cada punto de fricción que me impedía escribir, y ahora publico un día sí y otro no."
categories: [Technology, AI, Software Development]
tags: ["claude-code", "coding-agents", "skills", "content-pipeline", "hugo"]
type: post
weight: 30
translationKey: i-removed-the-friction-now-i-write-every-other-day
translatedFrom: f67c35f
---

![Quité la fricción](/images/posts/2026-03-07-i-removed-the-friction/cover.png)

Antes necesitaba una tarde entera para escribir un post. No porque escribir llevara tanto, sino porque necesitaba un bloque largo de tiempo sin interrupciones. Encontrar el tema, preparar el front matter, escribir el borrador, revisar los enlaces, arreglar las referencias cruzadas, redactar el texto para redes. Si me interrumpían a mitad, perdía el contexto y el post se quedaba a medias durante días. A veces, semanas.

La fricción nunca fue una sola cosa. Era tener que mantener todo el proceso en la cabeza a la vez.

Ahora escribo a ratos de 5-10 minutos. Cambio a una tarea del blog, la avanzo un paso y vuelvo a lo que estuviera haciendo. El proceso ya no vive en mi cabeza. Vive en cinco archivos `SKILL.md` que recuerdan dónde lo dejé y qué viene después.

Si te das una vuelta por la [lista de posts](/posts/), verás dos iconos junto a cada uno: 🤖 para los generados con IA, 🧑 para los escritos por una persona. Cada post lleva además un banner arriba que indica cuál es. Es un campo del front matter (`ai: true`) que las skills rellenan solas al redactar el borrador. A partir de ahora, todos los posts irán etiquetados. La transparencia es el punto de partida, no un añadido de última hora.

## Los cinco puntos de fricción

Cada post de este sitio es un archivo markdown de [Hugo](https://gohugo.io/). Sin base de datos, sin panel de administración. Esa simplicidad es estupenda hasta que te das cuenta de que "escribe un archivo markdown" significa en realidad: elegir un tema, acertar con el formato del front matter, escribir el borrador, validar todas las referencias cruzadas y promocionarlo en redes. Cada paso tiene su propia fricción.

**Encontrar tema** antes significaba revisar posts antiguos, intentar acordarme de qué había prometido escribir y esperar a que llegara la inspiración. Ahora `/blog-planner` recorre los posts existentes, encuentra teasers sin cumplir, charlas de conferencias huérfanas y tags que solo aparecen una vez, y propone de 3 a 5 temas concretos. Elijo uno, contesto dos rondas de entrevista y en minutos tengo un esqueleto estructurado.

**Acertar con el front matter** era un ritual de copiar, pegar y rezar. ¿Formato de fecha incorrecto? Hugo ignora el post sin avisar. ¿Campo `type` equivocado? El post se renderiza, pero no aparece en el listado. Ahora `/blog-writer` genera el front matter a partir de las convenciones de `blog-config.md`. Formato de fecha, zona horaria, categorías, tags, weight: todo resuelto. Yo me centro en el contenido.

**Escribir el borrador** es donde ocurre el pensamiento de verdad, y es el único paso que no quiero automatizar. Pero el writer me entrevista sección a sección, así que puedo hacer una sección en una ventana de 10 minutos y volver más tarde a por la siguiente. La skill sostiene la estructura. Yo pongo las ideas.

**Editar y revisar** antes significaba releer el post entero con ojos frescos, cazar cambios de tono, recortar párrafos que se iban por las ramas y asegurarme de que el cierre no se limitara a resumir la introducción. Ahora `/blog-editor` pasa la checklist de revisión: cumplimiento del front matter, densidad de las secciones, redundancia, uso de rayas (em dashes) y coherencia de tono. Marca los problemas y propone arreglos. Cuando termina, lanza el keeper automáticamente. La decisión final sigue siendo mía, pero el editor pilla lo que se le escapa a unos ojos cansados.

**Revisar enlaces y referencias** era el paso que siempre me saltaba. Es tedioso, parece trabajo de relleno y los enlaces rotos no aparecen hasta que un lector hace clic. Ahora `/blog-keeper` se ejecuta solo después de cada pasada de edición. Detecta referencias cruzadas rotas, teasers de "próximamente" que ya deberían ser enlaces reales y enlaces prematuros a posts que todavía no están publicados.

**La promoción en redes** era otra tarea de "ya lo haré luego". Escribir un post de LinkedIn y un tuit por cada entrada del blog me parecía un segundo trabajo. Ahora `/blog-marketer` lee el post terminado, me entrevista sobre el público objetivo y genera borradores para cada plataforma que solo tengo que copiar y pegar. La misma voz, el mismo front matter, cero desviaciones.

## Por qué funcionan los ratos de 5-10 minutos

El flujo antiguo exigía un bloque de dos horas porque cada paso dependía de tener en la cabeza el contexto del anterior. Si olvidaba el formato exacto de los tags, tenía que buscarlo. Si no recordaba qué posts se enlazaban entre sí, tenía que hacer grep. Si perdía la pista de los usuarios de redes que había que etiquetar, tenía que comprobarlo.

Las skills guardan todo ese contexto. Cada una conoce las convenciones, los posts existentes, el grafo de referencias cruzadas y los usuarios de redes. Cuando vuelvo tras una pausa, no necesito recargar nada de eso en la cabeza. Solo invoco la siguiente skill.

Esto es lo que cambió mi frecuencia de publicación. No la velocidad. No la automatización. Poder **retomar y dejar** el trabajo sin perder nada. Puedo planificar tres posts en una tarde, redactar uno el martes por la mañana, editarlo en la pausa del almuerzo del miércoles y programarlo para el viernes. Cada paso es una interacción de 5-10 minutos. Las skills recuerdan el resto.

Antes de las skills, publicaba cuando encontraba un rato. Ahora programo los posts porque puedo planificar con antelación. La [serie sobre SLM](/es/posts/2026-03-02-elegir-el-llm-mas-pequeno-parte-1/) (cuatro partes) se planificó de una sentada y se redactó a lo largo de tres días, en pequeños pasos. Antes me habría llevado un mes.

## Donde las skills se potencian entre sí

Lo interesante no es lo que hace cada skill por separado. Es cómo se refuerzan unas a otras.

El keeper detecta los teasers de "próximamente" que el writer dejó atrás. Cuando publiqué la parte 3 de la [serie sobre SLM](/es/posts/2026-03-06-elegir-llm-pequeno-parte-3-evaluador-tool-calling/), el keeper revisó los posts anteriores y marcó los que decían "más sobre esto pronto" a propósito del tool calling. Esos teasers se convierten en enlaces reales. El keeper transforma un conjunto disperso de posts en una base de conocimiento conectada.

El planner analiza las referencias cruzadas (que el keeper ha validado) para encontrar huecos temáticos. Si tres posts mencionan un concepto que no tiene un post propio, el planner lo propone como candidato. El grafo de enlaces validado se convierte en una hoja de ruta de contenidos.

Cada skill hace más valiosas a las demás. El efecto red es justo el objetivo.

## El bucle de feedback

Las propias skills han mejorado con el uso. No por un diseño previo, sino a base de fallos.

El keeper trataba originalmente todos los archivos del disco como "publicados". Eso se rompió cuando empecé a programar posts con fecha futura. El keeper me decía que enlazara posts que todavía no estaban en línea. Ese falso positivo llevó a añadir **conciencia de la fecha de publicación**: ahora el keeper comprueba el campo `date` y solo considera enlazable un post si su fecha ya ha pasado.

El flujo de entrevista del writer mejoró cuando el planner empezó a producir esqueletos más estructurados. Los primeros esqueletos eran vagos: una tesis y unas cuantas viñetas. Ahora el planner genera títulos de sección, referencias cruzadas y una longitud objetivo. El writer pasa menos tiempo decidiendo qué escribir y más tiempo escribiéndolo.

## Qué es realmente una skill

Una skill es un archivo markdown con front matter YAML (nombre, descripción, herramientas permitidas, versión) seguido de instrucciones numeradas, ejemplos concretos y notas para resolver problemas. Es un **contrato de flujo de trabajo**, no un prompt. Limita lo que el agente puede hacer, prescribe cómo hacerlo y le enseña a recuperarse. La diferencia entre una skill y un prompt es la que hay entre [una especificación y un deseo](/es/posts/2026-02-26-spec-driven-development-es-el-nuevo-bdd/).

Uso [Claude Code](https://docs.anthropic.com/en/docs/claude-code) como agente del día a día, pero el formato no depende de él. Construí el [repositorio blog-skills](https://github.com/mdelapenya/blog-skills) para que los mismos archivos `SKILL.md` funcionen en Claude Code, GitHub Copilot, OpenAI Codex y Gemini CLI. Los archivos canónicos viven en `skills/`. Cuatro enlaces simbólicos dentro del repositorio llevan a cada agente a la ruta donde espera descubrirlos:

```
.agents/skills -> ../skills      # Codex + Gemini CLI
.claude/skills -> ../skills      # Claude Code
.github/skills -> ../skills      # Copilot
.gemini/skills -> ../skills      # Gemini CLI
```

Un solo juego de archivos, cuatro plataformas. Editas una skill una vez y todos los agentes la recogen. El repositorio incluye también una plantilla `blog-config.md` donde configuras el dominio de tu blog, la zona horaria, los usuarios de redes y las convenciones del front matter. Las skills leen ese archivo en tiempo de ejecución, así que se adaptan a tu sitio sin que tengas que editarlas.

Cada skill está documentada con sus propios ejemplos y su sección para resolver problemas. Están pensadas para blogs en Hugo, pero el patrón (planner, writer, editor, keeper, marketer) sirve para cualquier generador de sitios estáticos.

## Cinco archivos, cero excusas

Cinco archivos markdown. Sin base de datos, sin panel de administración, sin suscripción a ningún SaaS. Solo skills que hablan entre sí y mejoran cada vez que las uso. El mejor sistema de contenido es el que [vive donde vive tu contenido](/es/posts/2026-02-26-spec-driven-development-es-el-nuevo-bdd/) y [no estorba](/es/posts/2026-02-24-programar-con-agentes-como-conducir-tesla-autopilot/).

Ya no busco huecos para escribir. Los creo, en tramos de 5 minutos, y las skills hacen el resto.

---

_Recursos:_
- _[Estándar abierto Agent Skills](https://agentskills.io)_
- _[Documentación de las skills de Claude Code](https://docs.anthropic.com/en/docs/claude-code/skills)_
- _[Plugin blog-skills](https://github.com/mdelapenya/blog-skills)_
