import React from 'react';

export const StatusBadge = ({ children, variant = 'default' }: { children: React.ReactNode; variant?: 'default' | 'open' | 'closing' | 'ended' }) => {
  const cls =
    variant === 'closing'
      ? 'bg-destructive/10 text-destructive'
      : variant === 'open'
      ? 'bg-success/10 text-success'
      : variant === 'ended'
      ? 'bg-muted text-muted-foreground'
      : '';

  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>;
};

export default StatusBadge;
