---
title: "Entendiendo Docker Sandboxes: aísla al agente, conserva tus herramientas"
date: 2026-09-29 09:00:00 +0200
description: "Meter al agente en una microVM suele costarte el editor y el harness con los que trabajas. No tiene por qué. Cualquier herramienta que hable SSH se conecta a un sandbox tal cual, y el motivo por el que sale gratis es el mismo por el que es seguro: dentro de la caja no hay clave, ni puerto, ni servidor SSH."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "sbx", "t3code", "coding-agents", "ssh", "developer-experience"]
type: post
weight: 30
translationKey: isolate-the-agent-keep-your-tools
translatedFrom: 0b88700
---

![Entendiendo Docker Sandboxes: aísla al agente, conserva tus herramientas](/images/posts/2026-09-29-isolate-the-agent-keep-your-tools/cover.png)

El [primer post](/es/posts/2026-09-23-entendiendo-docker-sandboxes-modo-yolo-seguro/) de esta serie iba de la caja. El [segundo](/es/posts/2026-09-25-los-kits-hacen-portable-la-autoridad/) iba de declarar lo que entra en ella. Este va del peaje que suele venir con una caja: aíslas al agente y pierdes las herramientas con las que trabajas.

Ese peaje es real en casi todas las cajas. Metes un agente en un contenedor o en una VM y tu editor no ve lo que hay dentro sin fontanería extra, tu terminal necesita un wrapper de exec y a tu harness hay que explicarle que la caja existe. O abres el puerto 22 y repartes una clave, y ahora la caja tiene una puerta. Lo habitual acaba siendo lo del primer post: el aislamiento se apaga la primera vez que estorba.

`sbx run claude` te deja dentro de Claude Code en tu terminal, y `sbx run <agent>` hace lo mismo con el que prefieras. Es el valor por defecto correcto para casi todo. Pero [hace un mes saqué mis agentes de la terminal por completo](/posts/2026-08-28-four-agents-four-machines-one-developer), a una superficie de control a la que accedo desde el móvil. Después de eso, volver a "el agente vive en la pestaña de terminal donde lo lancé" no es algo que esté dispuesto a hacer solo porque ahora el agente esté en una VM.

Así que el requisito es tajante: el sandbox es el runtime, y el harness es mío. Veamos cómo se conectan las dos cosas, y por qué no cuesta nada.

## Crea el sandbox a propósito

`sbx run` crea un sandbox y te conecta al agente en la terminal actual. Ese paso de conexión es justo el que aquí hay que saltarse. `sbx create` construye el sandbox sin conectarte, y ponerle nombre importa porque todo lo que viene después se dirige al sandbox *por su nombre*.

```console
$ sbx create --name demo claude .
```

El `.` es el workspace, montado en el sandbox en la misma ruta absoluta que tiene en mi máquina. Este último detalle importa más de lo que parece: cuando el agente me avisa de un test que falla en `/Users/mdelapenya/sourcecode/.../foo_test.go`, esa ruta es real en los dos lados, y puedo abrirla en un editor local sin traducir nada.

El nombre es la dirección. Una vez activado SSH, `demo` pasa a ser `demo.sbx`, y ese hostname es toda la superficie de integración.

## Conecta las herramientas que ya tienes

Todo lo que se conecta a un sandbox desde fuera lo hace de la misma manera, una que cualquier herramienta de desarrollo ya entiende: el sandbox aparece como un host SSH. Se activa una vez por máquina:

```console
$ sbx setup ssh
```

Eso arranca el daemon si no está en marcha y configura tu cliente SSH. A partir de ahí, cada sandbox es accesible como `<name>.sbx`:

```console
$ ssh demo.sbx
```

