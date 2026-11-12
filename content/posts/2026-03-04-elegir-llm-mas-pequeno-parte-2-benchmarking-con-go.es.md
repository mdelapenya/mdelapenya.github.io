---
title: "Elegir el LLM más pequeño que no te falle del todo (parte 2): benchmarking con Go"
date: 2026-03-04 09:00:00 +0100
description: "Las puntuaciones de MMLU no prueban tus prompts. Así construí un framework de benchmarking con el paquete testing de Go y Docker Model Runner para encontrar el modelo más pequeño que de verdad funciona en mis casos de uso."
categories: [Technology, AI, Go]
tags: ["small-language-models", "go-benchmarks", "go", "golang", "docker-model-runner", "testcontainers"]
type: post
weight: 30
translationKey: choosing-the-smallest-llm-part-2-benchmarking-with-go
translatedFrom: dfde9c8
---

![Benchmarking de SLMs con Go](/images/posts/2026-03-04-slms-benchmarking-with-go/cover.png)

En la [parte 1](/es/posts/2026-03-02-elegir-el-llm-mas-pequeno-parte-1/) te enseñé a ejecutar Small Language Models en local con Docker Model Runner. Te descargas un modelo de 727 MB y chateas con él en tu portátil. Genial. Pero ¿qué modelo deberías elegir de verdad para tu proyecto?

Las puntuaciones de MMLU y los leaderboards de Hugging Face te dan una idea general de la calidad de un modelo, pero no prueban *tus* prompts, con *tus* tareas, con *tu* configuración de temperatura. La única forma de saber qué modelo funciona en tu caso de uso es hacer el benchmark tú mismo.

En esta segunda parte te cuento el framework de benchmarking que construí para responder a esa pregunta de forma sistemática, usando las herramientas de testing que ya trae Go.

## Por qué los benchmarks genéricos no te sirven

Cada modelo nuevo llega con sus puntuaciones: MMLU, HumanEval, GSM8K. Te dicen cómo rinde un modelo en tareas académicas estandarizadas. Sirven para ordenar modelos en general, pero tienen un problema de fondo: no prueban lo que a ti te importa.

Un modelo que saca un 85% en MMLU puede fallar estrepitosamente al explicar tu código Go. Uno que arrasa en HumanEval puede generar funciones infladas e inservibles con tus prompts concretos. La única forma de saberlo es probar con tus tareas reales.

## Diseño factorial completo: probarlo todo contra todo

La idea central es un **experimento factorial completo**. En vez de probar un modelo con una tarea, pruebas todas las combinaciones de tres dimensiones:

- **Modelos**: 4 SLMs locales (Llama 3.2 1B, Llama 3.2 3B, Qwen3 0.6B, Llama 3.2 1B Instruct) más un modelo alojado opcional (GPT-5.1) como referencia
- **Tareas**: 8 prompts que cubren distintas capacidades
- **Temperaturas**: 5 valores (0,1; 0,3; 0,5; 0,7; 0,9)

Eso da **4 modelos x 8 tareas x 5 temperaturas = 160 escenarios**. Con GPT-5.1 incluido, son 200. Cada escenario se ejecuta varias veces para que los resultados sean estadísticamente significativos.

¿Por qué probar temperaturas? Porque el mismo modelo puede comportarse de forma muy distinta con temperatura 0,1 (determinista, centrado) que con 0,9 (creativo, impredecible). Un modelo fiable con temperatura baja puede alucinar con temperatura alta. Quieres saber dónde se rompe.

### Las ocho tareas

El benchmark incluye dos categorías de tareas:

**5 prompts estándar** que prueban capacidades básicas:
- **Explicación de código**: ¿Sabe el modelo leer y explicar una función en Go?
- **Operaciones matemáticas**: ¿Puede calcular la suma de 1 a 100?
- **Escritura creativa**: ¿Puede escribir un chiste sobre la sucesión de Fibonacci?
- **Pregunta factual**: ¿Sabe algo de la Escuela de Traductores de Toledo en la Edad Media?
- **Generación de código**: ¿Puede escribir una función recursiva de Fibonacci en Go?

**3 prompts asistidos por herramientas** que prueban el comportamiento agéntico:
- **Razonamiento con calculadora**: Descomponer `(125 * 47) + (980 / 20) - 156` en pasos usando una herramienta de calculadora
- **Validación de código**: Generar código Python y ejecutarlo para comprobar que es correcto
- **Obtención de datos de una API**: Consultar datos de la API de GitHub y resumirlos

El tool calling lo cuento en detalle en la parte 3. Lo importante aquí es que estas tareas prueban una capacidad radicalmente distinta: descomponer un problema en llamadas a herramientas en lugar de limitarse a generar texto.

## Los benchmarks de Go como columna vertebral

Ahora viene lo práctico. El paquete testing de Go tiene soporte nativo para benchmarks con `go test -bench`. Lo usé como columna vertebral de todo el framework porque te da de serie control de las iteraciones, medición de tiempos y métricas personalizadas.

La función de benchmark sigue un triple bucle anidado: para cada modelo, para cada caso de prueba, para cada temperatura, ejecuta N iteraciones:

```go
func BenchmarkLLMs(b *testing.B) {
    for _, model := range models {
        for _, tc := range testCases {
            for _, temp := range temperatures {
                benchName := fmt.Sprintf("%s/%s/temp%.1f", model.Name, tc.Name, temp)
                b.Run(benchName, func(b *testing.B) {
                    for i := 0; i < b.N; i++ {
                        result := runSingleBenchmark(ctx, client, model, tc, temp)
                        // record metrics...
                    }
                })
            }
        }
    }
}
```

