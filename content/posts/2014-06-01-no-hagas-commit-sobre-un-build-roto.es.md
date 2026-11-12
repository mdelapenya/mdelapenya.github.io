---
title: "Buenas prácticas de integración continua #1: no hagas commit sobre un build roto"
date: 2014-06-01T09:16:43+02:00
description: "Primera buena práctica de integración continua: si el build está roto, no subas más cambios encima. Arréglalo antes de seguir."
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
translationKey: ci-best-practice-1
translatedFrom: 3eaa239
---

¡Hola a todos! Este es el primer post de una serie sobre integración continua, en la que comparto cómo usamos esta técnica y lo que sabemos de ella.

En estos posts hablaré de algunas buenas prácticas que te recomiendo seguir. Se basan en lo que aprendí leyendo el libro ["Continuous Delivery", _de Jez Humble y David Farley_](http://continuousdelivery.com/), en concreto el capítulo 3, y por supuesto en mi experiencia con CI en Liferay.

Una de las cosas más importantes que he aprendido con este libro es que **la integración continua (CI) es una práctica, no una herramienta**, y exige un grado considerable de disciplina de todo el equipo. Por eso todos sus miembros están implicados y tienen que colaborar para perfeccionarla.

{{< figure src="/images/chinese_army.jpg" alt="El trabajo en equipo es esencial" >}}

El objetivo de un sistema de CI es asegurar que el software **funciona, en esencia, todo el tiempo**. Tenlo presente como un mantra: el software funciona antes de tus cambios y tiene que seguir funcionando después.

Esperamos que esta serie te sirva si estás empezando con CI. Pero también queremos conocer tu experiencia y tu opinión, así que cuéntanos qué te parece.

Dicho esto, empecemos con la primera práctica...

## Práctica 1: no hagas commit sobre un build roto

{{< figure src="/images/do-not-touch.png" alt="No toques un build roto" >}}

Vas a empezar un nuevo día de trabajo y ves el build roto. ¿Te ha llegado un correo del servidor de CI? Si es así, deberías saber cómo comprobar si has sido tú quien ha causado los errores. Y si es el caso, **intenta arreglarlo cuanto antes** en lugar de ponerte a programar esa funcionalidad espectacular a toda máquina.

Así identificas la causa de la rotura muy rápido y la arreglas, porque eres quien está **en mejor posición para averiguar** qué la provocó.

Pero espera: has terminado tu trabajo y el build sigue roto. **¿Por qué no deberías hacer commit de más cambios sobre ese build roto?**

En primer lugar, **sumarás más problemas al fallo existente**. Imagina que no conoces estas prácticas: cada vez que haces commit, no puedes demostrar que tus cambios no añaden más errores, y quizá tus cambios sumados a los errores que ya había provoquen otros problemas distintos.

Consecuencia directa de lo anterior: **el build tardará mucho más en arreglarse**, porque has añadido más complejidad al problema.

Por supuesto, puedes seguir haciendo commit. Y también puedes acostumbrarte a ver el build roto. En ese caso, **el build se queda roto todo el tiempo :(**

{{< figure src="/images/ignore.jpg" alt="No ignores el build roto" >}}

Y así es el ciclo, es verdad.

Después de muchos builds rotos, el que lleva roto más tiempo suele arreglarse con un esfuerzo hercúleo de alguien del equipo (aquí en Liferay suele ser Miguel), y el proceso vuelve a empezar.

{{< figure src="/images/herculean-task.jpg" alt="No crees una cultura de héroes" >}}

Bueno, por hoy es todo.

¡Cuéntame qué opinas!
