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
                        ${error ? 'border-red-500' : 'border-gray-300 dark:border-zinc-700'}
                        bg-white dark:bg-zinc-900
                        text-zinc-900 dark:text-white
                        placeholder-gray-400 dark:placeholder-zinc-500
                        focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500
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
