---
title: "Design Patterns in the JDK"
date: 2016-02-21T13:50:43+02:00
description: "A tour of the Java SE platform components and of the GoF design patterns you can find in the JDK, with examples taken from the JDK source."
categories: java
tags: [design patterns, jdk, jvm, patterns, software patterns]
type: post
weight: 25
translationKey: design-patterns-in-the-jdk
translatedFrom: 76c0fc6
aliases: ["/posts/2016-02-21-patrones-jvm/"]
---

# Introduction

This document lists the most common design patterns (creational, structural and behavioral) used at the different stages of software development, as they apply to the classes of the Java virtual machine, in the Java 7.0.60 JDK.

# Goal

The main goal of this document is to get acquainted with the Java programming language platform, its different elements, and the design patterns used to build it.

To that end, the document first presents the Java platform and lists all of its components, so that you have an overview of each element.

Next, it lists the main software design patterns (creational, structural and behavioral) and, for each one, the examples found in the Java platform that follow the pattern.

Note that the Java platform analyzed here is Oracle's implementation. Oracle acquired Sun Microsystems in 2010, and Sun had owned the Java platform until then.

# The Java platform

Oracle has two products that implement the *Java Platform Standard Edition* (Java SE) 7: the *Java SE Development Kit* (**JDK**) 7 and the *Java SE Runtime Environment* (**JRE**) 7.

JDK 7 is a superset of JRE 7, so it contains everything in JRE 7, plus tools such as the compilers and *debuggers* needed to develop applications.

JRE 7, on the other hand, provides the libraries, the Java Virtual Machine (**JVM**) and other components to run applications written in the Java programming language.

The following conceptual diagram shows the components of Oracle's Java SE products:

![Oracle Java SE components](/images/posts/2016-02-21-patrones-jvm/jvm_diagram.png)

The conceptual diagram groups the Java component technologies into layers. The list below names those layers, from top to bottom, and the technologies that belong to each one. The technologies in a lower layer serve as the foundation for those in a higher layer.

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

The JDK consists of all the layers above.

The JRE consists of the following layers:

**Deployment**

**User Interface Toolkits**

**Integration Libraries**

**Other Base Libraries**

**lang and util Base Libraries**

**Java Virtual Machine**

The Java SE API consists of the following layers:

**User Interface Toolkits except JavaFX**

**Integration Libraries**

**Other Base Libraries**

**lang and util Base Libraries**

Let's now look at the different elements of the platform to get an overall picture of it.

## JRE and JDK

Oracle provides two main software products within the *Java Platform Standard Edition* (Java SE) 7 family:

### Java SE Runtime Environment (JRE)

The JRE provides the libraries, the virtual machine and other components to run applications written in the Java programming language. This runtime environment can be redistributed along with applications, so that they do not depend on the environment they run in.

### Java SE Development Kit (JDK)

The JDK includes the JRE plus command-line development tools, such as compilers and *debuggers*, that are necessary or useful for developing applications.

## The Java programming language

It is a general-purpose, concurrent, strongly typed, class-based, object-oriented language. It is normally compiled to a set of bytecode instructions and a binary format defined by the JVM specification.

## Java Virtual Machines (JVMs)

The JVM is an abstract computing machine that has an instruction set and manipulates memory at runtime. The JVM has been ported to different platforms to provide independence from both the hardware and the operating system.

The Java SE platform provides two implementations of the JVM:

### Java HotSpot Client VM

The client virtual machine (**VM**) is an implementation for platforms typically used by client applications. The client VM is tuned to reduce startup time and memory footprint. It can be invoked with the *-client* command-line option when running the application.

### Java HotSpot Server VM

The server VM is an implementation designed for maximum program execution speed, balancing startup time and memory consumption. It can be invoked with the *-server* command-line option when running the application.

## Base libraries

This is where the classes and interfaces that provide the basic features and fundamental functionality of the platform live.

## Lang and util packages

They provide the fundamental classes *Object* and *Class*, wrapper classes for the primitive types, and a basic math class, among others.

### Math

The *Math* package includes libraries for floating-point and arbitrary-precision arithmetic.

### Monitoring and Management

It includes comprehensive monitoring and management support for the Java platform: the *Monitoring* and *Management* API for the JVM, the *Monitoring* and *Management* API for the *Logging* tools, *jconsole* and other monitoring tools, the Java Management Extensions (*JMX*), and Oracle's platform extensions.

### Package version identification

Package versioning makes version control easier at the package level, so that applications can identify, at runtime, the version of the JRE, the VM and the class package.

### Object references

Object references support a limited degree of interaction with the garbage collector (*GC*). A program can use a reference object to maintain a reference to some other object in such a way that the latter object can still be reclaimed by the collector. A program can also ask to be notified some time after the collector has determined that the reachability of a given object has changed.

Object references are therefore useful for building simple caches, as well as caches that are cleared when memory runs low; for implementing mappings that do not prevent their keys or values from being reclaimed; and for scheduling *pre-mortem* cleanup actions in a more flexible way than Java's traditional finalization mechanisms.

### Reflection

*Reflection* lets Java code discover information about the fields, methods and constructors of loaded classes, and use those reflected fields, methods and constructors to operate on their counterpart objects, within security restrictions. The API helps applications that need access to the public members of a target object (based on its runtime class), or to the members declared by a given class. Programs can also suppress this reflective access.

### Collections framework

A collection is an object that represents a group of objects. The collections framework is a unified architecture for representing collections, which allows them to be manipulated independently of the details of their representation. It therefore reduces programming effort while increasing performance. It allows interoperability among unrelated APIs, reduces the effort of designing and learning new APIs, and fosters software reuse.

### Concurrency utilities

The concurrency utility packages provide a powerful, extensible framework of high-performance threading utilities, such as thread *pools* and blocking queues. This package frees the programmer from having to write these utilities by hand, in the same way the *Collections* framework does for data structures. In addition, these packages provide low-level primitives for advanced concurrent programming.

### Java Archive (JAR)

JAR is a platform-independent file format that aggregates many files into one. A JAR file can package multiple Java applications together with the components they need: .class files, images, sounds, properties files, and so on. A JAR file can also be downloaded into a browser in a single HTTP transaction, which noticeably improves download speed.

The JAR format also supports compression, which reduces the file size and likewise the download time. In addition, the application author can digitally sign the entries of a JAR file to authenticate their origin.

### Logging

The *Logging* APIs make it easier to deploy and maintain software at the customer's site, by producing log reports suitable for analysis by end users, system administrators, field engineers and software development teams. The *Logging* APIs capture information such as security failures, configuration errors, performance bottlenecks, and/or bugs in the application or the platform.

### Preferences

The *Preferences* API gives applications a way to store and retrieve user and system preferences, as well as configuration data. The data is stored persistently in an implementation-dependent backing store. There are two separate trees of preference nodes, one for user preferences and one for system preferences.

## Other base packages

### I/O

The *java.io* and *java.nio* packages provide a rich set of APIs to handle the input/output (I/O) of an application. Their functionality includes file and device I/O, object serialization, *buffer* management, and character set support. In addition, the APIs support features for scalable servers, including multiplexed, non-blocking I/O, memory mapping and file locking.

### Object serialization

Object serialization extends the core Java I/O classes to objects. It supports encoding objects, and the objects reachable from them, into a stream of bytes, and rebuilding the object graph from that stream of bytes.

