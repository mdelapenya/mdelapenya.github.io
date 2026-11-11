---
title: "Entendiendo Testcontainers: Ryuk, el segador"
date: 2026-09-09 09:00:00 +0200
description: "El contenedor extra de tu docker ps: qué es Ryuk, las labels que usa para saber qué es tuyo, el protocolo TCP que habla con tus tests, los temporizadores y las protecciones contra carreras que lleva dentro, y por qué desactivarlo en CI es un falso ahorro."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "ryuk", "docker"]
type: post
weight: 30
translationKey: understanding-testcontainers-the-ryuk-reaper
translatedFrom: 1bf6752
---

![Entendiendo Testcontainers: Ryuk, el segador](/images/posts/2026-09-09-understanding-testcontainers-the-ryuk-reaper/cover.png)

*Este post lo escribí como invitado para [internals-for-interns.com](https://internals-for-interns.com/), el blog de textos largos de Jesús Espino sobre las tripas del software, y se publicó allí primero. Es el mismo texto, republicado aquí.*

Si has usado Testcontainers en cualquier lenguaje (Go, Java, .NET, Python, Node, Rust), seguro que has visto un contenedor de más en la salida de `docker ps` mientras corren tus tests. Su imagen es `testcontainers/ryuk` y su nombre sigue un patrón que varía según la biblioteca de cada lenguaje (la de Go lo llama `reaper_<sessionID>`; otras usan algo parecido con su propio prefijo). Está ahí, junto a los contenedores de Postgres, Redis o Kafka que tus tests necesitan de verdad. Llega sin que lo invites, se queda mientras dura la ejecución de los tests y desaparece al terminar. Si alguna vez te has preguntado qué hace, este post es para ti.

Ese contenedor es Ryuk. Es un pequeño proceso sidecar cuyo único trabajo es limpiar recursos de Docker cuando tus tests mueren. Por "sidecar" entiendo un contenedor auxiliar que corre junto a la carga de trabajo a la que sirve; aquí, tu proceso de tests. Por "mueren" entiendo cualquier forma en que un proceso de tests puede dejar de existir: una salida limpia, un `SIGKILL` del OOM killer, un job de CI cancelado, un timeout de CI que mata el runner. Ryuk es la red de seguridad que los recoge todos.

Este post trata de cómo funciona Ryuk. No el código fuente de Go línea a línea, sino el contrato: qué hace, por qué existe, el protocolo que habla con tus tests, los mecanismos de seguridad que lleva dentro y qué ocurre cuando se dan los distintos modos de fallo. Al terminar deberías poder mirar `docker ps`, ver a Ryuk ahí sentado y saber exactamente lo que va a pasar si pulsas `Ctrl+C` en tu ejecución de tests. Deberías entender también por qué desactivar Ryuk en integración continua es uno de los peores falsos ahorros del ecosistema Testcontainers.

## Un sidecar con un solo trabajo

Ryuk es una imagen de Docker. La versión actual en Docker Hub es `testcontainers/ryuk`, y el binario que lleva dentro (que también se llama Ryuk) es un pequeño programa en Go que hace una sola cosa: escuchar las instrucciones de tus tests sobre qué recursos limpiar, y borrarlos cuando tus tests dejan de dar señales de vida. El código está en [github.com/testcontainers/moby-ryuk](https://github.com/testcontainers/moby-ryuk). Es lo bastante pequeño como para leerlo entero en una tarde.

El nombre "Ryuk" está tomado del manga *Death Note*, donde Ryuk es un shinigami, un dios de la muerte japonés, que deja caer un cuaderno en el mundo de los humanos. Quien escribe el nombre de una persona en el cuaderno provoca su muerte. El nombre le va como anillo al dedo: el cuaderno de Ryuk es el conjunto de labels de Docker que le das, y los recursos cuyos nombres figuran en esas labels mueren cuando Ryuk decide que se les acabó el tiempo. No hay ambigüedad sobre a quién se puede matar. Si no le dijiste a Ryuk que lo vigilara, Ryuk no lo toca.

Ryuk no arranca solo con Docker. Lo arranca la biblioteca de Testcontainers al principio de tu ejecución de tests, antes que cualquier otro contenedor. Con Ryuk en marcha, la biblioteca abre una conexión TCP con él (Ryuk escucha por defecto en el puerto 8080, dentro del contenedor) y le dice qué limpiar. Después mantiene esa conexión abierta mientras dure el test. Cuando la conexión se cierra, sea por lo que sea, Ryuk espera un breve periodo de gracia y borra todo lo que le contaste.

Tres cosas importan de este diseño. No se fía de que el proceso que lo llama limpie su propio desorden. Usa las labels de Docker como único mecanismo para decidir "qué es mío". Y usa una única conexión TCP como interruptor de hombre muerto (deadman switch), es decir, la ausencia de señal como disparador de la acción. Cuanto más lo cuestionas, más sentido tiene, pero para verlo primero hay que hablar de por qué existe Ryuk.

## Por qué existe: el problema de los huérfanos

Imagina que escribes un test de integración que necesita una base de datos PostgreSQL de verdad. Testcontainers lo vuelve trivial: llamas a algo como `postgres.Run(ctx, "postgres:latest")` y te devuelve un handle a un contenedor Postgres en ejecución. Lanzas tu test contra él. Cuando el test termina, la biblioteca llama a `Terminate` sobre el contenedor y Postgres desaparece. Bien, ese es el camino feliz.

Ahora piensa en los caminos infelices. El sistema operativo mata el proceso de tests con `SIGKILL` porque consume demasiada memoria. Se cancela el job de integración continua y el runner mata el proceso. El test se cuelga y CI acaba matándolo al cumplirse el timeout del job. `SIGKILL` se salta los manejadores de señales, así que en ninguno de estos casos se ejecuta código de limpieza. Hay además una causa de huérfanos más sencilla y más común: alguien creó un contenedor en un test sin registrar una llamada a `Terminate`, y el contenedor sigue corriendo cuando el test que lo creó ya ha terminado.

En todos estos escenarios, el proceso de tests nunca llega a ejecutar su código de limpieza. El contenedor de Postgres sigue corriendo. Igual que las redes, los volúmenes y cualquier otro recurso de Docker que el test creó durante su ejecución. Ninguno de estos recursos volverá a ser útil, pertenecen a una ejecución de tests que ya está muerta, pero seguirán ahí consumiendo memoria, disco y puertos del host hasta que alguien los borre a mano.

A escala, esto se acumula. Cada huérfano consume memoria, espacio en disco y, posiblemente, mapeos de puertos en el host hasta que algo lo elimina. En runners de CI de larga vida o en máquinas de desarrollo, la acumulación exige intervención manual periódica, normalmente un `docker system prune` o algo equivalente.

Este es el problema de los huérfanos. Es la razón por la que toda herramienta de gestión de bases de datos acaba incorporando una función para "matar sesiones abandonadas", por la que todo pool de conexiones tiene un timeout de inactividad, por la que todo sistema distribuido tiene heartbeats. El patrón es siempre el mismo: cuando un proceso posee recursos externos, y el proceso puede morir de formas que impiden la limpieza, necesitas un observador externo que limpie en su nombre.

Ryuk es ese observador externo para Testcontainers.

Podrías decir que esto lo debería resolver la propia biblioteca, con sentencias `defer`, bloques `finally` o destructores. Los autores de bibliotecas lo intentaron durante años. El problema de fondo es que el proceso de tests es justo el peor sitio donde poner la lógica de limpieza, porque el proceso de tests es justo lo que se está muriendo. Cualquier código que escribas dentro del proceso para limpiar asume que el proceso vivirá lo suficiente para ejecutarlo, y esa suposición es precisamente la que falla. La solución tiene que estar fuera del proceso de tests. Tiene que sobrevivir a lo que sea que lo mató.

## Cómo sabe Ryuk qué es tuyo: las labels

El trabajo de Ryuk es borrar recursos de Docker. Docker tiene muchos recursos (contenedores, imágenes, redes, volúmenes, servicios, secretos), y un solo daemon de Docker puede estar sirviendo a decenas de proyectos sin relación entre sí a la vez. Solo tu portátil ya podría estar ejecutando contenedores de tu suite de tests, de tu base de datos de desarrollo, del dashboard de Docker Desktop y de otras tres ejecuciones de Testcontainers de hoy mismo que olvidaste terminar. Ryuk tiene que saber qué subconjunto de todo eso es *tuyo*.

La respuesta son las labels de Docker: pares clave-valor que se adjuntan a un recurso al crearlo, que el daemon guarda y te deja consultar pero que por lo demás ignora. Metadatos puros, sin ningún significado de comportamiento.

Testcontainers usa las labels como su marca de "esto es mío". Todo contenedor, red, volumen e imagen que crea Testcontainers lleva un conjunto de labels. En la biblioteca de Go, el conjunto canónico es este:

```go
org.testcontainers              = "true"
org.testcontainers.lang         = "go"
org.testcontainers.version      = <library version>
org.testcontainers.sessionId    = <random session ID, one per test run>
org.testcontainers.reap         = "true"
```

El [`sessionId`](/posts/2026-08-15-understanding-testcontainers-session-ids) es la más distintiva. Se genera cuando arranca tu suite de tests, y todo contenedor, red, volumen e imagen creado durante esa ejecución recibe el mismo valor de `sessionId`. La label `reap` es la marca explícita de opt-in para la limpieza: cuando la biblioteca está configurada para usar Ryuk, todo recurso recibe `reap=true`; cuando está configurada sin Ryuk, esa label se omite. Volveremos sobre esto en la sección sobre desactivar Ryuk.

Si quieres verlo tú mismo, ejecuta un test con Testcontainers y, mientras corre, en otra terminal:

```shell
$ docker ps --filter label=org.testcontainers
```

Verás los contenedores de test que usan tus tests, más el propio Ryuk, todos con el mismo `sessionId`. Después:

```shell
$ docker inspect <container-id> | grep -A 10 Labels
```

y verás las labels reales de ese contenedor. Las claves varían un poco entre las bibliotecas de cada lenguaje (la de Go usa `org.testcontainers.lang=go`, la de Java usa `org.testcontainers.lang=java`), pero la forma es la misma en todas.

Cuando arranca Ryuk, la biblioteca de Testcontainers abre una conexión TCP con él y le envía un filtro con todas esas labels por defecto. Como el `sessionId` es aleatorio y único para esta ejecución, el filtro combinado coincide exactamente con los recursos que creó esta ejecución de tests y con nada más de la máquina: no hay riesgo de que Ryuk cruce fronteras entre proyectos y mate el contenedor de otro. Ryuk apunta el filtro y espera. Los recursos creados a partir de ese momento heredan las mismas labels y quedan cubiertos automáticamente.

Este es el motivo de que el diseño funcione. Las labels convierten "encuentra mis recursos" de un problema difícil (seguir cada recurso que creo, mantener una lista, recolectar la basura al salir) en una consulta trivial (borra cualquier contenedor con esta label). El sistema de labels es más antiguo que Ryuk, más antiguo que Testcontainers, y viene integrado en Docker. El diseño de Ryuk usa lo que ya está ahí.

## El protocolo: conectar, declarar, ACK, heartbeat

Ryuk escucha en el puerto TCP 8080 dentro de su contenedor. Testcontainers, que corre fuera del contenedor (o dentro de otro, según tu configuración), se conecta a ese puerto. La conexión es TCP plano, sin TLS y sin autenticación. El listener se enlaza a todas las interfaces dentro del contenedor, y el control de acceso lo da el mapeo de puertos de Docker que lo rodea (que normalmente solo expone el puerto a localhost) y el hecho de que Ryuk solo corre durante una sesión de tests. El protocolo sobre el cable es texto legible por humanos. Podrías implementar una biblioteca de Testcontainers en un script de shell.

Así se ve el protocolo en la práctica. Cuando un cliente se conecta, envía una o más líneas, cada una terminada en salto de línea. Cada línea declara un filtro, con formato de query string de URL. El tipo de filtro más común es `label`, y el formato es `label=key=value`. Se pueden enviar varios filtros en una línea, separados por `&`. Toda la línea se parsea con `url.ParseQuery` de Go, lo que da al formato su semántica precisa: `&` separa las entradas del filtro, `=` separa el tipo del valor, y los valores se decodifican como URL.

Una línea de filtro real enviada por testcontainers-go, con todas las labels por defecto, tiene este aspecto (una sola línea larga, partida aquí solo para que se lea mejor):

```
label=org.testcontainers=true&label=org.testcontainers.lang=go
&label=org.testcontainers.version=<library version>
&label=org.testcontainers.sessionId=<sessionID>
&label=org.testcontainers.reap=true
```

Esto le dice a Ryuk: "coincide con cualquier recurso de Docker que tenga todas estas labels con exactamente estos valores". Las cinco entradas de una misma línea se combinan con AND: la implementación de filtros de Docker (la función `MatchKVList` del paquete `docker/docker/api/types/filters`) itera sobre cada par `label=key=value` y devuelve false en la primera discrepancia, de modo que un recurso solo cuenta como coincidencia si tiene todos los pares label-valor. Las líneas, en cambio, se combinan con OR: cada línea se registra como un conjunto de filtros independiente, y Ryuk lista los recursos que coinciden por separado para cada conjunto y luego une los resultados. Un recurso se limpia si coincide con *cualquiera* de los conjuntos de filtros registrados.

Cuando Ryuk procesa cada línea, devuelve cuatro bytes: `ACK\n`. La biblioteca de Testcontainers lee exactamente cuatro bytes con `io.ReadFull` y comprueba que coinciden con `ACK\n`. Un detalle: Ryuk envía el ACK tanto si la línea se parseó bien como si no (una línea de filtro mal formada se registra como error y aun así se confirma), así que el ACK significa "línea recibida y procesada", no "filtro aceptado". Desde el punto de vista del cliente el valor es el mismo: sabe que Ryuk recibió y leyó su línea antes de dar el registro por completado y seguir con el resto de la preparación del test.

La conexión en sí es el contrato. Mientras está abierta, Ryuk guarda los filtros en memoria y espera. La biblioteca de Testcontainers no tiene que enviar bytes de keepalive. No tiene que hacer ping. Basta con que el socket TCP esté abierto, porque el propio TCP se encarga de detectar que el otro lado ha desaparecido, a través de la capa de sockets del sistema operativo.

Para verlo con tus propios ojos, el repositorio de Ryuk documenta cómo simular un cliente con netcat:

```shell
$ nc -N localhost 8080 << EOF
label=testing=true&label=testing.sessionid=mysession
label=something
EOF
```

Esta sesión declara dos filtros. El primero coincide con cualquier cosa que tenga a la vez `testing=true` y `testing.sessionid=mysession`. El segundo coincide con cualquier cosa que tenga la label `something` (con cualquier valor). Cuando netcat se desconecta, Ryuk espera al timeout de reconexión y luego borra cualquier contenedor, red, volumen o imagen que coincida con cualquiera de los dos conjuntos de filtros. Puedes verlo en los logs del propio Ryuk, que se parecen a esto:

```log
msg="adding filter" type=label values="[testing=true testing.sessionid=mysession]"
msg="adding filter" type=label values=[something]
msg="client disconnected" address=127.0.0.1:56432 clients=0
msg="prune check" clients=0
msg=removed containers=0 networks=0 volumes=0 images=0
msg=done
```

Pueden conectarse varios clientes a la vez, y cada uno aporta sus propios filtros. Esto importa en algunas configuraciones: una sola instancia de Ryuk podría, en principio, servir a varias ejecuciones de tests en paralelo si todas estuvieran configuradas para apuntar al mismo Ryuk. Los filtros de cada ejecución viven en su propia conexión. Cuando todas las conexiones caen y expira el periodo de gracia, Ryuk procesa todos los filtros juntos y limpia todo lo que coincide con cualquiera de ellos. Si incluso una sola conexión sigue abierta, Ryuk sigue esperando.

La sencillez es el objetivo. El protocolo es lo bastante pequeño como para implementarlo desde cero en cualquier lenguaje que tenga un socket TCP. El estado que guarda Ryuk es una lista de conjuntos de filtros por conexión. El disparador es el mecanismo de detección de fallos más universal de la informática: un socket cerrado.

## El periodo de gracia y el temporizador de la muerte

Cuando se cierra la última conexión TCP, Ryuk no borra nada de inmediato. Arranca un temporizador, `RYUK_RECONNECTION_TIMEOUT`, de 10 segundos por defecto. Si llega una conexión nueva dentro de esa ventana, el temporizador se cancela y Ryuk sigue esperando, arrastrando los filtros de la conexión anterior y añadiendo los nuevos. Solo si nadie se reconecta se dispara el prune de verdad. Ese periodo de gracia es lo que evita que una desconexión breve se confunda con un test muerto.

El resto de los tiempos de Ryuk son un puñado de variables de entorno que probablemente no tocarás nunca:

| Variable | Por defecto | Qué controla |
| --- | --- | --- |
| `RYUK_RECONNECTION_TIMEOUT` | 10s | Periodo de gracia tras desconectarse el último cliente, antes de limpiar. |
| `RYUK_CONNECTION_TIMEOUT` | 60s | Cuánto espera Ryuk al primer cliente. Si nadie se conecta, se apaga. |
| `RYUK_SHUTDOWN_TIMEOUT` | 10m | Ante un `SIGTERM`, cuánto tiempo tienen los clientes conectados para irse antes de que Ryuk limpie de todos modos. |
| `RYUK_REMOVE_RETRIES` | 10 | Reintentos por recurso, con un segundo de separación. Un error "not found" cuenta como ya eliminado. |

Cuando la limpieza termina, Ryuk registra lo que se ha llevado:

```
msg=removed containers=0 networks=0 volumes=0 images=0
```

Todo ceros significa que el test terminó limpiamente y Testcontainers ya había eliminado todo por su cuenta. Distinto de cero significa que Ryuk tuvo que intervenir, y te dice cuánto había quedado huérfano. En ambos casos, el contenedor termina después.

El orden es fijo: contenedores, luego redes, luego volúmenes, luego imágenes. El comentario que hay sobre la función de prune solo dice: "Los contenedores deben eliminarse primero."

## La condición de carrera que gestiona Ryuk: "changes detected"

Hay una sutileza en Ryuk que es fácil pasar por alto: no borra a ciegas todo recurso que coincide con los filtros. También comprueba cuándo se creó cada recurso, y se niega a borrar nada que se haya creado después de que empezara el prune.

Este es el escenario del que protege. Supón que tu suite de tests termina y se desconecta de Ryuk. Empieza el periodo de gracia. A los nueve segundos, arranca *otra* suite de tests de la ejecución de CI de otra persona, y resulta que usa la misma estructura de labels (el mismo `org.testcontainers.reap=true`, solo que con otro `sessionId`). En el segundo 10, Ryuk ejecuta su prune. Le pregunta a Docker: "lista todos los contenedores con la label `org.testcontainers.reap=true`". La lista vuelve incluyendo los contenedores del segundo test, porque también tienen esa label.

Sin protección, Ryuk los borraría tan tranquilo. La segunda suite, que acaba de arrancar, perdería sus contenedores bajo los pies.

Lo que hace Ryuk en realidad es más cuidadoso. Cuando obtiene la lista de recursos coincidentes, comprueba la marca de tiempo de creación de cada uno. Si un recurso se creó después del momento en que empezó el prune (con un pequeño ajuste `RYUK_RETRY_OFFSET`, por defecto `-1s`, que según el comentario del código existe "para asegurar que no se eliminan recursos en uso"), Ryuk no lo borra. En su lugar registra "change detected, waiting again" y se reprograma para otra comprobación pasado `RYUK_CHANGES_RETRY_INTERVAL` (1 segundo por defecto). En la siguiente pasada, la lista de recursos puede haber cambiado: pueden haberse añadido recursos nuevos, y sus propietarios pueden haber eliminado otros antiguos. Ryuk sigue en bucle hasta que (a) la lista de recursos es estable, sin ningún recurso más joven que el límite, o (b) se alcanza el timeout de apagado y Ryuk hace un prune forzado de lo que quede.

Es una decisión conservadora. Cambia velocidad de limpieza por seguridad. En el caso común, donde no arranca ningún otro test a la vez, la primera pasada funciona y el prune se dispara de inmediato. En el caso disputado, donde varias ejecuciones de tests compiten a través del mismo Ryuk, las ejecuciones más lentas no ven sus recursos eliminados por las más rápidas.

Es también uno de esos mecanismos que son invisibles cuando funcionan y solo se vuelven legibles al mirar el código fuente. Si alguna vez has visto "change detected, waiting again" en los logs de Ryuk, has visto esto en acción. Es el sistema diciéndote que ha notado la carrera y se ha negado a jugar.

En la práctica, la biblioteca de Testcontainers limita un contenedor Ryuk al ID de sesión y busca un contenedor Ryuk existente con ese mismo ID de sesión antes de crear uno nuevo (mira `reuseOrCreate` y `lookupContainer` en el `reaper.go` de la biblioteca de Go). Así, varios procesos de test que comparten ID de sesión comparten un solo Ryuk, mientras que procesos de test distintos con IDs de sesión distintos tienen cada uno el suyo. En el caso común de un solo proceso, la contención es rara. El mecanismo está ahí para los casos en que no lo es, además de por la defensividad general de "no borres lo que no tengas que borrar".

## La cuestión del socket de Docker

Hasta aquí hemos descrito lo que hace Ryuk sin decir mucho sobre cómo borra en realidad. No tiene poderes especiales: habla con el daemon de Docker como cualquier otro cliente. El daemon escucha en un socket de dominio Unix, normalmente `/var/run/docker.sock`, y cualquiera que pueda escribir en ese socket puede hacer todo lo que hace la CLI `docker`.

Al ejecutar el contenedor de Ryuk, se monta dentro el socket de Docker del host:

```shell
docker run -v /var/run/docker.sock:/var/run/docker.sock testcontainers/ryuk:latest
```

Esta es la línea que permite a Ryuk borrar tus contenedores. Es también la línea a la que, en círculos de seguridad, cualquier ingeniero senior pondría mala cara. Cualquier cosa dentro de un contenedor con el socket de Docker montado tiene en la práctica acceso root al host, porque puede lanzar contenedores nuevos con privilegios arbitrarios, incluidos los que montan el sistema de ficheros del host. Ryuk no es una excepción. Si confías en que Ryuk corra, le estás confiando las llaves de tu máquina.

Hay dos cosas que decir al respecto. Primero, toda biblioteca de Testcontainers monta el socket de Docker en algún sitio, porque tus propios tests lo usan para crear contenedores. La biblioteca en la que confías para levantar Postgres en tus tests ya necesita ese acceso. Ryuk hereda el mismo nivel de confianza y no añade nada nuevo a tu superficie de amenaza. No estás introduciendo un privilegio nuevo; estás compartiendo el que ya existe.

Segundo, en el caso concreto de Ryuk, lo que corre dentro del contenedor es un pequeño binario de Go que hace una sola cosa: escuchar en un socket TCP, aceptar declaraciones de filtros y llamar a las APIs de borrado de Docker cuando salta un temporizador. La imagen se construye de forma reproducible, se etiqueta de forma inmutable y se mantiene como parte del ecosistema Testcontainers. La confianza aquí no es "confía en un contenedor cualquiera" sino "confía en que el proyecto Testcontainers mantenga una imagen pequeña, enfocada y auditada". Puedes leer el código, reconstruirla desde el repositorio público y fijar el hash de una imagen concreta si quieres ser extra cuidadoso.

Hay un matiz más que merece mención. En configuraciones Docker-in-Docker, donde tus tests corren dentro de un contenedor y ese contenedor intenta a su vez lanzar otros contenedores, hay dos daemons de Docker posibles: el daemon exterior del host y un daemon interior anidado. Testcontainers tiene que decidir con cuál debe hablar Ryuk, y tú también. La convención es que Ryuk y los contenedores de test compartan el mismo daemon, normalmente el del host. La biblioteca se encarga de descubrir el socket por ti. Casi nunca hace falta pensar en ello, salvo cuando algo está mal configurado y Ryuk habla con un Docker distinto del que usan tus tests. El síntoma es que tus tests funcionan bien, Ryuk funciona bien, y los huérfanos se siguen acumulando en el daemon equivocado. La solución es asegurarte de que Ryuk y Testcontainers ven el mismo socket. La documentación de Testcontainers indica las variables de entorno adecuadas para cada escenario.

Un último detalle: el contenedor de Ryuk no se borra a sí mismo, y la protección tiene dos capas. Cuando la biblioteca de Testcontainers crea el contenedor de Ryuk, le pone la label `org.testcontainers.ryuk=true` y le quita explícitamente la label `org.testcontainers.reap=true` (mira `newReaper` en el `reaper.go` de la biblioteca de Go). Así que el contenedor de Ryuk ya no coincidiría con el filtro estándar, porque no tiene la label `reap=true`. Como segunda línea de defensa, la pasada de limpieza del propio Ryuk se salta explícitamente cualquier contenedor con la label `org.testcontainers.ryuk=true`, sea cual sea el filtro que lo haya metido en la lista de candidatos. Cualquiera de las dos guardas bastaría; las dos juntas cierran el agujero del todo. El tipo de fallo de autoborrado que esto evita solo tiene gracia en retrospectiva.

## Por qué la imagen de Ryuk es tan pequeña

Hay una decisión de diseño en Ryuk que no aparece ni en el protocolo ni en las labels, pero que importa a todo el que usa Testcontainers en la práctica: la imagen es deliberadamente diminuta. El `Dockerfile` es un build multi-stage que compila Ryuk dentro de `golang:1.23-alpine3.22` y luego deja el binario resultante sobre `scratch`, la imagen base vacía. En la imagen final no hay shell, ni gestor de paquetes, ni sistema init. Solo está el bundle `ca-certificates.crt` (para que Ryuk pueda verificar conexiones TLS si alguna vez necesita llegar a un daemon de Docker por TLS), el propio binario de Ryuk y la línea `CMD ["/bin/ryuk"]`. Ese es todo el sistema de ficheros de la imagen.

El propio build de Go también va a dieta. El `Dockerfile` establece `CGO_ENABLED=0`, que produce un binario enlazado estáticamente, sin dependencia de glibc. El paso de enlazado usa `-ldflags="-w -s"`, que el comentario del `Dockerfile` explica como "omite la tabla de símbolos DWARF, la tabla de símbolos y la información de depuración". El build usa también `-trimpath`, documentado igualmente en el `Dockerfile` como "elimina todas las rutas del sistema de ficheros del ejecutable compilado". Son técnicas estándar para reducir binarios de Go.

Luego viene UPX. Tras el build de Go, el `Dockerfile` instala `upx` y ejecuta `upx --best --lzma /bin/ryuk`, que comprime el binario con el mejor ajuste LZMA disponible. UPX es una compresión autoextraíble para ejecutables: el binario comprimido, al ejecutarse, se descomprime a sí mismo en memoria antes de ejecutar el código real. El comentario del `Dockerfile` en este paso señala el compromiso como "menor tamaño frente a tiempo de arranque", sin especificar magnitudes. Una excepción vive en un condicional del `Dockerfile`: UPX se omite en la arquitectura s390x, que UPX no soporta; el resto de arquitecturas (amd64, arm64) sí recibe la compresión.

Si miras el manifest real de `testcontainers/ryuk:latest` en el registry para una sola arquitectura, el tamaño total comprimido de la descarga ronda unos pocos megabytes (alrededor de 5 MB repartidos en tres capas).

Por qué importa. La imagen de Ryuk se descarga en cada runner de CI en cada job nuevo, en cada portátil de desarrollo, en cada configuración Docker-in-Docker, en cada proceso de test en paralelo que no la tenga ya en caché. Una imagen más pequeña significa una descarga más pequeña, menos almacenamiento en la caché local de imágenes de cada runner y menos carga en el registry que la aloje. A escala de un solo test, el ahorro es imperceptible; a escala de una flota de CI, se acumula.

Un detalle pequeño que merece señalarse: la imagen declara su propia identidad. El `Dockerfile` termina con `LABEL org.testcontainers.ryuk=true`, lo que significa que todo contenedor arrancado desde esta imagen hereda esa label por defecto. La biblioteca de Testcontainers también pone la misma label de forma explícita al crear el contenedor de Ryuk, así que la protección contra el autoborrado (que vimos en la sección anterior) es doblemente redundante: la label está en la propia imagen, y quien lanza el contenedor la vuelve a poner al crearlo. Si quien lo lanza se olvida alguna vez de ponerla, Ryuk sigue estando bien etiquetado.

## Cuándo desactivarías Ryuk (y cuándo no deberías hacerlo jamás)

Las bibliotecas de Testcontainers ofrecen una válvula de escape: una variable de entorno que desactiva Ryuk por completo. Con `TESTCONTAINERS_RYUK_DISABLED=true`, la biblioteca no arranca Ryuk, no se conecta a él y no pone la label `org.testcontainers.reap=true` en ningún recurso. Tus contenedores de test se crearán con normalidad, pero nada externo los limpiará si muere tu proceso de tests.

Hay un detalle que notar. Con Ryuk activado, todo recurso recibe `reap=true`. Con Ryuk desactivado, esa label se omite. No es solo contabilidad. Aunque un Ryuk en algún lugar del sistema intentara limpiar, los recursos de una ejecución "sin Ryuk" no coincidirían con ningún filtro basado en reap, así que estarían a salvo. El opt-in es explícito, por el hecho de que la label esté presente. Es un diseño limpio: Ryuk solo toca lo que ha declarado explícitamente que se puede limpiar.

Hay exactamente un caso de uso legítimo para desactivar Ryuk. Es el desarrollo local con hot reload. Si escribes código de aplicación con una herramienta como `air` (Go) o `nodemon` (Node) que reinicia tu proceso cada vez que guardas un fichero, y tu proceso de desarrollo también arranca Testcontainers (porque el mismo camino de código corre en local y en los tests), Ryuk borrará con toda diligencia tu base de datos de desarrollo cada vez que guardes. Cada guardado, un contenedor Postgres nuevo, sin estado que se mantenga, sin iteración rápida. Es un suplicio, y desactivar Ryuk lo soluciona. Le das a la base de datos de desarrollo un nombre estable, dejas que sobreviva a los reinicios y la limpias a mano cuando terminas. El precio que pagas es acordarte de limpiar. El que no pagas es empezar de cero con cada guardado.

Eso es todo. Ese es el caso de uso legítimo. Todo lo demás es pegarte un tiro en el pie.

El motivo malo más común para desactivar Ryuk es "hacer el CI más rápido". El argumento es este: Ryuk tarda un poco en arrancar y se queda ahí durante la ejecución de los tests, así que si mis tests siempre limpian bien, para qué molestarse. La respuesta es que el día en que un test no limpia bien es justo el día en que necesitas Ryuk. Desactivarlo elimina lo único que atrapa el fallo para el que existe.

La regla que le cuento a la gente: nunca desactives Ryuk en CI. En desarrollo local con hot reload, vale. Sé específico con la variable de entorno que configuras, y configúrala solo para el flujo de desarrollo, no para tu comando de tests.

## La lección: el deadman switch como patrón de limpieza

El diseño de Ryuk merece pensarse como patrón general, más allá de Testcontainers.

La forma es esta: un proceso posee recursos externos; el proceso puede morir de maneras que le impiden limpiar; un observador externo es lo único en lo que se puede confiar para limpiar. El observador no necesita saber qué trabajo hacía el proceso. Solo necesita saber qué recursos se reclamaron y cómo liberarlos. El contrato entre el proceso y el observador es un heartbeat, normalmente una conexión mantenida o un ping periódico, y la ausencia del heartbeat es el disparador de la limpieza.

Verás esta forma en todas partes cuando empieces a buscarla. Las sesiones de navegador caducan cuando se detiene el heartbeat del cliente, liberando licencias de puesto y conexiones de base de datos. Los nodos de Kubernetes se declaran no saludables cuando su kubelet deja de dar señales, y los pods que corrían en ellos se reprograman. Los agentes SSH descartan solos las credenciales reenviadas cuando se cae la conexión. Los timeouts de sesión de las bases de datos liberan locks y revierten las transacciones sin confirmar cuando un cliente desaparece. Los edificios de apartamentos tienen cerraduras automáticas que se activan cuando quien tiene la llave lleva un rato sin fichar. El deadman switch es uno de los patrones más antiguos de la ingeniería de seguridad, anterior a la informática en un siglo.

Lo que Ryuk demuestra es que este patrón funciona a la granularidad de una ejecución de tests. Las ejecuciones de tests viven poco y fallan mucho, y crean infraestructura real que hay que desmontar termine la ejecución con elegancia o no. Cualquiera que construya herramientas para entornos efímeros (entornos de preview, entornos de desarrollo, pipelines de CI, infraestructuras de sandbox) acaba redescubriéndolo. El socorrista siempre es más fiable que el nadador.

Lo bonito de Ryuk en concreto es lo pequeño que es. Menos de mil líneas de Go de producción, un único socket TCP, un protocolo minúsculo, un conjunto de labels. Las funciones que ha ido acumulando (el handshake ACK, la protección de carrera de changes-detected, el bucle de reintentos en cada borrado individual) son todas defensivas: hacen más robusto el mismo trabajo único, no más amplio.

La próxima vez que veas la imagen `testcontainers/ryuk` en tu `docker ps`, sabrás qué es. El segador, sentado a un lado, esperando a que la línea se quede muerta.

---

*Recursos:*
- *[Código fuente de Ryuk (moby-ryuk)](https://github.com/testcontainers/moby-ryuk)*
- *[Documentación de Ryuk en Testcontainers](https://golang.testcontainers.org/features/garbage_collector/)*
- *[Repositorio testcontainers-go](https://github.com/testcontainers/testcontainers-go)*
- *[Death Note (el manga del que viene el nombre de Ryuk)](https://en.wikipedia.org/wiki/Ryuk_(Death_Note))*
