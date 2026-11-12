---
title: "Una IA personal que lee mis facturas"
date: 2026-04-27 09:00:00 +0200
description: "Construí un asistente personal de IA en mi NAS Synology que lee mis facturas de la luz, los tickets del súper, los extractos del banco y los recibos del aparcamiento. Funciona por Telegram, responde en lenguaje natural y se cayó en la semana 8 porque olvidé vigilar el disco."
categories: [AI, Self-Hosting, Automation]
tags: ["nanoclaw", "synology", "telegram", "home-assistant", "gmail", "personal-finance", "docker"]
type: post
weight: 30
translationKey: a-personal-ai-that-reads-my-bills
translatedFrom: ae2ab73
---

![Una IA personal que lee mis facturas](/images/posts/2026-04-27-a-personal-ai-that-reads-my-bills/cover.png)

En el despacho de mi casa hay un NAS Synology que ya ejecuta Plex, guarda las copias de seguridad de mis fotos y aloja un puñado de contenedores Docker. Añadirle un "asistente personal de IA" no costaba nada. La pregunta de verdad era para qué lo iba a usar. La respuesta fueron mis facturas. Los tickets de Mercadona, las facturas de luz de Iberdrola, los extractos de BBVA, los pedidos de Amazon. Todo llegaba por email con un PDF, y todo acababa directo en la papelera. Nada se podía consultar. Yo quería preguntar "cuánto gasté en comida el invierno pasado" y recibir la respuesta en el móvil. Cuatro semanas después, el sistema funciona, responde y ya se ha caído una vez. Esta es la historia.

## Por qué existe

Varias piezas de mi día a día estaban en forma no estructurada, inservibles para cualquier automatización. Los tickets de Mercadona llegaban en PDF y se iban directos a la papelera de Gmail. Las facturas de luz de Iberdrola, lo mismo. Los extractos mensuales de BBVA llegaban como PDFs con contraseña que abría quizá dos veces al año. El historial de pedidos de Amazon existía, pero solo a través de la interfaz de su web.

Ninguno de estos datos estaba oculto. Simplemente estaban sin estructurar y sin relacionar. No había una forma fácil de preguntar "cuánto gasté en comida el invierno pasado comparado con este invierno", ni "cuál fue mi ratio de autoconsumo eléctrico en 2024", ni "a qué comercio le pago más con la tarjeta del banco". La información existía repartida entre ocho buzones, proveedores y formatos de PDF distintos. Lo único que faltaba era un sistema que supiera dónde vive cada pieza, la importara con una cadencia fija, la guardara en un formato consultable y me dejara hacer preguntas en lenguaje natural desde el móvil.

