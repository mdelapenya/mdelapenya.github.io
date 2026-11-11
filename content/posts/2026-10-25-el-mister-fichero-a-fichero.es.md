---
title: "El míster, fichero a fichero"
date: 2026-10-25 07:00:00 +0100
description: "Ocho ficheros, 460 líneas. Qué hace cada parte de the-mister: el equipo y las preguntas para asignar el tier, el plan y las órdenes de trabajo que guarda bajo .git, el flujo de ocho pasos, los tres agentes incluidos, y cómo una misma skill despacha en Claude Code, Codex y cualquier otro runtime. Y después, qué dicen de todo ello veinte planes reales."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "codex", "skills", "orchestration", "subagents"]
type: post
weight: 30
translationKey: the-mister-file-by-file
translatedFrom: 3909a4b
---

![El míster, fichero a fichero](/images/posts/2026-10-25-the-mister-file-by-file/cover.png)

Este mes he escrito dos posts que rondaban la misma skill sin abrirla. [El primero](/es/posts/2026-10-09-un-modelo-mas-barato-puede-ser-mejor-instrumento/) trataba de por qué un modelo más barato es mejor instrumento para medir tus instrucciones. [El segundo](/es/posts/2026-10-12-yo-era-el-bus-de-mensajes/) contaba cómo dos agentes de dos proveedores la construyeron, y prometía que cómo funciona merecía un post aparte. Este es ese post.

Casi todo es un recorrido: qué hay en la caja, fichero a fichero, y de dónde sale cada comportamiento. El final es lo que dice de ella un mes de planes reales. Cada referencia de abajo apunta a [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills) en el commit `a1bd5b1`, el último que toca la skill mientras escribo esto, con el formato `file:line`.

## Qué hay en la caja

Ocho ficheros, 460 líneas en total:

| Fichero | Líneas | Qué contiene |
|---|---|---|
| `skills/the-mister/SKILL.md` | 118 | Principios, el equipo, el tier, el estado, el flujo de ocho pasos |
| `skills/the-mister/references/plan-and-orders.md` | 198 | El formato de `plan.md`, las plantillas de órdenes de trabajo, los preámbulos canónicos, las listas estándar de comandos git |
| `skills/the-mister/references/agents/claude-code.md` | 47 | Modelos, agentes incluidos y sintaxis de despacho para Claude Code |
| `skills/the-mister/references/agents/codex.md` | 49 | Lo mismo para Codex |
| `skills/the-mister/references/agents/generic.md` | 20 | Qué hacer en un runtime sin subagentes |
| `agents/the-mister.md` | 7 | La definición de agente del orquestador |
| `agents/mechanic.md` | 10 | El worker del tier Easy |
| `agents/git-operator.md` | 11 | El worker del tier Git |

La separación es deliberada. `SKILL.md` describe lo que decide el orquestador. `plan-and-orders.md` describe lo que escribe. Los tres ficheros de runtime describen cómo despacha, y el orquestador lee solo el suyo, una vez, al principio (`SKILL.md:37`). Las tres definiciones de agente son la única parte que un runtime puede garantizar.

El front matter de la skill ya dice algo de su diseño: `allowed-tools` lista `Read Grep Glob Agent Write Edit SendMessage AskUserQuestion EnterPlanMode ExitPlanMode` y ninguna shell (`SKILL.md:4`).

## Cinco principios y un equipo

`SKILL.md` abre con cinco principios (`SKILL.md:14-20`), y todo lo demás de la skill es uno de ellos hecho concreto:

1. El míster es responsable de la descomposición, las instrucciones, la planificación y la aceptación; los workers, de la implementación y los comandos.
2. Cada nodo corre en el worker más barato que pueda hacerlo, y cada comando `git`, `gh` y `glab` corre en el tier Git.
3. Los nodos se ejecutan en paralelo solo cuando la propiedad de sus ficheros es disjunta y sus dependencias están terminadas.
4. Un nodo está terminado cuando su informe aporta evidencia frente a criterios de aceptación explícitos.
5. El míster es responsable de la recuperación y diagnostica con honestidad; su palanca es la orden, el tier o el usuario, nunca el código.

El equipo es una tabla de cinco filas (`SKILL.md:27-35`):

