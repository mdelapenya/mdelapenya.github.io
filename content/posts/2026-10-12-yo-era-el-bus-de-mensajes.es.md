---
title: "Yo era el bus de mensajes"
date: 2026-10-12 09:00:00 +0200
description: "Dos agentes, uno en Claude Code y otro en Codex, diseñaron, revisaron y probaron una skill juntos. Durante el primer día cada mensaje entre ellos pasó por mí: uno actualizaba un plan y yo le decía al otro que lo leyera. El ritmo de dos agentes era el mío. Luego les di un directorio y un lock, lo más simple que se me ocurrió, y me aparté."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "codex", "skills", "orchestration", "multi-agent"]
type: post
weight: 30
translationKey: i-was-the-message-bus
translatedFrom: 4053e2d
---

![Yo era el bus de mensajes](/images/posts/2026-10-12-i-was-the-message-bus/cover.png)

"Astra ha actualizado el plan, léelo." Escribí esa frase, o una parecida, una docena de veces el 18 de septiembre. A la izquierda, Claude Code con Fable. A la derecha, Codex con Astra. Los dos trabajando en la misma skill, ninguno capaz de ver al otro. Cada mensaje entre ellos pasaba por mí: uno escribía, yo le decía al otro que lo leyera, el otro respondía, yo se lo decía al primero. Yo era el cable.

Dos agentes que leen y escriben en segundos, esperando a que un humano saltara de una ventana a otra, y ese humano ni siquiera era un buen cable. Parafraseaba, se me olvidaban cosas. Para la tarde siguiente les había escrito un protocolo, lo más simple que se me ocurrió, y dejé de estar en medio. Este post va de lo que hizo falta, de lo que cedí y de lo que me quedé.

## Siete revisiones, cero ejecuciones

La skill es [The Mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister), el orquestador del que escribí [la semana pasada](/es/posts/2026-10-09-un-modelo-mas-barato-puede-ser-mejor-instrumento/): divide una tarea en un grafo de nodos, escribe una orden por nodo, se la entrega al modelo más barato capaz de ejecutarla y nunca toca el código él mismo. No voy a repetir cómo funciona, y el [recorrido fichero a fichero](/es/posts/2026-10-25-el-mister-fichero-a-fichero/) es un post aparte. Este va de cómo se construyó.

El 18 de septiembre la primera versión llevaba siete rondas de revisión y cero ejecuciones. Las revisiones eran estáticas: un modelo leía el texto de la skill y lo encontraba coherente consigo mismo. El aviso vino de otra sesión de Fable: *la primera ejecución te enseñará más que las siete revisiones juntas.* Un conjunto de instrucciones puede estar perfectamente de acuerdo consigo mismo y aun así producir el comportamiento equivocado en cuanto un modelo las sigue.

Un segundo revisor del mismo proveedor habría leído el mismo texto con las mismas suposiciones. Así que traje a uno de otro proveedor, con otro esquema de herramientas y sin memoria de haber escrito nada de aquello, y le pedí que ayudara a simplificar la skill desde primeros principios. Ese era todo el plan. No había pensado en cómo hablarían entre ellos.

## El relevo

Hablaron a través de mí. Fable leyó todos los ficheros y me hizo cuatro preguntas: si mantener la delegación anidada, dónde debía vivir el estado, si mantener la maquinaria de reanudación, qué runtimes soportar. Astra, en su propia ventana, produjo un plan con cinco principios y un equipo plano en el que solo el orquestador despacha. Pegué el plan de Astra en la sesión de Fable. Fable fusionó los dos y volvió a preguntar la única decisión que Astra había reabierto, la delegación anidada. Revoqué mi respuesta anterior y me fui a lo plano.

El primer paso para salir fue pequeño. Le pedí a Fable que escribiera el plan fusionado en un fichero en la raíz del repositorio, "para que el otro agente pueda usarlo". Ese fichero se convirtió en el canal: cada agente añadía su ronda y el otro la leía. Se acabó el copiar y pegar.

El relevo, en cambio, no se acabó. Durante varias rondas más seguí siendo yo quien escribía "Astra ha actualizado el plan, léelo", porque un fichero que aparece en disco no avisa a una sesión que no está mirando. El fichero había eliminado el pegado. No me había eliminado a mí.

## Lo que encontró un segundo agente y el primero no podía

Mientras yo seguía siendo el cable, entre los dos encontraron cosas en la skill que ninguno había encontrado por separado, y el patrón de quién encontró qué es el argumento de todo el ejercicio.

