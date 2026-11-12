---
title: "\"El plugin funcionaba en mi máquina\" ya no vale"
date: 2015-11-01T09:16:43+02:00
description: "El plugin funcionaba en mi máquina"
categories: development
tags: [development, liferay, arquillian]
type: post
weight: 25
translationKey: the-plugin-worked-on-my-computer
translatedFrom: 3eaa239
---

¡Buenas, desarrolladores de Liferay!

Estoy muy orgulloso y contento de anunciar que, a partir de ahora, vamos a poder escribir tests de integración en nuestros plugins de Liferay.

_* Antes de entrar en detalle, quiero dar las gracias a todos los que colaboraron como un gran equipo para conseguirlo: [Carlos Sierra](https://www.linkedin.com/in/carlos-sierra-andrés-60a6232), [Cristina González](https://www.linkedin.com/in/cgonzalezcastellano) y [Miguel Pastor](https://www.linkedin.com/in/miguelpastorolivar), que trabajaron muchísimo para llevar esto al producto._

{{< figure src="/images/joker-clapping.gif" alt="¡Gracias!" >}}

> **ACTUALIZACIÓN**: El 3 de febrero Arquillian publicó unas contribuciones para ejecutar tests de integración sobre módulos OSGi en Liferay 6.2 y posteriores. Puedes leer la entrada en el blog de la comunidad de Arquillian: http://arquillian.org/blog/2015/02/03/arquillian-extension-liferay-1-0-0-Alpha1

_Oye, espera, ¿a qué te refieres con test de integración?_

Me refiero a los tests que dependen de otros servicios, como los servicios del portal o incluso los del propio plugin. Tendremos una instancia real (no un mock) de ese servicio, con todo el cableado que usa: el comportamiento de la persistencia, las cachés, la indexación, etc.

Esta magia negra la llevabais años pidiendo muchos de vosotros, y por fin hemos integrado Liferay con uno de los frameworks de testing más interesantes de ahora mismo. Ese framework es Arquillian (http://arquillian.org), una plataforma de testing innovadora y muy extensible para la JVM, que permite a los desarrolladores crear con facilidad tests automatizados de integración, funcionales y de aceptación para middleware Java.

Directo desde http://arquillian.org/invasion:

- Gestiona el ciclo de vida del contenedor (o de los contenedores)
- Empaqueta el caso de test, las clases dependientes y los recursos en un archivo ShrinkWrap (o en varios)
- Despliega el archivo (o los archivos) en el contenedor (o en los contenedores)
- Enriquece el caso de test con inyección de dependencias y otros servicios declarativos
- Ejecuta los tests dentro del contenedor (o contra él)
- Captura los resultados y se los devuelve al test runner para que los reporte

En pocas palabras: _"**Arquillian lleva tu test al runtime**, dándote acceso a los recursos del contenedor, feedback con sentido y una visión de cómo funciona realmente el código."_

En primer lugar, debes saber que Arquillian puede usar tres tipos de contenedor (solo los menciono, así que visita su documentación para entenderlos mejor):

- Embedded: el test runner contiene el contenedor como una librería
- Managed: el test runner arranca y para el contenedor como un proceso separado
- Remote: el test runner usa un contenedor operativo que ya está arrancado

Después de un montón de cervezas y dos o tres minutos de discusión, pensamos que lo mejor para empezar es el enfoque Remote. Nos permite ejecutar los tests mientras desarrollamos, y si hace falta podemos conseguir el comportamiento managed con scripts de CI.

Para ponértelo más fácil, hemos añadido al SDK de plugins algunas capacidades para configurar un bundle de Liferay (el que define el SDK) con soporte para Arquillian, lo que significa:

- JMX activado y configurado.
- El manager de Tomcat instalado y configurado.
- Dependencias de Arquillian disponibles en tiempo de compilación y de test.

Más adelante las explicaré con más detalle.

En segundo lugar, hemos creado una librería que facilita crear un **WebArchive**, el archivo que Arquillian necesita enviar al contenedor. Esta pieza de software construye un WebArchive y ejecuta los auto-deployers del portal. Piensa en el WebArchive como una abstracción del WAR de un plugin que se ha soltado en la carpeta LIFERAY_HOME/deploy, pero que no se ha desplegado en el contenedor.

Por ahora, tienes que definir un método con la anotación @**Deployment** de Arquillian y construir ahí tu WebArchive. (Estamos decidiendo cómo mejorarlo, pero de momento es obligatorio definir ese método de deployment).

Una vez creado el WebArchive, podemos añadirle clases (o recursos). Y eso es muy bueno, porque hace explícitas las dependencias del test: basta con leerlo para verlas todas.

Puedes ver la librería aquí: https://github.com/liferay/liferay-portal/tree/master/modules/sdk/ant-arquillian

Por último, el classpath de test debe contener un descriptor de test de Arquillian, donde defines dónde se está ejecutando tu servidor remoto. Ese fichero se llama "arquillian.xml" y está en la carpeta PLUGIN-NAME/test/integration.

Mmm... déjame pensar... Creo que no me dejo nada, así que ¡resumamos!

- Tomcat configurado con JMX, el manager y una credencial válida para acceder al manager
- Una librería que construye el plugin de forma que Arquillian sepa qué hacer con él
- El classpath de test configurado

Hemos añadido unas herramientas al SDK para que puedas hacer toda esta configuración ejecutando solo dos targets de ANT:

- En la carpeta raíz del SDK de plugins (SOLO LA PRIMERA VEZ QUE EMPIEZAS CON EL SDK): **ant setup-testable-tomcat**, que configurará tu bundle y afectará a estos ficheros.
    - CATALINA_HOME/bin/setenv.sh, para configurar JMX
    - CATALINA_HOME/conf/tomcat-users.xml, para configurar los usuarios y roles del manager de Tomcat
    - webapps/manager, la aplicación web con la que se comunica Arquillian para desplegar tus tests en el contenedor.
- En la carpeta raíz de tu plugin: **ant setup-arquillian**, que configurará tu plugin y afectará a estos ficheros.
    - test/integration/arquillian.xml, para definir las credenciales con las que entrar en el manager de Tomcat
    - añade las dependencias de Arquillian al classpath de test

¡Ya tenemos un plugin con soporte para Arquillian! Pero nos falta escribir un test que verifique la integración con el portal.

¡Manos a la obra!

Esta es la receta mínima:

1. Arranca tu Tomcat, ya configurado con las tareas de ant que acabamos de ver.
2. Crea una clase de test en la carpeta test/integration.
3. Ejecuta tu test con el test runner de Arquillian.
4. Añade a la clase de test un método que devuelva el WebArchive, con la anotación @Deployment.
5. Añade un método de test que verifique alguna funcionalidad del portal, por ejemplo, obtener el número de calendarios del portlet de calendario.
6. Ejecuta los tests:
    - Con ANT: ant test-integration
    - Con tu IDE

* Ten en cuenta que las dependencias de test se han declarado en una configuración IVY de test en el SDK de plugins, así que no hace falta configurar nada relacionado con los tests en el plugin: lo hereda del SDK.

{{< highlight java >}}
import com.liferay.ant.arquilian.WebArchiveBuilder;

import org.jboss.arquillian.container.test.api.Deployment;
import org.jboss.arquillian.junit.Arquillian;
import org.jboss.shrinkwrap.api.spec.WebArchive;

import org.junit.Assert;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(Arquillian.class)
public class LiferayArquillianTest {
	
	@Deployment
	public static WebArchive createDeployment() {
		return WebArchiveBuilder.build();
	}

	@Test
	public void testGetCalendarsCount() {
		int count = CalendarLocalServiceUtil.getCalendarsCount();

		Assert.assertEquals(0, count);
	}

}

{{< /highlight >}}

En este ejemplo, CalendarLocalServiceUtil es un objeto real, ¡así que ya no hace falta mockear nada!

{{< figure src="/images/lets-celebrate.jpg" alt="¡A celebrarlo!" >}}

**Pero ¿por qué este CalendarLocalServiceUtil es un objeto real? ¿Dónde está la magia?**

Arquillian despliega el plugin completo y funcionando en el contenedor, que ya estaba arrancado. Después ejecuta los tests dentro del contenedor y, al terminar, devuelve los resultados al runner y hace undeploy del plugin.

¡Es genial! Puedes lanzar tus tests con los comandos de ANT desde la shell, o incluso desde tu IDE, lo que acelera el desarrollo.

**Vale, pero ¿no tarda mucho en hacer deploy y undeploy del plugin?**

Para nada. No olvides que tu contenedor ya está arrancado, así que el ciclo deploy->test->undeploy debería ser muy rápido (10 segundos o menos). El trabajo pesado se hizo al arrancar el contenedor y el portal de Liferay. Lo único que se ejecuta ahora son las acciones de tu plugin.

**¿Podré depurar?**

¡Sí, el bendito debugger! Si arrancas tu contenedor en modo debug, puedes crear una conexión remota con tu Tomcat y depurar. ¿Te has fijado en que he dicho conexión remota? ¿Por qué lo habré dicho?

Como has leído unos párrafos más arriba, los tests se ejecutan en un servidor remoto (puede que en tu propia máquina, pero remoto al fin y al cabo), así que tienes que configurar tu IDE para que apunte a ese puerto de depuración.

**¿Y el futuro?**

Como puedes imaginar después de leer esto, podríamos hacer backport a las ramas 6.2.x y 6.1.x, para que se puedan testear plugins en esas versiones.

Y, por supuesto, el siguiente beneficio de tener Arquillian integrado es que ya podemos empezar a escribir más tests en nuestros plugins.

Como ya sabéis, estamos haciendo un gran esfuerzo para convertir Liferay en una plataforma más agradable, más sencilla y más extensible. En la próxima versión podréis escribir aplicaciones sobre Liferay de una forma completamente distinta. Y, por supuesto, queremos que testeéis esas aplicaciones nuevas, así que ahora mismo estamos revisando la infraestructura básica de testing que dará soporte a estos nuevos mecanismos.

Y esto es todo. Nos encantaría saber qué piensas, así que cuéntanos en los comentarios lo que quieras.

Hasta la próxima, y acuérdate de esto...

{{< figure src="/images/be-happy_o_2175003.webp" alt="¡Gracias!" >}}
