---
title: "Integrating Liferay with BIRT"
date: 2011-05-23 08:00:00 +0200
description: "Business applications almost always need to produce printable output: PDF, Excel, Word. Here is how I integrate a reporting engine, Eclipse BIRT, with Liferay, so every portlet can generate its reports through the portal."
categories: [Liferay, "Desarrollo Web"]
tags: ["birt", "eclipse", "java", "liferay", "plugins", "portal", "reports", "servlets"]
type: post
weight: 1
translationKey: integrating-liferay-with-birt
translatedFrom: 76c0fc6
aliases: ["/posts/2011-05-23-integrando-liferay-con-birt/"]
---

One of the main features of any business application is showing information in a printable format: PDF, Excel, Word, and so on. So today I'm going to show you how to integrate a reporting engine, Eclipse BIRT, with Liferay.

To follow this post you need Eclipse Helios and the BIRT plugin, installed from the "Install New Software" option in Eclipse, using the repository "http://download.eclipse.org/releases/helios"

The strategy is to keep BIRT out of the portlets and let Liferay manage it. We will start the BIRT engine inside Liferay, and the portlets will consume that service to generate their reports.

In short, these are the steps to integrate BIRT with Liferay:

1.  Download the BIRT runtime
2.  Define the interface used to pass information from a portlet to BIRT
3.  Create a servlet for the engine inside Liferay
4.  Call it from any portlet
5.  Display the data

## Downloading the BIRT runtime

First of all, we need the reporting engine. We can get it from the Eclipse BIRT site (the Phoenix project). There, go to "Latest BIRT Runtime Release Build", which in this case is 2.6.2, and download the Runtime (direct download).

![Downloading Eclipse BIRT](/images/posts/2011-05-23-integrando-liferay-con-birt/birt-runtime-download.png)

The runtime has to be installed somewhere the Liferay portal's application context can reach, since that is where we want the BIRT engine to live. A good place for it is the portal's WEB-INF/birt-runtime.

## The interface between BIRT and the portlets

Thinking about the architecture, we are building a system in which the Liferay portal listens for report requests coming from any portlet deployed in it, and the portal alone is responsible for handling them. So it makes sense to define a communication interface between the BIRT engine and the portlets.

To do that, we can create a set of Java objects that wrap the data we pass to the report, so the data always travels with the BIRT request in the same way. That gives us two things:

1.  One way of producing reports, with report management centralized in the portal: we don't deploy BIRT inside every single portlet that uses it.
2.  No BIRT in the data access layer. We don't use JDBC DataSources: each portlet gets its own Java objects and hands them to BIRT. In the report we only use ScriptedDatasources to reach those Java objects.

![Communication interface between the portlets and BIRT](/images/posts/2011-05-23-integrando-liferay-con-birt/birt-interfaz-comunicacion.png)

BIRT lives inside the Liferay context, so for it to read that data the portlets must leave it in the application context (APPLICATION_SCOPE). To get that, add the following element to the liferay-portlet.xml file of each portlet:

```xml
<private-session-attributes>false</private-session-attributes>
```

This way the portlets can share data with the portal session.

## The BIRT engine and the servlet that listens for requests

We have the interface. Now we need a servlet that starts the BIRT engine, but first we need the class that represents our BIRTEngine.
As you will see, the class has a properties file as an attribute. That is where the path to the runtime goes, which we left in `WEB-INF/birt-runtime`.

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

Now we have a BIRTEngine and a servlet that accepts BIRT requests, forwards them to the engine and processes them to produce a PDF.

For the servlet to live inside Liferay, we have to add it to the portal's web.xml (`<servlet>` and `<servlet-mapping>`), where we define the URL the servlet listens on, for example /birt

## Creating the request

The servlet is running inside the portal's context, and the runtime is ready too. We have also defined the communication interface between the portlets and BIRT (a set of Java classes that wrap the data).

In a portlet, we pass the data like this:

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

We have just put the data in the user session so the BIRT servlet can read it. If you noticed, there is no APPLICATION_SCOPE anywhere. That is because this code example is for a Struts portlet, so we work directly with the HttpSession (obtained from an HttpServletRequest) instead of the PortletSession and PortletRequest.

Whatever the portlet type, the "view" will be a JSP that displays the report. In that JSP we can include an IFRAME that makes the request to the BIRT servlet, which immediately reads the data from the user session and renders the report.

To make the request in the JSP:

```html
<iframe title="Impresión en PDF" style="height:500px;width:98%" src="<%=themeDisplay.getURLPortal() %>/birt"/>
```

## Displaying the report

For the report to understand the data it receives through the session, we have to write the ScriptedDatasource. This is done in the different events of the DataSet (open, fetch, ...):

```javascript
importPackage(Packages.java.lang);

contexto = reportContext.getAppContext();
//importamos el paquete de la interfaz
importPackage(Packages.es.un.paquete.common.birt);
objeto = contexto.get("MIS_DATOS_A_BIRT_KEY");
```

All that is left is to build the DataSet from the attributes of the Java object the report receives and, in code, bind each column of the dataset to the attribute values, in the dataset's fetch event:

```javascript
row["MI_ATRIBUTO"] = objeto.getMiAtributo();
```

The report should receive the information correctly, bind the values to the dataset and, as a result, show everything in a PDF.
