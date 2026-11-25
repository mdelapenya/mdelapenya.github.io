---
title: "Una skill tiene que superar al agente sin ella"
date: 2026-11-26 00:00:00 +0100
description: "Leer lo que un agente produjo con una skill no dice si la skill ayudó. Tessl lo mide: la misma tarea con y sin la skill, puntuada por versión. Esto es lo que esa medición cambió en dos de mis siete skills."
categories: [Technology, Software Development]
tags: ["coding-agents", "claude-code", "skills", "tessl", "evals", "open-source"]
type: post
weight: 30
translationKey: a-skill-has-to-beat-the-agent-without-it
translatedFrom: 03c9498
---

![Una skill tiene que superar al agente sin ella](/images/posts/2026-11-26-a-skill-has-to-beat-the-agent-without-it/cover.png)

¿Cómo sabes que una skill ayuda? La escribes, la cargas, el agente hace el trabajo y el resultado tiene buena pinta. Pero puede que el agente hubiera hecho lo mismo sin la skill. Si es así, la skill son solo tokens: cuesta contexto en cada carga y no te da nada a cambio.

Leer el resultado no lo resuelve. Una buena review, una descripción de PR limpia o un plan sensato no dicen nada de lo que el agente habría producido por su cuenta. La única forma de saberlo es ejecutar la misma tarea dos veces, una con la skill y otra sin ella, y puntuar ambas con la misma rúbrica.

Mientras publicaba mis siete skills de coding, me puse una regla: si el agente lo hace igual sin la skill, ésta sobra. Más tarde, el primer punto de mi lista de mejoras fue "no hacemos nada sin medir". Este post trata de la herramienta que volvió práctica esa regla, y de dos skills que cambió.

## Por qué medir

No vendo nada con estas skills: lo mío con ellas es advocacy. Quiero que la gente las use, y hacer advocacy de una skill exige evidencia de que ayuda. "A mí me funciona" no es evidencia. Un número por skill, medido igual para todas y publicado junto a la skill, sí lo es.

Ese número también tiene que ser honesto en las dos direcciones. Tiene que mostrar dónde una skill aporta mucho, dónde no aporta nada y cuánto cuesta cada una. Una skill que suma diez puntos a cinco veces el precio es una decisión, no una victoria.

## Qué mide Tessl

