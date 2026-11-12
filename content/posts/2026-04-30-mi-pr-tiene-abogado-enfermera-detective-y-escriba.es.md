---
title: "Mi PR tiene un abogado, una enfermera, un detective y un escriba"
date: 2026-04-30 09:00:00 +0200
description: "Cuatro skills de Claude Code que uso en cada pull request: una escribe la descripción, otra gestiona los comentarios de revisión, otra investiga los fallos de CI y otra vigila el build. Todas diseñadas como roles, no como comandos."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "developer-experience", "pull-requests", "skills"]
type: post
weight: 30
translationKey: my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe
translatedFrom: dea854c
---

![Mi PR tiene un abogado, una enfermera, un detective y un escriba](/images/posts/2026-04-30-my-pr-has-a-lawyer-a-nurse-a-detective-and-a-scribe/cover.png)

Cada PR que abro pasa por manos de cuatro personas. El escriba redacta la descripción. El abogado se ocupa de la revisión. El detective investiga los fallos de CI. La enfermera vigila el build hasta que se mergea. Ninguno es una persona. Son skills de Claude Code, cada una diseñada como un rol con criterio, no como un comando que se ejecuta. Así funcionan, y por eso la distinción entre rol y comando importa más de lo que esperaba.

## El repo: coding-skills

Las cuatro skills viven en [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills), una colección open source que mantengo yo. Cada una es un fichero SKILL.md que le da a Claude Code un personaje, un flujo de trabajo y unas restricciones. Todas soportan varias plataformas (GitHub y GitLab) mediante ficheros de referencia específicos de cada una, así que la misma skill funciona esté donde esté tu código.

Los cuatro roles:

- **`pr-scribe`**: escribe descripciones de PR a partir de diffs
- **`pr-lawyer`**: clasifica los comentarios de revisión en aceptar, rebatir o aclarar
- **`ci-detective`**: investiga fallos de CI cruzando datos entre ramas
- **`pr-nurse`**: vigila el CI y el estado de mergeable en un loop

Todas las skills llevan nombre de persona, no de verbo. Ya escribí sobre por qué [las skills deben ser roles, no comandos](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/): cuando la skill es una persona, el agente toma decisiones. El escriba decide qué destacar del diff. La enfermera decide si hace merge de main, arregla el código o escala. Un verbo simplemente se ejecuta. Un rol juzga.

## El escriba: la descripción que nunca quieres escribir

Escribir la descripción de la PR es el paso que más me salto. El código ya está ahí. El diff cuenta la historia. Quiero pasar a lo siguiente.

El escriba lo hace por mí. Lee el diff, detecta la plataforma con `git remote -v`, busca la plantilla de PR si el repo tiene una y la rellena. Rastrea los nombres de rama y los mensajes de commit en busca de referencias a issues (patrones como `fix/123`, `closes #456`, `resolves #789`) y añade una sección "Related Issues" cuando las encuentra. Después actualiza directamente el cuerpo de la PR.

El último paso no pide confirmación. Es deliberado. La gracia está en que no haya fricción. Si no me gusta lo que ha escrito, lo edito. Pero ya no me quedo mirando una descripción en blanco esperando a que aparezca la fuerza de voluntad.

Así es una PR antes del escriba: un cuerpo vacío y, como mucho, un título que coincide con el nombre de la rama. Y así queda después: una descripción estructurada con qué ha cambiado, por qué importa, los cambios agrupados por componente, un plan de pruebas y las issues enlazadas. El escriba no es un gran pensador. Documenta con precisión y se aparta.

## El abogado: los comentarios de revisión que no quieres aprobar a ciegas

Llegan los comentarios de revisión y el reflejo es arreglar todo lo que dice el revisor. Ese reflejo produce peor código. No todo el feedback vale lo mismo. Parte es correcto: hay un bug real, un problema de claridad, un enfoque mejor. Parte está equivocado: nace de un malentendido, contradice los objetivos declarados de la PR o es pura preferencia subjetiva. Y parte es una pregunta que ni siquiera requiere un cambio de código.

El abogado hace triaje de cada comentario. Para cada uno, lee el fichero fuente y el contexto del diff, y lo clasifica:

- **Aceptar**: hay un problema legítimo. Arreglar el código.
- **Rebatir**: el comentario es erróneo, subjetivo o fruto de un malentendido. Responder con un argumento razonado.
- **Aclarar**: es una pregunta, no una petición. Contestarla.

Tras clasificar, agrupa los arreglos aceptados en grupos lógicos (mismo fichero, mismo tipo de problema, misma preocupación del revisor) y me presenta el triaje completo para que lo apruebe:

> **Por arreglar (2 grupos):**
> 1. `fix`: problemas de null-safety (auth.go, session.go)
> 2. `style`: convenciones de nombres (varios ficheros)
>
> **Por rebatir:**
> - "Usa un patrón factory aquí": es intencionado, defenderé el enfoque actual
>
> **Por aclarar:**
> - "¿Por qué el timeout está en 30s?": explicaré el motivo

Yo apruebo, ajusto o descarto. Después arregla cada grupo en un commit aparte, con un mensaje de conventional commits, responde a cada comentario (con el SHA del commit en los arreglos y argumentos razonados en las objeciones) y pregunta antes de hacer push. Nunca aprueba a ciegas. Tampoco lo rechaza todo. Decide con criterio. "Discrepo porque este enfoque es intencionado. Lo hablamos encantado si lo ves de otra forma" es una respuesta legítima. Igual que "Arreglado en abc123."

