---
title: "Continuous Integration Best practices: #2 Always run the tests"
date: 2014-06-02T09:16:43+02:00
description: "Continuous Integration Best practices: #2 Always run the tests"
categories: continuous integration
tags: [continuous integration, ci]
type: post
weight: 25
showTableOfContents: false
---

Following with these blog posts series about good practices in Continuous Integration, I want to talk about the benefits of running tests.

## Practice 2: Always run the tests

When a developer commits a new functionality, it's expected that in that commit, the software works as what we believe it should work. And, if a software works as expected in a single commit, why not release in that state? And what would happen if we can assert that every commit in the history makes the software to work as expected? Just iterate the sentence "release in the $COMMIT" through each commit in the history... We would have achieved the ability to be more "releasable", as we can release in whatever commit we want.
 
At this point, we should have realized how important a single commit is, as it could trigger the creation of a release candidate.
 
Ok, we know what the goal is: to have good commits that works as expected but, how can we achieve it? How can our commits be more releaseable?
 
One of the most important thing you can do to verify that your commits work as expected is to write well written test for them, and w hen I say well written I mean that they must test the functionality: conditionals, loops, different values..., not only the [happy path](http://en.wikipedia.org/wiki/Happy_path) of the test.
 
Once you have written good tests, you need to run them, and check results. I will assume that you know how to write and run tests, this is not the main goal of this blog entry, so let me continue without that explanation.

In Liferay, we can run tests in two ways:

1. **Locally**: a developer can use some `ant` targets to run tests in his/her own workspace, so he/she can test the code before sending it. Please read the wiki page explaining the Testing Infrastructure in related assets:
    - `ant test-unit`: execute all unit tests (dependencies to other systems, i.e. databases, are not real: we mock what we need)
    - `ant test-integration`: execute all integration tests (dependencies to other systems are real, not mocked)
    - `ant test-class`: to execute only one test class
    - etc. 

2. **After sending a [pull request](https://help.github.com/articles/using-pull-requests)**: we use [Jenkins](http://jenkins-ci.org/) as CI server to manage all our CI processes, and we have made that every pull request sent to a peer reviewer is monitored by the CI server: it checks out the code, and execute some tasks (compilation, format source, test execution...) The cool thing here is that there is [a Jenkins plugin](https://wiki.jenkins-ci.org/display/JENKINS/Github+pull+request+builder+plugin) that can monitor the pull request and operate after tests results, managing Github pull request (auto closing if it breaks tests, writting comments, changing pull status...). In this scenario, a peer reviewer knows if the pull request he/she is going to review is good or breaks something, so we **reduce the feedback loop** a lot with this process, discarding bad pulls as soon as possible.

Mmmm... interesting, two places to run tests: locally and in the CI server. But why both?

You as developer could have the latest version of a library, or a driver, or an application that configures XXX in your O.S, or even your O.S. is tunned because YYY.
On the other hand, **the CI server is a controlled environment**, it always runs with the same scenario, for each commit sent by each developer, so every test is executed with same conditions, in every build, for everyone. And that's a very good choice, because then, your test results will be repeteable.
 
Maybe you don't want to execute tests locally, it's ok, we don't have problems with that, but try always to run the tests in a controlled environment.
 
Another good capability of the CI server, because of being a controlled environment, is that it is also a centralized information repository: everyone in the team can look at it searching for build results, and seeing what is happening at every moment related to tests. The CI server produces logs for almost everything, so it's very easy to read them and to be informed about the real state of the commit (and the project, too).

Once looking up the server logs, which logs are the most important for us to verify that our commits are good? Well, we have two possible options to know what is happening:

- **Jenkins logs**: you can configure Jenkins to send the commiters an email with test results, telling them that their commits produced a breakage. In this case we have improved the usability of default Jenkins email, to make its reading easier.
- **Github logs**: the plugin we use to monitor pull requests can write comments on Github, so _this really good platform_ also sends emails when a pull is commented with tests results. So a developer inmediately knows whether his/her commits passed the tests or not.

Both of them produce very good complementary information a developer will know what to do with. Then, try to notify them with every break your CI system discovers, so the culprit can be ready to solve it as soon as possible, as we saw in last practice. 

That's all for today, please wait till next blog entry about CI best practices!

Byes!
