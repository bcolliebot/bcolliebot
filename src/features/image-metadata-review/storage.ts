import { redis } from '@devvit/web/server';
import type { T3, T5 } from '@devvit/web/shared';

function reportedKey(subredditId: T5): string {
  return `imageMetadataReview:reported:${subredditId}`;
}

export async function markImageMetadataReported(
  subredditId: T5,
  postId: T3
): Promise<number> {
  return await redis.hSetNX(reportedKey(subredditId), postId, '1');
}
