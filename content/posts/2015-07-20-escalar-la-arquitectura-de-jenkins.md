---
title: Escalar la arquitectura de Jenkins
date: 2015-07-20T12:55:59+02:00
description: "Escalar la arquitectura de Jenkins"
categories: jenkins
tags: [jenkins, hardware]
type: post
weight: 25
showTableOfContents: true
---

*Toda esta información ha sido obtenida del paper técnico 'Jenkins Continuous Integration Cookbook' de CloudBees, el cual traduzco al castellano.*

# Introducción
Cuando una organización madura en cuanto a términos de entrega continua, los requisitos de su instalación de Jenkins crece de manera similar. Este crecimiento a menudo se refleja en la arquitectura del nodo maestro, pudiendo ser este crecimiento de un tipo 'vertical' u 'horizontal'.

 - **Crecimiento vertical**: cuando la carga de un nodo maestro es incrementada configurando más trabajos u orquestando ejecuciones de manera más frecuente. Esto podría significar que más equipos dependen de ese nodo maestro.

 - **Crecimiento horizontal**: es la creación de más nodos maestros dentro de la organización para acomodar nuevos equipos o proyectos, en lugar de añadirlos a un único maestro ya existente.

 Existen errores potenciales asociados con cada enfoque a la hora de escalar Jenkins, pero con una planificación cuidadosa, muchos de ellos puedes ser manejados o incluso evitados. Aquí hay algunas cosas a considerar a la hora de elegir una estrategia para escalar las instancias de Jenkins dentro de la organización.

 - **¿Tienes los recursos para correr un sistema ditribuido de ejecuciones?**: Si es posible, es recomendado configurar nodos de ejecución que corran separados del nodo maestro. Esto libera recursos del maestro para mejorar su rendimiento en cuanto a planificación de trabajos, y previene que éstos puedan potencialmente modificar cualquier dato sensible del directorio $JENKINS_HOME. Este enfoque permite a un nodo maestro escalar verticalmente mejor que si se ocupara de ejecutar y planificar al mismo tiempo.

 - **¿Tienes los recursos para mantener varios nodos maestros?**: Los nodos maestros de Jenkins requieren de actualizaciones de plugins de manera periódica, así como de actualizaciones del core dos veces al mes, y copias de seguridad de las configuraciones y del historial de ejecución de los trabajos. La configuración de seguridad y los roles tendrá que ser configurados manualmente en cada maestro. Además, cuando se cae alguno de estos nodos maestros, es necesario arrancarlos de forma manual, así como aquellos trabajos que fueron cancelados debido al fallo.

 - **¿Son críticos los proyectos de cada equipo?**: Puedes considerar separar los proyectos vitales a maestros separados para minimizar el impacto de la caída de alguno de ellos. También es importante que tengas en cuenta la conversión de cualquier pipeline de proyectos críticos a trabajos de tipo **Workflow**, que tienen la habilidad de sobrevivir a posibles interrupciones de la conexión entre maestros y esclavos.

 - **¿Cuánto de importante es el arranque de tu instacia de Jenkins?**: Cuantos más trabajos tenga configurado un nodo maestro más tiempo le cuesta a Jenkins cargar tras una actualización o un fallo. Por otro lado, el uso de carpetas o vistas para organizar los trabajos puede limitar el número de trabajos renderizados durante el arranque.

# Arquitectura de trabajos distribuidos
Un nodo maestro puede operar por sí mismo manejando tanto el entorno de ejecución como la ejecución de los trabajos con sus propios ejecutores y recursos. Si comienzas con esta configuración *"standalone"*, con seguridad te quedarás sin recursos cuando el número o la carga de proyectos aumente.

Para tener una infrastructura levantada y en marcha de esta manera necesitarás mejorar el nodo maestro (añadiendo memoria, el número de CPUs, etc.). Durante el tiempo que se tarda en mantener y actualizar la máquina física, el nodo maestro junto con todos los nodos de ejecución estarán caídos, los trabajos estarán parados y toda la infraestructura de Jenkins será inutilizable.

Escalar Jenkins en este escenario sería extremadamente penoso e introduciría muchos periodos de espera donde todos los recursos asignados al entorno de ejecución no se podrían utilizar.

Además, ejecutar trabajos en los ejecutores del nodo maestro introduce un problema de seguridad: el usuario *jenkins* que Jenkins utiliza para ejecutar los trabajos tendría todos los permisos sobre todos los recursos de Jenkins del maestro. Esto quiere decir que, con un simple script, un usuario malicioso puede tener acceso directo a información privada cuya integridad y privacidad no podría ser por ello garantizada.

Por todas estas razones Jenkins soporta el modo "maestro/esclavo", donde toda la carga de trabajo de los proyectos que se construyen es delegada a múltiples nodos esclavos.

{{< figure src="/images/master-slave-architecture.png" alt="Arquitectura Maestro/Esclavo" >}}

