---
title: "Continuous Integration Best practices: #7 Don't Comment out Failing Tests"
date: 2014-06-07T09:16:43+02:00
description: "Continuous Integration Best practices: #7 Don't Comment out Failing Tests"
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
showTableOfContents: false
---

{{< figure src="/images/sweep-carpet.png" alt="We are going to need a bigger rung or we're sunk" >}}

Hello Continuous Readers! I'm here again to share a new CI practice in a very small pill.
 
Do you remember a time when you had some tests that continuously failed, and nobody had bandwith to work on it? What was the easiest solution for them? Of course commenting or removing them, because they were disturbing your green lights on the server.
 
Did I say of course? Of course not.
 
**This must always be the last resort**, very rarely and reluctant used, because it will hide the real problem, and what you want with your tests is exactly the opposite: to show what is happening, in special what is wrong to solve it as soon as possible.
 
Instead of using the rug as in the picture above, try to apply these simple rules:

- Has a regression been found by the test? **Fix the code!**
- Is one of the assumptions of the test no longer valid? **Delete it!!**
- Has the application really changed the functionality under test for a valid reason? **Update the test!!**

With these three very simple rules you can solve the majority of the situations related with regressions found.

See you next post!
