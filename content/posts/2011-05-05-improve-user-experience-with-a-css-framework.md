---
title: "Improve the User Experience with a CSS Framework"
date: 2011-05-05 08:00:00 +0200
description: "A look at building web user interfaces, and why a CSS framework is worth using."
categories: [CSS]
tags: ["css", "framework", "blueprint", "960gs", "cssgrid", "yui"]
type: post
weight: 1
translationKey: improve-user-experience-with-a-css-framework
translatedFrom: 76c0fc6
aliases: ["/posts/2011-05-05-mejora-experiencia-del-usuario-con-un-framework-css/"]
---

I think a very good application can be forgotten if it looks "ugly". It may use resources in an extremely efficient way, or the algorithms in its guts may be beautifully designed, but if the user interface leaves something to be desired, users probably won't value it as much. That's why today I want to talk about jQuery and the advantages of using a framework over not using one.

While browsing the web I recently found [this post](http://www.vcarrer.com/2008/08/when-to-use-css-framework.html), which lists the advantages of using a framework. I'll go through it and add my own thoughts.

## What Is a CSS Framework?

"A CSS framework is a pre-built library meant to make it easier to use the Cascading Style Sheets (CSS) language, and closer to the presentation standards of a web page." Source: [Wikipedia](http://en.wikipedia.org/wiki/CSS_framework#CSS_framework).

## When Should You Use a CSS Framework?

These are the scenarios where I think a framework makes sense:

- We're working on a big project (in size or in impact).
- We're working in a team and a coding standard has to be set.
- I work alone and want to control the code.

## Advantages and Disadvantages of Using a CSS Framework

### Advantages (+):

- Most of them are cross-browser, that is, most browsers support them.
- Bug support depends on the size of the framework's community. So does the number of code examples.
- They give you most of the CSS you will need for a long time.
- You can even learn by reading the CSS code!

### Disadvantages (-):

- Some of the CSS will go unused, but the size is negligible and the benefit more than makes up for it.
- It isn't hard to learn, but at first it can be overwhelming to see so much framework code, and it may take a while to handle it with ease. You need to set time aside to learn the framework, and that can be discouraging at the beginning.
- To fix a bug you have to know how the framework works.

## Examples of CSS Frameworks

Here is a list of CSS frameworks, though there are many more:

- YUI Library
- 960 GridSystem
- Blueprint

### jQuery UI

I particularly recommend jQuery, which I left off the list above on purpose. The frameworks above help create **layouts** (templates, the arrangement of spaces...) as well as the CSS, and I come from a web development world where I rely on Struts Tiles or Velocity to generate layouts (though the two could probably be integrated... hmm... as I write this I'm thinking of trying it... someday).

Focusing on jQuery UI, I recommend it for two main reasons:

1. It is very widespread among the developer community, and
2. It offers quite a wide variety of style combinations on its site, [jqueryui.com](http://jqueryui.com/). From there we can use one of the ready-made themes, or configure the final look of our stylesheet ourselves. For that it has a (wonderful) tool ([Themeroller](http://jqueryui.com/themeroller/)) to customize the look of the stylesheet in the package you download. It previews the result live, with all the framework's widgets changing their look as you modify them in the tool.

![Collage of the predefined themes in Themeroller](/images/posts/2011-05-05-framework-css/jqueryui-theme-roller-gallery.png)

Also, from the "Roll your Own" option we can customize the following categories, along with their properties:

- **Font-settings**: Family, weight and size
- **Corner-radius**: the corner radius in pixels
- **Header/Toolbar**: Background color and texture (via image), border, text and icon colors for the headers of dialogs, tabs, accordion, ...
- **Content**: Background color and texture (via image), border, text and icon colors for the content of dialogs, tabs, accordion, ...
- **Clickable default-state**: Background color and texture (via image), border, text and icon colors for the clickable elements of dialogs, tabs, accordion, ... in their default state.
- **Clickable hover-state**: Background color and texture (via image), border, text and icon colors for the clickable elements of dialogs, tabs, accordion, ... when you hover over them.
- **Clickable active-state**: Background color and texture (via image), border, text and icon colors for the clickable elements of dialogs, tabs, accordion, ... in their active state.
- **Highlight**: Background color and texture (via image), border, text and icon colors for information messages.
- **Error**: Background color and texture (via image), border, text and icon colors for error messages.
- **Modal Screen for overlays**: Background color and texture (via image) and background opacity of the modal layers.
- **Drop Shadows**: Background color and texture (via image), opacity, thickness of the opacity, offsets (top and left) and corner rounding (in px) of the shadows.

![Customizing a theme with Themeroller](/images/posts/2011-05-05-framework-css/jqueryui-theme-roller-your-own.png)

And with one simple click it's ready to download!

The online documentation is very good too. The code examples are within easy reach inside the API docs, so you can look something up quickly and see an example of how it's used.

So **my recommendation is YES, use a framework** (whichever one you find interesting) as the foundation of your work. It will help the result gain an added value it wouldn't have without it.
