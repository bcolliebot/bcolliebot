import { settings } from '@devvit/web/server';

export type UrgentRehomingSettings = {
  enabled: boolean;
  blockedCrosspostSubreddits: string[];
  autoRemoveBlockedCrossposts: boolean;
};

function parseSubredditList(raw: string | undefined): string[] {
  if (!raw) return [];

  const values = raw
    .split(/[\n,]+/)
    .map((entry) => entry.trim().toLowerCase().replace(/^r\//, ''))
    .filter(Boolean);

  return [...new Set(values)];
}

export async function getUrgentRehomingSettings(): Promise<UrgentRehomingSettings> {
  const enabled = Boolean(await settings.get<boolean>('urgentRehomingEnabled'));
  const blockedRaw = await settings.get<string>('blockedCrosspostSubreddits');
  const autoRemoveBlockedCrossposts = Boolean(
    await settings.get<boolean>('autoRemoveBlockedCrossposts')
  );

  return {
    enabled,
    blockedCrosspostSubreddits: parseSubredditList(blockedRaw),
    autoRemoveBlockedCrossposts,
  };
}
