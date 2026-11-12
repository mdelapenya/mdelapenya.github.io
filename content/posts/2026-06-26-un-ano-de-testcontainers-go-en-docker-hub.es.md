---
title: "Un año de testcontainers-go en Docker Hub"
date: 2026-06-26 09:00:00 +0200
description: "Un vistazo corto al rastro que testcontainers-go deja en Docker Hub: las dos imágenes que descarga en su funcionamiento normal, la cabecera User-Agent que hace atribuibles los pulls y el crecimiento que muestra un año de métricas de Ryuk."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "testcontainers-go", "docker", "docker-hub"]
type: post
weight: 30
translationKey: a-year-of-testcontainers-go-on-docker-hub
translatedFrom: fb3cf8f
---

![Un año de testcontainers-go en Docker Hub](/images/posts/2026-06-26-a-year-of-testcontainers-go-on-docker-hub/cover.png)

Soy core maintainer de [testcontainers-go](https://github.com/testcontainers/testcontainers-go) y trabajo en Docker. Esa combinación es la que hace posible este post. Como maintainer sé exactamente cómo se identifica la librería cuando habla con un daemon de Docker. Como empleado de Docker puedo mirar las métricas de pulls de Docker Hub filtradas por ese identificador. Juntas dejan un rastro medible.

Este post es corto. Cuenta qué dos imágenes descarga testcontainers-go en su funcionamiento normal, el pequeño fragmento de código que firma cada llamada a la API de Docker con un User-Agent `tc-go/<version>`, los números que esa cabecera revela del último año y lo que dicen sobre la adopción de la librería.

## Las dos imágenes que descarga tc-go

El namespace `testcontainers` de Docker Hub contiene hoy cuatro imágenes: `testcontainers/ryuk`, `testcontainers/sshd`, `testcontainers/helloworld` y `testcontainers/vnc-recorder`. De esas cuatro, testcontainers-go solo descarga dos en su funcionamiento normal.

`testcontainers/ryuk` es el sidecar de limpieza. Cada sesión que no lo desactiva de forma explícita lanza un contenedor de Ryuk junto a los contenedores de test del usuario. Vigila un socket TCP y, cuando el proceso de test se desconecta, borra cualquier contenedor, red, volumen o imagen etiquetado con el identificador de la sesión. Ryuk tendrá su propio post más adelante este año, así que no profundizo aquí.

`testcontainers/sshd` es el reenviador de puertos. Cuando un test pide que los puertos del host sean accesibles desde el contenedor (con `HostAccessPorts`), la librería levanta un contenedor `sshd` que hace de túnel entre la red del contenedor y el host. Solo se descarga cuando hace falta, así que su volumen es una fracción pequeña del de Ryuk.

Las otras dos imágenes del namespace no las descarga testcontainers-go en su funcionamiento normal. `helloworld` es una imagen de documentación que se usa en tutoriales y ejemplos de inicio rápido. `vnc-recorder` sirve para grabar sesiones visuales y aparece en la configuración del módulo de Selenium: la descargan los usuarios cuando la necesitan, no el camino principal de la librería.

## Cómo firma tc-go cada llamada a la API de Docker

La librería usa `github.com/moby/moby/client`, el cliente upstream de la API de Docker, y hace pasar todas las conexiones por un único constructor en `internal/core/client.go`. Estas son las líneas relevantes:

```go
opts = append(opts, client.WithHTTPHeaders(
    map[string]string{
        "x-tc-pp":    ProjectPath(),
        "x-tc-sid":   SessionID(),
        "User-Agent": "tc-go/" + internal.Version,
    }),
)
```

Se añaden tres cabeceras a cada petición que la librería hace al daemon de Docker. `x-tc-pp` lleva la ruta del proyecto y `x-tc-sid` el ID de la sesión. Esas dos sirven para correlacionar internamente las operaciones de una misma ejecución de tests. También forman parte de la historia de cómo Ryuk sabe qué contenedores pertenecen a cada sesión, que es tema del post sobre Ryuk.

El `User-Agent` es el que ve Docker Hub durante las descargas de imágenes. Gracias a él, las métricas de pulls se pueden atribuir a testcontainers-go en concreto, y no a "algún cliente de Docker en algún sitio". Se le añade la versión de la librería, así que los mismos datos también se pueden cortar por versión. La cabecera es pequeña y barata. El resto del post es una ventana a lo que revela.

## Un año de tc-go en Docker Hub

En la ventana de 365 días que termina a mediados de junio de 2026, Docker Hub registró aproximadamente:

| Métrica                             |     Valor |
|-------------------------------------|----------:|
| Pulls totales atribuidos a tc-go    |   ~169,3M |
| Media diaria                        |     ~464K |
| Día pico                            |    ~1,09M |
| Imágenes distintas descargadas      |         2 |

La inmensa mayoría de estos pulls son de `testcontainers/ryuk`, lo cual tiene sentido: cada sesión arranca un contenedor de Ryuk por defecto, mientras que `sshd` solo entra en juego cuando se pide el reenvío de puertos. Usar los pulls de Ryuk como indicador de "sesiones de testcontainers-go iniciadas en todo el mundo" es razonable.

Lo interesante no está en el total del año, sino en la tendencia a lo largo de los trimestres. Estas son las medias diarias aproximadas de pulls de Ryuk atribuidos a tc-go, por trimestre:

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-label="Media diaria de pulls de testcontainers/ryuk por trimestre en tc-go">
  <title>Media diaria de pulls de testcontainers/ryuk por trimestre en tc-go</title>
  <rect x="0" y="0" width="640" height="360" fill="#ffffff"/>
  <text x="320" y="28" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="600" fill="#222">tc-go: media diaria de pulls de testcontainers/ryuk, por trimestre</text>
  <line x1="80" y1="40" x2="80" y2="300" stroke="#bbb" stroke-width="1"/>
  <line x1="80" y1="300" x2="620" y2="300" stroke="#bbb" stroke-width="1"/>
  <line x1="80" y1="235" x2="620" y2="235" stroke="#eee" stroke-width="1"/>
  <text x="72" y="239" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">200K</text>
  <line x1="80" y1="170" x2="620" y2="170" stroke="#eee" stroke-width="1"/>
  <text x="72" y="174" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">400K</text>
  <line x1="80" y1="105" x2="620" y2="105" stroke="#eee" stroke-width="1"/>
  <text x="72" y="109" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">600K</text>
  <line x1="80" y1="40" x2="620" y2="40" stroke="#eee" stroke-width="1"/>
  <text x="72" y="44" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">800K</text>
  <text x="72" y="304" text-anchor="end" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666">0</text>
  <rect x="115" y="202.5" width="80" height="97.5" fill="#4f6172"/>
  <text x="155" y="195" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~300K</text>
  <text x="155" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q3 2025</text>
  <rect x="235" y="186.25" width="80" height="113.75" fill="#4f6172"/>
  <text x="275" y="179" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~350K</text>
  <text x="275" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q4 2025</text>
  <rect x="355" y="105" width="80" height="195" fill="#4f6172"/>
  <text x="395" y="98" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~600K</text>
  <text x="395" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q1 2026</text>
  <rect x="475" y="56.25" width="80" height="243.75" fill="#4f6172"/>
  <text x="515" y="49" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="12" font-weight="600" fill="#222">~750K</text>
  <text x="515" y="320" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#444">Q2 2026</text>
  <text x="30" y="170" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="11" fill="#666" transform="rotate(-90 30 170)">Pulls diarios (media)</text>
  <text x="320" y="350" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-size="10" font-style="italic" fill="#888">Medias trimestrales aproximadas, derivadas de las métricas de Docker Hub filtradas por el User-Agent de tc-go</text>
</svg>

La línea sube a lo largo del año. De Q3 2025 a Q4 2025 es más o menos plana. De Q4 2025 a Q1 2026 hay un salto. De Q1 2026 a Q2 2026 sigue la subida. En Q2 2026 la media diaria es aproximadamente 2,5 veces la de Q3 2025.

## tc-go dentro de la familia testcontainers

Para tener contexto, la misma ventana de 365 días agregada en todo el namespace `testcontainers`, con todas las librerías juntas (tc-elixir, tc-go, tc-java, tc-node, tc-python, tc-rust, tc-swift), suma aproximadamente 1.080 millones de pulls. La media diaria ronda los 2,95M y el día pico, los 6,5M. Por media diaria, tc-go aporta más o menos 1 de cada 6 pulls del namespace, en torno al 16%.

La librería más grande, con diferencia, es tc-java, que es más antigua y tiene la penetración más profunda en la empresa. tc-go es, con comodidad, la segunda línea más grande del gráfico de la familia. La misma tendencia al alza que se ve en tc-go sola se ve en el agregado de la familia, y el mismo indicador (los pulls de Ryuk) explica la mayor parte.

Este desglose solo es posible porque cada implementación lleva su propio User-Agent en todas las llamadas a la API de Docker: `tc-java/<version>`, `tc-dotnet/<version>`, `tc-python/<version>`, etcétera. Sin esas cabeceras, el total de la familia sería un único número sin distinciones.

## Otra mirada: las métricas de imports en GitHub

Los pulls de Docker Hub responden a "cuántas sesiones de testcontainers-go se están ejecutando", tanto en código público como privado, atribuidas a través del User-Agent. No dicen si una sesión concreta está probando Postgres, Kafka o Redis, ni cuántos proyectos distintos dependen de tc-go en primer lugar.

El proyecto publica una mirada complementaria, recogida cada mes con GitHub Code Search:

- Las [métricas de uso de la librería](https://golang.testcontainers.org/usage-metrics/) buscan `"testcontainers/testcontainers-go"` en los ficheros `go.mod` y muestran la adopción total a lo largo del tiempo, la tendencia de uso, el último uso por versión de la librería y un gráfico de GitHub Stars. Se excluyen los forks y la propia organización testcontainers.
- Las [métricas de uso por módulo](https://golang.testcontainers.org/usage-metrics/modules/) hacen lo mismo con `"testcontainers/testcontainers-go/modules"` y desglosan el resultado por módulo: imports totales a lo largo del tiempo, líneas de tendencia del top 10, los últimos imports por módulo y un gráfico comparativo de todos los módulos que ofrece la librería.

Las dos fuentes responden a preguntas distintas sobre poblaciones distintas. Docker Hub cuenta el tráfico en ejecución de todo el mundo, proyectos públicos y privados, atribuido solo por el User-Agent de la librería. Las métricas de búsqueda en GitHub cuentan imports estáticos en `go.mod` únicamente en repositorios públicos, desglosados por versión de la librería y por módulo, con una salvedad que la propia página señala: GitHub Code Search da resultados no deterministas entre consultas, así que los números se mueven un poco entre capturas aunque nada haya cambiado en los repositorios.

Juntas dan una imagen más completa. Quién depende de qué partes de la librería, según la vista de GitHub. Cuánto de esa dependencia se traduce en tráfico real de contenedores, según la vista de Docker Hub. Dos poblaciones distintas, dos señales distintas.

## Para cerrar

La lección técnica es pequeña y reutilizable. Si construyes una librería que habla con un registry, instrumenta cada llamada saliente con un User-Agent claro. El coste son unas pocas líneas en un constructor. El beneficio son años de visibilidad operativa, incluida la posibilidad de responder a "cuánto se usa realmente esta librería" con datos en lugar de intuiciones. Los pulls que ya ocurrieron sin User-Agent no se pueden atribuir con carácter retroactivo. La única decisión que te da los datos es la que tomas antes de que empiecen los pulls.

En el caso concreto de testcontainers-go, esa decisión se tomó pronto. Lo que vemos hoy es casi un año de ejecuciones de tests por todo el mundo que van a buscar `testcontainers/ryuk`, desde pipelines de CI y desde portátiles de desarrolladores, creciendo a lo largo del año y observables porque la librería se identificó al pedirla.

---

*Recursos:*
- *[testcontainers-go en GitHub](https://github.com/testcontainers/testcontainers-go)*
- *[Namespace testcontainers en Docker Hub](https://hub.docker.com/u/testcontainers)*
- *[Métricas de uso de testcontainers-go (librería)](https://golang.testcontainers.org/usage-metrics/)*
- *[Métricas de uso de testcontainers-go (módulos)](https://golang.testcontainers.org/usage-metrics/modules/)*
