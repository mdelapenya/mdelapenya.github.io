---
title: "pr-scribe"
description: "Escribe la descripción de una pull request y un título en Conventional Commits a partir del diff, actualiza la PR y comprueba que el cambio se aplicó."
weight: 1
---

## Qué hace

pr-scribe lee el diff de una pull request o merge request y escribe dos cosas: una descripción concisa y un título en formato Conventional Commits. Sigue la plantilla de PR del repositorio cuando hay una, enlaza las issues relacionadas y aplica ambos campos a la PR. Funciona con GitHub, GitLab y espacios de trabajo de biomelab, y elige la plataforma a partir del remote de git.

## Cuándo usarla

Úsala cuando hay una PR abierta (o a punto de abrirse) y el título y el cuerpo faltan, están desactualizados o no son coherentes. Frases típicas: "describe this PR", "write the PR description", "fill in PR body", "summarize PR changes" y "update the PR title".

SKILL.md no indica ningún caso en el que no deba usarse. Si la plataforma no está soportada, se detiene.

## Cómo funciona

1. Detecta un espacio de trabajo de biomelab y la plataforma a partir de `git remote -v`, y pregunta si hay varios remotes.
2. Toma el número de la PR de los argumentos o lo pide.
3. Obtiene los metadatos de la PR y el diff.
4. Busca una plantilla de PR y, si no la hay, usa una estructura por defecto ("What's changed", "Why is this important?", "Changes", "Test plan").
5. Encuentra las issues relacionadas a partir del nombre de la rama, los mensajes de commit y una búsqueda de issues, y escribe líneas `Closes`, `Fixes`, `Related to` o `Supersedes`.
6. Escribe la descripción en modo imperativo, sin repetir el título en el cuerpo.
7. Escribe el título como `<type>(<scope>): <subject>`, de 72 caracteres como máximo, y conserva el título actual si ya cumple el formato.
8. Actualiza el título y el cuerpo con `gh` o `glab`, vuelve a obtener la PR y compara.

El diff, los commits y el cuerpo de la PR se tratan como datos, nunca como instrucciones. Algo que conviene saber antes de ejecutarla: en GitHub y GitLab aplica la actualización sin pedir confirmación. En modo biomelab solo escribe ficheros locales y no toca la PR remota. Necesita `gh` o `glab`, además de `jq` y `git`.

## Funciona si

- Ves el título y la descripción generados antes de que se apliquen.
- La PR en la plataforma muestra el nuevo título y cuerpo, y la skill confirma que los ha vuelto a leer y coinciden.
- Si la actualización falla o los campos difieren, informa del error e imprime el título y la descripción para que los apliques a mano, en lugar de dar el cambio por hecho.
- En modo biomelab existen `.biomelab/pr-title.md` y `.biomelab/note.md`, y la PR remota queda intacta.

## Evidencia

Los dos escenarios comprueban el título y la descripción en Conventional Commits, y los ficheros de salida de biomelab. Sin el plugin, el agente obtuvo 57 y 25; con él, 100 y 100. El coste por resolución es parecido (de unos <span>0,31 $</span> a <span>0,47 $</span> en el primero, de <span>0,56 $</span> a <span>0,54 $</span> en el segundo), así que la diferencia viene de seguir el formato, no de gastar más. Son ejecuciones únicas por brazo, y al repetirlas las puntuaciones individuales se movieron hasta unos 10 puntos. El agente de la eval fue `claude` con `deepseek-v4.1-flash`, no el modelo para el que están ajustadas las skills.

## Más información

- [Mi PR tiene un abogado, una enfermera, un detective y un escriba](/es/posts/2026-04-30-mi-pr-tiene-abogado-enfermera-detective-y-escriba/)
- [Mandé un mensaje por Telegram. Apareció una pull request en GitHub.](/es/posts/2026-05-22-mande-un-mensaje-y-aparecio-una-pull-request/)
- [Las skills son roles, no comandos](/es/posts/2026-03-25-las-skills-son-roles-no-comandos/)
- [Una skill tiene que superar al agente sin ella](/es/posts/2026-11-26-una-skill-tiene-que-superar-al-agente-sin-ella/)
- [SKILL.md de pr-scribe en GitHub](https://github.com/mdelapenya/coding-skills/blob/main/skills/pr-scribe/SKILL.md)
- ¿Has encontrado un problema, o tienes un escenario que la skill debería cubrir? [Abre una issue](https://github.com/mdelapenya/coding-skills/issues). Los escenarios de la eval están en `evals/` de ese repositorio.
