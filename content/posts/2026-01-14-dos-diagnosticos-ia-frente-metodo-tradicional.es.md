---
title: "Dos diagnósticos: la IA frente al método tradicional"
date: 2026-01-14 09:00:00 +0100
description: "Cuando mi cargador de coche eléctrico nuevo falló, le pedí ayuda a ChatGPT. La experiencia me hizo pensar en cómo adoptan los distintos sectores las nuevas herramientas de diagnóstico."
categories: [Technology, AI, Personal]
tags: ["artificial-intelligence", "ev", "electric-vehicles", "troubleshooting", "chatgpt"]
type: post
weight: 14
translationKey: ai-diagnostics-ev-charger
translatedFrom: 0cf9ede
---

![La IA frente al diagnóstico tradicional](/images/posts/2026-01-14-ai-diagnostics/cover.png)

## El punto de partida

Hace poco me compré un coche eléctrico y me instalaron un cargador en casa. La instalación fue bien, el técnico terminó y llegó el momento de la verdad: la primera carga.

El coche detectó el cargador. La app indicaba que estaba conectado. Todo parecía perfecto.

Entonces la pantalla del coche mostró: **"El equipo de carga externo no suministra energía. Comprueba la fuente de alimentación o prueba con otro equipo."**

Cero amperios. Nada de carga. El cargador estaba encendido, la app funcionaba, pero no llegaba energía al coche.

## Entra la IA

Como ingeniero de software, mi primer instinto fue diagnosticar antes de cambiar nada. Abrí ChatGPT y le describí la situación: el modelo del coche, el cargador (un Policharger), el mensaje de error y los síntomas.

Lo que recibí no fue una respuesta simple. Fue un marco de diagnóstico sistemático que resultó dar de lleno en el clavo.

### El diagnóstico inicial de la IA

> **ChatGPT:** Este error es relativamente común en instalaciones recientes y casi nunca significa que el cargador esté "roto". Normalmente son problemas de configuración, de protecciones o de medición, no del Policharger en sí.
>
> Cuando el coche dice "sin energía" o "equipo de carga sin alimentación", significa que el coche detecta el cargador, pero el cargador no está entregando tensión al conector. Algo aguas arriba está cortando o bloqueando la energía.

Después la IA me dio una lista priorizada de causas probables:

1. **Modo excedente solar** sin producción solar real
2. **Pinza amperimétrica mal colocada o invertida** (mide valores incorrectos)
3. **Diferencial incorrecto** (tipo AC en lugar de tipo A)
4. **Fases mal cableadas** (L/N invertidos o conexiones flojas)
5. **Umbral mínimo de corriente** que no se alcanza
6. **Fallo real del cargador** (la menos probable)

### Afinando el diagnóstico

Le conté que, al forzar una carga de 10A, seguía saliendo el error de "sin energía". Entonces la IA acotó el problema:

> **ChatGPT:** Si al forzar la carga a 10A sigue apareciendo "sin energía", NO es un problema de excedente solar, ni de la pinza, ni de la configuración solar.
>
> Esto apunta claramente a la **instalación eléctrica, las protecciones o el cableado**, no al uso.
>
> El cargador se enciende, la app responde, el coche detecta el cargador, pero NO carga ni siquiera forzando 10A. Eso significa que el cargador NO está entregando tensión al conector Tipo 2. Esto solo ocurre por un bloqueo de seguridad interno, causado por un error eléctrico aguas arriba.

A continuación me dio pasos concretos de diagnóstico:

> **Qué decirle al instalador (copia esto tal cual):**
>
> "Hemos forzado la carga manual a 10A y el coche sigue indicando que no hay energía. Esto descarta problemas de excedente solar o de la pinza. Necesito que revises: diferencial EV tipo A, continuidad del neutro, cableado L/N, protector de sobretensiones, tensión real en la entrada y la salida del Policharger. El cargador se está bloqueando por una detección eléctrica."

## La respuesta humana

Le enseñé este marco de diagnóstico al técnico. Su reacción fue inmediata: quería llevarse el cargador y cambiarlo por uno nuevo.

Yo insistí en que al menos comprobáramos una cosa que había mencionado la IA: **que el neutro podía no estar bien sujeto**.

A regañadientes, abrió el cargador y movió unos cables. De repente, el coche empezó a cargar. Pero al cabo de un minuto más o menos, se paró otra vez con el mismo error.

¿El veredicto del técnico? El cargador estaba defectuoso. Quería cambiarlo.

Pero la IA lo había predicho justo así. Una conexión floja provoca un comportamiento intermitente, no un fallo total. Que funcionara un rato al mover los cables era oro puro para el diagnóstico, no una prueba de que la unidad estuviera estropeada.

## Lo que vio la IA y no vio el técnico

Le pasé esta foto del cargador abierto y ChatGPT analizó los componentes visibles:

![Dentro del Policharger: entradas L1/N/PE, contactor Toscano y la conexión del neutro que sospechamos floja](/images/posts/2026-01-14-ai-diagnostics/charger.jpg)

> **ChatGPT:** Por la foto, veo lo siguiente:
> - El Policharger está bien montado mecánicamente
> - Entradas L1 / N / PE claramente identificadas
> - Contactor Toscano WCT-40A (correcto para VE)
> - Secciones de cable aparentemente correctas
>
> **Problema más probable:** el neutro está mal referenciado o mal conectado. Esto encaja al 100% con el síntoma. El Policharger se enciende, se comunica, detecta el coche, pero NO cierra el contactor, NO entrega tensión al conector Tipo 2.
>
> ¿Por qué? Porque el Policharger detecta una tensión incorrecta entre L y N, o un neutro sin continuidad.

## El segundo problema: cuando la cosa se puso interesante

