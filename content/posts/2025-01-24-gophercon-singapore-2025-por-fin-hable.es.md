---
title: "GopherCon Singapore 2025: por fin hablé en una GopherCon"
date: 2025-01-24T09:00:00+08:00
description: "Mi experiencia en la GopherCon Singapore 2025"
categories: [Community]
tags: [gophercon, singapore, community, events, go, genai, ollama, llms, conference]
type: post
weight: 25
translationKey: gophercon-singapore
translatedFrom: 55a705f
---

## GopherCon Singapore 2025

Cuando entré en AtomicJar en 2022 me puse una meta: que me aceptaran en una Gophercon para contar las ventajas de usar Testcontainers para Go. Lo intenté dos veces con la conferencia europea en 2024 (Grecia y Berlín), con la de Estados Unidos (Chicago) y con la de Israel. Siempre me rechazaron. Pedí feedback por email, pero el equipo organizador de Europa parecía muy ocupado con la organización, así que al final desistí de insistir. Lo que sí vi después es que me estaba centrando en presentar Testcontainers, algo que el comité podía interpretar como un pitch "de vendor". Los títulos de mis propuestas eran "Mastering Testcontainers for better integration tests" y "Delightful integration tests in Go applications", así que creo que ese fue el motivo.

Después de hablar un rato con @Oleg Selajev, me sugirió cambiar un poco el enfoque: no centrarme en la herramienta, sino en un caso de uso real que la herramienta simplifica. Así llegamos a "Testing GenAI applications in Go", que cumplía dos criterios: 1) usar una tecnología del momento como GenAI, y 2) resolver un problema gracias a Testcontainers, cómo testearlas. ¡BINGO!

Envié el CfP en agosto de 2024 y el 30 de octubre me dijeron que estaba aceptado.

Como iba a estar en Singapur en enero, @Ajeet Raina organizó también un meetup de Docker en Singapur esa misma semana, para que mi presencia en la región sirviera para interactuar más con la comunidad de desarrolladores de allí. Puso toda su energía y sus contactos a trabajar, y llegó con

### Preparación

