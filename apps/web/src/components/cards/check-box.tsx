import { cn } from "cn";
import { Check, Minus } from "lucide-react";
import { Checkbox } from "radix-ui";
import type { ComponentProps } from "react";

// A checkbox that can also show a dash, when only some of the Cards have it ("mixed").
export function CheckBox({
  checked,
  className,
  ...props
}: Omit<ComponentProps<typeof Checkbox.Root>, "checked"> & {
  checked: boolean | "mixed";
}) {
  return (
    <Checkbox.Root
      checked={checked === "mixed" ? "indeterminate" : checked}
      className={cn(
        "grid size-5 shrink-0 place-items-center rounded-[6px] border outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-input bg-background",
        className
      )}
      {...props}
    >
      <Checkbox.Indicator>
        {checked === "mixed" ? (
          <Minus className="size-3.5" />
        ) : (
          <Check className="size-3.5" />
        )}
      </Checkbox.Indicator>
    </Checkbox.Root>
  );
}
