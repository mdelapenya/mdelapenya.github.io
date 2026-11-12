---
title: "Buenas prácticas de integración continua #5: prepárate para hacer revert"
date: 2014-06-05T09:16:43+02:00
description: "Todos rompemos el build alguna vez. Lo importante no es buscar culpables, sino volver cuanto antes a una versión que funcione, aunque eso signifique hacer revert."
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
translationKey: ci-best-practice-5
translatedFrom: 3eaa239
---

{{< figure src="/images/ready-set.jpg" alt="¡Preparados, listos, ya!" >}}

En este post quiero hablar de la mentalidad de los desarrolladores. De cómo creamos (o eso creemos) software que nunca falla, que brilla más que el sol y que es más rápido que un avión a reacción... ¿o no?

En serio: los desarrolladores somos más celosos de nuestro código que otras profesiones, y normalmente no nos gusta que nos critiquen por él. Pero no podemos olvidar que trabajamos en equipo, con muchos compañeros (quizá repartidos por todo el mundo), y que uno de nuestros mayores deseos tiene que ser un producto de la mejor calidad. Y para conseguir esa calidad, tenemos que pulir los defectos que cometemos.

Si recuerdas mi post anterior, existe un rol llamado "Build Master", responsable de pulir esos defectos: revierte los commits erróneos y devuelve el problema al desarrollador que lo causó.

Creo que ya lo he escrito antes, pero conviene reforzar la idea: **todos cometemos errores, así que cada uno de nosotros romperá el build de vez en cuando**.

Y lo importante no es culpar al desarrollador, no. Lo más importante es que todo vuelva a funcionar cuanto antes. Por supuesto, si no eres capaz de arreglarlo rápido, sea cual sea el motivo, **deberías revertir el change-set anterior** que está en el control de versiones y corregirlo en local. Al fin y al cabo, sabes que esa versión previa era buena. ¿Por qué? **¡Porque no haces check-in sobre un build roto!**

Te cuento una pequeña historia para que veas por qué revertir es buena idea :)

Los pilotos de avión asumen que algo puede salir mal, así que tienen que estar listos para abortar el aterrizaje y "dar la vuelta" para intentarlo de nuevo.

{{< figure src="/images/airplane-landing.jpg" alt="Avión aterrizando" >}}

Imagina lo crítico que es un aterrizaje comparado con un conjunto de commits: prefieren abortarlo para evitar muertes antes que hacer una maniobra peligrosa. Entonces, ¿por qué no hacer lo mismo con esos commits conflictivos, que se volverán a enviar lo antes posible?

Así que mi consejo es este: no tengas miedo, amigo... y haz revert.
