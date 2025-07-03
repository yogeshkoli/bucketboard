'use client';

import Image from 'next/image';

export function Logo() {
  return (
    <div className="flex items-center justify-center h-12 w-12 flex-shrink-0">
      {/* Light mode logo (visible by default, hidden in dark mode) */}
      <Image
        src="/images/bucketboard-logo-dark.png"
        alt="BucketBoard Logo"
        width={48}
        height={48}
        className="dark:hidden"
      />
      {/* Dark mode logo (hidden by default, visible in dark mode) */}
      <Image
        src="/images/bucketboard-logo-light.png"
        alt="BucketBoard Logo"
        width={48}
        height={48}
        className="hidden dark:block"
      />
    </div>
  );
}