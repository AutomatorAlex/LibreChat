import React from 'react';

interface CircleIconProps {
  state?: string;
  size?: string;
  className?: string;
}

const CircleIcon: React.FC<CircleIconProps> = ({ state, size = "24", className = "" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
};

export default CircleIcon;