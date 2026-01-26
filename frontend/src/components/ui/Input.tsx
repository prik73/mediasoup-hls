import type { InputHTMLAttributes } from 'react';
import { forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    className={`
                        w-full px-4 py-2.5 rounded-md border
                        ${error ? 'border-destructive' : 'border-input focus:border-ring'}
                        bg-background text-foreground
                        placeholder:text-muted-foreground
                        focus:outline-none focus:ring-1 focus:ring-ring
                        transition-colors duration-200
                        ${className}
                    `}
                    {...props}
                />
                {error && (
                    <p className="mt-1 text-sm text-red-500">{error}</p>
                )}
            </div>
        );
    }
);

Input.displayName = 'Input';
