---
name: stickman-comedy-studio
description: >-
  Create viral Rico-style hand-drawn 1080x1920 stickman comedy videos (MP4) for TikTok,
  Instagram Reels, and YouTube Shorts using the local Stickman Comedy Studio engine
  (promo-videos/stickman-studio/) with floor-locked 2-bone IK animation, single-room
  physical continuity, exaggerated cartoon payoffs, real downloaded comedy SFX/music,
  and subtle 4:1 Mama Dish marketing mix-ins. Use whenever the user asks to create a new
  stickman animation episode, add comedy SFX, remix audio, upgrade animation physics,
  or produce viral comedy marketing videos.
---

# Stickman Comedy Studio

Produce fluid, hand-drawn boiling-ink stickman comedy episodes (1080×1920 @ 24fps MP4) in `promo-videos/stickman-studio/`.

## Core Marketing & Comedy Strategy

- **4:1 Ratio (Pure Comedy → Subtle Shade):** Create **3–4 pure comedy episodes** (zero app mentions) for every **1 subtle Mama Dish mix-in episode**.
- **Organic Mix-In Rule:** On mix-in episodes, keep 90% pure comedy and show **Mama Dish** naturally in the character's hand for 2.5–3.8 seconds as the story's plot twist (`drawMamaDishPhone`). Never add pushy "Download now!" ad banners or sales voiceovers.
- **Universally Relatable Slapstick:** Base every episode on a universally lived kitchen, food, or everyday human trauma (e.g., 2 AM microwave, hot oil riot shield, ceiling pancake, couch "what should we eat?" skeletons, ice cream tub frozen stew + sewing kit cookie tin, wet sink food + 900 PSI spoon). Avoid AI-written stand-up dialogue jokes.

## The 5 Non-Negotiable Craft Laws

1. **One Continuous Connected World:** Every room prop (door, counter, fridge, stove, shelf, clock, window) stays anchored in the exact same coordinates from `0.0s` to `DUR`. Never teleport characters into blank white voids or unrelated clipart slides — every physical action must visibly cause the next.
2. **Floor-Locked 2-Bone IK Walking:** Always use `computeWalkCycle` + `floorY` from [sketchEngine.js](../../../promo-videos/stickman-studio/sketchEngine.js). Match walk distances to exact half/full stride multiples (`strideLen * 2`: `184px` tiptoe, `208px` walk, `300px` sprint) so planted feet never slide or float and both feet land flat when stopping.
3. **Smooth Continuous Interpolation:** Drive camera (`camX`, `camY`, `camZoom`), arms (`rElbow`, `rHand`, `lElbow`, `lHand`), `lean`, `squash`, and `headTilt` with cubic smoothstep keyframe tracks (`evalScalar` / `evalVec2`) — never abrupt pose teleports.
4. **Exaggerated, Non-Repetitive Payoffs:** Vary episode endings (mid-air spinning-wheel burnout + Mach-10 rocket launch via `drawExaggeratedRun`, anime rage table flip, soul floating out with angel halo, diving through a window leaving a stickman-shaped hole, etc.). Keep `dir = 1 | -1` and world-space viewport culling so `@resvg/resvg-js` never clips an empty off-screen opacity group (`geom.rs:27` panic).
5. **Fresh, Zero-Clash Audio Design:** Read [references/audio_library.md](./references/audio_library.md) before designing `AUDIO_PLAN`. Rotate across all 33+ SFX and 4 CC-BY music tracks (and download new scene-specific SFX from Myinstants when needed). Always mute background music cleanly (`muteWindows`) under punchlines, leave air between consecutive loud SFX, and **audition the mixed `.m4a` via `read_file`** before rendering the full MP4.

## Windows Rendering Rules (`@resvg/resvg-js`)

- Always pass explicit Windows font files with `loadSystemFonts: false` for fast ~60–90s renders:
  ```js
  const RESVG_FONT_OPTS = {
    fontFiles: [
      'C:\\Windows\\Fonts\\segoeuib.ttf',
      'C:\\Windows\\Fonts\\segoeui.ttf',
      'C:\\Windows\\Fonts\\georgia.ttf',
    ],
    loadSystemFonts: false,
    defaultFontFamily: 'Segoe UI',
  };
  ```
- Never use Unicode dingbats missing from `Segoe UI` (such as `★` or `✓`) — draw stars and checkmarks as vector SVG `<polygon>` / `<path>` elements.

## Step-by-Step Episode Production Workflow

1. **Design One Continuous Room & Beat Sheet:** Define world constants (`BACK_FLOOR_Y`, `FLOOR_Y`, prop coordinates) and a 28–32s beat sheet with physical cause-and-effect and a fresh ending gag.
2. **Author the Episode Script:** Create `promo-videos/stickman-studio/pure_ep<N>_<slug>.js` (or `ep<N>_<slug>.js` for a subtle mix-in). Guard `main()` with `if (require.main === module)` and export `{ renderFrame, FPS, TOTAL_FRAMES, AUDIO_PLAN, AUDIO_MIX, FINAL_MP4 }`.
3. **Run the 4-Second Fast Preview & Audio Audit (MANDATORY BEFORE FULL RENDER):**
   ```powershell
   node .agents/skills/stickman-comedy-studio/scripts/preview_episode.js promo-videos/stickman-studio/<file>.js
   ```
   - Visually inspect the generated 4×4 contact sheet JPEG via `read_file` (check hand-to-prop contacts, foreground/background layering, zero clipped text/bubbles, zero missing glyphs).
   - **Listen to the generated `.m4a` audio mix via `read_file`** to verify zero colliding SFX and zero cut-off meme voices.
   - Fix any visual or timing glitches before spending time on the full 700-frame render.
4. **Render Full 1080×1920 MP4 & Final Sanity Check:**
   ```powershell
   node promo-videos/stickman-studio/<file>.js
   ```
   - Extract an 8-frame contact sheet from the final encoded `.mp4` with `ffmpeg` and inspect via `read_file`.
   - For audio-only tweaks on an already rendered MP4, remix the `.m4a` and fast-mux in ~1 second using `ffmpeg -c:v copy -c:a copy`.
5. **Serve in the Click-Click Studio:** Ensure `promo-videos/stickman-studio/studio_server.js` is running on `http://localhost:3334` (`BypassSandbox: true`, `IsDaemon: true`) — new MP4s in `promo-videos/stickman-studio/out/` and new MP3s in `audio/sfx/` appear automatically on refresh.

