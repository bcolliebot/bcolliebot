import { BREED_ID_CORE_TEXT, SIGNATURE } from '../breed-id/text.js';

export const VET_RESPONSE =
  'BorderCollieBot has been summoned because this post may be about health issues, illness or injury.\n\n' +
  'This subreddit is not a source of, or a substitute for, veterinary advice. If your dog is sick, injured, or otherwise unwell, please consult your veterinarian immediately.\n\n' +
  'While you are waiting for your appointment, consider posting to /r/AskVet, a subreddit which may be able to provide more qualified advice.' +
  SIGNATURE;

export const APPEARANCE_RESPONSE =
  'BorderCollieBot has been summoned because this post may be about breed identification.\n\n' +
  BREED_ID_CORE_TEXT +
  SIGNATURE;

export const SUMMON_ACK_PREFIX =
  'Thanks for summoning me. I posted my full response as a top-level mod comment so everyone in the thread can see it.';

export const EXISTING_BREED_ID_ACK_PREFIX =
  "Thanks for summoning me. I already posted breed-ID guidance in this thread, so I'm replying here to avoid duplicate bot comments.";