Un esclavo es una máquina preparada para quitar carga de trabajo al nodo maestro. EL método para planificar las ejecuciones depende de la configuración dada a un proyecto concreto: unos podrían configurarse para utilizar un nodo esclavo específico mientras otros pueden elegir libremente los esclavos en los que ejecutarse de entre el pool de esclavos asignados al maestro.

En un entorno de trabajos distribuidos, el nodo maestro de Jenkins utilizará sus recursos para únicamente manejar peticiones HTTP y controlar el entorno de ejecución. La ejecución real de los trabajos será delegada a los esclavos. Con esta configuración es posible escalar horizontalmente la arquitectura, lo que permite a una única instalación de Jenkins el alojar un gran número de proyectos y entornos de ejecución.

## Protocolos de comunicación Maestro/Esclavo
Para que una máquina sea reconocida como esclavo, necesita correr un programa agente específico que establece una comunicación bi-direccional con el nodo maestro.

Existen varias formas de establecer esta conexión:

- **Conector SSH**: configurar un esclavo para usar el conector SSH es la forma preferida y más estable de establecer la conexión entre el maestro y el esclavo. Jenkins incluye una implementación de un cliente SSH, lo que significa que el Jenkins maestro puede fácilmente comunicarse con cualquier máquina con servidor SSHD instalado. Los únicos requisitos son que la clave pública de el maestro sea parte del conjunto de las claves autorizadas de los esclavos. Una vez definidos la máquina host y la clave SSH a utilizar (en la página de la configuración Administrar Nodos > Añadir Nuevo Nodo), Jenkins administrará la comunicación automáticamente instalando los binarios del programa agente, parando y arrancando el programa esclavo según necesite.

- **Conector JNLP-TCP**: En este caso, la comunicación es establecida iniciando el agente esclavo a través de JNLP (Java Web Start). Con este conector el programa Java Web Start debe ser iniciado en la máquina esclava de 2 maneras diferentes:
  - De forma manual, navegando a la URL del maestro en un navegador del esclavo. Una vez el icono de Java Web Start es pulasdo, el agente esclavo será ejecutado en la máquina esclava. La parte negativa de este enfoque es que los nodos esclavos no pueden ser administrador de forma centralizada por el nodo maestro, y cada ciclo arranque/parada/actualización del agente esclavo necesita ejecutarse manualmente en las máquinas esclavas con versiones de Jenkins inferiores a la 1.611. Este enfoque es conveniente cuando el maestro no puede instanciar una conexión con el cliente (por ejemplo, a través de un firewall).
  - Como un servicio, el cual permite el reinicio automático. Primero es necesario lanzar de forma manual el esclavo siguiendo el método anterior. Después de ello, *jenkins-slave.exe* y *jenkins-slave.xml* serán creados en el directorio de trabajo del nodo esclavo. Entonces será necesario ejecutar por línea de comandos lo siguiente, donde **<serviceKey>** es el nombre de la clave de registro para definir el servicio y **<service display name>** es la etiqueta que identificará el servicio en la interfaz de Administración de Servicios. Para asegurar que los reinicios son automáticos, será necesario descargar un JAR esclavo más nuevo que la versión v2.37 y copiarlo a una ruta permanente en la máquina esclava. Este *slave.jar* puede ser descargado de **http://<tu-jenkins-host>/jnlpJars/slave.jar**. Si utilizas una versión de Jenkins superior a la 1.559, el *slave.jar* se mantendrá actualizado cada vez que el esclavo se conecte al maestro.

{{< highlight bash >}}
sc.exe create "<serviceKey>" start= auto binPath= "<Ruta al jenkins-slave.exe>" DisplayName=
{{< /highlight >}}

  - **Conector JNLP-HTTP**: este enfoque es muy similar al de JNLP-TCP, con la diferencia que en este caso el agente esclavo es ejecutado en modo *headless* y la conexión puede tunelarse por HTTP(s). Este enfoque es conveniente para ser ejecutado como demonio en máquinas Unix.

  - **Script personalizado**: también es posible crear un script propio que inicialice las comunicación entre el maestro y el esclavo si las soluciones anteriores no proporcionan la suficiente flexibilidad para un caso de uso muy específico. El único requisito es que el script ejecute el programa java *'java -jar slave.jar'* en el esclavo.

