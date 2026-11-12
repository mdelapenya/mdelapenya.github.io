---
title: "Mi flujo de trabajo diario con biomelab"
date: 2026-04-24 09:00:00 +0200
description: "Cómo uso biomelab como centro de mando diario: tablero kanban, worktrees desde el teclado, sandboxes y nunca tocar main. El flujo con el que me siento absurdamente productivo."
categories: [Technology, AI, Software Development]
tags: ["biomelab", "git-worktrees", "docker-sandboxes", "coding-agents", "developer-experience"]
type: post
weight: 30
translationKey: my-daily-workflow-with-biomelab
translatedFrom: a65745c
---

![Mi flujo de trabajo diario con biomelab](/images/posts/2026-04-24-my-daily-workflow-with-biomelab/cover.png)

Tengo biomelab abierto todo el día. Es lo primero que lanzo por la mañana y lo último que cierro. Cada repo en el que trabajo, cada worktree, cada sesión de agente, cada PR: todo a la vista en un único dashboard de terminal. Nunca toco main. Nunca trabajo sin un worktree. Y nunca arranco Claude sin saber exactamente en qué rama está. Así es mi día a día.

## El panel izquierdo: todos mis repos

biomelab muestra los repositorios registrados en el panel izquierdo, como un árbol. Cada repo puede tener varios modos: modo host (git normal) o modo sandbox (uno por agente, con el icono 🐳). Me muevo con `↑`/`k` y `↓`/`j`, elijo el repo en el que voy a trabajar y pulso `Tab` para pasar al panel derecho. Ya está. Sin andar haciendo cd de un directorio a otro, sin acordarme de qué carpeta es cuál.

Añadir un repo nuevo es `a`. Añadir un modo sandbox a un repo existente es `n`. Quitar un modo es `x`. La configuración se guarda entre sesiones en `~/.config/biomelab/repos.json`, así que la lista siempre está ahí cuando lo lanzo.

Si arranco biomelab dentro de un repositorio git, lo añade solo. Casi siempre ni uso `a`. Simplemente abro biomelab desde el repo en el que voy a trabajar.

## Kanban, siempre

Uso siempre la vista de tablero kanban. Con `g` se alterna entre la cuadrícula de tarjetas y el tablero. Pulso `g` una vez al arrancar y no vuelvo atrás.

En el modo kanban, los worktrees se organizan en columnas según su estado: en progreso, listo para revisión, PR enviada. Cada tarjeta muestra el nombre de la rama, si está sucia o limpia, el estado de sincronización (ahead, behind, diverged), los agentes activos, los IDEs abiertos y la información de la PR con los iconos de los checks de CI. Cuando miro biomelab, veo la forma de mi día. No ficheros, no ramas: tarjetas.

La navegación sigue la disposición de las columnas. `←`/`h` y `→`/`l` te mueven entre columnas. `↑`/`k` y `↓`/`j` te mueven dentro de una columna. Desde la tarjeta principal de arriba, `↓` entra en la primera columna que tenga algo. Es como moverse por una hoja de cálculo, solo que cada celda es una tarea.

## Nunca main

Nunca trabajo sobre main. Ni para features, ni para investigar algo, ni para hacer triaje de un repo. `c` sobre la tarjeta principal crea un worktree nuevo. Cada tarea empieza en su propia rama, aislada de todo lo demás.

Si solo necesito comprobar algo, creo un worktree igualmente. El coste es cero (biomelab se encarga de crearlo y de limpiarlo) y la seguridad es total. Ningún commit accidental a main. Ningún estado sucio de una investigación contaminando la rama de una feature. Un worktree, una tarea, siempre.

Como cada tarjeta indica si está al día con la rama upstream, sé de un vistazo si tengo que refrescar main. Pulso `p` para hacer pull, y como nunca toco main, sé que no habrá conflictos. Nunca.

Este hábito empezó con [gwaim](/es/posts/2026-03-21-gwaim-la-herramienta-que-necesitaba-el-nivel-5/), la herramienta TUI que precedió a biomelab. El [flujo de nivel 5](/es/posts/2026-03-23-nivel-5-en-la-practica-cuatro-agentes-cuatro-worktrees/) (cuatro agentes, cuatro worktrees, un desarrollador) fue lo que convirtió el worktree por tarea en algo innegociable. biomelab simplemente lo dejó sin fricción.

