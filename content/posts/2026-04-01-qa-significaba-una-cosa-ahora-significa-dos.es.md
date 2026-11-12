---
title: "QA significaba una cosa. Ahora significa dos"
date: 2026-04-01 09:00:00 +0100
description: "QA siempre ha sido Quality Assurance: los tests pasan o fallan, el build está en verde o en rojo. Los agentes de IA añaden un segundo significado: Quality Assistance. Pasar de guardián a guía no sustituye a los tests. Suma criterio."
categories: [Technology, AI, Software Development]
tags: ["testing", "coding-agents", "quality", "developer-experience"]
type: post
weight: 30
translationKey: quality-assurance-vs-quality-assistance
translatedFrom: 110fed2
---

![Quality Assurance vs Quality Assistance](/images/posts/2026-04-01-quality-assurance-vs-quality-assistance/cover.png)

QA siempre ha significado una cosa. Ahora significa dos.

Pasé años construyendo Testcontainers, una librería cuyo único propósito son los tests de integración deterministas. Levantas una base de datos real en un contenedor, ejecutas tus aserciones y lo destruyes. Pasa o falla. Verde o rojo. Eso es Quality Assurance (aseguramiento de la calidad): el modelo de la puerta. Funciona mientras controlas el volumen de código que pasa por ella.

Luego construí una [skill de tester exploratorio](/es/posts/2026-03-11-agentes-de-codigo-como-testers-exploratorios/) que convierte a un agente de código en otra cosa. No hace aserciones. Explora. No pasa ni falla. Saca a la luz hallazgos, los ordena por severidad y me deja decidir qué importa. Eso es Quality Assistance (asistencia a la calidad). Mismas siglas, otro trabajo.

Pasar de una a otra no es un reemplazo. Es una pila.

## QA siempre ha significado una cosa

Quality Assurance es la puerta. Los tests afirman el comportamiento esperado. La CI lo hace cumplir. El pipeline se detiene si algo falla. Escribes un test que dice "este endpoint devuelve 200 con un token válido". Si no lo hace, el build se rompe. Nadie hace merge.

Este modelo nos ha servido bien durante décadas. Es la base de cualquier equipo de software serio. Y descansa en un principio que escribí en un [manifiesto de QA en 2019](/es/posts/2026-03-30-dream-qa-el-manifiesto-que-escribi-en-2019/), cuando di una charla llamada "Dream QA" en la JCCM: un bug encontrado en producción es caro. Si lo pillas antes, cuesta menos. Si lo pillas en la puerta, cuesta casi nada.

La puerta funciona cuando son personas quienes escriben todo el código y el volumen es manejable. Un desarrollador, una PR, un ciclo de revisión. La puerta tiene tiempo para hacer su trabajo.

## El problema del volumen

En el [nivel 5](/es/posts/2026-03-23-nivel-5-en-la-practica-cuatro-agentes-cuatro-worktrees/), cuatro agentes hacen push de código en paralelo. Cada push necesita revisión. Cada revisión necesita contexto. Cada rama necesita CI. La puerta no se vuelve más lenta, pero la cola que tiene delante se alarga, y rápido.

El aseguramiento tradicional da por hecho que una persona puede revisar cada cambio con cuidado. Cuando cuatro agentes abren PRs antes de comer, esa suposición se rompe. No porque los tests dejen de funcionar, sino porque solo cubren lo que a alguien se le ocurrió escribir. Y cuando el código fluye más rápido de lo que las personas pueden pensar aserciones, los huecos entre los tests se ensanchan.

Este es el punto de presión. No es que el aseguramiento falle. Es que no puede escalar su cobertura al ritmo del volumen. Pruebas lo que se te ocurrió. Se te escapa lo que no.

## Asistencia: el segundo significado de QA

Quality Assistance. El agente no hace de puerta. Guía.

La skill de tester exploratorio que construí destapa problemas, ordena por severidad, sugiere causas raíz y me deja decidir a mí. No detiene el build. No bloquea el merge. Me cuenta lo que ha encontrado y me pregunta qué quiero hacer al respecto.

No es una idea nueva. En aquella charla de Dream QA, el [manifiesto que presenté](/es/posts/2026-03-30-dream-qa-el-manifiesto-que-escribi-en-2019/) lo definía de forma explícita: "Este documento define la calidad y la 'Quality Assistance' (no Assurance) para una organización de desarrollo." El principio central era: "Estamos aquí para asistir a cualquier otro equipo, de forma proactiva, en la consecución de dos objetivos principales." El proceso de QA transversal corre en paralelo al de desarrollo, no al final.

La terminología fue premonitoria. En 2019 describía un rol humano: ingenieros de QA integrados en los equipos, que guiaban en lugar de custodiar la puerta. La tecnología para escalar esa guía más allá de lo que una persona puede abarcar todavía no existía. Ahora sí. Un agente que lee tu código, pone a prueba tu software, saca a la luz lo que encuentra y lo ordena según lo que importa hace exactamente lo que describía aquel manifiesto. Solo que no necesita mesa.

## De Testcontainers al tester exploratorio

Lo que hace que esto sea real para mí es el recorrido personal.

