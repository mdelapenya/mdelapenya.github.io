---
title: Creating a Wedding Page Using Software Engineering Best Practices
date: 2015-06-24T09:16:43+02:00
description: "Creating a Wedding Page Using Software Engineering Best Practices"
categories: software engineering
tags: [software engineering, heroku, git, instagram]
type: post
weight: 25
showTableOfContents: true
---

Imagine you get married next summer and you decide to have a nice website for the wedding, with some cool pictures and good information for your guests.

Imagine you are software engineer, and you want to create it by yourself.

This post is about the combination of both scenarios.

Firstly, I tried to create a very simple website from a basic template. It should not connect to any DB, so I decided to avoid using any CMS/Blog product like Wordpress, Joomla!, Blogger, etc, so I started writing pure HTML on **SublimeText3**.

Once I realized that I’m not so good at designing or creating beautiful HTML web pages, I looked for an HTML5 template, maybe adding a CSS/JS framework which allowed defining cool transitions between website sections. And I found www.html5up.net. This site has really good templates you can download and customize. After trying some of their templates, I finally chose **Big Picture**: [http://html5up.net/big-picture](http://html5up.net/big-picture). It does not use the most common CSS framework nowadays, Twitter Bootstrap. Instead, it uses Skel ([http://getskel.com](http://getskel.com)), a lightweight responsive framework, which worked pretty well for my purpose.

I downloaded the template, and the first thing I did was to create a Git repo, where the first commit was to initialize the website with the vanilla template. As it was a secret project, I used **[Bitbucket](https://bitbucket.org)** as remote repo, because it offers *private repos for free*, which is really really cool. This way I had a live backup of the code. And started coding…

## A change, a commit
No mind it was a minor fix on a text, I committed. If you force yourself to abstract your thinking process to identify separated concerns, then you will be able to create smaller commits, which only relate to one thing. And having a lot of commits relating each one to its own concern, when later on you find a bug (be sure you’ll do it), you’ll be able to identify the root cause of the bug, and you’ll be able to correct the specific commit that caused. This way I could easily power-up the default template and extend it to my needs, such as adding new sections, or even adding new functionalities.

I have to say that it’s very important to see the progress of what you are doing, so I set up a local environment where to test/verify/check your work. In my case, I set up the **Apache 2.4.9** pre-bundled on my MacBookPro with OS X Yosemite.

## Creating user interactions with media
I thought it could be a cool idea if people could share the pictures taken during the wedding to the website. This could give the website a more interactive aspect, that otherwise could be an static website.

I firstly thought having a file system, but I did not want to pay for storing those pictures when there are free services that do that for me.

Which options are there in this universe? I have a **Flickr** PRO account for my personal images, which means unlimited storage, but how could people send me their images? No, I immediately discarded it.

What about **Instagram**? Everybody knows it, knows how to use it, and works pretty well for this kind of events. I decided to add an Instagram integration, which would collect those pictures tagged with the specific tag I instructed my guests to use when uploading their images.

After several trials, I found this one that seemed good for my purpose: [https://github.com/NOEinteractive/instagramphp](https://github.com/NOEinteractive/instagramphp), so I git-cloned the repo, copied the instagram.php to my project, and added the initialization on my index.html.

As you can imagine, I needed to convert my HTML files to **PHP** to use the integration. It wasn’t too bad, as the main principle of the project was to be simple. And using PHP requires only an Apache server and PHP installed, which is something that all hosting providers have. So I switched all HTML files to PHP, and I could even refactor and extract common files to PHP includes, like the header or the footer, which are reusable between other pages.

Ok, for the Instagram integration to work, or better said, in order to connect to the **Instagram web-services**, you need to create an application on Instagram, and they send you a code for your app. You will need to provide a pair of values as credentials (username and access-token) in order to connect to their web-services and fetch the images reading the output in JSON format. Depending on what you want, you can fetch all images of a user, the likes of an image, etc, but in my case I wanted to fetch all the images with the tag I chose for the wedding. So I modified the Instagram integration to connect to the specific endpoint for tags:

{{< highlight bash >}}
https://api.instagram.com/v1/tags/{tag-name}?access_token=ACCESS-TOKEN
{{< / highlight >}}

Just to make it cooler, I worked on adding the picture of the user who took the picture as an “overlayed” badge on the Instagram picture, so everybody could see who took it (self pride). I also added the number of likes of each picture to create satisfaction on photographers for seeing how many likes got their photo.

## Deploy time
Well, the website/application is almost done. The next thing you have to think about is where to publish it. As I said, I could have used a hosting provider, with Apache+PHP installed by default. But I did not wanted to pay anything for this small project.

Another weird thing of hosting providers I totally hate is the **upload process**.

How many of you are uploading customized Wordpress sites to hosting providers? And how many of you upload them using FTP? How do you control what is uploaded, or what is updated, or what is not? Do you upload/download the whole website?

Well, FTP is good for files. But for code, you need another thing. You need to control the deployment of the code you are writing: which part is deployed, which one is ready to release. So I needed another more “engineered” process to publish the website.

For engineered I mean controlled. And how do you control the software you produce? With your git repo.

If you are able to publish/deploy an specific version of your code, you get the control over the deployment. And how you get specific versions of your code? With your commits, which were small and atomic. So you could incrementally add value to your application deploying a set of commits every time you need. Maybe the ratio one-commit-one-deployment is too much… or maybe not. It depends on you, your business, and the rules your managers force you to follow. In my case, I decided to deploy with every commit.

And I thought of **Heroku**.

[Heroku](https://www.heroku.com) is a cloud application platform, which supports Ruby, Node.js, Python, Java, and PHP by default. And what is better, you “**pay as you grow**”. So it fitted pretty well with the requirements of my wedding website, which at this point is an small PHP project, which did not need a paid account on Heroku, because the free one was enough.

I created an application on my Heroku free account, which allows 5 small applications, and added it as remote of my Git repo. And then…

{{< highlight bash >}}
git push origin master && git push heroku master
{{< / highlight >}}

With these commands my Bitbucket repo and my Heroku application are synchronized, as Heroku deploys with every git-push.

I could even have automatically added a git tag with every deployment, but I considered it unnecessary. And voilà! My small wedding website was running on Heroku on the commit I chose.

Next step was to simplify the DNS name, buying a domain and assigning it to the Heroku url. Just configure the domain configuration to forward to your app and you’ll have a simple, beautiful name besides your app.

## Metrics
Once deployed, maybe you would like to know when, from where, and how people are using the wedding website. For that I integrated Google Analytics just to collect all those metrics, and see if iPhone or Android is the most used mobile device, or which is the most used browser, Safari or Chrome. Besides, it can help you determine if you must fix the resolution of the website because 44% of your users use 360x640 px.

Just add the Google Analytics script in your header and everything will work.

## Summary
I’m pretty sure you think many other much better ways to achieve what I’ve explained here. Please share them here with us, I’d love to hear your voice.

Finishing, independently you develop a huge software product or a small project, please **follow good practices**. In your case, do what you want, but **please please commit small pieces of code, a lot**.
