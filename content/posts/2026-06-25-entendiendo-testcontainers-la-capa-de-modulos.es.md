---
title: "Entendiendo Testcontainers: la capa de módulos"
date: 2026-06-25 09:00:00 +0200
description: "65 módulos en testcontainers-go, todos construidos sobre el mismo Run que llevamos tres posts siguiendo. El esqueleto estándar de un módulo, el tipo wrapper de Container, los dialectos de opciones y dónde se desvía cada módulo de la forma común. Leído directamente del árbol modules/."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "modules"]
type: post
weight: 30
translationKey: understanding-testcontainers-the-module-layer
translatedFrom: d04fd2f
---

![Entendiendo Testcontainers: la capa de módulos](/images/posts/2026-06-25-understanding-testcontainers-the-module-layer/cover.png)

Soy mantenedor principal de [testcontainers-go](https://github.com/testcontainers/testcontainers-go). El [tercer post de esta serie](/es/posts/2026-06-19-entendiendo-testcontainers-sistema-lifecycle-hooks/) terminaba señalando la capa de módulos. `modules/postgres.Run`, `modules/redis.Run`, `modules/kafka.Run` y todos los demás no son construcciones independientes. Son wrappers finos alrededor del mismo `Run` que llevamos tres posts siguiendo. Hoy hay 65 en el repositorio, y me puse a mirar hasta qué punto es consistente su forma.

Este post es el mapa. El esqueleto estándar, el tipo wrapper de Container, los dos dialectos de opciones que conviven dentro del mismo módulo, el patrón de opciones por llamada que algunos módulos añaden por encima, el alias `RunContainer` ya deprecado que sigue por ahí y los pocos sitios donde cada módulo se aparta de la convención. Al terminar, deberías poder abrir cualquier módulo del repositorio y reconocer qué piezas son el patrón canónico y cuáles son decoración propia de ese módulo.

## El esqueleto estándar de un módulo

La mayoría de los módulos traen el mismo conjunto de ficheros. Abre `modules/postgres/` y verás:

- `postgres.go`, la superficie pública (la función `Run`, el tipo wrapper `Container`, los métodos auxiliares).
- `options.go`, las functional options.
- `postgres_test.go`, los tests.
- `examples_test.go`, ejemplos ejecutables en Go que hacen también de documentación.
- `go.mod` y `go.sum`, el manifiesto de dependencias del propio módulo.
- `Makefile`, los targets de build de cada módulo que usa la CI.
- `resources/`, una carpeta opcional para fixtures embebidos (Postgres incluye ahí un script de entrypoint propio).

La misma forma se repite en Redis, Kafka, Mongo, Elasticsearch y casi todos los módulos que abrí. El detalle que merece una pausa es `go.mod`. Cada módulo es un módulo de Go independiente, con su propio manifiesto de dependencias. Quien importa `modules/postgres` no arrastra las dependencias de `modules/kafka`: solo se lleva lo que declara Postgres. Con 65 módulos, muchos de los cuales traen clientes pesados (Elasticsearch, Kafka, Cassandra, Mongo), esto importa. Meterlos todos en un único módulo de Go obligaría a cada consumidor a compilar todas las dependencias transitivas.

Hay una segunda capa. Dentro de un mismo módulo, la librería cliente pesada se importa solo en los ficheros `_test.go` (los ejemplos ejecutables y los tests de integración), no en el código de producción. El `mongodb.go` del módulo de MongoDB importa la biblioteca estándar, `testcontainers-go` y `wait`. El cliente `go.mongodb.org/mongo-driver` solo aparece en `examples_test.go`. Kafka hace lo mismo: `kafka.go` importa la biblioteca estándar, `testcontainers-go`, `wait` y un helper de semver. El cliente `github.com/IBM/sarama` solo aparece en `kafka_test.go`. La toolchain de Go trata los imports alcanzables únicamente desde ficheros `_test.go` como imports de test: entran en el grafo del módulo para `go test`, pero quien compile un binario de producción que importe `mongodb.Run` no se lleva `mongo-driver` al resultado compilado, porque nada alcanzable desde `main` lo importa. El cliente pesado es asunto del test, no del binario del consumidor.

## El tipo wrapper de Container

Todos los módulos exponen un struct que envuelve el handle del contenedor base. De `modules/postgres/postgres.go`:

```go
type PostgresContainer struct {
    testcontainers.Container
    dbName        string
    user          string
    password      string
    snapshotName  string
    sqlDriverName string
}
```

El primer campo es `testcontainers.Container`, la interfaz del contenedor base, embebida por nombre. El resto son campos de estado de cada instancia: la base de datos, el usuario, la contraseña, el nombre del snapshot y el nombre del driver SQL que usan `Snapshot` y `Restore`.

Todos los campos capturados van en minúscula, es decir, no exportados en Go. Es deliberado. Los campos se escriben una sola vez, dentro de `Run`, después de que `testcontainers.Run` haya arrancado el contenedor y de que el módulo haya inspeccionado el entorno resultante para recoger los valores que el usuario haya sobrescrito. A partir de ese momento, el contenedor en ejecución está configurado con esos valores: Postgres está levantado con ese nombre de base de datos, ese usuario y esa contraseña. Si los campos fueran exportados, un llamador podría hacer `c.dbName = "something-else"` una hora después, y el `ConnectionString` del wrapper generaría tan tranquilo una URL que no coincide con el contenedor vivo. Mantener los campos privados obliga a pasar siempre por los métodos del wrapper, y eso mantiene el estado que reporta el wrapper alineado con el estado real del contenedor.

La embebición es el resto del diseño. Quien llama tiene todo el conjunto de métodos de testcontainers en el mismo handle (`Inspect`, `Logs`, `MappedPort`, `Terminate`, todo) mientras el wrapper del módulo añade sus propios helpers. Desde el punto de vista de quien llama, hay un solo tipo que sostener. Desde el punto de vista del módulo, hay un solo sitio donde añadir métodos.

`MySQLContainer`, `RedisContainer`, `KafkaContainer` y los demás siguen la misma forma: una interfaz `testcontainers.Container` embebida, más campos en minúscula para el estado de cada instancia. Estado capturado distinto, misma embebición, misma disciplina de acceso.

## La función Run

El punto de entrada. Todos los módulos exportan una función `Run` con la misma firma:

```go
func Run(ctx context.Context, img string, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error)
```

Entran tres cosas: un contexto, la imagen y una lista variádica de customizers. Sale una: el tipo wrapper del módulo (o un error). Coincide con la firma del `testcontainers.Run` base que cubrió el [post 1](/posts/2026-06-10-understanding-testcontainers-from-genericcontainer-to-functional-options), con el tipo de retorno cambiado por el wrapper específico del módulo.

El cuerpo también sigue una forma consistente. De Postgres, algo recortado:

```go
func Run(ctx context.Context, img string, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error) {
    settings := defaultOptions()
    for _, opt := range opts {
        if apply, ok := opt.(Option); ok {
            apply(&settings)
        }
    }

    moduleOpts := make([]testcontainers.ContainerCustomizer, 0, 3+len(opts))
    moduleOpts = append(moduleOpts,
        testcontainers.WithEnv(map[string]string{
            "POSTGRES_USER":     defaultUser,
            "POSTGRES_PASSWORD": defaultPassword,
            "POSTGRES_DB":       defaultUser,
        }),
        testcontainers.WithExposedPorts("5432/tcp"),
        testcontainers.WithCmd("postgres", "-c", "fsync=off"),
    )

    moduleOpts = append(moduleOpts, opts...)

    ctr, err := testcontainers.Run(ctx, img, moduleOpts...)
    // ...wrap ctr into *PostgresContainer, return.
}
```

Tres pasos. Primero, recoger los ajustes locales del módulo a partir de las opciones que cumplen la interfaz `Option` del propio módulo (más sobre esto en la siguiente sección). Segundo, construir un slice `moduleOpts` que empieza con las opciones base (variables de entorno, puertos expuestos, comando) y termina con las `opts` del usuario añadidas en último lugar. Tercero, pasar la lista combinada a `testcontainers.Run` y envolver el resultado.

El orden "opciones base primero, opciones del usuario al final" es deliberado. Permite al usuario sobrescribir cualquier cosa que el módulo fije por defecto: si pasas `testcontainers.WithEnv(map[string]string{"POSTGRES_USER": "alice"})`, tu entrada de entorno se ejecuta después de la del módulo y gana.

Que esta forma sea tan consistente en los 65 módulos es el resultado de una migración deliberada. La forma antigua, `RunContainer` (de la que hablo más abajo), no recibía la imagen como argumento y los cuerpos de los módulos eran menos uniformes. Migré a mano los primeros diecinueve módulos a la forma actual `Run(ctx, img, opts...)` para fijar el patrón, y después usé un agente de IA para programar los cuarenta y uno restantes. El antes y el después, y lo que aprendí trabajando en pareja con el agente en un refactor repetitivo a esa escala, está en [Refactorizando 60 módulos de Go con un agente de IA](/posts/2025-10-10-coding-agents).

## Opciones base que aplican todos los módulos

La lista exacta varía, pero la mayoría de los módulos fijan al menos tres cosas:

- **Puertos expuestos.** Los que escuche la imagen. Postgres expone `5432/tcp`; MySQL expone `3306/tcp` y `33060/tcp`; Redis expone `6379/tcp`.
- **Variables de entorno obligatorias.** Lo mínimo que la imagen necesita para arrancar. Postgres fija `POSTGRES_USER`, `POSTGRES_PASSWORD` y `POSTGRES_DB` a sus valores por defecto. MySQL fija `MYSQL_USER`, `MYSQL_PASSWORD` y `MYSQL_DATABASE`. Redis aquí no fija nada, porque no le hace falta.
- **Una wait strategy.** MySQL espera a la línea de log `port: 3306  MySQL Community Server`. Postgres se apoya en la comprobación de puerto por defecto, a través de sus puertos expuestos.

Algunos módulos instalan también un lifecycle hook en la configuración base. Kafka es el ejemplo más claro: su configuración base usa `testcontainers.WithLifecycleHooks` para registrar un hook `PostStarts` que copia un script de arranque dentro del contenedor y luego espera a una línea de log que indica que está listo. El [post de lifecycle hooks](/es/posts/2026-06-19-entendiendo-testcontainers-sistema-lifecycle-hooks/) recorrió ese caso al detalle, incluido por qué la elección de Kafka de usar `WithLifecycleHooks` (en lugar de `WithAdditional`) es correcta en la configuración base, pero no sería segura más adelante en la cadena de opciones.

## Opciones específicas de cada módulo: los dos dialectos

Hay dos dialectos de functional options en los módulos.

**Customizers que mutan la request.** La mayoría de las opciones de los módulos son funciones que devuelven `testcontainers.CustomizeRequestOption` o `testcontainers.ContainerCustomizer` y escriben directamente en el `GenericContainerRequest`. Un ejemplo de Postgres:

```go
func WithDatabase(dbName string) testcontainers.ContainerCustomizer {
    return testcontainers.WithEnv(map[string]string{"POSTGRES_DB": dbName})
}

func WithInitScripts(scripts ...string) testcontainers.CustomizeRequestOption {
    containerFiles := make([]testcontainers.ContainerFile, 0, len(scripts))
    for _, script := range scripts {
        containerFiles = append(containerFiles, testcontainers.ContainerFile{
            HostFilePath:      script,
            ContainerFilePath: "/docker-entrypoint-initdb.d/" + filepath.Base(script),
            FileMode:          0o755,
        })
    }
    return testcontainers.WithFiles(containerFiles...)
}
```

`WithDatabase` es un wrapper fino sobre el `WithEnv` base. `WithInitScripts` construye un slice de valores `ContainerFile` y delega en el `WithFiles` base. Las dos son funciones que, en el momento en que `testcontainers.Run` recorre la lista de opciones, mutan la request.

**Opciones locales del módulo.** Algunos módulos necesitan un estado que no pertenece a la request de Docker: el nombre del driver SQL que se elige al abrir conexiones, un flag de TLS que el wrapper lee más tarde, un nombre de snapshot. Postgres lo resuelve con un struct `options` privado y un tipo `Option` exportado, definidos en `options.go`:

```go
type options struct {
    SQLDriverName string
    Snapshot      string
}

func defaultOptions() options {
    return options{
        SQLDriverName: "postgres",
        Snapshot:      defaultSnapshotName,
    }
}

var _ testcontainers.ContainerCustomizer = (Option)(nil)

type Option func(*options)

// Customize is a NOOP. It's defined to satisfy the testcontainers.ContainerCustomizer interface.
func (o Option) Customize(*testcontainers.GenericContainerRequest) error {
    return nil
}

func WithSQLDriver(driver string) Option {
    return func(o *options) {
        o.SQLDriverName = driver
    }
}
```

`Option` cumple `testcontainers.ContainerCustomizer` con un `Customize` que no hace nada (NOOP). Eso permite al usuario pasarlo por el mismo hueco variádico `opts ...testcontainers.ContainerCustomizer` que cualquier otra opción: el pipeline de testcontainers le llama a `Customize`, la llamada no hace nada y la request queda intacta. El trabajo interesante ocurre antes, en el `Run` del módulo, donde el bucle del principio filtra `opts` buscando los valores del tipo `Option` del módulo y los aplica al struct local `settings`.

Redis usa el mismo patrón. MySQL no: le basta con customizers que mutan la request, porque ningún estado suyo necesita vivir fuera de la request. Un módulo puede tener un dialecto, el otro o los dos. Postgres tiene los dos, y conviven en el mismo fichero y en el mismo `Run`.

## Helpers condicionales y composición de lifecycle

Algunas opciones son condicionales: solo hacen algo si el usuario las ha activado (`WithReplicaSet`, `WithDataDir`, `WithSSLCert`). Estas opciones suelen necesitar registrar un lifecycle hook para ejecutar trabajo de preparación cuando el contenedor ya ha arrancado.

La opción `WithReplicaSet` de MongoDB fue el ejemplo de manual en el [post de lifecycle hooks](/es/posts/2026-06-19-entendiendo-testcontainers-sistema-lifecycle-hooks/): devuelve un customizer que usa `testcontainers.WithAdditionalLifecycleHooks` para añadir un hook `PostStarts` que llama a `rs.initiate(...)` contra el contenedor vivo. La regla posicional de ese post se mantiene: un helper condicional se ejecuta más tarde en la cadena de opciones, cuando la configuración base del módulo ya ha rellenado `req.LifecycleHooks`. `WithAdditional` es la única forma segura. `WithLifecycleHooks` pisaría los hooks anteriores.

Si estás escribiendo una opción específica de un módulo que necesita trabajo posterior al arranque, ese es el patrón.

## Métodos auxiliares del tipo wrapper

En el wrapper viven dos tipos de helpers.

**El par de direcciones.** Todo módulo con red incluye un método `ConnectionString(ctx, args...)` que devuelve la URL de conexión con el puerto del host, asignado dinámicamente, ya resuelto, y un `MustConnectionString(ctx, args...)` que hace panic si hay error. Es el patrón clásico de Go de la pareja con `Must`. De Postgres:

```go
func (c *PostgresContainer) MustConnectionString(ctx context.Context, args ...string) string {
    addr, err := c.ConnectionString(ctx, args...)
    if err != nil {
        panic(err)
    }
    return addr
}

func (c *PostgresContainer) ConnectionString(ctx context.Context, args ...string) (string, error) {
    endpoint, err := c.PortEndpoint(ctx, "5432/tcp", "")
    if err != nil {
        return "", err
    }
    extraArgs := strings.Join(args, "&")
    return fmt.Sprintf("postgres://%s:%s@%s/%s?%s", c.user, c.password, endpoint, c.dbName, extraArgs), nil
}
```

`PortEndpoint` es un método que el wrapper hereda del `testcontainers.Container` embebido. El usuario, la contraseña y el nombre de la base de datos salen de los campos capturados en el struct del wrapper. Los dos métodos son simples, y la simetría entre módulos hace que sea fácil echar mano de ellos.

**Helpers operativos.** Cuando un módulo tiene trabajo que ofrecer más allá de "dame la dirección", también vive en el wrapper. Los módulos de bases de datos suelen añadir helpers de guardar y revertir estado. Los de colas pueden añadir comodidades para productores o consumidores. Los de servicios web pueden exponer atajos de health check. El catálogo varía según el módulo, pero el sitio donde viven esos métodos no. Son los métodos que hacen que un módulo merezca importarse por algo más que el handle del contenedor.

## Opciones por llamada: una segunda superficie de opciones

Un módulo puede añadir un segundo patrón de functional options por encima de los customizers de la request: opciones que configuran la llamada a un único método del contenedor, en lugar de la request. Postgres lo hace en algunos de sus helpers operativos, que aceptan su propio tipo de opción, distinto de `testcontainers.ContainerCustomizer`.

Los dos patrones comparten la forma de "functional options" y nada más. `ContainerCustomizer` muta el contenedor antes de que exista. El tipo de opción por llamada muta una llamada a un método cuando ya existe. No son intercambiables. Un futuro post de esta serie estará dedicado al módulo de Postgres: la maquinaria de snapshots, el seguimiento del driver SQL, las opciones por llamada y cómo se componen.

## El alias deprecado RunContainer

Al leer la mayoría de los módulos, verás dos puntos de entrada exportados uno junto al otro:

```go
// Deprecated: use Run instead
// RunContainer creates an instance of the Postgres container type
func RunContainer(ctx context.Context, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error) {
    return Run(ctx, "postgres:16-alpine", opts...)
}

// Run creates an instance of the Postgres container type
func Run(ctx context.Context, img string, opts ...testcontainers.ContainerCustomizer) (*PostgresContainer, error) {
    // ...
}
```

`RunContainer` es la forma heredada, que se mantiene por compatibilidad hacia atrás. Fija una imagen por defecto y delega en `Run`. El comentario de documentación la marca como deprecada. El código nuevo usa `Run`, que recibe la imagen como segundo argumento y coincide con la firma del `testcontainers.Run` base. La mayoría de los módulos todavía conservan el alias.

Por eso en los posts 1, 2 y 3 he repetido siempre "usa `Run`": la API ha avanzado, pero el nombre viejo sigue en el código fuente. Si lees los módulos y dudas a cuál llamar, la marca de deprecación es la respuesta.

## Dónde se desvían los módulos de la forma común

El esqueleto estándar es un buen valor por defecto, no una obligación. Estos son los sitios donde vi que se dobla:

**Organización de ficheros.** MySQL mantiene todas sus opciones en línea, dentro de `mysql.go`, en lugar de separarlas en un `options.go`. El dialecto es el mismo que el de Postgres para mutar la request. Lo único es que el fichero no se divide. Los módulos más pequeños tienden a hacer esto.

**Subpaquetes.** Mongo tiene dos: `modules/mongodb/atlaslocal/` (un módulo propio, con su propio `Run`, para la imagen MongoDB Atlas Local) y `modules/mongodb/mount/` (que lleva un script de entrypoint de shell que usa el módulo padre). El primero es un módulo hermano que vive bajo el paraguas de Mongo. El segundo es un directorio de recursos presentado como subpaquete, porque `//go:embed` de Go trabaja con rutas relativas al paquete.

**Ficheros extra.** Mongo tiene además un `cli.go` que envuelve la CLI de Mongo para los lifecycle hooks del módulo. Postgres tiene la carpeta `resources/` con un entrypoint embebido. Los módulos amplían la estructura cuando la superficie lo justifica.

Ninguna de estas cosas rompe el patrón canónico. Lo extienden por motivos concretos que se sostienen al inspeccionarlos.

## Cómo elegir la forma al escribir un módulo

Una guía corta y con opinión, si vas a escribir un módulo nuevo:

- Empieza por la estructura canónica: `<name>.go` para la superficie pública (`Run` + wrapper + helpers), `options.go` para las opciones, más tests, ejemplos y tu propio `go.mod`.
- Usa customizers que mutan la request (funciones que devuelven `testcontainers.CustomizeRequestOption` o `testcontainers.ContainerCustomizer`) para todo lo que va en la request: variables de entorno, puertos, ficheros, lifecycle hooks. Es el dialecto dominante.
- Recurre al struct local `options` + el tipo `Option` solo cuando necesites estado tipado que el wrapper leerá más tarde (un nombre de driver, un flag) y que no pertenezca a la request de Docker.
- Embebe `testcontainers.Container` en tu wrapper. Quien te use obtiene la API base gratis, y tú tienes un único sitio donde añadir los métodos propios del módulo.
- Pon en el wrapper los helpers de resolución de direcciones (`ConnectionString` y su primo `Must*`). Pon ahí también los helpers operativos.
- Usa `WithAdditionalLifecycleHooks` siempre que una opción condicional necesite preparación posterior al arranque. Evita `WithLifecycleHooks` fuera de la configuración base: la regla posicional del [post de lifecycle hooks](/es/posts/2026-06-19-entendiendo-testcontainers-sistema-lifecycle-hooks/) explica por qué.

Si quieres un recorrido completo desde la "idea" hasta el "módulo publicado", el [post del módulo de Subscriptions](/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module) cubre la mirada de autor que este post deja fuera a propósito.

## Cierre

Sesenta y cinco módulos, una forma con variantes documentadas. Un esqueleto estándar, un tipo wrapper que embebe el contenedor base, dos dialectos de opciones que conviven dentro del mismo fichero, métodos auxiliares que justifican el import y un `go.mod` separado por módulo para mantener las dependencias limpias. Cada módulo es una capa fina que compone todo lo que ha cubierto el resto de la serie: las functional options del post 1, las wait strategies del post 2, los lifecycle hooks del post 3. El patrón es lo bastante consistente como para que "otro módulo" casi nunca signifique "más código que aprender", y lo bastante variado como para que leer uno nuevo siga enseñándote algo.

El siguiente post sigue el hilo una capa más hacia fuera, hasta la reutilización de contenedores y los IDs de sesión. Cada contenedor que crea la biblioteca lleva estampado un pequeño conjunto de labels. El motor las usa para encontrar contenedores existentes antes de crear otros nuevos, para acotar la limpieza a la ejecución de tests correcta y para hacer que una sesión sea "tuya". Esa es la siguiente pieza que toca desmontar.

---

*Recursos:*
- *[testcontainers-go en GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[Directorio `modules/`](https://github.com/testcontainers/testcontainers-go/tree/main/modules)*
- *[Código fuente del módulo de Postgres](https://github.com/testcontainers/testcontainers-go/tree/main/modules/postgres)*
- *[Documentación de los módulos de Testcontainers](https://golang.testcontainers.org/modules/)*
