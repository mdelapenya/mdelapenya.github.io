---
title: "Buenas prácticas de integración continua #7: no comentes los tests que fallan"
date: 2014-06-07T09:16:43+02:00
description: "Comentar un test que falla es la salida fácil, pero esconde el problema real. Tres reglas sencillas para decidir qué hacer en su lugar."
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
translationKey: ci-best-practice-7
translatedFrom: 3eaa239
---

{{< figure src="/images/sweep-carpet.png" alt="Vamos a necesitar una alfombra más grande o nos hundimos" >}}

¡Hola, lectores continuos! Vuelvo con una nueva práctica de CI, en formato píldora.

¿Recuerdas alguna vez en que tenías tests que fallaban sin parar y nadie tenía tiempo para ocuparse de ellos? ¿Cuál era la solución más fácil? Comentarlos o borrarlos, claro, porque te estropeaban las luces verdes del servidor.

¿He dicho claro? Pues no, claro que no.

**Esto tiene que ser siempre el último recurso**, usado muy pocas veces y a regañadientes. Esconde el problema real, y con tus tests quieres justo lo contrario: que muestren lo que pasa, y sobre todo lo que va mal, para resolverlo cuanto antes.

En vez de barrer el problema debajo de la alfombra, como en la imagen de arriba, prueba a aplicar estas reglas tan simples:

- ¿Ha encontrado el test una regresión? **¡Arregla el código!**
- ¿Alguna de las suposiciones del test ya no es válida? **¡¡Bórralo!!**
- ¿Ha cambiado la aplicación de verdad la funcionalidad que prueba el test, y por un buen motivo? **¡¡Actualiza el test!!**

Con estas tres reglas tan sencillas puedes resolver la mayoría de las situaciones en las que aparece una regresión.

¡Nos vemos en el próximo post!
