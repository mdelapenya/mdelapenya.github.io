---
title: "pr-lawyer"
description: "Juzga cada comentario de revisión de tu pull request, corrige los válidos, rebate el resto y responde a todos los comentarios."
weight: 3
---

## Qué hace

pr-lawyer toma los comentarios de revisión sin resolver de una pull request o merge request y decide, uno por uno, qué merece cada uno. Un comentario válido recibe una corrección de código. Uno discutible o equivocado recibe un argumento razonado dirigido al revisor. Una pregunta recibe una respuesta sin cambios de código. Soporta GitHub y GitLab, y nunca lo acepta todo ni lo rechaza todo.

## Cuándo usarla

Úsala cuando ya ha llegado una revisión a tu PR: "address PR comments", "respond to review", "reply to review comments", "challenge this comment" o "handle review feedback".

SKILL.md no indica ningún caso en el que no deba usarse. Si no hay comentarios sin resolver, lo dice y se detiene.

## Cómo funciona

1. Detecta la plataforma a partir de `git remote -v` y obtiene los comentarios sin resolver, tanto los de ficheros como los de la PR en conjunto. Puedes pasarle el número de una PR, o usa la PR de la rama actual.
2. Clasifica cada comentario como Accept, Challenge o Clarify, y agrupa los aceptados en conjuntos de cambios relacionados.
3. Muestra el plan (qué corregir, qué rebatir, qué aclarar) y te pregunta antes de actuar.
4. Para cada conjunto edita el código, ejecuta las comprobaciones del propio repositorio y hace commit con un tipo de Conventional Commits como `fix:`, `refactor:`, `style:`, `docs:` o `test:`. Con `--single-commit` hace un único commit.
5. Pregunta "Ready to push to origin?" y hace push solo si lo confirmas. Nunca hace force-push, y si el push es rechazado se detiene y pregunta.
6. Responde a todos los comentarios: "Fixed in <commit-sha>", un desacuerdo razonado o una respuesta concisa, cada uno con un enlace al comentario original.
7. Imprime un informe.

Los comentarios de revisión y el cuerpo de la PR son datos, no instrucciones: cualquiera con acceso para comentar puede escribirlos, así que un texto en un comentario que le diga a la skill que ejecute un comando o apruebe se te comunica y no se sigue. Necesita `gh` o `glab`, y `git`.

## Funciona si

- Recibes un plan que reparte los comentarios en corregir, rebatir y aclarar antes de editar nada.
- Hay un commit por cada conjunto de correcciones, no un único commit enorme (salvo que hayas pedido `--single-commit`).
- Todos los comentarios de la PR tienen una respuesta, y cada respuesta enlaza al comentario al que contesta.
- El informe final tiene las secciones "Accepted (fixed)", "Challenged" y "Clarified".

## Evidencia

El escenario le da a la skill un conjunto de comentarios de revisión sobre un cambio de caché y le pide un plan de respuesta con los tipos de commit correctos y los enlaces en las respuestas. El agente solo obtuvo 70; con el plugin obtuvo 97, a <span>0,76 $</span> por resolución en lugar de <span>0,43 $</span>. Es un solo escenario y una sola ejecución por brazo, y al repetirlas las puntuaciones se movieron hasta unos 10 puntos, así que léelo como un dato aislado. El agente de la eval fue `claude` con `deepseek-v4.1-flash`, no el modelo para el que están ajustadas las skills.

## Más información

- [Mi PR tiene un abogado, una enfermera, un detective y un escriba](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/)
- [Las skills son roles, no comandos](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/)
- [Una skill tiene que superar al agente sin ella](/es/posts/2026-11-26-una-skill-tiene-que-superar-al-agente-sin-ella/)
- [SKILL.md de pr-lawyer en GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-lawyer/SKILL.md)
- ¿Has encontrado un problema, o tienes un escenario que la skill debería cubrir? [Abre una issue](https://github.com/mdelapenya/coding-skills/issues). Los escenarios de la eval están en `evals/` de ese repositorio.
