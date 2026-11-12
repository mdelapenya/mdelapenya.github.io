---
title: "El código es una caché"
date: 2026-08-05 09:00:00 +0200
description: "Cuando generar código es barato, el código deja de ser el artefacto que cuidas y pasa a ser una caché de tu entendimiento: valiosa mientras está fresca, desechable cuando caduca. La fuente duradera es la intención, la spec y los tests."
categories: [Technology, AI, Software Development]
tags: ["ai", "coding-agents", "developer-experience", "software-development", "intent"]
type: post
weight: 30
translationKey: code-is-a-cache
translatedFrom: 66cd07f
---

![El código es una caché](/images/posts/2026-08-05-code-is-a-cache/cover.png)

Cada vez que cambiamos un archivo de un repositorio, cambiamos la visión del mundo de todos los agentes que trabajan en él.

Esa frase suena abstracta hasta que le das una vuelta. Un archivo no es solo código que ejecuta la máquina. Es contexto que los agentes leen para entender qué es el proyecto, qué valora y cómo se comporta. Cuando un agente abre tu código, los archivos son lo que sabe. Cambia un archivo y cambias lo que sabe. El repositorio ya no es un montón de instrucciones. Es un entendimiento compartido desde el que trabajan personas y agentes.

Eso cambia lo que entendemos por código fuente. Durante casi toda mi carrera, el código fueron instrucciones para una máquina, y la máquina era el único lector que importaba. Ahora el código es también el entendimiento compartido desde el que trabajan cada vez más agentes. Y cuando lo miras así, el código deja de parecer lo que estás construyendo y empieza a parecer la proyección de algo que está aguas arriba. Cada vez es más un detalle de implementación. Llevaba tiempo dándole vueltas a esa idea sin tener una palabra limpia para ella, hasta que leí [La IA exige más disciplina de ingeniería](https://charity.wtf/p/ai-demands-more-engineering-discipline), de Charity Majors, que me dio la más afilada: el código es una caché.

## La economía se ha dado la vuelta

Durante décadas, producir código fue caro. Cada línea costaba tiempo humano, así que todo el oficio se optimizó para cuidarlo. Hacíamos ediciones cuidadosas. Manteníamos los diffs pequeños. Tratábamos el código fuente como algo precioso y no reescribíamos lo que ya funcionaba. Todo eso era racional, porque teclear el código era el cuello de botella. Cuando lo caro es producir el artefacto, proteges el artefacto.

Ese cuello de botella ya no existe. Generar código es ahora barato y rápido. Y cuando el coste de producir algo cae casi a cero, los hábitos construidos alrededor de su escasez dejan de tener sentido. Optimizar la edición cuidadosa sobre el propio archivo, cuando regenerarlo todo es casi gratis, es optimizar el paso equivocado. La economía que hacía precioso el código se ha dado la vuelta, y las prácticas que dependían de ella todavía no se han puesto al día.

## El código es una caché

Esta es la metáfora, dicha con precisión. Una caché es una vista materializada de una fuente más autoritativa. Es rápida de leer, barata de reconstruir y falsa en cuanto la fuente se mueve sin ella. Nadie trata una caché como la verdad. La verdad vive en otro sitio, y la caché es solo una proyección cómoda y desechable de ella.

El código es exactamente ese tipo de vista, materializada sobre tu entendimiento: la intención, la spec, el contrato de comportamiento que tienes en la cabeza sobre lo que el sistema debe hacer. Charity lo expresa así: el código es "una vista materializada del entendimiento, útil mientras está vigente, desechable cuando caduca". El valor de una caché nunca está en los bytes que guarda. Está en que coincide con su fuente. Una caché que se ha desviado de la verdad no es un activo. Es un pasivo que, eso sí, todavía compila.

## Editar la caché a mano

Aquí es donde cobra sentido la frase del principio. Cuando editas a mano código generado, estás escribiendo en la caché sin actualizar la fuente. Estás cambiando la visión del mundo desde la que leen los agentes y las personas, sin cambiar el registro autoritativo del que esa visión debería derivar.

Ahora el artefacto dice algo que la intención no dice. Y cada edición manual ensancha esa brecha. El código se va hacia un lado, el entendimiento se queda donde estaba y nada los reconcilia. Hazlo las veces suficientes y el repositorio deja de ser una proyección fiel de nada. Se convierte en un montón de parches locales cuyo razonamiento vive solo en la cabeza de quien los hizo, hasta que también lo olvida. La frase de Charity es contundente y acertada: "la mutabilidad es la enemiga jurada del entendimiento". Cada mutación sobre el propio archivo es una pequeña apuesta a que nunca tendrás que volver a regenerar desde la fuente. Esa apuesta se sigue perdiendo.

## Entonces, ¿cuál es la fuente?

Si el código es la caché, la pregunta obvia es cuál es la fuente de verdad. Es la intención, las specs, los tests, las notas de las tareas, el contrato de comportamiento. Esos son los artefactos que guardan la verdad de la que el código es solo una proyección.

Y esos son los que ahora cuidas a mano. Ahí es donde va el mimo: escritos con cuidado, revisados de cerca, pequeños y limpios, tratados como algo precioso. La disciplina no desapareció cuando el código se abarató. Subió una capa, del artefacto a aquello de lo que el artefacto deriva. Una suite de tests que fija el comportamiento es más duradera que la implementación que hoy lo satisface, porque la implementación se puede regenerar a partir del comportamiento, pero el comportamiento no se puede recuperar a partir de una implementación caducada. La fuente es lo que sobrevive a una reescritura. Todo lo que cuelga de ella es, al final, una caché.

## El colmo: la tecnología también es un detalle

Sigue esto hasta el extremo y llegas a la forma más fuerte de la idea. Si el código es una caché de la spec, también lo es la tecnología en la que está escrito. El lenguaje, el framework, la librería: todos son decisiones sobre *cómo* realizar el comportamiento, no el comportamiento en sí.

Lo que significa que la expresión más plena de "el código es un detalle de implementación" es un prompt que ni siquiera nombra el stack. Describes lo que el sistema debe hacer y dejas al agente libre para elegir el lenguaje, el framework y las librerías que mejor encajen con el trabajo. En ese punto ya no especificas la realización. Solo especificas el comportamiento, y dejas que la realización se derive.

Pero todo esto descansa por completo sobre la spec. Dejar que el agente elija el stack solo funciona cuando la spec es lo bastante buena como para que el stack no cambie de verdad el resultado. Y creo que una spec floja es justo la razón por la que los equipos sobreespecifican la tecnología desde el principio: fijar el lenguaje y el framework es una forma de compensar la intención que nunca escribieron. El stack tecnológico se convierte en un sustituto de un contrato que no existe. Así que esto no baja el listón. Lo sube. Cuanto menos condicionas el código, mejor tiene que ser tu entendimiento del comportamiento. Más libertad aguas abajo exige más disciplina aguas arriba, que es todo el argumento de Charity en una línea: la IA pide más disciplina de ingeniería, no menos.

## El límite: cuando el código es la fuente

La metáfora es una lente, no una ley, y conviene decir dónde se acaba. Hay código que no es la caché de nada más autoritativo que él mismo. Un algoritmo genuinamente nuevo. Una decisión de diseño irreducible. Esa línea cuidada en la que el código *es* la declaración más clara de la intención, y ninguna spec la capturaría mejor de lo que ya lo hace el propio código.

Ese código sigue siendo precioso, y lo editas como lo habrías hecho en 2015: a mano, con atención, porque no hay una fuente aguas arriba desde la que regenerarlo. La idea de la metáfora de la caché no es que todo el código sea desechable. Es que la mayor parte del código cuelga de algo, y el error es tratar la proyección como si fuera la fuente. Saber qué parte de tu código es de verdad la fuente y cuál es solo una vista de ella es la mayor parte del oficio.

## El hilo del que sigo tirando

Y una vez que empiezas a tirar de este hilo, no se detiene en el código, o al menos no de forma evidente. Si una spec lo bastante buena es la fuente de verdad, ¿para qué escribir a mano y versionar los tests, en lugar de pedirle al agente que los regenere desde la spec cuando haga falta? Todavía no tengo una respuesta limpia (hay motivos de peso para querer una comprobación que no haya escrito el propio generador), y creo que merece un post propio. Pero la pregunta no se va, y eso suele ser señal de que conviene tomársela en serio.

## Para cerrar

Así que vuelve al archivo. Si cambiarlo cambia lo que sabe cada agente del repositorio, la próxima vez que vayas a retocar a mano una función generada, la pregunta honesta es: ¿estás arreglando la fuente o solo editando la caché? Una de las dos sobrevive a la próxima regeneración. La otra se sobrescribe y se lleva su razonamiento consigo.

Protegimos el código durante décadas porque reconstruirlo era caro. Ya no lo es. Así que protege la spec como antes protegías el código, y deja que el código sea barato. Lo que merecía la pena guardar nunca estuvo en los archivos. Era el entendimiento del que ellos solo fueron siempre una copia.

---

## Recursos

- *[La IA exige más disciplina de ingeniería, no menos (Charity Majors)](https://charity.wtf/p/ai-demands-more-engineering-discipline)*