Serialization is used for lightweight persistence and for communication over *sockets* or RMI (*Remote Method Invocation*).

### Networking

It provides classes for networking functionality, including addressing, handling of URLs and URIs, connecting to servers through *sockets*, and network security, among others.

### Security

It offers APIs related to security functionality, such as configurable access control, authentication and authorization, cryptography, and secure communication over the Internet, among others.

### Internationalization

These APIs make it easier to develop internationalized applications. Internationalization (**_i18n_**) is the process of designing an application so that it can be adapted to various languages and regions without engineering changes.

### JavaBeans™ component API

It contains classes related to developing *beans*, components based on the *JavaBeans™* architecture that can be composed together as part of building an application.

### Java Management Extensions (JMX)

The **JMX** API is a standard API for managing and monitoring resources such as applications, devices, services and the JVM. It typically includes querying the application's configuration, and also allows changing it. It can also accumulate statistics about the application's behavior, and notify of state changes and error conditions. The JMX API includes remote access, so that a remote management program can interact with a running application for the purposes above.

### XML (JAXP)

The Java platform provides a rich set of APIs for processing XML documents and data.

### Java Native Interface (JNI)

**JNI** is a standard programming interface for writing native Java methods and embedding the JVM into native applications. Its primary goal is binary compatibility of native method libraries across all implementations of the JVM on a given platform.

### Extension mechanism

There are *Optional* packages, which are Java classes (and any associated native code) that application developers can use to extend the core functionality of the platform. This extension mechanism lets the JVM use the classes of an optional extension in the same way it would use the classes of the Java platform. In addition, the mechanism provides a way for the required optional packages to be retrieved from specified URLs when they are not already installed in the JDK or the JRE.

### Endorsed standards override mechanism

An *endorsed* standard is a Java API defined through a standards process other than the JCP (*Java Community Process SM*). Since these endorsed standards are defined outside the JCP, it is anticipated that they may be revised between releases of the Java platform. To take advantage of new revisions of those endorsed standards, developers and software vendors must use this mechanism to provide versions of an endorsed standard newer than those included in the Java platform as released by Oracle.

## Integration libraries

### Java Database Connectivity (JDBC)

The **JDBC™** API provides universal data access for the Java programming language. Using the JDBC 3.0 API, developers can write applications that can access virtually any data source, from relational databases to spreadsheets and flat text files. JDBC technology provides a common base on which tools and interfaces can be built.

### Remote Method Invocation (RMI)

**RMI** enables the development of distributed applications by providing remote communication between programs that are both written in the Java language. RMI allows an object running in one JVM to invoke methods on another object running in another JVM, which may even be on a different machine.

### Java IDL (CORBA)

Java IDL technology adds **CORBA** (*Common Object Request Broker Architecture*) capabilities to the Java platform, providing standards-based interoperability and connectivity. Java IDL enables distributed Java Web applications to transparently invoke operations on remote network services using the industry-standard IDL (*Object Management Group Interface Definition Language*) and IIOP (*Internet Inter-ORB Protocol*), defined by the *Object Management Group* (OMG). The runtime components include a Java ORB for distributed computing using IIOP communication.

### Remote Method Invocation over Internet Inter-ORB Protocol (RMI-IIOP)

The RMI programming model makes it possible to program CORBA applications and servers through the RMI API. You can choose to work entirely within the Java programming language, using JRMP (*Java Remote Method Protocol*) as the transport, or to work with other CORBA-compliant programming languages, using IIOP. For example, the *rmic* compiler is used to generate the code needed to connect an application through IIOP with other applications written in any CORBA-compliant language. To work with CORBA applications in other languages, IDL can be generated from Java programming language interfaces by using the *rmic* compiler with the *-idl* option. To generate IIOP *stubs* and tie classes, you can use the *-iiop* option.

### Scripting for the Java platform

Java SE 6 includes the JSR 223 specification: the *Scripting for the Java™ Platform* API. This is a framework by which Java applications can host script engines. Oracle's implementation of Java SE 6 includes a sample engine based on *Mozilla Rhino*. The framework also supports third-party engines, through a service discovery mechanism packaged in JAR files. You can also add any JSR-223-compliant script engine to the CLASSPATH and access it the same way as from conventional Java applications.

### Java Naming and Directory Interface™ (JNDI)

The **JNDI** API provides naming and directory functionality for applications written in the Java programming language, and it is designed to be independent of any specific directory or naming service implementation. As a result, a wide variety of services, new, emerging and already deployed, can be accessed in this common way. The JNDI architecture consists of an API and an SPI (*Service Provider Interface*). Java applications use this API to access a variety of directory and naming services. The SPI, on the other hand, lets that variety of services be plugged in transparently, allowing Java applications to use the JNDI API to access them.

## User interface libraries

### Input Method Framework

This framework enables collaboration between text editing components and input methods for entering text. Input methods are software components that let the user enter text in a simple way, for example with a keyboard. They are normally used to enter Japanese, Chinese or Korean (languages with thousands of different characters) on keyboards with far fewer keys. However, the framework also supports input methods for other languages, as well as completely different input mechanisms, such as handwriting or speech recognition.

### Accessibility

With the Java Accessibility API, developers can create Java applications that are accessible to people with disabilities. These applications will be compatible with assistive technologies such as screen readers, speech recognition systems or Braille displays.

### Print service

The Java Print Service API allows printing on all Java platforms, including those that require a very small memory footprint, such as Java ME (Mobile Edition).

### Sound

The Java platform includes a powerful API for capturing, processing and playing audio and MIDI (*Musical Instrument Digital Interface*) data. This API is backed by a fairly efficient sound engine, which guarantees high-quality audio mixing, as well as synthesis of MIDI data.

### "*Drag and Drop*" data transfer

"*Drag & Drop*" enables the transfer of files between the Java programming language and native applications, between Java applications, or within the same single Java application.

### Image I/O

The Java Image I/O API provides a pluggable architecture for working with images stored in files and accessed over the network. The API provides a framework for adding plugins for specific formats.

### Java 2D graphics and imaging

The Java 2D™ API is a set of classes for advanced 2D graphics. It covers lines, text and images in a single, comprehensive model. The API provides extensive support for image compositing and alpha channels. It also provides a set of classes for defining precise color spaces, and a rich set of operators for displaying images.

### Abstract Windowing Toolkit (AWT)

AWT provides APIs for building user interface components such as menus, buttons, text fields, dialog boxes and checkboxes, and for handling user input through those components. AWT also allows rendering simple shapes such as ovals and polygons, and lets the developer control the layout of the user interface and the fonts used by their applications.

### Swing

The *Swing* APIs also provide graphical (GUI) components for use in user interfaces. They are written in Java with no dependency on code specific to the GUI facilities of the operating system the application runs on. This allows Swing GUI components to have a "pluggable" look and feel that can be replaced at runtime.

### JavaFX

Starting with Java SE 7 Update 2, the JavaFX SDK is included. This platform is the evolution of the client platform, designed to let Java application developers easily create and deploy rich Internet applications (RIA, *Rich Internet Applications*) that behave consistently across multiple platforms.

## Deployment

### Java Deployment

Topics related to deployment include installation, initial configuration, updating, redistribution and so on, more specifically:

* Installing the platform on a computer.

* Configuration options in the Java Control Panel.

* Writing applications in Java.

* Authoring web pages that invoke applets or download and launch applications.

* Availability of Java-related files on web servers.

