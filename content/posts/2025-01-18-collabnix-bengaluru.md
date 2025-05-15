---
title: "5th DevTools Day Bengaluru (Collabnix Docker Community)"
date: 2025-01-18T09:00:00+05:30
description: "My experience at the 5th DevTools Day Bengaluru (Collabnix Docker Community)"
categories: [Community]
tags: [Docker, DevTools Day, Bengaluru, India, Community, Events, Testing, Testcontainers, Go, GenAI, Ollama, LLMs]
type: post
weight: 25
showTableOfContents: true
---

## 5th DevTools Day Bengaluru (Collabnix Docker Community)

Back in October I met Ajeet Raina at Devoxx Belgium, and from there, while we were returning back to the hotel and sharing that I had submitted a CfP to Gophercon Singapore, Ajeet told me: “_if you are accepted, you must stop in Bangalore, because it’s on your way to SG, and share that knowledge to the huge community that lives in the city. I’ll set up everything: the venue, the food… I’ll talk to the local partners so that they collaborate in building this meetup event_”. In Oct, 30th, the organisers confirmed I was in for Gophercon, so Ajeet started planning this all. The result? A wonderful event with plenty of interactions with the Docker community.

## The agenda

9:00 AM - 10:00 AM - Welcome and Registration
10:00 AM - 11:00 AM - Testing GenAI applications in Go using Docker and Testcontainers by Manuel De La Peña, Docker Team
11:00 AM - 11:45 AM - Building Fast, Securing More, Testing Better. How Docker Fuels Developer Productivity, Rebant Malhotra, Docker and Ajeet Singh Raina, Docker
11:45 AM - 12:30 PM - Introduction to Confidential containers, Balasundaram and Sangam Biradar
12:30 PM - 1:00 PM - Designing an Agentic System with GraphRAG (Unstructured data meets structured data), Alagu Prakalya, ASAPP
1:00 PM - 2:00 PM - Lunch
2:00 PM - 2:30 PM - Dev-Test Simplified: Building Production-like Environments with vCluster" by Rashi Chaubal, Infracloud Technologies
2:30 PM - 3:00 PM - Secure by design in the AI Era, Arun Kumar G, GitLab
3:00 PM - 3:30 PM - Generative AI 102: A Recap of 101 with Ollama and n8n by Raveendiran RR

The last two talks came with some natural delay, so we finished the event around 5PM.

## Attendance

There were 1003 registered people on Meetup.com, although “only” ~300 came. I’ve seen conferences with less than 100 people in the room, paying ~500€ for the same schedule as this event had, so I’m pretty honoured for having participated from it.

When Koti, one of the organisers asked about demographics, it was interesting that the vast majority of them where there for first time, they were students, and they came with friends. Really amazing there was so many interest in spending almost an entire day, including two 2h drives to the place and back, on a Saturday, to listen to some tech folks.

My take away: invest in the communities connected to Universities, so those students land into the market with solid foundations on tools that actually work and cause an impact in the day-to-day, such as Docker.

## My talk

I went first, started at 10:15 and it took me one hour to give it. This is important because it was the first time I delivered the talk, and I’m giving it again this Friday in two different events, where the schedule is time-boxed to 30 minutes. So I’m currently working in deciding what to skip/cut.

Slides are [here](/slides/2025-01-18-collabnix-bengaluru/testing-genai-in-go.pdf), and they are about what tools do we have in Go to interact with GenAI applications, and how Testcontainers for Go can assist in creating a smooth experience in the inner loop of the development process.

I started asking about how many used Go, and just a few hands were in the air, maybe 4-5 people, so I immediately told them that anything that I was going to talk next could be found in  their programming language of choice, thanks to the existence of a convenient Testcontainers library. Therefore, everybody could connect the Go tools and examples with their current tool belt. In fact, my presentation is an exact copy of the amazing work that @Ignasi Lopez Luna is doing from the Java standpoint. So kudos to him for paving my way in this journey! 🙇

During the entire event, not only in my talk, I felt that many of the people in the room did know about GenAI, models, and libraries. As an example, two students came after the talk to show their project at Uni: they were using YOLO, an LLM for real-time object detection, in their final project about detecting the speed of football (soccer) players. They asked about how to host the huge model and if Ollama was able to run it. I shared that if the model lives in Hugginface as a GGUF model, then Ollama can run it. Of course they need the power to host and run big models, probably a space that Docker Cloud can excel.

## Questions of interest

There were lots of questions, many technical of course, but the majority of them were about career path: what should I study next? What would be your advice for me to progress? I tried to collect all my previous experiences, speaking very frankly that it might now work for them, but it did for me. My most “popular” answer was “*not focus on the tools but on the foundations: it’s fine to know a tool or two, but if you know the foundations and the motivation under the tool, you will probably be able to move to another tool with ease. Else, you’ll be replaced by the next tool*”. I noticed many of them were coming with this question, and I hope they follow this advise.

