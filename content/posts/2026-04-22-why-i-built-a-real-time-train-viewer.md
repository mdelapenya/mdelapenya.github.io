---
title: "Why I Built a Real-Time Train Viewer"
date: 2026-04-22 09:00:00 +0200
description: "Renfe took years and 164 million euros to renew its website. I built a real-time train viewer in a couple of days inside a Docker Sandbox. This is the story."
categories: [Technology, AI, Software Development]
tags: ["renfe", "docker-sandboxes", "open-data", "coding-agents", "spain"]
type: post
weight: 30
translationKey: why-i-built-a-real-time-train-viewer
translatedFrom: e7bb4a4
aliases: ["/posts/2026-04-22-por-que-construi-un-visor-de-trenes-en-tiempo-real/"]
---

![Why I Built a Real-Time Train Viewer](/images/posts/2026-04-22-por-que-construi-un-visor-de-trenes-en-tiempo-real/cover.png)

In January 2026 I was on a train to Barcelona with my family, and I had no idea where the train was. The news about the Adamuz accident had been everywhere for days. Our line, Madrid-Barcelona, was piling up delays from speed restrictions over several long stretches, caused by problems in the infrastructure. I wanted to know where my train was, how late it was running, and what was going on across the network. There was no easy way to find out. So I started building an app right there, from my phone, during the trip, using [GitHub Copilot in agent mode](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox).

