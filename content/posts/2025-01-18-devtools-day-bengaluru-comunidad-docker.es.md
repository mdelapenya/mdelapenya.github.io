---
title: "5.º DevTools Day de Bengaluru (Collabnix Docker Community)"
date: 2025-01-18T09:00:00+05:30
description: "Mi experiencia en el 5.º DevTools Day de Bengaluru (Collabnix Docker Community)"
categories: [Community]
tags: [docker, devtools-day, bengaluru, india, community, events, testing, testcontainers, go, genai, ollama, llms, meetup]
type: post
weight: 25
translationKey: collabnix-bengaluru
translatedFrom: 3121f4c
---

## 5.º DevTools Day de Bengaluru (Collabnix Docker Community)

En octubre conocí a Ajeet Raina en Devoxx Belgium. Volviendo al hotel le conté que había enviado un CfP a Gophercon Singapore, y me dijo: "_si te aceptan, tienes que parar en Bangalore, porque te pilla de camino a Singapur, y compartir ese conocimiento con la enorme comunidad que vive en la ciudad. Yo me encargo de todo: el local, la comida... Hablaré con los partners locales para que colaboren en montar este meetup_". El 30 de octubre los organizadores confirmaron que entraba en Gophercon, así que Ajeet se puso a planificarlo todo. ¿El resultado? Un evento estupendo, con un montón de interacción con la comunidad Docker.

## La agenda

- 9:00 a 10:00: Bienvenida y registro
- 10:00 a 11:00: Testing GenAI applications in Go using Docker and Testcontainers, por Manuel De La Peña, equipo de Docker
- 11:00 a 11:45: Building Fast, Securing More, Testing Better. How Docker Fuels Developer Productivity, por Rebant Malhotra, Docker, y Ajeet Singh Raina, Docker
- 11:45 a 12:30: Introduction to Confidential containers, por Balasundaram y Sangam Biradar
- 12:30 a 13:00: Designing an Agentic System with GraphRAG (Unstructured data meets structured data), por Alagu Prakalya, ASAPP
- 13:00 a 14:00: Comida
- 14:00 a 14:30: Dev-Test Simplified: Building Production-like Environments with vCluster, por Rashi Chaubal, Infracloud Technologies
- 14:30 a 15:00: Secure by design in the AI Era, por Arun Kumar G, GitLab
- 15:00 a 15:30: Generative AI 102: A Recap of 101 with Ollama and n8n, por Raveendiran RR

Las dos últimas charlas llevaron algo de retraso, así que acabamos sobre las 17:00.

## Asistencia

Había 1.003 personas registradas en Meetup.com, aunque "solo" vinieron unas 300. He visto conferencias con menos de 100 personas en la sala, con entradas de unos 500 € para una agenda como la de este evento, así que me siento muy honrado de haber participado.

Cuando Koti, uno de los organizadores, preguntó por la demografía, resultó interesante que la gran mayoría estaba allí por primera vez, eran estudiantes y habían venido con amigos. Me parece increíble que tuvieran tanto interés en dedicar casi un día entero, con dos horas de coche de ida y otras dos de vuelta, un sábado, para escuchar a gente de tecnología.

Mi conclusión: hay que invertir en las comunidades conectadas con las universidades. Así esos estudiantes llegarán al mercado con unos cimientos sólidos en herramientas que de verdad funcionan y tienen impacto en el día a día, como Docker.

## Mi charla

Fui el primero. Empecé a las 10:15 y tardé una hora en darla. Esto es importante porque era la primera vez que daba la charla, y la repito este viernes en dos eventos distintos, donde el horario está limitado a 30 minutos. Así que ahora mismo estoy decidiendo qué me salto y qué recorto.

Las diapositivas están [aquí](/slides/2025-01-18-collabnix-bengaluru/testing-genai-in-go.pdf). Tratan de qué herramientas tenemos en Go para interactuar con aplicaciones de GenAI, y de cómo Testcontainers for Go puede ayudar a tener una experiencia fluida en el inner loop del proceso de desarrollo.

Empecé preguntando cuántos usaban Go y solo levantaron la mano unas 4 o 5 personas. Así que les dije enseguida que todo lo que iba a contar lo podían encontrar en su lenguaje favorito, gracias a que Testcontainers existe para todos ellos. De ese modo, cada uno podía conectar las herramientas y los ejemplos en Go con su caja de herramientas actual. De hecho, mi presentación es una copia exacta del gran trabajo que está haciendo @Ignasi Lopez Luna desde el lado de Java. ¡Mi enhorabuena a él por allanarme el camino en este viaje! 🙇

