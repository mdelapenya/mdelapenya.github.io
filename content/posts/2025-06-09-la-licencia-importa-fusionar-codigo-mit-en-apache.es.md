---
title: "La licencia importa: guía práctica para fusionar código MIT en un proyecto Apache 2.0 con todo el respeto al open source"
date: 2025-06-09 10:00:00 +0530
description: "Cómo fusionar código MIT en un proyecto Apache 2.0 respetando la licencia original, la atribución y el historial de Git."
categories: [Open Source, License, OSS]
tags: ["open-source", "license", "oss", "mit", "apache", "codebase", "merge", "respect"]
type: post
weight: 25
translationKey: license-matters
translatedFrom: 0f78ae1
---

![Ilustración que representa la fusión de licencias OSS](/images/posts/2025-06-09-license-matters/cover.png)

El open source no va solo de código. Va de confianza, de responsabilidad y de honrar a las personas y a los principios que levantaron los cimientos sobre los que nos apoyamos. En un proyecto de SDK me topé hace poco con un reto habitual pero delicado: fusionar un repositorio con licencia MIT dentro de un código nuevo con licencia Apache 2.0. En lugar de hacerlo con prisas, aproveché para hacerlo bien: conservar el historial, respetar los términos de la licencia y atribuir correctamente. Este post te lleva por ese proceso, paso a paso, poniendo el foco en la compatibilidad entre licencias, la integridad de Git y la transparencia con la comunidad.

## Contexto y motivación

En el mundo del open source, reutilizar es muy potente, pero viene con responsabilidad. Ahora mismo trabajo en un SDK nuevo bajo la licencia Apache 2.0 y necesitaba una implementación fiable y rodada para un subsistema concreto. Encontré justo lo que buscaba en un repositorio con licencia MIT: pequeño, enfocado y ya probado en producción por otras herramientas del ecosistema.

El impulso natural sería copiar y pegar, retocar y seguir adelante. Pero cuando construyes algo pensado para vivir y crecer en abierto, y más aún bajo una licencia distinta, toca parar y pensar. En la atribución, en las obligaciones de la licencia y en lo que significa ser un buen ciudadano del open source.

No quise absorber el código en silencio ni borrarle su origen. Me comprometí a integrarlo conservando todo su historial de Git, reconociendo a sus autores y cumpliendo tanto la letra como el espíritu de las licencias MIT y Apache 2.0.

## Consideraciones legales y de licencia

Fusionar código open source entre licencias distintas no es solo una cuestión de compatibilidad técnica. Es una cuestión de claridad legal y de confianza de la comunidad. Por suerte, la licencia MIT y la Apache License 2.0 son permisivas y bastante compatibles entre sí, lo que hace viable la integración, siempre que se haga con cuidado.

Antes de escribir un solo comando de Git, definí cuatro innegociables para que el merge fuera limpio y respetuoso con el OSS:

1. **Conservar la licencia original**
    La licencia MIT exige que se mantengan el texto original de la licencia y los avisos de copyright.

    ✅ Me comprometí a mantener el fichero de licencia tal cual en el proyecto nuevo.

2. **Conservar la atribución**
    No va solo de obligaciones legales, va de dar el crédito a quien le corresponde.

    ✅ El plan incluía preservar el historial de Git y un fichero NOTICE que nombrara claramente a los autores originales.

3. **Declarar las modificaciones**
    La transparencia importa. Si vas a cambiar el código, dilo.

    ✅ Documentaría cualquier reestructuración o cambio, tanto en el código como en el NOTICE.

4. **Respetar los límites entre licencias**
    Apache 2.0 introduce algunas condiciones adicionales, como incluir un fichero NOTICE y la concesión de patentes.

    ✅ Me aseguré de que nada del código MIT chocara con ellas y mantuve la separación de licencias de forma explícita.

La clave es que la compatibilidad entre licencias no se reduce a "¿puedo usar esto?". La pregunta es "¿puedo usarlo **respetando las normas de la comunidad y con claridad legal?**". Bien hecho, la respuesta es que sí.

