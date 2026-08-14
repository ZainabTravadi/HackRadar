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
    className={`group flex flex-col items-start gap-2 rounded-2xl border p-4 text-left transition-all ${selected ? 'border-primary/40 bg-primary text-primary-foreground shadow-glow' : 'border-border/70 bg-card/90 hover:-translate-y-0.5 hover:shadow-elevated'}`}
    aria-pressed={selected}
  >
    <div className="text-sm font-semibold capitalize tracking-tight">{label}</div>
    <div className={`text-xs ${selected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{selected ? 'Selected' : 'Click to select'}</div>
  </button>
);

export default ContributionCard;
