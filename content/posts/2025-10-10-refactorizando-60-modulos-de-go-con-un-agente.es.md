---
title: "Refactorizando 60 módulos de Go con un agente de código: la experiencia de un desarrollador senior"
date: 2025-10-10 09:00:00 +0100
description: "Cómo usé Claude para refactorizar 41 módulos en 4 días, después de aprender los patrones yo mismo con 19 módulos. Una historia real de colaboración entre humano e IA en código de producción."
categories: [Go, AI, Development]
tags: ["go", "ai", "coding-agents", "refactoring", "testcontainers", "claude", "docker"]
type: post
weight: 27
translationKey: coding-agents
translatedFrom: c9daa1b
---

![Claude, ¡te necesito!](/images/posts/2025-10-10-coding-agents/cover.png)

> Este post cuenta una experiencia real de refactorización con agentes de código de IA sobre código de producción. Sin hype ni humo: solo lo que pasó de verdad, lo que funcionó, lo que no y lo que aprendí.

## El reto

El proyecto Testcontainers for Go necesitaba un refactor importante: migrar los 60 módulos desde `testcontainers.GenericContainer()` a la nueva API `testcontainers.Run()`. Cada módulo representa una tecnología distinta: PostgreSQL, Redis, Kafka, MongoDB, Elasticsearch, etc.

No era un simple buscar y reemplazar. Cada módulo tenía sus manías:
- Patrones de configuración distintos
- Opciones y validaciones personalizadas
- Inspección de variables de entorno
- Soporte de TLS y credenciales
- Wait strategies y health checks

¿El alcance? Más de 5.000 líneas de código entre módulos, tests y ejemplos. Todo tenía que mantener la compatibilidad hacia atrás, pasar los tests existentes y seguir nuestras convenciones de código.

## El experimento: aprender primero, delegar después

Decidí probar un experimento: **hacer parte de la migración a mano para entender los patrones y usar después un agente de código con IA para el resto.**

### Fase 1: migración manual (del 26 de septiembre al 3 de octubre)

Empecé por orden alfabético con `aerospike` y fui avanzando hasta `grafana-lgtm`: **19 módulos en 7 días**.

¿Por qué empezar a mano? Porque necesitaba:
- Entender qué patrones funcionaban de verdad
- Toparme yo mismo con todos los casos límite
- Desarrollar intuición sobre cuál era la solución "correcta"
- Crear implementaciones de referencia

Lo que aprendí en esta fase fue clave:

**Patrón 1: la estructura de la función Run**
```go
func Run(ctx context.Context, img string, opts ...testcontainers.ContainerCustomizer) (*Container, error) {
    // 1. Process custom options FIRST
    var settings options
    for _, opt := range opts {
        if opt, ok := opt.(Option); ok {
            if err := opt(&settings); err != nil {
                return nil, err
            }
        }
    }

    // 2. Build moduleOpts with defaults
    moduleOpts := []testcontainers.ContainerCustomizer{
        testcontainers.WithExposedPorts("5432/tcp"),
        testcontainers.WithEnv(map[string]string{"DB": "default"}),
    }

    // 3. Conditional options based on settings
    if settings.tlsEnabled {
        moduleOpts = append(moduleOpts, /* TLS config */)
    }

    // 4. Append user options (ORDER MATTERS!)
    moduleOpts = append(moduleOpts, opts...)

    // 5. Call Run with proper error handling
    ctr, err := testcontainers.Run(ctx, img, moduleOpts...)
    var c *Container
    if ctr != nil {
        c = &Container{Container: ctr, settings: settings}
    }

    if err != nil {
        return c, fmt.Errorf("run postgres: %w", err)
    }

    return c, nil
}
```

**Patrón 2: tipos de opciones**
```go
// For simple config - use built-in options
func WithDatabase(dbName string) testcontainers.CustomizeRequestOption {
    return testcontainers.WithEnv(map[string]string{"POSTGRES_DB": dbName})
}

// For complex logic - use CustomizeRequestOption
func WithConfigFile(cfg string) testcontainers.CustomizeRequestOption {
    return func(req *testcontainers.GenericContainerRequest) error {
        if err := testcontainers.WithFiles(cfgFile)(req); err != nil {
            return err
        }
        return testcontainers.WithCmdArgs("-c", "config_file=/etc/app.conf")(req)
    }
}

// For state transfer - create custom Option type
type options struct {
    tlsEnabled bool
    tlsConfig  *tls.Config
}

type Option func(*options) error

func (o Option) Customize(req *testcontainers.GenericContainerRequest) error {
    return nil  // Can be empty if only setting internal state
}
```

**Patrón 3: inspección de variables de entorno**
```go
inspect, err := ctr.Inspect(ctx)
if err != nil {
    return c, fmt.Errorf("inspect postgres: %w", err)
}

// Use strings.CutPrefix with early exit
var foundDB, foundUser, foundPass bool
for _, env := range inspect.Config.Env {
    if v, ok := strings.CutPrefix(env, "POSTGRES_DB="); ok {
        c.dbName, foundDB = v, true
    }
    if v, ok := strings.CutPrefix(env, "POSTGRES_USER="); ok {
        c.user, foundUser = v, true
    }
    if v, ok := strings.CutPrefix(env, "POSTGRES_PASSWORD="); ok {
        c.password, foundPass = v, true
    }

    if foundDB && foundUser && foundPass {
        break  // Early exit optimization
    }
}
```

**Descubrimientos críticos:**
- ✅ Devuelve tipos struct, NO interfaces (`testcontainers.CustomizeRequestOption`, no `testcontainers.ContainerCustomizer`)
- ✅ Llama a las opciones integradas directamente: `testcontainers.WithFiles(f)(req)`, no `.Customize(req)`
- ✅ Usa `strings.CutPrefix` de la librería estándar, no manipulación manual de cadenas
- ✅ El orden de las opciones importa: valores por defecto → opciones del usuario → postprocesado
- ✅ Inicializa siempre la variable del contenedor antes de comprobar el error
- ✅ Nombre del contenedor: usa `Container`, no `PostgresContainer`

Tras 7 días y 19 módulos, tenía:
1. Un patrón probado que funcionaba
2. Varias implementaciones de referencia
3. La confianza de que era el enfoque correcto