| Tier | Claude Code | Codex | Cuándo asignarlo |
|---|---|---|---|
| Míster | Fable | Astra | Nunca se asigna |
| Hard | Opus | Sol | Elegir entre enfoques; código donde una mala elección pasa desapercibida |
| Medium | Sonnet | Terra | El objetivo está totalmente especificado, pero queda código o tests no triviales |
| Easy | Haiku | Luna | Cada comando o edición se puede listar tal cual |
| Git | Haiku | Luna | Cualquier comando `git`, `gh` o `glab`, incluso los de solo lectura |

La última celda de la fila Git lleva una regla que moldea todos los planes: un nodo que necesita git y cualquier otra cosa son dos nodos (`SKILL.md:35`).

## Elegir el tier son cuatro preguntas

El tier no se decide a ojo. Son cuatro preguntas en un orden fijo, y la primera que se responde con un sí decide (`SKILL.md:37`): ¿ejecuta git? Git. ¿Se puede escribir cada comando o edición literalmente? Easy. ¿Está el objetivo totalmente especificado? Medium. Si no, Hard.

Después, una segunda pasada por cada nodo Hard y Medium: ¿qué necesitaría la orden para que el siguiente tier más barato tuviera éxito? Si la respuesta es contexto o código literal, se añade y se baja de tier. Si es una decisión de diseño, se toma, se escribe en la orden y se baja de tier. Esa es la pregunta de bajar de tier del [primer post](/es/posts/2026-10-09-un-modelo-mas-barato-puede-ser-mejor-instrumento/), y en la skill ocupa una frase.

Dos párrafos más de la misma sección fijan los límites.

**La regla de git** (`SKILL.md:39`): todo comando git, de quien sea, corre bajo una orden del tier Git. El operator ejecuta los comandos de la lista tal cual, con rutas explícitas (`git add a b`, nunca `-A` ni `.`), pega cada salida, no edita nada y se detiene en el primer error. Los mensajes de commit son ficheros que escribe el míster, y se commitean con `git commit -F <path>`.

**El equipo plano** (`SKILL.md:41`): solo el míster despacha, los workers no lanzan nada, y los engineers ejecutan sus propios tests y formateadores. El mismo párrafo dice cuáles de esas restricciones son reales: "nunca lances agentes" y "nunca ejecutes git" son instrucciones de un preámbulo, y solo las listas de herramientas de los agentes incluidos garantizan algo.

## El estado vive bajo .git

El primer nodo Git de cualquier ejecución corre `git rev-parse --absolute-git-dir` y captura una línea base: `git status --porcelain`, `git diff` y `git diff --cached` (`SKILL.md:45`). El estado vive en `<git-dir>/the-mister/<slug>/`, que se resuelve bien tanto en un checkout principal como en un worktree enlazado, y nada de lo que hay ahí acaba en un commit.

Allí viven tres tipos de fichero (`SKILL.md:45-47`):

```text
<git-dir>/the-mister/<slug>/
  plan.md
  orders/<id>.md
  orders/<id>.msg
```

`plan.md` existe solo para planes aprobados; si ya hay uno para ese slug, la ejecución es una reanudación, no una sobrescritura (`SKILL.md:47`). La línea base es contenido protegido del usuario, nunca una exención de propiedad: el míster la registra, lee cualquier fichero sin trackear que sea relevante antes de que un nodo pueda editarlo, e indica a un nodo que es dueño de un fichero con cambios pendientes qué hunks tiene que preservar (`SKILL.md:49`).

El formato de `plan.md` es una cabecera, la petición literal, las suposiciones, la línea base, los nodos y un log de solo añadir (`plan-and-orders.md:5-41`). Cada nodo lleva `id`, `title`, `tier`, `deps`, `owns`, `reads`, `acceptance`, `status` y `evidence`. Después vienen seis reglas (`plan-and-orders.md:43-50`), y son el planificador:

- Los ids son `N<nn>-<kebab-slug>`, por orden de creación.
- `owns` es exclusivo entre los nodos en ejecución; un nodo Git que hace commit es dueño de las rutas que añade al staging.
- Las mutaciones de git se serializan, y un nodo Git que reescribe el worktree solo se despacha cuando no hay nada más en ejecución.
- Un nodo está listo cuando todas sus dependencias están terminadas con evidencia aún válida.
- Cada despacho se registra con su contador, de modo que el presupuesto de tres despachos sobrevive a una reanudación.
- `evidence` registra el modelo tal como se despachó, nunca lo que el worker dice de sí mismo, y los trailers de los commits se derivan de ahí.

