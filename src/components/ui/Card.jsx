"use client";

export default function Card({
  children,
  title,
  subtitle,
  action,
  className = "",
  bodyClassName = "",
}) {
  return (
    <div
      className={`bg-white border border-[#d9e1e7] rounded-xl shadow-xs overflow-hidden ${className}`}
    >
      {(title || subtitle || action) && (
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#d9e1e7]">
          <div>
            {title && (
              <h3 className="text-base font-bold text-[#0a4a56] leading-tight">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-xs text-[#5a6b78] mt-0.5">{subtitle}</p>
            )}
          </div>
          {action && <div className="ml-4 shrink-0">{action}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}

