---
title: Patrones de Diseño en la JDK
date: 2016-02-21T13:50:43+02:00
description: "Patrones de Diseño en la JDK"
categories: java
tags: [design patterns, jdk, jvm, patterns, software patterns]
type: post
weight: 25
showTableOfContents: true
---

# Introducción

El presente documento pretende enumerar los diferentes patrones de diseño más habituales en las diferentes fases del desarrollo de software, creacionales, estructurales, y de comportamiento, aplicados sobre las clases de la máquina virtual de Java, en su versión del JDK Java 7.0.60.

# Objetivo

El objetivo principal de este documento es la toma de contacto con la Plataforma del lenguaje de programación Java, sus diferentes elementos, y los patrones de diseño utilizados en la creación de la Plataforma.

Para ello, en este documento se presentará la Plataforma Java enumerando todos sus componentes, para así disponer de una información general de cada elemento.

A continuación, se enumeran los principales patrones de diseño de software: creacionales, estructurales, y de comportamiento, listando en cada uno de ellos aquellos ejemplos encontrados en la Plataforma Java que se adhieren a cada patrón.

Es preciso indicar que la Plataforma Java analizada en este documento es la implementación correspondiente a Oracle, que en 2010 adquirió a la compañía Sun Microsystems, propietaria hasta entonces de la Plataforma Java.

# La Plataforma Java

Oracle tiene dos productos que implementan la *Java Platform Standard Edition* (Java SE) 7: *Java SE Development Kit* (**JDK**) 7 y *Java SE Runtime Environment* (**JRE**) 7.

JDK 7 es un superconjunto de JRE 7, por tanto contiene todo lo que está en JRE 7, más herramientas tales como los compiladores y *depuradores* necesarios para desarrollar y aplicaciones.

JRE 7 por otro lado proporciona las librerías, la Máquina Virtual de Java, o *Java Virtual Machine* (**JVM**), y otros componentes para ejecutar aplicaciones escritas en el lenguaje de programación Java.

El siguiente diagrama conceptual ilustra los componentes de los productos Java SE de Oracle:

![Componentes de Oracle Java SE](../../images/jvm_diagram.png)

El diagrama conceptual categoriza las tecnologías de componentes Java en niveles. La lista siguiente enumera dichos niveles, de arriba a abajo, y las tecnologías que son parte de cada uno. Las tecnologías que forman parte de un nivel inferior sirven como base (*foundation*) para aquéllos que son parte de un nivel superior.

**Java Language**
**Tools & Tool APIs**
{{< highlight java >}}
java
javac
javadoc
jar
javap
JPDA
JConsole
Java VisualVM
Java Mission Control
Java Flight Recorder
Java DB
Int'l
JVM TI
IDL
Deploy
Security
Troubleshoot
Scripting
Web Services
RMI
{{< / highlight >}}
**Deployment**
{{< highlight java >}}
Java Web Start
Applet / Java Plug-in
{{< / highlight >}}
**User Interface Toolkits**
{{< highlight java >}}
JavaFX
AWT
Swing
Java 2D
Accessibility
Drag and Drop
Input Methods
Image I/O
Print Service
Sound
{{< / highlight >}}
**Integration Libraries**
{{< highlight java >}}
IDL
JDBC
JNDI
RMI
RMI-IIOP
Scripting
{{< / highlight >}}
**Other Base Libraries**
{{< highlight java >}}
Beans
Int'l Support
Input/Output
JMX
JNI
Math
Networking
Override Mechanism
Security
Serialization
Extension Mechanism
XML JAXP
{{< / highlight >}}
**lang and util Base Libraries**
{{< highlight java >}}
lang and util
Collections
Concurrency Utilities
JAR
Logging
Management
Preferences API
Ref Objects
Reflection
Regular Expressions
Versioning
Zip
Instrumentation
{{< / highlight >}}
**Java Virtual Machine**
{{< highlight java >}}
Java HotSpot VM
{{< / highlight >}}

La JDK consiste en todos los niveles anteriores.

El JRE consiste en los siguientes niveles:

**Deployment**

**User Interface Toolkits**

**Integration Libraries**

**Other Base Libraries**

**lang and util Base Libraries**

**Java Virtual Machine**

El API de Java SE consiste en los siguientes niveles:

**User Interface Toolkits except JavaFX**

**Integration Libraries**

**Other Base Libraries**

**lang and util Base Libraries**

Veamos a continuación los diferentes elementos de la Plataforma para tener una visión de conjunto de la misma.

## JRE y JDK

Oracle proporciona dos productos software principales dentro de la familia de la *Java Platform Standard Edition* (Java SE) 7:

### Java SE Runtime Environment (JRE)

El JRE proporciona las librerías, la máquina virtual, y otros componentes para ejecutar aplicaciones escritas en el lenguaje de programación Java. Este entorno de ejecución puede ser redistribuido junto con las aplicaciones para hacerlas independientes al entorno de ejecución.

### Java SE Development Kit (JDK)

La JDK incluye el JRE así como herramientas de desarrollo de línea de comandos, tales como compiladores y *depuradores* que son necesarios o útiles para desarrollar aplicaciones.

## El lenguaje de programación Java

Es un lenguaje de propósito general concurrente, fuertemente tipado, basado en clases y orientado a objetos. Normalmente es compilado a un conjunto de instrucciones de bytecode y un formato binario definido por la especificación de la JVM.

## Máquinas Virtuales Java (JVM’s)

La JVM es una máquina de computación abstracta que tiene un conjunto de instrucciones y manipula la memoria en tiempo de ejecución (*runtime*). La JVM está portada a diferentes plataformas para proporcionar independencia tanto a nivel de hardware como a nivel de sistema operativo.

La Plataforma Java SE proporciona dos implementaciones de la JVM:

### Java HotSpot Client VM

La máquina virtual (**VM**) cliente es una implementación para plataformas típicamente utilizadas por aplicaciones clientes. La VM cliente está afinada para reducir el tiempo de inicialización así como su consumo de memoria. Puede ser invocada mediante la opción de línea de comandos *-client* cuando se ejecuta la aplicación.

### Java HotSpot Server VM

La VM de servidor es una implementación diseñada para la máxima velocidad de ejecución de programas, equilibrando el tiempo de arranque con la memoria consumida. Puede ser invocada mediante la opción de línea de comandos *-server* al ejecutar la aplicación.

## Librerías Base

Aquí aparecen las clases e interfaces que proporcionan las características básicas y las funcionalidades fundamentales de la Plataforma.

## Lang y paquetes Util

Proporcionan las clases fundamentales *Object* y *Class*, clases envoltura para los tipos primitivos, una clase básica para matemáticas, entre otras.

### Math

La funcionalidad del paquete *Math* incluye librerías de cálculo en punto flotante, así como de precisión arbitraria.

### Monitoring y Management

Se incluye monitorización exhaustiva y soporte de gestión para la Plataforma Java, incluyendo el API de *Monitoring* y *Management* para la JVM, el API de *Monitoring* y *Management* para las herramientas de *Logging*, *jconsole* y otras herramientas de monitorización, Extensiones de Gestión de Java (*Java Management Extensions - JMX*), y extensiones de Oracle de la Plataforma.

### Identificación de versionado de paquetes

La funcionalidad de versionado de paquete facilita el control de versiones a nivel de paquete de modo que las aplicaciones puedan identificar en tiempo de ejecución la versión del JRE, la VM y el paquete de la clase.

### Referencias a Objetos

Las referencias a objetos soportan un limitado grado de interacción con el recolector de basura (*Garbage Collector* - GC). Un programa puede utilizar una referencia a un objeto para mantener una referencia a algún otro objeto en tal manera que el último objeto pueda ser reclamado por el recolector. Un programa puede además buscar ser notificado un tiempo después que el recolector haya determinado que la alcanzabilidad de un objeto dado haya cambiado.

Las referencias a objetos son por tanto útiles para construir cachés simples, así como cachés que son limpiadas cuando la memoria se vuelve lenta; para implementar mapeos que no previenen que sus claves o valores sean reclamados; y para acciones de limpieza planificadas *pre-mortem* de una manera más flexible que los mecanismos tradicionales de finalización de Java.

### Reflexión

*Reflection* habilita que el código Java pueda descubrir información sobre los atributos, métodos y constructores de las clases cargadas, así como utilizar dichos atributos, métodos y constructores reflejados para operar en sus objetos contrapartida, dentro de restricciones de seguridad. El API ayuda a las aplicaciones que necesitan acceso a los miembros públicos de un objeto objetivo (basado en su clase en *runtime*), o a los miembros declarados por una clase dada. Por otro lado, los programas pueden suprimir este acceso reflectivo.

### Framework de Collections

Una colección es un objeto que representa un grupo de objetos. El framework de colecciones supone una arquitectura unificada para representar colecciones, permitiéndoles ser manipuladas de una manera independiente a los detalles de su representación. Reduce por tanto los esfuerzos de programación a la vez que aumenta el rendimiento. Permite la interoperatividad entre APIs no relacionadas, reduce el esfuerzo en el diseño y aprendizaje de nuevas APIs, y refuerza la reutilización del software.

### Utilidades de Concurrencia

Los paquetes de utilidades de concurrencia proporcionan un framework potente y extensible de utilidades de hilos de alto rendimiento, tales como *pooles* de hilos y colas bloqueantes. Este paquete libera al programador de la necesidad de escribir estas utilidades a mano, del mismo modo que el framework de *Collections* lo hace para estructuras de datos. Adicionalmente, estos paquetes proporcionan primitivas de bajo nivel para programación concurrente avanzada.

### Archivos Java (Java Archive - JAR)

JAR es un formato de fichero independiente de la plataforma que agrega muchos ficheros en uno. En un fichero JAR pueden empaquetarse múltiples aplicaciones Java junto con sus componentes necesarios: archivos .class, imágenes, sonidos, ficheros de propiedades, etc. Además, pueden ser descargados en un navegador en una única transacción HTTP, mejorando notablemente la velocidad de descarga.

El formato JAR soporta además compresión, reduciendo el tamaño del fichero e igualmente la velocidad de descarga. Además, el autor de la aplicación puede firmar digitalmente las entradas de un fichero JAR para autenticar su origen.

### Logging

Los APIs de *Logging* facilita la puesta en servicio y el mantenimiento del software en el cliente, mediante la producción de informes de log adecuados para el análisis realizado por usuarios finales, administradores de sistemas, ingenieros de campo y equipos de desarrollo de software. Los APIs de *Logging* capturan información tal como fallos de seguridad, errores de configuración, cuellos de botella en rendimiento, y/o errores en la aplicación o en la Plataforma.

### Preferencias

El API *Preferences* proporciona una manera para que las aplicaciones almacenen y obtengan preferencias tanto del usuario como del sistema, así como datos de configuración. Los datos son almacenados de manera persistente en un almacén de datos dependiente de la implementación. Existen dos árboles diferentes de nodos de preferencias, uno para las preferencias de usuario y otro para las preferencias de sistema.

## Otros paquetes Base

### I/O

Los paquetes *java.io* y *java.nio* proporcionan un conjunto rico de APIs para manejar la Entrada/Salida (I/O) de una aplicación. Su funcionalidad incluye tanto I/O de ficheros como de dispositivos, serialización de objetos, gestión de *buffers*, y soporte a juegos de caracteres. Adicionalmente, los APIs soportan características para servidores escalables incluyendo I/O multiplexada y no bloqueante, mapeos de memoria, y bloqueos para ficheros.

### Serialización de Objetos

La serialización de objetos extiende el core de la clases Java de I/O para objetos, soportando tanto la codificación de objetos y los objetos alcanzados por ellos en un flujo/chorro de bytes, como la reconstrucción del grafo representando al objeto desde el flujo/chorro de bytes.

La serialización es utilizada para persistencia ligera y para comunicación a través de *sockets* o RMI (*Remote Method Invocation*).

### Networking

Proporciona clases para funcionalidades de redes, incluyendo el direccionamiento, manejo de URL’s y URI’s, conexión a servidores mediante *sockets*, seguridad en las redes, entre otras.

### Seguridad

Ofrece APIs relacionadas con funcionalidades de seguridad, tales como un control de acceso configurable, autenticación y autorización, criptografía, comunicaciones seguras sobre Internet, entre otras.

### Internacionalización

Son APIs que facilitan el desarrollo de aplicaciones internacionalizadas. La Internacionalización (**_i18n_**) es el proceso de diseñar una aplicación que puede ser adaptada a varios idiomas y regiones sin cambios de ingeniería.

### API de componentes JavaBeans™

Contiene clases relacionadas con el desarrollo de *beans* -componentes basados en la arquitectura *JavaBeans™* que pueden ser compuestos juntos como parte del desarrollo de una aplicación.