Testcontainers es aseguramiento puro. Levantas un contenedor de Postgres real, ejecutas tus consultas, compruebas los resultados y lo destruyes. Determinista. Repetible. Pasa o falla. Ayudé a construirlo porque creo que los tests deben ejecutarse contra dependencias reales, no contra mocks. Esa creencia no ha cambiado.

El [tester exploratorio](/es/posts/2026-03-11-agentes-de-codigo-como-testers-exploratorios/) es asistencia pura. Pone a prueba el software, se adapta cuando pasa algo inesperado, se forma una opinión sobre la severidad y me entrega una tabla de triaje. Adaptativo. Basado en el criterio. Ordenado por severidad. Sin el binario pasa/falla.

Construí los dos. Y el puente entre ambos siempre estuvo ahí, en el [principio número cinco del manifiesto](/es/posts/2026-03-30-dream-qa-el-manifiesto-que-escribi-en-2019/#5-exploratory-testing-over-automating-all-possible-scenarios): "Testing exploratorio por encima de automatizar todos los escenarios posibles." Lo escribí en 2019 porque creía que no se llega a una cobertura completa solo automatizando. Hay bugs que únicamente aparecen cuando alguien se sale del guion, prueba la entrada rara, hace clic dos veces en el botón, ejecuta el comando en un orden para el que nadie diseñó nada.

Siempre creí en la exploración. Ahora la hace un agente.

## Una pila, no un reemplazo

Aseguramiento sin asistencia son puntos ciegos. Pruebas lo que se te ocurrió. Se te escapa lo que no. Tu suite de tests es exhaustiva con los escenarios conocidos y muda ante los desconocidos.

Asistencia sin aseguramiento son opiniones sin evidencias. El agente ha encontrado algo sospechoso, pero ¿puedes reproducirlo? ¿Es un bug real o una rareza del entorno? Sin un test determinista que confirme el hallazgo, confías en el criterio del agente sin red de seguridad.

La respuesta correcta son las dos. El aseguramiento como cimiento. La asistencia como capa superior.

Los tests cazan las regresiones conocidas. Los agentes encuentran las desconocidas. La suite de Testcontainers te dice que la migración de la base de datos sigue funcionando. El tester exploratorio te dice que la CLI se cae cuando pasas un carácter Unicode en el nombre del proyecto, algo para lo que a nadie se le ocurrió escribir un test.

Cuando el agente encuentra algo real, se convierte en un test. El hallazgo de asistencia asciende a aserción de aseguramiento. La pila crece. Los puntos ciegos se encogen. Ese es el ciclo.

## Qué cambia para el rol de QA

El [manifiesto de Dream QA](/es/posts/2026-03-30-dream-qa-el-manifiesto-que-escribi-en-2019/) decía: "Testers que programan por encima de testers tradicionales que escriben tests." Era el principio número cuatro. Significaba que los profesionales de QA debían ser ingenieros, no ejecutores manuales de scripts. El valor estaba en el criterio y en el código, no en ir haciendo clic por planes de pruebas.

La era de la IA añade una capa: testers que supervisan agentes por encima de testers que ejecutan scripts.

Es el mismo cambio que describí en el [post del Autopilot de Tesla](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot), pero aplicado a la calidad. El trabajo del desarrollador pasó de escribir código a supervisar agentes que escriben código. El del profesional de QA pasa de ejecutar tests a supervisar agentes que hacen testing.

Los profesionales de QA pasan a ser quienes definen qué explora el agente. Escriben las [skills](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/), los planes de pruebas, las guías de resolución de problemas. Hacen el triaje de lo que encuentra el agente. Deciden qué se convierte en un test automatizado y qué se registra como issue. El rol sigue siendo criterio. Quien ejecuta ahora es un agente.

El [principio tres del manifiesto](/es/posts/2026-03-30-dream-qa-el-manifiesto-que-escribi-en-2019/#3-developers-who-write-tests-over-traditional-testers-who-test) decía: "Desarrolladores que escriben tests por encima de testers tradicionales que hacen testing." La actualización: desarrolladores que definen roles de testing para agentes, por encima de desarrolladores que escriben casos de test sueltos. El caso de test sigue teniendo valor. Pero la definición de un rol escala más lejos.

## Los dos significados, juntos

QA siempre ha significado Quality Assurance. En la era de la IA, también significa Quality Assistance. La puerta no desaparece. El guía se sienta a su lado.

Los tests pasan o fallan. Los agentes exploran y hacen triaje. El build está en verde o en rojo. Los hallazgos se ordenan por severidad. Lo uno es determinista. Lo otro es criterio. Necesitas las dos cosas.

El cambio no sustituye nada. Suma.

---

_Recursos:_
- _[Diapositivas de Dream QA, GDG Toledo](/slides/2019-02-28-gdg-toledo-dream-qa/Dream-QA-JCCM.pdf) (PDF)_
- _[Dream QA: el manifiesto que escribí en 2019](/es/posts/2026-03-30-dream-qa-el-manifiesto-que-escribi-en-2019/), los ocho principios completos_
- _[Testcontainers](https://testcontainers.com/): tests de integración deterministas con dependencias reales_