### Fase 2: migración asistida por IA (del 6 al 9 de octubre)

Con los patrones asentados, metí a Claude Code para ayudarme con los **41 módulos restantes en solo 3 días**.

Así fue:

**Día 1 (6 de octubre): enseñar al agente**

Empecé dándole al agente un prompt detallado, algo torpe, pero funcionó.

```
Me: "Check the git log history in the current branch, and you'll see that a series of pull request with the same commit message/PR title are happening: "chore($MODULE): use Run function". The commits are removing the usage of the GenericContainer function in the "./modules" directory, and each pull request is only changing one module.
One module lives in a subdirectory in the modules dir.
Whenever you run commands, make sure you are in Go 1.24. Just run this in you shell:  eval "$(gvm 1.24.7 --arch=arm64)". 
The migration to the new API consists in replacing the initialisation of the COntainerRequest and GenericContainerRequest structs, and instead use the functional options that live in the main Go module "testcontainers".
The options live in the options.go file in the root of the repository.
Please iterate through the modules, and apply the changes one at a time, creating a git commit per module to isolate the changes. Please run "make pre-commit test" from the module directory  before accepting any proposed solution. Exclude the "compose" module, as it's not of our interest now.
If you have any doubt, prompt the question and I'll try to answer.
Please do not cause a breaking change in the module you are modifying, only change the internal implementation.
The commit message should follow the pattern described above: "chore($MODULE): use Run function".
If the module has been migrated, just check if you see any inconsistency, and mention them if/when found.
To identify the modules that have been migrated, pleae compare the existing commits, but also verify that there is no call to the "testcontainers.GenericContainer"
function.
When doing the changes, use the "moduleOpts" variable name for the default options, and for the error when calling Run, wrap the "run $moduleName" error message, and please use "moduleOpts" as the one receiving the opts from the caller.
The "moduleOpts" variable has to be an slice of testcontainers.ContainerCustomizer.
Never use the CustomizeRequest option, as it is overkill. Go with granular options, one by one, as each field in the request struct has its own functional option.
Skip the following options: WithImage and CustomizeRequestOption. The first one is passed directly to the Run function. The second one is not needed, as you are not using the GenericContainerRequest struct.
When multiple wait strategies are added, there is no need to wrap them all into a wait.ForAll, as the option allows a variad argument 
Do not include "container" in the error message, just "run module"
If the module applied its own custom options, keep it in the for loop that applies them. Just remove the testcontainers options evaluation from that for loop.
You must never use a Generic container request as you did for mongo. When you need to access the env vars to assign them to a variable, do it by calling the Inspect function in the container after it's been run, and retrieve it from that API. You have an example in the databend module, and also in the mongodb module, which I fixed for you.
If the request updated the hostconfig and the tmpfs, do not call the WithTmpfs option, just stay with the hostconfig modifier options.
For each module, apply your changes to the code, but let me verify each module. If the changes are good, I'll eventually allow you to continue in auto-mode.
Do you have any doubt?"

Claude: [Migrates module, runs tests, fixes issues, commits with proper message]
```

**Días 2 y 3 (7 y 8 de octubre): cogiendo velocidad**

Me di cuenta de que era importante que el agente entendiera qué tenía que hacer, así que le pedí que escribiera en un fichero `plan.txt` todo el conocimiento que había reunido. Así podía retomar el trabajo en sesiones distintas con solo leer ese fichero. También le pedí que actualizara el plan con los descubrimientos y los patrones importantes que fuera encontrando, para que siempre estuviera al día.

Este es el `plan.txt` que se creó:

```text
# Testcontainers-Go Module Migration Plan
## Migrating modules to use the Run function instead of GenericContainer

### Context
We are migrating all modules in the `./modules` directory from using `testcontainers.GenericContainer()`
to the new `testcontainers.Run()` API. This improves consistency and leverages functional options.

### Installing Go
Use https://github.com/andrewkroh/gvm to install go 

### Git Branch
Current branch: `use-run-claude-redpanda`

### Pull Requests Submitted
- PR #3414: https://github.com/testcontainers/testcontainers-go/pull/3414
  - Includes: k6, localstack, kafka, mariadb
- PR #3415: https://github.com/testcontainers/testcontainers-go/pull/3415
  - Includes: meilisearch, memcached, milvus, minio, mockserver, mssql
- PR #3416: https://github.com/testcontainers/testcontainers-go/pull/3416
  - Includes: mysql
- PR #3418: (nats - commit exists but PR may not be merged yet)
- PR #3419: (neo4j - commit exists but PR may not be merged yet)
- PR #3420: https://github.com/testcontainers/testcontainers-go/pull/3420
  - Includes: ollama (MERGED)
- PR #3421: https://github.com/testcontainers/testcontainers-go/pull/3421
  - Includes: openfga
- PR #3422: https://github.com/testcontainers/testcontainers-go/pull/3422
  - Includes: openldap
- PR #3431: https://github.com/testcontainers/testcontainers-go/pull/3431
  - Includes: registry (module implementation)
- PR #3432: https://github.com/testcontainers/testcontainers-go/pull/3432
  - Includes: clickhouse, k6, localstack, redpanda, registry, socat (test migration)

### Migration Pattern

#### Core Changes Required:
1. Replace `GenericContainer` call with `testcontainers.Run(ctx, img, moduleOpts...)`
2. Use `moduleOpts` variable (slice of `testcontainers.ContainerCustomizer`) for default options
3. **Also update tests**: Any test files using `testcontainers.GenericContainer()` must be migrated to use the module's `Run()` function or `testcontainers.Run()` directly
4. Convert all request fields to functional options:
   - `Image` → passed directly to Run function
   - `ExposedPorts` → `testcontainers.WithExposedPorts(...)`
   - `Env` → `testcontainers.WithEnv(map[string]string{...})`
   - `WaitingFor` → `testcontainers.WithWaitStrategy(...)`
   - `Cmd` → `testcontainers.WithCmd(...)` for initial setup
   - `Entrypoint` → `testcontainers.WithEntrypoint(...)` for initial setup
   - `LifecycleHooks` → `testcontainers.WithAdditionalLifecycleHooks(...)`
   - `Files` → `testcontainers.WithFiles(...)`
   - `HostConfigModifier` → `testcontainers.WithHostConfigModifier(...)`
   - etc.

5. Module-specific options should use built-in functional options where possible:
   - Simple env var options → `testcontainers.WithEnv(map[string]string{...})`
   - Instead of creating custom `CustomizeRequestOption`, use existing `ContainerCustomizer` options
   - When calling built-in options in custom options, call them directly: `testcontainers.WithFiles(cf)(req)` NOT `testcontainers.WithFiles(cf).Customize(req)`
6. Skip using `WithImage` and use `CustomizeRequestOption` only when complex logic requires access to the full request
7. Error message format: `fmt.Errorf("run moduleName: %w", err)`
8. **CRITICAL**: Always use `eval "$(gvm 1.24.7 --arch=arm64)"` before ANY Go command (go build, go test, make, etc.)

#### Important: Variadic Arguments
When using functional options that accept variadic arguments, pass arguments directly, NOT as slices:
- ✅ `testcontainers.WithCmd("arg1", "arg2", "arg3")`
- ❌ `testcontainers.WithCmd([]string{"arg1", "arg2", "arg3"})`
- ✅ `testcontainers.WithFiles(file1, file2)`
- ❌ `testcontainers.WithFiles([]ContainerFile{file1, file2})`
- ✅ `testcontainers.WithWaitStrategy(wait1, wait2)`
- ❌ `testcontainers.WithWaitStrategy(wait.ForAll(wait1, wait2))`

For initial container setup, use:
- `WithCmd` not `WithCmdArgs`
- `WithEntrypoint` not `WithEntrypointArgs`
- `WithAdditionalXXX` options are for appending to user customizations

#### For Env Vars After Run:
If the module needs to read env vars to store in the container struct:
    ```go
    inspect, err := ctr.Inspect(ctx)
    if err != nil {
        return c, fmt.Errorf("inspect moduleName: %w", err)
    }

    var foundFieldA, foundFieldB bool
    for _, env := range inspect.Config.Env {
        if v, ok := strings.CutPrefix(env, "ENV_VAR_NAME_A="); ok {
            c.fieldNameA, foundFieldA = v, true
        }
        if v, ok := strings.CutPrefix(env, "ENV_VAR_NAME_B="); ok {
            c.fieldNameB, foundFieldB = v, true
        }

        if foundFieldA && foundFieldB {
            break
        }
    }
    ```
**Important**: Use `strings.CutPrefix` from the standard library. Set defaults when creating the container struct, not at the end of the loop. Check all found flags together at the end of each iteration to break early.

#### Options Order:
1. Module default options (moduleOpts)
2. User-provided options (opts...)
3. Post-processing options (applied last, e.g., configureDockerHost, validateCredentials)

### Important Rules
0. If a given module is already in the main branch, please remove the local branch you used for the migration
1. **ONE module at a time** - create separate commits
2. **Run `make pre-commit test`** from the module directory before committing
3. **Commit message format**: `chore(moduleName): use Run function`
4. **No breaking changes** - only internal implementation changes
5. **Include co-author footer**:

    ```text
    🤖 Generated with [Claude Code](https://claude.com/claude-code)

    Co-Authored-By: Claude <noreply@anthropic.com>
    ```

6. **DO NOT** migrate the `compose` module
7. **k6 module**: Tests are skipped (Docker image is broken), but code was migrated
8. **Git files**: Only git-add files from the specific module directory being worked on
9. **Update main**: Always pull from upstream before creating branch: `git pull upstream main`. Update the origin with `git push origin main` once you receive changes from upstream.
10. **Branch naming**: Create new branch per module: `use-run-claude-$moduleName`, starting from the main
11. **PR links**: Always reference PR #3174 as the parent PR in PR descriptions

### Testing Before Commit
Always run from module directory:
    ```bash
    eval "$(gvm 1.24.7 --arch=arm64)"
    make pre-commit test
    ```

### Modules Completed (49 modules)
✅ aerospike, arangodb, artemis, azurite, cassandra, chroma, clickhouse, cockroachdb
✅ consul, couchbase, databend, dind, dolt, dynamodb, elasticsearch, etcd
✅ gcloud, grafana-lgtm, inbucket, influxdb, k3s, mongodb, socat
✅ k6 (PR #3414 - code only, tests skipped)
✅ kafka (PR #3414)
✅ localstack (PR #3414)
✅ mariadb (PR #3414)
✅ meilisearch (PR #3415)
✅ memcached (PR #3415)
✅ milvus (PR #3415 - fixed flakiness with wait strategy)
✅ minio (PR #3415)
✅ mockserver (PR #3415)
✅ mssql (PR #3415)
✅ mysql (PR #3416)
✅ nats (commit 3593f756)
✅ neo4j (commit 2ba29cf7)
✅ ollama (PR #3420 - MERGED - fixed MultiStrategy empty slice bug)
✅ openfga (PR #3421)
✅ openldap (PR #3422 - MERGED - updated custom options to use built-in options)
✅ opensearch (PR #3423 - Option type returns error for proper error handling)
✅ pinecone (PR #3424 - simple migration)
✅ postgres (PR #3425 - env inspection, WithCmdArgs for config file)
✅ pulsar (PR #3426 - CustomizeRequestOption returns struct not interface)
✅ qdrant (PR #3427 - simple module with wait.ForAll for multiple ports)
✅ rabbitmq (PR #3428 - custom config template, SSL settings, WithAdditionalWaitStrategy)
✅ redis (PR #3429 - TLS support with dynamic certs, WithCmd for prepending config file)
✅ redpanda (PR #3430 - BREAKING: Option returns error, complex module with listeners, TLS, auth)
✅ registry (PR #3431 - module implementation)
✅ scylladb (PR #3433 - MERGED - WithCustomCommands with setCommandFlags helper)
✅ surrealdb (PR #3434 - MERGED - simple env vars module)
✅ toxiproxy (PR #3435 - MERGED - dynamic proxy port configuration)
✅ vault (PR #3439 - simple module with HostConfigModifier, WithAdditionalWaitStrategy)

### Remaining Modules (0 modules)
All modules have been migrated! 🎉

Completed in final session:
1. valkey (PR #3438 - in review, entrypoint-based approach)
2. vearch (PR #3441 - works with Docker Offload)
3. weaviate (PR #3442 - 7 tests, 78.6% coverage)
4. vault (PR #3443 - 10 tests, 89.5% coverage)
5. yugabytedb (PR #3444 - 9 tests, 93.0% coverage)

### Module Generator Migration

The `modulegen` directory contains templates and code that generate new modules.
These templates still use the old `GenericContainer` API and need to be updated to use `testcontainers.Run()`.

**Files to update:**
- `modulegen/_template/module.go.tmpl` - Main module template
- `modulegen/main_test.go` - Test expectations for generated code (line number assertions)
- Any other templates that reference the old API

**Changes needed:**
1. Update `module.go.tmpl` to use `testcontainers.Run()` with moduleOpts pattern
2. Update test assertions in `main_test.go` to match new generated code structure
3. Ensure generated code follows the same patterns as migrated modules

### Test Migration Status
PR #3432 migrates tests using `testcontainers.GenericContainer` to use `Run()`:
- ✅ clickhouse (tests migrated)
- ✅ k6 (tests migrated)
- ✅ localstack (tests migrated)
- ✅ redpanda (tests migrated)
- ✅ registry (tests migrated)
- ✅ socat (tests migrated)

**Note**: When migrating remaining modules, check ALL test files for `GenericContainer` usage and migrate them as part of the same PR.

### Workflow Per Module
1. Update main: `git pull upstream main`
2. Create branch: `git checkout -b use-run-claude-$moduleName`
3. Read module's main .go file and test files
4. Apply migration pattern to both module implementation and tests
5. **Test migration**: Search for `testcontainers.GenericContainer` in test files and replace with appropriate Run calls
6. Run from module dir: `make pre-commit test`
7. Add only module files: `git add modules/$moduleName/`
8. Commit: `git commit` with proper message and co-author footer
9. Push: `git push origin use-run-claude-$moduleName`
10. Create PR: `gh pr create` with title `chore(moduleName): use Run function` and body referencing #3174. Use chore as label in the flags. If a breaking change is needed, such as changing the Option type, use "breaking change" as label.

### PR Body Template
    ```markdown
## What does this PR do?

Use the Run function in [moduleName]

## Why is it important?

Migrate modules to the new API, improving consistency and leveraging the latest testcontainers functionality.

## Related issues

- Relates to https://github.com/testcontainers/testcontainers-go/pull/3174
    ```

### Common Patterns Encountered

#### Pattern 1: Simple Module (like memcached)
- Just env vars, ports, and wait strategy
- Direct migration with moduleOpts

#### Pattern 2: Module with Env Inspection (like mariadb, mysql)
- Use Inspect to retrieve env vars after Run
- Set defaults in container struct creation
- Use strings.CutPrefix with found bool pattern

#### Pattern 3: Module with Custom Logic (like kafka)
- Version validation before Run
- Custom options that need to run after user opts (use append)
- Functional option for post-processing

#### Pattern 4: Module with Network Config (like localstack)
- Docker host configuration
- Network aliases handling
- Create functional option wrapper for complex logic

#### Pattern 5: Module with Lifecycle Hooks
- Use `testcontainers.WithAdditionalLifecycleHooks()`
- Keep hook logic intact

#### Pattern 6: Module with MultiStrategy Wait (like neo4j)
- Combine multiple wait strategies (log + HTTP)
- Use `wait.MultiStrategy{Strategies: []wait.Strategy{...}}`

#### Pattern 7: Module with Credential Validation (like mysql, mssql)
- Add validation as final option in moduleOpts
- Use CustomizeRequestOption for complex validation logic

#### Pattern 8: Module with Custom Command Args (like nats)
- Gather settings from custom option types before building moduleOpts
- Build command args array and append with WithCmdArgs

#### Pattern 9: Module with Local Process Support (like ollama)
- Check for local process option before adding incompatible options
- Only add HostConfigModifier (like GPU) when NOT using local process

### Files to Reference
- `options.go` in root: Contains all available functional options
- Previous migrations for examples:
  - Simple: memcached.go, mockserver.go
  - With inspection: mongodb.go, mariadb.go, mysql.go
  - Complex: kafka.go, localstack.go, nats.go, milvus.go
  - MultiStrategy: neo4j.go
  - Local process: ollama.go

### Key Findings from Recent Sessions

#### Opensearch (PR #3423)
- **Breaking Change**: `Option` type must return error: `type Option func(*Options) error`
- For-loop must check and return errors: `if err := apply(settings); err != nil { return nil, fmt.Errorf("apply option: %w", err) }`
- Wait strategy must be in moduleOpts, not applied separately after container start
- Process custom options to extract username/password BEFORE building moduleOpts
- Pattern follows elasticsearch module

#### Postgres (PR #3425)
- Use `WithCmdArgs` for appending command arguments in custom options
- Example: `return testcontainers.WithCmdArgs("-c", "config_file=/etc/postgresql.conf")(req)`
- Env var inspection after Run to retrieve actual container values
- Simple options (WithDatabase, WithPassword, WithUsername) return `ContainerCustomizer` using `WithEnv`
- Complex options (WithConfigFile, WithSSLCert) remain as `CustomizeRequestOption`

#### Pulsar (PR #3426)
- **Critical Go Idiom**: Always return struct, not interface
- `WithPulsarEnv` returns `CustomizeRequestOption` (concrete type), NOT `ContainerCustomizer` (interface)
- Custom options should call built-in options correctly: `return testcontainers.WithEnv(...)(req)`
- WithFunctionsWorker and WithTransactions use `WithCmd` and `WithWaitStrategy` instead of direct field assignment

#### Qdrant (PR #3427)
- Simple straightforward migration with no custom options
- Used `wait.ForAll` to wait for multiple ports (REST 6333, gRPC 6334)
- Both wait strategies use `WithStartupTimeout(5*time.Second)`
- Tests passed: 6 tests, 81.2% coverage

#### RabbitMQ (PR #3428)
- **Critical Bug Fix**: Must use `settings.AdminUsername` and `settings.AdminPassword` instead of hardcoded defaults
- Changed `Option` type to return error: `type Option func(*options) error`
- Updated for-loop to check and return errors: `if err := apply(&settings); err != nil { return nil, fmt.Errorf("apply option: %w", err) }`
- Custom config template rendered to temp file
- SSL settings with multiple files using `WithFiles` and `WithAdditionalWaitStrategy`
- Pattern matches opensearch, elasticsearch, etcd for error handling

#### Redis (PR #3429)
- **Wait Strategy Bug**: Always wait for listening port, not conditionally
- Port is always exposed and listening (regular or TLS), so `wait.ForListeningPort` must be in base moduleOpts
- TLS support with dynamic certificate generation in-flight
- `WithCmd` used for prepending config file to command (not `WithCmdArgs` which appends)
- Must use: `return testcontainers.WithCmd(append([]string{configFile}, req.Cmd...)...)(req)` to prepend
- Process custom options BEFORE building moduleOpts to extract settings

#### Redpanda (PR #3430)
- **BREAKING CHANGE**: Changed `Option` type to return error: `type Option func(*options) error`
- Complex module with many features: listeners, TLS, authentication, bootstrap config
- Listener network validation must happen AFTER user options (networks provided by user)
- Place listener validation as LAST step in moduleOpts (after `opts...`)
- `WithListener` now properly returns errors for invalid host:port instead of silently ignoring
- Process custom options first, build moduleOpts, append user opts, then add post-processing options
- Error handling pattern: `if err := apply(&settings); err != nil { return nil, fmt.Errorf("apply option: %w", err) }`
- Used `WithConfigModifier`, `WithEntrypoint`, `WithCmd` for container setup

#### ScyllaDB (PR #3433 - MERGED)
- Custom command flag manipulation with `WithCustomCommands`
- Created helper function `setCommandFlags` to handle overriding and adding flags
- Supports both `--flag=value` and `--flag` formats
- Updated tests to use pointer receivers for `GenericContainerRequest`
- Tests: 19 tests, 92.5% coverage

#### SurrealDB (PR #3434 - MERGED)
- Simple module with only env vars, ports, wait strategy
- All custom options use `testcontainers.WithEnv()`
- Fixed `WithAllowAllCaps` to set "true" instead of "false" value
- Tests: 3 tests, 52.2% coverage

#### Toxiproxy (PR #3435 - MERGED)
- Process custom options first to extract proxy configuration
- Dynamic port allocation for proxies starting from `firstProxiedPort`
- Render proxy config as JSON and mount to container
- Map proxied endpoints after container starts
- Tests: 19 tests, 88.2% coverage

#### Valkey (PR #3438 - IN REVIEW)
- **Entrypoint-based approach**: Set `valkey-server` as entrypoint, not in Cmd
- Process custom options first to extract TLS settings
- TLS support with dynamic certificate generation (similar to redis)
- `WithConfigFile` prepends config file as first argument using `WithCmd`
- `WithLogLevel` and `WithSnapshotting` append args using `WithCmdArgs`
- Updated option tests to reflect entrypoint-based approach (no valkey-server in Cmd)
- Tests: 21 tests, 86.2% coverage

#### Vault (PR #3439)
- Simple module with `HostConfigModifier` for CAP_IPC_LOCK capability
- `WithToken` uses `WithEnv` for setting root token env vars
- `WithInitCommand` uses `WithAdditionalWaitStrategy` to append exec wait

### Important Context
- Go version: 1.24.7 (use `eval "$(gvm 1.24.7 --arch=arm64)"`)
- Repository: testcontainers-go
- Working directory: ${HOME}/sourcecode/src/github.com/testcontainers/testcontainers-go
- **Do NOT ask to run**: `eval "$(gvm ...)"`, `cd modules/...`, or `make` commands - these are handled automatically

### Environment Detection
**CRITICAL**: Always check if running inside a Docker container at the start of every migration cycle:
    ```bash
    if [ -f /.dockerenv ]; then echo "Running in Docker"; else echo "Running on host"; fi
    ```

#### When Running in Docker Container (Docker Sandbox):
- **CANNOT** do `git push` operations
- **CANNOT** submit PRs using `gh pr create`
- **CANNOT** run full tests (Docker-in-Docker not configured) - tests must be run on host
- CAN run `make pre-commit` for linting - if it passes with 0 issues, code is correct
- Workspace is mounted as a volume - host will handle git push, tests, and PR creation
- **MUST** print out the test and PR commands at the end for user to run on host:
    ```shell
  gh pr create -B main --title "chore(moduleName): use Run function" --label chore --body "$(cat <<'EOF'
  ## What does this PR do?

  Use the Run function in [moduleName]

  ## Why is it important?

  Migrate modules to the new API, improving consistency and leveraging the latest testcontainers functionality.

  ## Related issues

  - Relates to https://github.com/testcontainers/testcontainers-go/pull/3174
  EOF
  )"
    ```
  - For breaking changes, use `--label "breaking change"` instead

#### When Running on Host:
- Can use `git push` and `gh pr create` directly as usual
- Follow standard workflow per module

### When to Ask User
- If migration approach is unclear
- If breaking changes seem unavoidable
- If tests fail and cause is not obvious

```

