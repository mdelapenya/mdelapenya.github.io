---
title: "Cansino: Chasing Politicians Through Their Agendas"
date: 2020-03-16 10:00:00 +0530
description: "Cansino scrapes the public agendas of Spanish regional presidents, so we can check whether what they do matches what they say."
categories: [Política, Cansino]
tags: ["open-source", "golang", "observability", "elasticsearch", "kibana", "apm"]
type: post
weight: 25
translationKey: cansino-chasing-politicians-through-their-agendas
translatedFrom: 76c0fc6
aliases: ["/posts/2020-03-16-cansineando-a-los-politicos/"]
---

Politicians talk a lot about what matters to citizens. Many times, they then do something else.

So I had an idea. I would read the public agendas of certain politicians, in particular the presidents of the autonomous communities (Spain's regional governments), and scrape them, since **they do not offer a public API to query them**. Then I would store each day's events in a repository. That way we could query those events in a structured way, using big data techniques, and verify whether what these politicians do (because it is in their agendas) lines up with what they promise.

I admit this approach is biased. They do not publish what they really do. They only share a vague, thin line of text: _'Attends the council meeting blah blah blah'_, I suppose so they don't get their fingers burned. But it is what we have. I wish our leaders were more transparent and gave us more information!

With all that in hand, I want to process those agenda events, remove the stop words in Spanish (prepositions, conjunctions, etc.), and store each event in a repository that allows analytics on the data set. _Elasticsearch_ is a search-oriented store, and I work at [Elastic](https://www.elastic.co), so what better than to use its power to store the agendas, process the content, and show charts of interest in _Kibana_, such as a tag cloud with the most used words? The result for Castilla-La Mancha could look something like this:

{{< flex-gallery
    src_1="dashboard-sample.png"
    alt_1="Castilla-La Mancha dashboard"
    caption_1="As you can see, many politicians simply 'attend' meetings. As I said before, as a citizen I would love them to be much more transparent than they actually are."
>}}

That is why I named this service **Cansino**. It chases the politician of the day relentlessly, like José Mota's famous [Cansino Histórico](http://www.josemota.com/personaje/el-cansino-historico/). In Spanish, a _cansino_ is a tiresome, pushy person who never lets go.

## Tech Stack

About the stack, I have given you a few brushstrokes of the primary storage, _Elasticsearch_, and of the data visualization app, _Kibana_. I will talk about them later. But how do we fetch, process and send the agendas to the main storage?

This is where the word _scraping_ comes in. It is nothing more than taking the full HTML of the web page where a piece of data is shown, and extracting the information we need by selecting the HTML elements and tags of interest. So it requires analyzing the structure of the page first, to identify how the information is presented.

It is worth stopping here to ask, please, that you use ID attributes consistently: a single ID per page. And that you use HTML markup that is not a genuine lasagna of nested elements with no semantics at all. That said, on to the program that does the scraping.

**Cansino** is a program written in Go that processes HTML documents, each one being the agenda for a specific day of the politician of interest. It takes each event of that day's agenda, extracts the information of interest and sends it to storage. That information maps to these fields:

```
- id: representando un identificador único del evento.
- date: con la fecha y hora del evento.
- description: con las palabras clave de la descripción del evento.
- originalDescription: con la descripción original completa.
- location: con las palabras clave de la localización del evento.
- locationDescription: con la localización original completa.
- attendance: que es a su vez una estructura, una por persona asistente al evento, con los campos:
    - job: con el puesto de la persona.
    - fullName: con el nombre completo.
- owner: con el cargo de la persona dueña de la agenda.
- region: con el nombre de la región.
```

The scraping is possible thanks to [Go-Colly](http://go-colly.org/), which makes this task much easier. In some cases, though, I needed [htmlquery](https://github.com/antchfx/htmlquery) to parse directly the HTML returned by Ajax requests.

{{< flex-gallery
    src_1="agenda-madrid.png"
    alt_1="Agenda of the Community of Madrid"
    caption_1="It is very frustrating to see how the website of the Community of Madrid butchers HTTP verbs and uses POST to return the events of a given day 🤦‍♀️."
>}}

Once the information is captured and modeled in a data structure, I want to index it in _Elasticsearch_. So the data types have to be defined to fit the operations I want to run. That means a _full-text_ search on the description and the location of the events, to find out what our politicians talk about and, just as important, where they do it. So the types for each field are:

```
- id: keyword.
- date: date.
- description: text.
- originalDescription: keyword.
- location: text.
- locationDescription: keyword.
- attendance:
  - job: text.
  - fullName: text.
- owner: keyword.
- region: keyword.
```

Adding [the official Elasticsearch Go client](https://github.com/elastic/go-elasticsearch) to the application is enough to index the data. But first, right after capturing an event from the web, I run it through an _Analyzer_. It is responsible for removing the Spanish stop words from the description and the location (adverbs, pronouns, prepositions, conjunctions, etc.). _Elasticsearch_ ships with this out of the box, so it only has to be declared in the index definition.

```json
    "settings": {
        "analysis": {
            "analyzer": {
                "spanish_stop": {
                    "type": "stop",
                    "stopwords": "_spanish_"
                }
            }
        }
    },
```

The initial load of all the documents, that is, from the first day each agenda has data, I did on my own machine. Then I added a GitHub Action that runs every day at certain hours, like a cron, to store the events of the current day.

> I have to admit that Extremadura has data going back to 2011! Castilla-La Mancha keeps a history since 2017, and the Community of Madrid since 2019.

To understand what is going on in **Cansino** while it runs, I instrumented the code with the [Elastic APM Agent for Go](https://www.elastic.co/guide/en/apm/agent/go/master/index.html). It creates traces of the application every time an event is stored. That way I can know the execution times and the state of the Go runtime, among other things.

{{< flex-gallery
    src_1="transactions.png"
    alt_1="Transactions"
    src_2="errors.png"
    alt_2="Errors"
    src_3="metrics.png"
    alt_3="Metrics"
    src_4="spans.png"
    alt_4="Spans"
>}}

Setting up the environment so the following variables are available is more than enough to tell the agent where to send traces, metrics and errors:

```shell
ELASTIC_APM_SECRET_TOKEN=<APM Token>
ELASTIC_APM_SERVER_URL=<URL del APM Server>
ELASTIC_APM_SERVICE_NAME=cansino
ELASTIC_APM_SERVICE_VERSION=1.0.0
ELASTIC_APM_CAPTURE_BODY=all
```

To control the execution flow of the program, **Cansino** is a CLI written with [Cobra](https://github.com/spf13/cobra), with only two commands:

- **chase**, which processes all the events since the beginning of each agenda.
- **get [-d|--date 2020-04-14]**, which processes the events of a single day, passed as a parameter in _YYYY-MM-dd_ format. If the value of this parameter is the string "Today", the system date is used, so today's events are loaded. This is the command the GitHub Action uses to capture the events of the day.

## Deployment and Operations

I give this its own section because I think operating a service matters a lot. If we have the right knowledge to keep the environment stable, I am fine with operating it ourselves. But what if the disk fails, or the memory, or the server stops answering requests... SaaS to the rescue!

We could have an [Elastic Stack](https://github.com/elastic/stack-docker) deployed in the same network as **Cansino** and send the data there. But keeping the data local would not be worth much. My idea is to share this information at some point. So what better option than [Elastic Cloud](https://cloud.elastic.co) to host the data, and let them operate it for me, with a pay-as-you-go model (heads up, there is a 15-day trial, make the most of it!).

It is true that, as an Elastic employee, I have a tiny cluster for myself, and that is where I put **Cansino**. But it is also true that using Elastic Cloud at the start of a project can save you a lot of setup and operations time. Later you can decide whether to run it in-house or stay on the cloud model.

In this cluster I have an _Elasticsearch_, a _Kibana_, and an _APM Server_ (the middleware that receives the traces from the APM agent for Go and sends them to _Elasticsearch_ in a known format). With a couple of clicks, **Cansino** could start working and sending data to be processed.

To send the data to the Cloud, the _Elasticsearch_ client has to be configured like this:

```go
    cfg := es.Config{
        // configuración de Elastic Cloud
		CloudID:   os.Getenv("ELASTIC_CLOUD_ID"),
		Password:  os.Getenv("ELASTIC_CLOUD_AUTH"),
        Username:  os.Getenv("ELASTIC_CLOUD_USERNAME"),
        // configuración para el agente de APM para Go
		Transport: apmes.WrapRoundTripper(http.DefaultTransport),
	}
    client, err := es.NewClient(cfg)
```

And there is nothing else to do there 😊.

As for the visualization side, I created several specific visualizations in _Kibana_ depending on what I wanted to get, such as:

- comparing the number of events around certain dates of interest, such as elections...
- a tag cloud with the most used words in the descriptions of the agenda events
- a tag cloud with the most used words in the locations of the agenda events

But I am sure you can think of many more!

## Which Regions Am I Analyzing?

At the moment, **Cansino** analyzes three regions of Spain:

- [Castilla-La Mancha](https://transparencia.castillalamancha.es/agenda/198) (my region!)
- [Castilla y León](https://comunicacion.jcyl.es/web/jcyl/Comunicacion/es/PlantillaCalendarioBuscadorComponente/1284877983791)
- [Extremadura](http://www.juntaex.es//web/agenda-presidencia)
- [Madrid](https://www.comunidad.madrid/agenda-gobierno)

## What Else Could We Do with the Stack?

We could also log more in **Cansino** and ship the logs with [**Filebeat**](https://www.elastic.co/beats/filebeat) to the Stack, so we could correlate log events with traces and/or metrics of the application.

I am not an ML expert at all, but surely we could apply Machine Learning to learn a bit from the events, their frequency and their topics, and to spot anomalies.

Any other ideas?

## What If I Want to Analyze What They Say in My Region?

If you want me to add another region, please [open an issue](https://github.com/mdelapenya/cansino/issues/new).

## Do You Want Access to the Dashboards?

If you want access to a dashboard, please send me an email at _mdelapenya at gmail.com_.

> NOTE: since August 2022, when I left Elastic for AtomicJar (acquired by Docker), the Cansino dashboards are no longer available in Elastic Cloud. They would have to be generated again locally.
