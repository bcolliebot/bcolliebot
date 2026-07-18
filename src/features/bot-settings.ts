import { settings } from '@devvit/web/server';

export type BotThresholdSettings = {
  autoReplyMaxPostAgeHours: number;
  summonMaxCommentAgeHours: number;
  negativeCommentCleanupEnabled: boolean;
  negativeCommentDeleteScore: number;
  negativeCommentLookbackHours: number;
  negativeCommentScanLimit: number;
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