Also, many questions came from the space of self-confidence: “*I’m not that smart*”, even having finished a CS degree, some of them came with this thought. Participating in meetups could be time consuming, and I do agree that now that I have partner and kids, it’s very difficult to even think of attending meetups on a regular basis. But years ago, it was really helpful for me to attend meetups to learn what was going on. Another thing that helped me, and I advised them about it, was about the way they learn new things. New generations “are” more visual that mine, and prefer watching Youtube/Twitch videos. I do agree that times change by and new ways of learning are equally valid. But in any case I see many of the content creator staying shallow in the contents they produce. While there are resources with deep understanding of the technologies they teach, my experience with “youtubers” is that they create the to-do list in the framework of the day. Am I like my father 30 years ago about me listening to Metallica? Or as the middle-age duke telling his son that the robe is too short? Or going further to a cave man grunting to his son why he was wearing a Mammoth cloak? The history books, sorry streams, will tell. So my major advice to them was to read books. And participate of meetups if/when possible. Because later on, when having partners and/or kids, it would be much more difficult than now.

One interesting question, actually amazing, came from Koti, one of the organisers. He created a brand new docs site on how to use testcontainers-python, with lots of hands-on examples: +10 scenarios with databases (MySQL, MongoDB, Postgres) and Message Brokers (Kafka, Redis, RabbitMQ). He wanted to know if “that little thing” he was working on could be of interest for the Testcontainers Python community. Of course yes! You can find his repository here: https://github.com/vellankikoti/testcontainers-db-message-brokers 🐍

### Other talks

I was grabbed many times from the attendees after my talk, so I missed many parts of the rest of the talks.

I was particularly interested in “**Dev-Test Simplified: Building Production-like Environments with vCluster**" by Rashi Chaubal, Infracloud Technologies, as I never heard about vClusters. They are, from [their website](https://www.vcluster.com/), “*a Kubernetes concept that enables isolated clusters to be run within a single physical Kubernetes cluster. Each cluster has its own API server, which makes them better isolated than namespaces and more affordable than separate Kubernetes clusters.*”. The speaker explained how to leverage them to simplify the testing phase with k8s applications, although I see it more convenient not for testing but for simplifying production environments. For testing I think the k3s module of testcontainers-go, of course 😅, can help teams in testing their deployments, allowing them to iterate locally, instead of having to go to the virtual cluster, that lives in the company’s infra. But anyway, I have zero knowledge of k8s, so I’m sure I’m missing the point here.

Another talk was “**Confidential Containers**”, by Bala Sundaraman. He explained what Confidential Computing is, and the issues for not using it. He shared the slides with me [here](/slides/2025-01-18-collabnix-bengaluru/COCO-NOKIA_presentation.pptx).

The last talk, “Generative AI 102: A Recap of 101 with Ollama and n8n“ by Raveendiran RR, showed the n8n platform. I already knew about Flowise, but I did not know that n8n had so many available integrations. Probably worth looking!

### Pictures from the event

These are the ones I took, but if you check the LinkedIn feed for the event, you’ll find plenty of them. I was impressed by them wanting pictures with us. We are not rock stars!! 😳😳😳

{{< flex-gallery 
    src_1="PXL_20250118_034338039.jpg"
    alt_1="Nokia Building"
    caption_1="SILICON VALLEY. Bangalore is considered the Silicon Valley of India. Lots of Big Tech companies have buildings in there. Did you know that DELL has 25k employees in the city?"

    src_2="PXL_20250118_035003197.MP.jpg"
    alt_2="Empty venue"
    caption_2="SILENT. The room before everything started."

    src_3="PXL_20250118_061724775.jpg"
    alt_3="Meetup overflow"
    caption_3="MEETUP OVERFLOW. As Ajeet named, the room was packed."

    src_4="PXL_20250118_061711277.jpg"
    alt_4="Ajeet and Rebant"
    caption_4="TEAM. Ajeet and Rebant starting the talk."

    src_5="PXL_20250118_073235015.jpg"
    alt_5="Docker Team"
    caption_5="TEAM. Docker folks + Koti and Shub."

    src_6="PXL_20250118_075907317.jpg"
    alt_6="Another speaker"

    src_7="PXL_20250118_091206885.MP.jpg"
    alt_7="Serving the pizzas"
    caption_7="LUNCH TIME. Everybody waited patiently for their lunch."

    src_8="PXL_20250118_093434442.jpg"
    alt_8="Pizza time"
    caption_8="EQUITY. Partners came with lunch and drinks for everybody. Here in Spain, also in other countries I’ve attended meetups, the organisation brings big pizzas for everybody. Here, each person received the same box of pizza, including a dessert and drinks."

    src_9="PXL_20250118_121535451.jpg"
    alt_9="Organisers"
    
    src_10="PXL_20250119_131149794.jpg"
    alt_10="These guys!"
    caption_10="FIVE GUYS (Koti missing). They, and probably more, are building a really strong Tech community in Bangalore, a lifeline for many CS students in this fast-paced world."

    src_11="PXL_20250119_131202726.jpg"
    alt_11="Me and the Rockstars"
    caption_11="PROUD. I finally met real rockstars."
>}}

