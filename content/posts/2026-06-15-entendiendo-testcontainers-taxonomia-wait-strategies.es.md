---
title: "Entendiendo Testcontainers: la taxonomía de las wait strategies"
date: 2026-06-15 09:00:00 +0200
description: "Todas las wait strategies que incluye testcontainers-go, cómo las engancha el motor con un único hook de ciclo de vida PostStarts y las cuatro opciones funcionales para añadirlas a una petición. Leído directamente del código fuente."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "wait-strategies"]
type: post
weight: 30
translationKey: understanding-testcontainers-wait-strategies
translatedFrom: 82c3542
---

![Entendiendo Testcontainers: la taxonomía de las wait strategies](/images/posts/2026-06-15-understanding-testcontainers-wait-strategies/cover.png)

Soy uno de los maintainers principales de [testcontainers-go](https://github.com/testcontainers/testcontainers-go). El [primer post de esta serie](/es/posts/2026-06-10-entendiendo-testcontainers-genericcontainer-opciones-funcionales/) terminaba con un adelanto: cómo decide la librería que un contenedor está "listo" una vez arrancado. Resulta ser una pregunta sorprendentemente distinta de "¿está en marcha?". La primera mitad es fácil. En marcha significa que Docker dice que el contenedor está en marcha, ni más ni menos. En la segunda mitad vive cada test de integración interesante. Postgres puede ser un contenedor en marcha durante varios segundos antes de aceptar una conexión. Kafka puede serlo durante decenas de segundos antes de haber elegido un líder. Y una aplicación puede ser un contenedor en marcha para siempre sin devolver nunca una sola respuesta correcta en `/health`.

La librería responde a todo esto con una interfaz y una carpeta de implementaciones. La carpeta es `wait/`. La interfaz es `Strategy`, con un único método: `WaitUntilReady(ctx, target) error`. Este post es un recorrido por todas las estrategias de esa carpeta, por cómo las enchufa el motor (un hook de ciclo de vida, quince líneas) y por las cuatro opciones funcionales que expone la API pública para añadirlas a una petición.

## El contrato: una interfaz, dos helpers

Todo el paquete cuelga de dos interfaces. La primera es `Strategy`:

```go
type Strategy interface {
    WaitUntilReady(context.Context, StrategyTarget) error
}
```

Todas las estrategias del paquete, y cualquiera que escribas tú, implementan ese único método. La segunda interfaz es `StrategyTimeout`, opcional, que usan las estrategias compuestas para proyectar timeouts por cada hijo:

```go
type StrategyTimeout interface {
    Timeout() *time.Duration
}
```

El argumento que recibe cada `WaitUntilReady` es un `StrategyTarget`, que es simplemente la superficie que la estrategia puede usar sobre el contenedor que está sondeando. Expone `Host`, `Inspect`, `MappedPort`, `Logs`, `Exec`, `State` y `CopyFileFromContainer`, además de un método `Ports` que, según el comentario del código fuente, está deprecado y redirige a `Inspect`. Esa es la API con la que trabaja cada estrategia.

En el mismo fichero hay un pequeño helper de comprobación previa, `checkTarget`, que cualquier estrategia puede llamar antes de cada sondeo:

```go
func checkState(state *container.State) error {
    switch {
    case state.Running:
        return nil
    case state.OOMKilled:
        return errors.New("container crashed with out-of-memory (OOMKilled)")
    case state.Status == container.StateExited:
        return fmt.Errorf("container exited with code %d", state.ExitCode)
    default:
        return fmt.Errorf("unexpected container status %q", state.Status)
    }
}
```

La función lee el estado del contenedor y falla rápido si está `OOMKilled` o `Exited`. Con eso, ninguna estrategia tiene que volver a preguntarse si el contenedor sigue vivo antes de cada sondeo. Llaman a `checkTarget` al principio de cada iteración del bucle y se fían de él.

Otros dos helpers del paquete fijan los valores por defecto universales: `defaultStartupTimeout()` devuelve 60 segundos y `defaultPollInterval()` devuelve 100 milisegundos. Todas las estrategias de las que hablo en este post heredan esos valores, salvo que los cambies con `WithStartupTimeout` o `WithPollInterval`. Esa uniformidad es la razón de que el paquete resulte tan coherente: el modelo de tiempos es el mismo en todas partes y lo único que cambia entre estrategias es qué cuenta como un sondeo exitoso.

## Dónde engancha el motor la estrategia

El cableado en el lado del motor es mucho más pequeño de lo que esperaba la primera vez que lo leí. No hay ningún "motor de espera" especial. La estrategia es simplemente un hook de ciclo de vida `PostStarts`. El hook es `defaultReadinessHook`:

```go
var defaultReadinessHook = func() ContainerLifecycleHooks {
    return ContainerLifecycleHooks{
        PostStarts: []ContainerHook{
            func(ctx context.Context, c Container) error {
                dockerContainer := c.(*DockerContainer)

                if dockerContainer.WaitingFor != nil {
                    strategy := dockerContainer.WaitingFor
                    strategyDesc := "unknown strategy"
                    if s, ok := strategy.(fmt.Stringer); ok {
                        strategyDesc = s.String()
                    }
                    dockerContainer.logger.Printf(
                        "⏳ Waiting for container id %s image: %s. Waiting for: %+v",
                        dockerContainer.ID[:12], dockerContainer.Image, strategyDesc,
                    )
                    if err := strategy.WaitUntilReady(ctx, dockerContainer); err != nil {
                        return fmt.Errorf("wait until ready: %w", err)
                    }
                }

                dockerContainer.isRunning.Store(true)

                return nil
            },
        },
    }
}
```

Quince líneas. El hook comprueba si `WaitingFor` está definido en el contenedor, escribe en el log la descripción que devuelve el `String()` de la estrategia, llama a `WaitUntilReady` y solo si todo va bien ejecuta `isRunning.Store(true)`. Ese único `Store` es el punto donde "Docker dice que el contenedor está en marcha" y "la librería dice que el contenedor está listo" se convierten en dos cosas distintas. Dentro del motor, `isRunning` solo es true cuando la estrategia devuelve nil.

Por eso mismo todas las estrategias de `wait/` implementan `fmt.Stringer`. El motor escribe esa cadena en el log antes de esperar. No es decoración.

El hook se registra automáticamente dentro de `CreateContainer`, junto con el resto de hooks de ciclo de vida por defecto:

```go
defaultHooks = append(defaultHooks,
    defaultPreCreateHook(p, dockerInput, hostConfig, networkingConfig),
    defaultCopyFileToContainerHook(req.Files),
    defaultLogConsumersHook(req.LogConsumerCfg),
    defaultReadinessHook(),
)
```

En tu código no hace falta nada más. La capa de readiness va montada sobre la maquinaria de hooks de ciclo de vida que ya existía.

Este diseño tiene una consecuencia que sorprende a mucha gente, y merece destacarse. Si `WaitingFor` es nil, todo el hook no hace nada. No hay comprobación de puerto por defecto. No hay sondeo de logs por defecto. El contenedor se devuelve al test en el mismo instante en que Docker informa de que ha arrancado. Para cualquier cosa que exponga un servicio de red, rara vez es lo que quieres.

## Cuatro formas de enchufar una

La librería expone cuatro opciones funcionales para asociar una wait strategy a una petición:

```go
func WithWaitStrategy(strategies ...wait.Strategy) CustomizeRequestOption
func WithAdditionalWaitStrategy(strategies ...wait.Strategy) CustomizeRequestOption
func WithWaitStrategyAndDeadline(deadline time.Duration, strategies ...wait.Strategy) CustomizeRequestOption
func WithAdditionalWaitStrategyAndDeadline(deadline time.Duration, strategies ...wait.Strategy) CustomizeRequestOption
```

El patrón sigue la convención del prefijo `Additional` que vimos en el [post 1](/es/posts/2026-06-10-entendiendo-testcontainers-genericcontainer-opciones-funcionales/): la forma base reemplaza, y la forma `WithAdditional...` añade a lo que ya hubiera en `req.WaitingFor`. Las variantes con sufijo de deadline permiten cambiar el deadline por defecto de 60 segundos. Las que no lo llevan lo dejan en 60 segundos.

Lo que merece la pena saber es qué hacen estas opciones por dentro. Las cuatro envuelven las estrategias en `wait.ForAll(strategies...).WithDeadline(deadline)`. Así que incluso cuando pasas una sola estrategia:

```go
testcontainers.WithWaitStrategy(wait.ForListeningPort("5432/tcp"))
```

lo que acaba en `req.WaitingFor` es un `*MultiStrategy` con un hijo, no el `*HostPortStrategy` a secas. El envoltorio es consistente en toda la superficie de la API, y eso hace que el tratamiento en el motor sea uniforme: siempre ve una única estrategia raíz, y esa raíz sabe aplanarse o repartirse por dentro.

También puedes asignar `WaitingFor` directamente en `ContainerRequest` cuando usas `GenericContainer`. Ese camino se salta el envoltorio. Mismo campo, distinto alcance.

## Basada en logs: `ForLog`

La estrategia más barata es `ForLog`. La forma por defecto cuenta subcadenas: en cada intervalo lee el stream completo de logs del contenedor y busca la cadena literal que le has pasado.

```go
wait.ForLog("database system is ready to accept connections")
```

Si añades `.AsRegexp()`, la coincidencia pasa a ser una expresión regular. `.WithOccurrence(n)` exige N coincidencias antes de dar el contenedor por listo, útil para procesos que imprimen la misma línea de readiness una vez por shard. La opción más quirúrgica es `.Submatch(cb)`, que llama a un callback con los submatches de la regex. Ese callback también puede devolver un `*PermanentError` para abortar la espera de inmediato en lugar de seguir sondeando hasta el timeout. Es la única vía de escape de la estrategia al "sigue reintentando hasta el deadline".

El bucle de sondeo lee el stream completo de logs en cada tick. Es intencionado, pero no es gratis: en contenedores de larga duración con mucha salida, cada sondeo vuelve a leer todo lo emitido desde el arranque. Para evitar un bucle infinito con un contenedor muerto que ya no produce logs, la estrategia corta cuando la longitud del buffer leído no ha cambiado desde el sondeo anterior y la comprobación previa falla. Si el log está congelado y el contenedor ya no existe, la estrategia devuelve el error de la comprobación previa en vez de esperar al deadline.

`ForLog` tienta porque una sola línea de salida suele ser la señal de "estoy listo" más explícita que da un contenedor. El problema es que las cadenas de log cambian. Una futura versión menor de Postgres podría reformular "database system is ready to accept connections", y todos los tests que esperaban ese log empezarían a fallar de forma intermitente sin avisar. Los puertos de escucha rara vez cambian entre versiones menores de la misma imagen. Las líneas de log, a menudo sí. La recomendación de la librería, y la mía, es no usar `ForLog` solo. Prefiere `ForListeningPort` (o `ForExposedPort` / `ForMappedPort`) como señal principal, y recurre a `ForLog` o bien dentro de un compuesto `ForAll` junto a una comprobación de puerto (el puerto confirma que el socket está abierto y el log añade una garantía extra), o bien como último recurso cuando el contenedor no tiene ningún puerto que sondear.

## Basada en puertos: `ForListeningPort`, `ForExposedPort`, `ForMappedPort`

Para cualquier cosa que exponga un servicio de red, usas las estrategias de puerto del host. Hay tres constructores:

```go
wait.ForListeningPort("5432/tcp") // wait for a specific port to be listening
wait.ForExposedPort()             // pick the lowest exposed port, wait for it
wait.ForMappedPort("5432/tcp")    // only wait for the port to be mapped, no probe
```

Lo interesante de esta estrategia es que hace dos comprobaciones. La primera es la **comprobación externa**: el proceso del test se conecta directamente al puerto mapeado en el host. La segunda es la **comprobación interna**: ejecuta con exec un pequeño comando de shell dentro del contenedor para preguntarle al kernel y a la red si hay algo escuchando de verdad. Merece la pena echarle un vistazo al comando, porque es un triple fallback pensado para Unix portables:

```sh
cat /proc/net/tcp* | awk '{print $2}' | grep -i :%04x ||
nc -vz -w 1 localhost %d ||
/bin/sh -c '</dev/tcp/localhost/%d'
```

Si `/proc/net/tcp` no se puede leer, prueba con `nc`. Si no hay `nc`, prueba con la redirección `/dev/tcp` de bash. Casi siempre funciona alguno de los tres.

La estrategia da el éxito cuando pasan las dos comprobaciones. `SkipInternalCheck` / `SkipExternalCheck` permiten descartar una de ellas. `ForMappedPort` es un atajo que aplica los dos skips, y deja como única condición de éxito que Docker haya terminado de enlazar el puerto del host.

Hay una degradación elegante que conviene conocer: si la comprobación interna devuelve el código de salida 126 (hay shell, pero no es ejecutable) o 127 (no hay shell), la estrategia escribe un warning y se queda solo con la comprobación externa. Las imágenes distroless y las que no traen busybox no se tratan como un fallo. Simplemente pierden la segunda capa de sondeo.

## Salud a nivel de aplicación: `ForHTTP`, `ForHealthCheck`, `ForExec`, `ForSQL`

Este es un grupo de cuatro, cada una con un sondeo distinto.

**`ForHTTP`** es la estrategia con más superficie del paquete. Construye una petición HTTP real y la lanza en cada tick. Por defecto usa GET, un código de estado 200 como condición de éxito y detección automática del puerto TCP expuesto más bajo cuando no indicas ninguno. El comentario del constructor en el código fuente menciona el puerto 80, pero el código inicializa el puerto a su valor cero y siempre cae en la rama de autodetección salvo que `WithPort` haya asignado uno. Todo lo demás es configurable: `WithStatusCodeMatcher(func(int) bool)` para un predicado propio, `WithResponseMatcher(func(io.Reader) bool)` para inspeccionar el cuerpo, `WithResponseHeadersMatcher(func(http.Header) bool)` para las cabeceras, `WithBasicAuth`, `WithMethod`, `WithBody`, `WithHeaders` y `WithTLS(true, &tls.Config{...})` para HTTPS. También hay `WithAllowInsecure(true)` para certificados autofirmados y `WithForcedIPv4LocalHost()` para los problemas de IPv6 de moby/moby que enlaza el propio código fuente: [moby/moby#42442](https://github.com/moby/moby/issues/42442) y [moby/moby#42375](https://github.com/moby/moby/issues/42375).

Cuando no hay puerto definido, la estrategia inspecciona el contenedor y elige el puerto TCP expuesto de número más bajo. He tirado de este valor por defecto muchísimas veces. Es una cosa menos que mantener sincronizada entre el chart y el test.

**`ForHealthCheck`** es la más perezosa de las cuatro, y lo digo como un cumplido. La directiva `HEALTHCHECK` de la imagen hace todo el sondeo. La estrategia solo consulta `state.Health.Status` y espera a que pase a `container.Healthy`. Cero trabajo para la librería. Si el autor de la imagen escribió un buen healthcheck, deberías usarlo. Si no lo hizo, esta estrategia se quedará colgada en `container.Starting` para siempre.

**`ForExec`** es la vía de escape universal. Ejecuta un comando arbitrario dentro del contenedor y espera un código de salida concreto, 0 por defecto:

```go
wait.ForExec([]string{"pg_isready", "-U", "postgres"})
```

El matcher de código de salida por defecto es igualdad exacta con cero. Usa `WithExitCode(n)` para un valor concreto distinto de cero, `WithExitCodeMatcher(func(int) bool)` para un predicado y `WithResponseMatcher(func(io.Reader) bool)` para inspeccionar también stdout/stderr. Cuando ninguna otra estrategia encaja con la condición real de readiness del contenedor, casi siempre encaja `ForExec`.

**`ForSQL`** es el primo de `ForExec` especializado en SQL. Abre una conexión `database/sql` a través de un constructor de DSN que le pasa quien llama, le hace ping y ejecuta una consulta de sondeo (`SELECT 1` por defecto, se cambia con `WithQuery`). La firma cambió [hace unos días](https://github.com/testcontainers/testcontainers-go/pull/3650): el constructor de DSN ahora recibe `network.Port` en lugar de `string`, así quien llama puede sacar la forma que realmente necesita sin volver a parsear.

La llamada canónica para Postgres, sacada de los propios tests del módulo:

```go
port := "5432/tcp"
dbURL := func(host string, p network.Port) string {
    return fmt.Sprintf("postgres://postgres:password@%s:%s/%s?sslmode=disable", host, p.Port(), dbname)
}

wait.ForSQL(port, "postgres", dbURL)
```

`p.Port()` devuelve la cadena numérica a secas, `p.Proto()` el protocolo y `p.String()` la forma canónica `"5432/tcp"`. Lo que pida el formato de URL del driver.

El hilo común de estas cuatro: en todas es la propia aplicación quien responde "estoy lista". Sin rascar logs ni tantear puertos. Una conversación real del protocolo.

## Las dos raras: `ForFile` y `ForExit`

Hay dos estrategias en el paquete que solo tienen sentido si le das la vuelta al modelo mental habitual de "listo significa vivo y aceptando tráfico".

**`ForFile`** espera a que aparezca un fichero dentro del contenedor. El bucle de sondeo llama a `target.CopyFileFromContainer` y trata cualquier `errdefs.IsNotFound` como "sigue esperando". Cualquier otra cosa es un fallo. Si añades `.WithMatcher(func(io.Reader) error)`, también puedes validar el contenido: el matcher puede devolver él mismo `errdefs.ErrNotFound` para seguir sondeando, o cualquier otro error para fallar. El caso de uso son los contenedores que señalan que están listos escribiendo un fichero marcador, habitual en scripts de arranque de clusters y en algunas cargas de CI a medida.

**`ForExit`** es la inversa de todas las demás estrategias de este post. Espera a que el contenedor **deje de ejecutarse**. El constructor por defecto no tiene ningún timeout, y solo `WithExitTimeout` añade uno. Está pensada para contenedores de un solo uso, las migraciones y los cargadores de fixtures, que tienen éxito al terminar. Para ellos, "en marcha" significa "todavía trabajando" y "listo" significa "terminado".

Las dos nos recuerdan que "listo" es un contrato, no una condición fija. A veces el contrato es "hay un fichero en disco". A veces es "el proceso ha terminado limpiamente".

## La vía de escape: `ForNop`

El paquete expone una pequeña pieza de infraestructura para los casos en que ninguna estrategia incluida encaja. `ForNop` envuelve un closure cualquiera como un `Strategy`:

```go
wait.ForNop(func(ctx context.Context, target wait.StrategyTarget) error {
    // your custom readiness check here
    return nil
})
```

Sin helpers de timeout, sin builders fluidos, sin bucle de sondeo. Solo tu función, tal cual la escribiste.

El paquete también exporta `NopStrategyTarget`, una implementación de `StrategyTarget` que devuelve valores cero. Su único propósito es probar estrategias propias de forma aislada. Si escribes tu propio `Strategy` y quieres un test que no requiera un contenedor real, esta es la semilla.

No elegiría `ForNop` como primera opción. Las estrategias incluidas cubren casi todo, y comparten el mismo modelo de tiempos y la misma comprobación previa. Pero está bien saber que la puerta existe.

## Composición AND: `ForAll` y `MultiStrategy`

La mayoría de las condiciones de readiness no triviales no son un sondeo único, sino una combinación. `ForAll(s1, s2, ...)` devuelve un `*MultiStrategy`. Su `WaitUntilReady` ejecuta cada hijo en secuencia. Tiene éxito si todos los hijos devuelven nil. El fallo de cualquier hijo se propaga de inmediato.

Hay dos controles de timeout:

- `WithStartupTimeoutDefault(d)` fija un valor por defecto por estrategia, que solo se aplica a los hijos que no declaran su propio `Timeout()`.
- `WithDeadline(d)` es un tope de tiempo real que envuelve toda la llamada del compuesto en un `context.WithTimeout`. Sustituye al antiguo `WithStartupTimeout`, que ahora está deprecado pero sigue redirigiendo a `WithDeadline`.

Hay una protección contra nil pequeña pero importante: cualquier hijo nil en el slice `Strategies` se ignora en silencio. Gracias a eso, un módulo puede construir una estrategia por piezas, dejando posiblemente huecos vacíos hasta que opciones posteriores de personalización del contenedor los rellenen, sin preocuparse de un panic por `nil` en el bucle de poda.

El uso canónico es "puerto abierto y línea de log aparecida". El módulo de Postgres es el ejemplo de manual: compone `ForListeningPort` con `ForLog("database system is ready to accept connections")` y los ejecuta en ese orden. Encontrarás formas parecidas por todo el directorio de módulos. El mismo patrón aparece en el [post de GoFiber](/posts/2025-05-27-gofiber-services-testcontainers) y en el caso práctico de módulo de [Subscriptions: From Idea to Testcontainers Module](/es/posts/2026-03-16-suscripciones-de-la-idea-al-modulo-testcontainers/).

## Estrategias en carrera: `ForAny` y `AnyMultiStrategy`

Esta es la pieza más reciente del paquete. `ForAny` y `AnyMultiStrategy` se añadieron [en la PR #3719](https://github.com/testcontainers/testcontainers-go/pull/3719), integrada hace un par de días. `ForAny(s1, s2, ...)` devuelve un `*AnyMultiStrategy`, el hermano con forma de OR de `ForAll`. Su mecánica se diferencia de `ForAll` en dos cosas que importan.

Primera, los hijos se ejecutan en paralelo. Cada estrategia tiene su propia goroutine:

```go
go func() { resCh <- strategy.WaitUntilReady(strategyCtx, target) }()
```

Segunda, el compuesto cancela todo en cuanto llega el primer resultado. El contexto se prepara al principio de `WaitUntilReady` con `context.WithCancel` y un cancel diferido, de modo que cuando un hijo gana, la cancelación se propaga al resto. Estos observan `ctx.Done()` y retornan.

La condición de éxito es "el primer hijo devuelve nil". La condición de fallo también es "el primer hijo devuelve un error". El código fuente lo deja por escrito:

```go
// Failures are not permitted: any strategy which fails will have its error
// immediately returned.
```

Esa no es la semántica de `Promise.any` en JavaScript, que solo falla cuando fallan todas las alternativas. `ForAny` se parece más a una carrera al primer resultado, y la carrera cuenta tanto los éxitos como los errores. Conviene tenerlo claro antes de usarla.

Para ponerlas lado a lado:

| | `ForAll` | `ForAny` |
|---|----------|----------|
| Composición | AND | carrera al primer resultado |
| Orden | secuencial | goroutines en paralelo |
| Éxito | todos los hijos devuelven nil | el primer hijo devuelve nil |
| Fallo | cualquier hijo devuelve un error | cualquier hijo devuelve un error |

Un caso de uso que lo motiva es un contenedor con varias señales de readiness donde basta con cualquiera: un proceso que imprime una de dos líneas de log según la variante de la imagen, por ejemplo, o un servidor que acepta tanto un sondeo TCP como un endpoint HTTP de salud y te da igual cuál responda antes. `ForAny` te deja expresarlo sin escribir un closure `ForNop` a medida.

## Recorriendo el árbol: `wait.Walk`

La última pieza es una meta-herramienta que la mayoría de quienes desarrollan aplicaciones no usarán nunca, pero que quienes escriben módulos deberían conocer. El paquete expone `Walk(root *Strategy, visit VisitFunc) error`, un recorrido sobre un árbol de estrategias:

```go
func Walk(root *Strategy, visit VisitFunc) error
```

La función de visita devuelve `nil` (continuar), `ErrVisitStop` (detener el recorrido) o `ErrVisitRemove` (eliminar el nodo actual y continuar). La implementación recurre dentro de los compuestos con un type switch sobre `(*root).(type)` que cubre tanto `*MultiStrategy` como `*AnyMultiStrategy`, y la recursión en sí vive en un helper compartido, `walkAndMutate`, que gestiona `ErrVisitRemove` quitando el nodo con `slices.Delete`. El recorrido es uniforme en los dos compuestos: lo hayas compuesto con `ForAll` o con `ForAny`, `Walk` visita cada nodo de la misma manera.

Esto existe para los módulos que necesitan modificar con precisión una estrategia heredada. Imagina un módulo de Postgres que por defecto usa `ForAll(ForListeningPort, ForLog)`, y alguien que quiere conservar el sondeo del puerto pero cambiar la línea de log por la suya. Recorrer el árbol, encontrar la estrategia de log, quitarla (y añadir después un reemplazo) es el camino que la API fomenta.

## Elegir una

Usa una estrategia de puerto para cualquier cosa que dé servicio por red. Usa `ForHTTP` o `ForSQL` cuando la aplicación hable un protocolo que puedas probar directamente. Usa `ForHealthCheck` cuando el autor de la imagen ya te haya dejado escrita una directiva `HEALTHCHECK`. Usa `ForExec` cuando nada de lo anterior encaje y puedas expresar la readiness como el código de salida de un comando. Usa `ForFile` para flujos con fichero marcador y `ForExit` solo para contenedores de un solo uso, donde terminar es el objetivo. Usa `ForLog` solo dentro de un compuesto `ForAll` junto a una señal más fuerte, o como último recurso cuando no hay nada más que sondear. Deja `ForNop` para el final: las estrategias incluidas cubren casi todo.

Para condiciones compuestas en las que deben cumplirse todas las señales, compón con `ForAll`. Para condiciones en las que basta con una de varias, compón con `ForAny`. El envoltorio que pone el motor es el mismo en ambos casos: una única estrategia raíz, recorrida por un único hook.

## Cierre

Once tipos de estrategia (Log, HostPort, HTTP, Health, Exec, SQL, File, Exit, Nop, MultiStrategy / ForAll, AnyMultiStrategy / ForAny), una interfaz diminuta, una comprobación previa compartida, una pareja de valores por defecto universales (60 s, 100 ms), cuatro opciones funcionales y una utilidad de recorrido de árbol. Todo conectado al motor por un único hook `PostStarts` de quince líneas que cambia un booleano atómico cuando la estrategia devuelve nil.

Toda la capa de readiness va montada sobre la misma maquinaria de hooks de ciclo de vida que usan los hooks `PreStarts`, `PostStarts`, `PreTerminates` y `PostTerminates` que defines tú. Y de eso va el próximo post de la serie.

---

*Recursos:*
- *[testcontainers-go en GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[Código fuente del paquete `wait/`](https://github.com/testcontainers/testcontainers-go/tree/main/wait)*
- *[Documentación de las wait strategies de Testcontainers](https://golang.testcontainers.org/features/wait/introduction/)*
- *[Documentación de las estrategias Wait, All](https://golang.testcontainers.org/features/wait/all/)*
- *[Documentación de las estrategias Wait, Any](https://golang.testcontainers.org/features/wait/any/)*
