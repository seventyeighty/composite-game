# Composite

A party drawing game for the browser. Everyone gets one piece of a hidden picture to draw,
with a dotted guide showing where it goes. Nobody sees anyone else's piece. At the end the
layers are stacked into one picture.

## What's here so far

- **Scene mode**, playable with friends: make a room, share the link, draw, watch the reveal, guess the scene.
  - `server.js`: serves the pages and runs the rooms over WebSockets. Rooms live in memory, so they are lost if the server restarts.
  - `data/scenes.js`: the scenes. Each has a secret, a page color, and eight slots with a prompt, a guide shape and a stacking depth.
    Nobody draws a full-page background: the game supplies colored paper, and the setting is built from sticker slots
    and strips (a ground behind the characters, or a foreground in front of them).
  - `public/index.html` and `public/game/`: the game pages (lobby, drawing tools, reveal, guessing, gallery).
- **Poster lab** (`public/lab/`): finishes sample drawings as different kinds of movie poster.
  This is the test bed for the "movie poster" variant, which is not in the game yet.

### How a round works

1. The server picks a scene and deals each player one slot. Rooms with fewer than six players draw in
   more than one part, so every picture has at least six layers (scenery first, then characters).
2. Each player sees only their own prompt, a dotted guide, and striped areas where other pieces will go.
   Pale stripes are behind their piece, bold stripes will cover it.
3. Layers are revealed back to front, then everyone guesses the scene. Characters and objects are shown as
   die-cut stickers (paper border and shadow); strips get a shadow so they look like paper laid across the page.

## Run it on your computer

```
npm install
npm start
```

Then open http://localhost:3000 (the poster lab is at http://localhost:3000/lab/).
To try it alone, open the room link in two or three browser tabs: each tab is a separate player.

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
