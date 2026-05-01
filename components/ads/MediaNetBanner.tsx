'use client';

interface Props {
  slotId: string;
  className?: string;
}

export default function MediaNetBanner({ slotId, className = '' }: Props) {
  return (
    <div
      id={slotId}
      className={`overflow-hidden ${className}`}
      aria-label="Advertisement"
    />
  );
}
