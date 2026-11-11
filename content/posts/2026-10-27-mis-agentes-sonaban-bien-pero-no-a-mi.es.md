---
title: "Mis agentes sonaban bien. Pero no sonaban a mí."
date: 2026-10-27 09:00:00 +0100
description: "Los agentes de código ya publican en GitHub con mi cuenta. El texto era correcto, pero sonaba a cualquier agente: demasiado largo, demasiado educado, con formato de informe. Quería una skill que los haga escribir como yo, en todas partes. Una voz no se describe en un prompt: se mide en tu propio historial, y construir esa skill dejó un toolkit para que cualquiera construya la suya."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "skills", "github", "open-source", "maintainers"]
type: post
weight: 30
translationKey: my-agents-sounded-right-not-like-me
translatedFrom: 4232f62
---

![Mis agentes sonaban bien. Pero no sonaban a mí.](/images/posts/2026-10-27-my-agents-sounded-right-not-like-me/cover.png)

Mis agentes de código escriben en GitHub con mi cuenta. Responden a comentarios de revisión, describen pull requests, piden un caso reproducible a quien reporta un bug. El contenido solía estar bien. La voz no era la mía.

Todos sabemos cómo suenan los agentes: demasiado largos, demasiado educados, con títulos y listas por todas partes, como si un comentario de revisión fuera un informe trimestral. Clankers (hojalata, vamos). Al mío lo llamo Bender (sí, el de Futurama), y no quería que Bender respondiera a mis colaboradores en mi nombre. Quería una skill que haga que cualquier agente, en cualquier harness, escriba como yo.

## Correcto no es lo mismo que mío

