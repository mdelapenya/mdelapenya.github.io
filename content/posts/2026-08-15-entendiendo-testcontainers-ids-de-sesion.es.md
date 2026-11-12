---
title: "Entendiendo Testcontainers: IDs de sesión"
date: 2026-08-15 09:00:00 +0200
description: "De dónde sale el identificador que une una sesión de tests: se deriva del proceso padre, se hashea, se estampa como label en cada recurso y da nombre al reaper. Además, cómo sobrescribirlo y por qué sistemas de build como Bazel te obligan a hacerlo."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "internals", "bazel", "docker"]
type: post
weight: 30
translationKey: understanding-testcontainers-session-ids
translatedFrom: efbd06d
---

![Entendiendo Testcontainers: IDs de sesión](/images/posts/2026-08-15-understanding-testcontainers-session-ids/cover.png)

Soy mantenedor principal de [testcontainers-go](https://github.com/testcontainers/testcontainers-go). Este es el octavo post de una serie sobre la biblioteca. Los siete anteriores cubrieron la forma de la API, las wait strategies, los lifecycle hooks, el sistema de módulos, las redes, y dos posts aplicados de módulos: uno con LocalStack para probar una Lambda y otro con Toxiproxy para probar la resiliencia de red. Este vuelve a las tripas.

También salda una deuda. En el [post de LocalStack](/es/posts/2026-07-15-probando-lambdas-de-aws-en-local-con-localstack/), el test configuraba `LAMBDA_DOCKER_FLAGS` para copiar las labels genéricas de la biblioteca a los contenedores hijos que LocalStack lanza para ejecutar cada Lambda, de modo que se limpiaran junto con todo lo demás. Entre esas labels hay un ID de sesión. Cada contenedor, red y volumen que crea la biblioteca lo lleva, y la limpieza lo usa para decidir qué pertenece a tu ejecución. Este post va de dónde sale ese identificador y de qué pasa cuando el entorno no puede producirlo.

## Una sesión no es un proceso

Go ejecuta un binario de test por paquete. Así que un `go test ./...` en un repositorio con una docena de paquetes son doce procesos, que arrancan y terminan por su cuenta, cada uno con su propia visión del mundo.

La biblioteca quiere que todos cuenten como una única sesión de tests, para que los recursos que crean se limpien juntos y no doce veces por separado. Su propia definición de sesión de tests es:

- una única invocación de `go test`, incluidos los flags;
- una única invocación de `go test ./...`, para todos los subpaquetes desde esa ubicación;
- la ejecución de un test o de un conjunto de tests desde el IDE.

Esa es la restricción que debe cumplir el identificador. Tiene que ser estable entre procesos que se arrancaron de forma independiente, y distinto entre ejecuciones sin relación. Nada dentro de un solo proceso ofrece eso: el PID es distinto en cada paquete, y un valor aleatorio también lo sería.

## Se deriva del padre

Lo que esos procesos sí comparten es un padre. Los binarios de test de cada paquete son todos hijos del mismo proceso `go test`, así que la biblioteca mira hacia arriba, no hacia dentro.

Toma el ID del proceso padre y la hora de creación de ese padre, y hashea el par. El resultado es una cadena hexadecimal de 64 caracteres. El PID del padre es lo que hace que el valor sea compartido. La hora de creación evita que un PID reciclado choque con una ejecución anterior que ya terminó.

Lo ejecuté en mi máquina para verlo funcionar. Dos paquetes, cada uno con su log del PID del padre y del ID de sesión que resolvió la biblioteca:

| Ejecución | Paquete | PID del padre | ID de sesión |
|---|---|---|---|
| Un solo `go test ./...` | pkga | 29614 | `810b4567…` |
| Un solo `go test ./...` | pkgb | 29614 | `810b4567…` |
| `go test ./pkga` por separado | pkga | 29850 | `de3eb687…` |
| `go test ./pkgb` por separado | pkgb | 29861 | `ee3ac646…` |

Ese es todo el contrato en cuatro filas. Mismo padre, misma sesión. Distinto padre, distinta sesión. Los dos paquetes de la primera ejecución eran procesos separados que nunca se hablaron, y aun así se pusieron de acuerdo en el identificador, porque los dos miraban lo mismo por encima de ellos.

## Cuando no se puede derivar

La búsqueda puede fallar. Puede que la biblioteca no consiga enumerar procesos, o leer la hora de creación del padre, o completar el hash. Todos esos caminos acaban en lo mismo: un UUID aleatorio.

Conviene detenerse en ese fallback, porque es una decisión. Un UUID aleatorio por proceso significa que no hay agregación en absoluto: cada paquete se convierte en su propia sesión, con su propio reaper. Pero también significa que no hay colisiones. Ante un entorno que no sabe leer, la biblioteca prefiere aislar a agrupar.

La asimetría lo justifica. Agrupar de menos te cuesta unos cuantos contenedores reaper de más mientras dura la ejecución. Una colisión significaría que una ejecución de tests limpia los contenedores de otra que todavía los está usando. Lo primero es una ineficiencia. Lo segundo es un bug que te pasarías una tarde entera sin conseguir reproducir.

## Qué cuelga de él

Una vez resuelto, el ID de sesión aparece en cuatro sitios que importan.

**Labels.** Cada uno de esos recursos recibe el conjunto estándar de labels, y una de ellas es `org.testcontainers.sessionId` con este valor. Cuando Ryuk está activado, hay además una label `reap` que marca el recurso como algo que hay que limpiar. Es justo lo que copiaba el post de LocalStack: esas labels son el contrato, así que estamparlas en contenedores que la biblioteca no creó ella misma basta para que se limpien con la sesión.

**Cada llamada al daemon.** La biblioteca enruta todo su tráfico con la API de Docker a través de un único constructor de cliente, y ese constructor fija un conjunto de cabeceras HTTP en cada petición:

```go
opts = append(opts, client.WithHTTPHeaders(
    map[string]string{
        "x-tc-pp":    bootstrap.ProjectPath(),
        "x-tc-sid":   tcConfig.SessionID,
        "User-Agent": "tc-go/" + internal.Version,
    }),
)
```

Así que el ID de sesión no solo se estampa en los recursos: viaja por la red como `x-tc-sid` en cada llamada, junto con la ruta del proyecto y el `User-Agent` que hace que el tráfico se pueda atribuir a la biblioteca. Esa última cabecera es de la que tiré en [el post sobre un año de testcontainers-go en Docker Hub](/es/posts/2026-06-26-un-ano-de-testcontainers-go-en-docker-hub/), y sale de este mismo bloque.

**El nombre del reaper.** El contenedor reaper se llama como el identificador: `reaper_<sessionID>`.

**La reutilización del reaper.** Antes de arrancar un reaper, la biblioteca busca uno existente, filtrando por esa label y por ese nombre. Aquí es donde la agregación da fruto: el primer proceso que necesita un reaper lo crea, y todos los demás de la misma sesión lo encuentran y lo reutilizan. Una docena de paquetes, un solo reaper.

El reaper es además el único recurso que lleva las labels reaper y ryuk pero al que se le ha quitado la label reap. No figura en su propia lista.

## Cómo sobrescribirlo

El valor derivado es el predeterminado, no la única opción. El ID de sesión se resuelve con el primero de estos que esté definido:

1. la label de ID de sesión en la propia petición del contenedor;
2. la variable de entorno `TESTCONTAINERS_SESSION_ID`;
3. la propiedad `session.id` en `~/.testcontainers.properties`;
4. el hash derivado.

Un valor configurado se usa tal cual, sin hashear. Como acaba en el nombre del contenedor reaper, se valida al leer la configuración: tiene que producir un nombre que acepte el runtime de contenedores, es decir, no vacío, compuesto solo por caracteres alfanuméricos, puntos, guiones y guiones bajos, y lo bastante corto para que `reaper_<sessionID>` quede dentro del límite de 128 caracteres. Un valor que no cumpla se rechaza ahí mismo, antes de crear ningún contenedor.

Configurarlo hace lo que esperarías. Las mismas dos invocaciones separadas que caían en sesiones distintas más arriba informan las dos de `ci-pipeline-42` cuando `TESTCONTAINERS_SESSION_ID` tiene ese valor. Padres distintos, misma sesión, porque ya no se usa la inferencia.

Hay una consecuencia que conviene decir con claridad, y está documentada: al configurar el valor, la ejecución no creará más de un reaper. Los cambios en los ajustes de Ryuk una vez que ese reaper existe se ignoran, porque no hay un segundo reaper al que aplicarlos.

## Cuando el sistema de build no te da un padre

Derivar el ID de sesión del proceso padre es una inferencia sobre cómo se arrancaron los procesos. Un sistema de build es libre de no garantizar nada de eso, y Bazel es el caso concreto.

Bazel ejecuta cada target de test de forma aislada, y su [Test Encyclopedia](https://bazel.build/reference/test-encyclopedia) dice:

> El ID del proceso actual, el ID del grupo de procesos, el ID de sesión y el ID del proceso padre no están especificados.

Esa es justo la base sobre la que se apoya la derivación, declarada como no disponible. El sharding lo hace más visible, porque el test runner se lanza una vez por shard.

Otros dos detalles del entorno de tests de Bazel importan aquí:

- `HOME` toma el valor de `$TEST_TMPDIR`, un directorio privado del test, así que `~/.testcontainers.properties` no se lee.
- El entorno está saneado. Los tests, en palabras de Bazel, *"no deberían depender de la presencia, la ausencia o el valor de ninguna variable de entorno que no figure arriba"*, así que `TESTCONTAINERS_SESSION_ID` no llega al test salvo que se declare.

Ponlo al lado de los cuatro niveles de precedencia y dos desaparecen. No se puede confiar en el hash derivado, el fichero de propiedades no se lee, y la variable de entorno hay que pasarla de forma explícita:

```shell
bazel test //... --test_env=TESTCONTAINERS_SESSION_ID
```

Esa forma toma el valor del entorno desde el que invocas. Para fijarlo con independencia de la shell en la que estés:

```shell
bazel test //... --test_env=TESTCONTAINERS_SESSION_ID=my-session
```

Nada de esto es Bazel haciendo algo mal. Es ser hermético a propósito, y el linaje de procesos es una de las cosas a las que renuncia la hermeticidad. La sobrescritura es lo que permite que la biblioteca funcione donde la inferencia no puede.

## Para cerrar

El ID de sesión es la respuesta de la biblioteca a una pregunta que tiene que acertar antes de poder limpiar lo que dejas atrás: ¿cuáles de estos contenedores son míos? La infiere del linaje de procesos cuando puede, y la toma de la configuración cuando no.

Saber en cuál de las dos situaciones estás es lo que importa. Con `go test`, no tendrás que pensar en ello. Con un sistema de build que te da un sandbox y ninguna promesa sobre tu padre, es lo primero que tienes que configurar.

---

## Recursos

- *[Semántica de la sesión de tests](https://golang.testcontainers.org/features/test_session_semantics/)*
- *[Bazel Test Encyclopedia](https://bazel.build/reference/test-encyclopedia)*
- *[Bazel: --test_env](https://bazel.build/docs/user-manual)*
