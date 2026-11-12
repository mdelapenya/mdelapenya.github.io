---
title: "Elegir el LLM más pequeño que no te falle del todo (parte 1): SLMs y Docker Model Runner"
date: 2026-03-02 09:00:00 +0100
description: "No todas las tareas necesitan un modelo de un billón de parámetros. Los modelos de lenguaje pequeños que se ejecutan en local con Docker Model Runner te ahorran dinero, tiempo y límites de uso de las APIs. Así se empieza."
categories: [Technology, AI, Docker]
tags: ["small-language-models", "docker-model-runner", "quantization", "llms", "open-source"]
type: post
weight: 30
translationKey: choosing-the-smallest-llm-part-1-slms-and-docker-model-runner
translatedFrom: dfde9c8
---

![SLMs y Docker Model Runner](/images/posts/2026-03-02-slms-docker-model-runner/cover.png)

Hace poco di una charla en [ContainerDays London 2026](https://www.containerdays.io/containerdays-london-2026/agenda/) llamada "Choosing the Smallest LLM That Won't Completely Fail You" (algo así como "Elegir el LLM más pequeño que no te falle del todo"). El título tenía su gracia, pero la pregunta de fondo va muy en serio: cuando construyes software con IA, ¿de verdad necesitas un modelo con cientos de miles de millones de parámetros para cada tarea?

La respuesta corta es que no. En esta serie de cuatro partes te cuento cómo abordo la elección de modelos usando solo herramientas open source. Este primer post cubre qué son los modelos de lenguaje pequeños (Small Language Models, SLMs), por qué importan y cómo ejecutarlos en local con Docker Model Runner. En la Parte 2 construyo el framework de benchmarking con Go, la Parte 3 añade evaluación automática de calidad y tool calling, y la Parte 4 lo conecta todo a un dashboard de Grafana para que puedas ver los resultados de verdad.

## El coste de "usa GPT y listo"

Cuando construyes software con IA, tienes que definir varias piezas móviles: prompts de sistema, parámetros del modelo (temperature, top_p, top_k), el propio modelo y los formatos de respuesta. Durante el desarrollo, estás iterando sobre todo eso constantemente.

Y aquí está el problema. Si usas un modelo grande alojado en cada ciclo de iteración (desarrollo local, pipelines de CI, pruebas exploratorias), estás quemando tokens como Mario recogiendo monedas. Y los tokens cuestan dinero de verdad.

![Super Mario recogiendo monedas](/images/posts/2026-03-02-slms-docker-model-runner/mario-coins.gif)

¿Usarías tu base de datos de producción para probar cada cambio de código? Seguramente no. Podrías usar una base de datos local, algo más ligero y rápido como [Testcontainers](https://www.testcontainers.org), que te da confianza sin el coste ni el riesgo. La misma lógica vale para los modelos de lenguaje.

## ¿Qué son los modelos de lenguaje pequeños?

Los SLMs son, en esencia, modelos open source que caben en las GPUs de tu equipo. Hablamos de 2-8 GB de disco (y de memoria de GPU), quizá algo más, pero no de los cientos de gigabytes que necesitan los modelos de los grandes. No darán respuestas tan ricas como GPT-5 o Claude Opus, pero son ideales para experimentar y para tareas especializadas.

La diferencia clave está en los **parámetros**. Los modelos grandes de OpenAI, Anthropic y Google operan con cientos de miles de millones de parámetros, e incluso con billones. Los SLMs suelen moverse entre 0,6 y 8 miles de millones. Menos parámetros significa menor tamaño, inferencia más rápida y la posibilidad de ejecutarlo todo en tu propio hardware.

Algunos SLMs populares con los que te vas a encontrar:

- **Llama 3.2** (Meta): disponible en variantes de 1B y 3B
- **Qwen 3** (Alibaba): disponible en variante de 0,6B
- **SmolLM2** (Hugging Face): un modelo de 360M de parámetros

## Cuantización: encoger modelos sin romperlos (del todo)

Incluso un modelo de 3B de parámetros puede ser grande, según cómo se guarden los pesos. Ahí entra la **cuantización**: reducir la precisión con la que se almacenan los pesos como números de coma flotante.

Piensa en la compresión de imágenes. Una foto en RAW pesa muchísimo, pero es perfecta. Un JPEG pesa menos y apenas notas la pérdida de calidad. Si comprimes demasiado, empiezan a verse artefactos. La cuantización funciona igual:

- **FP32** (precisión completa): 100% del tamaño original
- **FP16** (media precisión): ~50% del tamaño
- **Q8** (cuantización de 8 bits): ~25% del tamaño
- **Q4** (cuantización de 4 bits): ~12,5% del tamaño

Los compromisos son reales. La cuantización puede provocar:

- **Un razonamiento algo peor** en todas las tareas
- **Más alucinaciones** con temperaturas altas
- **Una degradación más rápida** en tareas sensibles como las matemáticas y la generación de código

El mejor equilibrio para la mayoría de los casos de uso locales y en el edge es **Q4_K_M**. En la siguiente sección te explico qué significa ese nombre.

## Ejecutar modelos en local con Docker Model Runner

Hay varias formas de ejecutar SLMs en local: llama.cpp directamente, la biblioteca de Go [ardanlabs/kronk](https://github.com/ardanlabs/kronk), Ollama y otras. Pero el enfoque que quiero destacar es **Docker Model Runner**, disponible en Linux, macOS y Windows a través de Docker Desktop (y, desde finales de 2025, también como componente independiente para Docker Engine).

¿Por qué Docker Model Runner? Porque trata los modelos como ciudadanos de primera clase del ecosistema Docker. Los modelos se distribuyen como **artefactos OCI** en Docker Hub, lo que significa que los descargas con pull igual que las imágenes de contenedor.

### Descargar modelos

```bash
docker model pull ai/llama3.2:3B-Q4_0
```

Eso es todo. Docker Hub aloja modelos de IA junto a las imágenes de contenedor, y la experiencia con la CLI te resultará familiar.

Docker también ofrece un alias que elige por ti un modelo recomendado:

```bash
docker model pull gpt-oss
```

Esto descarga GPT-OSS, el modelo de pesos abiertos de OpenAI, que Docker trata como recomendación por defecto. No necesitas recordar un tag concreto: Docker elige la variante adecuada.

### Entender los nombres de los modelos

La convención de nombres codifica todo lo que necesitas saber de una variante. Vamos a descifrar `ai/llama3.2:3B-Q4_K_M`:

- **3B**: 3 mil millones de parámetros
- **Q4**: cuantización de 4 bits (usa 4 bits en lugar de los 32 originales)
- **K**: cuantización K de llama.cpp, que agrupa los pesos al cuantizar para ganar precisión
- **M**: variante Medium de K, una opción equilibrada entre velocidad, memoria y precisión

Una vez que entiendes este esquema, puedes tomar decisiones informadas con solo leer el tag.

### Ejecutar un modelo

```bash
docker model run ai/llama3.2:3B-Q4_0
```

Esto te lleva a una sesión de chat interactiva. Pregúntale lo que quieras:

```
> do you like testcontainers-go?
Testcontainers-go is a fantastic tool for testing Kubernetes applications
in Go. It simplifies the process of setting up ephemeral containers for
testing, allowing you to write cleaner and more efficient tests.
```

Nada mal para un modelo de 1,78 GB que se ejecuta entero en tu portátil.

### Acceder a los modelos desde contenedores

Para el acceso programático, Docker Model Runner expone una API compatible con OpenAI. Desde cualquier contenedor de tu red de Docker, puedes llegar a ella a través de:

```
http://model-runner.docker.internal:80
```

Es especialmente útil cuando tu aplicación se ejecuta en contenedores y necesita hablar con un modelo local. De hecho, así es exactamente como funciona el [módulo de Docker Model Runner de Testcontainers para Go](https://golang.testcontainers.org/modules/dockermodelrunner/): usa un contenedor socat para tender un puente entre tus contenedores de test y el motor de inferencia de Docker Model Runner.

## Las variantes de modelo de un vistazo

Esta es una referencia rápida de las variantes de Llama 3.2 disponibles en Docker Hub:

| Variante del modelo | Parámetros | Cuantización | VRAM | Tamaño |
|---|---|---|---|---|
| `ai/llama3.2:latest` | 3B | IQ2_XXS/Q4_K_M | 2,77 GiB | 1,87 GB |
| `ai/llama3.2:1B-Q4_0` | 1B | Q4_0 | 1,35 GiB | 727 MB |
| `ai/llama3.2:1B-Q8_0` | 1B | Q8_0 | 1,87 GiB | 1,22 GB |
| `ai/llama3.2:1B-F16` | 1B | F16 | 2,95 GiB | 2,30 GB |
| `ai/llama3.2:3B-Q4_0` | 3B | Q4_0 | 2,68 GiB | 1,78 GB |
| `ai/llama3.2:3B-Q4_K_M` | 3B | IQ2_XXS/Q4_K_M | 2,77 GiB | 1,87 GB |
| `ai/llama3.2:3B-F16` | 3B | F16 | 6,89 GiB | 5,98 GB |

Fíjate en el rango: de 727 MB (1B Q4_0) a 5,98 GB (3B F16), la misma familia de modelos abarca un orden de magnitud de tamaño según los parámetros y la cuantización.

## Cuándo usar SLMs (y cuándo no)

Usa SLMs para:

- **Desarrollo local**: itera sobre prompts, mensajes de sistema y formatos de respuesta sin quemar créditos de API
- **Pipelines de CI**: valida que el código de tu integración con IA funciona sin depender de APIs externas
- **Tareas especializadas**: clasificación, extracción de entidades, preguntas y respuestas sencillas donde un modelo más pequeño es "suficientemente bueno"
- **Experimentación**: prueba rápido distintas combinaciones de modelo, temperatura y prompt

Sigue usando modelos grandes alojados para:

- **Cargas de producción** donde la calidad de la respuesta impacta directamente en los usuarios
- **Tareas de razonamiento complejo** que requieren una comprensión profunda
- **Tareas donde la precisión es crítica** (médicas, legales, financieras)

La idea clave es que no son excluyentes. Usa SLMs durante el desarrollo y las pruebas, y pasa a modelos más grandes en producción. El mismo código, otro endpoint de modelo.

## Qué viene ahora

Saber que los SLMs existen y cómo ejecutarlos es solo el principio. La pregunta de verdad es: **¿cómo sabes qué modelo, con qué cuantización y con qué parámetros es la mejor opción para tu caso de uso concreto?**

Los benchmarks de MMLU y los leaderboards de terceros te dan un punto de partida, pero no prueban *tus* prompts con *tus* tareas y *tus* ajustes de temperatura. En la Parte 2 te enseño a responder esa pregunta de forma sistemática con las herramientas de benchmark que trae Go. El código completo es [open source en GitHub](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks).

---

_Este post se basa en mi charla "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" en ContainerDays London 2026._

_Parte de una serie de 4 posts:_
- _Parte 1: SLMs y Docker Model Runner (este post)_
- _[Parte 2: Benchmarking con Go](/es/posts/2026-03-04-elegir-llm-mas-pequeno-parte-2-benchmarking-con-go/)_
- _[Parte 3: Agente evaluador y tool calling](/es/posts/2026-03-06-elegir-llm-pequeno-parte-3-evaluador-tool-calling/)_
- _[Parte 4: Observabilidad con OpenTelemetry y Grafana](/es/posts/2026-03-09-elegir-llm-mas-pequeno-parte-4-observabilidad-grafana/)_

_Recursos:_
- _[Documentación de Docker Model Runner](https://docs.docker.com/ai/model-runner/)_
- _[Modelos de IA en Docker Hub](https://hub.docker.com/u/ai)_
- _[Hugging Face Model Hub](https://huggingface.co/models)_
