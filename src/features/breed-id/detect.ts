const NON_ALNUM_RE = /[^a-z0-9\s]/g;
const WHITESPACE_RE = /\s+/g;
const WRONG_TOKENS = new Set(['!wrong', '!badbot', '!undo']);
const WRONG_WORD_RE = /\bwrong\b/;
const NOT_WRONG_RE = /\bnot\s+wrong\b/;

const IDENTITY_QUESTION_PHRASES = [
  'is my dog a',
  'is my puppy a',
  'is my pup a',
  'is this dog a',
  'is this a',
  'is he a',
  'is she a',
  'is it a',
  'could this be',
  'could he be',
  'could she be',
  'could this have',
  'could he have',
  'could she have',
  'do you think my dog is',
  'do you think he is',
  'do you think she is',
  'do you think it is',
];

const BREED_TERMS = [
  'border collie',
  'border collies',
  'border-collie',
  'border-collies',
  'bc',
  'collie',
];

const MIX_TERMS = [
  'mix',
  'mixed',
  'what mix',
  'mixed with',
  'mix with',
  'mix of',
  'part border collie',
  'part collie',
  'part bc',
];

const BREED_ID_TERMS = [
  'what breed',
  'what breed is he',
  'what breed is she',
  'what breed is this dog',
  'what breed is my dog',
  'what is he mixed with',
  'what is she mixed with',
  'what is my dog mixed with',
  'breed id',
  'breed identification',
];

const UNCERTAINTY_TERMS = [
  'rescue said',
  'shelter said',
  'we were told',
  'not sure',
  'unsure',
  'wondering if',
  'trying to figure out',
  'any ideas',
];

const NEGATIVE_TERMS = [
  'not a border collie',
  'not border collie',
  'definitely not',
];

export function normalizeText(text: string): string {
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

export function isLikelyImagePost(url?: string | null): boolean {
  const lowered = (url ?? '').toLowerCase();
  return (
    lowered.includes('i.redd.it') ||
    lowered.includes('preview.redd.it') ||
    lowered.endsWith('.jpg') ||
    lowered.endsWith('.jpeg') ||
    lowered.endsWith('.png') ||
    lowered.endsWith('.webp')
  );
}

export function detectBreedIdIntent(input: {
  title?: string | null;
  body?: string | null;
  url?: string | null;
}): { matched: boolean; score: number } {
  const normalized = normalizeText(`${input.title ?? ''} ${input.body ?? ''}`);

  if (!normalized) {
    return { matched: false, score: 0 };
  }

  let score = 0;

  if (containsAnyPhrase(normalized, IDENTITY_QUESTION_PHRASES)) score += 3;
  if (containsAnyPhrase(normalized, BREED_TERMS)) score += 2;
  if (containsAnyPhrase(normalized, MIX_TERMS)) score += 2;
  if (containsAnyPhrase(normalized, BREED_ID_TERMS)) score += 3;
  if (containsAnyPhrase(normalized, UNCERTAINTY_TERMS)) score += 1;
  if (isLikelyImagePost(input.url)) score += 1;
  if (containsAnyPhrase(normalized, NEGATIVE_TERMS)) score -= 3;

  return { matched: score >= 4, score };
}

export function isWrongFeedbackComment(text: string): boolean {
  const lowered = text.toLowerCase();
  const tokens = new Set(lowered.match(/!\w+/g) ?? []);
  if ([...WRONG_TOKENS].some((token) => tokens.has(token))) {
    return true;
  }
  return WRONG_WORD_RE.test(lowered) && !NOT_WRONG_RE.test(lowered);
}

export function isWrongFeedbackReply(
  text: string,
  parentId: string | undefined,
  autoCommentId: string | undefined
): boolean {
  if (!parentId || !autoCommentId) return false;
  const fullCommentId = autoCommentId.startsWith('t1_')
    ? autoCommentId
    : `t1_${autoCommentId}`;
  return parentId === fullCommentId && isWrongFeedbackComment(text);
}
