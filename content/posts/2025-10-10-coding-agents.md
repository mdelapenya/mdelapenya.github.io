---
title: "Refactoring 63 Go Modules with an AI Coding Agent: A Senior Developer's Experience"
date: 2025-10-10 09:00:00 +0100
description: "How I used Claude to refactor 41 modules in 4 days after learning patterns myself from 22 modules. A real story about human-AI collaboration in production code."
image: "/images/posts/2025-10-10-coding-agents/cover.png"
categories: [Go, AI, Development]
tags: ["go", "ai", "coding-agents", "refactoring", "testcontainers", "claude", "docker"]
type: post
weight: 27
showTableOfContents: true
---

![Claude, I need you!](/images/posts/2025-10-10-coding-agents/cover.png)

> This post is about a real refactoring experience using AI coding agents on production code. No hype, no hand-waving—just what actually happened, what worked, what didn't, and what I learned.

## The Challenge

The Testcontainers for Go project needed a major refactoring: migrate all 63 modules from using `testcontainers.GenericContainer()` to the new `testcontainers.Run()` API. Each module represents a different technology: PostgreSQL, Redis, Kafka, MongoDB, Elasticsearch, etc.

This wasn't just a find-and-replace job. Each module had its own quirks:
- Different configuration patterns
- Custom options and validations
- Environment variable inspection
- TLS support and credentials
- Wait strategies and health checks

The scope? Roughly 15,000+ lines of code across modules, tests, and examples. All had to maintain backward compatibility, pass existing tests, and follow our coding conventions.

## The Experiment: Learn First, Then Delegate

I decided to try an experiment: **do part of the migration manually to understand the patterns, then use an AI coding agent for the rest.**

### Phase 1: Manual Migration (Sept 26 - Oct 3)

I started alphabetically with `aerospike` and worked my way through to `grafana-lgtm`—**22 modules in 7 days**.

Why go manual first? Because I needed to:
- Understand what patterns actually worked
- Hit all the edge cases myself
- Build intuition for the "right" solution
- Create reference implementations

The learnings from this phase were crucial:

**Pattern 1: The Run Function Structure**
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

**Pattern 2: Option Types**
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

**Pattern 3: Env Variable Inspection**
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

**Critical Discoveries:**
- ✅ Return struct types, NOT interfaces (`testcontainers.CustomizeRequestOption`, not `testcontainers.ContainerCustomizer`)
- ✅ Call built-in options directly: `testcontainers.WithFiles(f)(req)`, not `.Customize(req)`
- ✅ Use `strings.CutPrefix` from stdlib, not manual string manipulation
- ✅ Option order matters: defaults → user options → post-processing
- ✅ Always initialize container variable before error check
- ✅ Container naming: use `Container`, not `PostgresContainer`

After 7 days and 22 modules, I had:
1. A proven pattern that worked
2. Multiple reference implementations
3. Confidence that this was the right approach

### Phase 2: AI-Assisted Migration (Oct 6 - Oct 9)

With the patterns established, I brought in Claude Code to help with the remaining **41 modules in just 3 days**.

Here's what that looked like:

**Day 1 (Oct 6): Teaching the Agent**

I started by providing a detailed prompt to the agent, a bit clumsy, but it worked.

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

**Day 2-3 (Oct 7-8): Building Velocity**

I realised that it was important for the agent to understand what to do, then I asked it to write down a `plan.txt` file with all the knowledge it had gathered, in order to be able to continue after different sessions by simply reading that file. I also asked the agent to update the plan with the discoveries and important patterns it had found, so the plan was always up to date.

This is the `plan.txt` file that was created:

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

Once Claude understood the pattern, the workflow became:

```
Me: "Migrate the kafka module"

Claude: [Works on the module following the established pattern]
        [Runs tests for the module]
        [Creates a new branch: use-run-claude-kafka]
        [Creates commit]
        [Submits PR with proper description]

Me: [Reviews PR, merges]
```

**Day 4 (Oct 9): Complex Modules and Documentation**

Even the complex ones followed the pattern:

- **RabbitMQ**: SSL settings, custom config templates, multiple wait strategies
- **Redpanda**: Listeners, TLS, authentication, bootstrap config (required breaking change to Option type)
- **Redis**: TLS with dynamic certificate generation, config file handling

I had time to polish the docs, of course, assisted by the agent:

