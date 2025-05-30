---
title: "Fiber v3 + Testcontainers: Production-like Local Dev with Air"
date: 2025-05-27 10:00:00 +0530
image: "/images/posts/2025-05-27-gofiber-services-testcontainers/cover.png"
description: "How to Use Fiber v3 Services with Testcontainers and Air for Fast Local Dev"
categories: [Go, Fiber, GoFiber, Testcontainers]
tags: ["go", "gofiber", "testcontainers", "air", "local-development", "gorm", "postgres"]
type: post
weight: 25
showTableOfContents: true
---

![Fiber v3 + Testcontainers](/images/posts/2025-05-27-gofiber-services-testcontainers/cover.png)

With the upcoming v3 release, `Fiber` is introducing a powerful new abstraction: `Services`. These provide a standardized way to start and manage backing services like databases, queues, and cloud emulators, enabling you to manage backing services directly as part of your app's lifecycle, with no extra orchestration required. Even more exciting is the new `contrib` module that connects `Services` with `Testcontainers`, allowing you to spin up real service dependencies in a clean and testable way.

In this post, I'll walk through how to use these new features by building a small Fiber app that uses a PostgreSQL container for persistence, all managed via the new Service interface.

## TL;DR

- Use Fiber v3's new `Services` API to manage backing containers.
- Integrate with `testcontainers-go` to start a PostgreSQL container automatically.
- Add hot-reloading with `air` for a fast local dev loop.
- Reuse containers during dev by disabling Ryuk and naming them consistently.

