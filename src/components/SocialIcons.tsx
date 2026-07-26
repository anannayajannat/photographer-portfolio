type IconProps = { className?: string };

// Updated to use official brand colors instead of the monochrome currentColor.
// Instagram: #E1306C, Facebook: #1877F2, YouTube: #FF0000, Pinterest: #E60023, X/Twitter: #1DA1F2

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="1.5" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="#E1306C" stroke="none" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1877F2" strokeWidth="1.5" className={className}>
      <path d="M15 3h-2a5 5 0 0 0-5 5v2H6v4h2v7h4v-7h3l1-4h-4V8a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FF0000" strokeWidth="1.5" className={className}>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="M10.5 9.5v5l4.5-2.5-4.5-2.5z" fill="#FF0000" stroke="none" />
    </svg>
  );
}

export function PinterestIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#E60023" strokeWidth="1.5" className={className}>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M9.5 18c1-3.5 1.5-6 1.5-6M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0-2 4" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#1DA1F2" strokeWidth="1.5" className={className}>
      <path d="M4 4l16 16M20 4L4 20" />
    </svg>
  );
}