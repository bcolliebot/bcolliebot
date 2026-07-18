const GIRL_NAMES = [
  'Emma',
  'Ruby',
  'Layla',
  'Lucy',
  'Sadie',
  'Willow',
  'Bonnie',
  'Piper',
  'Nova',
  'Evie',
  'Luna',
  'Hazel',
  'Rosie',
  'Millie',
  'Bella',
  'Daisy',
  'Cleo',
  'Maisie',
  'Phoebe',
  'Josie',
  'Mabel',
  'Matilda',
  'Athena',
  'Leia',
  'Xena',
  'Maple',
  'Pepper',
  'Mochi',
  'Biscuit',
  'Clementine',
];

const BOY_NAMES = [
  'Max',
  'Oliver',
  'Jack',
  'Buddy',
  'Jasper',
  'Winston',
  'Tucker',
  'Murphy',
  'Oscar',
  'Baxter',
  'Milo',
  'Otis',
  'Apollo',
  'Charlie',
  'Dexter',
  'Finn',
  'Theo',
  'Arthur',
  'Archie',
  'Moose',
  'Yoda',
  'Bolt',
  'Scooby',
  'Snoopy',
  'Loki',
  'Thor',
  'Maverick',
  'Bagel',
  'Pretzel',
  'Nacho',
];

const NEUTRAL_NAMES = [
  'Bailey',
  'Riley',
  'Dakota',
  'Harley',
  'Quinn',
  'Scout',
  'Lucky',
  'Sunny',
  'Bandit',
  'Storm',
  'Piper',
  'Clover',
  'Nugget',
  'Pixel',
  'Biscuit',
  'Moose',
  'Goose',
  'Wren',
  'Ash',
  'Rocket',
  'Winter',
  'Snowball',
  'Banjo',
  'Chaos',
  'Pickle',
  'Bao',
  'Mochi',
  'Taco',
  'Bagel',
  'Pancake',
];

type Category = 'girl' | 'boy' | 'neutral';

const GIRL_POOL = [...new Set([...GIRL_NAMES, ...NEUTRAL_NAMES])];
const BOY_POOL = [...new Set([...BOY_NAMES, ...NEUTRAL_NAMES])];
const NEUTRAL_POOL = [...new Set(NEUTRAL_NAMES)];

function pickPool(category: Category): string[] {
  if (category === 'girl') return GIRL_POOL;
  if (category === 'boy') return BOY_POOL;
  return NEUTRAL_POOL;
}

export function getNames(category: Category, count: number): string[] {
  const pool = [...pickPool(category)];
  const limited = Math.max(1, Math.min(count, pool.length));
  const picked: string[] = [];

  while (picked.length < limited && pool.length > 0) {
    const index = Math.floor(Math.random() * pool.length);
    const [name] = pool.splice(index, 1);
    if (name) picked.push(name);
  }

  return picked;
}