### Some other pictures from the trip

Ajeet picked me up from the hotel the first morning (Friday), and drove me to a special place for him and his family: [Adiyogi](https://isha.sadhguru.org/en/center/consecrated-spaces/adiyogi-chikkaballapur-bangalore), which took us almost 2h to get there. Yes, traffic in Bangalore works like this and “*you always start 3h earlier, otherwise you miss the meeting or the flight*”.

To me, this is also work. Meeting with people from your company, and just talking make you feel them as if you worked with them side by side in an office. You talk about family, friends and life, but work conversations naturally emerge and with more energy. That’s why I really believe offsites are critical for creating and fostering a culture in which we trust each other. Just walking back to the hotel, in a more relaxed environment, can lead to insightful conversations. Being remote (async + distributed) is a great benefit, but as a drawback we could be missing these social interactions that create bonds. Let’s not lose this.

{{< flex-gallery 
    src_1="PXL_20250117_081954564.jpg"
    alt_1="Monkeys in the wild"
    caption_1="MONKEYS. I had never seen a monkey in the Wild!"

    src_2="PXL_20250117_082624940.jpg"
    alt_2="Shiva's head"
    caption_2="SHIVA’s HEAD. The monument is gorgeous but, by night, it’s even better because it illuminates from the inside with multiple colours."

    src_3="PXL_20250117_083139396.NIGHT~2.jpg"
    alt_3="Nandi"
    caption_3="NANDI. This is Shiva’s vehicle. Nandi is the bearer of truth and righteousness. This picture is using Pixel 9’s 'remove people in the background' feature."

    src_4="PXL_20250117_084655896.BURST-01.COVER.jpg"
    alt_4="Ajeet and I"
    caption_4="INCLUDEME. This picture was taking with Pixel 9’s new 'Include me' feature. Cool!"

    src_5="PXL_20250117_085334564.jpg"
    alt_5="Ajeet and I"
    single_row_5="true"
    caption_5="NO SHOES. Ajeet and I are barefoot in this picture, as we saw everybody in the temple were removing their shoes and socks."

    src_6="PXL_20250117_124613335.MP.jpg"
    alt_6="A family of 5 in a scooter"
    caption_6="TWO-WHEELERS. Living in an European country, and seeing scenes like this one, makes you realise how privileged we are by the place we were born. Diversity please!"

    src_7="PXL_20250117_131126097.MP.jpg"
    alt_7="Cows are let free in the streets"
    caption_7="COWS. This we usually see in the news: a cow going free in the streets."

    src_8="PXL_20250118_172155742.jpg"
    alt_8="Bangalore skyline by night, from the hotel"
    single_row_8="true"
    caption_8="BANGALORE BY NIGHT. NOKIA offices are in that area, about 25 minutes walking distance from my hotel, but it was almost impossible to walk there because of the heavy traffic and the constructions for the new train."

    src_9="PXL_20250119_060817414.PORTRAIT.ORIGINAL.jpg"
    alt_9="Indian souvenirs"
    caption_9="GIFTS. A souvenir from the hotel when I shared it was my first time in India."
    
    src_10="ajeet-and-family.png"
    alt_10="Ajeet's family"
    caption_10="FAMILY. Maja and I were very lucky to meet Ajeet’s family at their place."

    src_12="namaste.png"
    alt_12="Me and the Rockstars"
    single_row_12="true"
    caption_12="NAMASTE. To Ajeet, to my team, to Docker."

    src_13="food.png"
    alt_13="Indian family food"
    caption_13="FAMILY. Ajeet’s family prepared Indian meals for us. Delicious, but spicy, but delicious! Well, actually all Indian meals are spicy to me, even causing crusts (and blood) in my lips."

    src_14="PXL_20250119_110912479.jpg"
    alt_14="Indian Museum of Music"
    caption_14="KNOW YOUR HISTORY. Ajeet and the Collabnix organisers dedicated their free Sunday to stay with us, taking us to the Indian Museum of Music. A real experience!"
>}}

### Side topics

- Docker Hub cafe: https://www.linkedin.com/posts/kunal-sarpatil-79587b157_just-when-we-thought-docker-was-all-about-activity-7287330190773383168-73M7?utm_source=share&utm_medium=member_desktop
- *Container Rules, Docker cools!*: https://www.linkedin.com/posts/shubhendu-shubham_dockerbengaluru-meetup-ugcPost-7286440882289942528-_mIr?utm_source=share&utm_medium=member_desktop
- The biases of an European in India: https://www.linkedin.com/posts/mdelapenya_biases-india-community-activity-7287312477963325440-Fm8H?utm_source=share&utm_medium=member_desktop
- A personal experience happening at the airport: https://www.linkedin.com/posts/mdelapenya_id-like-to-share-this-feedback-after-a-really-activity-7288064800872407040-pKRL?utm_source=share&utm_medium=member_desktop