## Anatomía de una orden de trabajo

La orden de trabajo es lo único que ve un worker. La plantilla completa (`plan-and-orders.md:88-146`) tiene doce secciones: `Your role`, `Outcome`, `Context`, `Files you own`, `Files you may read`, `Constraints`, `Changes`, `Acceptance`, `Verification`, `Report`, `Previous attempt` y `Revisions`. La regla que aparece justo encima de la plantilla es la que importa: el worker no tiene memoria del plan ni del código y no puede ver el directorio de la skill, así que cada dato se escribe dentro de la propia orden (`plan-and-orders.md:90`).

Entre `Previous attempt` y `Revisions` está la línea de corte:

```markdown
<!-- ===== cut line: nothing below reaches the worker ===== -->
```

Todo lo que queda por encima se pega al worker tal cual; todo lo que queda por debajo es el historial de revisiones del propio míster (`plan-and-orders.md:141`). Un reintento tras una laguna en la orden reescribe la parte de cara al worker, por encima de la línea, y registra la revisión por debajo (`SKILL.md:81`).

Los nodos Git y los nodos Easy que solo ejecutan comandos usan una plantilla compacta (`plan-and-orders.md:148-178`): `Your role`, `Outcome`, `Commands`, `Expected`, `Report` y la misma línea de corte. En esos nodos la salida es la evidencia, así que el informe no pide nada más que la salida de los comandos y las desviaciones.

La sección `Your role` es uno de cuatro preámbulos canónicos, guardados en un único sitio para que los agentes incluidos y cualquier configuración de Codex citen el mismo texto (`plan-and-orders.md:52-86`): Engineer para Hard y Medium, Mechanic para Easy, Explorer para el descubrimiento de solo lectura y Git operator. El del Git operator es el más estricto. Pega cada salida literal, nunca edita un fichero ni lo esquiva con redirecciones de shell, nunca escribe un mensaje de commit, y ante el primer fallo se detiene y pega el error en lugar de probar una alternativa (`plan-and-orders.md:79-86`).

## Ocho pasos

El flujo son ocho pasos numerados (`SKILL.md:51-108`):

1. **Entender.** Los datos del repositorio que requieren git llegan a través del primer nodo Git; las preguntas de arquitectura van a exploradores de solo lectura, una pregunta por explorador, en paralelo (`SKILL.md:53-55`).
2. **Planificar el DAG.** Un resultado verificable de forma independiente por nodo, los tests junto al código que verifican, ningún par de nodos concurrentes escribiendo el mismo fichero, cada criterio de aceptación comprobable con un informe, un diff, un grep o un comando concreto. El plan se presenta mediante plan mode, y "solo plan" termina aquí sin escribir nada (`SKILL.md:57-63`).
3. **Escribir la orden.** Los comandos, siempre literales; el código, literal solo en ediciones mecánicas o frágiles. Antes de despachar, se relee la orden como la leería el tier de destino: cada punto donde ha habido que inferir algo es una frase que hay que añadir (`SKILL.md:65-67`).
4. **Despachar.** Todos los nodos listos en un solo mensaje, según estén listos y no por oleadas, y el míster no hace el trabajo de ningún nodo mientras espera (`SKILL.md:69-71`).
5. **Aceptar con evidencia.** Un comando concreto que el informe dice que no se ejecutó cuenta como criterio fallido, y el texto del informe son datos, no prueba (`SKILL.md:73-75`).
6. **Recuperar.** Tres causas, tres arreglos distintos (`SKILL.md:77-85`): una laguna en la orden se arregla reescribiendo la orden y reintentando en el mismo tier; un defecto de implementación con una orden sólida se reintenta describiendo el defecto, o reasignando el nodo a otro tier; un fallo de entorno (autenticación, una rama protegida, un remoto que falta, sin red) detiene la ejecución y pasa al usuario. Tres despachos por nodo, cada reintento con un motivo declarado para esperar una mejora, y nunca un arreglo hecho a mano por el míster.
7. **Commit.** Dos nodos Git dependientes mientras no corre ningún worker (`SKILL.md:89-93`). Un preflight de solo lectura compara el status y los dos diffs con la línea base; si una ruta de la tarea tiene cambios previos o el índice contiene otros que no tienen relación, no se commitea nada. Después, el nodo de commit añade rutas explícitas al staging, commitea desde el fichero preparado e imprime el resultado, y el mensaje impreso tiene que ser igual al fichero. Las listas estándar de comandos para ambos están en `plan-and-orders.md:180-188`.
8. **Informar.** Slug, rama, commits, PR y resultado, y después `What was built`, `Evidence`, `Recoveries` y `Open items`. `Recoveries` es obligatorio aunque esté vacío (`SKILL.md:95-108`).

