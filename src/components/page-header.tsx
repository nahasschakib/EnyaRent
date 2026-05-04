import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  breadcrumb?: string[];
  actions?: ReactNode;
  className?: string;
}

export function PageHeader({ title, breadcrumb, actions, className }: PageHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-10",
        className
      )}
      style={{ minHeight: "64px" }}
    >
      <div>
        {breadcrumb && breadcrumb.length > 0 && (
          <div className="flex items-center gap-1 mb-0.5">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1">
                {i > 0 && <span className="text-slate-300 dark:text-slate-600 text-xs">/</span>}
                <span className="text-xs text-slate-500 dark:text-slate-400">{crumb}</span>
              </span>
            ))}
          </div>
        )}
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h1>
      </div>
      {actions && (
        <div className="flex items-center gap-3">{actions}</div>
      )}
    </div>
  );
}