[NanoClaw](https://github.com/qwibitai/nanoclaw) más Claude es ese sistema. NanoClaw es un orquestador de IA de código abierto (un proceso de Node.js, unas pocas miles de líneas de TypeScript) que gestiona conversaciones en varios canales, lanza un contenedor de agente por cada topic y ejecuta tareas programadas. El Synology era el anfitrión. El trabajo consistió en conectarlo todo.

Una coincidencia curiosa: la misma semana en la que publico esto, Vivian Balakrishnan, ministro de Asuntos Exteriores de Singapur, publicó [su propia instalación de NanoClaw](https://gist.github.com/VivianBalakrishnan/a7d4eec3833baee4971a0ee54b08f322) sobre una Raspberry Pi, centrada en grafos de conocimiento y contexto diplomático. El mismo proyecto de código abierto, un caso de uso muy distinto. Él construye una memoria acumulativa para el arte de gobernar. Yo parseo tickets del súper.

Hay una segunda motivación que conviene reconocer: mantener todos los datos en local. Los tokens OAuth de Gmail se quedan en el contenedor del agente. Las bases de datos SQLite nunca salen del NAS. Tengo una instancia de Home Assistant en casa, y consulta la API de métricas por una dirección de la red local privada. La API de Anthropic es la única salida de red, y solo ve lo que contienen los prompts. Nunca las facturas en bruto.

## La arquitectura: una VM, no un atajo

La pila completa, de arriba abajo:

```
┌──────────────────────────────────────────────────────────────────────┐
│  HARDWARE   Synology DS923+ NAS                                      │
└──────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────┐
│  HOST OS    Synology DSM 7.x  (bare metal)                           │
│                                                                      │
│   ┌──────────────────────────┐   ┌─────────────────────────────┐    │
│   │ Container Manager        │   │ Virtual Machine Manager     │    │
│   │ (DSM Docker)             │   │                             │    │
│   │  • Home Assistant ───────┼───┼──→ <NAS-IP>:8765            │    │
│   │  • Plex                  │   │                             │    │
│   │  • Photos / Time Machine │   │    ┌─────────────────────┐  │    │
│   │  • (other workloads)     │   │    │ Ubuntu Server 24.04 │  │    │
│   │                          │   │    │ 4 GB · 2 vCPU · 57G │  │    │
│   └──────────────────────────┘   │    └─────────────────────┘  │    │
│                                  └─────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────┐
│  GUEST VM   Ubuntu 24.04 LTS  (the only place NanoClaw runs)         │
│                                                                      │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │ User: nanoclaw  (in docker group, no sudo)                    │  │
│   │                                                               │  │
│   │  ── Interactive layer ─────────────────────────────────────   │  │
│   │     Claude Code session  ("the foreman")                      │  │
│   │      • SSH'd in, full host shell as nanoclaw                  │  │
│   │      • source edits, recovery, audits                         │  │
│   │                                                               │  │
│   │  ── NanoClaw orchestrator ─────────────────────────────────   │  │
│   │     node dist/index.js  (PID-tracked by start-nanoclaw.sh)    │  │
│   │      • Telegram long-poll                                     │  │
│   │      • IPC watcher polls data/ipc/<group>/messages/*.json     │  │
│   │      • Task scheduler reads store/messages.db                 │  │
│   │      • Spawns agent containers on demand ─────────┐           │  │
│   │                                                   │           │  │
│   │  ── Docker engine (inside the VM) ────────────────┼────────   │  │
│   │                                                   ▼           │  │
│   │     Long-lived service containers:                            │  │
│   │     ┌────────────────────┐  ┌──────────────────────────┐     │  │
│   │     │ onecli-app-1       │  │ andy-metrics-api :8765    │     │  │
│   │     │ credential gateway │  │ Python HTTP, no deps      │     │  │
│   │     │  → onecli-postgres │  │ ro mounts: 7 *.db  ◄─ HA │     │  │
│   │     └────────────────────┘  └──────────────────────────┘     │  │
│   │                                                               │  │
│   │     Ephemeral per-topic agent containers:                     │  │
│   │     ┌──────────────────────────────────────────────────────┐ │  │
│   │     │  nanoclaw-telegram-main          ← DM (is_main=1)    │ │  │
│   │     │  nanoclaw-telegram-pa-*          ← forum topics       │ │  │
│   │     └──────────────────────────────────────────────────────┘ │  │
│   │     Each agent container mounts:                              │  │
│   │       /workspace/group              (rw, this group's folder) │  │
│   │       /workspace/extra/main-shared  (ro, non-main only)       │  │
│   │       /workspace/ipc                (rw, dropbox to orch)     │  │
│   │       /workspace/project            (ro, main channel only)   │  │
│   │       OneCLI-injected creds at spawn time                     │  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                                     │
┌──────────────────────────────────────────────────────────────────────┐
│  EXTERNAL   (the only network egress)                                │
│    • Telegram Bot API      — orchestrator long-polls; sends replies   │
│    • Anthropic API         — agent containers send prompts           │
│    • Gmail / Calendar API  — scheduled imports from agent containers │
└──────────────────────────────────────────────────────────────────────┘
```

El Synology ya ejecuta Docker con su Container Manager integrado, y el atajo evidente habría sido instalar NanoClaw directamente ahí. Lo consideré unos diez minutos y lo descarté.

NanoClaw lanza un contenedor Docker por cada conversación activa. Cada topic de Telegram que recibe un mensaje obtiene un contenedor nuevo, arrancado por el orquestador con sus propios mounts e inyecciones de credenciales. Para eso, el orquestador necesita acceso de lectura y escritura a un socket de Docker. En el Container Manager de Synology, eso significa montar `/var/run/docker.sock` del host DSM dentro del contenedor de NanoClaw. Cualquiera que haya trabajado con Docker más de una semana sabe lo que implica: desde dentro del contenedor de NanoClaw se tiene exactamente la misma autoridad sobre el host que con Docker mismo. Un prompt inyectado que convenza al agente de ejecutar `docker run --privileged`, un exploit en una de las dependencias npm de NanoClaw, un bug en el parser de mensajes de Telegram: cualquiera de ellos tendría acceso sin restricciones a Plex, a la biblioteca de fotos de la familia, a los destinos de Time Machine y a todo lo demás que corre en el NAS. El blast radius sería el NAS entero.

Dentro de Virtual Machine Manager creé una única VM con Ubuntu Server 24.04 LTS: 4 GB de RAM, 2 vCPU y 30 GB de disco para empezar. Ubuntu en lugar de Debian o Alpine porque sus repositorios apt traen Node 20 y un Docker Engine reciente sin tener que buscar backports, y porque el soporte LTS garantiza cinco años de actualizaciones de seguridad. La VM tiene su propia MAC, su propia concesión DHCP y su propia tabla de rutas. Si la flota de contenedores del asistente empieza a portarse mal (memoria descontrolada, una fork bomb, un parser de PDF que entra en bucle con una entrada malformada), la presión sobre el kernel se queda dentro de la VM, y en el peor caso la reinicio desde la web de VMM sin tocar nada más. Y los snapshots salen gratis: VMM puede tomar un snapshot con el disco congelado de la VM en ejecución, que acaba siendo la estrategia práctica de backup.

Dentro de la VM, otra decisión que no cuesta nada y rinde mucho: NanoClaw nunca se ejecuta como root.

```bash
sudo adduser nanoclaw
sudo usermod -aG docker nanoclaw
su - nanoclaw
```

El usuario `nanoclaw` es el dueño de todo lo que toca el asistente. Puede hablar con el daemon de Docker (a través del grupo `docker`) sin sudo. El script de bootstrap confirma la decisión al arrancar: `Root: false` en los logs es NanoClaw reconociendo que corre sin privilegios y tan contento. Ejecutarlo como root habría funcionado, pero la configuración sin root tiene cuatro ventajas que se pagan solas:

- **Mínimo privilegio**: un proceso que corre como `nanoclaw` queda limitado a su propio directorio personal, no a toda la VM.
- **Higiene en la propiedad de los ficheros**: todo lo que escribe el asistente pertenece a `nanoclaw:nanoclaw`, así que mi usuario SSH habitual puede inspeccionarlo sin sudo, pero no modificarlo por accidente.
- **Desinstalación limpia**: `sudo userdel -r nanoclaw` lo borra todo con un solo comando.
- **Contabilidad de procesos**: `ps -u nanoclaw` enumera al instante todos los procesos del asistente, lo que hizo trivial la limpieza tras el incidente (sabía exactamente cuáles eran del asistente y cuáles del sistema operativo).

Dos capas de contención: la VM mantiene a NanoClaw lejos del NAS, y el usuario sin privilegios mantiene los errores de NanoClaw acotados a sí mismo. Las dos son prácticamente gratis en el funcionamiento diario.

## Primer arranque: 21 minutos hasta un bot funcionando

Entré por SSH a la VM como el usuario `nanoclaw`. Directorio personal vacío. Lo primero era llevar el código a la máquina:

```bash
mkdir -p ~/apps && cd ~/apps
git clone https://github.com/qwibitai/nanoclaw.git
cd nanoclaw
```

Ese clone terminó a las 12:36 UTC. Cuatro minutos después, se ejecutó el script de bootstrap. El log completo es lo bastante corto como para citarlo:

```
[2026-03-26 12:40:44] [bootstrap] === Bootstrap started ===
[2026-03-26 12:40:44] [bootstrap] Platform: linux, WSL: false, Root: false
[2026-03-26 12:40:44] [bootstrap] Node 20.20.2 at /usr/bin/node
[2026-03-26 12:40:44] [bootstrap] Running npm ci
[2026-03-26 12:40:49] [bootstrap] npm install succeeded
[2026-03-26 12:40:49] [bootstrap] Verifying native modules
[2026-03-26 12:40:49] [bootstrap] better-sqlite3 loads OK
[2026-03-26 12:40:49] [bootstrap] Build tools: false
[2026-03-26 12:40:49] [bootstrap] === Bootstrap completed: success ===
```

Cinco segundos. El bootstrap es paranoico justo donde debe: comprueba que no lo ejecutas como root, confirma la versión mayor de Node, ejecuta `npm ci` (no `npm install`) para respetar el lockfile al pie de la letra, y verifica que `better-sqlite3` (el único módulo nativo del que depende NanoClaw) carga sin necesidad de recompilar. "Build tools: false" significa que no hicieron falta `gcc`, `make` ni `python3-dev`. El binario precompilado de Node 20 para Linux con glibc funcionó a la primera. En una VM recién instalada con Ubuntu 24.04, esa es la diferencia entre un bootstrap de cinco segundos y una recompilación de quince minutos.

Después del bootstrap, tomó el relevo el asistente de configuración. Me guió por la selección de canal, elegí Telegram y ejecutó la skill `/add-telegram`. Yo ya había creado un bot con `@BotFather` y pegué el token cuando me lo pidió. A las 12:52 el TypeScript estaba compilado. A las 12:53 el `.env` ya estaba escrito con tres claves: `ONECLI_URL`, `TZ` y `TELEGRAM_BOT_TOKEN`. La clave de la API de Anthropic vive en el vault de OneCLI, se inyecta en los contenedores de los agentes en el momento de la petición y nunca está en disco en texto plano.

A las 12:57 UTC el bot estaba vivo. Veintiún minutos desde el `git clone` hasta un asistente de IA respondiendo en Telegram.

Esa cifra es honesta, pero no cuenta toda la historia. Aquello era NanoClaw 1.2.34 sin tocar, con un único canal de mensajes directos. Añadir la integración con Gmail y los topics de foro llevó otras 43 horas de trabajo, casi siempre a ráfagas: el 28 de marzo añadí como remotes los repositorios de las skills de Gmail y Telegram, ejecuté `npm install` para absorber sus dependencias e hice commit del parche de los topics de foro. "21 minutos hasta bot vivo" es el tiempo hasta el primer mensaje. El sistema que describo en este post costó semanas de iteración a partir de ahí.

## Hablar con NanoClaw: Telegram como interfaz

Necesitaba una forma de hablar con el asistente desde el móvil. WhatsApp era el canal por defecto de NanoClaw, pero las librerías no oficiales de la API web viven en un eterno juego del gato y el ratón con el equipo antiautomatización de WhatsApp (cuentas limitadas, baneadas u obligadas a reautenticarse una y otra vez), y WhatsApp no tiene un concepto nativo de topics. El email perdió por latencia: redactar, enviar y esperar al poll de IMAP no se parece en nada a una experiencia de chat.

Telegram ganó por descarte, y luego siguió ganando. La Bot API es oficial, está bien documentada, tiene límites de uso generosos y es gratis. Los grupos de foro admiten hilos de topics arbitrarios. Los clientes móviles manejan de forma nativa los mensajes largos, los bloques de código y los archivos adjuntos.

El NanoClaw original no soportaba los topics de foro de Telegram. Encontré [una issue abierta](https://github.com/qwibitai/nanoclaw-telegram/issues/115) en el repositorio del canal de Telegram, comenté con una mejora de UX para el comando `/chatid`, y el autor la atendió. El arreglo extendió la codificación del JID de `tg:<chatId>` a `tg:<chatId>:<threadId>`, pasando el ID del topic por la llamada de salida a `sendMessage` para que las respuestas lleguen al topic correcto.

La comunicación tiene dos capas. Un canal de mensajes directos con el bot es el **canal de admin**: comandos con privilegios, notificaciones del sistema y el lugar donde moldeé todo lo demás. Formé la estructura entera de topics dialogando con el bot en este canal de admin: pidiéndole que registrara topics, configurara mounts y montara tareas programadas. El bot es el constructor de su propia casa.

El grupo de foro, "Personal Assistance", tiene seis topics, cada uno un dominio distinto:

| Topic | Propósito | Tareas programadas |
|---|---|---|
| General | Preguntas de todo tipo | Ninguna |
| Emails | Briefings diarios | Agenda del calendario (06:00), 2 resúmenes de email (21:00) |
| Economics | Preguntas de dinero | Resumen de ORA (21:15), resumen de Mercadona (21:30) |
| Health | Contexto médico | Ninguna (reservado) |
| Coding | Preguntas de software | Ninguna |
| SystemLog | Log de operaciones unidireccional | Recibe notificaciones de importación (protegido con trigger) |

El topic Economics es el único con un CLAUDE.md totalmente personalizado. Conoce los endpoints de la API, los esquemas de las bases de datos y las reglas de formato de Telegram. Todos los demás topics comparten un único `shared/CLAUDE.md`, montado en solo lectura en cada contenedor. Un fichero, un sitio donde actualizar, y cada topic lo ve en el siguiente arranque de su contenedor. Sin duplicación y sin desviaciones.

## El ciclo de vida de un mensaje

Esto es lo que pasa cuando escribo "¿cuánto he gastado en parking esta semana?" en el topic Economics:

```
User types in Economics topic
        │
        ▼  [1] Telegram Bot API delivers via long-poll
┌── NanoClaw orchestrator ───────────────────────────────────┐
│  [2] Derive JID: tg:-<group-id>:<economics-thread-id>      │
│  [3] Persist message to store/messages.db                   │
│  [4] Look up registered_groups: folder = pa-economics       │
│  [5] Live container within idle timeout?                    │
│        yes → reuse (warm: ~5-10s)                           │
│        no  → spawn fresh container (cold: ~30-60s)          │
└─────────────────────────┬──────────────────────────────────┘
                          ▼
        docker run nanoclaw-agent:latest
          -v groups/telegram_pa-economics:/workspace/group:rw
          -v groups/telegram_main/shared:/workspace/extra/main-shared:ro
          -v data/ipc/telegram_pa-economics:/workspace/ipc:rw
          --env-file <OneCLI-injected ANTHROPIC_API_KEY>
                          │
                          ▼
┌── Agent container ─────────────────────────────────────────┐
│  [6] System prompt assembled from:                          │
│        /workspace/group/CLAUDE.md (Economics personality)    │
│        /workspace/extra/main-shared/CLAUDE.md (DB, API URL) │
│                                                             │
│  [7] Agent calls metrics API:                               │
│        GET <NAS-IP>:8765/ora/tickets?from=2026-04-21        │
│                                                             │
│  [8] Formats reply in Telegram markdown                     │
│                                                             │
│  [9] Writes JSON to /workspace/ipc/messages/<ts>.json       │
│        { "chatJid": "tg:-<group-id>:<thread-id>",          │
│          "text": "*Esta semana en ORA* ..." }               │
└─────────────────────────┬──────────────────────────────────┘
                          │
                          ▼  [10] Orchestrator IPC watcher (polls every 1s)
┌── NanoClaw orchestrator ───────────────────────────────────┐
│  [11] Authorization: source folder matches target JID       │
│  [12] sendMessage to Telegram with thread_id preserved      │
│  [13] Delete consumed JSON file                             │
└────────────────────────────────────────────────────────────┘
                          │
                          ▼
        User sees reply in Economics topic (~30-60s)
```

El mismo pipeline gestiona las tareas programadas sin cambiar nada: el scheduler sintetiza un "mensaje de usuario" a partir del prompt guardado, y el ciclo de vida desde el paso 5 es idéntico. Así se ejecutan las importaciones diarias de Mercadona y ORA, y así llegan los resúmenes de email a sus topics.

## ¿Por qué parsear emails?

Los datos que quería consultar no viven en ninguna API. Mercadona no tiene un endpoint de historial de pedidos. Iberdrola no tiene una API de facturación. BBVA no ofrece acceso programático a tus propios extractos. La única forma persistente de todos estos datos es el email de tu bandeja de entrada, normalmente con un PDF adjunto.

Así que el sistema parsea emails. Cada parser sigue el mismo bucle: consulta Gmail con un filtro específico del proveedor, deduplica contra el ID de email que ya está en la base de datos local, descarga los mensajes nuevos, ejecuta un parser específico del proveedor, inserta en SQLite y archiva el email.

No escribí estos parsers a mano. Dirigí al agente desde Telegram, por el canal de admin, diciéndole a NanoClaw lo que necesitaba: "importa todos los tickets de Mercadona de Gmail, guarda la fecha del pedido, el total y las líneas en SQLite". El agente eligió Python, eligió el formato, escribió el parser, y yo pedí cobertura completa de tests para todo lo que escribió. Todo evolucionó a la vez conversando con el bot: bases de datos, endpoints de la API, sensores de Home Assistant, todo iterando en paralelo y remodelándose mutuamente a medida que el sistema crecía.

Dos cuentas de Gmail alimentan el pipeline: una personal para los asuntos oficiales (suministros, banco, papeleo doméstico) y otra que uso para registrarme en webs (Amazon, supermercado a domicilio). Probablemente debería unificarlas. No lo he hecho.

| Fuente | Filas | Desde | Hasta | Lo difícil |
|---|---|---|---|---|
| Mercadona | 82 tickets, ~1.250 artículos | sep 2023 | abr 2026 | Parser de PDF a medida (UTF-16BE, desplazamiento de fuente +0x1D) |
| Amazon | 402 pedidos, 526 artículos, 35 devoluciones | dic 2013 | mar 2026 | 3 formatos de email, la trampa del 38% de pedidos vacíos |
| Iberdrola | 72 facturas | jun 2021 | mar 2026 | Autoconsumo solar en 4 pasadas de regex |
| BBVA | 146 extractos, 2.806 movimientos de tarjeta | jul 2013 | feb 2026 | PDFs con contraseña, 2 parsers, inferir el año en fechas DD/MM |
| Tagus (agua) | 12 recibos | abr 2025 | mar 2026 | Sin complicaciones |
| Movistar | 18 facturas | ago 2023 | jun 2024 | Cambio de proveedor a mitad de camino |
| O2 | 21 facturas | jun 2024 | mar 2026 | Columna discriminadora compartida con Movistar |

De la tabla salen dos historias que merece la pena contar.

**Mercadona: el PDF que no quiere que lo lean.** El primer intento fue ingenuo: descargar el PDF, pasar `pdftotext` y aplicar regex a la salida. Basura. Los PDFs de Mercadona son tablas dibujadas con fragmentos de texto de posición absoluta. `pdftotext` los aplana de izquierda a derecha y de arriba abajo, ignorando los límites de las columnas. Los nombres de producto se cortan, los precios unitarios migran a la fila siguiente, los totales se mezclan con el pie de página. El agente escribió un parser de PDF a medida en Python puro. Lee los bytes en bruto, descomprime con `zlib` cada bloque `stream`/`endstream`, recorre los operadores de posicionamiento de texto del PDF (`Tm`, `Td`, `Tj`), captura cada fragmento de texto con sus coordenadas `(x, y)` y luego los decodifica teniendo en cuenta una rareza de Mercadona: usa codificación UTF-16BE con un desplazamiento de fuente de `+0x1D` (lo descubrió el agente de forma empírica, mirando volcados hexadecimales). Es el código más exótico de todo el repositorio, y no escribí ni una línea.

**BBVA: el extracto con contraseña.** BBVA envía PDFs con contraseña. La contraseña es tu DNI en minúsculas. El PDF contiene dos secciones de movimientos completamente distintas, con maquetaciones diferentes: los movimientos de tarjeta (comercio, ciudad, país, importe) y los movimientos de cuenta (transferencias, domiciliaciones, nómina, comisiones). Dos parsers independientes, basados en máquinas de estados, se ocupan de cada sección. El parser de tarjeta mantiene un filtro de ruido para las cabeceras que `pdftotext` intercala en los saltos de página. El parser de movimientos de cuenta tiene que inferir el año a partir de fechas `DD/MM` que nunca lo incluyen, usando un `year_hint` extraído de la cabecera del extracto. Los datos abarcan doce años. Es la única forma de consultar por programa el historial de una cuenta bancaria personal española sin pagar a un agregador de terceros (lo que supondría entregarle tus credenciales del banco).

**ORA: la victoria fácil que llegó al final.** Cuando todos los demás parsers ya funcionaban, me di cuenta de que había otra fuente de datos escondida en mi bandeja de entrada: los tickets del aparcamiento regulado. El sistema de aparcamiento de pago de Toledo permite pagar con la app Telpark, y yo elegí PayPal como método de pago. PayPal envía un recibo por email de cada pago, y ese recibo es el único registro persistente. No hay API de Telpark, ni API de ORA, ni exportación de histórico. Después de construir siete parsers, añadir un octavo fue una victoria fácil. El patrón estaba establecido, el OAuth de Gmail estaba conectado, el esquema de SQLite me resultaba familiar. El único reto fue la deriva de formato: desde 2017, el mismo comercio ha usado cuatro formatos distintos en el cuerpo del email. El símbolo del euro pasó de ir detrás del número a ir delante. El verbo cambió de "ha autorizado" a "ha pagado" y a "ha enviado". El parser prueba cada formato por turnos, cayendo de uno a otro. 1.429 pagos que se remontan nueve años, y añadirlo me llevó una tarde.

La deriva de formato es el enemigo silencioso de todo parser de emails. Construyes algo que funciona hoy, y dentro de dos años el remitente cambia una palabra y tu regex deja de coincidir. Pero cuando el patrón ya está establecido, añadir una fuente nueva sale barato.

## La API de métricas: 1.142 líneas, cero dependencias

Cuando ya tenía siete bases de datos SQLite en disco, la pregunta era cómo las consultan los agentes de cada topic.

La respuesta ingenua es "móntalas en todos los contenedores y deja que el agente ejecute `sqlite3` directamente". Funciona como alternativa (el topic Economics puede hacerlo), pero tiene tres problemas. Primero, el agente tiene que conocer todos los esquemas, y los esquemas cambian cuando añado columnas. Segundo, forzar el modo solo lectura a nivel de SQLite exige una invocación de URI muy concreta que cada agente de topic tendría que recordar. Tercero, Home Assistant necesita HTTP, no mounts del sistema de ficheros.

El agente construyó una API de métricas. Un único fichero de Python, 1.142 líneas, que usa solo la biblioteca estándar: `http.server`, `sqlite3`, `json`, `datetime`. Sin Flask, sin FastAPI, sin `requirements.txt`. La imagen de Docker pesa unos 70 MB y arranca en menos de 500 milisegundos. Veinticuatro rutas repartidas en cuatro grupos: meta (`/health`, `/endpoints`), vistas combinadas (`/metrics`, `/history`), resúmenes por proveedor y drill-downs.

El patrón que más me gusta es la ruta de descubrimiento `/endpoints`. Cuando al agente de Economics le preguntan algo que no ha visto antes ("cuál fue mi movimiento de tarjeta más grande el mes pasado"), no necesita conocer de antemano las rutas disponibles. Su CLAUDE.md dice: llama primero a `/endpoints`. El endpoint devuelve una lista autodescriptiva de rutas con los campos `path`, `method`, `params` y `description`. El agente elige la que tiene una descripción acorde con la pregunta y la llama. Puedo ampliar la superficie de la API sin actualizar ningún CLAUDE.md.

El agente también creó un `docker-compose.yml` para ejecutar la API como contenedor persistente. Cada base de datos SQLite se monta como bind de solo lectura, y las rutas dentro del contenedor replican lo que ven los contenedores de los agentes (`/workspace/group/...`), de modo que el mismo `server.py` funciona en ambos contextos. El fichero compose incluye `restart: always`, que resultó ser importante: es lo que levantó el contenedor de la API automáticamente tras el reinicio de la VM durante el incidente del redimensionado de disco.

Una lección operativa: cada vez que cambiaba la API (y cambiaba constantemente, según aparecían bases de datos y endpoints nuevos), tenía que entrar por SSH a la VM para reiniciar el stack de compose. El bot de Telegram me decía "he actualizado `server.py`", y yo tenía que saltar a una terminal para ejecutar `docker compose restart`. A la tercera vez, añadí un bloque `develop.watch` al fichero compose para que los cambios en `server.py` se sincronicen solos con el contenedor y reinicien el proceso. Se acabaron los viajes de ida y vuelta por SSH para iterar la API.

## Home Assistant: ya no es solo IoT

Yo ya tenía Home Assistant funcionando para lo habitual: sensores de temperatura, enchufes inteligentes, automatizaciones. Lo interesante es que HA ha dejado de ser solo un panel de IoT. Ahora agrega datos financieros junto a los sensores físicos.

Home Assistant consulta la API de métricas con su plataforma de sensores `rest:` integrada. Unas tarjetas Glance en una tablet de la cocina muestran el gasto en comida de este mes, los pedidos de Amazon y el coste de la electricidad. Una tarjeta ApexCharts dibuja en columnas 24 meses de historial de gasto por proveedor. La API como capa unificadora convirtió lo que podría haber sido un componente propio de HA (bastante trabajo en Python) en un ejercicio de configuración YAML.

Lo importante es la visibilidad. Quería ver de un vistazo qué pasaba con mis finanzas personales, igual que veo la temperatura de la casa. NanoClaw hizo que los datos se pudieran consultar. Home Assistant hizo que se vieran. Y el mismo endpoint de la API sirve tanto a los agentes de los topics como al panel.

## El día que se rompió

El 24 de abril de 2026, a las 21:30 UTC, el orquestador murió. No me di cuenta hasta la mañana siguiente.

La VM se había creado con 30 GB, pero el instalador LVM de Ubuntu solo había asignado 14 GB al volumen lógico raíz. Los 16 GB restantes estaban sin usar en el grupo de volúmenes. Así que el espacio útil real era de 14 GB, y estaba al 100% de uso. El contenedor de la importación diaria de ORA reportó un error transitorio y escribió un pequeño fichero JSON en el directorio IPC. La escritura creó un fichero de 0 bytes (la tabla de inodos tenía sitio, pero los bloques de datos estaban agotados). El IPC watcher del orquestador leyó el fichero, se encontró con `JSON.parse('')` y lanzó `SyntaxError: Unexpected end of JSON input`.

La ruta de cuarentena de NanoClaw intentó mover el fichero roto de `messages/` a `errors/`. Para eso necesitaba hacer `mkdirSync('errors/')`. Eso también chocó con ENOSPC. Ahora el orquestador no podía ni parsear el fichero ni apartarlo del camino. Volvía a encontrarse el mismo fichero roto en el siguiente ciclo de polling y volvía a fallar. Un bucle cerrado. El log de errores se llenó con la misma traza, añadiendo más presión sobre el disco.

Dieciséis horas de caída silenciosa. Ninguna alerta de Telegram (el mecanismo de alertas necesita un orquestador en marcha). Cinco tareas programadas se acumularon sin ejecutarse.

La recuperación llevó dos pasos. Primero, usé Claude Code en mi portátil para diagnosticar el problema. Detectó al instante el clásico problema de LVM en Ubuntu: `lvextend -l +100%FREE` seguido de `resize2fs` me devolvió los 28 GB completos. Después redimensioné el disco de la VM a 60 GB desde la consola VMM de Synology, volví a escanear el disco dentro de la VM (`echo 1 | sudo tee /sys/block/sda/device/rescan`), amplié la partición con `growpart`, extendí el volumen físico con `pvresize` y ejecuté otra vez `lvextend` + `resize2fs`. Resultado: 57 GB de raíz, 42 GB libres. Parar los dos contenedores huérfanos. Reiniciar NanoClaw. Primera respuesta: 84 segundos después del reinicio.

La lección no es "no llenes el disco". Eso es obvio. La lección de verdad tiene dos partes. Primero, la ruta de gestión de errores de NanoClaw también escribe en disco. Con ENOSPC, el mecanismo de recuperación es el mecanismo del fallo. El sistema no se cayó limpiamente; se quedó dando vueltas sobre su propia cuarentena rota. Segundo, el particionado LVM por defecto de Ubuntu solo usa la mitad del disco. Si creas una VM de 30 GB y das por hecho que tienes 30 GB, te equivocas.

## Los agentes y el capataz

La caída dejó al descubierto un límite en la arquitectura que no aparece en el diagrama de la pila, pero que importa para entender cómo se mantiene el sistema.

Los agentes que NanoClaw lanza cuando llega un mensaje de Telegram operan *dentro* del sistema. El agente de cada topic ve su propio espacio de trabajo (lectura y escritura), el mount compartido (solo lectura) y las credenciales inyectadas por OneCLI. No puede ver el proceso del orquestador, no puede listar los ficheros de otros topics, no puede reiniciar NanoClaw, no puede reconstruir la imagen del agente, no puede editar el código fuente. Esos límites son justo la razón por la que les confío el día a día:

| Mount o propiedad | DM de admin (is_main=1) | Topics del foro |
|---|---|---|
| `/workspace/project` (ro) | Todo el repo, incluidos src/, dist/, store/ | No montado |
| `/workspace/group` (rw) | Scripts de importación, 7 bases de datos, todos los PDFs | Carpeta del topic (solo CLAUDE.md) |
| `/workspace/extra/main-shared` (ro) | No montado (es el origen) | CLAUDE.md compartido |
| `/workspace/ipc` (rw) | data/ipc/telegram_main/ | data/ipc/\<topic\>/ |
| Credenciales OAuth de Gmail | Ambas cuentas | No montadas |
| `requires_trigger` | 0 (se procesan todos los mensajes) | 0 (excepto SystemLog: 1) |
| Autorización de despacho IPC | Puede dirigirse a cualquier chat registrado | Solo puede dirigirse a su propio JID |

Un ataque de prompt injection contra el agente del topic Economics no puede, por construcción, escalar hasta "borrar todas las bases de datos SQLite" ni "exfiltrar las credenciales de Gmail". Las credenciales no están en el contenedor. Las bases de datos no están montadas. El despachador IPC exige que la carpeta de origen coincida. El precio de esos límites es que los agentes son arquitectónicamente incapaces de hacer metatrabajo. No pueden arreglar el sistema en el que viven.

Cuando el orquestador murió el 24 de abril, ninguno de los agentes dentro de los contenedores habría podido recuperarlo. Corrían en contenedores lanzados por el orquestador muerto, y dependían de su IPC watcher para entregar sus respuestas. El camino de recuperación era por naturaleza de fuera hacia dentro: SSH a la VM, `su - nanoclaw`, conectar una sesión de Claude Code a la shell, investigar, limpiar, reiniciar. Sin esa capa exterior, el sistema habría quedado congelado hasta que un humano interviniera a mano.

Esa sesión exterior de Claude Code está en otro punto del gradiente de confianza. Corre con todos los privilegios del host, puede reescribir ficheros de código fuente, puede llamar a APIs externas, puede ejecutar comandos Docker contra el socket del host. Un trabajo con ese nivel de privilegio no debería iniciarlo nadie desde ningún chat de Telegram. Tiene que ser una actividad de desarrollo deliberada, síncrona y con un humano en el circuito. Eso es exactamente una sesión de Claude Code en una terminal: una segunda superficie de IA, pero una donde el modelo propone, el humano revisa y las herramientas se ejecutan con la autoridad de la máquina de desarrollo que el humano ya tenía.

Los agentes son la plantilla fija. La sesión de Claude Code es el capataz que llega para ampliar el sistema, depurarlo, documentarlo o rescatarlo. Los dos funcionan con la misma familia de modelos. La diferencia está en lo que se les permite tocar y en quién inicia la conversación.

## La planificación como diseño

Hay catorce tareas programadas activas. Su cadencia refleja la frecuencia con la que cambia cada fuente de datos.

**Importaciones mensuales** (el día 1 de cada mes, 09:00): Amazon, O2, BBVA, Tagus, Iberdrola. Esos proveedores facturan cada mes. Ejecutarlas con más frecuencia despertaría al agente sin trabajo que hacer.

**Importaciones diarias** (todos los días, 21:00): Mercadona y ORA. Los pedidos de comida se hacen cada semana, y los pagos de aparcamiento ocurren casi todos los días laborables. A las 21:00 la actividad del día ya se ha asentado, así que las preguntas de la mañana siguiente tienen datos frescos.

**Resúmenes diarios**: agenda del calendario a las 06:00 (el briefing de la mañana), dos resúmenes de email a las 21:00 (el resumen de la bandeja de entrada al final del día), resumen de ORA a las 21:15 y resumen de Mercadona a las 21:30 (cuando terminan las importaciones, antes de dormir).

Un patrón de planificación que me gusta: los **recordatorios puntuales del cambio de hora**. España cambia entre UTC+1 (invierno) y UTC+2 (verano) los últimos domingos de octubre y de marzo. Lo ingenuo es fiarse de la base de datos tz, que está bien para el reloj del scheduler pero no da ninguna señal visible de lo que acaba de cambiar. Si una tarea cron empieza de pronto a ejecutarse una hora antes o después, no me enteraré en días.

Así que programé dos tareas únicas para los dos próximos cambios. Cada una dispara un recordatorio de mantenimiento: "ha ocurrido el cambio de verano a invierno, comprueba que las tareas programadas se ejecutan a la hora esperada del reloj". Recordatorios explícitos para eventos invisibles del sistema. No te fías de tu memoria: dejas que tu yo del futuro reciba un Telegram de tu yo del pasado.

## Qué viene ahora

El soporte de topics de foro está ahora [en curso en el proyecto original](https://github.com/qwibitai/nanoclaw-telegram/issues/115). La rama `v2` de NanoClaw va 113 commits por delante de `main`, con una refactorización importante. La migración es realista pero no trivial: el módulo de planificación desaparece y se sustituye, y las tripas del enrutado se reconstruyen. Los scripts de importación y la API de métricas no se ven afectados (solo leen ficheros `.db`). El plan es esperar a que v2 se estabilice y a que antes aterrice el trabajo de los topics de foro.

Los refresh tokens OAuth de Gmail viven ahora como JSON plano dentro de cada contenedor de agente. Deberían pasar al vault de credenciales. Y la lección del disco lleno del 24 de abril merece una tarea diaria en SystemLog que ejecute `df -h` y avise al llegar al 80%.

Empecé este proyecto antes de que [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) tuviera soporte para Linux. Ahora que lo tiene, quiero regenerar toda la instalación dentro de un sandbox. El argumento de la VM como blast radius es sólido, pero un sandbox me daría el mismo aislamiento con mejores herramientas y sin la sobrecarga de un hipervisor. Esa es la siguiente evolución.

El sistema funciona. Responde preguntas sobre la compra, la luz, los movimientos del banco y el aparcamiento. Se cayó una vez, me enseñó algo concreto sobre cómo fallan los sistemas basados en IPC cuando el disco se llena, y siguió funcionando después de un redimensionado. Para algo que vive en un NAS y no cuesta nada de alojar, me parece un buen trato.

---

_Recursos:_
- _[NanoClaw](https://github.com/qwibitai/nanoclaw)_
- _[Instalación de NanoClaw de Vivian Balakrishnan](https://gist.github.com/VivianBalakrishnan/a7d4eec3833baee4971a0ee54b08f322)_
- _[Documentación del sensor REST de Home Assistant](https://www.home-assistant.io/integrations/rest/)_
- _[Issue sobre los topics de foro de Telegram en NanoClaw](https://github.com/qwibitai/nanoclaw-telegram/issues/115)_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
