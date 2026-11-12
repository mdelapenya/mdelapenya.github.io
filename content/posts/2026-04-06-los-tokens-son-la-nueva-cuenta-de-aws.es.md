---
title: "Los tokens son la nueva cuenta de AWS"
date: 2026-04-06 09:00:00 +0200
description: "Hace diez años, las empresas que no te daban una cuenta de AWS se quedaban atrás. Hoy pasa lo mismo con los tokens de IA. Un agradecimiento a Docker por acertar, y una advertencia sobre medir la productividad por consumo."
categories: [Technology, AI, Software Development]
tags: ["ai", "tokens", "developer-experience", "docker", "productivity"]
type: post
weight: 30
translationKey: tokens-are-the-new-aws-account
translatedFrom: 6823ac3
---

![Los tokens son la nueva cuenta de AWS](/images/posts/2026-04-06-tokens-are-the-new-aws-account/cover.png)

Hace diez años, si tu empresa no te daba una cuenta de AWS, te tocaba montar servidores debajo de tu mesa. Las empresas que lo entendieron vieron que dar acceso a la nube a sus ingenieros no era un coste. Era un multiplicador. Las demás se quedaron atrás.

Hoy está pasando lo mismo con los tokens de IA. Y la mayoría de las empresas todavía no se ha dado cuenta.

## La prueba de la cuenta de AWS

Hacia 2014, el acceso a la nube se convirtió en la prueba del algodón de la cultura de ingeniería. Si tu empresa te hacía abrir un ticket de tres semanas para levantar una VM, ya sabías por dónde iban los tiros. Si aprovisionar un entorno de pruebas exigía la firma de dos managers y una revisión de presupuesto, no trabajabas en una empresa que confiara en sus ingenieros.

Las buenas empresas te daban una cuenta de AWS el primer día. No porque la computación en la nube fuera barata, sino porque la alternativa era peor: ingenieros bloqueados, experimentos que nunca se ejecutaban, prototipos que no salían del portátil de alguien. Sí, las instancias de EC2 olvidadas tienen bien ganada su fama de vaciar presupuestos en silencio (los memes se escriben solos). Pero el coste de un ingeniero parado una semana porque no podía levantar un entorno de pruebas era peor, y mucho más difícil de ver en un panel.

No iba de gastar a lo loco. Iba de quitar la barrera entre "tengo una idea" y "voy a probarla". Las empresas que la quitaron entregaron más rápido, aprendieron más rápido y atrajeron a mejores ingenieros. Las que no, acabaron explicando a los candidatos por qué todavía había que entrar por SSH a un servidor de staging compartido.

## Llega la economía de los tokens

Los tokens de IA son esa misma prueba, puesta al día para 2026.

Un ingeniero con acceso a un LLM puede prototipar un cliente de API en minutos en lugar de horas. No porque el LLM escriba código perfecto, sino porque comprime el ciclo de iteración. Describes lo que quieres, obtienes un primer borrador, lo refinas y vas aprendiendo por el camino. El ciclo de feedback que antes se llevaba una mañana ahora dura un cuarto de hora.

Esto no va de sustituir el pensamiento por tokens. Va de amplificarlo. Cuando exploro un proyecto nuevo, ya no me leo la documentación entera de principio a fin. Le pido al modelo que me explique los conceptos centrales, pruebo un par de ejemplos y solo profundizo donde lo necesito. Después escribo dos o tres [skills que representan los distintos roles de desarrollo](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/) del proyecto (por ejemplo, un ingeniero backend de Go y un ingeniero frontend de NextJS). Los tokens no aprenden por mí. Aceleran mi aprendizaje.

Las empresas que hoy dan a sus ingenieros un presupuesto de tokens hacen la misma apuesta que hicieron hace una década las empresas de la cuenta de AWS: que un ingeniero sin bloqueos vale más que lo que cuestan los recursos que consume. Y igual que el acceso a la nube, el acceso a tokens se está convirtiendo en lo mínimo exigible. Si tu empresa no lo ofrece, tus ingenieros o pagan de su bolsillo o no usan IA. Ninguna de las dos opciones habla bien de la empresa.

## Cómo uso mis tokens

Lo concreto con mi día a día.

**Aprender.** Cuando necesito entender una API, una librería o un patrón de diseño, abro una conversación con el modelo. No para que me dé la respuesta, sino para acelerar el proceso de encontrarla. Sigo leyendo el código fuente. Sigo ejecutando los tests. Pero el modelo me ayuda a construir un mapa mental más rápido, y así sé dónde mirar.