* Updating the Java platform on a computer.

## Tool specifications

### Debugger architecture

The Java Platform Debugger Architecture (*Java Platform Debugger Architecture*, JPDA) defines the architecture and specifications for using debuggers in development environments.

### VM tool interface (*Java Virtual Machine Tool Interface*, JVM TI)

JVM TI is a specification for inspecting the state and controlling the execution of applications running in the JVM. It also deprecates the Java Virtual Machine Profiler Interface (JVMPI).

### Javadoc tool

Javadoc is a tool that parses the declarations and documentation comments of source files to produce a set of HTML pages describing the elements of the application. The Doclet API provides a mechanism for clients to inspect the structure of programs and libraries at the code level, including Javadoc comments embedded in the code. This API can be used by custom doclets to generate documentation.

### Annotation processing

The *apt* tool is a command-line utility for annotation processing. It includes a set of reflective APIs that support the infrastructure for processing a program's annotations. These reflective APIs provide a read-only, build-time view of the structure of the program's source code. They are also designed to model the type system of the Java programming language after the addition of *Generics*.

### Dynamic Attach

The *com.sun.tools.attach* package contains an Oracle proprietary extension that allows an application to attach to a running JVM. Once attached, an agent tool can be installed in that JVM.

### JConsole API

The *com.sun.tools.jconsole* package contains an Oracle proprietary extension that provides a programmatic interface to access the *JConsole* tool.

## JDK utilities and tools

These utilities and tools cover the basic tools, such as *javac, java, javadoc, apt, appletviewer, jar, jdb, javah, javap, extcheck*; security, internationalization, RMI, IDL and RMI-IIOP, deployment, Java Plug-In, Java Web Start, monitoring and management tools, as well as troubleshooting tools.

## Platforms

Oracle provides JDK and JRE implementations for Microsoft Windows, Linux and Solaris.

Other companies may provide implementations of the Java platform for other operating systems, such as Macintosh, AIX, etc.

# Creational patterns

Creational design patterns are software design patterns that solve problems of instance creation, helping to encapsulate and abstract that creation.

## Abstract Factory

The *Abstract Factory* pattern is recognizable by creational methods that return the factory itself, which can in turn be used to create objects of another type, whether abstract or an interface.

An **abstract factory** is a factory that returns factories. And why might it be useful to add one more layer of abstraction? A regular factory can be used to create sets of related objects. An abstract factory returns factories. This way, an abstract factory is used to return factories that can be used to create sets of related objects.

An example could be a Renault Megane car factory, which returns objects of type *CarPart* associated with the Renault Megane. We could also have a Citröen C4 car factory that returns *CarPart* objects associated with the Citröen C4 model.

We could create an abstract factory that returns one of those different types of car factory, depending on the car we are interested in. That way we can get *CarPart* objects from the factory.

Through polymorphism, we can use a common interface to get the different factories, and then use another common interface to get the different car parts.

### JDK examples

1. javax.xml.parsers.DocumentBuilderFactory#newInstance()

Going by the Javadoc of the method:

{{< highlight java >}}
Obtain a new instance of a ***_DocumentBuilderFactory_***. This static method creates a new factory instance."
{{< / highlight >}}

Also:

{{< highlight java >}}
Once an application has obtained a reference to a ***_DocumentBuilderFactory_*** it can use the factory to configure and obtain parser instances."
{{< / highlight >}}

The method's code is below. It clearly shows that the method returns a factory based on the class name defined at system level, and once we have a reference to the factory, it lets us obtain different parser instances.

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

As with the *DocumentBuilderFactory* class, there is a newInstance method that returns a factory of *transformer* objects, based on the class name defined at system level. Its Javadoc says the same.

The method's code is below. It clearly shows that the method returns a factory based on the class name defined at system level, and once we have a reference to the factory, it lets us obtain different parser instances.

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

On the other hand, it has no public constructor, so the class can only be instantiated through the *newInstance* creational methods.

{{< highlight java >}}
/**
* Default constructor is protected on purpose.
*/
protected TransformerFactory() { }
{{< / highlight >}}


3. javax.xml.xpath.XPathFactory#newInstance()

Its code is exactly the same as that of the *TransformerFactory* class: creational methods and a *protected* constructor to prevent classes that are not allowed from creating objects directly.

## Builder

The *Builder* pattern is recognizable by creational methods that return the instance itself.

This pattern is used to assemble complex objects. With it, the same construction process can be used to create different objects. The *builder* has 4 main parts:

* a Builder

* concrete Builders

* a Director

* a Product

#### Builder

A *Builder* is an interface (or abstract class) that is implemented or extended by the concrete *Builders*. The *Builder* interface establishes the actions (methods) involved in assembling a *Product* object. It also contains a method to return the *Product* object (for example *getProduct()*).

#### Product

The *Product* object is the object that gets assembled in the Builder pattern.

#### Concrete Builders

They implement the *Builder* interface (or extend it, if it is an abstract class). A concrete *Builder* is responsible for creating and assembling a *Product* object. Different concrete *Builders* create and assemble *Product* objects in different ways.

#### Director

A *Director* object is responsible for building a *Product*. It does so through the *Builder* interface and its concrete implementation, using the different methods the interface provides.

The *Builder* pattern has several uses. For example, if we want the construction process to stay the same but would like to create a different type of *Product*, we could create a new concrete *Builder* and pass it to the same *Director*.

On the other hand, if we wanted to change the construction process, we can modify the *Director* to use a different one.

### JDK examples

1. java.lang.StringBuilder#append()

The *append()* methods all add the input parameter to the object's representation, returning the same object.

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

In this case, the *Builder* would be *AbstractBuilder*, an abstract class that defines the basic implementations of the construction methods; the *Product* would be each of the types (primitives or Objects) passed as parameters to the *append* methods (the image shows only the *append()* methods for the basic types and for String, although there are more *append* methods); a concrete *Builder* would be the *StringBuilder* class itself; and the *Director* would be whatever is responsible for building the product, for example a client application.

2. java.lang.StringBuffer#append()

*StringBuffer* behaves like the *StringBuilder* class, except that *StringBuffer* guarantees synchronization. Its Javadoc explains this behavior perfectly:

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


The StringBuilder class does not do this synchronization.

3. java.nio.ByteBuffer#put() (also in CharBuffer, ShortBuffer, IntBuffer, LongBuffer, FloatBuffer and DoubleBuffer)

The *put()* methods of the *XXXBuffer* classes add the parameter to the current object and return it, as its Javadoc explains:

{{< highlight java >}}/**
* ...
* Writes the given byte into this buffer at the current
* position, and then increments the position.
* ...
*/{{< / highlight >}}


Which matches the code of any of its implementations, where the Builder pattern is clearly visible because the methods return the object itself:

{{< highlight java >}}public ByteBuffer put(byte x) {
   unsafe.putByte(ix(nextPutIndex()), ((x)));
   return this;
}{{< / highlight >}}


4. javax.swing.GroupLayout.Group#addComponent()

The *addComponent()* methods add a component to the current *Group*, returning the group itself:

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


5. All implementations of java.lang.Appendable

As we saw earlier, both *StringBuilder* and *StringBuffer* define the Builder pattern in their *append* methods. In addition, both extend the *AbstractStringBuilder* class, which in turn implements the *Appendable* interface.

## Factory or Factory Method

The *Factory Method* pattern is recognizable by creational methods that return an implementation of an abstract type or an interface.

