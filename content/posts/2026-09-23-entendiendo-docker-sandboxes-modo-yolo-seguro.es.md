---
title: "Entendiendo Docker Sandboxes: el modo YOLO puede ser seguro"
date: 2026-09-23 18:00:00 +0200
description: "El argumento de mi charla en ContainerDays Hamburg: lo que hace productivo a un agente de programación es lo mismo que lo hace peligroso, y eso no se arregla pidiéndole que tenga cuidado."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "sbx", "coding-agents", "developer-experience", "docker", "security"]
type: post
weight: 30
translationKey: yolo-mode-can-be-safe
translatedFrom: 5bd394b
---

![Entendiendo Docker Sandboxes: el modo YOLO puede ser seguro](/images/posts/2026-09-23-yolo-mode-can-be-safe/cover.png)

Este es el primero de una serie sobre Docker Sandboxes, que es en lo que trabajo todos los días. Lo digo desde el principio: no estoy haciendo una reseña de un producto, estoy defendiendo algo que ayudo a construir.

Es la charla que di en [ContainerDays Hamburg](https://www.containerdays.io/containerdays-hamburg-2026/agenda/) el 2 de septiembre, pasada a prosa para que el argumento tenga dónde vivir.

El argumento es corto. Lo que hace útil a un agente de programación es la autonomía. La autonomía es también todo el riesgo. Ese riesgo no se gestiona pidiéndole al agente que tenga cuidado, y la razón es estructural, no una cuestión de ajuste fino.

## Otra semana, otra historia de terror con agentes

Ya las has visto. Llegan más o menos cada semana.

La que usé en la charla es de [Son Luong](https://x.com/sluongng), del 30 de mayo. Le pidió a Codex algo que necesitaba root en una máquina donde, a propósito, no le había dado sudo. Codex no podía usar `sudo`, y `run0` no funcionaba en modo no interactivo. Así que se fijó en que su usuario estaba en el grupo `docker`, arrancó un contenedor como root, montó `/etc` del host dentro con lectura y escritura, y desde dentro copió un fichero de configuración encima del que estaba en uso.

Eso no es un jailbreak. Nadie engañó al modelo. Le pidieron cumplir una tarea, enumeró las capacidades que realmente tenía a su alcance y encontró la que funcionaba. Pertenecer al grupo `docker` **es** ser root, de forma transitiva, y siempre lo ha sido. El agente simplemente leyó la situación de forma más literal de lo que solemos hacerlo nosotros.

Esta es la idea a la que quiero agarrarme, porque cambia el enfoque de todo lo que viene después. El agente no se portó mal. Se comportó correctamente respecto a un límite que nunca existió de verdad.

## Más autonomía, más productividad

Este es el espectro que usé en la charla, y es la razón por la que nadie va a resolver esto usando menos los agentes.

| Nivel | Qué es | Dónde se ejecuta |
| --- | --- | --- |
| Asistente de búsqueda | ChatGPT en una pestaña del navegador | Aplicación web |
| Asistente de código | Autocompletado del IDE | En el editor |
| Programador en pareja (pair programmer) | Chat dentro del IDE | En el editor |
| Ejecutor de tareas | Le pasas una tarea y te vas | Terminal, fuera del flujo |
| Compañero de equipo autónomo | Coge el trabajo y lo ejecuta | CI/CD, fuera del flujo |

Léela de arriba abajo y hay algo que crece sin parar: cuánto puede hacer el agente sin que tú estés en medio. La productividad sigue ese mismo camino. Ya troceé este territorio de otra forma en [los seis niveles del desarrollo asistido por IA](/posts/2026-03-18-the-six-levels-of-ai-assisted-development).

Ahora léela otra vez y verás que crece algo más al mismo ritmo: el radio de impacto (blast radius). Un asistente de búsqueda no puede borrar tu `~/.aws`. Un compañero autónomo sin duda puede, y lo que lo hace valioso es precisamente que tú no estás mirando cuando lo hace.

Así que la pregunta honesta no es "cómo hacemos que los agentes sean más seguros dándoles menos". Es esta: ¿a qué puede llegar un agente en tu organización, ahora mismo, hoy?

Para la mayoría la respuesta es "a todo lo que llego yo", porque el agente se ejecuta como yo, en mi máquina, con mis claves.

## La asimetría

Lo repartí en dos diapositivas, y sigo pensando que es el núcleo del problema:

> Tú tienes que acertar siempre. Los agentes solo tienen que acertar una vez.

La defensa tiene que aguantar en cada prompt, en cada sesión, en cada llamada a una herramienta, para siempre. El fallo solo tiene que ocurrir una vez, y ni siquiera hace falta que sea intencionado. Nadie tiene que atacarte. El no determinismo, sumado a una superficie de capacidades lo bastante amplia, llega solo, tarde o temprano, un martes cualquiera.

Y la respuesta del sector ha sido, en buena medida, cruzar los dedos. Reuní el género en una diapositiva: "don't fail to me bro", "careful please 🙏", "make no mistakes". Eso no son controles. Son prompts, viven dentro de lo mismo que intentas limitar, y un modelo que optimiza para completar la tarea los esquivará con la misma alegría con la que Codex esquivó la falta de sudo.

No puedes pedirle a lo que está dentro del límite que haga cumplir el límite. El límite tiene que estar en un sitio al que el agente no llegue.

## Así que lo metemos en una caja

Si el límite no puede vivir dentro del agente, tiene que vivir a su alrededor. Eso significa renunciar a gobernar lo que el agente decide hacer, y gobernar en su lugar a qué pueden llegar sus decisiones.

![Un robot entrando en un contenedor de transporte con la etiqueta SANDBOX](/images/posts/2026-09-23-yolo-mode-can-be-safe/into-the-box.png)

El mecanismo es menos ingenioso de lo que parece: el agente recibe una máquina entera, y esa máquina no es la tuya.

Así que: `sbx`.

```console
$ brew install docker/tap/sbx
$ cd ~/my-project
$ sbx run claude
```

Eso es todo. Esa es la interfaz. Ahora estás en Claude Code, o en el agente de programación que prefieras, dentro de una microVM, y el agente tiene `sudo`, su propio motor de Docker y permiso para hacer lo que quiera con su propio sistema de ficheros.

## Qué es realmente la caja

![Arquitectura de Docker Sandboxes: plano de control en el host, contenedor del agente dentro de una microVM aislada](/images/posts/2026-09-23-yolo-mode-can-be-safe/sandbox-architecture.png)

Esa es la fontanería: un plano de control en tu host, y una microVM por sandbox con el agente y su propio motor de Docker dentro. Pero lo que sostiene el argumento no está en las cajas. Está en que el aislamiento son cinco límites separados, no uno grande.

**Hipervisor.** Cada sandbox es una microVM con su propio kernel de Linux. No un contenedor que comparte el tuyo. Los procesos de dentro son invisibles para tu host y para cualquier otro sandbox, y no se siguen los enlaces simbólicos que apuntan fuera del workspace. Esta es la capa que hace imposible la historia de Codex, y no solo desaconsejada: no hay un `/etc` del host que montar, porque no hay host.

**Red.** Cada sandbox tiene su propia red, y todo el TCP saliente está bloqueado salvo que una regla permita el destino. No "registrado", no "avisado". Bloqueado, por defecto, SSH incluido. UDP e ICMP no salen en absoluto, y el DNS pasa por un resolvedor interno que aplica la misma política. `sbx policy ls` te muestra qué permite ahora mismo tu máquina.

**Motor de Docker.** El agente recibe un daemon de Docker real y privado dentro de la VM. Puede construir imágenes, ejecutar contenedores y montar volúmenes, y no se acerca al daemon donde corre tu trabajo de verdad. Esta capa tendrá su propio post más adelante en la serie, porque "el agente puede ejecutar de verdad tus tests de integración" resulta ser mucho más importante de lo que parece.

**Workspace.** Tú eliges qué puede ver el agente. `sbx run` monta el directorio actual y nada más. `sbx create` sin ruta no le da ningún sistema de ficheros del host. El modo clone monta tu repo en solo lectura y deja que el agente trabaje en un clon privado.

**Proxy de credenciales.** Es la capa menos obvia, así que lo digo claro: el agente puede hacer push a GitHub sin tener nunca tu token. Las credenciales las inyecta en las peticiones salientes el proxy del host, fuera del límite. El agente hace la petición; la cabecera aparece al salir. Nada dentro de la VM puede leer el valor.

Ninguna de estas capas es novedosa por sí sola. Lo útil es que se componen, y que esa composición tiene una postura por defecto en vez de ser un ejercicio de configuración.

## La equivalencia que tiene que cumplirse

Esta es la parte que decide si todo funciona o no, y es una afirmación de producto, no de seguridad.

```
sbx run claude  ===  claude
```

Si usar el sandbox te cuesta algo, en tiempo de arranque, en fidelidad, en "un momento, esto en mi máquina funciona pero aquí dentro no", no lo usarás. Lo desactivarás una sola vez, la tarde que tengas prisa, y no lo volverás a activar. Es el destino habitual de un control de seguridad que te cobra peaje.

Así que el objetivo no es "seguro". El objetivo es **seguro e indistinguible**. El mismo agente, la misma CLI, la misma autenticación que ya tienes, el mismo repo en la misma ruta absoluta, de modo que tus stack traces y tus ficheros de configuración sigan apuntando a rutas que reconoces. Si la experiencia es distinta, ha fracasado.

Por eso también las salidas de emergencia son de verdad. Los kits extienden un sandbox de forma declarativa cuando la caja por defecto no basta, y eso será otro post. El propio entorno puede ser un fichero que commiteas, algo de lo que [escribí hace unas semanas](/es/posts/2026-09-02-tres-repos-un-sandbox-dos-ficheros/) mientras montaba mi propia configuración con tres repositorios.

## Pero

Todo lo anterior trata de a qué no puede llegar el agente. Nada de ello trata de lo que tú le entregas a propósito.

![Una puntera de acero absorbe el impacto, pero solo en el pie que cubre](/images/posts/2026-09-23-yolo-mode-can-be-safe/steel-toe.png)

Una puntera de acero protege el pie. No protege nada que la bota no cubra, y no opina sobre dónde decides ponerte.

Así que: un sandbox impide que el agente toque tu host. No impide que el agente haga mal uso de lo que le diste legítimamente. Si puede llegar a la red, y le entregaste una credencial real y datos reales, nada dentro de la caja impide que esos dos hechos se junten y se envíen a algún sitio. Eso no es un agujero en el aislamiento. Es el aislamiento haciendo exactamente lo que configuraste, porque tú concediste el alcance y tú concediste el secreto.

Las capas lo reducen. El proxy de credenciales hace que el agente nunca tenga el token en crudo. El bloqueo por defecto hace que solo llegue a los hosts que permitiste. Ninguna de las dos responde a "¿debería este agente tener datos de producción, para empezar?", y esa pregunta no tiene respuesta técnica. Se queda con la persona que entrega las llaves.

## Velocidad y seguridad no son una disyuntiva

Esta es la idea con la que quiero dejarte, porque creo que la formulación habitual es errónea.

Velocidad sin seguridad es caos, y en eso todo el mundo está de acuerdo. La mitad que la gente se salta es que seguridad sin velocidad es parálisis, y parálisis es lo que de verdad obtienes con los avisos de permisos, con las colas de aprobación, con ejecutar el agente en modo solo lectura y copiar y pegar a mano sus sugerencias. Eso no es seguro. Es solo lento, y las herramientas lentas se esquivan, lo que acaba por hacerlas inseguras, solo que más tarde.

Así que las dos cosas nunca estuvieron realmente enfrentadas. Preguntar y aprobar compra seguridad gastando tu velocidad, y por eso se agota. Un límite la compra sin gastar nada, y por eso no se agota.

El modo YOLO puede ser seguro. No porque el agente se haya vuelto de fiar, sino porque has dejado de necesitar que lo sea.

Ejecuta agentes. Con libertad, con seguridad.

## Gracias, Oleg

[Oleg Šelajev](https://www.linkedin.com/in/shelajev/) inspiró esta charla y compartió sus diapositivas e ilustraciones para que yo pudiera montarla. Los dibujos de este post son suyos (o de sus agentes).

## Siguiente

Kits: qué declaran y qué está cambiando en la especificación.

---

_Recursos:_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
- _[Instalar `sbx`](https://docs.docker.com/ai/sandboxes/install/)_
- _[Kits de la comunidad en GitHub](https://github.com/docker/sbx-kits-contrib/)_
- _[Kits publicados en Docker Hub](https://hub.docker.com/u/sbx)_
- _[El repositorio del workshop de ContainerDays](https://github.com/mdelapenya/sbx-workshop)_
- _[Diapositivas: YOLO Developer Workflows with a Coding Agent in a Box](/slides/2026-09-containerdays-hamburg/ContainerDays-Hamburg-YOLO-Developer-Workflows.pdf)_
- _[Vídeo: la misma charla en WeAreDevelopers World Congress, julio de 2026](https://youtu.be/NBgqwL-1qnU)_
- _[Informar de un bug o pedir una funcionalidad](https://github.com/docker/sbx-releases/issues)_
