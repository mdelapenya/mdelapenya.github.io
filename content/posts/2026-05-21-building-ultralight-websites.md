---
title: "Building Ultralight Websites"
date: 2026-05-21 09:00:00 +0200
description: "In 2000 I took a 300-hour course to learn how to make web pages. In 2026 I built a complete fan site in a couple of days with Claude. This is the arc that connects the two moments."
categories: [Technology, Software Development, AI]
tags: ["web-development", "historia", "coding-agents", "docker-sandboxes", "ia", "html", "jquery"]
type: post
weight: 30
translationKey: building-ultralight-websites
translatedFrom: 65806e3
aliases: ["/posts/2026-05-21-haciendo-webs-ultraligeras/"]
---

![Building Ultralight Websites](/images/posts/2026-05-21-haciendo-webs-ultraligeras/cover.png)

In 2000 I signed up for a web design course. It lasted 300 hours. Three hundred hours to learn how to write HTML.

Today, more than 25 years later, I built a complete fan site with Next.js, TypeScript and Vercel in a couple of days, with an AI agent doing most of the work.

This post is not nostalgia. It is a map of how the craft has changed, and why developers starting out now have an advantage that did not exist before.

## The First Website: A Plain HTML Fan Page

The first project to come out of that course was a page about Gwyneth Paltrow. Pure HTML, no external CSS, no JavaScript. Every tag typed by hand in Windows Notepad.

We learned by reading the source code of other sites. Right click, "View Source", and copy what you did not understand. There was no Stack Overflow. There were no video tutorials. There was the course manual and the F12 key, which back then opened no DevTools at all.

The way to find out whether something worked was: save the file, switch to Internet Explorer, hit F5. If the title looked right, cause for celebration. If not, off to hunt for the badly closed tag among a hundred lines of unindented HTML.