Durante todo el evento, no solo en mi charla, noté que mucha gente en la sala sabía de GenAI, de modelos y de librerías. Por ejemplo, dos estudiantes vinieron después de la charla a enseñarme su proyecto de la uni: usaban YOLO, un LLM para detección de objetos en tiempo real, en su proyecto final sobre detectar la velocidad de los jugadores de fútbol. Me preguntaron cómo alojar un modelo tan grande y si Ollama podía ejecutarlo. Les dije que, si el modelo está en Hugging Face como modelo GGUF, Ollama puede ejecutarlo. Eso sí, necesitan potencia para alojar y ejecutar modelos grandes, un terreno en el que probablemente Docker Cloud pueda destacar.

## Preguntas interesantes

Hubo montones de preguntas. Muchas eran técnicas, claro, pero la mayoría eran sobre carrera profesional: ¿qué debería estudiar ahora? ¿Qué consejo me darías para progresar? Intenté recopilar mis experiencias anteriores, diciéndoles con franqueza que quizá a ellos no les funcione, pero que a mí sí me funcionó. Mi respuesta más "popular" fue: "_no te centres en las herramientas sino en los fundamentos: está bien conocer una o dos herramientas, pero si conoces los fundamentos y la motivación que hay debajo, probablemente podrás pasar a otra con facilidad. Si no, te reemplazará la siguiente herramienta_". Noté que muchos venían con esta pregunta, y espero que sigan el consejo.

Muchas preguntas venían también del terreno de la autoconfianza: "_no soy tan listo_". Algunos pensaban así incluso después de terminar la carrera de informática.

Participar en meetups puede llevar mucho tiempo, y reconozco que ahora, con pareja e hijos, me resulta muy difícil siquiera plantearme asistir con regularidad. Pero hace años me ayudó mucho ir a meetups para enterarme de lo que se movía.

Otra cosa que me ayudó, y que les aconsejé, fue la forma de aprender cosas nuevas. Las nuevas generaciones "son" más visuales que la mía y prefieren ver vídeos de YouTube o Twitch. Estoy de acuerdo en que los tiempos cambian y las nuevas formas de aprender son igual de válidas. Pero aun así veo a muchos creadores de contenido quedarse en la superficie. Hay recursos con un conocimiento profundo de las tecnologías que enseñan, pero mi experiencia con los "youtubers" es que hacen la lista de tareas (la clásica app to-do) con el framework del día.

¿Soy como mi padre hace 30 años, cuando yo escuchaba Metallica? ¿O como el duque medieval que le dice a su hijo que la túnica le queda corta? ¿O, yendo más lejos, como el cavernícola que gruñe a su hijo por llevar una capa de mamut? Ya lo dirán los libros de historia (perdón, los streams).

Así que mi consejo principal fue que lean libros. Y que participen en meetups cuando puedan. Porque más adelante, con pareja o hijos, será mucho más difícil que ahora.

Una pregunta interesante, genial de hecho, vino de Koti, uno de los organizadores. Ha creado un sitio de documentación nuevo sobre cómo usar testcontainers-python, con montones de ejemplos prácticos: más de 10 escenarios con bases de datos (MySQL, MongoDB, Postgres) y message brokers (Kafka, Redis, RabbitMQ). Quería saber si "esa cosita" en la que estaba trabajando podía interesar a la comunidad de Testcontainers Python. ¡Claro que sí! Puedes encontrar su repositorio aquí: https://github.com/vellankikoti/testcontainers-db-message-brokers 🐍

### Otras charlas

Los asistentes me pararon muchas veces después de mi charla, así que me perdí buena parte del resto.

