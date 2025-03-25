---
title: "Non-official Liferay Portal CE images on DockerHub!"
date: 2018-10-01T09:16:43+02:00
description: "Non-official Liferay Portal CE images on DockerHub!"
categories: liferay
tags: [liferay, docker]
type: post
weight: 25
showTableOfContents: true
---

Hi Liferayers! We'd like to share with you that we have created non-official, public Docker images from our master branch! And we are releasing them every day.

{{< figure src="/images/Ray_meet_Docker.png" alt="Ray loves Moby" >}}

The rationale for pushing to a non-official, public repository is simple: anybody in the world could fetch and build the platform from Github, so why not making it easy for them, offering a Docker image with that process already done? We have learned a lot by doing this for months, and are now ready to make them public.

Why non-official? Well, we would like to publish Liferay DXP images first, which we'll explain later on in this post.

## Where are the Liferay Portal CE images published?

If you want to use this image, please use this Docker repository [mdelapenya/liferay-portal-nightlies](https://hub.docker.com/r/mdelapenya/liferay-portal-nightlies/). The tag name convention is:

- `latest`, which will be overriden every day.
- `date`, in **yyyymmdd** format, i.e. `20170901`. A version will be created every day.

## What is the structure of the image?

Our public images run with OpenJDK, more specifically JDK 8u141, so we are leveraging the Docker image the OpenJDK team created: openjdk:8u141-jdk, which is based on Debian Jessie.
 
Then we add the result of the build process (hello "ant all" my old friend), a bundle with the current version of Tomcat. And finally we expose port 8080.
 
## What are we doing with these Liferay Portal CE images?

We are using this image to internally deploy Liferay Portal CE projects to several servers, so that any team in the company can use it and play around with current development of the product. But we don't only deploy those images; we have also trained teams to use it locally. For instance, if UX/Design teams need to check a behaviour in a version, they can start it locally and compare features between different versions.

## What happens with Liferay DXP images?

We are working on creating them. Customers have been asking for Docker images for a while, and we want to meet that request. Also, internal clients such as [WeDeploy](https://wedeploy.com/), which is using its own Docker image for Liferay DXP SP4, could potentially consume those images. That's why we published Liferay Portal CE images first under my personal account instead of the official. Once we have everything in place for Liferay DXP and Liferay Portal CE images, we will push the Liferay Portal CE ones back to the official repo. We hope that this serves the needs of both our customers and community, by eventually providing both Liferay DXP and Liferay Portal CE images. :)

And that's all :)

As always, please send us your feedback, and hope this kind of actions helps both the Company and our Community.

Cheers!
