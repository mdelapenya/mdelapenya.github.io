---
title: "gwaim: la herramienta que necesitaba el nivel 5"
date: 2026-03-21 09:00:00 +0100
description: "Describí el nivel 5 como cuatro agentes, cuatro worktrees y un desarrollador. Después construí la herramienta para gestionarlo: un dashboard TUI para worktrees de git y los agentes de código que corren dentro de ellos."
categories: [Technology, Software Development]
tags: ["coding-agents", "go", "git-worktrees", "developer-experience", "terminal"]
type: post
weight: 30
translationKey: gwaim-the-tool-that-level-5-needed
translatedFrom: 0ecc248
---

![gwaim: la herramienta que necesitaba el nivel 5](/images/posts/2026-03-21-gwaim-the-tool-that-level-5-needed/cover.png)

## El dolor manual

El [flujo de trabajo del nivel 5](/es/posts/2026-03-23-nivel-5-en-la-practica-cuatro-agentes-cuatro-worktrees/) funcionaba. Cuatro worktrees de git, cuatro paneles de Warp, cuatro sesiones de Claude Code. Cada una en su rama, con su tarea y su propio `/loop`. El rendimiento era real. Tres PRs mergeadas antes de comer en lugar de una.

Pero la preparación era toda manual. `git worktree add ../sandbox-fix-auth fix/auth-bypass`. Repetir cuatro veces. Abrir cuatro terminales. Navegar a cada directorio. Arrancar Claude Code en cada una. Comprobar qué ramas van por delante o por detrás. Saltar de panel en panel para ver qué agente ha terminado. Abrir el navegador para mirar el estado de las PRs. Ejecutar `gh pr view` en cada worktree para ver los resultados de CI.

Con cuatro worktrees, esto se aguanta. Molesta, pero se aguanta. Cuando pasas a seis u ocho, el esfuerzo de gestión se come lo que ganabas en productividad. Dedicas más tiempo a gestionar los worktrees que a supervisar a los agentes que viven dentro. El cuello de botella en el [nivel 5](/es/posts/2026-03-18-los-seis-niveles-del-desarrollo-asistido-por-ia/) no son los agentes. Es gestionarlos.

Cada mañana tropezaba con la misma fricción. Crear worktrees. Revisar el estado de sincronización. Abrir terminales. Averiguar qué agentes corren y dónde. Cerrar los worktrees que ya no sirven. El flujo de trabajo del post era sólido, pero las herramientas a su alrededor eran comandos de bash y memoria. Eso tenía que cambiar.

## Operaciones con una sola tecla

gwaim es un dashboard de terminal para worktrees de git. Todo lo que antes era un comando de git de varios pasos ahora es una sola pulsación.

`c` crea un worktree. Te pide el nombre de la rama, crea el worktree y lo añade al dashboard. Se acabó teclear `git worktree add` con la ruta y el nombre de rama correctos. `Enter` abre una pestaña de terminal en el directorio de ese worktree, lista para un agente. `e` abre el IDE apuntando al worktree. `d` borra un worktree con confirmación (y limpia automáticamente las referencias obsoletas). `p` trae los últimos cambios del remoto para la rama del worktree seleccionado.

El dashboard muestra todos los worktrees en una cuadrícula adaptable. El worktree principal va arriba, con un borde doble que lo distingue de los worktrees enlazados que tiene debajo. Cada tarjeta muestra el nombre de la rama, el estado de sincronización (por delante, por detrás, divergente o al día) y qué agentes de código están activos en ese directorio. La cuadrícula se refresca sola cada tres segundos.

Ese refresco importa. Echas un vistazo al dashboard y sabes cómo está todo. Qué worktrees tienen agentes corriendo. Qué ramas necesitan un push. Qué PRs pasan CI. Sin saltar entre paneles, sin ejecutar comandos de estado, sin mantener en la cabeza un modelo mental de ocho ramas.

## Detección de agentes

gwaim escanea los procesos en ejecución para detectar qué agentes de código están activos en cada worktree. Usa gopsutil para leer la lista de procesos y la compara con los agentes conocidos: Claude Code, Kiro, Copilot, Codex, OpenCode, Gemini. Si el proceso de un agente tiene como directorio de trabajo una ruta dentro de un worktree, gwaim lo muestra en la tarjeta de ese worktree.

No hace falta configurar nada. No le dices a gwaim qué agentes usas ni dónde corren. Los descubre escaneando los procesos del sistema. Si arrancas una sesión de Claude Code en un worktree, gwaim la recoge en el siguiente refresco. Si la sesión termina, desaparece. La detección se basa en procesos, no en configuración, así que funciona con cualquier agente que corra como proceso en una terminal.

Esta es la vista de supervisión que le faltaba al flujo de trabajo del nivel 5. Con cuatro paneles sabía qué agentes estaban corriendo porque veía las terminales. Con ocho o diez worktrees no puedes tener todos los paneles a la vista. gwaim te da el panorama sin necesidad de ver cada terminal.

## Integración con las PRs

Cada tarjeta de worktree muestra el estado de su pull request. gwaim usa la CLI de GitHub para obtener la información de la PR: número, título, estado y resultados de los checks de CI. Checks en verde, fallos en rojo, ejecuciones pendientes. Todo visible en la tarjeta, sin abrir el navegador ni ejecutar `gh pr view`.

