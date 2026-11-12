---
title: "Los seis niveles del desarrollo asistido por IA"
date: 2026-03-18 09:00:00 +0100
description: "De no usar IA a tener agentes totalmente autónomos. Un modelo de madurez de cómo los desarrolladores adoptan herramientas de IA, y por qué tu stack debería corresponderse con tu nivel."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "developer-experience", "ai"]
type: post
weight: 30
translationKey: the-six-levels-of-ai-assisted-development
translatedFrom: 34eb269
---

![Los seis niveles del desarrollo asistido por IA](/images/posts/2026-03-18-the-six-levels-of-ai-assisted-development/cover.png)

Dejé VS Code por Cursor para tener el chat de IA. Después me llevé ese chat a la terminal. Y ahora ya no tengo claro que Cursor me haga falta.

Ese recorrido no fue casual. Siguió un patrón en el que llevo tiempo pensando: un modelo de madurez de cómo los desarrolladores adoptan las herramientas de IA. Cada nivel cambia qué herramientas importan en tu stack y cuáles dejan de importar. Saber en qué punto de la curva estás te evita optimizar lo que no toca.

## Los seis niveles

Así veo yo las etapas del desarrollo asistido por IA:

**Nivel 1: sin IA.** Lo escribes todo a mano. El IDE es tu herramienta principal: navegar, refactorizar, depurar, ejecutar tests. Aquí estábamos casi todos hace un par de años.

**Nivel 2: autocompletado de código.** GitHub Copilot, Codeium o similares. La IA sugiere la siguiente línea o el siguiente bloque. Tú aceptas o rechazas. Aquí el IDE importa mucho, porque las sugerencias van en línea, muy integradas con el editor. Un mejor IDE da mejores sugerencias.

**Nivel 3: agentes de chat dentro del IDE.** El chat en línea de Cursor, Copilot Chat o similares. Describes lo que quieres en lenguaje natural, el agente genera código y tú lo revisas y lo aceptas. La IA tiene más contexto (el archivo abierto, la estructura del proyecto) y puede hacer cambios de varias líneas. El IDE es la interfaz de la IA.

**Nivel 4: un agente de código en la terminal.** [Claude Code](https://docs.anthropic.com/en/docs/claude-code), Codex CLI o similares. El agente corre en una sesión de terminal con acceso completo al repositorio. Lee archivos, escribe código, ejecuta tests e itera. El IDE pasa a ser el sitio donde revisas: lees diffs, compruebas la salida, apruebas o rechazas. La interfaz de la IA es la terminal, no el editor.

**Nivel 5: varios agentes en paralelo.** Varias sesiones de terminal, cada una en su propio [git worktree](/es/posts/2026-02-25-agentes-de-codigo-en-paralelo-con-docker-sandboxes/), cada una con una tarea distinta. El IDE tiene varias ventanas abiertas para revisar el trabajo de cada agente. Supervisas, no programas.

**Nivel 6: agentes que funcionan de forma autónoma.** Los agentes no necesitan tu portátil para nada. Se ejecutan en CI, en la nube, de forma programada. Tú revisas pull requests. El IDE es una herramienta para revisar PRs. Todavía no estamos ahí en la mayoría de los flujos de trabajo, pero la trayectoria está clara.

Tu stack debería corresponderse con el nivel en el que estás, no con el nivel al que el marketing te dice que aspires.

## Qué cambia en cada nivel

Lo interesante de este modelo no son los niveles en sí. Es lo que deja de importar en cada transición.

En el nivel 2 empiezas a fijarte en la calidad de las sugerencias y menos en la velocidad al teclear. En el nivel 3 te importa el contexto del chat y menos los atajos de teclado. En el nivel 4, las funciones de IA del IDE se vuelven redundantes, porque el agente tiene todo el repositorio desde la terminal. En el nivel 5 dejas de escribir código del todo y pasas a supervisar. En el nivel 6 dejas de supervisar en tiempo real y pasas a revisar de forma asíncrona.

Cada salto deja a la herramienta anterior menos en el centro. No inútil, solo menos central. El IDE no desaparece en el nivel 4: se convierte en un visor de diffs. La terminal no desaparece en el nivel 6: se convierte en el sitio donde miras los logs.

## ¿Dónde estás tú?

La mayoría de los desarrolladores con los que hablo están entre el nivel 2 y el nivel 3. Usan el autocompletado a diario. Algunos han probado los agentes de chat. Pocos han dado el salto a los agentes en la terminal. Casi nadie está de forma constante en el nivel 5.

Si estás eligiendo herramientas, empieza por averiguar tu nivel. Un IDE de nivel 3 (Cursor) es excelente en el nivel 3, pero redundante en el 4. Un orquestador de agentes es esencial en el nivel 5, pero abrumador en el 3. No compres herramientas para el nivel al que aspiras. Compra las del nivel en el que estás, y cámbialas cuando llegues al siguiente.

El próximo post cuenta [cómo es en realidad mi stack](/es/posts/2026-03-20-mi-stack-de-programacion-con-agentes/) en el nivel 4: por qué dejé atrás el chat de Cursor, por qué Go encaja con los flujos de trabajo agénticos y por qué la terminal es el nuevo IDE.

---

_Recursos:_
- _[Claude Code](https://docs.anthropic.com/en/docs/claude-code)_
- _[Cursor](https://cursor.com/)_
- _[GitHub Copilot](https://github.com/features/copilot)_
