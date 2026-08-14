import React from 'react';

type FeatureCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>> | React.ComponentType<Record<string, unknown>>;
  title: string;
  desc: string;
};

export const FeatureCard = ({ icon: Icon, title, desc }: FeatureCardProps) => (
  <div className="hover-lift group rounded-3xl border border-border/70 bg-card/90 p-6 shadow-card">
    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-gradient text-primary-foreground shadow-glow transition-transform group-hover:scale-105">
      <Icon className="h-5 w-5" />
    </div>
    <h3 className="mt-4 text-lg font-semibold tracking-tight group-hover:text-foreground">{title}</h3>
    <p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p>
  </div>
);

export default FeatureCard;
