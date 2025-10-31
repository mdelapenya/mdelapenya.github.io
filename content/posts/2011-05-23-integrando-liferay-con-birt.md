---
title: "Integrando Liferay con BIRT"
date: 2011-05-23 08:00:00 +0200
image: ""
description: "Una de las principales funcionalidades en las aplicaciones de gestión es la de presentación de información en un formato imprimible, ya sea PDF, Excel, Word, etc. Por ello hoy voy a contar cómo integrar un motor de informes como es Eclipse BIRT con Liferay."
categories: [Liferay, "Desarrollo Web"]
tags: ["birt", "eclipse", "java", "Liferay", "plugins", "portal", "reports", "servlets"]
type: post
weight: 1
lang: es
showTableOfContents: true
---

Una de las principales funcionalidades en las aplicaciones de gestión es la de presentación de información en un formato imprimible, ya sea PDF, Excel, Word, etc. Por ello hoy voy a contar cómo integrar un motor de informes como es Eclipse BIRT con Liferay.

Para el seguimiento del post es necesario tener instalado Eclipse Helios y el plugin de BIRT descargado desde la opción "Install New Software" del Eclipse, en el repositorio "http://download.eclipse.org/releases/helios"

La estrategia a seguir es la de independizar los portlets de BIRT, delegando en Liferay la gestión de éste. Para ello levantaremos en Liferay el motor de BIRT, y los portlets consumiran ese servicio para generar sus reports.

A modo de resumen, los pasos que vamos a realizar para integrar BIRT con Liferay son los siguientes:

1.  Descargar el runtime de BIRT
2.  Definir la interfaz de paso de información desde un portlet a BIRT
3.  Crear un servlet para el motor dentro de Liferay
4.  Llamar desde un portlet cualquiera
5.  Presentar los datos

## DESCARGA DEL RUNTIME DE BIRT

Lo primero de todo es descargar el motor de informes. Podemos hacerlo desde la página de Eclipse BIRT (proyecto Phoenix). Allí vamos a "Latest BIRT Runtime Release Build", en este caso la 2.6.2. Y le damos a descargar el Runtime (descarga directa).

![Descarga de Eclipse BIRT](/images/posts/2011-05-23-integrando-liferay-con-birt/birt-runtime-download.png)

El lugar donde instalar el runtime debería ser accesible por el contexto de aplicación del portal Liferay (donde queremos instalar el motor de BIRT). En este caso, un buen lugar podría ser el WEB-INF/birt-runtime del portal.

## INTERFAZ ENTRE BIRT Y LOS PORTLETS

Pensando en la arquitectura, estamos creando un sistema por el cual el portal Liferay sea capaz de escuchar solicitudes de presentación de informes asociados a cualquiera de los portlets desplegados en el portal, siendo este último el responsable único de tratar dichas solicitudes. Parece conveniente el definir una interfaz de comunicaciones entre el motor de BIRT y los portlets.

Para ello, podríamos crear un conjunto de objetos Java que encapsulen los datos a pasar al informe, de tal modo que siempre se asocien los datos a la petición a BIRT de la misma manera, consiguiendo dos cosas:

1.  Unificar el modo de presentación de reports, centralizando la gestión de reports en el portal: no desplegamos BIRT en todos y cada uno de los portlets que lo utilicen.
2.  No utilizar BIRT en la capa de acceso a datos, ya que no utilizamos DataSources JDBC, sino que le pasamos al BIRT objetos Java obtenidos por cada portlet. En el report únicamente utilizaríamos ScriptedDatasources para acceder a esos objetos Java.

![Interfaz de comunicación entre los portlets y BIRT](/images/posts/2011-05-23-integrando-liferay-con-birt/birt-interfaz-comunicacion.png)

Para que BIRT, que estará dentro del contexto de Liferay, pueda leer esos datos, los portlets deben dejarlos en el contexto de aplicación (APPLICATION_SCOPE). Para ello es necesario configurar en el fichero liferay-portlet.xml de cada portlet el siguiente elemento:

```xml
<private-session-attributes>false</private-session-attributes>
```

De esta forma los portlets podrán compartir datos con la sesión del portal.

## BIRT ENGINE Y SERVLET DE ESCUCHA DE PETICIONES

