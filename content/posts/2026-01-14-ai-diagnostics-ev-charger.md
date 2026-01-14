---
title: "A Tale of Two Diagnostics: AI vs. Traditional Troubleshooting"
date: 2026-01-14 09:00:00 +0100
description: "When my new EV charger failed, I turned to ChatGPT for troubleshooting. The experience made me think about how different industries adopt new diagnostic tools."
image: "/images/posts/2026-01-14-ai-diagnostics/cover.png"
categories: [Technology, AI, Personal]
tags: ["artificial-intelligence", "ev", "electric-vehicles", "troubleshooting", "chatgpt"]
type: post
weight: 14
showTableOfContents: true
---

![AI vs Traditional Diagnostics](/images/posts/2026-01-14-ai-diagnostics/cover.png)

## The Setup

I recently bought an electric car and had a home charger installed. Installation went smoothly, the technician finished up, and we were ready for the moment of truth: the first charge.

The car detected the charger. The app showed it was connected. Everything looked perfect.

Then the car's screen displayed: **"External charging equipment not supplying energy. Check power source or try other equipment."**

Zero amps. No charging. The charger was on, the app was working, but no power was flowing to the car.

## Enter the AI

As a software engineer, my first instinct was to diagnose before replacing. I opened ChatGPT and described the situation: the car model, the charger (a Policharger), the error message, and the symptoms.

What I got back wasn't a simple answer. It was a systematic diagnostic framework that turned out to be spot on.

### The AI's Initial Assessment

> **ChatGPT:** This error is relatively common in recent installations and almost never means a "broken" charger. It's usually configuration, protections, or measurement issues, not the Policharger itself.
>
> When the car says "no power" or "charging equipment not powered," it means: the car detects the charger, but the charger isn't delivering voltage to the connector. Something upstream is cutting or blocking the energy.

The AI then provided a prioritized list of likely causes:

1. **Solar excess mode** without actual solar production
2. **Current clamp misplaced or inverted** (measuring wrong values)
3. **Incorrect differential breaker** (Type AC instead of Type A)
4. **Miswired phases** (L/N inverted or loose connections)
5. **Minimum current threshold** not being met
6. **Actual charger failure** (listed as least probable)

### Going Deeper

When I reported that forcing a 10A charge still resulted in the "no power" error, the AI narrowed it down:

> **ChatGPT:** If forcing charge at 10A still shows "no power," this is NOT an excess solar issue, nor a clamp issue, nor solar configuration.
>
> This clearly points to **electrical installation / protections / wiring**, not usage.
>
> The charger powers on, the app responds, the car detects the charger, but it does NOT charge even when forcing 10A. This means: the charger is NOT delivering voltage to the Type 2 connector. This only happens due to internal safety lockout, caused by an upstream electrical error.

The AI then provided specific diagnostic steps:

> **What to tell the installer (copy this exactly):**
>
> "We forced manual charge at 10A and the car still indicates no power. This rules out solar excess or clamp issues. I need you to check: Type A EV differential, neutral continuity, L/N wiring, surge protector, actual voltage at Policharger input and output. The charger is blocking due to electrical detection."

## The Human Response

I shared this diagnostic framework with the technician. His response was immediate: he wanted to take the charger back and replace it with a new one.

I insisted we at least check one thing the AI had mentioned: **the neutral wire might not be properly secured**.

Reluctantly, he opened the charger and moved some cables around. Suddenly, the car started charging. But after about a minute, it stopped again with the same error.

The technician's verdict? The charger was defective. He wanted to swap it.

But the AI had predicted exactly this. A loose connection would cause intermittent behavior, not complete failure. The temporary success when wiggling cables was diagnostic gold, not evidence of a faulty unit.

## What the AI Saw That the Technician Didn't

When I shared this photo of the opened charger, ChatGPT analyzed the visible components:

![Inside the Policharger - L1/N/PE inputs, Toscano contactor, and the suspected loose neutral connection](/images/posts/2026-01-14-ai-diagnostics/charger.jpg)

> **ChatGPT:** Looking at the photo, I can see:
> - The Policharger is mechanically well-mounted
> - L1 / N / PE inputs clearly identified
> - Toscano WCT-40A contactor (correct for EV)
> - Apparently correct cable sections
>
> **Most likely problem:** The neutral is poorly referenced or poorly connected. This matches 100% with the symptom. The Policharger powers on, communicates, detects the car, but does NOT close the contactor, does NOT deliver voltage to the Type 2 connector.
>
> Why? Because the Policharger detects incorrect voltage between L and N, or non-continuous neutral.

