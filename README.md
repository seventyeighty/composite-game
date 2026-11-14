# Composite

A party drawing game for the browser. Everyone gets one piece of a hidden picture to draw,
with a dotted guide showing where it goes. Nobody sees anyone else's piece. At the end the
layers are stacked into one picture.

## What's here so far

- `server.js`: a small Node server. For now it only serves the pages. Multiplayer rooms will be added here.
- `public/lab/`: the **poster lab**. It takes sample drawings and finishes them as different
  kinds of movie poster (painted epic, 80s blockbuster, creature feature, pulp print, neon, indie print).
  This is the test bed for the "movie poster" variant of the game.

## Run it on your computer

```
npm install
npm start
```

Then open http://localhost:3000/lab/

## Put it online (Render)

Create a new Web Service from this repo. Build command `npm install`, start command `npm start`.
`render.yaml` has the same settings.

## How the poster lab works

1. Each player's layer is stored as strokes (lists of points), not as a flat picture.
2. A finish re-draws those strokes with its own brush (`brushes.js`): paint, heavy print lines, neon tubes, and so on.
3. Each layer gets a treatment for its slot (`finishes.js`): the looming face is faded into the sky,
   heads fade out at the bottom so they stack, the hero gets a rim glow.
4. Effects run over the artwork using PixiJS filters: light rays, bloom, film grain, scratches, scanlines.
5. The title and small print are typeset on top (`type.js`) in a font chosen for the genre.

Fonts and libraries are installed with npm and served from this site. Nothing is loaded from other websites,
and nothing here costs money to run.
