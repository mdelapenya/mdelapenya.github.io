---
title: "Entendiendo Testcontainers: probar AWS Lambdas en local con LocalStack"
date: 2026-07-15 09:00:00 +0200
description: "Cómo usar el módulo de LocalStack de testcontainers-go para escribir un test de integración de una AWS Lambda real en Go: compilar el zip del bootstrap antes del arranque, aprovisionar la función con awslocal en un hook post-start, remapear la function URL al puerto mapeado e invocarla por HTTP real."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "localstack", "aws", "lambda"]
type: post
weight: 30
translationKey: understanding-testcontainers-testing-lambdas-with-localstack
translatedFrom: a15b62f
---

![Entendiendo Testcontainers: probar AWS Lambdas en local con LocalStack](/images/posts/2026-07-15-understanding-testcontainers-testing-lambdas-with-localstack/cover.png)

Soy core maintainer de [testcontainers-go](https://github.com/testcontainers/testcontainers-go) y este es el sexto post de una serie sobre el proyecto. Los cinco anteriores leían el núcleo desde dentro: la forma de la API, las wait strategies, los lifecycle hooks, el sistema de módulos, las redes. Este cambia de rumbo. Cojo un módulo de la estantería, el de LocalStack, y lo uso para escribir un test que sería un dolor escribir de cualquier otra forma. Todo lo que cuento aquí corre contra un ejemplo real que puedes clonar, así que puedes reproducir cada paso sin fiarte de mi palabra.

El ejemplo es el [workshop de testcontainers](https://github.com/testcontainers/workshop-go), en concreto el paso que añade tests de integración para una AWS Lambda. Has escrito una Lambda en Go. ¿Cómo la pruebas sin desplegar en AWS, sin mockear el SDK de AWS hasta que el test ya no demuestre nada, y ejerciendo aun así el runtime real y la ruta real de la function URL? La respuesta es LocalStack corriendo en un contenedor, tu función desplegada dentro y el test invocándola por HTTP igual que lo haría un cliente.

## Qué vamos a probar

El objetivo es una Lambda pequeña en Go. Recibe un JSON con valoraciones y devuelve estadísticas agregadas: la media y el recuento total. Un solo handler, compilado para el runtime real `provided.al2` y desplegado detrás de una function URL de Lambda.

La misión del test es estrecha y concreta: demostrar que la función desplegada, invocada con una llamada HTTP real, devuelve los números correctos. No que las matemáticas sean correctas de forma aislada (eso lo hace un test unitario), sino que todo el camino de desplegar e invocar produce la respuesta esperada.

## ¿Por qué no probar solo el handler con un test unitario?

Puedes, y deberías. El handler es una función normal de Go. La llamas con un payload, compruebas el resultado y listo. Ese test es rápido y tiene su sitio en la suite.

Pero llamar a la función directamente se salta todo lo que la rodea: el arranque del bootstrap del runtime `provided.al2`, el empaquetado en zip, el cableado de la function URL, la fontanería del rol IAM y la serialización JSON que ocurre en la frontera de la URL. Justo en esos puntos es donde una Lambda se rompe de formas que un test unitario nunca ve. Un handler que funciona en un test unitario puede fallar al arrancar bajo el runtime, o devolver un body que la capa de la URL destroza.

El test de integración cubre el camino del despliegue, no la lógica de negocio. El trade-off es honesto: es más lento y necesita Docker corriendo. A cambio, ejerce las partes de una Lambda que solo existen cuando la función está realmente desplegada.

## Paso 1: compilar la Lambda en un zip con el bootstrap

El runtime `provided.al2` espera un binario que se llame literalmente `bootstrap`. No es una convención que puedas esquivar renombrando: el runtime busca ese nombre exacto. La compilación vive en el `Makefile` del proyecto de la Lambda:

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

El build tag `lambda.norpc` elimina el transporte RPC que usaban los runtimes antiguos de Lambda y que `provided.al2` no necesita. El flag `-j` de `zip` descarta las rutas de directorio, para que el archivo contenga `bootstrap` en la raíz y no en una ruta anidada.

El test no ejecuta esos comandos a mano. Tiene un helper que lanza `make zip-lambda` y devuelve la ruta del archivo resultante:

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

Esto ocurre antes de que arranque el contenedor. El zip es una entrada del contenedor, no algo que se produce dentro. Ese planteamiento importa: es la mitad de preparación de la historia del ciclo de vida que conté en la [Parte 3 sobre lifecycle hooks](/es/posts/2026-06-19-entendiendo-testcontainers-sistema-lifecycle-hooks/). Parte del trabajo ocurre antes de que exista el contenedor y parte después de que arranque. Construir el artefacto está claramente en el bloque del "antes".

## Paso 2: arrancar LocalStack con el servicio Lambda

Ahora el contenedor. El módulo de LocalStack expone una función `Run`, y esto es la capa de módulos de la [Parte 4](/es/posts/2026-06-25-entendiendo-testcontainers-la-capa-de-modulos/) en la práctica: `localstack.Run` es un wrapper fino sobre el `Run` del core, así que todas las opciones del core (`WithEnv`, `WithFiles` y los lifecycle hooks de más abajo) se componen con ella directamente.

Antes de la llamada a `Run`, el test construye una pieza de configuración que es fácil pasar por alto, pero que hace un trabajo real:

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

`flagsFn` convierte las labels genéricas de Testcontainers en una cadena de flags de Docker `-l key=value`. De esa cadena sale la limpieza, y vuelvo a ella en un momento.

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

Pasan tres cosas:

- **`SERVICES=lambda`** le dice a LocalStack que arranque solo el servicio Lambda, en lugar de toda la superficie de emulación de AWS. Arranque más rápido y menos cosas que puedan salir mal.
- **`LAMBDA_DOCKER_FLAGS`** es la sutil. LocalStack ejecuta tu función en su propio contenedor Docker hijo, lanzado por el contenedor de LocalStack y no por Testcontainers. Esos hijos son invisibles para la sesión salvo que los etiquetes. `flagsFn` copia las labels genéricas (que incluyen el ID de sesión) a cada hijo de Lambda mediante flags `-l`, así que llevan la misma identidad de sesión que todo lo demás que ha creado el test.
- **`WithFiles`** copia el `function.zip` del host a `/tmp/function.zip` dentro del contenedor, donde el paso de aprovisionamiento puede alcanzarlo.

Por eso mismo la línea de limpieza es un simple `testcontainers.CleanupContainer(t, c)` y nada más. Como los hijos de Lambda llevan las labels de la sesión, la limpieza de la sesión los recoge junto con el propio contenedor de LocalStack. No queda nada colgando al terminar el test, y sin que el test tenga que seguir a mano los contenedores hijos.

## Paso 3: aprovisionar la función en un hook post-start

Esta es la parte hacia la que va todo el post, y es el premio directo de la [Parte 3](/es/posts/2026-06-19-entendiendo-testcontainers-sistema-lifecycle-hooks/). La función todavía no existe: LocalStack está corriendo, pero no tiene ninguna Lambda registrada. Aprovisionarla es una secuencia de llamadas a la AWS CLI, y van en un hook post-start, no en el cuerpo del test:

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

La secuencia se lee de arriba abajo: crear la función a partir del zip que hemos copiado, darle una function URL sin autenticación y esperar a que la función se declare activa. `awslocal` es el wrapper de LocalStack sobre la AWS CLI que dirige cada llamada al endpoint local en lugar de al AWS real, y se ejecuta dentro del contenedor mediante `c.Exec`.

¿Por qué un hook y no el cuerpo del test? Por dos razones. El contenedor tiene que estar levantado antes de que pueda ejecutarse ninguno de estos comandos, y un hook `PostStarts` se dispara justo en ese momento. Y poner el aprovisionamiento en el ciclo de vida del propio contenedor lo hace determinista: cuando `Run` devuelve, la función está creada, tiene URL y está activa. El test que viene después no necesita saber cómo se ha cocinado todo eso.

Ese tercer comando merece una mención. `lambda wait function-active-v2` es una wait strategy, pero delegada en la propia AWS CLI en lugar de expresarse con el paquete `wait` de testcontainers-go de la [Parte 2](/es/posts/2026-06-15-entendiendo-testcontainers-taxonomia-wait-strategies/). La CLI ya sabe cómo sondear Lambda hasta que está lista, así que el hook se apoya en ella en vez de reimplementar ese polling. Usa la comprobación de readiness que esté más cerca de lo que estás esperando.

## Paso 4: descubrir la URL en el hook, remapearla en el test

Aquí está la trampa, la que se encuentra todo el que usa LocalStack: la dirección que LocalStack reporta para la función es correcta dentro del contenedor e incorrecta desde el host.

El descubrimiento de la URL ocurre dentro del mismo hook post-start, justo después del bucle de aprovisionamiento. El hook le pregunta a LocalStack por la function URL y la captura en una variable declarada en el ámbito del test:

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

Fíjate en `exec.Multiplexed()`: demultiplexa el stream combinado de stdout y stderr de Docker, para que `reader` te dé un stdout limpio que puedas parsear como JSON. Sin él estarías deserializando un stream con las cabeceras de frame de Docker mezcladas.

La URL que vuelve apunta al puerto `4566` en un dominio `.localhost`. Ambos son correctos dentro del contenedor e incorrectos desde el host. Así que, cuando `Run` ya ha devuelto y el hook ha rellenado `functionURL`, el cuerpo del test la reescribe:

```go
// replace the port with the one exposed by the container
mappedPort, err := c.MappedPort(ctx, "4566/tcp")
require.NoError(t, err)

url := strings.ReplaceAll(functionURL, "4566", mappedPort.Port())

// The latest version of localstack does not add ".localstack.cloud" by default,
// that's why we need to add it to the URL.
url = strings.ReplaceAll(url, ".localhost", ".localhost.localstack.cloud")
```

El puerto `4566` es el puerto edge interno de LocalStack, pero Testcontainers lo mapea a un puerto libre aleatorio del host, así que `MappedPort` es la única fuente de verdad sobre dónde ha acabado. Y `.localhost` pasa a ser `.localhost.localstack.cloud`, un dominio que resuelve a `127.0.0.1` y conserva el subdominio, de modo que el host puede llegar a la function URL. El contenedor y el host no comparten espacio de direcciones: un puerto y un hostname válidos dentro del contenedor no significan nada fuera. Por eso traduces en la frontera.

## Paso 5: invocarla por HTTP real y comprobar el resultado

Con una URL a la que el host sí puede llegar, el test construye un histograma de valoraciones, lo convierte en el payload JSON que espera la Lambda, lo envía con un POST y revisa la respuesta:

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

Los números se pueden comprobar a mano. Los recuentos suman `10+20+30+40+50+60 = 210`, que es `totalCount`. La suma ponderada es `0*10 + 1*20 + 2*30 + 3*40 + 4*50 + 5*60 = 700`, y `700 / 210 = 3.3333333333333335`. Esa única aserción ejerce el camino entero: la serialización JSON en la frontera de la URL, el runtime `provided.al2` arrancando el binario `bootstrap`, el handler ejecutándose y la respuesta serializada de vuelta. Sin cuenta de AWS, sin pipeline de despliegue, sin mocks haciendo de runtime. Si cualquier eslabón de esa cadena está roto, esta línea falla.

## Qué se rompió y qué rápido lo vi

El workshop incluye una demo de fallo. Cambia un operador en el cálculo de la media en `main.go`:

```diff
	var avg float64
	if totalCount > 0 {
-		avg = float64(sum) / float64(totalCount)
+		avg = float64(sum) * float64(totalCount)
	}
```

Vuelve a ejecutar el test y falla mostrando los dos strings JSON lado a lado:

```text
    main_test.go:183:
                Error:          Not equal:
                                expected: "{\"avg\":3.3333333333333335,\"totalCount\":210}"
                                actual  : "{\"avg\":147000,\"totalCount\":210}"
```

`700 * 210 = 147000`, así que el operador equivocado se ve ahí mismo, en la salida. La regresión salta durante `go test` en un portátil, no en un entorno desplegado después de un merge. Ese es todo el argumento a favor del test de integración en un solo diff: el camino del despliegue se ejercita en local, y un cálculo roto aparece como dos strings JSON que no coinciden, en lugar de una alerta de producción.

## Cierre

Un test aplicado con Testcontainers tiene una forma, y este post la ha recorrido entera: construir el artefacto, arrancar el emulador, aprovisionar dentro de un lifecycle hook, remapear la frontera e invocar de verdad. Dos de las piezas vienen directas de posts anteriores: los lifecycle hooks aprovisionan la función y la capa de módulos te regala `localstack.Run`. La tercera, traducir la dirección del contenedor a otra a la que el host pueda llegar, es la que añade este post.

La serie vuelve ahora a las tripas. El truco de `LAMBDA_DOCKER_FLAGS` del Paso 2 se apoyaba en `GenericLabels()`, y enterrado en esas labels está el ID de sesión del que dependen Ryuk, las labels y la limpieza. El próximo post rastrea de dónde sale ese identificador y por qué tanto de testcontainers-go cuelga de él.

---

## Recursos

- *[Módulo de LocalStack de testcontainers-go](https://github.com/testcontainers/testcontainers-go/tree/main/modules/localstack)*
- *[Paso 11 del workshop: tests de integración para la Lambda](https://github.com/testcontainers/workshop-go/blob/main/step-11-integration-tests-for-the-lambda.md)*
- *[LocalStack](https://www.localstack.cloud/)*
- *[AWS Lambda Go: el runtime provided.al2](https://docs.aws.amazon.com/lambda/latest/dg/golang-package.html)*