Una vez que Claude entendió el patrón, el flujo pasó a ser este:

```
Me: "Migrate the kafka module"

Claude: [Works on the module following the established pattern]
        [Runs tests for the module]
        [Creates a new branch: use-run-claude-kafka]
        [Creates commit]
        [Submits PR with proper description]

Me: [Reviews PR, merges]
```

**Día 4 (9 de octubre): módulos complejos y documentación**

Hasta los complejos siguieron el patrón:

- **RabbitMQ**: ajustes SSL, plantillas de configuración personalizadas, varias wait strategies
- **Redpanda**: listeners, TLS, autenticación, configuración de bootstrap (obligó a hacer un breaking change en el tipo Option)
- **Redis**: TLS con generación dinámica de certificados, gestión del fichero de configuración

Me dio tiempo a pulir la documentación, asistido por el agente, claro:

- Actualicé `docs/modules/index.md` con buenas prácticas completas ([#3445](https://github.com/testcontainers/testcontainers-go/pull/3445))
- Actualicé las plantillas del generador de módulos ([#3445](https://github.com/testcontainers/testcontainers-go/pull/3445))
- Creé el fichero `AI.md` con directrices para futuros agentes de IA ([#3446](https://github.com/testcontainers/testcontainers-go/pull/3446))

### Fase 3: pasada de consistencia (10 de octubre)

Al terminar la migración principal, noté que algunos módulos seguían con patrones inconsistentes en el procesado de opciones. Algunos procesaban los tipos `Option` personalizados DESPUÉS de construir `moduleOpts`, en lugar de ANTES.

Era un caso de prueba perfecto para el patrón que habíamos establecido. Le pedí a Claude que:
1. Escaneara todos los módulos buscando esta inconsistencia concreta
2. Arreglara solo los módulos que la tuvieran
3. Probara cada uno por separado
4. Hiciera commit con el patrón: `chore(module): apply consistent patterns for options`

Puedes ver el resultado de las pull requests en [#3447](https://github.com/testcontainers/testcontainers-go/pull/3447).

**Resultado: 6 módulos arreglados en unas horas**

Módulos corregidos:
- **couchbase** - Opciones personalizadas complejas (buckets, servicios, credenciales)
- **etcd** - Opciones de configuración del clúster
- **gcloud/firestore** - Ajustes de ID de proyecto y de modo datastore
- **dockermcpgateway** - Configuración de herramientas y secretos
- **azure/eventhubs** - Opciones del contenedor Azurite
- **azure/servicebus** - Opciones del contenedor MSSQL

Cada arreglo siguió el mismo patrón:
```go
// BEFORE (incorrect)
moduleOpts := []testcontainers.ContainerCustomizer{...}
moduleOpts = append(moduleOpts, opts...)

// Process custom options AFTER
for _, opt := range opts {
    if apply, ok := opt.(Option); ok {
        apply(&settings)
    }
}

// AFTER (correct)
// Process custom options FIRST
for _, opt := range opts {
    if apply, ok := opt.(Option); ok {
        apply(&settings)
    }
}

// Then build moduleOpts using extracted settings
moduleOpts := []testcontainers.ContainerCustomizer{...}
moduleOpts = append(moduleOpts, opts...)
```

Este trabajo posterior demostró que el patrón asistido por IA se puede repetir para cualquier mejora de consistencia en una base de código grande.

## Los números

Seamos honestos con las métricas:

| Fase | Duración | Módulos | Módulos/día | Ficheros | Inserciones | Borrados | Neto |
|-------|----------|---------|-------------|-------|------------|-----------|-----|
| **Manual (yo)** | 7 días | 19 | 2,7 | 51 | +1.004 | -1.184 | -180 |
| **Con IA (migración)** | 3 días | 41 | 13,67 | 60 | +1.357 | -1.557 | -200 |
| **Con IA (consistencia)** | 0,5 días | 6 | 12 | 6 | +81 | -66 | +15 |
| **Total** | **10,5 días** | **66** | **6,3** | **117** | **+2.442** | **-2.807** | **-365** |

**El multiplicador de la IA: 5,0x más rápido** (13,67 frente a 2,7 módulos al día en la migración inicial)

**¿Por qué el neto es negativo?** El refactor simplificó el código al sustituir la verbosa inicialización de `GenericContainer` por opciones funcionales más limpias. Menos código, misma funcionalidad: ¡eso es un buen refactor!

**Trabajo de consistencia posterior**: una vez establecido el patrón, aplicarlo para cazar casos límite fue todavía más rápido. Seis módulos en medio día, tocando solo 6 ficheros con cambios mínimos.

Pero la velocidad bruta no es toda la historia.

## Lo que pasó de verdad: la colaboración real

### Lo que funcionó de maravilla

**1. Aplicación del patrón**

En cuanto le enseñé el patrón a Claude, lo aplicó de forma consistente en todos los módulos. Sin errores de copiar y pegar, sin pasos olvidados, sin variaciones. Cada módulo recibió:
- La misma estructura de 5 pasos de la función Run
- Una gestión de errores correcta
- El orden de opciones correcto
- Convenciones de nombres consistentes

**2. Flujo de trabajo guiado por tests**

El flujo se volvió increíblemente eficiente:
```
Claude: "Migrating postgres module..."
        [Implements migration]
        [Runs: make pre-commit test]
        [Test failure]
        [Analyzes error]
        [Fixes issue]
        [Re-runs tests]
        [All pass]
        [Commits with proper message]
        "✅ Postgres migrated, tests passing"
        [Moves to next module]
```

**3. Aprender y adaptarse**

A mitad de la migración descubrí un patrón mejor:

```
Me: "Use strings.CutPrefix with early exit for env inspection,
     don't do manual string manipulation"

Claude: [Updates current module]
        [Applies to ALL subsequent modules]
        [Never makes the old mistake again]
        [Update plan.txt]
```

**4. Calidad de la documentación**

Como Claude necesita instrucciones explícitas, me vi obligado a documentarlo todo con claridad. Eso generó artefactos que benefician a todos:
- `docs/modules/index.md`: buenas prácticas completas
- `AI.md`: directrices para futuros agentes de IA (¡y para desarrolladores nuevos!)
- `plan.txt`: cada patrón y cada error habitual, documentados

### Lo que necesitó supervisión humana

**1. Decisiones de arquitectura**

Los breaking changes necesitaron criterio humano:
```
Me: "The redpanda Option type needs to return errors for proper validation.
     This is a breaking change but it's the right call."

Claude: "Understood. Changing type Option func(*options) error and
         updating all call sites to check errors."
```

**2. Casos límite y contexto**

Algunos módulos necesitaron un trato especial:
```
Claude: "The k6 module tests are failing..."

Me: "Skip k6 tests - the Docker image is broken, not our code.
     This is documented in the plan."

Claude: "Got it. Migrating code but marking tests as skipped."
```

**3. Modismos de Go**

```
Me: "Return struct types, not interfaces. This is a Go best practice."

Claude: [Updates code]
        "Changed return type from testcontainers.ContainerCustomizer
         to testcontainers.CustomizeRequestOption"
```

**4. Flujo de trabajo con Git**

```
Me: "Only git add files from the module you're working on,
     not the entire repo"

Claude: git add modules/postgres/
        [Not: git add .]
```

## Las sorpresas

### Sorpresas positivas

**Claude cazó bugs que yo habría pasado por alto:**

En el módulo rabbitmq:
```go
// Before (my initial attempt)
AdminUsername: "guest",  // Hardcoded default
AdminPassword: "guest",

// Claude's fix
AdminUsername: settings.AdminUsername,  // Use actual settings
AdminPassword: settings.AdminPassword,
```

**Aplicación consistente de optimizaciones:**

En cuanto mencioné `strings.CutPrefix` con salida anticipada, Claude lo aplicó a la perfección en los 41 módulos. Sin variaciones, sin olvidos.

**Mejores mensajes de commit:**

Claude escribió mensajes de commit más consistentes que los que escribo yo a veces:

```text
chore(redis): use Run function

Migrate Redis module to use testcontainers.Run() API with moduleOpts
pattern. This includes:
- TLS support with dynamic certificate generation
- Custom config file handling using WithCmd for prepending
- Wait strategy for listening port

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

### Dificultades

**Preocupaciones de seguridad:**

Ejecutar un agente de IA con acceso total a tu código y a tu terminal plantea dudas de seguridad legítimas:
- ¿Y si la IA ejecuta comandos destructivos?
- ¿Y si modifica mal los ficheros?
- ¿Y si sube código malo a producción?

Así mitigué estos riesgos:

1. **Una suite de tests sólida como red de seguridad** - Todo cambio tenía que pasar `make pre-commit test` antes del commit
2. **Control de versiones con Git** - Todos los cambios quedan registrados, se pueden revisar y se pueden revertir
3. **Revisión humana** - Revisé cada migración de módulo, sobre todo las complejas
4. **Commits incrementales** - Un módulo cada vez, para aislar los problemas y poder deshacerlos con facilidad

**A futuro: Docker sandbox**

Para tener aún más seguridad, ejecutar el agente en un Docker sandbox aportaría:
- **Entorno aislado** - El agente no puede afectar al sistema anfitrión
- **Permisos limitados** - Sin acceso para hacer push de código ni crear pull requests desde dentro del contenedor
- **Recursos controlados** - El workspace se monta como volumen y el host se encarga de las operaciones de git
- **Rastro de auditoría** - El contenedor registra todo lo que hace el agente

Con este enfoque, el agente haría toda la generación de código y las pruebas de forma aislada, mientras una persona en el host revisa y ejecuta los últimos pasos: el `git push` y la creación de la pull request. De hecho, el `plan.txt` ya documenta este flujo para usarlo en el futuro.

**Recordatorios sobre el entorno:**

Claude necesitaba recordatorios de vez en cuando:
```
Me: "Remember to run: eval \"$(gvm 1.24.7 --arch=arm64)\"
     before any Go command"

Claude: "Right, setting Go version first..."
```

**Curva de aprendizaje inicial:**

Los primeros módulos con Claude requirieron correcciones:
```
Claude: [Makes attempt]

Me: "Almost, but return the struct type, not the interface"

Claude: [Corrects immediately]
        [Never makes that mistake again]
```

**Hace falta contexto explícito:**

```
Me: "The conventions.yml workflow enforces commit types.
     Only use: security, fix, feat, docs, chore, deps"

Claude: "Understood. Using 'chore' for module migrations."
```

## Lecciones aprendidas

### 1. Tú eres el arquitecto, la IA es el constructor

El papel humano es crítico:
- **Definir patrones** a partir de experiencia real
- **Tomar decisiones de arquitectura** (breaking changes, decisiones de diseño)
- **Revisar y validar** lo que produce la IA
- **Aportar el contexto** que la IA no puede tener

La IA destaca en:
- **Aplicar patrones** de forma consistente
- **Implementar los detalles** sin errores de copiar y pegar
- **Ejecutar tests** y arreglar fallos
- **Hacer el trabajo tedioso** y repetitivo

### 2. El contexto lo es todo

La calidad de lo que produce la IA es directamente proporcional a la calidad del contexto que le das:

**Lo que funcionó:**
- Un `plan.txt` detallado con patrones y errores habituales
- Varias implementaciones de referencia
- Instrucciones explícitas sobre las convenciones
- Enlaces a la documentación existente

**Lo que no funcionó:**
- "Migra este módulo" (demasiado vago)
- Dar por hecho que la IA recuerda las sesiones anteriores
- El conocimiento implícito que yo tenía y no compartí

### 3. La fase de aprendizaje es esencial

Empezar a mano NO fue tiempo perdido. Fue la base que hizo que la fase asistida por IA saliera bien:

1. Descubrí qué patrones funcionaban de verdad en producción
2. Me topé con los casos límite y aprendí a manejarlos
3. Desarrollé intuición para distinguir las soluciones "correctas" de las "incorrectas"
4. Creé implementaciones de referencia de las que Claude podía aprender

**Idea clave**: no puedes delegar lo que no entiendes.

### 4. La calidad de la documentación importa a todos

Escribir documentación clara para la IA tuvo un beneficio inesperado: también es perfecta para los desarrolladores humanos.

El fichero `AI.md` que creó el agente incluye:
- El formato exacto de los commits (con reglas de validación)
- Errores comunes y cómo evitarlos
- El flujo de pruebas y la configuración del entorno
- Patrones de referencia rápida, con enlaces a la documentación detallada

Espero que a los nuevos colaboradores les encante. A mi yo del futuro le va a encantar. Y sí, a los futuros agentes de IA también. 💖

### 5. Confía, pero verifica

La IA es asombrosamente consistente, pero:
- Ejecuta siempre la suite de tests. Por suerte, yo tenía una sólida
- Revisa los cambios, sobre todo en los módulos complejos
- Valida las decisiones de arquitectura
- Busca bugs sutiles (como valores hardcodeados)

La suite de tests fue mi prueba de confianza. Si los tests pasan, lo más probable es que la migración sea correcta.

## El metapatrón que surgió

Mirando atrás, el valor real no fue solo migrar 60 módulos. Fue establecer un **patrón de colaboración escalable**:

1. **Aprender los patrones** con experiencia práctica (19 módulos)
2. **Documentar a fondo** qué funciona y por qué (`plan.txt`, `AI.md`)
3. **Crear referencias** de las que la IA pueda aprender (postgres, redis, etc.)
4. **Delegar la implementación** manteniendo la supervisión de la arquitectura (41 módulos)
5. **Recoger lo aprendido** en documentación viva (actualizaciones de la documentación)

Este patrón se puede repetir en futuros refactors.

## Lo que me hizo cambiar de opinión

### Antes de esta experiencia:
- "La IA no puede con refactors de arquitectura"
- "Demasiado arriesgado para código de producción"
- "Necesitaría supervisión constante"

### Después de esta experiencia:
- La IA destaca aplicando patrones y manteniendo la consistencia
- Con buenos tests, en realidad es **más segura** que el trabajo manual
- La supervisión hace falta para marcar la dirección, no para la implementación
- **4,4x más rápido** (13,67 frente a 3,1 módulos al día), con una calidad igual o mejor

El cuello de botella pasó de **escribir código** a **pensar la arquitectura**.

## Conclusiones prácticas

### Si quieres probarlo

**Requisitos previos:**
1. **Una suite de tests sólida** - Tu red de seguridad
2. **Patrones claros** - Averigua primero a mano qué significa "bueno"
3. **Buena documentación** - Para la IA y para las personas
4. **Control de versiones** - Git hace que experimentar sea seguro

**Flujo de trabajo:**
1. Empieza tú con los casos más sencillos
2. Documenta los patrones según los descubras
3. Crea 2 o 3 implementaciones de referencia
4. Mete a la IA para aplicar el patrón
5. Revisa, prueba, itera

**Señales de alarma:**
- La IA no entiende el contexto → Dale más ejemplos
- Los patrones son inconsistentes → Documéntalos de forma explícita
- Los tests fallan una y otra vez → Revisa tu patrón
- Copia los errores → Hacen falta mejores ejemplos iniciales

### Lo que más le pedí

Durante la fase asistida por IA, estas fueron mis interacciones más habituales:

1. "Lee los módulos X e Y, y luego migra el módulo Z con el mismo patrón"
2. "Ejecuta los tests y arregla los fallos"
3. "Usa [técnica concreta] y no [otra técnica]"
4. "Haz commit con el formato de conventional commits"
5. "Crea una pull request con esta descripción"

Simple, directo, concreto.

## El futuro

### Lo que esto permite

**Para bases de código grandes:**
- Los breaking changes dan menos miedo
- La deuda técnica se paga más rápido
- Actualizar librerías es más viable
- La consistencia mejora con el tiempo

**Para equipos de desarrollo:**
- Los senior se centran en la arquitectura
- Los junior aprenden de una consistencia impecable
- Las code reviews se centran en el diseño, no en erratas
- La calidad de la documentación mejora (la IA obliga a ser claro)

**Para el open source:**
- Los colaboradores pueden abordar refactors más grandes
- Los patrones se propagan rápido entre módulos
- Incorporarse es más fácil (mejor documentación)
- La velocidad aumenta sin sacrificar calidad

### La idea de fondo

No va de que **la IA sustituya a los desarrolladores**. Va de:
- **Elevar** el trabajo del desarrollador, de la implementación a la arquitectura
- **Amplificar** el impacto con mejor palanca
- **Acelerar** la evolución sin sacrificar calidad
- **Mejorar** la consistencia más allá de lo que alcanza una persona

El futuro no es "IA contra humanos". Es **"desarrollador senior + IA = superpoderes"**.

## Conclusión

Migré y estandaricé 66 módulos de Go en 10,5 días:
- **19 módulos a mano** (7 días) - Aprendiendo los patrones
- **41 módulos con Claude** (3 días) - Aplicando los patrones de migración
- **6 módulos con Claude** (0,5 días) - Aplicando los patrones de consistencia

La IA no hizo mi trabajo. Amplificó mi trabajo:
- Yo tomé las decisiones de arquitectura
- Yo definí los patrones y las convenciones
- Yo revisé y validé los resultados
- Claude se encargó de la implementación repetitiva

**Las métricas:**
- 3,3x más rápido con ayuda de la IA
- Cero bugs de regresión (todos los tests en verde)
- Mejor consistencia que en el trabajo manual
- Mejor documentación como efecto secundario
- Patrón repetible para futuros refactors

**La lección:**
Los agentes de código no sirven para reemplazar la experiencia, sino para multiplicarla. La clave está en saber qué delegar y qué conservar.

Empieza por entender. Documenta con claridad. Delega con confianza. Revisa con cuidado.

**Sobre la seguridad:** dar a un agente de IA acceso a tu código plantea dudas legítimas, pero con las salvaguardas adecuadas se puede manejar: tests sólidos, control de versiones con git, revisión humana y commits incrementales. Para tener aún más seguridad, un Docker sandbox puede aislar el trabajo del agente y dejar las operaciones críticas (push, creación de pull requests) en manos humanas.

El futuro del desarrollo senior ya está aquí. Solo que todavía no está repartido por igual.

---

## Pruébalo tú mismo

¿Quieres ver el código y los patrones reales? Échales un vistazo:

- **[Testcontainers for Go](https://github.com/testcontainers/testcontainers-go)** - El código completo
- **[AI.md](https://github.com/testcontainers/testcontainers-go/blob/main/AI.md)** - Directrices para agentes de IA (¡valen también para personas!)
- **[Documentación para desarrollar módulos](https://golang.testcontainers.org/modules)** - Buenas prácticas completas
- **Pull requests de ejemplo**: [#3425 (postgres)](https://github.com/testcontainers/testcontainers-go/pull/3425), [#3429 (redis)](https://github.com/testcontainers/testcontainers-go/pull/3429), [#3430 (redpanda)](https://github.com/testcontainers/testcontainers-go/pull/3430)

Los patrones, las convenciones y las lecciones aprendidas son open source. Aprende de ellos, adáptalos, mejóralos.

---

_¿Has usado agentes de código con IA en refactors grandes? ¿Qué te funcionó y qué no? Me encantaría conocer tu experiencia. Me encuentras en [LinkedIn](https://www.linkedin.com/in/mdelapenya/) o en [Twitter](https://twitter.com/mdelapenya)._
