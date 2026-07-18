import { Hono } from 'hono';
import type {
  OnAppInstallRequest,
  OnCommentCreateRequest,
  OnCommentSubmitRequest,
  OnPostCreateRequest,
  OnPostSubmitRequest,
  TriggerResponse,
} from '@devvit/web/shared';
import {
  handleBreedIdPostSubmit,
  handleBreedIdWrongFeedback,
} from '../features/breed-id/triggers.js';
import { handleSummonCommands } from '../features/summons/triggers.js';
import { handleUrgentRehomingPostSubmit } from '../features/urgent-rehoming/triggers.js';
import { handleImageMetadataReviewPostSubmit } from '../features/image-metadata-review/triggers.js';

// Router for trigger endpoints declared in devvit.json/triggers.
export const triggers = new Hono();

async function runFeatureSafely(
  featureName: string,
  runner: () => Promise<void>
): Promise<void> {
  try {
    await runner();
  } catch (error) {
    // Keep one feature failure from breaking all other trigger handlers.
    console.error(`[triggers] Feature "${featureName}" failed`, error);
  }
}

triggers.post('/on-app-install', async (c) => {
  // Parse install trigger payload.
  const input = await c.req.json<OnAppInstallRequest>();
  console.log('App installed to subreddit: r/' + input.subreddit?.name);

  return c.json<TriggerResponse>(
    {
      status: 'success',
    },
    200
  );
});

triggers.post('/on-comment-submit', async (c) => {
  // Parse comment-submit trigger payload.
  const input = await c.req.json<OnCommentSubmitRequest | OnCommentCreateRequest>();
  console.log('[triggers] comment event', {
    subreddit: input.subreddit?.name,
    commentId: input.comment?.id,
    postId: input.comment?.postId,
    author: input.author?.name,
  });
  await runFeatureSafely('breed-id:on-comment-submit', async () => {
    await handleBreedIdWrongFeedback(input as OnCommentSubmitRequest);
  });
  await runFeatureSafely('summons:on-comment-submit', async () => {
    await handleSummonCommands(input as OnCommentSubmitRequest);
  });

  return c.json<TriggerResponse>({}, 200);
});

triggers.post('/on-post-submit', async (c) => {
  // Parse post-submit trigger payload.
  const input = await c.req.json<OnPostSubmitRequest | OnPostCreateRequest>();
  console.log('[triggers] post event', {
    subreddit: input.subreddit?.name,
    postId: input.post?.id,
    author: input.author?.name,
    title: input.post?.title,
  });
  let urgentHandled = false;
  await runFeatureSafely('urgent-rehoming:on-post-submit', async () => {
    urgentHandled = await handleUrgentRehomingPostSubmit(input as OnPostSubmitRequest);
  });
  if (urgentHandled) {
    return c.json<TriggerResponse>({}, 200);
  }
  await runFeatureSafely('image-metadata-review:on-post-submit', async () => {
    await handleImageMetadataReviewPostSubmit(input as OnPostSubmitRequest);
  });
  await runFeatureSafely('breed-id:on-post-submit', async () => {
    await handleBreedIdPostSubmit(input as OnPostSubmitRequest);
  });

  return c.json<TriggerResponse>({}, 200);
});
