---
title: "Elegir el LLM más pequeño que no te falle del todo (parte 4): observabilidad con OpenTelemetry y Grafana"
date: 2026-03-09 09:00:00 +0100
description: "160 escenarios de benchmark generan demasiados datos para leerlos en la terminal. Así conecté trazas, métricas y logs de OpenTelemetry a un dashboard de Grafana para ver el rendimiento de cada modelo y decidir con datos."
categories: [Technology, AI, Observability]
tags: ["small-language-models", "opentelemetry", "grafana", "observability", "testcontainers", "docker-model-runner", "go"]
type: post
weight: 30
translationKey: choosing-the-smallest-llm-part-4-observability-with-otel-and-grafana
translatedFrom: dfde9c8
---

![Observabilidad con OpenTelemetry y Grafana](/images/posts/2026-03-09-slms-observability-otel-grafana/cover.png)

En la [parte 1](/es/posts/2026-03-02-elegir-el-llm-mas-pequeno-parte-1/) configuramos SLMs con Docker Model Runner. En la [parte 2](/es/posts/2026-03-04-elegir-llm-mas-pequeno-parte-2-benchmarking-con-go/) construimos el framework de benchmarking con Go. En la [parte 3](/es/posts/2026-03-06-elegir-llm-pequeno-parte-3-evaluador-tool-calling/) añadimos la evaluación automática de calidad y los benchmarks de tool calling.

El framework ya produce todos los datos que necesitas. Pero 160 escenarios con más de 10 métricas cada uno son más de 1.600 datos volcados en la consola. Lo que en un gráfico salta a la vista, en un muro de texto es invisible.

¿Qué modelo es el más rápido con temperatura baja? ¿En qué tarea hay más diferencia de calidad entre 1B y 3B? ¿A partir de qué temperatura empieza Qwen3 a alucinar? No puedes responder a eso haciendo scroll por la terminal. Necesitas filtrar, agrupar y comparar. Para eso están los dashboards.

## Instrumentación con OpenTelemetry

