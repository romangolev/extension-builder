import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20",
        outline: "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        toolbar:
          "toolbar-action rounded-sm border border-border bg-card font-normal text-foreground text-[0.66rem] tracking-[0.5px] uppercase transition-colors duration-[120ms] hover:border-ring hover:bg-accent hover:text-ring focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:border-border focus-visible:outline-ring focus-visible:ring-0",
        dialog:
          "rounded-sm border border-border bg-secondary font-normal text-foreground text-[0.8rem] hover:bg-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-0",
        "dialog-primary":
          "rounded-sm border border-primary bg-primary font-normal text-primary-foreground text-[0.8rem] hover:bg-[var(--accent-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-0",
        "dialog-danger":
          "rounded-sm border border-destructive bg-destructive font-normal text-destructive-foreground text-[0.8rem] hover:bg-[var(--delete-btn-hover)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring focus-visible:ring-0",
        "toolbar-primary":
          "toolbar-action toolbar-action-primary rounded-sm border border-primary bg-primary font-normal text-primary-foreground text-[0.66rem] tracking-[0.5px] uppercase transition-colors duration-[120ms] hover:border-[var(--accent-hover)] hover:bg-[var(--accent-hover)] focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring focus-visible:ring-0",
        "toolbar-danger":
          "toolbar-action toolbar-action-danger rounded-sm border border-destructive bg-card font-normal text-[var(--danger)] text-[0.66rem] tracking-[0.5px] uppercase transition-colors duration-[120ms] hover:bg-destructive hover:text-destructive-foreground focus-visible:border-destructive focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-ring focus-visible:ring-0",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-md px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
        toolbar: "h-[30px] gap-[7px] px-3 py-0",
        dialog: "h-auto min-w-[72px] px-3 py-[5px] leading-[normal]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
