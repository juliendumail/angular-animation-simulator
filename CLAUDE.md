# Angular Animation Simulator

## What this is
A single-page HTML tool for designers to visually configure Angular animations, preview them live, and copy-paste the generated `@angular/animations` code into Figma specs. Deployed on Vercel as a static site.

## Architecture
- **Single file**: `index.html` — everything is self-contained (CSS + HTML + vanilla JS, no dependencies)
- **No build step**: pure static HTML, deployed as-is on Vercel
- **URL state**: animation config is serialized as base64 JSON in the URL hash (`#...`) so links are shareable

## Key concepts
- **Two modes**: "Simple (A→B)" for basic transitions, "Keyframes (multi-step)" for multi-step animations
- **State object `S`**: holds all animation config (mode, from/to states, keyframe steps, timing, trigger name, etc.)
- **Code generation**: `generateSimpleCode()` and `generateKeyframesCode()` produce valid Angular `trigger()` code using `@angular/animations` API
- **Preview**: Simple mode uses CSS transitions with reflow trick (`void el.offsetWidth` + double `requestAnimationFrame`). Keyframes mode injects dynamic `@keyframes` CSS.
- **URL sync**: `encodeState()` / `decodeState()` serialize/restore state from URL hash, debounced on every change

## Code structure (inside the single HTML file)
1. **CSS** (~110 lines): dark theme, layout, slider styling, section colors (purple=timing, orange=from, green=to)
2. **HTML** (~120 lines): header with share button, left panel (controls), right panel (preview + code tabs)
3. **JS** (~500 lines):
   - State & presets definitions
   - `buildTransform()` / `styleProps()` helpers
   - Code generation (simple + keyframes)
   - DOM bindings: `bindSlider()` syncs range slider ↔ number input bidirectionally
   - `syncSlider()` / `syncTimingUI()` / `syncSimpleUI()` for preset application
   - Keyframes step management: `renderSteps()`, `makeStepSlider()`, `sortSteps()`
   - Preview playback with progress bar
   - URL state encoding/decoding

## Important patterns
- All sliders have a paired `<input type="number">` (id = sliderId + "Num") for precise manual entry
- Number inputs allow wider ranges than sliders (e.g., X: slider ±200, input ±500)
- Presets update state then call `syncTimingUI()` + `syncSimpleUI()` or `renderSteps()` to refresh UI
- `updateAll()` is the main refresh function (preview + code + URL hash)
- Angular code uses `:enter`/`:leave` or state-based transitions depending on checkbox

## Angular animations API reference
The tool generates code using: `trigger()`, `state()`, `style()`, `animate()`, `transition()`, `keyframes()` from `@angular/animations`.
