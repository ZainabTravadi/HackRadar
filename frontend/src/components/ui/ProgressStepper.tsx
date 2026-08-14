import React from 'react';

export const ProgressStepper = ({ step = 1, steps = 4 }: { step?: number; steps?: number }) => {
  return (
    <div className="flex items-center gap-3">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-all ${i + 1 === step ? 'bg-primary text-primary-foreground shadow-glow' : i + 1 < step ? 'bg-secondary text-foreground' : 'border border-border bg-card text-muted-foreground'}`}>
            {i + 1}
          </div>
          {i < steps - 1 && <div className={`h-1 w-10 rounded-full ${i + 1 < step ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );
};

export default ProgressStepper;
