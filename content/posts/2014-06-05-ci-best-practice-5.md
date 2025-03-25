---
title: "Continuous Integration Best practices: #5 Be prepared to revert"
date: 2014-06-05T09:16:43+02:00
description: "Continuous Integration Best practices: #5 Be prepared to revert"
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
showTableOfContents: false
---

{{< figure src="/images/ready-set.jpg" alt="Ready, set, go!" >}}

In this blog post I want to talk about developers mentality, about how they (we) create software that never fails, and brights more than the sun, and is faster than a jet plane... or not?
 
No, seriously, developers are more selfish about our code than other careers, and we usually don't like others criticising us for it. Well, but we must not forget that we are in a team, with many co-workers (maybe distributed all around the world), and one of our highest wishes must be a software product with the best quality. And in order to achieve that quality, we have to polish defects we commit.
 
If you remember my last post, there is a role named "Build Master", that is responsible to polish those defects, reverting wrong commits and addressing the issue back to the developer who caused the problem.
 
I think that I've written this before, but maybe is better to empower this idea: **we all make mistakes, so everyone of us will break the build from time to time**.
 
And the important thing is not to blame the developer, no. Indeed the most important thing is to get everything working again quickly. Of course, if you aren't able to fix the problem quickly, for whatever reason, **you should revert the previous change-set** held in the version control, and remedy it locally. After all, you know that previous version was good. Why? **Because you don't check-in on a broken build!!!**
 
I'll add a brief story to show you how reverting is a good idea :)
 
Airplane pilots assume that something will go wrong, so they should be ready to abort the landing attemp, and 'go around' to make another try.

{{< figure src="/images/airplane-landing.jpg" alt="Airplane landing" >}}

Imagine how critic is this landing process compared with a set of commits: they prefer aborting it in order to avoid human beings deaths rather than doing a dangerous maneuver. So, why not doing the same with those conflictive commits, that will be re-sent as quick as possible?
 
So, my advice is: Don't be afraid, my friend... and revert.
