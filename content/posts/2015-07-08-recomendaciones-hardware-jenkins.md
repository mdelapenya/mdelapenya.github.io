---
title: Recomendaciones hardware para Jenkins
date: 2015-07-08T06:50:43+02:00
description: "Recomendaciones hardware para Jenkins"
categories: jenkins
tags: [jenkins, hardware]
type: post
weight: 25
showTableOfContents: true
---

*Toda esta información ha sido obtenida del paper técnico 'Jenkins Continuous Integration Cookbook' de CloudBees, el cual traduzco al castellano.*

# Introducción
El tamaño de una instalación de Jenkins depende de muchos factores, lo que constituye una ciencia completamente inexacta. Conseguir una configuración óptima requiere experiencia, pero es posible hacer una aproximación inteligente al empezar, en especial al diseñar teniendo presentes las mejores prácticas con Jenkins.

Esta entrada de blog intentará resaltar esos factores y cómo puedes tenerlos en cuenta al dimensionar tu configuración. Mostrará además algunas configuraciones de ejemplo y el hardware tras alguna de las instalaciones de Jenkins más grandes, presentadas en el Jenkins Scalability Summit.

# Eligiendo el hardware adecuado para los nodos maestros
Uno de los retos más grandes al configurar por primera vez una instancia de Jenkins de forma adecuada es el hecho de que no existe un tamaño que se adapte a todos los casos de uso. La especificación exacta de hardware que necesitarás estará muy estrechamente ligada a las necesidades presentes y futuras de tu organización.

El nodo maestro de Jenkins servirá peticiones HTTP y almacenará toda la información de tu instancia de Jenkins en su directorio $JENKINS_HOME: configuraciones, históricos de ejecuciones, plugins instalados, etc.). Es importante tener en cuenta además que aquellos nodos maestros que se ejecuten en alta disponibilidad usando el plugin de CloudBees "High Availability plugin" tendrán que instalar el directorio $JENKINS_HOME en un servidor de datos de la red, el cual será accesible a los servidores de Jenkins por NFS o algún otro protocolo de compatición de archivos.

