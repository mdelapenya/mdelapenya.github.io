---
title: "Entendiendo Testcontainers: el sistema de lifecycle hooks"
date: 2026-06-19 09:00:00 +0200
description: "Toda la funcionalidad de la biblioteca, desde copiar ficheros hasta las wait strategies y los log consumers, está implementada como lifecycle hooks. Dos tipos de función, once etapas, cinco hooks por defecto y el dispatch que los une. Leído directamente de lifecycle.go."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "lifecycle-hooks"]
type: post
weight: 30
translationKey: understanding-testcontainers-lifecycle-hooks
translatedFrom: 9afa5c3
---

![Entendiendo Testcontainers: el sistema de lifecycle hooks](/images/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks/cover.png)

Soy uno de los mantenedores principales de [testcontainers-go](https://github.com/testcontainers/testcontainers-go). El [segundo post de esta serie](/es/posts/2026-06-15-entendiendo-testcontainers-taxonomia-wait-strategies/) terminaba con un avance: la wait strategy no es más que un lifecycle hook `PostStarts`. Igual que el streamer que envía los logs del contenedor a tus consumers. Igual que el copiador de ficheros que mete tus fixtures de test dentro del contenedor. Igual que el simpático logger con emojis que anuncia "🐳 Creating container" y "✅ Container started" en cada ejecución. La funcionalidad de la biblioteca es, casi por completo, un conjunto de lifecycle hooks instalados en el momento justo.

Este post es el recorrido completo. Dos tipos de función hook, once etapas, el dispatch que las dispara y los cinco hooks por defecto que se instalan en cada contenedor. Al terminar deberías poder señalar cualquier comportamiento por defecto ("¿cómo copia `Files` los ficheros?", "¿cómo arranca el log consumer?") y saber qué hook lo implementa.

## Dos tipos de función hook

Ambos tipos están definidos en `lifecycle.go`, junto al struct que los agrupa. El primero es `ContainerRequestHook`:

```go
type ContainerRequestHook func(ctx context.Context, req ContainerRequest) error
```

Este se ejecuta cuando todavía no hay contenedor, solo una request. Puede modificarla antes de que el motor se la pase a Docker.

El segundo es `ContainerHook`:

```go
type ContainerHook func(ctx context.Context, ctr Container) error
```

Este se ejecuta después de que `Docker.ContainerCreate` haya devuelto un ID de contenedor real. El hook trabaja sobre el `Container` vivo: puede leer su estado, ejecutar comandos dentro, copiarle ficheros, etcétera.

La separación existe porque el input es distinto a cada lado de `Create`. Antes de crear, tienes una request que puedes cambiar. Después, la request queda congelada y lo que tienes es un handle al contenedor.

## El struct ContainerLifecycleHooks

Once slices con nombre en un solo struct:

```go
type ContainerLifecycleHooks struct {
    PreBuilds      []ContainerRequestHook
    PostBuilds     []ContainerRequestHook
    PreCreates     []ContainerRequestHook
    PostCreates    []ContainerHook
    PreStarts      []ContainerHook
    PostStarts     []ContainerHook
    PostReadies    []ContainerHook
    PreStops       []ContainerHook
    PostStops      []ContainerHook
    PreTerminates  []ContainerHook
    PostTerminates []ContainerHook
}
```

Tres de las slices contienen `ContainerRequestHook`: `PreBuilds`, `PostBuilds` y `PreCreates`. Las otras ocho contienen `ContainerHook`. Fíjate en la asimetría alrededor de `Create`: `PostCreates` es un `ContainerHook`, no un `ContainerRequestHook`, porque en ese punto el contenedor ya existe.

Cada slice puede contener muchos hooks. Los registros se apilan: la slice es la cola.

## Las once etapas, en orden

Recorriendo la línea temporal desde el punto de vista de Docker:

- **Building**: un request hook que se dispara antes de que el motor construya una imagen a partir de la request. Solo importa cuando la request provoca de verdad un build, por ejemplo una request con `FromDockerfile`.
- **Built**: se dispara cuando termina el build de la imagen. Se dispara en las mismas condiciones que Building.
- **PreCreates**: el último request hook. Se ejecuta justo antes de `Docker.ContainerCreate`. Aquí es donde el propio hook por defecto de la biblioteca modifica `dockerInput`, `hostConfig` y `networkingConfig` para traducir los campos cómodos de la request a la API de Docker.
- **PostCreates**: se dispara justo después de que `Docker.ContainerCreate` devuelva. El contenedor existe; todavía no se ha arrancado nada.
- **PreStarts**: se ejecuta antes de `Docker.ContainerStart`.
- **PostStarts**: se ejecuta justo después de que `ContainerStart` devuelva. Aquí vive el hook de readiness por defecto, y los hooks de usuario de esta etapa se ejecutan antes de la espera de readiness. Es la trampa más citada de todo el sistema (más sobre esto abajo).
- **PostReadies**: se ejecuta cuando la espera de readiness ha terminado con éxito. Cualquier cosa que hagas en tu hook aquí puede dar por hecho que el contenedor responde a su probe.
- **PreStops**: se ejecuta antes de una parada ordenada.
- **PostStops**: se ejecuta cuando el contenedor ya se ha parado.
- **PreTerminates**: se ejecuta antes de terminar (eliminar) el contenedor.
- **PostTerminates**: se ejecuta cuando el contenedor ya no existe. La limpieza que debe ocurrir siempre, también tras un test fallido, va aquí.

Para cada etapa del lado del contenedor, la biblioteca tiene un método de dispatch equivalente en `*DockerContainer`: `createdHook`, `startingHook`, `startedHook`, `readiedHook`, `stoppingHook`, `stoppedHook`, `terminatingHook`, `terminatedHook`. Los puntos correspondientes de `docker.go` los llaman en el momento justo durante create, start, stop y terminate.

## Cómo se despacha una etapa

Hay dos métodos `applyLifecycleHooks`. Uno está en `ContainerRequest` y sirve para las etapas de request hooks (Building, Built, PreCreates). El otro está en `*DockerContainer`, para las etapas de container hooks (PostCreates y todo lo que viene después).

Ambos recorren la slice exterior `req.LifecycleHooks` (o `c.lifecycleHooks`), que a su vez es una slice de structs `ContainerLifecycleHooks`. Los defaults de la biblioteca acaban en esa slice, junto a lo que haya añadido el usuario. Para cada struct, el método de dispatch extrae la slice interior que toca y ejecuta los hooks con uno de estos dos helpers:

- `containerRequestHook(ctx, hooks)(req)` recorre los request hooks de arriba abajo y devuelve en el primer error.
- `containerHookFn(ctx, hooks)(c)` recorre los container hooks de arriba abajo y recoge los errores con `errors.Join`, de modo que todos los hooks se ejecutan aunque alguno falle.

La variante de contenedor recibe un booleano `logError`. Cuando el punto de llamada pasa `logError = true` y un hook devuelve un error, el motor imprime los logs del contenedor en el logger configurado antes de devolver. Es útil cuando una modificación en `PreStarts` rompe el contenedor de una forma que, de otro modo, no te dejaría nada que mirar.

`ContainerLifecycleHooks` tiene un método de etapa por cada slice (`Building`, `Built`, `Creating`, ..., `Terminated`), todos ellos delegaciones finas que eligen la slice interior correspondiente y la envuelven en el helper adecuado. Existen para que los métodos de dispatch puedan llamar, por ejemplo, a `lifecycleHooks.Started(ctx)` sin saber a qué slice interior ir.

## Cómo se combinan los hooks de usuario con los defaults

`req.LifecycleHooks` es una slice, y es deliberado. Los hooks del usuario entran con `WithLifecycleHooks` (reemplaza la slice) o con `WithAdditionalLifecycleHooks` (añade al final). Las dos opciones siguen la convención del prefijo `Additional` que conté en el [post #1](/es/posts/2026-06-10-entendiendo-testcontainers-genericcontainer-opciones-funcionales/).

Los hooks por defecto del motor (los cinco que vamos a ver enseguida) no se añaden directamente a esa slice. Durante `CreateContainer`, el motor monta sus defaults y luego llama a `combineContainerHooks(defaultHooks, userDefinedHooks)` para fusionarlos en un único struct `ContainerLifecycleHooks`, que se convierte en la lista `lifecycleHooks` del contenedor.

La fusión usa reflection sobre los campos del struct. El comentario del código explica bien por qué:

> We use reflection here to ensure that any new hooks are handled.
>
> (Usamos reflection aquí para asegurarnos de que cualquier hook nuevo quede cubierto.)

Así que cuando se añade un campo de ciclo de vida nuevo al struct, la lógica de fusión no necesita cambios.

Lo que sí cambia es el orden. La fusión es asimétrica, y el comentario del código lo dice con todas las letras:

> Pre-hooks run the default hooks first then the user-defined hooks
> Post-hooks run the user-defined hooks first then the default hooks
>
> (Los pre-hooks ejecutan primero los hooks por defecto y luego los del usuario. Los post-hooks ejecutan primero los del usuario y luego los por defecto.)

En cualquier etapa `Pre*` (PreBuilds, PreCreates, PreStarts, PreStops, PreTerminates), los hooks por defecto se ejecutan primero y los del usuario después. En cualquier etapa `Post*` (PostBuilds, PostCreates, PostStarts, PostReadies, PostStops, PostTerminates), los hooks del usuario se ejecutan primero y los defaults después.

De aquí sale una consecuencia que conviene grabarse a fuego. La espera de readiness está implementada como un hook `PostStarts` por defecto. Por la fusión asimétrica, un hook `PostStarts` del usuario se ejecuta *antes* que el default de readiness. Si escribes un hook `PostStarts` esperando trabajar contra un contenedor "listo", se ejecutará antes de que la wait strategy haya terminado. La biblioteca tiene una etapa pensada justo para esto: `PostReadies`. Úsala.

Dentro de una misma slice interior, los hooks se ejecutan en el orden en que se añadieron. `containerHookFn` y `containerRequestHook` recorren la slice de arriba abajo. El orden de registro es el orden de ejecución. Si apilas tres hooks en `PostStarts` y uno de ellos tiene que ejecutarse antes que los demás, añádelo el primero.

## Cómo inyectan los módulos sus propios hooks

Los módulos no son especiales. Usan las mismas dos opciones que expone la API pública: `WithLifecycleHooks` y `WithAdditionalLifecycleHooks`. Elegir entre una y otra es cuestión de posición, no de filosofía. Depende de en qué punto del pipeline de opciones se ejecuta la llamada.

Un ejemplo concreto. El `Run` del módulo de Kafka construye primero una lista de opciones y añade al final las opciones que pasa el usuario:

```go
moduleOpts := []testcontainers.RequestCustomizer{
    // ... a handful of base options ...
    testcontainers.WithLifecycleHooks(testcontainers.ContainerLifecycleHooks{
        PostStarts: []testcontainers.ContainerHook{
            func(ctx context.Context, c testcontainers.Container) error {
                if err := copyStarterScript(ctx, c); err != nil {
                    return fmt.Errorf("copy starter script: %w", err)
                }
                return wait.ForLog(".*Transitioning from RECOVERY to RUNNING.*").
                    AsRegexp().WaitUntilReady(ctx, c)
            },
        },
    }),
}
moduleOpts = append(moduleOpts, opts...)
```

En el momento en que Kafka llama a `WithLifecycleHooks`, `req.LifecycleHooks` sigue vacía. `WithLifecycleHooks` (que hace `req.LifecycleHooks = hooks`) y `WithAdditionalLifecycleHooks` (que añade al final) son intercambiables aquí, porque no hay nada que pisar. Kafka eligió la forma más concisa. Dex hace lo mismo en su propio `Run`.

Ahora compáralo con el módulo de MongoDB. La función `initiateReplicaSet` devuelve un customizer al que el usuario se apunta con la opción `WithReplicaSet`:

```go
func initiateReplicaSet(cli mongoCli, replSetName string) testcontainers.CustomizeRequestOption {
    return func(req *testcontainers.GenericContainerRequest) error {
        req.WaitingFor = wait.ForAll(
            req.WaitingFor,
            wait.ForExec(cli.eval("rs.status().ok")),
        ).WithDeadline(60 * time.Second)

        if err := testcontainers.WithAdditionalLifecycleHooks(
            testcontainers.ContainerLifecycleHooks{
                PostStarts: []testcontainers.ContainerHook{
                    func(ctx context.Context, c testcontainers.Container) error {
                        ip, err := c.ContainerIP(ctx)
                        if err != nil {
                            return fmt.Errorf("container ip: %w", err)
                        }
                        cmd := cli.eval(
                            "rs.initiate({ _id: '%s', members: [ { _id: 0, host: '%s:27017' } ] })",
                            replSetName, ip,
                        )
                        return wait.ForExec(cmd).WaitUntilReady(ctx, c)
                    },
                },
            },
        )(req); err != nil {
            return fmt.Errorf("lifecycle hooks: %w", err)
        }
        return nil
    }
}
```

Esta opción se ejecuta *más tarde* en el pipeline, cuando la configuración base del módulo de MongoDB ya ha rellenado `req.LifecycleHooks`, y posiblemente después de otras opciones del usuario. Aquí, `WithLifecycleHooks` borraría todo lo anterior. `WithAdditional` es la única elección segura.

Así que la regla es posicional:

- Si va primero en `moduleOpts`, antes de que ninguna otra opción haya añadido hooks, las dos formas son intercambiables.
- Dentro de una opción auxiliar condicional, o siempre que la llamada no sea lo primero que toca `req.LifecycleHooks`, tienes que usar `WithAdditional` o perderás lo anterior.

El patrón es consistente en todos los módulos. Dex usa `WithLifecycleHooks` en su configuración base. Elasticsearch, MSSQL, OpenLDAP, etcd y Forgejo usan todos `WithAdditionalLifecycleHooks` desde helpers condicionales. El reparto sigue la regla posicional al pie de la letra.

Una salvedad para quien escriba módulos. El `WithLifecycleHooks` de la configuración base de Kafka tiene una fragilidad sutil: si un usuario pasa `testcontainers.WithLifecycleHooks(...)` como opción a `kafka.Run`, esa llamada (que se ejecuta después de la configuración base de Kafka) sobrescribe el hook del módulo. Usar `WithAdditional` en la configuración base del módulo lo evitaría. Los módulos que prefieren ir a lo seguro usan `WithAdditional` en todas partes. Los que prefieren la concisión, como Kafka y Dex, entienden que el reemplazo desde el lado del usuario es una decisión explícita suya.

Si quieres ver un recorrido completo de cómo se escribe un módulo, el [post del módulo de Subscriptions](/es/posts/2026-03-16-suscripciones-de-la-idea-al-modulo-testcontainers/) cuenta el patrón desde la idea hasta la entrega.

## Hook por defecto 1: DefaultLoggingHook

`DefaultLoggingHook` es el más fácil de leer para empezar porque toca todas las etapas. Recibe un logger y devuelve un struct `ContainerLifecycleHooks` totalmente relleno, donde cada slice tiene exactamente una entrada: un `logger.Printf` decorado con emojis. Este es un extracto:

```go
var DefaultLoggingHook = func(logger log.Logger) ContainerLifecycleHooks {
    shortContainerID := func(c Container) string {
        return c.GetContainerID()[:12]
    }
    return ContainerLifecycleHooks{
        PreBuilds: []ContainerRequestHook{
            func(_ context.Context, req ContainerRequest) error {
                logger.Printf("🐳 Building image %s:%s", req.GetRepo(), req.GetTag())
                return nil
            },
        },
        // ...
        PreStarts: []ContainerHook{
            func(_ context.Context, c Container) error {
                logger.Printf("🐳 Starting container: %s", shortContainerID(c))
                return nil
            },
        },
        // ...
    }
}
```

El conjunto completo de líneas va desde `🐳 Building image foo:bar` y `✅ Built image foo:bar`, pasando por `🐳 Creating container`, `✅ Container created`, `🐳 Starting container`, `✅ Container started`, `🔔 Container is ready`, `🐳 Stopping container`, `✅ Container stopped` y `🐳 Terminating container`, hasta terminar en `🚫 Container terminated`. Once líneas, una por etapa.

## Hook por defecto 2: defaultPreCreateHook

Un único hueco en `PreCreates`. El hook llama a `p.preCreateContainerHook`, el método del motor que concilia la `ContainerRequest` del usuario con la API de Docker antes de que se ejecute `Docker.ContainerCreate`.

Lo que cubre esa conciliación:

- Valida cada `Mount` cuyo origen implemente la interfaz `Validator`; saca todos los errores de validación juntos con `errors.Join`.
- Mapea `req.Mounts` a `hostConfig.Mounts`.
- Conecta al contenedor, en el momento de crearlo, la primera red de `req.Networks`, con los alias de `req.NetworkAliases` si los hay. Docker solo permite una red al crear; el resto se conectan cuando el contenedor ya existe, en otro punto de `docker.go`.
- Aplica `req.ConfigModifier` a `dockerInput`, y recurre a `defaultConfigModifier(req)` si quien llama no ha definido uno.
- Aplica `req.HostConfigModifier` a `hostConfig`, con el mismo fallback por defecto.
- Aplica `req.EndpointSettingsModifier` al mapa de endpoint settings, si está definido.
- Si `req.ExposedPorts` está vacío y el modo de red no es "container", inspecciona la imagen y copia los `ExposedPorts` que declara. Así, un contenedor creado desde `nginx` sin `ExposedPorts` explícitos sigue teniendo el puerto 80 expuesto sin que nadie lo haya escrito.
- Parsea el conjunto resultante de puertos expuestos y lo fusiona con `hostConfig.PortBindings`.

Este es el hook donde casi todos los campos cómodos de la request se traducen a la forma que Docker realmente quiere. Ninguno de los hooks por defecto siguientes tendría un contenedor con el que trabajar si este no se ejecutara antes.

## Hook por defecto 3: defaultCopyFileToContainerHook

Un único hueco en `PostCreates`. El comentario del código es explícito sobre el momento:

> copy files to container after it's created but before it's started
>
> (copia los ficheros al contenedor después de crearlo pero antes de arrancarlo)

Para cada `ContainerFile` de `req.Files`, el hook llama primero a `f.validate()` y devuelve un error envuelto si falla. Luego elige un método de copia según el campo que esté definido:

- Si `f.Reader` no es nil, lee todos los bytes del reader y llama a `c.CopyToContainer(ctx, bytes, f.ContainerFilePath, f.FileMode)`.
- Si no, llama a `c.CopyFileToContainer(ctx, f.HostFilePath, f.ContainerFilePath, f.FileMode)`.

`Reader` tiene prioridad sobre `HostFilePath` cuando se definen los dos. El comentario del código en esa rama dice literalmente "Bytes takes precedence over HostFilePath" (los bytes tienen prioridad sobre HostFilePath).

Por eso definir `req.Files` en una `ContainerRequest` "simplemente funciona" sin que nadie escriba un "paso de copia". El hook hace el trabajo, antes de que el contenedor arranque y antes de que ninguna wait strategy lo vea.

## Hook por defecto 4: defaultLogConsumersHook

Dos huecos: `PostStarts` para empezar a enviar logs y `PostStops` para parar. Los dos salen pronto si `cfg == nil || len(cfg.Consumers) == 0`.

`PostStarts` llama a `dockerContainer.resetConsumers(cfg.Consumers)` para instalar el conjunto de consumers, y después a `dockerContainer.startLogProduction(ctx, cfg.Opts...)` para empezar a volcar los logs de Docker en esos consumers. `PostStops` llama a `dockerContainer.stopLogProduction()`.

El comentario del código en cada hueco remite a la maquinaria de composición:

> See combineContainerHooks for the order of execution.
>
> (Mira combineContainerHooks para el orden de ejecución.)

Ese comentario importa sobre todo cuando apilas tu propio hook `PostStarts` relacionado con logs junto a este y te preguntas cuál se dispara antes. La respuesta, según la regla de fusión asimétrica que vimos antes, es que tu hook `PostStarts` se ejecuta antes que este default. Si tu hook depende de que los consumers ya estén conectados, registra mejor un hook `PostReadies`.

## Hook por defecto 5: defaultReadinessHook

Un único hueco en `PostStarts`. El hook llama a `WaitingFor.WaitUntilReady` si el contenedor tiene una wait strategy definida, y solo pone `isRunning` a `true` cuando esa llamada devuelve sin error. El [post #2](/es/posts/2026-06-15-entendiendo-testcontainers-taxonomia-wait-strategies/) recorre este hook por completo, incluidas todas las wait strategies que incluye la biblioteca.

Lo único que merece repetirse aquí es el enfoque. La capa de readiness no es un camino de código especial. Es un hook `PostStarts` como cualquier otro, con las mismas reglas de dispatch, el mismo comportamiento de composición y las mismas trampas.

## Elegir una etapa

Una guía corta y con opinión sobre dónde poner un hook propio:

- **Modificar la config de Docker** (plataforma de la imagen, host config, etc.): `PreCreates`. Primero se ejecuta el `PreCreates` por defecto y después tu hook. Lo que definas no volverá a ser tocado por el motor.
- **Instalar ficheros**: no escribas un hook `PostCreates`. Usa `req.Files`; el `defaultCopyFileToContainerHook` por defecto se encarga.
- **Trabajo de warm-up que necesita el contenedor listo**: `PostReadies`, no `PostStarts`. Por la fusión asimétrica, un `PostStarts` del usuario se ejecuta antes que el default de readiness; `PostReadies` es la única etapa que se ejecuta estrictamente después de que la wait strategy haya tenido éxito.
- **Parada ordenada**: `PreStops`.
- **Limpieza que debe ocurrir en cada terminación, también tras un test fallido**: `PostTerminates`. Sirve para enviar los logs a un almacén externo o registrar el estado final.
- **Evita `PreBuilds` y `PostBuilds`** salvo que tu request provoque realmente un build. No se dispararán con un simple `Run(ctx, "postgres:16-alpine")`.

## Para cerrar

El sistema de lifecycle hooks no es un punto de extensión al que quizá recurras algún día. Es la arquitectura sobre la que está construida la biblioteca. Copiar ficheros es un hook. Enviar logs es un hook. La wait strategy es un hook. Hasta el simpático logger de arranque con su 🐳 / ✅ / 🚫 es un hook. La misma maquinaria que usarías para enchufar tu propio paso de warm-up es la que hace que la biblioteca haga lo que ya hace.

El siguiente post sigue el mismo hilo una capa más hacia fuera: la capa de módulos. `modules/postgres.Run`, `modules/redis.Run`, `modules/kafka.Run` y los demás no son construcciones independientes. Son envoltorios finos sobre el mismo `Run` que hemos estado mirando, con sus propios tipos de opciones y sus configuraciones base componiéndose encima del sistema de hooks que acabamos de ver.

---

_Recursos:_
- _[testcontainers-go en GitHub](https://github.com/testcontainers/testcontainers-go)_
- _[Código fuente de `lifecycle.go`](https://github.com/testcontainers/testcontainers-go/blob/main/lifecycle.go)_
- _[Documentación de Testcontainers sobre lifecycle hooks](https://golang.testcontainers.org/features/creating_container/#lifecycle-hooks)_