👉 Full example here: [GitHub Repo](https://github.com/mdelapenya/testcontainers-go-examples/tree/main/gofiber-services)

## Local Development, state of the art

This is a blog post about developing in Go, but let's look at how other major frameworks approach local development, even across different programming languages.

In the Java ecosystem, the most important frameworks, such as `Spring Boot`, `Micronaut` and `Quarkus`, have the concept of `Development-time Services`. Let's look at how other ecosystems handle this concept of services.

From [Spring Boot docs](https://docs.spring.io/spring-boot/reference/features/dev-services.html):

> Development-time services provide external dependencies needed to run the application while developing it. They are only supposed to be used while developing and are disabled when the application is deployed.

Micronaut uses the concept of [Test Resources](https://micronaut-projects.github.io/micronaut-test-resources/latest/guide/):

> Micronaut Test Resources adds support for managing external resources which are required during development or testing.
>
> For example, an application may need a database to run (say MySQL), but such a database may not be installed on the development machine or you may not want to handle the setup and tear down of the database manually.

And finally, in Quarkus, the concept of [Dev Services](https://es.quarkus.io/guides/dev-services) is also present.

> Quarkus supports the automatic provisioning of unconfigured services in development and test mode. We refer to this capability as Dev Services.

Back to Go, one of the most popular frameworks, [Fiber](https://gofiber.io/), has added the concept of `Services`, including a new contrib module to add support for Testcontainers-backed services.

## What's New in Fiber v3?

Among all the new features in Fiber v3, we have two main ones that are relevant to this post:

- 🔌 [Services](https://docs.gofiber.io/next/api/services): Define and attach external resources (like databases) to your app in a composable way. This new approach ensures external services are automatically started and stopped with your Fiber app.
- 🧪 [Contrib module for Testcontainers](https://docs.gofiber.io/contrib/next/testcontainers/): Start real backing services using Docker containers, managed directly from your app's lifecycle in a programmable way.

## A Simple Fiber App using Testcontainers

The application we are going to build is a simple Fiber app that uses a PostgreSQL container for persistence. It's based on [`todo-app-with-auth-form` Fiber recipe](https://github.com/gofiber/recipes/tree/master/todo-app-with-auth-gorm), but using the new Services API to start a PostgreSQL container, instead of an in-memory SQLite database.

### Project Structure

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

This app exposes several endpoints, for `/users` and `/todos`, and stores data in a PostgreSQL instance started using Testcontainers. Here's how it's put together.

Since the application is based on a recipe, we'll skip the details of creating the routes, the services and the data access layer. You can find the complete code in the [GitHub repository](https://github.com/gofiber/recipes/tree/master/todo-app-with-auth-gorm).

But I'll cover the details about how to use Testcontainers to start the PostgreSQL container, and how to use the Services API to manage the lifecycle of the container, so that the data access layer can use it without having to worry about the lifecycle of the container. Furthermore, I'll cover how to use `air` to have a fast local development experience, and how to handle the graceful shutdown of the application, separating the configuration for production and local development.

In the `config` package, we have defined three files that will be used to configure the application, depending on a Go build tag. The first one, the `config/types.go` file, defines a struct to hold the application configuration and the cleanup functions for the services startup and shutdown.

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

The `config.go` file have the configuration for production environments:

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

The `ConfigureApp` function is responsible for creating the Fiber app, and it's used in the `main.go` file to initialize the application. By default, it will try to connect to a PostgreSQL instance, using the `DB` environment variable, falling back to a local PostgreSQL instance if the environment variable is not set. It also uses empty functions for the `StartupCancel` and `ShutdownCancel` fields, as we don't need to cancel anything in production.

When running the app with `go run main.go`, the `!dev` tag applies by default, and the `ConfigureApp` function will be used to initialize the application. But the application will not start, as the connection to the PostgreSQL instance will fail.

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

Let's fix that!

### Step 1: Add the dependencies

First, we need to make sure we have the dependencies added to the `go.mod` file:

> ⚠️ Note: Fiber v3 is still in development. To use Services, you'll need to pull the main branch from GitHub:

```bash
go get github.com/gofiber/fiber/v3@main
go get github.com/gofiber/contrib/testcontainers
go get github.com/testcontainers/testcontainers-go
go get github.com/testcontainers/testcontainers-go/modules/postgres
go get gorm.io/driver/postgres
```

### Step 2: Define a PostgreSQL Service using Testcontainers

To leverage the new `Services` API, we need to define a new service. We can implement the interface exposed by the Fiber app, as shown in the [Services API docs](https://docs.gofiber.io/next/api/services#example-adding-a-service), or simply use the Testcontainers `contrib` module to create a new service, as we are going to do next.

In the `config/config_dev.go` file, we define a new function to add a PostgreSQL container as a service to the Fiber application, using the Testcontainers `contrib` module. This file is using the `dev` build tag, so it will only be used when we start the application with `air`.

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

This creates a reusable `Service` that Fiber will automatically start and stop along with the app, and it's registered as part of the `fiber.Config` struct that our application uses. This new service uses the `postgres` module from the `testcontainers` package to create the container. To learn more about the PostgreSQL module, please refer to the [Testcontainers PostgreSQL module documentation](https://golang.testcontainers.org/modules/postgres/).

### Step 3: Initialize the Fiber App with the PostgreSQL Service

Our `fiber.App` is initialized in the `config/config.go` file, using the `ConfigureApp` function for production environments. For local development, instead, we need to initialize the `fiber.App` in the `config/config_dev.go` file, using a function with the same signature, but using the contrib module to add the PostgreSQL service to the app config.

We need to define a context provider for the services startup and shutdown, and add the PostgreSQL service to the app config, including custom configuration. The context provider is useful to define a cancel policy for the services startup and shutdown, so we can cancel the startup or shutdown if the context is canceled. If no context provider is defined, the default is to use the `context.Background()`.

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

This function:
- Defines a context provider for the services startup and shutdown, defining a timeout for the startup and shutdown when the context is actually used during startup and shutdown.
- Adds the PostgreSQL service to the app config.
- Retrieves the PostgreSQL service from the app's state cache.
- Uses the PostgreSQL service to obtain the connection string.
- Overrides the default database connection string with the one from the Testcontainers service.
- Returns the app config.

As a result, the `fiber.App` will be initialized with the PostgreSQL service, and it will be automatically started and stopped along with the app. The service representing the PostgreSQL container will be available as part of the application `State`, which we can easily retrieve from the app's state cache. Please refer to the [State Management docs](https://docs.gofiber.io/next/api/state) for more details about how to use the `State` cache.

### Step 4: Optimizing Local Dev with Container Reuse

Please note that, in the `config/config_dev.go` file, the `tc.WithReuseByName` option is used to reuse the same container while developing locally. This is useful to avoid having to wait for the database to be ready when the application is started.

Also, set `TESTCONTAINERS_RYUK_DISABLED=true` to prevent container cleanup between hot reloads. In the `.env` file, add the following:

```txt
TESTCONTAINERS_RYUK_DISABLED=true
```

[Ryuk](https://golang.testcontainers.org/features/garbage_collector/#ryuk) is the Testcontainers companion container that removes the Docker resources created by Testcontainers. For our use case, where we want to develop locally using `air`, we don't want to remove the container when the application is hot-reloaded, so we disable Ryuk and give the container a name that will be reused across multiple runs of the application.


### Step 5: Retrieve and Inject the PostgreSQL Connection

Now that the PostgreSQL service is part of the application, we can use it in our data access layer. The application has a global configuration variable that includes the database connection string, in the `config/env.go` file:

```go
	// DB returns the connection string of the database.
	DB = getEnv("DB", "postgres://postgres:postgres@localhost:5432/postgres?sslmode=disable")
```

Retrieve the service from the app's state and use it to connect:

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

Here, the `fiber.MustGetService` function is used to retrieve a generic service from the `State` cache, and we need to cast it to the specific service type, in this case `*testcontainers.ContainerService[*postgres.PostgresContainer]`.

- `testcontainers.ContainerService[T]` is a generic service that wraps a `testcontainers.Container` instance. It's provided by the `github.com/gofiber/contrib/testcontainers` module.
- `*postgres.PostgresContainer` is the specific type of the container, in this case a PostgreSQL container. It's provided by the `github.com/testcontainers/testcontainers-go/modules/postgres` module.

Once we have the `postgresSrv` service, we can use it to connect to the database. The `ContainerService` type provides a `Container()` method that unwraps the container from the service, so we are able to use the APIs provided by the `testcontainers` package to interact with the container. Finally, we pass the connection string to the global `DB` variable, so the data access layer can use it to connect to the database.

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

### Step 6: Live reload with air

Let's add the build tag to the `air` command, so our local development experience is complete. We need to add the `-tags dev` flag to the command used to build the application. In `.air.conf`, add the `-tags dev` flag to ensure the development configuration is used:

```txt
cmd = "go build -tags dev -o ./todo-api ./main.go"
```

### Step 7: Graceful Shutdown

Fiber automatically shuts down the application and all its services when the application is stopped. But `air` is not passing the right signal to the application to trigger the shutdown, so we need to do it manually.

In `main.go`, we need to listen from a different goroutine, and we need to notify the main thread when an interrupt or termination signal is sent. Let's add this to the end of the `main` function:

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

And we need to make sure `air` is passing the right signal to the application to trigger the shutdown. Add this to `.air.conf` to make it work:

```
# Send Interrupt signal before killing process (windows does not support this feature)
send_interrupt = true
```

With this, `air` will send an interrupt signal to the application when the application is stopped, so we can trigger the graceful shutdown when we stop the application with `air`.

## Seeing it in action

Now, we can start the application with `air`, and it will start the PostgreSQL container automatically, and it will handle the graceful shutdown when we stop the application. Let's see it in action!

Let's start the application with `air`. You should see output like this in the logs:

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

If we open a terminal and check the running containers, we see the PostgreSQL container is running:

```bash
docker ps
CONTAINER ID   IMAGE         COMMAND                  CREATED         STATUS         PORTS                       NAMES
8dc70e1124da   postgres:16   "docker-entrypoint.s…"   2 minutes ago   Up 2 minutes   127.0.0.1:32911->5432/tcp   postgres-db-todos
```

Notice two important things:
- the container name is `postgres-db-todos`, that's the name we gave to the container in the `setupPostgres` function.
- the container is mapping the standard PostgreSQL port `5432` to a dynamically assigned host port `32911` in the host. This is a Testcontainers feature to avoid port conflicts when running multiple containers of the same type, making the execution deterministic and reliable. To learn more about this, please refer to the [Testcontainers documentation](https://golang.testcontainers.org/features/networking/#exposing-container-ports-to-the-host).

### Fast Dev Loop

If we now stop the application with `air`, we see the container is stopped, thanks to the graceful shutdown implemented in the application.

But, best of all, if you let `air` handle reloads, and you update the application, `air` will hot-reload the application, and the PostgreSQL container will be reused 🤯, so we do not need to wait for it to be started! Sweet! 🚀

Check out the full example in the [GitHub repository](https://github.com/mdelapenya/testcontainers-go-examples/tree/main/gofiber-services).

### Integration Tests

The application includes integration tests for the data access layer, in the `app/dal` folder. They use Testcontainers to create the database and test it in isolation! Run the tests with:

```bash
go test -v ./app/dal
```

In less than 10 seconds, we have a clean database and our persistence layer is verified to behave as expected!

Thanks to Testcontainers, tests can run alongside the application, each using its own isolated container with random ports.

## Conclusion

Fiber v3's Services abstraction combined with Testcontainers unlocks a simple, production-like local dev experience. No more hand-crafted scripts, no more out-of-sync environments — just Go code that runs clean everywhere, providing a "Clone & Run" experience. Besides that, using Testcontainers offers a unified developer experience for both integration testing and local development, a great way to test your application cleanly and deterministically—with real dependencies.

Because we've separated configuration for production and local development, the same codebase can cleanly support both environments—without polluting production with development-only tools or dependencies.

## What's next?

- Check the different testcontainers modules in the [Testcontainers Modules Catalog](https://testcontainers.com/modules?language=go).
- Check the [Testcontainers Go](https://github.com/testcontainers/testcontainers-go) repository for more information about the Testcontainers Go library.
- Try [Testcontainers Cloud](https://testcontainers.com/cloud) to run the Service containers in a reliable manner, locally and in your CI.

💬 Have feedback or want to share how you're using Fiber v3? Drop a comment or open an issue in the [GitHub repo](https://github.com/mdelapenya/testcontainers-go-examples)!
