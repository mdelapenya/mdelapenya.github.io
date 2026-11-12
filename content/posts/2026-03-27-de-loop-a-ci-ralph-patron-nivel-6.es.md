---
title: "De /loop a CI: Ralph y el patrón del nivel 6"
date: 2026-03-27 09:00:00 +0100
description: "El comando /loop corría en mi portátil. Ralph ejecuta el mismo ciclo de trabajo, revisión e iteración en CI, sobre cualquier issue, sin mi terminal abierta. Eso es el nivel 6."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "github-actions", "claude-code", "ci-cd", "developer-experience"]
type: post
weight: 30
translationKey: from-loop-to-ci-ralph-and-the-level-6-pattern
translatedFrom: 4b2e9dd
---

![De /loop a CI: Ralph y el patrón del nivel 6](/images/posts/2026-03-27-from-loop-to-ci-ralph-and-the-level-6-pattern/cover.png)

El [post del nivel 5](/es/posts/2026-03-23-nivel-5-en-la-practica-cuatro-agentes-cuatro-worktrees/) terminaba con una promesa: "Los equipos de agentes y `/batch` son hacia donde va la automatización. Cuando los equipos de agentes se estabilicen, el montaje de los 'cuatro paneles de Warp' pasará a ser 'un comando que lanza un equipo coordinado'. Eso es el nivel 6: agentes que no necesitan mi portátil para nada."

Ralph es mi respuesta. No es un equipo de agentes (siguen siendo experimentales). Ni una plataforma en la nube. Es una GitHub Action que ejecuta el mismo bucle que yo corría en mi terminal (trabajar, revisar, iterar), pero que se dispara con una etiqueta en una issue en lugar de con un `/loop` en Warp.

## El patrón ya estaba ahí

Vuelve al `/loop` del post del nivel 5:

```
/loop 5m read the CI builds for this PR, and determine why they fail.
If you think the fix is in main, cd to the main repo, run git pull,
come back to your worktree, and run git merge main --commit, resolving
conflicts if needed. And push the changes.
```

Eso es un ciclo. Mirar el estado, diagnosticar, actuar, hacer push, esperar y repetir. El agente sigue hasta que el problema se resuelve o hasta que yo lo paro.

Ralph sigue el mismo ciclo. Lee la issue. Escribe código. Revisa el código. Si no está listo, corrige. Si está listo, lo entrega. Los verbos cambian, pero la estructura no: leer el estado, actuar, evaluar, iterar o terminar.

La única diferencia es quién arranca el bucle y dónde se ejecuta. Con `/loop`, escribo un comando en Warp y el agente corre en mi portátil. Con Ralph, añado una etiqueta a una issue de GitHub y el agente corre en CI. Mismo patrón. Distinto entorno de ejecución.

Eso es lo que pasa con el [modelo de madurez](/es/posts/2026-03-20-mi-stack-de-programacion-con-agentes/). Cada nivel no es un tipo de trabajo distinto. Es el mismo trabajo ejecutándose en un entorno menos acoplado. El nivel 4 desacopló al agente del IDE. El nivel 5 lo desacopló de una única tarea. El nivel 6 lo desacopla por completo de tu máquina.

## Qué hace Ralph en realidad

El flujo es lo bastante simple como para describirlo sin código.

Tienes una issue de GitHub. Describe una tarea: un bug que arreglar, una funcionalidad que añadir, un refactor que hacer. Le pones la etiqueta `ralph`. Ese es el disparador.

Arranca una GitHub Action. Crea una rama desde main, descarga el código y lanza un **agente worker**. El worker lee el cuerpo de la issue, entiende la tarea y escribe código. Hace commit y push. Después toma el relevo un **agente reviewer**. El reviewer lee el diff, evalúa el trabajo contra los requisitos de la issue y toma una decisión: SHIP o REVISE.

Si es SHIP, Ralph abre una pull request. Si es REVISE, el reviewer escribe su feedback y el worker tiene otra pasada. El bucle continúa hasta que el reviewer dice SHIP o hasta que el número de iteraciones llega al máximo.

