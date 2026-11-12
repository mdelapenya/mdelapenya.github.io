---
title: gitropolis
type: page
tags: [git-visualization, 3d, webgl, open-source]
description: "Tu historial de git, reproducido como una ciudad en 3D. Los ficheros son edificios, las carpetas son distritos y las PRs iluminan el horizonte según el tipo de commit."
---

## gitropolis

Tu historial de git, reproducido como una ciudad en 3D. Los ficheros se convierten en edificios, las carpetas en distritos, y cada pull request fusionada ilumina el horizonte con el color del trabajo que hizo: feat en verde, fix en rojo, docs en azul, y así sucesivamente. Recorre el tiempo, acelera hasta ×30 y mira cómo años de desarrollo pasan en minutos.

La altura de cada edificio refleja las líneas de código (suavizada de forma logarítmica, para que un helper de 40 líneas y un módulo de 1.200 se lean lado a lado). Cada directorio de primer nivel tiene su propio color estable y su propia placa de suelo, así que la forma de un repositorio se lee de un vistazo. Sin instalación y sin autenticación: pega la URL de un repositorio público de GitHub y la ciudad se construye sola.

He subido varios repos míos: `testcontainers-go`, `lpn` y `biomelab` están ahí.

- Aplicación en vivo: [gitropolis.vercel.app](https://gitropolis.vercel.app)

![gitropolis](/images/projects/gitropolis.png)