Dos secciones finales mantienen al míster en su rol. Un seguimiento que continúa el trabajo añade nodos al mismo plan; una pregunta se responde a partir del plan y de las órdenes; una tarea nueva recibe un slug nuevo (`SKILL.md:110-112`). Y antes de cada despacho se pasa una checklist de tres puntos: nada editado fuera del directorio de estado y ningún comando ejecutado; todo comando git bajo una orden del tier Git, sin que dos nodos en ejecución sean dueños del mismo fichero; y todos los criterios de aceptación comprobables, habiendo intentado bajar de tier (`SKILL.md:114-118`).

## Tres agentes, tres listas de herramientas

Los tres ficheros de `agents/` son donde la skill deja de pedir y empieza a imponer. Cada uno es un [rol, no un comando](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/), y la diferencia entre ellos está sobre todo en una sola línea, `tools:`.

- `the-mister` recibe `Read, Grep, Glob, Agent, Write, Edit, SendMessage, AskUserQuestion, EnterPlanMode, ExitPlanMode` (`agents/the-mister.md:4`). Sin shell, así que estructuralmente no puede ejecutar un comando ni git.
- `mechanic` recibe `Read, Grep, Glob, Edit, Write, Bash` y `model: haiku` (`agents/mechanic.md:4-5`). Tiene shell, pero no la herramienta `Agent`, así que no puede lanzar subagentes.
- `git-operator` recibe `Bash, Read` y `model: haiku` (`agents/git-operator.md:4-5`). Sin herramientas de edición propias y sin `Agent`.

La referencia de Claude Code detalla qué consigue y qué no consigue esto (`claude-code.md:15-25`). Que el míster no tenga shell está garantizado. Que el mechanic y el operator no puedan lanzar subagentes, también. El "nunca edites un fichero" del operator es una instrucción, porque Bash puede escribir. Los engineers corren sobre `general-purpose`, cuyas herramientas incluyen `Agent` y `Bash`, así que su "nunca lances agentes, nunca ejecutes git" también es una instrucción. Y ejecutar el propio orquestador bajo el agente `the-mister` es opt-in: añades `context: fork` y `agent: the-mister` al front matter de la skill, y compruebas que la aprobación de plan mode sigue llegándote desde el fork (`claude-code.md:25`).

## Una skill, tres runtimes

`SKILL.md` no nombra ningún id de modelo ni ninguna sintaxis de despacho. Eso vive en un fichero de referencia por runtime.

**Claude Code** (`claude-code.md:5-47`). Los tiers se corresponden con alias de modelo: `opus` para Hard, `sonnet` para Medium, `haiku` para Easy y Git. Un nodo es una llamada a `Agent` con `subagent_type` y `model`, todos los nodos listos en un mismo mensaje, y `run_in_background: true` para que el harness avise al terminar y nadie haga polling. La orden se pega, no se resume. Una prohibición que conviene conocer: nunca `isolation: "worktree"` ni la herramienta de worktree, porque ambas ejecutan git fuera de un nodo Git, y la propiedad disjunta de ficheros ya hace innecesarios los worktrees por agente (`claude-code.md:47`).