Ya tenemos la interfaz, ahora queda codificar un servlet que levante el motor de BIRT. Pero antes es necesario crear la clase que represente a nuestro BIRTEngine.
Como veréis, existe un fichero de propiedades como atributo de la clase, en la que irá definida la ruta al runtime, que dejamos en `WEB-INF/birt-runtime`.

```java
/**
* el BIRT report engine
*/ 
public class BirtEngine {

    private static IReportEngine birtEngine = null;
    private static Properties properties = null;
    private static String path = null;

    // ...

    public static synchronized IReportEngine getBirtEngine(ServletContext sc) {
        if (birtEngine == null) {
            EngineConfig config = new EngineConfig();

            Level logLevel = Level.OFF;
            String engineHome = new String();
            String logDir = new String();

            /* método de la clase donde cargaremos desde un
            * properties las propiedades necesarias para
            * configurar el Engine, como son:
            *
            *   logLevel=ALL
            *   logDir=C:\\temp\\logs
            *   engineDir=\\birt-runtime-2_6_1\\ReportEngine
            *   reports.dir=\\WEB-INF\\Reports\\
            */
            loadProperties();

            //cargamos la configuracion del motor
            if( properties != null) {
                String level = properties.getProperty("logLevel");

                if ("SEVERE".equalsIgnoreCase(level)) {
                    logLevel = Level.SEVERE;
                }
                else if ("WARNING".equalsIgnoreCase(level)) {
                    logLevel = Level.WARNING;
                }
                else if ("INFO".equalsIgnoreCase(level)) {
                    logLevel = Level.INFO;
                }
                else if ("CONFIG".equalsIgnoreCase(level)) {
                    logLevel = Level.CONFIG;
                }
                else if ("FINE".equalsIgnoreCase(level)) {
                    logLevel = Level.FINE;
                }
                else if ("FINER".equalsIgnoreCase(level)) {
                    logLevel = Level.FINER;
                }
                else if ("FINEST".equalsIgnoreCase(level)) {
                    logLevel = Level.FINEST;
                }
                else if ("OFF".equalsIgnoreCase(level)) {
                    logLevel = Level.OFF;
                }
                else if ("ALL".equalsIgnoreCase(level)) {
                    logLevel = Level.ALL;
                }

                logDir = properties.getProperty("logDir");
                engineHome = sc.getRealPath(properties.getProperty("engineDir"));  

                path = properties.getProperty("reports.dir")+"\\";
            }

            config.setEngineHome(engineHome);
            config.setLogConfig(logDir, logLevel);

            try {
                Platform.startup(config);
            }
            catch (BirtException e) {
                e.printStackTrace();
            }

            IReportEngineFactory factory =
                (IReportEngineFactory)Platform.createFactoryObject( IReportEngineFactory.EXTENSION_REPORT_ENGINE_FACTORY );

            birtEngine = factory.createReportEngine(config);
        }

        return birtEngine;
    }
    ...
}

/**
* el servlet que acepta las peticiones 
*/
public class BirtServlet extends HttpServlet {
    /**
    * Define el engine 
    */
    private IReportEngine birtReportEngine = null;

    // ...

    public void init() throws ServletException {
        logger.info("Iniciando BIRTServlet...");
        BirtEngine.initBirtConfig();
        logger.info("BIRTServlet iniciado");
    }

    public void destroy() {
        super.destroy();
        BirtEngine.destroyBirtEngine();
    }

    @SuppressWarnings("unchecked")
    public void doPost(HttpServletRequest request, HttpServletResponse response)
        throws ServletException, IOException {

        //get report name and launch the engine
        response.setContentType("application/pdf");
        response.setHeader ("Content-Disposition","inline; filename=test.pdf");        
        ServletContext sc = request.getSession().getServletContext();

        //el servlet recibe los datos leyendo de la sesión
        ParametrosReport parametros = (ParametrosReport)request.getSession().getAttribute(ConstantesBIRT.PARAMETROS_BIRT);
        HashMap<String,Object> context = (HashMap<String,Object>)request.getSession().getAttribute(ConstantesBIRT.DATOS_BIRT);

        IReportRunnable design;
        try {
            //inicializamos el Engine desde nuestra clase BirtEngine
            this.birtReportEngine = BirtEngine.getBirtEngine(sc);
            //Open report design
            design = birtReportEngine.openReportDesign(sc.getRealPath(BirtEngine.getPath()+parametros.getPlantilla()));
            //create task to run and render report
            IRunAndRenderTask task = birtReportEngine.createRunAndRenderTask( design );        
            task.getAppContext().put(EngineConstants.APPCONTEXT_CLASSLOADER_KEY, BirtServlet.class.getClassLoader());

            //Set parameter values and validate            
            if(parametros.getParametros() != null) {
                task.setParameterValues(parametros.getParametros());    
                task.validateParameters();
            }

            //ponemos el contexto
            task.setAppContext(context);

            //set output options
            HTMLRenderOption options = new HTMLRenderOption();
            //forzamos el PDF
            options.setOutputFormat(HTMLRenderOption.OUTPUT_FORMAT_PDF);
            options.setOutputStream(response.getOutputStream());
            task.setRenderOption(options);

            //run report
            task.run();
            task.close();         
        }
        catch (Exception e) {
            e.printStackTrace();
            throw new ServletException( e );
        }
        finally { }
    }

    // ...
}
```