### Extensiones de Gestión de Java (Java Management Extensions, JMX)

El API **JMX** es un API estándar para la gestión y monitorización de recursos tales como aplicaciones, dispositivos, servicios, y la JVM. Típicamente incluye consultas a la configuración de la aplicación, así como permite cambios sobre ellas. Permite además acumular estadísticas sobre el comportamiento de la aplicación, y notifica de los cambios de estado y condiciones erróneas. El API JMX incluye acceso remote, de modo que un programa de gestión remota pueda interactuar con una aplicación en ejecución para los citados propósitos.

### XML (JAXP)

La Plataforma Java proporciona un conjunto rico de APIs para el procesado de documentos y datos XML.

### Interfaz Nativa Java (Java Native Interface, JNI)

**JNI** es una interfaz de programación estándar para escribir métodos nativos Java y embeber la JVM dentro de aplicaciones nativas. Su objetivo primario es la compatibilidad binaria de librerías nativas de métodos en todas las implementaciones de la JVM para una plataforma dada.

### Mecanismo de Extensión

Existen paquetes *Optional* que son clases Java (y cualquier otro código nativo asociado) que los desarrolladores de aplicaciones puede usar para extender la funcionalidad del core de la Plataforma. Este mecanismo de extensión permite a la JVM utilizar las clases de esa extensión opcional de la misma manera que usaría las clases de la Plataforma Java. Además, el mecanismo proporciona una manera de que los paquetes opcionales necesarios sean recuperados desde URL’s especificadas cuando no están previamente instaladas en la JDK o en el JRE.

### Mecanismo de sobrescritura de estándares endosados

Un estándar endosado (*endorsed* standard) es un API Java definido a través de un proceso de estándares diferente al de JCP (*Java Community Process SM*). Puesto que estos estándares endosados están definidos fuera de JCP, se anticipa que tales estándares pueden ser revisados entre diferentes versiones de la Plataforma Java. Para aprovecharse de las nuevas revisiones de esos estándares endosados, los desarrolladores y fabricantes de software deben utilizar este mecanismo para proporcionar versiones de un estándar endosado más nuevas que aquellas incluidas en la Plataforma Java tal y como se liberó por Oracle.

## Librerías de Integración

### API Java de conectividad con Bases de Datos (Java Database Connectivity, JDBC)

El API **JDBC™** proporciona acceso a datos de manera universal para el lenguaje de programación Java. Utilizando el API JDBC 3.0, los desarrolladores pueden escribir aplicaciones que puede acceder virtualmente a cualquier fuente de datos, desde bases de datos relacionales a hojas de cálculo, pasando por ficheros de texto planos. La tecnología JDBC proporciona una base común en la que herramientas e interfaces pueden construirse.

### Invocación Remota de métodos (Remote Method Invocation, RMI)

**RMI** habilita el desarrollo de aplicaciones distribuidas proporcionando comunicación remota entre programas escritos ambos en el lenguaje Java. RMI permite a un objeto ejecutándose en una JVM invocar métodos sobre otro objeto que se ejecuta en otra JVM, que puede estar incluso en otra máquina distinta.

### Java IDL (CORBA)

La tecnología Java IDL añade capacidades **CORBA** (*Common Object Request Broker Architecture*) a la Plataforma Java, proporcionando interoperatividad y conectividad basados en estándares. Java IDL habilita a las aplicaciones Web Java la invocación de una manera transparente de operaciones sobre servicios en redes remotas utilizando los estándares IDL (*Object Management Group Interface Definition Language*) e IIOP (*Internet Inter-ORB Protocol*), definidos por el *Object Management Group* (OMG). El componentes de tiempo de ejecución incluyen un ORB Java para computación distribuida utilizando comunicación IIOP.

### Remote Method Invocation sobre Internet Inter-ORB Protocol, RMI-IIOP

El modelo de programación de RMI habilita la programación de aplicaciones y servidores CORBA a través del API RMI. Podría elegirse trabajar completamente dentro el lenguaje de programación Java utilizando JRMP (*Java Remote Method Protocol*) como transporte, o trabajar con otros lenguajes de programación compatibles con CORBA utilizando IIOP. Por ejemplo, se utiliza el compilador *rmic* para generar el código necesario para conectar una aplicación a través IIOP con otras aplicaciones escritas en cualquier lenguaje compatible con CORBA. Para trabajar con aplicaciones CORBA en otros lenguajes, IDL puede ser generado desde interfaces del lenguaje de programación Java utilizando el compilador *rmic* con la opción *-idl*. Para generar IIOP *stubs* y enlazar las clases, se puede utilizar la opción *-iiop*.

### Scripting para la Plataforma Java

Java SE 6 incluye la especificación JSR 223: *Scripting for the Java™ Platform* API. Éste es un framework por el que las aplicaciones Java pueden alojar motores de scripts. La implementación de Oracle de Java SE 6 incluye un motor de ejemplo basado en *Mozilla Rhino*. El framework también soporta motores de terceros a través de un mecanismo de descubrimiento de servicios empaquetados en ficheros JAR. Es posible además añadir cualquier motor de scripts que cumpla JSR-223 al CLASSPATH y acceder a él de la misma manera que desde las aplicaciones Java convencionales.

### Interfaz de Directorio y Nombrado de Java (Java Naming and Directory Interface™, JNDI)

El API **JNDI** proporciona funcionalidad de directorio y nombrado para aplicaciones escritas en el lenguaje de programación Java, y está diseñado para ser independiente de cualquier implementación del servicio de directorio o de nombrado. Por ello, una gran variedad de servicios, nuevos, emergentes, y los ya desplegados, pueden ser accedidos de esta manera común. La arquitectura JNDI consiste en un API y en un SPI (*Service Provider Interface*). Las aplicaciones Java utilizan este API para acceder a una variedad de servicios de directorio y nombrado. El SPI sin embargo habilita a esa variedad de servicios ser añadidos de manera transparente, permitiendo a las aplicaciones Java utilizar el API JNDI para acceder a ellos.

## Librerías de Interfaz de Usuario

### Framework de Métodos de Introducción (Input Method Framework)

Este framework habilita la colaboración entre los componentes de edición de texto y los método de entrada para la introducción de texto. Los métodos de entrada son componentes software que permiten al usuario introducir texto de manera simple, por ejemplo mediante un teclado. Normalmente son utilizados para introducir japonés, chino o coreano (idiomas con miles de caracteres diferentes) en teclados con muchísimas menos teclas para ello. Sin embargo, el framework también soporta métodos de entrada para otros idiomas, así como el uso de otros mecanismos de entrada completamente diferentes, tales como la escritura a mano, o el reconocimiento de voz.

### Accesibilidad

Con el API Java de Accesibilidad, los desarrolladores pueden crear aplicaciones Java que son accesibles a personas con discapacidad. Estas aplicaciones serán compatibles con tecnologías de asistencia tales como lectores de pantalla, sistemas de reconocimiento de voz o pantallas adaptadas a braille.

### Servicio de Impresión

El API Java del servicio de impresión permite la impresión en todas las Plataformas Java, incluyendo aquellas que requieren un consumo de memoria muy reducido, tales como Java ME (Mobile Edition).

### Sonido

La Plataforma Java incluye un potente API para capturar, procesar y emitir audio y datos en formato MIDI (*Musical Instrument Digital Interface*). Este API es soportado por un motor de sonidos bastante eficiente, que garantiza mezclas de audio de alta calidad, así como síntesis de los datos MIDI.

### Transferencia de datos "*Drag and Drop*“

"*Drag & Drop*" habilita la transferencia de archivos entre el lenguaje programación Java y aplicaciones nativas, entre aplicaciones Java, o dentro de la misma única aplicación Java.

### Imagen I/O

El API Java de Imagen I/O proporciona una arquitectura conectable para trabajar con imágenes almacenadas en archivos y accedidas desde la red. El API proporciona un framework para la adición de plugins de algún formato específico.

### Java 2D Gráficos e Imágenes

El API Java 2D™ es un conjunto de clases para gráficos en 2D avanzados. Engloba líneas, textos e imágenes en un único y comprensible modelo. El API proporciona amplio soporte para la composición de imágenes, para canales alpha; proporciona además un conjunto de clases para definir un espacio de colores preciso, y un rico conjunto de operadores orientados a la visualización de imágenes.

### Abstract Windowing Toolkit (AWT)

AWT proporciona APIs para construir componentes de interfaz de usuario tales como menús, botones, campos de texto, cajas de diálogo, casillas de verificación, y para el manejo de entrada de datos por parte del usuario mediante dichos componentes. Además, AWT permite el renderizado de formas simples tales como óvalos, y polígonos, y permite al desarrollador controlar la disposición del interfaz de usuario y las fuentes utilizadas por sus aplicaciones.

### Swing

Los APIs de *Swing* también proporcionan componentes gráficos (GUI) para el uso en interfaces de usuario. Están escritos en Java sin ninguna dependencia con código que sea específico a las facilidades GUI que ofrezca el sistema operativo sobre el que se ejecuta la aplicación. Ésto permite a los componentes GUI de Swing tener un aspecto "conectable/*pluggable*" que puede ser sustituido en tiempo de ejecución.

### JavaFX

Desde el Java SE 7 Update 2 en adelante se incluye el SDK de JavaFX. Esta plataforma es la evolución de la plataforma cliente diseñada para habilitar a los desarrolladores de aplicaciones Java para crear y desplegar fácilmente aplicaciones ricas de internet (RIA, *Rich Internet Applications*), que se comportarán de manera consistente en múltiples plataformas.

## Despliegues

### Java Deployment

Entre los tópicos relacionados con los despliegues, tenemos: instalación, configuración inicial, actualización, redistribución, etc, más concretamente:

* Instalación de la Plataforma en un ordenador.

* Opciones de configuración en el Panel de Control de Java.

* Escritura de aplicaciones en Java.

* Autoría de páginas web que invocan applets o se descargan y lanzan aplicaciones.

* Disponibilidad de los ficheros relacionados con Java en servidores web.

* Actualización de la Plataforma Java en un ordenador.

## Especificación de herramientas

### Arquitectura del Depurador

La Arquitectura de Depuración de la Plataforma Java (*Java Platform Debugger Architecture*, JPDA) define la arquitectura y especificaciones para el uso de depuradores en entornos de desarrollo.

### Interfaz de herramientas de la VM (*Java Virtual Machine Tool Interface*, JVM TI)

JVM TI es una especificación para inspeccionar el estado y controlar la ejecución de las aplicaciones que se ejecutan en la JVM. Además, depreca a la interfaz del perfilador de la JVM (*Java Virtual Machine Profiler Interface*, JVMPI).

### Herramienta de Javadoc

Javadoc es una herramienta que parsea la declaraciones y los comentarios de documentación del código de los ficheros fuente para producir un conjunto de páginas HTML describiendo los elementos de la aplicación. El API Doclet proporciona un mecanismo para que los clientes inspeccionen a nivel de código la estructura de programas y librerías, incluyendo comentarios Javadocs embebidos en el código. Este API puede ser utilizado por doclets personalizados para generar documentación.

### Procesado de Anotaciones

La herramienta *apt* es una utilidad de línea de comandos para el procesamiento de anotaciones. Incluye un conjunto de APIs de reflectividad que soportan la infraestructura para procesar las anotaciones de un programa. Estas APIs reflectivas proporcionan una vista en tiempo de construcción de la estructura del código fuente del programa, en modo lectura. Además, han sido diseñadas para modelar el sistema de tipos del lenguaje de programación Java después de la adición de los *Generics*.

### Dynamic Attach

El paquete *com.sun.tools.attach* contiene una extensión propietaria de Oracle que permite a una aplicación añadirse a una JVM en ejecución. Una vez se ha añadido, una herramienta agente puede ser instalada en dicha JVM.

### API de JConsole

El paquete *com.sun.tools.jconsole* contiene una extensión propietaria de Oracle que proporciona un interfaz programático para acceder a la herramienta *JConsole*.

## Utilidades y herramientas de la JDK

Dichas utilidades y herramientas cubren las herramientas básicas, como *javac, java, javadoc, apt, appletviewer, jar, jdb, javah, javap, extcheck*; herramientas de seguridad, de internacionalización, de RMI, de IDL y RMI-IIOP, de despliegue, de Java Plug-In, de Java Web Start, de monitorización y gestión, así como de gestión de errores.

## Plataformas

Oracle proporciona implementaciones de la JDK y del JRE para Microsoft Windows, Linux, y Solaris.

Otras compañías pueden proporcionar implementaciones de la Plataforma Java para otros sistemas operativos, tales como Macintosh, AIX, etc.

# Patrones Creacionales

