---
title: "Elegir el LLM más pequeño que no te falle del todo (parte 3): agente evaluador y tool calling"
date: 2026-03-06 09:00:00 +0100
description: "Evaluar 160 escenarios a mano no es una opción. Así usé el patrón LLM-as-judge para automatizar la puntuación de calidad, y añadí benchmarks de tool calling para saber qué SLMs saben usar herramientas externas de verdad."
categories: [Technology, AI, Go]
tags: ["small-language-models", "evaluator-agent", "tool-calling", "llm-as-judge", "go", "docker-model-runner", "testcontainers"]
type: post
weight: 30
translationKey: choosing-the-smallest-llm-part-3-evaluator-agent-and-tool-calling
translatedFrom: dfde9c8
---

![Agente evaluador y tool calling](/images/posts/2026-03-06-slms-evaluator-agent-tool-calling/cover.png)

En la [parte 1](/es/posts/2026-03-02-elegir-el-llm-mas-pequeno-parte-1/) vimos qué son los SLMs y cómo ejecutarlos en local con Docker Model Runner. En la [parte 2](/es/posts/2026-03-04-elegir-llm-mas-pequeno-parte-2-benchmarking-con-go/) construimos un framework de benchmarking con Go que ejecuta 160 escenarios y reporta latencia, throughput y tasas de éxito.

Pero queda un hueco. La latencia y el número de tokens te dicen *lo rápido* que responde un modelo. No te dicen *lo buena* que es la respuesta. Si un modelo contesta en 200 ms pero se equivoca, esa velocidad no vale nada.

Este tercer post trata dos cosas: el agente evaluador, que puntúa la calidad de las respuestas de forma automática, y los benchmarks de tool calling, que comprueban si los SLMs saben descomponer un problema en invocaciones a herramientas externas.

## El problema de la evaluación manual

Imagina que has ejecutado los 160 escenarios del benchmark. Ahora tienes 160 respuestas (o 800, si hiciste 5 iteraciones de cada uno). Evaluarlas a mano no es realista. Tendrías que leer cada respuesta, compararla con una referencia y asignarle una nota.

Mucha gente ha probado enfoques más simples: comparar cadenas, detectar palabras clave, expresiones regulares. Funcionan en casos muy acotados, como las matemáticas (donde la respuesta es un número concreto), pero se rompen del todo con tareas abiertas como explicar código o escribir un texto creativo. "Explica esta función en Go" admite decenas de respuestas válidas y buenas que no comparten ni una palabra clave.

Lo que necesitas de verdad es un juez que entienda el lenguaje natural y sepa decir si una respuesta es buena, sin importar cómo esté redactada.

## LLM-as-judge: el patrón del agente evaluador

La solución es usar un modelo *distinto*, más capaz, para evaluar las respuestas de los modelos que estás probando. Es el patrón **LLM-as-judge**, a veces llamado agente evaluador (Evaluator Agent).

La idea es sencilla. Tienes:

1. **El modelo bajo prueba** (por ejemplo, Llama 3.2 1B), que genera una respuesta a un prompt
2. **El modelo evaluador** (por ejemplo, GPT-4o-mini), que lee el prompt original, la respuesta y un conjunto de criterios de evaluación, y devuelve una puntuación de calidad

El evaluador nunca ve la infraestructura del benchmark. Recibe una petición de evaluación estructurada y devuelve una nota de 0 a 10 con una breve explicación.

¿Por qué un modelo aparte y no el mismo? Porque el evaluador tiene que ser bastante más capaz que los modelos que evalúa. Usar Llama 3.2 1B para evaluar a Llama 3.2 1B sería como pedirle a un alumno que corrija su propio examen. El evaluador necesita captar los matices, detectar errores sutiles y reconocer cuándo una respuesta creativa sigue siendo válida aunque se aleje de la referencia.

## Cómo elegir el modelo evaluador

El framework de benchmarks admite dos configuraciones de evaluador:

- **GPT-4o-mini** (recomendado): si defines la variable de entorno `OPENAI_API_KEY`, el evaluador usa GPT-4o-mini a través de la API de OpenAI. Es un modelo alojado, pequeño, rápido y barato, pero bastante más capaz que los SLMs que se prueban. Cuesta una fracción de céntimo por evaluación, y para 160 escenarios hablamos de unos pocos céntimos.
- **Alternativa local**: si no hay API key, el evaluador usa uno de los modelos locales. Así funciona todo sin conexión, pero la calidad de la evaluación baja. Estás pidiendo a un modelo pequeño que juzgue a otros modelos pequeños, y eso mete ruido.