La configuración de esclavos Windows podrían utilizar tanto el estándar SSH como el enfoque JNLP, o utilizar otro enfoque más específico de Windows. Los nodos esclavos Windows tienen las siguientes opciones:

  - Conector SSH con Putty
  - Conector SSH con Cygwin y OpenSSH, que es la forma más fácil y recomendada. [SSH y Cygwin](http://wiki.jenkins-ci.org/display/JENKINS/SSH+slaves+and+Cygwin)
  - Instalaciones de administración remota (WMI + DCOM): con este enfoque, el cual utiliza un plugin específico [Plugins de Esclavos Windows](http://wiki.jenkins-ci.org/display/JENKINS/Windows+Slaves+Plugin), el maestro registrará el agente esclavo en la máquina esclava creando un servicio de Windows. El maestro podrá controlar los esclavos, incluyendo parar, reiniciar o actualizarlo. Sin embargo, este enfoque es difícil de configurar y no es recomendado.
  - Conector JNLP: Con este enfoque [Jenkins como Servicio de Windows](http://wiki.jenkins-ci.org/display/JENKINS/Installing+Jenkins+as+a+Windows+service) es posible registrar manualmente el esclavo como un servicio de Windows, pero no será posible administrarlo de forma centralizada desde el maestro. Cada parada/arranque/actualización del agente esclavo necesita ser ejecutado manualmente en la máquina esclava, a menos que se esté utilizando una versión de Jenkins igual o superior a la 1.611.

# Creando esclavos fungibles

## Configurando las herramientas en los esclavos
La página de configuración Global de Jenkins te permite especificar las herramientas necesarias durante las ejecuciones de los trabajos: Ant, Maven, Java, etc.

Cuando defines una herramienta, es posible crear un puntero a una instalación existente dando el directorio donde el programa se espera se encuentre en la máquina esclava. Otra opción es dejar que Jenkins se responsabilice de la instalación de una versión específica en la ruta indicada. También es posible especificar más de una instalación para la misma herramienta pues diferentes trabajos pueden necesitar diferentes versiones de la misma herramienta.

La opción predefinida como *Default* invoca la herramienta que ya se encuentre configurada en el esclavo y exista en la variable *PATH* del sistema de la máquina, pero ésto siempre resultará en un fallo si la herramienta no estuviera instalada y/o no estuviese añadida en el *PATH*.

> Una buena práctica para evitar este fallo es configurar un trabajo asumiendo que el esclavo objetivo no tiene las herramientas necesarias instaladas, e incluir la instalación de las mismas como parte de la ejecución del trabajo.

## Definir una política para compartir máquinas esclavas

Como decíamos anteriormente, las máquinas esclavas deberían ser totalmente intercambiables, así como estar estandarizadas para hacerlas *compartibles* y así optimizar el uso de recursos. Por ello, los nodos esclavos no deberían estar personalizados para un conjunto particular de trabajos, o para un equipo en particular. La recomendación de CloudBees es siempre hacer esclavos lo suficientemente generales para ser compartidos entre los trabajos y los equipos, aunque existen algunas excepciones.

Últimamente Jenkins se ha vuelto más y más popular, no sólo para Integración Continua, sino también para Entrega Continua, lo que significa que debe orquestar trabajos y pipelines que involucran a diferentes equipos con diferentes perfiles técnicos: desarrolladores, ingenieros de QA, DevOps, etc.

En dicho escenario, puede tener sentido crear esclavos dedicados y/o personalizados, en los cuales diferentes equipos pueden requerir diferentes herramientas (p.e. Puppet/Chef para equipos relacionados con las Operaciones), o incluso almacenar las credenciales de dichos equipos en su nodo esclavo, de modo que se asegure su protección y privacidad.

Para asegurar la ejecución de un trabajo en un único nodo esclavo, o incluso en un único conjunto de nodos (p.e. proyectos iOS que se construyen sólo en esclavos OSX), es posible fijar el trabajo al nodo esclavo especificando la etiqueta del esclavo en la página de configuración del trabajo. Este proceso de fijación debe ser replicado para cada trabajo en particular, y no asegura que el esclavo sea utilizado por otros trabajos/equipos.

## Configurando nodos esclavos en la nube
Utilizar nodos de ejecución en la nube puede ser una solución para el caso de necesitar mantener un razonablemente pequeño clúster local de nodos esclavos, a la vez que se proporcionan nuevos recursos a los trabajos cuando sea necesario.

En particular, es posible liberar la carga de los trabajos moviéndolos a esclavos en la nube gracias a plugins específicos que manejarán la creación de esos recursos en la nube junto con su destrucción cuando no sean necesarios:

- El [plugin de EC2](https://wiki.jenkins-ci.org/display/JENKINS/Amazon+EC2+Plugin) permite a Jenkins utilizar instancias en AWS EC2 como recursos en la nube cuando se queda sin nodos en local. Los nodos EC2 serán creados dinámicamente dentro de una red de AWS y serán eliminados cuando no sean necesarios.

- El [plugin de JCloud](https://wiki.jenkins-ci.org/display/JENKINS/JClouds+Plugin) añade la posibilidad de ejecutar trabajos en cualquier proveedor de cloud soportado por las librerías de JCloud.

- El [plugin del conector de Cloud de CloudBees](https://wiki.jenkins-ci.org/display/JENKINS/CloudBees+Cloud+Connector+Plugin) hace posible el aprovechamiento de la subscripción al servicio de Jenkins de CloudBees, DEV@Cloud, para expandir las capacidades de construcción de una instalación local de Jenkins. El plugin permite a las instancias enviar algunos trabajos al clúster manejado por CloudBees, que son nodos esclavos Linux ejecutando en el servicio DEV@cloud.
