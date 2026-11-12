---
title: "Buenas prácticas de integración continua #3: espera a que pasen los tests del commit"
date: 2014-06-03T09:16:43+02:00
description: "Por qué merece la pena esperar a que pasen los tests de tu commit y empezar a arreglar los fallos antes de cambiar de tarea."
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
translationKey: ci-best-practice-3
translatedFrom: 3eaa239
---

¡Hola a todos!

Este es mi tercer post sobre buenas prácticas de integración continua, y hoy quiero hablarte de las ventajas de tener paciencia después de enviar tus commits a revisión.

Como desarrolladores, estamos acostumbrados a trabajar en una funcionalidad, terminarla y saltar a la siguiente. Enviamos nuestro trabajo a un revisor y seguimos con otras tareas. Seguro que lo has notado: en ese momento la cabeza se vuelca por completo en lo nuevo para hacerlo lo mejor posible, y casi nos olvidamos de lo anterior.

¿Recuerdas [mi post anterior, sobre ejecutar los tests](../2014-06-02-ci-best-practice-2) (a mano en local, o automáticamente en Jenkins mediante una pull request)? Pues piensa ahora en no conocer el resultado de esa ejecución. ¿Estás seguro de que tu trabajo funciona como esperas? ¿Han encontrado los tests algún posible bug?

Si no vigilas el build que ejecuta los tests de tus cambios, esas preguntas no tendrán respuesta hasta que sea muy tarde: cuando tu código llegue a la rama master, donde otros desarrolladores pueden hacer pull y encontrarse con un comportamiento inesperado.

Por eso este post te pide que esperes a que pasen los tests del commit, que estés pendiente de los resultados y que **empieces a arreglar cualquier fallo cuanto antes** (si hace falta).

{{< figure src="/images/thinking-please-be-patient.jpg" alt="Por favor, ten paciencia" >}}

En mi post anterior también comenté que el servidor de CI es un recurso compartido y lleno de información. Los desarrolladores deberían vigilarlo para comprobar si los tests de sus commits han provocado fallos o no. Así están en el mejor sitio para resolver cualquier problema, porque todavía no han cambiado de contexto.

{{< figure src="/images/finding-bugs.png" alt="Buscando bugs" >}}

Lo más importante de esta práctica es que tengas claro que cualquiera puede cometer errores. Además, los errores son una parte esperada del proceso.

Nuestro objetivo, en lo que nos vamos a centrar, es encontrarlos y eliminarlos cuanto antes, sin esperar la perfección ni cero errores.

Mientras el build se ejecuta, puedes ordenar tu bandeja de entrada, preparar las siguientes tareas, tomarte un café, ¡o incluso ir al baño! El build debería tardar lo mínimo posible: según el tamaño de tu proyecto, entre 10 y 20 minutos está bien.

Bueno, hasta aquí por hoy. ¡Nos vemos en el siguiente post!
