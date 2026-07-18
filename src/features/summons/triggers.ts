import { context, reddit } from '@devvit/web/server';
import type { OnCommentSubmitRequest, T1, T3 } from '@devvit/web/shared';
import { getBotThresholdSettings } from '../bot-settings.js';
import { SIGNATURE } from '../breed-id/text.js';
import { getAutoCommentId, isWrongSubmission } from '../breed-id/storage.js';
import { getNames } from './names.js';
import {
  APPEARANCE_RESPONSE,
  EXISTING_BREED_ID_ACK_PREFIX,
  SUMMON_ACK_PREFIX,
  VET_RESPONSE,
} from './text.js';
import { markCommentHandled } from './storage.js';

const NAME_COMMAND_RE = /!(girl|boy)?names(?:\s+(\d+))?\b/i;
const TOKEN_COMMAND_RE = /!\w+/g;
const APPEARANCE_TOKENS = new Set(['!appearance', '!appearances', '!id']);
const VET_TOKENS = new Set(['!vet', '!emergency', '!health', '!injury', '!illness']);
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

function hasIntersection(tokens: Set<string>, wanted: Set<string>): boolean {
  for (const token of wanted) {
    if (tokens.has(token)) return true;
  }
  return false;
}

async function postThreadReply(postId: T3, responseText: string) {
  const post = await reddit.getPostById(postId);
  const reply = await post.addComment({
    text: responseText,
    runAs: 'APP',
  });

  try {
    await reply.distinguish(true);
  } catch {
    await reply.distinguish(false);
  }

  return reply;
}

async function acknowledgeSummoner(
  commentId: T1,
  permalink: string,
  prefix: string
): Promise<void> {
  const comment = await reddit.getCommentById(commentId);
  await comment.reply({
    text: `${prefix}\n\n[Jump to my comment](${permalink})`,
    runAs: 'APP',
  });
}

function buildNamesResponse(gender: string | undefined, count: number): string {
  let category: 'girl' | 'boy' | 'neutral' = 'neutral';
  let intro =
    'BorderCollieBot has been summoned to help with some name suggestions! Here are some name ideas for you: \n\n* ';

  if (gender === 'girl') {
    category = 'girl';
    intro =
      'BorderCollieBot has been summoned to help with some name suggestions! Here are some names which might work for a girl dog: \n\n* ';
  } else if (gender === 'boy') {
    category = 'boy';
    intro =
      'BorderCollieBot has been summoned to help with some name suggestions! Here are some names which might work for a boy dog: \n\n* ';
  }

  const names = getNames(category, count);
  return intro + names.join('\n* ') + SIGNATURE;
}

export async function handleSummonCommands(
  input: OnCommentSubmitRequest
): Promise<boolean> {
  const subredditId = context.subredditId;
  const commentId = input.comment?.id;

  if (!commentId) {
    return false;
  }

  const comment = await reddit.getCommentById(asT1(commentId));
  const postId = comment.postId;
  const commentBody = comment.body ?? '';
  const thresholds = await getBotThresholdSettings();

  if (getAgeHours(comment.createdAt) > thresholds.summonMaxCommentAgeHours) {
    return false;
  }

  const lowered = commentBody.toLowerCase();

  const namesMatch = NAME_COMMAND_RE.exec(lowered);
  if (namesMatch) {
    const claimed = await markCommentHandled(subredditId, commentId);
    if (claimed !== 1) {
      return true;
    }

    const response = buildNamesResponse(
      namesMatch[1]?.toLowerCase(),
      namesMatch[2] ? Number.parseInt(namesMatch[2], 10) : 10
    );
    const reply = await postThreadReply(asT3(postId), response);
    await acknowledgeSummoner(asT1(commentId), reply.permalink, SUMMON_ACK_PREFIX);
    return true;
  }

  const tokens = new Set((lowered.match(TOKEN_COMMAND_RE) ?? []).map((token) => token.toLowerCase()));
  const appearance = hasIntersection(tokens, APPEARANCE_TOKENS);
  const vet = hasIntersection(tokens, VET_TOKENS);
  const wrongSubmission = await isWrongSubmission(subredditId, postId);

  if (!appearance && !vet) {
    return false;
  }

  if (appearance && !vet && wrongSubmission) {
    return false;
  }

  const claimed = await markCommentHandled(subredditId, commentId);
  if (claimed !== 1) {
    return true;
  }

  // Appearance can reuse the existing breed-ID comment, but only when it is the
  // only summon intent in the comment. Vet/help commands need their own reply.
  if (appearance && !vet) {
    const existingAutoCommentId = await getAutoCommentId(subredditId, asT3(postId));
    if (existingAutoCommentId) {
      const existingAutoComment = await reddit.getCommentById(asT1(existingAutoCommentId));
      if (!existingAutoComment.removed) {
        await acknowledgeSummoner(
          asT1(commentId),
          existingAutoComment.permalink,
          EXISTING_BREED_ID_ACK_PREFIX + SIGNATURE
        );
        return true;
      }
    }
  }

  const responseText = vet ? VET_RESPONSE : APPEARANCE_RESPONSE;
  const threadReply = await postThreadReply(asT3(postId), responseText);
  await acknowledgeSummoner(asT1(commentId), threadReply.permalink, SUMMON_ACK_PREFIX);
  return true;
}
