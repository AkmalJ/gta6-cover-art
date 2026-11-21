[![gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/AkmalJ/gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/AkmalJ/gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01)

# Vice Panels — multi-panel cover maker

Vice Panels turns a person's photo and a caption into cover art in the multi-panel poster style:
the photo is cut across diagonal panels, washed with a sunset or neon colour grade, and captioned
with heavy stretched lettering — then exported as a PNG ready to post. Everything is original
(own layouts, grades and lettering; no Rockstar Games logo, artwork or fonts) and everything runs
offline in a desktop browser from the static files in `app/` — photos never leave the machine.

## Features

- **Three multi-panel layouts** — Triptych (three diagonal-cut uprights), Hero + Strips (one big
  scene over two strips) and Quad (2×2 with diagonal offsets).
- **Up to four photos** — load your own, place a different photo in each panel or reuse one photo
  across panels with different crops; click a panel to place, drag to slide, zoom slider per panel.
- **Four colour grades** — Vice Sunset, Neon Nights, Golden Hour and Midnight Chrome, plus a
  vignette and a fine grain pass for a printed-poster feel.
- **Bold caption lettering** — a big condensed headline with a dark outline and hard shadow, and a
  letter-spaced subtitle above it; both editable live.
- **Post sizes in one click** — export PNG at 1080×1080, 1080×1350 or 1920×1080.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in a desktop browser. Add photos, click panels to place them,
pick a layout and grade, type your caption, and press **Export PNG**.

## Hand-in

`node main.ts` packages `app/` and `screenshots/` into the output directory with `dossier.json`
(it checks the screenshots exist and fit the size cap first). The screenshots show real exported
covers from this app plus the editor with sample photos loaded; the scenes are defined in
`shots.json` and staged by `app/src/shots.js`.

## v2

The fifth colour grade, Emerald Dusk, joins the original four. All screenshots were
re-captured inside the submission gate: at most 256 KiB each, long side at most 1280 px.

## License

MIT — see `LICENSE`. The sample photos in `app/samples/` were made for make.fun and are free to use.
