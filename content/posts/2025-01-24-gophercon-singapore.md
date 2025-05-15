---
title: "GopherCon Singapore 2025"
date: 2025-01-24T09:00:00+08:00
description: "My experience at the GopherCon Singapore 2025"
categories: [Community]
tags: [GopherCon, Singapore, Community, Events, Go, GenAI, Ollama, LLMs]
type: post
weight: 25
showTableOfContents: true
---

## GopherCon Singapore 2025

Since I joined AtomicJar back in 2022, one of my first goals was to be accepted in a Gophercon to share the benefits of using Testcontainers for Go. I tried with the EU conference twice in 2024 (Greece and Berlin), the US (Chicago), and the Israel one, always being rejected. I asked for feedback by email but the organisation team from Europe seemed very busy with the organisation so I finally desisted in following up with the feedback. What I did realise after that is I was focusing on presenting Testcontainers, which could be seen as a “vendor” pitch by the committee. The titles for the talks I was presenting were “Mastering Testcontainers for better integration tests” and “Delightful integration tests in Go applications”, so I think that was the reason.

After talking a bit with @Oleg Selajev, he suggested pivoting a bit, not focusing on the tool but on a real use case where the tool simplifies it. So we ended up with “Testing GenAI applications in Go”, which fulfilled the two criteria: 1) use a hot technology like GenAI, and 2) resolve a problem thanks to Testcontainers, how to test them. BINGO!

So I submitted the CfP back in August, 2024, and I was told that I was accepted in Oct 30th.

Given a was going to be in Singapore in January, @Ajeet Raina also organised a Docker meetup in Singapore for that week, so my presence in the region could lead to more interactions with the dev community there. He put all his energy and networks to play, and came with 

### Preparation

