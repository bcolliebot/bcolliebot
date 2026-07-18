import { SIGNATURE } from '../breed-id/text.js';

export const DEFAULT_VET_RESPONSE_TEXT = [
  'bcollie-modbot has been summoned because this post may be about health issues, illness or injury.',
  'This subreddit is not a source of, or a substitute for, veterinary advice. If your dog is sick, injured, or otherwise unwell, please consult your veterinarian immediately.',
  'While you are waiting for your appointment, consider posting to /r/AskVet, a subreddit which may be able to provide more qualified advice.',
].join('\n\n');

export const DEFAULT_APPEARANCE_RESPONSE_INTRO =
  'bcollie-modbot has been summoned because this post may be about breed identification.';

export const DEFAULT_NAME_RESPONSE_INTRO =
  'bcollie-modbot has been summoned to help with some name suggestions! Here are some name ideas for you:';

export const DEFAULT_GIRL_NAME_RESPONSE_INTRO =
  'bcollie-modbot has been summoned to help with some name suggestions! Here are some names which might work for a girl dog:';

export const DEFAULT_BOY_NAME_RESPONSE_INTRO =
  'bcollie-modbot has been summoned to help with some name suggestions! Here are some names which might work for a boy dog:';

export const DEFAULT_SUMMON_ACK_TEXT =
  'Thanks for summoning me. I posted my full response as a top-level mod comment so everyone in the thread can see it.';

export const DEFAULT_EXISTING_BREED_ID_ACK_TEXT =
  "Thanks for summoning me. I already posted breed-ID guidance in this thread, so I'm replying here to avoid duplicate bot comments.";

function compactParts(parts: string[]): string {
  return parts.map((part) => part.trim()).filter(Boolean).join('\n\n');
}

export function buildVetResponse(vetResponseText: string): string {
  return vetResponseText.trim() + SIGNATURE;
}

export function buildAppearanceResponse(
  appearanceIntro: string,
  breedIdCoreText: string
): string {
  return compactParts([appearanceIntro, breedIdCoreText]) + SIGNATURE;
}
