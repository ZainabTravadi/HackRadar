import React from 'react';

export const SectionHeader = ({
  eyebrow,
  title,
  subtitle,
  center = false,
}: {
  eyebrow?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  center?: boolean;
}) => (
  <div className={`mx-auto max-w-3xl ${center ? 'text-center' : ''}`}>
    {eyebrow ? (
      <div className="mb-3 inline-flex items-center rounded-full border border-border/70 bg-card/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">
        {eyebrow}
      </div>
    ) : null}
    <h2 className="font-display text-balance text-4xl font-bold tracking-tight md:text-5xl">{title}</h2>
    {subtitle ? <p className="mt-4 text-pretty text-muted-foreground">{subtitle}</p> : null}
  </div>
);

export default SectionHeader;
