---
title: "El séptimo consejo: los tests hacen que el swarming sea seguro"
date: 2026-04-03 09:00:00 +0100
description: "Steve Yegge publicó seis consejos para programar con agentes. Todos aciertan. Pero se dejó uno: el testing. Sin él, el swarming es solo caos rápido."
categories: [Technology, AI, Software Development]
tags: ["coding-agents", "testing", "testcontainers", "quality", "developer-experience"]
type: post
weight: 30
translationKey: the-seventh-tip-testing-is-what-makes-swarming-safe
translatedFrom: 34eb269
---

![El séptimo consejo: los tests hacen que el swarming sea seguro](/images/posts/2026-04-03-the-seventh-tip-testing-is-what-makes-swarming-safe/cover.png)

Steve Yegge y Gene Kim publicaron [seis consejos para programar con agentes](https://steve-yegge.medium.com/six-new-tips-for-better-coding-with-agents-d4e9c86e42a9) durante su paso por Sídney, donde daban talleres de Vibe Coding. Los consejos son excelentes. Cada uno encaja con algo que yo he vivido construyendo este blog, su infraestructura y las herramientas que lo rodean. Estoy de acuerdo con los seis.

Pero falta un séptimo consejo. Yegge explica cómo revisar el trabajo de los agentes (la Regla de los Cinco) y cómo gestionar el trabajo en paralelo (el Merge Wall). Ninguno de los dos responde a la pregunta que viene después: ¿cómo sabes que, una vez hecho el merge, el resultado funciona de verdad?

La respuesta son los tests. Sin ellos, el swarming es solo caos rápido.

## Los seis consejos de Steve

Aquí va la versión corta. Yegge sostiene que 2026 es el Año del Superingeniero. Ingenieros que lanzan entre 50 y 100 agentes a la vez. Desarrolladores en solitario que construyen el software de una empresa entera. Sus seis consejos son el manual de operaciones de ese mundo:

1. El software es desechable.
2. La UX para agentes importa tanto como la UX para humanos.
3. Dedica el 40% a la salud del código.
4. Algunos proyectos van por delante de su tiempo.
5. La Regla de los Cinco: haz que el agente revise su trabajo cinco veces.
6. Haz swarming donde puedas, pero cuidado con el Merge Wall.

Todos aciertan. Así encaja cada uno con el trabajo que he hecho en este blog. Después, el consejo que él no incluyó.

## Consejo 1: el software es desechable

Lo que dice Yegge: el software tiene una vida útil de menos de un año. Reescribir gana a arreglar. El coste de empezar de cero cayó casi a cero cuando los agentes aprendieron a escribir código, así que la cuenta cambió. Aférrate poco al software.

Yo lo he vivido. Cuando construí la [función de suscripción](/es/posts/2026-03-16-suscripciones-de-la-idea-al-modulo-testcontainers/), fusioné sin dudar tres posts distintos sobre el recorrido en uno solo. Reescribí desde cero el Cloudflare Worker, la plantilla de Hugo y los tests de Playwright. Construí [testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/) en una sola sesión. Todo es desechable. El valor está en las decisiones de diseño y en los tests que las codifican, no en las líneas de código.

## Consejo 2: la UX para agentes importa

Lo que dice Yegge: cuesta conseguir que los agentes usen bien tus herramientas. Observa cómo fallan, añade alias, itera sobre la interfaz. La UX para agentes ya es una disciplina de diseño.

Escribí un [post entero sobre esto](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/). Las skills son personajes con contexto, no scripts con pasos. La división worker/reviewer de Ralph funciona porque cada rol tiene responsabilidades claras, límites claros y criterios de juicio claros. Blog-keeper, blog-editor y blog-planner se combinan sin prompts adicionales porque cada uno sabe quién es y qué tiene permitido hacer. Eso es UX para agentes. No botones y menús. Roles y límites.

## Consejo 3: el 40% en salud del código

Lo que dice Yegge: dedica entre el 30 y el 40 por ciento de tu tiempo a revisiones de código dirigidas por agentes. Busca code smells. Abre issues. Refactoriza cada semana. La salud del código no es un extra cuando los agentes escriben la mayor parte del código. Es lo único que lo mantiene navegable.

Yo hice una auditoría de seguridad completa del Worker de suscripción a mitad de sesión. Añadí verificación con Turnstile, validación de entradas, rate limiting y cabeceras de seguridad. Blog-keeper audita todas las referencias cruzadas en cada pasada de edición. Los tests se ejecutan en cada push. El 40% me parece más o menos acertado. Si acaso, yo dedico más. Cuando los agentes escriben código rápido, la superficie de revisión crece en proporción.

## Consejo 4: algunos proyectos llegan demasiado pronto

Lo que dice Yegge: la cognición de la IA se degrada en los límites. Algunos proyectos necesitan modelos más inteligentes que los de hoy. Mantén un backlog de "demasiado difícil" y espera unas cuantas versiones.

En el [post sobre el stack de programación con agentes](/es/posts/2026-03-20-mi-stack-de-programacion-con-agentes/), describí el nivel 6 como "todavía no está aquí". Después [construí Ralph](/es/posts/2026-03-27-de-loop-a-ci-ralph-patron-nivel-6/), que es el nivel 6. Los modelos se volvieron más listos entre que escribí el post del stack y construí Ralph. El elemento del backlog se graduó. Yegge tiene razón en que el momento importa. El truco es planificar esa graduación, no limitarse a aceptar la espera.

## Consejo 5: la Regla de los Cinco

Lo que dice Yegge: haz que el agente revise su propio trabajo cinco veces, alternando revisiones detalladas línea a línea con revisiones de arquitectura, hasta que el resultado converja. Con cinco pasadas suele bastar para alcanzar la estabilidad.

El bucle central de Ralph es literalmente esto. El worker escribe, el reviewer evalúa, el veredicto es REVISE o SHIP, y el ciclo se repite hasta cinco veces. Blog-planner entrevista durante dos o tres rondas antes de entregar un esqueleto. Blog-editor pasa una lista de comprobación que cubre front matter, estructura, tono, redundancia y referencias cruzadas. Blog-keeper valida enlaces y fechas. La convergencia está integrada en cada skill que uso. Cinco es el número correcto. Más, y el agente da vueltas en círculos. Menos, y estás entregando primeros borradores.

## Consejo 6: swarm + Merge Wall

Lo que dice Yegge: el swarming es potente, pero el merge es una pesadilla. Los workers chocan. Dos funcionalidades que modifican el mismo fichero de configuración no pueden ir en paralelo. Hace falta serializar, y el paso de reduce en la analogía con MapReduce es arbitrariamente complejo.

El [post del nivel 5](/es/posts/2026-03-23-nivel-5-en-la-practica-cuatro-agentes-cuatro-worktrees/) es un informe de campo sobre este mismo problema. Cuatro agentes, cuatro worktrees, decisiones sobre el orden de los merges. Los mismos modos de fallo que describe Yegge: tareas interdependientes que debieron ejecutarse en secuencia, agentes que dan vueltas en círculos cuando los merges crean conflictos inesperados, el esfuerzo de decidir qué PR aterriza primero. "Dos funcionalidades que modifican el mismo fichero de configuración no pueden ejecutarse en paralelo." Escribí esa frase semanas antes de leer el post de Yegge. El problema es universal.

## El consejo que falta: testing

Yegge describe la revisión (la Regla de los Cinco) y el merge (el Merge Wall). Ninguno de los dos aborda la verificación contra la realidad.

Las revisiones detectan problemas de diseño. Un revisor puede ver una mala abstracción, un caso límite que falta, una incoherencia en los nombres. Cinco pasadas de revisión convergerán en un diseño limpio. Pero las revisiones ocurren en abstracto. El revisor lee código. No lo ejecuta.

Los tests detectan problemas de ejecución. Un test puede decirte que la API devuelve un 500 cuando al payload le falta un campo obligatorio. Que la migración de base de datos falla en Postgres 15 pero pasa en la 16. Que el Worker rechaza emails con signo más aunque la RFC 5322 lo permite. Los tests ejecutan el código contra dependencias reales e informan de lo que pasa de verdad.

Sin testing, confías en que los agentes acierten tras la convergencia, sin ninguna verificación contra el mundo real. La Regla de los Cinco te da confianza en que el diseño es sólido. Los tests te dan confianza en que la implementación funciona. Son dos tipos de confianza distintos, y necesitas los dos.

## Contract testing, no tests con mocks

Los mocks hechos a mano se desvían de la API real. Escribes un stub que devuelve la respuesta que esperas. Seis meses después, la API añade un campo obligatorio al payload de la petición. Tu stub no lo sabe. Tus tests pasan. Producción se rompe.

La Regla de los Cinco aquí no te ayudará. Un agente puede revisar el mock cinco veces y concluir que se ve correcto, porque el mock es internamente coherente. El problema es que el mock ya no coincide con la realidad. Necesitas otra fuente de verdad.

El contract testing contra especificaciones reales de API lo resuelve. [Microcks](https://microcks.io/) lee una especificación OpenAPI y sirve una API simulada que devuelve las respuestas de ejemplo de esa especificación. Cuando la especificación cambia, el mock cambia. Cuando el mock cambia, tus tests detectan la diferencia.

Construí [testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/) porque quería probar la integración real con Resend, no mis suposiciones sobre ella. El módulo descarga la última especificación OpenAPI de Resend, la enriquece con ejemplos compatibles con Microcks y la carga en un contenedor de [Testcontainers](https://golang.testcontainers.org/). Dos líneas para arrancar. Una línea para obtener la URL base. Cada endpoint de la API de Resend tiene un mock que se mantiene sincronizado con la especificación. El [post sobre las suscripciones](/es/posts/2026-03-16-suscripciones-de-la-idea-al-modulo-testcontainers/) cuenta la historia completa.

El patrón se generaliza. Cualquier API con una especificación OpenAPI pública se puede probar así. Stripe, SendGrid, Twilio. La especificación es el contrato. El mock hace cumplir el contrato. Tus tests verifican tu código contra el contrato. Sin desviaciones. Sin sorpresas un domingo por la tarde, cuando el cron job del broadcast falla porque Resend cambió la forma de una respuesta.

## Testing exploratorio con agentes

Los contract tests cubren interfaces conocidas. Pero ¿y los comportamientos que a nadie se le ocurrió especificar?

La skill de [tester exploratorio](/es/posts/2026-03-11-agentes-de-codigo-como-testers-exploratorios/) convierte a un agente en algo que no se limita a ejecutar scripts, sino que se adapta, investiga y clasifica. Ejercita el software, se topa con un error inesperado, lee el mensaje, prueba una alternativa, se forma una opinión sobre la gravedad y sigue adelante. Cuando termina, una skill de project manager recopila los hallazgos en una tabla de triaje ordenada por gravedad.

Este es el principio número cinco del [manifiesto Dream QA que escribí en 2019](/es/posts/2026-03-30-dream-qa-el-manifiesto-que-escribi-en-2019/): "Testing exploratorio antes que automatizar todos los escenarios posibles." Los escenarios son infinitos. Automatiza los caminos críticos y explora el resto. Lo escribí porque creía que no se llega a una cobertura completa solo automatizando. Algunos bugs solo aparecen cuando un tester se sale del guion.

En 2019, ese principio requería testers humanos. Gente con oficio que entendía el producto lo bastante a fondo como para saber dónde estaban los límites interesantes. Los agentes son la primera tecnología que cumple esa visión a escala. Un agente con un plan de pruebas, una guía de resolución de problemas y ficheros de temas específicos de cada plataforma puede explorar una herramienta de CLI en tres sistemas operativos en una sola ejecución de CI. No se limita a encontrar bugs. Los clasifica, los deduplica frente a las issues existentes y presenta los hallazgos ordenados por lo mucho que importan.

El [post sobre Quality Assistance](/es/posts/2026-04-01-qa-significaba-una-cosa-ahora-significa-dos/) traza la línea entre los dos significados de QA. Quality Assurance es la puerta: los tests pasan o fallan. Quality Assistance es la guía: el agente explora, saca a la luz hallazgos y te deja decidir a ti. El tester no hace de barrera. Guía. Destapa problemas, los ordena por gravedad y te pasa la decisión. Esa es la segunda capa de testing que le hace falta al marco de Yegge.

## Los tests hacen que el swarming sea seguro

Aquí va la síntesis.

El Merge Wall de Yegge es un problema a nivel de código. Dos ramas tocan el mismo fichero. Surgen conflictos. Hace falta serializar. Es real, y el post del nivel 5 documenta justo lo doloroso que llega a ser.

Pero hay también un problema a nivel de comportamiento. Después de que ocho workers hagan merge de sus cambios, ¿el sistema sigue haciendo lo que debe? El código compila. Las ramas se fusionaron limpiamente. Sin conflictos. Pero el worker A cambió el formato de respuesta de una API y el worker B escribió un cliente que depende del formato antiguo. El merge sale bien. El sistema está roto. Ningún conflicto de merge te avisó de que pasaría.

La respuesta son los tests. La CI como revisor final. La batería de tests se ejecuta tras cada merge a main. Si el cambio de formato del worker A rompe el cliente del worker B, el test de integración lo detecta. No la herramienta de merge. No el revisor de código. El test.

La Regla de los Cinco hace converger el diseño. Los tests verifican la implementación. Juntos, cierran el círculo.

Sin los dos, tienes diseños sin verificar o código sin probar. Revisiones que dicen "esto parece correcto" sin pruebas de que funcione. O tests que pasan contra mocks obsoletos sin pruebas de que el diseño sea sólido. Necesitas la pila completa: convergencia del diseño mediante revisión, verificación del comportamiento mediante tests y alineación con el contrato mediante especificaciones.

Con los dos, el swarming pasa de peligroso a productivo. Los agentes escriben rápido. La Regla de los Cinco asegura que el diseño sea coherente. Los tests aseguran que la implementación sea correcta. Los contract tests aseguran que los mocks sean honestos. Los tests exploratorios encuentran lo que a nadie se le ocurrió comprobar. Cada capa atrapa lo que las demás dejan pasar.

Ese es el séptimo consejo. Prueba todo. No porque los agentes no sean fiables. Porque la velocidad sin verificación es solo caos rápido.

Y Yegge lo sabe. Su propio orquestador multiagente, [Gas Town](https://github.com/steveyegge/gastown), usa [Testcontainers para obtener resultados de test deterministas](https://github.com/steveyegge/gastown/blob/853cc8e3194e8bca472a948c57ed3801b02e373b/docs/design/dog-execution-model.md?plain=1#L17-L20). La infraestructura de testing ya está en los documentos de diseño. Lo que no estaba era el consejo en el artículo.

---

_Recursos:_
- _[Steve Yegge: Six New Tips for Better Coding With Agents](https://steve-yegge.medium.com/six-new-tips-for-better-coding-with-agents-d4e9c86e42a9)_
- _[testcontainers-go-resend](https://github.com/mdelapenya/testcontainers-go-resend/)_
- _[Microcks](https://microcks.io/)_
- _[Testcontainers for Go](https://golang.testcontainers.org/)_
