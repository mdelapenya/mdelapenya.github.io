---
title: "Programar con agentes de IA es como conducir un Tesla con Autopilot"
date: 2026-02-24 09:00:00 +0100
description: "Lo que conducir un Tesla con Autopilot me enseñó sobre trabajar con agentes de IA para programar. Los dos son asistentes potentes que exigen supervisión activa, no pasajeros pasivos."
categories: [Technology, AI, Software Development]
tags: ["artificial-intelligence", "coding-agents", "developer-experience", "automation", "claude-code", "github-copilot"]
type: post
weight: 30
translationKey: coding-with-agents-like-tesla-autopilot
translatedFrom: f67c35f
---

![Programar con agentes de IA es como conducir un Tesla con Autopilot](/images/posts/2026-02-24-coding-with-agents-like-tesla-autopilot/cover.png)

Llevo un año programando con agentes de IA y hace poco me cayó la ficha: la experiencia se parece muchísimo a conducir mi Tesla con el Autopilot activado. No el Full Self-Driving (Supervised), sino el Autopilot básico, el sistema de asistencia de nivel 2 que se encarga de la dirección y del control de crucero adaptativo mientras tú sigues siendo el responsable del vehículo.

La analogía no es perfecta, pero es sorprendentemente certera para explicar cómo es trabajar con agentes de IA en 2026.

## La promesa: manos en el volante, ojos en la carretera

El Autopilot de Tesla es, de forma explícita, un sistema de asistencia a la conducción: manos en el volante, ojos en la carretera, cabeza metida de lleno. Los agentes de IA como Claude Code y GitHub Copilot hacen la misma promesa. Pueden generar código repetitivo (boilerplate), depurar problemas y refactorizar módulos enteros, pero quien desarrolla sigues siendo tú. Tú revisas los cambios, validas la lógica y compruebas que el código resuelve de verdad el problema.

## La autopista: cuando todo funciona

Conducir con Autopilot por una autopista despejada impresiona de verdad. El coche mantiene el carril, ajusta la velocidad al tráfico y toma las curvas suaves. Tú vigilas en lugar de microgestionar. Tu carga cognitiva baja.

Con los agentes pasa lo mismo en las tareas sencillas. ¿Escribir tests de integración siguiendo un patrón ya establecido? ¿Migrar módulos a una API nueva? El agente lo resuelve rápido y bien, sobre todo si has fijado tú el patrón antes.

Lo viví en primera persona [refactorizando 60 módulos Go en Testcontainers](/posts/2025-10-10-coding-agents). Después de migrar a mano 19 módulos para aprender el patrón, usé Claude Code para migrar los 41 restantes en solo 3 días: una mejora de **5x**. Una vez confirmado que el patrón funcionaba, el agente lo aplicó en todos los módulos que quedaban sin variaciones, sin errores de copiar y pegar y sin olvidarse de ningún paso.

## La ciudad: cuando importa el criterio

Conducir en ciudad con Autopilot es otra historia. Obras, incorporaciones, marcas viales borradas. El sistema frena ante los obstáculos, pero no entiende el contexto. Ese camión mal aparcado en doble fila no se va a mover, y eres tú quien tiene que cambiar de carril con antelación. Ya no vigilas: copilotas de forma activa.

Los agentes se enfrentan al mismo reto con las tareas complejas y llenas de contexto. El agente lo intenta y a veces acierta, pero otras se deja fuera contexto clave o parte de suposiciones razonables que resultan erróneas.

Un ejemplo real: le pedí a un agente que añadiera una wait strategy para un contenedor de base de datos:

```go
testcontainers.WithWaitStrategy(
    wait.ForLog("database system is ready to accept connections"),
)
```

El código compilaba. Los tests pasaban. Pero el mensaje de log cambia entre versiones de la base de datos: a veces es "ready to accept connections" y otras "accepting connections". Un enfoque más robusto sería esperar a que el puerto esté escuchando, o usar un health check que no dependa del formato del log. Tuve que revisar con atención y rechazar código técnicamente correcto porque rompía decisiones de arquitectura que el agente no podía ver.

## La paradoja de la supervisión

Aquí las dos experiencias convergen en algo contraintuitivo: **usarlos bien exige que estés tan implicado como si lo hicieras a mano, pero de otra manera.**

Cuando conduzco con Autopilot, no voy más relajado. Voy concentrado en otra cosa. Miro la carretera *y* el comportamiento del sistema. No me basta con prever qué van a hacer los otros conductores: tengo que prever cómo va a interpretar el Autopilot lo que hagan.

Con los agentes de código es el mismo cambio. No programo menos, programo distinto. El agente escribe el código, pero yo respondo de que sea el código *correcto*.

## Cuándo desactivarlo: conoce tus límites

A veces el agente no sabe que se le ha quedado grande la tarea. Genera con total seguridad código que está sutilmente mal. Es como un Autopilot que sigue activado cuando la carretera se ha complicado demasiado, pero el sistema todavía no se ha dado cuenta.

