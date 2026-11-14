// Sample drawings for the poster lab. In the real game these come from players.
// Coordinates are in a 340 x 510 space. Each layer is one player's piece.
// item: { d: SVG path, stroke: outline colour, w: brush size, fill: fill colour, fa: fill opacity }

export const SRC_W = 340;
export const SRC_H = 510;

const circ = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0 Z`;
const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0 Z`;

const BONE = '#EDE6D6';
const DARK = '#1F2430';

const space = {
  id: 'space',
  name: 'Space adventure',
  title: 'Space Mop Squad',
  tagline: 'The galaxy needed heroes. It got these.',
  realTitle: 'The Janitors of Jupiter',
  layers: [
    {
      role: 'backdrop', label: 'Sky', artist: 'Ana',
      items: [
        { d: 'M24 150 v10 M19 155 h10 M300 60 v10 M295 65 h10 M312 200 v8 M308 204 h8 M150 36 v8 M146 40 h8 M40 250 v8 M36 254 h8 M296 270 v8 M292 274 h8 M110 300 v6 M107 303 h6', stroke: BONE, w: 2.5 },
        { d: 'M30 72 C28 52 44 40 60 42 C70 44 66 56 74 60 C84 62 86 74 82 84 C74 100 50 102 38 92 C32 86 30 80 30 72 Z', stroke: BONE, w: 2.5, fill: '#F5852A' },
        { d: 'M22 84 C40 96 76 82 92 62', stroke: BONE, w: 2.5 },
      ],
    },
    {
      role: 'looming', label: 'Villain', artist: 'Kit',
      items: [
        { d: 'M90 60 C120 22 240 22 270 60 C290 110 270 190 230 230 C200 250 160 250 130 230 C90 190 70 110 90 60 Z', stroke: '#E667AA', w: 4, fill: '#E667AA', fa: 0.22 },
        { d: 'M118 108 L166 128 L122 138 Z', fill: '#FFD23F' },
        { d: 'M242 108 L194 128 L238 138 Z', fill: '#FFD23F' },
        { d: 'M150 198 C170 188 190 188 210 198 M112 96 L168 112 M248 96 L192 112', stroke: '#E667AA', w: 4 },
      ],
    },
    {
      role: 'hero', label: 'Hero', artist: 'Sam',
      items: [
        { d: 'M172 272 L168 300 C140 306 120 322 112 356 L272 356 C268 326 250 308 222 300 L218 274 Z', stroke: BONE, w: 3.5, fill: '#3B82F6' },
        { d: 'M150 210 C148 170 172 150 198 152 C228 154 244 180 240 214 C238 226 246 232 248 238 C244 242 238 242 236 244 C234 262 222 276 202 278 C176 280 152 256 150 210 Z', stroke: BONE, w: 3.5, fill: '#F2C9A0' },
        { d: 'M148 206 C140 168 166 140 200 142 C226 144 244 160 244 186 C226 172 196 170 176 180 C164 188 156 198 148 206 Z', stroke: BONE, w: 3.5, fill: '#F5852A' },
        { d: 'M150 198 C180 184 214 182 242 192', stroke: '#E5484D', w: 7 },
        { d: 'M204 212 l18 -4', stroke: DARK, w: 4 },
        { d: 'M214 252 c8 2 14 0 18 -4', stroke: DARK, w: 3 },
        { d: 'M182 300 L196 318 L210 300', stroke: BONE, w: 3.5 },
        { d: circ(214, 221, 3.5), fill: DARK },
        { d: circ(235, 218, 2.5), fill: DARK },
      ],
    },
    {
      role: 'side', label: 'Sidekick', artist: 'Jo',
      items: [
        { d: 'M60 388 C44 396 36 410 34 432 L138 432 C134 408 124 396 108 390 Z', stroke: BONE, w: 3, fill: '#8B8F98' },
        { d: 'M54 352 C52 326 70 312 90 314 C112 316 124 334 120 356 C118 376 102 388 84 386 C74 386 64 380 58 372 C52 372 46 368 44 364 C48 360 54 358 54 352 Z', stroke: BONE, w: 3, fill: '#12A594' },
        { d: 'M92 314 l6 -18', stroke: BONE, w: 3 },
        { d: circ(99, 293, 4), stroke: BONE, w: 2, fill: '#FFD23F' },
        { d: circ(72, 346, 7), stroke: BONE, w: 2, fill: '#FFFFFF' },
        { d: circ(94, 346, 8), stroke: BONE, w: 2, fill: '#FFFFFF' },
        { d: 'M62 370 c6 -4 10 4 16 0', stroke: DARK, w: 2.5 },
        { d: circ(69, 347, 2.5), fill: DARK },
        { d: circ(91, 347, 2.5), fill: DARK },
      ],
    },
    {
      role: 'object', label: 'Ship', artist: 'Lee',
      items: [
        { d: 'M240 352 C214 374 184 394 152 412', stroke: '#F5852A', w: 9 },
        { d: 'M238 350 C214 370 188 388 160 404', stroke: '#FFD23F', w: 3.5 },
        { d: 'M232 346 L290 302 L280 336 L262 354 Z', stroke: DARK, w: 2.5, fill: BONE },
        { d: circ(266, 330, 5), stroke: DARK, w: 2, fill: '#6FA8FF' },
        { d: 'M244 338 l10 8 M254 336 l-10 12', stroke: '#8D5A3B', w: 3 },
      ],
    },
  ],
};

