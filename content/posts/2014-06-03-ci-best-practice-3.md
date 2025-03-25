---
title: "Continuous Integration Best practices: #3 Wait for commit tests to pass"
date: 2014-06-03T09:16:43+02:00
description: "Continuous Integration Best practices: #3 Wait for commit tests to pass"
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
showTableOfContents: false
---

Hi all!

This is my third blog post about Continuous Integration best practices, and today I want to explain the benefits of being patient after sending commits for being reviewed.

As developers, we are used to work on functionalities, finish them, and jump to another one. We send our work to a reviewer, and continue working on other tasks. As you probably know, in these cases our mind completely focuses on the new task to do its best, almost forgetting the previous one.

Do you remember [my last post, about running the tests](../2014-06-02-ci-best-practice-2) (manually in a local machine, or automatically in Jenkins via a pull-request)? Well, please think about not knowing about the results of this tests execution. Are you sure that your work works as expected? Are the tests finding potential bugs on it?

If you don't monitor the build that executes the test for your changes, last questions won't be answered until it's very late: when your code is pushed to your master branch, where other developers can pull from it, getting unexpected behaviour. 

So this blog post is asking you for waiting for the commit test to pass, being aware of tests results, and **start solving it as soon as possible** (if needed).

{{< figure src="/images/thinking-please-be-patient.jpg" alt="Please be patient" >}}

In my last post I also commented that the CI server is a shared resource with a lot of information. Developers should monitor it to verify that test results for their commits caused failures or not. Doing that, they are in the best place to solve potential problems, because they haven't switched context between tasks.

{{< figure src="/images/finding-bugs.png" alt="Finding bugs" >}}

One of the most important thing of this best practice is that you must know that everyone can commit errors. Furthermore, errors are an expected part of the process.

But our goal, in what we will be focused, is to find and eliminate them as soon as possible, without expecting perfection and zero errors.

While the build is running, you can organize your inbox, prepare for next tasks, have a coffee, or even go to the bathroom! Because it should take the least time for the build to finish: depending on your project size, between 10-20 minutes is OK.

Well, that the end for today. See you in next post!
