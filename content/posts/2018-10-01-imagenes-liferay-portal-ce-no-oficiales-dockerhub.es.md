---
title: "¡Imágenes no oficiales de Liferay Portal CE en DockerHub!"
date: 2018-10-01T09:16:43+02:00
description: "Publicamos cada día imágenes Docker públicas y no oficiales de Liferay Portal CE, construidas desde nuestra rama master, para que cualquiera pueda probarlas sin compilar nada."
categories: liferay
tags: [liferay, docker]
type: post
weight: 25
translationKey: liferay-docker-images
translatedFrom: 3eaa239
---

¡Hola, liferayers! Hemos creado imágenes Docker públicas y no oficiales de nuestra rama master, y las publicamos todos los días.

{{< figure src="/images/Ray_meet_Docker.png" alt="Ray adora a Moby" >}}

El motivo de publicarlas en un repositorio público no oficial es sencillo. Cualquier persona en el mundo puede descargar el código desde Github y compilar la plataforma. ¿Por qué no ponérselo fácil, ofreciendo una imagen Docker con ese proceso ya hecho? Llevamos meses haciéndolo y hemos aprendido mucho por el camino. Ahora estamos listos para hacerlas públicas.

¿Por qué no oficiales? Porque queremos publicar primero las imágenes de Liferay DXP, y más adelante en este post te explico por qué.

## ¿Dónde se publican las imágenes de Liferay Portal CE?

Si quieres usar esta imagen, utiliza este repositorio de Docker: [mdelapenya/liferay-portal-nightlies](https://hub.docker.com/r/mdelapenya/liferay-portal-nightlies/). Los tags siguen esta convención:

- `latest`, que se sobrescribe cada día.
- La fecha, en formato **yyyymmdd**, por ejemplo `20170901`. Se crea una versión nueva cada día.

## ¿Cómo es la estructura de la imagen?

Nuestras imágenes públicas funcionan con OpenJDK, en concreto con JDK 8u141. Para ello partimos de la imagen Docker que creó el equipo de OpenJDK, openjdk:8u141-jdk, que está basada en Debian Jessie.

Encima añadimos el resultado del proceso de build (hola, "ant all", viejo amigo): un bundle con la versión actual de Tomcat. Y por último exponemos el puerto 8080.

## ¿Qué hacemos con estas imágenes de Liferay Portal CE?

Usamos esta imagen para desplegar internamente proyectos de Liferay Portal CE en varios servidores, de modo que cualquier equipo de la empresa pueda utilizarla y trastear con el desarrollo actual del producto. Pero no solo las desplegamos: también hemos formado a los equipos para que las usen en local. Por ejemplo, si los equipos de UX y diseño necesitan comprobar un comportamiento en una versión, pueden arrancarla en su máquina y comparar funcionalidades entre versiones distintas.

## ¿Qué pasa con las imágenes de Liferay DXP?

Estamos trabajando en ellas. Hace tiempo que los clientes nos piden imágenes Docker y queremos atender esa petición. Además, clientes internos como [WeDeploy](https://wedeploy.com/), que usa su propia imagen Docker de Liferay DXP SP4, podrían llegar a consumirlas. Por eso publicamos primero las imágenes de Liferay Portal CE en mi cuenta personal en lugar de en la oficial. Cuando tengamos todo listo para las imágenes de Liferay DXP y de Liferay Portal CE, moveremos las de Liferay Portal CE al repositorio oficial. Esperamos que esto sirva tanto a nuestros clientes como a la comunidad, ofreciendo al final imágenes de ambos productos. :)

Y eso es todo :)

Como siempre, cuéntanos qué te parece. Esperamos que iniciativas como esta ayuden tanto a la empresa como a nuestra comunidad.

¡Un abrazo!
