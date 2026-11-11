---
title: "Ejecuta tus Testcontainers en un Docker Sandbox"
date: 2026-10-29 08:00:00 +0100
description: "testcontainers-go tiene un nuevo runtime provider: importas un módulo, lo seleccionas con una variable de entorno o con un fichero de propiedades, y cada contenedor que arrancan tus tests corre en el Engine propio de un Docker Sandbox en lugar del de tu host. Tus funciones de test se quedan como están. Aquí tienes cómo activarlo, qué cambia por debajo y qué falla a propósito."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "testcontainers-go", "docker-sandboxes", "sbx", "golang", "integration-testing"]
type: post
weight: 30
translationKey: run-your-testcontainers-in-a-docker-sandbox
translatedFrom: d252eb6
---

![Ejecuta tus Testcontainers en un Docker Sandbox](/images/posts/2026-10-29-run-your-testcontainers-in-a-docker-sandbox/cover.png)

En el [último post sobre Docker Sandboxes](/es/posts/2026-09-29-aisla-al-agente-conserva-tus-herramientas/) dejé apuntado el Docker Engine propio del sandbox como el siguiente paso. Este post cuenta ese Engine desde el lado de testcontainers-go: tus tests se quedan donde están y los contenedores que arrancan corren dentro del sandbox.

