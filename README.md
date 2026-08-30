# Aegis

Aegis is a mobile-first pregnancy and postpartum care-preparation companion. It brings appointments, questions, notes, optional tracking, medication records, evidence links, lifecycle controls, and exports into one calm local workspace.

## Safety and privacy boundary

- Educational and organizational only; it does not diagnose, treat, monitor, predict risk, or replace professional care.
- Health entries remain in the current browser for this release. There is no account, cloud sync, clinician connection, or advertising analytics.
- Urgent help is always reachable and links to U.S. emergency and crisis resources.
- Tracking records observations without classifying them as normal, safe, or diagnostic.
- Bereavement mode immediately removes pregnancy-development content and disables local reminders.

Do not use this prototype as a public clinical product without the clinical governance, encryption, security testing, privacy review, localization review, and regulatory work described in the PRD.

## Product areas

- **Today:** next appointment, quick notes, and recent optional tracking
- **Journey:** source-linked educational guidance with review metadata
- **Care:** appointment questions and notes, medications, text export, and print/PDF output
- **Track:** symptoms, blood pressure, movement, and mood as user-entered records only
- **You:** communication mode, dark mode, local reminder setting, support drafts, lifecycle transitions, JSON export, and deletion receipt

The app supports responsive navigation, keyboard focus states, reduced motion, local persistence, offline shell caching, a web-app manifest, and light/dark themes.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Verification

```bash
npm test
npm run lint
npm run build
```

## Evidence sources

- [CDC HEAR HER: urgent maternal warning signs](https://www.cdc.gov/hearher/maternal-warning-signs/index.html)
- [ACOG: perinatal mental health patient screening](https://www.acog.org/programs/perinatal-mental-health/patient-screening)

## Technology

React 19, TypeScript, Vinext, Tailwind CSS, shadcn primitives, and the OpenAI Sites deployment runtime.
