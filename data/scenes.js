// Scenes for scene mode. The canvas is 800 x 600.
//
// Every scene is a diorama: flat paper planes at different depths, like a paper theater, on plain paper.
// Nobody draws a full-page background; the setting comes from the strips.
//   midground   a strip across the middle that characters stand in front of (depth 1-2)
//   characters  stickers in the middle depths (3-7)
//   foreground  a strip across the bottom that covers the characters' feet (depth 8)
//   overlay     something on top of everything: a speech bubble, a bird, weather (depth 9-10)
// Layouts are built so pieces overlap: something should always be in front of something else.
//
// Slots are listed in priority order. The first six are used in every game, the last two are
// added when there are more players.
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
    slots: [
      { label: 'The chef', prompt: 'A furious chef screaming at someone to the right', kind: 'character', depth: 5, guide: 'personR', rect: [110, 170, 200, 390] },
      { label: 'The waiter', prompt: 'A nervous waiter being yelled at, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [480, 210, 180, 350] },
      { label: 'The shelves', prompt: 'Shelves across the middle, packed with things that should not be in a kitchen (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 170, 800, 200] },
      { label: 'The counter', prompt: 'A counter across the bottom with the worst dish this kitchen ever made on it (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The problem', prompt: 'The thing the chef is angry about', kind: 'character', depth: 6, guide: 'box', rect: [330, 330, 130, 140] },
      { label: 'The yelling', prompt: 'What the chef is yelling, in a speech bubble (symbols welcome)', kind: 'character', depth: 9, guide: 'box', rect: [250, 50, 240, 130] },
      { label: 'The hatch', prompt: 'Someone watching through the serving hatch who should not be there', kind: 'scenery', depth: 3, guide: 'box', rect: [570, 40, 200, 150] },
    ],
  },
  {
    id: 'beach',
    secret: 'A lifeguard rescuing a shark that cannot swim',
    slots: [
      { label: 'The lifeguard', prompt: 'A heroic lifeguard sprinting to the right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 180, 190, 370] },
      { label: 'The shark', prompt: 'A panicking shark that clearly cannot swim', kind: 'character', depth: 4, guide: 'box', rect: [430, 250, 310, 220] },
      { label: 'The dunes', prompt: 'The beach and sand dunes across the middle, with something buried in them (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 250, 800, 200] },
      { label: 'The sea', prompt: 'The sea across the bottom, with big waves (fill it in!)', kind: 'scenery', depth: 7, guide: 'strip', rect: [0, 410, 800, 190] },
      { label: 'The float', prompt: "The world's least useful flotation device", kind: 'character', depth: 8, guide: 'box', rect: [290, 380, 140, 110] },
      { label: 'The seagull', prompt: 'A seagull who is enjoying this far too much', kind: 'character', depth: 9, guide: 'box', rect: [320, 40, 180, 120] },
      { label: 'The sign', prompt: 'A warning sign for this beach', kind: 'scenery', depth: 3, guide: 'box', rect: [40, 40, 220, 140] },
    ],
  },
  {
    id: 'wedding',
    secret: 'A wedding where the cake has come alive',
    slots: [
      { label: 'The newlywed', prompt: 'A horrified newlywed, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 180, 190, 380] },
      { label: 'The cake', prompt: 'A wedding cake with arms and a bad attitude', kind: 'character', depth: 4, guide: 'box', rect: [310, 170, 220, 380] },
      { label: 'The guests', prompt: 'Tables of guests across the middle, all frozen in shock (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 260, 800, 170] },
      { label: 'The buffet', prompt: 'A buffet table across the bottom that has been trampled (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 490, 800, 110] },
      { label: 'The filming guest', prompt: 'A guest filming everything on their phone, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [590, 220, 170, 330] },
      { label: 'The shouting', prompt: 'What the cake is shouting, in a speech bubble', kind: 'character', depth: 9, guide: 'box', rect: [290, 40, 240, 120] },
      { label: 'The decorations', prompt: 'Decorations strung across the top, slightly on fire', kind: 'scenery', depth: 3, guide: 'strip', rect: [0, 0, 800, 90] },
    ],
  },
  {
    id: 'moon',
    secret: 'Astronauts discovering that the moon is made of cheese',
    slots: [
      { label: 'The hungry astronaut', prompt: 'An astronaut taking a big bite out of something, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [100, 180, 190, 370] },
      { label: 'The worried astronaut', prompt: 'A very worried astronaut, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [500, 190, 180, 360] },
      { label: 'The mountains', prompt: 'Cheese mountains across the middle (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 250, 800, 200] },
      { label: 'The ground', prompt: 'The cheese ground across the bottom, with a big bite taken out of it (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 470, 800, 130] },
      { label: 'The flag', prompt: 'A flag for a country that does not exist', kind: 'character', depth: 6, guide: 'box', rect: [330, 300, 140, 190] },
      { label: 'The local', prompt: 'A mouse in a tiny space suit, very upset about all this', kind: 'character', depth: 9, guide: 'box', rect: [40, 40, 200, 130] },
      { label: 'The ship', prompt: 'A spaceship that has been parked very badly', kind: 'scenery', depth: 3, guide: 'box', rect: [590, 30, 180, 150] },
    ],
  },
  {
    id: 'barber',
    secret: 'A barber giving someone a terrible haircut',
    slots: [
      { label: 'The barber', prompt: 'A barber who is far too confident, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [530, 170, 190, 390] },
      { label: 'The customer', prompt: 'Someone in a barber chair whose haircut is going very wrong', kind: 'character', depth: 4, guide: 'box', rect: [260, 180, 250, 320] },
      { label: 'The mirror', prompt: 'A long mirror across the middle, reflecting something it should not (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 140, 800, 180] },
      { label: 'The floor', prompt: 'The floor across the bottom, covered in something that is not hair (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 490, 800, 110] },
      { label: 'The tool', prompt: "The barber's most dangerous tool, in mid-air", kind: 'character', depth: 7, guide: 'box', rect: [420, 110, 150, 120] },
      { label: 'The pet', prompt: "The shop's pet, which is trying to help", kind: 'character', depth: 9, guide: 'box', rect: [180, 430, 150, 120] },
      { label: 'The waiting customer', prompt: 'Someone waiting their turn, terrified, facing right', kind: 'character', depth: 3, guide: 'personR', rect: [40, 250, 150, 300] },
    ],
  },
  {
    id: 'interview',
    secret: 'A dog interviewing for a job at a bank',
    slots: [
      { label: 'The interviewer', prompt: 'A very serious interviewer, facing right', kind: 'character', depth: 4, guide: 'personR', rect: [90, 170, 190, 340] },
      { label: 'The candidate', prompt: 'A dog in a suit, trying very hard, facing left', kind: 'character', depth: 4, guide: 'personL', rect: [500, 180, 190, 330] },
      { label: 'The window', prompt: 'A big window across the middle, with a city outside that is not doing well (fill it in!)', kind: 'scenery', depth: 1, guide: 'strip', rect: [0, 110, 800, 210] },
      { label: 'The desk', prompt: "A desk across the bottom covered in the candidate's paperwork (fill it in!)", kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 420, 800, 180] },
      { label: 'The resume', prompt: "The candidate's resume, held up so everyone can see it", kind: 'character', depth: 6, guide: 'box', rect: [330, 250, 140, 160] },
      { label: 'The mug', prompt: 'A coffee mug on the desk with a slogan on it', kind: 'character', depth: 9, guide: 'box', rect: [200, 380, 110, 100] },
      { label: 'The plant', prompt: 'An office plant that has given up', kind: 'scenery', depth: 3, guide: 'box', rect: [620, 230, 150, 190] },
    ],
  },
  {
    id: 'haunted',
    secret: 'A tour of a haunted house where the ghost is scared of the tourists',
    slots: [
      { label: 'The guide', prompt: 'A cheerful tour guide pointing to the right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 190, 180, 360] },
      { label: 'The ghost', prompt: 'A ghost who is absolutely terrified', kind: 'character', depth: 4, guide: 'box', rect: [460, 130, 260, 300] },
      { label: 'The furniture', prompt: 'Old furniture across the middle, covered in dusty sheets (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 280, 800, 190] },
      { label: 'The floor', prompt: 'Creaky floorboards across the bottom, with something poking through (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The tourist', prompt: 'A tourist taking a photo with the flash on, facing right', kind: 'character', depth: 6, guide: 'personR', rect: [260, 230, 150, 320] },
      { label: 'The chandelier', prompt: 'A chandelier that is about to fall', kind: 'scenery', depth: 9, guide: 'box', rect: [300, 10, 200, 130] },
      { label: 'The cat', prompt: 'A black cat that has seen enough', kind: 'character', depth: 7, guide: 'box', rect: [610, 410, 160, 120] },
    ],
  },
  {
    id: 'driving',
    secret: 'A fish taking its driving test under the sea',
    slots: [
      { label: 'The fish', prompt: 'A very nervous fish behind the wheel', kind: 'character', depth: 5, guide: 'box', rect: [310, 170, 170, 150] },
      { label: 'The examiner', prompt: 'A crab driving examiner with a clipboard, looking left', kind: 'character', depth: 6, guide: 'box', rect: [600, 250, 180, 210] },
      { label: 'The reef', prompt: 'Coral and seaweed across the middle (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 260, 800, 200] },
      { label: 'The seabed', prompt: 'The seabed across the bottom, with something lost in it (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 470, 800, 130] },
      { label: 'The car', prompt: 'A car that a fish could drive', kind: 'scenery', depth: 4, guide: 'box', rect: [200, 250, 380, 200] },
      { label: 'The thought', prompt: 'Bubbles spelling out what the fish is thinking', kind: 'character', depth: 9, guide: 'box', rect: [290, 30, 180, 120] },
      { label: 'The traffic light', prompt: 'A jellyfish working as a traffic light', kind: 'character', depth: 3, guide: 'box', rect: [500, 30, 160, 170] },
    ],
  },
  {
    id: 'laundromat',
    secret: 'A superhero doing their laundry',
    slots: [
      { label: 'The hero', prompt: 'A superhero folding laundry, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [90, 170, 200, 380] },
      { label: 'The other customer', prompt: 'Someone waiting for their laundry, not impressed, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [600, 230, 160, 320] },
      { label: 'The machines', prompt: 'A row of washing machines across the middle, one of them clearly possessed (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 200, 800, 260] },
      { label: 'The floor', prompt: 'The floor across the bottom, covered in suds (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 490, 800, 110] },
      { label: 'The basket', prompt: "The hero's laundry basket, full of embarrassing things", kind: 'character', depth: 6, guide: 'box', rect: [280, 380, 170, 140] },
      { label: 'The sock', prompt: 'A sock that is making its escape', kind: 'character', depth: 9, guide: 'box', rect: [440, 470, 110, 100] },
      { label: 'The cape', prompt: 'The cape, hung up to dry somewhere it should not be', kind: 'scenery', depth: 3, guide: 'box', rect: [300, 30, 200, 120] },
    ],
  },
  {
    id: 'birthday',
    secret: "A dinosaur's birthday party",
    slots: [
      { label: 'The dinosaur', prompt: 'A dinosaur with tiny arms, leaning in to the right', kind: 'character', depth: 4, guide: 'box', rect: [50, 120, 320, 400] },
      { label: 'The cake', prompt: 'A birthday cake with far too many candles', kind: 'character', depth: 5, guide: 'box', rect: [390, 300, 230, 200] },
      { label: 'The presents', prompt: 'A pile of presents and balloons across the middle, one of them up to something (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 230, 800, 200] },
      { label: 'The table', prompt: 'A party table across the bottom, absolutely covered in snacks (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The guest', prompt: 'A party guest in a party hat, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [620, 190, 160, 350] },
      { label: 'The banner', prompt: 'A party banner strung across the top, with a message on it', kind: 'scenery', depth: 9, guide: 'strip', rect: [0, 0, 800, 90] },
      { label: 'The present', prompt: 'A present on the table that is moving on its own', kind: 'character', depth: 9, guide: 'box', rect: [250, 420, 140, 120] },
    ],
  },
  {
    id: 'camping',
    secret: 'Campers telling ghost stories while a bear eats their marshmallows',
    slots: [
      { label: 'The storyteller', prompt: 'A camper telling the scariest story ever, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 210, 170, 340] },
      { label: 'The bear', prompt: 'A bear who has found the marshmallows', kind: 'character', depth: 4, guide: 'box', rect: [480, 170, 280, 330] },
      { label: 'The mountains', prompt: 'Mountains and trees across the middle (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 220, 800, 260] },
      { label: 'The bushes', prompt: 'Bushes across the bottom, with something hiding in them (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 460, 800, 140] },
      { label: 'The campfire', prompt: 'A campfire that is a little too big (the bushes will cover the bottom of it)', kind: 'scenery', depth: 7, guide: 'box', rect: [300, 320, 180, 200] },
      { label: 'The story', prompt: 'What the storyteller is saying, in a speech bubble', kind: 'character', depth: 10, guide: 'box', rect: [240, 250, 240, 110] },
      { label: 'The owl', prompt: 'An owl in a tree, judging everyone', kind: 'character', depth: 3, guide: 'box', rect: [600, 30, 170, 130] },
    ],
  },
  {
    id: 'airport',
    secret: 'Airport security finding something ridiculous in a suitcase',
    slots: [
      { label: 'The officer', prompt: 'A security officer holding something up in shock, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [530, 170, 190, 390] },
      { label: 'The traveler', prompt: 'A traveler pretending nothing is wrong, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [80, 190, 180, 360] },
      { label: 'The windows', prompt: 'Big windows across the middle, with a plane outside doing something it should not (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 120, 800, 220] },
      { label: 'The counter', prompt: 'The security counter across the bottom, with a conveyor belt (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 450, 800, 150] },
      { label: 'The discovery', prompt: 'The ridiculous thing found in the suitcase', kind: 'character', depth: 7, guide: 'box', rect: [380, 140, 170, 150] },
      { label: 'The dog', prompt: 'A sniffer dog who has found something else entirely', kind: 'character', depth: 9, guide: 'box', rect: [40, 420, 180, 140] },
      { label: 'The suitcase', prompt: 'An open suitcase that has clearly been overpacked', kind: 'scenery', depth: 6, guide: 'box', rect: [270, 310, 250, 160] },
    ],
  },
  {
    id: 'museum',
    secret: 'A museum guard sleeping while a statue comes to life',
    slots: [
      { label: 'The guard', prompt: 'A museum guard, fast asleep in a chair', kind: 'character', depth: 5, guide: 'box', rect: [50, 260, 230, 260] },
      { label: 'The statue', prompt: 'A statue that has just come to life, sneaking off to the left', kind: 'character', depth: 5, guide: 'personL', rect: [480, 150, 200, 400] },
      { label: 'The exhibits', prompt: 'A row of other exhibits across the middle, all watching this happen (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 180, 800, 250] },
      { label: 'The floor', prompt: 'The fancy floor across the bottom, with a velvet rope that stopped no one (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The plinth', prompt: 'The empty stand the statue was on, with its little name sign', kind: 'scenery', depth: 4, guide: 'box', rect: [310, 330, 150, 190] },
      { label: 'The camera', prompt: 'A security camera that has seen it all', kind: 'character', depth: 9, guide: 'box', rect: [640, 20, 140, 110] },
      { label: 'The loot', prompt: 'Something the statue has stolen on its way out', kind: 'character', depth: 7, guide: 'box', rect: [360, 170, 140, 120] },
    ],
  },
  {
    id: 'pirates',
    secret: 'A pirate ship where the captain is a parrot',
    slots: [
      { label: 'The captain', prompt: "A parrot in a captain's hat, giving orders", kind: 'character', depth: 6, guide: 'box', rect: [300, 120, 200, 220] },
      { label: 'The pirate', prompt: 'A pirate saluting a bird, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 200, 180, 350] },
      { label: 'The deck', prompt: "The ship's deck and cabin across the middle, with a very strange flag (fill it in!)", kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 230, 800, 240] },
      { label: 'The railing', prompt: "The ship's railing across the bottom, a bit worn out (fill it in!)", kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 460, 800, 140] },
      { label: 'The monster', prompt: 'A sea monster climbing up the side of the ship', kind: 'character', depth: 7, guide: 'box', rect: [560, 300, 220, 200] },
      { label: 'The seagull', prompt: 'A seagull stealing something important', kind: 'character', depth: 9, guide: 'box', rect: [40, 30, 180, 120] },
      { label: 'The treasure', prompt: 'A treasure chest that is a big disappointment', kind: 'character', depth: 9, guide: 'box', rect: [300, 380, 190, 140] },
    ],
  },
];
