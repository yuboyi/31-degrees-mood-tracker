# 31¡ã Mood Tracker ¨C Deployment Guide

This project ships as a Vite + React single page application with optional CloudBase synchronisation. The backend/API layer now exposes a clean JSAPI-friendly surface; follow the steps below to build, test, and deploy confidently.

## 1. Local development

```bash
npm install
npm run dev
```

- Dev server opens on http://localhost:3000 by default (changeable via `vite.config.ts`).
- Hot Module Replacement is enabled, so UI updates apply instantly.

## 2. Quality gates before shipping

```bash
# Static analysis
npm run lint

# Unit tests (Vitest)
npm run test

# Production bundle
npm run build
```

`npm run test` executes the Vitest suite (jsdom environment) and covers the statistics utilities powering the insights dashboard. Keep this step green before deploying downstream environments.

## 3. Preview build locally

```bash
npm run preview
```

The preview server runs the production bundle on http://127.0.0.1:4173 (configurable). Use it to validate routing, charts, and network integration against staging APIs.

## 4. Environment variables

Cloud synchronisation relies on optional env values. Duplicate `.env.example` and populate as needed:

```
VITE_CLOUDBASE_ENV=
VITE_CLOUDBASE_REGION=
```

Leave them empty to operate completely offline.

## 5. Hosting options

| Platform          | Notes                                                                 |
|-------------------|-----------------------------------------------------------------------|
| **Vercel**        | Zero-config for Vite. Connect the repo, set env vars, trigger deploy. |
| **Netlify**       | Drag & drop the `dist/` folder or hook the repo and let Netlify build. |
| **GitHub Pages**  | Run `npm run build`, push `dist/` via GitHub Actions or `gh-pages`.    |
| **Custom server** | Serve the `dist/` folder behind any static server (Nginx, S3, etc.).   |

## 6. Deployment checklist

- [ ] `npm run test` ?
- [ ] `npm run build` ?
- [ ] Environment variables set for the target stage
- [ ] WeChat credentials & callback URLs configured (staging/production)
- [ ] Observability hooks (logs, uptime checks) pointed at the deployed host

When the checklist is complete, promote the artefact to staging (Sep?24, 14:00¨C16:00 window) and confirm the end-to-end flow (create ¡ú pay ¡ú notify ¡ú refund ¡ú notify) before moving to production.