Los patrones de diseño creacionales corresponden a patrones de diseño software que solucionan problemas de creación de instancias, ayudando a encapsular y abstraer dicha creación.

## Abstract Factory

El patrón *Abstract Factory* es reconocible por la presencia de métodos de creación que devuelven la propia factoría, que podrá ser utilizada a su vez para crear objetos de otro tipo, ya sea abstracto o de una interfaz.

Una **factoría abstracta** es una factoría que devuelve factorías. ¿Y por qué podría ser útil añadir una capa de abstracción más? Una factoría normal puede ser utilizada para crear conjuntos de objetos relacionados. Una factoría abstracta devuelve factorías. De este modo, una factoría abstracta será utilizada para devolver factorías que pueden ser utilizadas para crear conjuntos de objetos relacionados.

Un ejemplo podría ser una factoría de coches Renault Megane, que devuelve objetos del tipo *PiezaDeCoche* asociados con el Renault Megane. Además, podríamos tener una factoría de coches Citröen C4 que devuelve objetos del tipo *PiezaDeCoche* asociados con el modelo C4 de Citröen.

Podríamos crear una factoría abstracta que devuelva uno de esos distintos tipos de factoría de coches dependiendo del coche en el que se esté interesado. De este modo podremos obtener objetos *PiezaDeCoche* de la factoría.

Mediante polimorfismo, podemos utilizar una interfaz común para obtener las diferentes factorías, y entonces utilizar otra interfaz común para obtener las diferentes piezas de coche.

### Ejemplos de la JDK

1. javax.xml.parsers.DocumentBuilderFactory#newInstance()

Si nos atenemos al Javadoc del método:

{{< highlight java >}}
Obtain a new instance of a ***_DocumentBuilderFactory_***. This static method creates a new factory instance."
{{< / highlight >}}

Además:

{{< highlight java >}}
Once an application has obtained a reference to a ***_DocumentBuilderFactory_*** it can use the factory to configure and obtain parser instances."
{{< / highlight >}}

El código del método es el siguiente, donde claramente se observa que el método devuelve una factoría en función del nombre de clase definido a nivel de sistema, y una vez tengamos la referencia a la factoría, ésta nos permitirá obtener diferentes instancias de parser.

{{< highlight java >}}
public static DocumentBuilderFactory newInstance() {
   try {
       return (DocumentBuilderFactory) FactoryFinder.find(
           /* The default property name according to the JAXP spec */
           "javax.xml.parsers.DocumentBuilderFactory",
           /* The fallback implementation class name */
           "com.sun.org.apache.xerces.internal.jaxp.DocumentBuilderFactoryImpl");
   } catch (FactoryFinder.ConfigurationError e) {
       throw new FactoryConfigurationError(e.getException(),
                                           e.getMessage());
   }

}
{{< / highlight >}}


2. javax.xml.transform.TransformerFactory#newInstance()

Al igual que la clase *DocumentBuilderFactory*, tenemos un método newInstance que nos devolverá una factoría de objetos *transformers* en función del nombre de clase definido a nivel de sistema. Su Javadoc nos informa de lo mismo.

El código del método es el siguiente, donde claramente se observa que el método devuelve una factoría en función del nombre de clase definido a nivel de sistema, y una vez tengamos la referencia a la factoría, ésta nos permitirá obtener diferentes instancias de parser.

{{< highlight java >}}
public static TransformerFactory newInstance()
   throws TransformerFactoryConfigurationError {
   try {
       return (TransformerFactory) FactoryFinder.find(
       /* The default property name according to the JAXP spec */
       "javax.xml.transform.TransformerFactory",
       /* The fallback implementation class name, XSLTC */
       "com.sun.org.apache.xalan.internal.xsltc.trax.TransformerFactoryImpl");
   } catch (FactoryFinder.ConfigurationError e) {
       throw new TransformerFactoryConfigurationError(
           e.getException(),
           e.getMessage());
   }
}
{{< / highlight >}}

Por otro lado, no dispone de un constructor público, de modo que sólo es posible instanciar la clase mediante los métodos creacionales *newInstance*.

{{< highlight java >}}
/**
* Default constructor is protected on purpose.
*/
protected TransformerFactory() { }
{{< / highlight >}}


3. javax.xml.xpath.XPathFactory#newInstance()

Su código es exactamente igual que el de la clase *TransformerFactory*: métodos creacionales y un constructor *protected* para evitar el acceso a la construcción de objetos desde clases no permitidas.

## Builder

El patrón *Builder* es reconocible por la presencia de métodos de creación que devuelven la propia instancia.

Este patrón se utiliza para ensamblar objetos complejos. Con él, el proceso de construcción de un mismo objeto puede ser usado para crear objetos diferentes. El *builder* tendrá 4 partes principales:

* un Builder

* Builder concretos

* un Director

* un Product

#### Builder

Un *Builder* es una interfaz (o clase abstracta) que es implementada o extendida por los *Builder* concretos. La interfaz *Builder* establece las acciones (métodos) involucrados en el ensamblaje de un objeto *Product*. Además, contiene un método para retornar el objeto *Product* (por ejemplo *getProduct()*).

#### Product

El objeto *Product* es el objeto que es ensamblado en el patrón Builder.

#### Builder concretos

Implementan la interfaz *Builder* (o la extienden, si fuera una clase abstracta). Un *Builder* concreto es responsable de crear y ensamblar un objeto *Product*. Diferentes *Builder* concretos crearán y ensamblarán objetos *Product* de manera diferente.

#### Director

Un objeto *Director* es responsable de construir un *Product*. Esto lo hace a través de la interfaz *Builder* y su implementación concreta, utilizando los diferentes métodos que proporciona la interfaz.

Existen varios usos del patrón *Builder*. Por ejemplo, si queremos que el proceso de construcción se mantenga igual, pero nos gustaría crear un tipo diferente de *Product*, podríamos crear un nuevo *Builder* concreto y pasárselo al mismo *Director*.

Por otro lado, si quisiéramos alterar el proceso de construcción, podemos modificar el *Director* para utilizar un proceso de construcción diferente.

### Ejemplos de la JDK

1. java.lang.StringBuilder#append()

Los métodos *append()* añaden todos el parámetro de entrada a la representación del objeto, retornando el mismo objeto.

{{< highlight java >}}
public StringBuilder append(String str) {
   super.append(str);
   return this;
}

public StringBuilder append(boolean b) {
   super.append(b);
   return this;
}

public StringBuilder append(char c) {
   super.append(c);
   return this;
}

public StringBuilder append(int i) {
   super.append(i);
   return this;
}

public StringBuilder append(long lng) {
   super.append(lng);
   return this;
}

public StringBuilder append(float f) {
   super.append(f);
   return this;
}

public StringBuilder append(double d) {
   super.append(d);
   return this;
}
{{< / highlight >}}

En este caso, el *Builder* sería *AbstractBuilder*, clase abstracta que define las implementaciones básicas de los métodos de construcción; el *Product* sería cada uno de los tipos (primitivos u Objetos) que son pasados como parámetros a los métodos *append* (en la imagen se muestran sólo los métodos *append()* para los tipos básicos y para String, aunque existen más métodos *append*); un *Builder* concreto sería la propia clase *StringBuilder*; y el *Director* sería el responsable de construir el producto, por ejemplo una aplicación cliente.

2. java.lang.StringBuffer#append()

*StringBuffer* tiene el mismo comportamiento que la clase *StringBuilder*, pero con la salvedad que *StringBuffer* garantiza la sincronización. En su Javadoc explica perfectamente este comportamiento:

{{< highlight java >}}
/**
* …
* String buffers are safe for use by multiple threads. The methods
* are synchronized where necessary so that all the operations on any
* particular instance behave as if they occur in some serial order
* that is consistent with the order of the method calls made by each of
* the individual threads involved.
* ...
*/{{< / highlight >}}


En la clase StringBuilder no ocurre esta sincronización.

3. java.nio.ByteBuffer#put() (también en CharBuffer, ShortBuffer, IntBuffer, LongBuffer, FloatBuffer y DoubleBuffer)

Los métodos *put()* de las clases *XXXBuffer*, añaden el parámetro al objeto actual, retornándolo, tal y como explica su Javadoc:

{{< highlight java >}}/**
* ...
* Writes the given byte into this buffer at the current
* position, and then increments the position.
* ...
*/{{< / highlight >}}


Lo cual corresponde con el código de cualquiera de sus implementaciones, donde se observa claramente el patrón Builder al retornar sus métodos el propio objeto:

{{< highlight java >}}public ByteBuffer put(byte x) {
   unsafe.putByte(ix(nextPutIndex()), ((x)));
   return this;
}{{< / highlight >}}


4. javax.swing.GroupLayout.Group#addComponent()

Los métodos *addComponent()* añaden un componente al *Group* actual, retornando el propio grupo:

{{< highlight java >}}public Group addComponent(Component component) {
   return addComponent(component, DEFAULT_SIZE, DEFAULT_SIZE,
           DEFAULT_SIZE);
}

public Group addComponent(Component component, int min, int pref,
       int max) {
   return addSpring(new ComponentSpring(component, min, pref, max));
}
Group addSpring(Spring spring) {
   springs.add(spring);
   spring.setParent(this);
   if (!(spring instanceof AutoPreferredGapSpring) ||
           !((AutoPreferredGapSpring)spring).getUserCreated()) {
       springsChanged = true;
   }
   return this;
}{{< / highlight >}}


5. Todas las implementaciones de java.lang.Appendable

Como hemos visto con anterioridad, tanto *StringBuilder* como *StringBuffer* definen el patrón Builder en sus métodos *append*. Además, ambas extienden la clase *AbstractStringBuilder*, que a su vez implementa la interfaz *Appendable*.

## Factory o Factory Method

El patrón *Factory Method* es reconocible por la presencia de métodos de creación que devuelven una implementación de un tipo abstracto o de una interfaz.

Una factoría es una clase Java que es utilizada para encapsular el código de creación de objetos. Una clase factoría instancia y devuelve un tipo particular de objeto basado en los datos que le llegan a la factoría. Los diferentes tipos de objetos que son devueltos por una factoría típicamente suelen ser subclases de una clase padre común.

Los datos enviados desde el código llamante a la factoría pueden ser pasados en la creación de la factoría, o cuando el método de la factoría es invocado para crear un objeto.

Este método de creación a menudo es llamado *getInstance()* o *getClass()*.

### Ejemplos de la JDK

1. java.util.Calendar#getInstance()

Los métodos getInstance de la clase *Calendar*:

{{< highlight java >}}/**
* Gets a calendar using the default time zone and locale. The
* <code>Calendar</code> returned is based on the current time
* in the default time zone with the default locale.
*
* @return a Calendar.
*/
public static Calendar getInstance()
{
   Calendar cal = createCalendar(TimeZone.getDefaultRef(), Locale.getDefault(Locale.Category.FORMAT));
   cal.sharedZone = true;
   return cal;
}{{< / highlight >}}


Podemos observar la presencia de un método *createCalendar()*, que en función de un *TimeZone* y un *Locale* construye un objeto *Calendar*. Este método de creación representa el patrón *FactoryMethod*:

{{< highlight java >}}private static Calendar createCalendar(TimeZone zone,
                                      Locale aLocale)
{
   Calendar cal = null;

   String caltype = aLocale.getUnicodeLocaleType("ca");
   if (caltype == null) {
       // Calendar type is not specified.
       // If the specified locale is a Thai locale,
       // returns a BuddhistCalendar instance.
       if ("th".equals(aLocale.getLanguage())
               && ("TH".equals(aLocale.getCountry()))) {
           cal = new BuddhistCalendar(zone, aLocale);
       } else {
           cal = new GregorianCalendar(zone, aLocale);
       }
   } else if (caltype.equals("japanese")) {
       cal = new JapaneseImperialCalendar(zone, aLocale);
   } else if (caltype.equals("buddhist")) {
       cal = new BuddhistCalendar(zone, aLocale);
   } else {
       // Unsupported calendar type.
       // Use Gregorian calendar as a fallback.
       cal = new GregorianCalendar(zone, aLocale);
   }

   return cal;
}{{< / highlight >}}


Como podemos observar, éste método puede devolver objetos *Calendar* de diferentes tipos: *JapaneseImperialCalendar*, *BuddhistCalendar* o *GregorianCalendar*, en función de los parámetros de entrada. Este último tipo además hace de *fallback*.

2. java.util.ResourceBundle#getBundle()

Si miramos al Javadoc de la clase, directamente nos informa de la presencia de *FactoryMethod* para la creación de instancias de *ResourceBundle*.

