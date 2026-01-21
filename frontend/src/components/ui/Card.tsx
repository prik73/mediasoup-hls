import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    header?: ReactNode;
    footer?: ReactNode;
}

export function Card({ children, className = '', header, footer }: CardProps) {
    return (
        <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-lg overflow-hidden ${className}`}>
            {header && (
                <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    {header}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
                    {footer}
                </div>
            )}
        </div>
    );
}