**Prototipar.** Uso [Claude Code como mi agente de programación principal](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot). Cuando quiero probar un enfoque nuevo, lo describo, obtengo un borrador e itero. La mayoría de los prototipos no sobreviven. Ese es el objetivo. Los tokens me dejan fallar más rápido y más barato.

**Flujos con agentes.** Ejecuto [cuatro agentes en paralelo sobre git worktrees separados](/posts/2026-03-23-level-5-in-practice-four-agents-four-worktrees-one-developer), cada uno con una tarea autocontenida. Cada agente consume tokens. Cada uno me ahorra horas. El coste en tokens de cada worktree es una fracción del tiempo de ingeniería que sustituye.

**Pipeline de contenido.** [Eliminé toda la fricción de mi pipeline del blog](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day) construyendo skills específicas para planificar, escribir, editar y promocionar posts. Cada skill gasta tokens. El resultado: pasé de publicar una vez al mes a publicar cada dos días.

Nada de esto va de generar volumen. Va de acelerar el feedback. Los tokens son el combustible del ciclo de aprendizaje, no un sustituto de él.

## Gracias, Docker

Quiero tomarme un momento para dar las gracias en público a mi empresa, [Docker](https://www.docker.com/), por hacer esto bien.

Docker da presupuestos de tokens a sus ingenieros. No como experimento. No como programa piloto para unos pocos elegidos. Como parte normal de nuestra forma de trabajar. El mensaje es claro: confiamos en que uses estas herramientas, e invertimos en tu capacidad de aprender y de entregar.

Esto pesa más que casi cualquier beneficio. Cada prototipo que construyo, como el [gestor de git worktrees (gwaim)](/posts/2026-03-21-gwaim-the-tool-that-level-5-needed), cada librería que exploro, cada flujo que optimizo con tokens de IA me hace más eficaz en mi trabajo de verdad.

Eso es "invertir en tus ingenieros" en 2026. No mesas de ping-pong. No neveras con cerveza. Cómputo.

Docker lo entendió pronto. Y se lo agradezco.

## Pero no midas el recibo

Aquí la historia pide un poco de cautela.

Jensen Huang dijo hace poco que le [preocuparía "profundamente"](https://www.businessinsider.com/jensen-huang-500k-engineers-250k-ai-tokens-nvidia-compute-2026-3) que un ingeniero de 500.000 dólares no consumiera al menos 250.000 dólares en tokens al año. Según se cuenta, NVIDIA [intenta gastar 2.000 millones de dólares al año](https://www.cnbc.com/2026/03/20/nvidia-ai-agents-tokens-human-workers-engineer-jobs-unemployment-jensen-huang.html) en tokens para su equipo de ingeniería.

La visión es atractiva. La métrica es peligrosa.

En cuanto mides la productividad de un ingeniero por los tokens que consume, has reinventado la falacia de las líneas de código. Tardamos décadas en aprender que más líneas de código no significan más valor. Un ingeniero que borra 500 líneas y las sustituye por 50 puede haber aportado más que uno que añade 1.000. Con los tokens pasa igual.

Un ingeniero que gasta 10.000 tokens en entender a fondo un problema y escribe una solución limpia y mínima puede ser más productivo que otro que quema 500.000 tokens generando código de relleno que apenas revisa. El consumo de tokens mide actividad, no impacto.

Ya he escrito sobre los [seis niveles del desarrollo asistido por IA](/posts/2026-03-18-the-six-levels-of-ai-assisted-development). En todos ellos, el valor sale del criterio del ingeniero: saber qué pedir, qué conservar y qué tirar. Los tokens amplifican el criterio. No lo sustituyen. Y el criterio no se mide contando tokens.

Da tokens a tus ingenieros. Confía en que los usarán bien. Pero, por favor, no conviertas el recibo en un KPI.

---

_Recursos:_
- _[Jensen Huang sobre los tokens como beneficio (CNBC)](https://www.cnbc.com/2026/03/20/nvidia-ai-agents-tokens-human-workers-engineer-jobs-unemployment-jensen-huang.html)_
- _[La historia completa del objetivo de 250.000 dólares en tokens de Huang (Business Insider)](https://www.businessinsider.com/jensen-huang-500k-engineers-250k-ai-tokens-nvidia-compute-2026-3)_
