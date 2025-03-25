---
title: "Continuous Integration Best practices: #1 Don't check-in on a broken build"
date: 2014-06-01T09:16:43+02:00
description: "Continuous Integration Best practices: #1 Don't check-in on a broken build"
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
showTableOfContents: false
---

Hi all! I'm writing this blog entry as the first post of a continuous integration blog serie, sharing our knowledge and usage of this technique.

In these blog posts, I will to talk about some good practices I would recommend you to follow, based on my experience reading the book ["Continuous Delivery", _by Jez Humble and David Farley_](http://continuousdelivery.com/), concretely chapter number 3. And of course, my experience dealing with CI in Liferay.

One of the most important thing that I've learned reading this book, is that **Continuous Integration (CI), is a practice, not a tool**, and requires a significant degree of discipline from the team as a whole. So all team members are involved on it, and must collaborate to achieve its perfection.

{{< figure src="/images/chinese_army.jpg" alt="Team work is essential" >}}

The objective of a CI system is to ensure that a software is **working, in essence, all of the time**. So you should keep that in mind as a mantra: the software is working before your changes, and it will also work after them.

We hope this blog serie helps you if you are starting with CI, but we also want to hear your experience and your feedback about. So please comment what you consider on it.

Ok, once introduced the topic, let's start with the first practice...

## Practice 1: Don't check-in on a broken build

{{< figure src="/images/do-not-touch.png" alt="Don't touch a broken build" >}}

You are about to start a new work day, and see the build broken. Have you received an email from the CI server? If so, you should know how to proceed to verify if you are the causant of the errors, and if it is so, please **try to solve it as soon as possible** instead of starting to code that stellar functionality as a beast.

Doing that, you can identify the cause of the breakage very quick, and then fix it, because you are in **the best position to work out** what caused the breakage.

But, wait, you have already finished your work, and the build is still broken. **Why shouldn't you check-in further changes on that broken build?**

First of all, **it will compound the failure with more problems**. Imagine that you don't know about these practices, so every time you check-in, you cannot prove that your changes are not adding more errors, and maybe your changes plus existing errors cause another different problems.

Direct consequence of previous sentence is that **it will take much longer for the build to be fixed**, because you added more complexity to the problem.

Of course, you can still check-in. And you can also get used to seeing the build broken. In that case, **the build stays broken all the time :(**

{{< figure src="/images/ignore.jpg" alt="Do not ignore the broken build" >}}

And that's the cycle, it's true.

But after many broken builds, the long term broken build is usually fixed by an Herculean effort of somebody on the team (here in Liferay is usually Miguel) and the process starts again.

{{< figure src="/images/herculean-task.jpg" alt="Do not create a culture with heroes" >}}

Ok, that's all for today.

I'm looking forward to hearing your feedback!!