## El detective de CI: ¿fui yo o ya estaba roto?

El CI falla en mi PR. Miro el test que falla y no lo reconozco. Yo no toqué ese código. La pregunta que se hace todo desarrollador en ese momento: ¿es culpa mía o ya estaba roto?

El detective responde con evidencias, no con corazonadas. Su método:

1. Obtiene los checks que fallan en la PR e identifica los nombres concretos de los tests
2. Extrae el detalle del fallo de los logs: mensajes de error, stack traces, códigos de salida
3. Cruza esos mismos tests con ejecuciones recientes en otras ramas y en main
4. Construye una tabla comparativa: mismo test, varias ramas, pasa o falla en cada una

Un ejemplo real, anonimizado. Tres tests específicos de plataforma fallaban en mi PR. El detective miró main: una ejecución reciente pasó los tres, y en otra fallaba un subtest distinto. Miró otras dos ramas de feature: los mismos tests también fallaban allí, con patrones de error diferentes. La tabla del veredicto quedó así:

| Test | Mi PR | main (ejecución A) | main (ejecución B) | Rama X | Rama Y |
|---|---|---|---|---|---|
| Test A | FAIL | PASS | FAIL (otro subtest) | FAIL | FAIL |
| Test B | FAIL | PASS | N/A | N/A | N/A |
| Test C | FAIL | PASS (pero con fallo parcial) | N/A | N/A | N/A |

Todos los fallos ya existían o eran flaky. Ninguno tenía que ver con mis cambios. En cada rama fallaban tests distintos. Y el mismo test pasaba o fallaba según la ejecución en la propia main.

Esa tabla me ahorró una tarde entera persiguiendo fallos fantasma. El detective no adivina. Reúne evidencias, las cruza y presenta un veredicto. La decisión final es mía, pero los datos están ahí.

## La enfermera: vigilar el build para que no tengas que hacerlo tú

Subes una PR. Corre el CI. Cambias a otra tarea. Veinte minutos después, el CI falla. Vuelves, diagnosticas, arreglas, haces push. El CI corre otra vez. Vuelves a cambiar de contexto. Este ciclo se come horas de reloj, no porque los arreglos sean difíciles, sino porque las idas y vueltas son lentas y el coste de atención de cada cambio de contexto es real.

La enfermera funciona con `/loop`. Comprueba el estado del CI y si la PR se puede mergear cada pocos minutos. Cuando algo se rompe, actúa:

- El CI falla porque main ha divergido: la enfermera hace merge de main y hace push.
- El CI falla por un problema de código: la enfermera lo arregla, hace commit y push.
- Aparecen conflictos de merge: la enfermera los resuelve (respetando la intención y preguntando cuando la resolución es ambigua) y hace push.
- El CI pasa y la PR se puede mergear: la enfermera informa.

La enfermera hace push después de cada arreglo. Ahí está la gracia: se encarga de toda la ida y vuelta para que yo no tenga que hacerlo. El límite es que nunca hace force push. Si rechazan un push, se detiene y pregunta. Si hay cambios locales sin commitear, se detiene y pregunta. Actúa con autonomía dentro de límites claros.

La enfermera es lo que hace viable "abre la PR y olvídate". Arranco el `/loop`, paso al siguiente worktree de [biomelab](/es/posts/2026-04-24-mi-flujo-de-trabajo-diario-con-biomelab/) y vuelvo a encontrarme o con un build en verde o con un diagnóstico claro de qué se ha atascado y por qué.

## El ciclo de vida completo de una PR

Uso [biomelab](https://biomelab.dev) como panel diario para gestionar worktrees de git, agentes de código y pull requests en todos mis repositorios (escribí sobre [mi flujo con él](/es/posts/2026-04-24-mi-flujo-de-trabajo-diario-con-biomelab/)). Así se encadenan las cuatro skills en la práctica con mis flujos de biomelab:

`c` (crear worktree) → trabajar → `Shift+P` (abrir PR) → `/pr-scribe` (escribir la descripción) → llega la revisión → `/pr-lawyer` (triaje: arreglar, rebatir, aclarar) → falla el CI → `/ci-detective` (¿mío o ya estaba roto?) → `/pr-nurse` con `/loop` (vigilar, arreglar y hacer push hasta que esté en verde o se atasque)

Cuatro roles. Cuatro decisiones con criterio. Un flujo guiado por teclado, desde abrir la PR hasta el merge.

No todas las PR necesitan los cuatro. Una PR limpia, sin comentarios de revisión y con el CI en verde, solo usa al escriba y a la enfermera. Una PR con feedback polémico recurre mucho al abogado. Una PR con fallos de CI misteriosos necesita al detective. Las skills se combinan bien porque cada una es autónoma: hace su trabajo y termina. Ninguna depende de la salida de otra. Comparten un número de PR y una rama de git. Ese es el único acoplamiento.

## Por qué roles y no comandos

Todas las skills del repo llevan nombre de persona. El escriba decide qué importa del diff. El abogado decide qué pelear. El detective decide qué investigar. La enfermera decide si hace merge de main, arregla el código o pide ayuda.

Los verbos ejecutan. Los roles juzgan. Esa distinción es toda la diferencia entre una automatización útil y un colaborador útil.

---

_Recursos:_
- _[mdelapenya/coding-skills en GitHub](https://github.com/mdelapenya/coding-skills)_
- _[Documentación de las skills de Claude Code](https://docs.anthropic.com/en/docs/claude-code/skills)_
