---
title: "Elegir una terminal para desarrollar con agentes"
date: 2026-03-13 09:00:00 +0100
description: "Programar con agentes cambia lo que se le pide a la terminal: de ejecutar comandos a supervisar una TUI que se redibuja sin parar. La mayoría de terminales no están pensadas para eso."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "developer-experience", "terminal", "claude-code"]
type: post
weight: 30
translationKey: choosing-a-terminal-for-agentic-development
translatedFrom: f67c35f
---

![Elegir una terminal para desarrollar con agentes](/images/posts/2026-03-13-choosing-a-terminal-for-agentic-development/cover.png)

Un compañero me recomendó Warp. "Pruébalo", me dijo. "Va bien para el tipo de trabajo que hacemos." Llevaba años con Terminal.app. Lo de lanzar sesiones de Claude Code, supervisar agentes e iterar prompts tenía solo un año. Funcionaba. Pero nunca me había parado a preguntarme si funcionaba *bien*.

Así que empecé a probar Warp y, por el camino, le hice a ChatGPT una pregunta sencilla: "¿Cuál es la mejor terminal para desarrollar con agentes?" La respuesta me sorprendió. No por recomendar una terminal concreta, sino porque replanteó la pregunta entera. No va de las funcionalidades de la terminal, me dijo. Va de la **ergonomía cognitiva para supervisar a una IA**. Ese replanteamiento se me quedó clavado. Este post es el resultado.

## La pregunta de verdad

La mayoría de comparativas de terminales se fijan en funcionalidades: aceleración por GPU, paneles divididos, temas, APIs de scripting, ecosistemas de plugins. Todo eso importa para el desarrollo en general. Pero cuando tu trabajo diario consiste en supervisar agentes de código, la pregunta cambia.

Casi nunca estás escribiendo comandos. Estás viendo cómo piensa una IA. Lees trazas de razonamiento larguísimas, decides cuándo intervenir, saltas entre flujos de trabajo en paralelo y copias salida estructurada. La terminal deja de ser una interfaz de comandos y pasa a ser una interfaz de monitorización.

ChatGPT lo llamó "gestión del flujo de trabajo cognitivo". Creo que es el enfoque correcto. La pregunta no es "¿qué terminal tiene más funcionalidades?". Es "¿qué terminal me genera menos fricción mientras superviso varios hilos de razonamiento a la vez?".

## Lo que de verdad necesitas

Cuando pasas el día [supervisando agentes de código](/es/posts/2026-02-24-programar-con-agentes-como-conducir-tesla-autopilot/), la lista de funcionalidades que importan es más corta de lo que parece:

- **Varias sesiones simultáneas**, claramente separadas a la vista
- **Salida masiva en streaming** sin lag ni artefactos de renderizado
- **Scroll cómodo** por trazas de razonamiento largas
- **Cambio rápido de contexto** entre sesiones
- **Matar y reiniciar bucles** sin ceremonias
- **Copiar bloques estructurados** de salida sin ensuciarlos

Fíjate en lo que no aparece: temas, sugerencias de comandos con IA, autocompletado sofisticado, gestores de archivos integrados. Está bien tenerlos. Para supervisar agentes, son irrelevantes.

Hay una cosa que *sí* es importante y que ninguna terminal te resuelve: el **aislamiento de contexto**. Sigues necesitando directorios separados, [ramas de git por agente](/es/posts/2026-02-25-agentes-de-codigo-en-paralelo-con-docker-sandboxes/), límites de estado limpios y convenciones de nombres claras. Si no, los agentes en paralelo se pisan entre ellos. Eso es arquitectura, no terminal.

## Un detalle de arquitectura que importa

