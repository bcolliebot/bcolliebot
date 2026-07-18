import { context, reddit } from '@devvit/web/server';
import type { OnPostSubmitRequest, T3 } from '@devvit/web/shared';
import { detectImageMetadataReviewReasons, isLikelyImagePost } from './detect.js';
import { getImageMetadataReviewSettings } from './settings.js';
import { markImageMetadataReported } from './storage.js';
import { IMAGE_METADATA_REVIEW_REPORT_REASON_PREFIX } from './text.js';

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

export async function handleImageMetadataReviewPostSubmit(
  input: OnPostSubmitRequest
): Promise<void> {
  const postId = input.post?.id;
  if (!postId) {
    return;
  }

  const settings = await getImageMetadataReviewSettings();
  if (!settings.enabled) {
    return;
  }

  if (getAgeHours(input.post?.createdAt) > settings.maxPostAgeHours) {
    return;
  }

  const fullPostId = asT3(postId);
  const post = await reddit.getPostById(fullPostId);
  if (!isLikelyImagePost(post)) {
    return;
  }

  const reasons = await detectImageMetadataReviewReasons(post);
  if (reasons.length === 0) {
    return;
  }

  const claimed = await markImageMetadataReported(context.subredditId, fullPostId);
  if (claimed !== 1) {
    return;
  }

  await reddit.report(post, {
    reason: `${IMAGE_METADATA_REVIEW_REPORT_REASON_PREFIX} ${reasons.slice(0, 4).join(', ')}`,
  });
}
