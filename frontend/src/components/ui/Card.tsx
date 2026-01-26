import type { ReactNode } from 'react';

interface CardProps {
    children: ReactNode;
    className?: string;
    header?: ReactNode;
    footer?: ReactNode;
}

export function Card({ children, className = '', header, footer }: CardProps) {
    return (
        <div className={`bg-card text-card-foreground border border-border rounded-lg overflow-hidden shadow-sm ${className}`}>
            {header && (
                <div className="px-6 py-4 border-b border-border">
                    {header}
                </div>
            )}
            <div className="p-6">
                {children}
            </div>
            {footer && (
                <div className="px-6 py-4 border-t border-border bg-muted/50">
                    {footer}
                </div>
            )}
        </div>
    );
}