## El proceso de fusión

Con la base legal y ética resuelta, tocaba hacer la integración de verdad. No copiando y pegando, sino fusionando de una forma que preservara la autoría, el historial de commits y la intención.

Este es el proceso paso a paso que seguí:

### 🔁 1. Añadir el repositorio MIT como remote

```bash
git remote add upstream-mit https://github.com/example-user/example-mit-repo.git
git fetch upstream-mit main --no-tags
```

El flag `--no-tags` es importante: evita que los tags del proyecto original ensucien el historial de tags del tuyo.

### 🌿 2. Crear una rama de importación dedicada

```bash
git checkout -b import-mit
git merge --allow-unrelated-histories upstream-mit/main
```

Usar `--allow-unrelated-histories` le dice a Git que esto es una fusión de historiales deliberada entre dos proyectos distintos. Es especialmente importante porque:

- Mantiene la atribución del código con licencia MIT, de sus commits y de sus autores
- Preserva el historial de desarrollo completo de los dos proyectos
- Permite seguir la pista de dónde viene el código
- Ayuda a ser transparente sobre el origen del código

### ⚔️ 3. Resolver los conflictos del merge

Me encontré un conflicto en el fichero LICENSE: los dos proyectos tenían uno. Así lo resolví:

- 🟢 Mantuve la LICENSE de Apache 2.0 que ya estaba en la raíz.
- 🟦 Moví la licencia MIT a third_party/example-mit-repo/LICENSE, conservándola tal cual.
- 📁 Creé el directorio si no existía:

```bash
mkdir -p third_party/example-mit-repo
```

Así las dos licencias convivían con claridad, sin mezclarse ni pisarse.

### ✅ 4. Completar el merge con un mensaje de commit transparente

```text
Merge history of [example-mit-repo] (MIT licensed) into Apache 2.0 codebase  
Original project: https://github.com/example-user/example-mit-repo

The original code was licensed under the MIT License, and that license is preserved.  
The imported history helps preserve proper attribution to the original authors.
```

Este mensaje se queda en el log de Git como señal de intención, y de respeto.

## El fichero NOTICE

Bajo la licencia Apache 2.0, si tu proyecto incluye código de terceros que trae su propia licencia o sus propios requisitos de atribución, debes incluir un fichero `NOTICE`. La licencia MIT no lo exige, pero la sección 4(d) de Apache 2.0 sí.

Así que creé un fichero `NOTICE` en la raíz del proyecto para:

- 🧾 Reconocer el origen del código MIT importado
- 🔍 Apuntar a la licencia MIT conservada
- ✍️ Declarar que el código se había modificado
- 🤝 Cumplir los requisitos de aviso de Apache 2.0

Este es el formato exacto que usé:

```text
This NOTICE file is provided in compliance with section 4(d) of the Apache License, Version 2.0.

A useful SDK
Copyright (c) 2025-present Company Name

Based on the following third party software:

## example-mit-repo-1 (MIT License)
Source: https://github.com/example-user-a/example-mit-repo-1  
Author: Original contributors  
License: MIT (see third_party/example-mit-repo-1/LICENSE)

This code has been modified.

## example-mit-repo-2 (MIT License)
Source: https://github.com/example-user-b/example-mit-repo-2  
Author: Original contributors  
License: MIT (see third_party/example-mit-repo-2/LICENSE)

This code has been modified.
```

La última línea de cada software de terceros, _"This code has been modified"_, es importante. Demuestra que el código importado no se redistribuye tal cual y deja claro qué has cambiado.

El fichero `NOTICE` también sirve de punto de referencia para quienes mantengan y contribuyan al proyecto en el futuro. Dice sin rodeos que este código no apareció de la nada, y cómo se integró de forma responsable.

## Limpiar e integrar

Con el merge hecho y las licencias bien documentadas, pasé a la fase final: adaptar el código importado a la arquitectura y a las convenciones del proyecto principal.

