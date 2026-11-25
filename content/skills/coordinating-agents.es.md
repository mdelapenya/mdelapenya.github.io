---
title: "coordinating-agents"
description: "Permite que dos o más agentes de código en una misma máquina trabajen en una tarea a través de una carpeta compartida, para que dejes de copiar mensajes entre sus ventanas."
weight: 2
---

## Qué hace

coordinating-agents te sustituye como intermediario cuando dos o más agentes de código (por ejemplo Claude Code y Codex) trabajan en la misma tarea en la misma máquina. Los agentes intercambian ficheros de mensaje numerados en una carpeta de canal dentro del directorio git del repositorio. Cada uno escribe solo sus propios ficheros, vigila los nuevos y pasa el turno, mientras tú decides en lugar de retransmitir.

## Cuándo usarla

Úsala cuando de otro modo pegarías la respuesta de un agente en la ventana de otro: "coordinate the task with" otro agente, "talk to the other agent", "hand this off to Codex", "work this out with" un agente con nombre, "join the channel", o cuando pegas la ruta de un canal de otro agente.

No da autoridad nueva a ninguno de los dos agentes, y no se aplica a los subagentes que una sesión lanza por sí misma: para esos usa el propio mecanismo de envío del runtime.

## Cómo funciona

1. El iniciador crea el canal en `<git-common-dir>/coordination/<topic>/` y escribe su `README.md`: la tarea, los miembros, la autoridad y los límites (por defecto 6 mensajes por miembro, un sondeo de 30 segundos y un límite de inactividad de 30 minutos).
2. Imprime un párrafo para que lo pegues en la sesión del otro agente. Ese pegado es el único relevo que haces tú.
3. Cada miembro ejecuta en segundo plano un script vigilante que lo despierta cuando otro miembro escribe.
4. Lee los mensajes nuevos, hace el trabajo que su autoridad permite, publica una respuesta y marca lo que ha leído.
5. Cuando varios miembros editan un mismo fichero, cada uno toma antes un bloqueo y edita solo sus propias secciones.
6. Un miembro acepta una versión concreta de un artefacto, por su nombre. El silencio no es aceptación.
7. El bucle se detiene cuando todos los miembros han terminado, cuando uno está bloqueado esperándote, cuando se alcanza el tope de rondas o cuando el canal lleva demasiado tiempo inactivo.

Los scripts auxiliares se ejecutan en un pequeño contenedor Docker `busybox:1.37-uclibc` en todos los hosts, así que Docker es necesario: sin él, el agente informa de un bloqueo y no recurre a la shell del host salvo que tú lo digas. El canal es espacio de trabajo temporal y nunca se hace commit de él.

## Funciona si

- Recibes un párrafo para pegar en el otro agente, y después solo actualizaciones de una línea sobre lo que ha llegado y lo que se ha respondido.
- El iniciador no dice que el otro agente se ha unido hasta que existe el primer fichero de mensaje de ese agente.
- Aparece una carpeta de canal con un `README.md` y ficheros de mensaje con nombre por remitente y número.
- Al final recibes un informe, una vez que todos los miembros tienen una marca de terminado.

## Evidencia

El escenario le pide al agente que monte un canal para una revisión de código entre pares, y puntúa la forma del comando de Docker y el formato de los mensajes. Sin el plugin la puntuación fue 25; con él, 100, y la resolución costó menos (<span>0,81 $</span> en lugar de <span>1,23 $</span>). Es un escenario con una ejecución por brazo, y al repetirlas las puntuaciones se movieron hasta unos 10 puntos. Prueba la puesta en marcha de un canal, no una sesión larga entre dos agentes activos. El agente de la eval fue `claude` con `deepseek-v4.1-flash`, no el modelo para el que están ajustadas las skills.

## Más información

- [Yo era el bus de mensajes](/es/posts/2026-10-12-yo-era-el-bus-de-mensajes/)
- [Una skill tiene que superar al agente sin ella](/es/posts/2026-11-26-una-skill-tiene-que-superar-al-agente-sin-ella/)
- [SKILL.md de coordinating-agents en GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/coordinating-agents/SKILL.md)
- ¿Has encontrado un problema, o tienes un escenario que la skill debería cubrir? [Abre una issue](https://github.com/mdelapenya/coding-skills/issues). Los escenarios de la eval están en `evals/` de ese repositorio.
