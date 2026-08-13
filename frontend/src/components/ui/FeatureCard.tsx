import React from 'react';

type FeatureCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ComponentType<Record<string, unknown>>;
  title: string;
  desc: string;
};

export const FeatureCard = ({ icon: Icon, title, desc }: FeatureCardProps) => (
  <div className="rounded-2xl border border-border bg-card-gradient p-6 shadow-card hover:shadow-elevated transition-transform group">
    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-4 text-lg font-semibold group-hover:text-foreground">{title}</h3>
    <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
  </div>
);

export default FeatureCard;
