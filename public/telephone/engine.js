// Layer telephone: the rules, with no screen code, so the same engine can run on one device
// (pass and play) or on the server later.
//
// Every player starts a chain with one line. Each chain builds a diorama back to front, one layer
// at a time. Turns alternate: someone writes what the next layer should be (seeing the picture so far,
// never the earlier text), then someone else draws it (seeing the picture and that instruction).
// Everyone plays every turn, each on a different chain.

export const CANVAS = { w: 800, h: 600 };

// The layers each chain builds, back to front.
//   fixed: the game decides where it goes. place: the writer drags an outline into position.
const BACKDROP = { key: 'backdrop', name: 'the backdrop', guide: 'full', rect: [0, 0, 800, 600], depth: 0 };
const MIDGROUND = { key: 'mid', name: 'a layer across the middle', guide: 'strip', rect: [0, 230, 800, 240], depth: 2,
  ask: 'Something goes across the middle of this picture. What is it?', example: 'a row of very suspicious hedges' };
const CHARACTER = { key: 'char', name: 'a character', guide: 'personR', place: true, rect: [300, 170, 190, 370], depth: 5,
  ask: 'Someone is about to appear. Put them where you like, then say who they are.', example: 'someone praying to the giant eye' };
const SECOND = { key: 'char2', name: 'a character or a thing', guide: 'personL', place: true, choice: true, rect: [520, 220, 180, 330], depth: 6,
  ask: 'Something else joins the scene. Pick a person or a thing, place it, and say what it is.', example: 'the eye\'s lawyer' };
const FOREGROUND = { key: 'fore', name: 'a layer across the bottom', guide: 'strip', rect: [0, 460, 800, 140], depth: 8,
  ask: 'Something runs across the bottom, in front of everyone. What is it?', example: 'a moat full of soup' };
const OVERLAY = { key: 'overlay', name: 'something on top', guide: 'box', place: true, rect: [280, 40, 240, 140], depth: 10,
  ask: 'One last thing goes on top of everything. Place it and say what it is.', example: 'a speech bubble saying "not again"' };

export const LENGTHS = {
  full: [BACKDROP, MIDGROUND, CHARACTER, SECOND, FOREGROUND, OVERLAY],
  short: [BACKDROP, CHARACTER, FOREGROUND, OVERLAY],
};

export const IDEAS = [
  'a quiet campsite at night', 'a wedding on a boat', 'the first day at a new job', 'a picnic in the park',
  'a very important business meeting', 'a dentist appointment', 'the school play', 'a trip to the moon',
  'a cozy library', 'a birthday party at the zoo', 'a hairdresser on a busy day', 'a family photo',
  'the world\'s slowest race', 'a museum after closing time', 'a farmers market', 'grandma\'s kitchen',
  'a submarine tour', 'a talent show', 'the last day of summer', 'a haunted car wash',
];

export const PAGES = [
  ['#F6E3C6', '#E9C79C'], ['#A9DDF6', '#F4E2B6'], ['#F8E7EE', '#E8CCD8'], ['#DDF3EC', '#BFE3D6'],
  ['#E6EDF3', '#C8D5E1'], ['#FFF1C9', '#FFD39A'], ['#F3EEE4', '#E0D4BE'], ['#EAF1F4', '#CFDCE2'],
];

const mod = (a, n) => ((a % n) + n) % n;

export function createGame(players, length = 'full') {
  const layers = LENGTHS[length] || LENGTHS.full;
  const n = players.length;
  const shuffledPages = [...PAGES].sort(() => Math.random() - 0.5);
  return {
    players: [...players],
    layers,
    turns: layers.length * 2, // a write turn and a draw turn for every layer
    turn: 0,
    chains: players.map((starter, c) => ({
      starter,
      page: shuffledPages[c % shuffledPages.length],
      steps: layers.map((spec) => ({ spec, guide: spec.guide, rect: [...spec.rect], text: null, writer: null, png: null, drawer: null })),
    })),
    done: players.map(() => false), // who has finished the current turn
    n,
  };
}

// Which chain a player works on during a turn. Chain c is with player (c + turn) mod n.
export const chainFor = (game, playerIndex, turn = game.turn) => mod(playerIndex - turn, game.n);

export const isWriteTurn = (turn) => turn % 2 === 0;
export const layerOf = (turn) => Math.floor(turn / 2);

// Everything one player needs for their part of the current turn.
export function taskFor(game, playerIndex) {
  const t = game.turn;
  const c = chainFor(game, playerIndex);
  const chain = game.chains[c];
  const j = layerOf(t);
  const step = chain.steps[j];
  const below = chain.steps.slice(0, j).filter((s) => s.png); // layers already drawn, back to front
  const base = { chain: c, page: chain.page, layerIndex: j, layers: game.layers.length, turn: t, turns: game.turns, below };
  if (isWriteTurn(t)) {
    return { ...base, type: 'write', opening: j === 0, spec: step.spec, guide: step.guide, rect: step.rect };
  }
  // pieces that will be drawn in front of this one later and whose place is already known
  const ahead = chain.steps.slice(j + 1).filter((s) => !s.spec.place && s.spec.depth > step.spec.depth).map((s) => ({ rect: s.rect, front: true }));
  return { ...base, type: 'draw', spec: step.spec, guide: step.guide, rect: step.rect, instruction: step.text, writer: step.writer, ghosts: ahead };
}

export function submitWrite(game, playerIndex, { text, rect, guide }) {
  const c = chainFor(game, playerIndex);
  const step = game.chains[c].steps[layerOf(game.turn)];
  step.text = String(text || '').replace(/\s+/g, ' ').trim().slice(0, 90) || 'something nobody expected';
  step.writer = game.players[playerIndex];
  if (step.spec.place && Array.isArray(rect)) step.rect = rect.map((v) => Math.round(v));
  if (step.spec.place && ['personR', 'personL', 'box'].includes(guide)) step.guide = guide;
  game.done[playerIndex] = true;
}

export function submitDraw(game, playerIndex, { png }) {
  const c = chainFor(game, playerIndex);
  const step = game.chains[c].steps[layerOf(game.turn)];
  step.png = png || null; // blank hand-ins are left out of the picture
  step.drawer = game.players[playerIndex];
  game.done[playerIndex] = true;
}

export const turnComplete = (game) => game.done.every(Boolean);

// Moves to the next turn. Returns false when the game is over.
export function nextTurn(game) {
  game.turn += 1;
  game.done = game.players.map(() => false);
  return game.turn < game.turns;
}
