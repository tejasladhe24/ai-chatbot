"use client";

import { CheckIcon, LucideIcon, XIcon } from "@workspace/icons/lucide";
import { Switch } from "@workspace/ui/components/switch";

interface SwitchWithIconsProps extends React.ComponentProps<typeof Switch> {
  labels: {
    checked?: LucideIcon;
    unchecked?: LucideIcon;
  };
}

const SwitchWithIcons = ({ labels, ...props }: SwitchWithIconsProps) => {
  const CheckedIcon = labels.checked ?? CheckIcon;
  const UncheckedIcon = labels.unchecked ?? XIcon;

  return (
    <div>
      <div className="relative inline-grid h-8 grid-cols-[1fr_1fr] items-center text-sm font-medium">
        <Switch
          {...props}
          className="peer data-[state=checked]:bg-input/50 data-[state=unchecked]:bg-input/50 [&_span]:!bg-background absolute inset-0 h-[inherit] w-14 [&_span]:size-6.5 [&_span]:transition-transform [&_span]:duration-300 [&_span]:ease-[cubic-bezier(0.16,1,0.3,1)] [&_span]:data-[state=checked]:translate-x-7 [&_span]:data-[state=checked]:rtl:-translate-x-7"
          aria-label="chat-visibility-switch"
        />
        <span className="peer-data-[state=checked]:text-muted-foreground/70 pointer-events-none relative ml-1.75 flex min-w-7 items-center text-center">
          <CheckedIcon className="size-4" aria-hidden="true" />
        </span>
        <span className="peer-data-[state=unchecked]:text-muted-foreground/70 pointer-events-none relative -ms-0.25 flex min-w-7 items-center text-center">
          <UncheckedIcon className="size-4" aria-hidden="true" />
        </span>
      </div>
    </div>
  );
};

export { SwitchWithIcons };
