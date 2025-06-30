interface UserIconProps {
  className?: string;
}

export default function UserIcon({ className = 'w-5 h-5' }: UserIconProps) {
  return (
    <img src="/assets/logo.webp" className={`object-contain ${className}`} alt="LibreChat Logo" />
  );
}