Mi recomendación: usa el evaluador de OpenAI. El coste es insignificante y la calidad de la evaluación es mucho mejor. Piensa que es como pagar a un revisor de código profesional en vez de pedirle a un becario que revise el trabajo de otro becario.

## Criterios de evaluación específicos de cada tarea

No todas las tareas se deben evaluar igual. Un problema de matemáticas tiene una única respuesta correcta; un texto creativo tiene muchas respuestas válidas. El evaluador necesita criterios distintos para cada tipo de tarea.

El framework usa el paquete `embed` de Go para cargar los criterios de evaluación desde ficheros de texto en tiempo de compilación:

```go
//go:embed evaluator/system_prompt.txt
var systemPrompt string

//go:embed evaluator/reference.txt
var referenceText string
```

El fichero `system_prompt.txt` le dice al evaluador cómo comportarse: puntuar las respuestas en una escala de 0 a 10, teniendo en cuenta la exactitud, la completitud y la relevancia. El fichero `reference.txt` aporta las respuestas o patrones esperados para cada tipo de tarea.

Cada petición de evaluación incluye tres componentes:

1. **El system prompt**: instrucciones generales sobre cómo evaluar (rúbrica de puntuación, formato de salida)
2. **La descripción de la tarea**: lo que se le pidió al modelo
3. **La respuesta de referencia**: cómo debería ser una buena respuesta

Después, el evaluador compara la respuesta real del modelo con la referencia y devuelve una puntuación estructurada. Para la tarea de matemáticas "calcula la suma de 1 a 100", la referencia es simplemente "5050" y el evaluador comprueba si el modelo llegó a la respuesta correcta. Para "explica esta función en Go", la referencia contiene los conceptos clave que debería tener cualquier buena explicación, y el evaluador los busca sin exigir una redacción concreta.

Este enfoque busca un equilibrio: la evaluación automática escala a cientos de escenarios, y los criterios específicos de cada tarea dan puntuaciones con sentido.

## Por dentro del evaluador

El evaluador es un struct de Go que envuelve un cliente compatible con OpenAI. Este es el flujo principal de evaluación:

```go
func (e *Agent) Evaluate(ctx context.Context, question, answer, reference string) (*EvaluationResult, error) {
    resp, err := e.chatModel.GenerateContent(ctx, msgContent,
        llms.WithTemperature(0.0),  // deterministic scoring
        llms.WithTopK(1),
        llms.WithSeed(42),
    )
    // parse structured JSON from response...
}
```

Con temperatura 0,0 y una semilla fija, las puntuaciones son reproducibles. Si el propio evaluador fuera creativo, tus métricas de evaluación tendrían ruido. Además, el evaluador usa su propio cliente, que puede apuntar a un endpoint distinto (la API de OpenAI) del de los modelos bajo prueba (Docker Model Runner).

Después, el framework de benchmarks resume estas puntuaciones en dos métricas:

- **eval_score**: la puntuación media de calidad en todas las iteraciones (de 0,0 a 10,0)
- **eval_pass_rate**: el porcentaje de respuestas que superaron el umbral de aprobado (de 0,0 a 1,0)

Estas métricas aparecen en la salida del benchmark de Go junto a la latencia y el throughput. En una sola línea ves, para cada escenario, lo rápido y lo bueno que es el modelo.

## Benchmarks de tool calling

Los benchmarks habituales de prompt y respuesta comprueban si un modelo genera buen texto. Pero las aplicaciones modernas con LLMs dependen cada vez más del **tool calling** (también llamado function calling): la capacidad del modelo para reconocer cuándo necesita una herramienta externa, elegir la correcta y darle los parámetros adecuados.

Es algo muy distinto de generar texto. El modelo ya no se limita a producir palabras: decide *qué acciones ejecutar* y *con qué parámetros*.

### Las tres herramientas

El benchmark define tres herramientas que el modelo puede invocar:

1. **Calculadora**: hace operaciones aritméticas. El modelo envía una expresión (por ejemplo, `125 * 47`) y recibe un resultado numérico.
2. **Ejecutor de código Python**: ejecuta código Python y devuelve la salida. El modelo genera un fragmento de Python, lo envía a ejecutar y recibe stdout/stderr.
3. **Cliente HTTP**: hace peticiones HTTP a APIs externas. El modelo da una URL y recibe el cuerpo de la respuesta.

Cada herramienta prueba un patrón de integración distinto: cómputo puro, ejecución de código en un sandbox y acceso a una API externa.

### Los prompts de tool calling

