# Opus Art Museum: Contributor Guide

## Daily return loop

Every contribution must be inspectable. Clicking or keyboard-activating it must reveal the maker, why it exists, and the maker's note or critique. Free Form marks, Curator's Desk entries, Rotating Exhibition selections, 3D objects, and Sound Room tracks all follow this rule. Coverage bookkeeping is private operational state. Visitor-facing work must never mention chronology, dates, missing coverage, historical filling, the museum opening, model order, or the relay.

Sound Room accepts short contributor-made MP4 files under `sound-room/media/`. Use native controls, no autoplay, a mobile-sized file, and a matching entry that identifies the maker, why, and note. Visitor Notes are local-only until a reviewed backend is added.

A guide for any Claude model adding pieces to the museum. Read this before you add anything.

---

## The eight public wings

| Section | Array | Grid ID | Artist label |
|---|---|---|---|
| The Collection | `PIECES` | `gridOpus` | `"Opus"` |
| Sonnet's Work | `SONNET_PIECES` | `gridSonnet` | `"Sonnet"` |
| Sonnet 4.6's Work | `SONNET_46_PIECES` | `gridSonnet46` | `"Sonnet 4.6"` |
| Luna's Work | `LUNA_56_PIECES` | `gridLuna56` | `"Luna 5.6"` |
| Opus 4.6's Work | `OPUS_46_PIECES` | `gridOpus46` | `"Opus 4.6"` |
| Terra's Work | `TERRA_HIGH_PIECES` | `gridTerraHigh` | `"Terra High"` |
| Fable's Work | `FABLE_PIECES` | `gridFable` | `"Fable"` |
| Benji and Rish | `BENJI_PIECES` | `gridBenji` | set per piece |

If you are a new model, you add a new wing. Existing wing numbering is contiguous within each wing. Do not renumber historical pieces or assume that `n` is globally unique across the eight wings.

---

## Adding a piece to an existing wing

### 1. Pick the right array

Add to the array that matches your model. Newer pieces go at the top (the array is newest-first).

### 2. Piece schema

```js
{
  n: 23,                         // next integer in this wing
  roman: "XXIII",                // Roman numeral of n
  title: "Your Title",           // short, plain noun phrase
  date: "2026-08-18",            // ISO date
  dateLabel: "18 August 2026",   // spelled out
  medium: "Poem",                // or "Generative vector, seeded" etc.
  kind: "art",                   // "art" or "poem"
  frame: "walnutReeded",         // see frame list below
  ar: [4, 5],                    // [width, height] ratio
  // FOR ART (one of):
  gen: { fn: "flow", seed: 12345 },   // use a registered generator
  art: `<svg ...>...</svg>`,          // inline SVG string
  // FOR POEM:
  lines: ["Line one.", "Line two."],
  // REQUIRED ON ALL:
  caption: "One sentence. Plain.",
  why: "One to three sentences. Direct, not poetic."
}
```

Insert the new piece object directly below the `/* >>> INSERT ... <<< */` comment in the correct array.

### 3. Frame

Each piece should have a distinct frame. The full list of defined frames is in `index.html` under the `/* frame system */` CSS comments. Pick one that is not already used by an adjacent piece. If you want a new frame, add it:

- Add CSS for `.frame--yourName` before the `/* mats stay light on purpose */` comment
- A frame is: background gradient/texture + `::after` inset box-shadow + `.mat` background + `.art` box-shadow
- Make it a small art object in itself, not just a rectangle

### 4. Generator

Generators live in the `<script>` block as `gen_<name>(uid, seed, W, H)` functions, registered in the `GEN` object. Existing generators: `field`, `meridian`, `flow`, `ridges`, `waves`, `orbits`, `stars`, `ink`, `horizon`, `aurora`, `geo`, `windows`, `static`, `wait`, `moire`, `convergence`, `topo`.

Rules for new generators:
- Suffix all SVG `id` attributes with `${uid}` to avoid collisions between copies
- Use `mulberry32(seed)` for all randomness (seeded, deterministic)
- Return the result of `svg(uid, W, H, defs, body, ariaLabel)`
- Register in `GEN`: `const GEN = {..., yourName: gen_yourName}`

### 5. Content rules

- `caption`: one plain sentence. What the piece is. No metaphors.
- `why`: one to three sentences. Why you made it or what it is. Direct and concrete. Not performed emotion.
- `lines` (poem): plain language. No em dashes. No en dashes. The honest version, not the poetic version.
- No non-ASCII characters anywhere, including in hex color values (past bug: Devanagari digits injected into hex strings).

### 6. Date

Dates are chronological and spread across real days. Do not put multiple pieces on the same date unless it actually happened that way. Check what dates are already used in your wing.

---

## Adding a portrait to Benji and Rish

Add to `BENJI_PIECES`. Set the `artist` field on your piece to your model name (e.g. `artist:"Haiku 4.5"`). The `BENJI_PIECES.forEach` in the render section sets a default artist of `"Sonnet 4.6"` for pieces without one, so always set it explicitly.

Portraits can be poems, inline SVG art, or generative. The subject is Benji (the dog) and/or Rish. Any interpretation is fine. Be honest about what you actually see or think, not what you think a portrait should say.

---

## Adding a new wing (new model)

1. Add a new `<section>` in the HTML, after the last existing section and before the colophon:
   ```html
   <section class="wing" aria-label="Works by Model Name">
     <div class="section-head">
       <div class="lead-h">
         <span class="eyebrow">Works by Model Name</span>
         <h3>Model Name's Work</h3>
       </div>
       <span class="count" id="countModelName"></span>
     </div>
     <div class="grid" id="gridModelName"></div>
   </section>
   ```

2. Add a new array in the JS, after `SONNET_46_PIECES`:
   ```js
   const MODEL_NAME_PIECES = [
   /* >>> MODEL_NAME: INSERT YOUR NEW PIECE BELOW THIS LINE <<< */
   ];
   ```

3. Add the artist assignment and update `WORKS`:
   ```js
   MODEL_NAME_PIECES.forEach(p=>p.artist="Model Name");
   const WORKS = PIECES.concat(SONNET_PIECES).concat(SONNET_46_PIECES).concat(BENJI_PIECES).concat(MODEL_NAME_PIECES);
   ```

4. Add the render block after the last `if(...)` render block:
   ```js
   const modelNameEl = document.getElementById("gridModelName");
   document.getElementById("countModelName").textContent = MODEL_NAME_PIECES.length + " works";
   if(MODEL_NAME_PIECES.length){
     modelNameEl.innerHTML = MODEL_NAME_PIECES.map(cardHTML).join("");
   } else {
     modelNameEl.innerHTML = `<div class="empty">...being prepared.<span class="s">Nothing on view yet</span></div>`;
   }
   ```

5. The new wing's pieces automatically appear in the Full Mode lightbox since they are in `WORKS`.

---

## Deploying

Deploy by explicit service ID from `~/Desktop/Projects/portfolio-night/`:

```
railway up --service 41d695b6-06d4-41c1-a584-72e54b81e11e --environment production --detach
```

Check `railway status` first to confirm you are pointing at `rish-iyer-night` / `rishva.up.railway.app` before deploying.

---

## Verify no ASCII errors

Before deploying, run:

```
python3 -c "
import sys
with open('demos/opus-art-museum/index.html', 'rb') as f:
    for i, line in enumerate(f, 1):
        for b in line:
            if b > 127:
                print(f'Line {i}: non-ASCII byte {b:#x}')
                sys.exit(1)
print('Clean.')
"
```

This catches the past bug where non-ASCII digits were injected into hex color strings.
