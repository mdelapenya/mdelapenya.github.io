---
title: "Agentes de código en paralelo con Docker Sandboxes y git worktrees"
date: 2026-02-25 09:00:00 +0100
description: "Un flujo de trabajo práctico para ejecutar varios agentes de código en paralelo con Docker Sandboxes y git worktrees: autonomía total para los agentes, seguridad total para tu máquina."
categories: [Technology, AI, Software Development]
tags: ["docker", "coding-agents", "developer-experience", "claude-code", "git"]
type: post
weight: 30
translationKey: coding-agents-docker-sandboxes-parallel-workflows
translatedFrom: c410d7b
---

![Agentes de código en paralelo con Docker Sandboxes y git worktrees](/images/posts/2026-02-25-coding-agents-docker-sandboxes-parallel-workflows/cover.png)

Los agentes de código son potentes. Refactorizan módulos, escriben tests, arreglan bugs y levantan funcionalidades enteras. Pero ejecutarlos directamente en tu máquina significa darles acceso a tu sistema: tus ficheros, tus paquetes, tus contenedores en marcha. Ahora imagina lanzar *varios* agentes en paralelo sobre la misma copia del repositorio. Es la receta perfecta para los conflictos, el estado corrupto y una tarde para olvidar.

Hay una forma mejor. Combina [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) con [git worktrees](https://git-scm.com/docs/git-worktree) y tendrás agentes totalmente autónomos y totalmente aislados, con tantas tareas en paralelo como quieras.

## El problema

Cuando escalas el uso de agentes, se rompen dos cosas:

**1. Los agentes pueden estropearte la máquina.** Un agente que corre de forma nativa puede instalar paquetes, modificar la configuración del sistema, borrar ficheros o interferir con tus contenedores en marcha. Incluso los agentes que se portan bien hacen cosas inesperadas de vez en cuando. Darles acceso sin restricciones es un riesgo calculado que no siempre sale bien.

**2. Trabajar en paralelo sobre una sola copia genera conflictos.** Si estás con una tarea y quieres que un agente se encargue de otra a la vez, no podéis modificar los dos el mismo directorio de trabajo. Se pisan ficheros, se enredan las ramas y `git status` se convierte en un desastre.

Docker Sandboxes resuelven el primer problema. Los git worktrees resuelven el segundo. Juntos, hacen viable el trabajo con agentes en paralelo.

## El flujo de trabajo

Este es el proceso paso a paso que sigo cuando quiero que varios agentes trabajen a la vez en tareas distintas.

### Paso 1: crea los git worktrees

Un git worktree es un directorio de trabajo independiente enlazado al mismo repositorio. Cada worktree tiene su propia rama y sus propios ficheros, pero todos comparten el mismo historial de `.git`.

```bash
# Create a worktree for each parallel task
git worktree add .git/sandbox-worktrees/feature-auth -b feature/auth
git worktree add .git/sandbox-worktrees/fix-tests -b fix/flaky-tests
```

Ahora tienes dos directorios de trabajo independientes, cada uno en su rama. Los cambios de uno no afectan al otro. Al colocarlos dentro de `.git/sandbox-worktrees/`, quedan dentro del directorio del repositorio, así que cuando el sandbox monta tu proyecto, los worktrees van incluidos.

### Paso 2: crea un Docker Sandbox

Crea un sandbox para tu proyecto, apuntando a la raíz del repositorio. Esto levanta una microVM aislada con su propio daemon de Docker privado, completamente separada de tu máquina. El sandbox es un único entorno: cada `docker sandbox run` te deja en el mismo contenedor dentro de esa VM, pero como un proceso de Claude distinto.

```bash
docker sandbox create --name my-sandbox claude .
```

Como los worktrees viven dentro de `.git/sandbox-worktrees/`, forman parte del directorio montado y se ven desde dentro del sandbox.

### Paso 3: lanza una instancia del agente por worktree

Abre una terminal distinta para cada tarea y ejecuta el sandbox:

```bash
# Terminal 1
docker sandbox run my-sandbox

# Terminal 2
docker sandbox run my-sandbox
```

El agente todavía no sabe nada de los worktrees. Se lo cuentas tú. En cada terminal, empieza la conversación indicándole cuál es su worktree:

> "He creado un git worktree en `.git/sandbox-worktrees/feature-auth` sobre la rama `feature/auth`. Trabaja desde ese directorio. Tu tarea es..."

A partir de ahí, el agente se apaña solo. Hace `cd` al worktree y trabaja sobre esa rama de forma independiente.

### Paso 4: deja que los agentes trabajen

Dentro del sandbox, el agente funciona en modo YOLO por defecto: sin peticiones de permiso, sin llevarlo de la mano. Puede:

- Instalar paquetes y dependencias
- Ejecutar tests, incluso levantando contenedores con el daemon de Docker privado del sandbox
- Modificar ficheros libremente dentro del workspace
- Ejecutar comandos arbitrarios

Nada de esto toca tu máquina. Gracias al aislamiento de la microVM, el agente *no puede* acceder al daemon de Docker de tu host, a tus otros contenedores ni a ficheros fuera del workspace.

Mientras tanto, la sincronización de ficheros mantiene el worktree de tu máquina al día con el del sandbox. El directorio del workspace se monta en la misma ruta absoluta, así que las rutas que aparecen en los mensajes de error coinciden en ambos entornos. Los cambios del agente aparecen en tu máquina en tiempo real.

### Paso 5: revisa y haz merge

Cuando un agente termina, revisas su trabajo en tu máquina. El worktree sincronizado tiene todos los cambios. La mayoría de los IDEs (VS Code, Cursor, IntelliJ, etc.) te permiten abrir varios worktrees como carpetas separadas en la misma ventana, así que puedes ver los cambios de cada agente lado a lado y revisarlos por separado.

Yo uso el IDE (Cursor y VSCode) para ver los cambios en directo, pero también puedes hacerlo desde la línea de comandos:

```bash
# Check what the agent did
cd .git/sandbox-worktrees/feature-auth
git diff
git log

# If it looks good, merge it
git checkout main
git merge feature/auth
```

### Paso 6: limpia

Cuando termines, elimina los worktrees:

```bash
git worktree remove .git/sandbox-worktrees/feature-auth
git worktree remove .git/sandbox-worktrees/fix-tests
git worktree prune
```

Los sandboxes persisten hasta que los eliminas de forma explícita, así que los paquetes instalados y la configuración siguen disponibles por si tienes que volver. Los worktrees, en cambio, son baratos de crear y de borrar cuando haga falta.

## Por qué funciona

**Seguridad.** El sandbox te da aislamiento real de tu máquina, no solo una promesa. Todos los agentes comparten una única microVM con su propio daemon de Docker. No pueden escapar a tu host. Puedes dejarlos trabajar de forma autónoma sin temer daños colaterales.

**Paralelismo.** Los agentes comparten el mismo contenedor del sandbox, pero los git worktrees le dan a cada uno su propia rama y su propio directorio de trabajo. Sin conflictos de ficheros, sin pisarse el trabajo unos a otros. Puedes lanzar tantas tareas en paralelo como aguante tu máquina.

**Autonomía del agente.** Como el sandbox está aislado, no hace falta vigilar al agente ni aprobar cada acción. Puede instalar lo que necesite, ejecutar lo que necesite y romper lo que necesite, todo dentro de su propio entorno acotado. Ahí es donde los agentes rinden más: cuando pueden iterar con libertad, sin esperar la aprobación de un humano a cada paso.

**Rutas coherentes.** El workspace se sincroniza en la misma ruta absoluta entre tu máquina y el sandbox. Cuando el agente reporta un error en `/Users/you/project/src/main.go:42`, esa ruta también funciona en tu máquina. Sin traducciones mentales.

## Para cerrar

La combinación es sencilla pero efectiva: git worktrees para las ramas en paralelo, un Docker Sandbox para la ejecución aislada. Tienes agentes que trabajan de forma autónoma y en paralelo, sin ningún riesgo para tu máquina. Los worktrees mantienen separados los cambios en los ficheros; el sandbox mantiene todo lo demás fuera de tu máquina.

Es el flujo al que recurro siempre que tengo varias tareas independientes que un agente puede resolver. Preparo los worktrees, lanzo los sandboxes y dejo que trabajen. Reviso cuando terminan.

Aun así, me pregunto una cosa. ¿Y si el sandbox ya conociera los worktrees? ¿Y si `docker sandbox run` pudiera apuntar directamente a uno y arrancar un agente que ya estuviera en el directorio correcto, sobre la rama correcta? ¿Y si crear los worktrees, lanzar los agentes y limpiar al terminar fuera un solo comando? Las piezas ya están todas. Solo falta unirlas.

---

_Recursos:_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/) - Ejecuta agentes de código sin supervisión, pero de forma segura, en entornos aislados con microVM_
- _[Documentación de Git Worktrees](https://git-scm.com/docs/git-worktree) - Gestiona varios árboles de trabajo asociados al mismo repositorio_
