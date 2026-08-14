import { Sparkles } from "lucide-react";

import { Badge } from "@/components/ui/badge";

type FellowshipBadgeProps = {
  className?: string;
};

export function FellowshipBadge({ className }: FellowshipBadgeProps) {
  return (
    <Badge variant="outline" className={`gap-1.5 border-violet-500/30 bg-violet-500/10 text-violet-700 dark:text-violet-300 ${className ?? ""}`.trim()}>
      <Sparkles className="h-3.5 w-3.5" />
      HackRadar Fellowship
    </Badge>
  );
}
