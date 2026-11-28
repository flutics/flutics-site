export function Logo({ size = 34, title = 'Flutics' }: { size?: number; title?: string }) {
  const h = Math.round((size * 112) / 128);
  const uid = `f${size}`;
  return (
    <svg width={size} height={h} viewBox="0 0 128 112" fill="none" aria-hidden={title ? undefined : true} role="img">
      {title ? <title>{title}</title> : null}
      <defs>
        <linearGradient id={`${uid}t`} x1="8" y1="4" x2="120" y2="72" gradientUnits="userSpaceOnUse">
          <stop stopColor="#3AD68A" />
          <stop offset=".42" stopColor="#22C5A6" />
          <stop offset="1" stopColor="#0E7C66" />
        </linearGradient>
        <linearGradient id={`${uid}b`} x1="4" y1="48" x2="118" y2="112" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0E7C66" />
          <stop offset=".55" stopColor="#0B5148" />
          <stop offset="1" stopColor="#082C23" />
        </linearGradient>
      </defs>
      <path fill={`url(#${uid}t)`} d="M10 62C16 26 46 7 78 8c16.5.5 28.5-2.5 40-8-2.2 22-16.5 38.5-43 44.5-21.5 5-41 8-65 17.5Z" />
      <path fill={`url(#${uid}b)`} d="M8 104c5-26 24-44.5 50-51 22.5-5.5 41.5-3 60-13.5-4.5 24-20 41-46 47.5-23.5 6-46 10-64 17Z" />
    </svg>
  );
}

export function Brand({ size = 34 }: { size?: number }) {
  return (
    <span className="brand">
      <Logo size={size} />
      flutics
    </span>
  );
}
