---
title: "ContainerDays 2025: mi experiencia"
date: 2025-09-17 10:00:00 +0530
description: "ContainerDays se celebra en Hamburgo (Alemania), uno de los puertos más grandes del mundo. Hay contenedores por todas partes, y esta conferencia es el sitio perfecto para aprender sobre ellos."
categories: [Containers, Docker, Go]
tags: ["go", "containers", "docker", "containerdays", "conference"]
type: post
weight: 26
translationKey: containerdays
translatedFrom: a3fb10f
---

![Un puzle que representa el puerto de Hamburgo](/images/posts/2025-09-17-containerdays/cover.jpg)

> Ninguna IA ha sufrido daños en la elaboración de este post. Bueno, un poquito, por completar frases. Pero hoy en día eso es normal, ¿no?

Este post es el registro de mi primera experiencia en la conferencia ContainerDays, que se celebró en Hamburgo (Alemania) del 10 al 12 de septiembre.

En abril, alguien de la comunidad de Testcontainers me preguntó si me interesaría dar una charla en ContainerDays. Él pensaba enviar una propuesta sobre el tema y quería hablarlo antes conmigo, por si acababa cambiando de tema y presentando otra. Además, sería una gran oportunidad para conocernos, porque nunca nos habíamos visto en persona. Presenté mi propuesta al Call for Papers, ¡y me aceptaron! Mi charla se titulaba "_Delightful Integration tests in Go_", y me hacía mucha ilusión poder darla en la conferencia.

## La organización

