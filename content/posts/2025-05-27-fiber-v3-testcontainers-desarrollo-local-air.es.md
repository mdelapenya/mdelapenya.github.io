---
title: "Fiber v3 y Testcontainers: desarrollo local como en producción con Air"
date: 2025-05-27 10:00:00 +0530
description: "Cómo usar los Services de Fiber v3 con Testcontainers y Air para tener un entorno de desarrollo local rápido y parecido a producción."
categories: [Go, Fiber, GoFiber, Testcontainers]
tags: ["go", "gofiber", "testcontainers", "air", "local-development", "gorm", "postgres"]
type: post
weight: 25
translationKey: gofiber-services-testcontainers
translatedFrom: efd20fc
---

![Fiber v3 + Testcontainers](/images/posts/2025-05-27-gofiber-services-testcontainers/cover.png)

Con la próxima versión 3, `Fiber` introduce una abstracción nueva y potente: `Services`. Ofrece una forma estandarizada de arrancar y gestionar servicios de apoyo como bases de datos, colas y emuladores de la nube, directamente dentro del ciclo de vida de tu app y sin ninguna orquestación extra. Y todavía más interesante: el nuevo módulo `contrib` que conecta `Services` con `Testcontainers`, para levantar dependencias reales de forma limpia y testeable.

En este post te cuento cómo usar estas novedades construyendo una pequeña app de Fiber que usa un contenedor de PostgreSQL para la persistencia, todo gestionado con la nueva interfaz de servicios.

## TL;DR

- Usa la nueva API `Services` de Fiber v3 para gestionar los contenedores de apoyo.
- Intégrala con `testcontainers-go` para arrancar un contenedor de PostgreSQL automáticamente.
- Añade recarga en caliente con `air` para tener un bucle de desarrollo rápido.
- Reutiliza los contenedores durante el desarrollo desactivando Ryuk y poniéndoles siempre el mismo nombre.

