---
title: "Cuatro agentes, cuatro máquinas, un desarrollador"
date: 2026-08-28 06:11:10 +0200
description: "T3 Code es un panel de control para los agentes de programación que ya tienes instalados en tus máquinas. Puse un servidor en cuatro de ellas, dejé el móvil como cliente y mi ciclo de trabajo dejó de ocurrir en una terminal."
categories: [Technology, AI, Software Development]
tags: ["t3code", "coding-agents", "claude-code", "developer-experience", "terminal", "docker-sandboxes"]
type: post
weight: 30
translationKey: four-agents-four-machines-one-developer
translatedFrom: 3091947
---

![Cuatro agentes, cuatro máquinas, un desarrollador](/images/posts/2026-08-28-four-agents-four-machines-one-developer/cover.png)

[T3 Code](https://github.com/pingdotgg/t3code) se me cruzó en el timeline. Lo instalé en una máquina para ver qué era, y después lo instalé en todas las demás.

Esa segunda parte es el post. No la reseña de la herramienta, sino la forma a la que me empujó. Ahora tengo un servidor de T3 Code en cuatro máquinas y un cliente en el bolsillo, y dos cosas que yo daba por cerradas resultaron no estarlo: en qué máquina corre un agente, y si trabajo en una terminal.

## Un panel de control, no otro agente

T3 Code es una interfaz gráfica para agentes de programación, con licencia MIT, hecha por Theo y Julius. Lo importante es lo que se niega a ser. No trae modelos ni agentes. Lo dice la documentación de instalación:

> T3 Code maneja las CLI de los proveedores; no las incluye.

Codex, Claude Code, Cursor, Grok Build y OpenCode. Si la CLI está instalada y autenticada en la máquina, T3 Code puede manejarla, con la suscripción que ya estás pagando. Lo que añade es un servidor en esa máquina y un conjunto de clientes que hablan con él: una app de escritorio en Electron, una app web alojada en `app.t3.codes` y apps nativas para iOS y Android.

Encaja justo donde yo tenía un hueco. Ya había llevado mis agentes [a la terminal y después a trabajar en paralelo](/posts/2026-03-18-the-six-levels-of-ai-assisted-development). Lo que no tenía era una forma de llegar a ellos que no fuera una terminal en la máquina donde estaban corriendo.

## Lo remoto vive en la conexión, no en el runtime

La decisión de diseño que hace posible una flota está dicha sin rodeos en la documentación para mantenedores:

> T3 tiene una sola frontera de runtime: un cliente habla con un servidor T3 por HTTP y WebSocket, y el servidor se encarga de la orquestación, los proveedores, las terminales, git y las operaciones del sistema de ficheros. Lo remoto se expresa en la capa de conexión, nunca dividiendo el runtime.

Esa frase vale más que cualquier lista de funcionalidades. No hay un "modo local" y un "modo remoto" con capacidades distintas. Hay un servidor y cuatro formas de que un cliente llegue a él: el backend local gestionado por la plataforma, un endpoint emparejado a mano, un túnel relay gestionado de T3 Connect y SSH gestionado por la app de escritorio.

Tres de mis máquinas están conectadas a través de **T3 Connect**, el relay gestionado. Tres no es un número arbitrario: es donde el plan gratuito marca su límite.[^1] El problema de la accesibilidad se resuelve una vez, en la capa de conexión, y todo lo que hay encima se queda igual, con independencia de la máquina con la que hable.

La elegancia se nota en lo que *no* se convirtió en concepto. Tailscale está soportado, y no es un quinto tipo de conexión. La documentación es explícita: es un proveedor de endpoints y un transporte, que se empareja por la vía ordinaria de bearer. Y los propios endpoints se anuncian como pistas, no como promesas:

> Los clientes tratan los endpoints anunciados como pistas, no como prueba de que una ruta funcione desde el dispositivo actual. Lo decide el intento de conexión.

## La flota

Cuatro servidores y un cliente en el bolsillo:

- **El Mac M4** con el que trabajo en Docker.
- **Una máquina Windows** y **una máquina Linux**, también de trabajo.
- **Mi Mac x86 personal**, que también corre un servidor y es el que se queda fuera del relay.
- **Mi móvil Android**, que no corre ningún servidor. Los móviles son clientes. Esa asimetría es el diseño funcionando como debe.

Cada máquina con un servidor es un *entorno de ejecución* en el vocabulario de T3, con un `environmentId` estable que el servidor genera en el primer arranque y guarda en disco. Desde cualquier cliente elijo el entorno que quiero y estoy ahí.

## Cuatro logins no son duplicación

La documentación de instalación tiene una línea que suena a tarea pesada:

> Ejecuta el comando de login en la máquina que corre el servidor de T3 Code, no en el dispositivo desde el que navegas.

Cuatro servidores significan autenticar Claude Code y Codex cuatro veces. Suena a peaje de configuración. No es duplicación, es la forma del sistema.

Cuatro servidores, cada uno con sus CLI autenticadas, son cuatro trabajadores. Cada uno tiene su propio sistema de ficheros, sus propios checkouts, su propia toolchain instalada, su propio daemon de Docker y su propio sistema operativo. El diseño alternativo, un único servidor al que se conecta todo lo demás, sería un solo trabajador con cuatro pantallas. Es otro producto, y peor para lo que yo quiero.

## De los worktrees a las máquinas

En marzo, el [nivel 5](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer) era así: cuatro paneles de Warp, cuatro git worktrees, cuatro sesiones de Claude Code y un desarrollador supervisando una cuadrícula en una sola pantalla.

El número no ha cambiado. Lo que ha subido de capa es la frontera de aislamiento. Un worktree aísla un directorio; una máquina aísla un sistema operativo, una toolchain, un daemon de Docker y un conjunto de comportamientos de la plataforma que no se pueden falsear desde otro sitio.

Los worktrees siguen ahí, eso sí. Lo que ha cambiado es que ya no me toca crearlos a mí.

## Ya no trabajo en una terminal

El cambio más grande no es dónde corren los agentes. Es dónde los tengo.

En marzo, la unidad de supervisión era un panel de terminal. Un panel, un agente, un worktree, y mi atención repartida mirando un rectángulo distinto. La unidad de T3 Code es el **thread**, y los threads se agrupan en **proyectos**, donde un proyecto reúne los checkouts que van juntos.

Los worktrees pasaron a ser un ajuste. En el modelo de T3, un worktree es "un espacio de trabajo aislado para un thread", y el modo de espacio de trabajo para los threads nuevos se configura por proyecto: `worktree` o `local`. Los proyectos también pueden marcar scripts de setup que se ejecutan cada vez que se crea un worktree, algo que solo descubrí al leer la documentación para este post. Pasó directo a la lista de imprescindibles: un worktree que se crea de cero cada vez solo vale la pena si arranca listo para trabajar. Además, cada uno de mis proyectos lleva un prompt de sistema que deja clara la disciplina: partir siempre de un `main` recién actualizado, en un worktree nuevo.

La frase que hace el trabajo de verdad está en la documentación de atajos de teclado:

> La rama, el worktree y el modo de entorno siempre salen de tus valores por defecto configurados, no del thread que estabas mirando.

"Nunca trabajes sobre `main`" era una regla que escribía en las instrucciones de un agente, y el fallo típico de una regla así es que el agente dé la rama por supuesta en lugar de comprobarla. Aquí un thread nuevo no puede heredar una rama obsoleta por accidente, porque no hereda ninguna. Lee el valor por defecto. La regla dejó de ser algo que recordar a mitad de tarea y pasó a ser estructural.

Por eso, el dolor que me hizo construir [biomelab](/posts/2026-04-24-my-daily-workflow-with-biomelab), antes [gwaim](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), ahora lo resuelven un desplegable y un prompt de proyecto. Era una TUI cuya única razón de existir era que crear worktrees a mano y seguir qué agente corría dónde dolía lo bastante como para automatizarlo. Estoy pensando en retirarla.

Los threads también tienen un ciclo de vida que ya no gestiono yo. Se dan por cerrados cuando quedan inactivos, y cuando se hace merge de la pull request vinculada. Los threads fijados quedan por encima de la lista activa y aparecen con independencia de su proyecto, también entre entornos, de modo que una sola barra lateral cubre las cuatro máquinas.

Ese último detalle es lo que jubiló la cuadrícula. Ya no cambio de máquina. Miro una lista de threads, y la máquina en la que corre cada uno es una propiedad suya, no un sitio al que tenga que ir.

Mis skills también vinieron conmigo. El compositor las lista por origen, incluidas las de nivel de proyecto, así que los [roles que escribí como skills](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/) están a una pulsación de tecla en cualquier entorno.

Y eso me deja en una posición incómoda con dos posts míos. Escribí [un post entero sobre cómo elegir una terminal para el desarrollo con agentes](/posts/2026-03-13-choosing-a-terminal-for-agentic-development), y en [el post de mi stack](/posts/2026-03-20-my-agentic-coding-stack) dije que la terminal es el nuevo IDE y el centro del trabajo.

Más que una rectificación, lo veo como el argumento llegando a su final. Aquel post concluía que la terminal que gana para el desarrollo con agentes es la que se queda invisible, la que no desvía tu atención de lo que produce el agente a cómo se comporta la terminal. Lo invisible tiene un punto final, y así es como se ve.

## Dónde corre el trabajo deja de ser donde me siento

Lo primero que cambió en la práctica es la continuidad. Empiezo algo en el escritorio y el thread ya no vive en mi terminal, así que no termina cuando me levanto. Lo retomo desde el móvil, leo lo que ha hecho el agente y lo dirijo. En el post del nivel 5 escribí que la continuidad era *yo*, que cargaba con el contexto entre sesiones y pausas para comer. Ahora eso es cierto en menor medida.

Lo segundo es la supervisión sin presencia. El trabajo largo de un agente ya no exige que yo esté delante de la máquina donde corre. Esa era la promesa del nivel 6, agentes que no necesitan mi portátil, y yo la había leído como "corre en CI". Esta es la otra mitad: sigue corriendo en mi propio hardware, y lo que se ha desacoplado es mi presencia.

## La plataforma es lo que importa

Las máquinas Windows y Linux se ganan el sitio con una tarea en concreto, y es la razón por la que una flota gana a un portátil más rápido.

Ejecutan pruebas guiadas por agentes, sin supervisión, de forma nativa en cada plataforma, y yo las observo y las corrijo desde el móvil. Ya escribí sobre cómo convertir [un agente de programación en un tester exploratorio](/posts/2026-03-11-coding-agents-as-exploratory-testers): una skill que ejercita el software e investiga lo que encuentra, en lugar de un script que afirma una línea y se para. Ese trabajo corría en tres plataformas, y la pieza que faltaba era que yo tenía que estar delante de cada máquina para dirigirlo y hacer el triaje. Esa pieza ya no está.

Una máquina Windows de verdad probando comportamiento de Windows no es algo que se resuelva con emulación. Con Linux pasa lo mismo. Lo que cambia T3 Code es que la máquina sigue teniendo que existir, pero yo no tengo que estar delante.

## El caso de uso que fui a buscar

Trabajo en Docker, en el equipo de [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/), y cuando entendí el modelo de conexión de T3 fui a ver cómo encajaban las dos cosas. Los Sandboxes ejecutan agentes de programación en microVMs aisladas: el agente tiene control total dentro de la VM, incluido sudo, mientras que el límite de la VM lo mantiene lejos de todo lo que hay en el host y no se haya compartido de forma explícita.

Es un buen complemento para un panel de control que facilita ejecutar agentes con los permisos al máximo.

La pieza que los conecta ya funcionaba, y funcionaba por una decisión de diseño, no por una integración. `sbx setup ssh` escribe una configuración SSH gestionada, de modo que cada sandbox es accesible como un host SSH normal en `<name>.sbx`, y el lanzamiento SSH gestionado por la app de escritorio de T3 Code hace el resto. Sin cambiar nada en T3 Code. La documentación para mantenedores trata SSH como una ayuda de acceso y no como un tipo de entorno, y precisamente por eso algo que nadie había previsto encajó.

La fricción está en todo lo que rodea a ese momento: saber que hay que ejecutar `sbx setup ssh`, saber cuál es el usuario y un escollo de los de verdad: la instalación remota falla en silencio porque `node-pty` no tiene prebuilds para Linux y un sandbox recién creado no trae compilador.

Así que [abrí una discusión](https://github.com/pingdotgg/t3code/discussions/7841) proponiendo una tarjeta de Docker Sandbox en el diálogo Add Environment que hiciera toda esa mecánica en una sola acción. Avisé desde el principio de que formo parte del equipo que construye `sbx` y señalé yo mismo la parte incómoda: la CLI `sbx` es gratuita, pero no es de código abierto. Después construí [un prototipo funcional](https://github.com/mdelapenya/t3code/pull/1) para que la conversación fuera sobre algo real. Conecta la activación del relay de T3 Connect con el registro del sandbox como un efecto secundario no fatal, de modo que un fallo del relay nunca tumba la conexión SSH.

Si acaba en T3 Code lo deciden ellos. Lo que yo quería era que quien use Docker Sandboxes tuviera un camino corto desde un móvil hasta un agente corriendo en una microVM.

## Cierre

Cuatro agentes, cuatro worktrees, un desarrollador describía un escritorio. Cuatro agentes, cuatro máquinas, un desarrollador no, y la diferencia es que el desarrollador puede irse.

---

_Recursos:_
- _[T3 Code en GitHub](https://github.com/pingdotgg/t3code)_
- _[T3 Code: acceso remoto](https://github.com/pingdotgg/t3code/blob/main/docs/user/remote-access.md)_
- _[T3 Code: arquitectura remota (internals)](https://github.com/pingdotgg/t3code/blob/main/docs/internals/remote.md)_
- _[T3 Code: atajos de teclado](https://github.com/pingdotgg/t3code/blob/main/docs/user/keybindings.md)_
- _[T3 Code: organizar threads](https://github.com/pingdotgg/t3code/blob/main/docs/user/thread-sidebar.md)_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
- _[Discusión #7841: entornos de Docker Sandbox con un clic](https://github.com/pingdotgg/t3code/discussions/7841)_

[^1]: El límite es de T3 Connect, el relay gestionado, no de T3 Code, que tiene licencia MIT y no limita nada. Tenía la flota funcionando en cuatro máquinas antes de saberlo, y saqué el Mac personal del relay para quedarme dentro del plan gratuito. Sigue corriendo un servidor y le quedan abiertos los demás métodos de acceso de la lista anterior, así que lo que me costó el límite fue un transporte, no una máquina.
