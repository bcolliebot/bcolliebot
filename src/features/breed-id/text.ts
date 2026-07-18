export const BREED_ID_FLAIR_TEXT = 'Breed ID';

export const SIGNATURE =
  "\n\n---\n\n^(I'm a bot, this action was performed automatically. [View all of my commands here.](https://www.reddit.com/user/BorderCollieBot/comments/1cvzz8w/my_commands/))";

export const BREED_ID_CORE_TEXT = [
  'Visual breed identification is very unreliable, especially from photos alone.',
  'Many shelter and rescue dogs get labelled as border collie mixes because black-and-white markings are common across many breeds.',
  'Border collies were historically selected by working ability, not appearance, so they vary widely in size, coat type, colour, markings, and ear shape.',
  'If you want the best possible answer, a DNA test from Embark or Wisdom Panel is the most reliable way to estimate ancestry. /r/doggydna is a good place to compare results.',
].join('\n\n');

export const BREED_ID_AUTO_CAVEAT =
  "\n\nIf I got this wrong and this post is not actually about breed identification, reply `wrong` and I'll remove my comment and the Breed ID flair.";

export const BREED_ID_AUTO_RESPONSE =
  'BorderCollieBot thinks this post may be asking for breed or mix identification.\n\n' +
  BREED_ID_CORE_TEXT +
  BREED_ID_AUTO_CAVEAT +
  SIGNATURE;
