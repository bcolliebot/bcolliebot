const NON_ALNUM_RE = /[^a-z0-9\s]/g;
const WHITESPACE_RE = /\s+/g;
const SHELTER_ID_RE = /\b[a-z]\d{5,8}\b/i;

const URGENT_REHOMING_URGENCY_TERMS = [
  'urgent',
  'urgently',
  'euthanasia',
  'euth',
  'kill shelter',
  'high kill',
  '72hr notice',
  '72 hr notice',
  '72 hour notice',
  'notice sent',
  'deadline',
];

const URGENT_REHOMING_TRANSFER_TERMS = [
  'available for adoption',
  'adoptable',
  'adoption',
  'adopt',
  'forever home',
  'rehoming',
  'rehome',
  'out of state',
  'local foster',
  'needs a foster',
  'needs foster',
  'looking for a foster',
  'looking for foster',
  'foster needed',
  'needs rescue',
  'rescue needed',
  'looking for rescue',
  'needs placement',
  'needs a home',
  'needs home',
  'needs out',
  'can anyone take',
  'someone take',
  'take him',
  'take her',
  'adopt him',
  'adopt her',
  'foster him',
  'foster her',
  'please share',
];

const URGENT_REHOMING_SHELTER_TERMS = [
  'barc',
  'houston',
  'canino rd',
  'animal shelter',
  'shelter',
];

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(NON_ALNUM_RE, ' ')
    .replace(WHITESPACE_RE, ' ')
    .trim();
}

function containsAnyPhrase(text: string, phrases: readonly string[]): boolean {
  const padded = ` ${text} `;
  return phrases.some((phrase) => padded.includes(` ${phrase} `));
}

export function detectUrgentRehomingReason(input: {
  title?: string | null;
  body?: string | null;
  blockedCrosspost: boolean;
}): string | null {
  if (input.blockedCrosspost) {
    return 'blocked_crosspost_source';
  }

  const combinedRaw = `${input.title ?? ''} ${input.body ?? ''}`;
  const loweredRaw = combinedRaw.toLowerCase();
  const normalized = normalizeText(combinedRaw);
  const deobfuscatedRaw = loweredRaw.replace(/\bk\W*ll\b/g, 'kill');
  const euthanasiaContext =
    ` ${normalized} `.includes(' euthanasia ') ||
    /\beuthan(?:ize|ise|ized|ised|izing|ising)\b/.test(loweredRaw);

  let hasUrgency =
    containsAnyPhrase(normalized, URGENT_REHOMING_URGENCY_TERMS) ||
    deobfuscatedRaw.includes('kill shelter') ||
    deobfuscatedRaw.includes('high kill');

  const hasTransfer = containsAnyPhrase(normalized, URGENT_REHOMING_TRANSFER_TERMS);
  const hasShelterContext =
    containsAnyPhrase(normalized, URGENT_REHOMING_SHELTER_TERMS) ||
    SHELTER_ID_RE.test(combinedRaw);

  if (euthanasiaContext && !hasShelterContext) {
    hasUrgency = false;
  }

  if (hasUrgency && hasTransfer) {
    return 'urgent_transfer_terms';
  }

  if (hasUrgency && hasShelterContext) {
    return 'urgent_shelter_terms';
  }

  return null;
}