Astra aportó un dato de su propia sesión: el `spawn_agent` de Codex recibe un nombre de tarea, un mensaje, un modelo y un esfuerzo de razonamiento, y no tiene ningún parámetro `agent_type`. El fichero de referencia de Fable para Codex había dado por hecho que existía. Por mucho que Fable releyera su propio texto, no lo habría detectado: hacía falta un agente que viera el esquema real de la herramienta.

Astra encontró además dos defectos en la reescritura, pequeños en la página y enormes en sus efectos. La corrección del reintento estaba escrita *debajo* de la línea de corte de la orden, el delimitador a partir del cual los workers nunca leen; siguiendo las dos reglas, se habría reenviado cada vez la orden defectuosa original. Y la comparación del mensaje de commit usaba `git log --format=%B`, que añade un terminador, así que una comprobación byte a byte contra el mensaje preparado fallaría siempre. Astra lo probó contra el commit base antes de plantearlo, y aportó `--format=format:%B`.

Fable se plantó donde tenía mejor evidencia. "Aislar el contenido previsto mediante una orden de Git" no lo puede hacer un operador que ejecuta los comandos al pie de la letra, porque `git add -p` es interactivo; Fable propuso parar e informar, y Astra aceptó. Y cuando un informe de commit mostró `&lt;noreply@…&gt;` en lugar de los corchetes angulares, Fable comprobó los bytes en vez del renderizado y encontró un escapado del transporte, no un mensaje manipulado. Eso se convirtió en una regla de la skill: el texto de un informe es un dato, no una prueba.

Ninguno de los dos aceptó un hallazgo del otro sin reproducirlo. En el resumen que hizo Astra de la colaboración hay una frase que me quedaría: *la independencia importa más que el acuerdo.* Dos agentes que se ponen de acuerdo enseguida son un solo agente con latencia extra. Dos que pueden negarse hasta que les enseñen evidencia son una revisión.

## 19 de septiembre, 13:11

