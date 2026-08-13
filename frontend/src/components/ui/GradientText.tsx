import React from 'react';

export const GradientText = ({ children }: { children: React.ReactNode }) => (
  <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">{children}</span>
);

export default GradientText;
