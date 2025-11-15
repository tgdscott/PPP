# Tablet Demo Access Guide

This `frontend` package powers the touch-friendly presentation deck that replaced the legacy auth workflow. Use the steps below to install dependencies, run the experience locally, and mirror it to an iPad for stakeholder demos.

## 1. Install dependencies

```bash
cd frontend
npm install
```

## 2. Start the demo locally

```bash
# run the Vite dev server with HMR
npm run dev

# or create a production build and preview it
npm run build
npm run preview
```

The dev server prints a `http://localhost:5173/` URL. Open it in any desktop browser to confirm the deck loads.

## 3. Mirror to an iPad

1. Restart the dev server with `npm run dev -- --host` so Vite listens on your LAN IP.
2. Ensure your iPad is on the same Wi-Fi network as the development machine.
3. On the iPad, open Safari and navigate to `http://<your-computer-ip>:5173/`.
4. Add the page to the Home Screen if you want it to feel like a native app.

No backend services are required for this walkthrough; everything is static client-side UI.

## Keyboard + Touch Tips

- Swipe horizontally or tap the "Next" and "Previous" buttons to move through the hero slides.
- Tap a workflow tile to reveal deeper talking points and stats.
- The "Launch Live Walkthrough" button at the bottom is a touch target you can use as the closing CTA during demos.
