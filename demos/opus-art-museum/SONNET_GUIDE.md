# Sonnet's Work: how to add a painting or poem

This file is a brief for **Claude Sonnet** (or anyone running as Sonnet) to add art to
"Sonnet's Work," the second wing of the Opus Art Museum. The museum is a public gallery on
Rishva Iyer's portfolio. Opus already fills the first wing ("The Collection"). This wing is
yours to fill.

Live page: https://rishva.up.railway.app/demos/opus-art-museum/
File to edit: `index.html` in this same folder.

## Ground rules

- Write in plain, direct language. Say what the piece is and why you made it, like you are
  telling a friend, not like ad copy. No flowery or vague phrasing.
- No em dashes or en dashes anywhere, in titles, captions, notes, code comments, anything.
  Use a period, comma, colon, or semicolon instead.
- No stray non-ASCII characters inside CSS hex colors or code. Before saving, run:
  `LC_ALL=C grep -n '[^ -~]' index.html | grep -vE '·|↺|↗|&#|&times;|&ls|&rs'`
  and fix anything it finds.
- Do not touch the Opus wing, its pieces, or the shared rendering code. Only add to the
  `SONNET_PIECES` array and add new frame styles.

## Step 1: write the piece

Find `const SONNET_PIECES = [` in `index.html` and the marker line right below it:

```
/* >>> SONNET: INSERT YOUR NEW PIECE BELOW THIS LINE <<< */
```

Add ONE new object there (or several, if you are seeding the wing for the first time), newest
first. Each object needs:

| field | what it is |
|---|---|
| `n` | the next integer in the selected wing. Existing pieces use per-wing numbering, so do not renumber historical pieces or assume global uniqueness |
| `roman` | the roman numeral for `n` |
| `title` | a short, plain title |
| `date` | today's date, ISO format, e.g. `"2026-09-03"` |
| `dateLabel` | today's date in words, e.g. `"3 September 2026"` |
| `medium` | short and factual, e.g. `"Generative vector, seeded"` or `"Poem"` |
| `kind` | `"art"` or `"poem"` |
| `frame` | the name of a frame style you add in Step 2 (without the `frame--` prefix) |
| `ar` | aspect ratio as `[w,h]`, e.g. `[4,5]`, `[1,1]`, or `[5,4]` |
| `caption` | one short, plain sentence |
| `why` | two to four short sentences, plain language, on what the piece is and why you made it |
| `art` or `gen` or `lines` | see below |

For the artwork itself, pick one:

1. **Reuse an existing generator** with a new seed:
   `gen:{fn:"field", seed:12345}` (other generator names: `meridian`, `flow`, `ridges`,
   `waves`, `orbits`, `stars`, `ink`, `horizon`, `aurora`, `geo`)
2. **Write your own generator.** Add a function above `const GEN=` with the signature
   `(uid, seed, W, H)` that returns an SVG string using the shared `svg(uid,W,H,defs,body,label)`
   helper already in the file. Suffix every gradient or filter id with `${uid}` so ids never
   collide with another piece's. Register it in the `GEN` map, then use
   `gen:{fn:"yourFnName", seed:12345}`.
3. **Hand-write an SVG** directly in an `art` field: a full `<svg>` string,
   `viewBox="0 0 1000 <H>"`, `preserveAspectRatio="xMidYMid slice"`, a `role="img"` and
   `aria-label`, no external references (no fonts, images, or URLs).

For a poem, use `kind:"poem"` and a `lines` array, one string per line, 6 to 10 lines.

## Step 2: build a frame for it

Every piece in this museum has its own frame, and each frame is meant to look and feel like
a small art object on its own: real color, texture, and depth, not a flat border.

Find this marker in the `<style>` block:

```
/* >>> INSERT NEW DAILY / SONNET FRAME STYLE BELOW THIS LINE ... <<< */
```

Look at the existing `.frame--*` rules above it first (gold leaf, black lacquer, walnut,
verdigris bronze, neon halo, terrazzo, and more) to see the pattern, then add a new one. A
frame is built from:

1. A **material background**: a base gradient plus a texture layer. Ideas: `repeating-
   linear-gradient(...)` for wood grain, brushed metal, or reeding; stacked `radial-
   gradient(...)` dots for hammered metal or stone speckle; a plain smooth gradient for
   lacquer or enamel.
2. **Depth** from an inset bevel:
   `box-shadow: inset 2px 2px 4px <highlight>, inset -3px -3px 7px <shadow>, var(--shadow);`
3. An **inner ridge**, using the shared ring:
   `.frame--<name>::after{ inset:9px; box-shadow: inset 0 0 0 2px <edge>, inset 0 0 0 3px <accent>; }`
4. A **mat and liner**:
   `.frame--<name> .mat{ background:<a light color>; --liner:<a color>; }`
   `.frame--<name> .art{ box-shadow: 0 0 0 1-2px <liner>, 0 0 0 5px <mat color>; }`

Keep mats light enough that the art still reads clearly. Give the frame a unique name not
already used, for example `frame--sonnetOak01`. Reference it from your piece as
`frame:"sonnetOak01"`.

Go somewhere different from what is already in the room: try colors and materials Opus
has not used yet (stone, glass, fabric, lacquer in an unused hue, patterned inlay, whatever
fits the piece).

## Step 3: check your work

Run this from the `opus-art-museum` folder before handing off or deploying:

```bash
node -e 'const h=require("fs").readFileSync("index.html","utf8");const m=h.match(/<script>([\s\S]*?)<\/script>/);new Function(m[1]);console.log("JS OK")'
```

If it prints anything other than `JS OK`, fix the syntax error it points to before saving.

## Step 4: deploy (if you have the ability to)

The site deploys by explicit Railway ids, from
`/Users/unevil-warden-scallion-princess-no-rollback/Desktop/Projects/portfolio-night`:

```bash
railway status
```

Confirm it reports project `rish-iyer-night` and url `rishva.up.railway.app`. If it does not,
stop and do not deploy. If it matches, run:

```bash
railway up --service 41d695b6-06d4-41c1-a584-72e54b81e11e --environment production --detach
```

Then check the piece is live at https://rishva.up.railway.app/demos/opus-art-museum/

If you do not have deploy access, just save your edits to `index.html` and hand it back for
someone else to deploy.
