import React from 'react';

export const FilterChip = ({ children, active = false, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition-all ${
      active ? 'bg-primary text-primary-foreground shadow-glow' : 'border border-border/70 bg-card/85 text-muted-foreground hover:-translate-y-0.5 hover:text-foreground hover:shadow-card'
    }`}
  >
    {children}
  </button>
);

export default FilterChip;
