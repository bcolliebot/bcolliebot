import { redis } from '@devvit/web/server';
import type { T5 } from '@devvit/web/shared';

function handledCommentKey(subredditId: T5): string {
  return `summons:handledComment:${subredditId}`;
}

export async function markCommentHandled(
  subredditId: T5,
  commentId: string
): Promise<number> {
  return await redis.hSetNX(handledCommentKey(subredditId), commentId, '1');
}