{{< highlight java >}}/**
* ...
* The {@link ResourceBundle.Control} class provides information necessary
* to perform the bundle loading process by the <code>getBundle</code>
* factory methods that take a <code>ResourceBundle.Control</code>
* instance.
* ...
*/{{< / highlight >}}


Del mismo modo, que en el anterior caso, los diferentes métodos *getBundle(...)* construirán y retornarán un *ResourceBundle* en función de los parámetros de entrada:

{{< highlight java >}}public static final ResourceBundle getBundle(String baseName)
{
   return getBundleImpl(baseName, Locale.getDefault(),
                        /* must determine loader here, else we break stack invariant */
                        getLoader(Reflection.getCallerClass()),
                        Control.INSTANCE);
}{{< / highlight >}}


De manera interna, se invoca un método creacional *getBundleImpl(...)*, que será el representante del patrón *FactoryMethod*:

{{< highlight java >}}private static ResourceBundle getBundleImpl(String baseName, Locale locale,
                                           ClassLoader loader, Control control) {
   if (locale == null || control == null) {
       throw new NullPointerException();
   }

   // We create a CacheKey here for use by this call. The base
   // name and loader will never change during the bundle loading
   // process. We have to make sure that the locale is set before
   // using it as a cache key.
   CacheKey cacheKey = new CacheKey(baseName, locale, loader);
   ResourceBundle bundle = null;

   // Quick lookup of the cache.
   BundleReference bundleRef = cacheList.get(cacheKey);
   if (bundleRef != null) {
       bundle = bundleRef.get();
       bundleRef = null;
   }

   // If this bundle and all of its parents are valid (not expired),
   // then return this bundle. If any of the bundles is expired, we
   // don't call control.needsReload here but instead drop into the
   // complete loading process below.
   if (isValidBundle(bundle) && hasValidParentChain(bundle)) {
       return bundle;
   }

   // No valid bundle was found in the cache, so we need to load the
   // resource bundle and its parents.

   boolean isKnownControl = (control == Control.INSTANCE) ||
                              (control instanceof SingleFormatControl);
   List<String> formats = control.getFormats(baseName);
   if (!isKnownControl && !checkList(formats)) {
       throw new IllegalArgumentException("Invalid Control: getFormats");
   }

   ResourceBundle baseBundle = null;
   for (Locale targetLocale = locale;
        targetLocale != null;
        targetLocale = control.getFallbackLocale(baseName, targetLocale)) {
       List<Locale> candidateLocales = control.getCandidateLocales(baseName, targetLocale);
       if (!isKnownControl && !checkList(candidateLocales)) {
           throw new IllegalArgumentException("Invalid Control: getCandidateLocales");
       }

       bundle = findBundle(cacheKey, candidateLocales, formats, 0, control, baseBundle);

       // If the loaded bundle is the base bundle and exactly for the
       // requested locale or the only candidate locale, then take the
       // bundle as the resulting one. If the loaded bundle is the base
       // bundle, it's put on hold until we finish processing all
       // fallback locales.
       if (isValidBundle(bundle)) {
           boolean isBaseBundle = Locale.ROOT.equals(bundle.locale);
           if (!isBaseBundle || bundle.locale.equals(locale)
               || (candidateLocales.size() == 1
                   && bundle.locale.equals(candidateLocales.get(0)))) {
               break;
           }

           // If the base bundle has been loaded, keep the reference in
           // baseBundle so that we can avoid any redundant loading in case
           // the control specify not to cache bundles.
           if (isBaseBundle && baseBundle == null) {
               baseBundle = bundle;
           }
       }
   }

   if (bundle == null) {
       if (baseBundle == null) {
           throwMissingResourceException(baseName, locale, cacheKey.getCause());
       }
       bundle = baseBundle;
   }

   return bundle;
}{{< / highlight >}}


3. java.nio.charset.Charset#forName()

El método *forName(...)* retornará un *Charset* en función del parámetro de entrada:

{{< highlight java >}}/**
* Returns a charset object for the named charset. </p>
*
* @param  charsetName
*         The name of the requested charset; may be either
*         a canonical name or an alias
*
* @return  A charset object for the named charset
*/
public static Charset forName(String charsetName) {
   Charset cs = lookup(charsetName);
   if (cs != null)
       return cs;
   throw new UnsupportedCharsetException(charsetName);
}{{< / highlight >}}


El método *lookup(...)*, e internamente el método *lookup2(...)*, serán los que definan el patrón:

{{< highlight java >}}private static Charset lookup(String charsetName) {
   if (charsetName == null)
       throw new IllegalArgumentException("Null charset name");

   Object[] a;
   if ((a = cache1) != null && charsetName.equals(a[0]))
       return (Charset)a[1];
   // We expect most programs to use one Charset repeatedly.
   // We convey a hint to this effect to the VM by putting the
   // level 1 cache miss code in a separate method.
   return lookup2(charsetName);
}

private static Charset lookup2(String charsetName) {
   Object[] a;
   if ((a = cache2) != null && charsetName.equals(a[0])) {
       cache2 = cache1;
       cache1 = a;
       return (Charset)a[1];
   }

   Charset cs;
   if ((cs = standardProvider.charsetForName(charsetName)) != null ||
       (cs = lookupExtendedCharset(charsetName))           != null ||
       (cs = lookupViaProviders(charsetName))              != null)
   {
       cache(charsetName, cs);
       return cs;
   }

   /* Only need to check the name if we didn't find a charset for it */
   checkName(charsetName);
   return null;
}{{< / highlight >}}


4. java.net.URLStreamHandlerFactory#createURLStreamHandler(String) (Devuelve un objeto singleton object por protocolo)

Atendiendo al Javadoc de la interfaz *URLStreamHandlerFactory*, podemos observar que para construir los manejadores de URL vamos a disponer de una factoría:

{{< highlight java >}}/**
* This interface defines a factory for <code>URL</code> stream
* protocol handlers.
* <p>
* It is used by the <code>URL</code> class to create a
* <code>URLStreamHandler</code> for a specific protocol.
*/{{< / highlight >}}


Si tomamos una implementación cualquiera de la interfaz, por ejemplo *TomcatURLStreamHandlerFactory*, vemos que en función del parámetro de entrada *protocol*, se construye un tipo de *URLStreamHandler*, para archivos WAR, para CLASSPATH’s, o para incluso otros tipo de handlers que la propia clase supiera manejar, ya que dispone de un atributo *userFactories* que maneja una lista de factorías personalizadas por el usuario.

{{< highlight java >}}public URLStreamHandler createURLStreamHandler(String protocol) {
   if("war".equals(protocol)) {
       return new WarURLStreamHandler();
   } else if("classpath".equals(protocol)) {
       return new ClasspathURLStreamHandler();
   } else {
       Iterator i$ = this.userFactories.iterator();

       URLStreamHandler handler;
       do {
           if(!i$.hasNext()) {
               return null;
           }

           URLStreamHandlerFactory factory = (URLStreamHandlerFactory)i$.next();
           handler = factory.createURLStreamHandler(protocol);
       } while(handler == null);

       return handler;
   }
}{{< / highlight >}}


## Prototype

El patrón *Prototype* es reconocible por la presencia de métodos de creación que devuelven una instancia diferente de sí mismo, pero con las mismas propiedades.

En este patrón, un objeto nuevo es creado mediante una clonación de uno existente, siendo además muy útil para crear copias de objetos.

Un ejemplo de su utilidad es cuando un objeto original es creado con un recurso, por ejemplo un stream de datos, que puede no estar disponible en el momento que la clonación es realizada.

Otro ejemplo es si la creación original del objeto necesita de un tiempo significativo para finalizar una operación, por ejemplo leer de una base de datos o de la red.

Un beneficio añadido del patrón *Prototype* es que puede reducir la proliferación de clases en un proyecto evitando la proliferación de factorías.

De manera general en Java, si quisiéramos usar la clonación (por ejemplo con el patrón *Prototype*), podríamos utilizar el método *clone()* y la interfaz *Cloneable*.

Por defecto, el método clone hace un "*shallow copy*", o copia de poca profundidad, que no es más que la copia campo a campo de todos los atributos del objeto original. Si el valor de un campo es una referencia a un objeto, por ejemplo una dirección de memoria, se copia la referencia, por lo que ambos objetos referenciarán al mismo objeto, y los objetos referenciados serán compartidos. Si por el contrario, el valor es de tipo primitivo, se copia el valor del primitivo. Este tipo de copia “*shallow*” es sencilla a la vez que barata, pues suele ser implementada copiando los bits de manera exacta.

### Ejemplos de la JDK

* java.lang.Object#clone() (la clase tiene que implementar la interfaz java.lang.Cloneable)

Todas las clases que implementan la interfaz *java.lang.Cloneable* deben implementar el método *clone()*, que retorna una instancia del mismo tipo, con las siguientes consideraciones, obtenidas de su Javadoc:

{{< highlight java >}}* ...
* The method {@code clone} for class {@code Object} performs a
* specific cloning operation. First, if the class of this object does
* not implement the interface {@code Cloneable}, then a
* {@code CloneNotSupportedException} is thrown. Note that all arrays
* are considered to implement the interface {@code Cloneable} and that
* the return type of the {@code clone} method of an array type {@code T[]}
* is {@code T[]} where T is any reference or primitive type.
* Otherwise, this method creates a new instance of the class of this
* object and initializes all its fields with exactly the contents of
* the corresponding fields of this object, as if by assignment; the
* contents of the fields are not themselves cloned. Thus, this method
* performs a "shallow copy" of this object, not a "deep copy" operation.
* …{{< / highlight >}}


## Singleton

El patrón *Singleton* es reconocible por la presencia de métodos de construcción que devuelven la misma instancia, normalmente de sí mismo, cada vez que son invocados.

Un *Singleton* es una clase que es instanciada una única vez. Esto se consigue normalmente mediante la creación de un campo estático en la clase. Dicha clase tiene además un método estático para obtener la instancia de la clase, y suele ser nombrado como *getInstance()*.

La creación del objeto referenciado por el campo estático puede ser realizado de dos maneras:

* cuando la clase es inicializada.

* cuando el método *getInstance()* es invocado por primera vez.

La clase *singleton* normalmente tiene un constructor privado para prevenir ser instanciada a través de algún constructor. En su lugar, la instancia del singleton es obtenida mediante la invocación al método estático *getInstance()*.

### Ejemplos de la JDK

* java.lang.Runtime#getRuntime()

Toda aplicación Java tiene una única instancia de la clase *Runtime*, que permite a la aplicación interactuar con el entorno en el que se ejecuta. Para que esta interfaz sea única, se utiliza el método *getRuntime()*, que retorna siempre la misma instancia. El Javadoc de la clase y del método demuestran la presencia del patrón Singleton.

{{< highlight java >}}/**
* Every Java application has a single instance of class
* <code>Runtime</code> that allows the application to interface with
* the environment in which the application is running. The current
* runtime can be obtained from the <code>getRuntime</code> method.
* <p>
* An application cannot create its own instance of this class.
*
* @author  unascribed
* @see     java.lang.Runtime#getRuntime()
* @since   JDK1.0
*/

public class Runtime {
   private static Runtime currentRuntime = new Runtime();

   /**
    * Returns the runtime object associated with the current Java application.
    * Most of the methods of class <code>Runtime</code> are instance
    * methods and must be invoked with respect to the current runtime object.
    *
    * @return  the <code>Runtime</code> object associated with the current
    *          Java application.
    */
   public static Runtime getRuntime() {
       return currentRuntime;
   }
…
}{{< / highlight >}}


* java.awt.Desktop#getDesktop()

En las aplicaciones Java utilizando el paquete AWT, siempre se utilizará la misma instancia de *Desktop*, puesto que se cogerá del contexto de aplicación, y si éste es nulo, se creará y se añadirá a dicho contexto, para que subsiguientes invocaciones siempre retornen la misma instancia de *Desktop*.

{{< highlight java >}}/**
* Returns the <code>Desktop</code> instance of the current
* browser context.
* ...
*/
public static synchronized Desktop getDesktop(){
   if (GraphicsEnvironment.isHeadless()) throw new HeadlessException();
   if (!Desktop.isDesktopSupported()) {
       throw new UnsupportedOperationException("Desktop API is not " +
                                               "supported on the current platform");
   }

   sun.awt.AppContext context = sun.awt.AppContext.getAppContext();
   Desktop desktop = (Desktop)context.get(Desktop.class);

   if (desktop == null) {
       desktop = new Desktop();
       context.put(Desktop.class, desktop);
   }

   return desktop;
}{{< / highlight >}}


* java.lang.System#getSecurityManager()

Siempre que se invoquen los métodos de la clase *System*, que necesiten acceso al *SecurityManager*, siempre se va a preguntar si existe ya uno asociado a la clase, para utilizarlo en tal caso.

