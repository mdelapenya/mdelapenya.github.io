---
layout: page
title: Presentations
excerpt: "A List of Presentations"
image:
  feature: sample-image-6.jpg
  credit: WeGraphics
  creditlink: http://wegraphics.net/downloads/free-ultimate-blurred-background-pack/
---

<ul>
{% for presentation in site.data.presentations %}
  <li>
    <a href="{{ presentation.url }}" target="_blank">
      {{ presentation.name }}
    </a> - {{ presentation.place }} ({{ presentation.date }})
  </li>
{% endfor %}
</ul>
