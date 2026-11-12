---
title: "Cómo probar charts de Helm con sk8s y testcontainers-go"
date: 2026-06-12 09:00:00 +0200
description: "Cómo usa DHI (Docker Hardened Images) testcontainers-go y sk8s para probar charts de Helm en clusters k3s efímeros: scaffolding, carga de imágenes y estrategias para testear con un solo cluster."
categories: [Technology, Software Development, Testing]
tags: ["testcontainers", "go", "kubernetes", "k3s", "helm", "sk8s", "dhi"]
type: post
weight: 30
translationKey: testing-helm-charts-with-sk8s-and-tc-go
translatedFrom: aec73c8
---

![Cómo probar charts de Helm con sk8s y testcontainers-go](/images/posts/2026-06-12-testing-helm-charts-with-sk8s-and-tc-go/cover.png)

> Escrito originalmente por [Enin Kaduk](https://www.linkedin.com/in/eninkaduk/), publicado también en su blog personal: https://www.blueprismo.com/posts/2026/sk8s_testcontainers/

## Introducción

Si despliegas workloads en Kubernetes, tarde o temprano quieres tests que vayan más allá de `helm template` y del linting de YAML.
Quieres saber que el chart de verdad se instala, que el security context respeta el mínimo privilegio que pretendías, que las probes pasan, que los pods llegan a `Ready` y que lo que expusiste en el puerto 8080 realmente responde.
En Docker Hardened Images (DHI) hacemos eso miles de veces, entre imágenes de contenedor y charts de Helm. El stack que hay debajo es simple y limpio:

1. **[testcontainers-go](https://golang.testcontainers.org/)** levanta contenedores reales durante `go test` y los destruye cuando el test termina.
2. **[sk8s](https://github.com/docker-hardened-images/sk8s)**, nuestra librería open source que se apoya en el módulo de k3s de testcontainers y te da un cliente de Kubernetes tipado, helpers para instalar con Helm, utilidades de espera y carga de imágenes en el cluster.

Este post explica cómo encajan esas piezas, cómo es el scaffolding en la práctica y qué estrategias de testing usamos para que el CI sea rápido.

## ¿Por qué no mockear Kubernetes?

Hay muchas formas de testear Kubernetes y existen librerías excelentes. Para tests unitarios en los que no necesitas un kubelet, puedes usar [envtest](https://pkg.go.dev/sigs.k8s.io/controller-runtime/pkg/envtest). Para tests de escala en los que necesitas simular nodos reales, está [KWOK](https://kwok.sigs.k8s.io/). Y así con más.
Puedes mockear mucho. El dry-run de Helm es excelente para las comprobaciones estáticas: manifiestos renderizados, security contexts, referencias a imágenes, escaneos de compliance sobre el YAML.
Pero los mocks no te van a decir que:

- un webhook no se registra porque el CA bundle es incorrecto,
- un init container entra en un bucle infinito en `arm64`,
- una dependencia del chart descarga una imagen a la que el cluster no llega,
- tu readiness probe apunta al puerto equivocado después de cambiar los values.

Un cluster efímero te da un API server real, un scheduling real y un kubelet real, sin tener que mantener un entorno de staging compartido por el que todo el mundo se pelea.
testcontainers-go es el motor. sk8s es la capa de ergonomía que construimos para aliviar el trabajo de testear un número cada vez mayor de charts.

## El stack, de abajo arriba

```text
┌─────────────────────────────────────────────┐
│  your test (Helm install, HTTP checks, …)   │
├─────────────────────────────────────────────┤
│  sk8s.TestCluster                           │
│  - client-go clients                        │
│  - HelmInstall / HelmUninstall              │
│  - LoadImages, WaitFor*, GetRaw (API proxy) │
├─────────────────────────────────────────────┤
│  testcontainers-go/modules/k3s              │
│  - rancher/k3s container                    │
│  - kubeconfig extraction                    │
├─────────────────────────────────────────────┤
│  testcontainers-go + Docker                 │
└─────────────────────────────────────────────┘
```

Hoy sk8s usa el [módulo de k3s](https://github.com/testcontainers/testcontainers-go/tree/main/modules/k3s). El proyecto está estructurado a propósito para poder cambiar de backend más adelante (EKS, kind, lo que encaje en tu CI). El contrato es la superficie de `TestCluster`, no k3s.
Elegimos k3s porque es una distribución de Kubernetes completa y rápida, agnóstica del proveedor de nube y con el runtime de contenedores integrado.

## Levantar un cluster

El punto de entrada es `sk8s.GetCluster`. Por debajo:

1. Construye un fichero de configuración de k3s (feature gates, componentes incluidos desactivados como metrics-server, etc.).
2. Ejecuta el contenedor de k3s con testcontainers, con la limpieza registrada en `t`.
3. Extrae el kubeconfig del contenedor y construye un `kubernetes.Clientset` ([ref](https://pkg.go.dev/k8s.io/client-go/kubernetes#Clientset)).
4. Crea un directorio temporal para el estado de Helm (fichero de kubeconfig, caché de repositorios, configuración del registry).

Un ejemplo mínimo:

```go
func TestMyChart(t *testing.T) {
    ctx, cancel := context.WithTimeout(t.Context(), 5*time.Minute)
    defer cancel()
    cluster, err := sk8s.GetCluster(t, ctx,
        // sk8s.WithLoggingOptions(true, true), // optional: stream Warning events and pod logs in CI
    )
    require.NoError(t, err)
    // cluster is ready, install something
}
```

## Tests de charts de Helm: el camino feliz

Los charts de Helm en CI suelen necesitar tres cosas que el cluster no tiene por defecto:

1. **El chart en sí** (directorio local, tarball o artefacto OCI).
2. **Todas las imágenes de contenedor** que aparecen en los manifiestos renderizados, descargadas y cargadas en el namespace de containerd de k3s.
3. **Un namespace de destino** (que `HelmInstall` crea automáticamente cuando le pasas `WithNamespace`).

sk8s envuelve el SDK de Helm v4. Un flujo de instalación típico se ve así:

```go
const ns = "my-namespace"
// 1. Start cluster
cluster, err := sk8s.GetCluster(t, ctx)
require.NoError(t, err)
// 2. Pre-load images (see next section)
err = cluster.LoadImages(ctx,
    "registry.example.com/my-controller:1.2.3",
    "registry.example.com/my-sidecar:1.2.3",
)
require.NoError(t, err)
// 3. Install chart
err = cluster.HelmInstall(ctx, "test",
    sk8s.ChartSourceFromOCI("oci://registry.example.com/my-chart", "2.0.0"),
    sk8s.WithNamespace(ns),
    sk8s.WithInstallValues(map[string]interface{}{
        "replicaCount": 1,
        "image": map[string]interface{}{
            "tag": "1.2.3",
        },
    }),
)
require.NoError(t, err)
// 4. Wait for workloads
err = cluster.WaitForDeployment(ctx, ns, "my-controller")
require.NoError(t, err)
```

`HelmInstall` crea el namespace si hace falta, conecta el kubeconfig de Helm con el cluster efímero y se ejecuta con un timeout de instalación generoso (el timeout por defecto del status watcher de Helm se queda corto para algunos charts "grandes").
Las fuentes del chart son intercambiables: referencias OCI, URL de repositorio clásico más versión, o URL de repositorio más resolución por appVersion. A día de hoy no hay un helper específico para tarballs, pero el `LocateChart` de Helm puede resolver directorios de charts locales (y rutas `.tgz`) cuando la referencia apunta al sistema de ficheros.

## Cargar imágenes: lo que todo el mundo hace mal una vez

k3s corre dentro de Docker. Tu test runner también habla con Docker. El contenedor de k3s no es tu test runner. El cluster **no** puede descargar imágenes por arte de magia de un registry al que sí llega tu job de CI, a menos que la network policy, las credenciales y el DNS cuadren dentro de ese contenedor. En los tests de charts muchas veces no cuadran, porque lo que quieres son ejecuciones herméticas y reproducibles.
El patrón que usamos:

1. **Renderizar con dry-run** el chart con los mismos values con los que lo vas a instalar.
2. Recorrer los manifiestos renderizados y recoger todos los campos `image:` (incluidos los manifiestos de hooks).
3. **Descargar en el host** con el Docker provider de testcontainers.
4. **Importar en k3s** con `cluster.LoadImages`.

Conceptualmente:

```go
images, err := extractImagesFromHelmRender(chartPath, values)
require.NoError(t, err)
for _, img := range images {
    require.NoError(t, dockerProvider.PullImage(ctx, img))
}
require.NoError(t, cluster.LoadImages(ctx, images...))
```

Si te saltas este paso, el fallo es desesperante: un `ImagePullBackOff` en una imagen que *sabes* que existe, porque los pods descargan las imágenes a través de k3s, no a través del login de Docker de tu portátil.
Las credenciales del registry en el host ayudan al test runner a descargar imágenes en el paso 3, pero no arreglan automáticamente las descargas dentro del cluster. Sigues necesitando `LoadImages` (o `imagePullSecrets` explícitos en el chart) para que los workloads arranquen sin depender de acceso al registry desde dentro de k3s.
sk8s también soporta imágenes fijadas por digest e importaciones conscientes de la plataforma cuando pruebas imágenes multi-arch.

## Dos capas de testing

Dividimos la validación de charts en una capa **estática** y una capa de **runtime**. Las dos importan y ninguna sustituye a la otra.

### Tests estáticos (sin cluster)

Son rápidos, se paralelizan bien y fallan con diffs precisos:

- Revisión básica de Chart.yaml y values.yaml (`helm show chart`, `helm show values`).
- Comprobaciones sobre los manifiestos renderizados: security contexts, nombres de recursos, labels.
- Política de referencias a imágenes (por ejemplo, que todos los workloads apunten a imágenes hardened).
- Herramientas opcionales de políticas y compliance sobre el YAML renderizado.

Usan el dry-run de Helm y aserciones en Go sobre manifiestos unstructured. No hace falta el socket de Docker.

### Tests de runtime (cluster con sk8s)

Responden a las preguntas que el dry-run no puede, como:

- ¿Los Deployments llegan de verdad a Ready y dejan logs de arranque sanos?
- ¿Los CRDs quedan establecidos antes de que los controladores empiecen a reconciliar?
- ¿El endpoint de métricas devuelve texto de Prometheus?
- ¿Se puede llegar a un servicio a través del proxy del API server?

Un ejemplo: tras la instalación, probamos un Service a través del proxy de API integrado (en k3s no hace falta un Ingress):

```go
t.Run("portal responds", func(t *testing.T) {
    path := fmt.Sprintf("/api/v1/namespaces/%s/services/my-portal:80/proxy/", ns)
    err := cluster.WaitFor(ctx, func(ctx context.Context) (bool, error) {
        body, err := cluster.GetRaw(ctx, path)
        if err != nil {
            return false, nil
        }
        return strings.Contains(body, "expected-marker"), nil
    })
    require.NoError(t, err)
})
```

Y para los endpoints de Prometheus de un pod concreto:

```go
pods, err := cluster.GetPodsForDeployment(ctx, ns, "my-controller")
require.NoError(t, err)
require.NotEmpty(t, pods)
metricsPath := fmt.Sprintf(
    "/api/v1/namespaces/%s/pods/%s:8080/proxy/metrics",
    ns, pods[0].Name,
)
// WaitFor + GetRaw until body contains "# HELP"
```

Este patrón aparece una y otra vez en nuestros tests de charts: una instalación y muchos subtests concretos para métricas, CRDs y comportamiento HTTP.

## Estrategia: un cluster, muchos subtests

Arrancar k3s es lo caro. Un arranque en frío puede tardar unos segundos, y descargar e importar imágenes añade más. Si cada `t.Run` vuelve a llamar a `GetCluster`, tu suite crece de forma lineal con el número de casos de prueba y el CI se convierte en una prueba de paciencia.
**Mejor un cluster por función de test de nivel superior, y repartir el trabajo con subtests.**

```go
func TestInstall(t *testing.T) {
    ctx, cancel := context.WithDeadline(t.Context(), time.Now().Add(5*time.Minute))
    defer cancel()
    cluster, err := installChartOnce(t, ctx, namespace, values)
    require.NoError(t, err)
    // Multiple subtests in the same cluster.
    t.Run("CRDs installed", func(t *testing.T) { /* … */ })
    t.Run("controller metrics", func(t *testing.T) { /* … */ })
    t.Run("webhook ready", func(t *testing.T) { /* … */ })
}
```

Con esta estrategia hay que tener en cuenta que algunos subtests pueden contaminar a los siguientes. Un test que crea un Job, por ejemplo, debería limpiar lo suyo o llamar a `HelmUninstall` antes del siguiente escenario.

### El truco de `parent := t`

sk8s guarda el estado de Helm en `t.TempDir()` y registra la limpieza del contenedor en el `*testing.T` que le pasas a `GetCluster`.
Si llamas a `GetCluster` con el `t` de un subtest, el directorio temporal de ese subtest (y a veces el ciclo de vida del cluster) se destruye cuando el subtest termina, mientras los subtests hermanos todavía necesitan el cluster.
**Pasa el `*testing.T` del test padre para montar el cluster y usa el `t` del subtest solo para aserciones y logs.**

```go
func TestMyStack(t *testing.T) {
    parent := t
    ctx, cancel := context.WithTimeout(parent.Context(), 5*time.Minute)
    defer cancel()
    var cluster *sk8s.TestCluster
    t.Run("01_start_k3s", func(t *testing.T) {
        var err error
        cluster, err = sk8s.GetCluster(parent, ctx) // parent, not t
        require.NoError(t, err)
    })
    t.Run("02_install_chart", func(t *testing.T) {
        require.NotNil(t, cluster)
        require.NoError(t, installChart(parent, cluster))
    })
    t.Run("03_verify_ready", func(t *testing.T) {
        require.NotNil(t, cluster)
        // assertions using cluster …
    })
}
```

Es uno de esos detalles pequeños que, vistos a posteriori, son obvios, y que la primera vez te cuestan una tarde.

### Cuándo levantar un segundo cluster

Un solo cluster no siempre basta:

- Tests que modifican recursos de ámbito cluster de forma agresiva (webhooks, cambios de CNI).
- Casos que necesitan un **estado limpio de etcd** (por ejemplo, instalar, desinstalar y reinstalar con otros values).
- Paquetes en paralelo (`t.Parallel()` a nivel de paquete): cada test en paralelo sigue necesitando su propio cluster. Se comparte dentro de la función de test, no entre paquetes sin coordinación.

En los repos con muchos charts seguimos ejecutando **tests de nivel superior separados por chart** (aislamiento por dominio de fallo), pero **dentro** del test de instalación de un chart consolidamos los subtests.

## Patrones de testcontainers que conviene conocer

Aunque sk8s esconda la mayor parte, estas ideas de testcontainers-go aparecen en todas partes en nuestros tests:

| Concepto | Por qué importa |
|--------|----------------|
| `tc.Run` / módulo `k3s.Run` | Arranque declarativo del contenedor y limpieza automática |
| `wait.ForListeningPort` / `wait.ForLog` | Condiciones de readiness antes de las aserciones |
| `MappedPort` | Puertos accesibles desde el host para sidecars que no son de k8s |
| `network.New` | Escenarios multicontenedor (base de datos y app bajo test) |
| Pull y save de imágenes con el Docker provider | Puente entre el registry del host y la importación en el cluster |

## Lo que sk8s te da además de k3s a secas

Una lista corta de las APIs que usamos a diario:

- **`WaitForDeployment` / `WaitForDaemonSet` / `WaitForStatefulSet`, etc.**: esperan hasta que las réplicas Ready coinciden con las deseadas.
- **`WaitForCRD`**: bloquea los tests que aplican CRs justo después de instalar.
- **`GetRaw`**: HTTP a través del proxy del API server. Ideal para métricas y comprobaciones HTTP sencillas sin el boilerplate del port-forward.
- **`ExecPod` / `RunJob`**: ejecutan comandos puntuales cuando necesitas acceso a una shell.
- **`HelmUninstall`**: reinicia entre escenarios dentro del mismo cluster (más barato que un reinicio completo cuando funciona).
- **`WithLoggingOptions`**: depurar a base de printf cuando el CI falla y no puedes enganchar un debugger.

Si echas algo en falta, mira la [guía de contribución](https://github.com/docker-hardened-images/sk8s/blob/main/CONTRIBUTING.md).

## Roadmap: más allá de k3s

k3s es ideal para CI: un solo contenedor, arranque rápido y un Kubernetes suficientemente bueno para smoke tests de charts. No es idéntico al EKS/GKE/AKS de producción. Los valores por defecto del CNI cambian, los Services de tipo LoadBalancer se comportan distinto y algunas APIs de admisión están simplificadas.
sk8s está estructurado para que el **backend del cluster pueda cambiar** mientras los tests siguen llamando a `TestCluster`. Una implementación basada en EKS aprovisionaría (o se conectaría a) un cluster real, seguiría exponiendo los mismos helpers de Helm y de espera, y te dejaría etiquetar los tests que necesitan comportamiento específico de una nube.
Hasta entonces, k3s más una carga de imágenes disciplinada te lleva sorprendentemente lejos, y por eso liberamos la librería como open source en lugar de dejarla en un arnés de tests privado.
En un futuro cercano estamos pensando en añadir módulos para proveedores de nube, para que sk8s se integre sin esfuerzo en tus tests de Helm 🛹

## Para cerrar

Los buenos tests de Kubernetes son un problema de capas:

- **Dry-run** para feedback rápido sobre el YAML y las políticas.
- **Clusters efímeros** para el comportamiento de instalación, readiness e integración.
- **Un cluster compartido por función de test** para que el CI siga siendo llevadero.

testcontainers-go hace que el cluster sea desechable. sk8s hace que se pueda usar desde tests en Go sin ahogarte en código pegamento.
El código fuente y los ejemplos de sk8s están en [github.com/docker-hardened-images/sk8s](https://github.com/docker-hardened-images/sk8s). Issues y pull requests bienvenidos 🌟

---

*Recursos:*
- *[Docker Hardened Images](https://www.docker.com/products/hardened-images/)*
- *[sk8s en GitHub](https://github.com/docker-hardened-images/sk8s)*
- *[testcontainers-go en GitHub](https://github.com/testcontainers/testcontainers-go)*
