---
title: "Construir una app real dentro de un Docker Sandbox"
date: 2026-04-14 09:00:00 +0200
description: "Guía paso a paso para construir una app real dentro de un Docker Sandbox: desde sbx create hasta las políticas de red, el reenvío de puertos y el despliegue. Seguro y práctico."
categories: [Technology, AI, Software Development]
tags: ["docker", "coding-agents", "docker-sandboxes", "tutorial", "developer-experience"]
type: post
weight: 30
translationKey: building-a-real-app-inside-a-docker-sandbox
translatedFrom: e7bb4a4
---

![Construir una app real dentro de un Docker Sandbox](/images/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox/cover.png)

Empecé [renfe-maps](https://renfe-maps.vercel.app) en enero con el modo agente de GitHub Copilot, directamente en GitHub. Yo abría issues, Copilot abría PRs y yo los mergeaba. La primera PR montó toda la app de golpe: backend en GoFiber, frontend en React, todo conectado. La segunda añadió documentación. Una tercera intentó añadir el despliegue en GCP con Terraform, y la cerré sin hacer merge. Para arrancar un proyecto funcionaba, pero el flujo era todo o nada: el agente generaba una PR enorme, yo la revisaba en la web y la mergeaba o la cerraba. No había iteración, no veía al agente trabajar y no podía corregir el rumbo a mitad de tarea.

Tres meses después retomé el proyecto, esta vez con Claude dentro de un Docker Sandbox. Treinta y ocho commits más tarde, la app está en producción en [renfe-maps.vercel.app](https://renfe-maps.vercel.app), y el agente trabajó directamente sobre el código sin tocar nunca mi host. Te cuento paso a paso cómo lo hice.

## Qué vas a construir

[renfe-maps](https://renfe-maps.vercel.app) es un visor de trenes en tiempo real para el ferrocarril español. Muestra la posición de los trenes en Google Maps a partir de los datos GTFS Real-Time de Renfe, con indicadores de retraso, marcadores de estaciones y streaming por SSE. El stack final es Next.js, TypeScript y la API de Google Maps. De momento el repo es privado.

Pero este post no va de cómo construir un visor de trenes. Va de cómo construir *cualquier* app dentro de un Docker Sandbox. renfe-maps es solo el vehículo. Lo importante es el flujo de trabajo.

## Por qué un sandbox

**Seguridad.** En mi host no quiero que el agente haga lo que le dé la gana. En un sandbox quiero que haga lo que necesita. Ese es todo el modelo mental. El sandbox es una microVM con su propio daemon de Docker, su propio sistema de ficheros y su propia red. El agente puede instalar paquetes, levantar servidores, hacer `rm -rf node_modules` y empezar de cero. Dentro del sandbox eso no es una imprudencia. Es el agente haciendo su trabajo. Mi host ni se entera.

**Practicidad.** Tienes un entorno de desarrollo reproducible que sobrevive a los reinicios, con gobierno de red y reenvío de puertos incluidos. Sin Dockerfile. Sin configuración de devcontainer. Solo `sbx create` y ya estás trabajando. Ya escribí sobre el [modelo conceptual de los sandboxes y los flujos paralelos](/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows). Este post es su complemento práctico.

## Paso 1: instala y haz login

```bash
brew install docker/tap/sbx
sbx login
```

La primera vez que ejecutas `sbx login`, te pide que elijas una política de red por defecto. Elige **Balanced**. Permite los servicios habituales de desarrollo (GitHub, el registry de npm, Docker Hub) y bloquea todo lo demás. Luego puedes ajustarla con más detalle.

Si quieres un recorrido completo por todo lo que puede hacer `sbx`, el repo [sbx-quickstart](https://github.com/dockersamples/sbx-quickstart) es una gran referencia. Repasa cada funcionalidad con una app de ejemplo que tiene bugs a propósito para que el agente los arregle.

## Paso 2: crea el sandbox

Desde la raíz de tu proyecto:

```bash
sbx create --name renfe-maps claude .
```

Esto levanta una microVM, monta el directorio de tu proyecto dentro de ella (bind mount) y configura Claude como agente. Los ficheros se comparten entre el host y el sandbox: los cambios que el agente hace dentro aparecen en el sistema de ficheros de tu host en tiempo real.

Para conectarte y ponerte a trabajar:

```bash
sbx run renfe-maps
```

Ya estás dentro del sandbox. Claude tiene control total del entorno, pero nada de lo que haga puede llegar a tu host más allá del workspace montado.

## Paso 3: dale primero un rol al agente

Antes de escribir una sola línea de código en el sandbox, escribí una skill. En concreto, una skill de product owner con criterios de aceptación, el modelo de datos de GTFS-RT y el backlog de funcionalidades.

¿Por qué primero? Porque [las skills son roles, no comandos](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/). Una skill que dice "eres el product owner de renfe-maps, esto es lo que la app debe hacer y por qué" fuerza una mentalidad de producto desde el principio. El agente no se limita a escribir código. Entiende qué debe hacer la app, cuáles son los criterios de aceptación y qué priorizar. Ese encuadre marcó cada tarea posterior.

## Paso 3,5: la skill evoluciona

La skill no se quedó estática. Evolucionó con cada iteración. Mientras construía funcionalidades, la skill de product owner fue acumulando aprendizajes: qué APIs existían, qué campos devolvían, cuáles eran los criterios de aceptación de cada endpoint. Al final incluía una tabla comparativa de alcance, un backlog priorizado y un documento de oportunidades que seguía las carencias frente a la app oficial de Renfe.

Ese fichero de oportunidades es donde la cosa se puso interesante. En marzo de 2026, Renfe lanzó `tiempo-real.largorecorrido.renfe.com`, un visor oficial en tiempo real para los trenes de larga distancia. Descubrí que exponía endpoints JSON sin documentar, con las posiciones de la flota y la geometría completa de las rutas. Pero tenía limitaciones frente a lo que yo tenía en mente: solo cubre servicios AV, LD y MD (nada de Cercanías), no tiene API abierta, ni alertas, ni fichas con las especificaciones de los trenes, y consulta los datos cada 15 segundos en lugar de hacer streaming. La skill llevaba el registro de todo esto, así que el agente siempre sabía en qué iba por delante renfe-maps de la app oficial y qué huecos le quedaban por cerrar.

## Paso 4: abre la red

Este es el momento clave del sandbox.

¿Te acuerdas del endpoint `tiempo-real.largorecorrido.renfe.com` del paso anterior? Cuando el agente intentó consultarlo desde dentro del sandbox, pasó esto:

> Bloqueado por el firewall del sandbox. Probemos con curl:
>
> `curl -s -o /dev/null -w "%{http_code}" "https://tiempo-real.largorecorrido.renfe.com/flotaLD.json?v=$(date +%s)"` → **403**
>
> El sandbox bloquea ese dominio. Tendrías que permitirlo:
> `sbx policy allow network tiempo-real.largorecorrido.renfe.com`

El agente lo diagnosticó, me dijo exactamente qué ejecutar y esperó. Eso es la política de red Balanced haciendo su trabajo: los dominios desconocidos se bloquean por defecto. El agente no puede llegar a URLs arbitrarias, y los subdominios de Renfe no están en la lista de permitidos por defecto.

Los fui añadiendo uno a uno:

```bash
sbx policy allow network gtfsrt.renfe.com
sbx policy allow network data.renfe.com
sbx policy allow network ssl.renfe.com
sbx policy allow network tiempo-real.largorecorrido.renfe.com
```

Compruébalo con:

```bash
sbx policy ls
```

Este es el modelo de seguridad en acción. El agente puede consultar datos de trenes. No puede llegar a nada más. Tú decides qué se permite, dominio a dominio. Si el agente intenta acceder a un dominio que no está en la lista, la petición falla. Lo ves en el log de políticas, lo añades si es legítimo y sigues adelante.

## Paso 5: reenvía el puerto

Le pedí al agente que arrancara el servidor de desarrollo. Lo hizo, y luego me dijo qué hacer a continuación:

> `npm run dev` → El servidor de desarrollo está funcionando en http://localhost:3000 (200 OK). Para acceder desde tu navegador, tendrás que publicar el puerto desde el sandbox. Ejecuta esto en otra terminal:
>
> `sbx ports <sandbox-name> --publish 3000:3000/tcp`
>
> Después abre http://localhost:3000 en tu navegador.

Mismo patrón que con la política de red: el agente se topó con un límite, lo diagnosticó y me dio el comando exacto. Yo publiqué en el puerto 3001 para evitar conflictos con otros servicios de mi host:

```bash
sbx ports renfe-maps --publish 3001:3000
```

Una cosa que conviene saber: los servicios dentro del sandbox tienen que escuchar en `0.0.0.0`, no en `127.0.0.1`. Si la app solo escucha en localhost, el reenvío de puertos no funcionará. La mayoría de los frameworks usan `0.0.0.0` por defecto en modo desarrollo, pero merece la pena comprobarlo si ves una página en blanco.

Ahora abre `http://localhost:3001` en tu navegador. Estás viendo la app corriendo dentro del sandbox, renderizada en tu host. Cada vez que el agente hace un cambio y el servidor de desarrollo recarga, lo ves aquí. No hace falta entrar en el sandbox para saber qué está pasando.

## Paso 6: itera

Así es un ciclo típico.

Le doy una tarea al agente: "añade indicadores de retraso a los marcadores de tren, con un color según la gravedad". El agente trabaja en la terminal a la que estoy conectado. Yo lo veo instalar dependencias, modificar componentes y reiniciar el servidor de desarrollo. Miro localhost:3001. Los marcadores tienen color. Los rojos son los trenes con retraso. Bien. Paso a la siguiente tarea.

Si algo no me cuadra, lo redirijo al momento. "El umbral de retraso está mal, todo lo que sea menos de 2 minutos debe ir en verde, no en amarillo". El agente lo ajusta. Refresco. Arreglado.

Para funcionalidades más grandes, `sbx` admite el modo rama:

```bash
sbx run renfe-maps --branch feature-delays
```

Esto crea un git worktree aislado dentro del sandbox. El agente trabaja en su propia rama sin afectar a main. Es útil cuando quieres ejecutar varias sesiones de sandbox en paralelo con funcionalidades distintas.

## Paso 7: publica

El directorio del workspace está montado con bind mount. Cada cambio que el agente hace dentro del sandbox ya está en el sistema de ficheros de mi host. No hago push desde dentro del sandbox. Lo hago desde mi máquina.

¿Por qué? Porque [el conductor soy yo](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot). Superviso el trabajo, reviso el diff y decido cuándo hacer commit y push. El agente propone. Yo dispongo.

```bash
git add -A
git commit -m "feat(trains): add delay indicators with color coding"
git push
```

La CI corre en GitHub Actions. Vercel detecta el push y despliega. Con eso, el trabajo del sandbox para esta tarea está hecho.

Cuando termino por hoy:

```bash
sbx stop renfe-maps
```

A la mañana siguiente, `sbx run renfe-maps` retoma justo donde lo dejé. Los paquetes instalados, la configuración, las políticas de red, los puertos publicados: todo sobrevive a la parada. El sandbox es mi entorno de desarrollo persistente. Solo lo pauso y lo reanudo.

Si quiero seguir en la misma conversación de Claude (conservando todo el contexto de ayer), le paso `-c` a Claude usando un doble guion:

```bash
sbx run renfe-maps -- -c
```

Todo lo que va detrás de `--` se reenvía como argumentos a la instancia de Claude. `-c` retoma la última conversación, así que el agente recuerda en qué estábamos.

## Enero frente a abril

En enero, el flujo era este: abrir la UI de Agents en GitHub, crear un prompt, dejar que el agente de Copilot generara una PR, revisar el diff en la web y mergear o cerrar. La primera PR añadió la app entera de golpe. No había manera de decir "espera, ese endpoint debería devolver GeoJSON, no coordenadas en bruto" mientras el agente trabajaba. Cuando veía el código, ya era una PR terminada. Mis únicas opciones eran mergear o cerrar.

En abril, el flujo era este: conectarme al sandbox, darle una tarea al agente, verlo trabajar y pulsar Escape en cuanto se iba por mal camino. No me da miedo cancelar al agente a media ejecución para reconducirlo. De eso se trata al estar en la misma terminal: veo lo que hace y, si el enfoque es erróneo, lo paro, le doy mejor contexto y le dejo intentarlo otra vez. Compruebo el resultado en localhost:3001, redirijo si hace falta y repito. Treinta y ocho commits, cada uno acotado a una funcionalidad o un arreglo concreto. Mensajes de commit convencionales. Y una skill de product owner que mantenía al agente centrado en lo que importaba.

La diferencia no está solo en la herramienta. Está en el ciclo de feedback. El sandbox hizo seguro dejar que el agente trabajara de forma autónoma (aislamiento con microVM, gobierno de red, ningún acceso al host). La skill lo hizo eficaz (contexto de producto, criterios de aceptación, prioridades claras). El reenvío de puertos lo hizo verificable (feedback visual en tiempo real sin entrar en el sandbox).

Arrancar con Copilot en GitHub fue rápido. Iterar con Claude en un sandbox fue preciso.

## Qué haría distinto

**Configurar las políticas de red antes del primer `sbx run`.** Me topé con peticiones bloqueadas en mi primer intento de descargar datos de Renfe y perdí tiempo depurando lo que resultó ser un `sbx policy allow` que faltaba. Ahora añado todos los dominios necesarios antes incluso de conectarme al sandbox.

**Usar el modo rama desde el principio.** Hice commit directamente a main en las primeras funcionalidades. El modo rama me habría dado un historial más limpio y la posibilidad de tirar experimentos sin tener que revertir commits.

El flujo con el sandbox me cuajó más rápido de lo que esperaba. La curva de aprendizaje está sobre todo en las políticas de red: averiguar qué dominios necesita de verdad tu app. Una vez resuelto eso, lo demás es construir.

*Transparencia total: formo parte del equipo que construye Docker Sandboxes en [Docker](https://www.docker.com/). No escribí este post porque alguien me lo pidiera. Lo escribí porque necesitaba un visor de trenes y el sandbox era la mejor forma de construirlo. Si no pudiéramos usar nuestro propio producto en un proyecto de fin de semana, tendríamos un problema.*

---

_Recursos:_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
- _[Repositorio del tutorial sbx-quickstart](https://github.com/dockersamples/sbx-quickstart)_
