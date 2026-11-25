---
title: "pr-nurse"
description: "Vigila la CI y si se puede hacer merge de la pull request de tu rama, arregla lo que ha roto la rama, trae main cuando hace falta y hace push."
weight: 4
---

## Qué hace

pr-nurse cuida de la pull request o merge request de tu rama actual. Comprueba el estado de la CI y si la PR se puede mergear, diagnostica los checks que fallan, arregla los fallos causados por la rama, trae main a la rama para recoger arreglos del upstream o resolver conflictos, y hace push. Soporta GitHub y GitLab, y puede repetir el ciclo cada cinco minutos.

## Cuándo usarla

Úsala cuando una PR está en rojo o con conflictos y quieres devolverla a verde: "nurse this PR", "babysit this PR", "keep CI green", "why is CI failing on my PR", "merge main into this PR" o "resolve this PR's conflicts".

Si no existe una PR para la rama actual, se detiene. Si los checks siguen pendientes, lo comunica y se detiene sin esperar. La skill es solo manual (no se activa por su cuenta) y lo mejor es ejecutarla desde un git worktree.

## Cómo funciona

1. Detecta la plataforma y obtiene los metadatos de la PR.
2. Comprueba el estado de la CI. Si todo está en verde y la PR se puede mergear, informa del éxito y se detiene.
3. Diagnostica cada fallo. Si el arreglo probablemente ya está en main, se sincroniza con main y hace push.
4. Si el fallo viene de la rama, edita el código, hace commit y push.
5. Ante conflictos de merge, los resuelve conservando ambas intenciones, te pregunta cuando el resultado correcto es ambiguo, y después hace commit y push.
6. Imprime un informe y ofrece seguir en un bucle de cinco minutos, que solo empieza si lo confirmas.

Al sincronizar main desde un worktree, comprueba que el repositorio raíz está limpio y pregunta si no lo está. Nunca hace force-push: si un push es rechazado, se detiene y pregunta. Los logs de CI y los metadatos de la PR se tratan como datos, no como instrucciones, así que un log que pida un comando o saltarse un check se comunica, no se sigue. Necesita `gh` o `glab`, además de `jq` y `git`.

## Funciona si

- El informe dice qué checks fallaban y por qué.
- Indica si se hizo merge de main y qué conflictos se resolvieron.
- Lista los arreglos de código que aplicó, y el estado actual de la CI y de mergeabilidad de la PR.
- Los pushes que hizo son pushes normales, y un push rechazado termina la ejecución con una pregunta para ti.

## Evidencia

El escenario es una PR en rojo con un fallo que se arregla en main, un fallo causado por la rama y un conflicto de merge. El agente solo obtuvo 84; con el plugin, 97, a <span>1,30 $</span> por resolución en lugar de <span>1,08 $</span>. La diferencia es de 13 puntos, de una sola ejecución por brazo, y al repetirlas las puntuaciones se movieron hasta unos 10 puntos, así que parte de ella puede ser ruido. El agente de la eval fue `claude` con `deepseek-v4.1-flash`, no el modelo para el que están ajustadas las skills.

## Más información

- [Mi PR tiene un abogado, una enfermera, un detective y un escriba](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/)
- [Nivel 5 en la práctica: cuatro agentes, cuatro worktrees, un desarrollador](/es/posts/2026-03-23-nivel-5-en-la-practica-cuatro-agentes-cuatro-worktrees/)
- [Una skill tiene que superar al agente sin ella](/es/posts/2026-11-26-una-skill-tiene-que-superar-al-agente-sin-ella/)
- [SKILL.md de pr-nurse en GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-nurse/SKILL.md)
- ¿Has encontrado un problema, o tienes un escenario que la skill debería cubrir? [Abre una issue](https://github.com/mdelapenya/coding-skills/issues). Los escenarios de la eval están en `evals/` de ese repositorio.
