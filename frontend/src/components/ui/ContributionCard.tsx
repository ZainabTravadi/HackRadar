import React from 'react';

export const ContributionCard = ({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`group flex flex-col items-start gap-2 rounded-2xl border p-4 transition-colors ${selected ? 'bg-primary text-primary-foreground' : 'bg-card hover:shadow-elevated'}`}
    aria-pressed={selected}
  >
    <div className="text-sm font-semibold">{label}</div>
    <div className="text-xs text-muted-foreground">{selected ? 'Selected' : 'Click to select'}</div>
  </button>
);

export default ContributionCard;