{{< highlight java >}}/**
* Gets the system security interface.
*
* @return  if a security manager has already been established for the
*          current application, then that security manager is returned;
*          otherwise, <code>null</code> is returned.
* @see     #setSecurityManager
*/
public static SecurityManager getSecurityManager() {
   return security;
}

public static Properties getProperties() {
   SecurityManager sm = getSecurityManager();
   if (sm != null) {
       sm.checkPropertiesAccess();
   }

   return props;
}{{< / highlight >}}


En el método *getProperties()* se evidencia que el método *getSecurityManager()*, el cual retorna el valor del SecurityManager actual, representa el patrón Singleton.

#  Patrones Estructurales

Los patrones estructurales de diseño software son aquellos patrones que solucionan problemas de composición (agregación) de clases y objetos.

## Adapter

El patrón *Adapter* es reconocible por la presencia de métodos de creación que toman una instancia de un tipo diferente de clase abstracta o interfaz, y devuelven una implementación de otro tipo (propio o diferente) de clase abstracta o interfaz, el cual decora o sobreescribe a la instancia dada.

En el patrón *Adapter*, una clase de envoltura (o *wrapper*), por ejemplo el *Adapter*, es utilizada para traducir peticiones a otra clase, por ejemplo el *Adaptee*, o "adaptado". De hecho, un adaptador proporciona interacciones particulares con un “*Adaptee*” que no son ofrecidas directamente por el “*Adaptee*”.

El patrón toma dos formas:

* En la primera, una clase adaptador utiliza herencia. La clase *Adapter* extiende a la clase "*Adaptee*" y añade los métodos de interés al *Adapter*. Estos métodos podrían ser declarados en una interfaz.

* En la segunda un objeto adaptador utiliza *Composition*. El objeto contiene un "*Adaptee*" e implementa una interfaz para interactuar con él.

### Ejemplos de la JDK

* java.util.Arrays#asList()

Es un ejemplo claro del patrón Adapter, puesto que toma como parámetro una array de objetos, y devuelve una lista, mediante una implementación sencilla como es la clase *ArrayList*.

{{< highlight java >}}/**
* Returns a fixed-size list backed by the specified array.  (Changes to
* the returned list "write through" to the array.)  This method acts
* as bridge between array-based and collection-based APIs, in
* combination with {@link Collection#toArray}.  The returned list is
* serializable and implements {@link RandomAccess}.
*
* <p>This method also provides a convenient way to create a fixed-size
* list initialized to contain several elements:
* <pre>
*     List&lt;String&gt; stooges = Arrays.asList("Larry", "Moe", "Curly");
* </pre>
*
* @param a the array by which the list will be backed
* @return a list view of the specified array
*/
@SafeVarargs
public static <T> List<T> asList(T... a) {
   return new ArrayList<>(a);
}{{< / highlight >}}


* java.io.InputStreamReader(InputStream)

El constructor recibe un *InputStream* y devuelve una implementación de la interfaz *Reader*, en este caso, un *InputStreamReader*.

{{< highlight java >}}/**
* Creates an InputStreamReader that uses the default charset.
*
* @param  in   An InputStream
*/
public InputStreamReader(InputStream in) {
   super(in);
   try {
       sd = StreamDecoder.forInputStreamReader(in, this, (String)null); // ## check lock object
   } catch (UnsupportedEncodingException e) {
       // The default encoding should always be available
       throw new Error(e);
   }
}{{< / highlight >}}


* java.io.OutputStreamWriter(OutputStream) (devuelve un Writer)

Del mismo modo que en el ejemplo anterior, el constructor recibe un *OutputStream* y devuelve una implementación de la interfaz *Writer*, en este caso, un *OutputStreamWriter*.

{{< highlight java >}}/**
* Creates an OutputStreamWriter that uses the default character encoding.
*
* @param  out  An OutputStream
*/
public OutputStreamWriter(OutputStream out) {
   super(out);
   try {
       se = StreamEncoder.forOutputStreamWriter(out, this, (String)null);
   } catch (UnsupportedEncodingException e) {
       throw new Error(e);
   }
}{{< / highlight >}}


* javax.xml.bind.annotation.adapters.XmlAdapter#marshal() y #unmarshal()

Si vemos una implementación de *XmlAdapter*, como es *ZeroOneBooleanAdapter*, podemos observar que los métodos *marshal(String)* y *unmarshal(Boolean)* lo que hacen es convertir el resultado en el tipo contrario, esto es, Boolean en el caso de *unmarshall*, y String para *marshal*.

{{< highlight java >}}public class ZeroOneBooleanAdapter extends XmlAdapter<String, Boolean> {
   public ZeroOneBooleanAdapter() {
   }

   public Boolean unmarshal(String v) {
       return v == null?null:Boolean.valueOf(DatatypeConverter.parseBoolean(v));
   }

   public String marshal(Boolean v) {
       return v == null?null:(v.booleanValue()?"1":"0");
   }
}{{< / highlight >}}


## Bridge

El patrón *Bridge* es reconocible por la presencia de métodos de creación que toman una instancia de un tipo diferente de clase abstracta o interfaz, y devuelven una implementación de un tipo propio de clase abstracta o interfaz, el cual delega/usa la instancia dada.

En el patrón *Bridge* se separa una abstracción y su implementación, y se codifican diferentes estructuras de herencia para ambas partes: la abstracción y el implementador. La abstracción es una interfaz o una clase abstracta, así como el implementador. Además, la abstracción contendrá una referencia al implementador.

Las clases descendientes de la abstracción son referenciadas como abstracciones refinadas, y las clases descendientes del implementador son implementadores concretos. Dado que podemos cambiar la referencia al implementador en la abstracción, seremos capaces de cambiar al implementador de la abstracción en tiempo de ejecución. De esta manera, los cambios en el implementador no afectan al código cliente.

Un ejemplo del patrón *Bridge* podría ser el siguiente:

Supongamos que tenemos una clase *Vehículo*. Podríamos extraer una implementación del motor en la clase *Motor*. Podríamos además referenciar este implementador de *Motor* en nuestro *Vehículo* a través de un atributo de clase. Si declaramos la clase *Vehículo* como abstracta y añadiésemos un método abstracto *conducir()*, las subclases de *Vehículo* necesitarían implementar dicho método. Para poder cambiar la referencia al *Motor*, deberíamos añadir un método *setMotor()* en el *Vehículo*.

### Ejemplos de la JDK

* Los métodos de java.util.Collections#newSetFromMap()

Como puede observarse en el siguiente bloque de código, el método *newSetFromMap(...)* convierte la colección pasada por parámetro en un *SetFromMap*, de modo que se puedan realizar sobre la colección inicial las operaciones básicas sobre los objetos de tipo conjunto (Set), puesto que el *SetFromMap* extiende a *AbstractSet*.

{{< highlight java >}}/**
* Returns a set backed by the specified map.  The resulting set displays
* the same ordering, concurrency, and performance characteristics as the
* backing map.
* ...
*/
public static <E> Set<E> newSetFromMap(Map<E, Boolean> map) {
   return new SetFromMap<>(map);
}

/**
* @serial include
*/
private static class SetFromMap<E> extends AbstractSet<E>
   implements Set<E>, Serializable
{
   private final Map<E, Boolean> m;  // The backing map
   private transient Set<E> s;       // Its keySet

   SetFromMap(Map<E, Boolean> map) {
       if (!map.isEmpty())
           throw new IllegalArgumentException("Map is non-empty");
       m = map;
       s = map.keySet();
   }

   public void clear()               {        m.clear(); }
   public int size()                 { return m.size(); }
   public boolean isEmpty()          { return m.isEmpty(); }
   public boolean contains(Object o) { return m.containsKey(o); }
   public boolean remove(Object o)   { return m.remove(o) != null; }
   public boolean add(E e) { return m.put(e, Boolean.TRUE) == null; }
   public Iterator<E> iterator()     { return s.iterator(); }
   public Object[] toArray()         { return s.toArray(); }
   public <T> T[] toArray(T[] a)     { return s.toArray(a); }
   public String toString()          { return s.toString(); }
   public int hashCode()             { return s.hashCode(); }
   public boolean equals(Object o)   { return o == this || s.equals(o); }
   public boolean containsAll(Collection<?> c) {return s.containsAll(c);}
   public boolean removeAll(Collection<?> c)   {return s.removeAll(c);}
   public boolean retainAll(Collection<?> c)   {return s.retainAll(c);}
   // addAll is the only inherited implementation

   private static final long serialVersionUID = 2454657854757543876L;

   private void readObject(java.io.ObjectInputStream stream)
       throws IOException, ClassNotFoundException
   {
       stream.defaultReadObject();
       s = m.keySet();
   }
}{{< / highlight >}}


Como bien se aprecia, los métodos que la clase implementa de Set no hacen más que invocar los métodos del objeto subyacente, en este caso un Map.

* Los métodos de java.util.Collections#singleton()

Como puede observarse en el siguiente bloque de código, el método *singleton(...)* convierte la colección pasada por parámetro en un *SingletonSet*, de modo que se puedan realizar sobre la colección inicial las operaciones básicas sobre los objetos de tipo conjunto (Set), puesto que el *SingletonSet* extiende a *AbstractSet*.

{{< highlight java >}}/**
* Returns an immutable set containing only the specified object.
* The returned set is serializable.
*
* @param o the sole object to be stored in the returned set.
* @return an immutable set containing only the specified object.
*/
public static <T> Set<T> singleton(T o) {
   return new SingletonSet<>(o);
}

/**
* @serial include
*/
private static class SingletonSet<E>
   extends AbstractSet<E>
   implements Serializable
{
   private static final long serialVersionUID = 3193687207550431679L;

   private final E element;

   SingletonSet(E e) {element = e;}

   public Iterator<E> iterator() {
       return singletonIterator(element);
   }

   public int size() {return 1;}

   public boolean contains(Object o) {return eq(o, element);}
}{{< / highlight >}}


## Composite

El patrón *Composite* es reconocible por la presencia de métodos de comportamiento que toman una instancia de un tipo abstracto o interfaz y la devuelven en forma de una estructura de árbol.

En este patrón, existe una **estructura de árbol** en la que idénticas operaciones pueden ser realizadas tanto en los **nodos hoja** como en los **nodos intermedios**.

Un nodo en un árbol será representado por una clase que pueda tener descendientes. Por ello, definiremos una clase nodo como una clase *Composite*.

Un nodo hoja en un árbol, en cambio, será una clase *Primitive* que no tendrá descendientes.

Según estas definiciones los descendientes de un *Composite* podrán ser tanto *Primitive* como otros *Composite*.

La clase *Primitive*, de los nodos hoja, y la clase *Composite* comparten una interfaz *Component* común, que define las operaciones comunes que pueden ser realizadas tanto en las hojas como en los *Composite*. Cuando una operación en un *Composite* es realizada, esta operación se realiza igualmente en todos sus descendientes, independientemente que sean hojas o *Composite*. De este modo, el patrón *Composite* se utiliza para realizar operaciones comunes en los objetos que componen un árbol.

La descripción del patrón *Composite* en el libro "*The Gang of Four* (GoF)" define una interacción de un cliente con la estructura de árbol mediante la interfaz *Component*, en la que dicha interfaz incluye las operaciones comunes para ambos tipos de nodos, hoja y *Composite*, así como las operaciones de adición, eliminación y obtención (Add/Remove/Get) en el árbol.

### Ejemplos de la JDK

* java.awt.Container#add(Component)

Hay que decir que prácticamente todo *Swing* utiliza este patrón, y en este caso, la clase *Container* lo aplica en este método de adición de componentes, pues añade cada componente al final del contenedor.

{{< highlight java >}}/**
* Appends the specified component to the end of this container.
* ...
*/
public Component add(Component comp) {
   addImpl(comp, null, -1);
   return comp;
}{{< / highlight >}}


El método *addImpl(...)*, de gran extensión, lo primero que hace es abrir un bloque sincronizado para operar sobre el árbol de componentes que representa al contenedor.

{{< highlight java >}}synchronized (getTreeLock()){{< / highlight >}}


## Decorator

El patrón *Decorator* es reconocible por la presencia de métodos de creación que toman una instancia del mismo tipo de clase abstracta o interfaz y le añade comportamiento adicional.

Mientras que la herencia clásica añade funcionalidad a las clases, el patrón *Decorator* añade funcionalidad a los objetos al recubrirlos en otros objetos. Cada vez que se requiere una funcionalidad adicional, el objeto es recubierto en otro objeto.

Un buen ejemplo de este patrón podrían ser las clases de manipulación de flujos de datos (o *streams*) de entrada-salida (I/O) de Java.

