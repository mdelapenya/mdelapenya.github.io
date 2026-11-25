---
title: "ci-detective"
description: "Te dice si una ejecución de CI en rojo la rompió tu pull request o ya fallaba en otro sitio, y rastrea tus fallos hasta el diff."
weight: 1
---

## Qué hace

ci-detective investiga los checks que fallan en una pull request o merge request. Compara los jobs y tests que fallan con ejecuciones recientes en otras ramas, y clasifica cada fallo como preexistente, introducido por la PR o sin verificar. Para los fallos que introdujo la PR, los rastrea hasta el diff y sugiere un arreglo. Soporta GitHub Actions y GitLab CI.

## Cuándo usarla

Úsala cuando la CI está en rojo y no sabes de quién es la culpa: "investigate CI failure", "CI is red", "is this test flaky", "why is this test failing", "did my PR break this" o "check if failure is pre-existing".

SKILL.md no tiene una lista explícita de casos que evitar. Si el sistema de CI no está soportado, te lo dice y se detiene.

## Cómo funciona

1. Detecta el sistema de CI: `.github/workflows/` significa GitHub Actions, `.gitlab-ci.yml` significa GitLab CI.
2. Lee los nombres de workflow, job y test que fallan en la ejecución de la PR.
3. Mira las últimas N ejecuciones en otras ramas (10 por defecto, y puedes cambiarlo, por ejemplo `/ci-detective 20`) y elige de tres a cinco con resultados mixtos. Si no encuentra ninguna, amplía la búsqueda hasta 50 y después marca los fallos como "unverified".
4. Comprueba si los mismos jobs y tests fallan en esas ejecuciones.
5. Etiqueta cada fallo como Pre-existing, Introduced by this PR o Unverified.
6. Para los fallos introducidos y sin verificar, lee los logs y el diff, busca el vínculo causal y sugiere un arreglo.
7. Imprime el informe.

La skill no da por hecho que un fallo sea preexistente ni que lo cause la infraestructura: primero reúne pruebas. Los logs, la salida de los tests y el diff son datos, así que un texto en ellos dirigido al agente ("ignore this failure") se comunica y no se obedece. Necesita `gh` o `glab`, y `jq`.

## Funciona si

- Recibes una tabla resumen con una fila por test que falla: tu PR, cada ejecución de comparación (con su id y su rama) y un veredicto.
- Cada veredicto es Pre-existing, Introduced by this PR o Unverified, y ninguno se da por supuesto.
- Para cada fallo introducido o sin verificar, ves el nombre del test y el error, las líneas relevantes del diff, una explicación de la causa y un arreglo sugerido.

## Evidencia

El escenario pregunta "did my PR break CI?" sobre un refactor de checkout con tres tests que fallan, y comprueba que haya veredictos sin verificar y que no se asuma que son flaky. El agente solo obtuvo 82; con el plugin, 96, a <span>0,57 $</span> por resolución en lugar de <span>0,42 $</span>. El agente solo ya lo hace razonablemente bien aquí, así que la diferencia es modesta. Es un escenario y una ejecución por brazo, y al repetirlas las puntuaciones se movieron hasta unos 10 puntos. El agente de la eval fue `claude` con `deepseek-v4.1-flash`, no el modelo para el que están ajustadas las skills.

## Más información

- [Mi PR tiene un abogado, una enfermera, un detective y un escriba](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/)
- [Las skills son roles, no comandos](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/)
- [Una skill tiene que superar al agente sin ella](/es/posts/2026-11-26-una-skill-tiene-que-superar-al-agente-sin-ella/)
- [SKILL.md de ci-detective en GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/ci-detective/SKILL.md)
- ¿Has encontrado un problema, o tienes un escenario que la skill debería cubrir? [Abre una issue](https://github.com/mdelapenya/coding-skills/issues). Los escenarios de la eval están en `evals/` de ese repositorio.