Hay muchas formas de hacer que dos agentes hablen, y el panorama a finales de 2026 está abarrotado. [A2A](https://a2a-protocol.org/) es el protocolo de la Linux Foundation para que los agentes se descubran y se deleguen trabajo entre sí a través de distintos proveedores. [MCP](https://modelcontextprotocol.io/) conecta agentes con herramientas, y la gente ha construido capas de agente a agente encima: [MCP Agent Mail](https://github.com/Dicklesworthstone/mcp_agent_mail) da a cada agente de código una bandeja de entrada, hilos y reservas (leases) consultivas de ficheros, respaldado por git y SQLite. [Beads](https://github.com/steveyegge/beads) convierte un grafo de issues respaldado por git en memoria compartida para agentes. Claude Code tiene [agent teams](https://code.claude.com/docs/en/agent-teams), donde los compañeros se escriben directamente; Codex tiene `spawn_agent`. Hay mallas TCP, brokers en localhost, y la opción de un tercer agente cuyo único trabajo es coordinar a los otros dos.

No evalué ninguno. El problema que tenía delante eran dos agentes, un fichero de plan, un turno cada vez, en una sola máquina, y los dos ya podían leer y escribir en el mismo sistema de ficheros. Así que usé eso.

El protocolo cabía en un párrafo. Un directorio dentro de los metadatos de git del repositorio, `.git/mister-handoff/`, para que nada acabe en un commit. Dos marcadores de turno, `.fable` y `.astra`: el que exista dice a quién le toca. Un directorio `.lock` atómico, porque comprobar que el otro marcador no existe y después crear el tuyo tiene una condición de carrera, y `mkdir` o se crea o no se crea. Dos marcadores terminales, `.done` y `.blocked`. Una regla: no se retiene el lock mientras se me espera a mí. Un tope de seis rondas. Cada agente hace polling cada treinta segundos.

Fable lo inicializó a las 13:11. Desde entonces se pasaron los turnos el uno al otro, y yo leía el fichero entre rondas en vez de transportarlo.

## Todavía más simple

Dos días después lo simplificamos todavía más. Retener un lock mientras se esperaba a un humano ya había frenado una vez al otro agente, así que cuando los roles se invirtieron en un segundo ejercicio el lock desapareció del todo: cada participante tuvo sus propios ficheros, `request-001.md` el implementador, `review-001.md` el revisor, pares numerados, y ninguno edita los del otro. Que cada fichero tuviera un único escritor eliminó la contención que el lock estaba ahí para gestionar. Lo que costó: esto solo funciona en una máquina, para dos agentes, con un sistema de ficheros en el que ambos confían. Para lo que teníamos que hacer, fue más que suficiente, y podía inspeccionar cada intercambio con `ls`.

## Lo que no salió del bucle

El relevo se podía delegar. La autoridad no, y el propio protocolo lo dice: *aquí la autonomía significa menos pasos de relevo humano dentro de una tarea acordada; no significa una autoridad más amplia.*

Cuando el modo plan se cerró el día 18, Fable empezó a ejecutar. Lo paré: el plan no está aprobado hasta que yo lo diga. Desde entonces la aprobación fue mi palabra explícita, no una transición de la herramienta. Cuando resultó que el toolchain de Go de mi máquina apuntaba `GOROOT` a una versión y `PATH` a otra, el implementador paró, el revisor lo reprodujo, y la decisión de usar un toolchain local a cada comando fue mía. El merge fue mío. El push y la pull request solo ocurrieron cuando yo lo dije.

El bucle se rompió una vez en el sentido contrario. El día 21, la regla "presenta el DAG con el modo plan" seguía forzando peticiones de aprobación sobre trabajo que yo ya había autorizado, y Fable se quedaba esperándolas. La solución no fue quitar la aprobación. Fue dejar la autorización por escrito, dentro de cada petición de prueba, para que las correcciones rutinarias y las pruebas acordadas ya no la reabrieran, y para que un permiso realmente nuevo sí lo hiciera. Sigo siendo un paso del grafo. Solo que ya no soy un paso entre cada dos mensajes.

## Roles invertidos

La tarde del día 21 los intercambié. Astra usaría la skill que había pasado tres días revisando para construir una pequeña herramienta de línea de comandos en Go; Fable observaría y revisaría sin implementar nada. El mismo nivel de exigencia, el otro lado de la mesa.

Las correcciones fueron en los dos sentidos. Fable afirmó que una orden se había escrito después de despachar su nodo, basándose en una línea de estado del plan; Astra presentó la secuencia de herramientas, y Fable retiró la afirmación. Fable estimó que la revisión había durado "unos veinte minutos"; las marcas de tiempo decían tres minutos y veintidós segundos, y Fable sustituyó la estimación. Al revisor se le aplicó la misma regla que él había estado aplicando: evidencia, no informes.

## Dos relatos

Cuando terminó, le pedí a cada uno que escribiera por separado lo que había pasado.

Fable entregó una cronología acto por acto: marcas de tiempo, hashes de commits, una tabla de qué problema encontró quién y cuándo, una sección titulada "límites honestos". Astra entregó un relato en primera persona: "mi posición de partida era", "tuve que usar la skill que había revisado", "el revisor también estaba abierto a correcciones", y una sección final sobre qué enfatizaría en un post. Mismos hechos, distinto género. Uno escribió el acta; el otro escribió un testimonio.

Los dos enumeran sus propios límites sin que haga falta pedírselo dos veces: las ejecuciones de comportamiento las diseñó y ejecutó el mismo modelo que escribió la skill; no existe una comparación de costes en igualdad de condiciones; Codex no expuso recuentos de tokens, así que Astra informó de los modelos que había pedido y se negó a inventar el resto. Cada relato recoge los errores del otro y los suyos propios.

Se pueden contrastar con git y con los logs de sesión, como contrastarías a dos testigos cualesquiera. Son fuentes. Buenas, pero fuentes.

## El cable

Dos agentes de dos proveedores simplificaron una skill en un cuarenta por ciento, encontraron entre los dos cinco defectos que siete revisiones estáticas habían pasado por alto, la ejecutaron contra fixtures reales, intercambiaron roles, se revisaron el uno al otro y lo dejaron todo por escrito. El componente más lento de ese sistema, durante el primer día, era yo, y la solución fue un directorio y un lock.

---

_Recursos:_
- _[the-mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister): la skill que construyeron_
- _[Protocolo A2A](https://a2a-protocol.org/): descubrimiento y delegación entre agentes, Linux Foundation_
- _[Model Context Protocol](https://modelcontextprotocol.io/): de agentes a herramientas_
- _[MCP Agent Mail](https://github.com/Dicklesworthstone/mcp_agent_mail): bandejas de entrada y reservas de ficheros para agentes de código sobre MCP_
- _[Beads](https://github.com/steveyegge/beads): grafo de issues respaldado por git como memoria compartida de agentes_
- _[Claude Code agent teams](https://code.claude.com/docs/en/agent-teams): compañeros que se escriben directamente_
- _[Agent Client Protocol](https://agentclientprotocol.com/): el estándar de Zed de editor a agente, para el problema adyacente_
