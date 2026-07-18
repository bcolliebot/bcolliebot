import { settings } from '@devvit/web/server';

export type ImageMetadataReviewSettings = {
  enabled: boolean;
  maxPostAgeHours: number;
};

const DEFAULT_MAX_POST_AGE_HOURS = 4;

export async function getImageMetadataReviewSettings(): Promise<ImageMetadataReviewSettings> {
  const enabled = Boolean(await settings.get<boolean>('imageMetadataReviewEnabled'));
  const maxPostAgeHoursRaw = await settings.get<number>('imageMetadataMaxPostAgeHours');
  const maxPostAgeHours =
    typeof maxPostAgeHoursRaw === 'number' && Number.isFinite(maxPostAgeHoursRaw)
      ? Math.max(0, maxPostAgeHoursRaw)
      : DEFAULT_MAX_POST_AGE_HOURS;

  return {
    enabled,
    maxPostAgeHours,
  };
}
