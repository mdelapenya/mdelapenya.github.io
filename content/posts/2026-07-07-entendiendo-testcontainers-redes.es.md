---
title: "Entendiendo Testcontainers: redes"
date: 2026-07-07 09:00:00 +0200
description: "Cómo modela testcontainers-go las redes de contenedores: el bridge por defecto, el paquete network/, los cuatro helpers para conectar contenedores, los alias que solo funcionan en redes definidas por el usuario y el workaround multirred que la librería esconde tras un único campo."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "networks", "docker"]
type: post
weight: 30
translationKey: understanding-testcontainers-networks
translatedFrom: dac2bc8
---

![Entendiendo Testcontainers: redes](/images/posts/2026-07-07-understanding-testcontainers-networks/cover.png)

Soy maintainer principal de [testcontainers-go](https://github.com/testcontainers/testcontainers-go). Este es el quinto post de una serie sobre el funcionamiento interno de la librería: cómo se diseña la API, cómo esperan los contenedores hasta estar listos, cómo se apila el sistema de módulos sobre el core, cómo funciona la limpieza. Cada parte se sostiene por sí sola. Cada parte se escribe leyendo el código fuente directamente, así que cada afirmación del post se puede rastrear hasta un fichero y una línea.

Hoy toca hablar de redes. El paquete `network/` es el más pequeño de la superficie pública de la librería, un único fichero que puedes leer de una sentada, pero la API que expone esconde unas cuantas decisiones que merece la pena desmontar. Los contenedores de distintos tests necesitan hablar entre ellos. A veces necesitan encontrarse por un nombre estable en vez de por una IP. A veces un solo contenedor tiene que vivir en más de una red a la vez. Docker tiene primitivas para todo esto, pero esas primitivas tienen restricciones, y el paquete `network/` es sobre todo la forma que esas restricciones toman en Go. La tesis de este post: cada opción del paquete es o un atajo para un patrón de test habitual, o la manera en que la librería esconde una restricción de la API de Docker.

## La red por defecto: bridge

Si un test llama a `Run(ctx, "redis:alpine")` y no pide ninguna red, el contenedor acaba siendo accesible igualmente. Se conecta al bridge por defecto del daemon, y desde ahí obtiene una IP y una ruta hacia el host. La librería no tiene que hacer nada especial para este caso, de eso se ocupa el daemon.

Las dos constantes que nombran las posibles redes por defecto viven en `docker.go`:

```go
Bridge        = "bridge" // Bridge network name (as well as driver)
ReaperDefault = "reaper_default" // Default network name when bridge is not available
```

La función `ensureDefaultNetwork`, en `docker.go`, es donde se toma la decisión en tiempo de ejecución. Lista las redes que existen en el daemon y, si encuentra una llamada `bridge`, usa esa. Si no, recurre a una red llamada `reaper_default` que la propia librería crea con `GenericLabels()` para que Ryuk pueda eliminarla más tarde.

La pieza que conecta esto con la creación del contenedor está en `docker.go`, justo antes de crearlo:

```go
if defaultNetwork != p.defaultBridgeNetworkName {
    isAttached := slices.Contains(req.Networks, defaultNetwork)
    if !isAttached {
        req.Networks = append(req.Networks, defaultNetwork)
    }
}
```

La lógica dice: cuando la red por defecto resuelta no es el bridge nativo del daemon, la librería tiene que añadirla a la request a mano, porque el daemon no la conectará solo. Ese es el camino de `reaper_default`. El caso de Docker estándar (`defaultBridgeNetworkName == "bridge"`) no pasa por esta rama.

Este es el primer sitio donde la librería esconde algo. Desde el punto de vista de un test, simplemente obtienes un contenedor que puede hablar con la red. Desde el punto de vista de la librería, la red por defecto resuelta puede ser el bridge nativo o una alternativa que hay que conectar a mano, y el código tiene que saber cuál toca antes de crear el contenedor.

## `network.New`: crear una red personalizada

Cuando un test necesita algo más que la red por defecto, la pide. El punto de entrada moderno vive en `network/network.go`:

```go
func New(ctx context.Context, opts ...NetworkCustomizer) (*testcontainers.DockerNetwork, error) {
    nc := client.NetworkCreateOptions{
        Driver: "bridge",
        Labels: testcontainers.GenericLabels(),
    }
    // apply opts...
    netReq := testcontainers.NetworkRequest{
        Driver:     nc.Driver,
        Internal:   nc.Internal,
        EnableIPv6: nc.EnableIPv6,
        Name:       uuid.NewString(),
        Labels:     nc.Labels,
        Attachable: nc.Attachable,
        IPAM:       nc.IPAM,
    }
    n, err := testcontainers.GenericNetwork(ctx, testcontainers.GenericNetworkRequest{
        NetworkRequest: netReq,
    })
    if err != nil {
        return nil, err
    }
    return n.(*testcontainers.DockerNetwork), nil
}
```

Destacan tres valores por defecto:

- **Driver: bridge.** El caso más habitual, y el único donde funciona el DNS embebido de Docker (volveremos a esto en la sección de los alias).
- **Labels: `GenericLabels()`.** Es el mismo etiquetado que se usa al crear contenedores. Las labels incluyen el ID de sesión del proceso de test en ejecución, para que Ryuk pueda asociar la red a esa sesión y borrarla cuando termine.
- **Name: un UUID aleatorio.** Sin colisiones entre tests en paralelo sobre el mismo daemon. La contrapartida es que el nombre de la red es opaco, así que si más adelante necesitas conectarle un contenedor hermano, tienes que conservar la referencia al `*DockerNetwork`.

El tipo de retorno es un puntero a un struct concreto, no la interfaz `Network`. El idioma de Go "accept interface, return struct" aparece aquí igual que con `Run` devolviendo `*DockerContainer` en la [Parte 1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options).

## La interfaz de personalización (customizer)

Las opciones de `network.New` siguen el mismo dialecto de functional options que vimos en la Parte 1, esta vez envolviendo otro tipo de request. En `network/network.go`:

```go
type NetworkCustomizer interface {
    Customize(req *client.NetworkCreateOptions) error
}

type CustomizeNetworkOption func(req *client.NetworkCreateOptions) error

func (opt CustomizeNetworkOption) Customize(req *client.NetworkCreateOptions) error {
    return opt(req)
}
```

Los customizers incluidos cubren los siete ajustes que expone la API de redes de Docker:

- `WithAttachable()`: marca la red para que los contenedores independientes (no solo los servicios) puedan conectarse a ella.
- `WithCheckDuplicate()`: no hace nada, se mantiene por compatibilidad hacia atrás. El docstring es sincero al respecto: `CheckDuplicate` quedó deprecado en la versión 1.44 de la API de Docker, y de todos modos el cliente pone el campo a `true` con daemons más antiguos.
- `WithDriver(driver string)`: sustituye el `"bridge"` por defecto. Útil para `overlay`, `macvlan` o drivers de terceros.
- `WithEnableIPv6()`: activa IPv6 en la red. El docstring avisa de que el daemon también necesita tener IPv6 activado.
- `WithInternal()`: marca la red como interna, sin conectividad externa.
- `WithLabels(labels map[string]string)`: añade labels definidas por el usuario junto a las labels genéricas de Testcontainers.
- `WithIPAM(ipam *network.IPAM)`: sustituye la configuración de IPAM (IP Address Management). La vía de escape para subredes fijas o gateways personalizados.

Ninguna de ellas sorprende demasiado. La superficie es pequeña porque crear una red es una operación pequeña. El código interesante está en el otro lado: cuando un contenedor dice "conéctame a esta red".

## Conectar un contenedor: cuatro helpers del lado de la request

La red existe. Ahora un contenedor tiene que unirse a ella. El paquete `network/` incluye cuatro helpers `CustomizeRequestOption` para esto, cada uno para un escenario distinto:

| Helper | Cuándo usarlo |
|---|---|
| `WithNetwork(aliases, nw)` | Has creado la red en el test con `network.New` y tienes el `*DockerNetwork`. |
| `WithNetworkName(aliases, name)` | La red ya existe. Solo tienes su nombre (la creó docker-compose, una ejecución anterior u otra herramienta). |
| `WithBridgeNetwork()` | Quieres el contenedor en el bridge por defecto, de forma explícita. Sin alias. |
| `WithNewNetwork(ctx, aliases, opts...)` | Quieres una red nueva y un contenedor en ella en una sola llamada. La librería crea la red por ti. |

`WithNetwork` es el más delgado de los cuatro: simplemente delega en `WithNetworkName` usando `nw.Name`. El trabajo de verdad ocurre en `WithNetworkName`:

```go
func WithNetworkName(aliases []string, networkName string) testcontainers.CustomizeRequestOption {
    return func(req *testcontainers.GenericContainerRequest) error {
        if networkName == "bridge" {
            return errors.New("network-scoped aliases are supported only for containers in user defined networks")
        }
        req.Networks = append(req.Networks, networkName)
        if req.NetworkAliases == nil {
            req.NetworkAliases = make(map[string][]string)
        }
        req.NetworkAliases[networkName] = aliases
        return nil
    }
}
```

Se tocan dos campos: `req.Networks` (la lista de redes a las que conectarse) y `req.NetworkAliases` (un mapa de nombre de red a lista de alias). Esa separación importa más adelante, cuando la librería tiene que decidir en qué red se crea el contenedor y a cuáles tiene que conectarlo después.

`WithBridgeNetwork()` es la excepción que confirma la regla. Añade `"bridge"` a `req.Networks` y no hace nada más. No pasa alias porque, como vamos a ver enseguida, bridge no los acepta.

`WithNewNetwork(ctx, aliases, opts...)` es el atajo de "solo quiero una red nueva". Llama internamente a `network.New` y después aplica sobre el resultado la misma lógica que `WithNetworkName`.

## Los alias solo funcionan en redes definidas por el usuario

Tres líneas que explican toda la restricción de diseño:

```go
if networkName == "bridge" {
    return errors.New("network-scoped aliases are supported only for containers in user defined networks")
}
```

Esto no es la librería imponiendo su criterio. Es Docker. La red `bridge` por defecto no ejecuta DNS embebido, así que un contenedor que intente resolver por nombre de host a otro contenedor en bridge no lo conseguirá. Las redes bridge definidas por el usuario sí ejecutan un resolvedor DNS embebido, y eso es lo que hace que un contenedor de Postgres sea accesible desde uno de Redis con el hostname `postgres` en vez de `172.17.0.4`.

`WithBridgeNetwork()` existe precisamente porque el camino de los alias está cerrado en bridge. Es el único helper de conexión que no acepta alias, y es a propósito. Si tu test no necesita descubrimiento por nombre, unirse a bridge es la opción con menos sobrecarga. Si lo necesita, la red definida por el usuario es obligatoria.

Esto explica por qué todos los ejemplos con varios contenedores de la documentación de Testcontainers crean una red nueva en vez de usar bridge. El descubrimiento de servicios entre contenedores del mismo test es el caso más común, y la única red que lo soporta es una definida por el usuario.

## El workaround para varias redes (issue #248)

Ahora la request ya está personalizada: el contenedor está conectado a la red A con el alias `postgres`, y también a la red B con el alias `db`. ¿Qué hace la librería con eso?

La API de creación de contenedores de Docker solo acepta una red en el momento de la creación. Puedes listar más en el mapa `NetworkingConfig.EndpointsConfig`, pero en la práctica el motor de Docker ignora todo salvo la primera entrada. El workaround está documentado en dos sitios del código.

La primera red se configura dentro del hook pre-create por defecto, en `lifecycle.go`:

```go
attachContainerTo := req.Networks[0]

nw, err := p.GetNetwork(ctx, NetworkRequest{Name: attachContainerTo})
if err == nil {
    aliases := []string{}
    if _, ok := req.NetworkAliases[attachContainerTo]; ok {
        aliases = req.NetworkAliases[attachContainerTo]
    }
    endpointSetting := network.EndpointSettings{
        Aliases:   aliases,
        NetworkID: nw.ID,
    }
    endpointSettings[attachContainerTo] = &endpointSetting
}
```

El resto de las redes se conectan una vez creado el contenedor, de vuelta en `docker.go`:

```go
// #248: If there is more than one network specified in the request attach newly created container to them one by one
if len(req.Networks) > 1 {
    for _, n := range req.Networks[1:] {
        nw, err := p.GetNetwork(ctx, NetworkRequest{Name: n})
        if err == nil {
            endpointSetting := network.EndpointSettings{
                Aliases: req.NetworkAliases[n],
            }
            _, err = p.client.NetworkConnect(ctx, nw.ID, client.NetworkConnectOptions{
                Container:      resp.ID,
                EndpointConfig: &endpointSetting,
            })
            if err != nil {
                return nil, fmt.Errorf("network connect: %w", err)
            }
        }
    }
}
```

Ese `#248` del comentario es la issue de GitHub que este arreglo resolvió en su origen. Desde el punto de vista del usuario, el caso multirred parece un único campo: pasas varias opciones `WithNetwork` y el contenedor se une a todas. Desde el punto de vista de la librería hay dos caminos de código distintos: la primera red pasa por la creación del contenedor, y las demás por la creación más un `NetworkConnect`. La separación es invisible hasta que algo falla en una de las redes posteriores, y entonces el mensaje de error nombra `NetworkConnect`, no la llamada original a `Run`.

## Cómo Ryuk se hace cargo de la red

En la [Parte 3](/es/posts/2026-06-19-entendiendo-testcontainers-sistema-lifecycle-hooks/) vimos cómo se componen los lifecycle hooks alrededor de la creación del contenedor. Las redes tienen una historia equivalente para la limpieza. La cadena empieza en `network.New` y termina en el `DockerProvider.CreateNetwork` deprecado, en `docker.go`. La conexión con Ryuk dentro de esa función es así:

```go
if !p.config.RyukDisabled {
    r, err := spawner.reaper(context.WithValue(ctx, core.DockerHostContextKey, p.host), sessionID, p)
    if err != nil {
        return nil, fmt.Errorf("reaper: %w", err)
    }

    termSignal, err = r.Connect()
    if err != nil {
        return nil, fmt.Errorf("reaper connect: %w", err)
    }
    // ...
}
```

`CreateNetwork` levanta o reutiliza el contenedor de Ryuk, abre un canal de terminación y, justo después, llama a `core.AddDefaultLabels(sessionID, req.Labels)` para marcar la red con el ID de sesión por el que filtra Ryuk.

Cuando el proceso de test termina (limpiamente o no), Ryuk lee su filtro de labels y borra todos los contenedores, redes y volúmenes que coinciden. La red es uno de esos recursos. El usuario no tuvo que registrar un `defer` para limpiarla, ni llamar a `Remove` desde un bloque `t.Cleanup`. La label es el contrato.

Si `RyukDisabled` está activo, nada de esto se ejecuta. Las redes creadas en ese modo sobrevivirán al proceso de test y habrá que eliminarlas a mano. Es la misma contrapartida que Ryuk impone a los contenedores, aplicada a las redes.

## `network.New` envuelve una API deprecada

La parte sincera. El punto de entrada moderno se ve limpio desde fuera, pero la implementación todavía pasa por código que la librería ha marcado para eliminar. El docstring de `New` lo dice sin rodeos:

```go
// New creates a new network with a random UUID name, calling the already existing GenericNetwork APIs.
// Those existing APIs are deprecated and will be removed in the future, so this function will
// implement the new network APIs when they will be available.
// By default, the network is created with the following options:
// - Driver: bridge
// - Labels: the Testcontainers for Go generic labels, to be managed by Ryuk. Please see the GenericLabels() function
// And those options can be modified by the user, using the CreateModifier function field.
```

`GenericNetwork`, en `generic.go`, lleva su propio aviso de deprecación:

```go
// Deprecated: use network.New instead
// GenericNetwork creates a generic network with parameters
func GenericNetwork(ctx context.Context, req GenericNetworkRequest) (Network, error) {
    provider, err := req.ProviderType.GetProvider()
    if err != nil {
        return nil, err
    }
    network, err := provider.CreateNetwork(ctx, req.NetworkRequest)
    if err != nil {
        return nil, fmt.Errorf("%w: failed to create network", err)
    }
    return network, nil
}
```

Y `DockerProvider.CreateNetwork`, en `docker.go`:

```go
// Deprecated: use network.New instead
// CreateNetwork returns the object representing a new network identified by its name
```

Así que tenemos `network.New` (moderno) llamando a `GenericNetwork` (deprecado), que llama a `CreateNetwork` (deprecado). Los dos comentarios `//nolint:staticcheck` dentro de `network.New` son la señal visible de que los maintainers sabemos que esto es incómodo. El plan que declara el docstring es "implementar las nuevas APIs de red cuando estén disponibles", un trabajo que todavía tenemos pendiente. Hasta que llegue, `network.New` es lo correcto para los usuarios, aunque su cuerpo use la maquinaria antigua.

Es una forma que se repite en la librería: una superficie moderna y limpia, un sustrato más antiguo y discreto que sigue haciendo el trabajo, y una intención documentada de converger. Vimos el mismo patrón en la [Parte 1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options) con `GenericContainer` y `Run`.

## Cierre

El paquete `network/` es pequeño porque Docker hizo casi todo el trabajo. Lo que añade la librería son los valores por defecto (driver bridge, nombre UUID, labels genéricas), la conexión con Ryuk (para que la limpieza ocurra sin un `defer`), los helpers del lado de la request (para que conectarse a una red existente sea cosa de una línea) y el workaround multirred (para que la restricción de una sola red en la creación desaparezca de la API que ve el usuario).

Hay dos restricciones que ya deberías ser capaz de detectar en cualquier test que use redes: los alias solo funcionan en redes definidas por el usuario, y la primera red en una conexión a varias redes es especial. Si alguna vez ves un contenedor que se unió a dos redes y recibió alias en una pero no en la otra, el bucle de `NetworkConnect` posterior a la creación, en `docker.go`, es donde tienes que mirar.

Hasta aquí, la serie ha leído el core de la librería desde dentro. El próximo post invierte la dirección: elegir un módulo de la estantería y usarlo para escribir un test que sería un suplicio escribir sin Testcontainers.

---

## Recursos

- *[network/network.go](https://github.com/testcontainers/testcontainers-go/blob/main/network/network.go)*
- *[docker.go](https://github.com/testcontainers/testcontainers-go/blob/main/docker.go)* (CreateNetwork, ensureDefaultNetwork, conexión a varias redes)
- *[generic.go](https://github.com/testcontainers/testcontainers-go/blob/main/generic.go)* (GenericLabels, GenericNetwork)
- *[Issue #248 de GitHub](https://github.com/testcontainers/testcontainers-go/issues/248)* (gestión de varias redes)
- *[Documentación de Docker: usar redes bridge](https://docs.docker.com/engine/network/drivers/bridge/)*