Esto cierra el último hueco del ciclo de supervisión. Ves el worktree, el estado de sincronización de la rama, el agente activo y el estado de la PR. Todo en un mismo sitio. Cuando una tarjeta muestra un check verde y ningún agente activo, esa PR está lista para revisión. Cuando muestra un fallo rojo y un agente activo, el agente probablemente está iterando sobre el arreglo. Cuando muestra un fallo rojo y ningún agente, algo necesita tu atención.

El dashboard te dice dónde mirar. Ese es el trabajo de una herramienta de supervisión. No hacer el trabajo, sino hacer visible el estado para que decidas qué te necesita y qué no.

## Las decisiones técnicas

**Go.** Compilación rápida, un único binario, sin dependencias de runtime. Coherente con el resto de mi stack de agentes. Cuando necesito una herramienta, tiro de Go. El binario compila en segundos y corre en cualquier sitio sin instalar un runtime del lenguaje.

**Bubbletea.** El framework de TUI de Charmbracelet para Go. Sigue la arquitectura Elm: un modelo, una función de actualización y una función de vista. El modelo guarda el estado (worktrees, agentes, estado de las PRs), la función de actualización gestiona las pulsaciones de teclas y los ticks del temporizador, y la función de vista pinta la cuadrícula. Es la opción estándar para TUIs en Go y maneja con limpieza el redimensionado de la terminal, los eventos de ratón y los mensajes asíncronos.

**go-git v6.** Operaciones sobre worktrees sin invocar git por línea de comandos. Listar worktrees, crearlos, eliminarlos, comprobar el estado de sincronización. Todo a través de una API de Go. Un detalle: la v6 todavía no se ha publicado. gwaim corre sobre código en pre-release. Fue una decisión consciente. El soporte de worktrees de la v5 era limitado y la v6 tiene las APIs que necesitaba. La contrapartida es que la dependencia puede traer cambios incompatibles antes de estabilizarse. Acepté esa apuesta porque la alternativa era invocar `git` y parsear su salida de texto, que es frágil de otra manera.

**gopsutil.** Escaneo de procesos multiplataforma. Lee la lista de procesos en macOS y Linux sin código específico de cada plataforma. gwaim lo usa para encontrar los procesos de los agentes y asociarlos con los directorios de los worktrees. Una sola dependencia, las dos plataformas.

**Soporte para varias terminales.** gwaim abre pestañas nuevas, no ventanas nuevas. En macOS soporta Warp, iTerm y Terminal.app. En Linux soporta gnome-terminal, konsole y xfce4-terminal. El [post de comparativa de terminales](/es/posts/2026-03-13-elegir-terminal-para-desarrollo-con-agentes/) explicaba por qué Warp es mi opción por defecto, pero gwaim no te obliga a elegir. Detecta tu terminal y abre las pestañas en consecuencia.

**Ratón desactivado por defecto.** Los frameworks de TUI capturan los eventos de ratón, y eso rompe la selección de texto en la terminal. gwaim mantiene el ratón desactivado para que puedas seleccionar y copiar texto con normalidad. Pulsa `m` para activarlo si quieres seleccionar con clic las tarjetas de los worktrees.

## De un post a una herramienta

El post del nivel 5 describía el flujo de trabajo. Luego viví con ese flujo durante dos semanas. La fricción se fue acumulando. Cada mañana, la misma preparación manual. En cada sesión, las mismas comprobaciones de estado. Cada vez que quería saber qué agentes estaban corriendo, el mismo baile de saltar entre paneles.

Así que construí la herramienta que le faltaba al post.

No es la primera vez que pasa. Necesitaba probar el envío de correos con Resend en un proyecto Go. No existía ningún módulo de testcontainers. Construí testcontainers-go-resend. Describí en un post un flujo manual con worktrees. No existía ninguna herramienta para gestionarlo. Construí gwaim. El patrón es siempre el mismo: escribir sobre el dolor, sentir la fricción, construir la solución.

gwaim existe porque el post del nivel 5 lo pedía a gritos. El post concretó el flujo lo bastante como para ver qué faltaba. Y lo que faltaba era una única pantalla que responda tres preguntas de un vistazo: qué worktrees existen, qué corre en ellos y en qué estado están sus PRs. Eso es gwaim. Ni más ni menos.

Una línea que estoy explorando: un servidor MCP que exponga los datos de gwaim directamente a los agentes de código. Ahora mismo, los agentes que corren en un worktree no ven los demás. No saben qué ramas existen, qué agentes están activos en otro sitio ni si una PR relacionada pasa CI. Un servidor MCP podría permitirles consultar el dashboard en lugar de invocar `git`, `gh` y `ps` por separado. Menos llamadas a herramientas, mejor contexto, y los mismos datos de supervisión que gwaim me enseña a mí quedarían al alcance de los propios agentes.

---

_Recursos:_
- _[gwaim en GitHub](https://github.com/mdelapenya/gwaim)_
- _[Bubbletea](https://github.com/charmbracelet/bubbletea)_
- _[go-git](https://github.com/go-git/go-git)_