Ahora ya tenemos un BIRTEngine y un servlet que acepta peticiones de BIRT, el cual las redirige al engine y procesa para obtener un PDF.

Para que el servlet esté contenido en Liferay, será necesario que lo añadamos al web.xml del portal Liferay (`<servlet>` y `<servlet-mapping>`), donde definiremos la URL de escucha de peticiones del servlet, por ejemplo /birt

## CREACIÓN DE LA PETICIÓN

Tenemos el servlet iniciado dentro del contexto del portal, y tenemos el runtime preparado igualmente. Hemos definido además la interfaz de comunicación entr los portlets y BIRT (a través de un conjunto de clases Java que encapsulan los datos).

En un portlet, pasaremos los datos de la siguiente manera:

```java
//le pasamos los datos al servlet del BIRT
HashMap<String,Object> datosBIRT = new HashMap<String,Object>();

//cada portlet envía sus datos propios
datosBIRT.put("MIS_DATOS_A_BIRT_KEY", new Object() );
request.getSession().setAttribute(ConstantesBIRT.DATOS_BIRT, datosBIRT);

//le pasamos los parametros: solo la plantilla
ParametrosReport parametros = new ParametrosReport();
parametros.setPlantilla("file1.rptdesign");
parametros.setFicheroSalida( ""+( new Date().getTime() ) );
request.getSession().setAttribute(ConstantesBIRT.PARAMETROS_BIRT, parametros);
```

Ahora acabamos de pasar a la sesión de usuario los datos para que el servlet de BIRT pueda leerlos. Si os habéis dado cuenta, no aparece nada del APPLICATION_SCOPE. Eso es porque este ejemplo de código es para un portlet de Struts y por tanto trabajamos directamente con la HttpSession (obtenida de una HttpServletRequest), en lugar de las PortletSession y PortletRequest, respectivamente.

Independientemente del tipo de portlet, la "vista" a utilizar será un JSP que presente el report. En este JSP podemos incluir un IFRAME que haga la petición al servlet de BIRT, que inmediatamente leerá los datos de la sesión de usuario, presentando el report.

Para hacer la petición en el JSP:

```html
<iframe title="Impresión en PDF" style="height:500px;width:98%" src="<%=themeDisplay.getURLPortal() %>/birt"/>
```

## PRESENTACIÓN DEL REPORT

Para que el report sepa interpretar los datos que le llegan por sesión, es necesario codificar el ScriptedDatasource. Esto se realiza en los diferentes eventos del DataSet (open, fetch,...):

```javascript
importPackage(Packages.java.lang);

contexto = reportContext.getAppContext();
//importamos el paquete de la interfaz
importPackage(Packages.es.un.paquete.common.birt);
objeto = contexto.get("MIS_DATOS_A_BIRT_KEY");
```

Ahora ya sólo queda construir el DataSet en función de los atributos del objeto Java que recibe el report y, por código, enlazar cada columna del dataset con los valores del atributo, en el evento fetch del dataset:

```javascript
row["MI_ATRIBUTO"] = objeto.getMiAtributo();
```

El report debería recibir la información correctamente, asociar los valores al dataset y, por tanto, visualizar todo en un PDF.
