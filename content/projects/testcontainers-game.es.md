---
title: testcontainers-game
type: page
tags: [testcontainers, javascript, canvas, game, testing]
description: "Un juego de navegador sobre lo que rompe las suites de tests: wait strategies, tests flaky, puertos publicados y la limpieza de Ryuk."
---

## testcontainers-game

Un juego de navegador sobre lo que rompe las suites de tests, uno por nivel. *Wait strategies*: lee lo que el test necesita de verdad y elige la comprobación que lo cumple (puerto a la escucha, HTTP, SQL, exec, healthcheck o una combinación de dos). *El detective de los flaky*: una cuadrícula de tests por ejecuciones de CI, en la que hay que nombrar la causa a partir del patrón de rojos. *Pipe Dream*: encamina el host hasta un contenedor a través de un puerto publicado. *Ryuk*: limpia los recursos de tu propia sesión sin tocar el build de nadie más.

Canvas y módulos de JavaScript puros, sin framework de juegos. El progreso y los ajustes de sonido viven en `localStorage`. Los tests unitarios corren con el test runner de Node y comprueban los tableros generados con semillas repetibles; Playwright ejecuta el build de producción en Chromium de escritorio y móvil. Ambos condicionan el deploy.

Un proyecto oficial de [Testcontainers](https://testcontainers.com).

- Aplicación en vivo: [game.testcontainers.org](https://game.testcontainers.org)
- Github: [testcontainers/testcontainers-game](https://github.com/testcontainers/testcontainers-game)

![testcontainers-game](/images/projects/testcontainers-game.jpg)
