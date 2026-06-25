# MARS Mk1 Clean Standalone Backup

This is a clean standalone MARS Mk1 React/Vite backup with Base44 removed.

## Run locally

```bash
npm install
npm run dev
```

## What changed

- Removed Base44 SDK and Base44 Vite plugin.
- Removed Base44 authentication wrapper.
- Kept the MARS control UI and showcase UI.
- Added localStorage message persistence for chat.
- Added local placeholder MARS replies until a real AI backend is connected.

## Next steps

1. Add your real MARS image at `public/images/mars-mk1.png` and update `HeroSection.jsx` if needed.
2. Connect a real AI backend.
3. Connect Android/S22 voice and camera features.
4. Add LEGO Robot Inventor bridge.
