import { settings } from '@devvit/web/server';
import {
  DEFAULT_BREED_ID_AUTO_INTRO,
  DEFAULT_BREED_ID_AUTO_CAVEAT,
  DEFAULT_BREED_ID_CORE_TEXT,
} from './breed-id/text.js';
import {
  DEFAULT_APPEARANCE_RESPONSE_INTRO,
  DEFAULT_BOY_NAME_RESPONSE_INTRO,
  DEFAULT_EXISTING_BREED_ID_ACK_TEXT,
  DEFAULT_GIRL_NAME_RESPONSE_INTRO,
  DEFAULT_NAME_RESPONSE_INTRO,
  DEFAULT_SUMMON_ACK_TEXT,
  DEFAULT_VET_RESPONSE_TEXT,
} from './summons/text.js';

export type BotThresholdSettings = {
  autoReplyMaxPostAgeHours: number;
  summonMaxCommentAgeHours: number;
  negativeCommentCleanupEnabled: boolean;
  negativeCommentDeleteScore: number;
  negativeCommentLookbackHours: number;
  negativeCommentScanLimit: number;
};

export type BotResponseTextSettings = {
  breedIdAutoIntro: string;
  breedIdCoreText: string;
  breedIdAutoCaveat: string;
  appearanceResponseIntro: string;
  vetResponseText: string;
  nameResponseIntro: string;
  girlNameResponseIntro: string;
  boyNameResponseIntro: string;
  summonAckText: string;
  existingBreedIdAckText: string;
};

const DEFAULTS = {
  autoReplyMaxPostAgeHours: 1,
  summonMaxCommentAgeHours: 1,
  negativeCommentDeleteScore: -3,
  negativeCommentLookbackHours: 24,
  negativeCommentScanLimit: 200,
} as const;

function toFiniteNumber(value: number | undefined, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function toNonEmptyString(value: string | undefined, fallback: string): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback;
}

export async function getBotThresholdSettings(): Promise<BotThresholdSettings> {
  const [
    autoReplyMaxPostAgeHoursRaw,
    summonMaxCommentAgeHoursRaw,
    negativeCommentCleanupEnabledRaw,
    negativeCommentDeleteScoreRaw,
    negativeCommentLookbackHoursRaw,
    negativeCommentScanLimitRaw,
  ] = await Promise.all([
    settings.get<number>('autoReplyMaxPostAgeHours'),
    settings.get<number>('summonMaxCommentAgeHours'),
    settings.get<boolean>('negativeCommentCleanupEnabled'),
    settings.get<number>('negativeCommentDeleteScore'),
    settings.get<number>('negativeCommentLookbackHours'),
    settings.get<number>('negativeCommentScanLimit'),
  ]);

  return {
    autoReplyMaxPostAgeHours: Math.max(
      0,
      toFiniteNumber(autoReplyMaxPostAgeHoursRaw, DEFAULTS.autoReplyMaxPostAgeHours)
    ),
    summonMaxCommentAgeHours: Math.max(
      0,
      toFiniteNumber(summonMaxCommentAgeHoursRaw, DEFAULTS.summonMaxCommentAgeHours)
    ),
    negativeCommentCleanupEnabled: Boolean(negativeCommentCleanupEnabledRaw),
    negativeCommentDeleteScore: Math.trunc(
      toFiniteNumber(negativeCommentDeleteScoreRaw, DEFAULTS.negativeCommentDeleteScore)
    ),
    negativeCommentLookbackHours: Math.max(
      0,
      toFiniteNumber(negativeCommentLookbackHoursRaw, DEFAULTS.negativeCommentLookbackHours)
    ),
    negativeCommentScanLimit: Math.max(
      1,
      Math.trunc(toFiniteNumber(negativeCommentScanLimitRaw, DEFAULTS.negativeCommentScanLimit))
    ),
  };
}

export async function getBotResponseTextSettings(): Promise<BotResponseTextSettings> {
  const [
    breedIdAutoIntro,
    breedIdCoreText,
    breedIdAutoCaveat,
    appearanceResponseIntro,
    vetResponseText,
    nameResponseIntro,
    girlNameResponseIntro,
    boyNameResponseIntro,
    summonAckText,
    existingBreedIdAckText,
  ] = await Promise.all([
    settings.get<string>('breedIdAutoIntro'),
    settings.get<string>('breedIdCoreText'),
    settings.get<string>('breedIdAutoCaveat'),
    settings.get<string>('appearanceResponseIntro'),
    settings.get<string>('vetResponseText'),
    settings.get<string>('nameResponseIntro'),
    settings.get<string>('girlNameResponseIntro'),
    settings.get<string>('boyNameResponseIntro'),
    settings.get<string>('summonAckText'),
    settings.get<string>('existingBreedIdAckText'),
  ]);

  return {
    breedIdAutoIntro: toNonEmptyString(
      breedIdAutoIntro,
      DEFAULT_BREED_ID_AUTO_INTRO
    ),
    breedIdCoreText: toNonEmptyString(breedIdCoreText, DEFAULT_BREED_ID_CORE_TEXT),
    breedIdAutoCaveat: toNonEmptyString(
      breedIdAutoCaveat,
      DEFAULT_BREED_ID_AUTO_CAVEAT
    ),
    appearanceResponseIntro: toNonEmptyString(
      appearanceResponseIntro,
      DEFAULT_APPEARANCE_RESPONSE_INTRO
    ),
    vetResponseText: toNonEmptyString(vetResponseText, DEFAULT_VET_RESPONSE_TEXT),
    nameResponseIntro: toNonEmptyString(nameResponseIntro, DEFAULT_NAME_RESPONSE_INTRO),
    girlNameResponseIntro: toNonEmptyString(
      girlNameResponseIntro,
      DEFAULT_GIRL_NAME_RESPONSE_INTRO
    ),
    boyNameResponseIntro: toNonEmptyString(
      boyNameResponseIntro,
      DEFAULT_BOY_NAME_RESPONSE_INTRO
    ),
    summonAckText: toNonEmptyString(summonAckText, DEFAULT_SUMMON_ACK_TEXT),
    existingBreedIdAckText: toNonEmptyString(
      existingBreedIdAckText,
      DEFAULT_EXISTING_BREED_ID_ACK_TEXT
    ),
  };
}