A factory is a Java class used to encapsulate object creation code. A factory class instantiates and returns a particular type of object based on the data it receives. The different types of objects a factory returns are typically subclasses of a common parent class.

The data sent from the calling code to the factory can be passed when the factory is created, or when the factory method is invoked to create an object.

This creational method is often called *getInstance()* or *getClass()*.

### JDK examples

1. java.util.Calendar#getInstance()

The getInstance methods of the *Calendar* class:

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


We can see a *createCalendar()* method, which builds a *Calendar* object from a *TimeZone* and a *Locale*. This creational method represents the *FactoryMethod* pattern:

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


As we can see, this method can return *Calendar* objects of different types, *JapaneseImperialCalendar*, *BuddhistCalendar* or *GregorianCalendar*, depending on the input parameters. The last type also acts as the *fallback*.

2. java.util.ResourceBundle#getBundle()

If we look at the Javadoc of the class, it tells us directly that *FactoryMethod* is used to create *ResourceBundle* instances.

{{< highlight java >}}/**
* ...
* The {@link ResourceBundle.Control} class provides information necessary
* to perform the bundle loading process by the <code>getBundle</code>
* factory methods that take a <code>ResourceBundle.Control</code>
* instance.
* ...
*/{{< / highlight >}}


As in the previous case, the different *getBundle(...)* methods build and return a *ResourceBundle* depending on the input parameters:

{{< highlight java >}}public static final ResourceBundle getBundle(String baseName)
{
   return getBundleImpl(baseName, Locale.getDefault(),
                        /* must determine loader here, else we break stack invariant */
                        getLoader(Reflection.getCallerClass()),
                        Control.INSTANCE);
}{{< / highlight >}}


Internally, a creational method *getBundleImpl(...)* is invoked, and it is the one that represents the *FactoryMethod* pattern:

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

The *forName(...)* method returns a *Charset* based on the input parameter:

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


The *lookup(...)* method, and internally the *lookup2(...)* method, are the ones that define the pattern:

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


4. java.net.URLStreamHandlerFactory#createURLStreamHandler(String) (returns one singleton object per protocol)

Going by the Javadoc of the *URLStreamHandlerFactory* interface, we can see that a factory is available to build the URL handlers:

{{< highlight java >}}/**
* This interface defines a factory for <code>URL</code> stream
* protocol handlers.
* <p>
* It is used by the <code>URL</code> class to create a
* <code>URLStreamHandler</code> for a specific protocol.
*/{{< / highlight >}}


If we take any implementation of the interface, for example *TomcatURLStreamHandlerFactory*, we see that depending on the *protocol* input parameter, a type of *URLStreamHandler* is built: for WAR files, for CLASSPATHs, or even for other kinds of handlers the class itself knows how to handle, since it has a *userFactories* attribute that manages a list of user-defined factories.

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

The *Prototype* pattern is recognizable by creational methods that return a different instance of itself, but with the same properties.

In this pattern, a new object is created by cloning an existing one, which is also very useful for making copies of objects.

An example of its usefulness is when an original object is created with a resource, for example a data stream, that may not be available at the moment the cloning is done.

Another example is when creating the original object takes a significant amount of time to complete an operation, for example reading from a database or from the network.

An added benefit of the *Prototype* pattern is that it can reduce the proliferation of classes in a project by avoiding the proliferation of factories.

In Java in general, if we wanted to use cloning (for example with the *Prototype* pattern), we could use the *clone()* method and the *Cloneable* interface.

By default, the clone method makes a "*shallow copy*", which is simply a field-by-field copy of all the attributes of the original object. If the value of a field is a reference to an object, for example a memory address, the reference is copied, so both objects reference the same object, and the referenced objects are shared. If, on the contrary, the value is of a primitive type, the primitive's value is copied. This kind of "*shallow*" copy is simple and cheap, since it is usually implemented by copying the bits exactly.

### JDK examples

* java.lang.Object#clone() (the class has to implement the java.lang.Cloneable interface)

All classes that implement the *java.lang.Cloneable* interface must implement the *clone()* method, which returns an instance of the same type, with the following considerations, taken from its Javadoc:

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

The *Singleton* pattern is recognizable by construction methods that return the same instance, normally of itself, every time they are invoked.

A *Singleton* is a class that is instantiated only once. This is normally achieved by creating a static field in the class. The class also has a static method to get the instance of the class, usually named *getInstance()*.

The object referenced by the static field can be created in two ways:

* when the class is initialized.

* when the *getInstance()* method is invoked for the first time.

The *singleton* class normally has a private constructor to prevent it from being instantiated through a constructor. Instead, the singleton instance is obtained by invoking the static *getInstance()* method.

### JDK examples

* java.lang.Runtime#getRuntime()

Every Java application has a single instance of the *Runtime* class, which lets the application interact with the environment it runs in. To make this interface unique, the *getRuntime()* method is used, which always returns the same instance. The Javadoc of the class and of the method show the Singleton pattern.

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

In Java applications that use the AWT package, the same *Desktop* instance is always used, because it is taken from the application context, and if that is null, it is created and added to that context, so that subsequent invocations always return the same *Desktop* instance.

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

Whenever the methods of the *System* class that need access to the *SecurityManager* are invoked, they always check whether one is already associated with the class, and use it if so.

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


The *getProperties()* method shows that *getSecurityManager()*, which returns the value of the current SecurityManager, represents the Singleton pattern.

# Structural patterns

Structural software design patterns are those that solve problems of composition (aggregation) of classes and objects.

## Adapter

The *Adapter* pattern is recognizable by creational methods that take an instance of a different type of abstract class or interface, and return an implementation of another type (its own or a different one) of abstract class or interface, which decorates or overrides the given instance.

In the *Adapter* pattern, a wrapper class, for example the *Adapter*, is used to translate requests to another class, for example the *Adaptee*. In fact, an adapter provides particular interactions with an "*Adaptee*" that the "*Adaptee*" does not offer directly.

The pattern takes two forms:

* In the first, an adapter class uses inheritance. The *Adapter* class extends the "*Adaptee*" class and adds the methods of interest to the *Adapter*. These methods could be declared in an interface.

* In the second, an adapter object uses *Composition*. The object contains an "*Adaptee*" and implements an interface to interact with it.

### JDK examples

* java.util.Arrays#asList()

It is a clear example of the Adapter pattern, since it takes an array of objects as a parameter and returns a list, through a simple implementation such as the *ArrayList* class.

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

The constructor receives an *InputStream* and returns an implementation of the *Reader* interface, in this case an *InputStreamReader*.

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


* java.io.OutputStreamWriter(OutputStream) (returns a Writer)

As in the previous example, the constructor receives an *OutputStream* and returns an implementation of the *Writer* interface, in this case an *OutputStreamWriter*.

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


* javax.xml.bind.annotation.adapters.XmlAdapter#marshal() and #unmarshal()

If we look at an implementation of *XmlAdapter*, such as *ZeroOneBooleanAdapter*, we can see that the *marshal(String)* and *unmarshal(Boolean)* methods convert the result to the opposite type, that is, Boolean in the case of *unmarshall*, and String for *marshal*.

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

The *Bridge* pattern is recognizable by creational methods that take an instance of a different type of abstract class or interface, and return an implementation of its own type of abstract class or interface, which delegates to (or uses) the given instance.

