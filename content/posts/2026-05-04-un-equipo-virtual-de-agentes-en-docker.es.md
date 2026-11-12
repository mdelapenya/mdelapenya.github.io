---
title: "Un equipo virtual de agentes en Docker: cómo el equipo de Coding Agent Sandboxes usa una flota de agentes para entregar más rápido"
date: 2026-05-04 09:00:00 +0200
description: "Veinte skills de Claude, siete roles de la Fleet, workflows de GitHub y un ralph-loop. Así montamos en Docker un equipo virtual de agentes en un par de semanas, con las mismas skills en local y en CI."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "skills", "docker", "docker-sandboxes", "github-actions", "ci-cd"]
type: post
weight: 30
translationKey: a-virtual-agent-team-at-docker
translatedFrom: 8537061
---

![Un equipo virtual de agentes en Docker](/images/posts/2026-05-04-a-virtual-agent-team-at-docker/cover.png)

*Este post se publicó originalmente en el [Docker Blog](https://www.docker.com/blog/a-virtual-agent-team-at-docker-how-the-coding-agent-sandboxes-team-uses-a-fleet-of-agents-to-ship-faster/) el 1 de mayo de 2026.*

Trabajo en Coding Agent Sandboxes, también conocido como "sbx", en Docker. El proyecto ofrece aislamiento seguro [basado en microVM](https://docs.docker.com/ai/sandboxes/) para ejecutar agentes de código con IA como Claude Code, Gemini, Codex, Docker Agent y Kiro. Los agentes tienen plena autonomía dentro de un sandbox (su propio daemon de Docker, su red, su sistema de ficheros) sin tocar tu sistema host. Durante las últimas semanas hemos construido algo encima: un equipo virtual de siete roles de agentes de IA que prueban el producto, hacen triaje de issues, publican release notes e incluso arreglan bugs, todo de forma autónoma en CI. Lo llamamos la Fleet.

La Fleet está construida sobre las [skills de Claude Code](https://code.claude.com/docs/en/skills): ficheros markdown que le dan a un agente una personalidad, un conjunto de responsabilidades y las herramientas que puede usar. No pienses en una skill como un script que dice "ejecuta estos pasos". Piensa en ella como la descripción de un puesto que dice "eres el ingeniero de build, esto es lo que sabes y así tomas decisiones". La diferencia importa porque los agentes necesitan criterio, no solo instrucciones. Cuando un test falla de forma inesperada, un script se detiene. Un rol investiga.

El mismo fichero de skill, el mismo comportamiento, ya se ejecute en el portátil de un desarrollador o en CI.

## Primero en local, después en CI

Coding Agent Sandboxes es una herramienta de línea de comandos (`sbx`) que gestiona el ciclo de vida de los sandboxes: crear, arrancar, parar, eliminar, configurar la red, montar workspaces y más. Funciona en macOS, Linux y Windows. Cada release hay que probarla en ambas plataformas, a través de las rutas de actualización entre versiones y bajo carga sostenida para cazar fugas de recursos. Además, el equipo necesita ver cada día qué se ha entregado, y una forma de hacer triaje del backlog de issues, que no deja de crecer, sin que se convierta en un trabajo a tiempo completo.

Podríamos haber escrito scripts de test y herramientas de reporte tradicionales. En su lugar, construimos roles de agentes que se encargan de estas tareas de forma autónoma, tanto en nuestros portátiles como en CI.

El principio de diseño detrás de la Fleet es sencillo: toda skill se ejecuta primero en tu máquina.

Cuando construimos la skill `/cli-tester` (el tester exploratorio de la Fleet, ya hablaremos de él), no empezamos escribiendo un workflow de GitHub. Empezamos invocándola en local. La vimos compilar los binarios, ejercitar los comandos de la CLI, encontrar problemas y reportarlos. Fuimos ajustando la skill hasta que hacía lo correcto en nuestra terminal. Solo entonces la conectamos a un workflow.

Esto importa porque la alternativa es dolorosa. Si construyes agentes que solo viven en CI, los depuras a base de ciclos de commit, push, espera y lectura de logs. Cada iteración cuesta minutos. Cuando la skill se ejecuta primero en local, la iteración cuesta segundos. Ves pensar al agente. Ves dónde se confunde. Arreglas el fichero de la skill, la invocas de nuevo y vuelves a probar.

CI es simplemente otro runtime para la misma skill. El `/cli-tester` que se ejecuta cada noche en runners de macOS, Linux y Windows es exactamente la misma skill que invocamos desde nuestras terminales. El workflow prepara el entorno, descarga el código y llama a la skill. Nada más. No hay una "versión para CI". No hay capa de traducción. Una skill, dos runtimes.

Eso es lo que hace práctica la Fleet. No mantienes dos sistemas. Mantienes un conjunto de skills y un conjunto de workflows que las invocan.

## La plantilla

![La Fleet: 7 roles de IA autónomos para CI/CD](/images/posts/2026-05-04-a-virtual-agent-team-at-docker/fleet-diagram.png)

El directorio de skills tiene 20 skills en total. La mayoría son conocimiento de base (arquitectura, estilo de código, convenciones de Go, seguridad, patrones de testing). Siete de ellas son la Fleet: los roles que se ejecutan de forma autónoma en CI. Cada una es un fichero [SKILL.md](https://code.claude.com/docs/en/skills) que describe una personalidad, no un procedimiento.

**`/build-engineer`** es la base sobre la que se apoyan las demás. Referencia ficheros por tema para compilar binarios, plantillas de contenedor e instalaciones locales. Conoce el `Taskfile.yml`, el `docker-bake.hcl` y los flags de compilación de cada plataforma. No se ejecuta por sí sola en CI. Las otras skills la cargan cuando necesitan compilar algo.

**`/project-manager`** es la memoria del equipo. Deduplica los hallazgos contra los issues y las PRs existentes antes de crear otros nuevos, gestiona el tablero de GitHub Projects (estado, prioridad y etiquetas) y se encarga del triaje interactivo cuando se ejecuta en local. En CI pasa a modo totalmente automático: sin preguntas, solo deduplicar y crear. Usa paginación de GraphQL para recorrer todo el tablero, no solo la primera página. Cualquier otra skill que descubre algo llama al project-manager antes de abrir un issue.

**`/product-owner`** traduce el lenguaje de los commits a lenguaje humano. Recoge las PRs mergeadas en un rango de fechas, las categoriza (New Features, Bug Fixes, Improvements, Documentation, Maintenance) y reescribe cada una en lenguaje llano. "feat(cli): add TZ env passthrough" se convierte en "Docker Sandboxes ahora usa automáticamente tu zona horaria local". En CI genera JSON de Slack Block Kit. En local, pinta una tabla en markdown. Filtra el ruido de los bots (subidas de versión de Dependabot, cambios que solo tocan workflows) y no publica nada cuando no hay nada relevante que contar.

**`/cli-tester`** es el tester exploratorio de la Fleet, y con diferencia la skill más grande. A diferencia de los scripts de test tradicionales, que comprueban una salida esperada y fallan ante cualquier desviación, el cli-tester investiga lo que encuentra. Cuando la salida no coincide con lo esperado, se pregunta *por qué* antes de abrir un bug.

Define más de 52 escenarios de prueba organizados en 14 niveles: Core Lifecycle, Agent Smoke, Workspace, Network Policy, Sandbox Features, Blueprint, CLI UX, Environment, Code Tasks, Agent Network, Reliability, Collaboration, Error Recovery y Human-Only (que se omite en CI). Compila los binarios a través del build-engineer, hace triaje de los hallazgos con el project-manager y carga los escenarios de producto que define el Product Manager real del equipo. Vigila el espacio en disco durante las pruebas, publica un resumen ejecutivo en Slack al terminar y se ejecuta cada noche en CI en macOS, Linux y Windows.

También da vida a un comando de barra en GitHub. Cuando alguien comenta `/cli-tester-review` en una pull request, CI levanta tres runners (macOS, Linux y Windows), y cada uno carga la skill para ejercitar los cambios de la PR en esa plataforma. Los agentes exploran el código, ejecutan los escenarios y publican sus hallazgos como comentarios directamente en la pull request.

**`/performance-tester`** funciona en dos modos. Lifecycle Endurance repite una y otra vez el ciclo create/stop/rm para detectar problemas de fiabilidad y fugas de recursos, y genera una salida en JSON de xUnit. Code Exploration Benchmark clona un repositorio Git real y compara el rendimiento de I/O entre el host y el sandbox, además del comportamiento de una sesión de Claude Code. Ambos modos miden el uso de disco a lo largo del tiempo y señalan las regresiones. El objetivo es cazar la degradación lenta que ninguna ejecución de test por sí sola notaría.

**`/upgrade-tester`** sigue un plan de pruebas en cuatro fases. La fase A crea el estado previo a la actualización (sandboxes, configuraciones). La fase B instala la nueva versión. La fase C verifica que todo sigue funcionando tras actualizar. La fase D, opcionalmente, vuelve a la versión anterior y verifica otra vez. Recibe dos tags de versión como entrada, compila los binarios de cada una, crea las VMs y produce un resumen ejecutivo con el resultado (pass/fail) de cada fase. Las regresiones de actualización son el tipo de bug que resulta invisible en una batería de tests de una sola versión.

**`/software-engineer`** opera en dos modos. Reactivo: cuando alguien añade la etiqueta `agent-fix` a un issue de GitHub, un runner de macOS lo recoge y lanza un ralph-loop para trabajarlo, y aporta una PR con cambios mínimos y enfocados. Proactivo: cada semana se ejecuta en modo arquitecto, escanea el código en busca de problemas de calidad, produce hasta cinco hallazgos, les hace triaje a través del project-manager y lanza tres runners de macOS en paralelo para arreglar tres de ellos. Cada runner entrega una PR centrada en una simplificación concreta o en reducir deuda técnica.

## Skills que se componen

Las skills sueltas son útiles. Las skills que cargan otras skills son un equipo.

Los siete roles de la Fleet se apoyan en trece skills de base: arquitectura, estilo de código, convenciones de Go, diseño de software, seguridad, patrones de testing, flujo de desarrollo, git worktrees y otras. Las skills de base codifican el conocimiento del proyecto. Los roles de la Fleet codifican el comportamiento. Un rol de la Fleet carga las skills de base que necesita, igual que una persona nueva en el equipo lee la guía de contribución del proyecto antes de escribir código.

El `/cli-tester` no sabe compilar binarios. Para eso carga el `/build-engineer`. Tampoco sabe si el bug que ha encontrado está duplicado. Para eso carga el `/project-manager`. El tester se dedica a probar. El de build, a compilar. El manager, a hacer triaje. Cada rol se queda en su carril, y la composición crea algo que ninguno podría hacer solo.

El `/software-engineer` sigue el mismo patrón. Carga el `/build-engineer` para poder compilar el proyecto, y carga las buenas prácticas de código y las convenciones de diseño de software para que lo que produce cumpla los estándares del equipo. La skill no intenta codificarlo todo. Delega en las skills de base.

El `/performance-tester` carga el `/cli-tester` y lo extiende con duración y métricas. En lugar de duplicar la lógica de testing, la reutiliza y le añade una capa de medición encima.

Este es el principio de skills como roles llevado a la práctica. Cuando diseñas las skills como personalidades con responsabilidades claras (en lugar de comandos paso a paso), se componen de forma natural. Un tester que carga a un ingeniero de build y a un manager hace lo mismo que haría un tester humano: pedirle a un compañero que compile el proyecto y consultar con el PM antes de abrir un bug. La diferencia es que ese "pedir" ocurre mediante la composición de skills en lugar de un mensaje de Slack.

## El ralph-loop es el motor

El [Ralph Wiggum loop](https://ghuntley.com/ralph/) es un patrón que popularizó Geoffrey Huntley en 2025: un bucle de Bash que le da una y otra vez la misma tarea a un agente de código con IA hasta que el trabajo está hecho. En su versión más simple, es `while :; do cat PROMPT.md | claude-code ; done`. Cada iteración lanza un agente nuevo con una ventana de contexto limpia. El agente lee la tarea, implementa una parte, ejecuta los tests, hace commit si pasan y termina. El bucle arranca de nuevo, y la siguiente iteración retoma donde lo dejó la anterior. En lugar de esperar la perfección a la primera, diseñas para iterar.

Nuestra implementación de este patrón se llama Ralph-loop. Las skills de la Fleet definen *qué* sabe cada rol de agente. El Ralph-loop define *cómo* se ejecuta la iteración.

Nuestro Ralph-loop es una GitHub Action compuesta, respaldada por un script de shell que añade una capa sobre el patrón básico: un worker y un reviewer separados. Recoge el contexto del issue, crea una rama de trabajo e itera: el worker implementa los cambios y escribe un resumen, el reviewer evalúa el diff y decide SHIP o REVISE. Si es REVISE, el feedback vuelve al worker para otra pasada. Hasta cinco iteraciones por defecto. Si el reviewer dice SHIP, el bucle hace push de la rama, crea una PR y comenta en el issue original.

El worker y el reviewer se ejecutan como invocaciones separadas de Claude con modelos distintos. El worker usa Opus para implementar. El reviewer usa Opus con 1M de contexto para evaluar el diff completo contra los requisitos de la tarea. Cada uno carga la skill `/software-engineer` (que a su vez carga el build-engineer y las buenas prácticas de código), así que comparten el mismo conocimiento del proyecto pero lo aplican desde perspectivas distintas.

Separar la generación de la evaluación es deliberado. El mismo agente que escribió el código no debería evaluar si el código es bueno. Es el principio más antiguo de QA: quien construye algo no debería ser la única persona que lo prueba. El trabajo del worker es resolver el problema. El del reviewer es decidir si el problema está realmente resuelto.

El Ralph-loop también funciona en local. El mismo script `ralph-loop.sh` que llama CI se puede invocar desde tu terminal con `--issue-number 42`. En local, lee los argumentos de la línea de comandos en lugar de variables de entorno y saca texto plano en lugar de JSON en streaming. El mismo bucle, los mismos prompts, el mismo patrón de iteración. Depuramos los prompts del worker y del reviewer en nuestros portátiles antes de que se ejecutaran en CI por primera vez.

Los workflows se encargan de programar y disparar: cron nocturno para los testers, eventos de etiqueta para el software-engineer, cron semanal para el modo arquitecto. El Ralph-loop se encarga del patrón de iteración. Las skills se encargan del conocimiento del dominio. Tres capas, cada una con un trabajo claro.

Esta separación es lo que permitió construir la Fleet en un par de semanas. No tuvimos que reinventar el bucle de automatización para cada rol. El Ralph-loop ya sabía iterar. Solo hacía falta darle a cada rol su fichero de skill y conectar los disparadores.

## Lo que entrega la Fleet

La Fleet lleva un par de semanas en marcha. Esto es lo que aporta.

**Resolución automática de issues.** Alguien del equipo etiqueta un issue con `agent-fix`. La CI coge un runner de macOS, lee el issue y se pone a trabajar. El resultado es una pull request que aborda el issue. No todas las PRs entran sin cambios, pero el primer borrador está ahí para revisarlo, a menudo en menos de una hora.

**Release notes diarias.** El product-owner recorre el git log cada día y publica un resumen en Slack para los stakeholders. Nadie tiene que compilar a mano el "qué se ha entregado esta semana". Los stakeholders ven el progreso en tiempo real, a la velocidad a la que se mueve el equipo de verdad.

**Testing exploratorio nocturno.** El cli-tester se ejecuta cada noche en macOS y Windows. Carga los escenarios de producto que ha definido el Product Manager, ejercita la CLI y abre issues por todo lo que encuentra. Antes de abrir un issue, comprueba si está duplicado a través del project-manager. Al terminar, publica en Slack un mensaje con los resultados.

**Tests de rendimiento y de actualización.** El performance-tester y el upgrade-tester se ejecutan en CI en ambas plataformas. Las regresiones de uso de disco, las diferencias de comportamiento entre el modo sandbox y el modo sin sandbox y los problemas de compatibilidad entre versiones se cazan antes de que lleguen a quien los reportaría a mano.

**Reducción semanal de deuda técnica.** Cada semana, el software-engineer se ejecuta en modo arquitecto. Revisa el código, identifica tres puntos donde se puede simplificar o limpiar patrones heredados, lanza tres runners en paralelo y entrega tres PRs. Cada una es una mejora pequeña y enfocada. Con el tiempo, se acumulan.

## Lo que no automatizamos

La Fleet crea pull requests. No las mergea.

Esa es la frontera de la confianza, y es deliberada. Las decisiones de merge se quedan en manos de personas. Y también las decisiones de arquitectura, de alcance y de prioridades. Los agentes hacen el trabajo. El equipo decide qué trabajo importa y si el resultado da la talla.

El modelo de supervisión escala igual que funciona en el portátil de un desarrollador. Cuando ejecutamos varios agentes en paralelo en worktrees locales, revisamos lo que producen antes de mergear. Con la Fleet, el equipo supervisa siete roles de agentes que corren en CI. La forma de la supervisión es la misma: revisar el resultado, aprobar o ajustar, y seguir. La diferencia es que los agentes no necesitan el portátil de nadie para ponerse a trabajar.

La Fleet no sustituye al equipo. Lo amplía. Siete roles que se ocupan del trabajo repetitivo y bien definido para que las personas podamos centrarnos en lo que exige criterio, contexto y gusto. La Fleet tiene muchos brazos, pero es el equipo quien lleva el timón.

## Lo que aprendimos construyendo la Fleet

**Empieza por los cimientos, no por la skill más vistosa.** Empezamos con el `/cli-tester` porque probar la CLI parecía el objetivo de más valor. Pero necesitaba compilar binarios, hacer triaje de issues y cargar escenarios de producto, y todo eso dependía de otras skills que todavía no habíamos escrito. Deberíamos haber empezado por el `/build-engineer`, la skill sobre la que se apoya todo lo demás. La segunda skill salió mejor por lo que aprendimos con la primera. No diseñes la flota entera de antemano.

**Construye primero en local, despliega en CI después.** El ciclo de commit, push, espera y lectura de logs es donde se muere la velocidad. Si no puedes depurar una skill en tu terminal, no está lista para un workflow. Algunos comportamientos solo aparecen en los runners de CI (otro sistema operativo, otros permisos, restricciones de red), y esas iteraciones cuestan horas de reloj. Reduce al mínimo lo que solo se puede probar en CI.

**Escribe las skills como roles, no como scripts.** Pregúntate: "Si mañana se incorporara al equipo una persona con exactamente este rol, ¿qué le diría?". ¿Qué necesita saber? ¿Qué herramientas puede usar? ¿Cómo debe manejar la ambigüedad? Esa conversación es tu SKILL.md. "Eres el ingeniero de build, esto es lo que sabes" produce mejor criterio que "ejecuta estos cinco pasos". Cuando pasa algo inesperado, un rol investiga. Un script se detiene.

**Compón las skills como compones equipos.** El `/cli-tester` no sabe compilar binarios ni hacer triaje de bugs. Para eso carga el `/build-engineer` y el `/project-manager`. Cada rol se queda en su carril. La composición crea lo que ninguno podría hacer solo.

**Separa la generación de la evaluación.** El agente que escribió el código no debería ser el único que lo revisa. Nuestro Ralph-loop usa un worker y un reviewer por una razón: el principio más antiguo de QA también vale para los agentes.

**El triaje importa más que la detección.** Al principio, el `/cli-tester` abría un issue por cada salida inesperada. Fallos transitorios, comportamientos que dependían del timing, rarezas del entorno: todo acababa siendo un issue. La relación señal-ruido se puso tan mal que el equipo empezó a ignorar los hallazgos. Afinar el triaje (deduplicar, confirmar antes de abrir) costó más que construir el propio tester.

Y una cosa más. Todos los agentes de la Fleet, incluso en runners efímeros de CI, se ejecutan dentro de [Coding Agent Sandboxes](https://docs.docker.com/ai/sandboxes/). Probamos con lo que usan nuestros usuarios.

---

_Recursos:_
- _[Post original en el Docker Blog](https://www.docker.com/blog/a-virtual-agent-team-at-docker-how-the-coding-agent-sandboxes-team-uses-a-fleet-of-agents-to-ship-faster/)_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
- _[Documentación de las skills de Claude Code](https://code.claude.com/docs/en/skills)_
- _[El Ralph Wiggum loop (Geoffrey Huntley)](https://ghuntley.com/ralph/)_
