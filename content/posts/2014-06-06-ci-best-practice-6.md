---
title: "Continuous Integration Best practices: #6 Time-Box fixing before reverting"
date: 2014-06-06T09:16:43+02:00
description: "Continuous Integration Best practices: #6 Time-Box fixing before reverting"
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
showTableOfContents: false
---

Hello my friends!

Here I'm again after a long time without writting about CI in Liferay. If you remember my last post, it described the importance of reverting those commits that break the build as quick as possible.

Well, in this blog post I will share a small pill that can help you during the revert process.

Before reverting an offending commit, establish this rule: whenever the build breaks on check-in, try to fix it for an specific amount of time, defined by your interests, in example 10 minutes.
 
If, after that, you aren't finished, **revert** to the previous version.

{{< figure src="/images/countdown.gif" alt="Countdown" >}}

In Liferay, we usually dedicate 20-30 minutes to investigate the problem. If we cannot solve it, because we don't know much of the functionality that is breaking the build, then we rollback.
 
Another thought that we feel trying to solve other developer's failure is that maybe they will see you as the last bullet on the gun, and they don't mind on breaking the build "because it will be fixed magically when I come to work tomorrow".
 
Instead, we prefer reverting the commits, and notify the developer with another specific email (not only the automatic email sent by the CI server), explaining why we have rolled back the commits, so actually he/she is aware of the failure.
 
Just my two cents!
