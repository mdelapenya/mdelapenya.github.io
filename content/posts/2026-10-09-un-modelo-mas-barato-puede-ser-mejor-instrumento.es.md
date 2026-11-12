---
title: "Un modelo más barato puede ser un mejor instrumento"
date: 2026-10-09 09:00:00 +0200
description: "Quería dejar de mandar las tareas simples a mi modelo más caro y ejecutar más de ellas en paralelo. Los modelos baratos aguantan, con una condición: la orden no puede dejar nada por adivinar. La pregunta que decide qué modelo se lleva una tarea resulta ser la que arregla la orden."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "claude-code", "codex", "skills", "orchestration", "subagents", "prompting"]
type: post
weight: 30
translationKey: a-cheaper-model-can-be-a-better-instrument
translatedFrom: 4053e2d
---

![Un modelo más barato puede ser un mejor instrumento](/images/posts/2026-10-09-a-cheaper-model-can-be-a-better-instrument/cover.png)

Tienes que despejar un bosque. ¿Con qué te pones, con un hacha o con un cuchillo? Con el hacha, claro: talar un árbol con un cuchillo no es un trabajo, es un castigo. Así que coges el hacha, y después te la quedas en la mano para todo lo demás que trae el día: podar ramas, cortar cuerda, marcar troncos, afilar la estaca para montar la tienda de campaña. El hacha también sirve para todo eso, bien o mal, y ya la tienes en la mano.

Maslow lo formuló como una advertencia: si la única herramienta que tienes es un martillo, todo te parece un clavo. Kaplan lo llamó la ley del instrumento. Lo mío era la versión que ninguno de los dos se molestó en escribir, porque suena demasiado tonta: tenía la caja de herramientas entera y aun así cogía siempre el martillo, porque era la única herramienta que nunca me fallaba.

Ese era mi uso de los agentes de código. El modelo más capaz se llevaba la tarea de diseñar la API, y también la de renombrar una función y la de ejecutar `git status`. Las hacía todas bien, y ahí está el problema: una herramienta que se encarga sin quejarse del trabajo equivocado nunca te avisa de que no era la herramienta adecuada. Solo lo ves en dos sitios. En la factura, donde cada golpe cuesta lo mismo si tala un árbol que si afila una estaca. Y en la cola, porque un hacha golpea un solo árbol a la vez.

Así que quería dos cosas. Dejar de darle al hacha el trabajo del cuchillo. Y tener más de una hoja en movimiento a la vez, en lugar de mirar cómo un agente va despachando una lista.

Los dos deseos tienen la misma forma: un agente que lee el bosque entero y nunca da un golpe, y una cuadrilla de agentes más baratos que hacen el corte. Llevo un par de semanas trabajando así, y los modelos baratos aguantan. Con una condición: la orden tiene que ser tan precisa que no quede nada por adivinar. Escribir órdenes así resultó ser la parte del flujo de trabajo que me he quedado.

## Por qué el martillo nunca se queja

La solución obvia es mandar el trabajo de cuchillo a un cuchillo. Y la forma obvia de hacerlo es coger el prompt que funcionó con el modelo capaz y enviárselo, tal cual, a uno más barato. Ahí es donde el modelo barato falla, en tareas que habrías jurado que eran simples, y la conclusión se escribe sola: el modelo barato no da la talla. Vuelta al hacha.

La conclusión es errónea, y el motivo está en la primera mitad del experimento, no en la segunda. Un modelo capaz es muy bueno tapando un mal prompt. Infiere lo que probablemente querías decir, elige un valor por defecto sensato donde dejaste un hueco y te devuelve algo que funciona. Nunca descubres que tu instrucción tenía un agujero, porque el resultado se parece al de una buena instrucción. Los prompts que llevaba meses escribiendo tenían agujeros que un modelo muy capaz iba rellenando en silencio.

Un modelo menos capaz es un instrumento mucho mejor. Falla donde tu orden era ambigua en lugar de adivinar, y falla ahí siempre, así que el fallo señala la frase que falta. El modelo barato no me estaba diciendo que no pudiera con el trabajo. Me estaba diciendo dónde se acababa mi instrucción.