[Tessl](https://tessl.io) es un registro de skills para agentes, empaquetadas como plugins con versiones. El formato de skill es el estándar Agent Skills: un `SKILL.md` con front matter, más `references/`, `scripts/` y `assets/` opcionales. Mis siete skills salieron como un solo plugin, `mdelapenya/coding-skills`. Cuatro de ellas nacieron como [los roles de PR de los que escribí en abril](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba).

Lo que lo convierte en algo más que un sitio donde descargar skills es que cada versión se mide:

- **Review (calidad).** Comprobaciones de validación deterministas, más una puntuación juzgada por un LLM de la descripción (completitud, triggers, especificidad, carácter distintivo) y del contenido (concisión, accionabilidad, claridad del flujo, progressive disclosure).
- **Evals (impacto).** Un escenario de eval es un pequeño trabajo para el agente. Tiene un prompt que describe el trabajo (`task.md`), los ficheros sobre los que trabajar y una rúbrica de criterios ponderados (`criteria.json`), todo bajo `evals/<scenario>/` en el repositorio. `tessl eval run` le da cada escenario al agente dos veces, con y sin el plugin, y un juez puntúa ambas respuestas con la rúbrica. La diferencia entre las dos puntuaciones, la mejora (el lift), es el impacto de la skill.
- **Seguridad.** Un escaneo que aprueba o suspende cada skill y lista los hallazgos.

La página del registro muestra los tres por versión, y combina calidad e impacto en una puntuación global. Esa combinación importa. Publiqué primero la 1.2.3 sin ejecutar sus evals (`--skip-evals`), y su puntuación global cayó a 77, frente a 97 de la 1.2.2. Su calidad había subido. Una versión sin evals no tiene impacto medido, y el registro no finge lo contrario. Ejecutar las evals contra la 1.2.3 ya publicada lo rellenó.

Publicar es gratis, y las reviews no cuestan créditos para los plugins públicos. Eso hizo posible una cosa más: una puerta en la CI del repositorio de las skills. Cada PR que toca `skills/` ejecuta `tessl review run --threshold 90` sobre las skills cambiadas, y falla si alguna baja de 90.

## Medir bien exige cuidado

La primera ejecución de evals parecía buena de media: el plugin subía la puntuación unos 27 puntos. La tabla por escenario contaba otra historia. En tres escenarios, el agente sin el plugin ya sacaba un 100 %: dos de pr-reviewer y uno de ci-detective.

El problema estaba en los prompts. El `task.md` de cada escenario es el texto que el agente recibe como su trabajo, y esos prompts dictaban lo que se suponía que debía aportar la skill, como los encabezados exactos del informe de review o la forma de la tabla comparativa. A un agente al que le dices todo eso no le hace falta la skill.

Reescribí los prompts como los pediría un usuario ("revisa la PR #847 antes de hacer merge", "¿mi PR rompió la CI?") y moví el comportamiento distintivo de la skill a la rúbrica. El agente sin la skill dejó de sacar la máxima nota, y apareció la mejora:

| Escenario | Skill | Agente solo, prompt original | Agente solo, prompt reescrito | Agente con la skill, prompt reescrito |
|---|---|---|---|---|
| 2 · review anclada a una revisión | pr-reviewer | 100 % | 35 % | 94 % |
| 3 · review adversaria | pr-reviewer | 100 % | 75 % | 100 % |
| 5 · ¿mi PR rompió la CI? | ci-detective | 100 % | 65 % | 100 % |

Los jueces también son ruidosos. El mismo escenario sin la skill sacó un 49 en una ejecución y un 35 en otra, con entradas idénticas. Después de eso, las diferencias por debajo de unos 10 puntos contaron como ruido, y cada medición que movió una decisión se ejecutó tres veces.

Ninguna de las dos lecciones trata de que Tessl se equivoque. Tratan de lo que necesita cualquier medición: prompts que dejen espacio para que la skill importe, y suficientes ejecuciones para distinguir un cambio del ruido. Tessl genera y ejecuta los escenarios; decidir si miden lo correcto sigue siendo cosa del autor.

## the-mister: una puntuación baja encontró un deadlock

El escenario de redacción de planes de [the-mister](/es/posts/2026-10-25-el-mister-fichero-a-fichero) sacó un 65 % con la skill. Algunos de los criterios donde perdía puntos contradecían la skill, así que lo tentador era arreglar la rúbrica. Pero cambiar una rúbrica después de ver los resultados se parece mucho a ajustar el examen a la respuesta. En su lugar, propuse poner en cuestión las tres partes: "la skill puede estar mal, los criterios están mal, la respuesta está mal".

Un revisor independiente repasó cada criterio contra la skill, el prompt y el plan. Las tres partes tenían problemas. Cuatro de los doce criterios estaban mal. La respuesta tenía defectos que ningún criterio detectó. Y la skill tenía un deadlock real:

- "A node is ready when every dependency is `done`."
- "Append a `done` line only after the required inspection passes."

En the-mister, un inspector comprueba el resultado de un worker antes de que el nodo cuente como terminado. Así que el inspector depende de su nodo de build, y el nodo de build espera al inspector. Con esas dos reglas, el inspector nunca podía ejecutarse.

Los arreglos entraron en the-mister 2.6.0 y en la rúbrica, y la repetición pasó del 65 % al 86 % con la skill. Los puntos que aún perdía eran fallos reales de la respuesta.

Hizo falta una puntuación baja en una eval para sacar a la luz el deadlock, y revisar solo la rúbrica lo habría ocultado.

## pr-reviewer: la mejora tenía un precio

pr-reviewer tenía una de las mejoras más grandes y el coste más alto con diferencia: de cuatro a nueve veces el coste del agente solo. El análisis por escenario mostró de dónde venía la mejora. Sin la skill, el agente encontraba los bugs por sí solo, incluidas una inyección SQL y una path traversal. Casi todo lo que la skill añadía era la forma del informe. Nada en las puntuaciones mostraba que tres revisores más un evaluador encontraran más que un solo revisor.

Así que añadí un escenario para probar justo eso: un bug sutil más una trampa de falso positivo, ejecutado en cada modo, tres ejecuciones cada uno.

| Modo | Puntuación | Coste por ejecución |
|---|---|---|
| Tres revisores (staged) | 91–94 | unos 7,50 $ |
| Un revisor (`--single`) | 90–92 | 1,80 $ |
| Sin skill | 90–91 | 1,40 $ |

Con esa tabla delante, hice de `--single` el modo por defecto. Los tres revisores y el evaluador ahora se ejecutan solo cuando la skill clasifica el diff como de consecuencias, o cuando los pides con `--staged`. Un escenario con un diff rutinario le puso precio al cambio: el modo por defecto costó menos de la mitad (<span>2,34 $</span> frente a <span>4,97 $</span>, tres ejecuciones cada uno) por unos 4 puntos menos (91 frente a 95).

El formato del informe, de donde vino la mayor parte de la mejora, existe también en el modo single. El fan-out se queda donde el riesgo lo justifica.

## Dónde acabó

La versión 1.2.3 es la que está ahora en el registro:

| Versión | Global | Calidad | Impacto | Seguridad |
|---|---|---|---|---|
| 1.2.2 | 97 | 95 % | 98 % (10 escenarios) | Baja |
| 1.2.3 | 96 | 97 % | 96 % (16 escenarios, 1,52x el agente solo) | Baja |

El agente evaluado es `claude` ejecutando el modelo `deepseek-v4.1-flash`, no un modelo para el que las skills estén afinadas. Toma estos números como evidencia de lo que aporta cada skill, no como un benchmark de ningún modelo. La ejecución de la 1.2.3 puntuó cada escenario una vez con la skill y otra sin ella, y las ejecuciones repetidas movieron puntuaciones sueltas hasta unos 10 puntos.

Dos resultados merecen leerse con cuidado. En los escenarios de bug sutil, pr-reviewer se queda dentro del ruido del agente solo, que es el hallazgo detrás del modo single. Y el escenario de aceptación y recuperación de the-mister es el más débil, con un 73 con la skill. El registro también lo muestra, junto a los buenos números.

## La sección de Skills

Medir me dejó algo más que una puntuación por versión: qué aporta cada skill, dónde no aporta nada y cuánto cuesta. Esa evidencia tiene ahora un hogar en este sitio, junto a los posts que explican por qué existe cada skill. La [sección de Skills](/es/skills/) tiene una página por skill con su evidencia, por ejemplo [pr-reviewer](/es/skills/pr-reviewer/) y [the-mister](/es/skills/the-mister/).

Para instalar las siete, usa cualquiera de los dos canales:

```bash
# skills.sh (Claude Code, Codex, Cursor, Copilot, Gemini CLI and more)
npx skills add mdelapenya/coding-skills

# Tessl registry
tessl install mdelapenya/coding-skills
```

Ninguno instala las definiciones de subagente de the-mister; el [README](https://github.com/mdelapenya/coding-skills) explica cómo enlazarlas.

Cinco peticiones:

1. **Úsalas** en tus propias PRs y planes, y cuéntame dónde estorban.
2. **Abre una [issue](https://github.com/mdelapenya/coding-skills/issues)** cuando una skill se comporte mal, con la tarea que le diste.
3. **Aporta un escenario de eval.** Los escenarios viven en [`evals/`](https://github.com/mdelapenya/coding-skills/tree/main/evals), cada uno con un `task.md`, sus entradas y un `criteria.json` ponderado. Escribe el prompt como pedirías el trabajo, y pon en la rúbrica lo que la skill debería añadir.
4. **Dale una estrella al [repositorio](https://github.com/mdelapenya/coding-skills)** si las skills te resultan útiles.
5. **[Suscríbete](/es/subscribe/)** al blog si quieres el próximo post.

---

_Recursos:_
- _[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills): las siete skills y sus escenarios de eval_
- _[mdelapenya/coding-skills en el registro de Tessl](https://tessl.io/registry/mdelapenya/coding-skills): calidad, impacto y seguridad por versión_
- _[mdelapenya/coding-skills en skills.sh](https://skills.sh/mdelapenya/coding-skills)_
- _[Skills en este sitio](/es/skills/): una página por skill, con su evidencia_
