import { context, reddit } from '@devvit/web/server';
import type { Comment } from '@devvit/reddit';
import type { OnCommentSubmitRequest, T1, T3 } from '@devvit/web/shared';
import {
  getBotResponseTextSettings,
  getBotThresholdSettings,
} from '../bot-settings.js';
import type { BotResponseTextSettings } from '../bot-settings.js';
import { SIGNATURE } from '../breed-id/text.js';
import { getAutoCommentId, isWrongSubmission } from '../breed-id/storage.js';
import { getNames } from './names.js';
import {
  buildAppearanceResponse,
  buildVetResponse,
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

async function postThreadReply(postId: T3, responseText: string): Promise<Comment> {
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

function buildNamesResponse(
  gender: string | undefined,
  count: number,
  responseText: BotResponseTextSettings
): string {
  let category: 'girl' | 'boy' | 'neutral' = 'neutral';
  let intro = responseText.nameResponseIntro;

  if (gender === 'girl') {
    category = 'girl';
    intro = responseText.girlNameResponseIntro;
  } else if (gender === 'boy') {
    category = 'boy';
    intro = responseText.boyNameResponseIntro;
  }

  const names = getNames(category, count);
  return `${intro.trim()}\n\n* ${names.join('\n* ')}${SIGNATURE}`;
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

    const responseText = await getBotResponseTextSettings();
    const response = buildNamesResponse(
      namesMatch[1]?.toLowerCase(),
      namesMatch[2] ? Number.parseInt(namesMatch[2], 10) : 10,
      responseText
    );
    const reply = await postThreadReply(asT3(postId), response);
    await acknowledgeSummoner(asT1(commentId), reply.permalink, responseText.summonAckText);
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

  const responseText = await getBotResponseTextSettings();

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
          responseText.existingBreedIdAckText + SIGNATURE
        );
        return true;
      }
    }
  }

  const responseBody = vet
    ? buildVetResponse(responseText.vetResponseText)
    : buildAppearanceResponse(
        responseText.appearanceResponseIntro,
        responseText.breedIdCoreText
      );
  const threadReply = await postThreadReply(asT3(postId), responseBody);
  await acknowledgeSummoner(asT1(commentId), threadReply.permalink, responseText.summonAckText);
  return true;
}