testcontainers-go ya tiene un runtime provider para Docker Sandboxes. Está mergeado en `main` en [testcontainers/testcontainers-go#3987](https://github.com/testcontainers/testcontainers-go/pull/3987) y saldrá con la próxima release de testcontainers-go. Trabajo en Docker Sandboxes y escribí el provider, así que léelo como la visión de quien lo ha construido.

Si ya usas testcontainers-go, esto te da una forma de ejecutar los contenedores que arrancan tus tests dentro de un Docker Sandbox: un import por paquete de test y un ajuste del provider, mientras las funciones de test siguen como están. Si ya usas Docker Sandboxes, esto te da tests de integración de verdad (bases de datos, brokers, stacks de Compose) sobre el Engine propio del sandbox, a través de una librería que sabe arrancar esos contenedores y limpiarlos después.

## Por qué mover las dependencias de tus tests a un sandbox

Los tests de integración arrancan cosas. Un Postgres por aquí, un Kafka por allá, un stack de Compose con cinco servicios, más Ryuk para limpiar lo que dejan. Por defecto, todo eso corre en el Docker Engine al que apunte tu host.

Con el provider seleccionado, corre en un sandbox. La primera operación que necesita un cliente de Docker arranca un sandbox para el proceso de test, antes del descubrimiento del cliente de Docker y antes de Ryuk. Cada contenedor de ese proceso, Ryuk incluido, y cada stack de Compose nativo corren en el Docker Engine de ese sandbox.

## Actívalo

Tres pasos: iniciar sesión, importar y seleccionar. Un cuarto, la limpieza, es muy recomendable.

**Primero, inicia sesión.** Instala la CLI `sbx` en un host que pueda ejecutar sandboxes con publicación local de puertos TCP y UDP por IPv4. La PR indica que el provider necesita sbx v0.48.0 o posterior. Después, autentícate antes de ejecutar los tests:

```console
$ sbx login
$ sbx version
```

El provider usa la autenticación que ya tienes. Nunca inicia sesión por ti.

**Importa el módulo.** El provider vive en su propio módulo de Go opcional, `github.com/testcontainers/testcontainers-go/modules/sbx`. Al importarlo se registra un runtime provider llamado `sbx`:

```go
import _ "github.com/testcontainers/testcontainers-go/modules/sbx"
```

Añadir solo la dependencia no lo registra, y registrarlo no arranca ningún sandbox ni selecciona el provider. Ten en cuenta que `go test ./...` compila un binario de test por paquete, así que cada paquete que deba usar sbx necesita el import, directamente o a través de un helper de test compartido.

**Selecciona el provider.**

```shell
TESTCONTAINERS_PROVIDER=sbx go test ./...
```

También puedes poner `provider=sbx` en `~/.testcontainers.properties`. La variable de entorno gana al fichero de propiedades. La selección es por proceso, ocurre antes de cualquier operación de Testcontainers y no puede cambiar una vez inicializado.

**Limpia en `TestMain`.** Este es el ejemplo de la documentación del módulo, tal cual:

```go
package mypackage_test

import (
    "context"
    "fmt"
    "os"
    "testing"
    "time"

    sbx "github.com/testcontainers/testcontainers-go/modules/sbx"
)

func TestMain(m *testing.M) {
    code := m.Run()

    ctx, cancel := context.WithTimeout(context.Background(), 2*time.Minute)
    if err := sbx.Cleanup(ctx); err != nil {
        fmt.Fprintf(os.Stderr, "sbx cleanup: %v\n", err)
        if code == 0 {
            code = 1
        }
    }
    cancel()
    os.Exit(code)
}
```

El import con nombre que usa `Cleanup` también registra el provider, así que no necesitas el import en blanco en el mismo binario de test.

`sbx.Cleanup` elimina el sandbox que pertenece a este proceso. Es seguro llamarla aunque el sandbox nunca haya arrancado. Si el borrado falla, devuelve un error, y conviene que lo reportes para que la ejecución no salga en verde habiendo dejado algo atrás.

Ryuk sigue limpiando los contenedores dentro del sandbox. Eliminar el propio sandbox es para lo que sirve `Cleanup`. Y si el proceso muere antes de que `TestMain` llegue a la limpieza, puede quedar un sandbox huérfano.

## Tus funciones de test no cambian

Este es un test normal con la API actual:

```go
func TestNginx(t *testing.T) {
    ctx := context.Background()

    ctr, err := testcontainers.Run(ctx, "nginx:alpine",
        testcontainers.WithExposedPorts("80/tcp"),
    )
    testcontainers.CleanupContainer(t, ctr)
    require.NoError(t, err)

    host, err := ctr.Host(ctx)
    require.NoError(t, err)

    port, err := ctr.MappedPort(ctx, "80/tcp")
    require.NoError(t, err)

    t.Logf("nginx at %s:%s", host, port)
}
```

Nada en él es específico de sbx. Los cambios están alrededor: el import en el paquete de test, la selección del provider en una variable de entorno o en `~/.testcontainers.properties`, y la limpieza recomendada en `TestMain`.

La prueba de que esto se sostiene más allá de un ejemplo de juguete es la CI del propio repositorio. Ejecuta contra sbx la suite `./...` completa del módulo raíz de testcontainers-go, con los reintentos desactivados. Los únicos skips específicos de sbx son las opciones de red del host: el host networking y el networking `container:<id>`. Todo lo demás del core corre en el Engine del sandbox.

## Qué cambia por debajo

Algunas cosas se comportan distinto por debajo, y conviene conocerlas antes del primer fallo.

### Cómo arranca el sandbox

El módulo ejecuta `sbx create` con el kit publicado `sbx/docker-tcp:latest` y la imagen base `docker.io/docker/sbx-kit-shell:1.0.0`, y publica la API de Docker del sandbox en un puerto loopback del host. Después ejecuta `sbx run --detach --name <name>`, de modo que el sandbox sigue en marcha hasta la limpieza en lugar de pararse solo cuando termina la sesión de la CLI. El repositorio tiene un test de regresión que se queda inactivo 35 segundos para superar el periodo de gracia de 30 segundos que tiene sbx antes de pararse solo. Los sandboxes se llaman `tc-go-<uuid>`.

### Puertos

`Host()` devuelve `127.0.0.1` y `MappedPort()` devuelve el endpoint local. El provider elige primero el puerto del host y usa el mismo número dentro del sandbox, así que los puertos del host y del guest coinciden.

Si pides un puerto fijo del host, se mantiene mientras el contenedor corre. Al parar el contenedor se libera. Al reiniciarlo intenta recuperarlo, y devuelve un error si otro proceso lo ha tomado mientras tanto. Un puerto fijo que ya está en uso falla al crear el contenedor.

Los puertos son solo TCP y UDP locales por IPv4. Un puerto pedido en `0.0.0.0` se expone únicamente en loopback.

### Bind mounts

El workspace se permite automáticamente. Por defecto es el directorio actual, y `TESTCONTAINERS_SBX_WORKSPACE` lo cambia. Todo lo que quede fuera, incluidos los directorios temporales y los orígenes de bind de los servicios de Compose, necesita una raíz permitida, definida antes de que se inicialice el provider con `sbx.WithBindRoots(...)` o con `TESTCONTAINERS_SBX_BIND_ROOTS`:

```shell
export TESTCONTAINERS_SBX_BIND_ROOTS="/opt/test-fixtures:/srv/shared-fixtures"
TESTCONTAINERS_PROVIDER=sbx go test ./...
```

Solo se monta en el sandbox el origen solicitado, y un bind de solo lectura sigue siendo de solo lectura. Algunos orígenes se rechazan: rutas con componentes `..`, enlaces simbólicos absolutos, enlaces que se salen de su raíz, sockets del host distintos del socket de Docker y rutas con letra de unidad de Windows.

Dos casos especiales. Un bind de `/var/run/docker.sock` apunta al socket de Docker del propio sandbox. Los volúmenes con nombre viven en el daemon de Docker del sandbox.

### Compose

Usa el nativo `NewDockerCompose` o `NewDockerComposeWith`. Su cliente de Docker usa el endpoint de sbx. El `NewLocalDockerCompose` heredado, basado en shell, rechaza sbx con un mensaje claro:

```text
local Docker Compose does not support the sbx runtime; use NewDockerCompose or NewDockerComposeWith
```

### Configuración

Puedes configurar el sandbox de dos maneras: con variables de entorno, o con opciones de Go que pasas a `sbx.Configure` en `TestMain`, antes de `m.Run()`. Las opciones de Go llegaron después, en [testcontainers/testcontainers-go#4057](https://github.com/testcontainers/testcontainers-go/pull/4057). Una opción explícita prevalece sobre su variable de entorno. `Configure` no arranca un sandbox ni selecciona el provider, y una vez que empieza la inicialización, las llamadas posteriores devuelven `sbx.ErrProviderStarted`.

| Opción de Go | Variable de entorno | Para qué sirve | Por defecto |
| --- | --- | --- | --- |
| `WithBinary` | `TESTCONTAINERS_SBX_BINARY` | Ruta o nombre del ejecutable `sbx` | `sbx` en el `PATH` |
| `WithWorkspace` | `TESTCONTAINERS_SBX_WORKSPACE` | Workspace que se pasa al sandbox; las rutas dentro de él son visibles para el sandbox | Directorio de trabajo actual |
| `WithBindRoots` | `TESTCONTAINERS_SBX_BIND_ROOTS` | Directorios adicionales del host permitidos para binds | Sin raíces adicionales; el workspace se permite automáticamente |
| `WithStartupTimeout` | `TESTCONTAINERS_SBX_TIMEOUT` | Límite de inicialización del sandbox, incluida la instalación de kits | `5m` |
| `WithAppName` | `TESTCONTAINERS_SBX_APP_NAME` | Valor de `sbx --app-name` en cada llamada a la CLI | El de la CLI por defecto |

### Kits extra

Dos opciones no tienen variable de entorno: `WithKits` añade kits al sandbox cuando se crea, y `WithKitArgs` les pasa argumentos. El kit obligatorio `sbx/docker-tcp:latest` siempre está incluido. Este es el ejemplo de la documentación del módulo, que usa un kit de ejemplo local guardado en `testdata/test-tools`:

```go
if err := sbx.Configure(
    sbx.WithStartupTimeout(8*time.Minute),
    sbx.WithKits("./testdata/test-tools"),
    sbx.WithKitArgs(map[string]string{
        "test-tools.mode": "integration",
    }),
); err != nil {
    log.Fatal(err)
}
```

Los kits personalizan el sandbox, no los contenedores: las herramientas que instala un kit no aparecen dentro de los contenedores que arrancan tus tests. Los kits se eligen al crear el sandbox y no se pueden añadir después, así que una combinación distinta de kits necesita un proceso de test aparte.

## Qué falla a propósito

El provider gestiona el reenvío de puertos entre tu host y el sandbox. Algunas funciones de Docker se saltan ese reenvío, y el provider las rechaza de entrada en lugar de dejar que funcionen a medias.

**Modos de red `host` y `container:<id>`.**

```text
sbx does not support Docker network mode "<mode>" because it bypasses managed published ports
```

**Políticas de reinicio automático.** Cualquier valor distinto de `no` (sin política) falla:

```text
sbx does not support Docker restart policy "<name>" because automatic restarts bypass managed published ports
```

Usa en su lugar el arranque y el reinicio explícitos del contenedor.

**IPv6 y bindings del host que no sean loopback.** Un binding de host IPv6 se reporta como no soportado, y cualquier otra dirección que no sea loopback local se rechaza.

### Una cosa que conviene saber sobre la confianza

El kit `docker-tcp` expone la API de Docker del sandbox sin autenticación en un puerto loopback del host. Otros usuarios y procesos locales de la misma máquina pueden acceder a ella directamente. Úsalo solo donde todos los usuarios y procesos locales sean de confianza.

## Mismos tests, otra caja

Un import, un ajuste, una llamada de limpieza. Los contenedores que arrancan tus tests ahora corren en el Engine propio del sandbox, un sandbox por proceso de test. Importa el módulo, pon `TESTCONTAINERS_PROVIDER=sbx` y mira cómo se comporta tu suite.

---

_Recursos:_
- _[testcontainers/testcontainers-go#3987: feat: add Docker Sandboxes runtime provider](https://github.com/testcontainers/testcontainers-go/pull/3987)_
- _[testcontainers/testcontainers-go#4057: feat(sbx): configure sandbox startup with Go options](https://github.com/testcontainers/testcontainers-go/pull/4057)_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
- _[Documentación de Testcontainers para Go](https://golang.testcontainers.org/)_
