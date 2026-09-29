/** Draft saving is silent; restored drafts are offered by the form before editing. */
export const DraftAutosaveStatus: (props: {
  savedAt: string | null;
  label?: string;
  onClear?: () => void;
  compact?: boolean;
}) => null = () => null;
