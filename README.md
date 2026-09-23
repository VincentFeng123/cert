# LifeSkills · Emergency Response Training

A React / TypeScript training webapp with CPR rhythm practice, choking response, emergency preparedness, and domestic violence awareness. All lessons use the same four-stage learning flow. Progress stays in the current browser; no account or server is required for the lessons.

## Run locally

```sh
npm ci
npm run dev
```

Open the Vite URL (normally http://localhost:5173). For the optional training assistant, run `npm run api` in a second terminal. Vite forwards `/api` to port 3001. Copy `.env.example` to `.env` and configure a server-side API key to enable AI answers; without one, the server returns labeled study guidance. Never put API keys in client code.

```sh
npm run build
npm run lint
npm test
npx playwright install chromium
npm run test:e2e
```

The unit test runner uses Node's native TypeScript support (Node 22.18+ or 24+). Browser tests launch a separate Chromium profile and exercise local test progress.

## Learning and practice

- CPR: study guide, flashcards, 15-question quiz (70% pass), and a 3D mannequin with camera controls, hand positioning, and a 30-tap rhythm exercise.
- Choking response: two animated adult figures rehearse consent, supported forward positioning, five separate back blows, fist placement, five abdominal thrusts, and reassessment.
- Gun violence response: a cutaway 3D building rehearses route selection, evacuation, moving away, safe emergency contact, and following responders.
- Domestic violence awareness: a calm 3D conversation rehearses privacy and consent, listening, validation, respecting choices, safely offering resources, and collaborative planning.
- Each of these three modules also includes lessons, flashcards, a quiz, and two branching decision scenarios. Completion requires the full interactive practice sequence and both scenarios; merely viewing an animation does not complete a step.
- A module completes only after its knowledge check and practice requirements pass. Unfinished timed CPR rounds restart when the page reloads. Completed work can be reviewed from the module catalog.
- The renderers use self-contained procedural scenes with camera controls, fullscreen, reduced motion, and interactive diagram fallbacks if WebGL is unavailable. Mouse, touch, and focused keyboard controls are supported. Practice step counts resume after reloading. Older saved lessons and quiz results migrate while the newly added 3D steps remain to be completed.
- These are learning exercises. They cannot assess physical compression depth, recoil, or real-world technique, and do not award professional certification. Source links appear inside each module.

## Deployment

`npm run build` creates `dist`. The included Vercel configuration serves the SPA with its `/api` functions. Set `OPENAI_API_KEY` only in the hosting environment if AI support is wanted. A static host can serve the complete lessons without the optional assistant endpoint; configure an SPA fallback to `index.html` for deep links.
