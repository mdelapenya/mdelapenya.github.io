---
title: "the-mister"
description: "Planifica un cambio de varios pasos como un grafo de tareas, entrega cada una a un subagente más barato y acepta el resultado solo con pruebas."
weight: 1
---

## Qué hace

the-mister es un gestor para una implementación de varios pasos. Planifica el trabajo como un grafo de nodos, escribe una orden de trabajo para cada uno y lo envía a un subagente elegido por dificultad: el modelo más capaz para los nodos difíciles, uno intermedio para los medios y el más barato para los fáciles o mecánicos. No edita código ni ejecuta comandos por sí mismo. Acepta cada resultado solo con pruebas frente a criterios de aceptación explícitos.

## Cuándo usarla

Úsala para un cambio lo bastante grande como para dividirlo: "orchestrate this", "plan and delegate", "build a DAG for this feature", "use the squad", "ask the mister" o "delegate to cheaper models". Mientras hay un plan activo, frases de seguimiento como "now add" o "next step" lo continúan.

No se aplica a arreglos de un solo fichero ni a tareas que caben en una llamada a un subagente. Si toda la tarea cabe en un nodo, lo dice.

## Cómo funciona

1. Planifica el grafo, lo muestra en modo plan y, tras la aprobación, escribe `plan.md` e imprime el slug. "Plan only" se detiene ahí.
2. Escribe una orden por cada nodo listo, con el resultado esperado, los invariantes, los ficheros que le pertenecen al nodo y las comprobaciones a ejecutar.
3. Envía los nodos independientes en paralelo, solo cuando sus ficheros no se solapan.
4. Acepta un nodo solo con pruebas en su informe. Un nodo fallido se reintenta según la causa, con un presupuesto de tres envíos.
5. Un revisor que no planificó el trabajo revisa todo el cambio antes de hacer ningún commit.
6. Siguen tres pasos de git: una comprobación previa de solo lectura, el staging y el commit.
7. Imprime un informe final con el slug, los commits, las pruebas, la revisión, las recuperaciones y los puntos abiertos.

Todos los comandos `git`, `gh` y `glab` se ejecutan en el nivel más barato. El estado vive en `<git-dir>/the-mister/<slug>/`, así que puedes reanudar con `--slug`.

Instalarla con `npx skills` o Tessl no instala sus seis agentes de Claude Code. Sin ellos, los trabajadores recurren a subagentes de propósito general y los límites de cada rol pasan a ser solo instrucciones, a menos que enlaces los agentes como se describe en la Option 3 del README de coding-skills.

## Funciona si

- Ves el grafo, con niveles y dependencias, antes de que empiece ningún trabajo, y se imprime un slug tras la aprobación.
- Cada informe de nodo llega con pruebas frente a sus criterios de aceptación.
- No se hace staging ni commit de nada hasta que pasan la revisión independiente y la comprobación previa.
- El informe final nombra el slug, la rama, los commits y el resultado, con secciones de pruebas, revisión, recuperaciones y puntos abiertos.

## Evidencia

Los cuatro escenarios prueban escribir un plan aprobado, escribir órdenes de trabajo, aceptar y recuperar nodos, y la puerta del commit. Con el plugin el agente obtuvo 99, 98 y 100 en el plan, las órdenes y la puerta del commit, frente a 37, 62 y 58 sin él, con un coste más alto, salvo en el plan, donde el coste es casi el mismo. El escenario 12 (aceptación y recuperación) es el más débil, con 73 usando el plugin. El escenario 13 dejó al descubierto una carencia de la skill, que la versión 2.7.2 corrige. Cada brazo es una sola ejecución, y al repetirlas las puntuaciones se movieron hasta unos 10 puntos. El agente de la eval fue `claude` con `deepseek-v4.1-flash`, no el modelo para el que están ajustadas las skills.

## Más información

- [El míster, fichero a fichero](/es/posts/2026-10-25-el-mister-fichero-a-fichero/)
- [Un modelo más barato puede ser un mejor instrumento](/es/posts/2026-10-09-un-modelo-mas-barato-puede-ser-mejor-instrumento/)
- [Yo era el bus de mensajes](/es/posts/2026-10-12-yo-era-el-bus-de-mensajes/)
- [Una skill tiene que superar al agente sin ella](/es/posts/2026-11-26-una-skill-tiene-que-superar-al-agente-sin-ella/)
- [SKILL.md de the-mister en GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/the-mister/SKILL.md)
- ¿Has encontrado un problema, o tienes un escenario que la skill debería cubrir? [Abre una issue](https://github.com/mdelapenya/coding-skills/issues). Los escenarios de la eval están en `evals/` de ese repositorio.