Algo en lo que no había pensado hasta que me puse a investigar. Claude Code no es una herramienta de línea de comandos tradicional. Está construido sobre [Ink](https://github.com/vadimdemedes/ink), un framework basado en React para interfaces de línea de comandos interactivas. Eso significa que es una **TUI que se redibuja continuamente**: actualizaciones en streaming, control interno del cursor, redibujados frecuentes. No ejecuta un comando, imprime la salida y termina. *Vive* en tu terminal como una aplicación interactiva y persistente.

Esto importa porque algunas terminales parten de la idea de que los comandos son piezas discretas: escribes algo, se ejecuta, produce una salida, fin. Las terminales que estructuran la salida con esa suposición (como los command blocks de Warp) pueden tener problemas cuando la aplicación que corre dentro no termina nunca. Claude Code es una única sesión larga que se actualiza sin parar. La terminal tiene que renderizarla, no interpretarla.

No digo que esto deje inservible ninguna terminal. Estoy usando Warp ahora mismo y, hasta ahora, funciona bien con mis sesiones. Pero conviene entender la diferencia entre "renderizar una TUI" y "estructurar la salida de comandos" cuando evalúas opciones. Cuanto más intenta tu terminal ser lista con la salida, más puede chocar con una aplicación que gestiona su propio renderizado.

## La parte psicológica

Es la parte que casi todas las comparativas ignoran, y en la que ChatGPT dio más en el clavo.

Trabajar con agentes es psicológicamente exigente. Procesas una cantidad enorme de salida, iteras rápido, ramificas mentalmente entre varios contextos y cambias de tarea todo el rato. Es supervisión cognitiva sostenida, más parecida a vigilar una mesa de trading que a escribir scripts de shell.

Cada fuente de fricción se acumula a lo largo de una jornada completa. Una terminal que se atasca con la salida rápida te obliga a esperar y a releer. Un scroll que se te resiste añade una microfrustración cada vez que revisas una traza de razonamiento. Un cambio de contexto que pide tres pulsaciones en vez de una se suma a lo largo de cientos de cambios al día.

Después de un día entero con agentes, o estás cansado porque el trabajo era difícil, o estás cansado porque las *herramientas* lo eran. Son dos tipos de cansancio distintos. El primero es productivo. El segundo es desperdicio.

La terminal que gana para el desarrollo con agentes no es la que tiene más funcionalidades ni los mejores benchmarks. Es la que **pasa desapercibida**. Aquella en la que tu atención nunca salta de la salida del agente al comportamiento de la terminal.

## La variable tmux

En toda comparativa de terminales hay una variable que nadie menciona: tmux. Salió durante mi investigación y merece una mención, aunque yo no lo uso ahora mismo.

tmux ofrece capacidades que los paneles nativos de las terminales no tienen. [Persistencia de sesiones](https://kareemf.com/on-agentic-coding-from-anywhere) a través de desconexiones SSH y cambios de dispositivo. [Control programático de paneles](https://kau.sh/blog/agent-forking/) para bifurcar sesiones de agentes con contexto compartido. [Flujos con popup](https://www.devas.life/how-to-run-claude-code-in-a-tmux-popup-window-with-persistent-sessions/) para invocar Claude Code con una sola pulsación. Incluso la función de [agent teams](https://code.claude.com/docs/en/agent-teams) de Claude Code exige tmux o iTerm2 para su modo de paneles divididos.

Tiene también su curva de aprendizaje. Los atajos de teclado resultan extraños al principio, aunque quienes lo usan a fondo dicen que en unas semanas se convierten en memoria muscular. Si trabajas en máquinas remotas o necesitas sesiones que sobrevivan a las desconexiones, la inversión merece la pena. Para trabajo puramente local como el mío ahora, los paneles nativos de Warp cumplen.

Si tmux te parece demasiado, [Zellij](https://zellij.dev/) es una alternativa moderna con atajos descubribles, mostrados en una barra de estado en tiempo real.

## Dónde estoy ahora

Pasé de Terminal.app a Warp. Funciona. Los paneles son buenos, los command blocks son útiles para los comandos que no son de agentes, y la experiencia general tiene menos fricción que lo que tenía antes. Todavía no he probado Ghostty ni otras alternativas, aunque la investigación para este post me enseñó cosas interesantes sobre cómo gestionan distintas terminales la carga de trabajo que genera una TUI como Claude Code.

Hay una función de Warp que no esperaba usar y que ahora uso con regularidad: [compartir sesión](https://docs.warp.dev/agent-platform/local-agents/session-sharing). Generas un enlace y un compañero entra en tu sesión de terminal desde su navegador o desde la app de Warp. Lo ve todo en directo, incluido el estado de pensamiento del agente y el consumo de tokens. Con los permisos activados, puede enviar sus propias consultas a la sesión. Convierte la supervisión de un agente, que era cosa de uno, en supervisión en pareja. Cuando estoy depurando un comportamiento raro de un agente con alguien del equipo, compartir la sesión es más rápido que describir lo que pasa por Slack.

La conclusión no es "usa la terminal X". Es esta: no elijas terminal por listas de funcionalidades, tablas de benchmarks ni recomendaciones de una IA. Prueba tu carga de trabajo real. Abre unas cuantas sesiones de Claude Code, supervísalas durante una tarde y fíjate en adónde se va tu atención. Si se va a la salida de los agentes, tu terminal está haciendo su trabajo. Si se va a la propia terminal, hay algo que cambiar.

La mejor herramienta es la que olvidas que estás usando.

---

_Recursos:_
- _[Ink](https://github.com/vadimdemedes/ink): React para CLIs interactivas, el framework que usa Claude Code_
- _[Claude Code Agent Teams](https://code.claude.com/docs/en/agent-teams): modo oficial de paneles divididos (requiere tmux o iTerm2)_
- _[Agent forking con tmux](https://kau.sh/blog/agent-forking/): lanzar sesiones de IA en paralelo con contexto compartido_
- _[Agentic coding from anywhere](https://kareemf.com/on-agentic-coding-from-anywhere): SSH + tmux + Tailscale para supervisar agentes desde el móvil_
- _[Agent Deck](https://github.com/asheshgoplani/agent-deck): gestor de sesiones tmux para agentes de código con IA_
- _[Zellij](https://zellij.dev/): multiplexor de terminal moderno con atajos descubribles_
