type PayPalIconProps = {
  className?: string;
};

export function PayPalIcon({ className = "h-4 w-4" }: PayPalIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        fill="#253B80"
        d="M7.3 3.5h6.2c2.8 0 4.8 1.6 4.2 4.7-.5 2.7-2.5 4.1-5.1 4.1h-2l-.8 4.4H6.7L7.3 3.5z"
      />
      <path
        fill="#179BD7"
        d="M9.7 6.1h4.4c2 0 3 .9 2.7 2.5-.3 1.8-1.8 2.7-3.8 2.7h-1.9l-.6 3.5H7.9l1.8-8.7z"
      />
      <path
        fill="#222D65"
        d="M10.7 11.3h2.3c2.4 0 4.3-1.1 4.7-3.6.1-.4.1-.8 0-1.1.7.6 1 1.5.8 2.8-.5 2.8-2.6 4.2-5.2 4.2h-1.7l-.5 2.8H8.9l.5-2.8h1.3z"
      />
    </svg>
  );
}

