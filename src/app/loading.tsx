export default function Loading() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-2xl space-y-4">
        <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded-lg animate-pulse w-1/3" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/2" />
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-2/5" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
          <div className="h-28 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
        </div>
        <div className="h-48 bg-slate-200 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}