Otras operaciones con worktrees que uso a diario: `d` borra un worktree (con un diálogo de confirmación, para evitar accidentes). `f` trae una PR a un worktree nuevo, que es como empiezo las revisiones de código: escribo el número de la PR, biomelab crea el worktree y estoy leyendo el código en su contexto, en vez de en un diff web. `p` hace pull del remoto en cualquier tarjeta. `r` fuerza un refresco si quiero el estado al momento.

## Enter para programar

Pulsa `Enter` sobre una tarjeta de worktree. Se abre una ventana de terminal nueva en el directorio del worktree. Desde ahí escribo `claude` para arrancar el agente.

Si estoy en modo sandbox, todavía mejor. `Enter` ejecuta `sbx run <sandbox> --branch <branch>`, que entra automáticamente en el worktree dentro del sandbox. Sin cd manual, sin averiguar qué sandbox corresponde a qué worktree. biomelab conoce la correspondencia y se ocupa de ella. El [flujo completo con sandboxes](/es/posts/2026-04-14-construir-una-app-real-dentro-de-docker-sandbox/) está en otro post, por si quieres los detalles.

biomelab todavía no sabe cuál es mi agente preferido. Abre la terminal en el sitio correcto, pero `claude` lo sigo escribiendo yo. Es una función que quiero añadir: un ajuste de agente preferido en la configuración, para que `Enter` lo lance directamente. Por ahora, la pulsación extra es una fricción menor con la que puedo vivir.

Abro el editor en todas las tareas porque me sigue gustando hacer los commits yo mismo. `e` abre el worktree en mi editor (configurable con `$BIOME_EDITOR`, por defecto VS Code).

Otros atajos: `n` sobre la tarjeta principal crea o registra un sandbox para el repo. `s` arranca un sandbox parado, `Shift+S` detiene uno que está en marcha. El ciclo de vida de los sandboxes sin salir del dashboard.

## Shift+P para enviar

Cuando termino una tarea, `Shift+P` envía la PR. biomelab se encarga del flujo completo: comprueba si hay cambios sin commitear (y avisa si los hay), me deja elegir remoto si hay varios, muestra una confirmación, hace push de la rama y crea la PR. Si ya existe una PR para esa rama, se salta la creación y solo hace push. Sin PRs duplicadas, sin saltar al navegador, sin ejecutar `gh pr create` a mano.

La tarjeta pasa a la columna "PR Sent" del kanban. Una pulsación y el trabajo está fuera, esperando revisión. Y yo, a lo siguiente.

## El ciclo

El bucle completo: `c` (crear worktree) → `Enter` (abrir terminal) → `claude` → trabajar → `Shift+P` (enviar la PR) → a lo siguiente.

Ni siquiera espero a que termine la PR. Mientras Claude sigue con una tarea, yo ya estoy abriendo otro worktree para la siguiente. Dos agentes en marcha, dos ramas, dos tarjetas en el kanban. A veces tres. Desde fuera parece un caos. Desde dentro, cada tarjeta es su propio mundo.

Ese caos es intencionado. Cambiar de contexto entre worktrees sale barato porque biomelab guarda el estado por mí. Y yo necesito variedad. Mirar a un agente dándole vueltas a una sola tarea durante una hora es la mejor manera de quemarte. Saltar entre dos o tres tareas, comprobar el progreso, redirigir cuando hace falta, mantiene la energía alta. El kanban me dice qué tarjetas avanzan y cuáles están atascadas. Cuando llega una revisión, la tarjeta sigue ahí, con los iconos de los checks de CI incluidos, en la columna que toca. La retomo, atiendo los comentarios, hago push y listo.

En una buena mañana tengo tres o cuatro tarjetas avanzando por las columnas. Las features en progreso a la izquierda, las PRs esperando revisión a la derecha. El tablero es el backlog, el trabajo en curso y el montón de lo terminado, todo a la vez.

## Por qué se siente diferente

La productividad no viene de la velocidad. Viene de no perder nunca el contexto. biomelab siempre está ahí, enseñándome dónde está cada cosa. Es mucho más difícil olvidarte de una PR que espera revisión cuando la tarjeta te está mirando a la cara. Es mucho más difícil hacer un commit accidental a main cuando cada tarea empieza con `c`. El dashboard es el flujo de trabajo.

---

_Recursos:_
- _[biomelab](https://biomelab.dev)_
- _[biomelab en GitHub](https://github.com/mdelapenya/biomelab)_