In March 2026, Renfe launched a real-time viewer for high-speed and long-distance trains. Xataka ran a telling headline: "The surprise is not that Renfe offers a real-time train map... the surprise is that it doesn't look like Renfe made it." <sup>[1](#ref-1)</sup> I had a prototype since January, but it was missing everything. In April I needed a real project to demo [Docker Sandboxes](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox), and renfe-maps was the perfect candidate. I picked it back up inside a sandbox with Claude.

In a couple of days, [renfe-maps](https://renfe-maps.vercel.app) went from prototype to full app: Cercanías (commuter rail), alerts, real-time streaming every 5 seconds, and an open API. It covers what the official viewer doesn't. This is the story of why I needed it and what I found along the way.

## Renfe's Digital History: 164 Million Later

Renfe's relationship with technology is a story of budgets that are never enough and results that never convince.

In 2009, Renfe awarded Indra 11.5 million euros for the "Strategic Plan for Renfe's Information Systems." <sup>[2](#ref-2)</sup> The results were modest. The criticism of the website went on for years.

I was a tester for Renfe's Android app in 2013, and I remember a meeting with a project manager (quite young, by the way). I asked him why seat 4 was the default if the traveler didn't ask for a seat. His answer: "If you don't tell me anything, I give you 4." My jaw dropped. That was the level of product decisions being made with an 11.5 million euro budget.

In 2019, Renfe put the renewal of its portal out to tender for 700,000 euros. <sup>[2](#ref-2)</sup> The reaction from the industry was immediate. David Bonilla, founder of Manfred, summed it up <sup>[2](#ref-2)</sup>: "With 700,000 euros I don't think you can pay for even 20% of the freelance hours needed." At about 85,000 euros a year per person (with employer costs), that buys 8 people for one year. "And with 8 people in one year you haven't even started fixing Renfe's website."

In 2023, Renfe changed scale: 164 million euros split across two contracts. <sup>[3](#ref-3)</sup> 85.5 million went to Sqills Products BV (traveler service system) and 78.6 million to the Accenture + Evolutio Cloud Enable joint venture (design, construction and operation of the new sales and booking system, including web, app, ticket offices and vending machines). That is 114 times the 2019 attempt.

In between, the AVLO launch took the website down. The "Disculpen las mejoras" ("Sorry for the improvements") campaign in the summer of 2025, in the middle of a mess of delays and cancellations, became a national meme. <sup>[4](#ref-4)</sup>

The real-time viewer for long distance launched on March 8, 2026 <sup>[5](#ref-5)</sup>, seven weeks after the [Adamuz accident](https://es.wikipedia.org/wiki/Accidente_ferroviario_de_Adamuz), which killed 46 people in the first collision between two trains on the Spanish high-speed network. Several outlets framed the viewer as part of Renfe's response to public pressure for more transparency after the tragedy. <sup>[4](#ref-4)</sup>

## Two Viewers for a Job One Could Do

Renfe needed two separate websites to cover its train network in real time.

The first, [tiempo-real.renfe.com](https://tiempo-real.renfe.com/) <sup>[6](#ref-6)</sup>, launched in November 2025 and covers only Cercanías. Xataka reviewed it with surprise: it works well, and for Renfe that alone is news. <sup>[1](#ref-1)</sup>

The second, [tiempo-real.largorecorrido.renfe.com](https://tiempo-real.largorecorrido.renfe.com/) <sup>[7](#ref-7)</sup>, arrived in March 2026 and covers AVE, long-distance and medium-distance trains. Renfe plans to merge both viewers in November 2026. <sup>[5](#ref-5)</sup>

[renfe-maps](https://renfe-maps.vercel.app) <sup>[8](#ref-8)</sup> covers every service in a single application. And it adds what neither official viewer offers.

| | Official viewer (long distance) | Official viewer (Cercanías) | renfe-maps |
|---|---|---|---|
| Services | AVE, long and medium distance | Cercanías | AVE, long and medium distance, Cercanías |
| Updates | ~15s polling | ~15s polling | SSE every 5s |
| Open API | ❌ | ❌ | ✅ REST + SSE + OpenAPI |
| Developer portal | ❌ | ❌ | ✅ Scalar |
| Alerts/incidents | ❌ | ❌ | ✅ |
| Train spec sheet | ❌ | ❌ | ✅ |
| Full train itinerary | ✅ | ❌ | ✅ |
| Trains through a station | ❌ | ❌ | ✅ |
| Filter by train status | ❌ | ❌ | ✅ |
| Accessibility filter | ❌ | ❌ | ✅ |
| Train search | ✅ | ❌ | ✅ |
| Follow a train | ✅ | ✅ | ✅ |

It's not that the official viewer is bad. It's that it is fragmented, it has no API, and its data model is opaque. renfe-maps was born because I needed one viewer that covered everything, with accessible data and OpenAPI documentation generated automatically.

## Renfe's Open Data

Renfe publishes 55 datasets on [data.renfe.com](https://data.renfe.com/) <sup>[9](#ref-9)</sup>. That includes static schedules in GTFS format, vehicle positions in GTFS-RT (updated every 15 minutes) and service alerts (every 20 seconds). There is also data on stations, quality indicators and punctuality.

What is missing is a Trip Updates feed: arrival predictions with estimated delays. That is what would let you know "your train will reach the next station 12 minutes late" instead of just "your train is here on the map."

To put this in context, here is where other European operators stand:

- **SNCF** (France): GTFS-RT Trip Updates every 2 minutes. All of it centralized on [transport.data.gouv.fr](https://transport.data.gouv.fr/).
- **Deutsche Bahn** (Germany): a developer portal with real-time delays, cancellations and platform changes.
- **SBB** (Switzerland): a 3-hour prediction window. Complete GTFS-RT feeds for all Swiss public transport.

Renfe has improved a lot in 2025-2026. But it is still behind the main European operators in API quality.

The community has filled some gaps. [CercaníasDirecto](https://cercaniasdirecto.com/) offers a Cercanías radar using Renfe's GTFS data. [Positrén](https://positren.nebulacodex.com/) shows medium-distance, long-distance, AVE and Cercanías trains on a map. David Guardo documented [how to build a Cercanías map](https://davidguardo.com/internet/mapa-en-tiempo-real-de-los-trenes-de-cercanias-renfe-usando-datos-abiertos/) with open data. When the data exists, people build things.

## What I Found: The Undocumented APIs

The official long-distance viewer does not use the public GTFS-RT feeds from data.renfe.com. It uses internal JSON endpoints. They are undocumented, but reachable without authentication.

I found them by inspecting the viewer's `main.bundle.js`. Two URLs:

- `https://tiempo-real.largorecorrido.renfe.com/renfe-visor/flotaLD.json` holds the positions of the active fleet (about 174 trains). It includes commercial code, previous and next station, estimated arrival time, coordinates and delay. It does not include heading or speed. Neither the GTFS-RT feeds nor the viewer's endpoints do. Both renfe-maps and the official viewer have to compute the bearing on the client from position deltas between ticks. It's a workaround that works, but it shouldn't be necessary: if the trains already report their GPS position, including the heading is trivial.

- `https://tiempo-real.largorecorrido.renfe.com/renfe-visor/trenesConEstacionesLD.json` holds the full route geometry: every stop with scheduled and estimated times, completed and pending stops. This endpoint is what unlocked the full itinerary of each train and the list of trains passing through a station in renfe-maps. Without it, those features would not be possible with the public feeds.

The irony: the best data behind the official viewer is not available as an open API. It's right there, reachable with a curl, but undocumented and with no stability guarantee. renfe-maps consumes it, enriches it, and exposes it with OpenAPI documentation and a developer portal. The data Renfe doesn't document, we do.

## How Much Does a Train Viewer Really Cost?

Let's be honest about the numbers. The 164 million euros from 2023 cover Renfe's entire digital transformation: sales system, bookings, app, ticket offices, vending machines. <sup>[3](#ref-3)</sup> It is not the budget of the real-time viewer.

But the viewer itself runs on two JSON endpoints that a personal project can replicate and extend over a weekend. The real, expensive investment is not the viewer. It's the GTFS feeds, the GPS units on the trains, the data pipeline, the railway infrastructure. That does cost millions and takes years.

Once the data exists, building a viewer is commodity work. I did it in a couple of days with a [Docker Sandbox](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox), Claude as the coding agent, and a product owner skill that evolved with every iteration. The cost was my time and a few API tokens.

The contrast is not "164 million vs. free." It's "once you have the data, the presentation layer should be fast and open." And right now it isn't.

## Why It Matters

Public money, public data. Renfe improved enormously in 2025 and 2026 with data.renfe.com, the real-time viewers and the publication of punctuality data. That deserves recognition.

But there is still a way to go. The position feeds update every 15 minutes. There is no public Trip Updates feed. The most useful APIs (the viewer's) are undocumented. The Cercanías network and the long-distance network still live in separate viewers.

When public bodies publish good open data, citizens build things on top of it. renfe-maps exists because Renfe published GTFS-RT feeds. It could be better if they published more.

The Adamuz accident showed why real-time transparency matters. Data should not be a response to tragedy. It should be the norm.

---

_Sources:_
- <a id="ref-1"></a>_<sup>1</sup> [Xataka: "The surprise is that it doesn't look like Renfe made it" (2025)](https://www.xataka.com/movilidad/sorpresa-no-que-2025-renfe-ofrezca-mapa-tiempo-real-trenes-cercanias-sorpresa-que-no-parece-hecha-renfe)_
- <a id="ref-2"></a>_<sup>2</sup> [Xataka: "700,000 euros is a ridiculous budget" (2019)](https://www.xataka.com/empresas-y-economia/que-700-000-euros-presupuesto-ridiculo-para-arreglar-web-renfe)_
- <a id="ref-3"></a>_<sup>3</sup> [Xataka: "80 million to fix its website" (2023)](https://www.xataka.com/servicios/renfe-invertira-casi-80-millones-euros-arreglar-su-pagina-web-114-veces-que-ultimo-intento)_
- <a id="ref-4"></a>_<sup>4</sup> [PR Noticias: "From Disculpen las mejoras to transparency" (2026)](https://prnoticias.com/2026/03/09/renfe-del-disculpen-las-mejoras-a-la-transparencia-en-tiempo-real/)_
- <a id="ref-5"></a>_<sup>5</sup> [Renfe press release (March 2026)](https://grupo.renfe.com/es/es/sala-de-prensa/noticias/2026/03/renfe-estrena-web-tiempo-real-trenes-alta-velocidad-larga-media-distancia)_
- <a id="ref-6"></a>_<sup>6</sup> [Renfe real-time viewer (Cercanías)](https://tiempo-real.renfe.com/)_
- <a id="ref-7"></a>_<sup>7</sup> [Renfe real-time viewer (long distance)](https://tiempo-real.largorecorrido.renfe.com/)_
- <a id="ref-8"></a>_<sup>8</sup> [renfe-maps](https://renfe-maps.vercel.app)_
- <a id="ref-9"></a>_<sup>9</sup> [Renfe open data portal](https://data.renfe.com/)_
