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
      <div className="mb-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">{eyebrow}</div>
    ) : null}
    <h2 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">{title}</h2>
    {subtitle ? <p className="mt-4 text-muted-foreground">{subtitle}</p> : null}
  </div>
);

export default SectionHeader;