At first, I thought I had been a bit reckless, as at that time I had very few knowledge about GenAI. To be totally transparent, I felt an complete illiterate on the topic. Thankfully I started talking to @Ignasi Lopez Luna on a weekly basis on how to build this knowledge. And we started by porting [a repository](https://github.com/ilopezluna/generative-ai-with-testcontainers) Ignasi already created on how to do GenAI stuff on Java, to the Go programming language. This repository served me as a way to get familiar with the technologies, and to support my presentation. You can find it [here](https://github.com/mdelapenya/generative-ai-with-testcontainers).

As part of the preparation, and using Docker’s budget for training, I enrolled in https://dair-ai.thinkific.com/, which offers some courses on AI. It’s ~$300 for accessing all courses during one year, so it seemed convenient. I had known the founder from a previous job at Elastic, and I’d been following his steps since then: left Elastic to do AI research on Meta, then founded his own company. I completed these courses: “Introduction to Prompt Engineering”, “Advanced Prompt Engineering”, “Introduction to AI Agents” and “Introduction to RAG”.

It was also convenient to watch the video about why vector databases are better suited to do RAG than traditional databases, from Marcin Antas, Weaviate. We asked him to present about that topic and the video is really impressive. I do recommend you to watch it ([here](https://drive.google.com/drive/folders/1BCr4SNabj6efzyKiqC4y7XQLmdtOdM_i)). This video comes from building a great relationship with the Weaviate folks: they are using testcontainers-go’s weaviate module to test Weaviate! So cool!

### Monday

After leaving Bangalore (see [5th DevTools Day Bengaluru (Collabnix Docker Community) > 2025.01.18](/posts/2025-01-18-collabnix-bengaluru/)) I landed early in the morning in Singapore. This city is so beautiful! 

The first thing I did was to call [Ron Evans](https://www.linkedin.com/in/deadprogram/), who was speaking at the conference. For those of you who don’t know him, he is the lead maintainer of TinyGo, but he is also a very popular face in the Development space, with lots of friends in lots of places. E.g., he knows Justin and they talked when Docker Desktop became not free for corporates 😄 I knew he lived in Spain so directly gave him my phone number on Slack, so I could engage with him.

He was still tired after his flight, so he could not join me, so I decided to explore the city before feeling more “*jetlagged*”. 

That day, Valentine Chua, main organiser of the conference, created a whatsapp group with all the speakers and volunteers, and offered to go for dinner. Only Ron and I were already there, so we three went to a really good Noodles place.

{{< figure src="/album/2025-01-24-gophercon-singapore/noodles.png" alt="Noodles dinner with Ron and Valentine" caption="NOODLES. Delicious meal @ Hill Street Tai Hwa Pork Noodle: https://maps.app.goo.gl/wVdjDQwKzfv7xXXP8. Ron, Manu and Valentine." >}}


After that, we went for a walk, talking a lot about the conference, about our previous experiences, and also talking about families and friends, which is what I always say about this kind of events: knowing people in person allows you to connect with them more in depth.

### Tuesday

I dedicated the entire morning to work on the slides for my talk at Gophercon, considering that in 25 minutes I should share “the same” as in the previous talk at Bangalore, which took me 1 hour. So I decided to remove the slides sharing explicit testcontainers-go code, like how to create a generic container, how to use a module… In the end showcasing how Ollama runs in a Docker container in a programmatic manner automatically shows the benefit of using testcontainers.

I had lunch with Ron, this time a delicious Ramen, and continued working from the hotel. At 18:00, the Singapore team had booked a table at Sin Hoi Sai Eating House (https://maps.app.goo.gl/y9rLXU1Rr53WvfpD9), where we enjoyed great meals. We celebrated Chinese New Year, which would happen the next week, so we tossed a fresh salad while wishing prosperity. The moment was delicious, so was the salad.

{{< flex-gallery 
    src_1="sin-hoi-sai.png" 
    alt_1="Team dinner" 
    caption_1="SIN HOI SAI. Traditional eating house, where the Singapore team met for dinner."
    src_2="crab.png" 
    alt_2="Spicy crab" 
    caption_2="SPICY CRAB. This was the house-special, too spicy for me, although I was able to eat some of the crab meat, which again was delicious. Do I need to repeat that I love food?"
    src_3="salad-before.png" 
    alt_3="Salad before dinner"
    single_row_3="true"
    caption_3="BEFORE. The fresh salad, before being tossed."
    src_4="salad-after.png" 
    alt_4="Salad after dinner" 
    caption_4="AFTER. It was fun tossing the salad."
>}}

I had the chance to meet Yoke Kuan, Hedy, Ji Hye, Juliana, Martin and Luke. During the dinner we discussed about having a “top-down” strategy for selling Docker Desktop Vs having a “bottom-up” strategy where developers love the tool and convince their bosses on what to use. I really enjoyed the different postures we shared.

Funny moment when Juliana shared she started the day after, and we were making fun of her not being a fully Docker employee yet.

### Wednesday

Because the conference started on that Wednesday, I asked the Docker employees in Singapore if they would like to have some sessions about Testcontainers, so we agreed in having one that Wednesday. The team had booked a meeting room in the downtown, so I decided to walk from my hotel to the place, and start early at 9am, so that I could answer anything the team wanted.

{{< flex-gallery 
    src_1="building.png" 
    alt_1="Marina Bay Sands" 
    caption_1="AWESOME. No words for that building."
    src_2="merlion.png" 
    alt_2="Merlion" 
    caption_2="MERLION. The mascot of the city."
    src_3="level42.png" 
    alt_3="Salad before dinner"
    caption_3="LEVEL42: https://youtu.be/9x1RcVrGjGM?feature=shared&t=53"
    src_4="meeting-room.png" 
    alt_4="Meeting room" 
    caption_4="MEETINGROOM. Ready to work."
>}}

That day was a busy one, and we could only work together on the time slots we got for the sessions: from 13:00 to 15:00, but I had time to continue working on my presentation for Gophercon. Thankfully, during our session we had enough time for explaining what Testcontainers OSS is, what the differences are with Testcontainers Cloud, and the team also asked me to show the talk for the Docker meetup. This was cool because helped me test the presentation once more.

- TC OSS and TCC: Thanks Anna Chernyshova for providing the majority of the materials for this presentation. As always, she is GREAT.
- [Docker meetup slides](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Cloud-Native_AI_Day_Singapore.pdf)

I have to thank Zubair Aslam for stopping me with insightful questions and being my personal ChatGPT, translating my tech jargon so that anybody in the room could understand. Many times we engineers don’t know how to effectively communicate.

After that, I took a cab and went to the Gophercon workshop sessions, as my friend Ron was delivering his famous “Hardware Hacking with TinyGo” workshop. I already did it back in 2019, during a Google Developer Summit in Lisbon, and it’s real fun, so please do it if you have the chance!

> ℹ️ *Get ready for an electrifying experience at GopherCon with the Hybrid Group’s epic robot-fest session, powered by Go. Dive into drone control via joystick, reunite with our trusty pal GopherBot, and immerse yourself in more IoT wonders than you can handle!
> We are bringing a special collection of our favorite programmable robots and toys for you to play with and code, including some retro favorites and a few new friends.
> If music is your jam, don’t miss the TinyGo Jam session! Rock out with TinyGo-powered MIDI controllers and enjoy a variety of self-guided musical activities to keep your earbuds delighted.*

When I arrived, it was about to finish in 1h, so I engaged with the conference volunteers. One of them, a GovTech employee, was really glad, because he used Testcontainers in their Kotlin projects. As always stickers make developers REALLY happy. From the organisation team, I also met [Vito Chin, Microsoft](https://www.linkedin.com/in/vitochin/). He was very interested in my talk, as he is doing AI stuff with Copilot.

This day I met Mike Hughes, organiser of Gophercon AU. He was attending the conference too, and joined us since then.

We went to a hidden bar for dinner, also very good, and again, the organisers invited us. We were Valentine, Ron, Mike and I. The name of the place is Mama Diam 妈妈店: Hidden restaurant and cocktail bar , and you can find it just by moving the bookshelf that’s on the left.

{{< flex-gallery 
    src_1="mama-diam.png" 
    alt_1="Mama Diam hidden bar" 
    caption_1="HIDDEN PLACE. I was wondering why those ladies were taking pictures of that small shop, when I saw them opening the “door”, my jaw dropped."
>}}

### Thursday

I used this day not for working on the talk but on keeping up with the testcontainers-go project: checking up open PRs, and following up with upstream OSS projects using us. As an example, GoFiber is using us to verify their store layer. I’m helping them with their CI on GH actions to enable testcontainers-go for all their modules. This is a task we Testcontainers maintainers usually do, get in touch with other OSS projects, in case they can use us. This is also great marketing for us, because developers contributing to those OSS projects will feel the experience of writing tests with Testcontainers libraries and would eventually copy it to their own projects. This task of building bridges among OSS communities is really important for us, same as maintaining those bridges.

This day we had the speakers dinner, at Zheng Swee Kee (https://maps.app.goo.gl/1ZE3TYdUwvkCEvF19), where we met with Valentine and team. Not all speakers attended, as some of them were already flying or had just landed. We were: Ron, [Axel Wagner](https://www.linkedin.com/in/merovius/), [Chew Xuanyi](https://www.linkedin.com/in/xuanyichew/) and [Johnny Boursiquot](https://www.linkedin.com/in/jboursiquot/).

### Friday, talks day!

In the original agenda, it was planned that I talked around 13, but because I had the conflict with the Docker event, which started at 13:00, 

| **9:10 AM** | **AI Programming with Go, By [Chang Sau Sheong](https://2025.gophercon.sg/speakers#sau-sheong)** | A short introduction to programming AI using Go. Learn about using Go packages, LLM frameworks, open LLMs using Ollama, RAG and also vision LLMs. |
| --- | --- | --- |
| **9:40 AM** | **Starting and stopping things, By [Dave Cheney](https://2025.gophercon.sg/speakers#dave-cheney)** | In Go it’s trivia to start a goroutine, but, as I’m fond of saying, do you know when that goroutine will stop? How will it stop it? How will you know when it has stopped? This is a talk about a solution I find myself rewriting on pretty much every backend Go service I work on. Even in a microservice shop, the requirement to set up a bunch of parallel goroutines is ubiquitous. This is a story about concurrency vs parallelism, the places where it exists today in the std lib and where it does not, the patterns that evolve from that statement, and an introduction to the group type, an idea which has evolved since the Juju days a decade ago of William Reade’s Manifold, through Peter Bourgon’s “How I do things” talk, and through many of my own iterations. |
| **10:20 AM** | **Tea Break, By [GopherCon Singapore Team](https://2025.gophercon.sg/schedule/)** |  |
| **10:50 AM** | **(Wrong) Comparison is the Thief of Joy, By [Elisa Xu](https://2025.gophercon.sg/speakers#elisa-xu)** | You’ve heard the old adage - comparison is the thief of joy. Indeed it is. But more specifically, wrong comparison is the thief of joy. We compare for a living. We test to see if our expectations match our realities and write hundred of lines of code to compare what we want vs what we got. Yet do we actually know what we are comparing, and what obscure test failures threaten to steal our joy? |
| **11:15 AM** | **Why we can't have nice things: Generic methods, By [Axel Wagner](https://2025.gophercon.sg/speakers#axel-wagner)** | Generic methods would allow us to write chaining APIs. This is particularly important for functional iterator patterns, which currently have to stretch over multiple lines, or be awkwardly nested. It would also allow us to properly attach generic code to the type it belongs to. An example is `func N[T constraints.Integer](n N) N` in package `rand`: It makes it easier to choose a random `time.Duration`, for example. But it should really be a method on `*rand.Rand`. So no one really contests that it would be useful to have this feature. Even the Go team largely agrees. But the omission was intentional. The reasons for it stretch all the way back, to even before Go’s first open source release. In fact, it might be the reason we even got generics at all. I walk through the uses of this feature, the reasons adding generics took so long and how they lead to this omission. |
| **11:45 AM** | **F()-ing Cox-Zucker Tunes a MA Screw unto a Kummer Surface, By [Chew Xuanyi](https://2025.gophercon.sg/speakers#chewxy)** | Algebraic geometry can be fun in service of world building. This talk will go through the considerations of data structures and algorithms in the pursuit of making movies of exotic mathematical structures that may not necessarily make intuitive sense. |
| **12:15 PM** | **Scaling Go Monorepo Workflows with Athens, By [Swaminathan Venkatraman](https://2025.gophercon.sg/speakers#swami)** | At Grab, our Go monorepo powers over 600 microservices and centralises shared libraries, but frequently used commands like go list and go get created significant bottlenecks. These commands overwhelmed our GitLab servers, leading to frustrated developers, disrupted CI pipelines, and constant fire-fighting by the GitLab team. To address this, we implemented Athens, a private Go module proxy, combined with GOVCS environment variable configurations and fallback network mode. This approach offloaded dependency-fetching requests from GitLab, drastically reduced server load, and improved dependency-fetching speeds for developers. In this talk, we’ll explain how using a private Go module proxy enhances security, ensures module availability (think “left-pad” incident), and avoids the downsides of vendoring. Attendees will gain insights into setting up private proxies, using Athens in secure or offline environments, and scaling dependency management in large monorepos. Learn how we improved productivity and reliability at Grab, and discover how your organisation can do the same. |
| **12:40 PM** | **Lunch, By [GopherCon Singapore Team](https://2025.gophercon.sg/schedule/)** |  |
| **1:40 PM** | **Practical GenAI with Go, By [Adrian Cole](https://2025.gophercon.sg/speakers#adrian-cole)** | Learn how to practice Generative AI in Golang, using some popular tools written in Golang. You’ll learn the lingo needed commonly used, like LLM, GenAI, RAG and VectorDB and what they mean. You’ll leave with some ideas on how to start coding, now, with a model hosted on your laptop! |
| **2:05 PM** | **Testing GenAI applications in Go, By [Manuel de la Peña](https://2025.gophercon.sg/speakers#manuel-de-la-pena)** | The evolution of GenAI applications brings with it the challenge of developing testing methods that can effectively evaluate the complexity and subtlety of responses generated by advanced artificial intelligences. The proposal to use an LLM as a Validator Agent represents a promising approach, paving the way towards a new era of software development and evaluation in the field of artificial intelligence. Over time, we hope to see more innovations that allow us to overcome the current challenges and maximize the potential of these transformative technologies. This proposal involves defining detailed validation criteria and using an LLM as an “Evaluator” to determine if the responses meet the specified requirements. This approach can be applied to validate answers to specific questions, drawing on both general knowledge and especialised information. By incorporating detailed instructions and examples, an Evaluator can provide accurate and justified evaluations, offering clarity on why a response is considered correct or incorrect. In this session we’ll leverage langchaingo to interact with LLMs, and Testcontainers Go to provision the runtime dependencies to use RAG. |
| **2:30 PM** | **Mocking your codebase without cursing it, By [Björn Andersson](https://2025.gophercon.sg/speakers#bjorn-andersson)** | Working with mocks is a lot like working out: if you don’t know what you’re doing then you’ll either a) don’t get the results you want or b) hurt yourself. And in the worst case, you’ll get both and be unhappy with the results and swear off mocking as a useless practice. This talk will show some common pitfalls of using mocks (updating a lot of mocks to return the new correct value, mocking out the same complex thing again and again, elaborate setups to exercise a piece of business logic, and more) and how you can constrain how you work with mocks to make them work for you and make your test suite something you’ll love to maintain. No matter where you are on the spectrum of “mock everything to don’t mock at all,” you’ll get more confidence in your test suite, make it simpler to maintain, and very likely faster to run by being intentional in how you design your test suite and work with mocks. |
| **2:55 PM** | **Tea Break, By [GopherCon Singapore Team](https://2025.gophercon.sg/schedule/)** |  |
| **3:30 PM** | **80% faster, 70% less memory: the Go tricks we've used to build a high-performance, low-cost Prometheus query engine, By [Charles Korn and Jon Kartago Lamida](https://2025.gophercon.sg/speakers#charles-korn)** | We’ve been building a brand-new, Prometheus-compatible query engine from the ground up for Grafana Mimir in Go. Our new query engine has been designed to deliver an improved user experience and vastly improved performance: our benchmarks show queries running up to 80% faster and with 70% lower peak memory consumption than Prometheus’ default engine, and our real-world testing shows similar results. As we’ve been building the engine, we’ve learnt a number of Go performance lessons the hard way, including why using byte slices can sometimes be preferable to strings, the benefits and costs of memory pooling and the surprisingly large impact of function pointers. And we’ve seen the complexity (and bugs!) these things can introduce too, and developed a number of techniques to help combat this. |
| **3:55 PM** | **Life, the Universe, and everything GO, By [Ron Evans](https://2025.gophercon.sg/speakers#ron-evans)** | In this fast-paced interactive keynote, we will Go from the incredibly small to as far as our imaginations can take us. By the end you will have shared a true ‘out of the box’ experience. |
| **4:45 PM** | **Closing Remarks & Group Photo, By [GopherCon Singapore Team](https://2025.gophercon.sg/schedule/)** |  |

I grabbed the lanyard and left some Testcontainers Go stickers in the table, expecting all attendees were interested even more in my talk.

{{< flex-gallery 
    src_1="gophercon-badge.png" 
    alt_1="My Gophercon badge!" 
    caption_1="CHECK. It was one of my milestones to speak at a Gophercon."
    src_2="stickers.png" 
    alt_2="Stickers on a table" 
    caption_2="STICKERS. Developers love stickers, and if they are cute, even more!"
>}}

First talk, the keynote. **AI Programming with Go**, was from Chang Sau, who I think met SJ a few months ago here in Singapore. He introduced LLMs in Go leveraging langchaingo. He showed the different payloads needed to talk to OpenAI and to Ollama. It was great that this talk was the keynote, as it prepared the room for my talk and I could easily go fast on the slides until the real testing meat. As we discussed during the week, if you want to use LLMs in Go, you should go with langchaingo instead of the recently released openai Go SDK. It’s a community driven project, else, you’ll get coupled with the given vendor, in this case OpenAI. Although I need to check that implementation, in case it’s more “open”.

Second talk was Dave Cheney’s **Starting and stopping things**. I was excited to seeing him in action, and the reality is that I not only watched his talk, but also enjoyed a Saturday walk with him, having lunch and going shopping before departing to the airport. Great fanboy experience! His talk was very elegant, explaining the reasons why you need to start and stop goroutines. I have to admit that I felt pleasant with myself because I was able to understand all of that 😊

The third talk, **(Wrong) Comparison is the Thief of Joy**, was about the different alternatives we have in Go for comparing structs, and the caveats for each of them. Does a struct contain the right values after a JSON unmarshal? She gave a very interactive session, with lots of code snippets about the common mistakes we do when comparing types in Go.

Next talk, **Why we can't have nice things: Generic methods**, by Axel Wagner, was based on mathematical demonstrations on the topic. Because of the time we shared during the week, I already knew about Axel’s Maths background at Uni, so you can imagine the quality of the talk in regards of the topic. To my very low understanding of Maths, it was really complete. It’s been ages since I did real Maths at high school and Uni, which I enjoyed though. Again, I recommend you watching this talk. Axel has similar talks on generic from different Gophercons, in case you want to know more about Go and Generics: [Singapore 2025 (pdf)](https://raw.githubusercontent.com/Merovius/go-talks/7687b4d3d73ee671a139ff42f0c2481bd7c639d3/2025-01-24_gophercon_sg/slides.pdf), [US 2024 (video)](https://www.youtube.com/watch?v=dab3I-HcTVk&ab_channel=GopherAcademy), [Australia 2023 (video)](https://www.youtube.com/watch?v=0w4Px-yR8D8&ab_channel=GopherConAU).

Next talk, **F()-ing Cox-Zucker Tunes a MA Screw unto a Kummer Surface**, by Chew Xuanyi. He is one of the Gophercon AU organisers too, and the author of [Gorgonia](https://gorgonia.org/getting-started/) (deep learning in Go). It was really difficult to me to follow this talk, for two reasons: the simplest is that I was refining my talk, but the reality is that it was explaining some mathematical concepts in real depth. I need to re-watch the video to get another impression.

Next talk, **Scaling Go Monorepo Workflows with Athens**, by Swaminathan Venkatraman. They explained how using a dedicated proxy helped Grab to reduce the build times. [Grab](https://www.grab.com/sg/) is an Uber-like company in South Asia. Here you have the repo for the proxy: https://github.com/gomods/athens, and [a blog post](https://engineering.grab.com/go-module-proxy) on it.

Lunch break came, and I was grabbed by the orgs to do a quick test with my laptop. Everything working, and then wait for Adrian Cole’s talk on **Practical GenAI with Go**. He did not present langchaingo but [Parakeet](https://github.com/parakeet-nest/parakeet), an OSS library maintained by him and our @Philippe Charrière. The world is so tiny… Adrian is currently working at the Observability team at Elastic, with my ex-coworkers 😅. Again, the room was even more prepared to my talk, as all the basic concepts were already shown.

I have not mentioned anything about the room. Gorgeous is not enough. This is the video-wall with the mascots of the conference (a Merlion, the mascot of Singapore, in a Gopher suit). The organisers told me they hired a local artist for the design. Bravo!

{{< flex-gallery 
    src_1="background.png" 
    alt_1="Stage background" 
    src_2="background-and-me.png" 
    alt_2="Stage background with me" 
    src_3="conference-room.png" 
    alt_3="Conference room" 
>}}

And now, my turn. After some natural delays from the previous talks, my talk started with 30 minutes delay. I was almost panicking with every 5-minute delay, as I had to ping the Docker event in the other place, as they were moving my talk depending on that. The plan was clear: give my 30-min talk, no questions, run for grabbing a cab, go to the AWS offices (an 8-min drive without traffic), go up to the right level in the tower, wait for my turn, deliver the talk, engage the minimum, go down the tower, grab another cab, and back to the conference hoping it did not finished.

I went on stage and to my surprise I did not feel nervous at all. No voice trembling, a bit of coughs but you know it’s winter and I usually suffer from that at this time of the year. Everything ran smooth, so I delivered the talk on time, and there were no questions. The first part of the big day was done. You can find the slides here: [Testing GenAI apps in Go](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Gophercon_SG.pdf). Now to the second.

{{< flex-gallery 
    src_1="ok-talk.png" 
    alt_1="Happy Manu after the talk" 
    caption_1="ACK0. Pinging Ajeet that I finished my talk at Gophercon and I was leaving to the other place."
    src_2="empty-venue.png" 
    alt_2="Empty venue before the event"
    caption_2="ACK1. Ajeet was sending me pictures of the venue. He was in Bangalore, but updating me real-time."
    src_3="waiting-venue.png" 
    alt_3="Waiting venue" 
    caption_3="ACK2. People waiting for the event to start."
>}}

But let me mention that I’d have loved to watch the rest of the talks, specially Bjorn’s **Mocking your codebase without cursing it**. I met him in the after party, and he really knows stuff. I’ll watch it as soon it’s released on Youtube.

I committed to the plan, and followed it. Only the traffic was against me. The rest was easy because the organiser from Cloudera did a great job holding my talk until I arrived. I was lucky to arrive in the lunch break, so I only waited 15 minutes until being on the stage.

{{< flex-gallery 
    src_1="food-ready.png" 
    alt_1="Food ready" 
    caption_1="ACK3. Food ready! I was the next one."
    src_2="samriddhi-1.png" 
    alt_2="With Samriddhi from Cloudera"
    caption_2="THANKS. In the very few minutes that I was there, Samriddhi (Cloudera) helped me out a lot with the schedule. She gave me the space, presented me to the audience, and gave me some speaker gifts. She basically calmed me down after so much stress from that day! I took this picture to tell Ajeet I already got to the place on time."
>}}

There was 140 people in the room, no Go developers, so again I mentioned that everything mentioned in the slides was applicable to any programming language thanks to Testcontainers being polyglot. Most of them were working on Python, so again a signal for the investment in this language.

There was a few questions, actually hardcore questions from the same person: in the part of calculating the cosine similarity, she was concerned about using a different similarity algorithm. I responded that because we were talking to the vector database to retrieve the relevant docs, I was not sure if that algorithm could be changed on the DB side, probably a good question to our friend Marcin from Weaviate. Also, in the part about using the cosine similarity in tests to verify the responses from an LLM, then here we can use whatever we wants, so to that question, yes, it’s possible to use a different similarity algorithm because it’s our own tests code.

I finished the talk, there were no other questions, and I decided to leave back to Gophercon. Samriddhi gave me some gifts from Cloudera, took some pictures and even wrote [a LinkedIn posts about my talk](https://www.linkedin.com/posts/samriddhibhatnagar_singaporemeetup-generativeai-docker-activity-7288569396040515584-aBIS?utm_source=share&utm_medium=member_desktop).

{{< flex-gallery 
    src_1="samriddhi-2.png" 
    alt_1="Samriddhi from Cloudera giving me a gift"
    single_row_1="true"
    caption_1="PARTNERS. They gave us speakers some gifts: A notebook, pen and bottle (Cloudera), and a T-Shirt (Neo4j)"
    src_2="aws-talk.png" 
    alt_2="Meetup overflow again"
    caption_2="MEETUP OVERFLOW TWO: Many people in the room again!"
>}}

You can find the slides for the [Cloud Native AI Day Singapore here](/slides/2025-01-24-gophercon-singapore/Testing_GenAI_apps_in_Go_Cloud-Native_AI_Day_Singapore.pdf)).

Back in Gophercon, I arrived on time to see the last part of Ron’s closing keynote: Life, the Universe, and everything GO. Everybody had told me during the week that I should not miss it in person, because something that would not be shown in the videos would happen. I had been very worried because of that during the week, as I could very likely miss it because of the other event. Thankfully, the cosmos was a bit generous and could make it to at least watch some of it in person. But what happened? What happens in SG, stays in SG.

{{< flex-gallery 
    src_1="gopherbot.png" 
    alt_1="Gopherbot"
    caption_1="GOPHERBOT. TinyGo powering a Gopher plushy."
    src_2="with-ron.png" 
    alt_2="Ron Evans and I"
    caption_2="FRIENDS. I made a good friend this trip."
>}}

There was an after party and I connected with some more attendees and other speakers. As Andreia Camila, from Brazil. She came asking for a picture because she loved Testcontainers! I gave her a T-Shirt and some stickers for her team back in Brazil and she loved it.

### Saturday

For me, the last day of a trip abroad is the last one: your body is still there but your brain wants to be at home the soonest. A 13h flight to Munich + 2’5h layover + 2’5h more to Madrid was waiting to me, so my brain was f*cked. And the flight was at 23:15, to I had the entire day to thing about it. Thankfully the organisers prepared something for today, and we went together for lunch.

So I packed my luggage, put it in the front desk of the hotel, and walked to Little China to discover that part of the city before lunch. I bought some souvenirs, entered in the huge Buggis mall center (how many mall centers are there in SG, hundreds?), and finally met the other folks for lunch. It was great to share time with them again.

{{< flex-gallery 
    src_1="speakers.png" 
    alt_1="Speakers after the conference"
    caption_1="TESTCONTAINERS. Look at Ron’s T-Shirt! He told me he already used the library for other projects, so why not giving him the last of the T-Shirts I brought with me. Valentine, VIto, Dave, Bjorn, Ron and I."
>}}

I finally went back to my hotel for the luggage, and took a bus to the airport. There I watched a LaLiga football game that was playing on a big screen while waiting for the flight.
