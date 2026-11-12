---
title: "Dream QA: el manifiesto que escribí en 2019"
date: 2026-03-30 09:00:00 +0100
description: "En 2019 escribí un manifiesto de calidad para mi equipo. Redefinía QA como Quality Assistance, no Assurance. Siete años después, las ideas aguantan mejor de lo que esperaba."
categories: [Technology, Software Development]
tags: ["testing", "quality", "manifesto", "team-culture"]
type: post
weight: 30
translationKey: dream-qa-the-manifesto-i-wrote-in-2019
translatedFrom: 2c2995e
---

![Dream QA: el manifiesto que escribí en 2019](/images/posts/2026-03-30-dream-qa-the-manifesto-i-wrote-in-2019/cover.png)

En 2019 era QA Team Lead en [Liferay Cloud](https://www.liferay.com/platform). Escribí un manifiesto para mi equipo que cambiaba lo que entendíamos por QA. Di dos charlas sobre él con el título "Dream QA": la primera en EURODOG (European DevOps Group), en Madrid, y la segunda en la JCCM (Junta de Comunidades de Castilla-La Mancha, el gobierno de la región donde vivo en España). No era un documento de proceso. Era una filosofía sobre cómo debe pensar un equipo la calidad, de quién es, y qué hace de verdad un equipo de QA cuando hace bien su trabajo.

Lo comparto ahora porque las ideas han resultado más actuales de lo que esperaba. No por haber sido visionario, sino porque los problemas que abordaba el manifiesto no han desaparecido. Si acaso, se han agudizado. El próximo post cuenta qué pasó cuando llegó la IA. Pero antes, el manifiesto original, con su propia voz.

## Quality Assistance, no Quality Assurance

El nombre importa. Quality Assurance sugiere una puerta de control al final del proceso. Se construye algo y luego alguien comprueba si es suficientemente bueno. Ese modelo está roto. Convierte la calidad en problema de otro.

Estamos aquí para asistir de forma proactiva a cualquier otro equipo en dos objetivos: un estándar de calidad en los productos que construimos, y un estándar de calidad en los procesos para construirlos.

Es una postura distinta. No nos sentamos al final del pipeline esperando a que algo aterrice en nuestra mesa. El proceso de QA, transversal a los equipos, corre en paralelo al de desarrollo, no después. Participamos desde el diseño hasta el despliegue. Hacemos pair con los desarrolladores. Revisamos las especificaciones antes de que se escriba la primera línea de código.

El objetivo final es que el proceso de QA y el de desarrollo acaben siendo uno solo. Sin una fase aparte, sin un equipo trabajando aislado. Un proceso, un equipo, una responsabilidad compartida. Cada persona es dueña de la calidad de su trabajo, y crear el proceso que lo hace posible también es responsabilidad de todos.

## Tres pilares: productos, procesos, personas

El manifiesto se apoya en tres pilares. Todo lo que hacemos cae bajo uno de ellos.

**Productos.** Definir quality gates concretos para cada proyecto. ¿Qué significa "suficientemente bueno para salir" en este producto en particular? No en abstracto, sino con criterios concretos y medibles. Cada producto tiene un perfil de riesgo distinto, expectativas de usuario distintas, una tolerancia a los defectos distinta. Los quality gates lo reflejan.

**Procesos.** Prestar atención a todas las tareas necesarias para diseñar, implementar, verificar, publicar, desplegar y operar. La calidad no va solo del código. Va de cómo ese código llega desde una idea hasta un sistema en marcha. ¿Cómo hacemos branching? ¿Cómo revisamos? ¿Cómo publicamos? ¿Cómo monitorizamos? Cada paso de esa cadena es una oportunidad de introducir defectos o de evitarlos.

**Personas.** Buscar las habilidades adecuadas, fomentando la responsabilidad y el sentido de propiedad. Una cultura de calidad no nace solo de herramientas o procesos. Nace de gente a la que le importa su oficio, que se hace responsable de lo que entrega y que busca activamente mejorar cómo trabaja. Contrata por eso. Forma en eso. Premia eso.

## El manifiesto de QA

El [Manifiesto Ágil](https://agilemanifesto.org/) marcó cómo pienso los compromisos. Su formato es brillante: no rechaza un lado, declara una preferencia. "Valoramos X más que Y" no significa que Y no valga nada. Significa que, cuando toca elegir, te inclines por X. Tomé prestada esa estructura para este manifiesto de QA.

Las siguientes afirmaciones resumen los objetivos y las definiciones anteriores. La primera parte de cada frase es preferible a la segunda. Eso no significa que la segunda no sea deseable: le vemos valor, pero, cuando es posible, preferimos la primera.

### 1. Tests unitarios o de integración antes que tests funcionales (UI)

Los tests de UI son extremadamente lentos y difíciles de mantener. Y suele mantenerlos el equipo de QA, lo cual es un error. Cada test de UI que se añade suma minutos al build. No escala. Empuja los tests hacia abajo en la pirámide tanto como puedas. Los tests unitarios y de integración se ejecutan en segundos, dan feedback rápido y pueden mantenerlos los desarrolladores que escriben el código.

### 2. Escribir tests en estilo BDD antes que documentación interna

Gherkin es un lenguaje de alto nivel para describir cómo debe funcionar el software. Given/When/Then. Tiende un puente entre lo que espera el product manager y lo que implementa el desarrollador. Implica a los product managers en la escritura de escenarios de test usando lenguaje natural. Cuando los escenarios son ejecutables, la documentación está siempre al día. La documentación interna se pudre. Las [especificaciones ejecutables](/posts/2026-02-26-spec-driven-development-bdd-agents) no.

### 3. Desarrolladores que escriben tests antes que testers tradicionales que testean

Antes, los testers tradicionales hacían pruebas manuales una y otra vez. Es un desperdicio: gente cualificada haciendo trabajo repetitivo. Da a los desarrolladores la capacidad de escribir y mantener tests funcionales. Entonces son ellos los responsables de que estén en verde. Cuando quien escribe el código escribe también los tests, el ciclo de feedback es el más corto posible.

### 4. Testers que programan antes que testers tradicionales que escriben tests

Queremos que los testers participen en la programación de una funcionalidad, del diseño a la implementación. No solo que escriban scripts de test. Un tester que entiende el código detecta riesgos de arquitectura, propone diseños testeables y aporta correcciones. La línea entre desarrollador y tester se difumina a propósito.

### 5. Testing exploratorio antes que automatizar todos los escenarios posibles

¿Cuántos escenarios tiene una funcionalidad? Infinitos. Entre caminos y valores posibles, la combinación no tiene límite. Automatiza los caminos críticos y haz testing exploratorio sobre el resto. El testing exploratorio es un proceso de aprendizaje cuyo objetivo es convertirte en experto del dominio. Exploras el producto, aprendes sus límites, descubres lo que la especificación no cubría. A partir de esa experiencia, podemos decidir automatizar un camino nuevo que hayamos descubierto explorando.

### 6. Verificación local antes que inspección online

El código llega mediante pull requests. Revisar PRs online está bien, pero no es lo ideal. Ves diffs. Lees código. Pero no lo ejecutas. Descarga el código, verifica en local su comportamiento en una instancia en marcha, y luego sigue adelante o haz rollback. Un sistema en ejecución te cuenta cosas que un diff nunca te contará.

### 7. Cobertura de funcionalidades antes que cobertura de código

La cobertura de código es una trampa. Unos tests que ejecutan el 100% del código pero sin ninguna aserción te dan un 100% de cobertura y cero confianza. Ese número te dice cuánto código se ha ejecutado, no cuánto comportamiento se ha verificado. La cobertura de funcionalidades se logra combinándola con escenarios en estilo BDD. Podemos decidir si publicamos según umbrales de cobertura de funcionalidades: ¿están verificados los recorridos críticos del usuario?

### 8. Confirmar que los requisitos no se rompen antes que confirmar el happy path

El código sin tests está roto por defecto. Si funciona, funciona solo en el happy path, o funciona por casualidad. Es importante demostrar que la funcionalidad no está rota, no solo que funciona cuando todo sale bien. Prueba los límites. Prueba los casos de error. Prueba qué pasa cuando el usuario hace algo inesperado. Ahí es donde viven los bugs de verdad.

## El papel del equipo de QA

Entonces, ¿qué hace realmente el equipo bajo este modelo?

Desarrollamos un conocimiento profundo del producto. Sabemos distinguir entre un bug y una funcionalidad. Suena a broma, pero es una de las cosas más valiosas que aporta un equipo de QA. Somos la referencia de cómo se espera que funcione el producto, la memoria viva de cada decisión, de cada compromiso, de cada caso límite.

Participamos en todas las fases del ciclo de vida: diseño, implementación, verificación, publicación, despliegue, operación. No solo en la fase de testing. Estamos en la sala cuando se diseñan las funcionalidades porque sabemos qué va a costar testear, qué se va a romper y qué va a hacer realmente el usuario.

No somos responsables de que el 100% de la suite de tests pase. Esa responsabilidad es del equipo. Nuestro trabajo es encontrar funcionalidades sin cubrir, aumentar la cobertura y subir la confianza. Cuando la suite de tests falla, tenemos la autoridad para levantar la mano y parar las máquinas. El build está en rojo. Nadie hace merge hasta que vuelva a verde.

Participamos en la Definition of Done como ciudadanos de primera. Hecho significa testeado. Hecho significa documentado a través de tests. Hecho significa listo para publicar.

Hacemos análisis de causa raíz. Cuando algo falla, reproducimos el fallo, señalamos el commit culpable y enviamos correcciones o informes detallados. No solo "está roto". Esto es por qué está roto, esto es cuándo se rompió, este es el commit que lo introdujo.

Los tests son documentación. Son la documentación más válida y más viva del producto. Se versionan junto al código de producción y crean especificaciones vivas que evolucionan con el sistema. Cuando alguien pregunta "¿cómo funciona esta funcionalidad?", la respuesta está en la suite de tests.

## La automatización es una herramienta, no un objetivo

Calidad no significa automatizar casos de test. La automatización no es un objetivo, es una herramienta. Los escenarios son infinitos en caminos y valores posibles. Automatizarlo todo no es posible, no es económico y ni siquiera es deseable.

Cubramos con automatización las funcionalidades más críticas para el usuario. Identifica con Product Management los escenarios críticos, los que, si se rompen, dejan el producto inservible. Ejecuta esos tests críticos en las pull requests para reducir el tiempo de build y cazar regresiones pronto. Añade testing manual y exploratorio para cubrir el resto.

Un bug encontrado en producción es carísimo en tiempo y en dinero. Intentemos romper la funcionalidad cuanto antes. Cuanto antes encuentras un defecto, más barato es corregirlo. No es una idea nueva, pero es de las que los equipos olvidan en cuanto les aprieta un plazo.

Y calidad tampoco significa solo escribir tests. Significa también: gestión de dependencias, versionado correcto (por ejemplo con [SemVer](https://semver.org/)), estrategia de branching, gestión de releases, métricas, colaboración abierta con otros equipos, difundir el conocimiento. La calidad es una propiedad del sistema entero: el código, el proceso y las personas.

## Buenas prácticas

**Implica a los Product Managers en la escritura de escenarios de test.** Usa BDD. Usa Gherkin. Usa Given/When/Then. Cuando los Product Managers escriben escenarios, aclaran sus propios requisitos. Cuando esos escenarios son ejecutables, el equipo tiene una definición compartida y sin ambigüedades del comportamiento esperado.

**La revisión por pares es obligatoria.** Las pull requests son obligatorias. Nada de merges directos a master. Cada cambio pasa por un segundo par de ojos. No como burocracia, sino como un mecanismo de calidad que caza errores, reparte conocimiento y mejora el código con el tiempo.

**Pipelines de quality gates.** Cada commit dispara: compilación, tests unitarios, generación de artefactos, notificaciones. Si cualquier paso falla, el pipeline se detiene. Se avisa al equipo. La calidad se impone de forma automática, no a base de fuerza de voluntad.

**Umbrales de releasabilidad.** Product Management define el límite inferior de calidad aceptable. El equipo de producto define el límite superior al que aspira. El rango entre ambos es la tolerancia. Si la calidad cae por debajo del límite inferior, no publicamos. Claro, medible, innegociable.

**Métricas.** Mide lo que importa: Release Test Failures (RTF), defectos escapados, categorías de defectos, cycle time. Los números no mienten. Muestran tendencias, señalan las zonas con problemas y dan datos al equipo para mejorar. La intuición no es una estrategia de calidad.

**Release trains.** Antes de la entrega continua, sé predecible con las releases. Establece una cadencia. Reduce el trabajo no planificado. Un calendario de releases predecible obliga al equipo a acotar bien el alcance, a testear pronto y a tomar decisiones difíciles sobre qué entra y qué no. La predictibilidad es requisito previo de la fiabilidad.

## Siete años después: estas prácticas llegan al desarrollo con agentes

Escribí este manifiesto en 2019, antes de que existieran los agentes de código. Antes de que una IA pudiera escribir tests, revisar pull requests o explorar un producto buscando bugs. Ahora que el desarrollo con agentes está aquí, toca preguntarse si estas buenas prácticas siguen en pie. La respuesta me sorprendió. No solo siguen en pie, sino que importan más.

**BDD con Product Managers.** Cuando el manifiesto pedía que los PMs escribieran escenarios de test en Gherkin, el cuello de botella era la traducción: convertir requisitos de negocio en especificaciones ejecutables. Los agentes cierran esa brecha. Un PM puede describir un escenario en lenguaje natural y un agente puede generar el Given/When/Then. La práctica escala de una forma que no era posible cuando cada escenario había que redactarlo a mano.

**Revisión por pares.** El manifiesto exigía un segundo par de ojos en cada pull request. Con agentes, la pareja evoluciona: los agentes revisan el código de las personas y las personas revisan el código de los agentes. El principio es idéntico (ningún cambio sin comprobar), pero el volumen se dispara. La persona que revisa puede centrarse en la intención y el diseño mientras el agente caza los problemas mecánicos.

**Pipelines de quality gates.** Los agentes aceleran el desarrollo. El código se escribe más rápido, las PRs llegan con más frecuencia y crece la tentación de hacer merge deprisa. Eso hace que los quality gates automáticos sean más críticos, no menos. Cada commit sigue disparando compilación, tests, generación de artefactos y notificación. El pipeline es la red de seguridad que permite a los equipos ir rápido sin romper nada, y los agentes hacen mucho más rápida la parte de "ir rápido".

**Umbrales de releasabilidad.** Los agentes pueden evaluar la cobertura de funcionalidades de forma dinámica, razonando si los recorridos críticos del usuario están verificados en lugar de fiarse de un número estático de cobertura de código. El concepto de umbral se mantiene, pero la medición se vuelve más inteligente. Un agente que entiende el producto puede decirte "esta funcionalidad está cubierta al 80% por escenarios BDD" de una forma en que una herramienta de cobertura nunca podría.

**Métricas.** Los agentes destacan analizando tendencias entre releases, prediciendo las zonas propensas a defectos a partir de la rotación del código y de los patrones de cobertura, y sacando a la luz los números que importan. El manifiesto decía "la intuición no es una estrategia de calidad". Los agentes hacen viable tomar decisiones de calidad basadas en datos a una escala que el seguimiento manual nunca alcanzó.

**Release trains.** Una cadencia predecible sigue importando con agentes. Lo que cambia es el ritmo: los agentes producen código tan deprisa que está surgiendo una cultura de arreglar hacia delante (fix-forward). Los merges a main son más frecuentes. Algunos equipos se preguntan si las pull requests siguen teniendo sentido cuando los agentes pueden producir, testear y hacer merge del código en minutos. Si las PRs desaparecen, los quality gates pasan a ser lo único que separa un commit de producción. El tren de releases no desaparece, pero los quality gates a lo largo de la vía importan aún más cuando el tren va a mayor velocidad.

---

_Recursos:_
- _[Diapositivas de Dream QA, GDG Toledo](/slides/2019-02-28-gdg-toledo-dream-qa/Dream-QA-JCCM.pdf)_
- _[Diapositivas de Dream QA, EURODOG Madrid](/slides/2019-03-07-eurodog-madrid/Dream-QA-EURODOG.pdf)_