Cada sub-benchmark recibe un nombre como `llama3.2/code-explanation/temp0.1`, así que la salida queda estructurada y se puede filtrar. El framework de benchmarks de Go se encarga de los tiempos, del número de iteraciones y del bucle `b.N`, que decide cuántas veces se ejecuta cada escenario.

Para lanzarlo:

```bash
go test -bench=. -benchtime=5x -timeout=30m
```

El flag `-benchtime=5x` le dice a Go que ejecute cada escenario exactamente 5 veces (en lugar de la iteración por tiempo que usa por defecto). El `-timeout=30m` deja margen de sobra para descargar los modelos la primera vez.

### Añadir métricas personalizadas

Por defecto, los benchmarks de Go reportan `ns/op` (nanosegundos por operación). Sirve para medir tiempos en bruto, pero para benchmarkear LLMs necesitas métricas del dominio: percentiles de latencia, throughput de tokens, tasas de éxito, puntuaciones de calidad.

El tipo `testing.B` de Go tiene un método, `ReportMetric(value float64, unit string)`, que te permite adjuntar cualquier métrica personalizada al resultado de un benchmark. El patrón es sencillo: recoges los resultados en bruto durante el bucle `b.N`, calculas los agregados al terminar el bucle y los reportas.

```go
b.Run(benchName, func(b *testing.B) {
    results := make([]BenchmarkResult, 0, b.N)

    b.ResetTimer()
    for i := 0; i < b.N; i++ {
        result := runSingleBenchmark(ctx, client, modelName, tc, temp)
        results = append(results, result)
    }
    b.StopTimer()
```

Las llamadas a `b.ResetTimer()` y `b.StopTimer()` son la clave: `ResetTimer` deja la preparación fuera de la medición y `StopTimer` deja fuera el cálculo de los agregados. Todo lo que queda entre las dos es el benchmark de verdad.

Después del bucle, calculas los agregados y los reportas:

```go
    b.ReportMetric(percentile(latencies, 50), "latency_p50_ms")
    b.ReportMetric(float64(successCount)/float64(len(results)), "success_rate")
    b.ReportMetric(tokensPerSec, "tokens_per_sec")
})
```

El framework reporta estas métricas personalizadas en cada escenario:

- **latency_p50_ms / latency_p95_ms**: Tiempo de respuesta mediano y en el percentil 95
- **ttft_p50_ms / ttft_p95_ms**: Time To First Token (cuánto tarda en llegar el primer token)
- **tokens_per_op**: Media de tokens por petición
- **tokens_per_sec / output_tokens_per_sec**: Throughput total y solo de salida
- **success_rate**: Porcentaje de peticiones correctas (de 0,0 a 1,0)
- **eval_score / eval_pass_rate**: Puntuación de calidad y tasa de aprobados del agente evaluador (más sobre esto en la parte 3)

La salida por consola se ve así:

```
BenchmarkLLMs/llama3.2/code-explanation/temp0.1-8    5    ...
    eval_score:0.85 latency_p50_ms:250.00 success_rate:1.00
    tokens_per_sec:180.00 ttft_p50_ms:45.00
```

Cada métrica personalizada aparece junto al `ns/op` nativo de Go, y así tienes la foto completa de cada escenario en una sola línea.

## Ejecuta tus propios benchmarks

El código completo es [open source en GitHub](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks). Lo lanzas con el mismo comando `go test -bench` de arriba. Si defines la variable de entorno `OPENAI_API_KEY`, el evaluador usa GPT-4o-mini para dar puntuaciones de calidad más precisas. Sin ella, recurre a un modelo local.

En Apple Silicon, añade `sudo` delante si quieres métricas de uso de GPU (las de memoria funcionan sin él).

El benchmark descarga los modelos solo la primera vez, arranca Docker Model Runner con Testcontainers y ejecuta los 160 (o 200) escenarios. Calcula entre 15 y 25 minutos, según tu hardware.

## Lo que viene ahora

A estas alturas ya tienes un framework de benchmarking que produce números en bruto: latencia, throughput de tokens, tasas de éxito. Pero quedan dos grandes preguntas: ¿cómo evalúas de forma automática la *calidad* de 160 respuestas? Y ¿cómo compruebas si un modelo sabe usar herramientas externas?

En la [parte 3](/es/posts/2026-03-06-elegir-llm-pequeno-parte-3-evaluador-tool-calling/) presento el patrón del agente evaluador (LLM-as-judge para puntuar la calidad de forma automática) y los benchmarks de tool calling, que comprueban si los SLMs son capaces de descomponer problemas en llamadas a una calculadora, a la ejecución de código y a APIs. Ahí es donde el benchmark pasa de medir "cómo de rápido" a medir "cómo de bueno".

---

_Este post se basa en mi charla "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" en ContainerDays London 2026._

_Parte de una serie de 4 posts:_
- _[Parte 1: SLMs y Docker Model Runner](/es/posts/2026-03-02-elegir-el-llm-mas-pequeno-parte-1/)_
- _Parte 2: Benchmarking con Go (este post)_
- _[Parte 3: Agente evaluador y tool calling](/es/posts/2026-03-06-elegir-llm-pequeno-parte-3-evaluador-tool-calling/)_
- _[Parte 4: Observabilidad con OpenTelemetry y Grafana](/es/posts/2026-03-09-elegir-llm-mas-pequeno-parte-4-observabilidad-grafana/)_

_Recursos:_
- _[Código fuente del benchmark](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks)_
- _[Documentación de benchmarks de Go](https://pkg.go.dev/testing#hdr-Benchmarks)_
- _[Testcontainers para Go](https://golang.testcontainers.org/)_
- _[Documentación de Docker Model Runner](https://docs.docker.com/ai/model-runner/)_
