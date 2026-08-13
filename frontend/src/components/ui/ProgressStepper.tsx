import React from 'react';

export const ProgressStepper = ({ step = 1, steps = 4 }: { step?: number; steps?: number }) => {
  return (
    <div className="flex items-center gap-4">
      {Array.from({ length: steps }).map((_, i) => (
        <div key={i} className="flex items-center gap-3">
          <div className={`h-8 w-8 flex items-center justify-center rounded-full ${i + 1 === step ? 'bg-primary text-primary-foreground' : 'bg-card border border-border text-muted-foreground'}`}>
            {i + 1}
          </div>
          {i < steps - 1 && <div className={`h-1 w-12 ${i + 1 < step ? 'bg-primary' : 'bg-border'}`} />}
        </div>
      ))}
    </div>
  );
};

export default ProgressStepper;
