---
title: "Buenas prácticas de integración continua #4: nunca te vayas a casa con el build roto"
date: 2014-06-04T09:16:43+02:00
description: "Dejar el build roto al acabar el día es una bomba para tu equipo. Qué hacer antes de irte y cómo lo resolvemos cuando trabajas con compañeros en tres zonas horarias."
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
translationKey: ci-best-practice-4
translatedFrom: 3eaa239
---

{{< figure src="/images/after_deployment_en.jpg" alt="Lo que pase después del deploy no es problema mío" >}}

¡Me encanta esa imagen! Imagina un viernes cualquiera, al terminar tu jornada. Miras el servidor de CI y, qué mala suerte, está roto. Solo tienes tres opciones:

1. **Resignarte** a salir tarde, porque vas a intentar arreglarlo.
2. **Revertir tus cambios** y volver a intentarlo la semana que viene.
3. Irte ya y **dejar el build roto**.

Por supuesto, lo correcto es elegir la 1 o la 2, nunca la 3. En la imagen, Iron Man ha decidido que le da igual lo que pase después de esa "bomba". Pero ¿por qué es una bomba dejar el build roto?

Es una bomba porque cualquier compañero que haga pull de tu rama master se llevará código roto. ¿Y qué pasa entonces? Échale un vistazo a [mi primer post](/es/posts/2014-06-01-no-hagas-commit-sobre-un-build-roto/) sobre no hacer check-in con el build roto.

En cambio, si intentas arreglarlo, o incluso revertir tus cambios, antes de irte, el build seguirá en verde y los demás desarrolladores podrán hacer pull del repositorio SCM con total tranquilidad.

Algunas buenas prácticas para evitar problemas:

- Haz check-in con frecuencia y con tiempo de sobra, para poder lidiar con los problemas si aparecen.
- Los desarrolladores con experiencia suelen reservar los check-ins para el día siguiente.

Llegados a este punto, podrías decir: _"Vale, yo hago algo parecido, pero mi equipo está distribuido y trabajar en zonas horarias distintas nos da problemas"_.

En Liferay tenemos justo ese "problema":

{{< figure src="/images/mapamundi.png" alt="Mapamundi" >}}

Como ves, trabajamos en zonas horarias distintas: China, Europa y América, [siguiendo al sol](http://en.wikipedia.org/wiki/Follow-the-sun).

Si algo sale mal:

- Si China rompe el build, la jornada de Europa se ve afectada de forma dramática.
- Si Europa se va a casa con el build roto, América estará gritando y llorando.

{{< figure src="/images/crying.png" alt="Desarrolladores llorando" >}}

¿Cómo lo hemos resuelto? Aquí aparece la figura del Build Master:

{{< figure src="/images/templario.png" alt="El guardián del build" >}}

Este rol no solo mantiene el build, sino que **además lo vigila**. Se asegura de que quien lo rompe esté trabajando en arreglarlo. Si no es así, el ingeniero de build **revertirá ese check-in**. Por eso es imprescindible que tenga permisos de escritura sobre la rama master del SCM o, en su defecto, que sus commits tengan prioridad.

El Build Master es un rol polémico, porque a nadie le gusta ver cómo le revierten sus commits. Pero todo el equipo debería asumir que no es una ofensa personal. Es un esfuerzo más por mejorar la calidad del producto, sin criticar nunca al desarrollador.

Para eso, todos tenemos que abrir la mente y aceptar que no es malo revertir los commits de otro. Siguen en el historial del proyecto, así que podemos recuperarlos cuando haga falta. Y, al fin y al cabo, esos commits estaban rompiendo algo, ¿no?

Del revert hablaremos en el próximo capítulo. ¡Nos vemos allí!
