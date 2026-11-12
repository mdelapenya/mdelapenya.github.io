---
title: "Buenas prácticas de integración continua #6: ponle un límite de tiempo al arreglo antes de revertir"
date: 2014-06-06T09:16:43+02:00
description: "Una regla sencilla para decidir cuándo dejar de arreglar un build roto y revertir el commit: fija un tiempo máximo y respétalo."
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
translationKey: ci-best-practice-6
translatedFrom: 3eaa239
---

¡Hola a todos!

Vuelvo por aquí después de mucho tiempo sin escribir sobre CI en Liferay. Si recuerdas mi último post, hablaba de la importancia de revertir cuanto antes los commits que rompen el build.

En este post te cuento un pequeño consejo que te puede ayudar durante el proceso de revertir.

Antes de revertir un commit problemático, establece esta regla: cuando el build se rompa tras un check-in, intenta arreglarlo durante un tiempo concreto, el que tú decidas según tus circunstancias. Por ejemplo, 10 minutos.

Si pasado ese tiempo no has terminado, **revierte** a la versión anterior.

{{< figure src="/images/countdown.gif" alt="Cuenta atrás" >}}

En Liferay solemos dedicar entre 20 y 30 minutos a investigar el problema. Si no conseguimos resolverlo, porque conocemos poco la funcionalidad que está rompiendo el build, hacemos rollback.

Hay otra cosa que pensamos cuando intentamos arreglar el fallo de otro desarrollador: que quizá te vea como su red de seguridad y deje de preocuparse por romper el build, porque "mañana, cuando llegue a trabajar, estará arreglado por arte de magia".

Por eso preferimos revertir los commits y avisar al desarrollador con otro email específico (no solo el email automático que envía el servidor de CI), explicándole por qué hemos revertido sus cambios. Así sí es consciente del fallo.

¡Es solo mi granito de arena!