El worker y el reviewer son invocaciones separadas de la CLI de Claude. Es una decisión de diseño deliberada. El mismo agente que escribió el código no debería evaluar si el código es bueno. Separar la generación de la evaluación es el truco más viejo del control de calidad: quien construyó algo no debería ser la única persona que lo prueba. El [post de las skills](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/) defendía que las skills son roles, no comandos. El worker y el reviewer de Ralph son justo eso: dos roles con responsabilidades distintas, contexto distinto y criterios de juicio distintos. El trabajo del worker es resolver el problema. El del reviewer es decidir si el problema está realmente resuelto.

El estado pasa de una iteración a otra a través de un directorio `.ralph/`: `task.md`, `work-summary.txt`, `review-result.txt`, `review-feedback.txt`. Cada fichero es un artefacto de traspaso. El worker escribe un resumen, el reviewer lo lee y escribe su feedback, y el worker lee ese feedback en la siguiente pasada. Es el mismo patrón que un [tester exploratorio](/es/posts/2026-03-11-agentes-de-codigo-como-testers-exploratorios/) pasándole sus hallazgos a un project manager: delegar a través de artefactos, no a través de memoria compartida.

## De ligado a la sesión a persistente

El `/loop` muere cuando cierras la terminal. Esa es la restricción fundamental del nivel 5. El contexto del agente, su comprensión de la tarea, su historial de iteraciones, su progreso parcial: todo vive en tu sesión de terminal. Cierra la tapa del portátil y se acabó.

Ralph persiste entre ejecuciones del workflow. La rama está en GitHub. Los commits están subidos. El directorio `.ralph/` lleva el estado. Si el workflow se queda sin tiempo o falla, puedes volver a lanzarlo. El agente retoma donde lo dejó porque el estado está en el repo, no en la memoria.

Pero va más allá. Puedes editar la issue. Añadir un comentario con instrucciones nuevas. "En realidad, sáltate la migración y añade solo un aviso de deprecación". Ralph lo recoge en el siguiente disparo. El bucle se convierte en una conversación con la issue, no en una sesión con tu terminal.

Ese paso de estar ligado a la sesión a ser persistente es lo que hace que el nivel 6 se sienta distinto. En el nivel 5, la continuidad era yo. Mantenía el contexto en la cabeza entre sesiones de terminal, entre pausas para comer, entre días. En el nivel 6, la continuidad es la issue. Todo lo que el agente necesita está escrito: la tarea en el cuerpo de la issue, el progreso en los commits, el feedback en los artefactos de revisión. Puedo irme. El bucle no necesita que yo recuerde nada.

## Límites de confianza: qué puede y qué no puede hacer Ralph

Ralph crea pull requests. Por defecto, no las mergea. Ese es el límite de confianza.

La action corre con un token de GitHub que puede subir ramas y crear PRs, pero que no puede modificar ficheros de workflow sin un personal access token. No puede cambiar su propia configuración de CI. No puede escalar sus propios permisos. Son las barreras que GitHub ya incluye, y Ralph las hereda por diseño.

Existe una estrategia `squash-merge` que permite a Ralph mergear sus propias PRs cuando el reviewer dice SHIP. Está ahí porque algunos flujos se benefician de la automatización completa: issues de bajo riesgo, tareas bien acotadas, repos con suites de CI completas que cazan los problemas antes del merge. Pero la documentación la acompaña de una advertencia de seguridad explícita. Si la suite de CI no es completa, o si la tarea requiere criterio humano sobre el enfoque (no solo sobre la corrección), probablemente no quieras que Ralph mergee su propio trabajo.

Es el mismo [modelo de supervisión](/es/posts/2026-02-24-programar-con-agentes-como-conducir-tesla-autopilot/) de la analogía del piloto automático de Tesla. El piloto automático se encarga del volante y la velocidad. Tú te encargas de los cambios de carril y de las salidas. Ralph se encarga de generar código e iterar. Tú te encargas de la decisión de mergear. El sistema es más útil cuando la frontera entre autonomía y supervisión es explícita e intencionada, no accidental.