- Updated `docs/modules/index.md` with comprehensive best practices ([#3445](https://github.com/testcontainers/testcontainers-go/pull/3445))
- Updated module generator templates ([#3445](https://github.com/testcontainers/testcontainers-go/pull/3445))
- Created `AI.md` file with guidelines for future AI agents ([#3446](https://github.com/testcontainers/testcontainers-go/pull/3446))

### Phase 3: Follow-up Consistency Pass (Oct 10)

After completing the main migration, I noticed some modules still had inconsistent option processing patterns. Some were processing custom `Option` types AFTER building `moduleOpts` instead of BEFORE.

This was a perfect test case for the pattern we'd established. I asked Claude to:
1. Scan all modules for this specific inconsistency
2. Fix only the modules that had the issue
3. Test each one individually
4. Commit with the pattern: `chore(module): apply consistent patterns for options`

Please check the results of the PRs in [#3447](https://github.com/testcontainers/testcontainers-go/pull/3447).

**Result: 6 modules fixed in a few hours**

Modules corrected:
- **couchbase** - Complex custom options (buckets, services, credentials)
- **etcd** - Cluster configuration options
- **gcloud/firestore** - Project ID and datastore mode settings
- **dockermcpgateway** - Tools and secrets configuration
- **azure/eventhubs** - Azurite container options
- **azure/servicebus** - MSSQL container options

Each fix followed the same pattern:
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

This follow-up work demonstrated that the AI-assisted pattern is repeatable for any consistency improvement across a large codebase.

## The Numbers

Let's be honest about the metrics:

| Phase | Duration | Modules | Modules/Day | Total Lines Changed |
|-------|----------|---------|-------------|-------------------|
| **Manual (Me)** | 7 days | 22 | 3.1 | ~5,000+ |
| **AI-Assisted (Migration)** | 3 days | 41 | 13.67 | ~10,000+ |
| **AI-Assisted (Consistency)** | 0.5 days | 6 | 12 | ~500+ |
| **Total** | **10.5 days** | **69** | **6.6** | **~15,500+** |

**The AI multiplier: 4.4x faster** (13.67 vs 3.1 modules/day for initial migration)

**Follow-up consistency work**: Once the pattern was established, applying it to catch edge cases was even faster—6 modules in half a day with full test coverage.

But the raw speed isn't the full story.

## What Actually Happened: The Real Collaboration

### What Worked Brilliantly

**1. Pattern Application**

Once I showed Claude the pattern, it applied it consistently across all modules. No copy-paste errors, no forgotten steps, no variance. Every module got:
- The same 5-step Run function structure
- Proper error handling
- Correct option ordering
- Consistent naming conventions

**2. Test-Driven Workflow**

The workflow became incredibly efficient:
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

**3. Learning and Adapting**

Mid-migration, I discovered a better pattern:

```
Me: "Use strings.CutPrefix with early exit for env inspection,
     don't do manual string manipulation"

Claude: [Updates current module]
        [Applies to ALL subsequent modules]
        [Never makes the old mistake again]
        [Update plan.txt]
```

**4. Documentation Quality**

Because Claude needs explicit instructions, I was forced to document everything clearly. This created artifacts that benefit everyone:
- `docs/modules/index.md`: Comprehensive best practices
- `AI.md`: Guidelines for future AI agents (and new developers!)
- `plan.txt`: Every pattern and pitfall documented

### What Required Human Oversight

**1. Architectural Decisions**

Breaking changes needed human judgment:
```
Me: "The redpanda Option type needs to return errors for proper validation.
     This is a breaking change but it's the right call."

Claude: "Understood. Changing type Option func(*options) error and
         updating all call sites to check errors."
```

**2. Edge Cases and Context**

Some modules needed special handling:
```
Claude: "The k6 module tests are failing..."

Me: "Skip k6 tests - the Docker image is broken, not our code.
     This is documented in the plan."

Claude: "Got it. Migrating code but marking tests as skipped."
```

**3. Go Idioms**

```
Me: "Return struct types, not interfaces. This is a Go best practice."

Claude: [Updates code]
        "Changed return type from testcontainers.ContainerCustomizer
         to testcontainers.CustomizeRequestOption"
```

**4. Git Workflow**

```
Me: "Only git add files from the module you're working on,
     not the entire repo"

Claude: git add modules/postgres/
        [Not: git add .]
```

## The Surprises

### Positive Surprises

**Claude caught bugs I would have missed:**

In the rabbitmq module:
```go
// Before (my initial attempt)
AdminUsername: "guest",  // Hardcoded default
AdminPassword: "guest",

// Claude's fix
AdminUsername: settings.AdminUsername,  // Use actual settings
AdminPassword: settings.AdminPassword,
```

**Consistent application of optimizations:**

Once I mentioned `strings.CutPrefix` with early exit, Claude applied it perfectly across all 41 modules. No variance, no forgetting.

**Better commit messages:**

Claude wrote more consistent commit messages than I sometimes do:

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

### Challenges

**Security concerns:**

Running an AI agent with full access to your codebase and terminal raises legitimate security questions:
- What if the AI runs destructive commands?
- What if it modifies files incorrectly?
- What if it pushes bad code to production?

My approach to mitigate these risks:

1. **Strong test suite as a safety net** - Every change must pass `make pre-commit test` before committing
2. **Git version control** - All changes are tracked, reviewable, and reversible
3. **Human review** - I reviewed every module migration, especially complex ones
4. **Incremental commits** - One module at a time, making issues easy to isolate and rollback

**Future consideration: Docker sandbox**

For even greater safety, running the AI agent in a Docker sandbox would provide:
- **Isolated environment** - Agent can't affect host system
- **Limited permissions** - No access to push code or create PRs from inside container
- **Controlled resources** - Workspace mounted as volume, host handles git operations
- **Audit trail** - Container logs everything the agent does

This approach would let the agent do all the code generation and testing in isolation, while a human operator on the host reviews and executes the final git push and PR creation steps. The `plan.txt` file actually documents this workflow for future use.

**Environment setup reminders:**

Claude needed occasional reminders:
```
Me: "Remember to run: eval \"$(gvm 1.24.7 --arch=arm64)\"
     before any Go command"

Claude: "Right, setting Go version first..."
```

**Initial learning curve:**

The first few modules with Claude required corrections:
```
Claude: [Makes attempt]

Me: "Almost, but return the struct type, not the interface"

Claude: [Corrects immediately]
        [Never makes that mistake again]
```

**Explicit context needed:**

```
Me: "The conventions.yml workflow enforces commit types.
     Only use: security, fix, feat, docs, chore, deps"

Claude: "Understood. Using 'chore' for module migrations."
```

## Lessons Learned

### 1. You're the Architect, AI is the Builder

The human role is critical:
- **Define patterns** from real experience
- **Make architectural decisions** (breaking changes, design choices)
- **Review and validate** AI output
- **Provide context** the AI can't have

The AI excels at:
- **Applying patterns** consistently
- **Implementing details** without copy-paste errors
- **Running tests** and fixing failures
- **Handling tedious** repetitive work

### 2. Context is Everything

The quality of AI output is directly proportional to the quality of context provided:

**What worked:**
- Detailed `plan.txt` with patterns and pitfalls
- Multiple reference implementations
- Explicit instructions about conventions
- Links to existing documentation

**What didn't:**
- "Migrate this module" (too vague)
- Assuming AI remembers previous sessions
- Implicit knowledge I had but didn't share

### 3. The Learning Phase is Essential

Going manual first was NOT wasted time. It was the foundation that made the AI-assisted phase successful:

1. I discovered what patterns actually worked in production
2. I hit the edge cases and learned how to handle them
3. I built intuition for "right" vs "wrong" solutions
4. I created reference implementations Claude could learn from

**Key insight**: You can't delegate what you don't understand.

### 4. Documentation Quality Matters for Everyone

Creating clear documentation for the AI had an unexpected benefit: it's also perfect for human developers.

The `AI.md` file that was created by the agent includes:
- Exact commit format requirements (with validation rules)
- Common pitfalls and how to avoid them
- Testing workflow and environment setup
- Quick reference patterns with links to detailed docs

I hope that new contributors will love it. Future-me will love it. And yes, future AI agents will love it too. 💖

### 5. Trust but Verify

AI is impressively consistent, but:
- Always run the test suite. Thankfully, I had a strong test suite
- Review changes, especially for complex modules
- Validate architectural decisions
- Check for subtle bugs (like hardcoded values)

The test suite became my confidence check. If tests pass, the migration is likely correct.

## The Meta Pattern That Emerged

Looking back, the real value wasn't just migrating 63 modules. It was establishing a **scalable collaboration pattern**:

1. **Learn patterns** through hands-on experience (22 modules)
2. **Document thoroughly** what works and why (`plan.txt`, `AI.md`)
3. **Create references** for AI to learn from (postgres, redis, etc.)
4. **Delegate implementation** while maintaining architectural oversight (41 modules)
5. **Capture learnings** in living documentation (docs updates)

This pattern is repeatable for future refactorings.

## What Changed My Mind

### Before this experience:
- "AI can't handle architectural refactoring"
- "Too risky for production code"
- "Would need constant supervision"

### After this experience:
- AI excels at pattern application and consistency
- With good tests, it's actually **safer** than manual work
- Supervision needed for direction, not implementation
- **4.4x faster** (13.67 vs 3.1 modules/day) with equal or better quality

The bottleneck shifted from **typing code** to **thinking about architecture**.

## Practical Takeaways

### If You Want to Try This

**Prerequisites:**
1. **Strong test suite** - Your safety net
2. **Clear patterns** - Work out what "good" looks like manually first
3. **Good documentation** - For both AI and humans
4. **Version control** - Git makes experiments safe

**Workflow:**
1. Start with simplest cases yourself
2. Document patterns as you discover them
3. Create 2-3 reference implementations
4. Bring in AI for pattern application
5. Review, test, iterate

**Red Flags:**
- AI doesn't understand context → Provide more examples
- Patterns inconsistent → Document explicitly
- Tests failing repeatedly → Review your pattern
- Copying mistakes → Better initial examples needed

### The Questions I Asked Most

During the AI-assisted phase, these were my most common interactions:

1. "Read module X and Y, then migrate module Z using the same pattern"
2. "Run tests and fix any failures"
3. "Use [specific technique] not [other technique]"
4. "Commit with proper conventional commit format"
5. "Create a PR with this description"

Simple, directed, specific.

## The Future

### What This Enables

**For large codebases:**
- Breaking changes become less scary
- Technical debt pays down faster
- Library updates more feasible
- Consistency improves over time

**For development teams:**
- Senior developers focus on architecture
- Junior developers learn from perfect consistency
- Code reviews focus on design, not typos
- Documentation quality improves (AI forces clarity)

**For open source:**
- Contributors can tackle larger refactorings
- Patterns propagate quickly across modules
- Onboarding becomes easier (better docs)
- Velocity increases without sacrificing quality

### The Real Insight

This isn't about **AI replacing developers**. It's about:
- **Elevating** developer work from implementation to architecture
- **Amplifying** impact through better leverage
- **Accelerating** evolution without sacrificing quality
- **Improving** consistency beyond human capability

The future isn't "AI vs. Humans." It's **"Senior Developer + AI = Superpowers"**.

## Conclusion

I migrated and standardized 69 Go modules in 10.5 days:
- **22 modules manually** (7 days) - Learning patterns
- **41 modules with Claude** (3 days) - Applying migration patterns
- **6 modules with Claude** (0.5 days) - Applying consistency patterns

The AI didn't do my job. It amplified my work:
- I made architectural decisions
- I defined patterns and conventions
- I reviewed and validated results
- Claude handled repetitive implementation

**The metrics:**
- 3.3x faster with AI assistance
- Zero regression bugs (all tests passing)
- Better consistency than manual work
- Improved documentation as side effect
- Repeatable pattern for future refactorings

**The lesson:**
AI coding agents aren't about replacing experience—they're about multiplying it. The key is knowing what to delegate and what to own.

Start with understanding. Document clearly. Delegate confidently. Review thoughtfully.

**On security:** While giving an AI agent access to your codebase raises valid concerns, proper safeguards make it manageable—strong tests, git version control, human review, and incremental commits. For even greater safety, having a Docker sandbox can isolate the agent's work while keeping critical operations (push, PR creation) in human hands.

The future of senior development is already here. It's just not evenly distributed yet.

---

## Try It Yourself

Want to see the actual code and patterns? Check out:

- **[Testcontainers for Go](https://github.com/testcontainers/testcontainers-go)** - The full codebase
- **[AI.md](https://github.com/testcontainers/testcontainers-go/blob/main/AI.md)** - Guidelines for AI agents (works for humans too!)
- **[Module Development Docs](https://golang.testcontainers.org/modules)** - Comprehensive best practices
- **Sample PRs**: [#3425 (postgres)](https://github.com/testcontainers/testcontainers-go/pull/3425), [#3429 (redis)](https://github.com/testcontainers/testcontainers-go/pull/3429), [#3430 (redpanda)](https://github.com/testcontainers/testcontainers-go/pull/3430)

The patterns, conventions, and lessons learned are all open source. Learn from them, adapt them, improve them.

---

_Have you used AI coding agents for large refactorings? What worked for you? What didn't? I'd love to hear your experiences. Find me on [LinkedIn](https://www.linkedin.com/in/mdelapenya/) or [Twitter](https://twitter.com/mdelapenya)._