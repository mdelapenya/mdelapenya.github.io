---
title: "Spec-Driven Development: ¿es el nuevo BDD?"
date: 2026-02-26 09:00:00 +0100
description: "Los parecidos entre las técnicas de modelado de hace treinta años, el BDD y la nueva ola de herramientas de spec-driven development para agentes de IA."
categories: [Technology, AI, Software Development]
tags: ["artificial-intelligence", "bdd", "spec-driven-development", "agents", "software-engineering"]
type: post
weight: 30
translationKey: spec-driven-development-bdd-agents
translatedFrom: f67c35f
---

![Spec-Driven Development](/images/posts/2026-02-26-spec-driven-development-bdd-agents/cover.png)

Escribe primero las especificaciones y deja que otro se encargue de la implementación. Llevamos treinta años persiguiendo este sueño: UML, herramientas CASE, Model-Driven Architecture. Ahora los agentes de IA nos lo ponen delante otra vez.

Tuve esa sensación de déjà vu leyendo ["Understanding Spec-Driven-Development: Kiro, spec-kit, and Tessl"](https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html), de Birgitta Böckeler, que me pasó [Kevin Wittek](https://www.linkedin.com/in/kevin-wittek/). Analiza tres herramientas que representan enfoques distintos del "spec-driven development" (SDD): desde flujos sencillos basados en markdown (Kiro) hasta la ambiciosa idea del "código como artefacto generado" (Tessl).

## Treinta años dibujando cajas

Böckeler plantea una preocupación importante: los enfoques donde la especificación es la fuente corren el riesgo de combinar "inflexibilidad y no determinismo". Es una forma educada de decir que podrías quedarte con lo peor de los dos mundos: la rigidez del desarrollo dirigido por modelos con la imprevisibilidad de los LLMs.

Pero quizá esta vez sea distinto. No porque la IA sea magia, sino porque hemos aprendido algo de esos treinta años de fracasos.

## La conexión con BDD

Como aficionado al BDD, no pude evitar ver los paralelismos. Behavior-Driven Development siempre ha ido de tender un puente entre los requisitos de negocio y el código ejecutable. Escribes escenarios en lenguaje natural. Esos escenarios se convierten en tests. Los tests guían la implementación.

Aun así, la promesa del BDD nunca llegó a cumplirse del todo. Escribir buenos escenarios es difícil. Mantenerlos, más. Y la distancia entre el lenguaje de negocio y el código real seguía siendo tan grande que la mayoría de los equipos o abandonaron el enfoque o lo trataron como documentación con ínfulas.

¿Y ahora? Con agentes de IA capaces de leer especificaciones en lenguaje natural y generar código, la ecuación cambia. Un `AGENTS.md` que describe el comportamiento del sistema, un `plan.md` con los resultados esperados: son escenarios BDD en markdown. Ya no escribimos Gherkin, pero el principio es el mismo: especifica primero el comportamiento y deja que otro se ocupe de la implementación.

## El humano en el bucle

Aquí es donde me separo de las visiones más optimistas del spec-driven development.

La realidad es que los agentes escriben cada vez más del código que entregamos. En principio, me parece bien. Pero un "DO NOT EDIT" da por hecho algo que la mayoría de los equipos todavía no tiene: un entorno de desarrollo que te permita **verificar con confianza lo que ha hecho el agente**.

Cuando Böckeler escribió su artículo, el framework [Tessl](https://tessl.io) marcaba el código generado con "GENERATED FROM SPEC - DO NOT EDIT." Era una apuesta valiente. Pero Tessl ha evolucionado hacia algo más interesante: un **gestor de paquetes para skills y contexto de agentes**. Piensa en npm, pero para el conocimiento de los agentes: paquetes de contexto versionados, evaluados y distribuibles que enseñan a los agentes a interactuar con tecnologías, APIs y bases de código concretas.

Es un cambio con sustancia. En lugar de limitarse a generar código a partir de especificaciones, Tessl ataca ahora el *problema del contexto*: ¿cómo le das al agente una comprensión fiable de tu entorno para que genere el código correcto desde el principio? Las skills de su registro llevan puntuaciones de evaluación, comprobaciones de calidad y detección de regresiones. Tratan la guía para agentes como software mantenible, no como prompts desechables.

Va en la dirección correcta. Pero el "DO NOT EDIT" sigue dando por hecho algo que la mayoría de los equipos no tiene: la infraestructura para verificar lo que ha hecho el agente. ¿Dónde está el sandbox aislado en el que el agente trabaja libre sin tocar tu máquina? (Estamos [llegando](/es/posts/2026-02-25-agentes-de-codigo-en-paralelo-con-docker-sandboxes/).) ¿Dónde está la suite de tests que valida el resultado de forma automática? Tessl resuelve la pieza del contexto, pero el aislamiento y la validación automática son las otras dos patas del taburete.

## Un sueño hecho realidad para algunos

Tengo que admitir una cosa: esta nueva ola de herramientas spec-driven es un sueño hecho realidad para ciertas organizaciones. Ya sabes cuáles. Las empresas que siempre quisieron diseñar software dibujando diagramas, conectando cajas y flechas en un lienzo, y que esa "especificación fuente" se convirtiera por arte de magia en código funcionando.

Sí, te estoy mirando a ti, [BankSphere](https://es.wikipedia.org/wiki/BankSphere).

Durante décadas, estas organizaciones lucharon contra la distancia entre sus modelos visuales y las implementaciones reales. Contrataron ejércitos de desarrolladores para traducir diagramas a código. Montaron procesos elaborados para mantener sincronizados especificaciones y código. En su mayoría, fracasaron.

¿Y ahora? Un agente de IA capaz de leer una especificación y generar código podría cumplir por fin una promesa de hace tres décadas. La ironía es deliciosa: el enfoque más clásico del desarrollo de software podría salir reivindicado por la tecnología más nueva.

## Lo que de verdad necesitamos

Böckeler identifica un problema real en las herramientas SDD actuales: la inflexibilidad del flujo de trabajo. Sobredimensionadas para problemas pequeños, cortas para los complejos. Y, pese a tener especificaciones detalladas, los agentes siguen ignorando instrucciones o interpretando mal el código existente.

La respuesta no es un formato de especificación mejor. Es una infraestructura mejor:

1. Escribe especificaciones claras cuando aporten valor
2. Deja que los agentes de IA generen los primeros borradores, **en aislamiento**
3. Valida de forma automática con tests y exploración dirigida por agentes
4. Mantén vivas las especificaciones si ayudan, y descártalas si no

Eso no es spec-first, ni spec-anchored, ni spec-as-source. Es desarrollo de software pragmático: especificaciones más una red de seguridad.

## La pregunta de verdad

¿Es el spec-driven development el nuevo BDD? Quizá. Pero esa es la pregunta equivocada. La buena es otra: ¿podemos por fin cumplir las promesas que estos enfoques llevan treinta años haciendo?

La parte de la generación está más cerca que nunca. Pero generar sin verificar es solo esperanza. Cuando la infraestructura se ponga al día (sandboxes, suites de tests, contexto persistente para agentes), llegaremos.

Hasta entonces, seguimos siendo el humano en el bucle. Verificamos el comportamiento. Cogemos lo "suficientemente bueno" y lo llevamos a excelente. Cazamos los casos límite que la especificación no recogió.

Nuestro trabajo está a salvo. Por ahora. No porque los agentes no sepan escribir código, sino porque a la mayoría de los equipos todavía les falta la herramienta para *fiarse* de ese código.

---

_Gracias a Kevin Wittek por compartirme el artículo que encendió esta reflexión._
