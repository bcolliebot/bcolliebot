import { context, reddit } from '@devvit/web/server';
import type { OnCommentSubmitRequest, OnPostSubmitRequest, T1, T3 } from '@devvit/web/shared';
import {
  getBotResponseTextSettings,
  getBotThresholdSettings,
} from '../bot-settings.js';
import { BREED_ID_FLAIR_TEXT, buildBreedIdAutoResponse } from './text.js';
import { detectBreedIdIntent, isWrongFeedbackComment } from './detect.js';
import {
  clearAutoCommentId,
  getAutoCommentId,
  hasHandledSubmission,
  isWrongSubmission,
  markSubmissionHandled,
  markWrongSubmission,
  storeAutoCommentId,
} from './storage.js';

function asT1(id: string): T1 {
  return (id.startsWith('t1_') ? id : `t1_${id}`) as T1;
}

function asT3(id: string): T3 {
  return (id.startsWith('t3_') ? id : `t3_${id}`) as T3;
}

function getAgeHours(createdAt?: string | number | Date | null): number {
  if (createdAt == null) return 0;
  const ts =
    createdAt instanceof Date
      ? createdAt.getTime()
      : typeof createdAt === 'number'
        ? createdAt * 1000
        : Date.parse(createdAt);
  if (Number.isNaN(ts)) return 0;
  return Math.max(0, Date.now() - ts) / 3_600_000;
}

async function applyBreedIdFlair(postId: T3, subredditName: string): Promise<void> {
  await reddit.setPostFlair({
    postId,
    subredditName,
    text: BREED_ID_FLAIR_TEXT,
  });
}

async function clearPostFlair(postId: T3, subredditName: string): Promise<void> {
  await reddit.setPostFlair({
    postId,
    subredditName,
    text: '',
  });
}

async function addDistinguishedStickyComment(postId: T3): Promise<string> {
  const responseText = await getBotResponseTextSettings();
  const post = await reddit.getPostById(postId);
  const reply = await post.addComment({
    text: buildBreedIdAutoResponse(
      responseText.breedIdAutoIntro,
      responseText.breedIdCoreText,
      responseText.breedIdAutoCaveat
    ),
    runAs: 'APP',
  });

  try {
    await reply.distinguish(true);
  } catch {
    await reply.distinguish(false);
  }

  return reply.id;
}

export async function handleBreedIdPostSubmit(
  input: OnPostSubmitRequest
): Promise<void> {
  const subredditId = context.subredditId;
  const subredditName = input.subreddit?.name;
  const authorName = input.author?.name;
  const postId = input.post?.id;

  if (!subredditName || !postId || !authorName || authorName === '[deleted]') {
    return;
  }

  const thresholds = await getBotThresholdSettings();

  if (getAgeHours(input.post?.createdAt) > thresholds.autoReplyMaxPostAgeHours) {
    return;
  }

  if (await isWrongSubmission(subredditId, postId)) {
    return;
  }

  if (await hasHandledSubmission(subredditId, postId)) {
    return;
  }

  const detection = detectBreedIdIntent({
    title: input.post?.title ?? null,
    body: input.post?.selftext ?? null,
    url: input.post?.url ?? null,
  });

  if (!detection.matched) {
    return;
  }

  const claimed = await markSubmissionHandled(subredditId, postId);
  if (claimed !== 1) {
    return;
  }

  const fullPostId = asT3(postId);

  await applyBreedIdFlair(fullPostId, subredditName);
  const autoCommentId = await addDistinguishedStickyComment(fullPostId);
  await storeAutoCommentId(subredditId, fullPostId, autoCommentId);
}

export async function handleBreedIdWrongFeedback(
  input: OnCommentSubmitRequest
): Promise<void> {
  const subredditId = context.subredditId;
  const subredditName = input.subreddit?.name;
  const commentBody = input.comment?.body ?? '';
  const commentId = input.comment?.id;
  const postId = input.comment?.postId;

  if (!subredditName || !commentId || !postId) {
    return;
  }

  if (!isWrongFeedbackComment(commentBody)) {
    return;
  }

  if (await isWrongSubmission(subredditId, postId)) {
    return;
  }

  const fullPostId = asT3(postId);
  const autoCommentId = await getAutoCommentId(subredditId, fullPostId);
  if (!autoCommentId) {
    return;
  }

  const autoComment = await reddit.getCommentById(asT1(autoCommentId));
  await autoComment.delete();
  await clearPostFlair(fullPostId, subredditName);
  await clearAutoCommentId(subredditId, fullPostId);
  await markWrongSubmission(subredditId, postId);

  const wrongComment = await reddit.getCommentById(asT1(commentId));
  await wrongComment.remove();
}