Lo primero que tengo que decir es que la organización fue muy buena. La sede estaba en el centro de la ciudad, en un edificio de estilo industrial muy alemán, [Kampnagel](https://maps.app.goo.gl/xY4CEn9cUf8znwH16), y el hotel estaba a pocas manzanas (15 minutos andando). Como ponentes, nos cuidaron muy bien, con todo el apoyo necesario para dar la charla. [Mar](https://www.linkedin.com/in/mar-benaiges-escrigas/) fue la organizadora principal, y estuvo siempre atenta y dispuesta a ayudar con cualquier petición. Ella y su equipo se mostraron cercanos en todo momento y ofrecieron una gran experiencia, tanto a ponentes como a asistentes. Yo mismo le di las gracias por su trabajo.

## La cena de ponentes

Organizaron una cena para los ponentes ese lunes, y lo pasamos genial, con mucha comida, mucha bebida y muchas conversaciones interesantes. Las tuve con [Misha](https://www.linkedin.com/in/mikhailbragin/), fundador de [Netbird](https://netbird.io/), con [Ajitem](https://www.linkedin.com/in/ajitem/), otro ponente del track de Go, y con [Alessio](https://www.linkedin.com/in/alessio-diamanti-92t/) y [Adrian](https://www.linkedin.com/in/adrian-kurt/), dos ingenieros de Swisscom.

Durante la cena también conocí a dos personas importantes de la comunidad de Testcontainers, [Alex Pliutau](https://www.linkedin.com/in/pliutau/) y [Nikolay Kuznetsov](https://www.linkedin.com/in/nkuznetsov/). Aunque no envíen commits, son contribuidores muy activos de Testcontainers para Go. ¿Por qué? Porque contribuir al OSS no es solo enviar código. Es formar parte de la comunidad y ayudar a los demás, y ellos lo hacen a menudo dando charlas y grabando vídeos sobre este proyecto que tanto quiero. Así que no se me ocurre nadie que merezca más una camiseta de Testcontainers que ellos.

{{< flex-gallery 
    src_1="speakers-dinner.jpg" 
    alt_1="La cena de ponentes, con una deliciosa comida india"
    caption_1="La cena de ponentes, con una deliciosa comida india."
    src_2="dinner-menu.jpg"
    alt_2="¡Ñam, ñam!"
    caption_2="¡Ñam, ñam!"
    src_3="badge.jpg"
    alt_3="Mi acreditación de la conferencia"
    caption_3="Mi acreditación de la conferencia."
    src_4="nikolay-tshirt.png" 
    alt_4="Nikolay con su camiseta de Testcontainers"
    caption_4="Nikolay con su camiseta de Testcontainers."
    src_5="with-alex.jpeg" 
    alt_5="Con Alex Pliutau, después de su charla de aquel miércoles"
    caption_5="Con Alex Pliutau, después de su charla de aquel miércoles."
    src_6="finnish-cup.jpg" 
    alt_6="Una taza preciosa que me regaló Nikolay, directamente desde Finlandia. ¡A mis hijos les encantó!"
    caption_6="Una taza preciosa que me regaló Nikolay, directamente desde Finlandia. ¡A mis hijos les encantó!"
>}}

## La conferencia

En palabras de una pregunta anónima en el panel de Slido, esta conferencia es "la mejor KubeCon a la que has asistido". Y es totalmente cierto. La mayoría de las charlas fueron sobre Kubernetes, y unas cuantas sobre Go, con un track dedicado a este lenguaje el segundo día. Mi charla, "_Delightful Integration tests in Go_", formaba parte de ese track, así que decidí quedarme en la sala K4 todo el segundo día.

La sede tenía 5 salas (K6, K2, K1, P1 y K4), siendo K4 la del track de Go y K6 la sala principal. Puedes consultar la agenda de la conferencia [aquí](https://www.containerdays.io/containerdays-conference-2025/agenda/).

### Día 1

El primer día asistí a estas charlas:

- [K6] Breaking Free with Open Standards: OpenTelemetry and Perses for Observability, de Kasper Borg Nissen (Dash0)

Buena introducción a OpenTelemetry y al problema del vendor lock-in, que se resuelve usando OpenTelemetry. Una charla introductoria muy buena, sobre todo por no mencionar a ningún proveedor.

- [K2] Dynamic OCI Registry, de Alvaro Hernandez (OnGres)

Una charla interesante sobre cómo resolver un problema con el que ya me encontré hace casi 10 años, y que parece que sigue sin resolverse. El ponente presentó una solución a medida: un registry propio con cierta lógica de negocio para resolver imágenes Docker. Las referencias de imagen pueden contener varias "partes" después del tag, de forma que el registry es capaz de interpretarlas y cargar cada parte como un artefacto OCI. Así resolvió el caso de múltiples extensiones de Postgres, con toda la combinatoria para detectar qué extensiones son compatibles y cuáles no. Por ejemplo: `docker pull postgres--16.3/e/pluginA--1.2.3/pluginB--4.5.6`.

Me acordé de este problema de cuando trabajaba en Liferay, donde cada imagen base del producto Liferay Portal podía contener varios plugins que ampliaban las capacidades del portal. ¿Cómo etiquetas la imagen resultante?

Compartí las slides con el equipo de Hub, a ver si podemos abrir una conversación sobre este tema.

- [K1] Shrinking Container Images - Security Chaos Engineering with Container Images, de Thomas Fricke
- [K6] Why are we still talking about containers? Keynote de Kelsey Hightower

La mejor charla de la conferencia. Tengo ganas de ver el vídeo, y si te interesan los contenedores y Docker, a ti también te debería pasar. Pero aquí no voy a hacer spoiler. Solo te cuento que lo abordé después de la charla y caminé a su lado hablando durante 5 minutos, mientras él se movía a otro sitio. Fue muy amable y cercano. ¿Sabes qué? Mencionó Testcontainers como un proyecto clave del ecosistema Docker, y eso sin que yo le dijera que soy uno de los maintainers. ¡E S P E C T A C U L A R!

- [K6] Engineering Velocity, Building Trust: DevOps in 2025, de Stephan Stapel (Hermes Germany GmbH)

Agradezco el tiempo que se tomó el ponente para explicar las tres vías de DevOps, basadas en el libro "The DevOps Handbook", un libro de 2016.

- [K2] Hijacking DNS Port 53 with eBPF & XDP for Remote K8s Access, de Misha Bragin (Netbird)

Fui a apoyar a Misha, que durante la cena de ponentes me preguntó cómo se puede medir el impacto de una charla en el negocio. Le dije sin más que es imposible, o al menos yo todavía no he conseguido correlacionarlo. Netbird es una empresa que ofrece tanto un proyecto OSS como un servicio alojado, y él presentó los problemas que Netbird resolvió como proyecto OSS. Como maintainer de un proyecto OSS, solo puedo conocer ciertas métricas, como las estrellas en GitHub, las descargas y clones, los imports en repositorios públicos, la adopción en frameworks, etc. Pero es muy complicado correlacionarlas con el impacto en el negocio. A menos que añadas telemetría al proyecto OSS, de forma muy transparente y honesta, de modo que los usuarios puedan elegir (opt-in) enviar datos de telemetría a la empresa, y así la empresa pueda medir el impacto.

Como recordatorio sobre el tema, el equipo de Go abrió una discusión para añadir telemetría a la toolchain de Go: https://github.com/golang/go/discussions/58409. 95 comentarios, 394 respuestas, un montón de votos a favor, un montón de votos en contra... Y al final, el equipo de Go decidió añadir telemetría a la toolchain de Go.

Después de las charlas hubo una fiesta, con cena, bebida y música en directo. Lo pasé muy bien y conocí a mucha gente del evento. Entre los contactos interesantes estuvo [Sohan Maheswar](https://www.linkedin.com/in/sohanmaheshwar/), devrel en AuthZed, la empresa que desarrolla SpiceDB. Tenemos un módulo de la comunidad para SpiceDB en Testcontainers para Go, así que nos conectamos en LinkedIn y quedamos en trabajar juntos en un post o un vídeo de YouTube sobre testing con SpiceDB.

### Día 2

El segundo día asistí a estas charlas, todas en el track de Go:

- [K4] API-First: Because Life's Yoo Short for Boilerplate, de Artur Iablokov (Lufthansa Industry Solutions)

Una lightning talk, pero buena. El ponente presentó una forma de generar clientes de API para distintos lenguajes de programación a partir de la especificación OpenAPI, incluyendo el proyecto oapi-codegen.

- [K4] Trash Talk: Stacks, Heaps and the Art of Garbage Collection, de Aleksandr Rybolovlev (HashiCorp)

Una inmersión profunda en la gestión de memoria en Go, el escape analysis y los distintos algoritmos que usa el GC. Espero al vídeo para refrescar la memoria con ella.

- [K4] Terminating elegantly: a guide to graceful shutdown, de Alex Pliutau (Binarly)

Otra muy buena. Alex explicó las consecuencias de no terminar de forma ordenada y las distintas maneras de hacerlo. Disfruté mucho con los ejemplos prácticos que compartió.

- [K4] Demistifying Containers: Building a Container Runtime from Scratch, de Ajitem Sahasrabuddhe (Technogise)

¡Y otra más! Al menos para mí. Contenedores y Go: simplemente me atrapó. ¡Mi charla va a parecer un desastre comparada con las que se presentaron! Docker puso los contenedores al alcance de los desarrolladores hace 10 años, y Ajitem compartió cómo crearlos programáticamente en Go. Puedes encontrar el código fuente [aquí](https://github.com/asahasrabuddhe/gcr).

- [K4] Time to Backend: The Hidden Delay in Your Application's Request Journey, de Andrii Raikov (Delivery Hero SE)

Reconozco que esperaba más Go en esta charla. Fue un ejemplo fascinante de cómo trazar peticiones a través de las distintas capas de la infraestructura, pero yo la habría movido a un track de Observabilidad, porque no había nada de código Go.

- [K4] Revisiting the Outbox Pattern, de Nikolay Kuznetsov (Zalando Finland)

Nikolay hizo un gran trabajo presentando el Outbox Pattern y cómo se puede usar para conseguir consistencia eventual en sistemas distribuidos, más concretamente en el contexto de PostgreSQL. Por favor, mira el vídeo de esta charla, es muy buena.

- [K4] Memory Leaks in Go: Manage Your Resources Better, de Alexandre Cabral (Stone Co.)

Una charla parecida a la de Aleksander Rybolovlev, pero también interesante. Alexandre compartió cómo detectar memory leaks en Go y cómo arreglarlos.

- [K4] Delightful Integration tests in Go, de Manuel de la Peña (Docker)

Mi charla. Puedes encontrar las slides [aquí](/slides/2025-09-17-containerdays/Delightful-Integration-tests-in-Go.pdf). Empecé con una pequeña historia sobre cómo dos desarrolladores empezaron su proyecto y todo funcionaba en sus ordenadores. Añadieron una build, pero no funcionaba en producción. Entonces añadieron un entorno de Staging, pero siempre era inestable y nunca estaba sincronizado con producción. Todo ello con una referencia bíblica a la creación del mundo. Creo que es una buena historia para empezar, y una buena forma de introducir el tema de los tests de integración. El feedback fue positivo, así que estoy contento de haber conseguido darla por fin de esta manera. Por favor, mira el vídeo de la charla y dime qué te parece.

Pero déjame dar un paso atrás. Antes de mi charla, Ajitem se me acercó y me enseñó una pull request que acababa de enviar al proyecto Testcontainers para Go. Resolvía un bug sencillo en el módulo de Kafka, que no interpretaba bien los nombres de imágenes Docker que no seguían el formato de Semantic Versioning. ¿Qué puede haber mejor que eso? Esto es implicación pura con la comunidad. Ni siquiera querían aprender Testcontainers, pero encontraron un problema y lo arreglaron. Este es el poder de la comunidad OSS.

- [K4] Master of Resources: Building Kubernetes Operator in Go, de Michael Morlock y Vincent Welker (Atix AG)

Justo después de dar tu charla, te sientes como si te hubiera atropellado un camión. Así que me quedé descansando fuera y no pude asistir a esta. Esperaré al vídeo para verla.

Ese día también hubo fiesta. Esta vez elegí los food trucks junto al río. ¡Qué bien! Probé el de los bowls y estaba delicioso. Allí compartí rato con otros asistentes y ponentes. Disfruté especialmente hablando de países, culturas e idiomas con Nikolay y con [Aleksander Rybolovlev](https://www.linkedin.com/in/arybolovlev/). ¿Y sabes qué? Acabamos hablando del Imperio romano...

Hay que destacar que la conferencia tuvo otro evento: un torneo de futbolín contra la campeona del mundo [Linh Tran](https://en.wikipedia.org/wiki/My_Linh_Tran), del equipo alemán. Yo me puse a las barras del futbolín y a ella le bastaron 8 segundos para marcar un gol. Yo ni siquiera conseguí pasar la bola de mis medios a mis delanteros. Sin quejas, ella es la mejor. El ganador aguantó el marcador hasta 1 minuto y 53 segundos. ¡Enhorabuena!

Algunas fotos del segundo día:

{{< flex-gallery 
    src_1="k4.jpg" 
    alt_1="Esta es la sala K4"
    caption_1="Esta es la sala K4."
    src_2="my-talk-from-nikolay.jpeg" 
    alt_2="Este es Nikolay viendo mi charla"
    caption_2="Este es Nikolay viendo mi charla."
    src_3="with-aleksander.jpg" 
    alt_3="Con Aleksander Rybolovlev"
    caption_3="Con Aleksander Rybolovlev."
    src_4="https://scontent-mad1-1.xx.fbcdn.net/v/t51.82787-15/549217900_18283672360286519_7025945472927251682_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=9KJF-5Hgf-AQ7kNvwHUxUAe&_nc_oc=AdlD_tPmhfbRnmHy0VHgsan1bOUGuET7YryhuABmQ49-aome70097IVJUpNs-948rvU&_nc_zt=23&_nc_ht=scontent-mad1-1.xx&_nc_gid=b7uX7nbqSipIb0Rcu6pTcA&oh=00_AfZdcvGyNq6Pqe3tmxt3by-24usqN25LeGPORilJBZht4A&oe=68D0750F" 
    alt_4="Linh Tran, la campeona del mundo"
    caption_4="Linh Tran, la campeona del mundo."
>}}


### Día 3

El último día fue algo más tranquilo, porque la conferencia era de media jornada. Asistí a estas charlas:

- [K1] Simplifying cross-cluster connectivity with Dapr & Cilium, de Manuel Zapf (codecentric AG)

Dapr me interesa especialmente, porque en Testcontainers tenemos buena relación con Diagrid en general, y con Mauricio Salatino en particular. Quería saber cómo se usa en producción y, sin sorpresa por mi parte, el ponente mencionó Testcontainers como la forma de testear aplicaciones Dapr. ¿A que mola?

- [K2] Kyverno Deep Dive: Debugging, Testing and Monitoring, de Marie Padberg (infologistix)

Kyverno es un motor de políticas para Kubernetes y yo, con mentalidad de tester, quería aprender cómo se testea la incorporación de esas políticas. Podría ser cómodo aprovechar el módulo de k3s de Testcontainers para Go, ya que tienes un contenedor Docker ejecutando un clúster de Kubernetes. Bastaría con aplicar la política y comprobar si Kyverno es capaz de hacerla cumplir. Curiosamente, conocí al maintainer de Kubewarden, [Víctor Cuadrado Juan](https://www.linkedin.com/in/viccuad/), otro proyecto que ofrece un motor de políticas para Kubernetes, y que ya usa Testcontainers para Go para testear eso. ¡Genial! Puedes encontrar el código fuente [aquí](https://github.com/kubewarden/kubewarden-controller/blob/3c5e2fd8cc68c592f833539d42c5a92624839293/internal/controller/suite_test.go#L76-L98). También veré en YouTube la charla de Víctor, que presentó una sobre políticas de clúster con Kubewarden.

- [P1] Breaking barriers with Dapr: Simplified and Portable Cloud-Native Architectures, de Hajed Khlifi y Albrecht Jérémy (Proximus Luxembourg)

Dapr está en todas partes, y es una gran forma de simplificar el desarrollo de aplicaciones cloud-native. Los ponentes presentaron cómo usar Dapr para simplificar el desarrollo de aplicaciones multicloud, desde Docker Compose hasta AWS, Azure y GCP, ¡sin cambiar nada del código! Un gran proyecto para investigar y seguir.

- [K4] Smell Like Clean Telemetry: Stop the Noise, Create Better Spans, de Juliano Costa (Datadog)

Como vengo del mundo de la Observabilidad, esta charla me interesaba. El título, inspirado en la famosa canción de Nirvana "Smells Like Teen Spirit", era muy pegadizo. El resto de las slides seguían la misma temática, así que me enganchó desde el principio. Otra charla para volver a ver cuando se publique.

La conferencia terminó, así que comí allí y me fui al hotel a echar una siesta rápida. Esa tarde era el único tiempo libre que tendría en toda la semana, así que decidí explorar un poco la ciudad. Uno de los desarrolladores que conocí me sugirió visitar [Miniatur Wunderland](https://www.miniatur-wunderland.com/), un enorme museo de trenes en miniatura con muchísimo detalle, y allí que fui. Cogí un autobús al centro, justo al lado del hotel, y en 20 minutos estaba allí. Recomiendo mucho este sitio: impresiona el nivel de detalle de las maquetas, y cada 15 minutos se hace de día o de noche y cambian las luces de los modelos. No te pierdas el circuito de F1 de Mónaco, ¡es fabuloso!

Estuve paseando por la zona, buscando un buen sitio de hamburguesas, pero antes me paré en un cine al aire libre en medio del lago, donde estaban a punto de proyectar "Mi vecino Totoro", una película de animación japonesa de Studio Ghibli. Hamburgo es una ciudad con mucha vida.

{{< flex-gallery 
    src_1="monaco-by-night.jpg" 
    alt_1="Circuito de F1 de Mónaco"
    caption_1="Circuito de F1 de Mónaco."
    src_2="totoro.jpg" 
    alt_2="Mi vecino Totoro sobre el lago"
    caption_2="Mi vecino Totoro sobre el lago."
    src_3="hamburger.jpg" 
    alt_3="Hambur-guesa"
    caption_3="Hambur-guesa."
>}}

## Resumen

Lo pasé genial en ContainerDays. Conocí a mucha gente de la comunidad y tuve la oportunidad de dar mi charla. Si tu trabajo tiene que ver con contenedores, Kubernetes o Docker, te recomiendo mucho esta conferencia. Y, ¿por qué no?, que propongas una charla.

Por último, quiero dar las gracias a todas las personas que conocí en la conferencia, y pido perdón si me he olvidado de nombrarte en este post. Lo pasé muy bien con todos vosotros y tengo ganas de que llegue la próxima.
