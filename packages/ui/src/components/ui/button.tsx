import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'gradient-prismatic text-obsidian font-bold shadow-md hover:shadow-lg hover:glow-diamond',
        outline:
          'border border-border bg-transparent text-foreground hover:border-diamond/40 hover:text-diamond',
        secondary:
          'bg-surface-container-high text-foreground border border-outline-variant hover:bg-surface-container-highest',
        ghost:
          'text-muted-foreground hover:text-foreground hover:bg-surface-container',
        link: 'text-diamond underline-offset-4 hover:underline',
        emerald:
          'bg-emerald text-obsidian font-bold hover:shadow-lg hover:glow-emerald',
      },
      size: {
        default: 'h-10 px-5 py-2',
        sm: 'h-8 rounded-lg px-3 text-xs',
        lg: 'h-12 rounded-xl px-8 text-base',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    const buttonType = asChild ? undefined : (type ?? 'button');
    return (
      <Comp
        type={buttonType}
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
