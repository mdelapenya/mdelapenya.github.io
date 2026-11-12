---
title: "Suscripciones: de la idea al módulo de Testcontainers"
date: 2026-03-16 09:00:00 +0100
description: "Necesitaba suscriptores, construí un Cloudflare Worker para gestionarlos y acabé creando un módulo de Testcontainers para Resend. Esta es la historia completa: el porqué, el cómo y las pruebas."
categories: [Technology, Software Development]
tags: ["testcontainers", "testing", "go", "resend", "cloudflare-workers", "blogging"]
type: post
weight: 30
translationKey: subscriptions-from-idea-to-testcontainers-module
translatedFrom: edf8fb5
---

![Suscripciones: de la idea al módulo de Testcontainers](/images/posts/2026-03-16-subscriptions-from-idea-to-testcontainers-module/cover.png)

Pasé de publicar un post al mes a publicar cada dos días. El [post sobre la fricción](/es/posts/2026-03-07-quite-la-friccion-ahora-escribo-cada-dos-dias/) explica cómo. El problema de escribir estaba resuelto. Pero apareció otro: no tenía ni idea de si alguien me leía.

Este post cuenta la historia entera: por qué añadí suscripciones, cómo las construí sobre un sitio estático sin backend, y cómo el camino de las pruebas me llevó a crear un módulo open source de Testcontainers para Resend.

## Acto I: el porqué

### El vacío

Sin sección de comentarios. Sin analítica. Sin manera de distinguir un post que ayudó a alguien de otro que se perdió en el timeline. RSS existe, y me encanta que exista, pero para quien escribe es invisible. Publicas en el feed y el feed no te devuelve nada.

Podría haber añadido analítica. Unas líneas de JavaScript y un panel que mirar cada mañana. Pero la analítica mide visitas, no lectores. Un bot que rastrea el sitio cuenta igual que una persona que leyó cada palabra. Y viene con equipaje: banners de cookies, cumplimiento del RGPD, la tentación de optimizar para el clic en lugar de para la claridad.

No quería métricas. Quería una señal. Una señal sencilla y honesta de que a alguien le importaba lo bastante como para decir "avísame cuando escribas algo nuevo".

Esa señal es una suscripción.

### Transparencia, no trucos

Todos los formularios de newsletter que he visto en internet siguen el mismo patrón. "¡Únete a otras 10.000 personas!", como si el número de suscriptores fuera una prueba social en la que debieras confiar. Popups de intención de salida que te asaltan cuando el ratón se acerca al botón de cerrar. Píxeles de seguimiento que le cuentan al remitente si abriste el correo, cuándo lo abriste y desde qué dispositivo. Seguimiento de clics en cada enlace para saber exactamente qué te llamó la atención. Cada llamada a suscribirse parece la entrada de un embudo de ventas. Suscríbete, te nutrimos, te vendemos.

Yo quería lo contrario. Sin popups. Sin muros. Sin seguimiento. Sin venta. Solo una forma de que un lector diga "quiero saber cuándo publicas" y de que yo conteste "vale, te aviso".

Así que hice visibles todas las decisiones. El número de suscriptores es público. Ahí, en la página. Ni escondido, ni inflado, ni redondeado al millar más cercano. El número real.

El compromiso de privacidad no es un enlace en el pie de página. Es la propia [página de suscripción](/es/subscribe/). Qué recibes, qué hago con tu correo, dónde viven tus datos, cómo darte de baja, quién soy. Todo, en frases claras, antes de que escribas un solo carácter en el campo del email.

Nada de seguimiento de aperturas. Resend lo ofrece. Yo no lo uso. No sé si abriste el correo. No sé si pulsaste el enlace. Sé que lo envié y que te suscribiste. Con eso me basta.

### Por qué Resend

