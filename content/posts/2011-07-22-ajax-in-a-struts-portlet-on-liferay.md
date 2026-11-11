---
title: "Ajax in a Struts Portlet on Liferay"
date: 2011-07-22 08:00:00 +0200
description: "How to use Ajax to show data inside a Struts portlet on Liferay, with the row detail loaded into a jQuery dialog."
categories: [Liferay]
tags: ["liferay", "struts", "ajax", "jquery", "portlet", "java", "servlets"]
type: post
weight: 1
translationKey: ajax-in-a-struts-portlet-on-liferay
translatedFrom: 76c0fc6
aliases: ["/posts/2011-07-22-liferay-struts-portlet-y-ajax/"]
---

In this post I want to show how to use Ajax to display data inside a Struts portlet, something I find pretty common in business applications.

In this example, I want to show the detail of a table row in a jQuery dialog. First the page loads the collection of data to display, with only the row-level data. Then the data of the selected item is fetched asynchronously and shown in a modal layer (a 'dialog'), which improves the usability of the page a lot.

## The environment

Liferay version: 5.2.3

Portlet technology: Struts

JavaScript framework: jQuery

## The requirement

The goal is to open a jQuery dialog with the detail of an item, using Ajax to load it. It should look something like this:

![List of items](/images/posts/2011-07-22-liferay-struts-portlet-y-ajax/ajax-listado-elementos.png)

![Detail retrieved via Ajax](/images/posts/2011-07-22-liferay-struts-portlet-y-ajax/ajax-detalle-elemento.png)

## The implementation

First of all, you need a working Struts portlet. Building one is outside the scope of this post. I will probably write another one later on how to build a Struts portlet that deploys to Liferay.

Second, you need a list with the items whose detail you want to show in a layer.

Next we create a link (an image, a button, etc.) at the end of each row, so that clicking it opens a layer with the data in question, brought from the database via Ajax. With jQuery we bind the click on the link to make the Ajax request.

### On the server side

We need a Struts Action that will be called through Ajax. For that, the usual: define it in struts-config.xml and code it in the right package.

The forward of this Action must be the JSP that renders only the data of that one item. The dialog will load it once the Ajax request completes.

When coding the Action, we have to read an ID (for example) that lets us fetch the item's data from the database. We read it and put it in the request, so it is available in the JSP, with `request.setAttribute(...)`.

### On the client side

We will have two JSPs: the first one with the list of items, and the second one with the detail of the selected item, working as an '*include*'.

The detail JSP only has to read from the request the attribute set in the Action and print it on screen.

The JSP with the list has to implement a JavaScript function (with jQuery) that makes the Ajax request to the corresponding action. The Ajax function, called from the link in each row, could look like this (I'm leaving a file with the implementation of the function): [ajax-struts-portlet](https://mdelapenya.wordpress.com/wp-content/uploads/2011/07/ajax-struts-portlet1.doc)

The key is passing the parameter **`_spage`** with the URL of the action as its value. In this case, **`/portlet_action/portlet_name/module_name/view_detail`** is the one defined in struts-config.xml.

Also, the WindowState must be **`EXCLUSIVE`**.

It took me quite a while to get here. Between lack of time and research that led nowhere, I kept running into errors. At first I passed "struts_action" as a parameter to the RenderURL, and in the detail JSP that always sent me to the page defined in the **`viewPage`** of the portlet.xml file. This variation fixes that, and we quickly improve the usability of the application, because the user can see the information in a page without it being crammed in. Now it takes me no more than a couple of minutes to show data this way.

I hope it helps. If you have any questions, just leave a comment 😉
