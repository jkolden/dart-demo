# DART Deposit Batch Demo

This repository contains a React mockup for the County of San Diego DART Deposit Swept Cash ZBA screen.

## What it contains

- Interactive Standard Header and Context Header form
- Record lock simulation after saving the batch
- Conspicuous lock status and detailed messaging
- Placeholder tabs for `GL Lines`, `PNG Lines`, and `AR Receipt Lines`
- Modern demo styling inspired by Redwood UI

## Run locally

```bash
cd dart-demo
npm install
npm run dev
```

## Build

```bash
npm run build
```

## CI/CD for Netlify

A GitHub Actions workflow is included in `.github/workflows/netlify-deploy.yml`.
It runs `npm install` and `npm run build` on each push to `main`.

If you want to deploy to Netlify, add the following repository secrets:

- `NETLIFY_AUTH_TOKEN`
- `NETLIFY_SITE_ID`

Then update the workflow if needed to use the correct branch.