Así lo hice, sin perder de vista la atribución ni la claridad legal:

### 🧹 Elimina lo que no necesites

Si el proyecto original con licencia MIT incluye herramientas, configuración de CI o ficheros de ejemplo que no piensas mantener, puedes borrarlos sin problema, siempre que conserves la licencia.

En mi caso:

- **Eliminé todo el código** de la importación original que no tenía relevancia para la estructura del SDK.
- **Conservé el fichero de licencia** en third_party/example-mit-repo/LICENSE.

### 🧰 Reestructura el código

En lugar de dejar el código MIT en un subdirectorio third_party/ (algo opcional y que suele reservarse para código vendorizado o externo), moví las partes útiles al esquema de mi proyecto.

Así el código quedó mantenible e idiomático para el SDK, y además:

- Se conserva el historial de commits (gracias a Git)
- Se respeta la licencia (gracias a LICENSE, NOTICE y README)

**Importante**: la permisividad de MIT significa que no necesitas dejar el código "tal cual" ni en su estructura original. Solo tienes que conservar la licencia, mantener la atribución y reconocer las modificaciones.

### 🧾 Dónde vive la licencia importa

Aunque el código se refactorizó, seguí haciendo tres cosas:

- Guardar la licencia MIT original en `third_party/example-mit-repo/LICENSE`
- Referenciar esa ubicación desde el fichero `NOTICE`
- Declarar las modificaciones tanto en el código como en la documentación

Este pequeño esfuerzo compensa: tu repositorio sigue siendo respetuoso con el OSS y preparado para el futuro, sobre todo si más adelante incorporas más código de terceros.

## Actualizar el README

El `README.md` principal suele ser el primer sitio donde mira un desarrollador para entender cómo usar un proyecto y para confiar en él. Por eso conviene incluir una sección de licencias clara y transparente, sobre todo cuando tu proyecto incorpora código de terceros bajo otra licencia.

Los detalles legales viven en tus ficheros `LICENSE` y `NOTICE`, pero el `README` debería comunicar:

- 🔍 La licencia principal de tu proyecto
- 🧩 Que incluye código de terceros bajo otras licencias permisivas
- ✍️ Que se han hecho modificaciones
- 📂 Dónde encontrar esas licencias

Esta es la sección de licencias que añadí:

```md
## Licensing

This project is licensed under the [Apache License 2.0](./LICENSE).

It includes portions of code derived from other open source projects which are licensed under the MIT License. Their original licenses are preserved [here](./third_party), and attribution is provided in the [NOTICE](./NOTICE) file.

Modifications have been made to this code as part of its integration into this project.
```

### ✅ Por qué funciona

- Es breve y clara
- Respeta a los autores originales
- Ayuda a quienes usan tu proyecto (personas y empresas) a entender el panorama de licencias de un vistazo

Aunque nadie abra los ficheros `NOTICE` o `LICENSE`, verán esto y entenderán que tu proyecto se toma las licencias en serio.

## El resultado

Con este proceso no me limité a copiar código: preservé un trozo de la historia del open source.

Por haberme tomado el tiempo de fusionar con responsabilidad, conseguí que:

- ✅ **Los autores originales** sigan figurando a través del historial de Git
- ✅ **La licencia MIT** se conserve y esté referenciada en el sitio adecuado
- ✅ **Las modificaciones** se declaren con transparencia
- ✅ **El código Apache 2.0** siga cumpliendo, claro y mantenible
- ✅ **Quienes contribuyan en el futuro** entiendan de dónde vienen las cosas y cómo seguir construyendo con cuidado

Esto no iba de marcar casillas legales. Iba de respeto: por las personas que escribieron el código, por las licencias que lo hicieron reutilizable y por la comunidad que mantiene en marcha el open source.

Seas mantenedor en solitario o formes parte de un esfuerzo OSS respaldado por una empresa, merece la pena ser deliberado al integrar código de terceros. Puede que el proceso sea más lento. Pero lo que sale de él es una base sobre la que construir con confianza y con orgullo.
