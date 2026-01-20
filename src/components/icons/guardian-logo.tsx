'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface GuardianLogoProps extends React.SVGProps<SVGSVGElement> {
  shieldClassName?: string;
  pinClassName?: string;
  pinDotClassName?: string;
}

export const GuardianLogo = ({
  className,
  shieldClassName,
  pinClassName,
  pinDotClassName,
  ...props
}: GuardianLogoProps) => {
  return (
    <svg
      viewBox="0 0 100 110"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('w-24 h-auto', className)}
      {...props}
    >
      <title>Guardian Logo</title>
      <path
        d="M50 0 L95 10 V 55 C 95 80 75 100 50 110 C 25 100 5 80 5 55 V 10 Z"
        className={cn('fill-current', shieldClassName)}
      />
      <path
        d="M50 20 C 65 20, 75 30, 75 45 C 75 65, 50 85, 50 85 C 50 85, 25 65, 25 45 C 25 30, 35 20, 50 20 Z"
        className={cn('fill-current', pinClassName)}
      />
      <circle
        cx="50"
        cy="45"
        r="10"
        className={cn('fill-current', pinDotClassName)}
      />
    </svg>
  );
};
