import { context, reddit } from '@devvit/web/server';
import { getBotThresholdSettings } from '../bot-settings.js';

const APP_ACCOUNT_NAME = 'bcollie-modbot';

export type CleanupNegativeCommentsResult = {
  scannedCount: number;
  deletedCount: number;
  skipped: boolean;
  reason?: string;
};

export async function cleanupNegativeRecentBotComments(): Promise<CleanupNegativeCommentsResult> {
  const thresholds = await getBotThresholdSettings();
  if (!thresholds.negativeCommentCleanupEnabled) {
    return {
      scannedCount: 0,
      deletedCount: 0,
      skipped: true,
      reason: 'feature-disabled',
    };
  }

  const lookbackMs = thresholds.negativeCommentLookbackHours * 3_600_000;
  const now = Date.now();
  let scannedCount = 0;
  let deletedCount = 0;

  const appUser = await reddit.getUserByUsername(APP_ACCOUNT_NAME);
  if (!appUser) {
    return {
      scannedCount: 0,
      deletedCount: 0,
      skipped: true,
      reason: 'app-user-not-found',
    };
  }

  const recentComments = await appUser
    .getComments({
      sort: 'new',
      timeframe: 'day',
      limit: thresholds.negativeCommentScanLimit,
      pageSize: Math.min(100, thresholds.negativeCommentScanLimit),
    })
    .all();

  for (const comment of recentComments) {
    scannedCount += 1;

    if (comment.subredditId !== context.subredditId) {
      continue;
    }

    if (comment.removed) {
      continue;
    }

    const ageMs = Math.max(0, now - comment.createdAt.getTime());
    if (ageMs > lookbackMs) {
      continue;
    }

    if (comment.score > thresholds.negativeCommentDeleteScore) {
      continue;
    }

    await comment.delete();
    deletedCount += 1;
  }

  return {
    scannedCount,
    deletedCount,
    skipped: false,
  };
}
