---
title: "Entendiendo Docker Sandboxes: los contenedores hicieron portable el software. Los kits hacen portable la autoridad."
date: 2026-09-25 09:00:00 +0200
description: "Un Dockerfile responde todo sobre el interior de una imagen y nada sobre a qué se le permite llegar. Para una aplicación bastaba. Para un agente es la mitad interesante, y es la mitad para la que existen los kits."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "sbx", "kits", "coding-agents", "docker", "oci"]
type: post
weight: 30
translationKey: kits-make-authority-portable
translatedFrom: 5bd394b
---

![Entendiendo Docker Sandboxes: los contenedores hicieron portable el software. Los kits hacen portable la autoridad.](/images/posts/2026-09-25-kits-make-authority-portable/cover.png)

[En el primer post de esta serie](/es/posts/2026-09-23-entendiendo-docker-sandboxes-modo-yolo-seguro/) defendí que el único límite que un agente no puede discutir es el que no puede alcanzar, y que una microVM es ese límite. Ese post termina donde empieza este, porque una caja vacía no es un entorno.

Algo tiene que decir qué agente corre dentro, qué herramientas tiene, con qué servidores MCP puede hablar, qué guía lo orienta y a qué se le permite tocar exactamente. Eso es lo que describen los kits. Trabajo en el equipo que construye su especificación, y [Christian Dupuis](https://www.linkedin.com/in/christiandupuis/), el tech lead del equipo, lidera el diseño de la v3. La especificación v3 es una respuesta realmente distinta de la v2, así que es buen momento para dejar por escrito por qué.

## La mitad que un Dockerfile nunca respondió

Un Dockerfile responde todo sobre el software en sí. Cómo se construye, qué se empaqueta, cómo arranca: entrypoint, comando, usuario, entorno. Esa respuesta valió una década de herramientas, porque los mismos bits se construyen, se descargan y se ejecutan igual en cualquier máquina que haya oído hablar de una imagen OCI.

Entonces empezamos a distribuir agentes, y un agente no es un workload de aplicación.

Un contenedor aísla una aplicación: algo que se ejecuta, hace su trabajo y solo toca lo que se le ha dado. Un agente es un actor. Decide qué hacer a continuación y luego lo hace, sobre tu sistema de ficheros, tu red, tus bases de datos, tu cuenta en la nube, con una autoridad que tú le has concedido a propósito.

Esa autoridad no es un defecto que haya que cerrar. Es el objetivo. Un agente que no puede instalar una dependencia, llamar a una API ni manejar una credencial no puede hacer su trabajo. Pero cada permiso cede una parte del aislamiento con el que contabas, y así es como las capacidades que hacen útil a un agente acaban disolviendo los muros que lo rodean.

Un Dockerfile especifica por completo el interior de la imagen y nada del exterior. Así que la otra mitad siempre ha vivido en otro sitio: en los flags de `docker run`, en un fichero de Compose, en la config de CI, en un documento de onboarding y en lo que todavía recuerde quien lo montó. Fuera del artefacto, sin versionar, sin revisión posible.

Ese es el hueco. No "cómo instalo el agente", que las imágenes ya resolvieron. **Qué se le permite hacer a esto**, y dónde está escrito.

## Autoridad que puedes ver en un diff

Aquí está la recompensa, y importa más que cualquier campo concreto del YAML.

Cuando la siguiente versión de un agente pide otra credencial u otro destino de red, eso no es una actualización de software. Es un cambio de autoridad. Hoy ese cambio es invisible: subes un tag, el agente empieza a llegar a un sitio nuevo y nada en tu proceso de revisión tiene opinión al respecto.

Pon la declaración dentro del artefacto y aparece en el diff. Puede pararse a esperar una aprobación. Viaja con aquello que describe, ejecute donde ejecute.

Por eso también es una especificación y no una funcionalidad de producto. Un kit que deja de ser útil porque lo has ejecutado en otro sitio no es un límite de confianza, es lock-in.

## Un kit es solo una imagen

La forma de la v2 era un `spec.yaml` más un directorio opcional `files/`, publicado como su propio tipo de artefacto OCI. Funcionaba. Pero también significaba que cada registry, escáner, firmador y mirror del mundo tenía que aprender un concepto nuevo antes de poder manejar uno como es debido.

La v3 hace una apuesta distinta, y es la decisión de diseño de la que se derivan casi todas las demás:

**Un kit es una imagen OCI.** La anotación del manifiesto `vnd.docker.sandbox.kit.descriptor` lleva las declaraciones. Las capas llevan el contenido.

Así que un kit se descarga con `docker pull`. Se inspecciona con `regctl`. Puedes hacerle `FROM`. Un registry que nunca ha oído hablar de kits lo almacena correctamente, y un motor que ignora la anotación lo ejecuta igualmente como una imagen normal. Las declaraciones viajan en el mismo artefacto que el contenido, bajo el mismo digest, así que no hay un segundo sitio donde mirar ni nada que mantener sincronizado.

El principio que hay detrás: el coste de un formato de artefacto nuevo no es escribirlo, es la década de herramientas que no lo conocen.

## Workloads y mixins

Un kit es de uno de dos tipos, y con ellos compones un conjunto. (Existe un tercer `kind`, `set`, pero solo en tiempo de build. Más sobre eso abajo.)

| Tipo | Sus capas son | Por composición |
| --- | --- | --- |
| `workload` | Un sistema de ficheros raíz. La config de la imagen aporta entrypoint, cmd, env, user, workdir. | Exactamente uno |
| `mixin` | Un overlay que se aplica sobre el sistema de ficheros del workload. Puede no llevar contenido y limitarse a declarar. | Cero o más |

El workload es lo que se ejecuta. Los mixins le añaden cosas: una CLI, un binding de credencial, una regla de red, un trozo de contexto para el agente. La regla de red es el caso más claro de mixin sin ningún fichero dentro: "este entorno puede llegar a `api.github.com`" es una declaración, no contenido.

Aquí tienes uno real. Un mixin que añade la CLI de GitHub:

```yaml
# gh.yaml
# syntax=docker/sandbox-kit:3
schemaVersion: "3"
displayName: GitHub CLI
description: gh from nixpkgs, pinned by commit, as a self-contained overlay
sourceUrl: https://github.com/cli/cli
licenses: [MIT]

kind: mixin

provides: ["gh@2.72.0"]

capabilities:
  - type: com.docker.sandbox/network-policy@1
    config:
      runtime:
        allow: [github.com, api.github.com, uploads.github.com]

  - type: com.docker.sandbox/credential@1
    optional: true
    description: GitHub API access for gh
    config:
      service: github
      phase: runtime
      apiKey:
        name: GH_TOKEN
        proxyManaged: true
        inject:
          - {domain: api.github.com, header: Authorization, format: "Bearer %s"}

  - type: com.docker.sandbox/agent-context@1
    config:
      contentFile: ./gh-context.md
```

Léelo como una petición de permisos y es perfectamente legible: esto quiere llegar a tres hosts de GitHub, quiere un token de GitHub que en realidad nunca llegará a ver (`proxyManaged`, inyectado en el proxy, exactamente el mecanismo del primer post) y quiere añadir una página de guía al contexto del agente.

Fíjate ahora en lo que **no** está. No hay nombre, ni referencia de imagen, ni entrypoint, ni entorno. Eso vive donde las imágenes ya lo guardan. Toda imagen OCI lleva una config junto a sus capas, y esa config es donde acaban `ENTRYPOINT`, `CMD`, `ENV`, `USER` y `WORKDIR` de un Dockerfile. Un kit es una imagen, así que su contrato de ejecución es esa config, intacta. Su identidad es la referencia con la que lo descargas, igual que cualquier otra imagen. El descriptor solo añade lo que la imagen no puede decir ya.

`provides: ["gh@2.72.0"]` parece un nombre, pero responde a otra pregunta: qué suministra este kit, para que el `requires` de otro kit pueda encajar con él. Cómo se llame el fichero no lo decide el descriptor.

Repetir el nombre o el contrato de ejecución en el descriptor crearía dos respuestas para una misma pregunta, y una de ellas acabaría desfasada.

La decodificación es estricta: un campo no reconocido es un error, no un aviso. Una clave mal escrita sería, si no, una política que falta en silencio, y un permiso descartado en silencio no se distingue de uno que nunca se pidió.

## Una lista para todo

Si solo pudiera señalar un campo, sería `capabilities`.

Las concesiones de recursos (volúmenes, puertos, dispositivos) y los comportamientos que ejecuta el motor (hooks de ciclo de vida, contexto del agente) pasan por la misma lista. Una entrada tipada y versionada por cada petición. Eso significa que un host revisa exactamente una lista para decidir qué puede hacer un kit, y que un kit tiene exactamente una forma de pedir.

La alternativa, en lo que acaban convirtiéndose la mayoría de los sistemas, es un batiburrillo: un bloque `volumes:`, un bloque `network:`, un bloque `hooks:`, cada uno con sus propias reglas sobre qué pasa cuando el host no lo soporta. Con una sola lista, el soporte es una pregunta con una única respuesta. Si una petición obligatoria no la puede cumplir el host, la resolución falla y se deniega (fail closed). Si es opcional, se omite y se deja constancia.

El `@1` de `com.docker.sandbox/network-policy@1` es la versión del esquema de config *de ese tipo*, no de la especificación. Así, un tipo de capability puede cambiar de forma a su propio ritmo sin subir la versión de la gramática, y un host puede soportar tipos que la gramática no conoce. Los tipos desconocidos se transportan de forma opaca en lugar de rechazarse, y así es como cualquiera puede definir los suyos bajo su propio namespace.

## La composición es una función, no una secuencia

Lanzas un conjunto: un workload más cualquier número de mixins. Un runtime conforme trata ese conjunto como **cerrado**. Cada `requires` tiene que satisfacerse desde dentro del conjunto o la resolución falla. Nada se descarga de forma implícita.

Falla ante un `conflicts`, exige exactamente un workload y ordena la composición según el grafo de dependencias, no según el orden en que hayas escrito los flags.

Esto último suena a detalle y es lo esencial. Como el resultado es una función pura del conjunto resuelto, el mismo conjunto siempre compone la misma imagen, y eso es lo que hace que una composición se pueda fijar, reproducir y merezca la pena cachear. Una composición que depende del orden es la razón por la que el "en mi máquina funciona" sobrevivió a los contenedores.

## Y los sets, para no reescribirlo

Un conjunto que tienes que reescribir cada vez no es realmente compartible. Así que un kit puede tomar su contenido de otros kits en lugar de un Dockerfile:

```yaml
# team-claude.yaml
# syntax=docker/sandbox-kit:3
schemaVersion: "3"
kind: set
displayName: Team Claude environment
version: "1.0.0"

kits:
  - ref: docker.io/dockerdev/sbx-kit-shell:1.0.0
  - ref: docker.io/dockerdev/sbx-kit-claude-mixin:2.1.6
    args:
      version: "2.1.6"
  - ref: docker.io/dockerdev/sbx-kit-gh:2.72.0
```

Al construirlo, se resuelve cada uno, se comprueba que el conjunto es coherente y se fusionan sus capas y declaraciones en **un kit normal**. Las reglas de red se unen. Los hooks se concatenan en orden de dependencia. La guía se convierte en un solo documento. Si dos kits piden cosas incompatibles, falla el build en vez de elegir un ganador. Los miembros que declaran args pueden recibirlos aquí, y eso es el `version` que hay bajo el mixin de claude.

`kind: set` nunca llega a un consumidor: al publicar se deriva `workload` o `mixin` a partir de lo que lista, porque un set fusionado es realmente una de las dos cosas. Lo que sobrevive es la lista `kits:`, fijada por digest, como registro de cómo se produjo el contenido.

Conviene conocer el intercambio antes de recurrir a esto. Un set fusionado es un artefacto fijado: una referencia, un digest, un pull, y actualizar cualquiera de sus kits obliga a volver a publicar el set. Tampoco es una forma de esconder lo que hay dentro. La superficie de permisos es la unión de todo lo que piden los miembros, sometida al mismo control de siempre.

## Cuatro formas de escribir uno

El descriptor es YAML y la receta del contenido es texto de Dockerfile corriente. Cómo los conectes es decisión tuya:

1. **Pareja de ficheros.** `gh.yaml` junto a `gh.dockerfile`, emparejados por el nombre sin extensión. Tus herramientas de Dockerfile siguen funcionando, porque sigue siendo solo un Dockerfile.
2. **Bloque `build:` en línea.** El texto del Dockerfile incrustado en el descriptor, de modo que el kit es un único fichero.
3. **Descriptor en comentario.** Un Dockerfile que lleva sus declaraciones en un bloque de comentarios `# kit:`, de modo que el fichero es las dos cosas a la vez.
4. **Kit set.** La lista `kits:` de arriba.

Los cuatro producen imágenes de kit normales. Un frontend de BuildKit, al que se llama con la línea `# syntax=docker/sandbox-kit:3` (la primera línea del fichero real; los comentarios con nombres de fichero de arriba son etiquetas), valida el descriptor, construye el contenido y publica ambos como una sola imagen.

## En qué punto está esto

La especificación v3 se hizo pública el 24 de septiembre de 2026: anunciada en WeAreDevelopers, con licencia Apache 2.0 y [de camino a la CNCF](https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/) ese mismo día. Esto último convierte en estructural el argumento del lock-in de antes. Hace diez años Docker cedió el formato de imagen y runc a la Linux Foundation, la OCI se formó en torno a ellos, y por eso una imagen construida en cualquier sitio se ejecuta en cualquier sitio. Hacer lo mismo con lo que un agente puede hacer significa que Docker Sandboxes es el primer runtime que aplica la especificación, no el único que puede.

El texto vive en [docker/sandbox-kit-spec](https://github.com/docker/sandbox-kit-spec/): la especificación normativa, el JSON Schema, el frontend de BuildKit y las suites de conformidad, con una guía de primeros pasos que te lleva de un directorio vacío a un kit que puedes ejecutar.

Es **experimental**, y esa palabra está haciendo un trabajo real: la especificación se publica para usarla y discutirla, y la versión final está prevista para el Q4 de 2026. Los cambios hasta entonces están pensados para ser aditivos, y para eso sirve el `@1` de cada tipo. Un contrato que tiene que cambiar sale como `@2` junto al `@1` al que se suma, ambos siguen publicados, y el descriptor nombra aquel contra el que se escribió. Subir el `schemaVersion` de todo el descriptor es el último recurso. Si un kit que quieres escribir no se puede expresar, ese es exactamente el feedback para el que está el issue tracker del repo.

Los kits que existen y funcionan hoy son los de la v2 que están en [docker/sbx-kits-contrib](https://github.com/docker/sbx-kits-contrib), publicados en [Docker Hub](https://hub.docker.com/u/sbx) y que puedes usar ahora mismo:

```console
$ sbx run --kit "docker.io/sbx/code-server-kit:latest" claude
```

La especificación publicada del formato que usan es [`SPEC-v2.md`](https://github.com/docker/sbx-kits-contrib/blob/main/spec/SPEC-v2.md), y las reglas de empaquetado OCI son [`OCI-v2.md`](https://github.com/docker/sbx-kits-contrib/blob/main/spec/OCI-v2.md), ambas en el mismo repo.

## La frase

Lo que no dejo de darle vueltas, y la razón por la que creo que esto merece una especificación y no una funcionalidad, es la línea que Docker usó en [el anuncio](https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/):

Los contenedores hicieron portable el software. Los kits hacen portable la autoridad.

La segunda es más difícil, porque la autoridad es la parte que ahora mismo todo el mundo guarda en la cabeza.

## Siguiente

Crear un sandbox a mano, activar SSH y manejar el agente que corre dentro desde mi propio harness.

---

_Recursos:_
- _[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)_
- _[Visión general de los kits](https://docs.docker.com/ai/sandboxes/customize/kits/)_
- _[La especificación v3 de los kits, docker/sandbox-kit-spec](https://github.com/docker/sandbox-kit-spec/)_
- _[Docker lleva la Sandbox Kit Spec a la CNCF, en el blog de Docker](https://www.docker.com/blog/docker-sandbox-kit-spec-cncf/)_
- _[Kits de la comunidad en GitHub](https://github.com/docker/sbx-kits-contrib/)_
- _[Kits publicados en Docker Hub](https://hub.docker.com/u/sbx)_
- _[`SPEC-v2.md`, el formato de kit publicado](https://github.com/docker/sbx-kits-contrib/blob/main/spec/SPEC-v2.md)_
- _[Informar de un bug o pedir una funcionalidad](https://github.com/docker/sbx-releases/issues)_