const laundromat = {
  id: 'laundromat',
  name: 'Laundromat horror',
  title: 'Spin Cycle of Doom',
  tagline: 'It only wanted clean socks.',
  realTitle: 'The Thing in the Laundromat',
  layers: [
    {
      role: 'backdrop', label: 'Sets', artist: 'Ana',
      items: [
        { d: 'M8 404 C100 400 240 406 332 402', stroke: BONE, w: 3 },
        { d: 'M22 314 C50 310 84 312 108 314 L110 402 L20 403 Z', stroke: BONE, w: 3, fill: '#4A5568' },
        { d: circ(65, 362, 26), stroke: BONE, w: 3, fill: '#22303F' },
        { d: 'M30 326 h20 M60 326 h8', stroke: BONE, w: 3 },
        { d: 'M126 312 C154 316 188 310 212 313 L214 402 L124 403 Z', stroke: BONE, w: 3, fill: '#4A5568' },
        { d: circ(169, 360, 27), stroke: BONE, w: 3, fill: '#22303F' },
        { d: 'M230 315 C258 311 292 314 318 312 L320 402 L228 403 Z', stroke: BONE, w: 3, fill: '#4A5568' },
        { d: circ(274, 361, 26), stroke: BONE, w: 3, fill: '#22303F' },
        { d: 'M238 326 h20 M268 326 h8', stroke: BONE, w: 3 },
        { d: 'M52 232 L52 262', stroke: BONE, w: 3 },
        { d: 'M36 264 C44 256 60 256 68 264 Z', stroke: BONE, w: 3, fill: '#FFD23F' },
        { d: 'M40 274 l-8 14 M52 276 v16 M64 274 l8 14', stroke: '#FFD23F', w: 3 },
      ],
    },
    {
      role: 'looming', label: 'Creature', artist: 'Kit',
      items: [
        { d: 'M34 258 C14 192 36 100 104 78 C146 48 212 50 252 82 C312 114 326 198 304 262 Z', stroke: '#9BD66B', w: 4, fill: '#9BD66B', fa: 0.25 },
        { d: 'M34 258 C22 284 30 308 48 318 M304 262 C318 284 312 310 296 322', stroke: '#9BD66B', w: 4 },
        { d: 'M96 82 l-8 -16 M130 62 l-2 -18 M170 54 l2 -18 M212 62 l8 -16 M248 80 l12 -12', stroke: '#9BD66B', w: 4 },
        { d: 'M104 200 L124 222 L144 200 L164 224 L186 200 L208 222 L232 198', stroke: '#9BD66B', w: 4 },
        { d: circ(122, 140, 20), fill: '#FFD23F' },
        { d: circ(216, 134, 26), fill: '#FFD23F' },
        { d: circ(126, 146, 7), fill: '#14181F' },
        { d: circ(210, 142, 9), fill: '#14181F' },
      ],
    },
    {
      role: 'hero', label: 'Star', artist: 'Jo',
      items: [
        { d: 'M112 372 C112 332 136 312 170 312 C206 312 230 332 230 372 Z', stroke: BONE, w: 3.5, fill: '#6FA8FF' },
        { d: 'M142 268 C140 240 156 226 172 228 C192 228 204 246 200 270 C198 292 184 304 170 304 C154 304 144 290 142 268 Z', stroke: BONE, w: 3.5, fill: '#F2C9A0' },
        { d: 'M144 254 C150 232 170 222 198 250', stroke: BONE, w: 3.5 },
        { d: circ(160, 262, 6), stroke: BONE, w: 2, fill: '#FFFFFF' },
        { d: circ(184, 262, 6), stroke: BONE, w: 2, fill: '#FFFFFF' },
        { d: circ(160, 263, 2), fill: DARK },
        { d: circ(184, 263, 2), fill: DARK },
        { d: ell(172, 286, 6, 8), stroke: BONE, w: 2, fill: '#14181F' },
        { d: 'M124 340 L220 338 L212 384 L132 386 Z', stroke: BONE, w: 3.5, fill: '#8D5A3B' },
        { d: 'M128 352 h88 M140 340 l4 44 M172 339 v46 M204 339 l-4 45', stroke: BONE, w: 2.5 },
        { d: 'M150 338 c-2 -14 10 -18 14 -8', stroke: '#E5484D', w: 3.5 },
      ],
    },
  ],
};

export const SAMPLES = [space, laundromat];
