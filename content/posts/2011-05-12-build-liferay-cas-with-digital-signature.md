---
title: "How to build a CAS in Liferay with digital signature"
date: 2011-05-12 08:00:00 +0200
description: "An architecture for building a CAS in Liferay that validates users against a certification authority for digital certificates."
categories: [Liferay]
tags: ["liferay", "cas", "autenticación", "certificado electrónico", "plugins", "java"]
type: post
weight: 1
translationKey: build-liferay-cas-with-digital-signature
translatedFrom: 76c0fc6
aliases: ["/posts/2011-05-12-como-crear-un-cas-en-liferay/"]
---

In this article we are going to define the architecture for building a CAS in Liferay, validating our users against a certification authority for digital certificates.

For those new to Liferay, a quick word: Liferay Portal is currently the leading open source portal manager on the market. It is written in Java, and it runs on most of the major non-commercial application servers (Tomcat, JBoss, Glassfish, etc). I could talk about the product for hours.

Moving on. First, let's define CAS. CAS stands for Custom Authentication System. It is the mechanism by which we delegate the authentication of our users to systems other than Liferay.

It would probably be worth distinguishing between a CAS (Custom Auth System) and a CAS (Central Auth System), but that is material for another post. For now, just keep in mind that we are implementing a Custom Auth System.

But let's get to it...

## The environment

- Liferay 5.2.3, plugins environment
- Tomcat 5.5.27
- Oracle
- Signing client (applet + JavaScript to connect to the signing platform).

## The configuration in portal-ext.properties

- `company.security.auth.type=screenName`
- `users.screen.name.validator=my.package.MyUserValidator`
- `auth.pipeline.pre=my.package.MyPreAuth`
- `auth.pipeline.enable.liferay.check=false`
- `login.events.post=my.package.MyLoginPost,com.liferay.portal.events.DefaultLandingPageAction`
- `passwords.toolkit=my.package.MyPasswordToolKit`

## The code

Liferay uses a pipeline of classes that run one after another to decide whether an authentication attempt is valid. Each class is defined as an *Authenticator*. If all the *Authenticators* return SUCCESS, the authentication succeeds.

An example of an *Authenticator*:

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

The first thing to do is connect to our certification authority, in this case the MAP's **@-firma** platform. This platform exposes web services that return XML with the certificate data: ID, name, validity, etc.

Liferay's login system requires that the SCREENNAME input sent to the server exists as a user in the `_USER` table of the Liferay data schema. So we need to have that value before we submit.

We will make an AJAX request to the @firma web service to get the ID of the digital certificate before submitting. With the value we get back, we can make the request to the pipeline of authenticators, to validate the password against our own authentication system (LDAP, a database, or whatever we want). If it is not correct, we return FAIL and the pipeline sends us back to the login.

Next, we validate the credentials against our own user store, skipping Liferay's own validation. We do this with the property **auth.pipeline.enable.liferay.check=false**. With it, we delegate to our own authentication classes, the ones we define in the property **auth.pipeline.pre**. One important point: the ID MUST EXIST AS A LIFERAY USER, otherwise the validation will fail (the only thing Liferay will not validate is the password).

Once the pipeline finishes with SUCCESS, Liferay's own login takes over. It has the screenName (stored in the certificate, obtained from @firma, and matching some Liferay user) and the password from our user store. If it finishes with FAIL, it sends us back to the login again.

And voilà! We now have our CAS (remember, the C is for Custom) ready to authenticate with digital signatures.
