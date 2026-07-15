---
title: "Understanding Testcontainers: Testing AWS Lambdas Locally with LocalStack"
date: 2026-07-15 09:00:00 +0200
description: "Using the LocalStack module in testcontainers-go to write an integration test for a real Go AWS Lambda: compiling the bootstrap zip before startup, provisioning the function with awslocal in a post-start hook, remapping the function URL to the mapped port, and invoking it over real HTTP."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "localstack", "aws", "lambda"]
type: post
weight: 30
showTableOfContents: true
ai: true
image: "/images/posts/2026-07-15-understanding-testcontainers-testing-lambdas-with-localstack/cover.png"
related:
  - "/posts/2026-07-07-understanding-testcontainers-networks"
  - "/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks"
  - "/posts/2026-06-25-understanding-testcontainers-the-module-layer"
  - "/posts/2026-06-15-understanding-testcontainers-wait-strategies"
---

![Understanding Testcontainers: Testing AWS Lambdas Locally with LocalStack](/images/posts/2026-07-15-understanding-testcontainers-testing-lambdas-with-localstack/cover.png)

I am a core maintainer of [testcontainers-go](https://github.com/testcontainers/testcontainers-go). This is the sixth post in a series on the library. The previous five read the core from the inside: the API shape, wait strategies, lifecycle hooks, the module system, networks. This one changes direction. I take one module off the shelf, the LocalStack module, and use it to write a test that would be painful to write any other way. Everything here runs against a real, cloneable example, so you can reproduce every step instead of taking my word for it.

The example is the [testcontainers workshop](https://github.com/testcontainers/workshop-go), specifically the step that adds integration tests for an AWS Lambda. You wrote a Lambda in Go. How do you test it without deploying to AWS, without mocking the AWS SDK until the test proves nothing, and while still exercising the real runtime and the real function URL path? The answer is LocalStack running in a container, your function deployed into it, and the test invoking it over HTTP the same way a client would.

## The thing we are testing

The target is a small Go Lambda. It receives a JSON payload of ratings and returns aggregate statistics: the average rating and the total count. One handler, compiled for the real `provided.al2` runtime, deployed behind a Lambda function URL.

The test's job is narrow and concrete: prove that the deployed function, invoked over a real HTTP call, returns the right numbers. Not that the math is correct in isolation (a unit test does that), but that the whole deploy-and-invoke path produces the expected response.

## Why not just unit-test the handler?

You can, and you should. The handler is a plain Go function. Call it with a payload, assert on the result, done. That test is fast and it belongs in the suite.

But calling the function directly skips everything around it: the `provided.al2` runtime bootstrap, the zip packaging, the function URL wiring, the IAM role plumbing, and the JSON serialization that happens at the URL boundary. Those are exactly the places where a Lambda breaks in ways a unit test never sees. A handler that works in a unit test can still fail to boot under the runtime, or return a body the URL layer mangles.

The integration test covers the deploy path, not the business logic. The trade-off is honest: it is slower, and it needs Docker running. In exchange, it exercises the parts of a Lambda that only exist once the function is actually deployed.

## Step 1: compile the Lambda into a bootstrap zip

The `provided.al2` runtime expects a binary literally named `bootstrap`. That is not a convention you can rename around; the runtime looks for that exact name. The build lives in the Lambda project's `Makefile`:

```makefile
mod-tidy:
	go mod tidy

build-lambda: mod-tidy
	# If you are using Testcontainers Cloud, please add 'GOARCH=amd64' in order to get the localstack's lambdas using the right architecture
	GOOS=linux go build -tags lambda.norpc -o bootstrap main.go

test: mod-tidy
	go test -v -count=1 ./...

zip-lambda: build-lambda
	zip -j function.zip bootstrap
```

The `lambda.norpc` build tag drops the RPC transport the older Lambda runtimes used, which the `provided.al2` runtime does not need. The `-j` flag on `zip` junks the directory paths so the archive contains `bootstrap` at its root, not a nested path.

The test does not shell out to those commands by hand. It has a helper that runs `make zip-lambda` and returns the path to the resulting archive:

```go
// buildLambda returns the path to the ZIP file used to deploy the lambda function.
func buildLambda(t *testing.T) string {
	t.Helper()

	makeCmd := osexec.Command("make", "zip-lambda")
	makeCmd.Dir = "."

	err := makeCmd.Run()
	require.NoError(t, err)

	return filepath.Join("function.zip")
}
```

This happens before the container starts. The zip is an input to the container, not something produced inside it. That framing matters: it is the setup half of the lifecycle story I covered in [Part 3 on lifecycle hooks](/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks). Some work happens before the container exists, some after it starts. Building the artifact is firmly in the "before" camp.

## Step 2: start LocalStack with the Lambda service

Now the container. The LocalStack module exposes a `Run` function, and this is the module layer from [Part 4](/posts/2026-06-25-understanding-testcontainers-the-module-layer) in practice: `localstack.Run` is a thin wrapper over the core `Run`, so every core option (`WithEnv`, `WithFiles`, and the lifecycle hooks below) composes with it directly.

Before the `Run` call, the test builds one piece of configuration that is easy to skip past but does real work:

```go
flagsFn := func() string {
	labels := testcontainers.GenericLabels()
	flags := ""
	for k, v := range labels {
		flags = fmt.Sprintf("%s -l %s=%s", flags, k, v)
	}
	return flags
}

// get the path to the function.zip file
zipFile := buildLambda(t)
```

`flagsFn` turns the Testcontainers generic labels into a string of `-l key=value` Docker flags. That string is where cleanup comes from, and I will come back to it in a second.

```go
c, err := localstack.Run(ctx,
	"localstack/localstack:latest",
	testcontainers.WithEnv(map[string]string{
		"SERVICES":            "lambda",
		"LAMBDA_DOCKER_FLAGS": flagsFn(),
	}),
	testcontainers.WithFiles(testcontainers.ContainerFile{
		HostFilePath:      zipFile,
		ContainerFilePath: "/tmp/function.zip",
	}),
	// lifecycle hooks go here, see Step 3
)
testcontainers.CleanupContainer(t, c)
require.NoError(t, err)
```

Three things are happening:

- **`SERVICES=lambda`** tells LocalStack to start only the Lambda service instead of the whole AWS emulation surface. Faster startup, smaller blast radius.
- **`LAMBDA_DOCKER_FLAGS`** is the subtle one. LocalStack runs your function in its own child Docker container, spawned by the LocalStack container, not by Testcontainers. Those children are invisible to the session unless you tag them. `flagsFn` copies the generic labels (which include the session ID) onto every Lambda child via `-l` flags, so they carry the same session identity as everything else the test created.
- **`WithFiles`** copies the `function.zip` from the host into `/tmp/function.zip` inside the container, where the provisioning step can reach it.

That is also why the cleanup line is a plain `testcontainers.CleanupContainer(t, c)` and nothing more. Because the Lambda children carry the session labels, the session's cleanup reaps them along with the LocalStack container itself. Nothing leaks after the test, without the test tracking the child containers by hand.

## Step 3: provision the function in a post-start hook

This is the part the whole post builds toward, and it is the direct payoff of [Part 3](/posts/2026-06-19-understanding-testcontainers-lifecycle-hooks). The function does not exist yet: LocalStack is running, but it has no Lambda registered. Provisioning it is a sequence of AWS CLI calls, and they belong in a post-start hook, not in the test body:

```go
testcontainers.WithAdditionalLifecycleHooks(testcontainers.ContainerLifecycleHooks{
	PostStarts: []testcontainers.ContainerHook{
		func(ctx context.Context, c testcontainers.Container) error {
			lambdaName := "localstack-lambda-url-example"

			// 1. create a lambda function
			// 2. create the URL function configuration for the lambda function
			// 3. wait for the lambda function to be active
			lambdaCommands := [][]string{
				{
					"awslocal", "lambda",
					"create-function", "--function-name", lambdaName,
					"--runtime", "provided.al2",
					"--handler", "bootstrap",
					"--role", "arn:aws:iam::111122223333:role/lambda-ex",
					"--zip-file", "fileb:///tmp/function.zip",
				},
				{"awslocal", "lambda", "create-function-url-config", "--function-name", lambdaName, "--auth-type", "NONE"},
				{"awslocal", "lambda", "wait", "function-active-v2", "--function-name", lambdaName},
			}
			for _, cmd := range lambdaCommands {
				_, _, err := c.Exec(ctx, cmd)
				if err != nil {
					t.Fatalf("failed to execute command %s: %s", cmd, err)
				}
			}

			// ... URL discovery, see Step 4

			return nil
		},
	},
})
```

The sequence reads top to bottom: create the function from the zip we copied in, give it a function URL with no auth, then wait until the function reports active. `awslocal` is LocalStack's wrapper around the AWS CLI that points every call at the local endpoint instead of real AWS, and it runs inside the container via `c.Exec`.

Why a hook and not the test body? Two reasons. The container has to be up before any of these commands can run, and a `PostStarts` hook fires at exactly that moment. And putting provisioning in the container's own lifecycle makes it deterministic: by the time `Run` returns, the function is created, has a URL, and is active. The test that follows does not have to know how the sausage was made.

That third command is worth calling out. `lambda wait function-active-v2` is a wait strategy, but delegated to the AWS CLI itself instead of expressed with the library's `wait` package from [Part 2](/posts/2026-06-15-understanding-testcontainers-wait-strategies). The CLI already knows how to poll Lambda for readiness, so the hook leans on it rather than reimplementing the poll. Use the readiness check that is closest to the thing you are waiting for.

## Step 4: discover the URL in the hook, remap it in the test

Here is the gotcha, the one every LocalStack user hits: the address LocalStack reports for the function is correct inside the container and wrong from the host.

The URL discovery happens inside the same post-start hook, right after the provisioning loop. The hook asks LocalStack for the function URL and captures it into a variable declared in the test's scope:

```go
// 4. get the URL for the lambda function
cmd := []string{
	"awslocal", "lambda", "list-function-url-configs", "--function-name", lambdaName,
}
_, reader, err := c.Exec(ctx, cmd, exec.Multiplexed())
if err != nil {
	t.Fatalf("failed to execute command %s: %s", cmd, err)
}

buf := new(bytes.Buffer)
_, err = buf.ReadFrom(reader)
if err != nil {
	t.Fatalf("failed to read from reader: %s", err)
}

content := buf.Bytes()

type FunctionURLConfig struct {
	FunctionURLConfigs []struct {
		FunctionURL      string `json:"FunctionUrl"`
		FunctionArn      string `json:"FunctionArn"`
		CreationTime     string `json:"CreationTime"`
		LastModifiedTime string `json:"LastModifiedTime"`
		AuthType         string `json:"AuthType"`
	} `json:"FunctionUrlConfigs"`
}

v := &FunctionURLConfig{}
err = json.Unmarshal(content, v)
if err != nil {
	t.Fatalf("failed to unmarshal content: %s", err)
}

functionURL = v.FunctionURLConfigs[0].FunctionURL
```

Note `exec.Multiplexed()`: it demultiplexes Docker's combined stdout/stderr stream so `reader` gives you clean stdout to parse as JSON. Without it you would be unmarshalling a stream with Docker's frame headers mixed in.

The URL that comes back points at port `4566` on a `.localhost` domain. Both are correct inside the container and wrong from the host. So once `Run` has returned and the hook has populated `functionURL`, the test body rewrites it:

```go
// replace the port with the one exposed by the container
mappedPort, err := c.MappedPort(ctx, "4566/tcp")
require.NoError(t, err)

url := strings.ReplaceAll(functionURL, "4566", mappedPort.Port())

// The latest version of localstack does not add ".localstack.cloud" by default,
// that's why we need to add it to the URL.
url = strings.ReplaceAll(url, ".localhost", ".localhost.localstack.cloud")
```

Port `4566` is LocalStack's internal edge port, but Testcontainers maps it to a random free port on the host, so `MappedPort` is the only source of truth for where it actually landed. And `.localhost` becomes `.localhost.localstack.cloud`, a domain that resolves to `127.0.0.1` and carries the subdomain through, so the host can reach the function URL. The container and the host do not share an address space: a port and hostname that are valid inside the container mean nothing outside it, so you translate at the boundary.

## Step 5: invoke it over real HTTP and assert

With a URL the host can actually reach, the test builds a ratings histogram, turns it into the JSON payload the Lambda expects, POSTs it, and checks the response:

```go
histogram := map[string]string{
	"0": "10",
	"1": "20",
	"2": "30",
	"3": "40",
	"4": "50",
	"5": "60",
}

payload := `{"ratings": {`
for rating, count := range histogram {
	payload += `"` + rating + `": ` + count + `,`
}
if len(histogram) > 0 {
	// remove the trailing comma
	payload = payload[:len(payload)-1]
}
payload += "}}"

httpClient := http.Client{
	Timeout: 15 * time.Second,
}

resp, err := httpClient.Post(url, "application/json", bytes.NewBufferString(payload))
require.NoError(t, err)

stats, err := io.ReadAll(resp.Body)
require.NoError(t, err)

expected := `{"avg":3.3333333333333335,"totalCount":210}`
require.Equal(t, expected, string(stats))
```

The numbers are checkable by hand. The counts sum to `10+20+30+40+50+60 = 210`, which is `totalCount`. The weighted sum is `0*10 + 1*20 + 2*30 + 3*40 + 4*50 + 5*60 = 700`, and `700 / 210 = 3.3333333333333335`. That single assertion exercises the entire path: JSON serialization at the URL boundary, the `provided.al2` runtime booting the `bootstrap` binary, the handler running, and the response serialized back. No AWS account, no deploy pipeline, no mocks standing in for the runtime. If any link in that chain is broken, this line fails.

## What broke, and how fast I saw it

The workshop includes a failure demo. Change one operator in the average calculation in `main.go`:

```diff
	var avg float64
	if totalCount > 0 {
-		avg = float64(sum) / float64(totalCount)
+		avg = float64(sum) * float64(totalCount)
	}
```

Rerun the test, and it fails with the two JSON strings side by side:

```text
    main_test.go:183:
                Error:          Not equal:
                                expected: "{\"avg\":3.3333333333333335,\"totalCount\":210}"
                                actual  : "{\"avg\":147000,\"totalCount\":210}"
```

`700 * 210 = 147000`, so the wrong operator is right there in the output. The regression is caught during `go test` on a laptop, not in a deployed environment after a merge. That is the whole argument for the integration test in one diff: the deploy path is exercised locally, and a broken calculation surfaces as two JSON strings that do not match instead of a page from production.

## Closing

An applied Testcontainers test has a shape, and this post walked all of it: build the artifact, start the emulator, provision inside a lifecycle hook, remap the boundary, invoke for real. Two of the pieces come straight from earlier posts: lifecycle hooks provision the function, and the module layer gives you `localstack.Run` for free. The third, translating the container's address to one the host can reach, is the piece this post adds.

The series goes back to internals next. The `LAMBDA_DOCKER_FLAGS` trick in Step 2 leaned on `GenericLabels()`, and buried in those labels is the session ID that Ryuk, the labels, and the cleanup all key off. The next post traces where that identifier comes from and why so much of the library hangs off it.

---

## Resources

- *[testcontainers-go LocalStack module](https://github.com/testcontainers/testcontainers-go/tree/main/modules/localstack)*
- *[Workshop step 11: integration tests for the Lambda](https://github.com/testcontainers/workshop-go/blob/main/step-11-integration-tests-for-the-lambda.md)*
- *[LocalStack](https://www.localstack.cloud/)*
- *[AWS Lambda Go: the provided.al2 runtime](https://docs.aws.amazon.com/lambda/latest/dg/golang-package.html)*
