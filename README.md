# n8n-nodes-justgains

This is an n8n community node. It lets you use [JustGains](https://justgains.com) in your n8n workflows.

JustGains is a training app for lifting, running, food logging and bodyweight tracking. With this node a workflow (or an AI agent) can generate and save workouts, log meals and weigh-ins, and read your training history, progress and recovery.

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/sustainable-use-license/) workflow automation platform.

[Installation](#installation) ·
[Credentials](#credentials) ·
[Operations](#operations) ·
[Usage](#usage) ·
[Example workflows](#example-workflows) ·
[Compatibility](#compatibility) ·
[Resources](#resources) ·
[Version history](#version-history)

## Installation

In n8n, open **Settings > Community Nodes**, select **Install**, enter `n8n-nodes-justgains` and confirm.

For other ways to install, follow the [installation guide](https://docs.n8n.io/integrations/community-nodes/installation/) in the n8n community nodes documentation.

## Credentials

The node signs in with a personal API key.

1. Sign in at [justgains.com](https://justgains.com) and open your [profile](https://justgains.com/profile).
2. Select **Settings**, scroll to **API Keys**, give the key a name (for example `n8n`) and select **Create key**.
3. Copy the key. It starts with `jg_` and is shown only once.
4. In n8n, create a **JustGains API** credential and paste the key into **API Key**. Leave **Base URL** as `https://justgains.com`.

A key acts as you: it can read and change your JustGains data. Keep it private. To cut off an automation, revoke its key in the same **API Keys** section; anything using it loses access within an hour.

How it works: n8n exchanges the key for a short-lived access token and exchanges it again whenever the token expires, so the key itself is only ever sent to JustGains to start a session.

## Operations

| Resource | Operation | What it does |
| --- | --- | --- |
| Workout | Generate | Generate and save a workout from a plain-language request ("30 minute leg workout with dumbbells") |
| Workout | Create | Save a workout you describe exercise by exercise, with sets, reps and weight |
| Workout | Get | Get a workout with its exercises and sets |
| Workout | Update | Change a workout's title, description or exercises |
| Workout Log | Get Many | Get workouts you logged, filtered by date and ranked by recency, volume or duration |
| Workout Log | Get Recent | Get recent workouts with their totals (duration, volume, sets, reps) |
| Exercise | Search | Search the exercise library by name, muscle group or equipment |
| Exercise | Get | Get an exercise's instructions, equipment and muscles worked |
| Exercise | Get History | Get your logged sessions and personal best on one exercise |
| Exercise | Get Top | Get your most frequent, heaviest and highest-volume exercises |
| Program | Search | Search the program catalog |
| Program | Get | Get a program with its weeks and days |
| Program | Get Enrolled | Get the programs you follow and your progress |
| Program | Create | Build a multi-week program from plain text and save it |
| Program | Update Enrollment | Start, complete or abandon a program |
| Food | Log | Log a meal (catalog nutrition is preferred; your estimate is saved when there is none) |
| Food | Remove | Remove entries from your food diary |
| Food | Get Diary | Get a day of your food diary with totals and targets |
| Food | Search | Search the food catalog and your recent foods |
| Bodyweight | Log | Record a weigh-in in pounds or kilograms |
| Bodyweight | Get History | Get weigh-ins with your current, lowest and highest weight |
| Route | Create | Plan a run, ride, walk or hike route and save it to your Routes |
| Profile | Get | Get your profile, units, timezone, goals and body details |
| Profile | Update | Change profile fields |
| Insight | Get Week Summary | Recap recent workouts, muscle groups and bodyweight change |
| Insight | Get Progress | XP, workout volume, steps and active days over a period |
| Insight | Get Recovery | Weekly set targets and recovery for each muscle group |
| Insight | Get Consistency | Current and longest streaks and workouts per week |
| Insight | Compare Weeks | Compare your latest training window with the one before |

## Usage

**Units.** Weights are stored in kilograms. Inputs that take a weight say which unit they use: Bodyweight > Log has a unit picker, and workout sets take `"unit": "lb"` or `"unit": "kg"`. Results include canonical kilograms and, where JustGains provides one, a display value in your preferred units.

**Lists.** Get Many, Get Recent, Search (exercises and programs) and Get Enrolled return one n8n item per result. Every other operation returns a single item.

**JSON inputs.** Workout > Create and Update take the exercise list as JSON, and Food > Log and Remove take the foods as JSON. Each field opens with a working example. You can build these with expressions from earlier nodes.

**Retries.** Food > Log sends a request ID that stays the same when n8n retries the item, so a retried step never saves the meal twice. Set **Request ID** yourself if the same meal can reach the node from more than one execution.

**AI agents.** The node can be attached to an n8n AI Agent as a tool. Each operation is described in plain language, so an agent can answer "how was my training week?" with Insight > Get Week Summary or log "two eggs and toast for breakfast" with Food > Log.

## Example workflows

- **Weekly recap to Slack or email**: Schedule Trigger (Monday 8:00) → JustGains *Insight: Get Week Summary* → Slack *Send Message*.
- **Smart scale weigh-ins**: Webhook from your scale → JustGains *Bodyweight: Log* with the weight from the webhook body.
- **Meal logging from chat**: Telegram Trigger → AI Agent with the JustGains node as a tool → the agent logs the meal with *Food: Log* and replies with the day's totals.
- **Program from a coach's sheet**: Google Sheets trigger → JustGains *Program: Create* with the sheet's text.

## Compatibility

Built with `@n8n/node-cli` 0.54 and tested on self-hosted n8n 2.45.4.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/#community-nodes)
- [JustGains](https://justgains.com)
- [Connect JustGains to AI assistants](https://justgains.com/learn/connect-justgains-to-ai-assistants)

## Version history

### 0.1.2

Food > Log saves every distinct meal an AI agent logs in one run; retries of the same meal are still saved once.

### 0.1.1

Limit parameters default to 50, as in other n8n nodes.

### 0.1.0

First release: the JustGains API credential and the JustGains node with 29 operations across workouts, workout logs, exercises, programs, food, bodyweight, routes, profile and insights.
