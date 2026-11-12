---
title: "Mi stack de programación con agentes: por qué el IDE importa menos de lo que crees"
date: 2026-03-20 09:00:00 +0100
description: "VS Code, Cursor, Warp, Go, Claude Code. En el nivel 4, la terminal manda y el IDE pasa a ser una herramienta de revisión. Así es mi stack."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "developer-experience", "claude-code", "go", "terminal"]
type: post
weight: 30
translationKey: my-agentic-coding-stack
translatedFrom: c410d7b
---

![Mi stack de programación con agentes](/images/posts/2026-03-20-my-agentic-coding-stack/cover.png)

En el [post anterior](/es/posts/2026-03-18-los-seis-niveles-del-desarrollo-asistido-por-ia/) describí seis niveles de desarrollo asistido por IA, desde cero IA hasta agentes totalmente autónomos. Cada nivel cambia qué herramientas importan y cuáles se vuelven irrelevantes. Este post cuenta cómo es mi stack en el nivel 4: un agente de programación en la terminal y el IDE como superficie de revisión.

## Por qué dejé de usar el chat de Cursor

Me pasé a Cursor pensando específicamente en el nivel 3. El chat integrado me resultó muy útil: describes un cambio, lo ves aplicado en contexto y lo aceptas o lo retocas. Era como hacer pair programming dentro del editor.

Luego empecé a usar Claude Code en la terminal. Nivel 4. El agente tenía el contexto completo del repo sin que yo tuviera que seleccionar ficheros ni abrir pestañas. Podía leer cualquier fichero, ejecutar tests, mirar la salida del build e iterar sobre los fallos. Lo que podía hacer en una sola interacción era muchísimo más de lo que daba de sí el chat del IDE.

Llegados a ese punto, el chat de Cursor pasó a ser algo que casi nunca abría. Seguí usando Cursor como editor, pero solo para lo mismo que haría con VS Code: leer código, revisar diffs y navegar por el proyecto. Las funciones de IA que justificaron el cambio ya no formaban parte de mi flujo de trabajo.

No es una crítica a Cursor. En el nivel 3 es excelente. Pero el nivel 4 vuelve redundantes las funciones de IA del IDE. El agente no necesita estar dentro del editor cuando tiene todo el repo desde la terminal.

## La terminal es el nuevo IDE

A partir del nivel 4, el trabajo ocurre en la terminal. Ahí el agente lee, escribe, prueba e itera. Lo que importa en una terminal para este flujo no es lo mismo que importa para el uso tradicional de la shell.

La velocidad de renderizado importa porque el agente produce mucha salida. El scrollback importa porque necesitas revisar lo que hizo el agente tres pasos atrás. La persistencia de sesión importa porque las sesiones con agentes pueden durar una hora. Lo conté en detalle en mi [post sobre terminales](/es/posts/2026-03-13-elegir-terminal-para-desarrollo-con-agentes/), donde comparé Terminal.app, iTerm2, Warp y Ghostty específicamente para cargas de trabajo con agentes.

Me quedé con [Warp](https://www.warp.dev/). Aguanta bien la carga de renderizado, la salida por bloques facilita revisar lo que hace el agente y es lo bastante rápida para que las sesiones largas de Claude Code no vayan a trompicones. Pero la terminal concreta importa menos que darte cuenta de que la terminal *es* donde vas a pasar el tiempo en el nivel 4.

## Por qué Go encaja con los flujos con agentes

Go no es el único lenguaje que funciona bien con agentes de programación, pero tiene propiedades que lo hacen especialmente bueno:

**Compilación rápida.** El agente escribe código, ejecuta `go build` y recibe feedback en segundos. En lenguajes con builds lentos, el agente espera, y tú esperas con él. Los bucles de feedback rápidos se acumulan a lo largo de decenas de iteraciones en una sola sesión.

**Tipado fuerte con errores claros.** Cuando el agente comete un error de tipos, el compilador le dice exactamente qué falla y dónde. El agente lee el error, corrige el código y recompila. Sin adivinar, sin sorpresas en runtime. El sistema de tipos hace de barandilla para el agente.

**Tooling de tests integrado.** `go test` forma parte del lenguaje, no es un framework de terceros. El agente puede ejecutar tests, leer los fallos y arreglarlos sin necesidad de conocer tu framework de tests, tu test runner ni la configuración de tu CI. Simplemente funciona.

**Dependencia mínima del IDE.** Go no necesita un IDE para ser productivo. `gofmt` se encarga del formato. `go vet` detecta problemas. El language server ofrece autocompletado y navegación. Todo esto funciona igual de bien desde la terminal que desde el IDE. En el nivel 4, donde el IDE es solo un revisor, eso cuenta.

## ¿VS Code o Cursor? Depende de tu nivel

Si estás en el nivel 2-3, gana Cursor. Sus completions en línea y su chat están mejor integrados que las extensiones de Copilot de VS Code. Las funciones de IA son el producto, y están muy pulidas.

Si estás en el nivel 4 o superior, VS Code y Cursor son intercambiables. La IA está en la terminal. Los dos editores manejan diffs, navegación y resaltado de sintaxis igual de bien. Elige el que prefiera tu memoria muscular.

Por eso ahora mismo estoy entre VS Code y Cursor. Me cambié *a* Cursor por el chat. Ahora que no uso el chat, no hay una razón de peso para quedarme ni para irme. Los dos valen como superficie de revisión. La herramienta que importa es la de la terminal.

## Cómo es el nivel 5

En los días buenos, ejecuto dos o tres sesiones de Claude Code en pestañas distintas de Warp. Cada sesión trabaja en su propio [git worktree](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows) para que los agentes no se pisen los ficheros. El IDE tiene varias ventanas abiertas, una por worktree, para revisar los cambios de cada agente.

El flujo es así: arranco al agente A en una rama de feature, paso al agente B para arreglar un bug, miro cómo va el A, reviso y mergeo el trabajo del B, y le doy feedback al A. Es [supervisar, no programar](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot).

El nivel 5 es donde el papel del IDE pasa a ser puramente pasivo. No editas en él. No chateas en él. Lees diffs y haces clic en "aprobar". En este nivel, el mejor IDE es el que tiene el mejor visor de diffs y el cambio de fichero más rápido.

## El stack es el nivel

Mi stack de hoy: VS Code o Cursor (intercambiables), Warp, Go, Claude Code. Pero las herramientas concretas importan menos que el nivel en el que trabajo. En el nivel 4, la terminal es el centro. El IDE es la periferia. Y el lenguaje tiene que darle feedback rápido al agente.

Si estás eligiendo un stack para desarrollar con agentes, empieza por averiguar tu nivel. Luego elige las herramientas que encajan con él. No compres un IDE de nivel 3 para un flujo de nivel 4.

---

_Recursos:_
- _[Claude Code](https://docs.anthropic.com/en/docs/claude-code)_
- _[Terminal Warp](https://www.warp.dev/)_
- _[Cursor](https://cursor.com/)_
