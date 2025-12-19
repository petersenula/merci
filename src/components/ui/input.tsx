import * as React from 'react';
import { cn } from '@/lib/utils';

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  suffix?: React.ReactNode;
};

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, suffix, ...props }, ref) => {
    const input = (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-black shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
          suffix && 'pr-10', // 👉 место под суффикс
          className,
        )}
        ref={ref}
        {...props}
      />
    );

    if (!suffix) {
      return input;
    }

    return (
      <div className="relative w-full">
        {input}
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">
          {suffix}
        </span>
      </div>
    );
  },
);

Input.displayName = 'Input';