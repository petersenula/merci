import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'green' | 'orange';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', ...props }, ref) => {
    const base =
      'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none px-4 py-2';

    const variants = {
      default: 'bg-blue-600 text-white hover:bg-blue-700',
      outline: 'border border-gray-300 text-gray-700 hover:bg-gray-100',

      // Зеленые кнопки (Login / Register)
      green: 'bg-[#1FB94A] text-white hover:bg-[#16963B]',

      // Оранжевая кнопка (Logout)
      orange: 'bg-[#FF6A00] text-white hover:bg-[#E65F00]',
    };

    return (
      <button
        ref={ref}
        className={cn(
          base,
          variants[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';
export default Button;
