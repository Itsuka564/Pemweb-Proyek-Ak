"use client";

export default function Button({
  children,
  variant = "primary",
  size = "md",
  type = "button",
  disabled = false,
  loading = false,
  onClick,
  className = "",
  ...props
}) {
  const baseClasses =
    "inline-flex items-center justify-center font-bold rounded-lg transition-colors duration-150 focus-visible:outline-3 focus-visible:outline-[#f2a33a] focus-visible:outline-offset-2 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  const variantClasses = {
    primary: "bg-[#0e6b7a] hover:bg-[#0a4a56] text-white shadow-sm border border-transparent",
    accent: "bg-[#f2a33a] hover:bg-[#e29329] text-[#16222b] shadow-sm border border-transparent font-extrabold",
    outline: "bg-white hover:bg-[#d7edf0] text-[#0e6b7a] border border-[#0e6b7a]",
    ghost: "bg-transparent hover:bg-[#d7edf0] text-[#0e6b7a]",
    danger: "bg-white hover:bg-[#fadcdc] text-[#9c2222] border border-[#d64545]",
    "danger-solid": "bg-[#9c2222] hover:bg-[#7e1b1b] text-white border border-transparent",
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <svg
            className="animate-spin h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Memproses...</span>
        </span>
      ) : (
        children
      )}
    </button>
  );
}

