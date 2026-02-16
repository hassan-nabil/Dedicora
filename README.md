# Dedicora

Dedicora is a productivity web app for hackathons that guides users through a focused flow: Welcome, Enter Task, Assign Task and Timer (3A/3B), Timer, and Report. It includes accessibility features, settings, per-page audio playback, task breakdown via Gemini, and a performance report with chart summary and bullet insights.

## Features

- 5 state flow: Welcome, Enter Task, Assign Task and Timer, Timer, Report
- Settings modal with audio toggle, color-blind modes, and light/dark theme
- Only This and Break It Down flows powered by Gemini
- Timer with task navigation, sidebar progress, and stickman state
- On-demand productivity report with chart and insights
- Local JSON fallbacks when Gemini is unavailable

## Getting Started

Install dependencies once:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Gemini Setup

The API key is hardcoded in:

- app/api/gemini/task/route.ts
- app/api/gemini/report/route.ts

Replace the placeholder string:

```ts
const GEMINI_API_KEY = "YOUR_API_KEY_HERE"
```

## Audio Files

Add MP3 files to public/audio with these names:

- welcome.mp3
- task.mp3
- assign.mp3
- timer.mp3
- report.mp3

Audio plays per page when the speaker toggle is on and restarts on each page.


## Notes

- The report only generates when "Check my productivity" is clicked
- Bar chart is the default chart style for clarity
- Local fallbacks are in data/taskFallback.json and data/reportFallback.json