In the *Bridge* pattern, an abstraction is separated from its implementation, and different inheritance structures are coded for both parts: the abstraction and the implementor. The abstraction is an interface or an abstract class, and so is the implementor. In addition, the abstraction holds a reference to the implementor.

The descendants of the abstraction are called refined abstractions, and the descendants of the implementor are concrete implementors. Since we can change the reference to the implementor in the abstraction, we can change the abstraction's implementor at runtime. This way, changes in the implementor do not affect client code.

An example of the *Bridge* pattern could be the following:

Suppose we have a *Vehicle* class. We could extract an engine implementation into the *Engine* class. We could also reference this *Engine* implementor in our *Vehicle* through a class attribute. If we declare the *Vehicle* class as abstract and add an abstract method *drive()*, the *Vehicle* subclasses would need to implement it. To be able to change the reference to the *Engine*, we would need to add a *setEngine()* method to *Vehicle*.

### JDK examples

* The methods of java.util.Collections#newSetFromMap()

As you can see in the following block of code, the *newSetFromMap(...)* method turns the collection passed as a parameter into a *SetFromMap*, so that the basic operations on Set objects can be performed on the initial collection, since *SetFromMap* extends *AbstractSet*.

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


As you can see, the methods the class implements from Set do nothing more than invoke the methods of the underlying object, in this case a Map.

* The methods of java.util.Collections#singleton()

As you can see in the following block of code, the *singleton(...)* method turns the collection passed as a parameter into a *SingletonSet*, so that the basic operations on Set objects can be performed on the initial collection, since *SingletonSet* extends *AbstractSet*.

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

The *Composite* pattern is recognizable by behavioral methods that take an instance of an abstract type or interface and return it in the form of a tree structure.

In this pattern there is a **tree structure** in which identical operations can be performed on both the **leaf nodes** and the **intermediate nodes**.

A node in a tree is represented by a class that can have descendants. We therefore define a node class as a *Composite* class.

A leaf node in a tree, on the other hand, is a *Primitive* class that has no descendants.

According to these definitions, the descendants of a *Composite* can be either *Primitive* or other *Composite*.

The *Primitive* class, for leaf nodes, and the *Composite* class share a common *Component* interface, which defines the common operations that can be performed on both leaves and *Composites*. When an operation is performed on a *Composite*, it is likewise performed on all its descendants, whether they are leaves or *Composites*. This way, the *Composite* pattern is used to perform common operations on the objects that make up a tree.

The description of the *Composite* pattern in the "*Gang of Four* (GoF)" book defines a client's interaction with the tree structure through the *Component* interface, which includes the operations common to both kinds of node, leaf and *Composite*, as well as the add, remove and get (Add/Remove/Get) operations on the tree.

### JDK examples

* java.awt.Container#add(Component)

It must be said that practically all of *Swing* uses this pattern, and in this case the *Container* class applies it in this method for adding components, since it adds each component to the end of the container.

{{< highlight java >}}/**
* Appends the specified component to the end of this container.
* ...
*/
public Component add(Component comp) {
   addImpl(comp, null, -1);
   return comp;
}{{< / highlight >}}


The *addImpl(...)* method, which is very long, first opens a synchronized block to operate on the component tree that represents the container.

{{< highlight java >}}synchronized (getTreeLock()){{< / highlight >}}


## Decorator

The *Decorator* pattern is recognizable by creational methods that take an instance of the same type of abstract class or interface and add extra behavior to it.

Whereas classic inheritance adds functionality to classes, the *Decorator* pattern adds functionality to objects by wrapping them in other objects. Each time additional functionality is required, the object is wrapped in another object.

A good example of this pattern is the Java classes for handling input-output (I/O) data *streams*.

For this pattern, we need a class that serves as the base object we want to add functionality to. This object is a concrete *Component* and implements a *Component* interface. This interface declares the common operations we can perform on concrete components and on all the decorators that wrap the concrete component object.

A *Decorator* is an abstract class that implements the *Component* interface and holds a reference to a *Component*. Concrete decorators are classes that extend the *Decorator* class.

### JDK examples

* java.util.Collections: checkedXXX(), synchronizedXXX() and unmodifiableXXX() methods

What all these methods do is take an initial object (XXX stands for a List, a Map, a Set, etc.) and add a behavior it does not have to begin with: type checking in the *checkedXXX* methods, synchronization between threads in the *synchonizedXXX* methods, and read-only access in the *unmodiableXXX* methods.

As an example, the following block of code shows the methods whose input parameter is a List, making it clear that the initial behavior of the List is decorated depending on the method invoked.

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


* javax.servlet.http.HttpServletRequestWrapper and HttpServletResponseWrapper

In this case the Javadoc of both classes is very clear:

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


And so any developer could extend this class to add the behavior their application needs.

## Facade

The *Facade* pattern is recognizable by behavioral methods that internally use instances of different, independent types of abstract classes or interfaces.

In this pattern, a facade class (*Facade*) is used to provide a common interface to a set of classes. The *Facade* simplifies clients' interactions with a complex system by localizing those interactions in a single interface. As a result, clients can interact with a single object instead of having to interact directly, and in possibly complicated ways, with all the objects that make up the system.

As an example, suppose we have three horribly written classes. Judging by the class names, the method names or the lack of documentation, it would be very hard for a client to interact with them. If we wrote a *Facade* that grouped the interactions with those three classes in a single place, we would be simplifying those interactions for the client code, since it would only have to invoke the methods of the *Facade*.

### JDK examples

* javax.faces.context.FacesContext

Internally it uses, among others, the abstract types or interfaces *LifeCycle*, *ViewHandler*, *NavigationHandler* and many more, without the end user having to worry about it, since they are overridden through injection. This matches the Facade pattern, since it hides the use of those classes from the client code, which only has to interact with the *FacesContext* class.

* javax.faces.context.ExternalContext

Likewise, the *ExternalContext* class internally uses *ServletContext*, *HttpSession*, *HttpServletRequest*, *HttpServletResponse*, etc., so the client code does not need to know how to deal with those classes, only with *ExternalContext*.

## Flyweight

The *Flyweight* pattern is recognizable by creational methods that return an instance that has previously been cached, like a "*multiton*" pattern.

In this pattern, instead of creating a large number of similar objects, objects are reused, which can reduce the memory requirements of an application.

The similarities between objects are stored inside the objects, while the differences are moved to the client code. These differences are passed to the objects when they are needed, by invoking methods on the objects, declared in a *Flyweight* interface.

A *ConcreteFlyweight* class implements that interface, and is used to perform operations based on an external state, as well as to store the shared state.

Sometimes a *Flyweight* factory can be used, which returns *Flyweight* objects.

### JDK examples

* java.lang.Integer#valueOf(int), and also in the Boolean, Byte, Character, Short, Long and BigDecimal classes

All the *valueOf()* methods of the classes in question help reduce memory consumption.

As an example, as the Javadoc of the *valueOf(...)* method of the Integer class shows, it caches the numbers between -128 and 127, so there is no need to return a new Integer instance, which reduces memory consumption.

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

The *Proxy* pattern is recognizable by creational methods that return an implementation of a given type of abstract class or interface, which actually delegates to (or uses) a different implementation of the given type of abstract class or interface.

In the *Proxy* pattern, a *Proxy* class is used to control access to another class for various reasons. For example, a *Proxy* can avoid instantiating an object until it is needed, which can be useful if the object takes a long time, or a large amount of resources, to build.

