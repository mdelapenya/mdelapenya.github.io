---
title: "Continuous Integration Best practices: #4 Never go home on a broken build"
date: 2014-06-04T09:16:43+02:00
description: "Continuous Integration Best practices: #4 Never go home on a broken build"
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
showTableOfContents: false
---

{{< figure src="/images/after_deployment_en.jpg" alt="It's not my problem what happens after the deployment" >}}

I love that picture! Imagine yourself any Friday, at the end of your day-work. You look at the CI server and, unluckily, it is broken. You have only three options:

1. **Resign yourself** that you will be leaving late, because you'll try to fix it.
2. **Revert you changes** and retry next week.
3. Leave now and **leave the build broken**.

Of course, the best choices are to choose number 1 or number 2, never number 3. In the above picture, Iron-man decided that he doesn't mind what will happend after that "bomb". But why is it a bomb to leave the build broken?

It's a bomb, because any co-worker that pulls from your master branch will get dirty code. And what happens with this? Please look back to [my first post](../2014-06-01-ci-best-practice-1) about don't check-in on a broken build.

On the other hand, if you try to solve, or even revert your changes before leaving, you will keep the build green, and other developers will be happy to pull safe code from SCM repository.

Some good practices to avoid potential problems are:

- Check in frecuently and early enough to give yourself time to deal with problems should they occur
- Experienced developers often save checks in for the next day

Well, at this point you could say: _"Ok, I follow similar practices but my team is distributed and we have problems working in different time zones"_.

In Liferay we actually have this "problem":

{{< figure src="/images/mapamundi.png" alt="Mapamundi" >}}

As you can see, we work in different time zones: China, Europe and America, [following the sun](http://en.wikipedia.org/wiki/Follow-the-sun).

In case of problems:

- If China breaks the build... then Europe day's work is dramatically affected
- If Europe goes home on a broken build... America would be screaming and crying

{{< figure src="/images/crying.png" alt="Developers crying" >}}

How have we solved it? Well, at this point the figure of the Build Master appears:

{{< figure src="/images/templario.png" alt="Build keeper" >}}

This role not only mantain the build but **also policed it**, ensuring that whoever broke the build was working to fix it. If not, the build engineer **would revert that check-in**, so it's mandatory that the build engineer has write access to the master branch in your SCM, or prioritize his commits, otherwise.
 
The build master is a controversial role, because nobody wants to see his/her commits rolled back. But the whole team should accept that this is not a personal offense, it is another effort to improve the quality of the product, never criticizing the developer.
For that, we all should open our mind and accept that is not bad to revert someone's commits: they are still present in the history of the project, so we could restore them whenever we need them. And after all, those commit were breaking something, weren't they?
 
I will talk about reverting in the next episode, so let's see then!
