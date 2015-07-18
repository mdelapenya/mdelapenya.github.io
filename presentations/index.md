---
layout: page
title: Presentations
excerpt: "A List of Presentations"
image:
  feature: presentation-background-blue.jpg
  credit: PowerPointBackground
  creditlink: http://www.powerpointbackground.net/wp-content/uploads/2015/03/blue-background-bokeh-presentation-background.jpg
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
