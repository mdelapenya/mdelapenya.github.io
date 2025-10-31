---
title: "Cómo crear un CAS en Liferay con firma digital"
date: 2011-05-12 08:00:00 +0200
image: ""
description: "Arquitectura para construir un CAS en Liferay, validando usuarios contra una entidad certificadora de certificados digitales."
categories: [Liferay]
tags: ["liferay", "cas", "autenticación", "certificado electrónico", "plugins", "java"]
type: post
weight: 1
lang: es
showTableOfContents: true
---

En este artículo vamos a definir la arquitectura para construir un CAS en Liferay, validando nuestros usuarios contra una entidad certificadora de certificados digitales.

Para aquellos noveles en Liferay, comento brevemente que Liferay Portal es actualmente el gestor de Portales OpenSource líder en el mercado. Además está escrito en lenguaje Java, y es compatible con la mayoría de los principales servidores de aplicaciones no-comerciales (Tomcat, JBoss, Glassfish, etc). Pero estoy seguro que podría estar horas hablando sobre el producto.

Continuo. Lo siguiente sería el definir CAS. CAS significa Custom Authentication System, (Sistema Personalizado de Autenticación), por el cual delegamos en otros sistemas diferentes de Liferay la autenticación de nuestros usuarios.

Quizá sería conveniente desambigüar entre lo que es un CAS (Custom Auth System) y un CAS (Central Auth System), pero esto será material de otro post. Quedémosnos con que estamos implementando un Custom Auth System.

Pero entremos en materia...

## El entorno

- Liferay 5.2.3, entorno de plugins
- Tomcat 5.5.27
- Oracle
- Cliente de firma (applet + javascript para conectar con la plataforma de firma).

## La configuración en el portal-ext.properties

- `company.security.auth.type=screenName`
- `users.screen.name.validator=my.package.MyUserValidator`
- `auth.pipeline.pre=my.package.MyPreAuth`
- `auth.pipeline.enable.liferay.check=false`
- `login.events.post=my.package.MyLoginPost,com.liferay.portal.events.DefaultLandingPageAction`
- `passwords.toolkit=my.package.MyPasswordToolKit`

## El código

Liferay utiliza un pipeline de clases que consecutivamente se ejecutan para decidir si un intento de autenticación es válido o no. Cada clase se define como un *Authenticator*. Si todos los *Authenticators* devuelven SUCCESS, entonces la autenticación será correcta.

Un ejemplo de *Authenticator* será:

```java
public class MyLoginAuth implements Authenticator
{
    private static Log _log = LogFactoryUtil.getLog(MyLoginAuth.class);
    ...
    protected int authenticate(
        long companyId, String emailAddress, String screenName,
        long userId, String password, Map headerMap, Map parameterMap)
        throws AuthException
    {
        int result = Authenticator.FAILURE;
        _log.debug("Looking for ["+screenName+"]");
        try
        {
            //calls to my custom auth system
            _log.debug("User ["+screenName+"] found");
            result = Authenticator.SUCCESS;
        }
        catch(LoginFailException e)
        {
            _log.error("Login failed for user ["+screenName+"]");
            result = Authenticator.FAILURE;
        }

        return result;
    }
}
```

Lo primero de todo será conectarse a nuestra entidad de certificación, en este caso la plataforma del MAP **@-firma**. Este plataforma consta de servicios web que devuelven XML con los datos del certificado: ID, nombre, validez, etc.

Para ello, y ya que el sistema de login de Liferay obliga a que el input del SCREENNAME que se envía al servidor exista como usuario en la tabla `_USER` del esquema de datos de Liferay, es preciso que antes de hacer submit tengamos ese valor.

Haremos una petición AJAX al servicio web de @firma y así obtengamos el ID del certificado digital previamente a hacer la petición. Con el valor obtenido del servicio web, ya podemos hacer la petición al pipeline de authenticators, para validar la password contra nuestro propio sistema de autenticación (LDAP, BBDD, o lo que queramos). Si no es correcta, devolvemos FAIL y el sistema del pipeline nos echará al Login de vuelta.

A continuación, validaremos las credenciales contra nuestro propio almacén de usuarios, saltándonos la propia validación de Liferay. Ésto lo conseguiremos con la propiedad **auth.pipeline.enable.liferay.check=false**. Con esto estamos delegando en nuestras propias clases de autenticación, que definimos en la propiedad **auth.pipeline.pre**. Es importante destacar que el ID SÍ TIENE QUE EXISTIR COMO USUARIO DE LIFERAY, pues de lo contrario la validación será incorrecta (lo único que Liferay no validará es la password).

Finalizado el pipeline con SUCCESS, se delega en el Login propio de Liferay: tenemos el screenName (almacenado en el certificado, obtenido de @firma, y coincidente con algún usuario de Liferay) y la password de nuestro almacén de usuarios. Si finaliza con FAIL, nos echará al Login nuevamente.

Y voilà! Ya tenemos nuestro CAS (recordad lo de Custom) preparado para autenticar con firma digital.