**Codex** (`codex.md:1-49`). Un tier es un par, `model` más `reasoning_effort`. El despacho es `spawn_agent` con `task_name`, `message`, `fork_turns`, `model` y `reasoning_effort`, y no hay `agent_type`, así que el id del nodo va dentro del texto de la orden (`codex.md:17`). `fork_turns` tiene que ser `"none"`: cambiar el modelo exige un fork que no sea de historial completo, y partir de cero mantiene el contexto del míster fuera del worker. `wait_agent` vuelve en cuanto termina el primero, y el míster acepta ese nodo y lanza lo que haya quedado listo (`codex.md:29`).

**Cualquier otro** (`generic.md:1-20`). Para runtimes sin una primitiva de "lanzar un subagente con el modelo X", hay dos opciones: subtareas nativas con selección de modelo, si el runtime las tiene, o una sesión de CLI por nodo, lanzada por el usuario o por un script que la envuelva, con el lanzador capturando el informe. Sin ninguna de las dos, el míster escribe el plan y las órdenes y se detiene; no ejecuta él mismo los nodos (`generic.md:20`).

Dos de los tres ficheros dicen sin rodeos hasta dónde se han probado. Codex: "aún no probado de punta a punta" (`codex.md:3`). Generic: "aún no probado en ningún runtime" (`generic.md:3`).

## El fichero .msg

El mensaje de commit es lo último que escribe el míster. Asunto y cuerpo en Conventional Commits, una línea en blanco, y después un `Co-Authored-By` por cada modelo implementador distinto registrado en la evidencia de los nodos aceptados, con los nombres visibles y la dirección tomados del fichero del runtime (`plan-and-orders.md:190-192`). El operator nunca lo escribe ni lo edita, y el tier Git nunca firma. Firma quien editó los ficheros, no el modelo que escribió las órdenes.

La misma sección incluye un pequeño cuidado a nivel de byte. Para comprobar que el mensaje del commit es igual al fichero, `git log -1 --format=format:%B | diff - <path>` no imprime nada y sale con código 0 cuando coinciden. La forma simple, `--format=%B`, añade un terminador extra y haría fallar la comparación siempre (`plan-and-orders.md:192`).

## En uso

La skill se instala como parte del plugin coding-skills, o enlazando con symlinks las tres definiciones de agente en `~/.claude/agents/` (`claude-code.md:17`). Desde que se incorporó, el 21 de septiembre, ha corrido en cinco repositorios, tanto en Claude Code como en Codex: veinte planes, unos 230 nodos, unos 220 despachos, 222 ficheros de órdenes y 52 mensajes de commit, hasta el 24 de octubre. Cerca de la mitad de los nodos fueron del tier Git.

Los planes no llevan totales, así que esas cifras están contadas a partir de los ficheros y redondeadas. De los ficheros sale también el resto de este post: cada ejecución dejó su plan, sus órdenes y su log bajo `.git`, y volver a leerlos dice cosas de la skill que la skill no dice de sí misma.

## Qué dicen los planes

**El log es la verdad; la tabla de nodos, no.** En la mayoría de las ejecuciones los campos `status` se quedaron en `pending` mientras el log registraba el trabajo como hecho, algunos nodos aparecen solo en el log, y el formato del plan derivó en tres variantes: la lista de la plantilla, viñetas de prosa de una línea y tablas Markdown. La plantilla está bien. Lo que no ocurre es mantenerla al día durante una ejecución larga.

**Una instrucción no es una valla, y los planes lo demuestran.** Unas siete veces, un engineer o un mechanic ejecutó un comando git de solo lectura a pesar de la regla, y todos lo reportaron en `Deviations`. En otros casos, un worker comprobó la versión de Python del host donde el Python del host estaba prohibido, y otro mató un proceso que un worker en paralelo podía estar usando. Los git operators resumieron la salida en lugar de pegarla en tres de los cinco repositorios. Nada de lo que imponía una lista de herramientas se rompió jamás.

**La mayoría de los reintentos fueron lagunas en la orden, y pequeñas.** Un `cd` escrito en prosa en lugar de `git -C` en cada comando. El texto "old" de un reemplazo, copiado de una copia obsoleta de la rama base. Un flag de CLI que la versión instalada no soportaba. Un criterio de aceptación que medía una línea entera cuando el límite se aplicaba al valor. Un grep limitado a ficheros enteros cuando solo importaban las líneas añadidas. Todos los arreglos fueron una orden reescrita, que es lo que dice el paso 6 que debe pasar.

