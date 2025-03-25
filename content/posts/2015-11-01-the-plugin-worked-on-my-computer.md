---
title: "\"The plugin worked on my computer\" is not valid anymore"
date: 2015-11-01T09:16:43+02:00
description: "The plugin worked on my computer"
categories: development
tags: [development, liferay, arquillian]
type: post
weight: 25
showTableOfContents: false
---

Hello my lovely Liferay developers!
 
I'm very proud and glad to announce that, from now on, we are going to be able to write integration test in our Liferay plugins!
 
_* Before breaking this down, I want to thank all people that collaborated as a strong team to achieve this: [Carlos Sierra](https://www.linkedin.com/in/carlos-sierra-andrés-60a6232), [Cristina González](https://www.linkedin.com/in/cgonzalezcastellano) and [Miguel Pastor](https://www.linkedin.com/in/miguelpastorolivar), who worked really hard to push this awesome stuff to the product._

{{< figure src="/images/joker-clapping.gif" alt="Thank you!" >}}

> **UPDATE**: On Feb, 3rd Arquillian released some contributions to execute integration tests on OSGi modules for Liferay 6.2 and so on. Please visit this blog entry on Arquillian community: http://arquillian.org/blog/2015/02/03/arquillian-extension-liferay-1-0-0-Alpha1

_Hey man, wait, what do you mean by integration test?_
 
Well, with integration tests I mean those tests that rely on other services, like portal services or even services within the plugin itself. We will have a real (not mocked) instance of that service, with all the wiring it uses (Persistence behaviour, caches, indexing, etc).
 
This black magic has been desired by many of you since years, but at last, we have made a fine integration of Liferay with one of the coolest testing frameworks nowdays. This framework is Arquillian (http://arquillian.org), an innovative and highly extensible testing platform for the JVM that enables developers to easily create automated integration, functional and acceptance tests for Java middleware.

Directly shot from http://arquillian.org/invasion:

- Managing the lifecycle of the container (or containers)
- Bundling the test case, dependent classes and resources into a ShrinkWrap archive (or archives)
- Deploying the archive (or archives) to the container (or containers)
- Enriching the test case by providing dependency injection and other declarative services
- Executing the tests inside (or against) the container
- Capturing the results and returning them to the test runner for reporting

In a few words: _"**Arquillian brings your test to the runtime**, giving you access to container resources, meaningful feedback and insight about how the code really works."_
 
Firstly, you should know that Arquillian can use three containers types (I'll only mention them, so please visit their documentation website to understand more of them):

- Embedded: the test runner contains the container as a library
- Managed: the test runner starts and stops the container as a separated process
- Remote: the test runner relies on an operational container, already started.

After tons of beer and two or three minutes discussing this, we think that the best option to start with is using a Remote approach. This allow us to run test in development time and we can supply managed behavior using CI scripts if needed.

Just to  make things easier, we have added some capabilities to our plugins SDK to configure a Liferay bundle (the one defined on the SDK) with Arquillian support, which means:

- JMX enabled and configured.
- Tomcat's manager installed and cofigured.
- Arquillian dependencies available on compile/test time.

I'll explain them later more deeply.
 
Secondly, we have created a library that make it easier to create a **WebArchive**, the file that Arquillian needs to send to the container. This piece of software builds a WebArchive and execute portal's auto-deployers, so just see the WebArchive as an abstraction of a plugin WAR file that has been dropped on LIFERAY_HOME/deploy folder, but not deployed to the container.
 
At this moment, you must define a method with Arquillian's @**Deployment** annotation, and build your WebArchive there. (We are deciding how to improve this, but for now it's mandatory to define this deployment method).
 
Once we have created the WebArchive, we can add classes (or resources) to that archive, which it's actually a very good thing, because we are making test dependencies explicit: just read the test to see all of them.

Please see the library here: https://github.com/liferay/liferay-portal/tree/master/modules/sdk/ant-arquillian
 
Lastly, test classpath must contains an arquillian test descriptor, where you define where your remote server is running. This file, named "arquillian.xml" is placed under PLUGIN-NAME/test/integration folder.
 
Mmm... let me think... I believe that's all, so let's summarize!

- Tomcat configured with JMX, manager, and valid credential to access the manager
- Library that builds the plugin so that Arquillian knows how to deal with
- Test classpath configured

We have added some cool tools on the SDK so that you can add all this previous configuration executing only two ANT targets:

- On root folder of plugins SDK (ONLY FOR FIRST TIME YOU START WITH SDK): **ant setup-testable-tomcat**, which will configure your bundle, affecting these files.
    - CATALINA_HOME/bin/setenv.sh file, to configure JMX
    - CATALINA_HOME/conf/tomcat-users.xml file, to configure tomcat's manager users and roles
    - webapps/manager, web application Arquillian communicates with to deploy your tests on the container.
- On root folder of your plugin: **ant setup-arquillian**, which will configure your plugin, affecting these files.
    - test/integration/arquillian.xml, to define the credentials to log in the tomcat's manager
    - add Arquillian dependencies to test classpath 

Well, our plugin supports now Arquillian! But we need to write a test that verify the integration with portal.
 
So, let's dirty our hands!
 
This is the minimum recipe to achieve it:

1. Start your Tomcat, already configured with provided ant tasks
2. Create a test class under test/integration folder.
3. Run your test using Arquillian test runner.
4. Add a method to the test class to retrieve the WebArchive, using @Deployment annotation.
5. Add a test method that verifies some functionality in the portal, i.e., retrieving the number of calendars on calendar portlet.
6. Execute the tests:
    - Using ANT: ant test-integration
    - Using your IDE

* Note that test dependencies has been declared in an IVY test configuration on plugins SDK, so no test-related plugin configuration must be done, as it's inherited from SDK.

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

In this example, CalendarLocalServiceUtil is a real object, so no need of mocking anymore!!!

{{< figure src="/images/lets-celebrate.jpg" alt="Let's celebrate!" >}}

**But, why is this CalendarLocalServiceUtil a real object? Where is the magic here?**

Arquillian deploys the fully working plugin into the container, which has been started before. Then it executes the tests into the container, and after test execution Arquillian returns test results to the runner, undeploying the plugin after all.
 
This is really cool!! Because you can run your tests using your ANT commands on your shell, or even using your IDE, which speeds up development process.
 
**Ok, but won't it be time-consuming deploying/undeploying the plugin?**
 
Not at all. Do not forget that your container is started, so the deploy->test->undeploy cycle should be very fast (10 seconds or less). All the heavy load was done during container and Liferay portal startup, it's only your plugin actions on live.
 
**Will I be able to debug?**
 
Yes, the blessed debugger! If you start your container in debug mode, then you can create a Remote connection to your tomcat and debug. Have you noticed I said Remote connection? Why did I say that?
 
As you have read some paragraphs before, the tests will be executed on a Remote server (maybe in your local machine, but still remotely), so you need to configure your IDE to point to that debug port.

**Future?**
 
Well, as you can figure out after this reading, we could backport this to 6.2.x and 6.1.x branches, so plugins on that versions can be tested.
 
And of course, next benefit of having Arquillian integration is that we can start writting more tests in our plugins right now!!!
 
As all of you already know, we are doing huge efforts trying to convert Liferay into a nicer, simpler and more extensible platform to use. In the near version you will be able to write apps on top of Liferay in a completely different way, and, of course, we want you to test this new applications, so we are currently going through the review process of the basic testing infrastructure which will support this new testing mechanisms.
 
Well, that's all. We'd love to hear your voice, so please comment here what you want.
 
See you, and remember this...

{{< figure src="/images/be-happy_o_2175003.webp" alt="Thank you!" >}}