## The Second Problem: When Things Got Interesting

After the cable adjustment, a new issue emerged. The charger would occasionally start, but then drop to 0A and refuse to charge, even with the heat pump (aerotermia) turned off. The car still wasn't charging.

The app showed: "Connected 0A" with a small sun icon showing 4A and a house icon showing 6A.

This time, the AI diagnosed a configuration problem:

> **ChatGPT:** A car cannot charge below ~6A. This is a limitation of the IEC 61851 standard, not the car or Policharger.
>
> Right now: Solar available: 4A. Total margin: insufficient. The Policharger detects excess, but does NOT reach the minimum, therefore does NOT close the contactor, the car sees "plugged in but no voltage."

When I shared the exact app settings, the AI found the culprit:

> **ChatGPT:** The key is here: **"General consumption reading: Home + Car"**
>
> This is WRONG for your scenario. Right now the Policharger measures house consumption, adds also the car consumption, then tries to calculate FV excess.
>
> Result: it enters an absurd loop, never sees real margin, stays at 0A, car says "no power."

The suggested fix? Change one setting in the Policharger app from "Home + Car" to just "Home." The charger calculates solar excess by subtracting house consumption from solar production. With "Home + Car," it was including the car's own charging in that consumption figure, so it could never see enough margin to actually start charging.

I shared this with the company. They agreed the app setting needed to change. But they're still replacing the charger. My car still isn't charging.

## Different Workflows

Here's what surprised me. Not the technical diagnosis. The reaction to it.

When I shared the diagnostic framework with the technician, he wasn't interested. When I later discussed it with his manager, he backed the decision to swap the charger and "investigate what happens with the old one."

I get it. They have a workflow that works for them. Swap the unit, test the old one in the shop, move on to the next job. It's efficient. It minimizes time on-site. And most of the time, it probably works fine.

But in this case, the default response was to replace hardware rather than test a configuration change. The AI's analysis pointed to specific, testable causes. That input didn't fit their usual process.

## What This Means

I'm not writing this to criticize a specific technician or company. They're professionals, and for all I know, replacing the unit might be the right call for reasons I don't fully understand. Maybe they've seen patterns I haven't. Maybe the economics of their business make swapping faster than diagnosing. Maybe the AI is wrong about something.

But the experience made me think about how different industries integrate new tools.

In software, we've spent the last couple of years learning to use AI as a diagnostic partner. It's become normal to paste an error message into ChatGPT, or into Claude Code or Gemini, and get useful suggestions. Not always right, but often a good starting point.

In this case, ChatGPT identified:

1. A loose neutral connection (confirmed when wiggling cables temporarily restored charging)
2. A configuration issue in the Policharger app (the "Home + Car" setting that creates an impossible calculation loop)
3. The interaction between solar production, heat pump consumption, and charging thresholds

Whether or not the hardware replacement was necessary, those diagnostic insights came from a conversation with an AI. That's new. And it's not limited to software problems anymore.

## The Broader Question

I wonder how this will play out across different fields.

Electricians, plumbers, HVAC technicians, mechanics - they all have deep expertise built over years of hands-on work. That knowledge is irreplaceable. An AI can't feel a loose connection or smell a burned component.

But AI can process documentation, cross-reference symptoms, and suggest diagnostic paths. It can remember every failure mode ever documented for a specific product. It doesn't get tired or rush to the next job.

The interesting question isn't whether AI will change troubleshooting. It's how different industries will figure out where AI helps and where experience matters more. Software got a head start on this because we were already at our computers when the tools arrived. Other fields will find their own balance.

## Epilogue

The company is replacing my charger. I'm not charging at home until they do.

If the AI's diagnosis is correct, the new charger might have the same issues unless the underlying causes are addressed. But maybe I'm wrong. Maybe there's something about the hardware that the technician recognized and I missed. I'll find out soon enough.

Either way, I learned a lot this week. About EV charging infrastructure, about solar excess calculations, about how different industries approach problems. And yes, about how useful AI can be as a first diagnostic step, even for problems outside my expertise.

I've shared the AI's analysis with the company. What happens next is up to them.

---

*The charger photo and diagnostic conversation are real. The AI excerpts are translated from Spanish and lightly edited for clarity. No actual chargers were harmed in the writing of this post... yet.*
