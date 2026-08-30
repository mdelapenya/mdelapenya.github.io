---
title: gitropolis
type: page
tags: [git-visualization, 3d, webgl, open-source]
---

## gitropolis

Your git history, replayed as a 3D city. Files become buildings, folders become districts, and every merged pull request lights up the skyline in the colour of the work it did — feat in green, fix in red, docs in blue, and so on. Scrub through time, speed up to ×30, and watch years of development unfold in minutes.

Building height maps to lines of code (damped logarithmically so a 40-line helper and a 1,200-line module still read side by side). Each top-level directory gets its own stable colour and ground plate, so the shape of a repository reads at a glance. No install, no auth — just paste a public GitHub URL and the city builds itself.

I submitted several of my own repos: `testcontainers-go`, `lpn`, and `biomelab` are all in there.

- Live app: [gitropolis.vercel.app](https://gitropolis.vercel.app)

![gitropolis](/images/projects/gitropolis.png)