Después de ajustar los cables apareció un problema nuevo. El cargador arrancaba de vez en cuando, pero luego caía a 0A y se negaba a cargar, incluso con la aerotermia apagada. El coche seguía sin cargar.

La app mostraba: "Conectado 0A", con un pequeño icono de sol que marcaba 4A y un icono de casa que marcaba 6A.

Esta vez la IA diagnosticó un problema de configuración:

> **ChatGPT:** Un coche no puede cargar por debajo de unos 6A. Es una limitación del estándar IEC 61851, no del coche ni del Policharger.
>
> Ahora mismo: solar disponible, 4A. Margen total: insuficiente. El Policharger detecta excedente, pero NO llega al mínimo, así que NO cierra el contactor, y el coche ve "enchufado pero sin tensión".

Cuando le pasé los ajustes exactos de la app, la IA encontró al culpable:

> **ChatGPT:** La clave está aquí: **"Lectura de consumo general: Casa + Coche"**
>
> Esto es INCORRECTO para tu caso. Ahora mismo el Policharger mide el consumo de la casa, le suma también el consumo del coche, y luego intenta calcular el excedente FV.
>
> Resultado: entra en un bucle absurdo, nunca ve margen real, se queda en 0A y el coche dice "sin energía".

¿La solución propuesta? Cambiar un único ajuste en la app del Policharger, de "Casa + Coche" a solo "Casa". El cargador calcula el excedente solar restando el consumo de la casa a la producción solar. Con "Casa + Coche", metía en ese consumo la propia carga del coche, así que nunca veía margen suficiente para empezar a cargar.

Se lo conté a la empresa. Coincidieron en que había que cambiar el ajuste de la app. Pero aun así van a sustituir el cargador. Mi coche sigue sin cargar.

## Flujos de trabajo distintos

Esto es lo que me sorprendió. No el diagnóstico técnico, sino la reacción ante él.

Cuando le enseñé el marco de diagnóstico al técnico, no le interesó. Cuando después lo hablé con su jefe, respaldó la decisión de cambiar el cargador e "investigar qué pasa con el viejo".

Lo entiendo. Tienen un flujo de trabajo que les funciona. Cambias la unidad, pruebas la vieja en el taller y pasas al siguiente trabajo. Es eficiente. Minimiza el tiempo en la obra. Y la mayoría de las veces seguramente funciona bien.

Pero en este caso, la respuesta por defecto fue sustituir el hardware en lugar de probar un cambio de configuración. El análisis de la IA señalaba causas concretas y comprobables. Esa aportación no encajaba en su proceso habitual.

## Qué significa esto

No escribo esto para criticar a un técnico ni a una empresa concretos. Son profesionales y, por lo que sé, puede que cambiar la unidad sea lo correcto por razones que no acabo de entender. Quizá han visto patrones que yo no. Quizá, por la economía de su negocio, cambiar sale más rápido que diagnosticar. Quizá la IA se equivoca en algo.

Pero la experiencia me hizo pensar en cómo integran las nuevas herramientas los distintos sectores.

En software, llevamos un par de años aprendiendo a usar la IA como compañera de diagnóstico. Ya es normal pegar un mensaje de error en ChatGPT, en Claude Code o en Gemini y recibir sugerencias útiles. No siempre aciertan, pero a menudo son un buen punto de partida.

En este caso, ChatGPT identificó:

1. Una conexión floja del neutro (confirmada cuando mover los cables restableció la carga durante un rato)
2. Un problema de configuración en la app del Policharger (el ajuste "Casa + Coche", que crea un bucle de cálculo imposible)
3. La interacción entre la producción solar, el consumo de la aerotermia y los umbrales de carga

Fuera o no necesario cambiar el hardware, esas pistas de diagnóstico salieron de una conversación con una IA. Eso es nuevo. Y ya no se limita a los problemas de software.

## La pregunta de fondo

Me pregunto cómo evolucionará esto en otros campos.

Electricistas, fontaneros, técnicos de climatización, mecánicos: todos tienen una experiencia profunda, construida a lo largo de años de trabajo manual. Ese conocimiento es insustituible. Una IA no puede notar una conexión floja con los dedos ni oler un componente quemado.

Pero la IA puede procesar documentación, cruzar síntomas y sugerir caminos de diagnóstico. Puede recordar todos los modos de fallo documentados de un producto concreto. No se cansa ni tiene prisa por llegar al siguiente trabajo.

La pregunta interesante no es si la IA va a cambiar la forma de resolver averías. Es cómo va a descubrir cada sector dónde ayuda la IA y dónde pesa más la experiencia. El software salió con ventaja porque ya estábamos delante del ordenador cuando llegaron las herramientas. Otros campos encontrarán su propio equilibrio.

## Epílogo

La empresa va a sustituir mi cargador. Hasta que lo hagan, no cargo en casa.

Si el diagnóstico de la IA es correcto, el cargador nuevo podría tener los mismos problemas a menos que se traten las causas de fondo. Pero igual me equivoco. Igual hay algo del hardware que el técnico reconoció y a mí se me pasó. Lo descubriré pronto.

En cualquier caso, esta semana he aprendido mucho. Sobre la infraestructura de carga de vehículos eléctricos, sobre el cálculo del excedente solar, sobre cómo abordan los problemas los distintos sectores. Y sí, sobre lo útil que puede ser la IA como primer paso de diagnóstico, incluso para problemas fuera de mi especialidad.

Le he pasado a la empresa el análisis de la IA. Lo que pase ahora depende de ellos.

---

*La foto del cargador y la conversación de diagnóstico son reales. Los fragmentos de la IA están ligeramente editados para mayor claridad. Ningún cargador resultó dañado durante la escritura de este post... todavía.*
