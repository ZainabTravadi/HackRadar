import React from 'react';

export const FilterChip = ({ children, active = false, onClick }: { children: React.ReactNode; active?: boolean; onClick?: () => void }) => (
  <button
    type="button"
    onClick={onClick}
    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
      active ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground hover:text-foreground'
    }`}
  >
    {children}
  </button>
);

export default FilterChip;
