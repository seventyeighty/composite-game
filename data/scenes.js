// Scenes for scene mode. The canvas is 800 x 600.
//
// Each scene has a secret (what the whole picture is) and eight slots, listed in priority order:
// the first slots are the ones every game uses, later ones are added as the room gets bigger.
//
// slot fields:
//   label   short name shown at the reveal
//   prompt  what the player is told to draw (one sentence; says what it is doing, not what it looks like)
//   kind    'scenery' is drawn in the first phase in small rooms, 'character' in the second
//   depth   stacking order, 0 at the back
//   guide   shape of the dotted guide: personR, personL, box, strip, full
//   rect    [x, y, width, height] of the guide

module.exports = [
  {
    id: 'kitchen',
    secret: 'A chef screaming at a waiter in a kitchen that is on fire',
    slots: [
      { label: 'The chef', prompt: 'A furious chef screaming at someone to the right', kind: 'character', depth: 4, guide: 'personR', rect: [110, 170, 200, 390] },
      { label: 'The waiter', prompt: 'A nervous waiter being yelled at, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [480, 210, 180, 350] },
      { label: 'The kitchen', prompt: 'A restaurant kitchen where something is very much on fire', kind: 'scenery', depth: 0, guide: 'full', rect: [0, 0, 800, 600] },
      { label: 'The problem', prompt: 'The thing the chef is angry about', kind: 'character', depth: 6, guide: 'box', rect: [335, 330, 130, 140] },
      { label: 'The counter', prompt: 'The worst dish this kitchen ever made, on a counter (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The window', prompt: 'Someone watching through a window who should not be there', kind: 'scenery', depth: 1, guide: 'box', rect: [570, 50, 200, 190] },
      { label: 'The ceiling', prompt: 'Something hanging from the ceiling that really should not be', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 0, 560, 110] },
      { label: 'The yelling', prompt: 'What the chef is yelling, in a speech bubble (symbols welcome)', kind: 'character', depth: 9, guide: 'box', rect: [250, 120, 230, 150] },
    ],
  },
  {
    id: 'beach',
    secret: 'A lifeguard rescuing a shark that cannot swim',
    slots: [
      { label: 'The lifeguard', prompt: 'A heroic lifeguard sprinting to the right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 180, 190, 370] },
      { label: 'The shark', prompt: 'A panicking shark that clearly cannot swim', kind: 'character', depth: 4, guide: 'box', rect: [430, 290, 310, 200] },
      { label: 'The beach', prompt: 'A beach on the hottest day ever recorded', kind: 'scenery', depth: 0, guide: 'full', rect: [0, 0, 800, 600] },
      { label: 'The sea', prompt: 'The sea, across the bottom of the picture (fill it in!)', kind: 'scenery', depth: 7, guide: 'strip', rect: [0, 450, 800, 150] },
      { label: 'The sky', prompt: 'Something in the sky that is not helping', kind: 'scenery', depth: 1, guide: 'box', rect: [520, 30, 240, 180] },
      { label: 'The sunbather', prompt: 'A sunbather who refuses to look up from their phone', kind: 'character', depth: 2, guide: 'box', rect: [280, 200, 150, 200] },
      { label: 'The float', prompt: "The world's least useful flotation device", kind: 'character', depth: 6, guide: 'box', rect: [290, 410, 130, 110] },
      { label: 'The sign', prompt: 'A warning sign for this beach', kind: 'scenery', depth: 9, guide: 'box', rect: [40, 30, 230, 140] },
    ],
  },
  {
    id: 'wedding',
    secret: 'A wedding where the cake has come alive',
    slots: [
      { label: 'The newlywed', prompt: 'A horrified newlywed, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 180, 190, 380] },
      { label: 'The cake', prompt: 'A wedding cake with arms and a bad attitude', kind: 'character', depth: 4, guide: 'box', rect: [310, 170, 220, 380] },
      { label: 'The venue', prompt: 'A very fancy wedding venue', kind: 'scenery', depth: 0, guide: 'full', rect: [0, 0, 800, 600] },
      { label: 'The guest', prompt: 'A guest filming everything on their phone, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [590, 220, 170, 330] },
      { label: 'The buffet', prompt: 'A table of wedding food that has been trampled (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 490, 800, 110] },
      { label: 'The decorations', prompt: 'Decorations hanging overhead, slightly on fire', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 0, 540, 110] },
      { label: 'The band', prompt: 'A band that has kept playing through all of this', kind: 'scenery', depth: 1, guide: 'box', rect: [570, 40, 200, 170] },
      { label: 'The shouting', prompt: 'What the cake is shouting, in a speech bubble', kind: 'character', depth: 9, guide: 'box', rect: [300, 30, 230, 130] },
    ],
  },
  {
    id: 'moon',
    secret: 'Astronauts discovering that the moon is made of cheese',
    slots: [
      { label: 'The hungry astronaut', prompt: 'An astronaut taking a big bite out of something, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [100, 180, 190, 370] },
      { label: 'The worried astronaut', prompt: 'A very worried astronaut, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [500, 190, 180, 360] },
      { label: 'Space', prompt: 'Outer space, as seen from the moon', kind: 'scenery', depth: 0, guide: 'full', rect: [0, 0, 800, 600] },
      { label: 'The ground', prompt: 'A ground made entirely of cheese (fill it in!)', kind: 'scenery', depth: 3, guide: 'strip', rect: [0, 440, 800, 160] },
      { label: 'Earth', prompt: 'Planet Earth, looking concerned', kind: 'scenery', depth: 1, guide: 'box', rect: [310, 40, 200, 180] },
      { label: 'The flag', prompt: 'A flag for a country that does not exist', kind: 'character', depth: 6, guide: 'box', rect: [330, 300, 140, 190] },
      { label: 'The ship', prompt: 'A spaceship that has been parked badly', kind: 'scenery', depth: 2, guide: 'box', rect: [590, 30, 180, 150] },
      { label: 'The local', prompt: 'A mouse in a tiny space suit', kind: 'character', depth: 9, guide: 'box', rect: [40, 40, 200, 130] },
    ],
  },
];