Cuando Ralph no puede hacer squash-merge (conflictos de merge, checks que faltan, reglas de protección de rama), recurre a crear una PR. Ese recurso es el valor seguro por defecto. El agente no fuerza el paso a través de las barreras. Se detiene y te pide que tomes el relevo. Es el comportamiento correcto para un sistema que no estás mirando en tiempo real.

## Cuando el bucle se atasca

Los mismos modos de fallo del nivel 5 aparecen en el nivel 6, pero con un matiz: no estás mirando.

En el nivel 5, veía a un agente dar vueltas en círculo. Tres pushes, tres fallos de CI, cada arreglo deshaciendo el anterior. Paraba el `/loop`, leía el historial y le daba dirección. El feedback era inmediato porque yo estaba ahí.

En el nivel 6, el feedback llega con retraso. Ralph puede iterar tres veces antes de que mires la issue. El máximo de iteraciones funciona como circuit breaker. Por defecto son cinco. Si el reviewer dice REVISE cinco veces, Ralph se detiene. Abre la PR que tenga y deja un comentario explicando que ha llegado al límite. Tú puedes revisar, ajustar la issue y volver a lanzarlo.

Cinco iteraciones son suficientes para la mayoría de las tareas bien acotadas. Un bug suele converger en dos o tres pasadas. Una funcionalidad pequeña puede necesitar cuatro. Si Ralph llega a cinco sin entregar, lo más probable es que la issue fuera demasiado amplia o demasiado ambigua. La solución no es subir el límite de iteraciones. La solución es escribir una issue mejor.

Esa es la lección que enseña el nivel 6, y es la misma que enseñó el nivel 5 pero desde otro ángulo. La calidad de lo que produce el agente está limitada por la calidad de lo que recibe. En el nivel 5, lo que recibía eran mis instrucciones habladas en la terminal. En el nivel 6, es el cuerpo de la issue. Las issues vagas producen código vago. Las issues concretas, con criterios de aceptación claros, producen PRs enfocadas y fáciles de revisar.

## La distancia entre /loop y Ralph

La distancia conceptual entre el nivel 5 y el nivel 6 es menor que la que hay entre cualquier otro par de niveles contiguos.

Pasar del nivel 3 al 4 (del chat en el IDE al agente en la terminal) obligaba a replantearte dónde vive la IA en tu flujo de trabajo. Pasar del 4 al 5 (de un agente a muchos) obligaba a aprender worktrees, supervisión en paralelo y orden de merges. Cada salto cambiaba la forma del trabajo.

¿Pasar del nivel 5 al 6? La forma se mantiene. Un agente lee una tarea. Escribe código. Alguien revisa. La iteración continúa hasta que el trabajo está terminado. Lo único que cambia es el mecanismo de disparo (etiqueta frente a comando), el entorno de ejecución (CI frente a portátil) y el canal de feedback (comentarios en la issue frente a la salida de la terminal).

Si ya confías en que un agente itere sobre fallos de CI en tu terminal, confiar en que itere sobre una issue en CI es la misma apuesta a otra escala. El patrón ya estaba probado. Ralph solo lo ha llevado a un sitio donde no necesita que estés presente.

Por eso dije que es el salto conceptual más pequeño con el mayor impacto práctico. Ya sabes que el patrón funciona. Llevas semanas ejecutándolo a mano. Ralph es el despliegue en producción de un prototipo que lleva semanas corriendo en tu portátil.

El `/loop` fue la prueba de concepto. Ralph es la versión que sale a producción.

---

_Recursos:_
- _[claude-ralph-github-action en GitHub](https://github.com/mdelapenya/claude-ralph-github-action/)_
- _[Documentación de la CLI de Claude Code](https://docs.anthropic.com/en/docs/claude-code)_
- _[Claude Code /loop y tareas programadas](https://code.claude.com/docs/en/scheduled-tasks)_