Es el mismo instinto que perseguía en la [serie sobre cómo elegir el LLM más pequeño](/posts/2026-03-02-choosing-the-smallest-llm-part-1-slms-and-docker-model-runner), un nivel más arriba. Allí la pregunta era qué tamaño de modelo basta para atender una petición, y la respuesta era una propiedad de la petición. Aquí la pregunta es qué tamaño de modelo basta para ejecutar una instrucción, y la respuesta es una propiedad de la instrucción, lo que significa que puedes cambiarla escribiendo una mejor.

## La pregunta de bajar de nivel

Así que la pregunta antes de pasarle un trabajo a un modelo más barato no es *¿puede hacerlo?*. Es *¿qué necesitaría para hacerlo?*. Ese cambio de enfoque es todo el flujo de trabajo. Lo demás es la rutina que me lo hace preguntar siempre y no solo cuando me acuerdo.

Entra una tarea y la divido en piezas que pueden ejecutarse por separado: los nodos. Antes de que salga ningún nodo, decido qué capacidad de modelo necesita. Cuatro preguntas, en orden fijo; la primera que se responde con un sí decide:

1. ¿Ejecuta `git`, `gh` o `glab`? → **Git**
2. ¿Se puede escribir literalmente cada comando y cada edición? → **Easy**
3. ¿El objetivo está del todo especificado: archivos, funciones, firmas, comportamiento? → **Medium**
4. Si no → **Hard**

Eso solo no ahorra mucho: mi instinto pone la mayoría de los nodos en Hard o Medium. El ahorro viene de una segunda pasada por cada uno de esos nodos, con la pregunta de antes hecha concreta: *¿qué necesitaría esta orden para que el siguiente nivel más barato lo consiga?*

Esa pregunta tiene exactamente tres respuestas, y las tres son útiles.

**Necesita contexto.** El modelo más barato acertaría si supiera que la forma del handler vive en `internal/api/gadget_handler.go:40-88`, o que el struct tiene que declararse exactamente así. Bien: lo pego y bajo el nodo de nivel. La orden mejoró y el nodo se abarató, en ese orden.

**Necesita una decisión.** El modelo más barato no puede porque la orden contiene una bifurcación: dos diseños razonables y ninguna instrucción sobre cuál elegir. Resolver esa bifurcación me tocaba a mí, y la dejé tirada en la orden. Tomo la decisión, la escribo y bajo el nodo de nivel.

**Necesita criterio de verdad.** Concurrencia, una migración, una frontera de autenticación, la forma de una API pública: sitios donde una mala elección pasa desapercibida y sale cara. Lo dejo en Hard. Existen, y la factura dice que no son raros: el nivel Hard sigue siendo la partida más grande.

Los dos primeros casos son los que importan, porque comparten diagnóstico: *si no puedo bajar este nodo de nivel, mi orden era vaga.* El nivel no mide la tarea. Mide cuánto de la tarea dejé sin especificar.

La comprobación que hago antes de enviar nada, y que ahora aplico también mucho más allá de este flujo: *relee la orden como el modelo que va a recibirla, y cada sitio donde hayas tenido que inferir algo es una frase que añadir.*

## Leer el fallo

El fallo de un modelo barato solo es una medida si sabes de qué tipo de fallo se trata. Para eso hacen falta dos cosas escritas antes de enviar: qué tiene que producir el nodo y cómo voy a comprobarlo. No "el modelo de widget está bien implementado", sino "`widget.go` define `type Widget struct` con estos campos, y `go test ./internal/widget/...` termina con código 0". Sin eso, no puedo separar "no hizo lo que le pedí" de "no pedí lo que quería", y el instrumento entero marca cero.

Con eso, un fallo tiene exactamente tres causas, y cada una me dice algo distinto. Un **hueco en la orden**: el modelo no podía haberlo sabido. La orden era vaga y el modelo encontró el hueco; reescribo la orden y reintento en el mismo nivel. Es la pregunta de bajar de nivel que vuelve con su respuesta. Un **defecto de implementación con una orden sólida**: el modelo sabía y aun así lo hizo mal. Ahí el equivocado es el nivel, no la orden; reintento nombrando el defecto, o subo el nodo. Un **fallo de entorno**: autenticación, sin conexión, una rama protegida. No dice nada sobre la orden ni sobre el modelo; se para y me pregunta.