VS Code, Cursor, Claude Desktop, ChatGPT, T3 Code: cualquier herramienta con una opción de "conectar por SSH" apunta a `<name>.sbx` y se conecta ([la documentación explica cada una paso a paso](https://docs.docker.com/ai/sandboxes/integrations/)), porque ninguna sabe, ni necesita saber, qué es un sandbox. No hay que instalar ningún plugin de sandbox ni configurar nada específico en la herramienta. Tu editor cree que habla con una máquina, y es exactamente lo que debe creer. Las apps con agente propio siguen necesitando su CLI dentro de la caja: ChatGPT maneja Codex, así que quiere un sandbox `codex` y no el `claude` de arriba.

Una excepción que conviene conocer antes de elegir herramienta: Claude Desktop envía tus credenciales de Anthropic al proceso de Claude Code del sandbox, lo cual es una abolladura real en el aislamiento, y la documentación lo dice sin rodeos.

Comprueba que `ssh demo.sbx` funciona desde una terminal normal antes de apuntar cualquier editor o harness al sandbox. Esas herramientas van encima de SSH, así que si la conexión simple falla, la suya también. La diferencia está en lo que puedes leer: la terminal te enseña el error de SSH que explica el motivo, mientras que una herramienta lo envuelve dentro de su propio fallo de conexión.

## Mi harness: T3 Code

[T3 Code](https://github.com/pingdotgg/t3code) es el harness que uso. Ve un host SSH, se conecta y arranca al otro lado un servidor T3 que hace de túnel hacia la app. La [página de la documentación](https://docs.docker.com/ai/sandboxes/integrations/t3-code/) tiene el paso a paso; lo que sigue es el único detalle que se tuerce.

Hay una arruga real, y conviene conocerla antes de tropezar con ella y no después. T3 depende de `node-pty`, que solo distribuye binarios precompilados para macOS y Windows. En un sandbox Linux se compila desde el código fuente, y la compilación necesita `make`, `python3` y un compilador. Un sandbox de agente de serie no los trae. Así que la primera conexión falla con un error que concatena el "did not become ready" de T3 con la salida de la instalación de npm, y eso no es nada divertido de depurar.

La solución es un kit, que es justo el problema para el que existen los kits. Declara el toolchain una vez, al crear el sandbox. Un kit pasado con `--kit` solo tiene efecto cuando se crea el sandbox, así que esto sustituye al `sbx create` de antes en lugar de añadirse (desconéctate y haz antes `sbx rm demo` si ya existe):

```console
$ sbx create --name demo claude --kit docker.io/sbx/t3code-kit:latest .
```

El [kit `t3code`](https://github.com/docker/sbx-kits-contrib/tree/main/t3code) instala el toolchain de compilación y el paquete npm `t3` al crear el sandbox, de modo que la primera conexión se encuentra con un servidor que ya está ahí, en vez de construirlo. Combínalo con cualquier agente cuya imagen base traiga Node.js 18 o superior, que es el caso de todas las plantillas estándar.

También puedes hacerlo a mano en un sandbox que ya existe:

```console
$ sbx exec demo -- sudo apt-get update
$ sbx exec demo -- sudo DEBIAN_FRONTEND=noninteractive apt-get install -y g++ make python3
```

Pero una instalación manual dura justo hasta que recreas el sandbox, y la primera conexión sigue compilando `node-pty` desde el código fuente. Es la lección de [tres repos, un sandbox](/es/posts/2026-09-02-tres-repos-un-sandbox-dos-ficheros/) en miniatura: el entorno montado a mano no es lento de construir, es *distinto cada vez que lo construyes*.

## Elige la carpeta de forma explícita

El paso que es fácil pasar por alto.

Conectar una app selecciona el entorno remoto. No necesariamente abre el directorio correcto. El selector de carpetas remoto suele abrirse en `/home/agent`, mientras que una shell `ssh` interactiva suele arrancar en `/home/agent/workspace`, y no son el mismo sitio.

Así que elige la ruta explícitamente. En un sandbox con workspace montado, es la misma ruta absoluta que en tu máquina: si lo creaste desde `/Users/mdelapenya/src/my-project`, esa es la cadena que escribes en el selector. En un sandbox sin montajes sobre una plantilla de Docker, es `/home/agent/workspace`.

## Por qué no cuesta nada: sin clave, sin puerto, sin servidor

"Es solo SSH" suele significar que alguien abrió el puerto 22 en una máquina y te dio una clave. Eso no es gratis. Es un servidor que parchear, una clave que rotar y un puerto en la red, y sería raro añadirlo a una caja cuyo sentido entero es reducir la superficie de ataque. Este es el bloque que `sbx setup ssh` escribe en `~/.ssh/config` (el tuyo puede diferir en pequeños detalles), y demuestra que nada de eso existe:

```text
# >>> docker sandboxes (managed) >>>
Host *.sbx
    User _default_user_
    ProxyCommand "sbx" ssh proxy %n
    IdentityAgent none
    IdentityFile /dev/null
    IdentitiesOnly yes
    ControlMaster no
    ControlPath none
    UserKnownHostsFile "~/.ssh/sbx_known_hosts"
    KnownHostsCommand "sbx" ssh known-hosts %H
    StrictHostKeyChecking yes
# <<< docker sandboxes (managed) <<<
```

Hay dos ausencias, y una tercera que se deriva de ellas. Las tres son deliberadas.

**`IdentityAgent none`, `IdentityFile /dev/null`, `IdentitiesOnly yes`.** No hay clave. El socket de tu agente SSH queda explícitamente desconectado, y el único fichero de identidad es `/dev/null`. Nada te autentica con un par de claves.

**`ProxyCommand "sbx" ssh proxy %n`.** No hay puerto. El flujo SSH se retransmite al daemon por un socket local: un socket de dominio Unix en macOS y Linux, una named pipe en Windows. No hay nada escuchando en la red.

**Y, como consecuencia de las dos anteriores:** no hay `sshd` dentro del sandbox. SSH termina en el daemon de tu máquina. La caja a la que "haces SSH" no ejecuta ningún servidor SSH.

Entonces, ¿qué autoriza la conexión? Tu login de Docker. El daemon solo la acepta mientras tengas una sesión activa. Yo trabajo en Docker Sandboxes, así que tómalo como la visión del que lo construye: es un modelo de confianza distinto al de una clave en disco, y mejor para este caso. Revocar el acceso es cerrar sesión, en vez de perseguir una entrada de `authorized_keys`, y para empezar no hay ninguna clave SSH en disco que pueda filtrarse.

`KnownHostsCommand` cierra el último cabo. La clave del host se verifica en cada conexión contra la que tiene el daemon en ese momento, así que rotar la clave del daemon no provoca el muro de asteriscos de "REMOTE HOST IDENTIFICATION HAS CHANGED" que acostumbra a la gente a borrar su `known_hosts` y a dejar de leer los avisos.

Lo que importa en la práctica: `*.sbx` se comporta como un host SSH normal para cualquier cosa que hable SSH, sin tener ninguna de las piezas de un host SSH que normalmente tendrías que asegurar. Aquí SSH es el idioma que tus herramientas ya hablan, no una puerta nueva a la caja.

## En qué se convierte todo junto

Apila los tres posts y la forma es esta.

La microVM es la frontera, y nada de lo que hay dentro puede convencerme de saltármela. Un kit declara lo que contiene el entorno y qué autoridad pide, en un fichero que puedo revisar con un diff. Y tus herramientas se conectan a la caja como se conectan a cualquier otra máquina, así que aislar al agente no te cuesta ninguna: ni tu editor, ni tu harness, ni siquiera la terminal si quieres una.

Son tres decisiones separadas, y creo que la separación es lo bueno. Puedo cambiar de harness sin cambiar mi modelo de aislamiento. Puedo cambiar lo que hay en la caja sin cambiar cómo llego a ella. Nada de esto es un paquete que tengas que adoptar entero.

El agente corre en un sitio donde no puede hacerme daño, con exactamente la autoridad que yo dejé escrita, y yo lo manejo desde el harness que elija.

## Lo que viene

El motor de Docker propio del sandbox, y qué pasa cuando dejas que el agente ejecute de verdad tus tests de integración.

---

_Recursos:_
- _[Integraciones con editores y apps](https://docs.docker.com/ai/sandboxes/integrations/)_
- _[Conectar T3 Code a un sandbox](https://docs.docker.com/ai/sandboxes/integrations/t3-code/)_
- _[El kit `t3code`](https://github.com/docker/sbx-kits-contrib/tree/main/t3code)_
- _[T3 Code](https://github.com/pingdotgg/t3code)_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
