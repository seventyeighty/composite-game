// Scenes for scene mode. The canvas is 800 x 600.
//
// Each scene has a secret (what the whole picture is), a page (the colored paper the game supplies,
// top and bottom colors), and eight slots listed in priority order: the first six are used in every
// game, the last two are added when there are more players.
//
// Nobody draws a full-page background. The setting is built from sticker slots (things in the scene)
// and strips (a ground behind the characters or a foreground in front of them).
//
// slot fields:
//   label   short name shown at the reveal
//   prompt  what the player is told to draw (one sentence, with something to invent)
//   kind    'scenery' is drawn in the first part in small rooms, 'character' in the second
//   depth   stacking order, 0 at the back
//   guide   shape of the dotted guide: personR, personL, box, strip
//   rect    [x, y, width, height] of the guide

module.exports = [
  {
    id: 'kitchen',
    secret: 'A chef screaming at a waiter in a kitchen that is on fire',
    page: ['#F6E3C6', '#E9C79C'],
    slots: [
      { label: 'The chef', prompt: 'A furious chef screaming at someone to the right', kind: 'character', depth: 5, guide: 'personR', rect: [110, 170, 200, 390] },
      { label: 'The waiter', prompt: 'A nervous waiter being yelled at, facing left', kind: 'character', depth: 6, guide: 'personL', rect: [480, 210, 180, 350] },
      { label: 'The oven', prompt: 'The oven, which is very much on fire', kind: 'scenery', depth: 2, guide: 'box', rect: [550, 40, 220, 240] },
      { label: 'The problem', prompt: 'The thing the chef is angry about', kind: 'character', depth: 7, guide: 'box', rect: [330, 330, 130, 140] },
      { label: 'The counter', prompt: 'A counter across the bottom with the worst dish this kitchen ever made on it (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The window', prompt: 'A window with someone watching through it who should not be there', kind: 'scenery', depth: 1, guide: 'box', rect: [30, 30, 230, 150] },
      { label: 'The ceiling', prompt: 'Something hanging from the ceiling that really should not be', kind: 'scenery', depth: 3, guide: 'box', rect: [300, 20, 200, 120] },
      { label: 'The yelling', prompt: 'What the chef is yelling, in a speech bubble (symbols welcome)', kind: 'character', depth: 9, guide: 'box', rect: [270, 150, 230, 140] },
    ],
  },
  {
    id: 'beach',
    secret: 'A lifeguard rescuing a shark that cannot swim',
    page: ['#A9DDF6', '#F4E2B6'],
    slots: [
      { label: 'The lifeguard', prompt: 'A heroic lifeguard sprinting to the right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 180, 190, 370] },
      { label: 'The shark', prompt: 'A panicking shark that clearly cannot swim', kind: 'character', depth: 4, guide: 'box', rect: [430, 290, 310, 200] },
      { label: 'The sea', prompt: 'The sea across the bottom of the picture, with something odd floating in it (fill it in!)', kind: 'scenery', depth: 7, guide: 'strip', rect: [0, 450, 800, 150] },
      { label: 'The sun', prompt: 'The sun, on the hottest day ever recorded', kind: 'scenery', depth: 1, guide: 'box', rect: [560, 30, 200, 170] },
      { label: 'The sunbather', prompt: 'A sunbather who refuses to look up from their phone', kind: 'character', depth: 3, guide: 'box', rect: [280, 200, 150, 200] },
      { label: 'The float', prompt: "The world's least useful flotation device", kind: 'character', depth: 8, guide: 'box', rect: [290, 410, 130, 110] },
      { label: 'The sign', prompt: 'A warning sign for this beach', kind: 'scenery', depth: 9, guide: 'box', rect: [40, 30, 230, 140] },
      { label: 'The seagull', prompt: 'A seagull who is enjoying this far too much', kind: 'character', depth: 2, guide: 'box', rect: [320, 40, 180, 120] },
    ],
  },
  {
    id: 'wedding',
    secret: 'A wedding where the cake has come alive',
    page: ['#F8E7EE', '#E8CCD8'],
    slots: [
      { label: 'The newlywed', prompt: 'A horrified newlywed, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 180, 190, 380] },
      { label: 'The cake', prompt: 'A wedding cake with arms and a bad attitude', kind: 'character', depth: 4, guide: 'box', rect: [310, 170, 220, 380] },
      { label: 'The guest', prompt: 'A guest filming everything on their phone, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [590, 220, 170, 330] },
      { label: 'The buffet', prompt: 'A buffet table across the bottom that has been trampled (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 490, 800, 110] },
      { label: 'The decorations', prompt: 'Decorations strung across the top, slightly on fire', kind: 'scenery', depth: 1, guide: 'strip', rect: [0, 0, 800, 90] },
      { label: 'The band', prompt: 'A band that has kept playing through all of this', kind: 'scenery', depth: 2, guide: 'box', rect: [560, 95, 210, 125] },
      { label: 'The shouting', prompt: 'What the cake is shouting, in a speech bubble', kind: 'character', depth: 9, guide: 'box', rect: [290, 40, 240, 120] },
      { label: 'The ring bearer', prompt: 'A tiny ring bearer who has seen everything', kind: 'character', depth: 6, guide: 'box', rect: [250, 400, 110, 150] },
    ],
  },
  {
    id: 'moon',
    secret: 'Astronauts discovering that the moon is made of cheese',
    page: ['#0E1433', '#24306A'],
    slots: [
      { label: 'The hungry astronaut', prompt: 'An astronaut taking a big bite out of something, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [100, 180, 190, 370] },
      { label: 'The worried astronaut', prompt: 'A very worried astronaut, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [500, 190, 180, 360] },
      { label: 'The ground', prompt: 'A ground made entirely of cheese (fill it in!)', kind: 'scenery', depth: 3, guide: 'strip', rect: [0, 440, 800, 160] },
      { label: 'Earth', prompt: 'Planet Earth, looking concerned', kind: 'scenery', depth: 1, guide: 'box', rect: [310, 40, 200, 180] },
      { label: 'The flag', prompt: 'A flag for a country that does not exist', kind: 'character', depth: 6, guide: 'box', rect: [330, 300, 140, 190] },
      { label: 'The ship', prompt: 'A spaceship that has been parked very badly', kind: 'scenery', depth: 2, guide: 'box', rect: [590, 30, 180, 150] },
      { label: 'The local', prompt: 'A mouse in a tiny space suit, very upset about all this', kind: 'character', depth: 9, guide: 'box', rect: [40, 40, 200, 130] },
      { label: 'The floater', prompt: 'Something floating in space that should not be there', kind: 'scenery', depth: 0, guide: 'box', rect: [20, 190, 150, 130] },
    ],
  },
];
