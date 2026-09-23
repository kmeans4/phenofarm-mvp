import React from 'react';
import { twMerge } from 'tailwind-merge';

interface CardProps {
  className?: string;
  children: React.ReactNode;
}

export function Card({ className, children }: CardProps) {
  return (
    <div className={`rounded-[15px] border border-pf-line bg-pf-surface text-pf-text shadow-sm ${className || ''}`}>
      {children}
    </div>
  );
}

interface CardHeaderProps {
  className?: string;
  children: React.ReactNode;
}

export function CardHeader({ className, children }: CardHeaderProps) {
  return (
    <div className={twMerge('flex flex-col space-y-1.5 [--pf-card-padding:1rem] sm:[--pf-card-padding:1.5rem] p-[var(--pf-card-padding)]', className)}>
      {children}
    </div>
  );
}

interface CardTitleProps {
  className?: string;
  children: React.ReactNode;
}

export function CardTitle({ className, children }: CardTitleProps) {
  return (
    <h3 className={`text-base font-semibold leading-none ${className || ''}`}>
      {children}
    </h3>
  );
}

interface CardContentProps {
  className?: string;
  children: React.ReactNode;
}

export function CardContent({ className, children }: CardContentProps) {
  return (
    <div className={twMerge('[--pf-card-padding:1rem] sm:[--pf-card-padding:1.5rem] p-[var(--pf-card-padding)] pt-0', className)}>
      {children}
    </div>
  );
}

interface CardFooterProps {
  className?: string;
  children: React.ReactNode;
}

export function CardFooter({ className, children }: CardFooterProps) {
  return (
    <div className={twMerge('flex items-center [--pf-card-padding:1rem] sm:[--pf-card-padding:1.5rem] p-[var(--pf-card-padding)] pt-0', className)}>
      {children}
    </div>
  );
}

const ui = {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
};

export default ui;
