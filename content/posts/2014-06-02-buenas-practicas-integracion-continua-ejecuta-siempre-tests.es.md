---
title: "Buenas prácticas de integración continua #2: ejecuta siempre los tests"
date: 2014-06-02T09:16:43+02:00
description: "Cada commit debería poder publicarse. Para conseguirlo, ejecuta los tests siempre: en local y, sobre todo, en un servidor de CI que sea un entorno controlado."
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
translationKey: ci-best-practice-2
translatedFrom: 3eaa239
---

Sigo con esta serie de entradas sobre buenas prácticas de integración continua. Hoy quiero hablar de las ventajas de ejecutar los tests.

## Práctica 2: ejecuta siempre los tests

Cuando un desarrollador hace commit de una nueva funcionalidad, se espera que en ese commit el software funcione como creemos que debe funcionar. Y si el software funciona como se espera en un commit, ¿por qué no publicarlo en ese estado? ¿Y si pudiéramos asegurar que cada commit de la historia hace que el software funcione como se espera? Basta con repetir la frase "publica en $COMMIT" para cada commit de la historia... Habríamos ganado la capacidad de estar más "publicables", porque podríamos publicar en el commit que quisiéramos.

Llegados a este punto, ya deberíamos haber visto lo importante que es un solo commit, porque puede disparar la creación de un release candidate.

Bien, sabemos cuál es el objetivo: tener buenos commits que funcionen como se espera. Pero ¿cómo lo conseguimos? ¿Cómo hacemos que nuestros commits sean más publicables?

Una de las cosas más importantes que puedes hacer para verificar que tus commits funcionan como se espera es escribir buenos tests para ellos. Y cuando digo buenos, me refiero a que tienen que probar la funcionalidad: condicionales, bucles, valores distintos..., no solo el [happy path](http://en.wikipedia.org/wiki/Happy_path).

Una vez que tienes buenos tests, tienes que ejecutarlos y revisar los resultados. Doy por hecho que sabes escribir y ejecutar tests. No es el objetivo de esta entrada, así que sigo adelante sin explicarlo.

En Liferay podemos ejecutar los tests de dos formas:

1. **En local**: un desarrollador puede usar algunos targets de `ant` para ejecutar los tests en su propio workspace y probar el código antes de enviarlo. Lee la página de la wiki que explica la infraestructura de testing, en los recursos relacionados:
    - `ant test-unit`: ejecuta todos los tests unitarios (las dependencias de otros sistemas, por ejemplo bases de datos, no son reales: hacemos mock de lo que necesitamos)
    - `ant test-integration`: ejecuta todos los tests de integración (las dependencias de otros sistemas son reales, sin mocks)
    - `ant test-class`: ejecuta solo una clase de test
    - etc.

2. **Después de enviar una [pull request](https://help.github.com/articles/using-pull-requests)**: usamos [Jenkins](http://jenkins-ci.org/) como servidor de CI para gestionar todos nuestros procesos de CI, y hemos hecho que cada pull request enviada a un revisor esté monitorizada por el servidor de CI: este descarga el código y ejecuta varias tareas (compilación, formateo del código fuente, ejecución de tests...). Lo mejor es que hay [un plugin de Jenkins](https://wiki.jenkins-ci.org/display/JENKINS/Github+pull+request+builder+plugin) que monitoriza la pull request y actúa según los resultados de los tests, gestionando la pull request de GitHub (cerrándola automáticamente si rompe los tests, escribiendo comentarios, cambiando su estado...). Así, el revisor sabe si la pull request que va a revisar está bien o rompe algo, y con este proceso **reducimos mucho el ciclo de feedback**, porque descartamos cuanto antes las pulls malas.

Mmm... interesante: dos sitios donde ejecutar los tests, en local y en el servidor de CI. ¿Pero por qué los dos?

Tú, como desarrollador, puedes tener la última versión de una dependencia, de un driver o de una aplicación que configura XXX en tu sistema operativo. O incluso puedes tener el sistema operativo ajustado por YYY.
En cambio, **el servidor de CI es un entorno controlado**: siempre ejecuta con el mismo escenario, para cada commit de cada desarrollador. Así, todos los tests se ejecutan en las mismas condiciones, en cada build, para todo el mundo. Y eso es una gran ventaja, porque así los resultados de tus tests son repetibles.

Puede que no quieras ejecutar los tests en local. Vale, no pasa nada. Pero intenta ejecutarlos siempre en un entorno controlado.

Otra ventaja del servidor de CI, precisamente por ser un entorno controlado, es que además es un repositorio centralizado de información. Todo el equipo puede consultarlo para buscar resultados de builds y ver qué está pasando en cada momento con los tests. El servidor de CI genera logs de casi todo, así que es muy fácil leerlos y estar al tanto del estado real del commit (y también del proyecto).

Y de todos esos logs, ¿cuáles son los más importantes para verificar que nuestros commits están bien? Tenemos dos opciones para saber qué está pasando:

- **Logs de Jenkins**: puedes configurar Jenkins para que envíe a los autores de los commits un email con los resultados de los tests, avisándoles de que sus commits han producido una rotura. Nosotros hemos mejorado la usabilidad del email por defecto de Jenkins para que sea más fácil de leer.
- **Logs de GitHub**: el plugin que usamos para monitorizar las pull requests puede escribir comentarios en GitHub, así que _esta plataforma tan buena_ también envía emails cuando una pull recibe un comentario con los resultados de los tests. Así, el desarrollador sabe al instante si sus commits han pasado los tests o no.

Los dos producen información complementaria muy útil, y el desarrollador sabrá qué hacer con ella. Así que intenta notificar cada rotura que descubra tu sistema de CI, para que el responsable pueda arreglarla cuanto antes, como vimos en la práctica anterior.

Hasta aquí por hoy. En la próxima entrada, más buenas prácticas de CI.

¡Hasta pronto!