> *Para más información sobre dimensionar nodos maestro basándose en necesidades organizacionales, por favor consulta 'Architecting for Scale' [http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_right_sizing_jenkins_masters.html#_calculating_how_many_jobs_masters_and_executors_are_needed](http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_right_sizing_jenkins_masters.html#_calculating_how_many_jobs_masters_and_executors_are_needed)*

## Requisitos de memoria para los nodos maestros
La cantidad de memoria que necesita Jenkins puede depender de muchos factores, por lo que la RAM asignada para el proceso puede variar desde los 200MB para una instalación pequeña, hasta más de 70GB para un único maestro. Sin embargo, deberñias ser capaz de estimar la RAM requerida basándote en las ejecuciones necesarias para tu proyecto.

Cada conexión de una ejecución en un nodo utilizará de 2 a 3 hilos, que equivale a unos 2MB o más de memoria. Además, necesitarás dimensionar la carga de CPU para Jenkins si hay muchos usuarios accediendo a la interfaz de usuario.

En general, es una mala práctica el asignar ejecutores en un nodo maestro, pues las ejecuciones podrían sobrecargar la memoria o la CPU del nodo maestro y tirar la instancia de forma innecesaria. En su lgar, es muy recomendable configurar nodos esclavos (slaves) en los que el nodo maestro puede delegar ejecución de trabajos. De esta manera la mayor carga de trabajo se realiza fuera del propio nodo maestro.

# Eligiendo las máquinas esclavas adecuadas
El corazón de Jenkins en su habilidad para orquestar ejecuciones, pero aquellas instalaciones que no hace uso de la arquitectura de ejeuciciones distribuida de Jenkins están limitando de forma artificial el número de ejecuciones que sus nodos maestros pueden orquestar.

> *Más información sobre los beneficios de una arquictura distribuida puede ser encontrada aquí: [http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_architecting_for_scale.html#_distributed_builds_architecture](http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/
_architecting_for_scale.html#_distributed_builds_architecture)*

## Requisitos de una máquina para ser utilizada como nodo esclavo

Las máquinas slaves típicamente son máquinas x86 genéricas, con suficiente memoria para ejecutar específicos proyectos. Su configuración depende de los proyectos a construir así como de las herramientas para ello.

Configurar una máquina para convertirla en un slave de tu infraestructura puede ser una tarea tediosa que lleve mucho tiempo. Esto es completamente cierto cuando la misma configuración tiene que ser replicada en un conjunto grande de slaves. Por ello, aparece el concepto de slave 'fungible', que no es más que un slave que s fácilmente reemplazable. Los slaves deberían ser genéricos para todos las ejecuciones en lugar de personalizados para un trabajo o trabajos específicos. Mientras más genéricos sean los slaves, más fácilmente serán intercambiados, lo cual se traduce en un mejor uso de los recursos y un menor impacto en la productividad si algún slave sufre un problema.

> Andrew Bayer introdujo este concepto de *'fungibilidad'* aplicada a slaves en su presentación 'Los 7 hábitos de los usuarios de Jenkins altamente efectivos (*“Seven Habits of Highly
Effective Jenkins Users”*), durante la Jenkins User Conference de Europa en 2014. Puedes consultarla aquí: [http://www.slideshare.net/andrewbayer/seven-habits-of-highly-effective-jenkins-users-2014-edition](http://www.slideshare.net/andrewbayer/seven-habits-of-highly-effective-jenkins-users-2014-edition)

Cuanto más automatizada esté la configuración del entorno, más fácil es replicar una configuración en una nueva máquina slave. Herramientas para la gestión de la configuración o imágenes preconfiguradas pueden ser excelentes soluciones para este fin. Contenedores y virtualización son también populares para crear slaves genéricos.

> Más información sobre estimar el número de ejecutores necesarios en un entorno dado puede ser encontrada en la sección "Diseñando la arquitectura para el escalado" [http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/_architecting_for_scale.html](http://jenkins-cookbook.cloudbees.com/docs/jenkins-cookbook/_architecting_for_scale.html)

# Casos de uso publicados on-line

## Netflix
En el Scalability Summit, Gareth Bowles (Senior Build/Tool Engineer en Netflix) explicó cómo Netflix crearon su instalación, incluyendo los problemas que encontraron.

En 2012, Netflix tenía la siguiente configuración:

- 1 master
  - 700 ingenieros en un único master
- Esclavos elásticos en Amazon EC2 + 40 esclavos ad-hoc en el data center de Netflix
- 1,600 trabajos
  - 2,000 ejecuciones al día
  - 2 TB de información de los trabajos
  - 15% de ejecuciones fallidas
- Configuración del Hardware
  - 2x quad core x86_64 para el maestro
  - 26G de RAM
  - máquinas esclavas m1.xlarge en AWS

En 2013, Netflix dividió el monolíto que tenían como máster e incrementó significativamente el número de trabajo y ejecuciones:

- 6 masters
  - 700 en cada máster
- 100 esclavos
  - 250 ejecutores, con 4 ejecutores por esclavo de media
- 3,200 trabajos
  - 3 TB de información de los trabajos
  - 15% de ejecuciones fallidas

## Yahoo
Mujibur Wahab, de Yahoo, también presentó en el Scalability Summit la gigantesca instalación que tenían en el 2013:

- 1 máster primario
  - 1.000 ingenieros dependiendo de esta instancia de Jenkins
  - 3 másters como backup
  - $JENKINS_HOME alojado en NetApp
- 50 esclavos en 3 data centers
  - 400+ ejecutores
- 13,000 trabajos
  - 8,000 ejecuciones/day
  - 20% de tasa de fallo en las ejecuciones
  - 2 millones de ejecuciones al año, con un objetivo de hacer 1 millón por trimestre.
- Configuración del Hardware
  - 2 x Xeon E5645 2.40GHz, 4.80GT QPI (HT enabled, 12 cores, 24 threads)
  - 96G RAM
  - 1.2TB capacidad de disco
  - 48GB max heap de la JVM
  - 20TB Filer volume para almacenar los datos de las ejecuciones y los trabajos
  - Este volumen almacena 6TB de datos sobre ejecuciones.