En un proyecto como [testcontainers-go](https://github.com/testcontainers/testcontainers-go), quienes contribuyen leen mucho texto mío. Cuando el registro cambia de golpe a "Great question! Here is a comprehensive overview of the key changes:", se nota. Suena a que responde otra persona, y en cierto modo es otro quien responde.

El primer arreglo que todo el mundo prueba es el prompt: "sé conciso", "sé amable pero directo", "no uses viñetas". Adjetivos como *conciso* y *amable* significan algo distinto para cada modelo, y no dicen nada de lo que de verdad hace que una respuesta sea mía: cuánto dura, cómo empieza, cómo termina y qué postura toma.

## Una voz se mide, no se describe

Así que dejé de describir mi voz y la conté. Extraje todas las issues, descripciones de PR, comentarios, resúmenes de revisión y comentarios en línea de revisión que escribí en GitHub entre mayo de 2019 y agosto de 2025: unos 14.500 textos. Esa ventana no es aleatoria. Fueron años de mucho trabajo en open source, y cada uno de esos textos lo escribí yo, a mano: los agentes de código prácticamente no existían todavía, y solo empecé a usarlos el último año. Después, parte de lo que aparece con mi nombre está asistido por agentes, así que esta ventana es el registro limpio de mi voz.

> **Nota:** da un poco de miedo escribir esto y acordarme de [Be Right Back](https://www.imdb.com/title/tt2290780/), el episodio de Black Mirror en el que, tras la muerte de Ash, Martha se apunta a un servicio que lo reconstruye a partir de todo lo que escribió en internet: primero como chat, luego como una voz al teléfono. Yo solo estoy dándoles a mis agentes mis comentarios de GitHub, y sigo aquí para revisar lo que escriben. Aun así.

Después los medí, tomando como ancla la última etapa (de 2023 en adelante, unos 5.800 textos).

Algunos de los números que salieron:

- Un **resumen de revisión** en la PR de otra persona: mediana de **10 palabras**.
- Un **comentario** en el hilo de otra persona: mediana de **26 palabras**, p90 en 79.
- **Títulos Markdown** (headers) en esos comentarios: **0%**. Listas con viñetas: 2%.
- De 720 revisiones en PRs ajenas, el **3%** pide cambios. El 64% aprueba.
- Cierre más usado: `LGTM, thanks!` (187 veces). Emoji más usado: 🙏 (251).
- "I think" aparece en 524 textos. "Perhaps" aparece en 2.

Nada de eso cabe en un adjetivo. Todo cabe en un fichero que un agente puede leer, y en un lint que puede rechazar un borrador tres veces más largo que cualquier cosa que yo escribiría.

La longitud es la señal más evidente, pero no es toda la voz. La otra mitad es la **postura**: qué apruebo, ante qué me planto y qué no dejo nunca que decida otro.

## De qué está hecha la voz

La skill generada separa la voz en capas, y cada capa responde a una pregunta distinta.

- **Estilo medido** (`style.md`, `norms.json`): longitudes por género, rituales, puntuación, emojis, deriva a lo largo de los años. Se regenera a partir del corpus, nunca se edita a mano.
- **Playbooks por acto de habla**: approve, decline, ask-info, request-change, close, own-mistake, etcétera. Cada uno define la postura y los movimientos, con URLs a textos reales.
- **Principios**: las posiciones técnicas que de verdad defiendo, con enlaces a donde lo dije.
- **Antipatrones**: lo que hacen los agentes y yo no. "Great question", "I hope this helps", repetir lo que la otra persona acaba de decir, varios cierres seguidos.
- **Límites**: decisiones que el agente tiene que devolverme. La superficie pública de la API, los breaking changes, el momento de las releases, cerrar la issue de alguien como won't-fix. Cuando un borrador requiere una de ellas, el agente escribe `DECISION NEEDED: …` y se detiene.
- **Transparencia**: todo texto escrito por un agente termina con `🤖 Written assisted by my <Harness>`. El lint falla si falta.

Los límites importan tanto como la longitud. Un agente que suena exactamente como yo y rechaza por su cuenta el módulo que propone un colaborador es peor que uno que suena a bot.

## Cómo lo construye agents-voice

[agents-voice](https://github.com/mdelapenya/agents-voice) es el toolkit que salió de construir esa skill. Toma un login de GitHub y una ventana de tiempo, y produce un directorio de skill que cualquier harness puede cargar (Claude Code, Codex, Cursor). El pipeline tiene ocho pasos:

1. **Recolectar** todo lo que el sujeto escribió en la ventana, en todos los repositorios, con `gh` (búsqueda GraphQL dividida por meses, REST para los comentarios en línea de revisión).
2. **Normalizar** en un único corpus JSONL, con rol (hilo propio o ajeno), género y contexto del hilo.
3. **Etiquetar** el acto de habla, la audiencia y el tono de cada texto con un modelo barato, por lotes.
4. **Medir** longitudes, rituales, puntuación, veredictos de revisión y deriva por género en `style.md` y `norms.json`.
5. **Indexar** el corpus en SQLite FTS5, para que la skill pueda sacar de 3 a 5 ejemplos reales mientras redacta.
6. **Destilar**: un agente potente lee el corpus y escribe los playbooks, principios, límites y antipatrones. Cada afirmación lleva la URL de un texto real.
7. **Ensamblar** la skill: `SKILL.md`, las referencias y `scripts/voice` para la búsqueda y el lint.
8. **Evaluar** sobre un hold-out de hilos reales: borradores con la skill frente a una línea base, juzgados contra la respuesta que escribí yo de verdad, que permanece oculta.

Dos detalles lo mantienen honesto. Primero, la recuperación está para el registro, no para copiar: el lint rechaza cualquier 5-grama que aparezca en menos de tres textos del corpus, porque eso es una copia de un único ejemplo, mientras que una frase que aparece en muchos textos es un ritual y se permite. Segundo, la evaluación excluye todos los hilos del hold-out de la base de datos de recuperación, así que la skill no puede buscar la respuesta contra la que la están juzgando.

¿Por qué una skill, y no un fine-tune ni un servicio de RAG? Porque la voz debería ser un documento del que el mantenedor sea dueño. Puedo abrir `boundaries.md`, leerlo y corregir una línea con la que no estoy de acuerdo. Con los pesos de un modelo no puedo hacerlo.

## Construye tu propia voz

Necesitas Node 20+, Python 3.10+ con el módulo `sqlite3` de la biblioteca estándar y un `gh` autenticado. Docker es opcional: cuando está en marcha, las herramientas Python de la skill se ejecutan en `python:3.12-slim` sin red.

```bash
git clone https://github.com/mdelapenya/agents-voice
cd agents-voice

node setup.mjs <github-login> --from 2019-05 --to 2025-08 --era 2023
npm run harvest          # resumable; a 15k-text history takes a few hours of API time
npm run normalize
npm run label:prepare    # then follow label/LABEL.md with a cheap model
npm run label:merge
npm run style
npm run index
# distill: point a strong agent at distill/DISTILL.md
npm run assemble
```

El resultado queda en `out/<login>/skill/`. Para Claude Code, enlázalo en el directorio de skills y deja la base de datos a su lado:

```bash
ln -s "$PWD/out/<login>/skill" ~/.claude/skills/<login>-voice
cp out/<login>/voice.sqlite ~/.claude/skills/
```

Todo lo que hay bajo `out/` está en el gitignore. Es tu historial, y sigue siendo tuyo.

## Qué pasa cuando se carga la skill

A partir de ahí, cuando un agente va a publicar en tu nombre, `SKILL.md` le da un flujo de trabajo: clasificar la situación (rol, género, acto, audiencia), leer el playbook de ese acto, sacar unos cuantos ejemplos, redactar con tu longitud, pasar el lint al borrador y añadir el aviso de transparencia. O parar y preguntarte, si la decisión está en `boundaries.md`.

Dos de esos pasos ejecutan código: `search` y `lint`. El agente nunca llama directamente a los ficheros Python. Llama a un único wrapper, `scripts/voice`:

```bash
scripts/voice search "flaky test" --act ask-info --role other --since 2023
scripts/voice lint draft.md --genre comment
```

El wrapper decide dónde se ejecuta el Python:

- **Primero Docker.** Si `docker` está instalado y `docker info` responde, ejecuta el script en `python:3.12-slim` con `--network none`, con tu uid y gid. El directorio de la skill y `voice.sqlite` se montan en solo lectura en las mismas rutas que tienen en el host, así que cualquier ruta que ve el agente es válida dentro del contenedor. Un borrador fuera del directorio de trabajo recibe su propio montaje de solo lectura.
- **Python del host como alternativa.** Sin Docker, o con el daemon caído: ejecuta `python3 -I` en el host. Si no hay ninguno de los dos, falla con un mensaje claro.

Este es el núcleo:

```bash
if [ "${VOICE_RUNTIME:-docker}" = "docker" ] && command -v docker >/dev/null 2>&1 && docker info >/dev/null 2>&1; then
  image="${VOICE_PY_IMAGE:-python:3.12-slim}"
  run=(docker run --rm --network none --user "$(id -u):$(id -g)" -w "$PWD"
       -v "$SKILL:$SKILL:ro" -v "$PWD:$PWD")
  [ -n "$db" ] && run+=(-v "$db:$db:ro" -e "VOICE_DB=$db")
  exec "${run[@]}" "$image" python3 -I "$script" "$@"
fi

exec python3 -I "$script" "$@"
```

Los dos scripts usan solo la biblioteca estándar (`sqlite3`, con FTS5 incluido), así que los dos caminos se comportan igual. Tres variables de entorno sobrescriben los valores por defecto: `VOICE_RUNTIME=host` se salta Docker a propósito, `VOICE_PY_IMAGE` fija otra imagen y `VOICE_DB` apunta a una base de datos concreta.

## Cierre

No necesitaba que mis agentes escribieran mejor. Necesitaba que escribieran menos, más parecido a como escribo yo, y que supieran cuándo dejarme la decisión a mí.

`LGTM, thanks!`

## Extra: la canción

Clonar mi propia voz para que mis agentes la usen merecía algo de humor. Así que hice dos canciones sobre agents-voice con [Suno](https://suno.com), el generador de música con IA: una en inglés y otra en español.

La versión en inglés:

{{< suno "bdcbc7db-f986-486b-82a6-af11f763b6d6" "agents-voice, the song (English)" >}}

Y la española:

{{< suno "2241dbb9-65fb-4cf2-b1d8-2591145ccaed" "agents-voice, la canción (español)" >}}

---

*[agents-voice en GitHub](https://github.com/mdelapenya/agents-voice)*

*[DESIGN.md: las decisiones que hay detrás](https://github.com/mdelapenya/agents-voice/blob/main/DESIGN.md)*
