Original prompt: i want users to be able to upload their own pictures

- Added upload + reset controls in the UI.
- Added image slicing to 3x3 tiles and swap-in for gameplay.
- Removed duplicate inline script and fixed leaked API key in script.js.
- Playwright test not run: Playwright package missing and install was not approved.
- Default image now loads randomly from the internet with local fallback.
- Removed hard-coded local image parts; fallback tiles are generated.
- Added move indicators for tiles that can slide, including direction arrows.
- Default image now preloads before start; start button disabled while loading.
- Removed move indicators as requested.
- Ensured tile and preview images cover their squares for any aspect ratio.
- Puzzle now resets whenever a new image is uploaded.
- Redesigned the input controls to be cleaner and responsive.
- Hide upload controls while the loading screen is visible.
- Styled the moves counter for clearer visibility.
- Added touch swipe support to move tiles on touch devices.
