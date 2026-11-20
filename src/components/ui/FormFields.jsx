"use client";

export function Input({
  label,
  error,
  helperText,
  id,
  type = "text",
  className = "",
  containerClassName = "",
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#16222b]"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        className={`w-full px-3.5 py-2 text-sm text-[#16222b] bg-white border rounded-lg transition-colors placeholder:text-[#5a6b78]/60 focus:outline-none focus:border-[#0e6b7a] focus:ring-2 focus:ring-[#0e6b7a]/20 disabled:bg-slate-100 disabled:cursor-not-allowed ${
          error ? "border-[#d64545]" : "border-[#c7d2da]"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#9c2222] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#5a6b78]">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Select({
  label,
  error,
  helperText,
  id,
  children,
  className = "",
  containerClassName = "",
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#16222b]"
        >
          {label}
        </label>
      )}
      <select
        id={inputId}
        className={`w-full px-3.5 py-2 text-sm text-[#16222b] bg-white border rounded-lg transition-colors focus:outline-none focus:border-[#0e6b7a] focus:ring-2 focus:ring-[#0e6b7a]/20 disabled:bg-slate-100 disabled:cursor-not-allowed ${
          error ? "border-[#d64545]" : "border-[#c7d2da]"
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      {error ? (
        <p className="text-xs text-[#9c2222] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#5a6b78]">{helperText}</p>
      ) : null}
    </div>
  );
}

export function Textarea({
  label,
  error,
  helperText,
  id,
  rows = 3,
  className = "",
  containerClassName = "",
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-bold text-[#16222b]"
        >
          {label}
        </label>
      )}
      <textarea
        id={inputId}
        rows={rows}
        className={`w-full px-3.5 py-2 text-sm text-[#16222b] bg-white border rounded-lg transition-colors placeholder:text-[#5a6b78]/60 focus:outline-none focus:border-[#0e6b7a] focus:ring-2 focus:ring-[#0e6b7a]/20 disabled:bg-slate-100 disabled:cursor-not-allowed ${
          error ? "border-[#d64545]" : "border-[#c7d2da]"
        } ${className}`}
        {...props}
      />
      {error ? (
        <p className="text-xs text-[#9c2222] font-medium">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-[#5a6b78]">{helperText}</p>
      ) : null}
    </div>
  );
}

