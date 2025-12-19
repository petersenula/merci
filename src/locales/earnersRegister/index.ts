import { en } from './en';
import { de } from './de';
import { fr } from './fr';
import { it } from './it';
import type { EarnerRegisterTranslation, Lang } from './types';

export type { EarnerRegisterTranslation, Lang };

export const earnerRegisterTranslations: Record<
  Lang,
  EarnerRegisterTranslation
> = {
  en,
  de,
  fr,
  it,
};