Another reason to use a Proxy is to control access rights to an object. A client request might need certain credentials to be able to access the object.

### JDK examples

* java.lang.reflect.Proxy

If we read the Javadoc of the static *newProxyInstance()* method of the *Proxy* class, we can see that the abstract class or interface to which method invocations on the *Proxy* object are delegated is called the "*invocation handler*".

{{< highlight java >}}/**
* Returns an instance of a proxy class for the specified interfaces
* that dispatches method invocations to the specified invocation
* handler.
* …
*/{{< / highlight >}}


# Behavioral patterns

Behavioral patterns offer solutions regarding the interaction and responsibilities between classes and objects, as well as the algorithms they encapsulate.

## Chain of Responsibility

The *Chain of Responsibility* pattern (*CoR*) is recognizable by behavioral methods that invoke the same method on another, different implementation of the same type of abstract class or interface in a queue of implementations.

There is a series of object handlers (*handlers*) queued one behind another to handle a request made by client code. If the first handler cannot handle the request, it is forwarded to the next handler, and passed along the whole chain until the request reaches a handler that can handle it, or the chain ends, whichever happens first.

In this pattern, the client is completely decoupled from the handling of the request, since it does not know which class will actually deal with it.

As for the class structure, a handler is represented by a *Handler* interface, which handles the request and gives access to the next handler. A *Handler*, in turn, is implemented by a concrete *Handler*.

### JDK examples

* java.util.logging.Logger#log()

Java's default logging system has a hierarchical tree structure, in which each level usually follows a naming convention based on the name of the class being logged. Since packages are hierarchical, so is this log structure. At each level there is a *Handler*, which is the one that actually writes the log message. This *Handler* can be tied to writing to a file, to a socket, to a database, or simply to the console.

From the Javadoc of the Logger class:

{{< highlight java >}}* ...
* By default, loggers also publish to their parent's Handlers, recursively up the tree.
* ...{{< / highlight >}}


We can see that on each log request the log messages are published recursively up the tree that represents the log structure, so that each *Handler*, from the node responsible for the write upwards, performs the corresponding write operation, which demonstrates the *Chain of Responsibility* pattern.

* javax.servlet.Filter#doFilter()

In Java Enterprise Edition, a Filter object is one that performs filtering tasks on the current request to a resource, and on the response of a resource to that request. Classes that implement the Filter interface have to implement, among others, a *doFilter(...)* method:

{{< highlight java >}}public void doFilter(ServletRequest request, ServletResponse response,
                    FilterChain chain)
       throws IOException, ServletException;{{< / highlight >}}


It takes a filter chain as a parameter: the entire chain responsible for filtering both the requests and the responses on web application resources, so that it can delegate the filtering of requests/responses to each element of the chain, which in turn invokes *doFilter(...)* as well.

