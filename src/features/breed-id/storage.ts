import { redis } from '@devvit/web/server';
import type { T3, T5 } from '@devvit/web/shared';

function repliedKey(subredditId: T5): string {
  return `breedId:replied:${subredditId}`;
}

function wrongKey(subredditId: T5): string {
  return `breedId:wrong:${subredditId}`;
}

function autoCommentKey(subredditId: T5): string {
  return `breedId:autoComment:${subredditId}`;
}

export async function markSubmissionHandled(
  subredditId: T5,
  postId: string
): Promise<number> {
  return await redis.hSetNX(repliedKey(subredditId), postId, '1');
}

export async function hasHandledSubmission(
  subredditId: T5,
  postId: string
): Promise<boolean> {
  return (await redis.hGet(repliedKey(subredditId), postId)) === '1';
}

export async function markWrongSubmission(
  subredditId: T5,
  postId: string
): Promise<void> {
  await redis.hSet(wrongKey(subredditId), { [postId]: '1' });
}

export async function isWrongSubmission(
  subredditId: T5,
  postId: string
): Promise<boolean> {
  return (await redis.hGet(wrongKey(subredditId), postId)) === '1';
}

export async function storeAutoCommentId(
  subredditId: T5,
  postId: T3,
  commentId: string
): Promise<void> {
  await redis.hSet(autoCommentKey(subredditId), { [postId]: commentId });
}

export async function getAutoCommentId(
  subredditId: T5,
  postId: T3
): Promise<string | undefined> {
  return await redis.hGet(autoCommentKey(subredditId), postId);
}

export async function clearAutoCommentId(
  subredditId: T5,
  postId: T3
): Promise<void> {
  await redis.hDel(autoCommentKey(subredditId), [postId]);
}
