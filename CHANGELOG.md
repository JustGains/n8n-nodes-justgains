# Changelog

## 0.1.2

- Food > Log: the request ID that guards against duplicate meals now includes the meal and the n8n instance, so an AI agent logging two meals in one run saves both, and a fresh n8n instance never repeats an earlier ID. A retry of the same meal still keeps its ID.

## 0.1.1

- Limit parameters default to 50 like every n8n node; JustGains still caps exercise search at 25 results and recent workouts at 20.
- First release published through npm trusted publishing.

## 0.1.0

- JustGains API credential: a personal API key, exchanged for short-lived access tokens.
- JustGains node with 29 operations across workouts, workout logs, exercises, programs, food, bodyweight, routes, profile and insights. Usable as an AI Agent tool.