**Tú** tienes que saber cuándo tomar el control manual:

- Fronteras críticas de seguridad
- Optimizaciones sutiles de rendimiento
- Gestión de estado compleja con condiciones de carrera
- Integración con sistemas de terceros mal documentados
- Algoritmos o enfoques novedosos

Desconecta al agente y escríbelo tú. Después siempre puedes pedirle que revise tu trabajo.

## La pregunta de la productividad neta

Se debate cada vez más si las herramientas de IA hacen realmente más productivos a los desarrolladores. Lo que importa no es la generación de código aislada. Es todo el flujo de trabajo, desde los requisitos hasta el código entregado y probado.

**Me hacen más rápido en:**
- Código repetitivo (boilerplate)
- Escribir tests de funciones sencillas
- Generar documentación
- Explorar bases de código desconocidas
- Prototipar ideas

**No me sustituyen en esto, pero sí me aceleran:**
- Entender requisitos complejos (decido yo, pero el agente copilota la exploración)
- Diseñar la arquitectura de sistemas (las decisiones son mías, pero el agente me ayuda a pensar los trade-offs)
- Depurar problemas sutiles (yo pego el stacktrace y el agente acota el espacio de búsqueda)

**Aquí no ayudan de verdad:**
- Aprender tecnologías nuevas a fondo (los atajos al aprender dejan huecos más adelante)

¿El resultado neto? Soy más productivo en todos los frentes. El agente se ocupa del trabajo mecánico *y* copilota lo difícil. Las decisiones las sigo tomando yo, pero llego antes.

## La curva de aprendizaje: confía, pero verifica

Quien empieza con el Autopilot o confía demasiado o confía muy poco. Confiar demasiado lleva a la complacencia y a sustos peligrosos. Confiar poco lleva a ir agarrado al volante con los nudillos blancos, y así se pierde cualquier beneficio.

Con los agentes ocurre igual. Los desarrolladores junior aceptan las sugerencias con demasiada facilidad y se cuelan bugs. Los senior descartan a los agentes por "poco útiles" porque las primeras sugerencias no fueron del todo acertadas. El punto óptimo es una confianza calibrada, que se aprende con la experiencia y no tiene atajos.

## El futuro: mejor asistencia, no sustitución

Los agentes de código mejoran (más conciencia del contexto, menos alucinaciones, implementaciones más precisas), pero la dinámica de fondo no cambia: **son sistemas de asistencia, no de sustitución.**

Eso sí, la analogía tiene un giro. Imagina que Tesla tuviera un "modo circuito de pruebas": una pista cerrada, sin peatones, sin tráfico, sin consecuencias. Podrías dejar que el FSD condujera con autonomía total, llevarlo al límite, dejar que se equivocara y aprendiera de sus errores. No harían falta las manos en el volante porque *no hay nada contra lo que chocar*. El coche podría asumir riesgos que serían una temeridad en una carretera real, y tú solo revisarías la telemetría después.

Eso es exactamente lo que ofrecen los [Docker Sandboxes](https://www.docker.com/blog/docker-sandboxes-run-claude-code-and-other-coding-agents-unsupervised-but-safely/) a los agentes de código. Una microVM aislada donde el agente trabaja con total autonomía (instala paquetes, ejecuta tests, modifica archivos) sin ninguna posibilidad de afectar a tu máquina. Dejas de supervisar y empiezas a delegar: "refactoriza estos módulos, ejecuta todos los tests, arregla lo que falle". Revisas los resultados cuando termina, no mientras conduce.

Y va más allá. Imagina tener *varios* circuitos de pruebas funcionando en paralelo, cada coche probando una ruta distinta, una estrategia distinta. Eso es lo que añaden los git worktrees: ramas aisladas donde varios agentes trabajan en tareas separadas a la vez, sin pisarse. De esto, más pronto.

El paradigma correcto es la asistencia supervisada para el trabajo en producción, y la autonomía en un sandbox para las tareas seguras. Manos en el volante cuando importa, circuito de pruebas cuando no.

## Conclusión: manos al volante, mente despierta

La tecnología es útil de verdad. Me hace más productivo en proyectos reales. Pero no es magia, y todavía no está lista para conducir sola. El agente se luce en los tramos de autopista; en la ciudad sigues navegando tú.

Manos en el teclado, ojos en el código y la cabeza metida de lleno. Y así es como debe ser.

---

_Recursos:_
- _[Testcontainers Claude Skills](https://github.com/testcontainers/claude-skills) - Skills oficiales de Claude Code para trabajar con infraestructura de testing basada en contenedores_
- _[Docker Sandboxes for AI Agents](https://docs.docker.com/ai/sandboxes/) - Ejecuta agentes de código sin supervisión pero con seguridad, en entornos microVM aislados_