Las tres tareas asistidas por herramientas de la [parte 2](/es/posts/2026-03-04-elegir-llm-mas-pequeno-parte-2-benchmarking-con-go/) (razonamiento con calculadora, validación de código, obtención de datos de una API) ejercitan una herramienta cada una. Lo que importa aquí no es solo si el modelo acierta la respuesta, sino *cómo* llega a ella: ¿llama a la herramienta correcta, con los parámetros correctos y en el orden correcto?

### Cómo medir la calidad del tool calling

En las tareas de tool calling, el evaluador mide más dimensiones además de la respuesta final:

- **Precisión en la selección de herramienta**: ¿eligió el modelo la herramienta adecuada para la tarea? Si le pedimos una operación matemática, ¿llamó a la calculadora o intentó hacer la cuenta de cabeza?
- **Precisión de los parámetros**: ¿dio el modelo los parámetros correctos? En la calculadora, ¿envió `125 * 47` como expresión, o algo mal formado?
- **Convergencia**: ¿llegó el modelo a la respuesta final correcta después de usar las herramientas? Un modelo puede llamar a la herramienta correcta con los parámetros correctos y luego interpretar mal el resultado.

Estas distinciones son críticas. Un modelo que intenta hacer aritmética mental en vez de llamar a la calculadora tiene un fallo de selección de herramienta. Un modelo que llama a la calculadora pero le pasa `125 x 47` (la letra x en vez del asterisco) tiene un fallo de parámetros. Los dos dan una respuesta equivocada, pero por motivos distintos.

### El problema de la compatibilidad

Algo que me sorprendió durante el benchmarking: **no todos los SLMs soportan tool calling**. El function calling exige un entrenamiento específico, y muchos modelos pequeños simplemente no lo recibieron. Cuando le mandas una petición de tool calling a un modelo que no lo soporta, ocurre una de estas cosas:

- El modelo ignora por completo las definiciones de herramientas y responde la pregunta directamente
- El modelo se inventa una llamada a una herramienta, en un formato que no encaja con el esquema
- El modelo devuelve un error o una respuesta vacía

En el framework de benchmarks, cuando un modelo no soporta tool calling, esas tareas se marcan como fallidas con un eval_score de cero. Y eso es un dato valioso: te dice cuáles de tus modelos candidatos se pueden considerar siquiera para flujos agénticos.

De los SLMs que probé, Llama 3.2 3B y Qwen3 0.6B se defendieron razonablemente bien con el tool calling básico. Los modelos de 1B lo pasaron bastante mal. Esto encaja con los [benchmarks externos](https://github.com/MikeVeerman/tool-calling-benchmark), donde Qwen3 0.6B comparte el primer puesto entre los modelos pequeños en tool calling, con una contención perfecta (no llama nunca a una herramienta cuando no debe). El tool calling a esta escala es real, pero el tamaño del modelo por sí solo no decide el éxito: Qwen3 0.6B supera a modelos del doble de tamaño.

## Qué viene ahora

El patrón LLM-as-judge te da una puntuación de calidad automática que escala a cientos de escenarios, y los benchmarks de tool calling revelaron una brecha clara de capacidad: solo los SLMs más grandes descomponían problemas en llamadas a herramientas externas de forma fiable. El benchmark ya mide la velocidad (parte 2) y la calidad (este post). Pero 160 escenarios con más de 5 métricas cada uno generan muchos datos. Recorrer la salida de la consola para comparar modelos no escala.

¿Cómo detectas que Llama 3.2 3B puntúa bien en tareas de código pero se desploma en escritura creativa con temperaturas altas? ¿Cómo bajas de un eval_score bajo a la respuesta concreta que falló? En la parte 4 conecto todo a Grafana con OpenTelemetry, para que explores los resultados en dashboards en vez de en la salida de la terminal.

---

_Este post se basa en mi charla "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" en ContainerDays London 2026._

_Parte de una serie de 4 posts:_
- _[Parte 1: SLMs y Docker Model Runner](/es/posts/2026-03-02-elegir-el-llm-mas-pequeno-parte-1/)_
- _[Parte 2: Benchmarking con Go](/es/posts/2026-03-04-elegir-llm-mas-pequeno-parte-2-benchmarking-con-go/)_
- _Parte 3: Agente evaluador y tool calling (este post)_
- _[Parte 4: Observabilidad con OpenTelemetry y Grafana](/es/posts/2026-03-09-elegir-llm-mas-pequeno-parte-4-observabilidad-grafana/)_

_Recursos:_
- _[Código fuente del benchmark](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks)_
- _[Patrón LLM-as-Judge (Hugging Face)](https://huggingface.co/learn/cookbook/en/llm_judge)_
- _[Documentación de function calling de OpenAI](https://platform.openai.com/docs/guides/function-calling)_
- _[Testcontainers para Go](https://golang.testcontainers.org/)_
