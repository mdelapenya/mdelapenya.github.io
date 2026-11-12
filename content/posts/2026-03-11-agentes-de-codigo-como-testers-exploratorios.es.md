---
title: "Agentes de código como testers exploratorios"
date: 2026-03-11 09:00:00 +0100
description: "Cómo tres skills de Claude Code que se combinan entre sí convierten a un agente de código en un tester exploratorio reutilizable: compila, prueba, clasifica los hallazgos y funciona en varias plataformas."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "testing", "exploratory-testing", "claude-code", "developer-experience"]
type: post
weight: 30
translationKey: coding-agents-as-exploratory-testers
translatedFrom: f67c35f
---

![Agentes de código como testers exploratorios](/images/posts/2026-03-11-coding-agents-as-exploratory-testers/cover.png)

Tenía que probar una herramienta CLI en tres plataformas. No era la primera vez. He usado [Aruba](https://github.com/cucumber/aruba) en Ruby para envolver las interacciones con la CLI en escenarios de Cucumber, [termtest](https://github.com/ActiveState/termtest) en Go para manejar pseudo-terminales desde código y [Tcl/Expect](https://core.tcl-lang.org/expect/index) para automatizar prompts interactivos. Todas funcionan, pero todas tienen la misma limitación: son scripts. Comprueban que `command X` produce `output Y`. Cuando la salida cambia, aunque sea un poco (un campo nuevo en el JSON, un mensaje de error reescrito, un código de salida distinto en otro sistema operativo), el script falla y se detiene. Te da el número de una línea que falla, no un diagnóstico.

Así que probé otra cosa. Escribí una [skill de Claude Code](https://docs.anthropic.com/en/docs/claude-code/skills) que convierte al agente en un tester exploratorio. No un ejecutor de tests que verifica un comportamiento esperado, sino un tester que usa el software e investiga lo que encuentra. La diferencia importa más de lo que parece.

## Los scripts de test son frágiles, los testers no

Las herramientas que he mencionado (Aruba, termtest, Expect) son buenas en lo suyo. Pero todas parten del mismo modelo: defines el comportamiento esperado por adelantado, haces aserciones contra él y fallas si no coincide. Ese modelo se rompe cuando el software que pruebas se comporta distinto según la plataforma, o cuando los bugs interesantes son justo los que a nadie se le ocurrió comprobar.

Un tester exploratorio trabaja de otra manera. Cuando la salida no coincide con lo esperado, se pregunta *por qué*. ¿Es un bug? ¿Una diferencia entre plataformas? ¿Un cambio de comportamiento desde la última versión? El tester se ajusta, prueba otro camino y sigue adelante.

Los agentes de código tienen esa misma capacidad de adaptación. Cuando un comando falla, el agente lee el mensaje de error, consulta la documentación, prueba una solución alternativa y se forma una opinión sobre si el fallo es un bug de verdad o una rareza del entorno. Eso no se puede escribir en un script.

Un ejemplo concreto. La [CLI de Docker Sandbox](https://docs.docker.com/ai/sandboxes/) crea microVMs ligeras para ejecutar agentes de código aislados. En macOS, las rutas de directorios temporales muy profundas (como las que genera `mktemp -d` bajo `/var/folders/...`) superan el límite de 104 bytes que tiene la ruta de un socket Unix. Un script de bash que ejecutara `docker sandbox create --name test-sbox claude $(mktemp -d)` fallaría con un críptico `krun_start_enter failed: -1` y se pararía ahí.

¿Y el agente? Se topó con el mismo error, leyó la sección de resolución de problemas de su skill, entendió la causa de fondo (la ruta del socket era demasiado larga), reintentó con una ruta más corta y lo marcó como un comportamiento conocido de esa plataforma. Después pasó a la siguiente prueba. Esa es la diferencia entre un script que se detiene y un tester que [se adapta](/es/posts/2026-02-24-programar-con-agentes-como-conducir-tesla-autopilot/).

## Una skill es un plan de pruebas con criterio

Una skill de Claude Code es un fichero markdown que vive en tu repositorio. Le da al agente contexto e instrucciones para una tarea concreta. En las pruebas exploratorias, esa skill hace de plan de pruebas, pero de un plan que el agente *interpreta* en lugar de ejecutarlo al pie de la letra.

La skill del tester tiene cuatro secciones:

**Fuentes de documentación.** Enlaces a la documentación de referencia de la CLI, a la documentación pública y a los README. El agente los lee primero para entender qué se supone que hace el software. Es lo mismo que hace un tester cuando lee la especificación del producto antes de empezar una sesión.

**Preparación del entorno.** La skill no incluye instrucciones de build. Remite a otra skill, `build-engineer`, que sabe compilar binarios, configurar el PATH, saltarse la autenticación y hacer cross-build para distintas plataformas. El agente lee primero esa skill, compila lo que necesita y vuelve al plan de pruebas. Las skills se combinan: el tester delega el conocimiento de build en un especialista.

**Plan de pruebas.** Una lista numerada de escenarios: comprobar la versión, la salida de la ayuda, la salud del daemon, el ciclo de vida create/list/exec/stop/remove, el modo detached, la gestión de errores. Pero el agente no trata esto como aserciones rígidas. Si crear un sandbox tarda más de lo esperado, espera. Si `exec` se comporta distinto de lo documentado, anota la discrepancia y continúa.

**Guía de resolución de problemas.** Problemas conocidos con su causa de fondo y su solución. Es conocimiento del equipo metido dentro de la skill. Cuando el agente se encuentra con un problema ya conocido (errores de autenticación, binarios de runtime que faltan, límites en la ruta de un socket), puede resolverlo sin intervención humana y sin abrir una issue duplicada.

Lo importante: esto no es un script que el agente ejecuta línea a línea. Es contexto que usa para tomar decisiones. El plan de pruebas dice "crea un sandbox con el agente `claude` y un workspace temporal". El agente decide *cómo* hacerlo, gestiona los fallos y prueba los casos límite que va descubriendo por el camino. A veces prueba nombres de agente no válidos o lanza comandos contra un sandbox detenido, solo para ver qué pasa. Eso es testing exploratorio.

## El agente no solo encuentra bugs, también los clasifica

Lo más valioso no es el plan de pruebas. Es lo que pasa después.

Cuando el tester exploratorio termina, entrega sus hallazgos a otra skill, `project-manager`, que se encarga del triage. El project manager prepara una tabla resumen con todo lo que se ha encontrado: comportamientos inesperados, mensajes de error que podrían ser más claros, validaciones que faltan, rarezas propias de una plataforma. Para cada problema asigna una severidad (crítica, alta, media, baja) y, si la identifica, una causa de fondo.

Después te presenta cada problema, uno a uno, y te pregunta: ¿quieres crear una issue en GitHub o la descartamos? Antes de crear nada, comprueba duplicados: busca coincidencias entre las issues y las PRs abiertas, reutiliza las issues existentes siempre que puede y solo crea una nueva cuando el hallazgo es realmente nuevo. En CI se salta el paso interactivo y lo procesa todo de forma automática.

Otro ejemplo de skills que se combinan: el tester descubre, el project manager clasifica.

Ese flujo convierte una sesión de pruebas en una conversación estructurada sobre la calidad. No tienes que recorrer un fichero de log intentando averiguar qué fallos importan. El project manager ya los ha ordenado por severidad, ha comprobado los duplicados y te da contexto suficiente para decidir. Tú solo eliges qué hacer.

## Cómo es una sesión de triage

En la práctica, una sola ejecución de pruebas puede sacar algo así:

| Problema | Severidad | Causa de fondo |
|---|---|---|
| `exec` falla en silencio cuando el sandbox está en estado "created" | alta | La CLI no valida el estado del sandbox antes de ejecutar `exec` |
| `rm` funciona sobre un sandbox ya eliminado, sin avisar | baja | Borrado idempotente, posiblemente correcto |
| El mensaje de error para un nombre de agente no válido no lista las opciones válidas | media | La validación de la CLI solo dice "invalid" y no ofrece ayuda |
| La salida de `ls --json` es distinta según la plataforma | media | Hay que investigarlo |

A partir de ahí decides qué merece una issue en GitHub, qué merece un arreglo y qué es solo ruido. El agente hace el trabajo de campo. Tú tomas las decisiones.

## Tres skills, tres plataformas, conocimiento que crece

El mismo conjunto de skills (build-engineer, tester exploratorio, project manager) se ejecuta en CI sobre Linux (amd64), macOS (arm64) y Windows (amd64). Sin scripts de test específicos para cada plataforma, sin lógica condicional. El agente lee las skills, se adapta a la plataforma en la que está corriendo y prueba la CLI en consecuencia.

Pero aquí viene lo interesante. La skill del tester remite a **ficheros de tema** específicos de cada plataforma: `topics/linux-amd64.md`, `topics/darwin-arm64.md`, `topics/windows-amd64.md`. Esos ficheros acumulan conocimiento de pruebas de ejecuciones anteriores. Cuando el agente descubre que un comportamiento solo se da en macOS, o que Windows necesita otra extensión en el binario, ese conocimiento queda anotado en el fichero de tema. La siguiente ejecución de CI en esa plataforma arranca con todo el contexto de las anteriores.

Esto es conocimiento que los scripts de bash no pueden acumular. Un script es estático: hace lo mismo todas las veces. Los ficheros de tema de la skill son una base de conocimiento que crece, la actualiza el propio agente, y hace que cada ejecución sea más lista que la anterior.

Con el tiempo, los ficheros de tema recogen cosas como:
- Comportamientos por defecto propios de cada plataforma
- Escenarios inestables (flaky) conocidos y cómo esquivarlos
- Diferencias en los mensajes de error entre sistemas operativos
- Tiempos típicos (cuánto tardan las operaciones en cada plataforma)

La skill base del tester se queda como está. El conocimiento de cada plataforma crece de forma orgánica.

## Lo que esto no es

Este enfoque no va, expresamente, de generar tests unitarios ni de integración. Ese es otro caso de uso, en el que el agente [escribe código de test](/es/posts/2026-02-26-spec-driven-development-es-el-nuevo-bdd/) que pasa a formar parte de tu código y se ejecuta en tu pipeline de CI.

Aquí el agente *es* el tester. No hay artefactos de test que mantener, ni librerías de aserciones, ni frameworks de testing. El valor está en el propio proceso de exploración: el agente usa el software, encuentra problemas y te ayuda a decidir qué hacer con ellos. Cuando la sesión termina, tienes issues en GitHub, arreglos o decisiones informadas de descartar. Ficheros de test, no.

La distinción importa porque cambia lo que optimizas. Con los tests generados, optimizas cobertura y determinismo. Con el testing exploratorio, optimizas descubrimiento y capacidad de adaptación. Las dos cosas valen. Sirven para fines distintos.

## Qué viene ahora

El patrón se generaliza más allá de las herramientas CLI. Cualquier software con una interfaz de línea de comandos, una API o incluso una interfaz gráfica (mediante automatización del navegador) se puede explorar así. Los ingredientes son los mismos: una skill de build para preparar el entorno, una skill de tester para explorar, un project manager para el triage y ficheros de tema para que el conocimiento de cada plataforma crezca.

Los mejores testers con los que he trabajado no siguen guiones. Aprenden el sistema, lo prueban con creatividad y te traen los problemas ordenados por lo que importan. Ahora ese comportamiento cabe en unos pocos ficheros markdown que se combinan entre sí.

---

_Recursos:_
- _[Documentación de las skills de Claude Code](https://docs.anthropic.com/en/docs/claude-code/skills): cómo crear skills reutilizables para Claude Code_
