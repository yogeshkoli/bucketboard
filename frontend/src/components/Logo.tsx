'use client';

import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center justify-center h-8 w-8 flex-shrink-0">
      {/* Light mode logo (visible by default, hidden in dark mode) */}
      <Image
        src="/images/logo.png"
        alt="BucketBoard Logo"
        width={42}
        height={42}
        className="dark:hidden"
      />
      {/* Dark mode logo (hidden by default, visible in dark mode) */}
      <Image
        src="/images/logo.png"
        alt="BucketBoard Logo"
        width={42}
        height={42}
        className="hidden dark:block"
      />
    </div>
  );
}