Para este patrón, necesitamos una clase que sirva como objeto base al que queramos añadir funcionalidad. Este objeto será un *Component* concreto, e implementará una interfaz *Component*. Esta interfaz declarará las operaciones comunes que podemos realizar para los componentes concretos y todos los decoradores que recubran al objeto componente concreto.

Un *Decorator* es una clase abstracta que implementa la interfaz *Component* y contiene una referencia a un *Component*. Los decoradores concretos serán clases que extienden la clase *Decorator*.

### Ejemplos de la JDK

* java.util.Collections: métodos checkedXXX(), synchronizedXXX() y unmodifiableXXX()

Lo que hacen todos estos métodos es, a partir de una objeto inicial (el XXX representa una List, un Map, un Set, etc.), añadirle un comportamiento que de inicio no tienen, como por ejemplo es la comprobación de tipos en los métodos *checkedXXX*, la sincronización entre hilos en los métodos *synchonizedXXX*, y el acceso único de sólo-lectura en los métodos *unmodiableXXX*.

A modo de ejemplo, en el siguiente bloque de código se muestran los métodos en los que el parámetro de entrada es una List, viendo con claridad que se decora el comportamiento inicial de la List según el método invocado.

{{< highlight java >}}public static <E> List<E> checkedList(List<E> list, Class<E> type) {
   return (list instanceof RandomAccess ?
           new CheckedRandomAccessList<>(list, type) :
           new CheckedList<>(list, type));
}

public static <T> List<T> synchronizedList(List<T> list) {
   return (list instanceof RandomAccess ?
           new SynchronizedRandomAccessList<>(list) :
           new SynchronizedList<>(list));
}

public static <T> List<T> unmodifiableList(List<? extends T> list) {
   return (list instanceof RandomAccess ?
           new UnmodifiableRandomAccessList<>(list) :
           new UnmodifiableList<>(list));
}{{< / highlight >}}


* javax.servlet.http.HttpServletRequestWrapper y HttpServletResponseWrapper

En este caso el Javadoc de ambas clases es muy claro:

{{< highlight java >}}/**
* Provides a convenient implementation of the HttpServletRequest interface
* that can be subclassed by developers wishing to adapt the request to a
* Servlet.
*
* <p>This class implements the Wrapper or Decorator pattern. Methods default
* to calling through to the wrapped request object.
*
* @see javax.servlet.http.HttpServletRequest
* @since Servlet 2.3
*/{{< / highlight >}}


Y por tanto cualquier desarrollador podría extender esta clase para añadir el comportamiento necesario para su aplicación.

## Facade

El patrón *Facade* es reconocible por la presencia de métodos de comportamiento que internamente utilizan instancias de diferentes e independientes tipos de clases abstractas o interfaces.

En este patrón, una clase fachada (*Facade*) es utilizada para proporcionar una interfaz común a un conjunto de clases. La *Facade* simplifica a los clientes las interacciones con un sistema complejo, localizando dichas interacciones en una interfaz única. Como resultado, los clientes pueden interactuar con un único objeto en lugar de requerir interactuar directamente y de maneras posiblemente complicadas con todos los objetos que componen el sistema.

Como ejemplo, supongamos que tenemos tres clases escritas de manera horrible. Si nos basáramos en los nombres de clase, en los nombres de método o en la falta de documentación, sería muy difícil para un cliente interactuar con esas clases. Si escribiéramos una *Facade* que agrupara las interacciones con esas tres clases en un único lugar, estaríamos simplificando al código cliente dichas interacciones, pues únicamente tendría que invocar a los métodos de la *Facade*.

### Ejemplos de la JDK

* javax.faces.context.FacesContext

Internamente utiliza, entre otros, los tipos abstractos o interfaces *LifeCycle*, *ViewHandler*, *NavigationHandler* y muchos más, sin que el usuario final tenga que preocuparse sobre ello, pues son sobreescritos mediante inyección. De este modo se corresponde con el patrón Facade, pues esconde el uso de esas clases al código cliente, que únicamente tiene que interactuar con la clase *FacesContext*.

* javax.faces.context.ExternalContext

Del mismo modo, la clase *ExternalContext* utiliza internamente *ServletContext*, *HttpSession*, *HttpServletRequest*, *HttpServletResponse*, etc, por lo que el código cliente no tiene que conocer cómo tratar con dichas clases, únicamente con *ExternalContext*.

## Flyweight

El patrón *Flyweight* es reconocible por la presencia de métodos de creación que devuelven una instancia que previamente ha sido cacheada, a modo de un patrón "*multiton*".

En este patrón, en lugar de crear un gran número de objetos similares, los objetos se reutilizan, pudiendo reducir los requisitos de memoria de una aplicación.

Las similitudes entre los objetos son almacenadas dentro de los objetos, mientras que las diferencias se mueven al código cliente. Estas diferencias son pasadas a los objetos cuando se necesitan mediante la invocación de métodos en los objetos, que estarán declarados en una interfaz *Flyweight*.

Una clase *FlyweightConcreta* implementará dicha interfaz, y será utilizada para realizar las operaciones en base a un estado externo, así como almacenar el estado común.

En ocasiones se puede utilizar un factoría *Flyweight*, que devolverá objetos *Flyweight*.

### Ejemplos de la JDK

* java.lang.Integer#valueOf(int), y también en las clases Boolean, Byte, Character, Short, Long y BigDecimal

Todos los métodos *valueOf()* de las clases de interés facilitarán la reducción de consumo de memoria.

A modo de ejemplo, tal y como vemos en el Javadoc del método *valueOf(...)* de la clase Integer, en él se cachean los números entre -128 y 127, de modo que no sea necesario retorna una nueva instancia de Integer, reduciendo el consumo de memoria.

{{< highlight java >}}/**
* Returns an {@code Integer} instance representing the specified
* {@code int} value.  If a new {@code Integer} instance is not
* required, this method should generally be used in preference to
* the constructor {@link #Integer(int)}, as this method is likely
* to yield significantly better space and time performance by
* caching frequently requested values.
*
* This method will always cache values in the range -128 to 127,
* inclusive, and may cache other values outside of this range.
* ...{{< / highlight >}}


## Proxy

El patrón *Proxy* es reconocible por la presencia de métodos de creación que devuelven una implementación de un tipo dado de clase abstracta o interfaz, que en realidad delega o utiliza una diferente implementación del tipo de clase abstracta o interfaz dado.

En el patrón *Proxy*, una clase *Proxy* es utilizada para controlar el acceso a otra clase por diferentes razones. Por ejemplo, un *Proxy* puede evitar la instanciación de un objeto hasta que ese objeto sea necesario, que puede ser útil si el objeto requiere un tiempo elevado, o un gran número de recursos, para su construcción.

Otro motivo para utilizar un Proxy es para controlar los derechos de acceso a un objeto. Una petición cliente podría requerir ciertas credenciales para poder acceder al objeto.

### Ejemplos de la JDK

* java.lang.reflect.Proxy

Si leemos el Javadoc del método estático *newProxyInstance()* de la clase *Proxy*, podemos observar que se denomina "*invocation handler*" a la clase abstracta o interfaz en la que se delegará la invocación de métodos sobre el objeto *Proxy*.

{{< highlight java >}}/**
* Returns an instance of a proxy class for the specified interfaces
* that dispatches method invocations to the specified invocation
* handler.
* …
*/{{< / highlight >}}


# Patrones de comportamiento

Los patrones de comportamiento ofrecen soluciones respecto a la interacción y responsabilidades entre clases y objetos, así como los algoritmos que encapsulan.

## Chain of Responsibility

El patrón *Chain of Responsibility* (Cadena de Responsabilidad, *CoR*) es reconocible por la presencia de métodos de comportamiento que invocan el mismo método en otra implementación distinta del mismo tipo de clase abstracta o interfaz en una cola de implementaciones.

Tendremos una serie de manejadores (*handlers*) de objetos que son encolados uno detrás de otro para manejar una petición hecha por un código cliente. Si el primer manejador no puede manejar la petición, ésta es reenviada al siguiente manejador, y es pasado por toda la cadena hasta que la petición alcanza un manejador que puede manejarla, o la cadena se termina, lo que ocurra primero.

En este patrón, el cliente está totalmente desacoplado del manejo de la petición, puesto que no conoce qué clase realmente se ocupará de ello.

En cuanto a la estructura de las clases, un manejador será representado por una interfaz *Handler*, que manejará la petición y dará acceso al siguiente manejador. Por otro lado, un *Handler* será implementado por un *Handler* Concreto.

### Ejemplos de la JDK

* java.util.logging.Logger#log()

El sistema de log por defecto de Java tiene una estructura jerárquica de árbol, en la que cada nivel suele utilizarse un convenio de nombres basado en el nombre del paquete de la clase a logear. Al ser estos paquetes jerárquicos, también lo será esta estructura de logs. En cada nivel, se dispondrá de un *Handler*, que será el responsable de escribir realmente el mensaje de log. Este *Handler* podrá estar asociado a la escritura en un archivo, o en un socket, o en una base de datos, o simplemente por consola.

Del Javadoc de la clase Logger:

{{< highlight java >}}* ...
* By default, loggers also publish to their parent's Handlers, recursively up the tree.
* ...{{< / highlight >}}


Podemos observar que en cada petición de log se publican esos mensajes de log de manera recursiva hacia arriba en el árbol que representa la estructura de logs, de modo que cada *Handler* desde el nodo responsable de la escritura hacia arriba realizará la operación de escritura correspondiente, demostrándose el patrón *Chain of Responsability*.

* javax.servlet.Filter#doFilter()

Si hablamos de Java Enterprise Edition, un objeto Filter es aquél que realiza tareas de filtrado sobre la petición actual (request) sobre un recurso, y sobre la respuesta de un recurso a esa petición (response). Aquellas clases que implementen la interfaz Filter, tendrá que implementar, entre otros, un método *doFilter(...)*:

{{< highlight java >}}public void doFilter(ServletRequest request, ServletResponse response,
                    FilterChain chain)
       throws IOException, ServletException;{{< / highlight >}}


al que hay que pasarle como parámetro una cadena de filtros, esto es, toda la cadena responsable de filtrar tanto las peticiones como las respuestas sobre los recursos de las aplicaciones web, de modo que pueda ir delegando la responsabilidad de filtrar las peticiones/respuestas en cada elemento de la cadena, que invocará igualmente el método *doFilter(...)*.

{{< highlight java >}}/**
* The <code>doFilter</code> method of the Filter is called by the
* container each time a request/response pair is passed through the
* chain due to a client request for a resource at the end of the chain.
* The FilterChain passed in to this method allows the Filter to pass
* on the request and response to the next entity in the chain.
* ...{{< / highlight >}}


En el Javadoc se observa con claridad el comportamiento del patrón.

## Command

El patrón *Command* es reconocible por la presencia de métodos de comportamiento en un tipo de clase abstracta o interfaz el cual invoca un método en una implementación de un tipo diferente de clase abstracta o interfaz que ha sido encapsulado por la implementación durante su creación.

En este patrón, una interfaz *Command* declara un método para ejecutar una acción en particular, denominado habitualmente *execute()*. Las clases *Command* concretas implementan ese método de la interfaz, el cual a su vez ejecuta la acción o el método apropiados de una clase *Receiver*, que está contenida en la clase concreta. La clase *Receiver* ejecutará finalmente la acción particular.

Además, una clase *Client* es responsable de crear un *Command* concreto, definiendo su *Receiver*. Una clase *Invoker* contendrá una referencia a un *Command*, teniendo un método que ejecute el *Command*, y este *Invoker* está totalmente desacoplado de la acción a realizar por el *Receiver*: el *Invoker* invoca un *Command*, y el *Command* ejecuta la acción apropiada de el *Receiver*. De este modo, el *Invoker* puede invocar comandos sin conocer los detalles de la acción a realizar. Además, este desacoplamiento significa que los cambios realizados en las acciones del *Receiver* no afectan directamente a la invocación de la acción

### Ejemplos de la JDK

* Todas las implementaciones de java.lang.Runnable

La interfaz *Runnable*, tal y como describe su Javadoc:

{{< highlight java >}}* ...
* This interface is designed to provide a common protocol for objects that
* wish to execute code while they are active.
* ...{{< / highlight >}}


define un contrato para ejecutar código una vez se invoque su método *run()*. Este método representa el método *execute()* descrito con anterioridad en este apartado. Las clases Receiver serán representadas por el código ejecutado dentro del método *run()*, que podrá o no estar encapsulado en una clase. Por otro lado, los Invoker serán aquellas clases que instancien a las implementaciones de *Runnable*, para ejecutar su método *run()*.

Un ejemplo de implementación es la clase *java.lang.Thread*, utilizada para ser ejecutada en diferentes hilos: cuando un desarrollador quiera ejecutar código en otro hilo, tendrá que instanciar en un Invoker un *Thread*, y encapsular su código (el *Receiver*) dentro del método run. En este caso, el *Command* concreto sería la clase *Thread*.

## Interpreter

El patrón *Interpreter* es reconocible por la presencia de métodos de comportamiento que devuelven un tipo o instancia estructuralmente diferente de la instancia dada.

### Ejemplos de la JDK

* java.text.Normalizer

La clase Normalizer transforma texto unicode en un texto equivalente según un formato dado, mediante el método *normalize(...)*, el cual utiliza una enumeración del tipo java.text.Normalizer.Form para identificar el tipo de transformación a realizar. El siguiente bloque de código explica cada una de las transformaciones a realizar.

{{< highlight java >}}/**
* This enum provides constants of the four Unicode normalization forms
* that are described in
* <a href="http://www.unicode.org/unicode/reports/tr15/tr15-23.html">
* Unicode Standard Annex #15 &mdash; Unicode Normalization Forms</a>
* and two methods to access them.
*
* @since 1.6
*/
public static enum Form {

