import React from 'react';

export const StatusBadge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'open' | 'closing' | 'ended' }) => {
  const cls =
    variant === 'closing'
      ? 'border border-destructive/20 bg-destructive/10 text-destructive'
      : variant === 'open'
      ? 'border border-success/20 bg-success/10 text-success'
      : variant === 'ended'
      ? 'border border-border/70 bg-muted text-muted-foreground'
      : '';

  return <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${cls}`}>{children}</span>;
};

export default StatusBadge;
