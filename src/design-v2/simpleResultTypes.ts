import type { SafetyLevel } from '../types';

/** View-model for Simple mode result card — same shape for all three states. */
export type SimpleResultViewModel = {
  status: SafetyLevel;
  badgeLabel: string;
  mainVerdict: string;
  reasons: string[];
  advice: string;
};

export type SimpleResultCardProps = {
  model: SimpleResultViewModel;
  onShowMore?: () => void;
  onReset?: () => void;
  showMoreLabel?: string;
};