I still get a little emotional remembering the first time I put a GIF of a spinning wheel inside a [`<marquee>`](https://developer.mozilla.org/docs/Web/HTML/Reference/Elements/marquee). The wheel did not just spin: it rolled across the screen.

## 2002: Tables, Frames and a Visit Counter

Two years later I built a more ambitious site: "Vampiro: The Beginnings", a role-playing site hosted on Lycos. It took me weeks.

The architecture was a `<frameset>` with two frames: the content on the left and the Lycos ad banner on the right. The whole layout was a table nested inside another table, with `bordercolor="#94dece"` written straight into the HTML. There was no separation between structure and style. Everything was mixed together.

To count visits, I added a counter from miarroba.com: an external `<script>` that drew a number on the screen. That was analytics back then. I even made a guestbook so my friends could write something cool.

The code had comments like `<!--espacio izquierdo para banners//-->`. Reading it today, you see someone trying to get organized in an environment with no tools.

## The Editor Race

Code editors tell the story of the friction we kept removing.

Back then, most people used Dreamweaver to build web pages, so that is the tool the course taught us. Dreamweaver generated the HTML for you through a visual interface: you dragged elements, placed them, and the tool wrote the code. It was comfortable, but it put distance between you and what was happening underneath. Seen from far away, it is exactly what happens today with agents: instead of dragging little boxes, you write a prompt, and the magic happens underneath.

I preferred Notepad. I could build tables from memory. No wizard, no live preview, nothing. That difference mattered: you understood what you wrote because nothing stood between you and the HTML.

Notepad++ arrived and it was a real leap: syntax highlighting, tabs, decent find and replace. You still typed everything by hand, but at least the editor helped you see what you were typing.

In 2011 I discovered Sublime Text. It was another level: multi-cursor, command palette, speed. For the first time the editor felt like a tool built for serious work.

Then came Atom, GitHub's editor. More extensible, slower, but with a plugin ecosystem that made it very adaptable. And then VS Code, which won the war: fast, extensible, backed by Microsoft, with a community that published an extension for everything.

Each leap reduced the friction. But the knowledge was still yours. The editor helped you write; what you wrote depended on what you knew.

And what you had to know was growing. JavaScript went from being an ornament (an `alert`, a rollover, a silly form validation) to being infrastructure. Suddenly pages had to react without reloading, move things around the screen, talk to the server in the background. And JavaScript, at that point, was a minefield: every browser implemented the DOM in its own way, and the same `document.getElementById` could break in three different ways across Internet Explorer, Firefox and the newly arrived Chrome. Normalizing behavior by hand was archaeology.

## jQuery: The Library You Could Not Ignore

In that chaos, jQuery took over. It abstracted every browser difference into one coherent API: selectors, events, animations, AJAX. What used to take twenty lines of conditional code took three.

And because it worked, it became mandatory. For a whole period, not using jQuery was a sign you were not up to date: if you manipulated the DOM by hand, someone asked you why. Learning jQuery stopped being a choice and became a credential. Not because it was hard, but because the whole ecosystem assumed you used it.

Today it has disappeared from most new projects. Modern browsers implement natively what it added. But in its day it defined what it meant to know frontend.

## The Frontend Explosion: Foreign Territory

After jQuery came the big explosion. React, Vue, Angular. npm, webpack, Babel. The frontend became a discipline with its own ecosystem, its own conventions and its own learning curve, independent of the backend.

I am a backend developer, mostly [Go](/posts/2025-10-10-coding-agents). That world was always foreign territory to me. I could build a robust API, design an integration testing setup with Testcontainers, reason about concurrency. But setting up a React project from scratch, configuring webpack, understanding the component lifecycle: that took an investment of time I did not always have.

For years that barrier was real. If you wanted to build something with a frontend, you either did it halfway yourself or found someone who knew how. There was no middle ground.

## 2026: Ultralight in a Couple of Days

On May 8 I was at the Toledo Beat Festival. I saw Ultraligera play and I was blown away: loud guitar rock, a frontman with the energy of Axl Rose, a band that sounded huge live. The next day I wanted a way to keep track of them, see concert dates, listen to their music in one place.

There is an [official site](https://www.ultraligera.com/), but it is a bit weak. So I built the one I would have liked to find.

I built it inside a [Docker Sandbox](/posts/2026-04-14-building-a-real-app-inside-a-docker-sandbox) with Claude as the agent, deployed on Vercel. An unofficial fan site with discography, dates and links to Spotify and YouTube. The result is at [ultraligera.vercel.app](https://ultraligera.vercel.app); the [project page](/projects/ultraligera/) details the automations that keep the data up to date.

It took a couple of days. And the point is not that it was fast: it is that I, a backend developer who does not master the frontend, built it without getting blocked. I described what I wanted, the agent generated the code, I reviewed and adjusted the direction. The IDE stopped being the place where you write and became the place where you [supervise](/posts/2026-02-24-coding-with-agents-like-tesla-autopilot).

That is what agents change for people who are not specialists in an area: they remove the [barrier between having an idea and being able to execute it](/posts/2026-03-07-i-removed-the-friction-now-i-write-every-other-day).

## The Arc Closes

My first website was a Gwyneth Paltrow fan page, written in plain HTML in Notepad, after a 300-hour course. I could only see it on my own computer.

My latest website is an Ultraligera fan page, built with Next.js and an AI agent, in a couple of days, deployed automatically to Vercel with every commit to the main branch.

The instinct is the same. The friction is completely different.

You do not need a 300-hour course to build your first website. Five years ago, today's tools were science fiction, and [AI tokens](/posts/2026-04-06-tokens-are-the-new-aws-account) compress years of learning into months. That does not mean knowledge does not matter. It means the barrier to entry is gone, and what is left is the idea.

_Resources:_
- _[Lycos site, rescued from the Web Archive](https://web.archive.org/web/20031017204440/http://usuarios.lycos.es/dorian_themight/)_