{{< highlight java >}}/**
* The <code>doFilter</code> method of the Filter is called by the
* container each time a request/response pair is passed through the
* chain due to a client request for a resource at the end of the chain.
* The FilterChain passed in to this method allows the Filter to pass
* on the request and response to the next entity in the chain.
* ...{{< / highlight >}}


The Javadoc shows the behavior of the pattern clearly.

## Command

The *Command* pattern is recognizable by behavioral methods in a type of abstract class or interface that invoke a method on an implementation of a different type of abstract class or interface that was encapsulated by the implementation when it was created.

In this pattern, a *Command* interface declares a method to execute a particular action, usually called *execute()*. Concrete *Command* classes implement that interface method, which in turn runs the appropriate action or method of a *Receiver* class held by the concrete class. The *Receiver* class finally performs the particular action.

In addition, a *Client* class is responsible for creating a concrete *Command*, defining its *Receiver*. An *Invoker* class holds a reference to a *Command* and has a method that executes the *Command*, and this *Invoker* is completely decoupled from the action performed by the *Receiver*: the *Invoker* invokes a *Command*, and the *Command* executes the appropriate action of the *Receiver*. This way, the *Invoker* can invoke commands without knowing the details of the action to be performed. This decoupling also means that changes made to the actions of the *Receiver* do not directly affect the invocation of the action.

### JDK examples

* All implementations of java.lang.Runnable

The *Runnable* interface, as its Javadoc describes:

{{< highlight java >}}* ...
* This interface is designed to provide a common protocol for objects that
* wish to execute code while they are active.
* ...{{< / highlight >}}


defines a contract for executing code once its *run()* method is invoked. This method represents the *execute()* method described earlier in this section. The Receiver classes are represented by the code executed inside the *run()* method, which may or may not be encapsulated in a class. The Invokers, in turn, are the classes that instantiate the *Runnable* implementations in order to execute their *run()* method.

An example implementation is the *java.lang.Thread* class, used to run code on different threads: when a developer wants to run code on another thread, they have to instantiate a *Thread* in an Invoker and encapsulate their code (the *Receiver*) inside the run method. In this case, the concrete *Command* would be the *Thread* class.

## Interpreter

The *Interpreter* pattern is recognizable by behavioral methods that return a type or instance structurally different from the given instance.

### JDK examples

* java.text.Normalizer

The Normalizer class transforms Unicode text into equivalent text in a given form, through the *normalize(...)* method, which uses an enumeration of type java.text.Normalizer.Form to identify the kind of transformation to perform. The following block of code explains each of the transformations.

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


* All subclasses of java.text.Format

The Format class is an abstract base class whose main job is to format certain kinds of data, such as dates, messages and numbers, in a way that is sensitive to the language the application uses. In this pattern, then, the input parameters are texts that, through this class and its implementations (NumberFormat, SimpleDateFormat, etc.), are transformed into a representation format better suited to the language the application uses.

For example, the decimal separators in English and in Spanish are different, so the decimal number 12345678.901 is formatted in English as 12,345,678.901, and in Spanish as 12.345.678,901.

NOTE: It is important to stress that parsing or formatting is not part of the *Interpreter* pattern. However, determining the pattern and how to apply it is.

## Iterator

The *Iterator* pattern is recognizable by behavioral methods that return a different type while processing a queue.

This pattern allows traversing the elements of a set of objects through a standardized interface, which defines the actions that can be performed. These actions include being able to traverse all the objects, as well as to get each one of them.

Java has an interface called *Iterator*, used in a large number of applications to iterate over objects, such as Java collections. We could write our own *Iterator* by implementing *java.util.Iterator*.

### JDK examples

* All implementations of java.util.Iterator

This interface allows iterating over a collection of elements. Its best-known or most used implementations are lists, maps and sets, in their different implementations. So in Java we have the *List*, *Map* and *Set* interfaces, and some of their implementations, such as *ArrayList*, *LinkedList*, *HashMap*, *ConcurrentHashMap*, *HashSet*, or *TreeMap*, among others.

Besides those kinds of collections, there are other completely different classes that implement the pattern, such as the *java.util.Scanner* class, which scans text for primitive types and strings using regular expressions, or the class

All of them show the Iterator pattern, since they have three methods in the interface: *next()*, which returns the next element of the collection; *hasNext()*, which indicates whether there are more elements after the current one; and *remove()*, which removes the current element.

Note that the *remove()* method is not part of the Iterator pattern, but it is mentioned to set it apart from the next example, enumerations.

* All implementations of java.util.Enumeration

A class that implements Enumeration generates a series of elements, which are retrieved one at a time by invoking the *nextElement()* method. The interface also provides a method to indicate whether there is a next element, *hasMoreElement()*, so the collection can be traversed without going out of bounds.

As for the differences between Iterators and Enumerations, Iterators are exactly the same as Enumerations, except that with the former you can remove elements from the collection being traversed. In fact, Java recommends Iterators over Enumerations in developers' own implementations. In addition, the method names of Iterator are shorter, which makes it easier for the developer to use.

## Mediator

The Mediator pattern is recognizable by behavioral methods that take an instance of a different type of abstract class or interface, normally using the Command pattern, which delegates to (or uses) that instance to perform its operations.

This pattern centralizes communication between objects through a mediator object. This centralization is useful because it localizes the interactions between objects in a single place, which increases the maintainability of the code, especially as the number of classes in an application grows. Since this communication happens in the mediator instead of directly with the other objects, the pattern reinforces the concept of loose coupling between objects.

The classes that communicate with the mediator are known as Colleagues. The mediator implementation is called ConcreteMediator, and it can have an interface that determines the communication between Colleagues. They know their mediator, and the mediator knows its Colleagues.

### JDK examples

* java.util.Timer

From the Javadoc of the *Timer* class we can tell that a *Thread* can have a group of tasks, of type *TimerTask*, which it queues in a Timer to be executed sequentially. This way the *Thread* knows nothing about how the tasks are executed, and delegates that to the Timer object.

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


The Timer class internally uses a *TimerQueue* object to do the scheduling.

If we look at any of the schedule(...) methods of the class, we see that internally they call a private *sched(...)* method, which adds the TimerTask to the queue and applies the appropriate time scheduling to it.

This way, the *Mediator* pattern is reflected in the *Timer* class, and its *Colleagues* are all the classes that schedule tasks on it. The abstract class *TimerTask* is what determines the communication between the *Mediator* and its *Colleagues*.

* java.util.concurrent.Executor

The *Executor* class can receive *Runnable* objects and execute them completely decoupled from the classes that use it, without those classes having to know how the code inside the *Runnable* objects is executed. Its Javadoc is very descriptive:

{{< highlight java >}}/**
* An object that executes submitted {@link Runnable} tasks. This
* interface provides a way of decoupling task submission from the
* mechanics of how each task will be run, including details of thread
* use, scheduling, etc.  An <tt>Executor</tt> is normally used
* instead of explicitly creating threads.
* ...{{< / highlight >}}


Regarding the *Mediator* pattern, the communication interface would be *Runnable*, and the *Colleagues* would be those that use the *Executor* to launch tasks.

* java.lang.reflect.Method#invoke()

The reflect package of the Java programming language allows access to the members of classes (attributes, constructors and methods) in order to use their declarations, to read or change the values of class attributes, or even to invoke methods.

In this case, the Method class provides information about, and access to, the methods of a class or interface, including both class methods and instance methods.

According to the *Mediator* pattern, represented by the *Method* class, the communication interface would be the *Object* class, since the first parameter of the invoke(...) method is the object on which to invoke the method in question. The *Colleagues* would be the classes that use reflection to access methods of other classes, without needing to know the behavior of those methods, just invoking them.

That said, except on rare, necessary occasions, using reflection to access the members and methods of a class is not recommended, because if the class changes, the clients or *Colleagues* will not be told about the change, not even at build time.

## Memento

The Memento pattern is recognizable by behavioral methods that internally change the state of an instance.

This pattern is used to store the state of an object so that this state can be restored at some point in the future. The data of this saved state in the memento object is not accessible outside the object, so it cannot be saved or stored outside it. This protects the integrity of the saved state data.

As for the classes, there is an *Originator* class, which represents the object whose state we want to save. A *Memento* class represents the object that stores the state of the *Originator*, and it is generally a private inner class of the *Originator*. As a result, the *Originator* has access to the fields/attributes of the *Memento* object, and no external class does. This means that state information can be transferred between the *Memento* and the *Originator* inside the latter, but external classes have no access to the state data stored in the *Memento*.

The Memento pattern also uses a *Caretaker* class. This is the object responsible for storing and retrieving the state of the *Originator*, through the Memento object. Since the *Memento* class is a private inner class, this type is not visible to the *Caretaker*. The *Memento* object therefore needs to be stored as an *Object* inside the *Caretaker*.

### JDK examples

* java.util.Date

The setter methods of the class use the Memento pattern, because internally a primitive *long* is stored, which can only be read, not modified directly. To change that internal state you have to use those setter methods, which normally take integers as input parameters. The *Date* class internally normalizes those integers to compose the final internal state, depending on the method called.

* All implementations of java.io.Serializable

Implementations of Serializable take on the responsibility of saving and restoring the state of all their attributes. If we had a structure of classes and subclasses based on inheritance, where an ancestor is not Serializable but its descendants are, the descendants would also have to guarantee that they can save and restore the attributes of their superclass, public ones, protected ones, and even package ones (if accessible).

The internal state of the Memento pattern is reflected in the values of the class attributes, with the *Originator* being the class itself, which must implement the *Serializable* interface. The *CareTaker* class would also be identified with the class itself, which could have several methods to save and restore its attributes appropriately. These methods would have the following form:

{{< highlight java >}}* ...
* private void writeObject(java.io.ObjectOutputStream out)
*     throws IOException
* private void readObject(java.io.ObjectInputStream in)
*     throws IOException, ClassNotFoundException;
* private void readObjectNoData()
*     throws ObjectStreamException;
* ...{{< / highlight >}}


As you can see, these methods would read from and write to Object *Streams*, both input and output, representing the behavior of the *CareTaker* class in the class itself.

## Observer, or Publisher/Subscriber

The Observer pattern, or *Publisher/Subscriber* (the classic producer/consumer problem), is recognizable by behavioral methods that invoke a method of an instance of another type of abstract class or interface, depending on their own state.

In this pattern, an object called *Subject* maintains a collection of objects called *Observers*. When the *Subject* changes, it notifies the *Observers*. In addition, *Observers* can be added to or removed from the subject's collection of observers. Changes in the state of the *Subject* can be passed to the *Observers* so that they can change their own state to reflect the change.

The *Subject* implements an interface that defines methods to add and remove *Observers* from its collection of observers. This interface also has a notification method, which should be called every time the state of the *Subject* changes. This would notify the observers that the state of the *Subject* has changed. For their part, *Observers* implement an interface with a method to update the *Observer* itself. This update method is invoked on each and every observer inside the notification method of the *Subject*. This way, since the communication goes through an interface, any concrete *Observer* that implements the interface can be updated by the *Subject*, resulting in loose coupling between the *Subject* and *Observer* classes.

### JDK examples

* java.util.Observer/java.util.Observable (rarely used in real world though)

The *Observer* (interface) and *Observable* (class) pair clearly represent the Observer pattern. The *Observer* interface has an *update()* method, which receives an *Observable* as an input parameter and is invoked when the *Observable* object notifies all its *Observers*. The *Observable* class, in turn, has the methods the pattern describes: adding or removing an *Observer*, notifying the *Observers*, etc.

* All implementations of java.util.EventListener (practically all over Swing thus)

The *EventListener* interface is just a marker interface to identify all the classes or interfaces that will behave as a Listener, which in general defines the same behavior as the Observer pattern. Accordingly, there are many classes in the JVM that implement this *EventListener* interface, such as *java.awt.ActionListener* or *java.awt.WindowListener*.

In general, almost all the **_SWING_** classes are built following this pattern, since graphical objects usually respond to events, and other objects usually subscribe to those events in order to respond to them, so that when the event fires, all its Listeners can be notified.

So *ActionListener* has an *actionPerformed(ActionEvent)* method, and *WindowListener* has several more: *windowOpened(WindowEvent)*, *windowClosing(WindowEvent)*, *windowClosed(WindowEvent)*, *windowIconified(WindowEvent)*. These methods notify everyone who has subscribed, demonstrating the pattern.

## State

The State pattern is recognizable by behavioral methods that change their behavior depending on the state of the instance itself, which can be controlled externally.

The idea behind the State pattern is that an object can change its behavior depending on its state. For that, there is a *Context* class, which holds a *State* reference to a concrete instance of *State*. The *State* interface declares particular methods that represent the behaviors of each particular state. The concrete *State* classes implement those behaviors. If we change the concrete *State* of a *Context*, we change its behavior. In essence, in the State pattern, a *Context* class can act as different classes depending on its state.

This pattern avoids using *switch* and *if* statements to change behavior.

### JDK examples

* javax.faces.lifecycle.LifeCycle#execute(FacesContext)

The *LifeCycle* class controls the processing of the entire lifecycle of a particular request within the JSF (*Java Server Faces*) framework, and is responsible for executing all the phases defined by the JSF specification in the specified order. Its *execute(...)* method receives a *FacesContext* instance as a parameter, which determines the execution of the phases and can alter the defined order depending on the state of the context.

## Strategy

The Strategy pattern is recognizable by behavioral methods in a type of abstract class or interface that invoke a method on an implementation of a different type of abstract class or interface, which was passed as a parameter of a method during the implementation of the pattern.

In this pattern, the different algorithms are represented as concrete *Strategy* classes, which usually share a common *Strategy* interface. A *Context* object holds the reference to the *Strategy*. By changing the *Strategy* of the *Context*, we can get different behaviors, which, although different, can all operate on the data of the *Context*.

The *Strategy* pattern can be used as a form of composition, as an alternative to subclassing. Instead of providing the different behaviors through subclasses that override the methods of their superclasses, the *Strategy* pattern lets different behaviors be localized in concrete *Strategy* classes that share the common *Strategy* interface. The *Context* class holds a reference to a *Strategy*.

### JDK examples

* java.util.Comparator#compare()

Each class that implements the *Comparator* interface has to implement the *compare()* method, which receives two objects to compare. The implementation decides how the comparison is done, with only these requirements:

* the sign of comparing the two objects must be the opposite of the sign of comparing them in reverse order: **_sign(compare(a,b))==-sign(compare(b,a))_**

* comparisons must be transitive: if **compare(x,y) > 0** and **compare(y,z) > 0**, then **compare (x,z) > 0**

* if **compare(x,y)==0**, then **sign(compare(x,z))==sign(compare(y,z))**, for all z.

An example of the use of these comparisons can be found in the *java.util.Collections* and *java.util.Arrays* classes, which have *sort(...)* methods that sort the collection passed as a parameter, using internally the *compare()* method of the classes in the collection.

In relation to the Strategy pattern, the concrete *Strategy* would be each concrete *Comparator*. The *Context* would be whoever invokes the comparison, which could use one strategy or another by changing the *Comparator*.

* javax.servlet.http.HttpServlet#service()

The *service()* method receives an HTTP request and redirects it to the appropriate *doXXX*() method depending on the request method: *PUT, GET, POST, DELETE, HEAD, OPTIONS, TRACE*. These methods take an instance of *HttpServletRequest* and an instance of *HttpServletResponse* as parameters, and the implementer is obliged to process them without keeping a reference to them in the class.

In comparison with the *Strategy* pattern, the *HttpServletRequest* implementation would correspond to a concrete *Strategy*; and anything that uses the *service()* method, for example a *Servlet*, would correspond to the *Context*.

## Template Method

The Template Method pattern is recognizable by behavioral methods that have a predefined behavior defined by an abstract class type.

This pattern uses inheritance to distribute behavior. To do so, a method called the "*template method*" defines the steps of an algorithm. The implementation of those steps, for example methods, can be deferred to subclasses. This way, a particular algorithm is defined in the *template method* in an abstract class, but each specific step can be defined in the subclasses. For this very reason, the algorithm is implemented in the abstract class, and each of its steps must also be declared in the abstract class as abstract (*abstract method*), and implemented in the subclasses.

An example could be the following: suppose we have a Meal class, which is an abstract class with a template method called *makeTheMeal()*, which defines the steps involved in eating. We could define the method as final to prevent it from being overridden. The algorithm defined by the *makeTheMeal()* method would consist of four steps:

1. prepareIngredients()

2. cook()

3. eat()

4. cleanUp()

The *eat()* method could be implemented even though the subclasses implement it too. The other three methods would be declared abstract, so that the subclasses have to implement them.

### JDK examples

* All non-abstract methods of the classes java.io.InputStream, java.io.OutputStream, java.io.Reader and java.io.Writer.

These classes all have a series of abstract methods that their subclasses must implement. These methods are the specific steps of each implementation within an algorithm common to all of them. The TemplateMethod pattern is very well reflected this way.

An example of the code is the *read()* method of the *InputStream* class:

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


As you can see in the code block above, the invocations of the read method (highlighted in yellow) define steps that are not implemented in the InputStream class but that its descendants must implement, completing the algorithm defined for the non-abstract *read(...)* method.

* All non-abstract methods of the classes java.util.AbstractList, java.util.AbstractSet and java.util.AbstractMap.

As in the previous example, the non-abstract methods of these classes define a general algorithm made up of several steps, which are implemented in their subclasses.

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

The Visitor pattern is recognizable by two types of abstract classes or interfaces whose methods each take the other type of abstract class or interface, so that one of them invokes the method of the other, and the other executes the desired strategy on it.

This pattern is used to simplify operations on groups of related objects. These operations are performed by the *visitor* instead of putting their code in the classes it visits. This way, using this pattern leads to more maintainable code. It also avoids using the *instanceof* operator to compute data about similar classes.

To implement this pattern, there is a Visitor interface, which declares *visit()* methods for each of the different types of elements that can be visited. A concrete *Visitor* implements the *Visitor* interface, and therefore the *visit()* methods of the interface. These methods are the operations that the *visitor* object should perform on a visited element.

The related classes to be visited implement an *Element* interface, which declares an *accept()* method that takes the *visitor* object as an argument. Concrete *Elements* implement the *Element* interface, and the *accept()* method, in which the *visit()* method of the *visitor* is invoked with *this*, the current object of the concrete Element. As a result, an element takes the visitor, and the visitor performs its operations on that element.

### JDK examples

* java.nio.file.FileVisitor and SimpleFileVisitor

The FileVisitor class allows visiting all the elements of a file system, through the Visitor pattern described in this section. This interface defines the different visit() methods characteristic of the pattern.

A concrete visitor would be SimpleFileVisitor, which implements FileVisitor, and would be used in the FileTreeWalker class, to which a Visitor is passed as a parameter, with the resulting element visiting operations.

# References

- Design patterns: [http://www.avajava.com/tutorials/categories/design-patterns](http://www.avajava.com/tutorials/categories/design-patterns)

- JVM Overview: [http://docs.oracle.com/javase/7/docs/technotes/guides/index.html#jre-jdk](http://docs.oracle.com/javase/7/docs/technotes/guides/index.html#jre-jdk)
