---
title: "Entendiendo Testcontainers: probar la resiliencia de red con Toxiproxy"
date: 2026-07-27 09:00:00 +0200
description: "Cómo usar el módulo de Toxiproxy en testcontainers-go para escribir tests de resiliencia que prueban cómo reacciona tu app ante latencia, cortes de conexión y caídas de dependencias, sin mockear nada."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "toxiproxy", "resilience", "chaos-engineering"]
type: post
weight: 30
translationKey: understanding-testcontainers-testing-network-resilience-with-toxiproxy
translatedFrom: a1f3292
---

![Entendiendo Testcontainers: probar la resiliencia de red con Toxiproxy](/images/posts/2026-07-27-understanding-testcontainers-testing-network-resilience-with-toxiproxy/cover.png)

Soy mantenedor principal de [testcontainers-go](https://github.com/testcontainers/testcontainers-go). Este es el séptimo post de una serie sobre la librería. Los seis anteriores recorrieron el núcleo por dentro: la forma de la API, las wait strategies, los lifecycle hooks, el sistema de módulos, las redes, y por último un post de módulo aplicado que usaba LocalStack para probar una Lambda. Este va a otro sitio. En vez de comprobar que una funcionalidad funciona, comprobamos que la aplicación aguanta cuando falla un servicio del que depende.

El problema de los tests del camino feliz es que están diseñados para no fallar. Escribes un test que llama a tu endpoint respaldado por Redis, Redis responde en menos de un milisegundo y el test pasa. Siempre. Tu suite está en verde, tu CI está en verde, y tu aplicación sigue sin probarse en las condiciones que de verdad provocan incidentes en producción: un nodo de Redis que responde despacio, una partición de red que tira conexiones, una dependencia que se reinicia en mitad de una petición.

[Toxiproxy](https://github.com/Shopify/toxiproxy) cambia eso.

## Qué es Toxiproxy

Toxiproxy nació en Shopify para resolver un problema concreto: necesitaban demostrar, con tests, que sus aplicaciones no tenían puntos únicos de fallo. Las herramientas de caos existentes pedían acceso root, no eran multiplataforma o no tenían la API dinámica que necesitas en tests de integración, donde inyectas un fallo, ejecutas una aserción y lo quitas, todo por código desde dentro del test.

El modelo es simple: cada proxy tiene un nombre, una dirección de escucha y una dirección upstream. El tráfico que llega a la dirección de escucha se reenvía al upstream. Entre ambos añades "toxics", objetos con nombre que modifican el flujo del tráfico. El proxy y sus toxics se gestionan mediante una API HTTP. Toxiproxy incluye toxics para latencia, limitación de ancho de banda, cierre lento, resets de conexión, fragmentación de datos, timeouts y caídas completas.

El módulo de testcontainers-go envuelve todo eso en el mismo patrón `Run` / opciones que usa el resto de la librería. La imagen del contenedor es `ghcr.io/shopify/toxiproxy`.

## Lo que vamos a probar

El escenario es una aplicación respaldada por Redis. Guarda un valor en Redis y lo recupera. El test demostrará dos cosas, una detrás de otra:

1. Con Toxiproxy deshabilitando la conexión, un `Get` devuelve un error y no se queda colgado.
2. Tras volver a habilitar la conexión, el mismo `Get` funciona y devuelve el valor guardado.

Ese es el contrato. No "Redis funciona" (eso es cosa de Redis), sino "mi código gestiona bien la ausencia de Redis".

## Paso 1: la red compartida

Redis y Toxiproxy tienen que estar en la misma red de Docker, con alias conocidos. Toxiproxy hace de proxy hacia Redis por el nombre del contenedor, que resuelve dentro de la red de Docker. Sin red compartida, Toxiproxy no puede llegar a Redis. Es el mismo patrón que vimos en la [parte 5, sobre redes](/es/posts/2026-07-07-entendiendo-testcontainers-redes/).

```go
nw, err := network.New(ctx)
require.NoError(t, err)
t.Cleanup(func() {
    require.NoError(t, nw.Remove(ctx))
})
```

Redis recibe el alias `"redis"`, que es el hostname que usará Toxiproxy para llegar hasta él:

```go
redisContainer, err := tcredis.Run(
    ctx,
    "redis:6-alpine",
    network.WithNetwork([]string{"redis"}, nw),
)
testcontainers.CleanupContainer(t, redisContainer)
require.NoError(t, err)
```

## Paso 2: arranca Toxiproxy con un proxy declarado

El módulo tiene dos formas de conectar las piezas. La primera es declarativa: pasas `WithProxy` al crear el contenedor y el módulo configura el proxy antes del arranque. Serializa la definición del proxy a un fichero de configuración JSON y se lo pasa al contenedor con el flag `-config`:

```go
toxiproxyContainer, err := tctoxiproxy.Run(
    ctx,
    "ghcr.io/shopify/toxiproxy:2.12.0",
    tctoxiproxy.WithProxy("redis", "redis:6379"),
    network.WithNetwork([]string{"toxiproxy"}, nw),
)
testcontainers.CleanupContainer(t, toxiproxyContainer)
require.NoError(t, err)
```

`WithProxy("redis", "redis:6379")` declara un proxy llamado `"redis"` cuyo upstream es `redis:6379`, el alias y el puerto del contenedor de Redis en la red compartida. El módulo asigna un puerto de escucha a partir del `8666`, lo expone y guarda internamente la correspondencia.

La segunda forma es programática: arrancas el contenedor sin `WithProxy`, obtienes un cliente de Toxiproxy con `toxiproxyContainer.URI(ctx)` y llamas a `toxiproxyClient.CreateProxy(...)` en el cuerpo del test. Úsala cuando necesites crear o modificar proxies de forma dinámica, por ejemplo cuando la dirección del upstream no se conoce hasta que arranca el test. En este ejemplo el upstream es fijo, así que lo declarativo encaja mejor.

## Paso 3: obtén el endpoint con proxy

Con un proxy declarado, el módulo sabe qué puerto del host corresponde al puerto de escucha dentro del contenedor. `ProxiedEndpoint` hace esa consulta:

```go
proxiedRedisHost, proxiedRedisPort, err := toxiproxyContainer.ProxiedEndpoint(8666)
require.NoError(t, err)
```

El argumento es el puerto de escucha interno (`8666` para el primer proxy declarado, `8667` para el segundo, y así sucesivamente). Los valores devueltos son el host y el puerto a los que el test puede conectarse de verdad. Ese endpoint es Toxiproxy, no Redis. Toxiproxy reenvía a Redis, y tú puedes interferir en ese reenvío.

Construye el cliente de Redis a partir del endpoint con proxy:

```go
redisURI := fmt.Sprintf("redis://%s:%s?read_timeout=2s", proxiedRedisHost, proxiedRedisPort)

options, err := redis.ParseURL(redisURI)
require.NoError(t, err)

redisCli := redis.NewClient(options)
defer redisCli.FlushAll(ctx)
```

El `read_timeout=2s` importa. Cuando se corta la conexión, quieres que el cliente devuelva un error a los dos segundos, y no que se quede colgado hasta que salte el timeout TCP del sistema operativo, minutos después.

## Paso 4: escribe a través del proxy

Con el cliente conectado a Toxiproxy, una escritura normal es transparente:

```go
err = redisCli.Set(ctx, "favorite:food", "Cabbage Biscuits", 2*time.Hour).Err()
require.NoError(t, err)
```

Todavía no hay ningún toxic activo. El proxy reenvía todo a Redis sin tocarlo. El valor llega a Redis igual que si el cliente se hubiera conectado directamente.

## Paso 5: corta la conexión y demuestra el fallo

Consigue un handle del proxy a través de la API de control de Toxiproxy. Aunque el proxy se declaró con `WithProxy`, sigues necesitando el cliente para manipularlo en tiempo de ejecución:

```go
toxiURI, err := toxiproxyContainer.URI(ctx)
require.NoError(t, err)

toxiproxyClient := toxiproxy.NewClient(toxiURI)
proxies, err := toxiproxyClient.Proxies()
require.NoError(t, err)

proxy := proxies["redis"]
```

`URI` devuelve el endpoint de la API de control (puerto `8474`). Deshabilita el proxy:

```go
err = proxy.Disable()
require.NoError(t, err)
```

Ahora lee:

```go
savedValue, err := redisCli.Get(ctx, "favorite:food").Result()
require.Error(t, err)
require.Empty(t, savedValue)
```

Esta es la aserción clave. El test no confía en que el camino de error funcione. Lo demuestra: con el proxy deshabilitado, `Get` devuelve un error. Si el cliente se quedara colgado en lugar de saltar por timeout, o devolviera datos obsoletos fingiendo que Redis está bien, esta aserción fallaría.

Vuelve a habilitar el proxy y comprueba la recuperación:

```go
err = proxy.Enable()
require.NoError(t, err)

savedValue, err = redisCli.Get(ctx, "favorite:food").Result()
require.NoError(t, err)
require.Equal(t, "Cabbage Biscuits", savedValue)
```

La conexión vuelve y el dato sigue en Redis. El ciclo completo, normal, caído y recuperado, queda demostrado en un solo test.

## Añadir latencia en lugar de cortar la conexión

El test del corte de conexión demuestra tu camino de error. La latencia demuestra tu lógica de timeouts y reintentos. La preparación es la misma, pero en vez de deshabilitar el proxy añades un toxic de latencia:

```go
const (
    latency = 1_000 // ms
    jitter  = 200   // ms
)

_, err = proxy.AddToxic("latency_down", "latency", "downstream", 1.0, toxiproxy.Attributes{
    "latency": latency,
    "jitter":  jitter,
})
require.NoError(t, err)
```

`"downstream"` significa que la latencia se aplica en el sentido de Redis hacia el cliente. `1.0` es la toxicidad (el 100 % de las conexiones afectadas). Con este toxic activo, cada respuesta de Redis llega con 1.000 ms de retraso (más o menos 200 ms).

Un cliente con un `read_timeout` de 500 ms devolverá un error de timeout. Un cliente con un timeout de 2 s verá lecturas lentas, pero ningún fallo. El test te dice en cuál de los dos casos estás, antes de que lo descubras en producción.

## Qué se rompió, y a qué velocidad lo vi

Un error común es olvidarse del `read_timeout` en la URI de Redis. Cuando el proxy está deshabilitado, `Get` no devuelve un error enseguida. Se cuelga. El test se queda esperando al timeout TCP del sistema operativo (30 segundos o más) y acaba fallando con un timeout del test runner, no del cliente.

Eso no es un fallo del test. Es un hallazgo de arquitectura: tu cliente de Redis no tiene ningún timeout configurado. Añade `?read_timeout=2s` a la URI, vuelve a ejecutar el test y el error aparece en dos segundos. Ahora el test es una especificación de cómo se comporta tu timeout.

El toxic de latencia saca a la luz el mismo tipo de hallazgo para la lógica de reintentos. Pon la latencia por encima de tu `read_timeout` y el cliente debería reintentar. Si no hay lógica de reintentos, o está detrás de una comprobación del tipo de error equivocado, el test falla de inmediato y señala exactamente el hueco.

## Cierre

Un mock de Redis no prueba tu timeout. Un mock que devuelve un error no prueba tu lógica de reconexión. Toxiproxy prueba las dos cosas, contra un Redis real, en un contenedor real, sobre una red real y con latencia real. Lo único que cambia es la red que hay entre ellos.

El patrón encaja con la capa de módulos de la [parte 4](/es/posts/2026-06-25-entendiendo-testcontainers-la-capa-de-modulos/): `WithProxy` declara el proxy igual que `WithEnv` declara una variable de entorno. El contenedor se encarga de conectar las piezas, y el test se centra en el comportamiento que dices garantizar.

---

## Recursos

- *[Módulo de Toxiproxy en testcontainers-go](https://github.com/testcontainers/testcontainers-go/tree/main/modules/toxiproxy)*
- *[Toxiproxy, de Shopify](https://github.com/Shopify/toxiproxy)*
- *[Desarrollar aplicaciones resilientes con Toxiproxy y Testcontainers (Java)](https://www.docker.com/blog/developing-resilient-applications-with-toxiproxy-and-testcontainers/)*
