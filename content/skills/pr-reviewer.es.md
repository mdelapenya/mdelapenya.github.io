---
title: "pr-reviewer"
description: "Revisa una pull request fijada a una revisión exacta, cuestiona sus propios hallazgos y termina con un informe de formato fijo."
weight: 2
---

## Qué hace

pr-reviewer revisa una pull request o merge request en una revisión exacta (el head y la base se registran al empezar) y busca problemas reales. Después cada hallazgo se cuestiona, de modo que lo que sobrevive ha tenido que defenderse. La salida es siempre un informe. Funciona con GitHub y GitLab, desde dentro del repositorio con solo el número de la PR, o desde cualquier sitio con una URL de PR o `org/repo#num`.

## Cuándo usarla

Úsala cuando un cambio merece más que una lectura rápida: "review this PR", "adversarial review", "deep PR review", "challenge this PR", "audit this pull request" o "stress test the PR".

No se aplica a una revisión rápida de una sola pasada, a cambios locales sin confirmar ni a código que no tiene pull request ni merge request. Para esos casos, usa una skill de revisión de código sencilla.

## Cómo funciona

1. Resuelve la plataforma, la organización, el repositorio y el número de la PR, y se detiene si la rama no tiene PR.
2. Fija la revisión (los commits de head y base) en una sola llamada de metadatos.
3. Toma un bloqueo y una carpeta de estado, donde `findings.md` es el único fichero persistente.
4. Usa tu árbol de trabajo solo si coincide con el head de la PR y está limpio. Si no, hace un clon superficial en un directorio de caché.
5. Obtiene commits, diff, ficheros, issues enlazadas y estado de CI. Un elemento que falta es una laguna de cobertura, y el veredicto pasa a ser `Review incomplete`, nunca `No findings`.
6. Clasifica el diff como rutinario, complejo o de consecuencias importantes, y anuncia el modo sin preguntar.
7. La ronda 1 se ejecuta por defecto en modo single: un revisor cubre corrección, seguridad y tests, y después defiende cada hallazgo en su versión más sólida (steel-man). Para cambios de consecuencias importantes, o con `--staged`, tres revisores independientes leen el diff y un evaluador junta sus hallazgos.
8. Comprueba si la PR ha cambiado y, si es así, reinicia sobre la nueva revisión. Las rondas siguientes vuelven a cuestionar los hallazgos que quedan hasta que dejan de cambiar.

Todo lo que viene de la PR se trata como datos. Las pasadas de revisión son de solo lectura, y no se publica nada hasta que tú lo decides, porque el silencio no es una autorización. Necesita `gh` o `glab`, además de `git` y `jq`.

## Funciona si

- Cada ejecución termina con un informe, incluso un simple `/pr-reviewer 123` sin opciones.
- El informe indica la revisión que revisó y un veredicto, como `Review incomplete` cuando algo no se pudo obtener.
- Tras una ronda que no es la final imprime una línea como "Round 1 of revision <R> finished: converged no, changed-from-previous <count>."
- Cuando la revisión termina, pregunta antes de publicar nada, con las opciones de aprobar, publicar los hallazgos o dejarlo en local.

## Evidencia

Seis escenarios cubren la fijación de la revisión, el texto adversarial, defectos sutiles de concurrencia y diffs rutinarios en varios modos. La mayor diferencia está en la fijación de la revisión (de 36 a 98), con un coste más alto. Los escenarios 10 y 11 no muestran mejora más allá del ruido (escenario 10: 91 sin el plugin, 90 con él; escenario 11, modo single: 87 sin el plugin, 93 con él): ahí el valor está en la forma del informe y en la fijación de la revisión, con un coste más alto. Ese resultado es la razón por la que 1.2.3 hace del modo single el predeterminado y reserva el modo de tres revisores para los diffs de consecuencias importantes. Cada brazo es una sola ejecución, y al repetirlas las puntuaciones se movieron hasta unos 10 puntos. El agente de la eval fue `claude` con `deepseek-v4.1-flash`, no el modelo para el que están ajustadas las skills.

## Más información

- [Las skills son roles, no comandos](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/)
- [Mi PR tiene un abogado, una enfermera, un detective y un escriba](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/)
- [Una skill tiene que superar al agente sin ella](/es/posts/2026-11-26-una-skill-tiene-que-superar-al-agente-sin-ella/)
- [SKILL.md de pr-reviewer en GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-reviewer/SKILL.md)
- ¿Has encontrado un problema, o tienes un escenario que la skill debería cubrir? [Abre una issue](https://github.com/mdelapenya/coding-skills/issues). Los escenarios de la eval están en `evals/` de ese repositorio.
