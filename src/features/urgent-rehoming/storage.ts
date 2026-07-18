import { redis } from '@devvit/web/server';
import type { T3, T5 } from '@devvit/web/shared';

function removedKey(subredditId: T5): string {
  return `urgentRehoming:removed:${subredditId}`;
}

function reportedKey(subredditId: T5): string {
  return `urgentRehoming:reported:${subredditId}`;
}

export async function markUrgentRehomingRemoved(
  subredditId: T5,
  postId: T3
): Promise<number> {
  return await redis.hSetNX(removedKey(subredditId), postId, '1');
}

export async function markUrgentRehomingReported(
  subredditId: T5,
  postId: T3
): Promise<number> {
  return await redis.hSetNX(reportedKey(subredditId), postId, '1');
}
