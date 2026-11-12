---
title: "Entendiendo Testcontainers: de GenericContainer a las opciones funcionales"
date: 2026-06-10 09:00:00 +0200
description: "Cómo está montada la API de testcontainers-go: la primitiva antigua `GenericContainer(ctx, req)`, que recibe un struct de request; el wrapper moderno `Run(ctx, img, opts...)`; y las opciones funcionales que modifican el request por debajo. Las dos siguen conviviendo en el código. Aquí va lo que hace cada una."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "functional-options"]
type: post
weight: 30
translationKey: understanding-testcontainers-from-genericcontainer-to-functional-options
translatedFrom: 62d468d
---

![Entendiendo Testcontainers: de GenericContainer a las opciones funcionales](/images/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options/cover.png)

Soy core maintainer de [testcontainers-go](https://github.com/testcontainers/testcontainers-go). Este post abre una serie sobre las tripas de la librería: cómo está montada la API, cómo esperan los contenedores hasta estar listos, cómo se apoya el sistema de módulos sobre el núcleo, cómo funciona la limpieza. Cada parte se entiende por sí sola. Cada parte está escrita leyendo directamente el código fuente, así que cada afirmación del post se puede rastrear hasta el código.

Cuando llamas a `postgres.Run(ctx, "postgres:16-alpine")` en un test, detrás de esa única línea hay un pequeño mecanismo por capas que la mayoría de usuarios de testcontainers-go nunca necesita ver. Aun así, merece la pena mirarlo, porque cuando sabes lo que hay debajo, el resto de la librería deja de parecer magia. Ese `Run` no es magia. Es un wrapper de conveniencia que recibe una imagen y una lista variádica de opciones, construye un struct enorme con todos los campos de la configuración del contenedor y delega en una función más antigua llamada `GenericContainer`, que sigue exportada y se puede llamar directamente.

Empezamos por la pieza más visible: la API que llamas de verdad cuando creas un contenedor. Veremos las dos formas que expone la librería para construir uno, el struct de request que hay debajo, y cómo opciones funcionales (functional options) como `WithEnv` o `WithExposedPorts` acaban en ese struct. Todo lo que cuento aquí se puede comprobar leyendo `generic.go`, `options.go` y `container.go` en la rama main de `testcontainers-go`. Si has visto `postgres.Run` en acción en posts como [Servicios GoFiber con Testcontainers](/es/posts/2025-05-27-fiber-v3-testcontainers-desarrollo-local-air/), has usado la superficie. Esto es lo que hay debajo.

## `GenericContainer`, la primitiva de fondo

Dentro del paquete `testcontainers` hay dos formas de crear un contenedor. La más antigua es `GenericContainer`. Su firma:

```go
func GenericContainer(ctx context.Context, req GenericContainerRequest) (Container, error)
```

Recibe un contexto y un valor `GenericContainerRequest`, y devuelve un `Container` (una interfaz) y un error. No está deprecada. Sigue exportada, `Run` sigue llamándola por dentro y puedes usarla directamente hoy mismo.

El comentario de documentación de la propia `Run`, dos definiciones de función más abajo, deja clara la relación:

> Run es una función de conveniencia que crea un nuevo contenedor y lo arranca. Llama a la función GenericContainer y devuelve un tipo concreto DockerContainer.

Esa es la historia de la arquitectura en una frase. `GenericContainer` es la primitiva. `Run` está construida encima. El código nuevo no sustituye al antiguo: lo envuelve. Para el código de test que escribas hoy, la respuesta casi siempre es `Run`. El resto del post explica por qué.

## Los dos requests, lado a lado

Para crear un contenedor rellenas un request. Hay dos tipos de request, y la diferencia importa.

`ContainerRequest` es la configuración de cada contenedor. Es un struct grande, con más de cuarenta campos, muchos marcados como `Deprecated`. Una muestra representativa de los campos vigentes:

```go
type ContainerRequest struct {
    Image          string
    Env            map[string]string
    Cmd            []string
    ExposedPorts   []string
    Mounts         ContainerMounts
    WaitingFor     wait.Strategy
    LifecycleHooks []ContainerLifecycleHooks
    Labels         map[string]string
    // ...
}
```

Los campos deprecados apuntan a funciones modificadoras: `Hostname`, `WorkingDir`, `Privileged`, `Binds`, `CapAdd`, `CapDrop` y otros dicen todos "Usa `ConfigModifier`" o "Usa `HostConfigModifier` en su lugar". La librería avanza hacia una configuración en forma de función, incluso dentro del propio struct.

`GenericContainerRequest` es pequeño. Embebe `ContainerRequest` y añade los metadatos que la librería necesita para decidir cómo llamar al provider:

```go
type GenericContainerRequest struct {
    ContainerRequest              // embedded request for provider
    Started          bool         // whether to auto-start the container
    ProviderType     ProviderType // which provider to use, Docker if empty
    Logger           log.Logger   // provide a container specific Logging
    Reuse            bool         // reuse an existing container if it exists
}
```

Dos capas, dos preguntas:

- `ContainerRequest` responde a "¿qué contenedor quieres?".
- `GenericContainerRequest` responde a "¿cómo debe llamar la librería al provider para crearlo?".

Casi todos los campos que cambias como usuario viven en el struct interno. El externo lleva flags a nivel de llamada que fijas una sola vez: si se arranca automáticamente, si se reutiliza por nombre, qué provider se usa.

## `Run` y la capa de opciones funcionales

El cuerpo completo de `Run` es lo bastante pequeño para leerlo de un vistazo:

```go
func Run(ctx context.Context, img string, opts ...ContainerCustomizer) (*DockerContainer, error) {
    req := ContainerRequest{
        Image: img,
    }

    genericContainerReq := GenericContainerRequest{
        ContainerRequest: req,
        Started:          true,
    }

    for _, opt := range opts {
        if err := opt.Customize(&genericContainerReq); err != nil {
            return nil, fmt.Errorf("customize: %w", err)
        }
    }

    ctr, err := GenericContainer(ctx, genericContainerReq)
    var c *DockerContainer
    if ctr != nil {
        c = ctr.(*DockerContainer)
    }
    // ...
}
```

Aquí pasan tres cosas. Primero, se construye un `ContainerRequest` inicial con solo la imagen, y se envuelve en un `GenericContainerRequest` con `Started: true`. Segundo, las opciones variádicas se aplican en orden con un bucle: cada `opt.Customize(&genericContainerReq)` puede modificar el request y devolver un error. Tercero, el request modificado se pasa a `GenericContainer`, y el `Container` resultante (una interfaz) se convierte con una aserción de tipo a un `*DockerContainer` concreto.

La superficie de opciones se construye alrededor de una sola interfaz:

```go
type ContainerCustomizer interface {
    Customize(req *GenericContainerRequest) error
}
```

Y un adaptador de tipo función para que puedas escribir las opciones como simples closures:

```go
type CustomizeRequestOption func(req *GenericContainerRequest) error

func (opt CustomizeRequestOption) Customize(req *GenericContainerRequest) error {
    return opt(req)
}
```

El patrón es deliberadamente simple. Una opción es una función que recibe un puntero al `GenericContainerRequest` y es libre de leer o modificar cualquiera de sus campos. La librería no impone ningún esquema sobre lo que pueden hacer las opciones. Simplemente recorre la lista y llama a cada una.

## Qué hace realmente una opción

Conocer el contrato es una cosa. Verlo aplicado a una opción concreta hace que el patrón encaje.

`WithEnv`:

```go
func WithEnv(envs map[string]string) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        if req.Env == nil {
            req.Env = map[string]string{}
        }

        maps.Copy(req.Env, envs)

        return nil
    }
}
```

Garantiza que el mapa existe y luego mezcla las entradas nuevas sobre las que ya hubiera. Si llamas a `WithEnv` dos veces, las claves de la segunda llamada pisan a las de la primera cuando coinciden, pero lo que solo hayas fijado en la primera sobrevive.

`WithExposedPorts`:

```go
func WithExposedPorts(ports ...string) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        req.ExposedPorts = append(req.ExposedPorts, ports...)
        return nil
    }
}
```

Mismo patrón de "coge un puntero, modifica el campo", con otra forma. Esta añade. Si la llamas dos veces con puertos distintos, obtienes las dos listas concatenadas.

Lo interesante es esto: cada opción decide por sí misma si reemplaza o acumula. `WithEnv` mezcla. `WithExposedPorts` añade. La decisión es de cada opción, y la librería ha fijado convenciones de nombres para distinguirlas.

La dominante es el prefijo `Additional`. Cuando ves una pareja, la forma base reemplaza y la forma `WithAdditionalX` añade. `WithLifecycleHooks` hace `req.LifecycleHooks = hooks`; `WithAdditionalLifecycleHooks` hace `req.LifecycleHooks = append(req.LifecycleHooks, hooks...)`. Los comentarios de documentación lo dicen explícitamente: "reemplaza la estrategia de espera" frente a "añade la estrategia de espera". Una vez que conoces el prefijo, la pareja se lee de un vistazo:

```go
func WithLifecycleHooks(hooks ...ContainerLifecycleHooks) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        req.LifecycleHooks = hooks
        return nil
    }
}

func WithAdditionalLifecycleHooks(hooks ...ContainerLifecycleHooks) CustomizeRequestOption {
    return func(req *GenericContainerRequest) error {
        req.LifecycleHooks = append(req.LifecycleHooks, hooks...)
        return nil
    }
}
```

La convención más antigua es el sufijo `Args`, que se mantiene en las parejas de `Cmd` y `Entrypoint`. `WithCmd` reemplaza; `WithCmdArgs` añade. `WithEntrypoint` reemplaza; `WithEntrypointArgs` añade. Solo dos parejas de la superficie usan todavía esta forma. Todo lo más nuevo usa `Additional`.

Para las opciones sin pareja, la decisión sigue la estructura de datos. Los mapas se mezclan (`WithEnv`, `WithLabels`, `WithTmpfs`). La mayoría de las opciones de slice añaden (`WithExposedPorts`, `WithMounts`, `WithFiles`). Unas pocas opciones de slice reemplazan, y suelen hacerlo porque el slice representa una configuración coherente única y no una lista que va creciendo: `WithImageSubstitutors` y `WithLogConsumers` sobrescriben. Cuando una opción no tiene pareja y la estructura de datos es ambigua, lo aclara el comentario de documentación de la función.

La superficie todavía no es del todo consistente. El prefijo `Additional` es donde queremos acabar con todas las parejas de reemplazar o añadir. El sufijo `Args` antiguo y las excepciones de slice que reemplazan son trabajo que todavía tenemos pendiente.

Para ver un ejemplo completo de cómo un módulo propio conecta sus opciones sobre este mismo patrón, mira [Suscripciones: de la idea a un módulo de Testcontainers](/es/posts/2026-03-16-suscripciones-de-la-idea-al-modulo-testcontainers/).

## Los dos caminos, un ejemplo

La forma más limpia de ver la equivalencia es escribir el mismo contenedor dos veces. Nos vale Postgres con una variable de entorno, un puerto expuesto y una estrategia de espera.

El camino de `GenericContainer`:

```go
req := testcontainers.GenericContainerRequest{
    ContainerRequest: testcontainers.ContainerRequest{
        Image:        "postgres:16-alpine",
        Env:          map[string]string{"POSTGRES_PASSWORD": "test"},
        ExposedPorts: []string{"5432/tcp"},
        WaitingFor:   wait.ForListeningPort("5432/tcp"),
    },
    Started: true,
}

ctr, err := testcontainers.GenericContainer(ctx, req)
```

El camino de `Run`:

```go
ctr, err := testcontainers.Run(ctx, "postgres:16-alpine",
    testcontainers.WithEnv(map[string]string{"POSTGRES_PASSWORD": "test"}),
    testcontainers.WithExposedPorts("5432/tcp"),
    testcontainers.WithWaitStrategy(wait.ForListeningPort("5432/tcp")),
)
```

El mismo contenedor. La misma estrategia de espera. El mismo arranque automático (`Started: true` puesto a mano en el primero, y puesto por `Run` automáticamente en el segundo). Dan resultados equivalentes por la última línea de `Run`: llama a `GenericContainer(ctx, genericContainerReq)` después del bucle de opciones, así que todo lo que puedas expresar con el struct de request también lo puedes expresar con opts que lo modifiquen.

Pero no son opciones equivalentes para quien lee el código. El camino de `Run` es el que usan públicamente todos los módulos de la librería: `postgres.Run`, `redis.Run`, `kafka.Run`, `localstack.Run` y el resto exponen la misma forma. Helpers como `WithEnv` se reutilizan entre llamadas. Los helpers propios construidos sobre `CustomizeRequestOption` encajan directamente. El sitio de la llamada se lee de arriba abajo. El camino de `GenericContainer` conserva su lugar para cuando de verdad necesitas construir el request a mano (cargarlo desde un fichero de configuración, o devolver la interfaz para un test double), pero para el código de test del día a día, el segundo ejemplo de la comparación es el que hay que escribir.

## Dos cosas que hace `Run` y `GenericContainer` no

`Run` no es solo un atajo sintáctico. Hay dos comportamientos que la distinguen de una llamada a `GenericContainer` construida a mano.

**Pone `Started: true` automáticamente.** El literal en el cuerpo de `Run`:

```go
genericContainerReq := GenericContainerRequest{
    ContainerRequest: req,
    Started:          true,
}
```

Si quieres un contenedor creado pero no arrancado, con `Run` tienes dos opciones: pasar `testcontainers.WithNoStart()` (que simplemente pone `req.Started = false`), o usar `GenericContainer` y poner tú mismo `Started: false` en el request. Con `GenericContainer`, el valor por defecto es el valor cero de `bool`, que es `false`, así que el request que construyes queda creado pero no arrancado salvo que pidas lo contrario de forma expresa. Con `Run`, el valor por defecto es el inverso: arrancado, salvo que lo desactives.

**Devuelve el tipo concreto, no la interfaz.** `GenericContainer` devuelve `(Container, error)`: `Container` es una interfaz. `Run` devuelve `(*DockerContainer, error)`: `*DockerContainer` es el tipo concreto. Sigue un idioma muy conocido de Go: "accept interfaces, return concrete types" (acepta interfaces, devuelve tipos concretos). Devolver el tipo concreto da a quien llama el conjunto completo de métodos de `*DockerContainer` sin obligarle a hacer una aserción de tipo. La conversión se hace con una aserción de tipo al final de `Run`, visible en el cuerpo completo que vimos antes (`c = ctr.(*DockerContainer)`). La interfaz que devuelve `GenericContainer` se desenvuelve hasta el tipo concreto para que quien llama no tenga que hacerlo.

Estas dos cosas juntas explican por qué `Run` es el camino alrededor del que se construye la librería. Elige los valores por defecto que quieres para código de test (un contenedor arrancado, un tipo concreto), y el coste de salirte (`WithNoStart`, o bajar a `GenericContainer` para quedarte con la interfaz) solo lo pagas cuando de verdad lo necesitas.

## Cierre

Resumiendo: `Run(ctx, img, opts...)` es la API a la que acudir. Envuelve `GenericContainer(ctx, req)`, elige los valores por defecto que encajan con cómo se ejecuta de verdad el código de test (arrancado, tipo concreto) y acepta opciones funcionales que modifican el request de debajo. `GenericContainer` sigue ahí, y conviene saber que existe: todas las llamadas a `Run` acaban llamándola, y los pocos casos que necesitan un request construido a mano o el tipo de retorno interfaz pueden seguir bajando hasta ella. Para todo lo demás, escribe `Run`.

Las opciones funcionales no son magia. Son funciones que reciben un puntero al request y lo modifican. Saber esto desbloquea el resto de la serie. En el próximo post: cómo decide la librería que un contenedor está "listo" después de arrancar, que resulta ser una pregunta sorprendentemente distinta de "está corriendo".

---

_Recursos:_
- _[testcontainers-go en GitHub](https://github.com/testcontainers/testcontainers-go)_
- _[Código fuente de `generic.go` (Run y GenericContainer)](https://github.com/testcontainers/testcontainers-go/blob/main/generic.go)_
- _[Código fuente de `options.go` (opciones funcionales)](https://github.com/testcontainers/testcontainers-go/blob/main/options.go)_
- _[Código fuente de `container.go` (struct ContainerRequest)](https://github.com/testcontainers/testcontainers-go/blob/main/container.go)_