Elegí [Resend](https://resend.com) por tres razones. La API es limpia, la documentación es buena y se encarga de las partes difíciles del envío de correo (SPF, DKIM, gestión de rebotes) sin que yo tenga que convertirme en experto en infraestructura de email. Gestiona las bajas automáticamente: cada correo lleva su enlace para darse de baja, un clic y fuera, sin dramas. Y su fundador, [Zeno Rocha](https://zenorocha.com/), es un amigo. Yo [traduje su libro al español](https://www.goodreads.com/book/show/57215070-14-h-bitos-de-desarrolladores-altamente-productivos). Cuando le confías a alguien los correos de tus lectores, la relación personal cuenta.

## Acto II: la construcción

### El Cloudflare Worker

Hugo genera HTML estático. No hay servidor, ni base de datos, ni runtime. Cuando un lector escribe su email y pulsa Subscribe, ese formulario tiene que llamar a algo.

Los Cloudflare Workers encajan con la restricción. Se ejecutan en el edge, no cuestan nada con este nivel de tráfico y se despliegan desde el mismo workflow de GitHub Actions que despliega el blog. El Worker cuelga de un patrón de ruta en mi dominio (`mdelapenya.xyz/api/*`), así que el formulario llama al mismo origen. Desde el punto de vista del navegador, sin malabares con CORS.

El Worker expone dos endpoints. **POST `/api/subscribe`** valida el email, limita las peticiones por IP y crea un contacto en Resend. **GET `/api/subscribe/count`** devuelve el número de suscriptores activos, cacheado en KV.

El rate limiting usa Cloudflare KV. La clave es `rate:{ip}`, el valor es un contador y el TTL es de una hora. Si el contador llega a 10, el Worker devuelve un 429:

```javascript
const ip = request.headers.get("CF-Connecting-IP") || "unknown";
const rateKey = `rate:${ip}`;
const rateCount = parseInt((await env.CACHE.get(rateKey)) || "0");
if (rateCount >= 10) {
  return jsonResponse({ error: "Too many requests. Try again later." }, 429, matchedOrigin);
}
await env.CACHE.put(rateKey, String(rateCount + 1), { expirationTtl: 3600 });
```

El endpoint del contador pide todos los contactos a Resend, descarta los que se han dado de baja y cachea el resultado en KV durante una hora. Cuando se suscribe alguien nuevo, el contador cacheado se invalida para que la siguiente petición obtenga un número fresco.

Tanto el rate limiting como la caché están protegidos con `if (env.CACHE)`. Si KV no está disponible, el Worker sigue funcionando. Se salta el rate limiting. Se salta la caché. El flujo principal, validar el email y crear el contacto en Resend, se ejecuta igualmente. Degradación elegante.

### El frontend y el modo dev

El frontend es una única IIFE en JavaScript vanilla. Sin framework, sin paso de build, sin dependencias. La máquina de estados tiene cuatro estados: **form** (el de por defecto), **success** ("You're in. Welcome."), **already subscribed** (vía `localStorage`) y **error**. Cada estado es un `div` en el HTML. El JS muestra uno y oculta los demás.

Cuando ejecutas `hugo server` en local, el hostname es `localhost`. El JS lo detecta:

```javascript
var IS_LOCAL = window.location.hostname === "localhost"
  || window.location.hostname === "127.0.0.1";
var DEV_MODE = IS_LOCAL && !window.SUBSCRIBE_API_BASE;
```

En modo dev no se hace ninguna llamada fetch. El contador muestra "Join 42 other subscribers. (dev mode)". Al pulsar Subscribe, el email se escribe en la consola y se muestra el estado de éxito. Así evito suscribir correos reales por accidente, y puedes desarrollar la función de suscripción sin claves de API, sin Worker en marcha y sin conexión a internet.

La vía de escape es `window.SUBSCRIBE_API_BASE`. Si defines esta variable global antes de que cargue el script, el modo dev se desactiva y el JS llama a la URL que le indiques. Los tests la usan para apuntar al mock de Microcks.

### Probar el formulario de suscripción

La API de suscripción está definida como una spec OpenAPI. [Microcks](https://microcks.io/) lee esa spec y sirve una API mock que devuelve las respuestas de ejemplo. En los tests, Microcks corre como un contenedor arrancado por [Testcontainers](https://testcontainers.com/):

```typescript
const microcksContainer = await new MicrocksContainer()
  .withMainArtifacts([artifactPath])
  .start();

const mockBase = microcksContainer
  .getRestMockEndpoint("Blog Subscribe API", "1.0.0")
  .replace(/\/$/, "");
```

La suite de tests levanta un servidor HTTP local que sirve una página fixture con `window.SUBSCRIBE_API_BASE` apuntando a la URL del mock de Microcks. Como esa variable está definida, el modo dev queda desactivado y el JS hace llamadas HTTP reales, pero a Microcks en lugar de a Resend.

Los tests de Playwright cubren cinco escenarios: la visualización del contador, el estado por defecto del formulario, el envío de un email válido, el estado de ya suscrito mediante `localStorage` y la reactivación del botón tras el envío. Sin llamadas reales a la API. Sin necesidad de cuenta en Resend. Los mismos tests corren en local y en CI.

## Acto III: probar el broadcast

### La herramienta de broadcast

Una vez que tuve suscriptores, necesitaba una forma de avisarles de los posts nuevos. La herramienta de broadcast es un CLI en Go que se ejecuta con un cron de los domingos en GitHub Actions. Descarga el `index.json` de Hugo del sitio en producción, filtra los posts publicados en la última semana, renderiza una plantilla de email con los títulos y los enlaces, y envía el resumen con la API de broadcasts de Resend. Si esa semana no hay posts nuevos, no sale ningún correo.

El flujo es sencillo: descargar el índice, filtrar por fecha, construir el HTML, crear un borrador de broadcast en Resend y enviarlo. Cuatro llamadas a la API. Un cron. Ningún servidor que mantener.

### ¿Por qué no usar un mock y ya?

El enfoque de pruebas más evidente es escribir a mano un mock de la API de Resend. Simular los endpoints, devolver JSON enlatado, comprobar que se hicieron las llamadas correctas. Funciona hasta que deja de funcionar.

Los mocks hechos a mano se van separando de la API real. Si Resend añade un campo obligatorio al payload de creación de broadcasts, tu mock no se entera. Si cambian la forma de una respuesta, tu mock sigue devolviendo la vieja. Tus tests pasan. Producción se rompe. Te enteras el domingo por la tarde, cuando falla el cron y tus suscriptores no reciben nada.

Los tests de contrato contra la spec OpenAPI real lo detectan. El mock se genera a partir de la misma spec que Resend usa para documentar su API. Cuando Resend actualiza la spec, tu mock se actualiza con ella. La fuente de verdad es el contrato, no tus fixtures.

### Construyendo testcontainers-go-resend

Construí [testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/) como un módulo de Testcontainers para Go que envuelve Microcks con la spec OpenAPI oficial de Resend. La idea es simple: arrancar un contenedor que habla la API de Resend sin necesitar una clave de API, sin límites de peticiones y sin coste.

El módulo descarga de GitHub la última [spec OpenAPI de Resend](https://github.com/resend/resend-openapi), la enriquece con ejemplos de respuesta compatibles con Microcks y la carga en un contenedor de Microcks. Si la descarga falla, recurre a una copia embebida de la spec, de modo que los tests nunca se rompen por un problema de red.

Arrancar el mock son dos líneas:

```go
ctr, err := resend.Run(ctx, resend.DefaultImage)
```

Obtener la URL base para tu cliente HTTP es una más:

```go
baseURL, err := ctr.BaseURL(ctx)
```

Esa URL es un mock totalmente funcional de la API de Resend. Puedes crear contactos, enviar emails, gestionar broadcasts, trabajar con plantillas. Cada endpoint de la spec de Resend tiene su mock. La capa de enriquecimiento del módulo recorre todos los paths y operaciones de la spec OpenAPI e inyecta ejemplos con nombre en los parámetros y en los cuerpos de respuesta, para que Microcks pueda crear pares petición/respuesta correctos.

### Los tests de integración

La suite de tests arranca un solo contenedor de Microcks y ejecuta todos los subtests contra él. Esta es la estructura para la API de broadcasts, que es la parte que realmente usa la herramienta de broadcast:

```go
ctr, err := resend.Run(ctx, resend.DefaultImage)
testcontainers.CleanupContainer(t, ctr)
baseURL, err := ctr.BaseURL(ctx)

t.Run("create broadcast", func(t *testing.T) {
    body := `{"name":"Weekly Digest","from":"hello@mdelapenya.xyz","subject":"New posts"}`
    result := doJSONRequest(t, http.MethodPost, baseURL+"/broadcasts", body, http.StatusCreated)
    require.Contains(t, result, "id")
})

t.Run("send broadcast", func(t *testing.T) {
    result := doJSONRequest(t, http.MethodPost, baseURL+"/broadcasts/"+id+"/send", "", http.StatusOK)
    require.NotNil(t, result)
})
```

Un contenedor. Todos los subtests. Sin clave de API. Sin límites de peticiones. Sin coste. Los tests corren en CI en cada push al repositorio.

El módulo no cubre solo los broadcasts. Cubre toda la superficie de la API de Resend: emails, contactos, dominios, claves de API, plantillas, audiencias, webhooks, segmentos, topics y propiedades de contacto. Si usas cualquier parte de la API de Resend, el mock la gestiona.

### La receta

El patrón se generaliza a cualquier API que publique una spec OpenAPI. Los pasos son siempre los mismos:

1. Encuentra la spec OpenAPI. La mayoría de las APIs modernas publican una. Resend publica la suya en [github.com/resend/resend-openapi](https://github.com/resend/resend-openapi).
2. Enriquece la spec con ejemplos compatibles con Microcks si todavía no los tiene. Es la parte que más trabajo lleva. Necesitas ejemplos con nombre en los parámetros y en los cuerpos de respuesta para que Microcks pueda crear pares de mock.
3. Envuélvela en un módulo de Testcontainers. El módulo descarga (o embebe) la spec, arranca Microcks y expone un método `BaseURL` que te da el endpoint del mock.
4. Escribe tus tests de integración contra el mock. Corren en local, corren en CI, no necesitan credenciales y se mantienen sincronizados con la API real porque la spec es la fuente de verdad.

Esto sirve para Stripe, SendGrid, Twilio o cualquier otro servicio con una spec OpenAPI pública. El módulo es el puente entre la spec y tu suite de tests. Una vez que existe, probar contra esa API es tan fácil como arrancar un contenedor.

---

_Recursos:_
- _[Página del compromiso con los suscriptores](/es/subscribe/)_
- _[Resend](https://resend.com)_
- _[testcontainers-go-resend en GitHub](https://github.com/mdelapenya/testcontainers-go-resend/)_
- _[Spec OpenAPI de Resend](https://github.com/resend/resend-openapi)_
- _[Microcks](https://microcks.io/)_
- _[Testcontainers para Go](https://golang.testcontainers.org/)_
- _[Documentación de Cloudflare Workers](https://developers.cloudflare.com/workers/)_