**Diagnostica antes de arreglar.** Fallos que parecían defectos resultaron ser del entorno: un puerto ya ocupado por otro daemon de la máquina, un disco que se llenó durante la exportación de una imagen. En una ejecución, una verificación Easy fallida pasó a un nodo Easy de evidencia de solo lectura, luego a un diagnóstico Hard de solo lectura, y la respuesta fue que el código estaba bien. No se cambió nada que no hiciera falta cambiar.

**"Evidencia, no informes" detectó cosas reales.** Cuando un informe Git parecía incorrecto, el míster hizo que los bytes crudos de los comandos se capturaran en ficheros, con tamaños y hashes, los leyó y aceptó. Un validador independiente encontró un error de lint después de que pasaran las comprobaciones de los propios implementadores. Las comprobaciones de sensibilidad a la reversión, en las que un test tiene que fallar al quitar el arreglo, encontraron tests que no podían fallar. Un diagnóstico del IDE que contradecía unos tests en verde se dejó para la suite completa, que demostró que estaba desactualizado.

**El preflight se ganó su sitio.** Detectó un lockfile cuyas URLs resueltas había reescrito una instalación hacia un mirror, ficheros generados cuyas marcas de tiempo había tocado un generador, ficheros protegidos sin trackear que tenían que quedarse fuera de un commit, y ramas que una sesión paralela ya había creado con los mismos nombres.

**Easy funciona cuando la orden es literal.** Toda edición literal enviada al tier Easy en las ejecuciones del propio blog salió bien al primer intento. Un nodo de documentación enviado a Haiku con abreviaturas en la orden volvió con ejemplos inventados y una lista renumerada; el reintento fue a Sonnet con "escribe solo hechos que puedas verificar leyendo el código indicado", y pasó. La pregunta de bajar de tier vale lo que vale la orden que produce.

**La tabla de modelos envejece.** Las ejecuciones con Codex usaron modelos que `codex.md` no lista, y donde no había ningún modelo Medium disponible el nodo pasó a Hard y la orden lo decía. `SKILL.md` nunca necesitó cambiar. El fichero del runtime, sí.

> Las lecciones de la dos a la ocho tienen cada una un cambio correspondiente en la skill: listas de herramientas más ajustadas donde el runtime lo permite, una checklist previa al despacho más larga, diagnóstico antes de cualquier arreglo, comprobaciones estándar de evidencia y de preflight, una línea más estricta para Easy, y tablas de modelos que admiten que envejecen. Están en [esta pull request](https://github.com/mdelapenya/coding-skills/pull/5).

## Al revés

Todo lo anterior funciona de arriba abajo. El modelo más capaz lee la tarea entera, decide el tier de cada nodo y empuja cada uno hacia abajo hasta donde permita la orden. La pregunta de bajar de tier la hace el modelo que menos necesita la respuesta.

La idea a la que no paro de volver es la inversión. Empezar cada nodo en el modelo más barato, y que sea ese modelo quien pregunte si el nodo debe subir. Un worker que lee una orden y responde "esto necesita una decisión de diseño que yo no tengo" está asignando el tier desde el lado que sabe dónde se acaba la orden.

Los planes tienen un caso a favor y otro en contra. Las ediciones literales salieron bien a la primera, sin que hiciera falta el criterio del orquestador para saber que eran fáciles. Y el nodo de documentación que volvió con ejemplos inventados lo hizo sin una sola advertencia: un modelo barato que no sabe que no da la talla no pide que lo escalen.

Así que la pregunta sigue abierta. ¿Debería el equipo repartirse los tiers de abajo arriba?

---

_Recursos:_
- _[la skill the-mister](https://github.com/mdelapenya/coding-skills/tree/a1bd5b1/skills/the-mister): `SKILL.md` y sus referencias, en el commit `a1bd5b1`_
- _[plan-and-orders.md](https://github.com/mdelapenya/coding-skills/blob/a1bd5b1/skills/the-mister/references/plan-and-orders.md): formato del plan, plantillas de órdenes, preámbulos_
- _[agents/](https://github.com/mdelapenya/coding-skills/tree/a1bd5b1/agents): las tres definiciones de agente incluidas_
- _[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills): el resto del equipo_
