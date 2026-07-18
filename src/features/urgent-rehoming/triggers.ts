import { context, reddit } from '@devvit/web/server';
import type { OnPostSubmitRequest, T3 } from '@devvit/web/shared';
import { getUrgentRehomingSettings } from './settings.js';
import { detectUrgentRehomingReason } from './detect.js';
import {
  URGENT_REHOMING_AUTO_REMOVE_REPORT_REASON,
  URGENT_REHOMING_REPORT_REASON,
  URGENT_REHOMING_RESPONSE,
} from './text.js';
import {
  markUrgentRehomingRemoved,
  markUrgentRehomingReported,
} from './storage.js';

function asT3(id: string): T3 {
  return (id.startsWith('t3_') ? id : `t3_${id}`) as T3;
}

async function getCrosspostSourceSubreddit(postId: T3): Promise<string> {
  const post = await reddit.getPostById(postId);
  const parentId = post.crosspostParentId;
  if (!parentId) {
    return '';
  }

  const parentPost = await reddit.getPostById(parentId);
  return parentPost.subredditName.toLowerCase().replace(/^r\//, '').trim();
}

async function addRemovalComment(postId: T3): Promise<void> {
  const post = await reddit.getPostById(postId);
  const reply = await post.addComment({
    text: URGENT_REHOMING_RESPONSE,
    runAs: 'APP',
  });

  try {
    await reply.distinguish(true);
  } catch {
    await reply.distinguish(false);
  }
}

export async function handleUrgentRehomingPostSubmit(
  input: OnPostSubmitRequest
): Promise<boolean> {
  const postId = input.post?.id;
  if (!postId) {
    return false;
  }

  const settings = await getUrgentRehomingSettings();
  if (!settings.enabled) {
    return false;
  }

  const fullPostId = asT3(postId);
  const crosspostSource = await getCrosspostSourceSubreddit(fullPostId);
  const blockedCrosspost = settings.blockedCrosspostSubreddits.includes(crosspostSource);
  const reason = detectUrgentRehomingReason({
    title: input.post?.title ?? null,
    body: input.post?.selftext ?? null,
    blockedCrosspost,
  });

  if (!reason) {
    return false;
  }

  if (reason === 'blocked_crosspost_source' && settings.autoRemoveBlockedCrossposts) {
    const claimed = await markUrgentRehomingRemoved(context.subredditId, fullPostId);
    if (claimed !== 1) {
      return true;
    }

    await addRemovalComment(fullPostId);
    const post = await reddit.getPostById(fullPostId);
    await post.remove(false);
    await post.lock();
    await reddit.report(post, {
      reason: `${URGENT_REHOMING_AUTO_REMOVE_REPORT_REASON} Detector: ${reason}`,
    });
    return true;
  }

  const claimed = await markUrgentRehomingReported(context.subredditId, fullPostId);
  if (claimed !== 1) {
    return true;
  }

  const post = await reddit.getPostById(fullPostId);
  await reddit.report(post, {
    reason: `${URGENT_REHOMING_REPORT_REASON} Detector: ${reason}`,
  });
  return true;
}