Tres envíos por nodo, y se acabó. Las palancas son siempre la orden, el nivel y yo. Nunca el código: el orquestador no puede tocarlo, y de eso va la siguiente sección.

## Quién hace qué

La skill que ejecuta todo esto es [The Mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister), la sexta de [mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills). En abril escribí sobre [el abogado, la enfermera, el detective y el escriba](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/), cuatro roles que hacen cada uno un trabajo sobre una pull request. Esta no hace ningún trabajo. Los reparte. La propia skill la construyeron dos agentes, uno en Claude Code y otro en Codex, revisándose el trabajo entre sí y conmigo dando las aprobaciones; esa es [una historia para otro post](/es/posts/2026-10-12-yo-era-el-bus-de-mensajes/).

Un entrenador de fútbol ve a los veintidós jugadores a la vez: la forma del equipo, el hueco que se abre en la banda izquierda, el delantero que dejó de presionar hace diez minutos. Salta al campo y verás lo que ve todo el que está en él: los tres metros que tienes delante. En España al entrenador se le llama el míster, y el nombre es todo el diseño: elige a los once y lee el partido desde fuera.

En la práctica, una tarea mía corre ahora sobre cuatro modelos, y el asiento más caro nunca escribe:

| Nivel | Quién | Qué hace |
|---|---|---|
| Orquestador | Fable 5 / Astra | Descompone, escribe órdenes, juzga la evidencia. Sin shell. |
| Hard | Opus 5 / Sol | Los nodos que de verdad necesitan criterio |
| Medium | Sonnet 5 / Terra | Objetivos totalmente especificados: estos archivos, estas firmas |
| Easy / Git | Haiku 4.5 / Luna | Todo lo que se pueda escribir literalmente, y cada comando `git` |

Dos reglas hacen que la tabla funcione.

**El orquestador no tiene `Bash`.** No como una instrucción que podría racionalizar en el cuarto reintento de un nodo testarudo: su lista de herramientas simplemente no incluye una shell, y sus `Write` y `Edit` están limitados al directorio donde viven el plan y las órdenes. Si pudiera llegar al código, justo entonces arreglaría el nodo a mano y dejaría sin corregir la orden vaga. Como no puede, la única palanca que tiene es la orden, que es la palanca que quiero que accione.

**Todo comando `git`, `gh` y `glab` corre en el nivel más barato.** Incluido `git status`. Un nodo que necesita git y además necesita escribir código son dos nodos. Un comando de git que ya está escrito (`git add internal/widget/widget.go`, `git commit -F .git/the-mister/widgets/orders/N07-commit.msg`) no tiene criterio que ejercer, así que el modelo más pequeño lo ejecuta exactamente igual de bien que el más grande: es la pregunta de bajar de nivel con la respuesta ya conocida. El operador ejecuta literalmente los comandos de la lista, pega cada byte de la salida y se detiene en seco ante el primer error.

El efecto secundario es que cada mutación de mi repositorio es ahora un nodo con una orden escrita y una transcripción pegada. Cuando reviso lo que pasó, no estoy leyendo el resumen de un modelo sobre lo que hizo en mi repo. Estoy leyendo los comandos y su salida.

Los niveles se nombran por dificultad, no por modelo, y los modelos viven en un archivo de referencia por runtime. En Claude Code un nivel es un modelo; en Codex es un modelo más un `reasoning_effort`. Las preguntas que asignan el nivel no se mueven, y cuando aparece un modelo nuevo el cambio es una fila.

## Lo que costó

Seis meses de facturas en los dos runtimes, leídas con los precios de lista actuales. No voy a compartir los importes, así que todo lo que sigue es relativo a julio y agosto, el último tramo antes de que empezara nada de esto. Cuatro regímenes:

| Periodo | Cómo trabajaba | Tokens por día, vs verano | Coste por token, vs verano | Quién escribió (parte de los tokens) |
|---|---|---|---|---|
| De abril a junio | Opus para todo | 14% menos | 26% más | Opus 87%, Sonnet 9%, Haiku 3% |
| De julio a agosto | Opus y Sonnet, a mano | línea base | línea base | Opus 49%, Sonnet 43%, Haiku 4% |
| Del 1 al 20 de septiembre | El patrón, a mano | 52% más | 17% más | Opus 30%, Fable 19%, Sonnet 17%, Haiku 32% |
| Del 21 de septiembre al 9 de octubre | El patrón, como skill | 18% más | 12% más | Opus 42%, Fable 12%, Sonnet 11%, Haiku 31% |

La primavera fue el hacha para todo. Opus escribió el 87% de los tokens, y fue el periodo más caro por token de los cuatro.

El verano fue la primera corrección, y no necesitó ninguna skill: pasé casi la mitad del trabajo a Sonnet a mano, y el coste por token bajó una quinta parte. Sin orquestador, sin niveles, sin órdenes. Esa es la línea base que todo lo demás tiene que superar.

En septiembre empezó el patrón de este post, antes de que existiera la skill. Lo ejecutaba copiando y pegando órdenes entre sesiones, con Fable, que acababa de salir, como el modelo que planificaba. En la factura aparecen tres cosas a la vez. Haiku salta del 4% de los tokens al 32%, así que el nivel Easy era real antes que la skill. Fable escribe el 19% de los tokens, porque un modelo que planifica por copia y pega acaba también arreglando cosas. Y el volumen sube la mitad, el más alto de los seis meses.

La skill es el mismo patrón, codificado. Frente a hacerlo a mano, gana en todas las líneas: un 4% más barata por token, un 22% menos de tokens al día, una cuarta parte menos de gasto diario. Fable baja del 19% de los tokens al 12%, y nada de eso es código. Haiku se mantiene en el 31%. Ese cuarto es el único número de seis meses de facturas que se puede atribuir a algo que construí yo y no a un modelo que cambié.

Frente al verano, el patrón cuesta un 12% más por token, y todo ese sobrecoste es un solo asiento: Fable en la silla del orquestador, al doble del precio de Opus. Con los precios de Opus, los mismos tokens saldrían un 4% por debajo del verano. Si un orquestador Opus escribiría órdenes tan buenas como las de Fable es la pregunta que la factura no puede responder, y es el asiento donde una peor orden sale más cara, porque todos los nodos de debajo la heredan.

Dos cosas que la factura no sabe. Si el 18% de volumen extra sobre el verano es trabajo en paralelo o reintentos. Y si las órdenes son mejores ahora que en septiembre; eso se vería en reverts y reenvíos, no aquí.

## Lo que probaría primero

No necesitas la skill para llevarte el beneficio principal. Coge la próxima tarea que le darías a tu modelo más capaz y hazle la pregunta de bajar de nivel: ¿qué necesitaría esta instrucción para que un modelo más barato la haga bien? Después escribe esa versión y envíasela al modelo más barato.

O funciona, y has descubierto que tu prompt llevaba menos información de la que creías y que tu modelo te estaba tapando. O falla, y falla justo en el punto donde tu instrucción era ambigua, que es el punto que querías encontrar de todos modos.

Empecé esto para gastar menos y para hacer más trabajo a la vez. Lo segundo se cumplió; lo primero solo en comparación con hacer lo mismo a mano, y la factura es clara sobre el motivo. La tercera cosa que se compra es la que no había planeado. Escribir para el modelo barato te deja con órdenes que cualquiera puede leer y comprobar. Con el caro, nunca habrías tenido que escribirlas.

---

_Recursos:_
- _[the-mister](https://github.com/mdelapenya/coding-skills/tree/main/skills/the-mister): la skill_
- _[mdelapenya/coding-skills](https://github.com/mdelapenya/coding-skills): el resto de la plantilla_
- _[Ley del instrumento](https://en.wikipedia.org/wiki/Law_of_the_instrument): Kaplan (1964) y Maslow (1966), el martillo y el clavo_