   /**
    * Canonical decomposition.
    */
   NFD,

   /**
    * Canonical decomposition, followed by canonical composition.
    */
   NFC,

   /**
    * Compatibility decomposition.
    */
   NFKD,

   /**
    * Compatibility decomposition, followed by canonical composition.
    */
   NFKC
}{{< / highlight >}}


* Todas las subclases of java.text.Format

La clase Format es una clase abstracta base cuya misión principal es la de formatear, de una manera sensible al idioma que utiliza la aplicación, ciertos tipos de datos, tales como fechas, mensajes y números. De este modo, en el patrón los parámetros de entrada son textos que, mediante esta clase y sus implementaciones (NumberFormat, SimpleDateFormat, etc.) son transformados a un formato representación más adecuado al idioma que utilice la aplicación.

Por ejemplo, los separadores de números decimales en inglés o en castellano son diferentes, por tanto el número decimal 12345678.901, será formateado en inglés como 12,345,678.901, y en castellano como 12.345.678,901.

NOTA: Es importante destacar que el parseo o formateo no es parte del patrón *Interpreter*. Sin embargo, determinar el patrón y cómo aplicarlo, sí lo es.

## Iterator

El patrón *Iterator* es reconocible por la presencia de métodos de comportamiento que devuelven un diferente tipo al procesar una cola.

Este patrón permite el recorrido a través de los elementos de un conjunto de objetos mediante una interfaz estandarizada, que definirá las acciones que pueden ser realizadas. Estas acciones incluyen ser capaz de recorrer (*traverse*) todos los objetos, así como obtener cada uno de ellos.

Java dispone de una interfaz denominada *Iterator*, que es utilizada en un gran número de aplicaciones, para iterar sobre objetos, como por ejemplos las colecciones de Java. Podríamos escribir nuestro propio *Iterator* implementando *java.util.Iterator*.

### Ejemplos de la JDK

* Todas las implementaciones de java.util.Iterator

Esta interfaz permite iterar sobre una colección de elementos. Sus implementaciones más conocidas o utilizadas son las listas, los mapas y los conjuntos, en sus diferentes implementaciones. De este modo, en Java tendremos las interfaces *List*, *Map* y *Set*, y algunas de sus implementaciones, como son *ArrayList*, *LinkedList*, *HashMap*, *ConcurrentHashMap*, *HashSet*, o *TreeMap*, entre otras.

Además de esos tipos de colecciones, tenemos otras clases completamente diferentes que implementan el patrón, como es la clase *java.util.Scanner*, que permite escanear texto para buscar tipos primitivos y cadenas utilizando expresiones regulares, o la clase

En todas ellas aparece el patrón Iterator, pues disponen de tres métodos en la interfaz: *next()*, el cual retorna el siguiente elemento de la colección; *hasNext()*, el cual indica si existen más elementos tras el elemento actual; y *remove()*, que elimina el elemento actual.

Cabe destacar que el método *remove()* no pertenece al patrón Iterator, pero sí es mencionado para distinguirlo del siguiente ejemplo, las enumeraciones.

* Todas las implementaciones de java.util.Enumeration

Una clase que implementa Enumeration genera una serie de elementos, que serán recuperados uno a uno cada vez mediante la invocación del método *nextElement()*. Además, la interfaz proporciona un método para indicar si existe un siguiente elemento, *hasMoreElement()*, de modo que pueda recorrerse la colección sin salirse de ella.

Respecto a las diferencias entre los Iterator y las Enumeration, podemos indicar que los Iterators son exactamente iguales que las Enumerations, con la salvedad que en los primeros se pueden eliminar elementos de la colección a recorrer. De hecho Java recomienda el uso de Iterators en detrimento de Enumerations en implementaciones de los desarrolladores. Además, los nombres de los métodos de los Iterator son más cortos, lo que redunda en la facilidad de uso por parte del desarrollador.

## Mediator

El patrón Mediator es reconocible por la presencia de métodos de comportamiento que toman una instancia de un tipo diferente de clase abstracta o interfaz, normalmente utilizando el patrón Command, el cual delega/utiliza dicha instancia para realizar sus operaciones.

Este patrón centraliza la comunicación entre objetos mediante un objeto mediador. Esta centralización es útil al localizar en un único lugar las interacciones entre objetos, lo que aumenta la mantenibilidad del código, especialmente cuando el número de clases aumenta en una aplicación. Al ocurrir esta comunicación en el mediador en lugar de directamente con los otros objetos, este patrón refuerza el concepto de bajo acoplamiento entre objetos.

Las clases que comunican con el mediador son conocidas como Colleages. La implementación del mediador se denomina ConcreteMediator, pudiendo tener una interfaz que determine la comunicación entre Colleages. Éstos conocen a su mediador, así como el mediador conoce a sus Colleages.

### Ejemplos de la JDK

* java.util.Timer

Del Javadoc de la clase *Timer* se desprende que un *Thread* puede disponer de un grupo de tareas, del tipo *TimerTask*, que encolará en un Timer para ser ejecutadas de manera secuencial, de este modo el *Thread* no sabe nada sobre la ejecución de las tareas, sino que lo delega en el objeto Timer para ello.

