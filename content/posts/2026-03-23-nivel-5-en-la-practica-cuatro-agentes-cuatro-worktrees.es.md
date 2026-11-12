---
title: "Nivel 5 en la práctica: cuatro agentes, cuatro worktrees, un desarrollador"
date: 2026-03-23 09:00:00 +0100
description: "Cuatro instancias de Claude Code, cuatro git worktrees y un comando /loop por agente. Así es el Nivel 5 de verdad, desde el flujo manual hasta el dashboard gwaim que lo sustituyó."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "developer-experience", "claude-code", "terminal", "git-worktrees"]
type: post
weight: 30
translationKey: level-5-in-practice-four-agents-four-worktrees-one-developer
translatedFrom: dea854c
---

![Nivel 5 en la práctica: cuatro agentes, cuatro worktrees, un desarrollador](/images/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer/cover.png)

En el post de los [seis niveles](/es/posts/2026-03-18-los-seis-niveles-del-desarrollo-asistido-por-ia/) describí el Nivel 5: varios agentes en paralelo, cada uno en su propio worktree, y el IDE solo para revisar. Eso era la teoría. Esto es lo que pasa un miércoles por la mañana.

Cuatro paneles de Warp. Cuatro git worktrees. Cuatro sesiones de Claude Code. Cada una trabajando en una tarea distinta. Y cada una ejecutando su propio comando `/loop`: vigila el CI por su cuenta, hace merge desde main, arregla los fallos y hace push. Cuatro agentes, cuatro bucles de feedback, un desarrollador supervisando.

## La configuración

> **Actualización:** Después de escribir este post construí [gwaim](/es/posts/2026-03-21-gwaim-la-herramienta-que-necesitaba-el-nivel-5/), un dashboard TUI que sustituye al flujo manual de abajo. Una pulsación para crear un worktree, un vistazo para ver qué agentes están corriendo. El dolor que describo aquí fue lo que dio origen a la herramienta. Dejo la descripción original porque explica *por qué* existe gwaim.

La disposición física es una ventana de Warp con cuatro paneles en cuadrícula. Cada panel es una sesión de Claude Code apuntando a su propio git worktree. Antes de gwaim, creaba los worktrees a mano:

```bash
git worktree add ../sandbox-fix-auth fix/auth-bypass
git worktree add ../sandbox-feat-templates feat/template-registry
git worktree add ../sandbox-refactor-daemon refactor/daemon-startup
git worktree add ../sandbox-test-windows test/windows-e2e
```

Cada worktree tiene su propia rama. Luego abro una sesión de Claude Code en cada uno. Cuatro terminales, cuatro repos independientes, cuatro agentes que no pueden pisarse los ficheros.

Claude Code también trae un flag `-w` que crea worktrees por ti (`claude -w feature-auth`), y [gwaim](/es/posts/2026-03-21-gwaim-la-herramienta-que-necesitaba-el-nivel-5/) lo resuelve todo con una sola pulsación de `c`. Pero entender el flujo manual importa, porque te enseña qué estás automatizando en realidad.

## Una tarea por agente

La restricción clave: cada agente recibe una **tarea autocontenida**. Una tarea que no depende de lo que haga ningún otro agente. Si dos tareas tocan los mismos ficheros, no pueden correr en paralelo. Si la tarea B necesita el resultado de la tarea A, la B espera.

Buenas tareas para paralelizar:
- Un bug fix en un subsistema aislado
- Una funcionalidad nueva en un paquete nuevo
- Un refactor de un único módulo
- Arreglos de tests específicos de una plataforma

Malas tareas para paralelizar:
- Dos funcionalidades que modifican el mismo fichero de configuración
- Un refactor y una funcionalidad que tocan la misma capa de API
- Cualquier cosa en la que un "merge main" pueda generar conflictos con el trabajo en curso de otro agente

Dedico unos cinco minutos al empezar la sesión a decidir qué tareas pueden ir en paralelo. Esa planificación inicial me ahorra horas de resolución de conflictos de merge más adelante.

## El /loop que lo cambió todo