Usé [OpenTelemetry](https://opentelemetry.io/) (OTel) para toda la instrumentación. Ofrece una API neutral respecto a proveedores para trazas, métricas y logs, y los envía por OTLP a cualquier backend compatible.

El benchmark instrumenta cada escenario con las tres señales:

### Trazas

Cada escenario del benchmark crea un **span** que recoge la invocación completa del modelo: nombre del modelo, tarea, temperatura y duración. Los spans están anidados: el span principal del benchmark contiene spans hijos para la llamada al modelo, la llamada al evaluador y cada llamada a una herramienta. Cuando un escenario va lento, veo exactamente dónde se fue el tiempo: en el modelo, en el evaluador o en una herramienta.

### Métricas

Emito **histogramas** (distribución de latencia, TTFT, tokens por segundo), **contadores** (peticiones totales, éxitos, fallos, llamadas a herramientas) y **gauges** (memoria de GPU, utilización de GPU). Cada métrica lleva las etiquetas de modelo, tarea y temperatura, y eso es lo que permite al dashboard filtrar y agrupar por cualquier dimensión.

### Logs

Los **logs estructurados** guardan el prompt y la respuesta en bruto de cada escenario, junto con la puntuación y la explicación del evaluador. Se correlacionan con las trazas mediante los trace IDs. Cuando veo un eval_score bajo en el dashboard, hago clic y llego a la respuesta que falló. Sin adivinar.

### El código de instrumentación

Para configurar OTel en el benchmark hace falta una función `TestMain` que inicialice el exporter antes de que se ejecute ningún benchmark:

```go
func TestMain(m *testing.M) {
    ctx := context.Background()

    lgtmContainer, _ := grafanalgtm.Run(ctx, "grafana/otel-lgtm:0.11.18")
    otelEndpoint, _ := lgtmContainer.OtlpHttpEndpoint(ctx)

    otelSetup, _ := InitOTel(ctx, otelEndpoint) // traces, metrics, logs
    dmrContainer, _ := dmr.Run(ctx)              // Docker Model Runner

    exitCode := m.Run()
    otelSetup.Shutdown(ctx)
    os.Exit(exitCode)
}
```

`TestMain` se ejecuta antes que todos los benchmarks. Arranca el contenedor LGTM, inicializa los exporters de OTel apuntando a él, arranca Docker Model Runner, lo ejecuta todo y al final vuelca los datos pendientes y apaga todo. Cambiar de backend (de Grafana a Jaeger, o de local a la nube) es solo cuestión de cambiar el endpoint.

## El stack Grafana LGTM con Testcontainers

Necesitas un backend que reciba, almacene y consulte los datos de OTel. El framework de benchmarks usa el **stack Grafana LGTM**: Loki (logs), Grafana (visualización), Tempo (trazas) y Mimir (métricas). Son cuatro servicios, cada uno con su propia configuración, que tienen que funcionar juntos.

Montar eso a mano es tedioso. Hacerlo en CI es peor. Por eso el benchmark usa [Testcontainers](https://golang.testcontainers.org/) para levantar todo el stack en un único contenedor:

```go
grafanaContainer, err := grafanalgtm.Run(ctx, "grafana/otel-lgtm:0.8.1")
if err != nil {
    log.Fatal(err)
}
```

Esa línea arranca un contenedor que incluye Loki, Grafana, Tempo, Mimir y un OpenTelemetry Collector. Expone un endpoint OTLP para recibir datos y una interfaz de Grafana para consultarlos. Sin ficheros de Docker Compose, sin charts de Helm, sin manifiestos YAML. Solo una llamada a una función de Go.

El módulo de Testcontainers también ofrece métodos auxiliares para obtener los datos de conexión:

```go
otelEndpoint, _ := grafanaContainer.OtlpHttpEndpoint(ctx)
grafanaURL, _ := grafanaContainer.HttpEndpoint(ctx)
```

Cuando terminan los benchmarks, la interfaz de Grafana está disponible en `localhost:3000` (por defecto). Ábrela en el navegador y tienes todo el stack de observabilidad listo para consultar.

## El dashboard

El framework de benchmarks incluye un dashboard de Grafana ya preparado, con 22 paneles organizados en secciones. No tienes que construirlo desde cero: se aprovisiona automáticamente cuando arranca el contenedor LGTM.

Los paneles se agrupan en cuatro secciones:

**Latencia y throughput** (9 paneles): percentiles de latencia e histogramas de distribución, percentiles de TTFT (Time To First Token) y su distribución, percentiles del tiempo de evaluación del prompt y su distribución, tokens por operación, tasa de éxito y throughput en tokens por segundo. El histograma de latencia es donde paso más tiempo. Enseña de inmediato qué modelos se agrupan en el extremo bajo y cuáles tienen colas largas. Cada histograma admite exemplars, así que los valores atípicos enlazan directamente con su traza.

**Calidad y evaluación** (2 paneles): puntuación del evaluador y tasa de aprobados del evaluador, ambos como series temporales. Muestran la tendencia entre ejecuciones del benchmark, para que veas si la calidad de un modelo es estable o ruidosa entre iteraciones.

**Tool calling** (7 paneles): latencia de las llamadas a herramientas, llamadas a herramientas por operación, iteraciones LLM-herramienta, tasa de éxito de las herramientas, precisión de los parámetros, precisión en la selección de herramienta y convergencia (eficiencia del camino). Estos paneles solo se activan con las tareas asistidas por herramientas de la parte 3. El de convergencia es especialmente útil: indica si el modelo llega a la respuesta correcta de forma eficiente o malgasta iteraciones en llamadas equivocadas.

**GPU y sistema** (2 paneles): utilización de GPU y uso de memoria de GPU. Sirven para planificar el despliegue: ¿cabe este modelo en mi GPU?

Un panel independiente de **ns/op** al final muestra el tiempo bruto del benchmark de Go, para compararlo con las métricas instrumentadas con OTel.

Tienes la referencia completa de paneles en el [README del benchmark](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks).

## Variables de plantilla del dashboard

El dashboard usa variables de plantilla (template variables) de Grafana, que aparecen como desplegables en la parte superior de la página. Puedes filtrar todo el dashboard por:

- **Modelo**: selecciona uno o varios modelos para compararlos. Si eliges solo dos, tienes una comparación limpia cara a cara.
- **Tarea**: filtra por un tipo de tarea concreto. Es útil cuando te importa una sola capacidad (por ejemplo, "enséñame solo los resultados de generación de código").
- **Temperatura**: céntrate en una temperatura concreta. Si sabes que tu aplicación usa temperatura 0,3, filtra todo por ese valor.

Estas variables se propagan a todos los paneles del dashboard, así que al cambiar un filtro se actualizan todos a la vez. Así pasas de "enséñamelo todo" a "enséñame Llama 3.2 3B frente a Qwen3 0.6B en tareas de código con temperatura 0,3".

## Cómo leer el dashboard

Tener un dashboard es una cosa. Saber qué mirar es otra. Este es el flujo que sigo yo:

### Empieza por la latencia y la tasa de éxito

Abre el dashboard y mira primero los paneles de percentiles de latencia y de tasa de éxito. Te dan la visión general: qué modelos son rápidos y cuáles completan de verdad sus tareas. Normalmente descartas uno o dos candidatos al instante. Un modelo con una tasa de éxito baja no merece más investigación, por rápido que sea.

### Revisa las puntuaciones de calidad

Después, mira los paneles de puntuación y tasa de aprobados del evaluador. Usa las variables de plantilla para filtrar por modelo y tarea. Puede que descubras que el modelo A puntúa bien en tareas de código pero mal en escritura creativa, y que el modelo B es justo lo contrario. Si tu aplicación solo necesita tareas de código, el modelo A es la elección obvia aunque su tasa de aprobados global sea más baja.

### Compara la capacidad de tool calling

La sección de tool calling tiene siete paneles que revelan si un modelo puede participar en flujos agénticos. La precisión en la selección de herramienta te dice si el modelo elige la herramienta correcta. La precisión de los parámetros, si le envía entradas válidas. La convergencia, si llega a la respuesta de forma eficiente. Un modelo que elige bien la herramienta pero manda parámetros mal formados es un problema distinto de uno que ignora las herramientas por completo.

### Usa los exemplars para ir al detalle

Grafana soporta los **exemplars**: puntos individuales de un gráfico que enlazan con la traza que hay detrás. Cuando veas un valor atípico (un escenario que tardó 10 veces más que la media, o que sacó un 0 cuando los demás sacaron un 8), haz clic en el exemplar para saltar a su traza.

La traza muestra el árbol completo de spans, así que puedes localizar el paso lento. También enlaza con la entrada de log, que contiene el prompt y la respuesta en bruto. Puedes leer la respuesta que sacó un 0 y entender por qué falló.

## Investigar fallos con LogQL

Cuando el dashboard deja ver un patrón (un modelo que saca un 0 en una tarea concreta), querrás rascar en los datos en bruto. El data source de Loki de Grafana soporta consultas **LogQL** para eso:

```text
{service_name="llm-benchmarks"} | json | eval_score < 3
```

Esta consulta encuentra todas las ejecuciones del benchmark con una puntuación del evaluador por debajo de 3. Puedes acotarla más:

```text
{service_name="llm-benchmarks", model="llama3.2-1B"} | json | task="tool-calculator" | eval_score = 0
```

Esta encuentra cada llamada fallida a la herramienta calculadora de Llama 3.2 1B. Las entradas de log te dicen exactamente qué fue mal: ¿el modelo no llamó a la herramienta, la llamó con parámetros erróneos o interpretó mal el resultado?

## El proceso de selección del modelo

Todo el proceso lleva unos 30 minutos de cómputo y 15 minutos de análisis en el dashboard. Defines tus tareas, eliges los modelos candidatos, ejecutas los benchmarks y abres el dashboard. Compáralo con probar los modelos a mano, uno por uno, que puede llevar días y aun así dejarte adivinando.

Seguramente el modelo más pequeño que no te falle del todo es más pequeño de lo que crees. Con 160 escenarios, tres señales de OTel y 22 paneles de dashboard, ya tienes las pruebas para demostrarlo.

## ¿Has encontrado un bug en los dashboards?

El dashboard y el framework de benchmarking son open source. Si ves un panel que se pueda mejorar, una métrica que falte o una consulta incorrecta, [abre una issue o envía una PR](https://github.com/mdelapenya/generative-ai-with-testcontainers/issues/new). El dashboard se genera desde código Go, así que arreglarlo es cuestión de llamadas a funciones.

---

_Este post está basado en mi charla "[Choosing the Smallest LLM That Won't Completely Fail You](/slides/2026-02-containerdays-london/ContainerDays-London-Choosing-the-smallest-LLM.pdf)" en ContainerDays London 2026._

_Parte de una serie de 4 posts:_
- _[Parte 1: SLMs y Docker Model Runner](/es/posts/2026-03-02-elegir-el-llm-mas-pequeno-parte-1/)_
- _[Parte 2: Benchmarking con Go](/es/posts/2026-03-04-elegir-llm-mas-pequeno-parte-2-benchmarking-con-go/)_
- _[Parte 3: Agente evaluador y tool calling](/es/posts/2026-03-06-elegir-llm-pequeno-parte-3-evaluador-tool-calling/)_
- _Parte 4: Observabilidad con OpenTelemetry y Grafana (este post)_

_Recursos:_
- _[Código fuente del benchmark](https://github.com/mdelapenya/generative-ai-with-testcontainers/tree/main/11-benchmarks)_
- _[Documentación de OpenTelemetry](https://opentelemetry.io/docs/)_
- _[Stack Grafana LGTM](https://grafana.com/blog/2024/03/13/an-opentelemetry-backend-in-a-docker-image-introducing-grafana/otel-lgtm/)_
- _[Módulo Grafana LGTM de Testcontainers](https://golang.testcontainers.org/modules/grafana-lgtm/)_
- _[Testcontainers para Go](https://golang.testcontainers.org/)_