{{< highlight java >}}/**
* A facility for threads to schedule tasks for future execution in a
* background thread.  Tasks may be scheduled for one-time execution, or for
* repeated execution at regular intervals.
*
* <p>Corresponding to each <tt>Timer</tt> object is a single background
* thread that is used to execute all of the timer's tasks, sequentially.
* Timer tasks should complete quickly.  If a timer task takes excessive time
* to complete, it "hogs" the timer's task execution thread.  This can, in
* turn, delay the execution of subsequent tasks, which may "bunch up" and
* execute in rapid succession when (and if) the offending task finally
* completes.
* ...{{< / highlight >}}


La clase Timer internamente utiliza un objeto *TimerQueue*, para realizar las planificaciones.

Si vemos cualquiera de los métodos schedule(...) de la clase, vemos que internamente llaman a un método privado *sched(...)* el cual añade a la cola la TimerTask y le aplica la planificación en el tiempo adecuada.

De este modo, el patrón *Mediator* queda reflejado en la clase *Timer*, y sus *Colleagues* son representados por todas aquellas clases que planifican tareas sobre ella. La clase abstracta *TimerTask* es la que determina la comunicación entre el *Mediator* y sus *Colleagues*.

* java.util.concurrent.Executor

La clase *Executor* es capaz de recibir objetos *Runnable* para ejecutarlos de manera totalmente desacoplada de aquellas clases que lo utilizan, sin tener por qué conocer estas clases cómo realizar la ejecución del código dentro de los objetos *Runnable*. Su Javadoc es muy descriptivo:

{{< highlight java >}}/**
* An object that executes submitted {@link Runnable} tasks. This
* interface provides a way of decoupling task submission from the
* mechanics of how each task will be run, including details of thread
* use, scheduling, etc.  An <tt>Executor</tt> is normally used
* instead of explicitly creating threads.
* ...{{< / highlight >}}


Respecto al patrón *Mediator*, la interfaz de comunicación sería *Runnable*, y los *Colleagues* serían aquellos que utilizan el *Executor* para lanzar tareas.

* java.lang.reflect.Method#invoke()

El paquete reflect del lenguaje de programación Java permite acceder a los miembros de las clases (atributos, constructores y métodos) para usar sus declaraciones, para leer o cambiar los valores de los atributos de clase, o incluso la invocación de los métodos.

En este caso, la clase Method proporciona información y acceso a los métodos de una clase o interfaz, incluyendo tanto métodos de clase como métodos de instancia.

Según el patrón *Mediator*, representado por la clase *Method*, la interfaz de comunicación sería la clase *Object*, pues el primer parámetro del método invoke(...) es el objeto sobre el cual invocar el método en cuestión. Los *Colleagues* serían aquellas clases que utilicen reflexión para acceder a métodos de otras clases, no necesitando conocer el comportamiento de esos métodos, sino invocándolos.

No obstante, y salvo en contadas y necesarias ocasiones, no es recomendable el uso de la reflexión para el acceso a los miembros y métodos de una clase, ya que si ésta cambia, los clientes o *Colleagues* no serán informados de este cambio, ni siquiera en Build time.

## Memento

El patrón Memento es reconocible por la presencia de métodos de comportamiento que internamente cambian el estado de una instancia.

Este patrón es utilizado para almacenar el estado de un objeto, de modo que este estado puede ser restaurado en algún momento futuro. Los datos de este estado guardado en el objeto memento, no son accesibles fuera del objeto, por lo que no se puede salvar o guardar fuera de él. Ésto protege la integridad de los datos del estado salvado.

En cuanto a las clases, tendremos una clase *Originator*, que representa el objeto del cual queremos salvar su estado. Una clase *Memento* representa al objeto que almacena el estado del *Originator*, siendo además por lo general una clase privada interna al *Originator*. Como resultado, el *Originator* tiene acceso a los campos/atributos del objeto *Memento*, no así cualquier clase externa. Esto significa que la información del estado puede ser transferida entre el *Memento* y el *Originator* dentro de éste último, pero las clases externas no tienen acceso a los datos de estado almacenados en el *Memento*.

El patrón Memento también utiliza una clase *Caretaker* (Cuidadora). Éste es el objeto responsable del almacenaje y de la recuperación del estado del *Originator*, a través del objeto Memento. Al ser la clase *Memento* una clase interna privada, este tipo no será visible al *Caretaker*. Por ello, el objeto *Memento* necesita ser almacenado como un objeto de tipo *Object* dentro del *Caretaker*.

### Ejemplos de la JDK

* java.util.Date

Los métodos setter de la clase utilizan el patrón Memento, puesto que internamente se almacena un tipo primitivo *long*, el cual sólo puede ser recuperado, no modificado directamente. Para cambiar ese estado interno será necesario utilizar los mencionados métodos setter, que necesitarán como parámetros de entrada normalmente enteros. La clase *Date* internamente normalizará esos enteros para componer el estado interno definitivo, en función del método llamado.

* Todas las implementaciones de java.io.Serializable

Las implementaciones de Serializable asumen la responsabilidad de salvar y restaurar el estado de todos sus atributos. Si tuviésemos una estructura de clases y subclases basadas en la herencia, por la cual un ascendiente no fuera Serializable, pero sí sus descendientes, éstos tendrían que garantizar además que son capaces de salvar y restaurar los atributos de su superclase, tanto de los atributos public, como de los protected, e incluso los package (si fueran accesibles).

El estado interno del patrón Memento queda reflejado en los valores de los atributos de clase, siendo el *Originator* la misma clase, que debe implementar la interfaz *Serializable*. La clase *CareTaker* vendría identificada también por la propia clase, que podría disponer de varios métodos para salvar y restaurar sus atributos de manera adecuada. Estos métodos tendrían la siguiente forma:

{{< highlight java >}}* ...
* private void writeObject(java.io.ObjectOutputStream out)
*     throws IOException
* private void readObject(java.io.ObjectInputStream in)
*     throws IOException, ClassNotFoundException;
* private void readObjectNoData()
*     throws ObjectStreamException;
* ...{{< / highlight >}}


Como puede observarse, estos métodos leerían y escribirían en unos *Streams* de Object, tanto de entrada como de salida, representando el comportamiento de la clase *CareTaker* en la propia clase.

## Observer, o Publisher/Subscriber

El patrón Observer, o *Publisher/Subscriber* (clásico problema de los productores/consumidores) es reconocible por la presencia de métodos de comportamiento que invocan un método de una instancia de otro tipo de clase abstracta o interfaz, dependiendo del propio estado.

En este patrón, un objeto denominado *Subject* (Sujeto) mantiene una colección de objetos denominados *Observers* (Observadores). Cuando el *Subject* cambia, notifica a los *Observers*. Además, los *Observers* pueden ser añadidos o eliminados de la colección de observadores del sujeto. Los cambios en el estado del *Subject* pueden ser pasados a los *Observers* de manera que éstos puedan cambiar su propio estado para reflejar el cambio.

El *Subject* implementa una interfaz que define métodos para añadir y eliminar *Observers* de su colección de observadores. Esta interfaz también posee un método de notificación, que debería ser llamado cada vez que el estado del *Subject* cambia. Esto notificaría a los observadores de que el estado de *Subject* ha cambiado. Por su parte, los *Observers* implementan una interfaz con un método para actualizar al propio *Observer*. Este método de actualización es invocado por todos y cada uno de los observadores dentro del método de notificación del *Subject*. De esta manera, al ocurrir la comunicación a través de una interfaz, cualquier *Observer* concreto que implemente la interfaz puede ser actualizado por el *Subject*, resultando en un bajo acoplamiento entre las clases *Subject* y *Observer*.

### Ejemplos de la JDK

* java.util.Observer/java.util.Observable (rarely used in real world though)

La pareja *Observer* (interfaz) y *Observable* (clase) representan claramente el patrón Observer. La interfaz *Observer* dispone de un método *update()*, que recibe un *Observable* como parámetro de entrada, que será invocada cuando el objeto *Observable* notifique a todos sus *Observers*. Por otro lado, la clase *Observable* dispone de los métodos descritos por el patrón: añadir o eliminar un *Observer*, notificar a los *Observers*, etc.

* All implementations of java.util.EventListener (practically all over Swing thus)

La interfaz *EventListener* es únicamente una interfaz de marcado para identificar todas aquellas clases o interfaces que van a tener el comportamiento de un Listener, que en general define el mismo comportamiento que el patrón Observer. Según esto, existen múltiples clases dentro de la JVM que implementan esta interfaz *EventListener*, como por ejemplo *java.awt.ActionListener* o *java.awt.WindowListener*.

En general, casi todas las clases de **_SWING_** están construidas siguiendo este patrón, puesto que los objetos gráficos suelen responder a eventos, y a estos eventos suelen suscribirse otros objetos para responder ante ellos, de modo que cuando se dispare el evento se pueda notificar a todos sus Listeners.

De este modo, en *ActionListener* tendremos un método *actionPerformed(ActionEvent)*, y en *WindowListener* tendremos varios más: *windowOpened(WindowEvent)*, *windowClosing(WindowEvent)*, *windowClosed(WindowEvent)*, *windowIconified(WindowEvent)*. Estos métodos notificarán a todos aquellos que se hayan suscrito, demostrando el patrón.

## State

El patrón State es reconocible por la presencia de métodos de comportamiento que cambian su comportamiento dependiendo del estado de la propia instancia, que puede ser controlada externamente.

La idea detrás del patrón State es que un objeto pueda cambiar su comportamiento en función del su estado. Para ello, tendremos una clase *Context*, que tiene una referencia *State* a una instancia concreta de *State*. La interfaz *State* declara métodos particulares que representarán los comportamientos propios de cada estado en particular. Los *State* concretos implementarán estos comportamientos. Si cambiáramos el *State* concreto de un *Context*, estaríamos cambiando su comportamiento. En esencia, en el patrón State, una clase *Context* puede actuar como clases diferentes dependiente de su estado.

Este patrón evita la utilización de sentencias *switch* e *if* para cambiar el comportamiento.

### Ejemplos de la JDK

* javax.faces.lifecycle.LifeCycle#execute(FacesContext)

La clase *LifeCycle* controla el procesamiento del ciclo de vida al completo de una petición en particular dentro del framework JSF (*Java Server Faces*), siendo responsable de ejecutar todas las fases que han sido definidas por la especificación de JSF en el orden especificado. Su método *execute(...)* recibe como parámetro una instancia de *FacesContext*, que determinará la ejecución de las fases, pudiendo alterar el orden definido en función del estado del contexto.

## Strategy

El patrón Strategy es reconocible por la presencia de métodos de comportamiento en un tipo de clase abstracta o interfaz que invocan un método en una implementación de un tipo diferente de clase abstracta o interfaz, el cual ha sido pasado como parámetro de un un método durante la implementación del patrón.

En este patrón, los diferentes algoritmos se representan como clases concretas *Strategy*, y suelen compartir una interfaz común *Strategy*. Un objeto *Context* contiene la referencia a la *Strategy*. Cambiando la *Strategy* del *Context*, podremos obtener diferentes comportamientos, que aunque sean diferentes, pueden ser todos ellos operados con los datos del *Context*.

El patrón *Strategy* puede ser utilizado como una forma de composición, como alternativa a la creación de subclases. En lugar de proporcionar los diferentes comportamientos a través de subclases que sobreescriben los métodos de sus superclases, el patrón *Strategy* permite que diferentes comportamientos sean localizados en clases concretas *Strategy*, que comparten la interfaz común *Strategy*. La clase *Context* contendrá una referencia a un *Strategy*.

### Ejemplos de la JDK

* java.util.Comparator#compare()

Cada clase que implementa la interfaz *Comparator*, tiene que implementar el método *compare()*, que recibe dos objetos a comparar. Será la implementación la que decida cómo debe realizarse la comparación teniendo como únicos requisitos:

* el signo de las comparaciones entre ambos objetos debe ser igual al signo contrario de comparar ambos objetos de manera inversa: **_signo(compare(a,b))==-signo(compare(b,a))_**

* las comparaciones deben ser transitivas: si **compare(x,y) > 0** y **compare(y,z) > 0**, entonces **compare (x,z) > 0**

* si **compare(x,y)==0**, entonces el **signo(compare(x,z))==signo(compare(y,z))**, para todo z.

Un ejemplo de uso de estas comparaciones lo podemos encontrar en las clases *java.util.Collections* y *java.util.Arrays*, que disponen de unos métodos *sort(...)*, que ordenan la colección pasada por parámetro utilizando de manera interna el método *compare()* de las clases de la colección.

En relación con el patrón Strategy, la implementación concreta de *Strategy* sería cada *Comparator* concreto. El *Context* vendría determinado por quien invocara la comparación, que podría utilizar una estrategia u otra cambiando el *Comparator*.

* javax.servlet.http.HttpServlet#service()

El método *service()* recibe una petición HTTP y la redirige al método *doXXX*() adecuado en función del método de la petición: *PUT, GET, POST, DELETE, HEAD, OPTIONS, TRACE*. Estos métodos toman como parámetros una instancia de *HttpServletRequest* y una instancia de *HttpServletResponse*, y el implementador tiene la obligación de procesarlas, sin mantener una referencia a ellas en la clase.

En comparación con el patrón *Strategy*, la implementación de *HttpServletRequest* correspondería con una *Strategy* concreta; y cualquiera que utilice el método *service()*, por ejemplo un *Servlet*, correspondería con el *Context*.

## Template Method

El patrón Template Method es reconocible por la presencia de métodos de comportamiento que tienen un comportamiento predefinido definido por un tipo de clase abstracta.

Este patrón utiliza la herencia para distribuir el comportamiento. Para ello, un método, denominado el "*método plantilla, o template method*" define los pasos de un algoritmo. La implementación de esos pasos, por ejemplo métodos, puede ser derivado a las subclases. De este modo, un algoritmo en particular es definido en el *template method* en una clase abstracta, pero cada paso específico puede ser definido en las subclases. Por esta misma razón, el algoritmo es implementado en la clase abstracta, y cada uno de sus pasos debe ser declarado también en la clase abstracta como abstracto (*abstract method*), e implementado en las subclases.

Un ejemplo podría ser el siguiente: supongamos tenemos una clase Comida, que es una clase abstracta con un método plantilla llamado *hacerLaComida()*, el cual define los pasos involucrados en comer. Podríamos definir el método como final para evitar sea sobreescrito. El algoritmo definido por el método *hacerLaComida()* consistiría en cuatro pasos:

1. prepararIngredientes()

2. cocinar()

3. comer()

4. limpiar()

El método *comer()* podría ser implementado incluso aunque las subclases lo implementen. Los otros tres métodos serían declarados como abstractos, de modo que las subclases tengan que implementarlos.

### Ejemplos de la JDK

* Todos los métodos no abstractos de las clases java.io.InputStream, java.io.OutputStream, java.io.Reader y java.io.Writer.

Estas clases tienen todas una serie de métodos abstractos que deben implementar sus subclases. Estos métodos serán los pasos específicos de cada implementación dentro de un algoritmo común a todas ellas. El patrón TemplateMethod queda muy bien reflejado de este modo.

Un ejemplo del código sería el método *read()* de la clase *InputStream*:

{{< highlight java >}}public int read(byte b[], int off, int len) throws IOException {
   if (b == null) {
       throw new NullPointerException();
   } else if (off < 0 || len < 0 || len > b.length - off) {
       throw new IndexOutOfBoundsException();
   } else if (len == 0) {
       return 0;
   }

   int c = read();
   if (c == -1) {
       return -1;
   }
   b[off] = (byte)c;

   int i = 1;
   try {
       for (; i < len ; i++) {
           c = read();
           if (c == -1) {
               break;
           }
           b[off + i] = (byte)c;
       }
   } catch (IOException ee) {
   }
   return i;
}{{< / highlight >}}


Como puede observarse en el bloque de código anterior, las invocaciones al método read (destacado en amarillo) definen unos pasos no implementados en la clase InputStream, pero que sus descendientes deben implementar, completando el algoritmo definido para el método no abstracto *read(...)*.

* Todos los métodos no abstractos de las clases java.util.AbstractList, java.util.AbstractSet y java.util.AbstractMap.

Del mismo modo que en el ejemplo anterior, los métodos no abstractos de estas clases definen un algoritmo general compuesto de varios pasos, que serán implementados en sus subclases.

{{< highlight java >}}public boolean equals(Object o) {
   if (o == this)
       return true;

   if (!(o instanceof Set))
       return false;
   Collection c = (Collection) o;
   if (c.size() != size())
       return false;
   try {
       return containsAll(c);
   } catch (ClassCastException unused)   {
       return false;
   } catch (NullPointerException unused) {
       return false;
   }
}{{< / highlight >}}


## Visitor

El patrón Visitor es reconocible por la presencia de dos tipos de clases abstractas o interfaces, las cuales tienen métodos que toman la una el otro tipo de clase abstracta o interfaz, de modo que uno de ellos invoca al método del otro, y el otro ejecuta la estrategia deseada sobre él.

Este patrón es utilizado para simplificar operaciones en agrupaciones de objetos relacionados. Estas operaciones serán realizadas por el *visitor* en lugar de colocar su código en las clases que visita. De esta manera, el uso de este patrón conlleva a una mayor mantenibilidad del código. Además, evita el uso del operador *instanceof* para calcular datos sobre clases similares.

Para la implementación de este patrón, tendremos una interfaz Visitor, que declara métodos *visit()* para cada uno de los diferentes tipo de elementos que pueden ser visitados. Un *Visitor* concreto implementará la interfaz *Visitor*, y por tanto los métodos *visit()* de la interfaz. Estos métodos conforman las operaciones que deberían ser realizadas por el objeto *visitor *en un elemento visitado.

Las clases relacionadas que serán visitadas implementan una interfaz *Element*, que declara un método *accept()*, que tomará como argumento al objeto *visitor*. Los *Element* concretos implementarán la interfaz *Element*, así como el método *accept()*, en el cual el método *visit()* del *visitor* será invocado con *this*, el objeto actual del Elemento concreto. Como resultado, un elemento toma el *visitor*, y éste realiza sus operaciones sobre dicho elemento.

### Ejemplos de la JDK

* java.nio.file.FileVisitor y SimpleFileVisitor

La clase FileVisitor permite visitar todos los elementos de un sistema de archivos, mediante el patrón Visitor, descrito en esta sección. En esta interfaz se definen los diferentes métodos visit() característicos del patrón.

Un visitor concreto sería SimpleFileVisitor, que implementa FileVisitor, y sería utilizado en la clase FileTreeWalker, al que se le pasa como parámetro un Visitor, con las consiguientes operaciones de visita de elementos.

# Referencias

- Design patterns: [http://www.avajava.com/tutorials/categories/design-patterns](http://www.avajava.com/tutorials/categories/design-patterns)

- JVM Overview: [http://docs.oracle.com/javase/7/docs/technotes/guides/index.html#jre-jdk](http://docs.oracle.com/javase/7/docs/technotes/guides/index.html#jre-jdk)
