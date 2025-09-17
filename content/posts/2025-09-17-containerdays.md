---
title: "ContainerDays 2025, my experience"
date: 2025-09-17 10:00:00 +0530
image: "/images/posts/2025-09-17-containerdays/cover.jpg"
description: "ContainerDays happens in Hamburg, Germany, one of the biggest ports in the world. Containers are everywhere, and this conference is the perfect place to learn about them."
categories: [Containers, Docker, Go]
tags: ["go", "containers", "docker", "containerdays", "conference"]
type: post
weight: 26
showTableOfContents: true
---

![A puzzle representing Hamburg's port](/images/posts/2025-09-17-containerdays/cover.jpg)

> No AI has been harmed in the making of this post. Well, just a bit for completing sentences. But that's ok nowaday, right?

This post serves as a record of my first experience at the ContainerDays conference, which took place in Hamburg, Germany, from September 10th to 12th.

Back in April, a community member from the Testcontainers community asked me if I would be interested in presenting at the ContainerDays conference, as he was planning to submit a talk on the topic, and wanted to check with me first in case he changed his topic and submit a different one.  Also it could be a great opportunity to meet, as we never met in person before. I applied to the Call for Papers, and was accepted to it! My talk was about "_Delightful Integration tests in Go_", and I was very excited to be able to present it at the conference.

## The organization

I have to first say that the organisation of the conference was really good. The venue was in the city center, in a very German-industrial style building, [Kampnagel](https://maps.app.goo.gl/xY4CEn9cUf8znwH16), and the hotel was just a few blocks away (15m walking distance). As a speaker, we were really well taken care of, with all the necessary support to deliver the talk. [Mar](https://www.linkedin.com/in/mar-benaiges-escrigas/) was the main organiser, and she was really helpful and responsive to all the requests. She and the team were always friendly with us, and delivered a great experience, for both speakers and attendees, and I personally thanked her for their work.

## The speakers dinner

They arranged a speakers dinner that Monday, and we had a great time, with lots of food and drinks, and a lot of interesting conversations. Interesting conversations happened during the dinner with [Misha](https://www.linkedin.com/in/mikhailbragin/), founder of [Netbird](https://netbird.io/), [Ajitem](https://www.linkedin.com/in/ajitem/), another speaker in the Go track, and [Alessio](https://www.linkedin.com/in/alessio-diamanti-92t/) and [Adrian](https://www.linkedin.com/in/adrian-kurt/), two engineers from Swisscom.

During the dinner, I also met two important people from the Testcontainers community, [Alex Pliutau](https://www.linkedin.com/in/pliutau/) and [Nikolay Kuznetsov](https://www.linkedin.com/in/nkuznetsov/). Even not sending any commits, they are true active contributors to Testcontainers for Go. Why? Because contributing to the OSS it's not only about sending code, it's about being part of the community, helping others, and they frequently do this by giving talks and recording videos about this lovely project. So I cannot find any other developer that deserves more a Testcontainers T-Shirt than them.

{{< flex-gallery 
    src_1="speakers-dinner.jpg" 
    alt_1="Speakers dinner, with delicious Indian food"
    caption_1="Speakers dinner, with delicious Indian food."
    src_2="dinner-menu.jpg"
    alt_2="Yummy, Yummy!"
    caption_2="Yummy, Yummy!"
    src_3="badge.jpg"
    alt_3="My conference badge"
    caption_3="My conference badge."
    src_4="nikolay-tshirt.png" 
    alt_4="Nikolay with his Testcontainers T-Shirt"
    caption_4="Nikolay with his Testcontainers T-Shirt."
    src_5="with-alex.jpeg" 
    alt_5="With Alex Pliutau, after this talk that Wednesday"
    caption_5="With Alex Pliutau, after this talk that Wednesday."
>}}

## The conference

In words of an anonymous question in the Slido panel, this conference is the "Best Kubecon you've ever attended". And this so true. The majority of the talks were about Kubernetes, and a few of them were about Go, with a dedicated track for this programming language, which happened the second day. My talk, "_Delightful Integration tests in Go_", was part of this Go track, so I decided to stay in the K4 room the whole second day.

The venue had 5 rooms (K6, K2, K1, P1 and K4). being the K4 room the one for the Go track, and the K6 the main room. You can find the conference schedule [here](https://www.containerdays.io/containerdays-conference-2025/agenda/).

### Day 1

This first day, I attended the following talks:

- [K6] Breaking Free with Open Standards: OpenTelemetry and Perses for Observability, by Kasper Borg Nissen (Dash0)

Nice introduction to OpenTelemetry and the vendor-lock-in problem, resolved by using OpenTelemetry. Really good intro talk, specially by non mentioning any vendor.

- [K2] Dynamic OCI Registry, by Alvaro Hernandez (OnGres)

Interesting talk on how to resolve a problem I already faced amost 10 years ago, and seems it's not solved yet. The speaker presented a custom solution as a custom registry with certain business logic to resolve Docker images. The image references can contain multiple "parts" after the tag, so that the registry is able to parse it and load the different parts as OCI artifacts. This resolved the case for multiple Postgres extensions, and all the combinatory for detecting compatible and incompatible extensions. E.g. `docker pull postgres--16.3/e/pluginA--1.2.3/pluginB--4.5.6`.

I remember this problem when I was working at Liferay, where each base image for the Liferay Portal product could contain multiple plugins extending the capabilities of the portal. How to tag the resulting image?

I shared the slides with the Hub team, where we could start a conversation about this topic.

- [K1] Shrinking Container Images - Security Chaos Engineering with Container Images, by Thomas Fricke
- [K6] Why are we still talking about containers? Keynote by Kelsey Hightower

The best talk of the conference. I'm looking forward to see the video of this talk, and if you are interested in Containers and Docker, you should, too. But I won't spoil the talk here. I can only share that I grabbed him after the talk, and walked by him talking for 5 minutes while he was moving to another place. He was really nice and friendly. You know what?? He mentioned Testcontainers as a key project for the Docker ecosystem, and that without mentioning I am one of the maintainers. A M A Z I N G!

- [K6] Engineering Velocity, Building Trust: DevOps in 2025, by Stephan Stapel (Hermes Germany GmbH)

I appreciate the time the speaker took in explaining the three ways of DevOps, based on the book "The DevOps Handbook", a book from 2016.

- [K2] Hijacking DNS Port 53 with eBPF & XDP for Remote K8s Access, by Misha Bragin (Netbird)

I went there to support Misha, who asked me during the speakers dinner how you could measure the impact of a talk in the business. I simply told him that it's impossible, at least I've not been able to correlate it yet. Netbird is a company that provides both an OSS project, and a hosted service, and he presented the problems Netbird as an OSS project resolved. As a maintainer of an OSS project, I can only know about certain OSS metrics, such as GitHub stars, downloads/clones, imports on public repositories, framework adoption, etc. But it's really complex to correlate it with the business impact. Unless you add some telemetry to the OSS project, in a very transparent and honest way, which could allow users to opt-in to send telemetry data to the company, and then enable the company to measure the impact.

As a reminder on the topic, the Go team started a discussion to add telemetry to the Go toolchain: https://github.com/golang/go/discussions/58409. 95 comments, 394 replies, lots of up-votes, lots of down-votes... And in the end, the Go team decided to add telemetry to the Go toolchain.

There was an party after the talks, with dinner, drinks, and live music. I had a great time, and met a lot of people from the event. Interesting connections were [Sohan Maheswar](https://www.linkedin.com/in/sohanmaheshwar/), devrel at AuthZed, the company building SpiceDB. We have a community module for SpiceDB in Testcontainers for Go, so we connected on LinkedIn and agreed to work together on a shared blog post or Youtube video about testing with SpiceDB.

### Day 2

The second day, I attended the following talks, all in the Go track:

- [K4] API-First: Because Life's Yoo Short for Boilerplate, bu Artur Iablokov (Lufthansa Industry Solutions)

Lightning talk, but good. The speaker presented a way to generate API clients for different programming languages, using the OpenAPI specification, including the oapi-codegen project.

- [K4] Trash Talk: Stacks, Heaps and the Art of Garbage Collection, by Aleksandr Rybolovlev (HashiCorp)

A deep dive in memory management in Go, escape analysis and the different algorithms used by the GC. I'm waiting for the video for refreshing my memory with it.

- [K4] Terminating elegantly: a guide to graceful shutdown, by Alex Pliutau (Binarly)

Another good one. Alex explained the implications of not terminating gracefully, and the different ways to do it. I really enjoyed the practical examples he shared.

- [K4] Demistifying Containers: Building a Container Runtime from Scratch, by Ajitem Sahasrabuddhe (Technogise)

And another one! At least to me. Containers and Go simply caught my attention. My talk will really suck compared to the presented talks! Docker made containers available for developers 10 years ago, and Ajitem shared how to create them container programatically in Go. You can find the source code [here](https://github.com/asahasrabuddhe/gcr).

- [K4] Time to Backend: The Hidden Delay in Your Application's Request Journey, by Andrii Raikov (Delivery Hero SE)

I admit I expected more Go from this talk. It was a fascinating example of how to trace requests through the different layers of the infrastructure, but I'd have moved it to an Observability track, as there were no Go code in the talk.

- [K4] Revisiting the Outbox Pattern, by Nikolay Kuznetsov (Zalando Finland)

Nikolay did a great job presenting the Outbox Pattern, and how it can be used to achieve eventual consistency in distributed systems, more specifically in the context of PostgreSQL. Please watch the video of this talk, it's really good.

- [K4] Memory Leaks in Go: Manage Your Resources Better, by Alexandre Cabral (Stone Co.)

Kind of similar talk to the one by Aleksander Rybolovlev, but also interesting. Alexandre shared how to detect memory leaks in Go, and how to fix them.

- [K4] Delightful Integration tests in Go, by Manuel de la Peña (Docker)

My talk, you can find the slides [here](/slides/2025-09-17-containerdays/Delightful-Integration-tests-in-Go.pdf). I started with a tiny story about how two developers started their project and everything worked on their computers. They added a build, but the build did not work on production. They then added a Staging environment, but it was always flaky and non in sync with production. All with a biblical reference to the creation of the world. I think it's a good story to start with, and it's a good way to introduce the topic of integration tests. And the feedback was positive, so I'm happy I finally delivered it in this way. Please watch the video of this talk, and tell me what you think.

But let me step back a bit. Before my talk, Ajitem approached me and showed me a pull request he just sent to the Testcontainers for Go project. It was resolving a simple bug in the Kafka module, as it was not parsing correctly Docker images names that were not following the Semantic Versioning format. What can be better than that? This is pure engagement with the community. Not even they wanted to learn about Testcontainers, but they found an issue, and they fixed it. This is the power of the OSS community.

- [K4] Master of Resources: Building Kubernetes Operator in Go, by Michael Morlock and Vincent Welker (Atix AG)

Right after you deliver your talk, you feel like you're hit by a truck. So I just rested outside and could not attend this talk. I'll wait for the video to watch it.

And this day there was an after party too. This time I choose the food trucks by the river. So good! I tried the bowls one and it was delicious. Here I shared time with some other attendees and speakers. I particularly enjoyed talking about countries, cultures and languages with  Nikolay, and [Aleksander Rybolovlev](https://www.linkedin.com/in/arybolovlev/). And you know what?? We ended up talking about the Roman Empire...

It's important to remark that there was another event in the conference, a table football tournament against the World champion [Linh Tran](https://en.wikipedia.org/wiki/My_Linh_Tran), from the German team. I held the "futbolín" (_as we know it in Spain_) bars, and it took just 8 seconds to her to score a goal. I could not even pass the ball from my midfielders to my forwards. No complains here, she is the best. The winner held the score up to 1 minute and 53 seconds. Congratulations!

Some pictures from the second day:

{{< flex-gallery 
    src_1="k4.jpg" 
    alt_1="This is the K4 room"
    caption_1="This is the K4 room."
    src_2="my-talk-from-nikolay.jpeg" 
    alt_2="This is Nikolay watching my talk"
    caption_2="This is Nikolay watching my talk."
    src_3="with-aleksander.jpg" 
    alt_3="With Aleksander Rybolovlev"
    caption_3="With Aleksander Rybolovlev."
    src_4="https://scontent-mad1-1.xx.fbcdn.net/v/t51.82787-15/549217900_18283672360286519_7025945472927251682_n.jpg?_nc_cat=106&ccb=1-7&_nc_sid=127cfc&_nc_ohc=9KJF-5Hgf-AQ7kNvwHUxUAe&_nc_oc=AdlD_tPmhfbRnmHy0VHgsan1bOUGuET7YryhuABmQ49-aome70097IVJUpNs-948rvU&_nc_zt=23&_nc_ht=scontent-mad1-1.xx&_nc_gid=b7uX7nbqSipIb0Rcu6pTcA&oh=00_AfZdcvGyNq6Pqe3tmxt3by-24usqN25LeGPORilJBZht4A&oe=68D0750F" 
    alt_4="Linh Tran, the World champion"
    caption_4="Linh Tran, the World champion."
>}}


### Day 3

And the last day, a little more relaxed as the conference was half-day, I attended the following talks:

- [K1] Simplifying cross-cluster connectivity with Dapr & Cilium, by Manuel Zapf (codecentric AG)

I am particularly interested in Dapr, as we Testcontainers have good relationship with Diagrid in general, and with Mauricio Salatino in particular. I wanted to learn how it's used in production, and not to my surprise, the speaker mentioned Testcontainers as the way to test Dapr applications. Isn't it cool?

- [K2] Kyverno Deep Dive: Debugging, Testing and Monitoring, by Marie Padberg (infologistix)

Kyverno it's a policy engine for Kubernetes, and I, having a tester-mindset, was interested in learning how to test the adition of those policies. It could be convenient to leverage the k3s module of Testcontainers for Go to test it, as you have a Docker container running with a Kubernetes cluster on it. It would be just a matter of applying the policy, and checking if Kyverno is able to enforce it. Interestingly, I met the maintainer of Kubewarden, [Víctor Cuadrado Juan](https://www.linkedin.com/in/viccuad/), another project that provides a policy engine for Kubernetes, which is already using Testcontainers for Go to test that, cool! You can find the source code [here](https://github.com/kubewarden/kubewarden-controller/blob/3c5e2fd8cc68c592f833539d42c5a92624839293/internal/controller/suite_test.go#L76-L98). I'll also watch Víctor's talk on YouTube, as he also presented a talk about cluster policies with Kubewarden.

- [P1] Breaking barriers with Dapr: Simplified and Portable Cloud-Native Architectures, by Hajed Khlifi and Albrecht Jérémy (Proximus Luxembourg)

Dapr is everywhere, and it's a great way to simplify the development of cloud-native applications. The speakers presented how to use Dapr to simplify the development of multi-cloud applications, from Docker Compose, to AWS, to Azure, to GCP, without changing the code at all! A great project to check and follow.

- [K4] Smell Like Clean Telemetry: Stop the Noise, Create Better Spans, by Juliano Costa (Datadog)

Having a background in Observability, I was interested in this talk. The title, inspired in the famous Nirvana song "Smells Like Teen Spirit", was really catchy. The rest of the slides were following the same topic, so it caught my attention since the beginning. Again, a talk to watch again once released.

The conference was finished, so I had lunch there and I went for a quick nap to the hotel. That evening was the only free time that I would have during the week, so I was decided to explore a bit the city. One of the developers I met, suggested visiting [Miniatur Wunderland](https://www.miniatur-wunderland.com/), a huge model railway museum with a lot of details, so there I went. I took a bus to the downtown, right next to the hotel, and in 20 minutes I was there. I really recommend this place, it's impressive how detailed the models are, and how day and night happens every 15 minutes, changing the lights of the models. Please do not miss the Monaco F1 track, it's fabulous!

I walked in the area, looking for a good burger place, but before that, I stopped by an open cinema in the middle of the lake, as they were about to screen "My neighbor Totoro", a Japanese animated film by Studio Ghibli. Hamburg is really vibrant.

{{< flex-gallery 
    src_1="monaco-by-night.jpg" 
    alt_1="Monaco F1 track"
    caption_1="Monaco F1 track."
    src_2="totoro.jpg" 
    alt_2="My neighbor Totoro on the lake"
    caption_2="My neighbor Totoro on the lake."
    src_3="hamburger.jpg" 
    alt_3="Hamburg-er"
    caption_3="Hamburg-er."
>}}

## Summary

I had a great time at the ContainerDays conference. I met a lot of people from the community, and I had the opportunity to present my talk. If your work is related to containers, Kubernetes or Docker, I highly recommend attending this conference, and why not presenting a talk?

Finally I want to thank all the people I met at the conference, and I'm sorry if I forgot to name you in this post. I had a great time with you all, and I'm looking forward to the next one.