Cada agente recibe una tarea y un `/loop`. El `/loop` es una [skill incluida](https://code.claude.com/docs/en/scheduled-tasks) en Claude Code que ejecuta un prompt a intervalos regulares. El mío es así:

```
/loop 5m read the CI builds for this PR, and determine why they fail.
If you think the fix is in main, cd to the main repo, run git pull,
come back to your worktree, and run git merge main --commit, resolving
conflicts if needed. And push the changes. If not, try to resolve the
CI errors here, committing when resolved, and pushing to the branch.
```

Cada cinco minutos, el agente revisa el CI. Si los builds fallan, diagnostica la causa. Si la solución es un merge de main (alguien más ha integrado un cambio que arregla la dependencia), hace el merge y el push. Si la solución está en su propio código, la aplica, hace commit y push. Después espera al siguiente ciclo.

Esto es el multiplicador. Sin `/loop`, sería yo quien revisase el CI de cuatro ramas, diagnosticase los fallos, decidiese entre merge o arreglo y subiese los cambios. Con `/loop`, cada agente gestiona su propio bucle de feedback con el CI. Yo solo intervengo cuando un agente se atasca con algo que no puede resolver.

Aquel prompt suelto acabó evolucionando hasta convertirse en una [skill de Claude Code](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-nurse/SKILL.md) de verdad: `pr-nurse`. La skill añade lo que le falta al prompt en crudo: comprueba si la PR es mergeable con `gh pr view`, incluye pautas para resolver conflictos (conservar la intención, preguntar cuando hay ambigüedad), impone la regla de seguridad de "nunca force push" y resume lo ocurrido al final de cada ciclo. Si [las skills son roles, no comandos](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/), `pr-nurse` es el rol formalizado para el trabajo que el prompt suelto hacía a salto de mata. Es una de las [cuatro skills de PR](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/) que uso en cada pull request, todas reunidas en [coding-skills](https://github.com/mdelapenya/coding-skills).

El `/loop` vive solo dentro de la sesión: muere cuando sales de Claude Code. Las tareas caducan solas a los tres días. Si no indicas intervalo, el valor por defecto es de 10 minutos. Para iterar sobre el CI, 5 minutos me parece lo justo. Lo bastante rápido para pillar los fallos pronto, y lo bastante lento para no gastar tokens revisando builds que ni han empezado.

## Cómo es supervisar a esta escala

Con cuatro agentes en marcha, mi trabajo cambia por completo. Ya no escribo código. Lo que hago es:

**Revisar PRs.** Cuando un agente sube un build en verde, reviso el diff en VS Code. Aquí es donde el IDE se gana el sitio: leer diffs, comprobar la cobertura de tests, verificar el enfoque. Apruebo o pido cambios. El agente lee los comentarios de la review e itera.

**Responder preguntas de los agentes.** A veces un agente se topa con una ambigüedad: "¿Uso el middleware de auth existente o creo uno nuevo?". Respondo en el terminal y sigue. Son interrupciones breves.

**Desatascar agentes.** Un agente que lleva tres ciclos dando vueltas al mismo fallo de CI necesita ayuda. Quizá el test es inestable (flaky) y le falta una anotación de reintento. Quizá el agente ha identificado mal la causa raíz. Diagnostico, le doy un empujón y sigo con lo mío.

**Decidir el orden de merge.** Cuando varios agentes tienen PRs en verde, decido cuál se integra primero. El orden importa porque integrar una PR puede crear conflictos en la rama de otro agente. Integro primero la más pequeña y aislada, y luego les digo a los demás que hagan merge de main. Con [gwaim](/es/posts/2026-03-21-gwaim-la-herramienta-que-necesitaba-el-nivel-5/), el estado de la PR y los resultados del CI se ven en la tarjeta de cada worktree, así que esta decisión lleva segundos en vez de una ronda de comandos `gh pr view`.

Esto es [supervisar, no programar](/es/posts/2026-02-24-programar-con-agentes-como-conducir-tesla-autopilot/). El mismo salto del Nivel 3 al 4 que conté en el [post sobre mi stack](/es/posts/2026-03-20-mi-stack-de-programacion-con-agentes/), pero multiplicado.

## Cuando se rompe

Este flujo no es magia. Se rompe de formas bastante previsibles:

**Conflictos de merge entre worktrees.** El agente A integra en main. El agente B intenta hacer merge de main y se encuentra con conflictos. Si los conflictos están en los mismos ficheros en los que trabaja B, el agente suele resolverlos. Si están en ficheros que B no ha tocado, a veces toma malas decisiones. Estoy atento y intervengo pronto.

**Agentes que van en círculos.** Un agente arregla un fallo de CI, hace push, y entonces introduce un fallo nuevo que arregla revirtiendo el cambio original. Tres ciclos así y has quemado tokens para nada. Cuando veo que un agente hace push más de dos veces sin que el CI se ponga en verde, paro el `/loop`, leo el historial y le doy una dirección explícita.

**Tareas demasiado interdependientes.** Si la funcionalidad del agente A necesita la API refactorizada del agente B, ponerlos en paralelo fue un error. Debería haberlos puesto en secuencia. Descubrirlo a mitad de sesión sale caro: has gastado tokens y tiempo en trabajo paralelo que ahora hay que serializar.

## Las cuentas

No digo que sea 4 veces más rápido. El coste de gestión es real: planificar qué tareas se pueden paralelizar, supervisar cuatro flujos, resolver conflictos de merge, decidir el orden de integración, y el gasto en tokens de cuatro agentes ejecutando `/loop` cada cinco minutos. Aun así, el aumento de throughput es sustancial.

Una mañana típica en solitario: elijo una tarea, trabajo en ella, itero con el CI, la integro. Con suerte, empiezo una segunda.

Una mañana típica de Nivel 5: cuatro tareas en vuelo, dos o tres integradas antes de comer y la cuarta pendiente de un ciclo más de CI. El tiempo que tarda cada tarea es más o menos el mismo (el agente sigue teniendo que escribir código, ejecutar tests e iterar sobre los fallos). La diferencia es que las tareas se solapan en vez de ir una detrás de otra.

La ganancia real no es la velocidad por tarea. Es el **throughput por mañana**. Tres PRs integradas en lugar de una. Y eso se acumula a lo largo de una semana.

## Hacia dónde va esto

Claude Code ya tiene funciones que automatizan parte de este flujo. La [skill `/batch`](https://code.claude.com/docs/en/skills#bundled-skills) descompone un cambio grande en entre 5 y 30 unidades independientes, lanza un agente por unidad (cada uno en su propio worktree) y abre una PR por cada una. Los [agent teams](https://code.claude.com/docs/en/agent-teams) (experimentales) permiten que varias instancias de Claude Code se coordinen con una lista de tareas compartida y mensajería entre agentes.

Mi flujo manual de cuatro paneles es un puente. Funciona hoy, con funciones estables y sin flags experimentales. Los agent teams y `/batch` son hacia donde va la automatización. Cuando los agent teams se estabilicen, la configuración de "cuatro paneles de Warp" pasará a ser "un comando que lanza un equipo coordinado". Eso es el Nivel 6: agentes que no necesitan mi portátil para nada.

Pero hoy, cuatro paneles y cuatro comandos `/loop` cumplen. Y la carga manual de gestionar esos paneles ya la resuelve [gwaim](/es/posts/2026-03-21-gwaim-la-herramienta-que-necesitaba-el-nivel-5/), un dashboard TUI que construí precisamente porque este flujo lo pedía a gritos. Una pulsación para crear un worktree, un vistazo para ver qué agentes están corriendo y qué PRs están en verde. El dolor manual de este post es lo que dio origen a la herramienta.

## De lo que nadie habla

[Julien Barbier lo expresó muy bien](https://x.com/jbarbier/status/2030453407300116725): "Usar Claude Code tiene un efecto secundario extraño: no solo eres más productivo, sino que te entran ganas de trabajar más. Hay algo adictivo en ver cómo nace un producto en tiempo real delante de tus ojos. 'Una última funcionalidad' tras 'una última funcionalidad' y ya son más de las 3 de la madrugada."

Ahí está el peligro.

Cuatro agentes en paralelo son cuatro fuentes de dopamina. Funcionalidades que aterrizan, tests que se ponen en verde, PRs que se integran. El bucle de feedback engancha. Sientes que estás haciendo el trabajo de una semana en una mañana. Y sigues. Una tarea más. Un agente más. Un `/loop` más. Son las 11 de la noche y llevas supervisando desde las 8 de la mañana.

Las herramientas de productividad no tienen botón de apagado. El botón tienes que ser tú. La misma disciplina que hace funcionar el Nivel 5 (planificar las tareas de antemano, decidir el orden de merge, saber cuándo un agente está atascado) también implica saber cuándo *tú* estás atascado en un bucle. Tres PRs integradas antes de comer es una mañana estupenda. Seis PRs integradas a medianoche es el camino al burnout.

Sigo buscando mis límites. Pero conozco el patrón: los días en que me siento más productivo suelen ser los días en que debería haber parado dos horas antes.

---

_Recursos:_
- _[Claude Code /loop y tareas programadas](https://code.claude.com/docs/en/scheduled-tasks)_
- _[Agent teams de Claude Code](https://code.claude.com/docs/en/agent-teams)_
- _[Documentación de git worktree](https://git-scm.com/docs/git-worktree)_
- _[Terminal Warp](https://www.warp.dev/)_