👉 El ejemplo completo está aquí: [repositorio de GitHub](https://github.com/mdelapenya/testcontainers-go-examples/tree/main/gofiber-services)

## Desarrollo local, el estado del arte

Este es un post sobre desarrollo en Go, pero antes veamos cómo abordan el desarrollo local otros frameworks importantes, incluso de otros lenguajes.

En el ecosistema Java, los frameworks más relevantes, como `Spring Boot`, `Micronaut` y `Quarkus`, tienen el concepto de `Development-time Services`. Veamos cómo resuelve cada uno esta idea de los servicios.

De la [documentación de Spring Boot](https://docs.spring.io/spring-boot/reference/features/dev-services.html):

> Los servicios en tiempo de desarrollo proporcionan las dependencias externas que necesita la aplicación para ejecutarse mientras la desarrollas. Solo deben usarse durante el desarrollo y se desactivan cuando la aplicación se despliega.

Micronaut usa el concepto de [Test Resources](https://micronaut-projects.github.io/micronaut-test-resources/latest/guide/):

> Micronaut Test Resources añade soporte para gestionar los recursos externos que hacen falta durante el desarrollo o los tests.
>
> Por ejemplo, una aplicación puede necesitar una base de datos para funcionar (digamos MySQL), pero quizá esa base de datos no esté instalada en la máquina de desarrollo, o no quieras encargarte tú de montarla y desmontarla a mano.

Y por último, en Quarkus también existe el concepto de [Dev Services](https://es.quarkus.io/guides/dev-services).

> Quarkus soporta el aprovisionamiento automático de servicios sin configurar en modo desarrollo y en modo test. A esta capacidad la llamamos Dev Services.

Volviendo a Go, uno de los frameworks más populares, [Fiber](https://gofiber.io/), ha añadido el concepto de `Services`, e incluye un nuevo módulo contrib que da soporte a servicios respaldados por Testcontainers.

## ¿Qué hay de nuevo en Fiber v3?

De todas las novedades de Fiber v3, hay dos que importan para este post:

- 🔌 [Services](https://docs.gofiber.io/next/api/services): define y asocia recursos externos (como bases de datos) a tu app de forma composable. Con este enfoque, los servicios externos se arrancan y se paran automáticamente junto con tu app de Fiber.
- 🧪 [Módulo contrib para Testcontainers](https://docs.gofiber.io/contrib/next/testcontainers/): arranca servicios de apoyo reales con contenedores Docker, gestionados de forma programática desde el ciclo de vida de tu app.

## Una app sencilla con Fiber y Testcontainers

La aplicación que vamos a construir es una app de Fiber sencilla que usa un contenedor de PostgreSQL para la persistencia. Está basada en la [receta `todo-app-with-auth-form` de Fiber](https://github.com/gofiber/recipes/tree/master/todo-app-with-auth-gorm), pero usa la nueva API `Services` para arrancar un contenedor de PostgreSQL, en lugar de una base de datos SQLite en memoria.

### Estructura del proyecto

```
.
├── app
|    ├── dal
|    |    ├── todo.dal.go
|    |    ├── todo.dal_test.go
|    |    ├── user.dal.go
|    |    └── user.dal_test.go
|    ├── routes
|    |    ├── auth.routes.go
|    |    └── todo.routes.go
|    ├── services
|    |    ├── auth.service.go
|    |    └── todo.service.go
|    └── types
|         ├── auth.types.go
|         ├── todo.types.go
|         └── types.go
├── config
|    ├── database
|    |    └── database.go
|    ├── config.go
|    ├── config_dev.go
|    ├── env.go
|    └── types.go
├── utils
|    ├── jwt
|    |    └── jwt.go
|    ├── middleware
|    |    └── authentication.go
|    └── password
|         └── password.go
├── .air.conf
├── .env
├── main.go
└── go.mod
└── go.sum
```

La app expone varios endpoints, para `/users` y `/todos`, y guarda los datos en una instancia de PostgreSQL arrancada con Testcontainers. Así encaja todo.

Como la aplicación parte de una receta, no voy a entrar en los detalles de cómo se crean las rutas, los servicios y la capa de acceso a datos. Tienes el código completo en el [repositorio de GitHub](https://github.com/gofiber/recipes/tree/master/todo-app-with-auth-gorm).

Lo que sí voy a contar es cómo usar Testcontainers para arrancar el contenedor de PostgreSQL, y cómo usar la API `Services` para gestionar su ciclo de vida, de modo que la capa de acceso a datos pueda usarlo sin preocuparse de ese ciclo de vida. Además, te cuento cómo usar `air` para tener un desarrollo local rápido y cómo gestionar el apagado controlado de la aplicación, separando la configuración de producción de la de desarrollo local.

En el paquete `config` hemos definido tres ficheros que configuran la aplicación según un build tag de Go. El primero, `config/types.go`, define un struct que guarda la configuración de la aplicación y las funciones de limpieza para el arranque y el apagado de los servicios.

```go
package config

import (
	"context"

	"github.com/gofiber/fiber/v3"
)

// AppConfig holds the application configuration and cleanup functions
type AppConfig struct {
	// App is the Fiber app instance.
	App *fiber.App
	// StartupCancel is the context cancel function for the services startup.
	StartupCancel context.CancelFunc
	// ShutdownCancel is the context cancel function for the services shutdown.
	ShutdownCancel context.CancelFunc
}

```

El fichero `config.go` contiene la configuración para entornos de producción:

```go
//go:build !dev

package config

import (
	"github.com/gofiber/fiber/v3"
)

// ConfigureApp configures the fiber app, including the database connection string.
// The connection string is retrieved from the environment variable DB, or using
// falls back to a default connection string targeting localhost if DB is not set.
func ConfigureApp(cfg fiber.Config) (*AppConfig, error) {
	app := fiber.New(cfg)

	db := getEnv("DB", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable")
	DB = db

	return &AppConfig{
		App:            app,
		StartupCancel:  func() {}, // No-op for production
		ShutdownCancel: func() {}, // No-op for production
	}, nil
}
```

La función `ConfigureApp` se encarga de crear la app de Fiber, y se usa en `main.go` para inicializar la aplicación. Por defecto intenta conectarse a una instancia de PostgreSQL usando la variable de entorno `DB`, y si no está definida, recurre a una instancia local de PostgreSQL. Además, usa funciones vacías para los campos `StartupCancel` y `ShutdownCancel`, porque en producción no necesitamos cancelar nada.

Si ejecutas la app con `go run main.go`, se aplica por defecto el tag `!dev`, y se usa la función `ConfigureApp` para inicializarla. Pero la aplicación no arrancará, porque la conexión con la instancia de PostgreSQL fallará.

```shell
go run main.go

2025/05/29 11:55:36 gofiber-services/config/database/database.go:18
[error] failed to initialize database, got error failed to connect to `user=postgres database=postgres`:
        [::1]:5432 (localhost): dial error: dial tcp [::1]:5432: connect: connection refused
        127.0.0.1:5432 (localhost): dial error: dial tcp 127.0.0.1:5432: connect: connection refused
panic: gorm open: failed to connect to `user=postgres database=postgres`:
                [::1]:5432 (localhost): dial error: dial tcp [::1]:5432: connect: connection refused
                127.0.0.1:5432 (localhost): dial error: dial tcp 127.0.0.1:5432: connect: connection refused

goroutine 1 [running]:
gofiber-services/config/database.Connect({0x105164a30?, 0x0?})
        gofiber-services/config/database/database.go:33 +0x9c
main.main()
        gofiber-services/main.go:34 +0xbc
exit status 2
```

¡Vamos a arreglarlo!

### Paso 1: añade las dependencias

Primero, tenemos que asegurarnos de que las dependencias están en el fichero `go.mod`:

> ⚠️ Nota: Fiber v3 sigue en desarrollo. Para usar Services, tendrás que traer la rama main desde GitHub:

```bash
go get github.com/gofiber/fiber/v3@main
go get github.com/gofiber/contrib/testcontainers
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
go get gorm.io/driver/postgres
```

### Paso 2: define un servicio de PostgreSQL con Testcontainers

Para aprovechar la nueva API `Services`, tenemos que definir un servicio nuevo. Podemos implementar la interfaz que expone la app de Fiber, como se muestra en la [documentación de la API Services](https://docs.gofiber.io/next/api/services#example-adding-a-service), o simplemente usar el módulo `contrib` de Testcontainers para crear el servicio, que es lo que vamos a hacer.

En el fichero `config/config_dev.go` definimos una función nueva que añade un contenedor de PostgreSQL como servicio a la aplicación de Fiber, usando el módulo `contrib` de Testcontainers. Este fichero usa el build tag `dev`, así que solo se usará cuando arranquemos la aplicación con `air`.

```go
//go:build dev

package config

import (
	"fmt"

	"github.com/gofiber/contrib/testcontainers"
	"github.com/gofiber/fiber/v3"
	tc "github.com/testcontainers/testcontainers-go"
	"github.com/testcontainers/testcontainers-go/modules/postgres"
)

// setupPostgres adds a Postgres service to the app, including custom configuration to allow
// reusing the same container while developing locally.
func setupPostgres(cfg *fiber.Config) (*testcontainers.ContainerService[*postgres.PostgresContainer], error) {
	// Add the Postgres service to the app, including custom configuration.
	srv, err := testcontainers.AddService(cfg, testcontainers.NewModuleConfig(
		"postgres-db",
		"postgres:16",
		postgres.Run,
		postgres.BasicWaitStrategies(),
		postgres.WithDatabase("todos"),
		postgres.WithUsername("postgres"),
		postgres.WithPassword("postgres"),
		tc.WithReuseByName("postgres-db-todos"),
	))
	if err != nil {
		return nil, fmt.Errorf("add postgres service: %w", err)
	}

	return srv, nil
}

```

Esto crea un `Service` reutilizable que Fiber arrancará y parará automáticamente junto con la app, y que se registra como parte del struct `fiber.Config` que usa nuestra aplicación. El servicio usa el módulo `postgres` del paquete `testcontainers` para crear el contenedor. Para saber más sobre el módulo de PostgreSQL, consulta la [documentación del módulo de PostgreSQL de Testcontainers](https://golang.testcontainers.org/modules/postgres/).

### Paso 3: inicializa la app de Fiber con el servicio de PostgreSQL

Nuestra `fiber.App` se inicializa en el fichero `config/config.go`, con la función `ConfigureApp` para entornos de producción. Para el desarrollo local, en cambio, tenemos que inicializar la `fiber.App` en el fichero `config/config_dev.go`, con una función de la misma firma, pero que use el módulo contrib para añadir el servicio de PostgreSQL a la configuración de la app.

Tenemos que definir un proveedor de contexto para el arranque y el apagado de los servicios, y añadir el servicio de PostgreSQL a la configuración de la app, con su configuración personalizada. El proveedor de contexto sirve para definir una política de cancelación del arranque y del apagado de los servicios, de forma que podamos cancelarlos si se cancela el contexto. Si no se define ningún proveedor de contexto, se usa por defecto `context.Background()`.

```go
// ConfigureApp configures the fiber app, including the database connection string.
// The connection string is retrieved from the PostgreSQL service.
func ConfigureApp(cfg fiber.Config) (*AppConfig, error) {
	// Define a context provider for the services startup.
	// The timeout is applied when the context is actually used during startup.
	startupCtx, startupCancel := context.WithCancel(context.Background())
	var startupTimeoutCancel context.CancelFunc
	cfg.ServicesStartupContextProvider = func() context.Context {
		// Cancel any previous timeout context
		if startupTimeoutCancel != nil {
			startupTimeoutCancel()
		}
		// Create a new timeout context
		ctx, cancel := context.WithTimeout(startupCtx, 10*time.Second)
		startupTimeoutCancel = cancel
		return ctx
	}

	// Define a context provider for the services shutdown.
	// The timeout is applied when the context is actually used during shutdown.
	shutdownCtx, shutdownCancel := context.WithCancel(context.Background())
	var shutdownTimeoutCancel context.CancelFunc
	cfg.ServicesShutdownContextProvider = func() context.Context {
		// Cancel any previous timeout context
		if shutdownTimeoutCancel != nil {
			shutdownTimeoutCancel()
		}
		// Create a new timeout context
		ctx, cancel := context.WithTimeout(shutdownCtx, 10*time.Second)
		shutdownTimeoutCancel = cancel
		return ctx
	}

	// Add the Postgres service to the app, including custom configuration.
	srv, err := setupPostgres(&cfg)
	if err != nil {
		if startupTimeoutCancel != nil {
			startupTimeoutCancel()
		}
		if shutdownTimeoutCancel != nil {
			shutdownTimeoutCancel()
		}
		startupCancel()
		shutdownCancel()
		return nil, fmt.Errorf("add postgres service: %w", err)
	}

	app := fiber.New(cfg)

	// Retrieve the Postgres service from the app, using the service key.
	postgresSrv := fiber.MustGetService[*testcontainers.ContainerService[*postgres.PostgresContainer]](app.State(), srv.Key())

	connString, err := postgresSrv.Container().ConnectionString(context.Background())
	if err != nil {
		if startupTimeoutCancel != nil {
			startupTimeoutCancel()
		}
		if shutdownTimeoutCancel != nil {
			shutdownTimeoutCancel()
		}
		startupCancel()
		shutdownCancel()
		return nil, fmt.Errorf("get postgres connection string: %w", err)
	}

	// Override the default database connection string with the one from the Testcontainers service.
	DB = connString

	return &AppConfig{
		App: app,
		StartupCancel: func() {
			if startupTimeoutCancel != nil {
				startupTimeoutCancel()
			}
			startupCancel()
		},
		ShutdownCancel: func() {
			if shutdownTimeoutCancel != nil {
				shutdownTimeoutCancel()
			}
			shutdownCancel()
		},
	}, nil
}
```

Esta función:
- Define un proveedor de contexto para el arranque y el apagado de los servicios, con un timeout que se aplica cuando el contexto se usa de verdad en el arranque y en el apagado.
- Añade el servicio de PostgreSQL a la configuración de la app.
- Recupera el servicio de PostgreSQL desde la caché de estado de la app.
- Usa el servicio de PostgreSQL para obtener la cadena de conexión.
- Sustituye la cadena de conexión a la base de datos por defecto por la del servicio de Testcontainers.
- Devuelve la configuración de la app.

Como resultado, la `fiber.App` se inicializa con el servicio de PostgreSQL, y este se arranca y se para automáticamente junto con la app. El servicio que representa el contenedor de PostgreSQL queda disponible como parte del `State` de la aplicación, y podemos recuperarlo fácilmente desde su caché de estado. Consulta la [documentación de State Management](https://docs.gofiber.io/next/api/state) para más detalles sobre cómo usar la caché de `State`.

### Paso 4: optimiza el desarrollo local reutilizando el contenedor

Fíjate en que, en el fichero `config/config_dev.go`, se usa la opción `tc.WithReuseByName` para reutilizar el mismo contenedor mientras desarrollamos en local. Así nos ahorramos esperar a que la base de datos esté lista cada vez que se arranca la aplicación.

Además, define `TESTCONTAINERS_RYUK_DISABLED=true` para evitar que se limpien los contenedores entre recargas en caliente. En el fichero `.env`, añade lo siguiente:

```txt
TESTCONTAINERS_RYUK_DISABLED=true
```

[Ryuk](https://golang.testcontainers.org/features/garbage_collector/#ryuk) es el contenedor auxiliar de Testcontainers que elimina los recursos de Docker creados por Testcontainers. En nuestro caso, como queremos desarrollar en local con `air`, no queremos que se elimine el contenedor cada vez que la aplicación se recarga en caliente. Por eso desactivamos Ryuk y le damos al contenedor un nombre que se reutilizará en las sucesivas ejecuciones de la aplicación.


### Paso 5: recupera e inyecta la conexión a PostgreSQL

Ahora que el servicio de PostgreSQL forma parte de la aplicación, podemos usarlo en nuestra capa de acceso a datos. La aplicación tiene una variable de configuración global con la cadena de conexión a la base de datos, en el fichero `config/env.go`:

```go
	// DB returns the connection string of the database.
	DB = getEnv("DB", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable")
```

Recupera el servicio desde el estado de la app y úsalo para conectarte:

```go
    // Add the PostgreSQL service to the app, including custom configuration.
	srv, err := setupPostgres(&cfg)
	if err != nil {
		panic(err)
	}

	app := fiber.New(cfg)

	// Retrieve the PostgreSQL service from the app, using the service key.
	postgresSrv := fiber.MustGetService[*testcontainers.ContainerService[*postgres.PostgresContainer]](app.State(), srv.Key())
```

Aquí, la función `fiber.MustGetService` recupera un servicio genérico de la caché de `State`, y tenemos que convertirlo al tipo de servicio concreto, en este caso `*testcontainers.ContainerService[*postgres.PostgresContainer]`.

- `testcontainers.ContainerService[T]` es un servicio genérico que envuelve una instancia de `testcontainers.Container`. Lo proporciona el módulo `github.com/gofiber/contrib/testcontainers`.
- `*postgres.PostgresContainer` es el tipo concreto del contenedor, en este caso un contenedor de PostgreSQL. Lo proporciona el módulo `github.com/testcontainers/testcontainers-go/modules/postgres`.

Una vez que tenemos el servicio `postgresSrv`, podemos usarlo para conectarnos a la base de datos. El tipo `ContainerService` ofrece un método `Container()` que desenvuelve el contenedor del servicio, así que podemos usar las APIs del paquete `testcontainers` para interactuar con él. Por último, pasamos la cadena de conexión a la variable global `DB`, para que la capa de acceso a datos pueda usarla para conectarse a la base de datos.

```go
	// Retrieve the PostgreSQL service from the app, using the service key.
	postgresSrv := fiber.MustGetService[*testcontainers.ContainerService[*postgres.PostgresContainer]](app.State(), srv.Key())

	connString, err := postgresSrv.Container().ConnectionString(context.Background())
	if err != nil {
		panic(err)
	}

    // Override the default database connection string with the one from the Testcontainers service.
	config.DB = connString

	database.Connect(config.DB)
```

### Paso 6: recarga en vivo con air

Vamos a añadir el build tag al comando de `air`, para completar nuestra experiencia de desarrollo local. Tenemos que añadir el flag `-tags dev` al comando que compila la aplicación. En `.air.conf`, añade el flag `-tags dev` para asegurarte de que se usa la configuración de desarrollo:

```txt
cmd = "go build -tags dev -o ./todo-api ./main.go"
```

### Paso 7: apagado controlado

Fiber apaga automáticamente la aplicación y todos sus servicios cuando la aplicación se detiene. Pero `air` no le pasa a la aplicación la señal adecuada para disparar ese apagado, así que tenemos que hacerlo a mano.

En `main.go`, tenemos que escuchar desde otra goroutine y avisar al hilo principal cuando llegue una señal de interrupción o de terminación. Añade esto al final de la función `main`:

```go
    // Listen from a different goroutine
	go func() {
		if err := app.Listen(fmt.Sprintf(":%v", config.PORT)); err != nil {
			log.Panic(err)
		}
	}()

	quit := make(chan os.Signal, 1)                    // Create channel to signify a signal being sent
	signal.Notify(quit, os.Interrupt, syscall.SIGTERM) // When an interrupt or termination signal is sent, notify the channel

	<-quit // This blocks the main thread until an interrupt is received
	fmt.Println("Gracefully shutting down...")
	err = app.Shutdown()
	if err != nil {
		log.Panic(err)
	}
```

Y tenemos que asegurarnos de que `air` le pasa a la aplicación la señal adecuada para disparar el apagado. Añade esto a `.air.conf` para que funcione:

```
# Send Interrupt signal before killing process (windows does not support this feature)
send_interrupt = true
```

Con esto, `air` enviará una señal de interrupción a la aplicación cuando se detenga, y podremos disparar el apagado controlado cuando paremos la aplicación con `air`.

## Verlo en acción

Ya podemos arrancar la aplicación con `air`: levantará el contenedor de PostgreSQL automáticamente y gestionará el apagado controlado cuando la paremos. ¡Vamos a verlo!

Arranca la aplicación con `air`. Deberías ver una salida como esta en los logs:

```bash
air

`.air.conf` will be deprecated soon, recommend using `.air.toml`.

  __    _   ___  
 / /\  | | | |_) 
/_/--\ |_| |_| \_ v1.61.7, built with Go go1.24.1

mkdir gofiber-services/tmp
watching .
watching app
watching app/dal
watching app/routes
watching app/services
watching app/types
watching config
watching config/database
!exclude tmp
watching utils
watching utils/jwt
watching utils/middleware
watching utils/password
building...
running...
[DATABASE]::CONNECTED

2025/05/29 07:33:19 gofiber-services/config/database/database.go:44
[89.614ms] [rows:1] SELECT count(*) FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'users' AND table_type = 'BASE TABLE'

2025/05/29 07:33:19 gofiber-services/config/database/database.go:44
[31.446ms] [rows:0] CREATE TABLE "users" ("id" bigserial,"created_at" timestamptz,"updated_at" timestamptz,"deleted_at" timestamptz,"name" text,"email" text NOT NULL,"password" text NOT NULL,PRIMARY KEY ("id"))

2025/05/29 07:33:19 gofiber-services/config/database/database.go:44
[28.312ms] [rows:0] CREATE UNIQUE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email")

2025/05/29 07:33:19 gofiber-services/config/database/database.go:44
[28.391ms] [rows:0] CREATE INDEX IF NOT EXISTS "idx_users_deleted_at" ON "users" ("deleted_at")

2025/05/29 07:33:19 gofiber-services/config/database/database.go:44
[28.920ms] [rows:1] SELECT count(*) FROM information_schema.tables WHERE table_schema = CURRENT_SCHEMA() AND table_name = 'todos' AND table_type = 'BASE TABLE'

2025/05/29 07:33:19 gofiber-services/config/database/database.go:44
[29.659ms] [rows:0] CREATE TABLE "todos" ("id" bigserial,"created_at" timestamptz,"updated_at" timestamptz,"deleted_at" timestamptz,"task" text NOT NULL,"completed" boolean DEFAULT false,"user" bigint,PRIMARY KEY ("id"),CONSTRAINT "fk_users_todos" FOREIGN KEY ("user") REFERENCES "users"("id"))

2025/05/29 07:33:19 gofiber-services/config/database/database.go:44
[27.900ms] [rows:0] CREATE INDEX IF NOT EXISTS "idx_todos_deleted_at" ON "todos" ("deleted_at")

    _______ __             
   / ____(_) /_  ___  _____
  / /_  / / __ \/ _ \/ ___/
 / __/ / / /_/ /  __/ /    
/_/   /_/_.___/\___/_/          v3.0.0-beta.4
--------------------------------------------------
INFO Server started on:         http://127.0.0.1:8000 (bound on host 0.0.0.0 and port 8000)
INFO Services:  1
INFO    🥡 [ RUNNING ] postgres-db (using testcontainers-go)
INFO Total handlers count:      10
INFO Prefork:                   Disabled
INFO PID:                       36210
INFO Total process count:       1
```

Si abrimos un terminal y miramos los contenedores en ejecución, vemos que el contenedor de PostgreSQL está corriendo:

```bash
docker ps
CONTAINER ID   IMAGE         COMMAND                  CREATED         STATUS         PORTS                       NAMES
8dc70e1124da   postgres:16   "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   127.0.0.1:32911->5432/tcp   postgres-db-todos
```

Fíjate en dos cosas importantes:
- el nombre del contenedor es `postgres-db-todos`, el que le dimos en la función `setupPostgres`.
- el contenedor mapea el puerto estándar de PostgreSQL, `5432`, a un puerto del host asignado dinámicamente, el `32911`. Es una característica de Testcontainers para evitar conflictos de puertos cuando se ejecutan varios contenedores del mismo tipo, y hace que la ejecución sea determinista y fiable. Para saber más, consulta la [documentación de Testcontainers](https://golang.testcontainers.org/features/networking/#exposing-container-ports-to-the-host).

### Un bucle de desarrollo rápido

Si ahora paramos la aplicación con `air`, vemos que el contenedor también se para, gracias al apagado controlado que hemos implementado en la aplicación.

Pero lo mejor de todo es que, si dejas que `air` gestione las recargas y modificas la aplicación, `air` la recargará en caliente y el contenedor de PostgreSQL se reutilizará 🤯, así que no hay que esperar a que arranque. ¡Genial! 🚀

Echa un vistazo al ejemplo completo en el [repositorio de GitHub](https://github.com/mdelapenya/testcontainers-go-examples/tree/main/gofiber-services).

### Tests de integración

La aplicación incluye tests de integración para la capa de acceso a datos, en la carpeta `app/dal`. Usan Testcontainers para crear la base de datos y probarla de forma aislada. Ejecuta los tests con:

```bash
go test -v ./app/dal
```

En menos de 10 segundos tenemos una base de datos limpia y comprobamos que nuestra capa de persistencia se comporta como esperamos.

Gracias a Testcontainers, los tests pueden ejecutarse junto a la aplicación, cada uno con su propio contenedor aislado y puertos aleatorios.

## Conclusión

La abstracción `Services` de Fiber v3, combinada con Testcontainers, desbloquea una experiencia de desarrollo local sencilla y parecida a producción. Se acabaron los scripts artesanales y los entornos desincronizados: solo código Go que se ejecuta limpio en cualquier sitio, con una experiencia de "Clone & Run". Además, usar Testcontainers da una experiencia de desarrollo unificada para los tests de integración y para el desarrollo local, una forma estupenda de probar tu aplicación de manera limpia y determinista, con dependencias reales.

Como hemos separado la configuración de producción de la de desarrollo local, la misma base de código puede dar soporte a los dos entornos sin contaminar producción con herramientas o dependencias que solo sirven para desarrollar.

## ¿Qué sigue?

- Echa un vistazo a los distintos módulos de testcontainers en el [catálogo de módulos de Testcontainers](https://testcontainers.com/modules?language=go).
- Consulta el repositorio de [Testcontainers Go](https://github.com/testcontainers/testcontainers-go) para saber más sobre la librería Testcontainers Go.
- Prueba [Testcontainers Cloud](https://testcontainers.com/cloud) para ejecutar los contenedores de los servicios de forma fiable, en local y en tu CI.

💬 ¿Tienes comentarios o quieres contar cómo usas Fiber v3? Deja un comentario o abre un issue en el [repositorio de GitHub](https://github.com/mdelapenya/testcontainers-go-examples).
