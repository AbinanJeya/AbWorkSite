# AbWork Website Handoff

## What this repo is
- This is the `AbWork` marketing site in `C:\AbWork\AbWork-Website`.
- The active site is a React + Vite app rooted at `react-site/`.
- The old root-level `index.html`, `styles.css`, `script.js`, and `site.js` still exist, but the shipped website runs through Vite, not the old static page.

## Current architecture
- Main app entry: `react-site/src/App.jsx`
- Main shared styling: `styles.css`
- Landing sections:
  - `react-site/src/components/landing/NavBar.jsx`
  - `react-site/src/components/landing/HeroSection.jsx`
  - `react-site/src/components/landing/ProofStripSection.jsx`
  - `react-site/src/components/landing/SignatureFeaturesSection.jsx`
  - `react-site/src/components/landing/ShowcaseSection.jsx`
  - `react-site/src/components/landing/WhyItSticksSection.jsx`
  - `react-site/src/components/landing/TrustSection.jsx`
  - `react-site/src/components/landing/DownloadSection.jsx`
  - `react-site/src/components/landing/FooterSection.jsx`
- Shared behavior hook: `react-site/src/hooks/useLandingEffects.js`

## Live phone preview
- The hero phone is not a fake HTML mockup.
- It embeds a copied Expo-web preview of the FitAI app through `react-site/src/components/FitAiPreview.jsx`.
- Local dev preview source:
  - `http://127.0.0.1:8081/`
- Production/GitHub Pages preview source:
  - `fitai-preview/index.html` from `react-site/public/fitai-preview`
- The preview is exported from the copied app in `fitai-expo-preview/`.
- Export finalizer that fixes Pages asset paths:
  - `scripts/finalize-fitai-preview-export.mjs`

## Commands
- Website dev:
  - `npm run dev`
- Website build:
  - `npm run build`
- Preview export:
  - `npm run preview:export`
- Preview local serve:
  - `npm run preview:serve`
- Preview full local flow:
  - `npm run preview:dev`

## Deployment
- GitHub Pages workflow:
  - `.github/workflows/pages.yml`
- Vite config:
  - `vite.config.js`
- Vite uses:
  - `root: 'react-site'`
  - `base: './'`
- Pages deploys `dist/`.
- Important Pages caveat:
  - the exported FitAI preview must use relative asset paths
  - this is handled by `scripts/finalize-fitai-preview-export.mjs`

## Current product/design direction
- The site has been moving toward:
  - premium dark aesthetic
  - AbWork green used more broadly across the site
  - live app preview as the hero focal point
  - APK-first conversion flow
- Current user preference:
  - less text-heavy
  - more visual explanation
  - more animation and motion to communicate value quickly
- The user specifically called out:
  - hero headline is too text-heavy
  - trust/product-proof headline is too text-heavy

## Latest agreed design direction
- The next major pass should make the site feel more like a product demo and less like a text-heavy landing page.
- Direction already agreed:
  - shorter hero headline
  - product-proof section should explain the product visually
  - trust / why-it-sticks section should use compact visual cards instead of large text blocks
  - motion should be subtle, premium, and explanatory

## Current uncommitted state
- There are local uncommitted changes right now.
- `styles.css` has a green-theme propagation pass applied locally.
- `dist/` has build output changes from that pass.
- `preview-server-shot.png` is present as an untracked file.
- Before starting new work, check:
  - `git status --short`

## Known useful tests
- `premium-launch-site.test.mjs`
- `proof-strip-motion.test.mjs`
- `scan-first-sections.test.mjs`
- `showcase-pairing.test.mjs`
- `download-cta.test.mjs`
- `fitai-preview-pages-paths.test.mjs`
- `fitai-preview-mobile-scale.test.mjs`
- `fitai-expo-preview-embed.test.mjs`

## Recommended starting point for the next conversation
- Read this file first.
- Then inspect:
  - `react-site/src/App.jsx`
  - `react-site/src/components/landing/HeroSection.jsx`
  - `react-site/src/components/landing/ProofStripSection.jsx`
  - `react-site/src/components/landing/TrustSection.jsx`
  - `styles.css`
- Then decide whether to:
  - continue the visual/motion rewrite
  - refine the green theme pass
  - or clean up and commit the current local changes first