Me interesaba especialmente "**Dev-Test Simplified: Building Production-like Environments with vCluster**", de Rashi Chaubal, Infracloud Technologies, porque nunca había oído hablar de los vClusters. Son, según [su web](https://www.vcluster.com/), "_un concepto de Kubernetes que permite ejecutar clústeres aislados dentro de un único clúster físico de Kubernetes. Cada clúster tiene su propio servidor de API, lo que los aísla mejor que los namespaces y los hace más asequibles que clústeres de Kubernetes separados._". En la charla se explicó cómo aprovecharlos para simplificar la fase de testing de aplicaciones en k8s, aunque a mí me parecen más cómodos no para testing, sino para simplificar entornos de producción. Para testing creo que el módulo de k3s de testcontainers-go, claro 😅, puede ayudar a los equipos a probar sus despliegues, iterando en local en lugar de tener que ir al clúster virtual, que vive en la infraestructura de la empresa. Pero en fin, no tengo ni idea de k8s, así que seguro que se me escapa algo.

Otra charla fue "**Confidential Containers**", de Bala Sundaraman. Explicó qué es el Confidential Computing y los problemas de no usarlo. Me pasó las diapositivas [aquí](/slides/2025-01-18-collabnix-bengaluru/COCO-NOKIA_presentation.pptx).

La última charla, "Generative AI 102: A Recap of 101 with Ollama and n8n", de Raveendiran RR, mostró la plataforma n8n. Yo ya conocía Flowise, pero no sabía que n8n tuviera tantas integraciones disponibles. ¡Seguramente merece la pena echarle un vistazo!

### Fotos del evento

Estas son las que hice yo, pero si miras el feed de LinkedIn del evento, encontrarás muchas más. Me impresionó que quisieran hacerse fotos con nosotros. ¡¡No somos estrellas del rock!! 😳😳😳

{{< flex-gallery 
    src_1="PXL_20250118_034338039.jpg"
    alt_1="Edificio de Nokia"
    caption_1="SILICON VALLEY. Bangalore se considera el Silicon Valley de la India. Muchas empresas de Big Tech tienen edificios allí. ¿Sabías que DELL tiene 25.000 empleados en la ciudad?"

    src_2="PXL_20250118_035003197.MP.jpg"
    alt_2="Sala vacía"
    caption_2="SILENCIO. La sala antes de que empezara todo."

    src_3="PXL_20250118_061724775.jpg"
    alt_3="Meetup desbordado"
    caption_3="MEETUP DESBORDADO. Como dijo Ajeet, la sala estaba a reventar."

    src_4="PXL_20250118_061711277.jpg"
    alt_4="Ajeet y Rebant"
    caption_4="EQUIPO. Ajeet y Rebant empezando la charla."

    src_5="PXL_20250118_073235015.jpg"
    alt_5="Equipo de Docker"
    caption_5="EQUIPO. Gente de Docker + Koti y Shub."

    src_6="PXL_20250118_075907317.jpg"
    alt_6="Otro ponente"

    src_7="PXL_20250118_091206885.MP.jpg"
    alt_7="Sirviendo las pizzas"
    caption_7="HORA DE COMER. Todo el mundo esperó con paciencia su comida."

    src_8="PXL_20250118_093434442.jpg"
    alt_8="Hora de la pizza"
    caption_8="EQUIDAD. Los partners vinieron con comida y bebida para todos. Aquí en España, y también en otros países donde he asistido a meetups, la organización trae pizzas grandes para todo el mundo. Allí, cada persona recibió la misma caja de pizza, con postre y bebida incluidos."

    src_9="PXL_20250118_121535451.jpg"
    alt_9="Organizadores"
    
    src_10="PXL_20250119_131149794.jpg"
    alt_10="¡Estos tíos!"
    caption_10="CINCO TÍOS (falta Koti). Ellos, y probablemente más gente, están construyendo una comunidad tech muy sólida en Bangalore, un salvavidas para muchos estudiantes de informática en este mundo tan acelerado."

    src_11="PXL_20250119_131202726.jpg"
    alt_11="Yo y las estrellas del rock"
    caption_11="ORGULLO. Por fin conocí a estrellas del rock de verdad."
>}}

### Más fotos del viaje

Ajeet me recogió en el hotel la primera mañana (el viernes) y me llevó a un lugar especial para él y su familia: [Adiyogi](https://isha.sadhguru.org/en/center/consecrated-spaces/adiyogi-chikkaballapur-bangalore). Tardamos casi 2 horas en llegar. Sí, el tráfico en Bangalore funciona así, y "_siempre sales 3 horas antes, si no pierdes la reunión o el vuelo_".

Para mí, esto también es trabajo. Reunirte con gente de tu empresa y simplemente hablar hace que los sientas como si trabajaras con ellos codo con codo en una oficina. Hablas de familia, de amigos y de la vida, pero las conversaciones de trabajo surgen de forma natural y con más energía. Por eso creo de verdad que los offsites son críticos para crear y fomentar una cultura en la que confiamos unos en otros. Solo con volver caminando al hotel, en un ambiente más relajado, pueden surgir conversaciones muy reveladoras. Trabajar en remoto (asíncrono y distribuido) es una gran ventaja, pero como contrapartida podemos perdernos estas interacciones sociales que crean vínculos. No lo perdamos.

{{< flex-gallery 
    src_1="PXL_20250117_081954564.jpg"
    alt_1="Monos en libertad"
    caption_1="MONOS. ¡Nunca había visto un mono en libertad!"

    src_2="PXL_20250117_082624940.jpg"
    alt_2="La cabeza de Shiva"
    caption_2="LA CABEZA DE SHIVA. El monumento es precioso pero, de noche, todavía es mejor, porque se ilumina por dentro con varios colores."

    src_3="PXL_20250117_083139396.NIGHT~2.jpg"
    alt_3="Nandi"
    caption_3="NANDI. Es el vehículo de Shiva. Nandi es el portador de la verdad y la rectitud. Esta foto usa la función de Pixel 9 que quita a la gente del fondo."

    src_4="PXL_20250117_084655896.BURST-01.COVER.jpg"
    alt_4="Ajeet y yo"
    caption_4="INCLUDE ME. Esta foto se hizo con la nueva función 'Include me' del Pixel 9. ¡Qué chulo!"

    src_5="PXL_20250117_085334564.jpg"
    alt_5="Ajeet y yo"
    single_row_5="true"
    caption_5="SIN ZAPATOS. Ajeet y yo vamos descalzos en esta foto, porque vimos que todo el mundo en el templo se quitaba los zapatos y los calcetines."

    src_6="PXL_20250117_124613335.MP.jpg"
    alt_6="Una familia de 5 en una scooter"
    caption_6="DOS RUEDAS. Vivir en un país europeo y ver escenas como esta te hace darte cuenta de lo privilegiados que somos por el lugar donde nacimos. ¡Diversidad, por favor!"

    src_7="PXL_20250117_131126097.MP.jpg"
    alt_7="Vacas sueltas por la calle"
    caption_7="VACAS. Esto lo vemos a menudo en las noticias: una vaca suelta por la calle."

    src_8="PXL_20250118_172155742.jpg"
    alt_8="El skyline de Bangalore de noche, desde el hotel"
    single_row_8="true"
    caption_8="BANGALORE DE NOCHE. Las oficinas de NOKIA están en esa zona, a unos 25 minutos andando desde mi hotel, pero era casi imposible ir a pie por el tráfico denso y las obras del nuevo tren."

    src_9="PXL_20250119_060817414.PORTRAIT.ORIGINAL.jpg"
    alt_9="Recuerdos de la India"
    caption_9="REGALOS. Un detalle del hotel cuando les conté que era mi primera vez en la India."
    
    src_10="ajeet-and-family.png"
    alt_10="La familia de Ajeet"
    caption_10="FAMILIA. Maja y yo tuvimos mucha suerte de conocer a la familia de Ajeet en su casa."

    src_12="namaste.png"
    alt_12="Yo y las estrellas del rock"
    single_row_12="true"
    caption_12="NAMASTE. Para Ajeet, para mi equipo, para Docker."

    src_13="food.png"
    alt_13="Comida familiar india"
    caption_13="FAMILIA. La familia de Ajeet nos preparó comidas indias. Deliciosas, pero picantes, pero deliciosas. Bueno, para mí toda la comida india es picante, hasta el punto de provocarme costras (y sangre) en los labios."

    src_14="PXL_20250119_110912479.jpg"
    alt_14="Museo indio de la música"
    caption_14="CONOCE TU HISTORIA. Ajeet y los organizadores de Collabnix dedicaron su domingo libre a estar con nosotros y nos llevaron al Indian Museum of Music. ¡Toda una experiencia!"
>}}

### Otros temas

- Docker Hub cafe: https://www.linkedin.com/posts/kunal-sarpatil-79587b157_just-when-we-thought-docker-was-all-about-activity-7287330190773383168-73M7?utm_source=share&utm_medium=member_desktop
- *Container Rules, Docker cools!*: https://www.linkedin.com/posts/shubhendu-shubham_dockerbengaluru-meetup-ugcPost-7286440882289942528-_mIr?utm_source=share&utm_medium=member_desktop
- Los sesgos de un europeo en la India: https://www.linkedin.com/posts/mdelapenya_biases-india-community-activity-7287312477963325440-Fm8H?utm_source=share&utm_medium=member_desktop
- Una experiencia personal en el aeropuerto: https://www.linkedin.com/posts/mdelapenya_id-like-to-share-this-feedback-after-a-really-activity-7288064800872407040-pKRL?utm_source=share&utm_medium=member_desktop
