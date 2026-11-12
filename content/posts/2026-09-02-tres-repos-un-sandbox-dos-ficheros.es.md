---
title: "Tres repos, un sandbox, dos ficheros"
date: 2026-09-02 09:00:00 +0200
description: "Una funcionalidad atraviesa el motor, un kit y la documentación. Así que mi entorno dejó de ser algo que reconstruía de memoria y pasó a ser dos ficheros desechables: uno que declara la máquina y otro que declara el comportamiento."
categories: [Technology, AI, Software Development]
tags: ["docker-sandboxes", "coding-agents", "claude-code", "developer-experience", "docker"]
type: post
weight: 30
translationKey: three-repos-one-sandbox-two-files
translatedFrom: 550f7c8
---

![Tres repos, un sandbox, dos ficheros](/images/posts/2026-09-02-three-repos-one-sandbox-two-files/cover.png)

La mayor parte del trabajo que hago en Docker Sandboxes no cabe en un solo repositorio.

Un único cambio aterriza en tres. La especificación del kit, que es pública y vive en [docker/sbx-kits-contrib](https://github.com/docker/sbx-kits-contrib). El motor que consume esa especificación, que no lo es. Y la página de documentación en [docs.docker.com](https://docs.docker.com/ai/sandboxes/) que cuenta a la gente que todo esto existe. Tres checkouts, tres ramas, tres pull requests, una sola idea. A Git le da igual que sean la misma idea, y a mi shell también.

Durante un tiempo lo resolví como creo que lo hace la mayoría: una sesión de agente por repositorio. No funciona, y no funciona por una razón estructural, no porque falte afinar el prompt. Cada sesión ve un tercio del cambio. Ninguna sabe decirte si las tres partes encajan. Así que la integración ocurre en el único sitio que las tiene las tres, que es mi cabeza, y me paso la tarde copiando contexto de una terminal a otra.

## Una funcionalidad, tres repos

Este es el problema. La especificación del kit gana un campo. El motor tiene que leer ese campo y hacer algo con él. La documentación tiene que explicar qué hace. No son tres tareas, es una tarea con tres artefactos, y los fallos interesantes viven justo en las costuras: el motor lee un nombre de campo que la especificación escribe de otra manera, o la documentación describe un comportamiento que el motor nunca llegó a publicar.

Un agente limitado a un repo no puede ver una costura. Solo ve uno de sus lados.

Ya escribí sobre [ejecutar varios agentes en paralelo con sandboxes y git worktrees](/es/posts/2026-02-25-agentes-de-codigo-en-paralelo-con-docker-sandboxes/), y sobre [construir una app real dentro de un único sandbox](/es/posts/2026-04-14-construir-una-app-real-dentro-de-docker-sandbox/). Los dos parten de la misma unidad: un agente, un repositorio, una rama. Esa suposición está bien cuando el trabajo cabe en un repo. Este trabajo no cabe.

Así que la unidad tenía que cambiar. No un sandbox por repo, sino un sandbox con los tres dentro y el agente libre para moverse entre ellos.

Eso es fácil de decir y fue un fastidio de ejecutar.

## El entorno es parte del cambio

La primera versión de esta configuración fue un sandbox montado a mano. Lo creas sobre un repo, después montas el segundo, después el tercero, después defines un secreto para que `git push` funcione, después abres un puerto para poder ver la previsualización de la documentación. Seis o siete comandos, en un orden que recordaba a medias.

Todo bien hasta el día en que tuve que repetirlo. Y ahí está el verdadero problema de un entorno montado a mano: no es que ensamblarlo sea lento, es que **cada vez ensamblas uno ligeramente distinto**. La deriva no vive en el entorno. Vive en la reconstrucción.

La solución no es específica de los sandboxes, ni de Docker, ni de mi trabajo. Cualquier entorno en el que trabaje un agente necesita dos propiedades:

- **Declarable.** La definición vive en un fichero, bajo control de versiones, junto al código al que sirve. No en el historial de tu shell ni en tu memoria.
- **Reconstruible.** Cambiarlo significa cambiar el fichero y dejar que la herramienta reconstruya a partir de la declaración, no meter la mano en un entorno en marcha y ajustarlo a mano. Si reconstruir da miedo, acabarás parcheando el que está vivo, y un entorno parcheado vuelve a ser uno hecho a medida.

Esas dos propiedades juntas son lo que siempre ha significado "como código". El argumento lo aceptamos con los servidores hace años. Lo que yo no había interiorizado es que el entorno de un agente no es solo un sistema de ficheros, y que declarar el sistema de ficheros te da solo la mitad.

La mitad que me faltaba es la interesante, así que empiezo por la fácil.

## Primera mitad: el lado de la máquina

`sbx env` lee un fichero. El mío se llama `.sbxenv.yaml` y está en el directorio padre de los tres checkouts, que son hermanos. Esa disposición no es casual, es el contrato: todas las rutas del fichero son relativas, así que el fichero solo tiene sentido desde donde están realmente los repos.

Reducido a lo que declara:

```yaml
schemaVersion: "1"
name: sandboxes-env
agent: claude

workspace: ./sbx-kits-contrib

additionalWorkspaces:
  - path: ./sandboxes
  - path: ./docs

kits:
  - docker.io/sbx/git-ssh-sign-kit:latest
  - docker.io/sbx/t3code-kit:latest

secrets:
  github:
    command: gh auth token

bindings:
  github:
    apiKey:
      domains:
        - api.github.com
        - github.com
        - raw.githubusercontent.com

ports:
  - sandbox: 1313
    host: 1313
```

Campo a campo, lo que aporta cada uno:

**`workspace`** es el repo sobre el que se crea el sandbox. **`additionalWorkspaces`** son los demás. La distinción importa menos que el hecho de que los tres llegan en el momento de la creación, ya declarados.

**`kits`** son capacidades que se añaden al sandbox. Uno me da firma de commits por SSH dentro del sandbox, el otro instala la superficie de control de agentes de la que [escribí la semana pasada](/es/posts/2026-08-28-cuatro-agentes-cuatro-maquinas-un-desarrollador/). Son artefactos OCI, así que se versionan como cualquier cosa que te descargas de un registry, y si estás consumiendo un kit en lugar de desarrollarlo, te conviene un digest en vez de un tag:

```bash
docker buildx imagetools inspect docker.io/sbx/git-ssh-sign-kit:latest
```

En cualquier caso, la referencia a un kit es una foto tomada cuando se crea el sandbox. Editar un kit no cambia un sandbox que ya está en marcha: el cambio llega en la siguiente reconstrucción.

**`secrets`** ejecuta un comando en el host y aprovisiona el resultado dentro del sandbox. Con `gh auth token`, `git push` y `gh pr create` funcionan desde dentro sin que yo configure nada a mano.

**`bindings`** es una lista de dominios permitidos a los que se puede inyectar esa credencial. Un token que funciona en todas partes es un token en el que tienes que pensar. Tres hosts de GitHub con nombre y apellidos, no.

**`ports`** redirige el 1313, porque uno de los tres repos es el de documentación y `hugo server` es como sabes si tu página se renderiza.

Y ahora lo que hizo que todo esto mereciera la pena. Como el fichero es el entorno, cambiar el entorno es editar el fichero, no lanzar un comando contra un sandbox vivo. Añadir un kit es el caso que más me ocurre: la nueva referencia entra en el YAML y el sandbox se reconstruye desde la declaración en lugar de parchearse en caliente.

Lo que lo hace tolerable en mitad de una tarea es que reconstruir no es resetear. El directorio del propio agente viaja en un volumen que se conserva, así que ganar una capacidad no me cuesta la sesión en la que estoy trabajando. El entorno se reconstruye. El trabajo continúa.

## Segunda mitad: el lado del comportamiento

Ahora, la mitad que el YAML no cubre.

Cuando tres repos comparten un sistema de ficheros, hacen falta reglas que no existían mientras el agente solo veía un repo. No preferencias de estilo. Reglas que existen por cosas concretas que salieron mal.

Viven en un `CLAUDE.md` en el mismo directorio padre que el fichero del entorno, un nivel **por encima** de los tres checkouts. Esa posición es todo el truco: se carga sin importar en cuál de los tres repos esté trabajando el agente. Un `CLAUDE.md` por repo solo puede describir su propio repo, que es la misma ceguera que una sesión de agente por repo.

Tres de las reglas del mío solo tienen sentido en un sandbox con varios repos.

### Público y privado en un mismo sistema de ficheros

Dos de mis tres repos son públicos y uno no. Esa combinación crea un modo de fallo que el trabajo con un solo repo no tiene: el agente puede **leer** el repo privado y **escribir** en el público. Nada de eso es malicioso, y nada de eso salta como una comprobación de permisos. Son dos capacidades que por separado están bien y juntas son una fuga.

Así que la regla va de dirección, no de acceso. Leer el código del motor para entender cómo se comporta algo: bien. Llevar lo que has leído al repo público: mal. Y "llevarlo" incluye los sitios que la gente olvida porque no parecen publicar: mensajes de commit, títulos de PR, nombres de rama, la respuesta a un revisor.

Lo último es donde de verdad se pone peligroso. Cuando un revisor del repo público pregunta por qué algo se comporta de cierta manera, la respuesta honesta está en el repo privado, y estás a un párrafo bienintencionado de publicarla. La salida es describir el comportamiento en términos de lo que la CLI hace de forma observable, que además de seguro resulta ser más útil para quien pregunta.

Hay un corolario que hice mal antes de escribirlo: una issue de seguimiento va en el repo privado aunque el arreglo vaya a aterrizar en el público. Una issue pública que describe comportamiento privado es la misma fuga que un comentario público que lo describe. El gestor de issues me parecía metadatos, no publicación. Es publicación.

### Nunca trabajes en `main`, en ninguno de ellos

En principio esta regla no es multi-repo. Lo es en la práctica, porque tres checkouts te dan tres oportunidades de estar en la rama equivocada sin ningún aviso adicional.

La fórmula que hizo que se me quedara es: **vuelve a comprobar la rama, no la recuerdes.** Una rama que verificaste hace una hora no es una rama que hayas verificado ahora. Ha habido un pull, se ha mergeado una PR, un agente ha cambiado algo. Así que `git rev-parse --abbrev-ref HEAD` antes del primer commit de cualquier trabajo nuevo, siempre.

Cuando esto me salió mal nunca fue porque desconociera la regla. Fue porque di la rama por supuesta.

### La herramienta no puede ejecutarse dentro de sí misma

Desarrollo `sbx` desde dentro de un sandbox que creó `sbx`, y `sbx` necesita virtualización anidada que el sandbox no tiene. Así que la herramienta en desarrollo no puede ejecutarse en el sitio donde la desarrollo.

Esto tiene una consecuencia clara para los tests. La suite que maneja Docker directamente se ejecuta sin problema dentro, contra el daemon del propio sandbox. La suite end-to-end, que maneja un `sbx` real, no puede ejecutarse dentro en absoluto, y hay que lanzarla en el host.

La regla que importa no es "acuérdate de cuál es cuál", sino **no presentes nunca resultados de la suite que no has ejecutado**. Un agente que dice "los tests pasan" queriendo decir "pasa la mitad de los tests que pueden correr aquí dentro" no miente, y aun así te está diciendo algo falso.

La misma trampa se aplica a las imágenes. Una imagen construida dentro del sandbox acaba en el daemon del sandbox, que no es donde mira la herramienta del host. "He construido la imagen" y "el host puede descargar la imagen" son afirmaciones distintas.

## Cómo viaja la mitad del comportamiento

Nada de esto valdría mucho si las reglas solo existieran en mi portátil, así que las dos mitades se distribuyen.

Las reglas, junto con una [skill de rol](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/) para el triaje de issues, vienen de un kit. Es interno, así que no puedes descargarlo, pero el mecanismo es el de siempre: un kit añade capacidad a un sandbox, y "cómo trabajamos aquí" resulta ser una capacidad como cualquier otra.

Las [skills que guardo en el host](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/) llegan de otra forma:

```bash
sbx skills import --dry-run
sbx skills import
```

Eso copia los directorios de skills del host a un almacén que todos los sandboxes montan en la ruta de skills del agente. Se siguen los enlaces simbólicos de primer nivel, así que una skill enlazada simbólicamente en el directorio del host también viaja. El almacén sobrevive a cualquier sandbox concreto, que es el objetivo. Solo un `sbx reset` completo lo vacía.

Esa persistencia tiene un filo que conviene conocer. Como el almacén se monta en lectura y escritura y es compartido, una skill escrita ahí **desde dentro** de un sandbox es contenido ejecutable que se ejecutará en todos los demás sandboxes que monten el mismo almacén, y persiste en el host cuando el sandbox ya no existe.

Por eso, cuando falta una skill, lo que toca es pedir que se ejecute la importación en el host, no instalarla desde dentro. Que falte una herramienta es una molestia. Que una herramienta se instale en silencio en todos los entornos futuros es otra categoría de cosa.

Es el mismo instinto que la regla de visibilidad, apuntando a otra superficie: fíjate en cuándo una escritura llega más lejos que aquello en lo que estabas trabajando.

## Por qué hacen falta los dos

Los dos ficheros fallan en direcciones opuestas cuando solo tienes uno.

El fichero del entorno solo te da tres repos en un sistema de ficheros compartido y ninguna regla de actuación. Todo es alcanzable, nada dice qué cosas alcanzables son mala idea, y la fuga de privado a público está al alcance de un agente bienintencionado en su primer commit.

Las reglas solas te dan reglas sin un sitio donde aplicarlas. Cada sesión empieza reconstruyendo el entorno que las reglas dan por supuesto, y describir una configuración con precisión no es lo mismo que poder reproducirla.

Juntos hacen el entorno reproducible en los dos sentidos que importan: los mismos ficheros y el mismo comportamiento encima. Eso es lo que de verdad quiero de "como código" y lo que declarar solo la máquina nunca me dio. Es también la misma lección que aprendimos a escala de equipo, donde [la forma de trabajar de una flota de agentes](/es/posts/2026-05-04-un-equipo-virtual-de-agentes-en-docker/) tuvo que escribirse antes de poder compartirse.

No voy a fingir que el fichero de reglas se diseñó. Creció, y la forma honesta de leerlo es como una lista de cosas que salieron mal una vez, cada una anotada en el momento en que anotarla se volvió más barato que ser cuidadoso. Las dos reglas que encabezan el fichero son las dos que se han roto.

## Lo siguiente

El kit que distribuye la mitad de las reglas es la pieza que aún no he explicado: cómo se construye uno, qué lleva dentro y cómo se empaqueta "la forma de trabajar de este equipo" para que llegue con el entorno en lugar de después. Eso es el próximo post.

## Cierre

Un entorno de agente no son solo los ficheros que puede ver. Son los ficheros más lo que el agente tiene permitido concluir a partir de ellos, y normalmente solo una de esas dos cosas está escrita.

Así que esta es la pregunta que le haría a cualquier configuración de agentes, incluida la tuya: si tuvieras que levantarla de nuevo mañana en otra máquina, ¿qué recuperarías? Si la respuesta es el sistema de ficheros pero no el criterio, has declarado medio entorno.

---

## Recursos

- *[Documentación de Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)*
- *[docker/sbx-kits-contrib](https://github.com/docker/sbx-kits-contrib)*
- *[docker/docs](https://github.com/docker/docs)*
- *[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills)*
