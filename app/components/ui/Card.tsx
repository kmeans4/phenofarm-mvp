import * as React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
}

function Card({ children, className = '' }: CardProps) {
  return (
    <div className={cn(`bg-white rounded-lg shadow-sm border border-gray-200`, className)}>
      {children}
    </div>
  );
}

function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(`px-6 py-4 border-b border-gray-200`, className)}>{children}</div>;
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-gray-900">{children}</h3>;
}

function CardContent({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(`p-6`, className)}>{children}</div>;
}

function CardFooter({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(`px-6 py-4 border-t border-gray-200 bg-gray-50`, className)}>{children}</div>;
}

export { Card, CardHeader, CardTitle, CardContent, CardFooter };
