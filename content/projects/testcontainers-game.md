---
title: testcontainers-game
type: page
tags: [testcontainers, javascript, canvas, game, testing]
description: "A browser game about the things that break test suites: wait strategies, flaky tests, published ports, and Ryuk's cleanup."
image: /images/projects/testcontainers-game.jpg
---

## testcontainers-game

A browser game about the things that break test suites, one per level. *Wait strategies*: read what the test actually needs and pick the check that satisfies it — listening port, HTTP, SQL, exec, healthcheck, or a composite of two. *The flaky detective*: a grid of tests by CI runs, where the cause has to be named from the pattern of reds. *Pipe Dream*: route the host to a container through a published port. *Ryuk*: clean up your own session's resources without touching anybody else's build.

Canvas and plain JavaScript modules, no game framework. Progress and sound settings live in `localStorage`. Unit tests run on Node's own test runner and check the generated boards over repeatable seeds; Playwright drives the production build in desktop and mobile Chromium. Both gate the deploy.

An official [Testcontainers](https://testcontainers.com) project.

- Live app: [game.testcontainers.org](https://game.testcontainers.org)
- Github: [testcontainers/testcontainers-game](https://github.com/testcontainers/testcontainers-game)

![testcontainers-game](/images/projects/testcontainers-game.jpg)
