---
title: "Your AI should understand its own bill"
description: "How Ditto combines recorded usage, Cascade's Ephemeris forecasting API and plan requirements to explain credit consumption and help you choose a suitable plan."
pubDate: 2026-10-19
author: "Ditto Team"
tags: ["engineering", "billing", "forecasting", "ephemeris"]
featured: true
draft: false
---

A credit balance tells you how much is left. It takes more context to explain where it went, whether your current pace is sustainable, or which plan fits the work you actually do.

We built a tool that lets Ditto answer those questions from your account's recorded usage. You can ask in the same chat where you use the product, without exporting a spreadsheet or connecting a separate forecasting account.

The system brings together three things: billing records, time-series forecasting through **Cascade's Ephemeris API**, and the requirements that make a plan suitable for you. Ditto turns that evidence into a short explanation, with the detailed tool result available when you want to inspect it.

## Ask about the work behind the credits

Try questions like:

- “Where have my credits been going recently?”
- “At my current pace, how does my usage compare with the credits I have until my next reset?”
- “Which plan fits if I keep my current resources and connect my chat apps?”

These questions need different answers. An activity overview might highlight recorded searches, memory growth or the categories behind tracked credit consumption. A forecast question needs history, current balances and uncertainty. A plan recommendation also needs to know what you use and what you want to keep.

The default reply stays at that level. Forecast ranges, model details and accounting diagnostics belong in the collapsed tool details unless you ask for them.

## Give the forecaster the right history

Before predicting consumption, we have to define it.

Buying credits is not consuming credits. A subscription fee is not a usage charge. Work covered by included credits still counts as consumption, even when it does not draw from your purchased balance. Pending or canceled reservations are not completed usage.

Ditto builds its forecasting history from retained receipts and settled billing operations. Supported historical work is estimated at configured prices so the forecast can address future consumption rather than simply repeat old dollar charges. Missing prices and unsupported work remain explicit gaps. That normalization does not rewrite your invoices or historical charges.

Long histories stay in the analysis. We aggregate older observations into wider, regularly spaced buckets when needed to fit the forecasting context. There must be enough recorded consumption to support an estimate; a new account does not get an invented spending pattern.

Recent activity insights are measured separately from the daily forecast cache. They can describe recorded searches, image activity, tracked consumption categories and personal memory records added. Those counts have limits: imported records are not necessarily newly written messages, and a recorded search is not proof of a unique or successful task. Older charges may also lack the breakdown available for newer settlements.

## Why Ephemeris, and where Cascade fits

[Ephemeris](https://ephemeris.cascade.industries/docs) provides probabilistic time-series forecasts through a hosted API. Its [model panel](https://ephemeris.cascade.industries/models) includes models from Amazon, Google Research, Datadog and other publishers, with explicit, routed and ensemble modes.

Ditto's current integration requests **Chronos-2** explicitly. We use the language model to explain the result and relate it to your needs; the numeric forecasting request goes to a model built for time series. The [Chronos-2 research paper](https://arxiv.org/abs/2510.15821) describes a pretrained model that handles forecasting without training a separate model for each new dataset.

[Cascade's open-source project](https://github.com/TensorLink-AI/cascade) explores another part of this field through competition on synthetic training data. Participants develop synthetic data generators, while the training setup is held consistent within a round so their effects can be compared. The project evaluates the resulting forecasters against held-out real-world data.

These are distinct layers. Ditto uses Ephemeris to access Chronos-2 today; this integration does not mean your billing prediction runs on a Cascade-trained checkpoint. The connection gives us a practical way to put specialized forecasting inside an everyday assistant.

## A forecast has to earn its place

Good benchmark results do not establish accuracy on your particular usage history. Ephemeris publishes [forecasting benchmarks](https://ephemeris.cascade.industries/benchmarks), but a burst of image generation or a switch in how you fund your work can make your account behave very differently from a benchmark dataset.

Ditto therefore compares the provider's predictions with a simple recent-pace baseline on historical periods whose later usage is already known. Each test uses only the history available before its cutoff. If the provider has not shown enough evidence to justify using it, Ditto returns the baseline instead and identifies the method.

This safeguard mattered in our early testing: the more sophisticated candidate did not consistently beat recent pace on a bursty account. Keeping the baseline was the useful result of that experiment.

Forecast ranges are conditional scenarios, not guarantees. Adding per-period quantiles does not create a calibrated confidence interval for a whole month's total. Ditto withholds precise credit-runout dates when the evidence does not support them. A missing date does not mean your credits are guaranteed to last.

## Keep BYOK separate

When you bring your own provider key, that provider bills the supported work. Its activity must not become Ditto credit consumption just because Ditto can observe it.

The tool reports BYOK activity separately and can estimate its token workload from recent pace. That estimate is **not** an Ephemeris forecast or an external-provider invoice. Moving work between BYOK and Ditto-funded usage changes the assumptions behind both estimates.

For managed forecasting, Ditto sends numeric usage totals to Ephemeris, with an opaque request identity. It does not send your prompts, saved memory content, images or account IDs. Personal billing analysis also does not grant access to another person's billing history through organization membership.

## Recommend a suitable plan, then leave the choice to you

Consumption alone cannot decide between [Pay as you go, Plus and Pro](/pricing). Seats, connected chat apps, manual model selection and the resources you need to retain can rule out an otherwise cheaper option.

Ditto combines known requirements and current resource use with the consumption estimate to recommend the least expensive suitable plan. When a missing requirement would change the answer, it can ask a focused follow-up. Plan fees and included usage credits remain separate amounts; a larger subscription is not automatically cheaper for heavy usage.

This tool gives advice. It does not change your subscription, buy credits or enable automatic top-ups. Stripe still shows the applicable tax, proration and change dates before you confirm a billing change.

Ditto sponsors the forecasting requests under daily spending limits and caches successful results per account per UTC day. Refreshing an explanation can reuse that result. An uncertain paid request is not automatically retried. Ordinary chat and other product usage still follow their normal billing rules.

## Try it in your own account

Usage analysis is enabled across Ditto plans, with forecasts subject to supported history, availability and daily limits. Storage-use insights are outside this release.

Start with a question about your own work: [open Ditto](https://app.heyditto.ai/chat) and ask where your credits are going, how your current pace compares with your balance, or which plan fits what you need. The aim is to give you enough evidence to make a decision, without making you read an accounting report first.