Al principio pensé que había sido un poco temerario, porque entonces sabía muy poco de GenAI. Para ser totalmente transparente, me sentía un completo analfabeto en el tema. Por suerte empecé a hablar cada semana con @Ignasi Lopez Luna sobre cómo construir ese conocimiento. Empezamos portando a Go [un repositorio](https://github.com/ilopezluna/generative-ai-with-testcontainers) que Ignasi ya había creado para hacer cosas de GenAI en Java. Ese repositorio me sirvió para familiarizarme con las tecnologías y como apoyo para mi presentación. Lo tienes [aquí](https://github.com/mdelapenya/generative-ai-with-testcontainers).

Como parte de la preparación, y con el presupuesto de formación de Docker, me apunté a https://dair-ai.thinkific.com/, que ofrece varios cursos de IA. Cuesta unos 300 dólares por acceder a todos los cursos durante un año, así que me pareció conveniente. Conocía al fundador de un trabajo anterior en Elastic y le había seguido la pista desde entonces: dejó Elastic para hacer investigación en IA en Meta y después fundó su propia empresa. Completé estos cursos: "Introduction to Prompt Engineering", "Advanced Prompt Engineering", "Introduction to AI Agents" e "Introduction to RAG".

También me vino bien ver el vídeo de Marcin Antas (Weaviate) sobre por qué las bases de datos vectoriales son más adecuadas para hacer RAG que las bases de datos tradicionales. Le pedimos que presentara ese tema y el vídeo es impresionante. Te lo recomiendo ([aquí](https://drive.google.com/drive/folders/1BCr4SNabj6efzyKiqC4y7XQLmdtOdM_i)). Este vídeo sale de la buena relación que hemos construido con la gente de Weaviate: ¡usan el módulo de weaviate de testcontainers-go para testear Weaviate! ¡Qué guay!

### Lunes

Después de dejar Bangalore (mira [5th DevTools Day Bengaluru (Collabnix Docker Community) > 2025.01.18](/es/posts/2025-01-18-devtools-day-bengaluru-comunidad-docker/)) aterricé a primera hora de la mañana en Singapur. ¡Qué ciudad tan bonita!

Lo primero que hice fue llamar a [Ron Evans](https://www.linkedin.com/in/deadprogram/), que también daba una charla en la conferencia. Para quien no lo conozca, es el lead maintainer de TinyGo, pero también una cara muy popular en el mundo del desarrollo, con muchos amigos en muchos sitios. Por ejemplo, conoce a Justin y hablaron cuando Docker Desktop dejó de ser gratis para empresas 😄 Como sabía que vive en España, le pasé directamente mi número de teléfono por Slack para poder contactar con él.

Seguía cansado del vuelo y no pudo acompañarme, así que decidí explorar la ciudad antes de que el jet lag me pasara más factura.

Ese día, Valentine Chua, responsable principal de la organización de la conferencia, creó un grupo de WhatsApp con todos los ponentes y voluntarios y propuso salir a cenar. Solo estábamos ya allí Ron y yo, así que los tres fuimos a un sitio de noodles muy bueno.

{{< flex-gallery 
    src_1="noodles.png" 
    alt_1="Cena de noodles con Ron y Valentine" 
    caption_1="NOODLES. Comida deliciosa en Hill Street Tai Hwa Pork Noodle: https://maps.app.goo.gl/wVdjDQwKzfv7xXXP8. Ron, Manu y Valentine." 
>}}

Después dimos un paseo. Hablamos mucho de la conferencia, de nuestras experiencias anteriores y también de familias y amigos. Es lo que siempre digo de este tipo de eventos: conocer a la gente en persona te permite conectar con ella más a fondo.

### Martes

Dediqué toda la mañana a trabajar las slides de mi charla de Gophercon. En 25 minutos tenía que contar "lo mismo" que en la charla anterior de Bangalore, que me llevó una hora. Así que decidí quitar las slides que enseñaban código explícito de testcontainers-go, como crear un contenedor genérico o usar un módulo... Al final, mostrar cómo Ollama corre en un contenedor Docker de forma programática ya demuestra por sí solo el beneficio de usar testcontainers.

Comí con Ron, esta vez un ramen delicioso, y seguí trabajando desde el hotel. A las 18:00, el equipo de Singapur había reservado mesa en Sin Hoi Sai Eating House (https://maps.app.goo.gl/y9rLXU1Rr53WvfpD9), donde disfrutamos de una comida estupenda. Celebramos el Año Nuevo Chino, que sería la semana siguiente, así que mezclamos una ensalada fresca mientras nos deseábamos prosperidad. El momento estuvo delicioso, y la ensalada también.

{{< flex-gallery 
    src_1="sin-hoi-sai.png" 
    alt_1="Cena del equipo" 
    caption_1="SIN HOI SAI. Casa de comidas tradicional, donde se reunió el equipo de Singapur para cenar."
    src_2="crab.png" 
    alt_2="Cangrejo picante" 
    caption_2="CANGREJO PICANTE. Era la especialidad de la casa, demasiado picante para mí, aunque pude comer algo de carne de cangrejo, que otra vez estaba deliciosa. ¿Hace falta que repita que me encanta comer?"
    src_3="salad-before.png" 
    alt_3="Ensalada antes de la cena"
    single_row_3="true"
    caption_3="ANTES. La ensalada fresca, antes de mezclarla."
    src_4="salad-after.png" 
    alt_4="Ensalada después de la cena" 
    caption_4="DESPUÉS. Fue divertido mezclar la ensalada."
>}}

Tuve ocasión de conocer a Yoke Kuan, Hedy, Ji Hye, Juliana, Martin y Luke. Durante la cena debatimos sobre una estrategia "top-down" para vender Docker Desktop frente a una estrategia "bottom-up", en la que los desarrolladores aman la herramienta y convencen a sus jefes de qué usar. Disfruté mucho de las distintas posturas que compartimos.

Momento divertido cuando Juliana contó que empezaba al día siguiente y nos reímos de que todavía no era una empleada de Docker de pleno derecho.

### Miércoles

Como la conferencia empezaba ese miércoles, pregunté a los empleados de Docker en Singapur si les apetecían unas sesiones sobre Testcontainers, y acordamos hacer una ese mismo día. El equipo había reservado una sala de reuniones en el centro, así que decidí ir andando desde el hotel y empezar pronto, a las 9:00, para poder resolver todo lo que el equipo quisiera.

{{< flex-gallery 
    src_1="building.png" 
    alt_1="Marina Bay Sands" 
    caption_1="IMPRESIONANTE. No hay palabras para ese edificio."
    src_2="merlion.png" 
    alt_2="Merlion" 
    caption_2="MERLION. La mascota de la ciudad."
    src_3="level42.png" 
    alt_3="Ensalada antes de la cena"
    caption_3="LEVEL42: https://youtu.be/9x1RcVrGjGM?feature=shared&t=53"
    src_4="meeting-room.png" 
    alt_4="Sala de reuniones" 
    caption_4="SALA DE REUNIONES. Listos para trabajar."
>}}

Fue un día intenso y solo pudimos trabajar juntos en los huecos reservados para las sesiones, de 13:00 a 15:00, pero tuve tiempo de seguir con mi presentación para Gophercon. Por suerte, durante la sesión nos dio tiempo a explicar qué es Testcontainers OSS y qué diferencias tiene con Testcontainers Cloud, y además el equipo me pidió que enseñara la charla del meetup de Docker. Estuvo bien, porque me sirvió para probar la presentación una vez más.

- TC OSS y TCC: gracias a Anna Chernyshova por aportar la mayor parte de los materiales de esta presentación. Como siempre, es GENIAL.
- [Slides del meetup de Docker](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Cloud-Native_AI_Day_Singapore.pdf)

Tengo que dar las gracias a Zubair Aslam por pararme con preguntas muy acertadas y hacer de mi ChatGPT personal, traduciendo mi jerga técnica para que cualquiera en la sala pudiera entenderla. Muchas veces los ingenieros no sabemos comunicar con eficacia.

Después cogí un taxi y fui a las sesiones de talleres de Gophercon, porque mi amigo Ron daba su famoso taller "Hardware Hacking with TinyGo". Yo ya lo hice en 2019, durante un Google Developer Summit en Lisboa, y es muy divertido, así que, si tienes ocasión, ¡hazlo!

> ℹ️ *Prepárate para una experiencia electrizante en GopherCon con la sesión épica de robots del Hybrid Group, impulsada por Go. ¡Sumérgete en el control de drones con joystick, reencuéntrate con nuestro fiel amigo GopherBot y déjate llevar por más maravillas de IoT de las que puedas abarcar!
> Traemos una colección especial de nuestros robots programables y juguetes favoritos para que juegues con ellos y los programes, incluidos algunos clásicos retro y unos cuantos amigos nuevos.
> Si la música es lo tuyo, ¡no te pierdas la sesión TinyGo Jam! Rockea con controladores MIDI impulsados por TinyGo y disfruta de una variedad de actividades musicales a tu aire para mantener felices tus auriculares.*

Cuando llegué, al taller le quedaba una hora para terminar, así que aproveché para hablar con los voluntarios de la conferencia. Uno de ellos, empleado de GovTech, se alegró mucho, porque usaba Testcontainers en sus proyectos de Kotlin. Como siempre, los stickers hacen MUY felices a los desarrolladores. Del equipo organizador conocí también a [Vito Chin, Microsoft](https://www.linkedin.com/in/vitochin/). Estaba muy interesado en mi charla, porque trabaja en temas de IA con Copilot.

Ese día conocí a Mike Hughes, organizador de Gophercon AU. También asistía a la conferencia y desde entonces se unió a nosotros.

Cenamos en un bar escondido, también muy bueno, y de nuevo nos invitaron los organizadores. Éramos Valentine, Ron, Mike y yo. El sitio se llama Mama Diam 妈妈店: Hidden restaurant and cocktail bar, y se encuentra con solo mover la estantería de la izquierda.

{{< flex-gallery 
    src_1="mama-diam.png" 
    alt_1="Bar escondido Mama Diam" 
    caption_1="LUGAR ESCONDIDO. Me preguntaba por qué aquellas mujeres hacían fotos a esa tiendecita, hasta que las vi abrir la 'puerta' y me quedé boquiabierto."
>}}

### Jueves

Dediqué este día no a trabajar la charla, sino a mantener al día el proyecto testcontainers-go: revisar las pull requests abiertas y hacer seguimiento con proyectos OSS upstream que nos usan. Por ejemplo, GoFiber nos usa para verificar su capa de store. Les estoy ayudando con su CI en GH actions para habilitar testcontainers-go en todos sus módulos. Es una tarea que los maintainers de Testcontainers solemos hacer: ponernos en contacto con otros proyectos OSS por si pueden usarnos. También es un gran marketing para nosotros, porque los desarrolladores que contribuyen a esos proyectos OSS vivirán la experiencia de escribir tests con las librerías de Testcontainers y, con el tiempo, la copiarán en sus propios proyectos. Esta tarea de construir puentes entre comunidades OSS es muy importante para nosotros, igual que mantenerlos.

Ese día tuvimos la cena de ponentes en Zheng Swee Kee (https://maps.app.goo.gl/1ZE3TYdUwvkCEvF19), donde nos reunimos con Valentine y su equipo. No vinieron todos los ponentes, porque algunos ya estaban volando o acababan de aterrizar. Estábamos: Ron, [Axel Wagner](https://www.linkedin.com/in/merovius/), [Chew Xuanyi](https://www.linkedin.com/in/xuanyichew/) y [Johnny Boursiquot](https://www.linkedin.com/in/jboursiquot/).

### Viernes, ¡día de charlas!

En la agenda original estaba previsto que hablara hacia las 13:00, pero como tenía el conflicto con el evento de Docker, que empezaba a las 13:00,

| **9:10 AM** | **AI Programming with Go, por [Chang Sau Sheong](https://2025.gophercon.sg/speakers#sau-sheong)** | Una breve introducción a la programación de IA con Go. Aprende a usar paquetes de Go, frameworks de LLM, LLM abiertos con Ollama, RAG y también LLM de visión. |
| --- | --- | --- |
| **9:40 AM** | **Starting and stopping things, por [Dave Cheney](https://2025.gophercon.sg/speakers#dave-cheney)** | En Go es trivial arrancar una goroutine, pero, como me gusta decir, ¿sabes cuándo se detendrá esa goroutine? ¿Cómo se detendrá? ¿Cómo sabrás que se ha detenido? Esta charla trata de una solución que me encuentro reescribiendo en prácticamente todos los servicios backend en Go en los que trabajo. Incluso en una empresa de microservicios, la necesidad de montar un conjunto de goroutines en paralelo es omnipresente. Es una historia sobre concurrencia frente a paralelismo, sobre los lugares donde existe hoy en la std lib y donde no, sobre los patrones que evolucionan a partir de esa afirmación, y una introducción al tipo group, una idea que ha evolucionado desde los tiempos de Juju, hace una década, con el Manifold de William Reade, pasando por la charla "How I do things" de Peter Bourgon, y a través de muchas de mis propias iteraciones. |
| **10:20 AM** | **Pausa para el té, por [Equipo de GopherCon Singapore](https://2025.gophercon.sg/schedule/)** |  |
| **10:50 AM** | **(Wrong) Comparison is the Thief of Joy, por [Elisa Xu](https://2025.gophercon.sg/speakers#elisa-xu)** | Has oído el viejo refrán: la comparación es la ladrona de la alegría. Y así es. Pero, más concretamente, la comparación equivocada es la ladrona de la alegría. Comparamos para ganarnos la vida. Comprobamos si nuestras expectativas coinciden con la realidad y escribimos cientos de líneas de código para comparar lo que queremos con lo que obtuvimos. Y sin embargo, ¿sabemos de verdad qué estamos comparando, y qué fallos oscuros en los tests amenazan con robarnos la alegría? |
| **11:15 AM** | **Why we can't have nice things: Generic methods, por [Axel Wagner](https://2025.gophercon.sg/speakers#axel-wagner)** | Los métodos genéricos nos permitirían escribir APIs encadenadas. Esto es especialmente importante para los patrones de iteradores funcionales, que ahora mismo tienen que extenderse en varias líneas o anidarse de forma incómoda. También nos permitiría asociar correctamente el código genérico al tipo al que pertenece. Un ejemplo es `func N[T constraints.Integer](n N) N` en el paquete `rand`: facilita elegir, por ejemplo, un `time.Duration` aleatorio. Pero en realidad debería ser un método de `*rand.Rand`. Así que nadie discute de verdad que esta funcionalidad sería útil. Incluso el equipo de Go está en gran parte de acuerdo. Pero la omisión fue intencionada. Las razones se remontan hasta antes de la primera versión open source de Go. De hecho, podría ser la razón por la que llegamos a tener genéricos. Repaso los usos de esta funcionalidad, las razones por las que añadir genéricos tardó tanto y cómo llevaron a esta omisión. |
| **11:45 AM** | **F()-ing Cox-Zucker Tunes a MA Screw unto a Kummer Surface, por [Chew Xuanyi](https://2025.gophercon.sg/speakers#chewxy)** | La geometría algebraica puede ser divertida al servicio de la construcción de mundos. Esta charla repasará las consideraciones sobre estructuras de datos y algoritmos para hacer películas de estructuras matemáticas exóticas que no necesariamente tienen sentido intuitivo. |
| **12:15 PM** | **Scaling Go Monorepo Workflows with Athens, por [Swaminathan Venkatraman](https://2025.gophercon.sg/speakers#swami)** | En Grab, nuestro monorepo de Go da soporte a más de 600 microservicios y centraliza librerías compartidas, pero comandos de uso frecuente como go list y go get generaban cuellos de botella importantes. Estos comandos saturaban nuestros servidores de GitLab, lo que frustraba a los desarrolladores, interrumpía los pipelines de CI y obligaba al equipo de GitLab a apagar fuegos constantemente. Para resolverlo, implementamos Athens, un proxy privado de módulos de Go, combinado con configuraciones de la variable de entorno GOVCS y el modo de red fallback. Este enfoque descargó de GitLab las peticiones de obtención de dependencias, redujo drásticamente la carga de los servidores y mejoró la velocidad de obtención de dependencias para los desarrolladores. En esta charla explicaremos cómo usar un proxy privado de módulos de Go mejora la seguridad, garantiza la disponibilidad de los módulos (piensa en el incidente de "left-pad") y evita los inconvenientes del vendoring. Los asistentes aprenderán a configurar proxies privados, a usar Athens en entornos seguros u offline y a escalar la gestión de dependencias en monorepos grandes. Descubre cómo mejoramos la productividad y la fiabilidad en Grab, y cómo tu organización puede hacer lo mismo. |
| **12:40 PM** | **Comida, por [Equipo de GopherCon Singapore](https://2025.gophercon.sg/schedule/)** |  |
| **1:40 PM** | **Practical GenAI with Go, por [Adrian Cole](https://2025.gophercon.sg/speakers#adrian-cole)** | Aprende a practicar IA generativa en Golang, usando algunas herramientas populares escritas en Golang. Aprenderás la jerga que se usa habitualmente, como LLM, GenAI, RAG y VectorDB, y qué significan. ¡Te irás con ideas para empezar a programar ya, con un modelo alojado en tu portátil! |
| **2:05 PM** | **Testing GenAI applications in Go, por [Manuel de la Peña](https://2025.gophercon.sg/speakers#manuel-de-la-pena)** | La evolución de las aplicaciones GenAI trae consigo el reto de desarrollar métodos de testing que puedan evaluar con eficacia la complejidad y la sutileza de las respuestas generadas por inteligencias artificiales avanzadas. La propuesta de usar un LLM como Agente Validador representa un enfoque prometedor, que abre el camino hacia una nueva era en el desarrollo de software y la evaluación en el campo de la inteligencia artificial. Con el tiempo, esperamos ver más innovaciones que nos permitan superar los retos actuales y maximizar el potencial de estas tecnologías transformadoras. Esta propuesta implica definir criterios de validación detallados y usar un LLM como "Evaluador" para determinar si las respuestas cumplen los requisitos especificados. Este enfoque puede aplicarse para validar respuestas a preguntas concretas, apoyándose tanto en conocimiento general como en información especializada. Al incorporar instrucciones detalladas y ejemplos, un Evaluador puede ofrecer evaluaciones precisas y justificadas, aclarando por qué una respuesta se considera correcta o incorrecta. En esta sesión usaremos langchaingo para interactuar con los LLM, y Testcontainers Go para aprovisionar las dependencias de ejecución necesarias para usar RAG. |
| **2:30 PM** | **Mocking your codebase without cursing it, por [Björn Andersson](https://2025.gophercon.sg/speakers#bjorn-andersson)** | Trabajar con mocks se parece mucho a hacer ejercicio: si no sabes lo que haces, o bien a) no consigues los resultados que quieres o b) te lesionas. Y en el peor de los casos, consigues ambas cosas, te quedas descontento con los resultados y renuncias a los mocks por considerarlos una práctica inútil. Esta charla mostrará algunos errores comunes al usar mocks (actualizar un montón de mocks para que devuelvan el nuevo valor correcto, mockear una y otra vez la misma cosa compleja, montajes elaborados para ejercitar un trozo de lógica de negocio, y más) y cómo puedes acotar tu forma de trabajar con mocks para que funcionen a tu favor y para que tu suite de tests sea algo que te encante mantener. Estés donde estés en el espectro entre "mockear todo" y "no mockear nada", ganarás confianza en tu suite de tests, la harás más sencilla de mantener y, muy probablemente, más rápida de ejecutar si eres intencionado en cómo la diseñas y en cómo trabajas con los mocks. |
| **2:55 PM** | **Pausa para el té, por [Equipo de GopherCon Singapore](https://2025.gophercon.sg/schedule/)** |  |
| **3:30 PM** | **80% faster, 70% less memory: the Go tricks we've used to build a high-performance, low-cost Prometheus query engine, por [Charles Korn y Jon Kartago Lamida](https://2025.gophercon.sg/speakers#charles-korn)** | Hemos estado construyendo desde cero un motor de consultas compatible con Prometheus para Grafana Mimir, en Go. Nuestro nuevo motor de consultas se ha diseñado para ofrecer una mejor experiencia de usuario y un rendimiento muy superior: nuestros benchmarks muestran consultas hasta un 80% más rápidas y con un 70% menos de consumo de memoria pico que el motor por defecto de Prometheus, y nuestras pruebas en el mundo real muestran resultados similares. Mientras construíamos el motor, hemos aprendido varias lecciones de rendimiento de Go a las duras, entre ellas por qué a veces es preferible usar byte slices en lugar de strings, los beneficios y costes del memory pooling y el impacto sorprendentemente grande de los punteros a función. Y también hemos visto la complejidad (¡y los bugs!) que estas cosas pueden introducir, y hemos desarrollado varias técnicas para combatirlos. |
| **3:55 PM** | **Life, the Universe, and everything GO, por [Ron Evans](https://2025.gophercon.sg/speakers#ron-evans)** | En esta keynote interactiva y a toda velocidad, iremos con Go desde lo increíblemente pequeño hasta donde nos lleve la imaginación. Al final habrás compartido una experiencia de verdad "fuera de la caja". |
| **4:45 PM** | **Palabras de clausura y foto de grupo, por [Equipo de GopherCon Singapore](https://2025.gophercon.sg/schedule/)** |  |

Recogí mi acreditación y dejé unos stickers de Testcontainers Go en la mesa, esperando que a todos los asistentes les interesara todavía más mi charla.

{{< flex-gallery 
    src_1="gophercon-badge.png" 
    alt_1="¡Mi acreditación de Gophercon!" 
    caption_1="CHECK. Hablar en una Gophercon era uno de mis hitos."
    src_2="stickers.png" 
    alt_2="Stickers sobre una mesa" 
    caption_2="STICKERS. A los desarrolladores les encantan los stickers, ¡y si son monos, todavía más!"
>}}

La primera charla, la keynote, **AI Programming with Go**, fue de Chang Sau, que creo que conoció a SJ hace unos meses aquí en Singapur. Presentó los LLM en Go usando langchaingo. Mostró los distintos payloads necesarios para hablar con OpenAI y con Ollama. Estuvo genial que esta charla fuera la keynote, porque preparó a la sala para la mía y pude ir rápido con las slides hasta llegar a la chicha del testing. Como comentamos durante la semana, si quieres usar LLM en Go, deberías ir con langchaingo en vez de con el SDK de Go de OpenAI, lanzado hace poco. Es un proyecto impulsado por la comunidad; si no, acabarás acoplado al vendor concreto, en este caso OpenAI. Aunque tengo que revisar esa implementación, por si es más "abierta".

La segunda fue la de Dave Cheney, **Starting and stopping things**. Tenía ganas de verle en acción, y al final no solo vi su charla, sino que también disfruté de un paseo con él el sábado, comimos juntos y fuimos de compras antes de salir hacia el aeropuerto. ¡Una gran experiencia de fanboy! Su charla fue muy elegante y explicó las razones por las que necesitas arrancar y parar goroutines. Tengo que admitir que me sentí bastante satisfecho conmigo mismo por ser capaz de entenderlo todo 😊

La tercera, **(Wrong) Comparison is the Thief of Joy**, trató de las distintas alternativas que tenemos en Go para comparar structs y de las trampas de cada una. ¿Tiene un struct los valores correctos después de hacer un unmarshal de un JSON? Dio una sesión muy interactiva, con muchos fragmentos de código sobre los errores habituales que cometemos al comparar tipos en Go.

La siguiente, **Why we can't have nice things: Generic methods**, de Axel Wagner, se basó en demostraciones matemáticas sobre el tema. Por el tiempo que compartimos durante la semana, ya sabía que Axel tiene formación en matemáticas de la universidad, así que te puedes imaginar la calidad de la charla. Con mi muy modesto nivel de matemáticas, me pareció completísima. Hace siglos que no hago matemáticas de verdad, en el instituto y en la universidad, aunque las disfrutaba. Otra vez te recomiendo ver esta charla. Axel tiene charlas parecidas sobre genéricos en otras Gophercons, por si quieres saber más de Go y genéricos: [Singapur 2025 (pdf)](https://raw.githubusercontent.com/Merovius/go-talks/7687b4d3d73ee671a139ff42f0c2481bd7c639d3/2025-01-24_gophercon_sg/slides.pdf), [EE. UU. 2024 (vídeo)](https://www.youtube.com/watch?v=dab3I-HcTVk&ab_channel=GopherAcademy), [Australia 2023 (vídeo)](https://www.youtube.com/watch?v=0w4Px-yR8D8&ab_channel=GopherConAU).

La siguiente, **F()-ing Cox-Zucker Tunes a MA Screw unto a Kummer Surface**, de Chew Xuanyi. También es uno de los organizadores de Gophercon AU y autor de [Gorgonia](https://gorgonia.org/getting-started/) (deep learning en Go). Me costó mucho seguir esta charla, por dos motivos: el más simple es que estaba retocando la mía, pero la realidad es que explicaba algunos conceptos matemáticos con mucha profundidad. Tengo que volver a ver el vídeo para hacerme otra idea.

La siguiente, **Scaling Go Monorepo Workflows with Athens**, de Swaminathan Venkatraman. Explicaron cómo usar un proxy dedicado ayudó a Grab a reducir los tiempos de build. [Grab](https://www.grab.com/sg/) es una empresa tipo Uber del sur de Asia. Aquí tienes el repo del proxy: https://github.com/gomods/athens, y [un post](https://engineering.grab.com/go-module-proxy) sobre el tema.

Llegó la pausa para comer y los organizadores me reclutaron para hacer una prueba rápida con mi portátil. Todo funcionaba, y después tocaba esperar a la charla de Adrian Cole, **Practical GenAI with Go**. No presentó langchaingo sino [Parakeet](https://github.com/parakeet-nest/parakeet), una librería OSS mantenida por él y por nuestro @Philippe Charrière. El mundo es un pañuelo… Adrian trabaja ahora en el equipo de Observability de Elastic, con mis excompañeros 😅. Una vez más, la sala estaba todavía más preparada para mi charla, porque ya se habían mostrado todos los conceptos básicos.

No he dicho nada de la sala. Preciosa se queda corto. Este es el videowall con las mascotas de la conferencia (un Merlion, la mascota de Singapur, con traje de Gopher). Los organizadores me contaron que contrataron a un artista local para el diseño. ¡Bravo!

{{< flex-gallery 
    src_1="background.png" 
    alt_1="Fondo del escenario" 
    src_2="background-and-me.png" 
    alt_2="Fondo del escenario conmigo" 
    src_3="conference-room.png" 
    alt_3="Sala de la conferencia" 
>}}

Y ahora, mi turno. Tras los retrasos naturales de las charlas anteriores, la mía empezó con 30 minutos de retraso. Casi me daba un ataque de pánico con cada 5 minutos de retraso, porque tenía que avisar a la gente del evento de Docker, en el otro sitio, que iban moviendo mi charla en función de eso. El plan estaba claro: dar mi charla de 30 minutos, sin preguntas, correr a coger un taxi, ir a las oficinas de AWS (8 minutos en coche sin tráfico), subir al piso correcto de la torre, esperar mi turno, dar la charla, interactuar lo mínimo, bajar de la torre, coger otro taxi y volver a la conferencia con la esperanza de que no hubiera terminado.

Subí al escenario y, para mi sorpresa, no estaba nada nervioso. Sin temblor en la voz, con algo de tos, pero ya sabes que es invierno y suelo sufrirla en esta época del año. Todo fue sobre ruedas, así que di la charla a tiempo y no hubo preguntas. La primera parte del gran día estaba hecha. Puedes encontrar las slides aquí: [Testing GenAI apps in Go](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Gophercon_SG.pdf). Ahora, a la segunda.

{{< flex-gallery 
    src_1="ok-talk.png" 
    alt_1="Manu contento tras la charla" 
    caption_1="ACK0. Avisando a Ajeet de que había terminado mi charla en Gophercon y me iba al otro sitio."
    src_2="empty-venue.png" 
    alt_2="Sala vacía antes del evento"
    caption_2="ACK1. Ajeet me mandaba fotos de la sala. Él estaba en Bangalore, pero me tenía al día en tiempo real."
    src_3="waiting-venue.png" 
    alt_3="Sala en espera" 
    caption_3="ACK2. La gente esperando a que empezara el evento."
>}}

Pero déjame decir que me habría encantado ver el resto de las charlas, sobre todo la de Bjorn, **Mocking your codebase without cursing it**. Lo conocí en la after party y sabe un montón. La veré en cuanto se publique en YouTube.

Me comprometí con el plan y lo seguí. Solo el tráfico estuvo en mi contra. Lo demás fue fácil porque la organizadora de Cloudera hizo un gran trabajo reteniendo mi charla hasta que llegué. Tuve suerte de llegar en la pausa de la comida, así que solo esperé 15 minutos hasta subir al escenario.

{{< flex-gallery 
    src_1="food-ready.png" 
    alt_1="Comida lista" 
    caption_1="ACK3. ¡La comida estaba lista! Yo era el siguiente."
    src_2="samriddhi-1.png" 
    alt_2="Con Samriddhi de Cloudera"
    caption_2="GRACIAS. En los poquísimos minutos que estuve allí, Samriddhi (Cloudera) me ayudó muchísimo con el horario. Me hizo sitio, me presentó al público y me dio algunos regalos de ponente. Básicamente me calmó después de tanto estrés ese día. Hice esta foto para decirle a Ajeet que ya había llegado al sitio a tiempo."
>}}

Había 140 personas en la sala y no eran desarrolladores de Go, así que volví a decir que todo lo que aparecía en las slides se podía aplicar a cualquier lenguaje de programación, porque Testcontainers es políglota. La mayoría trabajaba con Python, otra señal más a favor de invertir en este lenguaje.

Hubo algunas preguntas, y bastante duras, de la misma persona: en la parte del cálculo de la similitud del coseno, le preocupaba usar otro algoritmo de similitud. Respondí que, como ahí hablamos con la base de datos vectorial para recuperar los documentos relevantes, no estaba seguro de si ese algoritmo se podía cambiar en el lado de la base de datos, y que probablemente era una buena pregunta para nuestro amigo Marcin, de Weaviate. Y en la parte de usar la similitud del coseno en los tests para verificar las respuestas de un LLM, ahí podemos usar lo que queramos, así que a esa pregunta le dije que sí, que se puede usar otro algoritmo de similitud, porque es el código de nuestros propios tests.

Terminé la charla, no hubo más preguntas y decidí volver a Gophercon. Samriddhi me dio algunos regalos de Cloudera, hizo unas fotos e incluso escribió [un post en LinkedIn sobre mi charla](https://www.linkedin.com/posts/samriddhibhatnagar_singaporemeetup-generativeai-docker-activity-7288569396040515584-aBIS?utm_source=share&utm_medium=member_desktop).

{{< flex-gallery 
    src_1="samriddhi-2.png" 
    alt_1="Samriddhi de Cloudera dándome un regalo"
    single_row_1="true"
    caption_1="PARTNERS. A los ponentes nos dieron algunos regalos: una libreta, un bolígrafo y una botella (Cloudera), y una camiseta (Neo4j)"
    src_2="aws-talk.png" 
    alt_2="Otro meetup a rebosar"
    caption_2="OTRA VEZ A REBOSAR: ¡Mucha gente en la sala de nuevo!"
>}}

Puedes encontrar las slides del [Cloud Native AI Day Singapore aquí](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Cloud-Native_AI_Day_Singapore.pdf).

De vuelta en Gophercon, llegué a tiempo de ver la última parte de la keynote de cierre de Ron: Life, the Universe, and everything GO. Todo el mundo me había dicho durante la semana que no me la perdiera en persona, porque iba a pasar algo que no saldría en los vídeos. Eso me tuvo muy preocupado toda la semana, porque era muy probable que me la perdiera por culpa del otro evento. Por suerte, el cosmos fue un poco generoso y pude ver al menos una parte en directo. ¿Y qué pasó? Lo que pasa en SG se queda en SG.

{{< flex-gallery 
    src_1="gopherbot.png" 
    alt_1="Gopherbot"
    caption_1="GOPHERBOT. TinyGo dando vida a un peluche de Gopher."
    src_2="with-ron.png" 
    alt_2="Ron Evans y yo"
    caption_2="AMIGOS. En este viaje me hice un buen amigo."
>}}

Hubo una after party y conecté con más asistentes y otros ponentes. Por ejemplo, Andreia Camila, de Brasil. ¡Vino a pedirme una foto porque le encantaba Testcontainers! Le di una camiseta y unos stickers para su equipo en Brasil y le encantaron.

### Sábado

Para mí, el último día de un viaje al extranjero ya es el último: el cuerpo sigue allí, pero la cabeza quiere estar en casa cuanto antes. Me esperaban 13 horas de vuelo hasta Múnich, 2,5 horas de escala y otras 2,5 horas hasta Madrid, así que tenía la cabeza frita. Y el vuelo salía a las 23:15, así que tenía el día entero para darle vueltas. Por suerte los organizadores habían preparado algo para ese día, y fuimos juntos a comer.

Así que hice la maleta, la dejé en recepción del hotel y fui andando a Little China para descubrir esa parte de la ciudad antes de comer. Compré unos recuerdos, entré en el enorme centro comercial Buggis (¿cuántos centros comerciales hay en SG, cientos?) y por fin quedé con el resto para comer. Fue genial volver a compartir tiempo con ellos.

{{< flex-gallery 
    src_1="speakers.png" 
    alt_1="Ponentes después de la conferencia"
    caption_1="TESTCONTAINERS. ¡Mirad la camiseta de Ron! Me dijo que ya había usado la librería en otros proyectos, así que por qué no darle la última de las camisetas que traje conmigo. Valentine, Vito, Dave, Bjorn, Ron y yo."
>}}

Al final volví al hotel a por la maleta y cogí un autobús al aeropuerto. Allí, mientras esperaba el vuelo, vi en una pantalla grande un partido de fútbol de LaLiga.

---

_Recursos:_
- _[Testing GenAI applications in Go (vídeo)](https://www.youtube.com/watch?v=cj6vtDG7bWs): mi charla en GopherCon Singapore 2025_
- _[Slides de GopherCon Singapore 2025](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Gophercon_SG.pdf)_
- _[Slides del Cloud-Native AI Day Singapore](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Cloud-Native_AI_Day_Singapore.pdf)_
