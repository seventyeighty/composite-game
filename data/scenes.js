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
  {
    id: 'barber',
    secret: 'A barber giving someone a terrible haircut',
    page: ['#DDF3EC', '#BFE3D6'],
    slots: [
      { label: 'The barber', prompt: 'A barber who is far too confident, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [530, 170, 190, 390] },
      { label: 'The customer', prompt: 'Someone in a barber chair whose haircut is going very wrong', kind: 'character', depth: 4, guide: 'box', rect: [260, 180, 250, 320] },
      { label: 'The mirror', prompt: 'A mirror on the wall showing something it should not', kind: 'scenery', depth: 1, guide: 'box', rect: [40, 40, 220, 190] },
      { label: 'The floor', prompt: 'The floor across the bottom, covered in something that is not hair (fill it in!)', kind: 'scenery', depth: 3, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The tool', prompt: "The barber's most dangerous tool, in mid-air", kind: 'character', depth: 7, guide: 'box', rect: [420, 110, 150, 120] },
      { label: 'The waiting customer', prompt: 'Someone waiting their turn, terrified, facing right', kind: 'character', depth: 2, guide: 'personR', rect: [40, 250, 150, 300] },
      { label: 'The prices', prompt: 'A sign with the prices, which make no sense', kind: 'scenery', depth: 1, guide: 'box', rect: [300, 30, 190, 110] },
      { label: 'The pet', prompt: "The shop's pet, which is trying to help", kind: 'character', depth: 8, guide: 'box', rect: [180, 400, 150, 120] },
    ],
  },
  {
    id: 'interview',
    secret: 'A dog interviewing for a job at a bank',
    page: ['#E6EDF3', '#C8D5E1'],
    slots: [
      { label: 'The interviewer', prompt: 'A very serious interviewer, facing right', kind: 'character', depth: 4, guide: 'personR', rect: [90, 170, 190, 340] },
      { label: 'The candidate', prompt: 'A dog in a suit, trying very hard, facing left', kind: 'character', depth: 4, guide: 'personL', rect: [500, 180, 190, 330] },
      { label: 'The desk', prompt: "A desk across the bottom covered in the candidate's paperwork (fill it in!)", kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 420, 800, 180] },
      { label: 'The window', prompt: 'The view out of the office window, which is not great', kind: 'scenery', depth: 1, guide: 'box', rect: [300, 40, 220, 170] },
      { label: 'The award', prompt: 'An award on the wall that the company is far too proud of', kind: 'scenery', depth: 1, guide: 'box', rect: [40, 30, 200, 130] },
      { label: 'The resume', prompt: "The candidate's resume, held up so everyone can see it", kind: 'character', depth: 6, guide: 'box', rect: [330, 250, 140, 160] },
      { label: 'The mug', prompt: 'A coffee mug with a slogan on it', kind: 'character', depth: 9, guide: 'box', rect: [200, 340, 110, 100] },
      { label: 'The plant', prompt: 'An office plant that has given up', kind: 'scenery', depth: 2, guide: 'box', rect: [600, 30, 170, 150] },
    ],
  },
  {
    id: 'haunted',
    secret: 'A tour of a haunted house where the ghost is scared of the tourists',
    page: ['#3B2F4A', '#1E1828'],
    slots: [
      { label: 'The guide', prompt: 'A cheerful tour guide pointing to the right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 190, 180, 360] },
      { label: 'The ghost', prompt: 'A ghost who is absolutely terrified', kind: 'character', depth: 4, guide: 'box', rect: [460, 130, 260, 300] },
      { label: 'The tourist', prompt: 'A tourist taking a photo with the flash on, facing right', kind: 'character', depth: 6, guide: 'personR', rect: [260, 230, 150, 320] },
      { label: 'The portrait', prompt: 'A portrait on the wall whose eyes follow you', kind: 'scenery', depth: 1, guide: 'box', rect: [40, 30, 200, 170] },
      { label: 'The floor', prompt: 'Creaky floorboards across the bottom, with something poking through (fill it in!)', kind: 'scenery', depth: 3, guide: 'strip', rect: [0, 470, 800, 130] },
      { label: 'The chandelier', prompt: 'A chandelier that is about to fall', kind: 'scenery', depth: 2, guide: 'box', rect: [300, 10, 200, 130] },
      { label: 'The cat', prompt: 'A black cat that has seen enough', kind: 'character', depth: 8, guide: 'box', rect: [610, 420, 160, 120] },
      { label: 'The window', prompt: 'A window, with the weather outside doing its very best', kind: 'scenery', depth: 1, guide: 'box', rect: [580, 30, 190, 140] },
    ],
  },
  {
    id: 'driving',
    secret: 'A fish taking its driving test under the sea',
    page: ['#7FD3EE', '#1D6FA3'],
    slots: [
      { label: 'The car', prompt: 'A car that a fish could drive', kind: 'scenery', depth: 4, guide: 'box', rect: [200, 250, 380, 200] },
      { label: 'The fish', prompt: 'A very nervous fish behind the wheel', kind: 'character', depth: 5, guide: 'box', rect: [310, 170, 170, 150] },
      { label: 'The examiner', prompt: 'A crab driving examiner with a clipboard, looking left', kind: 'character', depth: 6, guide: 'box', rect: [600, 250, 180, 210] },
      { label: 'The seabed', prompt: 'The seabed across the bottom, with something lost in it (fill it in!)', kind: 'scenery', depth: 3, guide: 'strip', rect: [0, 470, 800, 130] },
      { label: 'The sign', prompt: 'A road sign that only makes sense underwater', kind: 'scenery', depth: 2, guide: 'box', rect: [40, 60, 170, 220] },
      { label: 'The traffic light', prompt: 'A jellyfish working as a traffic light', kind: 'character', depth: 2, guide: 'box', rect: [500, 30, 160, 170] },
      { label: 'The other driver', prompt: 'A shark in another car, honking', kind: 'character', depth: 7, guide: 'box', rect: [20, 310, 200, 140] },
      { label: 'The thought', prompt: 'Bubbles spelling out what the fish is thinking', kind: 'character', depth: 9, guide: 'box', rect: [290, 30, 180, 120] },
    ],
  },
  {
    id: 'laundromat',
    secret: 'A superhero doing their laundry',
    page: ['#EAF1F4', '#CFDCE2'],
    slots: [
      { label: 'The hero', prompt: 'A superhero folding laundry, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [90, 170, 200, 380] },
      { label: 'The machine', prompt: 'A washing machine that is clearly possessed', kind: 'scenery', depth: 3, guide: 'box', rect: [460, 200, 230, 260] },
      { label: 'The other customer', prompt: 'Someone waiting for their laundry, not impressed, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [600, 230, 160, 320] },
      { label: 'The floor', prompt: 'The laundromat floor across the bottom, covered in suds (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The basket', prompt: "The hero's laundry basket, full of embarrassing things", kind: 'character', depth: 7, guide: 'box', rect: [280, 380, 170, 140] },
      { label: 'The rules', prompt: 'A sign on the wall with the laundromat rules', kind: 'scenery', depth: 1, guide: 'box', rect: [40, 40, 210, 130] },
      { label: 'The cape', prompt: 'The cape, hung up to dry somewhere it should not be', kind: 'scenery', depth: 1, guide: 'box', rect: [300, 30, 200, 120] },
      { label: 'The sock', prompt: 'A sock that is making its escape', kind: 'character', depth: 8, guide: 'box', rect: [440, 470, 110, 100] },
    ],
  },
  {
    id: 'birthday',
    secret: "A dinosaur's birthday party",
    page: ['#FFF1C9', '#FFD39A'],
    slots: [
      { label: 'The dinosaur', prompt: 'A dinosaur with tiny arms, leaning in to the right', kind: 'character', depth: 4, guide: 'box', rect: [50, 120, 320, 400] },
      { label: 'The cake', prompt: 'A birthday cake with far too many candles', kind: 'character', depth: 5, guide: 'box', rect: [390, 300, 230, 200] },
      { label: 'The guest', prompt: 'A party guest in a party hat, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [620, 190, 160, 350] },
      { label: 'The table', prompt: 'A party table across the bottom, absolutely covered in snacks (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 480, 800, 120] },
      { label: 'The banner', prompt: 'A party banner strung across the top, with a message on it', kind: 'scenery', depth: 1, guide: 'strip', rect: [0, 0, 800, 90] },
      { label: 'The balloons', prompt: 'Balloons, one of which is up to something', kind: 'scenery', depth: 2, guide: 'box', rect: [420, 100, 180, 170] },
      { label: 'The present', prompt: 'A present that is moving on its own', kind: 'character', depth: 9, guide: 'box', rect: [250, 420, 140, 120] },
      { label: 'The window', prompt: 'A window, with a meteor heading this way', kind: 'scenery', depth: 1, guide: 'box', rect: [630, 95, 150, 90] },
    ],
  },
  {
    id: 'camping',
    secret: 'Campers telling ghost stories while a bear eats their marshmallows',
    page: ['#14233B', '#2C3E50'],
    slots: [
      { label: 'The storyteller', prompt: 'A camper telling the scariest story ever, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 210, 170, 340] },
      { label: 'The bear', prompt: 'A bear who has found the marshmallows', kind: 'character', depth: 4, guide: 'box', rect: [480, 170, 280, 330] },
      { label: 'The campfire', prompt: 'A campfire that is a little too big', kind: 'scenery', depth: 6, guide: 'box', rect: [290, 320, 180, 200] },
      { label: 'The ground', prompt: 'The forest floor across the bottom, with something hiding in it (fill it in!)', kind: 'scenery', depth: 3, guide: 'strip', rect: [0, 470, 800, 130] },
      { label: 'The tent', prompt: 'A tent that has seen better days', kind: 'scenery', depth: 2, guide: 'box', rect: [30, 60, 230, 150] },
      { label: 'The moon', prompt: 'The moon, watching all of this', kind: 'scenery', depth: 1, guide: 'box', rect: [320, 30, 170, 140] },
      { label: 'The scared camper', prompt: 'A second camper hiding inside a sleeping bag', kind: 'character', depth: 7, guide: 'box', rect: [200, 390, 150, 130] },
      { label: 'The owl', prompt: 'An owl in a tree, judging everyone', kind: 'character', depth: 2, guide: 'box', rect: [600, 30, 170, 130] },
    ],
  },
  {
    id: 'airport',
    secret: 'Airport security finding something ridiculous in a suitcase',
    page: ['#EEF0F2', '#D3D9DF'],
    slots: [
      { label: 'The officer', prompt: 'A security officer holding something up in shock, facing left', kind: 'character', depth: 5, guide: 'personL', rect: [530, 170, 190, 390] },
      { label: 'The traveler', prompt: 'A traveler pretending nothing is wrong, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [80, 190, 180, 360] },
      { label: 'The suitcase', prompt: 'An open suitcase that has clearly been overpacked', kind: 'scenery', depth: 6, guide: 'box', rect: [270, 310, 250, 160] },
      { label: 'The discovery', prompt: 'The ridiculous thing found in the suitcase', kind: 'character', depth: 7, guide: 'box', rect: [380, 140, 170, 150] },
      { label: 'The counter', prompt: 'The security counter across the bottom, with a conveyor belt (fill it in!)', kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 450, 800, 150] },
      { label: 'The board', prompt: 'A departures board where every flight is going somewhere strange', kind: 'scenery', depth: 1, guide: 'box', rect: [250, 20, 300, 110] },
      { label: 'The dog', prompt: 'A sniffer dog who has found something else entirely', kind: 'character', depth: 9, guide: 'box', rect: [40, 420, 180, 140] },
      { label: 'The plane', prompt: 'A plane outside the window, doing something it should not', kind: 'scenery', depth: 1, guide: 'box', rect: [590, 30, 180, 120] },
    ],
  },
  {
    id: 'museum',
    secret: 'A museum guard sleeping while a statue comes to life',
    page: ['#F3EEE4', '#E0D4BE'],
    slots: [
      { label: 'The guard', prompt: 'A museum guard, fast asleep in a chair', kind: 'character', depth: 5, guide: 'box', rect: [50, 260, 230, 260] },
      { label: 'The statue', prompt: 'A statue that has just come to life, sneaking off to the left', kind: 'character', depth: 5, guide: 'personL', rect: [480, 150, 200, 400] },
      { label: 'The plinth', prompt: 'The empty stand the statue was on, with its little name sign', kind: 'scenery', depth: 3, guide: 'box', rect: [310, 330, 150, 190] },
      { label: 'The painting', prompt: 'A very serious painting on the wall that has noticed', kind: 'scenery', depth: 1, guide: 'box', rect: [40, 40, 230, 180] },
      { label: 'The floor', prompt: 'The fancy museum floor across the bottom, with something spilled on it (fill it in!)', kind: 'scenery', depth: 2, guide: 'strip', rect: [0, 500, 800, 100] },
      { label: 'The rope', prompt: 'A velvet rope barrier that did not stop anyone', kind: 'scenery', depth: 7, guide: 'box', rect: [270, 430, 270, 110] },
      { label: 'The other painting', prompt: 'A painting of people who are watching this happen', kind: 'scenery', depth: 1, guide: 'box', rect: [300, 40, 220, 150] },
      { label: 'The camera', prompt: 'A security camera that has seen it all', kind: 'character', depth: 2, guide: 'box', rect: [640, 20, 140, 110] },
    ],
  },
  {
    id: 'pirates',
    secret: 'A pirate ship where the captain is a parrot',
    page: ['#A6D8F3', '#3F84B5'],
    slots: [
      { label: 'The captain', prompt: "A parrot in a captain's hat, giving orders", kind: 'character', depth: 6, guide: 'box', rect: [300, 120, 200, 220] },
      { label: 'The pirate', prompt: 'A pirate saluting a bird, facing right', kind: 'character', depth: 5, guide: 'personR', rect: [70, 200, 180, 350] },
      { label: 'The deck', prompt: "The ship's railing across the bottom, a bit worn out (fill it in!)", kind: 'scenery', depth: 8, guide: 'strip', rect: [0, 460, 800, 140] },
      { label: 'The sail', prompt: 'The sail, with a very strange flag on top', kind: 'scenery', depth: 2, guide: 'box', rect: [530, 20, 230, 290] },
      { label: 'The monster', prompt: 'A sea monster peeking over the side of the ship', kind: 'character', depth: 7, guide: 'box', rect: [560, 300, 220, 200] },
      { label: 'The treasure', prompt: 'A treasure chest that is a big disappointment', kind: 'character', depth: 9, guide: 'box', rect: [300, 370, 190, 140] },
      { label: 'The seagull', prompt: 'A seagull stealing something important', kind: 'character', depth: 1, guide: 'box', rect: [40, 30, 180, 120] },
      { label: 'The island', prompt: 'An island in the distance that looks suspicious', kind: 'scenery', depth: 1, guide: 'box', rect: [290, 10, 190, 100] },
    ],
  },
];
